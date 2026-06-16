/**
 * Leaderboard persistence (top 5 high scores) backed by localStorage.
 *
 * This is the single seam for persistence: swapping localStorage for a backend
 * API later means changing only this file. All reads are defensive — corrupt or
 * unavailable storage degrades to an empty board rather than throwing.
 */

export interface ScoreEntry {
  readonly name: string;
  readonly score: number;
  readonly bestStreak: number;
  readonly rounds: number;
  /** ISO timestamp of when the score was recorded. */
  readonly date: string;
}

const STORAGE_KEY = 'hbg:leaderboard';
const MAX_ENTRIES = 5;

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.score === 'number' &&
    typeof o.bestStreak === 'number' &&
    typeof o.rounds === 'number' &&
    typeof o.date === 'string'
  );
}

/** Sort by score (highest first) and keep only the top entries. */
function sortAndTrim(entries: readonly ScoreEntry[]): ScoreEntry[] {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
}

export function loadLeaderboard(): ScoreEntry[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private mode / SSR) — treat as empty.
    return [];
  }
  if (raw === null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sortAndTrim((parsed as unknown[]).filter(isScoreEntry));
  } catch {
    // Malformed JSON — start fresh rather than crash.
    return [];
  }
}

/** Add an entry, persist the trimmed top 5, and return the new board. */
export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const next = sortAndTrim([...loadLeaderboard(), entry]);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persisting failed — return the in-memory board anyway.
  }
  return next;
}

/** Whether `score` would earn a place on the (already sorted) board. */
export function qualifies(score: number, board: readonly ScoreEntry[]): boolean {
  if (board.length < MAX_ENTRIES) {
    return true;
  }
  const lowest = board[board.length - 1];
  return score > lowest.score;
}
