/**
 * Tile domain model.
 *
 * A **tile type** is one of the 34 distinct Mahjong identities. A **tile** is a
 * physical instance drawn from the deck (there are several copies of each type).
 *
 * Values are tracked per *type* (decision D2): all copies of a Red Dragon share
 * one value. Whether a value can change is governed by a per-type **value policy**
 * (decision D11), so making any tile dynamic/static is a config change — see
 * `config.ts`.
 */
import type { GameConfig } from './config';

export type TileKind = 'number' | 'dragon' | 'wind';
export type Suit = 'bamboo' | 'characters' | 'circles';
export type DragonKind = 'red' | 'green' | 'white';
export type WindKind = 'east' | 'south' | 'west' | 'north';

export interface NumberTileType {
  readonly kind: 'number';
  readonly suit: Suit;
  readonly rank: number; // 1..9
}
export interface DragonTileType {
  readonly kind: 'dragon';
  readonly dragon: DragonKind;
}
export interface WindTileType {
  readonly kind: 'wind';
  readonly wind: WindKind;
}
export type TileType = NumberTileType | DragonTileType | WindTileType;

/** Stable identity string for a tile type, e.g. `dragon:red`, `number:bamboo:3`. */
export type TileTypeId = string;

/** A physical tile instance: a unique id plus the identity it represents. */
export interface Tile {
  readonly uid: string;
  readonly typeId: TileTypeId;
}

/**
 * How a tile type's value behaves (the extensibility seam — see §5.1).
 * A dynamic policy is self-contained: it carries its own starting `base` and the
 * `min`/`max` bounds that double as the game-over limits.
 */
export type ValuePolicy =
  | { readonly kind: 'static' }
  | { readonly kind: 'dynamic'; readonly base: number; readonly min: number; readonly max: number };

/** `typeId -> current value`, holding an entry for every *dynamic* tile type. */
export type ValueMap = Record<TileTypeId, number>;

export const SUITS: readonly Suit[] = ['bamboo', 'characters', 'circles'];
export const DRAGONS: readonly DragonKind[] = ['red', 'green', 'white'];
export const WINDS: readonly WindKind[] = ['east', 'south', 'west', 'north'];

export function tileTypeId(type: TileType): TileTypeId {
  switch (type.kind) {
    case 'number':
      return `number:${type.suit}:${type.rank.toString()}`;
    case 'dragon':
      return `dragon:${type.dragon}`;
    case 'wind':
      return `wind:${type.wind}`;
  }
}

/** All 34 distinct tile identities. */
export const TILE_TYPES: readonly TileType[] = [
  ...SUITS.flatMap((suit) =>
    Array.from({ length: 9 }, (_, i): NumberTileType => ({ kind: 'number', suit, rank: i + 1 })),
  ),
  ...DRAGONS.map((dragon): DragonTileType => ({ kind: 'dragon', dragon })),
  ...WINDS.map((wind): WindTileType => ({ kind: 'wind', wind })),
];

const TILE_TYPES_BY_ID = new Map<TileTypeId, TileType>(
  TILE_TYPES.map((type) => [tileTypeId(type), type]),
);

export function getTileType(typeId: TileTypeId): TileType {
  const type = TILE_TYPES_BY_ID.get(typeId);
  if (type === undefined) {
    throw new Error(`Unknown tile type: ${typeId}`);
  }
  return type;
}

/** The value policy for a tile type, read from config (keyed by tile kind). */
export function policyFor(type: TileType, config: GameConfig): ValuePolicy {
  return config.valuePolicies[type.kind];
}

/**
 * Base value before any dynamic scaling. Number tiles use their intrinsic face
 * value (rank); dynamic tiles use the `base` declared in their policy.
 */
export function baseValueFor(type: TileType, config: GameConfig): number {
  if (type.kind === 'number') {
    return type.rank;
  }
  const policy = policyFor(type, config);
  if (policy.kind === 'dynamic') {
    return policy.base;
  }
  throw new Error(`A static non-number tile has no base value: ${type.kind}`);
}

export function isDynamic(typeId: TileTypeId, config: GameConfig): boolean {
  return policyFor(getTileType(typeId), config).kind === 'dynamic';
}

/** Initial value map: one entry per dynamic tile type, set to its base value. */
export function initialValues(config: GameConfig): ValueMap {
  const values: ValueMap = {};
  for (const type of TILE_TYPES) {
    if (policyFor(type, config).kind === 'dynamic') {
      values[tileTypeId(type)] = baseValueFor(type, config);
    }
  }
  return values;
}

/** Resolve a tile's current value: static types use their base, dynamic types the map. */
export function tileValue(typeId: TileTypeId, values: ValueMap, config: GameConfig): number {
  const type = getTileType(typeId);
  if (policyFor(type, config).kind === 'static') {
    return baseValueFor(type, config);
  }
  return values[typeId];
}

/** Human-readable label, used for accessibility and debugging. */
export function tileLabel(type: TileType): string {
  switch (type.kind) {
    case 'number':
      return `${type.rank.toString()} of ${type.suit}`;
    case 'dragon':
      return `${type.dragon} dragon`;
    case 'wind':
      return `${type.wind} wind`;
  }
}
