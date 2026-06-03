import { BoardModel, TileState, tileToScreen } from '../game/engine/boardModel';

const TILE_W = 64;
const TILE_H = 32;
const TILE_D = 20;

function lighten(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((n & 0xff) * factor));
  return `rgb(${r},${g},${b})`;
}

const STATE_COLORS: Record<TileState, string> = {
  [TileState.Unvisited]: '#1E1E3A',
  [TileState.Activating]: '#6B4FBB',
  [TileState.Activated]: '#A78BFA',
  [TileState.Frozen]: '#4B5563',
  [TileState.Corrupted]: '#F97316',
};

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardModel,
  originX: number,
  originY: number,
  introProgress: number,
  dissolveProgress: number,
  now: number,
  reduceMotion: boolean
) {
  const totalTileTime = board.rows * 80 + 300;

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c <= r; c++) {
      const tile = board.tiles[r][c];
      const { x, y } = tileToScreen(r, c, originX, originY, TILE_W, TILE_H, TILE_D);

      // Staggered intro animation
      let tileScale = 1;
      if (!reduceMotion && introProgress < 1) {
        const tileStart = (r * 80) / totalTileTime;
        const tileEnd = tileStart + 300 / totalTileTime;
        const localProgress = (introProgress - tileStart) / (tileEnd - tileStart);
        tileScale = Math.max(0, Math.min(1, localProgress));
      }
      if (!reduceMotion && dissolveProgress > 0) {
        const tileStart = ((board.rows - 1 - r) * 80) / totalTileTime;
        const localProgress = Math.max(0, dissolveProgress - tileStart);
        tileScale = Math.max(0, 1 - localProgress * 3);
      }

      if (tileScale <= 0) continue;

      ctx.save();
      ctx.translate(x, y + TILE_H / 2);
      if (tileScale < 1) ctx.scale(tileScale, tileScale);
      ctx.translate(-x, -(y + TILE_H / 2));

      drawTile(ctx, x, y, tile.state, tile.pulseAt, now, reduceMotion);
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
  reduceMotion: boolean
) {
  const topColor = STATE_COLORS[state];
  const leftColor = lighten(topColor, 0.6);
  const rightColor = lighten(topColor, 0.35);

  const hw = TILE_W / 2;
  const hh = TILE_H / 2;

  // Pulse glow effect
  if (!reduceMotion && pulseAt !== null) {
    const elapsed = now - pulseAt;
    if (elapsed < 400) {
      const glowAlpha = (1 - elapsed / 400) * 0.7;
      ctx.save();
      ctx.shadowBlur = 20 * (1 - elapsed / 400);
      ctx.shadowColor = '#A78BFA';
      ctx.globalAlpha = glowAlpha;
    }
  }

  // Top face (diamond)
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x, y + TILE_H);
  ctx.lineTo(x - hw, y + hh);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Left face
  ctx.beginPath();
  ctx.moveTo(x - hw, y + hh);
  ctx.lineTo(x, y + TILE_H);
  ctx.lineTo(x, y + TILE_H + TILE_D);
  ctx.lineTo(x - hw, y + hh + TILE_D);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Right face
  ctx.beginPath();
  ctx.moveTo(x, y + TILE_H);
  ctx.lineTo(x + hw, y + hh);
  ctx.lineTo(x + hw, y + hh + TILE_D);
  ctx.lineTo(x, y + TILE_H + TILE_D);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Reset glow
  if (pulseAt !== null) {
    const elapsed = now - pulseAt;
    if (elapsed < 400) {
      ctx.restore();
    }
  }

  // Accessibility symbols on top face
  drawTileSymbol(ctx, x, y + hh, state);
}

function drawTileSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: TileState) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (state) {
    case TileState.Activating:
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case TileState.Activated: {
      // 4-point star ✦
      const s = 4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.4;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      break;
    }
    case TileState.Frozen: {
      // Snowflake cross
      ctx.strokeStyle = 'rgba(200,220,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
      ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
      ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3);
      ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3);
      ctx.stroke();
      break;
    }
    case TileState.Corrupted:
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('!', cx, cy);
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

  // Rounded rect
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

  // Respawn arc
  if (!active && !animating && respawnAt !== null) {
    const remaining = respawnAt - now;
    const total = 8000;
    const frac = Math.max(0, 1 - remaining / total);
    ctx.beginPath();
    ctx.arc(x, y, w / 2 - 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Cloud icon (3 circles)
  ctx.fillStyle = '#2DD4BF';
  ctx.beginPath(); ctx.arc(x - 7, y + 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 1, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 7, y + 2, 4, 0, Math.PI * 2); ctx.fill();
  // Cloud base
  ctx.fillRect(x - 11, y + 2, 22, 4);

  ctx.restore();
}
