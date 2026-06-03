# Joule-Bert — Implementation Specification

**Version**: 1.0  
**Date**: 2026-05-28  
**Source documents**: intent.md, PRD.md  

---

## 1. Project Bootstrap

### 1.1 Scaffold

```bash
npm create vite@latest joule-bert -- --template react-ts
cd joule-bert
npm install
```

No additional runtime dependencies. Dev-only: none required beyond Vite defaults.

### 1.2 Directory layout (final target)

```
joule-bert/
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    styles/
      global.css           # CSS custom properties (color tokens), font imports
    game/
      engine/
        gameLoop.ts
        boardModel.ts
        physics.ts
        scoring.ts
      entities/
        player.ts
        enemies/
          hallucinator.ts
          dataSilo.ts
          complianceTroll.ts
          legacyGoblin.ts
          contextGremlin.ts
          dependencyChain.ts
        bonusItem.ts
      levels/
        levelConfig.ts
        levelManager.ts
    renderer/
      boardRenderer.ts
      playerRenderer.ts
      enemyRenderer.ts
      effectRenderer.ts
    hooks/
      useGameInput.ts
      useGameLoop.ts
      useLocalStorage.ts
    components/
      GameCanvas.tsx
      HUD.tsx
      StartScreen.tsx
      GameOverScreen.tsx
```

### 1.3 CSS tokens (global.css)

Define all color tokens as CSS custom properties on `:root`:

```css
:root {
  --joule-bg: #0A0A1A;
  --joule-tile-off: #1E1E3A;
  --joule-tile-activating: #6B4FBB;
  --joule-tile-on: #A78BFA;
  --joule-tile-frozen: #4B5563;
  --joule-tile-corrupt: #F97316;
  --joule-player: #8B5CF6;
  --joule-glow: #C4B5FD;
  --joule-text: #F5F3FF;
  --joule-accent: #2DD4BF;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--joule-bg); color: var(--joule-text); font-family: system-ui, sans-serif; overflow: hidden; }
```

---

## 2. Data Models

### 2.1 `game/engine/boardModel.ts`

#### `TileState` enum

```ts
export enum TileState {
  Unvisited = 0,
  Activating = 1,
  Activated = 2,
  Frozen = 3,
  Corrupted = 4,
}
```

#### `Tile` interface

```ts
export interface Tile {
  row: number;
  col: number;
  state: TileState;
  frozenUntil: number | null;   // timestamp ms, null if not frozen
  frozenPrevState: TileState | null;
}
```

#### `BoardModel` class

```ts
export class BoardModel {
  rows: number;
  tiles: Tile[][];         // tiles[row][col], valid when 0 <= col <= row

  constructor(rows: number)
  getTile(row: number, col: number): Tile | null
  isValidPosition(row: number, col: number): boolean
  isOffBoard(row: number, col: number): boolean   // out of bounds
  allActivated(): boolean  // returns true when every tile.state === Activated
  activatedCount(): number
  reset(): void
}
```

#### Isometric coordinate transform

```ts
export function tileToScreen(
  row: number,
  col: number,
  originX: number,
  originY: number,
  tileW = 64,
  tileH = 32,
  tileD = 20
): { x: number; y: number } {
  return {
    x: originX + (col - row) * (tileW / 2),
    y: originY + (col + row) * (tileH / 2) + row * tileD,
  };
}
```

`originX` and `originY` are computed each render to center the pyramid in the canvas.

#### Board origin calculation

```ts
export function computeOrigin(
  numRows: number,
  canvasW: number,
  canvasH: number,
  tileW = 64,
  tileH = 32,
  tileD = 20
): { originX: number; originY: number }
```

The widest point (bottom row) has width `numRows * tileW`. The pyramid total height is approximately `numRows * (tileH/2 + tileD)`. Center accordingly, leaving ~120px at top for HUD.

---

### 2.2 `game/entities/player.ts`

```ts
export interface PlayerState {
  row: number;
  col: number;
  lives: number;
  isHopping: boolean;
  hopProgress: number;   // 0.0 → 1.0 during hop animation
  hopFrom: { row: number; col: number };
  hopTo: { row: number; col: number };
  animState: 'idle' | 'hopping' | 'dead' | 'victory';
  deathProgress: number;    // 0.0 → 1.0 during death animation
  victoryProgress: number;
  queuedDirection: Direction | null;
}

export type Direction = 'UL' | 'UR' | 'DL' | 'DR';

export const DIRECTION_DELTA: Record<Direction, { dRow: number; dCol: number }> = {
  UL: { dRow: -1, dCol: -1 },
  UR: { dRow: -1, dCol: 0 },
  DL: { dRow: +1, dCol: 0 },
  DR: { dRow: +1, dCol: +1 },
};
```

---

### 2.3 Enemy base interface (`game/entities/enemies/`)

```ts
export interface EnemyState {
  id: string;              // unique per instance
  type: EnemyType;
  row: number;
  col: number;
  isHopping: boolean;
  hopProgress: number;
  hopFrom: { row: number; col: number };
  hopTo: { row: number; col: number };
  lastTickTime: number;    // timestamp of last movement
  alive: boolean;          // false when fallen off board
  respawnAt: number | null; // timestamp to respawn, null if permanent
  // per-type extra state in discriminated union subtypes
}

export enum EnemyType {
  Hallucinator = 'hallucinator',
  DataSilo = 'dataSilo',
  ComplianceTroll = 'complianceTroll',
  LegacyGoblin = 'legacyGoblin',
  ContextGremlin = 'contextGremlin',
  DependencyChain = 'dependencyChain',
}
```

Each enemy file exports:
- `createEnemy(id, boardRows): EnemyState` — factory
- `tick(enemy, board, player, now): EnemyState` — pure function returning updated state
- `onLand(enemy, tile, board): { board: BoardModel, enemy: EnemyState }` — side effects on tile

---

### 2.4 `game/entities/bonusItem.ts`

```ts
export enum BonusItemType {
  InsightOrb = 'insightOrb',       // 100 pts
  APIToken = 'apiToken',           // 250 pts + freeze all enemies 3s
  ModelUpdate = 'modelUpdate',     // 300 pts + convert all corrupt/reverted tiles
}

export interface BonusItem {
  id: string;
  type: BonusItemType;
  row: number;
  col: number;
  spawnedAt: number;     // timestamp
  expiresAt: number;     // spawnedAt + 5000
}
```

---

### 2.5 Escape nodes

```ts
export interface EscapeNode {
  side: 'left' | 'right';
  row: number;               // fixed per level, approximately row 2
  col: number;               // left side: col = -1 (off-board left), right side: col = row+1
  active: boolean;
  respawnAt: number | null;  // timestamp, null when active
  animating: boolean;        // true while ascending animation plays
  animProgress: number;
}
```

Left escape node is visually to the left of the leftmost tile in its row. Right escape node is visually to the right of the rightmost tile in its row. Their screen position is derived from the adjacent tile's screen position offset by one tile width.

---

### 2.6 Full game state

```ts
export interface GameState {
  phase: GamePhase;
  level: number;
  score: number;
  hiScore: number;
  board: BoardModel;
  player: PlayerState;
  enemies: EnemyState[];
  escapeNodes: EscapeNode[];
  bonusItems: BonusItem[];
  lastBonusSpawn: number;
  levelClearBonus: number;
  tileResetTimer: number | null;  // for level 5+, ms since last reset
  allEnemiesFrozenUntil: number | null;  // APIToken effect
  levelStartTime: number;
  perfectLevel: boolean;          // no life lost this level
}

export enum GamePhase {
  Title = 'title',
  LevelIntro = 'levelIntro',
  Playing = 'playing',
  Paused = 'paused',
  PlayerDead = 'playerDead',
  LevelClear = 'levelClear',
  GameOver = 'gameOver',
}
```

---

## 3. Game Engine

### 3.1 `game/engine/physics.ts`

#### Hop arc

```ts
export function hopArcOffset(progress: number, arcHeight: number): number {
  // parabola: 0 at progress=0, arcHeight at progress=0.5, 0 at progress=1
  return -4 * arcHeight * progress * (progress - 1);
}
```

`arcHeight = 40` for player, `32` for enemies.

#### Mid-hop collision point

Check collision at `progress = 0.5` (arc midpoint) for the player hop. If the player's midpoint `(row, col)` matches any enemy's current tile, trigger death.

#### Off-board detection

```ts
export function isOffBoard(row: number, col: number, numRows: number): boolean {
  return row < 0 || col < 0 || col > row || row >= numRows;
}
```

An escape node occupies a virtual off-board position. Before triggering death, check if the target position matches an active escape node.

---

### 3.2 `game/engine/gameLoop.ts`

`useGameLoop` hook drives a `requestAnimationFrame` loop. It receives:
- `update(deltaMs: number, now: number): void`
- `render(ctx: CanvasRenderingContext2D): void`

The hook:
1. Stores `prevTime` in a ref.
2. On each frame: computes `delta = now - prevTime`, calls `update(delta, now)`, then `render(ctx)`.
3. Clamps `delta` to `100 ms` maximum to prevent physics jumps after tab switch.
4. Cancels `rAF` on unmount.

---

### 3.3 `game/engine/scoring.ts`

```ts
export function scoreTileActivation(prevState: TileState, newState: TileState, hopsNeeded: number): number
export function scoreCollectBonus(type: BonusItemType): number
export function scoreLureDependencyChain(): number  // 500
export function scoreLevelClear(rows: number): number  // rows * 50
export function scorePerfectLevel(level: number): number  // level * 200
```

---

### 3.4 `game/levels/levelConfig.ts`

```ts
export interface LevelConfig {
  level: number;
  rows: number;
  hopsNeeded: 1 | 2;
  enemyTypes: EnemyType[];
  enemySpeedMultiplier: number;
  tileResetInterval: number | null;  // ms, null = no reset; 30000 for level 5+
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, rows: 4, hopsNeeded: 1, enemyTypes: [EnemyType.Hallucinator], enemySpeedMultiplier: 1.0, tileResetInterval: null },
  { level: 2, rows: 5, hopsNeeded: 1, enemyTypes: [EnemyType.Hallucinator, EnemyType.DataSilo, EnemyType.ComplianceTroll], enemySpeedMultiplier: 1.0, tileResetInterval: null },
  { level: 3, rows: 6, hopsNeeded: 2, enemyTypes: [EnemyType.Hallucinator, EnemyType.DataSilo, EnemyType.ComplianceTroll, EnemyType.LegacyGoblin, EnemyType.ContextGremlin], enemySpeedMultiplier: 1.05, tileResetInterval: null },
  { level: 4, rows: 7, hopsNeeded: 2, enemyTypes: [EnemyType.Hallucinator, EnemyType.DataSilo, EnemyType.ComplianceTroll, EnemyType.LegacyGoblin, EnemyType.ContextGremlin, EnemyType.DependencyChain], enemySpeedMultiplier: 1.10, tileResetInterval: null },
  // Level 5+: generated dynamically — rows: 7, hopsNeeded: 2, all enemies, tileResetInterval: 30000, speedMultiplier: 1.15 + 0.05*(level-5)
];

export function getLevelConfig(level: number): LevelConfig
```

---

### 3.5 `game/levels/levelManager.ts`

State machine driving `GamePhase` transitions:

```
Title
  → (keypress/click) → LevelIntro (level 1)

LevelIntro  (1.5s board assembly + "LEVEL X" text)
  → (animation done) → Playing

Playing
  → (all tiles activated) → LevelClear
  → (lives === 0) → GameOver
  → (ESC/P) → Paused

Paused
  → (ESC/P) → Playing

PlayerDead  (600ms death anim)
  → (lives > 0) → Playing (respawn at top)
  → (lives === 0) → GameOver

LevelClear  (300ms flash + 500ms tally + dissolve + "JOULE ONLINE" + assemble)
  → (animation done) → LevelIntro (level + 1)

GameOver
  → (PLAY AGAIN) → Title (reset all state)
```

---

## 4. Enemy Behaviour Detail

### 4.1 Hallucinator

- **Tick**: Pick uniform-random from `[UL, UR, DL, DR]`. Compute target. If off-board, fall (set `alive = false`, schedule respawn 3s).
- **onLand**: If tile is `Activated`, set to `Corrupted`.
- **Spawn position**: Top tile `(0, 0)`.
- **Respawn**: Re-spawn at `(0, 0)`.

### 4.2 Data Silo

- **Initial direction**: Randomly chosen at spawn: either straight `DR` path or `DL` path.
- **Tick**: Always move in its chosen direction. If off-board, `alive = false`, respawn 4s.
- **onLand**: If tile is `Activated`, revert to `Activating`. If `Activating`, revert to `Unvisited`.
- **Speed**: Base tick interval (no special multiplier).

### 4.3 Compliance Troll

- **Tick interval**: `750ms × (1 / speedMultiplier)`.
- **Chase algorithm**: Compute `dRow = player.row - troll.row`, `dCol = player.col - troll.col`. Try the direction that reduces Manhattan distance most. On tie, pick randomly. If chosen direction is off-board, pick the other reducing direction. If all reducing directions are off-board, pick any on-board direction.
- **onLand**: Set tile to `Frozen`; record `frozenUntil = now + 5000` and `frozenPrevState`.
- **Thaw**: Handled in `updateTileEffects()` — when `now >= frozenUntil`, restore tile to `frozenPrevState`.

### 4.4 Legacy Goblin

- **Patrol path**: Hardcoded per board size. For a 6-row board: starts at `(2, 1)`, moves `DR` until hitting the right edge, then `DL` until hitting the left edge, repeat. Never falls off. The patrol row band spans rows 2–(numRows-2).
- **onLand**: No tile effect. Pure collision hazard.
- **Special**: Does not respawn; survives the entire level.

### 4.5 Context Gremlin

- **State**: Tracks `hopCount` (0–2) and `isResetting: boolean`.
- **Tick**: If `hopCount < 3`, pick random direction, hop. If off-board, fall+respawn. Increment `hopCount`. When `hopCount === 3`, execute reset: teleport to a random `(row, col)` not occupied by player; reset 2–3 random `Activated` tiles to `Unvisited`; set `hopCount = 0`.
- **Respawn**: 3s after falling.

### 4.6 Dependency Chain

- **State**:
  ```ts
  interface DependencyChainState extends EnemyState {
    linksOnBoard: number;   // 1 to 5
    lockedOn: boolean;
    segments: Array<{ row: number; col: number }>;  // head to tail
  }
  ```
- **Phases**:
  - **Coiling** (`linksOnBoard < 5`): Each tick, the head moves downward (alternating DL/DR). Each new tile adds a link. `linksOnBoard` increments.
  - **Locked on** (`linksOnBoard === 5`, `lockedOn = true`): Head chases player using same algorithm as Compliance Troll. Moves at `600ms` interval. Each tick, tail segment is removed and new head position added.
- **Escape mechanic**: When player activates an escape node while the Dependency Chain's head is on an adjacent tile (distance ≤ 1 tile), the chain falls off — `alive = false`, no respawn, score += 500.
- **onLand**: No tile effect. Collision only.

---

## 5. Bonus Item System

In `updateBonusItems(state, now)`:
1. Remove expired items (`now >= item.expiresAt`).
2. If `now - lastBonusSpawn >= 15000` and no item currently on board, spawn one:
   - Pick a random `(row, col)` on the board not occupied by player or enemy.
   - Pick item type with weights: InsightOrb 60%, APIToken 25%, ModelUpdate 15%.
   - Set `spawnedAt = now`, `expiresAt = now + 5000`.
3. Collision with player (`player.row === item.row && player.col === item.col` on landing):
   - Add score.
   - If APIToken: set `allEnemiesFrozenUntil = now + 3000`.
   - If ModelUpdate: iterate board, convert all `Corrupted` and `Activating` tiles to `Activated`, add score for each.
   - Remove item.

---

## 6. Input Handling

### 6.1 `hooks/useGameInput.ts`

```ts
const KEY_DIRECTION_MAP: Record<string, Direction> = {
  KeyQ: 'UL',
  KeyW: 'UR',
  KeyA: 'DL',
  KeyS: 'DR',
  ArrowLeft: 'UL',
  ArrowUp: 'UR',
  ArrowDown: 'DL',
  ArrowRight: 'DR',
};
```

- Attach `keydown` listener to `window`.
- On directional key: push to a `queueRef` (max queue depth: 1 — only store the most recent unprocessed direction, discard older).
- On `Escape` or `KeyP`: toggle pause.
- `consumeInput(): Direction | null` — pops and returns the queued direction, called once per update tick.

### 6.2 Input consumption in game loop

`processInputQueue()`:
1. If `player.isHopping`, store direction in `player.queuedDirection` (overwrite).
2. If not hopping:
   - If `player.queuedDirection !== null`, use it and clear queue.
   - Else call `consumeInput()`.
3. On direction consumed: compute `targetRow/Col`. If valid on-board tile, begin hop. If escape node position, trigger escape node use. If off-board (no escape node), trigger death.

---

## 7. Renderer

All drawing is pure canvas — no DOM manipulation inside the game loop.

### 7.1 `renderer/boardRenderer.ts`

Draw tiles back-to-front (top row first, within row left to right). Each tile call:

```ts
function drawTile(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  state: TileState,
  pulseProgress: number,   // 0–1 for glow animation
  tileW = 64,
  tileH = 32,
  tileD = 20
): void
```

**Top face**: diamond polygon with vertices at `(screenX, screenY)`, `(screenX + tileW/2, screenY + tileH/2)`, `(screenX, screenY + tileH)`, `(screenX - tileW/2, screenY + tileH/2)`. Fill color from state.

**Left face**: parallelogram from bottom-left of top face down by `tileD`. Color = `0.6×` lightness of top face color.

**Right face**: parallelogram from bottom-right of top face down by `tileD`. Color = `0.4×` lightness of top face color.

**Accessibility symbol** (centered on top face):
- Unvisited: nothing
- Activating: `•` (small circle, 4px radius)
- Activated: `✦` (4-point star, drawn with canvas paths)
- Frozen: snowflake-like cross
- Corrupted: `!` exclamation mark

**Pulse glow**: When a tile just changed state, animate a radial gradient overlay expanding outward over 300ms. Track per-tile `pulseAt: number` timestamp in renderer state (not game state).

### 7.2 `renderer/playerRenderer.ts`

```ts
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,     // includes hop arc offset
  animState: PlayerState['animState'],
  progress: number,    // hop or death progress
  reduceMotion: boolean
): void
```

**Gemstone shape** (Joule-Bert):
1. Draw a base shadow ellipse at `screenY + 2` (semi-transparent black).
2. Draw the gem as an octagon approximation: top point, upper-left/right facets, widest mid-points, lower-left/right facets, bottom point.
3. Fill top facet with `#C4B5FD` (bright highlight).
4. Fill remaining facets with radial gradient from `#8B5CF6` (center) to `#4C1D95` (edges).
5. Add a small specular highlight: white ellipse at top-left of gem, opacity 0.6.
6. During **idle**: apply `sin(Date.now() / 750) * 2` vertical offset (float bob, clamped when `prefers-reduced-motion`).
7. During **death**: scatter 8 triangular fragments with randomized velocities (deterministic via seeded random from death timestamp). Fragments fade to transparent over `deathProgress`.
8. During **victory**: apply `scale = 1 + 0.2 * sin(victoryProgress * Math.PI * 3)` and `rotation = victoryProgress * Math.PI * 2`.

### 7.3 `renderer/enemyRenderer.ts`

One `draw(ctx, x, y, enemy)` function that dispatches by `enemy.type`:

#### Hallucinator
- Translucent `rgba(255,255,240,0.7)` blob using bezier curve roughly circular, slightly wobbly (driven by `Date.now()`).
- Render 3 floating text fragments (`"97% confident"`, `"definitely true"`, `"✓ verified"`) in tiny 8px monospace, scattered within a 20px radius, opacity 0.5.
- Subtle rainbow shimmer: `ctx.globalCompositeOperation = 'screen'` overlay with a rotating hue gradient.

#### Data Silo
- Isometric cylinder approximation: top ellipse `(20×10 px)` in `#475569`, a rectangle body `(20×24px)` same color, bottom ellipse.
- Padlock icon: small `12×14px` rounded rectangle (shackle arc + body) in `#EA580C` (rust orange), centered on cylinder.

#### Compliance Troll
- Squat humanoid: circle head (`12px`), rectangular body (`16×18px`), short legs.
- Hard hat: semi-circular arc in `#FCD34D` on head.
- Giant stamp: `24×14px` red rectangle labeled `"BLOCKED"` in 7px bold white text, held to the right.
- Color: `#1E3A5F` navy suit.

#### Legacy Goblin
- Monitor box: `28×22px` rounded rectangle in `#D4C5A9` (beige).
- Screen inset: `20×14px` in `#1D4ED8` (blue), containing `"C:\> _"` blinking cursor (blink period 800ms from `Date.now()`).
- Stick legs below monitor, shuffling animation driven by `hopProgress`.

#### Context Gremlin
- Small egg-shaped body in `#84CC16`.
- Two oversized circular eyes with black pupils.
- Tiny hands pressed to sides of head.
- Orbiting question marks: 2 `?` characters rotating on a 20px radius at `Date.now() / 1000` rad/s, 11px font.

#### Dependency Chain
- Render `linksOnBoard` chain links from tail to head.
- Each link: `12×8px` oval with a smaller oval cutout (chain link shape) in `#6B7280` (gunmetal).
- Rust highlight: `#F97316` dots scattered on alternating links.
- Head link: slightly larger, glowing orange when `lockedOn`.

### 7.4 `renderer/effectRenderer.ts`

- **Tile pulse glow**: `ctx.shadowBlur = 20; ctx.shadowColor = '#A78BFA'` briefly after state change.
- **Frozen thaw**: expanding ring of `#4B5563` particles when tile unfreezes.
- **Victory flash**: white overlay rect with opacity `1 - progress`, covering entire canvas.
- **Board assembly / dissolve**: Each tile has a staggered start time. During assembly, scale from 0 to 1 over 120ms per tile. During dissolve, reverse.
- **Escape node lift animation**: Node translates from its flank position to the top-of-pyramid entry point over 600ms along a bezier arc.
- **Dependency Chain fall**: When lured off board, chain segments animate downward with gravity (accelerating Y offset) and fade out.

### 7.5 Escape node rendering

```ts
function drawEscapeNode(ctx, screenX, screenY, active, animating, animProgress): void
```

- Shape: `36×22px` rounded rectangle (corner radius 8).
- Fill: `#0A0A1A` with `--joule-accent` (`#2DD4BF`) border (2px).
- Cloud icon: three overlapping circles (simplified cloud) in `#2DD4BF` centered in the rectangle.
- When inactive: desaturate + show a progress arc around the border indicating respawn countdown (optional enhancement from PRD open question #4).
- When animating: translate along precomputed bezier from flank position to `(0, 0)` screen position of the top tile.

---

## 8. React Components

### 8.1 `App.tsx`

```tsx
function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.Title);
  return (
    <div className="app-root">
      {gamePhase === GamePhase.Title && <StartScreen onStart={...} />}
      <GameCanvas visible={gamePhase !== GamePhase.Title && gamePhase !== GamePhase.GameOver} />
      {gamePhase === GamePhase.GameOver && <GameOverScreen score={...} hiScore={...} onRestart={...} />}
    </div>
  );
}
```

The `GameCanvas` component owns the full game state internally via `useReducer`. It passes phase changes up via callbacks.

### 8.2 `components/GameCanvas.tsx`

- Mounts a `<canvas>` element; stores ref.
- Instantiates initial `GameState` on mount.
- Uses `useGameLoop` to run `update` and `render` each frame.
- Uses `useGameInput` for keyboard handling.
- Uses `useLocalStorage('joule-bert:hiscore', 0)` — namespaced key to avoid collisions.
- Renders `<HUD>` overlaid (absolute positioned over canvas) as a React component.
- Canvas dimensions: fills `window.innerWidth × window.innerHeight`, handles `resize` event.

### 8.3 `components/HUD.tsx`

Pure React component, positioned absolute over canvas, pointer-events none (so clicks pass through to canvas).

```
top: 0, left: 0, width: 100%, height: 80px
```

Layout:
```
[ SCORE: 000000 ]    [ LEVEL: 01 ]    [ HI: 000000 ]
[ ♦ ♦ ♦ ]
```

- Score and hi-score: `font-family: 'Courier New', monospace; font-size: 16px; color: var(--joule-text)`.
- Jewel icons: drawn as tiny `<svg>` inline icons using the gemstone path (8-vertex polygon, purple fill).
- After player's first input, controls hint at bottom fades out (CSS transition on opacity, driven by `hasMovedOnce` state).

### 8.4 `components/StartScreen.tsx`

Full-screen overlay:
- Title: `"JOULE-BERT"` in 72px bold all-caps, `--joule-text` color, with `text-shadow: 0 0 30px #8B5CF6`.
- Subtitle: `"A Q*Bert love letter for Joule Studio"` in 18px italic.
- Press any key / click to play prompt: blinking at 1s interval.
- Background: animated starfield (CSS keyframe animation on `::before` pseudo-element with radial-gradient background, or simple canvas starfield).

### 8.5 `components/GameOverScreen.tsx`

Full-screen overlay:
- `"GAME OVER"` heading.
- Final score and hi-score display.
- New hi-score banner if applicable.
- `"PLAY AGAIN"` button (keyboard: Enter or Space).

---

## 9. State Management Pattern

`GameCanvas` uses `useReducer<GameState, GameAction>`. Actions:

```ts
type GameAction =
  | { type: 'TICK'; deltaMs: number; now: number }
  | { type: 'INPUT'; direction: Direction }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'RESTART' }
  | { type: 'LEVEL_ADVANCE' }
  | { type: 'PLAYER_RESPAWN' };
```

The `TICK` action is dispatched from the game loop and handles all time-based updates (enemy movement, frozen tile timers, animation progress, bonus item spawning, tile reset timer). All game logic lives in pure reducer functions — the canvas render reads from `state` refs updated after each dispatch.

**Important**: Because `useReducer` is async (state updates are batched), the renderer should read from a `stateRef = useRef(state)` that is kept in sync via `useEffect(() => { stateRef.current = state; }, [state])`. The render function reads from `stateRef.current` synchronously.

---

## 10. Implementation Steps (Ordered)

### Phase 1 — Scaffold & Static Board (no gameplay)
1. Bootstrap Vite + TypeScript project.
2. Implement `boardModel.ts`: `Tile`, `BoardModel`, `tileToScreen`, `computeOrigin`.
3. Implement `boardRenderer.ts`: Draw static pyramid with all five tile states represented (hard-code a test board).
4. Implement `GameCanvas.tsx`: mount canvas, call `computeOrigin`, draw board in a single `useEffect`.
5. Implement `global.css` with all color tokens.
6. Verify pyramid renders centered and pixel-perfect in browser at 1280×720.

### Phase 2 — Player Movement
7. Implement `player.ts` state model.
8. Implement `physics.ts`: `hopArcOffset`, `isOffBoard`.
9. Implement `useGameInput.ts`: keydown listener, direction queue.
10. Implement `useGameLoop.ts`: rAF loop hook.
11. Implement `playerRenderer.ts`: draw Joule-Bert gem (static first, no animation).
12. Wire `GameCanvas` to run game loop: process input → update player position → render board + player.
13. Implement hop arc animation (`hopProgress` 0→1 over 180ms).
14. Implement tile activation on landing (Unvisited → Activating → Activated per level config).
15. Implement off-board death (trigger `PlayerDead` phase, decrement lives).
16. Implement player idle bob animation.
17. Implement death shatter animation.

### Phase 3 — Level Flow & HUD
18. Implement `levelConfig.ts` and `levelManager.ts`.
19. Implement `HUD.tsx`: score, lives (jewel icons), level display.
20. Implement level intro sequence (board assembly animation + "LEVEL X" text).
21. Implement level clear detection (`allActivated()`) and level clear sequence.
22. Implement `scoring.ts` with all point rules.
23. Implement `useLocalStorage.ts` and hi-score persistence.
24. Implement `StartScreen.tsx` and `GameOverScreen.tsx`.
25. Implement pause (`ESC`/`P`) — freeze all timers and enemy movement.

### Phase 4 — Enemies
26. Implement `hallucinator.ts`: random movement, tile corruption on landing.
27. Implement `dataSilo.ts`: straight-path movement, tile reversion on landing.
28. Implement `complianceTroll.ts`: chase algorithm, tile freezing, thaw timer.
29. Implement `legacyGoblin.ts`: patrol path, no tile effect.
30. Implement `contextGremlin.ts`: 3-hop + teleport reset pattern.
31. Implement `dependencyChain.ts`: uncoil phase + lock-on chase phase.
32. Implement `enemyRenderer.ts` with all six enemy draw functions.
33. Integrate enemies into game loop: tick on interval, render, collision detection with player.
34. Implement enemy speed scaling by level.

### Phase 5 — Escape Nodes
35. Define escape node positions per level.
36. Implement escape node rendering (BTP cloud node visual).
37. Implement player landing on escape node → lift animation → teleport to top.
38. Implement Dependency Chain lure mechanic (500 pts).
39. Implement node respawn timer (8s).

### Phase 6 — Bonus Items
40. Implement `bonusItem.ts` data model.
41. Implement bonus item spawn logic (random tile, 15s cooldown, 5s visibility).
42. Implement bonus item renderer (InsightOrb: teal sphere, APIToken: golden key, ModelUpdate: purple arrow).
43. Implement collection effects: APIToken freeze, ModelUpdate tile conversion.

### Phase 7 — Polish & Effects
44. Implement `effectRenderer.ts`: tile pulse glow on state change.
45. Implement victory flash on level clear.
46. Implement board dissolve animation on level end.
47. Implement "JOULE ONLINE" text between levels.
48. Implement frozen tile thaw particle ring.
49. Implement reduced-motion media query handling (instant snaps instead of animations).
50. Implement color-blind tile symbols (•, ✦, snowflake, !).
51. Implement controls hint fade after first move.
52. Implement level 5+ tile reset timer.

### Phase 8 — QA & Cross-browser
53. Test in Chrome, Firefox, Safari.
54. Verify hi-score localStorage namespacing (`joule-bert:hiscore`).
55. Audit for JS errors on edge cases: falling off during hop animation, pausing mid-hop, rapid key input.
56. Verify `prefers-reduced-motion` works.
57. Verify canvas resizes correctly on window resize.
58. Playtest all 4+ levels end-to-end.

---

## 11. Timing Constants (all in one place)

```ts
export const TIMING = {
  PLAYER_HOP_MS: 180,
  PLAYER_HOP_ARC_PX: 40,
  ENEMY_BASE_TICK_MS: 600,
  COMPLIANCE_TROLL_TICK_MS: 750,
  ENEMY_MIN_TICK_MS: 300,
  FROZEN_DURATION_MS: 5000,
  ESCAPE_NODE_RESPAWN_MS: 8000,
  BONUS_ITEM_VISIBLE_MS: 5000,
  BONUS_ITEM_COOLDOWN_MS: 15000,
  API_TOKEN_FREEZE_MS: 3000,
  ENEMY_RESPAWN_MS: 3000,
  DATA_SILO_RESPAWN_MS: 4000,
  LEVEL_INTRO_ROW_STAGGER_MS: 80,
  LEVEL_TITLE_DISPLAY_MS: 1500,
  ENEMY_INITIAL_STAGGER_MS: 2000,
  VICTORY_FLASH_MS: 300,
  SCORE_TALLY_MS: 500,
  TILE_RESET_INTERVAL_MS: 30000,   // level 5+
  DEATH_ANIM_MS: 600,
  VICTORY_ANIM_MS: 400,
  ESCAPE_NODE_LIFT_MS: 600,
} as const;
```

---

## 12. Open Questions (Resolved Defaults)

| # | Question | Default decision |
|---|---|---|
| 1 | Compliance Troll visual reference to specific SAP persona? | Abstract cartoon — navy suit + red stamp, no specific persona |
| 2 | Q/W/A/S vs arrow keys default? | Both active simultaneously; hint shows both |
| 3 | Level 5+ tile reset timer at 30s? | Ship at 30s, easy to tune via `TIMING` constant |
| 4 | Escape node respawn indicator? | Show progress arc around the node border (thin `--joule-accent` arc, clockwise) |
| 5 | localStorage key namespace? | `joule-bert:hiscore` — prefix avoids collisions |

---

## 13. Non-Functional Requirements

- **Bundle size**: No runtime dependencies beyond React 18. Target < 200 KB gzipped.
- **Frame rate**: Maintain 60 fps on a mid-range laptop (canvas draw calls only, no heavy compositing).
- **Load time**: < 1 second to interactive on a fast connection.
- **Browser support**: Chrome 110+, Firefox 115+, Safari 16+. No IE.
- **Canvas resolution**: Use `devicePixelRatio` for crisp rendering on HiDPI displays:
  ```ts
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ```
- **Embeddability**: The app should be servable as a static build from any web server or CDN with no backend.

---

*This spec is the authoritative implementation guide. It supersedes intent.md and PRD.md for engineering decisions. Design questions should be resolved against PRD.md section 5.*
