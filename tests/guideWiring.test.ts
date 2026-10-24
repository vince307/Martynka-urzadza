import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source guards for the fox guide's wiring (the picture on screen is proven by the visual gate and the e2e spec).
describe('fox guide wiring', () => {
    it('the widget never takes input', () => {
        const source = readFileSync('src/ui/widgets/GuideFox.ts', 'utf8');
        expect(source).not.toMatch(/setInteractive\(/);
        expect(source).not.toMatch(/\.on\(\s*['"]pointer/);
    });

    it('the widget asks prefersReducedMotion() before it starts a tween and sizes only after setTexture', () => {
        const source = readFileSync('src/ui/widgets/GuideFox.ts', 'utf8');
        expect(source.indexOf('prefersReducedMotion()')).toBeGreaterThan(-1);
        expect(source.indexOf('prefersReducedMotion()')).toBeLessThan(source.indexOf('tweens.add'));
        expect(source.indexOf('setTexture(')).toBeLessThan(source.indexOf('setDisplaySize('));
        expect(source).toMatch(/textures\.exists\(/);
    });

    it('TaskScene.render calls guidePose( exactly once, before the first return of render()', () => {
        const source = readFileSync('src/scenes/TaskScene.ts', 'utf8');
        const start = source.indexOf('    private render(): void {');
        expect(start).toBeGreaterThan(-1);
        const body = source.slice(start, source.indexOf('\n    }\n', start));
        expect(body.match(/guidePose\(/g)).toHaveLength(1);
        expect(body.indexOf('guidePose(')).toBeLessThan(body.indexOf('return;'));
    });

    it('the fox is created right after the notebook and reported by the snapshot', () => {
        const source = readFileSync('src/scenes/TaskScene.ts', 'utf8');
        expect(source.indexOf('new GuideFox(this)')).toBeGreaterThan(source.indexOf('drawNotebook(this)'));
        expect(source).toMatch(/guide: this\.guide\.snapshot\(\)/);
    });

    it('GuideFox decides availability once in the constructor, records the absence and never checks a texture per pose', () => {
        const source = readFileSync('src/ui/widgets/GuideFox.ts', 'utf8');
        expect(source.match(/guideAvailable\(/g)).toHaveLength(1);
        const ctor = source.slice(source.indexOf('constructor('), source.indexOf('/** `null` hides'));
        expect(ctor).toContain('guideAvailable(');
        expect(source).toMatch(/recordFallback\([^)]*'guide'/);
        const show = source.slice(source.indexOf('    show(pose'), source.indexOf('    snapshot()'));
        expect(show).not.toMatch(/textures\.exists/);
        expect(show).toMatch(/this\.requested = pose/);
    });

    it('UIScene passes the three fox keys as noStandIn to artHealthLines', () => {
        const source = readFileSync('src/scenes/UIScene.ts', 'utf8');
        const call = source.slice(source.indexOf('artHealthLines({'));
        expect(call.slice(0, call.indexOf('}),'))).toMatch(/noStandIn:/);
    });
});
