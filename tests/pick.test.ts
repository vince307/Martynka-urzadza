// Skill choice: only skills the scene can answer (tiles/keypad/select/drag) with a registered generator are drawn.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { pickSkills, playable } from '../src/core/round/pick';
import { getGenerator } from '../src/core/tasks/registry';
import type { SkillDef, StageDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { availableStages, getStage, stages } from '../src/data/curriculum';

const allSkills = (stage: StageDef) => stage.steps.flatMap((s) => s.skills);

describe('pickSkills', () => {
    it('only returns skills the scene can answer, for any stage (1000 seeds each)', () => {
        for (const id of availableStages()) {
            const stage = getStage(id) as StageDef;
            for (let seed = 1; seed <= 1000; seed += 1) {
                for (const skill of pickSkills(stage, createRng(seed), balance.round.length)) {
                    expect(['tiles', 'keypad', 'select', 'drag'], `${skill.id} seed=${seed}`).toContain(skill.answer);
                    expect(getGenerator(skill.type), skill.id).toBeDefined();
                }
            }
        }
    });

    it("playable lets every answer mode in (the e2e helpers answer 'drag' since S-13 phase 9)", () => {
        const base = { id: 'x', stage: 'E1' as const, step: 1, type: 'EVEN_ODD', params: { max: 10 } };
        expect(playable({ ...base, answer: 'select' } satisfies SkillDef)).toBe(true);
        expect(playable({ ...base, answer: 'drag' } satisfies SkillDef)).toBe(true);
    });

    it("the 'drag' skills E3.6 and E4.1 are in the pool of their stage", () => {
        const pooled = (id: 'E3' | 'E4'): string[] => {
            const seen = new Set<string>();
            const rng = createRng(13);
            for (let i = 0; i < 400; i += 1) {
                pickSkills(stages[id] as StageDef, rng, 5).forEach((s) => seen.add(s.id));
            }
            return [...seen];
        };
        expect(pooled('E3')).toContain('E3.6.place_build_30');
        expect(pooled('E4')).toContain('E4.1.place_build_100');
    });

    it("the 'select' skills E1.6 and E3.7 are in the pool of their stage", () => {
        const pooled = (id: 'E1' | 'E3'): string[] => {
            const seen = new Set<string>();
            const rng = createRng(11);
            for (let i = 0; i < 400; i += 1) {
                pickSkills(stages[id] as StageDef, rng, 5).forEach((s) => seen.add(s.id));
            }
            return [...seen];
        };
        expect(pooled('E1')).toContain('E1.6.even_odd_select_10');
        expect(pooled('E3')).toContain('E3.7.select_even_30');
    });

    it('returns the requested count', () => {
        expect(pickSkills(stages.E3 as StageDef, createRng(1), 5)).toHaveLength(5);
        expect(pickSkills(stages.E3 as StageDef, createRng(1), 0)).toHaveLength(0);
    });

    it('draws from several skills over many picks (uniform over the stage)', () => {
        const seen = new Set<string>();
        const rng = createRng(7);
        for (let i = 0; i < 200; i += 1) {
            pickSkills(stages.E3 as StageDef, rng, 5).forEach((s) => seen.add(s.id));
        }
        const eligible = allSkills(stages.E3 as StageDef).filter((s) => (s.answer === 'tiles' || s.answer === 'keypad' || s.answer === 'select' || s.answer === 'drag') && getGenerator(s.type));
        expect(seen.size).toBe(eligible.length);
    });

    it('is deterministic for a seed', () => {
        const a = pickSkills(stages.E4 as StageDef, createRng(3), 5).map((s) => s.id);
        const b = pickSkills(stages.E4 as StageDef, createRng(3), 5).map((s) => s.id);
        expect(a).toEqual(b);
    });

    it('throws RangeError when nothing can be played', () => {
        const empty: StageDef = { id: 'E3', steps: [{ step: 1, title: 't', types: [], skills: [] }] };
        expect(() => pickSkills(empty, createRng(1), 5)).toThrow(RangeError);
    });
});
