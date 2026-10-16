// SV2-10 wiring: a variant round (daily puzzle, minigame) is counted in the same write as its stars, at the answer that
// settles the last task, so closing the game before "Dalej" cannot replay it. The flag must be reset in applyRound (plan
// review F1: create and applyParentStage open a round through it too). This reads TaskScene as syntax: it proves the call
// order and the reset point, not the saved bytes (tests/e2e/daily-puzzle.spec.ts does).
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const source = ts.createSourceFile('TaskScene.ts', readFileSync(new URL('../src/scenes/TaskScene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);

const method = (name: string): ts.MethodDeclaration => {
    let found: ts.MethodDeclaration | undefined;
    const visit = (node: ts.Node): void => {
        if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) found = node;
        ts.forEachChild(node, visit);
    };
    visit(source);
    if (!found) throw new Error(`method ${name} not found`);
    return found;
};

const text = (name: string): string => method(name).getText(source);

describe('variant round counting (SV2-10)', () => {
    it('submit counts a variant behind lastTaskSettled and sets the flag', () => {
        const body = text('submit');
        expect(body).toMatch(/lastTaskSettled\(prior,\s*this\.state\)/);
        expect(body).toMatch(/this\.kind\s*!==\s*'round'/);
        expect(body).toMatch(/this\.countRound\(this\.kind\)/);
        expect(body).toMatch(/this\.variantCounted\s*=\s*true/);
        expect(body).toMatch(/flush\('now'\)/);
        expect(body.indexOf('lastTaskSettled')).toBeLessThan(body.indexOf('countRound'));
    });

    it('finishVariant skips countRound when the round was counted, and still flushes', () => {
        const body = text('finishVariant');
        expect(body).toMatch(/this\.variantCounted/);
        expect(body).toMatch(/countRound\(kind\)/);
        expect(body).toMatch(/flush\('now'\)/);
        expect(body.indexOf('variantCounted')).toBeLessThan(body.indexOf('countRound'));
    });

    it('applyRound resets the flag and clears reported', () => {
        const body = text('applyRound');
        expect(body).toMatch(/this\.variantCounted\s*=\s*false/);
        expect(body).toMatch(/this\.reported\s*=\s*null/);
    });

    it('beginRound does not own the reset (it would miss create and applyParentStage)', () => {
        expect(text('beginRound')).not.toMatch(/variantCounted/);
    });
});
