// Origin: first-building-choice phase 7 (S-28, FR-043). Source guards: "Wróć" on the task screen asks the pure rule with the
// rooms and leaves for the choice view with the placement. The browser path is tests/e2e/first-launch.spec.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const task = readFileSync(new URL('../src/scenes/TaskScene.ts', import.meta.url), 'utf8');
const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(`${dir}/${e.name}`) : /\.ts$/.test(e.name) ? [`${dir}/${e.name}`] : []));
const body = (name: string): string => {
    const start = task.indexOf(`private ${name}(`);
    if (start < 0) throw new Error(`${name} missing`);
    const next = task.indexOf('\n    /**', start);
    return task.slice(start, next < 0 ? undefined : next);
};

describe('TaskScene "Wróć" to the building choice', () => {
    it('asks themeBackOffered with the rooms of the registry', () => {
        const render = body('renderThemeBack');
        expect(render).toMatch(/themeBackOffered\(\s*learner,\s*variants,\s*balance\.warmup\.length,\s*rooms\s*\)/);
        expect(render).toContain('REGISTRY_KEYS.rooms');
    });
    it('backToChoice nulls the learner before the flush and starts the welcome with the placement', () => {
        const back = body('backToChoice');
        const nulled = back.indexOf('REGISTRY_KEYS.learner, null');
        const flushed = back.indexOf('flush(');
        const started = back.indexOf('scene.start(SCENE_KEYS.welcome, { placed, fromAge: placed !== undefined && !placed.stageOverriddenByParent })');
        expect(nulled).toBeGreaterThan(0);
        expect(flushed).toBeGreaterThan(nulled);
        expect(started).toBeGreaterThan(flushed);
        expect(back).toContain('console.info(');
    });
    it('the age-back names are gone from src and tests', () => {
        const files = [...sources(new URL('../src', import.meta.url).pathname), ...sources(new URL('.', import.meta.url).pathname)]
            .filter((f) => !f.endsWith('themeBackWiring.test.ts'));
        for (const f of files) {
            const text = readFileSync(f, 'utf8');
            expect(text, f).not.toMatch(/ageBack/);
        }
    });
});

describe('backToChoice stops the house scene (S-29)', () => {
    it('stops SCENE_KEYS.house before starting the welcome', () => {
        const task = readFileSync('src/scenes/TaskScene.ts', 'utf8');
        const fn = /private backToChoice\(\): void \{([\s\S]*?)\n {4}\}/.exec(task);
        expect(fn).not.toBeNull();
        const stop = fn![1].indexOf('this.scene.stop(SCENE_KEYS.house)');
        expect(stop).toBeGreaterThan(-1);
        expect(stop).toBeLessThan(fn![1].indexOf('this.scene.start(SCENE_KEYS.welcome'));
    });
});
