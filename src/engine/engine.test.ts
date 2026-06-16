import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type GameConfig } from './config';
import { buildDeck } from './deck';
import { createGame, placeBet, valuesHitLimit, type GameState } from './game';
import { seededRng } from './random';
import { scoreForBet } from './scoring';
import { initialValues, isDynamic, tileTypeId, tileValue } from './tiles';

const RED_DRAGON = tileTypeId({ kind: 'dragon', dragon: 'red' });

/** Total physical tiles currently in play (one deck = 136 by default). */
function physicalCount(state: GameState): number {
  return state.drawPile.length + state.discardPile.length + state.currentHand.length;
}

describe('deck', () => {
  it('builds the authentic 136-tile set with unique ids', () => {
    const { tiles, nextSeq } = buildDeck(0, DEFAULT_CONFIG);
    expect(tiles).toHaveLength(136);
    expect(nextSeq).toBe(136);
    expect(new Set(tiles.map((t) => t.uid)).size).toBe(136);
  });

  it('contains the right counts per category', () => {
    const { tiles } = buildDeck(0, DEFAULT_CONFIG);
    const count = (prefix: string) => tiles.filter((t) => t.typeId.startsWith(prefix)).length;
    expect(count('number:')).toBe(108); // 27 types x 4
    expect(count('dragon:')).toBe(12); //  3 types x 4
    expect(count('wind:')).toBe(16); //   4 types x 4
  });
});

describe('tile values', () => {
  it('starts every dynamic tile at the base value and leaves numbers out of the map', () => {
    const values = initialValues(DEFAULT_CONFIG);
    expect(Object.keys(values)).toHaveLength(7); // 3 dragons + 4 winds
    expect(Object.values(values).every((v) => v === 5)).toBe(true);
  });

  it('resolves number tiles to face value and dynamic tiles to their stored value', () => {
    const values = initialValues(DEFAULT_CONFIG);
    expect(tileValue('number:bamboo:3', values, DEFAULT_CONFIG)).toBe(3);
    expect(tileValue('number:circles:9', values, DEFAULT_CONFIG)).toBe(9);
    expect(tileValue(RED_DRAGON, values, DEFAULT_CONFIG)).toBe(5);
  });

  it('treats numbers as static and dragons/winds as dynamic by default', () => {
    expect(isDynamic('number:bamboo:1', DEFAULT_CONFIG)).toBe(false);
    expect(isDynamic(RED_DRAGON, DEFAULT_CONFIG)).toBe(true);
    expect(isDynamic('wind:east', DEFAULT_CONFIG)).toBe(true);
  });
});

describe('createGame', () => {
  it('deals the first hand and leaves the rest in the draw pile', () => {
    const state = createGame(seededRng(1));
    expect(state.phase).toBe('betting');
    expect(state.currentHand).toHaveLength(DEFAULT_CONFIG.handSize);
    expect(state.drawPile).toHaveLength(136 - DEFAULT_CONFIG.handSize);
    expect(state.discardPile).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.round).toBe(1);
    expect(physicalCount(state)).toBe(136);
  });
});

describe('placeBet', () => {
  it("scales exactly the revealed hand's dynamic tiles by ±1, once per type", () => {
    const rng = seededRng(42);
    const before = createGame(rng);
    const after = placeBet(before, 'higher', rng);

    const outcome = after.lastOutcome;
    if (outcome === undefined) throw new Error('expected an outcome');
    expect(outcome.result === 'win' || outcome.result === 'loss').toBe(true);
    const delta = outcome.result === 'win' ? 1 : -1;

    const handDynamic = new Set(
      after.currentHand.filter((t) => isDynamic(t.typeId, DEFAULT_CONFIG)).map((t) => t.typeId),
    );

    for (const typeId of Object.keys(before.values)) {
      const expected = handDynamic.has(typeId)
        ? before.values[typeId] + delta
        : before.values[typeId];
      expect(after.values[typeId]).toBe(expected);
    }
    expect([...handDynamic].sort()).toEqual([...outcome.changedTypeIds].sort());
  });

  it('advances the round, records history, and conserves the tile count', () => {
    const rng = seededRng(7);
    let state = createGame(rng);
    for (let i = 0; i < 20; i += 1) {
      if (state.phase !== 'betting') break;
      state = placeBet(state, i % 2 === 0 ? 'higher' : 'lower', rng);
      expect(physicalCount(state) % 136).toBe(0);
    }
    expect(state.round).toBeGreaterThan(1);
    expect(state.history.length).toBeGreaterThan(0);
  });

  it('is a no-op once the game is over', () => {
    const over: GameState = { ...createGame(seededRng(1)), phase: 'gameover' };
    expect(placeBet(over, 'higher', seededRng(1))).toBe(over);
  });
});

describe('scoring', () => {
  it('weights a correct bet by the current streak', () => {
    expect(scoreForBet(DEFAULT_CONFIG, 1)).toBe(10);
    expect(scoreForBet(DEFAULT_CONFIG, 3)).toBe(30);
  });
});

describe('game over', () => {
  it('detects when a dynamic tile reaches either bound', () => {
    expect(valuesHitLimit({ [RED_DRAGON]: 10 }, DEFAULT_CONFIG)).toBe(true);
    expect(valuesHitLimit({ [RED_DRAGON]: 0 }, DEFAULT_CONFIG)).toBe(true);
    expect(valuesHitLimit({ [RED_DRAGON]: 5 }, DEFAULT_CONFIG)).toBe(false);
  });

  it('ends after the configured number of draw-pile depletions', () => {
    // Unreachable value bounds isolate the depletion rule from the tile-limit one.
    const depletionConfig: GameConfig = {
      ...DEFAULT_CONFIG,
      copiesPerType: 1,
      handSize: 10,
      maxDrawDepletions: 3,
      valuePolicies: {
        number: { kind: 'static' },
        dragon: { kind: 'dynamic', base: 5, min: -1000, max: 1000 },
        wind: { kind: 'dynamic', base: 5, min: -1000, max: 1000 },
      },
    };
    const rng = seededRng(7);
    let state = createGame(rng, depletionConfig);
    let guard = 0;
    while (state.phase === 'betting' && guard < 1000) {
      state = placeBet(state, 'higher', rng);
      guard += 1;
    }
    expect(state.phase).toBe('gameover');
    expect(state.gameOverReason).toBe('draw-depleted');
    expect(state.depletions).toBe(3);
  });

  it('always terminates under the default rules', () => {
    const rng = seededRng(123);
    let state = createGame(rng);
    let guard = 0;
    while (state.phase === 'betting' && guard < 5000) {
      state = placeBet(state, 'higher', rng);
      guard += 1;
    }
    expect(state.phase).toBe('gameover');
    expect(state.gameOverReason).toBeDefined();
  });
});
