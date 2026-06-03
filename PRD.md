# Joule-Bert — Product Requirements Document

**Version**: 1.0  
**Date**: 2026-05-28  
**Status**: Draft  
**Audience**: Engineering, Design, Joule Studio stakeholders

---

## 1. Purpose & Context

Joule-Bert is a browser-based easter egg game for the SAP Joule Studio team. It is a faithful clone of the 1982 Q*Bert arcade game, fully re-skinned in the visual and conceptual language of SAP's Joule Business AI Platform. The game is meant to be discovered — embedded in an internal tool, shared as a URL, or slipped into a Joule Studio demo — and playable instantly in any modern browser with no install.

The name is a portmanteau of **Joule** (SAP's AI assistant and the platform context) and **Q*Bert** (the source game). The star glyph is preserved: **Joule-Bert** is always written with a hyphen.

---

## 2. Goals

| Goal | Description |
|---|---|
| **Delight** | Produce a genuine smile from any Joule Studio colleague who stumbles across it |
| **Recognizability** | The Q*Bert formula should be immediately legible even to casual players |
| **On-brand** | Visual design must feel native to the Joule/SAP identity — not clip-art, not generic |
| **Instant play** | Zero friction — no login, no install, no tutorial required to start playing |
| **Insider reward** | Enemy names and lore reward people who work in the agentic AI space |

### Non-Goals (v1)
- Multiplayer
- Persistent high-score leaderboard (session score only)
- Sound effects / music
- Mobile/touch controls
- SAP SSO or user authentication

---

## 3. Source Game Reference: Q*Bert

Understanding the original mechanics is essential for building Joule-Bert faithfully.

### 3.1 Board
Q*Bert is played on an isometric pyramid of cubes arranged in a triangular grid. The standard board has **7 rows** (row 1 at the top with 1 cube, row 7 at the bottom with 7 cubes), for a total of **28 cubes**. The pyramid floats in black space.

```
    [1]
   [2][3]
  [4][5][6]
 [7][8][9][10]
...
```

Each cube has a **top face**, a **left face**, and a **right face** rendered in the isometric view.

### 3.2 Movement
The player character sits on top of a cube and jumps diagonally in one of four directions:
- **Up-Left** (Q key / ←↑)
- **Up-Right** (W key / →↑)
- **Down-Left** (A key / ←↓)
- **Down-Right** (S key / →↓)

Each jump lands on an adjacent cube. Jumping off the edge of the pyramid kills the player. Movement is turn-based per jump — the game does not advance until the player acts (except for enemies moving on a timer).

### 3.3 Tile Activation
Each cube starts in an **unactivated** state. When the player lands on a cube, it transitions toward **activated**. In later levels, cubes require **two hops** to fully activate (intermediate state exists). The objective is to activate every cube on the board.

### 3.4 Enemies
Enemies spawn at the top of the pyramid and hop downward. They follow different movement rules:
- Some wander randomly
- Some chase the player
- Some follow patrol paths

Collision with an enemy kills the player. The player cannot kill enemies directly — they must be avoided.

### 3.5 Escape Discs
Two floating discs appear on the left and right sides of the pyramid at various row positions. The player can jump onto a disc from the edge of the board. The disc then animates upward and teleports the player to the top of the pyramid. Discs are consumed on use and respawn after a delay. In Q*Bert, luring the coil-snake enemy (Coily) off the board via a disc is the primary way to score big.

### 3.6 Lives & Death
The player starts with **3 lives**. A life is lost by:
- Falling off the edge of the pyramid
- Colliding with an enemy on the same tile

Game over when all lives are exhausted. Between lives, a brief death animation plays.

### 3.7 Scoring (original reference)
- Activating a tile: **25 pts**
- Re-activating a tile that was reset: **25 pts**
- Catching a green ball (bonus item): **100 pts**
- Luring Coily off the board: **500 pts**
- Completing a level: **Level bonus**

---

## 4. Joule-Bert Game Design

### 4.1 Board — The Joule Platform Pyramid

The game board is an isometric pyramid of **platform tiles** styled after the layered hexagonal grid in the SAP Business AI Platform diagram.

#### Dimensions by level

| Level | Rows | Total Tiles | Notes |
|---|---|---|---|
| 1 | 4 | 10 | Tutorial scale |
| 2 | 5 | 15 | Mid scale |
| 3 | 6 | 21 | Standard scale |
| 4+ | 7 | 28 | Full Q*Bert scale |

Each tile is rendered as a 3D isometric cube. The three visible faces use distinct shades of the same color family so depth reads clearly:
- **Top face**: lightest
- **Left face**: mid-tone
- **Right face**: darkest

#### Tile States

| State | Name | Top Face Color | Description |
|---|---|---|---|
| 0 | Unvisited | `#1E1E3A` deep navy | Default — the platform is "offline" |
| 1 | Activating | `#6B4FBB` soft purple | Player has landed once (levels where 2 hops needed) |
| 2 | Activated | `#A78BFA` bright violet | Joule-activated — the "on" state |
| — | Frozen | `#4B5563` cool grey | Set by Compliance Troll; player cannot activate while frozen |
| — | Corrupted | `#F97316` amber warning | Set by Hallucinator; counts as unactivated |

Left and right faces use `0.6×` and `0.4×` lightness of the top face color respectively.

Tile transitions play a brief **pulse glow** CSS animation when state changes.

#### Escape Nodes (BTP Cloud Nodes)
Two floating tiles appear at fixed positions on the left and right flanks of the pyramid, one per side, at approximately row 2–3 height. These are styled as **SAP BTP cloud connector nodes** — small rounded-rectangle platforms with a faint cloud-outline icon. When the player jumps onto one, it animates up and over to the top-of-pyramid entry point, consuming the disc. A new node respawns at that position after 8 seconds.

---

### 4.2 Player Character — Joule-Bert

**Visual description**: A faceted gemstone — specifically a diamond/brilliant cut viewed from a 3/4 isometric angle. Uses the Joule brand jewel as reference: deep purple-to-blue gradient fill, bright specular highlight on the top facet, subtle violet glow/bloom around the base. Approximately 60% of tile width in size.

**Animation states**:
- **Idle**: Gentle float bob (2px up/down, 1.5s cycle)
- **Hop**: Parabolic arc between tiles, 180ms duration, slight squash on landing
- **Death**: Shatter into fragments, fragments fall off screen, 600ms
- **Victory (level clear)**: Spin + scale-up pulse, 400ms

**Input mapping**:

| Key | Arrow alternative | Direction |
|---|---|---|
| `Q` | `↑` + `←` | Up-Left |
| `W` | `↑` + `→` | Up-Right |
| `A` | `↓` + `←` | Down-Left |
| `S` | `↓` + `→` | Down-Right |

Arrow key usage: single arrow key press maps to the nearest diagonal. `↑` alone = Up-Right, `←` alone = Up-Left, `↓` alone = Down-Left, `→` alone = Down-Right (standard Q*Bert arrow mapping).

Movement is **queued**: a keypress during an ongoing hop queues the next hop and executes immediately on landing.

---

### 4.3 Enemies — The AI Gremlins

All enemies spawn at or near the top of the pyramid and move downward on a timer. Enemy movement is independent of player input — they hop on their own tick (see Section 4.6 for timing).

#### 4.3.1 The Hallucinator
- **Represents**: LLM hallucination / confabulation
- **Visual**: A wispy, translucent blob with text artifacts floating around it — random words and percentages visible inside its body (e.g. "97% confident", "definitely true")
- **Color**: Washed-out white/cream with faint rainbow shimmer
- **Behavior**: Moves randomly — on each tick picks one of the four diagonal directions at uniform random, ignores board edges (falls off freely and respawns)
- **Effect on tiles**: When The Hallucinator lands on an activated tile, it **corrupts** it (sets it to the Corrupted state — amber). The player must re-activate corrupted tiles.
- **Introduced**: Level 1

#### 4.3.2 The Data Silo
- **Represents**: Disconnected enterprise data sources
- **Visual**: A stocky grey cylinder with a padlock icon, rendered isometrically — looks like a database drum with no doors
- **Color**: Slate grey (`#475569`) with a rust-orange padlock
- **Behavior**: Moves in a slow, straight diagonal path from top to bottom-left or bottom-right. Does not change direction. Falls off the bottom and respawns at the top after 4 seconds.
- **Effect on tiles**: When The Data Silo passes over an activated tile, it **reverts** it one state (activated → activating → unvisited). Acts like a slow bulldozer.
- **Introduced**: Level 2

#### 4.3.3 The Compliance Troll
- **Represents**: Overzealous governance and compliance friction
- **Visual**: A squat, stern-faced bureaucrat figure in a hard hat, carrying a giant red stamp ("BLOCKED"). Renders as a cartoon character in the Joule color palette.
- **Color**: Red (`#DC2626`) accent on the stamp, navy suit
- **Behavior**: **Actively chases Joule-Bert** — on each tick, calculates the direction that reduces Manhattan distance to the player and moves that way. If two directions are equally good, picks randomly between them.
- **Effect on tiles**: When The Compliance Troll lands on a tile, it **freezes** it (Frozen state) for 5 seconds. Frozen tiles cannot be activated until they thaw.
- **Speed**: Moves at 0.8× Joule-Bert's hop interval
- **Introduced**: Level 2

#### 4.3.4 The Legacy Goblin
- **Represents**: Outdated legacy system dependencies
- **Visual**: An old desktop computer monitor with legs, running in a shuffling gait. Screen shows the blue-screen-of-death or a DOS prompt blinking cursor.
- **Color**: Beige/putty (`#D4C5A9`) with a blue monitor screen
- **Behavior**: Follows a **fixed patrol path** — oscillates left-right across the pyramid in a predictable zigzag. Never deviates. This predictability is intentional: experienced players can time it.
- **Effect on tiles**: None on tiles. Pure collision hazard.
- **Special**: The Legacy Goblin is the hardest to eliminate — it does not fall off the board and never respawns; it simply keeps patrolling for the entire level.
- **Introduced**: Level 3

#### 4.3.5 The Context Gremlin
- **Represents**: Short context windows / lost memory in agents
- **Visual**: A small, manic creature with huge eyes and tiny hands, holding its head in confusion. Question marks orbit it.
- **Color**: Bright yellow-green (`#84CC16`) 
- **Behavior**: Moves **erratically** — alternates between 3 random hops and 1 "reset" action. On reset, it teleports to a random tile on the pyramid (not the player's current tile). 
- **Effect on tiles**: When The Context Gremlin teleports, it **resets the color of 2–3 random activated tiles** back to unvisited.
- **Introduced**: Level 3

#### 4.3.6 The Dependency Chain (Coily equivalent)
- **Represents**: Cascading dependency failures in distributed systems
- **Visual**: A chain of interlocked chain-link icons that grows as it descends — starts as 1 link at the top, grows to 5 links. Rendered as a sinuous line of metallic chain links.
- **Color**: Gunmetal grey with orange rust highlights
- **Behavior**: Begins coiled at the top and **uncoils**, hopping down one link at a time. Once fully uncoiled (all 5 links on the board), it **locks on to Joule-Bert** and chases aggressively (same algorithm as Compliance Troll but at 1.0× player speed — unavoidable without an escape node).
- **Special mechanic**: If Joule-Bert uses a BTP Cloud Node (escape disc) while The Dependency Chain is on an adjacent tile, The Dependency Chain follows the jump and **falls off the board**, scoring **500 bonus points**. This is the primary high-score mechanic.
- **Introduced**: Level 4 (one per level from level 4 onward)

---

### 4.4 Bonus Items

| Item | Visual | Effect | Points |
|---|---|---|---|
| **Insight Orb** | Floating teal sphere with sparkle | Collect for bonus points | 100 pts |
| **API Token** | Small golden key icon | Temporarily freezes all enemies for 3 seconds | 250 pts |
| **Model Update** | Purple download arrow | Converts all corrupted/reverted tiles to activated instantly | 300 pts |

Bonus items appear randomly on tiles for 5 seconds, then disappear. They spawn at most once every 15 seconds per level.

---

### 4.5 Scoring

| Action | Points |
|---|---|
| Activate a tile (first hop, 1-hop levels) | 25 |
| Advance a tile to activating state (first hop, 2-hop levels) | 10 |
| Activate a tile (second hop, 2-hop levels) | 25 |
| Re-activate a corrupted/reverted tile | 25 |
| Collect Insight Orb | 100 |
| Collect API Token | 250 |
| Collect Model Update | 300 |
| Lure Dependency Chain off board with escape node | 500 |
| Clear level without losing a life | Level × 200 bonus |
| Clear level | Row count × 50 |

Score is displayed prominently at the top of the screen. A **hi-score** is stored in `localStorage` and persists across browser sessions.

---

### 4.6 Timing & Physics

All movement uses a **discrete hop model** — characters are either resting on a tile or mid-hop. No continuous physics.

| Parameter | Value |
|---|---|
| Joule-Bert hop duration | 180 ms |
| Joule-Bert hop arc height | 40 px above tile midpoint |
| Enemy base tick interval | 600 ms (time between enemy hops) |
| Compliance Troll tick interval | 750 ms (slightly slower than player max cadence) |
| Dependency Chain tick (locked-on) | 600 ms |
| Frozen tile duration | 5 000 ms |
| Escape node respawn delay | 8 000 ms |
| Bonus item visibility window | 5 000 ms |
| Bonus item spawn cooldown | 15 000 ms |

Enemy tick intervals decrease with level number: `tickInterval = baseInterval × (1 - 0.05 × (level - 1))`, floored at 300 ms.

---

### 4.7 Level Progression

#### Level Structure

| Level | Rows | Tile hops needed | Enemies present | Enemy speed multiplier |
|---|---|---|---|---|
| 1 | 4 | 1 | Hallucinator | 1.0× |
| 2 | 5 | 1 | Hallucinator, Data Silo, Compliance Troll | 1.0× |
| 3 | 6 | 2 | All except Dependency Chain | 1.05× |
| 4 | 7 | 2 | All including Dependency Chain | 1.10× |
| 5+ | 7 | 2 | All; tiles reset on 30s timer | 1.15× + 0.05× per level |

#### Level Start Sequence
1. Board assembles tile-by-tile from top to bottom with a staggered cascade animation (each row fades in 80 ms after the previous)
2. "LEVEL X" text displays for 1.5 seconds in large Joule-brand typography
3. Joule-Bert appears at the top tile with the idle bob animation
4. Enemies appear at the top with a 2-second stagger (they do not begin moving until Joule-Bert's first input)

#### Level Clear Sequence
1. All tiles pulse with a bright full-board victory flash (300 ms)
2. Level clear bonus score tallies up on screen (500 ms)
3. Board dissolves tile-by-tile (reverse of assembly)
4. "JOULE ONLINE" text appears in Joule brand font
5. Next level assembles

#### Game Over
1. Death animation plays on final life
2. Score displayed with hi-score comparison
3. "PLAY AGAIN" button resets to level 1

---

### 4.8 HUD Layout

```
┌─────────────────────────────────────────────────────┐
│  SCORE: 000000        LEVEL: 01      HI: 000000      │
│  ♦ ♦ ♦  (lives)                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│                   [GAME BOARD]                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Q/W/A/S or Arrow Keys to move    [PAUSE]           │
└─────────────────────────────────────────────────────┘
```

- **Score**: top-left, monospace font
- **Level**: top-center
- **Hi-Score**: top-right (loaded from localStorage)
- **Lives**: row below score, small Joule jewel icons
- **Controls hint**: bottom bar, fades after first move
- **Pause**: `ESC` or `P` key; pauses all timers and enemy movement

---

## 5. Visual Design Specification

### 5.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--joule-bg` | `#0A0A1A` | Game background, outer space |
| `--joule-tile-off` | `#1E1E3A` | Unvisited tile top face |
| `--joule-tile-activating` | `#6B4FBB` | Activating tile top face |
| `--joule-tile-on` | `#A78BFA` | Activated tile top face |
| `--joule-tile-frozen` | `#4B5563` | Frozen tile |
| `--joule-tile-corrupt` | `#F97316` | Corrupted tile |
| `--joule-player` | `#8B5CF6` | Joule-Bert base color |
| `--joule-glow` | `#C4B5FD` | Glow/bloom color |
| `--joule-text` | `#F5F3FF` | UI text |
| `--joule-accent` | `#2DD4BF` | Teal accent (BTP nodes, special effects) |

### 5.2 Typography

- **Game title / level text**: Bold, large, all-caps sans-serif (Inter or system-ui fallback)
- **Score / HUD**: Monospace (`'Courier New'`, `monospace`)
- **Enemy name tooltips**: Small, italic, `--joule-text` at 70% opacity

### 5.3 Isometric Rendering

The board is rendered on an **HTML5 Canvas** element. Isometric projection uses a standard 2:1 width-to-height ratio for tile faces:

- **Tile width** (top face, widest diagonal): `64px`
- **Tile height** (top face, shortest diagonal): `32px`
- **Tile depth** (left/right face height): `20px`

Isometric coordinate to screen pixel mapping:
```
screenX = originX + (col - row) × (tileWidth / 2)
screenY = originY + (col + row) × (tileHeight / 2) + row × tileDepth
```

Board origin (`originX`, `originY`) is calculated to center the pyramid in the canvas.

### 5.4 Character Rendering

Characters are rendered as **canvas draw calls** (not sprites) to keep the bundle small. Each character is a `draw(ctx, x, y, animState)` function that uses canvas path/arc/bezier primitives.

Joule-Bert specifically: drawn as a multi-faceted polygon with gradient fill to simulate the gemstone facets. Six visible faces: top (brightest), four side facets (gradient from `--joule-player` to darker), and a subtle base shadow ellipse.

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|---|---|
| UI framework | React 18, functional components + hooks |
| Rendering | HTML5 Canvas (game board + characters) |
| Styling | CSS Modules or Tailwind (HUD only) |
| State management | `useReducer` + `useContext` (no Redux) |
| Build tool | Vite |
| Language | TypeScript |
| Persistence | `localStorage` (hi-score only) |

### 6.2 Module Structure

```
src/
  game/
    engine/
      gameLoop.ts       # requestAnimationFrame loop, delta-time
      boardModel.ts     # Tile grid data model, coordinate transforms
      physics.ts        # Hop arc calculations, collision detection
      scoring.ts        # Score rules
    entities/
      player.ts         # Joule-Bert state + movement logic
      enemies/
        hallucinator.ts
        dataSilo.ts
        complianceTroll.ts
        legacyGoblin.ts
        contextGremlin.ts
        dependencyChain.ts
      bonusItem.ts
    levels/
      levelConfig.ts    # Level definitions (rows, enemies, timing)
      levelManager.ts   # Level progression state machine
  renderer/
    boardRenderer.ts    # Canvas draw: tiles
    playerRenderer.ts   # Canvas draw: Joule-Bert
    enemyRenderer.ts    # Canvas draw: all enemy types
    effectRenderer.ts   # Canvas draw: particles, glows, tile pulses
    hudRenderer.ts      # React component: score, lives, level
  hooks/
    useGameInput.ts     # Keyboard event handling, input queue
    useGameLoop.ts      # rAF loop hook
    useLocalStorage.ts  # Hi-score persistence
  components/
    GameCanvas.tsx      # Canvas mount + renderer orchestration
    HUD.tsx             # Score/lives/level overlay
    StartScreen.tsx     # Title screen
    GameOverScreen.tsx  # Game over + restart
  App.tsx
```

### 6.3 Game Loop

```
requestAnimationFrame(tick)
  → update(deltaTime)
      → processInputQueue()        // apply queued player hop
      → updatePlayerAnimation()    // advance hop arc
      → tickEnemies(elapsed)       // move enemies on interval
      → checkCollisions()          // player vs enemy, player vs bonus
      → updateTileEffects(elapsed) // frozen timers, corruption decay
      → checkLevelClear()
  → render(ctx)
      → clearCanvas()
      → drawBoard()                // tiles back-to-front
      → drawEscapeNodes()
      → drawBonusItems()
      → drawEnemies()
      → drawPlayer()
      → drawEffects()              // particles, glows
```

### 6.4 Coordinate System

The board uses a **2D grid coordinate** `(row, col)` where row 0 is the top tile. Valid positions satisfy `0 ≤ col ≤ row`. The four diagonal moves map as:

| Direction | Δrow | Δcol |
|---|---|---|
| Up-Left | -1 | -1 |
| Up-Right | -1 | 0 |
| Down-Left | +1 | 0 |
| Down-Right | +1 | +1 |

A position is off-board if row < 0, col < 0, col > row, or row ≥ numRows. Off-board moves trigger death (or escape node catch if an escape node occupies that position).

### 6.5 Collision Detection

All collision checks are **tile-occupancy based** — a collision occurs when two entities occupy the same `(row, col)` at the end of a hop, or when a mid-hop arc passes through the same tile center as an enemy (checked at the 50% arc point). The latter prevents passing-through bugs at high speed.

---

## 7. Accessibility & UX

- **Pause at any time**: `ESC` or `P` — freezes all game state
- **Reduced motion**: respects `prefers-reduced-motion` — character hops become instant snaps, tile transitions are instant color changes
- **Color blind consideration**: tile states also differentiated by top-face icon (small symbol) not just color — unvisited (empty), activating (•), activated (✦)
- **Font size**: HUD text minimum 14px
- **Focus management**: game canvas is focusable; keyboard events captured at canvas level

---

## 8. Out of Scope (v1)

| Feature | Notes |
|---|---|
| Sound effects / music | v2 — would add significantly to bundle |
| Mobile touch controls | v2 — needs virtual D-pad or swipe mapping |
| Persistent leaderboard | v2 — requires backend |
| Multiplayer | Not planned |
| SAP SSO / BTP deployment | Out of scope |
| Accessibility: screen reader play | Not feasible for a canvas game; pause/mute sufficient |

---

## 9. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Should The Compliance Troll visually reference any specific SAP product persona, or stay abstract? | Design | Before visual pass |
| 2 | Is the `Q/W/A/S` control scheme intuitive enough, or should we default to arrow keys? | UX | Playtesting |
| 3 | Level 5+ tile reset timer — does 30 seconds feel right or too punishing? | Design/PM | Playtesting |
| 4 | Should escape nodes have a visual indicator showing remaining respawn time? | Design | Before implementation |
| 5 | Hi-score localStorage key namespace — avoid collisions with any existing Joule Studio app storage? | Engineering | Before implementation |

---

## 10. Success Metrics

Since this is an easter egg with no analytics infrastructure, success is qualitative:

- At least one spontaneous Slack message from a colleague sharing the link
- No crashes on first play in Chrome, Firefox, Safari
- A Joule design team member says "this looks like us"
- Playable start-to-finish in under 2 minutes for a new player

---

*This document is the source of truth for v1 implementation. Changes to mechanics or visual spec should be reflected here before coding begins.*
