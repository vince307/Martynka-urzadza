// Wallet arithmetic of the coin-paying task (S-14d phase 6). Amounts are grosze, the unit of MONEY.
import { MONEY, type MoneyId } from '../data/measures';

export type WalletCounts = Readonly<Partial<Record<MoneyId, number>>>;

const grosze = (id: MoneyId): number => MONEY.find((m) => m.id === id)?.grosze ?? 0;

/** The grosze of every placed coin, largest first. */
export const walletCoins = (counts: WalletCounts): number[] =>
    (Object.entries(counts) as [MoneyId, number | undefined][])
        .flatMap(([id, n]) => Array.from({ length: n ?? 0 }, () => grosze(id)))
        .sort((a, b) => b - a);

export const walletValue = (counts: WalletCounts): number => walletCoins(counts).reduce((a, b) => a + b, 0);

/**
 * The fewest coins from `tray` (any number of each) that add up to `target`, largest first; [] when no combination
 * reaches it. Dynamic programming over the amount, so it stays right for trays where a greedy choice fails (2, 5, 10).
 */
export const fewestCoins = (target: number, tray: readonly MoneyId[]): number[] => {
    const values = [...new Set(tray.map(grosze))].filter((v) => v > 0).sort((a, b) => b - a);
    if (target <= 0 || values.length === 0) return [];
    const best: (number | null)[] = Array.from({ length: target + 1 }, () => null);
    const last: number[] = Array.from({ length: target + 1 }, () => 0);
    best[0] = 0;
    for (let amount = 1; amount <= target; amount += 1) {
        for (const v of values) {
            const prev = amount >= v ? best[amount - v] : null;
            const now = best[amount];
            if (prev !== null && (now === null || prev + 1 < now)) {
                best[amount] = prev + 1;
                last[amount] = v;
            }
        }
    }
    if (best[target] === null) return [];
    const out: number[] = [];
    for (let left = target; left > 0; left -= last[left]) out.push(last[left]);
    return out.sort((a, b) => b - a);
};

/** The placed coins of a wallet as ids, largest first (the order the wallet draws them in; ties keep the table order of MONEY). */
export const walletList = (counts: WalletCounts): MoneyId[] =>
    [...MONEY].sort((a, b) => b.grosze - a.grosze).flatMap(({ id }) => Array.from({ length: counts[id] ?? 0 }, () => id));

/** A wallet with nothing in it. */
export const emptyWallet = (): Record<MoneyId, number> =>
    Object.fromEntries(MONEY.map(({ id }) => [id, 0])) as Record<MoneyId, number>;
