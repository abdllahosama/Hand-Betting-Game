import type { Bet, HistoryEntry, RoundResult } from '../engine/game';
import { Tile } from './Tile';

interface HistoryProps {
  readonly history: readonly HistoryEntry[];
}

const OUTCOME_STYLE: Record<RoundResult, { label: string; cls: string }> = {
  win: { label: 'WIN', cls: 'bg-win/20 text-win' },
  loss: { label: 'LOSS', cls: 'bg-lose/20 text-lose' },
  push: { label: 'PUSH', cls: 'bg-white/10 text-white/60' },
};

function OutcomeChip({ outcome, bet }: { outcome: RoundResult; bet: Bet }) {
  const o = OUTCOME_STYLE[outcome];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${o.cls}`}>
      {bet === 'higher' ? '↑' : '↓'} {o.label}
    </span>
  );
}

/** Horizontal strip of previously played hands (newest first). */
export function History({ history }: HistoryProps) {
  if (history.length === 0) {
    return <p className="py-3 text-center text-sm text-white/40">No hands played yet.</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {history.map((entry) => (
        <div
          key={entry.round}
          className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl bg-black/20 p-2.5 ring-1 ring-white/5"
        >
          <div className="flex gap-1">
            {entry.tiles.map((tile, i) => (
              <Tile
                key={`${entry.round.toString()}-${i.toString()}`}
                typeId={tile.typeId}
                value={tile.value}
                size="sm"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white/80">{entry.total}</span>
            <OutcomeChip outcome={entry.outcome} bet={entry.bet} />
          </div>
        </div>
      ))}
    </div>
  );
}
