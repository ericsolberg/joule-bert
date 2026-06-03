import type { ContextGremlinState } from './types';
import type { BoardModel } from '../../engine/boardModel';
import { TileState } from '../../engine/boardModel';
import type { PlayerState } from '../player';
import { EnemyType } from './types';
import { TIMING } from '../../engine/timing';

const DIRECTIONS = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 0 },
  { dRow: +1, dCol: 0 },
  { dRow: +1, dCol: +1 },
];

export function createContextGremlin(id: string): ContextGremlinState {
  return {
    id,
    type: EnemyType.ContextGremlin,
    row: 0,
    col: 0,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    lastTickTime: 0,
    alive: true,
    respawnAt: null,
    hopCount: 0,
  };
}

export function tickContextGremlin(
  enemy: ContextGremlinState,
  board: BoardModel,
  player: PlayerState,
  now: number,
  speedMultiplier: number
): ContextGremlinState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.ENEMY_BASE_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  if (enemy.hopCount < 3) {
    const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
    const newRow = enemy.row + dir.dRow;
    const newCol = enemy.col + dir.dCol;

    if (board.isOffBoard(newRow, newCol)) {
      return { ...enemy, alive: false, respawnAt: now + TIMING.ENEMY_RESPAWN_MS, lastTickTime: now };
    }

    return {
      ...enemy,
      isHopping: true,
      hopProgress: 0,
      hopFrom: { row: enemy.row, col: enemy.col },
      hopTo: { row: newRow, col: newCol },
      row: newRow,
      col: newCol,
      hopCount: enemy.hopCount + 1,
      lastTickTime: now,
    };
  } else {
    // Reset: teleport to random tile (not player's)
    const candidates: { row: number; col: number }[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c <= r; c++) {
        if (r !== player.row || c !== player.col) {
          candidates.push({ row: r, col: c });
        }
      }
    }
    const target = candidates[Math.floor(Math.random() * candidates.length)];

    // Reset 2-3 random activated tiles
    const activatedTiles: { row: number; col: number }[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c <= r; c++) {
        if (board.tiles[r][c].state === TileState.Activated) {
          activatedTiles.push({ row: r, col: c });
        }
      }
    }

    const resetCount = Math.min(activatedTiles.length, 2 + Math.floor(Math.random() * 2));
    for (let i = activatedTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [activatedTiles[i], activatedTiles[j]] = [activatedTiles[j], activatedTiles[i]];
    }
    for (let i = 0; i < resetCount; i++) {
      const t = board.getTile(activatedTiles[i].row, activatedTiles[i].col);
      if (t) {
        t.state = TileState.Unvisited;
        t.pulseAt = now;
      }
    }

    return {
      ...enemy,
      row: target.row,
      col: target.col,
      isHopping: false,
      hopProgress: 0,
      hopCount: 0,
      lastTickTime: now,
    };
  }
}

export function respawnContextGremlin(enemy: ContextGremlinState, now: number): ContextGremlinState {
  return {
    ...enemy,
    row: 0,
    col: 0,
    alive: true,
    respawnAt: null,
    isHopping: false,
    hopProgress: 0,
    hopCount: 0,
    lastTickTime: now,
  };
}
