import type { ScoreEntry } from '../state/leaderboard';

interface LeaderboardProps {
  readonly entries: readonly ScoreEntry[];
  /** Optional: highlight the row(s) matching this name (e.g. a just-saved score). */
  readonly highlightName?: string;
}

const RANK_COLOR = ['text-gold', 'text-neutral-300', 'text-amber-700'];

export function Leaderboard({ entries, highlightName }: LeaderboardProps) {
  return (
    <div className="w-full">
      <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-soft/70">
        Leaderboard
      </h2>
      {entries.length === 0 ? (
        <p className="py-2 text-center text-sm text-white/40">No scores yet — be the first!</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((entry, i) => {
            const highlighted = highlightName !== undefined && entry.name === highlightName;
            return (
              <li
                key={`${entry.name}-${entry.date}`}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  highlighted ? 'bg-gold/20 ring-1 ring-gold/50' : 'bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-5 text-center font-black ${RANK_COLOR[i] ?? 'text-white/50'}`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-white/90">{entry.name}</span>
                </span>
                <span className="flex items-center gap-4 text-white/60">
                  <span title="best streak">×{entry.bestStreak}</span>
                  <span className="font-bold text-white">{entry.score}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
