import { AnimatePresence, motion } from 'framer-motion';
import type { Bet, BetOutcome, GameState } from '../engine/game';
import { tileValue } from '../engine/tiles';
import { Hand, type HandTile } from './Hand';
import { History } from './History';

interface GameProps {
  readonly game: GameState;
  readonly onBet: (choice: Bet) => void;
  readonly onExit: () => void;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-black leading-none text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
    </div>
  );
}

function FeedbackBanner({ outcome, round }: { outcome: BetOutcome | undefined; round: number }) {
  return (
    <div className="flex h-9 items-center justify-center">
      <AnimatePresence mode="wait">
        {outcome ? (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-full px-4 py-1 text-sm font-bold ${
              outcome.result === 'win'
                ? 'bg-win/20 text-win'
                : outcome.result === 'loss'
                  ? 'bg-lose/20 text-lose'
                  : 'bg-white/10 text-white/70'
            }`}
          >
            {outcome.result === 'win' ? 'Correct!' : outcome.result === 'loss' ? 'Wrong!' : 'Push'}
            {'  '}
            {outcome.prevTotal} → {outcome.newTotal}
            {outcome.scoreGain > 0 ? `  +${outcome.scoreGain.toString()}` : ''}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const BET_BUTTON =
  'rounded-2xl px-6 py-5 text-lg font-black shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.98]';

export function Game({ game, onBet, onExit }: GameProps) {
  const changed = new Set<string>(game.lastOutcome?.changedTypeIds ?? []);
  const handTiles: HandTile[] = game.currentHand.map((tile) => ({
    key: tile.uid,
    typeId: tile.typeId,
    value: tileValue(tile.typeId, game.values, game.config),
    changed: changed.has(tile.typeId),
  }));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-4 py-6">
      {/* Header: exit + live stats */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/20"
        >
          ← Exit
        </button>
        <div className="flex gap-5">
          <Stat label="Score" value={game.score} />
          <Stat label="Streak" value={game.streak} />
          <Stat label="Round" value={game.round} />
        </div>
      </div>

      {/* Pile counts */}
      <div className="flex justify-center gap-6 text-xs text-white/60">
        <span>
          Draw <b className="text-white">{game.drawPile.length}</b>
        </span>
        <span>
          Discard <b className="text-white">{game.discardPile.length}</b>
        </span>
        <span>
          Reshuffles{' '}
          <b className="text-white">
            {game.depletions}/{game.config.maxDrawDepletions}
          </b>
        </span>
      </div>

      <FeedbackBanner outcome={game.lastOutcome} round={game.round} />

      {/* Current hand */}
      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.round}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
          >
            <Hand tiles={handTiles} total={game.currentTotal} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bet controls */}
      <div>
        <p className="mb-2 text-center text-sm text-white/60">
          Will the next hand total be higher or lower?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              onBet('lower');
            }}
            className={`${BET_BUTTON} bg-gradient-to-b from-lose to-red-700 text-white`}
          >
            ▼ Lower
          </button>
          <button
            type="button"
            onClick={() => {
              onBet('higher');
            }}
            className={`${BET_BUTTON} bg-gradient-to-b from-win to-emerald-700 text-white`}
          >
            ▲ Higher
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">History</h3>
        <History history={game.history} />
      </div>
    </div>
  );
}
