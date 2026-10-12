// Skill choice for a round: only skills the scene can answer (tiles/keypad)
// with a registered generator; built rounds follow the rules and the stage.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { buildRound, pickSkills } from '../src/core/round/pick';
import { getGenerator } from '../src/core/tasks/registry';
import type { StageDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { availableStages, getStage, stages } from '../src/data/curriculum';

const allSkills = (stage: StageDef) => stage.steps.flatMap((s) => s.skills);

describe('pickSkills', () => {
    it("never returns 'select' or 'drag' skills for any stage (1000 seeds each)", () => {
        for (const id of availableStages()) {
            const stage = getStage(id) as StageDef;
            for (let seed = 1; seed <= 1000; seed += 1) {
                for (const skill of pickSkills(stage, createRng(seed), balance.round.length)) {
                    expect(['tiles', 'keypad'], `${skill.id} seed=${seed}`).toContain(skill.answer);
                    expect(getGenerator(skill.type), skill.id).toBeDefined();
                }
            }
        }
    });

    it("the filter matters: the stages really contain 'select' skills", () => {
        const modes = new Set(availableStages().flatMap((id) => allSkills(stages[id] as StageDef).map((s) => s.answer)));
        expect(modes.has('select')).toBe(true);
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
        const eligible = allSkills(stages.E3 as StageDef).filter((s) => (s.answer === 'tiles' || s.answer === 'keypad') && getGenerator(s.type));
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

describe('buildRound', () => {
    it('builds rules.length tasks for every stage; tile tasks carry at most tileCount choices that include the answer', () => {
        for (const id of availableStages()) {
            const stage = stages[id] as StageDef;
            const mode = new Map(stage.steps.flatMap((step) => step.skills.map((sk) => [sk.id, sk.answer] as const)));
            for (let seed = 1; seed <= 30; seed += 1) {
                const tasks = buildRound(stage, createRng(seed), balance.round, balance.tiles.count);
                expect(tasks).toHaveLength(balance.round.length);
                for (const t of tasks) {
                    const where = `${t.skillId} seed=${seed}`;
                    if (mode.get(t.skillId) === 'tiles') {
                        expect(t.choices, where).toBeDefined();
                        expect(t.choices!.length, where).toBeGreaterThanOrEqual(2);
                        expect(t.choices!.length, where).toBeLessThanOrEqual(balance.tiles.count);
                    }
                    if (t.choices) {
                        expect(t.choices, where).toContain(t.answer);
                    }
                }
            }
        }
    });
});
