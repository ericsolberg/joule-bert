import type { HallucinatorState } from './types';
import { TileState } from '../../engine/boardModel';
import type { BoardModel } from '../../engine/boardModel';
import { EnemyType } from './types';
import { TIMING } from '../../engine/timing';

const DIRECTIONS = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 0 },
  { dRow: +1, dCol: 0 },
  { dRow: +1, dCol: +1 },
];

export function createHallucinator(id: string): HallucinatorState {
  return {
    id,
    type: EnemyType.Hallucinator,
    row: 0,
    col: 0,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    hopLeadsFall: false,
    lastTickTime: 0,
    alive: true,
    respawnAt: null,
    isFalling: false,
    fallProgress: 0,
    fallSeed: 0,
    introHops: 0,
  };
}

export function tickHallucinator(
  enemy: HallucinatorState,
  board: BoardModel,
  now: number,
  speedMultiplier: number
): HallucinatorState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.ENEMY_BASE_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
  const newRow = enemy.row + dir.dRow;
  const newCol = enemy.col + dir.dCol;

  if (board.isOffBoard(newRow, newCol)) {
    return {
      ...enemy,
      alive: false,
      respawnAt: now + TIMING.ENEMY_RESPAWN_MS,
      lastTickTime: now,
    };
  }

  return {
    ...enemy,
    isHopping: true,
    hopProgress: 0,
    hopFrom: { row: enemy.row, col: enemy.col },
    hopTo: { row: newRow, col: newCol },
    row: newRow,
    col: newCol,
    lastTickTime: now,
  };
}

export function onLandHallucinator(
  enemy: HallucinatorState,
  board: BoardModel,
  now: number
): void {
  const tile = board.getTile(enemy.row, enemy.col);
  if (tile && tile.state === TileState.Activated) {
    tile.state = TileState.Corrupted;
    tile.pulseAt = now;
  }
}

export function respawnHallucinator(enemy: HallucinatorState, now: number): HallucinatorState {
  return {
    ...enemy,
    row: 0,
    col: 0,
    alive: true,
    respawnAt: null,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    hopLeadsFall: false,
    isFalling: false,
    fallProgress: 0,
    introHops: 0,
    lastTickTime: now,
  };
}
