export const TileState = {
  Unvisited: 0,
  Activating: 1,
  Activated: 2,
  Frozen: 3,
  Corrupted: 4,
} as const;
export type TileState = typeof TileState[keyof typeof TileState];

export interface Tile {
  row: number;
  col: number;
  state: TileState;
  frozenUntil: number | null;
  frozenPrevState: TileState | null;
  pulseAt: number | null;
}

export class BoardModel {
  rows: number;
  tiles: Tile[][];

  constructor(rows: number) {
    this.rows = rows;
    this.tiles = [];
    for (let r = 0; r < rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c <= r; c++) {
        this.tiles[r][c] = {
          row: r,
          col: c,
          state: TileState.Unvisited,
          frozenUntil: null,
          frozenPrevState: null,
          pulseAt: null,
        };
      }
    }
  }

  getTile(row: number, col: number): Tile | null {
    if (!this.isValidPosition(row, col)) return null;
    return this.tiles[row][col];
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col <= row;
  }

  isOffBoard(row: number, col: number): boolean {
    return row < 0 || col < 0 || col > row || row >= this.rows;
  }

  allActivated(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= r; c++) {
        if (this.tiles[r][c].state !== TileState.Activated) return false;
      }
    }
    return true;
  }

  totalTiles(): number {
    return (this.rows * (this.rows + 1)) / 2;
  }

  reset(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= r; c++) {
        this.tiles[r][c].state = TileState.Unvisited;
        this.tiles[r][c].frozenUntil = null;
        this.tiles[r][c].frozenPrevState = null;
        this.tiles[r][c].pulseAt = null;
      }
    }
  }
}

export function tileToScreen(
  row: number,
  col: number,
  originX: number,
  originY: number,
  tileW = 64,
  tileH = 32,
  tileD = 20,
  gap = 0
): { x: number; y: number } {
  return {
    x: originX + (2 * col - row) * (tileW + gap) / 2,
    y: originY + row * (tileH / 2 + tileD + gap),
  };
}

export function computeOrigin(
  numRows: number,
  canvasW: number,
  canvasH: number,
  _tileW = 64,
  tileH = 32,
  tileD = 20,
  gap = 0
): { originX: number; originY: number } {
  const pyramidH = (numRows - 1) * (tileH / 2 + tileD + gap) + tileH + tileD;
  const hudHeight = 80;
  return {
    originX: canvasW / 2,
    originY: hudHeight + (canvasH - hudHeight - pyramidH) / 2,
  };
}
