import { motion } from 'framer-motion';
import { getTileType, tileLabel, type TileTypeId } from '../engine/tiles';
import { tileGlyph } from './tileGlyph';

const SIZES = {
  sm: {
    box: 'h-14 w-10 rounded-md',
    glyph: 'text-2xl',
    badge: 'h-4 w-4 text-[9px] -right-1 -top-1',
  },
  md: { box: 'h-28 w-20 rounded-xl', glyph: 'text-6xl', badge: 'h-7 w-7 text-sm -right-2 -top-2' },
} as const;

export interface TileProps {
  readonly typeId: TileTypeId;
  readonly value: number;
  readonly size?: keyof typeof SIZES;
  /** When true, the value badge pops to draw attention (it just changed). */
  readonly changed?: boolean;
}

/** A single Mahjong tile: glyph + a value badge. */
export function Tile({ typeId, value, size = 'md', changed = false }: TileProps) {
  const type = getTileType(typeId);
  const isSpecial = type.kind !== 'number';
  const s = SIZES[size];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, rotateX: -35 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: -18, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`relative flex ${s.box} select-none items-center justify-center border border-tile-edge bg-tile shadow-lg shadow-black/30`}
      aria-label={`${tileLabel(type)}, value ${value.toString()}`}
    >
      <span className={`tile-glyph ${s.glyph} text-neutral-800`}>{tileGlyph(typeId)}</span>
      <motion.span
        key={value}
        initial={changed ? { scale: 1.7 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 16 }}
        className={`absolute ${s.badge} flex items-center justify-center rounded-full font-bold text-white shadow ${
          isSpecial ? 'bg-gold text-felt-900 ring-2 ring-white/70' : 'bg-neutral-700'
        }`}
      >
        {value}
      </motion.span>
    </motion.div>
  );
}
