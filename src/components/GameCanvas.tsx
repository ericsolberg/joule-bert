import { useRef, useEffect, useCallback, useState } from 'react';
import { soundManager } from '../audio/soundManager';
import type { GameState } from '../game/engine/gameState';
import { GamePhase, createInitialGameState } from '../game/engine/gameState';
import { updateGame } from '../game/engine/gameUpdate';
import { computeOrigin, tileToScreen } from '../game/engine/boardModel';
import { drawBoard, drawEscapeNode, SVG_H_OVER_W } from '../renderer/boardRenderer';
import { drawPlayer, getPlayerScreenPos } from '../renderer/playerRenderer';
import { drawEnemy } from '../renderer/enemyRenderer';
import { drawBonusItems, drawVictoryFlash, drawLevelText, drawJouleOnlineText } from '../renderer/effectRenderer';
import { useGameInput } from '../hooks/useGameInput';
import { useGameLoop } from '../hooks/useGameLoop';
import { HUD } from './HUD';
import { PauseScreen } from './PauseScreen';
import { TIMING } from '../game/engine/timing';

const MAX_TILE_W = 200;
const MARGIN = 80; // horizontal padding so tiles don't touch the edge
const TILE_GAP = 10; // pixels of space between adjacent tiles

/** Compute responsive tile dimensions from canvas width and board row count. */
function computeTileDims(canvasW: number, numRows: number) {
  const responsiveW = Math.floor((canvasW - MARGIN) * 2 / numRows);
  const tileW = Math.min(MAX_TILE_W, Math.max(40, responsiveW));
  const tileH = Math.round(tileW / 2);                          // 2:1 isometric diamond
  const tileD = Math.round(tileW * SVG_H_OVER_W - tileH);      // depth from SVG aspect ratio
  return { tileW, tileH, tileD };
}

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

  // SVG tile image
  const tileImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/jbert-game-tile.svg';
    tileImageRef.current = img;
  }, []);

  // Joule character image
  const jouleImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/joule.png';
    jouleImageRef.current = img;
  }, []);

  // Escape node image
  const escapeNodeImageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/escapenode.png';
    escapeNodeImageRef.current = img;
  }, []);

  // Preload sounds and play level-start for the first level
  useEffect(() => {
    Promise.all([
      soundManager.load('jump', '/jump.mp3'),
      soundManager.load('enemy-jump-2', '/enemy-jump-2.mp3'),
      soundManager.load('enemy-jump-4', '/enemy-jump-4.mp3'),
      soundManager.load('lift', '/lift.mp3'),
      soundManager.load('level-start', '/level-start.mp3'),
      soundManager.load('victory', '/victory.mp3'),
      soundManager.load('fall', '/fall.mp3'),
      soundManager.load('game-over', '/game-over.mp3'),
    ]).then(() => soundManager.play('level-start'));
  }, []);

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

    if (newState.player.isHopping && !state.player.isHopping) {
      soundManager.play('jump');
    }

    for (let i = 0; i < newState.enemies.length; i++) {
      const prev = state.enemies[i];
      const next = newState.enemies[i];
      if (next.isHopping && !prev?.isHopping) {
        soundManager.play(Math.random() < 0.5 ? 'enemy-jump-2' : 'enemy-jump-4', 0.6);
      }
      if (next.isFalling && !prev?.isFalling) {
        soundManager.play('fall', 0.5);
      }
    }
    if (newState.player.animState === 'dead' && state.player.animState !== 'dead') {
      soundManager.play('fall');
    }
    if (newState.player.isEscaping && !state.player.isEscaping) {
      soundManager.play('lift');
    }

    if (newState.score > hiScore) {
      onHiScoreUpdate(newState.score);
    }

    if (newState.phase !== state.phase) {
      setPhase(newState.phase);
      if (newState.phase === GamePhase.LevelIntro) {
        soundManager.play('level-start');
      }
      if (newState.phase === GamePhase.LevelClear) {
        soundManager.play('victory');
      }
      if (newState.phase === GamePhase.GameOver) {
        soundManager.play('game-over');
        onGameOver(newState.score);
      }
    }
  }, [consumeDirection, consumePause, hiScore, hasMoved, onHiScoreUpdate, onGameOver]);

  // Handle un-pause from paused state
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

    // Responsive tile dimensions — recomputed every frame so resize is instant
    const { tileW, tileH, tileD } = computeTileDims(w, state.board.rows);
    const { originX, originY } = computeOrigin(state.board.rows, w, h, tileW, tileH, tileD, TILE_GAP);
    const now = performance.now();
    const tileImage = tileImageRef.current;

    const introProgress = state.phase === GamePhase.LevelIntro ? state.introProgress : 1;
    const dissolveProgress = state.phase === GamePhase.LevelClear ? state.dissolveProgress : 0;

    drawBoard(
      ctx, state.board, originX, originY,
      introProgress, dissolveProgress,
      now, reduceMotion,
      tileImage, tileW, tileH, tileD, TILE_GAP
    );

    // Draw escape nodes
    for (const node of state.escapeNodes) {
      const anchorCol = node.side === 'left' ? 0 : node.anchorRow;
      const base = tileToScreen(node.anchorRow, anchorCol, originX, originY, tileW, tileH, tileD, TILE_GAP);
      let nx: number, ny: number;

      if (node.side === 'left') {
        nx = base.x - tileW - 50;
        ny = base.y + tileH / 2 + 80;
      } else {
        nx = base.x + tileW + 50;
        ny = base.y + tileH / 2 + 80;
      }

      if (node.animating) {
        const topPos = tileToScreen(0, 0, originX, originY, tileW, tileH, tileD, TILE_GAP);
        const tx = topPos.x;
        const ty = topPos.y + tileH / 2;
        const p = node.animProgress;
        const ep = p * p * (3 - 2 * p);
        nx = nx + (tx - nx) * ep;
        ny = ny + (ty - ny) * ep;
      }

      drawEscapeNode(ctx, nx, ny, node.active, node.animating, node.animProgress, node.respawnAt, now, escapeNodeImageRef.current);
    }

    drawBonusItems(ctx, state.bonusItems, originX, originY, now, tileW, tileH, tileD, TILE_GAP);

    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy, originX, originY, now, tileW, tileH, tileD, TILE_GAP);
    }

    if (state.phase !== GamePhase.LevelIntro || state.introProgress >= 1) {
      let playerPos = getPlayerScreenPos(state.player, originX, originY, tileW, tileH, tileD, TILE_GAP);

      if (state.player.isEscaping) {
        const node = state.escapeNodes[state.player.escapingNodeIdx];
        const anchorCol = node.side === 'left' ? 0 : node.anchorRow;
        const nodeBase = tileToScreen(node.anchorRow, anchorCol, originX, originY, tileW, tileH, tileD, TILE_GAP);
        const startX = node.side === 'left' ? nodeBase.x - tileW - 50 : nodeBase.x + tileW + 50;
        const startY = nodeBase.y + tileH / 2 + 80;
        const topPos = tileToScreen(0, 0, originX, originY, tileW, tileH, tileD, TILE_GAP);
        const endX = topPos.x;
        const endY = topPos.y + tileH / 2;
        // Smoothstep easing so arrival feels like landing
        const p = node.animProgress;
        const ep = p * p * (3 - 2 * p);
        playerPos = { x: startX + (endX - startX) * ep, y: startY + (endY - startY) * ep };
      }

      drawPlayer(ctx, state.player, playerPos.x, playerPos.y, now, reduceMotion, jouleImageRef.current);
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

  // Low-frequency React re-render to keep HUD values in sync
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
