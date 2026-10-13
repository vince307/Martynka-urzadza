import { describe, expect, it } from 'vitest';
import { getStage } from '../src/data/curriculum';
import { e2eSkills, forcedSkills } from '../src/testing/e2eHook';
import type { StageDef } from '../src/core/types';

describe('e2eSkills', () => {
    it('reads a comma separated list of skill ids', () => {
        expect(e2eSkills('?e2eSkills=E3.7.select_even_30,E3.1.a')).toEqual(['E3.7.select_even_30', 'E3.1.a']);
    });

    it('is null when absent, empty or malformed', () => {
        expect(e2eSkills('')).toBeNull();
        expect(e2eSkills('?e2eSkills=')).toBeNull();
        expect(e2eSkills('?e2eSkills=drop table')).toBeNull();
    });
});

describe('forcedSkills', () => {
    const stage = getStage('E3') as StageDef;

    it('repeats the ids to the round length', () => {
        const skills = forcedSkills(stage, ['E3.7.select_even_30'], 5);
        expect(skills?.map((s) => s.id)).toEqual(Array(5).fill('E3.7.select_even_30'));
    });

    it('cycles several ids in order', () => {
        const ids = stage.steps.flatMap((s) => s.skills).filter((s) => s.answer === 'select' || s.answer === 'tiles').slice(0, 2).map((s) => s.id);
        expect(forcedSkills(stage, ids, 5)?.map((s) => s.id)).toEqual([ids[0], ids[1], ids[0], ids[1], ids[0]]);
    });

    it('gives an ordinary round (null) for no list, an unknown id or an id of another stage', () => {
        expect(forcedSkills(stage, null, 5)).toBeNull();
        expect(forcedSkills(stage, [], 5)).toBeNull();
        expect(forcedSkills(stage, ['E3.99.none'], 5)).toBeNull();
        expect(forcedSkills(stage, ['E1.6.even_odd_select_10'], 5)).toBeNull();
    });
});
