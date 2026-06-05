export type Direction = 'UL' | 'UR' | 'DL' | 'DR';

export const DIRECTION_DELTA: Record<Direction, { dRow: number; dCol: number }> = {
  UL: { dRow: -1, dCol: -1 },
  UR: { dRow: -1, dCol: 0 },
  DL: { dRow: +1, dCol: 0 },
  DR: { dRow: +1, dCol: +1 },
};

export interface PlayerState {
  row: number;
  col: number;
  lives: number;
  isHopping: boolean;
  hopProgress: number;
  hopFrom: { row: number; col: number };
  hopTo: { row: number; col: number };
  hopOffBoard: boolean;
  animState: 'idle' | 'hopping' | 'dead' | 'victory';
  deathProgress: number;
  victoryProgress: number;
  queuedDirection: Direction | null;
  deathSeed: number;
}

export function createPlayer(): PlayerState {
  return {
    row: 0,
    col: 0,
    lives: 3,
    isHopping: false,
    hopProgress: 0,
    hopFrom: { row: 0, col: 0 },
    hopTo: { row: 0, col: 0 },
    hopOffBoard: false,
    animState: 'idle',
    deathProgress: 0,
    victoryProgress: 0,
    queuedDirection: null,
    deathSeed: 0,
  };
}
