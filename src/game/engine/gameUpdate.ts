import type { GameState } from './gameState';
import type { EnemyState } from '../entities/enemies/types';
import type { BonusItem } from '../entities/bonusItem';
import type { Direction } from '../entities/player';
import type { HallucinatorState, DataSiloState, ComplianceTrollState, ContextGremlinState, LegacyGoblinState } from '../entities/enemies/types';
import { GamePhase, createInitialGameState } from './gameState';
import { TileState } from './boardModel';
import { DIRECTION_DELTA } from '../entities/player';
import { EnemyType } from '../entities/enemies/types';
import { BonusItemType, createBonusItem } from '../entities/bonusItem';
import { TIMING } from './timing';
import { scoreTileActivation, scoreCollectBonus, scoreLevelClear, scorePerfectLevel } from './scoring';

import { createHallucinator, tickHallucinator, onLandHallucinator } from '../entities/enemies/hallucinator';
import { createDataSilo, tickDataSilo, onLandDataSilo } from '../entities/enemies/dataSilo';
import { createComplianceTroll, tickComplianceTroll, onLandComplianceTroll } from '../entities/enemies/complianceTroll';
import { createLegacyGoblin, tickLegacyGoblin } from '../entities/enemies/legacyGoblin';
import { createContextGremlin, tickContextGremlin } from '../entities/enemies/contextGremlin';

// ── Global enemy cycle pool (all types, used for cycling across spawns) ──────

const GLOBAL_ENEMY_POOL: EnemyType[] = [
  EnemyType.Hallucinator,
  EnemyType.DataSilo,
  EnemyType.ComplianceTroll,
  EnemyType.LegacyGoblin,
  EnemyType.ContextGremlin,
];

// ── Enemy creation helpers ───────────────────────────────────────────────────

function createEnemyOfType(type: EnemyType, id: string, boardRows: number): EnemyState {
  switch (type) {
    case EnemyType.Hallucinator: return createHallucinator(id);
    case EnemyType.DataSilo: return createDataSilo(id);
    case EnemyType.ComplianceTroll: return createComplianceTroll(id);
    case EnemyType.LegacyGoblin: return createLegacyGoblin(id, boardRows);
    case EnemyType.ContextGremlin: return createContextGremlin(id);
  }
}

function buildEnemyQueue(
  level: number,
  boardRows: number,
  poolIndex: number
): { firstEnemy: EnemyState; queue: EnemyType[]; nextPoolIndex: number } {
  const pool = GLOBAL_ENEMY_POOL;
  const maxEnemies = level === 1 ? 1 : 2;

  const firstType = pool[poolIndex % pool.length];
  const firstEnemy = createEnemyOfType(firstType, `${firstType}-${level}-0`, boardRows);

  let nextPoolIndex = (poolIndex + 1) % pool.length;
  const queue: EnemyType[] = maxEnemies > 1 ? [pool[nextPoolIndex]] : [];
  if (queue.length > 0) nextPoolIndex = (nextPoolIndex + 1) % pool.length;

  return { firstEnemy, queue, nextPoolIndex };
}

// ── Main update entry point ──────────────────────────────────────────────────

export function updateGame(state: GameState, deltaMs: number, now: number, inputDir: Direction | null): GameState {
  const delta = Math.min(deltaMs, 100);

  switch (state.phase) {
    case GamePhase.LevelIntro:
      return updateLevelIntro(state, delta, now);
    case GamePhase.Playing:
      return updatePlaying(state, delta, now, inputDir);
    case GamePhase.PlayerDead:
      return updatePlayerDead(state, delta, now);
    case GamePhase.LevelClear:
      return updateLevelClear(state, delta);
    default:
      return state;
  }
}

// ── Level intro ──────────────────────────────────────────────────────────────

function updateLevelIntro(state: GameState, delta: number, now: number): GameState {
  const totalIntroMs = state.board.rows * TIMING.LEVEL_INTRO_ROW_STAGGER_MS + 300 + TIMING.LEVEL_TITLE_DISPLAY_MS;
  const newProgress = Math.min(1, state.introProgress + delta / totalIntroMs);

  if (newProgress >= 1) {
    return {
      ...state,
      phase: GamePhase.Playing,
      introProgress: 1,
      levelStartTime: now,
      enemies: [],
      enemyMovementEnabled: false,
    };
  }

  return { ...state, introProgress: newProgress };
}

// ── Playing ──────────────────────────────────────────────────────────────────

function updatePlaying(state: GameState, delta: number, now: number, inputDir: Direction | null): GameState {
  let s = { ...state };

  s = processInput(s, inputDir, now);
  s = advancePlayerHop(s, delta, now);
  s = advanceEscapeNodeAnims(s, delta, now);

  if (s.player.isEscaping) {
    const node = s.escapeNodes[s.player.escapingNodeIdx];
    if (!node.animating) {
      s = {
        ...s,
        player: {
          ...s.player,
          row: 0,
          col: 0,
          isEscaping: false,
          animState: 'idle',
        },
      };
    }
  }

  if (!s.enemyMovementEnabled) {
    const delay = s.level === 1 ? TIMING.ENEMY_DELAY_LEVEL1_MS : TIMING.ENEMY_DELAY_MS;
    if (now - s.levelStartTime >= delay) {
      const { firstEnemy, queue, nextPoolIndex } = buildEnemyQueue(s.level, s.board.rows, s.enemyPoolIndex);
      s = {
        ...s,
        enemyMovementEnabled: true,
        enemies: [firstEnemy],
        enemyQueue: queue,
        nextEnemyAt: queue.length > 0 ? now + TIMING.ENEMY_STAGGER_MS : null,
        enemyPoolIndex: nextPoolIndex,
      };
    }
  }

  s = maybeSpawnNextEnemy(s, now);

  if (s.enemyMovementEnabled) {
    const frozen = s.allEnemiesFrozenUntil !== null && now <= s.allEnemiesFrozenUntil;
    if (!frozen) {
      if (s.allEnemiesFrozenUntil !== null && now > s.allEnemiesFrozenUntil) {
        s = { ...s, allEnemiesFrozenUntil: null };
      }
      s = tickAllEnemies(s, now);
    }
  }

  s = advanceEnemyHops(s, delta, now);
  s = advanceEnemyFalls(s, delta);
  s = updateTileEffects(s, now);

  if (s.tileResetInterval !== null && now - s.lastTileReset > s.tileResetInterval) {
    s = resetSomeTiles(s, now);
    s = { ...s, lastTileReset: now };
  }

  s = updateBonusItems(s, now);
  s = checkCollisions(s, now);
  s = updateEscapeNodeRespawn(s, now);

  if (s.phase === GamePhase.Playing && s.board.allActivated()) {
    s = startLevelClear(s, now);
  }

  return s;
}

// ── Input & player hop ───────────────────────────────────────────────────────

function processInput(state: GameState, inputDir: Direction | null, now: number): GameState {
  if (!inputDir) return state;

  const player = state.player;

  if (player.isHopping) {
    return { ...state, player: { ...player, queuedDirection: inputDir } };
  }

  if (player.animState === 'dead' || player.animState === 'victory') return state;

  return startHop(state, inputDir, now);
}

function startHop(state: GameState, dir: Direction, now: number): GameState {
  const player = state.player;
  const delta = DIRECTION_DELTA[dir];
  const newRow = player.row + delta.dRow;
  const newCol = player.col + delta.dCol;

  const leftNode = state.escapeNodes[0];
  const rightNode = state.escapeNodes[1];

  if (leftNode.active && !leftNode.animating) {
    if (newRow === leftNode.anchorRow && newCol === -1) {
      return activateEscapeNode(state, 0, now);
    }
  }
  if (rightNode.active && !rightNode.animating) {
    if (newRow === rightNode.anchorRow && newCol === rightNode.anchorRow + 1) {
      return activateEscapeNode(state, 1, now);
    }
  }

  const offBoard = state.board.isOffBoard(newRow, newCol);

  return {
    ...state,
    player: {
      ...player,
      isHopping: true,
      hopProgress: 0,
      hopFrom: { row: player.row, col: player.col },
      hopTo: { row: newRow, col: newCol },
      hopOffBoard: offBoard,
      row: newRow,
      col: newCol,
      animState: 'hopping',
      queuedDirection: null,
    },
  };
}

function activateEscapeNode(state: GameState, nodeIdx: number, now: number): GameState {
  const nodes: typeof state.escapeNodes = [{ ...state.escapeNodes[0] }, { ...state.escapeNodes[1] }];
  nodes[nodeIdx] = {
    ...nodes[nodeIdx],
    active: false,
    animating: true,
    animProgress: 0,
    respawnAt: now + TIMING.ESCAPE_NODE_RESPAWN_MS,
  };

  return {
    ...state,
    escapeNodes: nodes,
    player: {
      ...state.player,
      isHopping: false,
      hopProgress: 0,
      animState: 'idle',
      queuedDirection: null,
      isEscaping: true,
      escapingNodeIdx: nodeIdx,
    },
  };
}

function advancePlayerHop(state: GameState, delta: number, now: number): GameState {
  const player = state.player;
  if (!player.isHopping) return state;

  const newProgress = player.hopProgress + delta / TIMING.PLAYER_HOP_MS;

  if (newProgress >= 1) {
    if (player.hopOffBoard) {
      return triggerDeath(state, now);
    }

    let s: GameState = {
      ...state,
      player: {
        ...player,
        isHopping: false,
        hopProgress: 1,
        hopOffBoard: false,
        animState: 'idle',
      },
    };

    s = activateTileOnLanding(s, now);

    if (player.queuedDirection) {
      s = startHop(s, player.queuedDirection, now);
    }

    return s;
  }

  return {
    ...state,
    player: { ...player, hopProgress: newProgress },
  };
}

function activateTileOnLanding(state: GameState, now: number): GameState {
  const { player, board, hopsNeeded } = state;
  const tile = board.getTile(player.row, player.col);
  if (!tile || tile.state === TileState.Frozen) return state;

  const prevState = tile.state;
  let newTileState = prevState;

  if (prevState === TileState.Unvisited || prevState === TileState.Corrupted) {
    newTileState = hopsNeeded === 1 ? TileState.Activated : TileState.Activating;
  } else if (prevState === TileState.Activating) {
    newTileState = TileState.Activated;
  } else {
    return state;
  }

  const points = scoreTileActivation(prevState, newTileState, hopsNeeded);
  tile.state = newTileState;
  tile.pulseAt = now;

  return {
    ...state,
    score: state.score + points,
  };
}

function maybeSpawnNextEnemy(state: GameState, now: number): GameState {
  if (state.enemyQueue.length === 0 || state.nextEnemyAt === null) return state;
  if (now < state.nextEnemyAt) return state;

  // Drop permanently dead enemies (no respawn, not falling) to make room
  const liveEnemies = state.enemies.filter(e => e.alive || e.isFalling || e.respawnAt !== null);
  const maxEnemies = state.level === 1 ? 1 : 2;
  if (liveEnemies.length >= maxEnemies) {
    return { ...state, enemies: liveEnemies, nextEnemyAt: now + 3000 };
  }

  const [type, ...rest] = state.enemyQueue;
  const id = `${type}-${state.level}-q-${now}`;
  const newEnemy = createEnemyOfType(type, id, state.board.rows);

  return {
    ...state,
    enemies: [...liveEnemies, newEnemy],
    enemyQueue: rest,
    nextEnemyAt: rest.length > 0 ? now + TIMING.ENEMY_STAGGER_MS : null,
  };
}

// ── Enemy ticking ────────────────────────────────────────────────────────────

function tickAllEnemies(state: GameState, now: number): GameState {
  let enemies = state.enemies;
  const board = state.board;
  const pool = GLOBAL_ENEMY_POOL;
  let enemyPoolIndex = state.enemyPoolIndex;

  // Respawn dead enemies using next type from pool
  enemies = enemies.map(e => {
    if (!e.alive && !e.isFalling && e.respawnAt !== null && now >= e.respawnAt) {
      const type = pool[enemyPoolIndex % pool.length];
      enemyPoolIndex = (enemyPoolIndex + 1) % pool.length;
      return createEnemyOfType(type, `${type}-${state.level}-r-${now}`, board.rows);
    }
    return e;
  });

  const newEnemies: EnemyState[] = [];
  for (const e of enemies) {
    if (!e.alive) { newEnemies.push(e); continue; }

    let updated: EnemyState;
    switch (e.type) {
      case EnemyType.Hallucinator:
        updated = tickHallucinator(e as HallucinatorState, board, now, state.speedMultiplier);
        break;
      case EnemyType.DataSilo:
        updated = tickDataSilo(e as DataSiloState, board, now, state.speedMultiplier);
        break;
      case EnemyType.ComplianceTroll:
        updated = tickComplianceTroll(e as ComplianceTrollState, board, state.player, now, state.speedMultiplier);
        break;
      case EnemyType.LegacyGoblin:
        updated = tickLegacyGoblin(e as LegacyGoblinState, now, state.speedMultiplier);
        break;
      case EnemyType.ContextGremlin:
        updated = tickContextGremlin(e as ContextGremlinState, board, state.player, now, state.speedMultiplier);
        break;
      default:
        updated = e;
    }

    // Increment introHops counter when a new hop starts
    if (updated.isHopping && !e.isHopping) {
      updated = { ...updated, introHops: Math.min(updated.introHops + 1, 3) };
    }

    // 5% chance to jump off an edge when starting a new hop
    if (updated.isHopping && !e.isHopping && !updated.hopLeadsFall) {
      const offBoardDirs = Object.values(DIRECTION_DELTA).filter(d =>
        board.isOffBoard(e.row + d.dRow, e.col + d.dCol)
      );
      if (offBoardDirs.length > 0 && Math.random() < 0.05) {
        const d = offBoardDirs[Math.floor(Math.random() * offBoardDirs.length)];
        updated = {
          ...updated,
          hopTo: { row: e.row + d.dRow, col: e.col + d.dCol },
          hopLeadsFall: true,
        };
      }
    }

    // Apply tile effects when enemy just started a new hop (landed at destination)
    if (updated.isHopping && !e.isHopping) {
      switch (updated.type) {
        case EnemyType.Hallucinator:
          onLandHallucinator(updated as HallucinatorState, board, now);
          break;
        case EnemyType.DataSilo:
          onLandDataSilo(updated as DataSiloState, board, now);
          break;
        case EnemyType.ComplianceTroll:
          onLandComplianceTroll(updated as ComplianceTrollState, board, now);
          break;
      }
    }

    newEnemies.push(updated);
  }

  return { ...state, enemies: newEnemies, board, enemyPoolIndex };
}

function advanceEnemyHops(state: GameState, delta: number, now: number): GameState {
  const enemies = state.enemies.map(e => {
    if (!e.isHopping) return e;
    const newProgress = e.hopProgress + delta / TIMING.PLAYER_HOP_MS;
    if (newProgress >= 1) {
      if (e.hopLeadsFall) {
        return {
          ...e,
          isHopping: false,
          hopProgress: 1,
          hopLeadsFall: false,
          alive: false,
          isFalling: true,
          fallProgress: 0,
          fallSeed: now,
          respawnAt: now + TIMING.DEATH_ANIM_MS + Math.random() * 5000,
        };
      }
      return { ...e, isHopping: false, hopProgress: 1 };
    }
    return { ...e, hopProgress: newProgress };
  });
  return { ...state, enemies };
}

function advanceEnemyFalls(state: GameState, delta: number): GameState {
  const enemies = state.enemies.map(e => {
    if (!e.isFalling) return e;
    const newProgress = e.fallProgress + delta / TIMING.DEATH_ANIM_MS;
    if (newProgress >= 1) {
      return { ...e, isFalling: false, fallProgress: 1 };
    }
    return { ...e, fallProgress: newProgress };
  });
  return { ...state, enemies };
}

// ── Tile effects ─────────────────────────────────────────────────────────────

function updateTileEffects(state: GameState, now: number): GameState {
  const board = state.board;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c <= r; c++) {
      const tile = board.tiles[r][c];
      if (tile.state === TileState.Frozen && tile.frozenUntil !== null && now >= tile.frozenUntil) {
        tile.state = tile.frozenPrevState ?? TileState.Unvisited;
        tile.frozenUntil = null;
        tile.frozenPrevState = null;
        tile.pulseAt = now;
      }
    }
  }
  return state;
}

function resetSomeTiles(state: GameState, now: number): GameState {
  const board = state.board;
  const activatedPositions: { row: number; col: number }[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c <= r; c++) {
      if (board.tiles[r][c].state === TileState.Activated) {
        activatedPositions.push({ row: r, col: c });
      }
    }
  }
  const count = Math.max(1, Math.floor(activatedPositions.length / 3));
  for (let i = activatedPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activatedPositions[i], activatedPositions[j]] = [activatedPositions[j], activatedPositions[i]];
  }
  for (let i = 0; i < count; i++) {
    const t = board.getTile(activatedPositions[i].row, activatedPositions[i].col);
    if (t) { t.state = TileState.Unvisited; t.pulseAt = now; }
  }
  return state;
}

// ── Bonus items ──────────────────────────────────────────────────────────────

function updateBonusItems(state: GameState, now: number): GameState {
  let items = state.bonusItems.filter(item => now < item.expiresAt);

  if (items.length === 0 && now - state.lastBonusSpawn >= TIMING.BONUS_ITEM_COOLDOWN_MS && state.lastBonusSpawn > 0) {
    const candidates: { row: number; col: number }[] = [];
    for (let r = 1; r < state.board.rows; r++) {
      for (let c = 0; c <= r; c++) {
        if (r !== state.player.row || c !== state.player.col) {
          candidates.push({ row: r, col: c });
        }
      }
    }
    if (candidates.length > 0) {
      const pos = candidates[Math.floor(Math.random() * candidates.length)];
      items = [...items, createBonusItem(pos.row, pos.col, now)];
      return { ...state, bonusItems: items, lastBonusSpawn: now };
    }
  }

  // Start the bonus timer on first update
  if (state.lastBonusSpawn === 0) {
    return { ...state, bonusItems: items, lastBonusSpawn: now };
  }

  return { ...state, bonusItems: items };
}

// ── Collisions ───────────────────────────────────────────────────────────────

function checkCollisions(state: GameState, now: number): GameState {
  if (state.player.animState === 'dead') return state;

  let s = state;

  for (const e of s.enemies) {
    if (!e.alive) continue;
    if (e.row === s.player.row && e.col === s.player.col) {
      return triggerDeath(s, now);
    }
    if (s.player.isHopping && s.player.hopProgress >= 0.45 && s.player.hopProgress <= 0.55) {
      const midRow = s.player.hopFrom.row;
      const midCol = s.player.hopFrom.col;
      if (e.row === midRow && e.col === midCol) {
        return triggerDeath(s, now);
      }
    }
  }

  for (const item of s.bonusItems) {
    if (item.row === s.player.row && item.col === s.player.col) {
      s = collectBonusItem(s, item, now);
    }
  }

  return s;
}

function collectBonusItem(state: GameState, item: BonusItem, now: number): GameState {
  const points = scoreCollectBonus(item.type);
  let score = state.score + points;
  let allEnemiesFrozenUntil = state.allEnemiesFrozenUntil;
  const board = state.board;

  if (item.type === BonusItemType.APIToken) {
    allEnemiesFrozenUntil = now + TIMING.API_TOKEN_FREEZE_MS;
  } else if (item.type === BonusItemType.ModelUpdate) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c <= r; c++) {
        const tile = board.tiles[r][c];
        if (tile.state === TileState.Corrupted || tile.state === TileState.Activating) {
          tile.state = TileState.Activated;
          tile.pulseAt = now;
          score += 25;
        }
      }
    }
  }

  const bonusItems = state.bonusItems.filter(b => b.id !== item.id);
  return { ...state, score, allEnemiesFrozenUntil, board, bonusItems };
}

function triggerDeath(state: GameState, now: number): GameState {
  const newLives = state.player.lives - 1;
  return {
    ...state,
    phase: GamePhase.PlayerDead,
    perfectLevel: false,
    player: {
      ...state.player,
      lives: newLives,
      animState: 'dead',
      deathProgress: 0,
      deathSeed: now,
    },
  };
}

// ── Player dead phase ────────────────────────────────────────────────────────

function updatePlayerDead(state: GameState, delta: number, now: number): GameState {
  const newProgress = state.player.deathProgress + delta / TIMING.DEATH_ANIM_MS;

  if (newProgress >= 1) {
    if (state.player.lives <= 0) {
      return { ...state, phase: GamePhase.GameOver };
    }
    return {
      ...state,
      phase: GamePhase.Playing,
      player: {
        ...state.player,
        row: 0,
        col: 0,
        isHopping: false,
        hopProgress: 0,
        animState: 'idle',
        deathProgress: 0,
        queuedDirection: null,
      },
      enemies: state.enemies.map(e => ({
        ...e,
        alive: e.type !== EnemyType.LegacyGoblin ? false : e.alive,
        respawnAt: e.type !== EnemyType.LegacyGoblin ? now + TIMING.ENEMY_RESPAWN_MS : null,
      })),
      bonusItems: [],
      lastBonusSpawn: now,
    };
  }

  return {
    ...state,
    player: { ...state.player, deathProgress: newProgress },
  };
}

// ── Level clear ──────────────────────────────────────────────────────────────

function startLevelClear(state: GameState, _now: number): GameState {
  let score = state.score + scoreLevelClear(state.board.rows);
  if (state.perfectLevel) {
    score += scorePerfectLevel(state.level);
  }
  return {
    ...state,
    phase: GamePhase.LevelClear,
    score,
    clearProgress: 0,
    dissolveProgress: 0,
    player: { ...state.player, animState: 'victory', victoryProgress: 0 },
  };
}

function updateLevelClear(state: GameState, delta: number): GameState {
  const totalClearMs = TIMING.VICTORY_FLASH_MS + TIMING.SCORE_TALLY_MS + TIMING.BOARD_DISSOLVE_TOTAL_MS + TIMING.JOULE_ONLINE_DISPLAY_MS;
  const newClearProgress = Math.min(1, state.clearProgress + delta / totalClearMs);

  const victoryProgress = Math.min(1, state.player.victoryProgress + delta / TIMING.VICTORY_ANIM_MS);

  const dissolveStart = (TIMING.VICTORY_FLASH_MS + TIMING.SCORE_TALLY_MS) / totalClearMs;
  const dissolveEnd = dissolveStart + TIMING.BOARD_DISSOLVE_TOTAL_MS / totalClearMs;
  let dissolveProgress = 0;
  if (newClearProgress > dissolveStart) {
    dissolveProgress = Math.min(1, (newClearProgress - dissolveStart) / (dissolveEnd - dissolveStart));
  }

  if (newClearProgress >= 1) {
    return createInitialGameState(state.level + 1, Math.max(state.score, state.hiScore), state.score, state.enemyPoolIndex);
  }

  return {
    ...state,
    clearProgress: newClearProgress,
    dissolveProgress,
    player: { ...state.player, victoryProgress },
  };
}

// ── Escape node helpers ───────────────────────────────────────────────────────

function advanceEscapeNodeAnims(state: GameState, delta: number, _now: number): GameState {
  const nodes = state.escapeNodes.map(node => {
    if (!node.animating) return node;
    const newProgress = node.animProgress + delta / TIMING.ESCAPE_NODE_LIFT_MS;
    if (newProgress >= 1) {
      return { ...node, animating: false, animProgress: 1 };
    }
    return { ...node, animProgress: newProgress };
  }) as typeof state.escapeNodes;
  return { ...state, escapeNodes: nodes };
}

function updateEscapeNodeRespawn(state: GameState, now: number): GameState {
  const nodes = state.escapeNodes.map(node => {
    if (!node.active && !node.animating && node.respawnAt !== null && now >= node.respawnAt) {
      return { ...node, active: true, respawnAt: null, animProgress: 0 };
    }
    return node;
  }) as typeof state.escapeNodes;
  return { ...state, escapeNodes: nodes };
}
