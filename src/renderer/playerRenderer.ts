import type { PlayerState } from '../game/entities/player';
import { tileToScreen } from '../game/engine/boardModel';
import { hopArcOffset } from '../game/engine/physics';
import { TIMING } from '../game/engine/timing';

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  screenX: number,
  screenY: number,
  now: number,
  reduceMotion: boolean,
  jouleImage: HTMLImageElement | null = null
) {
  if (player.animState === 'dead') {
    drawDeathAnim(ctx, player, screenX, screenY);
    return;
  }

  let drawY = screenY;

  if (!reduceMotion && player.animState === 'idle') {
    drawY += Math.sin(now / 750) * 2;
  }

  if (player.animState === 'victory') {
    ctx.save();
    ctx.translate(screenX, drawY - 18);
    const spin = player.victoryProgress * Math.PI * 2;
    const scale = 1 + 0.2 * Math.sin(player.victoryProgress * Math.PI * 3);
    ctx.rotate(spin);
    ctx.scale(scale, scale);
    drawGem(ctx, 0, 0, jouleImage);
    ctx.restore();
    return;
  }

  drawGem(ctx, screenX, drawY - 18, jouleImage);
}

function drawGem(ctx: CanvasRenderingContext2D, cx: number, cy: number, jouleImage: HTMLImageElement | null = null) {
  const size = 18;

  if (jouleImage && jouleImage.complete && jouleImage.naturalWidth > 0) {
    const imgSize = size * 4.0;
    ctx.save();
    //ctx.shadowBlur = 16;
    ctx.shadowColor = '#8B5CF6';
    ctx.drawImage(jouleImage, cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
    ctx.shadowBlur = 0;
    ctx.restore();
    return;
  }

  ctx.save();

  // Base shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + size + 2, size * 0.6, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  ctx.shadowBlur = 16;
  ctx.shadowColor = '#8B5CF6';

  // Gem polygon
  const pts: [number, number][] = [
    [cx, cy - size],
    [cx + size * 0.7, cy - size * 0.3],
    [cx + size * 0.85, cy + size * 0.2],
    [cx + size * 0.4, cy + size],
    [cx - size * 0.4, cy + size],
    [cx - size * 0.85, cy + size * 0.2],
    [cx - size * 0.7, cy - size * 0.3],
  ];

  const grad = ctx.createRadialGradient(cx, cy - size * 0.2, 2, cx, cy, size);
  grad.addColorStop(0, '#C4B5FD');
  grad.addColorStop(0.5, '#8B5CF6');
  grad.addColorStop(1, '#4C1D95');

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Internal facet lines
  ctx.strokeStyle = 'rgba(196,181,253,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(pts[6][0], pts[6][1]);
  ctx.lineTo(pts[0][0], pts[0][1]);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.stroke();

  // Top highlight facet
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, cy - size * 0.6);
  ctx.lineTo(cx + size * 0.3, cy - size * 0.6);
  ctx.lineTo(cx + size * 0.15, cy - size * 0.15);
  ctx.lineTo(cx - size * 0.15, cy - size * 0.15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();

  // Specular highlight
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.25, cy - size * 0.5, size * 0.15, size * 0.08, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  ctx.restore();
}

function drawDeathAnim(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  cx: number,
  cy: number
) {
  const progress = player.deathProgress;
  if (progress >= 1) return;

  const seed = player.deathSeed;
  const numFragments = 8;

  for (let i = 0; i < numFragments; i++) {
    const angle = (i / numFragments) * Math.PI * 2 + ((seed * 0.001 + i * 0.37) % 1) * 0.5;
    const speed = 40 + ((seed + i * 13) % 30);
    const fragX = cx + Math.cos(angle) * speed * progress;
    const fragY = (cy - 18) + Math.sin(angle) * speed * progress + 60 * progress * progress;
    const fragAlpha = 1 - progress;
    const fragSize = 5 * (1 - progress * 0.7);

    ctx.save();
    ctx.globalAlpha = fragAlpha;
    ctx.translate(fragX, fragY);
    ctx.rotate(angle + progress * Math.PI * 2);

    ctx.beginPath();
    ctx.moveTo(0, -fragSize);
    ctx.lineTo(fragSize, fragSize);
    ctx.lineTo(-fragSize, fragSize);
    ctx.closePath();
    ctx.fillStyle = '#8B5CF6';
    ctx.fill();
    ctx.restore();
  }
}

export function getPlayerScreenPos(
  player: PlayerState,
  originX: number,
  originY: number,
  tileW = 64,
  tileH = 32,
  tileD = 20,
  gap = 0
): { x: number; y: number } {
  if (player.isHopping) {
    const from = tileToScreen(player.hopFrom.row, player.hopFrom.col, originX, originY, tileW, tileH, tileD, gap);
    const to = tileToScreen(player.hopTo.row, player.hopTo.col, originX, originY, tileW, tileH, tileD, gap);
    const fromX = from.x;
    const fromY = from.y + tileH / 2;
    const toX = to.x;
    const toY = to.y + tileH / 2;

    const p = player.hopProgress;
    const arcY = hopArcOffset(p, TIMING.PLAYER_HOP_ARC_PX);

    return {
      x: fromX + (toX - fromX) * p,
      y: fromY + (toY - fromY) * p - arcY,
    };
  }

  const pos = tileToScreen(player.row, player.col, originX, originY, tileW, tileH, tileD, gap);
  return { x: pos.x, y: pos.y + tileH / 2 };
}
