// S12-01 wiring (plan art-stand-in-and-load-signal, phase 6): the import and reset steps of the settings flow must
// judge the device save with `deviceSaveView(saver.status().blockedBy, …)` and hand that view to the dialog, so a
// fresh in-memory session is never shown as "Teraz". The scene needs Phaser and the dialogs need a DOM, so this
// reads the scene source as syntax (formatting does not matter).
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const source = ts.createSourceFile('UIScene.ts', readFileSync(new URL('../src/scenes/UIScene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);

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

const callsOf = (root: ts.Node): string[] => {
    const calls: string[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) calls.push(node.expression.getText(source));
        ts.forEachChild(node, visit);
    };
    visit(root);
    return calls;
};

describe('device save wiring (S12-01)', () => {
    for (const name of ['openImport', 'openReset']) {
        it(`${name} reads the blocked reason from the saver and builds the view`, () => {
            const body = method(name);
            const view = callsOf(body).includes('deviceSaveView');
            expect(view).toBe(true);
            expect(body.getText(source)).toContain('saver.status().blockedBy');
            expect(callsOf(body)).not.toContain('decodeSave');
        });
    }
});
