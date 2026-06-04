import type { BoardModel } from '../game/engine/boardModel';
import { TileState, tileToScreen } from '../game/engine/boardModel';

// SVG intrinsic dimensions — used to derive depth from tile width
const SVG_H_OVER_W = 896 / 1544; // ≈ 0.580

// Per-state overlay colours (drawn semi-transparently over the top diamond face)
const STATE_OVERLAY: Record<TileState, string | null> = {
  [TileState.Unvisited]:  null,                       // show raw SVG
  [TileState.Activating]: 'rgba(107,79,187,0.45)',    // soft purple
  [TileState.Activated]:  'rgba(167,139,250,0.55)',   // bright violet
  [TileState.Frozen]:     'rgba(75,85,99,0.65)',      // cool grey
  [TileState.Corrupted]:  'rgba(249,115,22,0.60)',    // amber warning
};

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardModel,
  originX: number,
  originY: number,
  introProgress: number,
  dissolveProgress: number,
  now: number,
  reduceMotion: boolean,
  tileImage: HTMLImageElement | null = null,
  tileW = 64,
  tileH = 32,
  tileD = 20,
  gap = 0
) {
  const totalTileTime = board.rows * 80 + 300;
  const imgH = tileH + tileD;

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c <= r; c++) {
      const tile = board.tiles[r][c];
      const { x, y } = tileToScreen(r, c, originX, originY, tileW, tileH, tileD, gap);

      // Staggered intro / dissolve scale
      let tileScale = 1;
      if (!reduceMotion && introProgress < 1) {
        const tileStart = (r * 80) / totalTileTime;
        const tileEnd = tileStart + 300 / totalTileTime;
        const localP = (introProgress - tileStart) / (tileEnd - tileStart);
        tileScale = Math.max(0, Math.min(1, localP));
      }
      if (!reduceMotion && dissolveProgress > 0) {
        const tileStart = ((board.rows - 1 - r) * 80) / totalTileTime;
        const localP = Math.max(0, dissolveProgress - tileStart);
        tileScale = Math.max(0, 1 - localP * 3);
      }
      if (tileScale <= 0) continue;

      ctx.save();
      // Scale around the visual centre of the tile
      const cx = x;
      const cy = y + imgH / 2;
      ctx.translate(cx, cy);
      if (tileScale < 1) ctx.scale(tileScale, tileScale);
      ctx.translate(-cx, -cy);

      drawTile(ctx, x, y, tile.state, tile.pulseAt, now, reduceMotion,
               tileImage, tileW, tileH, tileD);
      ctx.restore();
    }
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: TileState,
  pulseAt: number | null,
  now: number,
  reduceMotion: boolean,
  tileImage: HTMLImageElement | null,
  tileW: number,
  tileH: number,
  tileD: number
) {
  const imgH = tileH + tileD;
  const hw = tileW / 2;
  const hh = tileH / 2;

  // ── 1. Pulse glow setup ──────────────────────────────────────────────────
  let glowActive = false;
  if (!reduceMotion && pulseAt !== null) {
    const elapsed = now - pulseAt;
    if (elapsed < 500) {
      glowActive = true;
      ctx.shadowBlur = 24 * (1 - elapsed / 500);
      ctx.shadowColor = '#A78BFA';
    }
  }

  // ── 2. Draw SVG tile image ───────────────────────────────────────────────
  if (tileImage && tileImage.complete && tileImage.naturalWidth > 0) {
    ctx.drawImage(tileImage, x - hw, y, tileW, imgH);
  } else {
    // Fallback path-draw while image loads (or if null)
    drawFallbackTile(ctx, x, y, state, tileW, tileH, tileD);
  }

  if (glowActive) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // ── 3. State colour overlay on top diamond face ──────────────────────────
  const overlay = STATE_OVERLAY[state];
  if (overlay) {
    // Pulse glow re-applied to the overlay for visual punch
    if (!reduceMotion && pulseAt !== null && now - pulseAt < 500) {
      ctx.shadowBlur = 18 * (1 - (now - pulseAt) / 500);
      ctx.shadowColor = overlay;
    }

    ctx.beginPath();
    ctx.moveTo(x,      y);
    ctx.lineTo(x + hw, y + hh);
    ctx.lineTo(x,      y + tileH);
    ctx.lineTo(x - hw, y + hh);
    ctx.closePath();
    ctx.fillStyle = overlay;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // ── 4. Accessibility symbol on top face ──────────────────────────────────
  drawTileSymbol(ctx, x, y + hh, state, tileW);
}

function drawFallbackTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: TileState,
  tileW: number,
  tileH: number,
  tileD: number
) {
  const hw = tileW / 2;
  const hh = tileH / 2;

  const colors: Record<TileState, string> = {
    [TileState.Unvisited]:  '#1E1E3A',
    [TileState.Activating]: '#6B4FBB',
    [TileState.Activated]:  '#A78BFA',
    [TileState.Frozen]:     '#4B5563',
    [TileState.Corrupted]:  '#F97316',
  };

  const top = colors[state];

  ctx.beginPath();
  ctx.moveTo(x,      y);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x,      y + tileH);
  ctx.lineTo(x - hw, y + hh);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(x - hw, y + hh);
  ctx.lineTo(x,      y + tileH);
  ctx.lineTo(x,      y + tileH + tileD);
  ctx.lineTo(x - hw, y + hh + tileD);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // Right face
  ctx.beginPath();
  ctx.moveTo(x,      y + tileH);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x + hw, y + hh + tileD);
  ctx.lineTo(x,      y + tileH + tileD);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
}

function drawTileSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  state: TileState,
  tileW: number
) {
  const scale = tileW / 64; // scale symbols relative to original 64px tile size
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `bold ${Math.round(9 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (state) {
    case TileState.Activating: {
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TileState.Activated: {
      const s = 4 * scale;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const r2 = i % 2 === 0 ? s : s * 0.4;
        const px = cx + Math.cos(angle) * r2;
        const py = cy + Math.sin(angle) * r2;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      break;
    }
    case TileState.Frozen: {
      ctx.strokeStyle = 'rgba(200,220,255,0.7)';
      ctx.lineWidth = 1.5 * scale;
      const arm = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(cx - arm, cy); ctx.lineTo(cx + arm, cy);
      ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy + arm);
      ctx.moveTo(cx - arm * 0.7, cy - arm * 0.7); ctx.lineTo(cx + arm * 0.7, cy + arm * 0.7);
      ctx.moveTo(cx + arm * 0.7, cy - arm * 0.7); ctx.lineTo(cx - arm * 0.7, cy + arm * 0.7);
      ctx.stroke();
      break;
    }
    case TileState.Corrupted: {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('!', cx, cy);
      break;
    }
    default:
      break;
  }

  ctx.restore();
}

export function drawEscapeNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
  animating: boolean,
  animProgress: number,
  respawnAt: number | null,
  now: number
) {
  const w = 36;
  const h = 22;
  const r = 8;

  let alpha = active ? 1 : 0.35;
  if (animating) alpha = 1 - animProgress;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.lineTo(x + w / 2 - r, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + r, r);
  ctx.lineTo(x + w / 2, y + h / 2 - r);
  ctx.arcTo(x + w / 2, y + h / 2, x + w / 2 - r, y + h / 2, r);
  ctx.lineTo(x - w / 2 + r, y + h / 2);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - r, r);
  ctx.lineTo(x - w / 2, y - h / 2 + r);
  ctx.arcTo(x - w / 2, y - h / 2, x - w / 2 + r, y - h / 2, r);
  ctx.closePath();
  ctx.fillStyle = '#0A0A1A';
  ctx.fill();
  ctx.strokeStyle = '#2DD4BF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Respawn progress arc
  if (!active && !animating && respawnAt !== null) {
    const frac = Math.max(0, 1 - (respawnAt - now) / 8000);
    ctx.beginPath();
    ctx.arc(x, y, w / 2 - 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Cloud icon
  ctx.fillStyle = '#2DD4BF';
  ctx.beginPath(); ctx.arc(x - 7, y + 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x,     y - 1, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 7, y + 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 11, y + 2, 22, 4);

  ctx.restore();
}

// Export the helper so GameCanvas can use it for tile sizing
export { SVG_H_OVER_W };
