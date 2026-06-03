import type { TileState } from './boardModel';
import type { BonusItemType } from '../entities/bonusItem';
import { BonusItemType as BIT } from '../entities/bonusItem';

export function scoreTileActivation(
  _prevState: TileState,
  newState: TileState,
  _hopsNeeded: number
): number {
  if (newState === 2 /* Activated */) return 25;
  if (newState === 1 /* Activating */) return 10;
  return 0;
}

export function scoreCollectBonus(type: BonusItemType): number {
  switch (type) {
    case BIT.InsightOrb: return 100;
    case BIT.APIToken: return 250;
    case BIT.ModelUpdate: return 300;
  }
}

export function scoreLureDependencyChain(): number {
  return 500;
}

export function scoreLevelClear(rows: number): number {
  return rows * 50;
}

export function scorePerfectLevel(level: number): number {
  return level * 200;
}
