/**
 * Deck construction and shuffling. Kept separate from game state so it can be
 * tested in isolation and reused (e.g. when reshuffling a fresh deck mid-game).
 */
import type { GameConfig } from './config';
import type { Rng } from './random';
import { TILE_TYPES, tileTypeId, type Tile } from './tiles';

/** Fisher–Yates shuffle. Pure: returns a new array, randomness is injected. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Build one fresh, unshuffled deck (34 types × `copiesPerType`). `uid`s are
 * generated from a running sequence so every physical tile is unique across the
 * whole game, including decks added on reshuffle. Returns the next free seq.
 */
export function buildDeck(
  startSeq: number,
  config: GameConfig,
): { tiles: Tile[]; nextSeq: number } {
  const tiles: Tile[] = [];
  let seq = startSeq;
  for (const type of TILE_TYPES) {
    const typeId = tileTypeId(type);
    for (let copy = 0; copy < config.copiesPerType; copy += 1) {
      tiles.push({ uid: `t${seq.toString()}`, typeId });
      seq += 1;
    }
  }
  return { tiles, nextSeq: seq };
}
