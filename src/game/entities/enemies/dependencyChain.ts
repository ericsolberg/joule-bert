import type { DependencyChainState } from './types';
import type { BoardModel } from '../../engine/boardModel';
import type { PlayerState } from '../player';
import { EnemyType } from './types';
import { TIMING } from '../../engine/timing';

const MAX_LINKS = 5;

const DIRECTIONS = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 0 },
  { dRow: +1, dCol: 0 },
  { dRow: +1, dCol: +1 },
];

export function createDependencyChain(id: string): DependencyChainState {
  return {
    id,
    type: EnemyType.DependencyChain,
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
    linksOnBoard: 1,
    lockedOn: false,
    segments: [{ row: 0, col: 0 }],
    coilDir: Math.random() < 0.5 ? 'DL' : 'DR',
    coilStep: 0,
  };
}

export function tickDependencyChain(
  enemy: DependencyChainState,
  board: BoardModel,
  player: PlayerState,
  now: number,
  speedMultiplier: number
): DependencyChainState {
  if (!enemy.alive) return enemy;
  const interval = TIMING.ENEMY_BASE_TICK_MS / speedMultiplier;
  if (now - enemy.lastTickTime < interval) return enemy;

  if (!enemy.lockedOn) {
    const delta = enemy.coilDir === 'DR' ? { dRow: +1, dCol: +1 } : { dRow: +1, dCol: 0 };
    const newRow = enemy.row + delta.dRow;
    const newCol = enemy.col + delta.dCol;

    if (board.isOffBoard(newRow, newCol)) {
      return { ...enemy, alive: false, respawnAt: null, lastTickTime: now };
    }

    const newSegments = [{ row: newRow, col: newCol }, ...enemy.segments];
    const newLinks = Math.min(enemy.linksOnBoard + 1, MAX_LINKS);
    if (newSegments.length > newLinks) newSegments.pop();

    const nextCoilDir: 'DL' | 'DR' = enemy.coilStep % 2 === 0
      ? (enemy.coilDir === 'DR' ? 'DL' : 'DR')
      : enemy.coilDir;

    return {
      ...enemy,
      isHopping: true,
      hopProgress: 0,
      hopFrom: { row: enemy.row, col: enemy.col },
      hopTo: { row: newRow, col: newCol },
      row: newRow,
      col: newCol,
      linksOnBoard: newLinks,
      lockedOn: newLinks >= MAX_LINKS,
      segments: newSegments,
      coilDir: nextCoilDir,
      coilStep: enemy.coilStep + 1,
      lastTickTime: now,
    };
  } else {
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

    const newSegments = [{ row: chosen.newRow, col: chosen.newCol }, ...enemy.segments];
    if (newSegments.length > MAX_LINKS) newSegments.pop();

    return {
      ...enemy,
      isHopping: true,
      hopProgress: 0,
      hopFrom: { row: enemy.row, col: enemy.col },
      hopTo: { row: chosen.newRow, col: chosen.newCol },
      row: chosen.newRow,
      col: chosen.newCol,
      segments: newSegments,
      lastTickTime: now,
    };
  }
}
