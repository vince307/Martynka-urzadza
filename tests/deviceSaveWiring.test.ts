// S12-01 wiring (plan art-stand-in-and-load-signal, phase 6; SIR-02 and SIR-04 added by save-reason-and-recovery): the import and reset steps of the settings flow must
// judge the device save with `deviceSaveView(saver.status(), …)` and hand that view to the dialog, so a
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
            expect(body.getText(source)).toContain('saver.status()');
            expect(callsOf(body)).not.toContain('decodeSave');
        });
    }

    for (const name of ['openImport', 'openReset']) {
        it(`${name} hands the dialog's force flag on to saver.replace (SIR-02)`, () => {
            const replaceCalls: ts.CallExpression[] = [];
            const visit = (node: ts.Node): void => {
                if (ts.isCallExpression(node) && node.expression.getText(source) === 'saver.replace') replaceCalls.push(node);
                ts.forEachChild(node, visit);
            };
            visit(method(name));
            expect(replaceCalls).toHaveLength(1);
            const [state, options] = replaceCalls[0].arguments;
            expect(state?.getText(source)).toBe('state');
            expect(options?.getText(source).replace(/\s/g, '')).toBe('{force}');
        });
    }

    it('openExport judges the device save from saver.status() and passes the warning on (SIR-04)', () => {
        const body = method('openExport');
        expect(callsOf(body)).toContain('deviceSaveView');
        const text = body.getText(source);
        expect(text).toContain('saver.status()');
        expect(text).toContain('pl.saveTransfer.exportNotDevice');
        // O4: the argument and the warning are the real ones, not just present somewhere.
        expect(text).toContain('deviceSaveView(saver.status(), saver.current(), ROOMS)');
        expect(text).toMatch(/device\.kind === 'summary' \? \{\} : \{ warning: pl\.saveTransfer\.exportNotDevice \}/);
    });

    for (const name of ['openImport', 'openReset']) {
        it(`${name} shows a broken device save in the dialog instead of closing the panel silently (SVB-04)`, () => {
            const text = method(name).getText(source);
            expect(text).toContain("device.kind === 'broken' ? this.brokenView(saver)");
            expect(text.slice(0, text.indexOf('openSave'))).not.toContain('closeSettings');
            const helper = method('brokenView').getText(source);
            expect(helper).toContain('saveProblem(saver.current())');
            expect(helper).toContain("cause: 'broken'");
        });
    }

    it('openExport validates the state before it builds the file and returns null when it does not (S12-04)', () => {
        const text = method('openExport').getText(source);
        const check = text.indexOf('saveProblem(saver.current())');
        expect(check).toBeGreaterThan(-1);
        expect(text.indexOf('return null')).toBeGreaterThan(check);
        expect(text.indexOf('exportFileText(')).toBeGreaterThan(check);
    });
});

describe('keep a copy of the old save (save-truth p9, SV2-04)', () => {
    it('the panel reads the copies once through the saver and opens the export inside the input session', () => {
        const text = method('openSettings').getText(source);
        expect(text.match(/saver\.readBackups\(\)/g)).toHaveLength(1);
        expect(text).toContain('session.run(() => this.openBackupExport(newest, session))');
        expect(text).not.toContain('REGISTRY_KEYS.store');
    });
    it('openBackupExport exports the raw copy behind the confirmation dialog and closes through the session', () => {
        const body = method('openBackupExport');
        const text = body.getText(source).replace(/\s+/g, ' ');
        expect(callsOf(body)).toContain('openSaveExportDialog');
        expect(text).toContain("kind: 'raw'");
        expect(text).toContain('raw: copy.raw');
        expect(text).toContain('session.run(() => this.closeSettings())');
    });
});
