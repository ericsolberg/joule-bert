# Joule\*Bert: Intent Document

## Overview

**Joule\*Bert** is a browser-based React game — a love letter to the classic Q*Bert arcade game, reimagined for the SAP Joule / Joule Studio team as an easter egg. It takes the iconic isometric pyramid gameplay and skins it entirely in the visual language of SAP's Joule Business AI Platform.

---

## Concept

The classic Q*Bert formula: hop around an isometric pyramid of cubes, land on each cube to change its color, avoid enemies, and clear every cube to advance. Joule\*Bert keeps that loop intact but replaces every visual element with characters and metaphors from the SAP agentic AI world.

---

## Visual Style

The game world is inspired by the layered isometric 3D landscape from the SAP Business AI Platform strategy presentation — a grid of floating hexagonal/cube tiles arranged in a diamond formation, rendered in the Joule brand palette:

- **Blues and purples** — the cool base tones of the SAP Joule identity
- **Glowing accent highlights** — teal/violet, evoking the holographic Joule jewel
- **Isometric perspective** — the same 3/4-top-down view as Q*Bert, matching the strategy slide aesthetic
- **Tile states**: unvisited (dark blue/grey), visited (Joule purple/violet glow), fully cleared (bright Joule teal)

---

## Characters

### Joule\*Bert (the Player)
- **Visual**: The Joule "Jewel" — the faceted purple/blue gemstone from the center of the SAP Business AI Platform diagram
- **Movement**: Bounces diagonally between tiles in the classic Q*Bert hop style
- **Personality**: Brings intelligence and clarity to chaos (the enterprise)

### Enemies — Enterprise AI Gremlins
A cast of whimsical antagonists representing the real-world obstacles that haunt enterprise agentic AI deployments:

| Gremlin | Represents | Behavior |
|---|---|---|
| **The Hallucinator** | LLM hallucination / confabulation | Wanders randomly, leaves false color trails on tiles |
| **The Data Silo** | Disconnected enterprise data sources | Slow-moving blocker that reverses tile progress |
| **The Compliance Troll** | Overzealous governance/compliance friction | Chases Joule\*Bert, freezes tiles on contact |
| **The Legacy Goblin** | Outdated legacy system dependencies | Predictable patrol path, very hard to kill |
| **The Context Gremlin** | Lost context / short memory in agents | Bounces erratically, resets tile colors randomly |

---

## Gameplay Mechanics

- **Objective**: Hop on every tile in the pyramid to change it to the "Joule activated" color. Clear all tiles to complete the level.
- **Lives**: 3 lives (represented by 3 small Joule jewel icons)
- **Hazard**: Falling off the edge of the pyramid ends a life (just like Q*Bert)
- **Discs**: Floating "escape pods" on the sides of the pyramid let Joule\*Bert jump to safety — styled as SAP BTP (Business Technology Platform) cloud nodes
- **Coily equivalent**: A snake-like enemy (the **Dependency Chain**) that uncoils and chases Joul\*Bert specifically
- **Score**: Points for each tile activated, bonus for clearing the board without dying

---

## Level Progression

- **Level 1**: Small pyramid (4 rows), one enemy type (The Hallucinator), tiles need one hop
- **Level 2**: Medium pyramid (5 rows), two enemy types, tiles need two hops to fully activate
- **Level 3+**: Full pyramid (6 rows), all enemy types, tiles reset after a timer

Each level transition plays a short "Joule online" animation — the pyramid assembles itself from the layered platform diagram.

---

## Tech Stack

- **React** (functional components, hooks)
- **HTML5 Canvas** or **SVG** for the isometric game board
- **CSS animations** for character hops and tile state transitions
- **No external game engine** — pure React/canvas to keep it lightweight and embeddable
- **Keyboard controls**: arrow keys or WASD for movement (diagonal mapping to Q*Bert-style up-left, up-right, down-left, down-right)

---

## Tone & Purpose

This is an easter egg — it should feel like a delightful surprise for colleagues at Joule Studio. It's meant to be:

- **Fun and recognizable** — the Q*Bert DNA should be immediately obvious
- **Wink-and-nod** — the enemy names and metaphors reward people who live in the agentic AI space
- **Visually on-brand** — someone from the Joule design team should smile when they see it
- **Playable in a browser tab** in under 30 seconds with no install

---

## Out of Scope (v1)

- Multiplayer
- Mobile touch controls (nice to have for v2)
- Sound effects / music (nice to have)
- Persistent leaderboard
- SAP SSO integration
