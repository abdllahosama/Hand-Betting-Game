# Hand Betting Game

A web-based **"Higher or Lower"** betting game played with **Mahjong tiles** — with a
twist: the special tiles (Dragons & Winds) change value as you win and lose, so the
deck's math drifts over the course of a session.

Built with React + TypeScript, a fully-typed pure game engine, and Tailwind CSS.

---

## How to play

1. You're shown a **hand** of 3 Mahjong tiles and its **total value**.
2. Bet whether the **next hand's total** will be **higher** or **lower**.
3. Every **Dragon/Wind** tile in a winning hand gains **+1**; in a losing hand it loses **−1**.
   (Number tiles are always worth their face value.)
4. The game ends when **any tile value reaches 0 or 10**, or the **draw pile runs out for the 3rd time**.
5. Score is **streak-weighted** — consecutive correct bets are worth more. Top 5 scores
   are saved to a local leaderboard.

---

## Getting started

### Prerequisites
- **Node.js 18+** (20+ recommended)
- npm

### Install & run
```bash
npm install      # installs dependencies and sets up git hooks
npm run dev      # start the dev server → http://localhost:5173
```

### Other scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server (HMR) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the engine unit tests (Vitest) |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

---

## Tech stack

- **React 18 + TypeScript** (strict mode)
- **Vite** — dev server & build
- **Tailwind CSS v4** — styling via CSS-first `@theme` tokens
- **Framer Motion** — tile/screen transitions
- **Vitest** — unit tests for the game engine
- **ESLint + Prettier + Husky** — a pre-commit gate that runs lint, type-check, and tests

### Packages

**Runtime dependencies**
| Package | Version | Role |
|---|---|---|
| `react` / `react-dom` | ^18.3.1 | UI library |
| `framer-motion` | ^11.11.17 | Animations & transitions |

**Dev dependencies**
| Package | Version | Role |
|---|---|---|
| `vite` | ^6.0.0 | Dev server & bundler |
| `@vitejs/plugin-react` | ^4.3.4 | React Fast Refresh for Vite |
| `typescript` | ^5.6.3 | Type system |
| `tailwindcss` / `@tailwindcss/vite` | ^4.0.0 | Styling (CSS-first config) |
| `vitest` | ^3.0.0 | Unit testing |
| `eslint` | ^9.39.4 | Linting |
| `typescript-eslint` | ^8.61.1 | Type-aware lint rules |
| `@eslint/js` | ^9.39.4 | ESLint recommended JS rules |
| `eslint-plugin-react-hooks` | ^5.2.0 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.26 | Fast Refresh lint rules |
| `eslint-config-prettier` | ^10.1.8 | Disables ESLint rules that conflict with Prettier |
| `prettier` | ^3.8.4 | Code formatting |
| `husky` | ^9.1.7 | Git hooks (pre-commit gate) |
| `lint-staged` | ^17.0.7 | Run linters on staged files |
| `globals` | ^15.15.0 | Global variable definitions for ESLint |
| `@types/react` / `@types/react-dom` | ^18.3 | React type definitions |
| `@types/node` | ^22.10.0 | Node type definitions |

> Versions reflect `package.json`; see `package-lock.json` for exact resolved versions.

---

## Architecture

The guiding principle: **all game rules live in a pure engine that knows nothing about
React or the DOM.** The UI is a thin layer that renders engine state and dispatches
actions. This keeps the rules fully unit-testable and makes the codebase easy to extend.

```
UI (React components) → state binding (useGame hook) → pure engine (TypeScript)
```

- **`src/engine/`** — pure, deterministic game logic (tiles, deck, reducer, scoring).
  Randomness is injected, so every rule is tested with a seeded PRNG.
- **`src/state/`** — React binding (`useGame`) + leaderboard persistence (localStorage).
- **`src/components/`** — the screens (Landing, Game, GameOver) and tile rendering.

A full write-up — rules, design decisions, diagrams, and extension points — is in
[`docs/technical-design.md`](docs/technical-design.md).

### Project structure
```
src/
├─ engine/        # Pure game logic (no React) — fully unit-tested
├─ state/         # React binding + localStorage leaderboard
├─ components/    # UI: Landing, Game, GameOver, Tile, Hand, History, Leaderboard
├─ App.tsx        # Screen router
└─ main.tsx       # Entry point
docs/
└─ technical-design.md
```

---

## Design notes

Some rules were left open by the brief and resolved with documented, configurable
defaults (hand size, value bounds, scoring, tie handling, etc.). All of them live in a
single [`config`](src/engine/config.ts) object, and tile value behaviour is governed by a
per-type **value policy** — so changing the rules (or making new tiles dynamic) is a data
change, not a code rewrite. See the decisions table in the technical design doc for the
full rationale.
