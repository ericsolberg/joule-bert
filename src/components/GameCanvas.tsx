import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState } from '../game/engine/gameState';
import { GamePhase, createInitialGameState } from '../game/engine/gameState';
import { updateGame } from '../game/engine/gameUpdate';
import { computeOrigin, tileToScreen } from '../game/engine/boardModel';
import { drawBoard, drawEscapeNode } from '../renderer/boardRenderer';
import { drawPlayer, getPlayerScreenPos } from '../renderer/playerRenderer';
import { drawEnemy } from '../renderer/enemyRenderer';
import { drawBonusItems, drawVictoryFlash, drawLevelText, drawJouleOnlineText } from '../renderer/effectRenderer';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';
import { HUD } from './HUD';
import { PauseScreen } from './PauseScreen';
import { TIMING } from '../game/engine/timing';

const TILE_W = 64;
const TILE_H = 32;
const TILE_D = 20;

interface GameCanvasProps {
  hiScore: number;
  onHiScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

export function GameCanvas({ hiScore, onHiScoreUpdate, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialGameState(1, hiScore, 0));
  const [hasMoved, setHasMoved] = useState(false);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { consumeDirection, consumePause } = useGameInput();

  const [phase, setPhase] = useState<GamePhase>(GamePhase.LevelIntro);

  const update = useCallback((deltaMs: number, now: number) => {
    const state = stateRef.current;
    if (state.phase === GamePhase.Paused || state.phase === GamePhase.GameOver) return;

    if (consumePause()) {
      if (state.phase === GamePhase.Playing) {
        stateRef.current = { ...state, phase: GamePhase.Paused };
        setPhase(GamePhase.Paused);
        return;
      }
    }

    const dir = consumeDirection();
    if (dir && !hasMoved) setHasMoved(true);

    const newState = updateGame(state, deltaMs, now, dir);
    stateRef.current = newState;

    if (newState.score > hiScore) {
      onHiScoreUpdate(newState.score);
    }

    if (newState.phase !== state.phase) {
      setPhase(newState.phase);
      if (newState.phase === GamePhase.GameOver) {
        onGameOver(newState.score);
      }
    }
  }, [consumeDirection, consumePause, hiScore, hasMoved, onHiScoreUpdate, onGameOver]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.code === 'Escape' || e.code === 'KeyP') && stateRef.current.phase === GamePhase.Paused) {
        stateRef.current = { ...stateRef.current, phase: GamePhase.Playing };
        setPhase(GamePhase.Playing);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, w, h);

    const { originX, originY } = computeOrigin(state.board.rows, w, h, TILE_W, TILE_H, TILE_D);
    const now = performance.now();

    const introProgress = state.phase === GamePhase.LevelIntro ? state.introProgress : 1;
    const dissolveProgress = state.phase === GamePhase.LevelClear ? state.dissolveProgress : 0;
    drawBoard(ctx, state.board, originX, originY, introProgress, dissolveProgress, now, reduceMotion);

    // Draw escape nodes
    for (const node of state.escapeNodes) {
      const anchorCol = node.side === 'left' ? 0 : node.anchorRow;
      const base = tileToScreen(node.anchorRow, anchorCol, originX, originY, TILE_W, TILE_H, TILE_D);
      let nx: number, ny: number;

      if (node.side === 'left') {
        nx = base.x - TILE_W;
        ny = base.y + TILE_H / 2;
      } else {
        nx = base.x + TILE_W;
        ny = base.y + TILE_H / 2;
      }

      if (node.animating) {
        const topPos = tileToScreen(0, 0, originX, originY, TILE_W, TILE_H, TILE_D);
        const tx = topPos.x;
        const ty = topPos.y + TILE_H / 2;
        const p = node.animProgress;
        const ep = p * p * (3 - 2 * p);
        nx = nx + (tx - nx) * ep;
        ny = ny + (ty - ny) * ep;
      }

      drawEscapeNode(ctx, nx, ny, node.active, node.animating, node.animProgress, node.respawnAt, now);
    }

    drawBonusItems(ctx, state.bonusItems, originX, originY, now, TILE_W, TILE_H, TILE_D);

    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy, originX, originY, now, TILE_W, TILE_H, TILE_D);
    }

    if (state.phase !== GamePhase.LevelIntro || state.introProgress >= 1) {
      const playerPos = getPlayerScreenPos(state.player, originX, originY, TILE_W, TILE_H, TILE_D);
      drawPlayer(ctx, state.player, playerPos.x, playerPos.y, now, reduceMotion);
    }

    if (state.phase === GamePhase.LevelClear) {
      const totalClearMs = TIMING.VICTORY_FLASH_MS + TIMING.SCORE_TALLY_MS + TIMING.BOARD_DISSOLVE_TOTAL_MS + TIMING.JOULE_ONLINE_DISPLAY_MS;
      drawVictoryFlash(ctx, w, h, state.clearProgress, TIMING.VICTORY_FLASH_MS, totalClearMs);

      const jouleOnlineStart = (TIMING.VICTORY_FLASH_MS + TIMING.SCORE_TALLY_MS + TIMING.BOARD_DISSOLVE_TOTAL_MS) / totalClearMs;
      drawJouleOnlineText(ctx, w, h, state.clearProgress, jouleOnlineStart);
    }

    if (state.phase === GamePhase.LevelIntro) {
      const rowStagger = state.board.rows * TIMING.LEVEL_INTRO_ROW_STAGGER_MS;
      const totalIntroMs = rowStagger + 300 + TIMING.LEVEL_TITLE_DISPLAY_MS;
      drawLevelText(ctx, w, h, state.level, state.introProgress, totalIntroMs, TIMING.LEVEL_TITLE_DISPLAY_MS);
    }
  }, [reduceMotion]);

  // Force React re-renders for HUD sync - run at 10fps
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  useGameLoop(
    update,
    render,
    phase !== GamePhase.Paused && phase !== GamePhase.GameOver
  );

  const state = stateRef.current;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <HUD
        score={state.score}
        hiScore={state.hiScore}
        level={state.level}
        lives={state.player.lives}
        showControls={!hasMoved}
      />
      {phase === GamePhase.Paused && <PauseScreen />}
    </div>
  );
}
