---
date: 2026-10-12T18:10:00+02:00
researcher: Claude (orkiestrator, sesja 2026-10-12)
git_commit: 1231ed0
branch: m1/testing-quality-gates
repository: Martynka-urzadza
topic: "Etap 1 planu testów (bramki jakości i granice modułów): ESLint 10 + typescript-eslint 8 w konfiguracji flat z regułami granic core/data, lint i sample w CI na PR, stan hooków"
tags: [research, eslint, typescript-eslint, ci, hooks, test-plan, M1]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (orkiestrator)
---

# Research: testing-quality-gates

**Date**: 2026-10-12T18:10:00+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-12)
**Git Commit**: 1231ed0
**Branch**: m1/testing-quality-gates
**Repository**: Martynka-urzadza

## Research Question

Ground rollout Phase 1 of `context/foundation/test-plan.md` („Quality gates and module boundaries”). Risks: #6 (scena z tekstem/balansem lub `core/` z Phaserem) i #5 (dane etapu bez rozwiązań / pusty krok). Pytania: (1) czy obecny graf importów spełnia granice z AGENTS.md; (2) jaka konfiguracja ESLint 10 + typescript-eslint 8 egzekwuje te granice i co zgłasza na bieżącym kodzie; (3) jak wpiąć lint, typecheck, testy i `sample` w CI na PR (dziś CI działa tylko po pushu na `main`); (4) co już robią hooki lokalne.

## Summary

- Graf importów (sprawdzone grep, stan `1231ed0`): `src/core` nie importuje `phaser` ani nie używa `window`/`document`/`navigator`/`localStorage` (0 trafień); `src/data` importuje z `core` wyłącznie `core/text/plural` (wartości i typ) oraz `import type` z `core/types`; `core/tasks/generators/*` importują `data/pl`, `data/nouns`, `data/wordTemplates`, `data/calendar` (kierunek `core → data` dopuszczony w planie S-02). Phaser importują tylko `src/main.ts` i `src/scenes/BootScene.ts`.
- Wersje (npm 2026-10-12): `eslint` 10.12.0 (Node ^20.19 || ^22.13 || ≥24), `@eslint/js` 10.0.1, `typescript-eslint` 8.71.1 (peer eslint ^8.57||^9||^10, TS <6.1), `globals` 17.13.0; `eslint-plugin-import-x` niepotrzebny (reguły granic są w rdzeniu ESLint).
- ESLint 10: tylko flat config; `defineConfig`/`globalIgnores` z `eslint/config`; bez `"type": "module"` w `package.json` plik `eslint.config.js` jako ESM działa, ale Node ostrzega o reparsowaniu, więc `eslint.config.mjs`. `tseslint.config()` jest przestarzałe na rzecz `defineConfig`; `@typescript-eslint/no-restricted-imports` przestarzałe od ESLint 9.37, bo rdzeniowe `no-restricted-imports` obsługuje `import type`, specyfikatory `type` i `allowTypeImports` (sprawdzone w źródle reguły).
- Zweryfikowana konfiguracja (agent uruchomił ją na kopii repo: 71 plików, 2,2 s pełny bieg, 1,2 s jeden plik): obiekt dla `**/*.ts, **/*.mts` z `js.configs.recommended` + `tseslint.configs.recommendedTypeChecked` i `projectService: true`; osobny nietypowany obiekt dla `**/*.mjs` z `globals.node`; `globals.browser` dla `src/scenes`, `src/pwa`, `src/ui`, `src/main.ts`; dla `src/core/**` `no-restricted-globals` (window, document, navigator, localStorage) i `no-restricted-imports` z `phaser` i `phaser/*`; dla `src/data/**` `no-restricted-imports` z `patterns: [{ regex: '^(\\.\\./)+core/(?!text/)', allowTypeImports: true }]`. Sprawdzone: `import type` z `../core/types` OK, `../core/text/plural` OK, wartość z `../core/tasks/*` błąd, mieszany `{ X, type T }` błąd, głębokość `../../core` obsłużona.
- Baseline tej konfiguracji na bieżącym `main`: 3 błędy — `no-unnecessary-type-assertion` w `src/core/tasks/generators/addSub.ts:40` i `evenOdd.ts:57` (autofix), `no-unsafe-argument` w `word.ts:21` (`any` → `WordKind`). Luka reguł: `globalThis.window` nie jest wykrywane (można dodać `no-restricted-properties`).
- CLI: `--max-warnings 0` (warningi liczą się mimo `--quiet`), `--no-warn-ignored` dla hooka na pojedynczym pliku; exit 2 = błąd konfiguracji. Skrypt `"lint": "eslint --max-warnings 0 ."` z `globalIgnores(['dist/**', 'dev-dist/**'])`.
- CI: `.github/workflows/deploy.yml` uruchamia się na `push: main` i `workflow_dispatch` (`:5-12`); job `build` ma `npm ci`, `typecheck`, `test`, `build`. Brak workflow na `pull_request`, więc bramka „CI on PR” z planu testów wymaga nowego workflow (lint, typecheck, test, `sample -- E3`, `sample -- E4`, build) i opcjonalnie wymagania statusu w ochronie gałęzi `main`.
- Hooki lokalne (`.claude/hooks/`, gitignored): `lint-edited-file.sh` (`npx eslint --quiet "$FILE"`, exit 2 + stderr) i `end-of-turn.sh` (ESLint na zmienionych plikach, `tsc`, `vitest run`, `stop_hook_active`) są gotowe i samopomijające się do czasu instalacji ESLint; `related-tests.sh` działa od F-03. `/10x-configure-hook` audytuje je i dowodzi po instalacji (poza repo: `.claude/` jest lokalne).

## Detailed Findings

### 1. Granice modułów (stan faktyczny)

- `src/data/wordTemplates.ts:5` — `import { countNoun, pluralCategory, type PluralForms } from '../core/text/plural'`.
- `src/data/nouns.ts:4` — `import type { PluralForms } from '../core/text/plural'`.
- `src/data/curriculum/{E3,E4,index}.ts` — `import type { … } from '../../core/types'`.
- `src/core/tasks/generators/*.ts` — importy `data/pl`, `data/nouns`, `data/wordTemplates`, `data/calendar` (10 plików).
- Reguła z AGENTS.md („`src/data/` imports only `src/core/text/*` and types”) i CLAUDE.md jest spełniona; brak egzekwowania (ryzyko #6).

### 2. Konfiguracja ESLint (zweryfikowana przez agenta)

Plik `eslint.config.mjs` (treść w raporcie agenta; do przepisania 1:1 w fazie 1). Uwagi:
- `tsconfigRootDir: import.meta.dirname` zalecane przez parser; pliki poza tsconfig (`vite/*.mjs`, `scripts/make-icons.mjs`) lintowane bez typów, więc `allowDefaultProject` niepotrzebne.
- Wariant globowy `group: ['../core/*', '../../core/*', '!../core/text', '!../../core/text']` daje identyczne wyniki, ale regex obsługuje dowolną głębokość.
- `reportUnusedDisableDirectives: "warn"` domyślnie; z `--max-warnings 0` nieużyte `eslint-disable` też blokują.

### 3. CI i ochrona gałęzi

- Ochrona `main` (ustawiona 2026-10-11 przez API): wymagany PR, admini zwolnieni, bez wymaganych statusów. Nowy workflow `ci.yml` na `pull_request` (i `push` na gałęzie inne niż `main`?) — tylko `pull_request` wystarcza, bo każda zmiana idzie przez PR. Po pierwszym zielonym biegu można dodać wymagany status `ci` w ochronie gałęzi (decyzja właściciela; nie blokuje).
- `deploy.yml` job `build` powinien też uruchamiać `npm run lint`, żeby `main` nie wdrażał kodu z błędami lintu wprowadzonymi poza PR (admini).

### 4. Hooki

Skrypty czytają `tool_input.file_path`, exit 2 + stderr (kanał czytany przez Claude Code), `stop_hook_active` obsłużone, timeouty w sekundach (30/60/120). `lint-edited-file.sh` używa `--quiet` bez `--max-warnings 0` — warningi nie blokują na pojedynczej edycji (spójne z końcem tury: tam też `--quiet`). Do rozważenia w `/10x-configure-hook`: `--max-warnings 0 --no-warn-ignored`.

## Code References

- `src/data/wordTemplates.ts:5`, `src/data/nouns.ts:4`, `src/data/curriculum/index.ts:4` - importy data → core
- `src/core/tasks/generators/compareNum.ts:4-5` - importy core → data
- `src/main.ts:1`, `src/scenes/BootScene.ts:1` - jedyne importy Phasera
- `.github/workflows/deploy.yml:5-12,30-36` - wyzwalacze i job build
- `package.json:14-21` - skrypty (brak `lint`)
- `.claude/hooks/lint-edited-file.sh:8,20`, `.claude/hooks/end-of-turn.sh:31-48` - hooki (lokalne)

## Architecture Insights

- Granice jako reguły ESLint scoped per katalog (`files`) zamiast własnego skryptu — zgodnie z wytyczną ryzyka #6 („nie pisać skryptu, który powtarza ESLint”).
- Dwa workflowy: `ci.yml` (PR: lint, typecheck, test, sample, build) i `deploy.yml` (main: to samo + deploy). Wspólne kroki można później wynieść do reusable workflow; na razie duplikacja 5 linii.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-generator-test-harness/`: vitest i hooki samopomijające; `context/archive/2026-10-12-generators-e3-e4/reviews/plan-review.md` F1: reguła importów `data → core/text` do zapisania w AGENTS.md (zrobione) i egzekwowania lintem (ten etap).

## Related Research

- `context/archive/2026-10-12-generator-test-harness/research.md` (vitest, hooki).

## Open Questions

1. Czy dodać wymagany status `ci` do ochrony `main` po pierwszym zielonym PR? Propozycja: tak, przez API po merge tej zmiany (admini nadal zwolnieni).
2. Czy w hooku per-edit blokować także warningi (`--max-warnings 0`)? Propozycja: tak, spójnie z `npm run lint`.
