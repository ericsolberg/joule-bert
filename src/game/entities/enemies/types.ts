export const EnemyType = {
  Hallucinator: 'hallucinator',
  DataSilo: 'dataSilo',
  ComplianceTroll: 'complianceTroll',
  LegacyGoblin: 'legacyGoblin',
  ContextGremlin: 'contextGremlin',
  DependencyChain: 'dependencyChain',
} as const;
export type EnemyType = typeof EnemyType[keyof typeof EnemyType];

export interface BaseEnemyState {
  id: string;
  type: EnemyType;
  row: number;
  col: number;
  isHopping: boolean;
  hopProgress: number;
  hopFrom: { row: number; col: number };
  hopTo: { row: number; col: number };
  hopLeadsFall: boolean;
  lastTickTime: number;
  alive: boolean;
  respawnAt: number | null;
  isFalling: boolean;
  fallProgress: number;
  fallSeed: number;
  introHops: number;
}

export interface HallucinatorState extends BaseEnemyState {
  type: 'hallucinator';
}

export interface DataSiloState extends BaseEnemyState {
  type: 'dataSilo';
  direction: 'DR' | 'DL';
}

export interface ComplianceTrollState extends BaseEnemyState {
  type: 'complianceTroll';
}

export interface LegacyGoblinState extends BaseEnemyState {
  type: 'legacyGoblin';
  patrolDir: 'DR' | 'DL';
}

export interface ContextGremlinState extends BaseEnemyState {
  type: 'contextGremlin';
  hopCount: number;
}

export interface DependencyChainState extends BaseEnemyState {
  type: 'dependencyChain';
  linksOnBoard: number;
  lockedOn: boolean;
  segments: Array<{ row: number; col: number }>;
  coilDir: 'DL' | 'DR';
  coilStep: number;
}

export type EnemyState =
  | HallucinatorState
  | DataSiloState
  | ComplianceTrollState
  | LegacyGoblinState
  | ContextGremlinState
  | DependencyChainState;
