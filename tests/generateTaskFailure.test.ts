import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '../src/core/rng';
import { generateTask } from '../src/core/tasks/generateTask';
import type { Task } from '../src/core/tasks/types';
import type { SkillDef } from '../src/core/types';
import { errorCode } from '../src/core/save';
import { columnMarks } from '../src/core/tasks/written';
import { coinLayout } from '../src/core/round/dragLayout';
import { faceLabel } from '../src/core/tasks/faces';
import { TASK_LAYOUT } from '../src/data/layout';
import type { MoneyId } from '../src/data/measures';

// A generator the test controls, reached through the real registry lookup.
let fake: ((skill: SkillDef, rng: ReturnType<typeof createRng>) => Task) | undefined;
vi.mock('../src/core/tasks/registry', async (orig) => {
    const real = await orig<typeof import('../src/core/tasks/registry')>();
    return { ...real, getGenerator: (type: string) => (type === 'FAKE' ? fake : real.getGenerator(type)) };
});

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({ id: 'E9.1.fake', stage: 'E3', step: 1, type: 'FAKE', params: {}, answer: 'keypad', ...over });
const base: Task = { prompt: 'p', answer: 3 } as Task;
const run = (s: SkillDef): unknown => {
    try {
        generateTask(s, createRng(1), { tileCount: 4 });
    } catch (e) {
        return e;
    }
    return undefined;
};

afterEach(() => { fake = undefined; });

describe('generateTask failure carries the skill', () => {
    it('a generator that throws keeps the cause name, the skill id and the message', () => {
        fake = () => { throw new RangeError('too big'); };
        const e = run(skill()) as Error & { skillId?: string; cause?: unknown };
        expect(e.name).toBe('RangeError');
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.message).toBe('Skill E9.1.fake: too big');
        expect(e.cause).toBeInstanceOf(RangeError);
        expect(errorCode(e)).toBe('RangeError/E9.1.fake');
    });

    it('a cause that is not an Error gives name Error', () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- the case is a thrown non-Error
        fake = () => { throw 'boom'; };
        const e = run(skill()) as Error & { skillId?: string };
        expect(e.name).toBe('Error');
        expect(e.skillId).toBe('E9.1.fake');
    });

    it('a drawing over the icon pool throws at generation, with the skill id', () => {
        fake = () => ({ ...base, visual: { kind: 'icons', icon: 'apple', groups: [20, 20], framed: false } });
        const e = run(skill()) as Error & { skillId?: string };
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.name).toBe('RangeError');
        expect(e.message).toMatch(/icons/);
    });

    it('a hint drawing over the limit throws too (number line with too many ticks)', () => {
        fake = () => ({ ...base, hintVisual: { kind: 'numberLine', from: 0, to: 1000, tick: 1, labels: [], box: null, jumps: [] } });
        expect((run(skill()) as { skillId?: string }).skillId).toBe('E9.1.fake');
    });

    it('a tiles skill whose tile range cannot hold the answer throws with the skill id', () => {
        fake = () => ({ ...base, answer: 50, tileRange: { min: 0, max: 5 } });
        const e = run(skill({ answer: 'tiles' })) as Error & { skillId?: string };
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.name).toBe('RangeError');
    });

    it('a missing generator also carries the skill id', () => {
        const e = run(skill({ type: 'NO_SUCH_TYPE' })) as Error & { skillId?: string };
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.message).toMatch(/NO_SUCH_TYPE/);
    });

    it('a valid drawing passes untouched', () => {
        fake = () => ({ ...base, visual: { kind: 'icons', icon: 'apple', groups: [3, 4], framed: false } });
        expect(run(skill())).toBeUndefined();
    });

    // Audit N-4: the two drawing throws that used to happen only inside the scene.
    it('a money pay tray over the layout limit throws at generation, with the skill id', () => {
        const tray: MoneyId[] = ['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl', 'note-20zl'];
        expect(tray.length).toBe(TASK_LAYOUT.coinDrag.maxKinds + 1);
        expect(() => coinLayout(TASK_LAYOUT.coinDrag, tray)).toThrow(); // the scene-throwing input
        fake = () => ({ ...base, visual: { kind: 'money', items: [], pay: { tray, fewest: false } } });
        const e = run(skill()) as Error & { skillId?: string };
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.name).toBe('RangeError');
    });

    it('a written column whose carry runs off the last column throws at generation, with the skill id', () => {
        const column = { kind: 'column', op: '+', a: 99, b: 1, columns: 2 } as const;
        expect(() => columnMarks(column, 'all')).toThrow(RangeError); // the scene-throwing input
        fake = () => ({ ...base, visual: column });
        const e = run(skill()) as Error & { skillId?: string };
        expect(e.skillId).toBe('E9.1.fake');
        expect(e.name).toBe('RangeError');
    });

    it('a generator calling faceLabel on a non-face code carries the skill id', () => {
        fake = () => ({ ...base, prompt: faceLabel('not-a-face') });
        expect((run(skill()) as { skillId?: string }).skillId).toBe('E9.1.fake');
    });
});
