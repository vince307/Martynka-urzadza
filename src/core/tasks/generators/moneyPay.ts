// MONEY_PAY (S-14d): "Zapłać 7 zł." The child puts coins from a tray into a wallet (the `coins` branch of `drag`).
// The answer is the wallet as a list of grosze (the fewest coins, largest first); `check` accepts any wallet with the right
// sum, or only a shortest one in the "fewest" variant. The right sum is the oracle, not a greedy rule.
import { fewestCoins } from '../../coins';
import { balance } from '../../../data/balance';
import { ART_LIMITS, MONEY, type MoneyId } from '../../../data/measures';
import { pl } from '../../../data/pl';
import { formatMoney, spokenMoney } from '../../text/measure';
import type { Generator, Task } from '../types';

export type MoneyPayVariant = 'pay' | 'fewest';

export interface MoneyPayParams {
    tray: MoneyId[];                 // the nominals on the tray, 1..4 kinds
    min: number;                     // the smallest amount to pay, whole złoty
    max: number;                     // the largest amount to pay, whole złoty
    variants: MoneyPayVariant[];
}

const VARIANTS: readonly MoneyPayVariant[] = ['pay', 'fewest'];
const grosze = (id: MoneyId): number => MONEY.find((m) => m.id === id)?.grosze ?? 0;

export const parseMoneyPayParams = (params: Record<string, unknown>): MoneyPayParams => {
    const fail = (why: string): never => {
        throw new TypeError(`MONEY_PAY ${why}`);
    };
    const { tray, min, max, variants } = params;
    if (!Array.isArray(tray) || tray.length < 1 || tray.length > ART_LIMITS.trayKinds) return fail(`needs params.tray of 1..${ART_LIMITS.trayKinds} nominals`);
    if (new Set(tray).size !== tray.length) fail('params.tray has a duplicate');
    for (const id of tray) if (!MONEY.some((m) => m.id === id)) fail(`has an unknown money id ${String(id)}`);
    if (!Number.isInteger(min) || (min as number) < 1) fail(`needs an integer params.min >= 1 (zł), got ${String(min)}`);
    if (!Number.isInteger(max) || (max as number) < (min as number)) fail(`needs an integer params.max >= params.min, got ${String(max)}`);
    if (!Array.isArray(variants) || variants.length < 1 || !variants.every((v) => VARIANTS.includes(v as MoneyPayVariant))) {
        fail(`needs params.variants from ${VARIANTS.join(', ')}`);
    }
    const typed = tray as MoneyId[];
    for (let zl = min as number; zl <= (max as number); zl += 1) {
        const wallet = fewestCoins(zl * 100, typed);
        if (wallet.length === 0) fail(`tray ${typed.join(', ')} cannot pay ${zl} zł`);
        if (wallet.length > balance.coinDrag.maxTotal) fail(`paying ${zl} zł needs ${wallet.length} coins, the wallet takes ${balance.coinDrag.maxTotal}`);
    }
    return { tray: typed, min: min as number, max: max as number, variants: variants as MoneyPayVariant[] };
};

/** A wallet pays `target` when it holds only tray coins and adds up; the "fewest" variant also wants the shortest wallet. */
const walletCheck = (tray: readonly MoneyId[], target: number, fewestLength: number | null): ((input: unknown) => boolean) => {
    const allowed = new Set(tray.map(grosze));
    return (input) => {
        if (!Array.isArray(input) || input.length === 0 || input.length > balance.coinDrag.maxTotal) return false;
        if (!input.every((c) => typeof c === 'number' && allowed.has(c))) return false;
        if ((input as number[]).reduce((a, b) => a + b, 0) !== target) return false;
        return fewestLength === null || input.length === fewestLength;
    };
};

export const generateMoneyPay: Generator = (skill, rng): Task => {
    const p = parseMoneyPayParams(skill.params);
    const zloty = rng.int(p.min, p.max);
    const target = zloty * 100;
    const fewest = rng.pick(p.variants) === 'fewest';
    const wallet = fewestCoins(target, p.tray);
    const amount = formatMoney(target);
    const hasNote = p.tray.some((id) => grosze(id) >= 1000);
    const first = wallet[0];
    const hint = [pl.tasks.moneyPayHint(hasNote)];
    if (wallet.length === 1) {
        hint.push(pl.tasks.moneyPayOneLine(formatMoney(first)));
    } else {
        hint.push(pl.tasks.moneyPayRestLine(formatMoney(first), formatMoney(target - first)), pl.tasks.moneyPaySumLine(wallet.map(formatMoney), amount));
    }
    return {
        skillId: skill.id,
        prompt: pl.tasks.moneyPayPrompt(amount, fewest),
        speak: pl.tasks.moneyPaySpeak(spokenMoney(target), fewest),
        visual: { kind: 'money', items: [], pay: { tray: p.tray, fewest } },
        answer: wallet,
        check: walletCheck(p.tray, target, fewest ? wallet.length : null),
        hint,
    };
};
