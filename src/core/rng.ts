// Seeded pseudo-random generator for task generators and tests. sfc32 (128-bit
// state, passes PractRand) seeded from a single number through mulberry32, so
// the save file only has to keep `rngSeed: number` (plan section 5).
// No Phaser or DOM imports here: src/core stays testable in plain Node.

export interface Rng {
    /** Uniform float in [0, 1). */
    next(): number;
    /** Uniform integer in [min, max], both inclusive. */
    int(min: number, max: number): number;
    /** Uniformly chosen element; throws on an empty list. */
    pick<T>(items: readonly T[]): T;
    /** Shuffled copy (Fisher–Yates); the input is left untouched. */
    shuffle<T>(items: readonly T[]): T[];
    /** True with probability p (0 → never, 1 → always). */
    chance(p: number): boolean;
}

const mulberry32 = (seed: number): (() => number) => {
    let a = seed | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const sfc32 = (a: number, b: number, c: number, d: number): (() => number) => () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
};

const WARMUP_DRAWS = 8;

export const createRng = (seed: number): Rng => {
    const mix = mulberry32(seed);
    const word = (): number => Math.floor(mix() * 4294967296);
    const next = sfc32(word(), word(), word(), word());
    for (let i = 0; i < WARMUP_DRAWS; i += 1) {
        next();
    }

    const int = (min: number, max: number): number => {
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            throw new RangeError(`int() needs integer bounds, got ${min}..${max}`);
        }
        if (min > max) {
            throw new RangeError(`int() needs min <= max, got ${min}..${max}`);
        }
        return Math.floor(next() * (max - min + 1)) + min;
    };

    return {
        next,
        int,
        pick: (items) => {
            if (items.length === 0) {
                throw new RangeError('pick() needs a non-empty list');
            }
            return items[int(0, items.length - 1)];
        },
        shuffle: (items) => {
            const copy = [...items];
            for (let i = copy.length - 1; i > 0; i -= 1) {
                const j = int(0, i);
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        },
        chance: (p) => (p >= 1 ? true : p <= 0 ? false : next() < p),
    };
};
