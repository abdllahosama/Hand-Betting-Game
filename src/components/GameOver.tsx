import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { GameOverReason, GameState } from '../engine/game';
import type { ScoreEntry } from '../state/leaderboard';
import { Leaderboard } from './Leaderboard';

interface GameOverProps {
  readonly game: GameState;
  readonly isHighScore: boolean;
  readonly leaderboard: readonly ScoreEntry[];
  readonly onSubmitScore: (name: string) => void;
  readonly onPlayAgain: () => void;
  readonly onExit: () => void;
}

const REASON_TEXT: Record<GameOverReason, string> = {
  'tile-limit': 'A tile reached its value limit (0 or 10).',
  'draw-depleted': 'The draw pile ran out for the last time.',
};

function Summary({ game }: { game: GameState }) {
  const stats: { label: string; value: number }[] = [
    { label: 'Score', value: game.score },
    { label: 'Best streak', value: game.bestStreak },
    { label: 'Rounds', value: game.round },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-black/20 py-3 text-center ring-1 ring-white/10">
          <div className="text-2xl font-black text-gold">{s.value}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/50">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function GameOver({
  game,
  isHighScore,
  leaderboard,
  onSubmitScore,
  onPlayAgain,
  onExit,
}: GameOverProps) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const showNameEntry = isHighScore && !submitted;
  const savedName = name.trim() === '' ? 'Anonymous' : name.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitScore(name);
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12"
    >
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-gold">Game Over</h1>
        {game.gameOverReason ? (
          <p className="mt-1 text-sm text-white/60">{REASON_TEXT[game.gameOverReason]}</p>
        ) : null}
      </header>

      <Summary game={game} />

      {showNameEntry ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <p className="text-center text-sm font-semibold text-gold-soft">
            New high score! Enter your name:
          </p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              maxLength={20}
              autoFocus
              placeholder="Your name"
              className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
            <button
              type="submit"
              className="rounded-lg bg-gold px-4 py-2 font-bold text-felt-900 transition hover:brightness-110"
            >
              Save
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl bg-black/20 p-5 ring-1 ring-white/10">
        <Leaderboard entries={leaderboard} highlightName={submitted ? savedName : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white/80 transition hover:bg-white/20"
        >
          Main Menu
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-xl bg-gradient-to-b from-gold to-amber-500 px-5 py-3 font-black text-felt-900 shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.98]"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  );
}
