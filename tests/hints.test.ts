// Round hint policy on tasks from the real generators and the real curriculum.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { FIRST_HINT_EXEMPT_TYPES, firstHint, solutionSteps } from '../src/core/round/hints';
import { faceText } from '../src/core/tasks/faces';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Task } from '../src/core/tasks/types';
import { NUMBER_SOURCE, parseNumber } from '../src/core/text/formatNumber';
import { stages } from '../src/data/curriculum';
import type { SkillDef } from '../src/core/types';
import { skillsOfType } from './helpers';
import { E3 } from '../src/data/curriculum/E3';
import { E4 } from '../src/data/curriculum/E4';
import { E1 } from '../src/data/curriculum/E1';

const answerLine = (answer: string): string => `Wynik: ${answer}`;
const typeOf = (skill: SkillDef): string => skill.type;
const lastNumber = (line: string): number | undefined => {
    const all = line.match(new RegExp(NUMBER_SOURCE, 'g'));
    return all ? parseNumber(all[all.length - 1]) : undefined;
};
const draw = (skill: SkillDef, seed: number): Task => generateTask(skill, createRng(900 + seed), { tileCount: 4 });
const allSkills = Object.values(stages).flatMap((stage) => (stage ? stage.steps.flatMap((step) => step.skills) : []));

describe('firstHint', () => {
    it('HALF shows a method line first and never states the result in it (TXT-02)', () => {
        const half = [...skillsOfType(E3, 'HALF'), ...skillsOfType(E4, 'HALF'), ...skillsOfType(E1, 'HALF')];
        expect(half.length).toBeGreaterThan(0);
        for (const skill of half) {
            for (let seed = 0; seed < 30; seed += 1) {
                const task = draw(skill, seed);
                const first = firstHint(task);
                expect(first, `${skill.id} seed ${seed}`).toBe(task.hint[0]);
                expect(first, `${skill.id} seed ${seed}`).not.toContain('=');
                expect(task.hint[1], `${skill.id} seed ${seed}`).toBe(`${task.prompt.match(/\d+/)?.[0]} : 2 = ${String(task.answer)}`);
            }
        }
    });

    // The "o 10" step of these skills equals the answer by phrasing, so the first hint is rightly held back.
    const SUPPRESSED_OK: Record<string, string> = {
        'E2.7.sequence_tens_100': 'the "o 10" step equals the answer by phrasing',
        'E2.6.arrow_graph_20': 'the "o 10" step equals the answer by phrasing',
        'E2.6.arrow_table_20': 'the "o 10" step equals the answer by phrasing',
    };

    it('every skill with two or more hint lines shows its first hint, except the named phrasing cases (TXT-02)', () => {
        const tally = new Map<string, { multi: number; suppressed: number }>();
        for (const skill of allSkills) {
            if (skill.type === 'ROMAN') {
                continue;
            }
            const t = { multi: 0, suppressed: 0 };
            for (let seed = 0; seed < 50; seed += 1) {
                const task = draw(skill, seed);
                if (task.hint.length < 2) {
                    continue;
                }
                t.multi += 1;
                if (firstHint(task) === null) {
                    t.suppressed += 1;
                }
            }
            tally.set(skill.id, t);
        }
        for (const [id, t] of tally) {
            if (id in SUPPRESSED_OK) {
                expect(t.suppressed, `${id} is listed as a phrasing case`).toBeGreaterThan(0);
                expect(t.suppressed, `${id} must still show its first hint sometimes`).toBeLessThan(t.multi);
            } else {
                expect(t.suppressed, `${id} never shows ${t.suppressed} of ${t.multi} first hints`).toBe(0);
            }
            expect(t.suppressed === t.multi && t.multi > 0, `${id} never shows a first hint`).toBe(false);
        }
        expect(Object.keys(SUPPRESSED_OK).every((id) => tally.has(id))).toBe(true);
    });

    it('shows the interval line for ROUNDING even when it ends with the answer', () => {
        expect(FIRST_HINT_EXEMPT_TYPES).toContain('ROUNDING');
        const skills = skillsOfType(E4, 'ROUNDING');
        expect(skills.length).toBeGreaterThan(0);
        for (const skill of skills) {
            for (let seed = 0; seed < 30; seed += 1) {
                const task = draw(skill, seed);
                expect(firstHint(task), `${skill.id} seed ${seed}`).toBe(task.hint[0]);
            }
        }
    });

    it('MISSING: operand slots give the inverse operation without the result, result slot gives null', () => {
        const skills = [...skillsOfType(E3, 'MISSING'), ...skillsOfType(E4, 'MISSING')];
        let operand = 0;
        let result = 0;
        for (const skill of skills) {
            for (let seed = 0; seed < 40; seed += 1) {
                const task = draw(skill, seed);
                const where = `${skill.id} seed ${seed} "${task.prompt}"`;
                const hidesResult = /□$/.test(task.prompt);
                if (hidesResult) {
                    result += 1;
                    expect(task.hint, where).toHaveLength(1);
                    expect(firstHint(task), where).toBeNull();
                } else {
                    operand += 1;
                    expect(task.hint, where).toHaveLength(2);
                    expect(task.hint[0], where).not.toContain('=');
                    expect(task.hint[0], where).toMatch(/\d+ [+−·:] \d+$/);
                    expect(task.hint[1], where).toMatch(/=/);
                    expect(lastNumber(task.hint[1]), where).toBe(task.answer);
                    expect(firstHint(task), where).toBe(task.hint[0]);
                }
            }
        }
        expect(operand).toBeGreaterThan(0);
        expect(result).toBeGreaterThan(0);
    });

    it('never leaks a numeric answer as the last number of the first hint line (all stages)', () => {
        let shown = 0;
        let skipped = 0;
        for (const skill of allSkills) {
            if (skill.type === 'ROMAN') {
                continue;
            }
            for (let seed = 0; seed < 12; seed += 1) {
                let task: Task;
                try {
                    task = draw(skill, seed);
                } catch {
                    skipped += 1;
                    continue;
                }
                const first = firstHint(task);
                if (first === null) {
                    continue;
                }
                shown += 1;
                const openExpression = !first.includes('=') && /[+−·:] \S+$/.test(first);
                if (typeof task.answer === 'number' && !openExpression && !FIRST_HINT_EXEMPT_TYPES.includes(typeOf(skill))) {
                    expect(lastNumber(first), `${skill.id} seed ${seed} "${task.prompt}" hint "${first}"`).not.toBe(task.answer);
                }
            }
        }
        expect(shown).toBeGreaterThan(100);
        // No skill may silently drop out of the leak check (every skill of every stage generates today).
        expect(skipped).toBe(0);
    });

    it('a number equal to the answer in the middle of the line does not block the hint (CHAIN, ADD_SUB)', () => {
        const task: Task = { skillId: 'E3.1.chain_x', prompt: 'p', answer: 10, hint: ['10 − 4 = 6', '6 + 4 = 10'] };
        expect(firstHint(task)).toBe('10 − 4 = 6');
    });

    it('an open expression whose last operand equals the answer is not a leak (9 + □ = 18)', () => {
        const task: Task = { skillId: 'E3.2.missing_20', prompt: '9 + □ = 18', answer: 9, hint: ['Policz w drugą stronę: 18 − 9', '18 − 9 = 9'] };
        expect(firstHint(task)).toBe('Policz w drugą stronę: 18 − 9');
        expect(firstHint({ ...task, hint: ['18 − 9 = 9', 'x'] })).toBeNull();
    });

    it('a text answer stated as a whole token in the first line blocks the hint (clock "15.00")', () => {
        const base = { skillId: 'E3.3.clock_x', prompt: 'p', answer: '15.00' };
        expect(firstHint({ ...base, hint: ['Po południu dodaj 12: 15.00', 'Zapis: 15.00'] })).toBeNull();
        expect(firstHint({ ...base, hint: ['3 + 12 = 15', 'Zapis: 15.00'] })).toBe('3 + 12 = 15');
        // "11.00" is not "1.00": a longer time that merely contains the answer's characters is no leak.
        expect(firstHint({ ...base, answer: '1.00', hint: ['Teraz jest 11.00', 'Będzie 1.00'] })).toBe('Teraz jest 11.00');
    });

    it('symbol answers are not judged as leaks (a comparison sign inside the expression)', () => {
        expect(firstHint({ skillId: 'E3.1.compare_num_x', prompt: 'p', answer: '<', hint: ['3 < 5', 'x'] })).toBe('3 < 5');
        expect(firstHint({ skillId: 'E3.1.compare_num_x', prompt: 'p', answer: '<', hint: ['3 < 5'] })).toBeNull();
    });

    it('every text answer stated as a whole token in the first line blocks the hint (S-14 amounts)', () => {
        const base = { skillId: 'E4.1.money_count_x', prompt: 'p', answer: '3 zł 40 gr' };
        expect(firstHint({ ...base, hint: ['Razem: 3 zł 40 gr', 'x'] })).toBeNull();
        expect(firstHint({ ...base, hint: ['3 zł + 40 gr', 'Razem: 3 zł 40 gr'] })).toBe('3 zł + 40 gr');
        // a longer amount that merely contains the answer's characters is no leak
        expect(firstHint({ ...base, answer: '3 zł', hint: ['To jest 13 zł', 'Razem: 3 zł'] })).toBe('To jest 13 zł');
        expect(firstHint({ ...base, answer: '40 gr', hint: ['To jest 140 gr', 'Razem: 40 gr'] })).toBe('To jest 140 gr');
    });

    it('a negative numeric answer keeps its minus: "Wynik: −5" leaks -5, "−5 + 8" does not', () => {
        const cold = { skillId: 'E6.1.temperature_x', prompt: 'p', answer: -5 };
        expect(firstHint({ ...cold, hint: ['Wynik: \u22125', 'x'] })).toBeNull();
        expect(firstHint({ ...cold, hint: ['Wynik: 5', 'x'] })).toBe('Wynik: 5');
        expect(firstHint({ ...cold, answer: 3, hint: ['\u22125 + 8 = 3', 'x'] })).toBeNull();
        expect(firstHint({ ...cold, answer: 3, hint: ['\u22125 + 8', '3'] })).toBe('\u22125 + 8');
    });
});

describe('solutionSteps', () => {
    it('ends with the answer for every skill of every stage', () => {
        let skipped = 0;
        for (const skill of allSkills) {
            for (let seed = 0; seed < 8; seed += 1) {
                let task: Task;
                try {
                    task = draw(skill, seed);
                } catch {
                    skipped += 1;
                    continue;
                }
                const steps = solutionSteps(task, answerLine);
                const where = `${skill.id} seed ${seed} "${task.prompt}" steps ${JSON.stringify(steps)}`;
                expect(steps.length, where).toBeGreaterThanOrEqual(task.hint.length);
                expect(steps.slice(0, task.hint.length), where).toEqual(task.hint);
                const last = steps[steps.length - 1];
                if (typeof task.answer === 'number') {
                    expect(lastNumber(last), where).toBe(task.answer);
                } else if (typeof task.answer === 'string') {
                    expect(last, where).toContain(String(faceText(task.answer)));
                }
            }
        }
        expect(skipped).toBe(0);
    });

    it('adds the answer line only when the hint does not end with the result', () => {
        const done: Task = { skillId: 's', prompt: 'p', answer: 13, hint: ['7 + 6 = 13'] };
        expect(solutionSteps(done, answerLine)).toEqual(['7 + 6 = 13']);
        const open: Task = { skillId: 's', prompt: 'p', answer: 13, hint: ['7 + 6'] };
        expect(solutionSteps(open, answerLine)).toEqual(['7 + 6', 'Wynik: 13']);
        const text: Task = { skillId: 's', prompt: 'p', answer: '<', hint: ['3 < 5'] };
        expect(solutionSteps(text, answerLine)).toEqual(['3 < 5']);
        const negative: Task = { skillId: 's', prompt: 'p', answer: -5, hint: ['\u22122 \u2212 3'] };
        expect(solutionSteps(negative, answerLine)).toEqual(['\u22122 \u2212 3', 'Wynik: -5']);
        expect(solutionSteps({ ...negative, hint: ['Wynik: \u22125'] }, answerLine)).toEqual(['Wynik: \u22125']);
    });
});

describe('firstHint with several right answers (check)', () => {
    const task: Task = {
        skillId: 'T.1',
        prompt: '5 + □ < 8',
        answer: 1,
        choices: [1, 2, 3, 4],
        hint: ['Najpierw zobacz 2', 'Potem 3'],
        check: (x) => typeof x === 'number' && x < 3,
    };
    it('treats a line ending with ANY accepted number as a leak', () => {
        expect(firstHint(task)).toBeNull(); // ends with 2, which check accepts though answer is 1
        expect(firstHint({ ...task, hint: ['Najpierw zobacz 3', 'Potem 4'] })).toBe('Najpierw zobacz 3');
    });
});

describe('solutionSteps with face answers (S-14d)', () => {
    const base: Task = { skillId: 'E1.1.shapes_pick', prompt: 'Dotknij trójkąta.', hint: ['Trójkąt ma 3 boki i 3 rogi.', 'Policz rogi w każdej figurze.'], answer: 'shape:triangle:red:big' };

    it('closes with the words of the face, never the code', () => {
        const steps = solutionSteps(base, answerLine);
        expect(steps.at(-1)).toBe('Wynik: duży czerwony trójkąt');
        expect(steps.join(' ')).not.toContain('shape:');
    });

    it('closes a list of faces with their words', () => {
        const all: Task = { ...base, answer: ['shape:circle:red:big', 'shape:circle:blue:small'] };
        const steps = solutionSteps(all, answerLine);
        expect(steps.at(-1)).toBe('Wynik: duże czerwone koło, małe niebieskie koło');
        expect(steps.join(' ')).not.toContain('shape:');
    });

    it('leaves a number list as it was (EVEN_ODD): the hint closes it', () => {
        const evens: Task = { skillId: 'x', prompt: 'Zaznacz.', hint: ['Parzyste kończą się na 0, 2, 4, 6 albo 8.'], answer: [4, 8] };
        expect(solutionSteps(evens, answerLine)).toEqual(evens.hint);
    });
});

