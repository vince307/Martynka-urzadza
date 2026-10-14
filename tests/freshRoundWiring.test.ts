// ASL-01 wiring: TaskScene.freshRound must hand the pictures that did not load (REGISTRY_KEYS.artHealth) to the round and
// warm-up builders. Both parameters are optional, so dropping them still type-checks and the e2e forced-skills path returns
// before them. This reads the scene source as syntax; it proves the wiring, while tests/artFilter.test.ts proves the filter.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const source = ts.createSourceFile('TaskScene.ts', readFileSync(new URL('../src/scenes/TaskScene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);

const freshRound = ((): ts.MethodDeclaration => {
    let found: ts.MethodDeclaration | undefined;
    const visit = (node: ts.Node): void => {
        if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'freshRound') found = node;
        ts.forEachChild(node, visit);
    };
    visit(source);
    if (!found) throw new Error('method freshRound not found');
    return found;
})();

const calls = (name: string): ts.CallExpression[] => {
    const found: ts.CallExpression[] = [];
    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && node.expression.getText(source) === name) found.push(node);
        ts.forEachChild(node, visit);
    };
    visit(freshRound);
    return found;
};

describe('freshRound art wiring (ASL-01)', () => {
    it('reads the missing ids from the art health record', () => {
        expect(freshRound.getText(source)).toContain('REGISTRY_KEYS.artHealth');
    });

    it('passes missingIds to buildAdaptiveRound', () => {
        const [call] = calls('buildAdaptiveRound');
        expect(call).toBeDefined();
        const options = call?.arguments.find(ts.isObjectLiteralExpression);
        const names = options?.properties.map((p) => p.name?.getText(source) ?? '');
        expect(names).toContain('missingIds');
    });

    it('passes the blocked predicate to buildWarmup', () => {
        const [call] = calls('buildWarmup');
        expect(call).toBeDefined();
        expect(call?.arguments.some((a) => a.getText(source) === 'blocked')).toBe(true);
    });
});
