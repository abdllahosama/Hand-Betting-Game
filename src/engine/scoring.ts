/**
 * Scoring rule (D7): streak-weighted. A correct bet made during an N-long streak
 * is worth `scoreBase * N`, so consecutive wins are increasingly rewarding.
 * Isolated here so an alternative scoring model is a one-file swap.
 */
import type { GameConfig } from './config';

export function scoreForBet(config: GameConfig, newStreak: number): number {
  return config.scoreBase * newStreak;
}
