import { AnimatePresence } from 'framer-motion';
import type { TileTypeId } from '../engine/tiles';
import { Tile } from './Tile';

export interface HandTile {
  readonly key: string;
  readonly typeId: TileTypeId;
  readonly value: number;
  readonly changed?: boolean;
}

interface HandProps {
  readonly tiles: readonly HandTile[];
  readonly total: number;
  readonly label?: string;
}

/** The row of tiles making up a hand, with its total value beneath. */
export function Hand({ tiles, total, label = 'Hand total' }: HandProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end gap-3">
        <AnimatePresence mode="popLayout">
          {tiles.map((t) => (
            <Tile key={t.key} typeId={t.typeId} value={t.value} changed={t.changed} />
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-[0.2em] text-gold-soft/70">{label}</span>
        <span className="text-5xl font-black text-gold">{total}</span>
      </div>
    </div>
  );
}
