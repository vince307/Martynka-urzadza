import { describe, expect, it } from 'vitest';
import { GUIDE_ART, guideAvailable, guidePose, type GuidePose, type GuideScreen } from '../src/core/guide';
import type { RoundPhase } from '../src/core/round';
import { UI_ART_KEYS } from '../src/data/uiArt';

// The oracle is a literal table, not a second copy of the rule.
const TABLE: Record<GuideScreen, Record<RoundPhase, GuidePose | null>> = {
    task: { first: 'idle', second: 'think', solution: 'think', retype: 'think', done: 'cheer' },
    summary: { first: 'cheer', second: 'cheer', solution: 'cheer', retype: 'cheer', done: 'cheer' },
    unlock: { first: null, second: null, solution: null, retype: null, done: null },
};

describe('guide pose', () => {
    for (const screen of Object.keys(TABLE) as GuideScreen[]) {
        for (const phase of Object.keys(TABLE[screen]) as RoundPhase[]) {
            it(`${screen} / ${phase} -> ${String(TABLE[screen][phase])}`, () => {
                expect(guidePose(screen, phase)).toBe(TABLE[screen][phase]);
            });
        }
    }

    it('names a loaded UI picture for every pose, all different', () => {
        const ids = Object.values(GUIDE_ART);
        expect(new Set(ids).size).toBe(3);
        for (const id of ids) expect(UI_ART_KEYS).toHaveProperty(id);
        expect(GUIDE_ART).toEqual({ idle: 'guideIdle', cheer: 'guideCheer', think: 'guideThink' });
    });
});

describe('guideAvailable (audit G-2: one missing pose hides the fox)', () => {
    const all = ['guideIdle', 'guideCheer', 'guideThink'];
    it('is true only when all three poses exist', () => {
        expect(guideAvailable((id) => all.includes(id))).toBe(true);
    });
    it.each(all)('is false when only %s is missing', (gone) => {
        expect(guideAvailable((id) => all.includes(id) && id !== gone)).toBe(false);
    });
    it('is false when none exists', () => {
        expect(guideAvailable(() => false)).toBe(false);
    });
});
