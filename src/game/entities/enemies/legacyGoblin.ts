import type { LegacyGoblinState } from './types';
import { EnemyType } from './types';
import { TIMING } from '../../engine/timing';

export function createLegacyGoblin(id: string, boardRows: number): LegacyGoblinState {
  const startRow = Math.max(2, Math.floor(boardRows / 2));
  return {
    id,
    type: EnemyType.LegacyGoblin,
    row: startRow,
    col: 0,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: startRow, col: 0 },
    hopTo: { row: startRow, col: 0 },
    lastTickTime: 0,
    alive: true,
    respawnAt: null,
    patrolDir: 'DR',
  };
}

export function tickLegacyGoblin(
  enemy: LegacyGoblinState,
  now: number,
  speedMultiplier: number
): LegacyGoblinState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.ENEMY_BASE_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  let newDir = enemy.patrolDir;
  let newCol: number;

  if (enemy.patrolDir === 'DR') {
    newCol = enemy.col + 1;
    if (newCol > enemy.row) {
      newCol = enemy.col - 1;
      newDir = 'DL';
    }
  } else {
    newCol = enemy.col - 1;
    if (newCol < 0) {
      newCol = enemy.col + 1;
      newDir = 'DR';
    }
  }

  return {
    ...enemy,
    isHopping: true,
    hopProgress: 0,
    hopFrom: { row: enemy.row, col: enemy.col },
    hopTo: { row: enemy.row, col: newCol },
    col: newCol,
    patrolDir: newDir as 'DR' | 'DL',
    lastTickTime: now,
  };
}
