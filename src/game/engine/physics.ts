export function hopArcOffset(progress: number, arcHeight: number): number {
  // Parabola: 0 at progress=0, arcHeight at progress=0.5, 0 at progress=1
  return -4 * arcHeight * progress * (progress - 1);
}

export function isOffBoard(row: number, col: number, numRows: number): boolean {
  return row < 0 || col < 0 || col > row || row >= numRows;
}

// Lerp between two screen positions
export function lerpScreenPos(
  fromX: number, fromY: number,
  toX: number, toY: number,
  progress: number
): { x: number; y: number } {
  return {
    x: fromX + (toX - fromX) * progress,
    y: fromY + (toY - fromY) * progress,
  };
}
