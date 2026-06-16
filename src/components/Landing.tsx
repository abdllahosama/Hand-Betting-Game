import { motion } from 'framer-motion';
import type { ScoreEntry } from '../state/leaderboard';
import { Leaderboard } from './Leaderboard';

interface LandingProps {
  readonly leaderboard: readonly ScoreEntry[];
  readonly onNewGame: () => void;
}

export function Landing({ leaderboard, onNewGame }: LandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-6 py-12"
    >
      <header className="text-center">
        <div className="tile-glyph text-7xl text-tile drop-shadow-lg">🀄</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-gold">Hand Betting</h1>
        <p className="mt-1 text-white/60">Higher or lower — Mahjong with a twist.</p>
      </header>

      <button
        type="button"
        onClick={onNewGame}
        className="w-full rounded-2xl bg-gradient-to-b from-gold to-amber-500 px-6 py-4 text-lg font-black text-felt-900 shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.98]"
      >
        New Game
      </button>

      <div className="w-full rounded-2xl bg-black/20 p-5 ring-1 ring-white/10">
        <Leaderboard entries={leaderboard} />
      </div>
    </motion.div>
  );
}
