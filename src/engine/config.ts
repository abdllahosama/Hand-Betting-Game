/**
 * Tunable game rules. Everything the spec left open (and a few authentic-Mahjong
 * choices) lives here so behaviour can change without touching engine logic —
 * see the decisions table (D1–D11) in docs/technical-design.md.
 */
import type { TileKind, ValuePolicy } from './tiles';

export interface GameConfig {
  /** Tiles per hand (D1). */
  readonly handSize: number;
  /** Copies of each tile type in one deck — 4 = authentic 136-tile set. */
  readonly copiesPerType: number;
  /** Game over once the draw pile is depleted this many times (D9). */
  readonly maxDrawDepletions: number;
  /** Points for a correct bet are `scoreBase * currentStreak` (D7). */
  readonly scoreBase: number;
  /** When true, a tie resolves as a loss; when false, as a no-op "push" (D5). */
  readonly tieIsLoss: boolean;
  /**
   * Value policy per tile kind — the single seam for making tiles dynamic or
   * static (D11). A dynamic policy carries its own `base` plus the `min`/`max`
   * bounds that double as the 0/10 game-over limits.
   */
  readonly valuePolicies: Readonly<Record<TileKind, ValuePolicy>>;
}

export const DEFAULT_CONFIG: GameConfig = {
  handSize: 3,
  copiesPerType: 4,
  maxDrawDepletions: 3,
  scoreBase: 10,
  tieIsLoss: true,
  valuePolicies: {
    number: { kind: 'static' },
    dragon: { kind: 'dynamic', base: 5, min: 0, max: 10 },
    wind: { kind: 'dynamic', base: 5, min: 0, max: 10 },
  },
};
