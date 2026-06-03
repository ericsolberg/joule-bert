import type { DataSiloState } from './types';
import type { BoardModel } from '../../engine/boardModel';
import { TileState } from '../../engine/boardModel';
import { EnemyType } from './types';
import { TIMING } from '../../engine/timing';

export function createDataSilo(id: string): DataSiloState {
  const dir = Math.random() < 0.5 ? 'DR' : 'DL';
  return {
    id,
    type: EnemyType.DataSilo,
    row: 0,
    col: 0,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    lastTickTime: 0,
    alive: true,
    respawnAt: null,
    direction: dir as 'DR' | 'DL',
  };
}

export function tickDataSilo(
  enemy: DataSiloState,
  board: BoardModel,
  now: number,
  speedMultiplier: number
): DataSiloState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.ENEMY_BASE_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  const delta = enemy.direction === 'DR'
    ? { dRow: +1, dCol: +1 }
    : { dRow: +1, dCol: 0 };

  const newRow = enemy.row + delta.dRow;
  const newCol = enemy.col + delta.dCol;

  if (board.isOffBoard(newRow, newCol)) {
    return {
      ...enemy,
      alive: false,
      respawnAt: now + TIMING.DATA_SILO_RESPAWN_MS,
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

export function onLandDataSilo(
  enemy: DataSiloState,
  board: BoardModel,
  now: number
): void {
  const tile = board.getTile(enemy.row, enemy.col);
  if (!tile) return;
  if (tile.state === TileState.Activated) {
    tile.state = TileState.Activating;
    tile.pulseAt = now;
  } else if (tile.state === TileState.Activating) {
    tile.state = TileState.Unvisited;
    tile.pulseAt = now;
  }
}

export function respawnDataSilo(enemy: DataSiloState, now: number): DataSiloState {
  const dir = Math.random() < 0.5 ? 'DR' : 'DL';
  return {
    ...enemy,
    row: 0,
    col: 0,
    direction: dir as 'DR' | 'DL',
    alive: true,
    respawnAt: null,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    lastTickTime: now,
  };
}
