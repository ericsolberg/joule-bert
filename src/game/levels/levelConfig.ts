import { EnemyType } from '../entities/enemies/types';

export interface LevelConfig {
  level: number;
  rows: number;
  hopsNeeded: 1 | 2;
  enemyTypes: EnemyType[];
  enemySpeedMultiplier: number;
  tileResetInterval: number | null;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    rows: 4,
    hopsNeeded: 1,
    enemyTypes: [EnemyType.Hallucinator],
    enemySpeedMultiplier: 1.0,
    tileResetInterval: null,
  },
  {
    level: 2,
    rows: 5,
    hopsNeeded: 1,
    enemyTypes: [EnemyType.Hallucinator, EnemyType.DataSilo, EnemyType.ComplianceTroll],
    enemySpeedMultiplier: 1.0,
    tileResetInterval: null,
  },
  {
    level: 3,
    rows: 6,
    hopsNeeded: 2,
    enemyTypes: [
      EnemyType.Hallucinator,
      EnemyType.DataSilo,
      EnemyType.ComplianceTroll,
      EnemyType.LegacyGoblin,
      EnemyType.ContextGremlin,
    ],
    enemySpeedMultiplier: 1.05,
    tileResetInterval: null,
  },
  {
    level: 4,
    rows: 7,
    hopsNeeded: 2,
    enemyTypes: [
      EnemyType.Hallucinator,
      EnemyType.DataSilo,
      EnemyType.ComplianceTroll,
      EnemyType.LegacyGoblin,
      EnemyType.ContextGremlin,
      EnemyType.DependencyChain,
    ],
    enemySpeedMultiplier: 1.10,
    tileResetInterval: null,
  },
];

export function getLevelConfig(level: number): LevelConfig {
  if (level <= 4) {
    return LEVEL_CONFIGS[level - 1];
  }
  // Level 5+: generated dynamically
  return {
    level,
    rows: 7,
    hopsNeeded: 2,
    enemyTypes: [
      EnemyType.Hallucinator,
      EnemyType.DataSilo,
      EnemyType.ComplianceTroll,
      EnemyType.LegacyGoblin,
      EnemyType.ContextGremlin,
      EnemyType.DependencyChain,
    ],
    enemySpeedMultiplier: 1.15 + 0.05 * (level - 5),
    tileResetInterval: 30000,
  };
}
