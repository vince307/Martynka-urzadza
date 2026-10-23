// Phase 7 wiring of notebook-polish: the answer feedback motion. Reads the scenes as syntax, so it proves order and
// anchors (the counter number stays synchronous, the pop waits for the star), not the rendered motion (e2e does).
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const load = (file: string): ts.SourceFile => ts.createSourceFile(file, readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const task = load('src/scenes/TaskScene.ts');
const ui = load('src/scenes/UIScene.ts');

const method = (source: ts.SourceFile, name: string): string => {
    let found: ts.Node | undefined;
    const visit = (node: ts.Node): void => {
        if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) found = node;
        ts.forEachChild(node, visit);
    };
    visit(source);
    if (!found) throw new Error(`method ${name} not found`);
    return found.getText(source);
};

/** The text of the arrow function assigned to `const <name> = ...` inside the file. */
const arrow = (source: ts.SourceFile, name: string): string => {
    let found: ts.Node | undefined;
    const visit = (node: ts.Node): void => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) found = node.initializer;
        ts.forEachChild(node, visit);
    };
    visit(source);
    if (!found) throw new Error(`const ${name} not found`);
    return found.getText(source);
};

describe('answer feedback motion (notebook-polish phase 7)', () => {
    it('onStars sets the counter number directly, never behind the star', () => {
        const body = arrow(ui, 'onStars');
        expect(body).toMatch(/this\.counter\.setValue\(value\)/);
        expect(body).not.toMatch(/starLanded|pop\(/);
    });

    it('the pop is the handler of starLanded', () => {
        const body = arrow(ui, 'onStarLanded');
        expect(body).toMatch(/this\.counter\.pop\(\)/);
        expect(body).not.toMatch(/setValue/);
        expect(ui.getText()).toMatch(/events\.on\(GAME_EVENTS\.starLanded,\s*onStarLanded\)/);
        expect(ui.getText()).toMatch(/events\.off\(GAME_EVENTS\.starLanded,\s*onStarLanded\)/);
    });

    it('flyStar emits starLanded in onComplete, after the star is destroyed', () => {
        const body = method(task, 'flyStar');
        const complete = body.slice(body.indexOf('onComplete'));
        expect(complete).toMatch(/star\.destroy\(\)/);
        expect(complete).toMatch(/emit\(GAME_EVENTS\.starLanded\)/);
        expect(complete.indexOf('star.destroy()')).toBeLessThan(complete.indexOf('starLanded'));
        expect(body.slice(0, body.indexOf('onComplete'))).not.toMatch(/starLanded/);
    });

    it('the scene no longer shakes the camera', () => {
        expect(task.getText()).not.toMatch(/scrollX/);
        expect(task.getText()).not.toMatch(/cameras\.main/);
        expect(task.getText()).not.toMatch(/shake/);
    });

    it('submit wobbles a wrong answer and bounces a done one after render', () => {
        const body = method(task, 'submit');
        expect(body).toMatch(/this\.wobble\(face\)/);
        expect(body).toMatch(/this\.bounce\(face\)/);
        expect(body.indexOf('this.wobble(face)')).toBeLessThan(body.indexOf('this.render()'));
        expect(body.indexOf('this.render()')).toBeLessThan(body.indexOf('this.bounce(face)'));
    });

    it('wobble and bounce ask for reduced motion first', () => {
        for (const name of ['wobble', 'bounce']) {
            const body = method(task, name);
            expect(body.indexOf('prefersReducedMotion()')).toBeGreaterThan(-1);
            expect(body.indexOf('prefersReducedMotion()')).toBeLessThan(body.indexOf('tweens.'));
        }
    });

    it('a repaint at the same rect keeps the OK bounce and wobble, and a wobble sways around the current place (review fix)', () => {
        const chunky = load('src/ui/widgets/chunky.ts');
        const place = method(chunky, 'place');
        // The "OK" of select and drag modes is re-shown by every render that follows submit: an early return before reset()
        // is what keeps the wobble started just before that render.
        expect(place).toMatch(/if \(same\) \{[\s\S]*?return;/);
        expect(place.indexOf('if (same)')).toBeLessThan(place.indexOf('this.reset()'));
        expect(method(chunky, 'reset')).toMatch(/setPosition\(this\.baseX, this\.baseY\)/);
        const wobble = method(task, 'wobble');
        expect(wobble).not.toMatch(/getData|setData/);
        expect(wobble.indexOf('this.stopWobble()')).toBeLessThan(wobble.indexOf('const rest = target.x'));
        expect(method(task, 'stopWobble')).toMatch(/isPlaying\(\)[\s\S]*setX\(wobbling\.rest\)/);
    });

    it('the keypad star starts at the entry field', () => {
        expect(method(task, 'answerSpot')).toMatch(/case 'keypad': return this\.keypad\.entryTarget\(\)/);
    });
});
