// Wallet arithmetic (S-14d phase 6). Oracle: 1 zl = 100 grosze, the money series 1-2-5-10 zl; `fewestCoins` is compared
// with an exhaustive search written here, independent of any greedy rule.
import { describe, expect, it } from 'vitest';
import { emptyWallet, fewestCoins, walletCoins, walletList, walletValue } from '../src/core/coins';
import type { MoneyId } from '../src/data/measures';

const value: Record<string, number> = { 'coin-1zl': 100, 'coin-2zl': 200, 'coin-5zl': 500, 'note-10zl': 1000 };

describe('walletCoins / walletValue', () => {
    it('lists the grosze of every placed coin, largest first', () => {
        expect(walletCoins({ 'coin-1zl': 2, 'coin-5zl': 1, 'coin-2zl': 1 })).toEqual([500, 200, 100, 100]);
        expect(walletCoins({})).toEqual([]);
        expect(walletCoins({ 'note-10zl': 1, 'coin-1zl': 0 })).toEqual([1000]);
    });

    it('sums the wallet', () => {
        expect(walletValue({ 'coin-1zl': 2, 'coin-5zl': 1, 'coin-2zl': 1 })).toBe(900);
        expect(walletValue({})).toBe(0);
        expect(walletValue({ 'note-10zl': 2 })).toBe(2000);
    });
});

/** Exhaustive minimum number of coins reaching exactly `target`, or null. */
const brute = (target: number, kinds: number[], limit = 20): number | null => {
    let best: number | null = null;
    const go = (i: number, left: number, used: number): void => {
        if (best !== null && used >= best) return;
        if (left === 0) { best = used; return; }
        if (i === kinds.length) return;
        for (let n = Math.floor(left / kinds[i]); n >= 0; n -= 1) {
            if (used + n > limit) continue;
            go(i + 1, left - n * kinds[i], used + n);
        }
    };
    go(0, target, 0);
    return best;
};

describe('fewestCoins', () => {
    const trays: MoneyId[][] = [
        ['coin-1zl', 'coin-2zl', 'coin-5zl'],
        ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl'],
        ['coin-2zl', 'coin-5zl', 'note-10zl'],
    ];
    for (const tray of trays) {
        it(`${tray.join(' ')}: the length equals the exhaustive minimum for 1..20 zl and the sum is the target`, () => {
            const kinds = tray.map((id) => value[id]);
            for (let zl = 1; zl <= 20; zl += 1) {
                const want = brute(zl * 100, kinds);
                const got = fewestCoins(zl * 100, tray);
                if (want === null) { expect(got).toEqual([]); continue; }
                expect(got.length).toBe(want);
                expect(got.reduce((a, b) => a + b, 0)).toBe(zl * 100);
                for (const g of got) expect(kinds).toContain(g);
            }
        });
    }

    it('is listed largest first', () => {
        expect(fewestCoins(1300, ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl'])).toEqual([1000, 200, 100]);
    });
});

describe('walletList / emptyWallet', () => {
    it('lists ids largest first and agrees with walletCoins', () => {
        const counts = { ...emptyWallet(), 'coin-1zl': 2, 'coin-5zl': 1, 'coin-2zl': 1 };
        expect(walletList(counts)).toEqual(['coin-5zl', 'coin-2zl', 'coin-1zl', 'coin-1zl']);
        expect(walletCoins(counts)).toEqual([500, 200, 100, 100]);
    });
    it('an empty wallet lists nothing', () => {
        expect(walletList(emptyWallet())).toEqual([]);
    });
});
