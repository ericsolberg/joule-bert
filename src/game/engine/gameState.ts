import type { PlayerState } from '../entities/player';
import type { EnemyState } from '../entities/enemies/types';
import type { EnemyType } from '../entities/enemies/types';
import type { BonusItem } from '../entities/bonusItem';
import { BoardModel } from './boardModel';
import { createPlayer } from '../entities/player';
import { getLevelConfig } from '../levels/levelConfig';

export const GamePhase = {
  Title: 'title',
  LevelIntro: 'levelIntro',
  Playing: 'playing',
  Paused: 'paused',
  PlayerDead: 'playerDead',
  LevelClear: 'levelClear',
  GameOver: 'gameOver',
} as const;
export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

export interface EscapeNode {
  side: 'left' | 'right';
  anchorRow: number;
  active: boolean;
  respawnAt: number | null;
  animating: boolean;
  animProgress: number;
}

export interface GameState {
  phase: GamePhase;
  level: number;
  score: number;
  hiScore: number;
  board: BoardModel;
  player: PlayerState;
  enemies: EnemyState[];
  escapeNodes: [EscapeNode, EscapeNode];
  bonusItems: BonusItem[];
  lastBonusSpawn: number;
  hopsNeeded: 1 | 2;
  speedMultiplier: number;
  tileResetInterval: number | null;
  lastTileReset: number;
  allEnemiesFrozenUntil: number | null;
  levelStartTime: number;
  introProgress: number;
  clearProgress: number;
  dissolveProgress: number;
  perfectLevel: boolean;
  enemyMovementEnabled: boolean;
  enemyQueue: EnemyType[];
  nextEnemyAt: number | null;
  enemyPoolIndex: number;
}

export function createEscapeNodes(anchorRow: number): [EscapeNode, EscapeNode] {
  return [
    { side: 'left', anchorRow, active: true, respawnAt: null, animating: false, animProgress: 0 },
    { side: 'right', anchorRow, active: true, respawnAt: null, animating: false, animProgress: 0 },
  ];
}

export function createInitialGameState(level: number, hiScore: number, prevScore: number, enemyPoolIndex = 0): GameState {
  const config = getLevelConfig(level);
  const board = new BoardModel(config.rows);
  const anchorRow = Math.max(1, Math.floor(config.rows / 3));

  return {
    phase: GamePhase.LevelIntro,
    level,
    score: prevScore,
    hiScore,
    board,
    player: createPlayer(),
    enemies: [],
    escapeNodes: createEscapeNodes(anchorRow),
    bonusItems: [],
    lastBonusSpawn: 0,
    hopsNeeded: config.hopsNeeded,
    speedMultiplier: config.enemySpeedMultiplier,
    tileResetInterval: config.tileResetInterval,
    lastTileReset: 0,
    allEnemiesFrozenUntil: null,
    levelStartTime: 0,
    introProgress: 0,
    clearProgress: 0,
    dissolveProgress: 0,
    perfectLevel: true,
    enemyMovementEnabled: false,
    enemyQueue: [],
    nextEnemyAt: null,
    enemyPoolIndex,
  };
}
