import { describe, expect, it } from 'vitest';
import { canonicalInput } from '../src/core/round/canonicalInput';
import { pictureLayout } from '../src/core/round/pictureLayout';
import { playable } from '../src/core/round/pick';
import { validateTask } from '../src/core/tasks/validate';
import { ANSWER_MODES, type SkillDef } from '../src/core/types';
import { TASK_LAYOUT } from '../src/data/layout';

const skill = (answer: SkillDef['answer']): SkillDef => ({ id: 'T.1', stage: 'E1', step: 1, type: 'ADD_SUB', params: {}, answer });

describe('answer modes', () => {
    it('lists five modes, digits among them', () => {
        expect([...ANSWER_MODES].sort()).toEqual(['digits', 'drag', 'keypad', 'select', 'tiles']);
    });
    it('lets exactly tiles, keypad, drag and select into a round until phase 8', () => {
        // An explicit oracle, not derived from `playable`; phase 8 adds 'digits' here.
        expect(ANSWER_MODES.filter((m) => playable(skill(m)))).toEqual(['tiles', 'keypad', 'drag', 'select']);
    });
    it('gives digits its own layout, not the tiles one', () => {
        for (const solution of [false, true]) {
            const digits = pictureLayout(TASK_LAYOUT.picture, 'digits', solution, 'wide');
            const tiles = pictureLayout(TASK_LAYOUT.picture, 'tiles', solution, 'wide');
            expect(digits.picture).not.toEqual(tiles.picture);
        }
        expect(pictureLayout(TASK_LAYOUT.picture, 'digits', false, 'wide').picture).toEqual(TASK_LAYOUT.picture.digits.picture);
        expect(pictureLayout(TASK_LAYOUT.picture, 'digits', true, 'wide').lines).toEqual(TASK_LAYOUT.picture.digits.lines);
    });
    it('canonicalInput throws for a digits task (no column drawing yet)', () => {
        expect(() => canonicalInput({ skillId: 'T.1', prompt: 'p', answer: 65, hint: ['h'], input: 'digits' })).toThrow(/digits needs a column drawing/);
    });
    it('the validator reports a digits task as a mode violation until a column drawing exists', () => {
        const problems = validateTask({ skillId: 'T.1', prompt: 'p', answer: 65, hint: ['h'], input: 'digits' }, {});
        expect(problems.map((v) => v.rule)).toContain('mode');
    });
});
