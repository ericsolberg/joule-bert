import type { ComplianceTrollState } from './types';
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

export function createComplianceTroll(id: string): ComplianceTrollState {
  return {
    id,
    type: EnemyType.ComplianceTroll,
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

export function tickComplianceTroll(
  enemy: ComplianceTrollState,
  board: BoardModel,
  player: PlayerState,
  now: number,
  speedMultiplier: number
): ComplianceTrollState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.COMPLIANCE_TROLL_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  const bestDirs = DIRECTIONS
    .map(d => ({
      ...d,
      newRow: enemy.row + d.dRow,
      newCol: enemy.col + d.dCol,
    }))
    .filter(d => !board.isOffBoard(d.newRow, d.newCol))
    .map(d => ({
      ...d,
      dist: Math.abs(d.newRow - player.row) + Math.abs(d.newCol - player.col),
    }))
    .sort((a, b) => a.dist - b.dist);

  if (bestDirs.length === 0) return { ...enemy, lastTickTime: now };

  let chosen: typeof bestDirs[0];
  if (Math.random() < 0.30) {
    chosen = bestDirs[Math.floor(Math.random() * bestDirs.length)];
  } else {
    const minDist = bestDirs[0].dist;
    const candidates = bestDirs.filter(d => d.dist === minDist);
    chosen = candidates[Math.floor(Math.random() * candidates.length)];
  }

  return {
    ...enemy,
    isHopping: true,
    hopProgress: 0,
    hopFrom: { row: enemy.row, col: enemy.col },
    hopTo: { row: chosen.newRow, col: chosen.newCol },
    row: chosen.newRow,
    col: chosen.newCol,
    lastTickTime: now,
  };
}

export function onLandComplianceTroll(
  enemy: ComplianceTrollState,
  board: BoardModel,
  now: number
): void {
  const tile = board.getTile(enemy.row, enemy.col);
  if (!tile) return;
  if (tile.state !== TileState.Frozen) {
    tile.frozenPrevState = tile.state;
    tile.state = TileState.Frozen;
    tile.frozenUntil = now + TIMING.FROZEN_DURATION_MS;
    tile.pulseAt = now;
  }
}

export function respawnComplianceTroll(enemy: ComplianceTrollState, now: number): ComplianceTrollState {
  return {
    ...enemy,
    row: 0,
    col: 0,
    alive: true,
    respawnAt: null,
    isHopping: false,
    hopProgress: 0,
    hopLeadsFall: false,
    isFalling: false,
    fallProgress: 0,
    introHops: 0,
    lastTickTime: now,
  };
}
