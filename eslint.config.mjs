// ESLint flat config. Besides the recommended TypeScript rules it enforces the
// module boundaries from AGENTS.md: src/core stays free of Phaser and browser
// globals (pure, testable logic) and src/data may reach into core only for
// the pure text helpers and for types.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const IDB_KEYVAL = { name: 'idb-keyval', message: 'Only src/storage/idb.ts may import idb-keyval.' };
const IDB_KEYVAL_SUBPATHS = { group: ['idb-keyval/*'], message: 'Only src/storage/idb.ts may import idb-keyval.' };

export default defineConfig([
    globalIgnores(['dist/**', 'dist-e2e/**', 'dev-dist/**', '.claude/**', 'context/**', 'designs/**', 'docs/**']),
    {
        files: ['**/*.ts', '**/*.mts'],
        extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // Vite configs and plain Node scripts are outside tsconfig: untyped rules only.
        files: ['**/*.mjs'],
        extends: [js.configs.recommended],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['src/scenes/**', 'src/pwa/**', 'src/ui/**', 'src/testing/**', 'src/storage/**', 'src/main.ts'],
        languageOptions: { globals: globals.browser },
    },
    {
        // idb-keyval has one importer: src/storage/idb.ts (the only browser-storage module).
        // Core and data repeat their own restrictions below: a flat-config rule is replaced, not merged.
        files: ['src/scenes/**', 'src/pwa/**', 'src/ui/**', 'src/testing/**', 'src/main.ts'],
        rules: {
            'no-restricted-imports': ['error', { paths: [IDB_KEYVAL], patterns: [IDB_KEYVAL_SUBPATHS] }],
        },
    },
    {
        files: ['src/core/**'],
        rules: {
            'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'indexedDB', 'speechSynthesis', 'SpeechSynthesisUtterance'],
            'no-restricted-imports': [
                'error',
                {
                    paths: [{ name: 'phaser', message: 'src/core must stay Phaser-free (AGENTS.md).' }, IDB_KEYVAL],
                    patterns: [{ group: ['phaser/*'], message: 'src/core must stay Phaser-free (AGENTS.md).' }, IDB_KEYVAL_SUBPATHS],
                },
            ],
        },
    },
    {
        files: ['src/data/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [IDB_KEYVAL],
                    patterns: [
                        IDB_KEYVAL_SUBPATHS,
                        {
                            regex: '^(\\.\\./)+core/(?!text/)',
                            allowTypeImports: true,
                            message: 'src/data may import from src/core only core/text/* or types (AGENTS.md).',
                        },
                    ],
                },
            ],
        },
    },
]);
