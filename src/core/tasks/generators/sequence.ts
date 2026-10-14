// SEQUENCE: a number sequence with one gap, "10, 20, □, 40" (ZADANIA.md,
// section 4), going up or down by a constant step. All terms stay in [0, max].
import { balance } from '../../../data/balance';
import { pl } from '../../../data/pl';
import { arithLine } from '../arith';
import { BOX } from '../symbols';
import type { Generator, Task } from '../types';

export interface SequenceParams {
    max: number;
    steps: number[];
    length: number;
    start: 'multiple' | 'any';
    directions: ('up' | 'down')[];
    line: boolean;                  // S-14b: draw the sequence on a number line (terms on ticks, the gap as the box)
}

export const parseSequenceParams = (params: Record<string, unknown>): SequenceParams => {
    const { max, steps, length = 4, start = 'multiple', directions = ['up', 'down'], line = false } = params;
    if (!Number.isInteger(max) || (max as number) < 2) {
        throw new TypeError(`SEQUENCE params.max must be an integer >= 2, got ${String(max)}`);
    }
    if (!Array.isArray(steps) || steps.length === 0 || !steps.every((s) => Number.isInteger(s) && (s as number) > 0)) {
        throw new TypeError(`SEQUENCE params.steps must be a non-empty list of positive integers, got ${JSON.stringify(steps)}`);
    }
    if (!Number.isInteger(length) || (length as number) < 4 || (length as number) > 6) {
        throw new TypeError(`SEQUENCE params.length must be an integer 4-6, got ${String(length)}`);
    }
    if (start !== 'multiple' && start !== 'any') {
        throw new TypeError(`SEQUENCE params.start must be 'multiple' or 'any', got ${String(start)}`);
    }
    if (!Array.isArray(directions) || directions.length === 0 || !directions.every((d) => d === 'up' || d === 'down')) {
        throw new TypeError(`SEQUENCE params.directions must be a non-empty list of 'up' / 'down', got ${JSON.stringify(directions)}`);
    }
    if (typeof line !== 'boolean') {
        throw new TypeError(`SEQUENCE params.line must be true or false, got ${String(line)}`);
    }
    if (line) {
        if (start !== 'multiple') {
            throw new TypeError('SEQUENCE params.line needs start "multiple": the terms must sit on the ticks');
        }
        for (const s of steps as number[]) {
            if (Math.floor((max as number) / s) + 1 > balance.numberLine.maxTicks) {
                throw new TypeError(`SEQUENCE: a number line 0..${String(max)} every ${s} has more than ${balance.numberLine.maxTicks} ticks`);
            }
        }
    }
    const min = Math.min(...(steps as number[]));
    if (((length as number) - 1) * min > (max as number)) {
        throw new TypeError(`SEQUENCE: ${String(length)} terms with step ${min} do not fit in 0..${String(max)}`);
    }
    return {
        max: max as number,
        steps: steps as number[],
        length: length as number,
        start,
        directions: directions as ('up' | 'down')[],
        line,
    };
};

export const generateSequence: Generator = (skill, rng): Task => {
    const p = parseSequenceParams(skill.params);
    const fitting = p.steps.filter((s) => (p.length - 1) * s <= p.max);
    const step = rng.pick(fitting);
    const dir = rng.pick(p.directions);
    const span = (p.length - 1) * step;
    // Lowest term low in [0, max - span]; a multiple of the step when asked.
    const lowSlots = Math.floor((p.max - span) / (p.start === 'multiple' ? step : 1));
    const low = rng.int(0, lowSlots) * (p.start === 'multiple' ? step : 1);
    const delta = dir === 'up' ? step : -step;
    const first = dir === 'up' ? low : low + span;
    const terms = Array.from({ length: p.length }, (_, i) => first + i * delta);
    const gap = rng.int(0, p.length - 1);
    const answer = terms[gap];
    const shown = terms.map((t, i) => (i === gap ? BOX : String(t))).join(', ');
    // From the left neighbour with the sequence's own step, or (gap first) back from the right one.
    const line = gap > 0 ? arithLine(terms[gap - 1], step, dir === 'up' ? '+' : '-') : arithLine(terms[1], step, dir === 'up' ? '-' : '+');
    return {
        skillId: skill.id,
        prompt: `${pl.tasks.sequence} ${shown}`,
        answer,
        hint: [pl.tasks.sequenceHint(step, dir === 'up'), line],
        ...(p.line
            ? {
                  visual: {
                      kind: 'numberLine',
                      from: 0,
                      to: Math.floor(p.max / step) * step,
                      tick: step,
                      labels: terms.filter((_, i) => i !== gap),
                      box: answer,
                      jumps: [],
                  } as const,
              }
            : {}),
    };
};
