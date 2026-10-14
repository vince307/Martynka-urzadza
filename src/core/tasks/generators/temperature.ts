// TEMPERATURE (ZADANIA.md, section 4): a thermometer (a `thermometer` drawing) shows `c`, a multiple of `step` between `low` and
// `high`. `read`: the temperature as a number (keypad, never below zero) or as a text tile ("−5 °C", with the real minus sign);
// `diff`: the morning value is in the prompt, the drawing is "now", and the child says by how many degrees it got warmer or colder.
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { formatCelsius, spokenCelsius } from '../../text/measure';
import { countNoun } from '../../text/plural';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export interface TemperatureParams {
    variant: 'read' | 'diff';
    low: number;
    high: number;
    step: number;
    answer: 'number' | 'text';
}

const RANGE = 30;       // the thermometer scale is -30..+30
const isInt = (x: unknown): x is number => Number.isInteger(x);

/** Multiples of `step` from `low` to `high`, zero included. */
const readings = (low: number, high: number, step: number): number[] => {
    const out: number[] = [];
    for (let c = Math.ceil(low / step) * step; c <= high; c += step) out.push(c === 0 ? 0 : c);
    return out;
};

export const parseTemperatureParams = (params: Record<string, unknown>): TemperatureParams => {
    const fail = (why: string): never => {
        throw new TypeError(`TEMPERATURE ${why}`);
    };
    const { variant, low, high, step, answer } = params;
    if (variant !== 'read' && variant !== 'diff') fail(`params.variant must be read or diff, got ${String(variant)}`);
    if (answer !== 'number' && answer !== 'text') fail(`params.answer must be number or text, got ${String(answer)}`);
    if (!isInt(low) || !isInt(high) || low < -RANGE || high > RANGE || low >= high) fail(`needs integer params.low < params.high inside -${RANGE}..${RANGE}`);
    if (!isInt(step) || step < 2) fail(`needs an integer params.step >= 2 (the drawing marks every ${2} degrees at best), got ${String(step)}`);
    const typed = { variant, low, high, step, answer } as TemperatureParams;
    if (typed.variant === 'diff' && typed.answer !== 'number') fail('diff is answered with a number');
    if (typed.answer === 'number' && typed.variant === 'read' && typed.low < 0) fail('a number answer cannot go below zero (the keypad has no minus)');
    const values = readings(typed.low, typed.high, typed.step);
    if (typed.variant === 'read' && values.length < 4) fail('needs at least four readings to choose from');
    if (typed.variant === 'diff' && values.filter((v) => v !== 0).length < 3) fail('needs at least three non-zero readings');
    return typed;
};

/** The right reading and three others as text tiles: the opposite sign first (the mistake a child makes), then the neighbours. */
const textChoices = (c: number, step: number, rng: Rng): string[] => {
    const chosen = new Set<number>([c]);
    if (c !== 0) chosen.add(-c);
    const others = rng.shuffle([c + step, c - step, -(c + step), -(c - step), c + 2 * step, c - 2 * step]);
    for (const v of others) {
        if (chosen.size >= 4) break;
        if (v >= -RANGE && v <= RANGE) chosen.add(v);
    }
    return rng.shuffle([...chosen].map(formatCelsius));
};

export const generateTemperature: Generator = (skill, rng): Task => {
    const p = parseTemperatureParams(skill.params);
    const values = readings(p.low, p.high, p.step);
    if (p.variant === 'read') {
        const c = rng.pick(values);
        const hint = [pl.tasks.temperatureFindHint, ...(c < 0 ? [pl.tasks.temperatureBelowZeroHint] : []), pl.tasks.temperatureShowsHint(formatCelsius(c))];
        const base = { skillId: skill.id, prompt: pl.tasks.temperatureReadPrompt(p.answer), visual: { kind: 'thermometer', celsius: c } as const, hint };
        return p.answer === 'number'
            ? { ...base, answer: c, tileRange: { min: p.low, max: p.high } }
            : { ...base, answer: formatCelsius(c), choices: textChoices(c, p.step, rng) };
    }
    const nonZero = values.filter((v) => v !== 0);
    const now = rng.pick(nonZero);
    // A cold morning that is exactly the answer (-8 then -16) would say "minus eight" and ask for "eight": left out, the sentence never hands over the number.
    const morning = rng.pick(nonZero.filter((v) => v !== now && !(v < 0 && Math.abs(now - v) === -v)));
    const warmer = now > morning;
    const diff = Math.abs(now - morning);
    const across = Math.sign(now) !== Math.sign(morning);
    const [hi, lo] = [Math.max(Math.abs(now), Math.abs(morning)), Math.min(Math.abs(now), Math.abs(morning))];
    return {
        skillId: skill.id,
        prompt: pl.tasks.temperatureDiff(formatCelsius(morning), warmer),
        speak: pl.tasks.temperatureDiff(spokenCelsius(morning), warmer),
        visual: { kind: 'thermometer', celsius: now },
        answer: diff,
        tileRange: { min: p.step, max: p.high - p.low },
        hint: [
            pl.tasks.temperatureFindHint,
            pl.tasks.temperatureNowHint(formatCelsius(now)),
            ...(across ? [pl.tasks.temperatureAcrossZeroHint] : []),
            across ? `${Math.abs(morning)} + ${Math.abs(now)} = ${diff}` : `${hi} ${MINUS} ${lo} = ${diff}`,
            pl.tasks.temperatureChangeHint(countNoun(diff, nouns.stopień)),
        ],
    };
};
