import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { boundOf, UNBOUNDED_TYPES } from '../src/core/tasks/bounds';
import { generators, getGenerator, getParser, parsers } from '../src/core/tasks/registry';
import { validateTask } from '../src/core/tasks/validate';
import { stages } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';

// Content invariants (test-plan.md rollout phase 3) over every skill of every
// stage: 1000 draws each. Thresholds come from the 2026-10-12 measurement in
// context/archive/*testing-content-invariants/research.md; adjust them here,
// with a comment, when a new stage legitimately has a smaller task space.
const DRAWS = 1000;
const MIN_DISTINCT = 12;           // distinct (prompt + choices) pairs per 1000 draws
const MAX_TOP_SHARE = 0.15;        // the most frequent task
const MAX_DEGENERATE_SHARE = 0.1;  // n − n, n : n
const MAX_ZERO_ONE_SHARE = 0.35;   // ·0 and ·1 when allowed
const ARITHMETIC_LINE = /^(\d+) ([+−·:]) (\d+) = (\d+)$/;
const BINARY_PROMPT = /^(\d+) ([+−·:]) (\d+)$/;

const evaluate = (a: number, op: string, b: number): number => (op === '+' ? a + b : op === '−' ? a - b : op === '·' ? a * b : a / b);

describe('registry', () => {
    it('has a parser for every generator', () => {
        expect(Object.keys(parsers).sort()).toEqual(Object.keys(generators).sort());
    });
});

for (const stage of Object.values(stages)) {
    describe(`content invariants ${stage.id}`, () => {
        for (const step of stage.steps) {
            for (const skill of step.skills) {
                it(`${skill.id}`, () => {
                    const parse = getParser(skill.type);
                    const generate = getGenerator(skill.type);
                    expect(parse, `parser for ${skill.type}`).toBeDefined();
                    expect(generate, `generator for ${skill.type}`).toBeDefined();
                    expect(() => parse!(skill.params), `${skill.id} params`).not.toThrow();

                    const max = boundOf(skill);
                    const bounded = !UNBOUNDED_TYPES.includes(skill.type);
                    const seen = new Map<string, number>();
                    let degenerate = 0;
                    let binary = 0;
                    let zeroOne = 0;
                    let products = 0;
                    for (let i = 0; i < DRAWS; i += 1) {
                        const task = generate!(skill, createRng(910_000 + i));
                        const where = `${skill.id} draw=${i} "${task.prompt}"`;

                        expect(validateTask(task, { max, nouns }), where).toEqual([]);

                        const key = `${task.prompt}|${(task.choices ?? []).join('/')}`;
                        seen.set(key, (seen.get(key) ?? 0) + 1);

                        const texts = [task.prompt, ...task.hint];
                        for (const line of task.hint) {
                            const m = ARITHMETIC_LINE.exec(line);
                            if (m) {
                                expect(evaluate(Number(m[1]), m[2], Number(m[3])), `${where} hint "${line}"`).toBe(Number(m[4]));
                            }
                        }
                        // The last hint either computes the answer (7 + 6 = 13) or checks it
                        // by the inverse operation (6 · 7 = 42 for 42 : 6), so the answer must
                        // appear among its numbers.
                        const last = ARITHMETIC_LINE.exec(task.hint[task.hint.length - 1] ?? '');
                        if (last && typeof task.answer === 'number') {
                            expect([1, 3, 4].map((i) => Number(last[i])), `${where} last hint`).toContain(task.answer);
                        }
                        if (bounded && max !== undefined) {
                            for (const text of texts) {
                                for (const n of text.match(/\d+/g) ?? []) {
                                    expect(Number(n), `${where} number ${n} in "${text}"`).toBeLessThanOrEqual(max);
                                }
                            }
                        }

                        const bp = BINARY_PROMPT.exec(task.prompt);
                        if (bp) {
                            binary += 1;
                            const [a, op, b] = [Number(bp[1]), bp[2], Number(bp[3])];
                            if (op === '+' || op === '−') {
                                expect(Math.min(a, b), `${where} zero operand`).toBeGreaterThanOrEqual(1);
                            }
                            if ((op === '−' || op === ':') && a === b) {
                                degenerate += 1;
                            }
                            if (op === '·') {
                                products += 1;
                                if (a <= 1 || b <= 1) {
                                    zeroOne += 1;
                                    expect(skill.params.allowZeroOne, `${where} ·0/·1 not allowed`).toBe(true);
                                }
                            }
                        }
                    }

                    const top = Math.max(...seen.values());
                    expect(seen.size, `${skill.id}: only ${seen.size} distinct tasks in ${DRAWS} draws`).toBeGreaterThanOrEqual(MIN_DISTINCT);
                    expect(top / DRAWS, `${skill.id}: most frequent task ${top}/${DRAWS}`).toBeLessThanOrEqual(MAX_TOP_SHARE);
                    if (binary > 0) {
                        expect(degenerate / binary, `${skill.id}: ${degenerate} degenerate of ${binary}`).toBeLessThanOrEqual(MAX_DEGENERATE_SHARE);
                    }
                    if (products > 0) {
                        expect(zeroOne / products, `${skill.id}: ${zeroOne} ·0/·1 of ${products}`).toBeLessThanOrEqual(MAX_ZERO_ONE_SHARE);
                    }
                });
            }
        }
    });
}
