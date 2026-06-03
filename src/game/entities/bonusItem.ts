export const BonusItemType = {
  InsightOrb: 'insightOrb',
  APIToken: 'apiToken',
  ModelUpdate: 'modelUpdate',
} as const;
export type BonusItemType = typeof BonusItemType[keyof typeof BonusItemType];

export interface BonusItem {
  id: string;
  type: BonusItemType;
  row: number;
  col: number;
  spawnedAt: number;
  expiresAt: number;
}

export function createBonusItem(
  row: number,
  col: number,
  now: number
): BonusItem {
  const rand = Math.random();
  let type: BonusItemType;
  if (rand < 0.6) type = BonusItemType.InsightOrb;
  else if (rand < 0.85) type = BonusItemType.APIToken;
  else type = BonusItemType.ModelUpdate;

  return {
    id: `bonus-${now}-${Math.random().toString(36).slice(2)}`,
    type,
    row,
    col,
    spawnedAt: now,
    expiresAt: now + 5000,
  };
}
