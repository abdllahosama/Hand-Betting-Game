/**
 * React binding for the pure game engine.
 *
 * The engine owns all rules; this hook just holds the current `GameState`,
 * drives transitions through the engine's pure functions, injects real
 * randomness (`Math.random`), and wires the leaderboard. The current screen is
 * derived from game state, so there is no separate routing state to keep in sync.
 */
import { useCallback, useMemo, useState } from 'react';
import { createGame, placeBet, type Bet, type GameState } from '../engine/game';
import { loadLeaderboard, qualifies, saveScore, type ScoreEntry } from './leaderboard';

export type Screen = 'landing' | 'playing' | 'gameover';

export interface UseGame {
  readonly screen: Screen;
  readonly game: GameState | null;
  readonly leaderboard: readonly ScoreEntry[];
  /** True on the game-over screen when the final score earns a leaderboard spot. */
  readonly isHighScore: boolean;
  readonly newGame: () => void;
  readonly bet: (choice: Bet) => void;
  readonly exit: () => void;
  readonly submitScore: (name: string) => void;
}

export function useGame(): UseGame {
  const [game, setGame] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => loadLeaderboard());

  const newGame = useCallback(() => {
    setGame(createGame(Math.random));
  }, []);

  const bet = useCallback((choice: Bet) => {
    setGame((prev) => (prev === null ? prev : placeBet(prev, choice, Math.random)));
  }, []);

  const exit = useCallback(() => {
    setGame(null);
  }, []);

  const submitScore = useCallback(
    (name: string) => {
      if (game?.phase !== 'gameover') {
        return;
      }
      const entry: ScoreEntry = {
        name: name.trim() === '' ? 'Anonymous' : name.trim(),
        score: game.score,
        bestStreak: game.bestStreak,
        rounds: game.round,
        date: new Date().toISOString(),
      };
      setLeaderboard(saveScore(entry));
    },
    [game],
  );

  const screen: Screen =
    game === null ? 'landing' : game.phase === 'gameover' ? 'gameover' : 'playing';

  const isHighScore = useMemo(
    () => game !== null && game.phase === 'gameover' && qualifies(game.score, leaderboard),
    [game, leaderboard],
  );

  return { screen, game, leaderboard, isHighScore, newGame, bet, exit, submitScore };
}
