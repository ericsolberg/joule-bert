import type { EnemyState } from '../game/entities/enemies/types';
import { EnemyType } from '../game/entities/enemies/types';

const ENEMY_NAMES: Record<EnemyType, string> = {
  [EnemyType.Hallucinator]: 'Hallucinator',
  [EnemyType.DataSilo]: 'Data Silo',
  [EnemyType.ComplianceTroll]: 'Compliance Troll',
  [EnemyType.LegacyGoblin]: 'Legacy Goblin',
  [EnemyType.ContextGremlin]: 'Context Gremlin',
};
import { tileToScreen } from '../game/engine/boardModel';
import { hopArcOffset } from '../game/engine/physics';
import { TIMING } from '../game/engine/timing';

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  originX: number,
  originY: number,
  now: number,
  tileW = 64,
  tileH = 32,
  tileD = 20,
  gap = 0,
  hallucinatorImage: HTMLImageElement | null = null,
  legacyGoblinImage: HTMLImageElement | null = null,
  datasiloImage: HTMLImageElement | null = null,
  contextGremlinImage: HTMLImageElement | null = null,
  complianceTrollImage: HTMLImageElement | null = null
) {
  if (enemy.isFalling) {
    drawEnemyFall(ctx, enemy, originX, originY, now, tileW, tileH, tileD, gap, hallucinatorImage, legacyGoblinImage, datasiloImage, contextGremlinImage, complianceTrollImage);
    return;
  }
  if (!enemy.alive) return;

  const pos = getEnemyScreenPos(enemy, originX, originY, tileW, tileH, tileD, gap);

  switch (enemy.type) {
    case EnemyType.Hallucinator:
      drawHallucinator(ctx, pos.x, pos.y, hallucinatorImage);
      break;
    case EnemyType.DataSilo:
      drawDataSilo(ctx, pos.x, pos.y, datasiloImage);
      break;
    case EnemyType.ComplianceTroll:
      drawComplianceTroll(ctx, pos.x, pos.y, complianceTrollImage);
      break;
    case EnemyType.LegacyGoblin:
      drawLegacyGoblin(ctx, pos.x, pos.y, legacyGoblinImage);
      break;
    case EnemyType.ContextGremlin:
      drawContextGremlin(ctx, pos.x, pos.y, contextGremlinImage);
      break;
  }

  if (enemy.introHops < 3) {
    drawEnemyNameLabel(ctx, pos.x, pos.y, ENEMY_NAMES[enemy.type]);
  }
}

function drawEnemyNameLabel(ctx: CanvasRenderingContext2D, cx: number, cy: number, name: string) {
  ctx.save();
  ctx.font = 'bold 17px "Comic Sans MS", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const metrics = ctx.measureText(name);
  const padX = 6, padY = 4;
  const boxW = metrics.width + padX * 2;
  const boxH = 21 + padY * 2;
  const boxX = cx - boxW / 2;
  const boxY = cy - 79 - boxH;

  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(name, cx, cy - 79);
  ctx.restore();
}

function getEnemyScreenPos(
  enemy: EnemyState,
  originX: number,
  originY: number,
  tileW: number,
  tileH: number,
  tileD: number,
  gap: number
): { x: number; y: number } {
  if (enemy.isHopping) {
    const from = tileToScreen(enemy.hopFrom.row, enemy.hopFrom.col, originX, originY, tileW, tileH, tileD, gap);
    const to = tileToScreen(enemy.hopTo.row, enemy.hopTo.col, originX, originY, tileW, tileH, tileD, gap);
    const p = enemy.hopProgress;
    const arcY = hopArcOffset(p, TIMING.ENEMY_HOP_ARC_PX);
    return {
      x: from.x + (to.x - from.x) * p,
      y: (from.y + tileH / 2) + ((to.y + tileH / 2) - (from.y + tileH / 2)) * p - arcY,
    };
  }
  const pos = tileToScreen(enemy.row, enemy.col, originX, originY, tileW, tileH, tileD, gap);
  return { x: pos.x, y: pos.y + tileH / 2 };
}

function drawHallucinator(ctx: CanvasRenderingContext2D, cx: number, cy: number, image: HTMLImageElement | null) {
  const size = 75;
  if (image) {
    ctx.drawImage(image, cx - size / 2, cy - size + 15, size, size);
  } else {
    // Fallback: simple circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,252,230,0.75)';
    ctx.fill();
    ctx.restore();
  }
}

function drawDataSilo(ctx: CanvasRenderingContext2D, cx: number, cy: number, image: HTMLImageElement | null) {
  const size = 75;
  if (image) {
    ctx.drawImage(image, cx - size / 2, cy - size + 15, size, size);
  } else {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 10, cy - size, 20, size);
    ctx.restore();
  }
}

function drawComplianceTroll(ctx: CanvasRenderingContext2D, cx: number, cy: number, image: HTMLImageElement | null) {
  const size = 75;
  if (image) {
    ctx.drawImage(image, cx - size / 2, cy - size + 15, size, size);
  } else {
    ctx.save();
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(cx - 10, cy - size, 20, size);
    ctx.restore();
  }
}

function drawLegacyGoblin(ctx: CanvasRenderingContext2D, cx: number, cy: number, image: HTMLImageElement | null) {
  const size = 75;
  if (image) {
    ctx.drawImage(image, cx - size / 2, cy - size + 15, size, size);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#A0916B';
    ctx.fill();
    ctx.restore();
  }
}

function drawContextGremlin(ctx: CanvasRenderingContext2D, cx: number, cy: number, image: HTMLImageElement | null) {
  const size = 75;
  if (image) {
    ctx.drawImage(image, cx - size / 2, cy - size + 15, size, size);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - size / 2, 10, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#84CC16';
    ctx.fill();
    ctx.restore();
  }
}


function drawEnemyFall(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  originX: number,
  originY: number,
  _now: number,
  tileW: number,
  tileH: number,
  tileD: number,
  gap: number,
  hallucinatorImage: HTMLImageElement | null = null,
  legacyGoblinImage: HTMLImageElement | null = null,
  datasiloImage: HTMLImageElement | null = null,
  contextGremlinImage: HTMLImageElement | null = null,
  complianceTrollImage: HTMLImageElement | null = null
) {
  const p = enemy.fallProgress;
  if (p >= 1) return;

  // Fall starts from the off-board hop destination
  const { x, y } = tileToScreen(enemy.hopTo.row, enemy.hopTo.col, originX, originY, tileW, tileH, tileD, gap);
  const startX = x;
  const startY = y + tileH / 2;

  // Quadratic gravity drop, tumble, fade out at the end
  const fallY = startY + 600 * p * p;
  const tumble = p * Math.PI * 4;
  const alpha = p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(startX, fallY);
  ctx.rotate(tumble);

  // Draw the actual enemy character at (0, 0) within the translated context
  switch (enemy.type) {
    case EnemyType.Hallucinator:   drawHallucinator(ctx, 0, 0, hallucinatorImage); break;
    case EnemyType.DataSilo:       drawDataSilo(ctx, 0, 0, datasiloImage); break;
    case EnemyType.ComplianceTroll: drawComplianceTroll(ctx, 0, 0, complianceTrollImage); break;
    case EnemyType.LegacyGoblin:   drawLegacyGoblin(ctx, 0, 0, legacyGoblinImage); break;
    case EnemyType.ContextGremlin: drawContextGremlin(ctx, 0, 0, contextGremlinImage); break;
    default: {
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#6B7280';
      ctx.fill();
    }
  }

  ctx.restore();
}

