// C-2 wiring (plan observability-c1-c2, impl-review): every parent-dialog callback in a scene must run inside
// `session.run(…)`, so a throw ends the input hold before it reaches the error boundary. The release itself is
// proven in inputSuspend.test.ts; the scenes need Phaser and cannot run here, and in the e2e build the error card
// holds the input for good, so a callback moved outside the session leaves every other suite green. This test reads
// the scene sources as syntax (not text), so formatting changes do not matter.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const DIALOG_CALLBACKS = new Set(['onPass', 'onConfirm', 'onCancel']);

interface Callback {
    name: string;
    line: number;
    inSession: boolean;
}

const isSessionRun = (node: ts.Node): boolean =>
    ts.isCallExpression(node)
    && ts.isPropertyAccessExpression(node.expression)
    && ts.isIdentifier(node.expression.expression)
    && node.expression.expression.text === 'session'
    && node.expression.name.text === 'run';

const dialogCallbacks = (file: string): Callback[] => {
    const source = ts.createSourceFile(file, readFileSync(new URL(`../src/scenes/${file}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
    const found: Callback[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && DIALOG_CALLBACKS.has(node.name.text)) {
            const value = node.initializer;
            found.push({
                name: node.name.text,
                line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                inSession: ts.isArrowFunction(value) && isSessionRun(value.body),
            });
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
};

describe('parent dialog callbacks run in the input session (C-2)', () => {
    // Expected counts keep the test from passing on a file where the callbacks moved elsewhere.
    it.each([
        ['UIScene.ts', 4],
        ['WelcomeScene.ts', 4],
    ])('%s wraps every onPass/onConfirm/onCancel in session.run', (file, count) => {
        const callbacks = dialogCallbacks(file);
        expect(callbacks).toHaveLength(count);
        expect(callbacks.filter((c) => !c.inSession).map((c) => `${c.name} at line ${c.line}`)).toEqual([]);
    });
});
