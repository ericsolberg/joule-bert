import type { BonusItem } from '../game/entities/bonusItem';
import { BonusItemType } from '../game/entities/bonusItem';
import { tileToScreen } from '../game/engine/boardModel';

export function drawBonusItems(
  ctx: CanvasRenderingContext2D,
  items: BonusItem[],
  originX: number,
  originY: number,
  now: number,
  tileW = 64,
  tileH = 32,
  tileD = 20
) {
  for (const item of items) {
    const { x, y } = tileToScreen(item.row, item.col, originX, originY, tileW, tileH, tileD);
    const drawY = y + tileH / 2 - 20 + Math.sin(now / 400) * 3;

    const lifeLeft = (item.expiresAt - now) / 5000;
    const alpha = lifeLeft < 0.3 ? lifeLeft / 0.3 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    switch (item.type) {
      case BonusItemType.InsightOrb:
        drawInsightOrb(ctx, x, drawY, now);
        break;
      case BonusItemType.APIToken:
        drawAPIToken(ctx, x, drawY);
        break;
      case BonusItemType.ModelUpdate:
        drawModelUpdate(ctx, x, drawY, now);
        break;
    }

    ctx.restore();
  }
}

function drawInsightOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number) {
  const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 12);
  grad.addColorStop(0, '#A7F3D0');
  grad.addColorStop(0.5, '#2DD4BF');
  grad.addColorStop(1, '#0D9488');

  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#2DD4BF';

  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  const t = now / 500;
  for (let i = 0; i < 4; i++) {
    const angle = t + (i * Math.PI) / 2;
    const r = 14 + Math.sin(t * 2 + i) * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#A7F3D0';
    ctx.fill();
  }

  ctx.restore();
}

function drawAPIToken(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#FCD34D';

  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#FCD34D';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#92400E';
  ctx.fill();

  ctx.fillStyle = '#FCD34D';
  ctx.fillRect(cx + 2, cy - 6, 10, 4);
  ctx.fillRect(cx + 9, cy - 2, 3, 3);
  ctx.fillRect(cx + 6, cy - 2, 3, 3);

  ctx.restore();
}

function drawModelUpdate(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number) {
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#8B5CF6';

  const bounce = Math.abs(Math.sin(now / 400)) * 4;

  ctx.fillStyle = '#8B5CF6';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8 - bounce);
  ctx.lineTo(cx - 10, cy - 4 - bounce);
  ctx.lineTo(cx - 4, cy - 4 - bounce);
  ctx.lineTo(cx - 4, cy - 14 - bounce);
  ctx.lineTo(cx + 4, cy - 14 - bounce);
  ctx.lineTo(cx + 4, cy - 4 - bounce);
  ctx.lineTo(cx + 10, cy - 4 - bounce);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawVictoryFlash(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  clearProgress: number,
  flashDuration: number,
  totalMs: number
) {
  const elapsed = clearProgress * totalMs;
  if (elapsed > flashDuration) return;
  const alpha = (1 - elapsed / flashDuration) * 0.6;
  ctx.save();
  ctx.fillStyle = `rgba(196,181,253,${alpha})`;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();
}

export function drawLevelText(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  level: number,
  introProgress: number,
  totalIntroMs: number,
  levelTitleMs: number
) {
  const titleEnd = levelTitleMs / totalIntroMs;
  if (introProgress > titleEnd) return;
  const fadeStart = titleEnd * 0.7;
  const alpha = introProgress < fadeStart ? 1 : (1 - (introProgress - fadeStart) / (titleEnd - fadeStart));

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F5F3FF';
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#8B5CF6';
  ctx.fillText(`LEVEL ${level}`, canvasW / 2, canvasH / 2);
  ctx.restore();
}

export function drawJouleOnlineText(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  clearProgress: number,
  jouleOnlineStartFraction: number
) {
  if (clearProgress < jouleOnlineStartFraction) return;
  const localProgress = (clearProgress - jouleOnlineStartFraction) / (1 - jouleOnlineStartFraction);
  const alpha = localProgress < 0.8 ? localProgress / 0.8 : (1 - (localProgress - 0.8) / 0.2);

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2DD4BF';
  ctx.shadowBlur = 25;
  ctx.shadowColor = '#2DD4BF';
  ctx.fillText('JOULE ONLINE', canvasW / 2, canvasH / 2);
  ctx.restore();
}
