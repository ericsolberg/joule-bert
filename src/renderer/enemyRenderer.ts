import type { EnemyState, DependencyChainState } from '../game/entities/enemies/types';
import { EnemyType } from '../game/entities/enemies/types';

const ENEMY_NAMES: Record<EnemyType, string> = {
  [EnemyType.Hallucinator]: 'Hallucinator',
  [EnemyType.DataSilo]: 'Data Silo',
  [EnemyType.ComplianceTroll]: 'Compliance Troll',
  [EnemyType.LegacyGoblin]: 'Legacy Goblin',
  [EnemyType.ContextGremlin]: 'Context Gremlin',
  [EnemyType.DependencyChain]: 'Dependency Chain',
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
  gap = 0
) {
  if (enemy.isFalling) {
    drawEnemyFall(ctx, enemy, originX, originY, now, tileW, tileH, tileD, gap);
    return;
  }
  if (!enemy.alive) return;

  const pos = getEnemyScreenPos(enemy, originX, originY, tileW, tileH, tileD, gap);

  switch (enemy.type) {
    case EnemyType.Hallucinator:
      drawHallucinator(ctx, pos.x, pos.y, now);
      break;
    case EnemyType.DataSilo:
      drawDataSilo(ctx, pos.x, pos.y);
      break;
    case EnemyType.ComplianceTroll:
      drawComplianceTroll(ctx, pos.x, pos.y, now);
      break;
    case EnemyType.LegacyGoblin:
      drawLegacyGoblin(ctx, pos.x, pos.y, now, enemy.hopProgress);
      break;
    case EnemyType.ContextGremlin:
      drawContextGremlin(ctx, pos.x, pos.y, now);
      break;
    case EnemyType.DependencyChain:
      drawDependencyChain(ctx, enemy as DependencyChainState, originX, originY, now, tileW, tileH, tileD, gap);
      break;
  }

  if (enemy.introHops < 3) {
    drawEnemyNameLabel(ctx, pos.x, pos.y, ENEMY_NAMES[enemy.type]);
  }
}

function drawEnemyNameLabel(ctx: CanvasRenderingContext2D, cx: number, cy: number, name: string) {
  ctx.save();
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const metrics = ctx.measureText(name);
  const padX = 6, padY = 4;
  const boxW = metrics.width + padX * 2;
  const boxH = 15 + padY * 2;
  const boxX = cx - boxW / 2;
  const boxY = cy - 46 - boxH;

  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(name, cx, cy - 46);
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

function drawHallucinator(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number) {
  const t = now / 600;
  ctx.save();

  ctx.beginPath();
  const r = 14;
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const wobble = r + Math.sin(angle * 3 + t) * 3 + Math.cos(angle * 2 + t * 1.3) * 2;
    const px = cx + Math.cos(angle) * wobble;
    const py = (cy - 14) + Math.sin(angle) * wobble * 0.6;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,252,230,0.75)';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(200,180,255,0.5)';
  ctx.fill();

  const shimGrad = ctx.createRadialGradient(cx, cy - 14, 0, cx, cy - 14, 14);
  shimGrad.addColorStop(0, 'rgba(255,100,100,0.1)');
  shimGrad.addColorStop(0.5, 'rgba(100,255,100,0.1)');
  shimGrad.addColorStop(1, 'rgba(100,100,255,0.05)');
  ctx.fillStyle = shimGrad;
  ctx.fill();

  ctx.font = '6px monospace';
  ctx.fillStyle = 'rgba(150,130,80,0.7)';
  ctx.textAlign = 'center';
  const texts = ['97%', '✓', '??'];
  for (let i = 0; i < texts.length; i++) {
    const angle = (i / 3) * Math.PI * 2 + t * 0.5;
    const tx = cx + Math.cos(angle) * 18;
    const ty = (cy - 14) + Math.sin(angle) * 10;
    ctx.fillText(texts[i], tx, ty);
  }

  ctx.restore();
}

function drawDataSilo(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  const w = 20, bodyH = 24;
  const topY = cy - 28;

  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - w / 2, topY + 5, w, bodyH);

  ctx.beginPath();
  ctx.ellipse(cx, topY + 5, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#64748B';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, topY + 5 + bodyH, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();

  ctx.strokeStyle = '#EA580C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, topY + 14, 5, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#EA580C';
  ctx.fillRect(cx - 5, topY + 14, 10, 8);

  ctx.restore();
}

function drawComplianceTroll(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number) {
  ctx.save();
  const baseY = cy - 8;

  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect(cx - 8, baseY - 22, 16, 18);

  ctx.beginPath();
  ctx.arc(cx, baseY - 26, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#FBBF24';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, baseY - 30, 10, Math.PI, 0);
  ctx.fillStyle = '#FCD34D';
  ctx.fill();
  ctx.fillRect(cx - 12, baseY - 30, 24, 4);

  ctx.fillStyle = '#1E1E3A';
  ctx.beginPath(); ctx.arc(cx - 3, baseY - 27, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, baseY - 27, 2, 0, Math.PI * 2); ctx.fill();

  const bounce = Math.abs(Math.sin(now / 300)) * 3;
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx + 6, baseY - 20 - bounce, 22, 12);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BLOCK', cx + 17, baseY - 13 - bounce);

  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect(cx - 7, baseY - 4, 6, 8);
  ctx.fillRect(cx + 1, baseY - 4, 6, 8);

  ctx.restore();
}

function drawLegacyGoblin(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number, hopProgress: number) {
  ctx.save();
  const baseY = cy - 8;

  ctx.fillStyle = '#D4C5A9';
  roundRect(ctx, cx - 14, baseY - 30, 28, 22, 3);
  ctx.fill();

  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(cx - 10, baseY - 27, 20, 14);

  const blink = Math.floor(now / 400) % 2 === 0;
  ctx.fillStyle = '#93C5FD';
  ctx.font = '6px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(blink ? 'C:\\>_' : 'C:\\>', cx - 9, baseY - 17);

  const legOffset = Math.sin(hopProgress * Math.PI * 4) * 3;
  ctx.fillStyle = '#A0916B';
  ctx.fillRect(cx - 9, baseY - 8, 5, 10 + legOffset);
  ctx.fillRect(cx + 4, baseY - 8, 5, 10 - legOffset);

  ctx.restore();
}

function drawContextGremlin(ctx: CanvasRenderingContext2D, cx: number, cy: number, now: number) {
  ctx.save();
  const baseY = cy - 14;

  ctx.beginPath();
  ctx.ellipse(cx, baseY, 10, 13, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#84CC16';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#84CC16';
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 4, baseY - 3, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, baseY - 3, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx - 3, baseY - 3, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, baseY - 3, 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#5a8f0a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 10, baseY - 5); ctx.lineTo(cx - 6, baseY - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, baseY - 5); ctx.lineTo(cx + 6, baseY - 10); ctx.stroke();

  ctx.fillStyle = '#FACC15';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const orbitR = 20;
  for (let i = 0; i < 2; i++) {
    const angle = now / 1000 + i * Math.PI;
    ctx.fillText('?', cx + Math.cos(angle) * orbitR, baseY + Math.sin(angle) * orbitR * 0.5 - 3);
  }

  ctx.restore();
}

function drawDependencyChain(
  ctx: CanvasRenderingContext2D,
  enemy: DependencyChainState,
  originX: number,
  originY: number,
  _now: number,
  tileW: number,
  tileH: number,
  tileD: number,
  gap: number
) {
  if (!enemy.alive) return;

  ctx.save();
  const segments = enemy.segments;

  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const { x, y } = tileToScreen(seg.row, seg.col, originX, originY, tileW, tileH, tileD, gap);
    const drawY = y + tileH / 2 - 14;

    const isHead = i === 0;
    const isRust = i % 2 === 1;

    ctx.beginPath();
    ctx.ellipse(x, drawY, 12, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = isRust ? '#92400E' : '#4B5563';
    if (isHead && enemy.lockedOn) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#F97316';
    }
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, drawY, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawEnemyFall(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  originX: number,
  originY: number,
  now: number,
  tileW: number,
  tileH: number,
  tileD: number,
  gap: number
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
    case EnemyType.Hallucinator:   drawHallucinator(ctx, 0, 0, now); break;
    case EnemyType.DataSilo:       drawDataSilo(ctx, 0, 0); break;
    case EnemyType.ComplianceTroll: drawComplianceTroll(ctx, 0, 0, now); break;
    case EnemyType.LegacyGoblin:   drawLegacyGoblin(ctx, 0, 0, now, p); break;
    case EnemyType.ContextGremlin: drawContextGremlin(ctx, 0, 0, now); break;
    default: {
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#6B7280';
      ctx.fill();
    }
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
