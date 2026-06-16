/**
 * Maps a tile identity to its Unicode Mahjong Tiles glyph (U+1F000–U+1F021),
 * so the UI renders authentic tiles with zero image assets.
 */
import { getTileType, type TileTypeId } from '../engine/tiles';

const CHARACTERS_BASE = 0x1f007; // 🀇 "1 of characters"
const BAMBOO_BASE = 0x1f010; // 🀐 "1 of bamboo"
const CIRCLES_BASE = 0x1f019; // 🀙 "1 of circles"

const DRAGON_GLYPH: Record<'red' | 'green' | 'white', number> = {
  red: 0x1f004, // 🀄
  green: 0x1f005, // 🀅
  white: 0x1f006, // 🀆
};

const WIND_GLYPH: Record<'east' | 'south' | 'west' | 'north', number> = {
  east: 0x1f000, // 🀀
  south: 0x1f001, // 🀁
  west: 0x1f002, // 🀂
  north: 0x1f003, // 🀃
};

export function tileGlyph(typeId: TileTypeId): string {
  const type = getTileType(typeId);
  switch (type.kind) {
    case 'number': {
      const base =
        type.suit === 'characters'
          ? CHARACTERS_BASE
          : type.suit === 'bamboo'
            ? BAMBOO_BASE
            : CIRCLES_BASE;
      return String.fromCodePoint(base + (type.rank - 1));
    }
    case 'dragon':
      return String.fromCodePoint(DRAGON_GLYPH[type.dragon]);
    case 'wind':
      return String.fromCodePoint(WIND_GLYPH[type.wind]);
  }
}
