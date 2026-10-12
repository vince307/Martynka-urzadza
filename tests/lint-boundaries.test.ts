import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

// The boundary rules from eslint.config.mjs, exercised on synthetic sources
// so a config regression fails here before it lets a violation through.
// Typed rules are off for these texts (no real file behind the path).
const eslint = new ESLint({
    overrideConfig: [{ ...tseslint.configs.disableTypeChecked, files: ['**/*.ts'] }],
});

const ruleIds = async (code: string, filePath: string): Promise<string[]> => {
    const [result] = await eslint.lintText(code, { filePath });
    return result.messages.map((m) => m.ruleId ?? m.message);
};

describe('module boundaries', () => {
    it('src/core must not import Phaser', async () => {
        expect(await ruleIds("import { Game } from 'phaser';\nexport const g = Game;\n", 'src/core/x.ts')).toContain('no-restricted-imports');
        expect(await ruleIds("import Scene from 'phaser/src/scene/Scene';\nexport const s = Scene;\n", 'src/core/x.ts')).toContain('no-restricted-imports');
    });

    it('src/core must not touch browser globals', async () => {
        expect(await ruleIds('export const w = window.innerWidth;\n', 'src/core/x.ts')).toContain('no-restricted-globals');
        expect(await ruleIds('export const n = navigator.userAgent;\n', 'src/core/x.ts')).toContain('no-restricted-globals');
    });

    it('src/data may import from core only text helpers and types', async () => {
        expect(await ruleIds("import { generators } from '../core/tasks/registry';\nexport const g = generators;\n", 'src/data/x.ts')).toContain('no-restricted-imports');
        expect(await ruleIds("import { createRng } from '../../core/rng';\nexport const r = createRng;\n", 'src/data/curriculum/x.ts')).toContain('no-restricted-imports');
        expect(await ruleIds("import type { Task } from '../core/tasks/types';\nexport type T = Task;\n", 'src/data/x.ts')).not.toContain('no-restricted-imports');
        expect(await ruleIds("import { countNoun } from '../core/text/plural';\nexport const c = countNoun;\n", 'src/data/x.ts')).not.toContain('no-restricted-imports');
    });

    it('scenes may import Phaser and use the browser', async () => {
        expect(await ruleIds("import { Scene } from 'phaser';\nexport const s = Scene;\nexport const w = window.innerWidth;\n", 'src/scenes/x.ts')).toEqual([]);
    });
});
