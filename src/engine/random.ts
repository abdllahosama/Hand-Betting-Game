/**
 * Randomness is represented as an injectable function so the engine stays pure
 * and deterministic: production passes `Math.random`, tests pass a seeded PRNG.
 */
export type Rng = () => number;

/**
 * Mulberry32 — a tiny, fast, seedable PRNG. Given the same seed it always
 * produces the same sequence, which makes shuffles reproducible in tests.
 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
