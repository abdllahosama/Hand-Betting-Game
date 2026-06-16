/**
 * The game engine: pure, deterministic functions over `GameState`.
 *
 * `createGame` and `placeBet` never mutate their input — they return a fresh
 * state. Randomness is injected, so the whole rule set is unit-testable with a
 * seeded RNG. The React layer is the only thing that supplies `Math.random`.
 */
import { DEFAULT_CONFIG, type GameConfig } from './config';
import { buildDeck, shuffle } from './deck';
import type { Rng } from './random';
import { scoreForBet } from './scoring';
import {
  getTileType,
  initialValues,
  isDynamic,
  policyFor,
  tileValue,
  type Tile,
  type TileTypeId,
  type ValueMap,
} from './tiles';

export type Bet = 'higher' | 'lower';
export type Phase = 'betting' | 'gameover';
export type GameOverReason = 'tile-limit' | 'draw-depleted';
export type RoundResult = 'win' | 'loss' | 'push';

/** Snapshot of one hand, frozen with the values it had when it was current. */
export interface HistoryEntry {
  readonly round: number;
  readonly tiles: readonly { typeId: TileTypeId; value: number }[];
  readonly total: number;
  readonly bet: Bet;
  readonly outcome: RoundResult;
}

/** What just happened, for UI feedback/animation. */
export interface BetOutcome {
  readonly bet: Bet;
  readonly result: RoundResult;
  readonly prevTotal: number;
  readonly newTotal: number;
  readonly scoreGain: number;
  readonly changedTypeIds: readonly TileTypeId[];
}

export interface GameState {
  readonly config: GameConfig;
  readonly phase: Phase;
  readonly drawPile: readonly Tile[];
  readonly discardPile: readonly Tile[];
  readonly currentHand: readonly Tile[];
  readonly currentTotal: number;
  readonly history: readonly HistoryEntry[];
  readonly values: ValueMap;
  readonly score: number;
  readonly streak: number;
  readonly bestStreak: number;
  readonly round: number;
  readonly depletions: number;
  readonly uidSeq: number;
  readonly lastOutcome?: BetOutcome;
  readonly gameOverReason?: GameOverReason;
}

function handTotal(hand: readonly Tile[], values: ValueMap, config: GameConfig): number {
  return hand.reduce((sum, tile) => sum + tileValue(tile.typeId, values, config), 0);
}

/** True once any dynamic tile has reached the bound of its policy (D9 / 0 or 10). */
export function valuesHitLimit(values: ValueMap, config: GameConfig): boolean {
  for (const typeId of Object.keys(values)) {
    const policy = policyFor(getTileType(typeId), config);
    if (
      policy.kind === 'dynamic' &&
      (values[typeId] <= policy.min || values[typeId] >= policy.max)
    ) {
      return true;
    }
  }
  return false;
}

interface DrawResult {
  readonly drawn: Tile[];
  readonly drawPile: Tile[];
  readonly discardPile: Tile[];
  readonly depletions: number;
  readonly uidSeq: number;
  /** True if the draw pile was depleted for the final allowed time (game over). */
  readonly depleted: boolean;
}

/**
 * Draw `count` tiles, reshuffling when the draw pile empties: a fresh deck is
 * combined with the discard pile and shuffled into a new draw pile. The Nth
 * depletion (config.maxDrawDepletions) instead ends the game.
 */
function drawTiles(
  count: number,
  drawPile: readonly Tile[],
  discardPile: readonly Tile[],
  depletions: number,
  uidSeq: number,
  config: GameConfig,
  rng: Rng,
): DrawResult {
  let draw = [...drawPile];
  let discard = [...discardPile];
  let deps = depletions;
  let seq = uidSeq;
  let cursor = 0;
  const drawn: Tile[] = [];

  for (let i = 0; i < count; i += 1) {
    if (cursor >= draw.length) {
      deps += 1;
      if (deps >= config.maxDrawDepletions) {
        return {
          drawn,
          drawPile: [],
          discardPile: discard,
          depletions: deps,
          uidSeq: seq,
          depleted: true,
        };
      }
      const fresh = buildDeck(seq, config);
      seq = fresh.nextSeq;
      draw = shuffle([...fresh.tiles, ...discard], rng);
      discard = [];
      cursor = 0;
    }
    drawn.push(draw[cursor]);
    cursor += 1;
  }

  return {
    drawn,
    drawPile: draw.slice(cursor),
    discardPile: discard,
    depletions: deps,
    uidSeq: seq,
    depleted: false,
  };
}

/** Start a new game: shuffle a deck and deal the first hand. */
export function createGame(rng: Rng, config: GameConfig = DEFAULT_CONFIG): GameState {
  const values = initialValues(config);
  const fresh = buildDeck(0, config);
  const shuffled = shuffle(fresh.tiles, rng);
  const res = drawTiles(config.handSize, shuffled, [], 0, fresh.nextSeq, config, rng);

  return {
    config,
    phase: 'betting',
    drawPile: res.drawPile,
    discardPile: res.discardPile,
    currentHand: res.drawn,
    currentTotal: handTotal(res.drawn, values, config),
    history: [],
    values,
    score: 0,
    streak: 0,
    bestStreak: 0,
    round: 1,
    depletions: res.depletions,
    uidSeq: res.uidSeq,
  };
}

/**
 * Resolve a bet: reveal the next hand, compare totals, scale the revealed hand's
 * dynamic tiles, update score/streak, archive the old hand, and check game over.
 */
export function placeBet(state: GameState, bet: Bet, rng: Rng): GameState {
  if (state.phase !== 'betting') {
    return state;
  }
  const { config } = state;

  // 1. Reveal the next hand (may reshuffle, or end the game on final depletion).
  const res = drawTiles(
    config.handSize,
    state.drawPile,
    state.discardPile,
    state.depletions,
    state.uidSeq,
    config,
    rng,
  );
  if (res.depleted) {
    return {
      ...state,
      phase: 'gameover',
      gameOverReason: 'draw-depleted',
      drawPile: res.drawPile,
      discardPile: res.discardPile,
      depletions: res.depletions,
      uidSeq: res.uidSeq,
    };
  }
  const nextHand = res.drawn;

  // 2. Compare totals using the pre-scaling values.
  const prevTotal = state.currentTotal;
  const newTotal = handTotal(nextHand, state.values, config);
  const isTie = newTotal === prevTotal;
  const push = isTie && !config.tieIsLoss;
  const won = bet === 'higher' ? newTotal > prevTotal : newTotal < prevTotal;
  const result: RoundResult = push ? 'push' : won ? 'win' : 'loss';

  // 3. Scale the revealed hand's dynamic tiles, once per type (D4).
  const values: ValueMap = { ...state.values };
  const changedTypeIds: TileTypeId[] = [];
  if (!push) {
    const delta = won ? 1 : -1;
    const dynamicIds = new Set<TileTypeId>();
    for (const tile of nextHand) {
      if (isDynamic(tile.typeId, config)) {
        dynamicIds.add(tile.typeId);
      }
    }
    for (const typeId of dynamicIds) {
      values[typeId] += delta;
      changedTypeIds.push(typeId);
    }
  }

  // 4. Update streak and score.
  let streak = state.streak;
  let scoreGain = 0;
  if (!push) {
    if (won) {
      streak += 1;
      scoreGain = scoreForBet(config, streak);
    } else {
      streak = 0;
    }
  }

  // 5. Archive the old hand into history and the discard pile.
  const historyEntry: HistoryEntry = {
    round: state.round,
    tiles: state.currentHand.map((tile) => ({
      typeId: tile.typeId,
      value: tileValue(tile.typeId, state.values, config),
    })),
    total: prevTotal,
    bet,
    outcome: result,
  };
  const discardPile = [...res.discardPile, ...state.currentHand];

  // 6. Game over if any dynamic tile hit its bound.
  const gameOver = valuesHitLimit(values, config);

  return {
    ...state,
    phase: gameOver ? 'gameover' : 'betting',
    gameOverReason: gameOver ? 'tile-limit' : undefined,
    drawPile: res.drawPile,
    discardPile,
    currentHand: nextHand,
    currentTotal: handTotal(nextHand, values, config),
    history: [historyEntry, ...state.history],
    values,
    score: state.score + scoreGain,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    round: state.round + 1,
    depletions: res.depletions,
    uidSeq: res.uidSeq,
    lastOutcome: { bet, result, prevTotal, newTotal, scoreGain, changedTypeIds },
  };
}
