// WRITTEN: add or subtract in a written column, the result typed digit by digit into boxes (ZADANIA.md, E5.2 and E6.7).
// `digits` 2: two-digit operands, a result of 10..99; `digits` 3: three-digit operands, a result of 100..999.
// `carry: 'required'` needs at least one carry (addition) or borrow (subtraction).
import { pl } from '../../../data/pl';
import type { Rng } from '../../rng';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';
import { columnSteps, type ColumnVisual } from '../written';

export interface WrittenParams {
    op: '+' | '−';
    digits: 2 | 3;
    carry: 'any' | 'required';
}

export const parseWrittenParams = (params: Record<string, unknown>): WrittenParams => {
    const { op, digits, carry } = params;
    if (op !== '+' && op !== MINUS) {
        throw new TypeError(`WRITTEN params.op must be "+" or "−", got ${String(op)}`);
    }
    if (digits !== 2 && digits !== 3) {
        throw new TypeError(`WRITTEN params.digits must be 2 or 3, got ${String(digits)}`);
    }
    if (carry !== 'any' && carry !== 'required') {
        throw new TypeError(`WRITTEN params.carry must be "any" or "required", got ${String(carry)}`);
    }
    return { op, digits, carry };
};

const draw = (p: WrittenParams, rng: Rng): ColumnVisual => {
    const lo = p.digits === 2 ? 10 : 100;
    const hi = p.digits === 2 ? 99 : 999;
    for (;;) {
        const x = rng.int(lo, hi);
        const y = rng.int(lo, hi);
        const [a, b] = p.op === '+' ? [x, y] : [Math.max(x, y), Math.min(x, y)];
        const result = p.op === '+' ? a + b : a - b;
        if (result < lo || result > hi) continue;
        const v: ColumnVisual = { kind: 'column', op: p.op, a, b, columns: p.digits };
        if (p.carry === 'required' && !columnSteps(v).some((s) => s.over)) continue;
        return v;
    }
};

const hintLines = (v: ColumnVisual, result: number): string[] => {
    const lines = columnSteps(v).map((s) => {
        const name = pl.tasks.writtenColumnNames[s.col];
        if (v.op === '+') {
            const terms = s.carryIn ? `${s.top} + ${s.bottom} + 1` : `${s.top} + ${s.bottom}`;
            const total = s.top + s.bottom + (s.carryIn ? 1 : 0);
            return pl.tasks.writtenAddLine(name, terms, total, s.over);
        }
        const reduced = s.current !== s.top;
        if (s.over) {
            const unit = pl.tasks.writtenBorrowFrom[s.col];
            return reduced
                ? pl.tasks.writtenSubBorrowLineReduced(name, s.top, s.current, s.bottom, unit)
                : pl.tasks.writtenSubBorrowLine(name, s.current, s.bottom, unit);
        }
        return reduced ? pl.tasks.writtenSubLineReduced(name, s.top, s.current, s.bottom) : pl.tasks.writtenSubLine(name, s.current, s.bottom);
    });
    return [...lines, `${v.a} ${v.op} ${v.b} = ${result}`];
};

export const generateWritten: Generator = (skill, rng): Task => {
    const p = parseWrittenParams(skill.params);
    const visual = draw(p, rng);
    const answer = p.op === '+' ? visual.a + visual.b : visual.a - visual.b;
    return {
        skillId: skill.id,
        prompt: p.op === '+' ? pl.tasks.writtenAddPrompt(visual.a, visual.b) : pl.tasks.writtenSubPrompt(visual.a, visual.b),
        visual,
        answer,
        hint: hintLines(visual, answer),
    };
};
