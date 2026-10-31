import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards for the first-building choice view (S-28). The browser path is proved by the e2e welcome helpers (passChoice)
// and the first-launch spec; these pin the wiring a refactor could break silently.
const text = readFileSync('src/scenes/WelcomeScene.ts', 'utf8');
const card = readFileSync('src/ui/widgets/ChoiceCard.ts', 'utf8');

const body = (name: string): string => {
    const m = new RegExp(`private ${name}\\([\\s\\S]*?\\n    }\\n`).exec(text);
    expect(m, `${name}()`).not.toBeNull();
    return m![0];
};

describe('WelcomeScene choice view wiring', () => {
    it('sets the building before the learner in the card tap', () => {
        const pick = body('pick');
        expect(pick.indexOf('REGISTRY_KEYS.house')).toBeGreaterThan(-1);
        expect(pick.indexOf('REGISTRY_KEYS.house')).toBeLessThan(pick.indexOf('this.start('));
        // the learner is written in start() only, so nothing in the file writes it before the building
        expect(text.match(/registry\.set\(REGISTRY_KEYS\.learner/g)).toHaveLength(1);
        expect(text.indexOf('registry.set(REGISTRY_KEYS.house')).toBeLessThan(text.indexOf('registry.set(REGISTRY_KEYS.learner'));
    });

    it('takes the building from buildingStart and writes none of the stars, variants or settings', () => {
        expect(body('pick')).toContain('buildingStart(');
        for (const key of ['stars', 'variants', 'settings']) {
            expect(text).not.toMatch(new RegExp(`registry\\.set\\(REGISTRY_KEYS\\.${key}\\b`));
        }
    });

    it('asks hasPurchase before it shows the choice view', () => {
        const place = body('place');
        expect(place).toContain('hasPurchase(');
        expect(place.indexOf('hasPurchase(')).toBeLessThan(place.indexOf('this.scene.restart('));
        expect(place).toMatch(/hasPurchase\([^)]*\)\) \{\s*this\.start\(placed\);\s*return;/);
    });

    it('uses no tween, and the card only the ChunkyFace press', () => {
        expect(text).not.toMatch(/tweens/);
        expect(card).not.toMatch(/tweens/);
    });

    it('reads the speaker from the registry narrator and cancels speech on shutdown', () => {
        expect(text).toContain('REGISTRY_KEYS.narrator');
        expect(text).toMatch(/events\.once\('shutdown', \(\) => \{\s*off\(\);\s*narrator\.cancel\(\);/);
        expect(text).toContain('onAvailability(');
    });

    it('starts the welcome again with explicit data (Phaser keeps the last start\'s data otherwise)', () => {
        expect(text).toContain('this.scene.restart({} satisfies WelcomeData)');
        expect(readFileSync('src/scenes/TaskScene.ts', 'utf8')).toContain('this.scene.start(SCENE_KEYS.welcome, {})');
    });

    it('offers "Wróć" only on the child age path', () => {
        expect(text).toMatch(/this\.fromAge && !placed\.stageOverriddenByParent/);
    });
});
