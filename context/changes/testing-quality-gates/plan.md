# Bramki jakości i granice modułów — Implementation Plan

## Overview

Etap 1 planu testów (`context/foundation/test-plan.md` §3): ESLint 10 z typescript-eslint 8 w konfiguracji flat egzekwuje granice z AGENTS.md (`src/core` bez Phasera i globali przeglądarki; `src/data` importuje z `core` tylko `core/text/*` i typy), lint wchodzi do skryptów npm, hooków lokalnych i CI; nowy workflow na `pull_request` uruchamia lint, typecheck, testy, `sample` E3/E4 (smoke treści) i build; dokumentacja i cookbook planu testów dostają przepis na regułę granic. Ryzyka #6 i #5 z mapy ryzyk.

## Current State Analysis

Z `context/changes/testing-quality-gates/research.md`: graf importów już spełnia granice (0 naruszeń); brak ESLint i skryptu `lint`; zweryfikowana konfiguracja daje 3 błędy bazowe (2 autofix `no-unnecessary-type-assertion`, 1 `no-unsafe-argument` w `word.ts`); CI tylko na `push: main` (`deploy.yml`), brak workflow na PR; hooki lokalne gotowe na ESLint (samopomijające).

## Desired End State

`npm run lint` zielone (`--max-warnings 0`); celowe naruszenie granicy (`import Phaser` w `src/core`, wartość z `../core/tasks` w `src/data`) kończy się błędem lintu; PR uruchamia `ci.yml` (lint, typecheck, test, sample E3/E4, build) i jest zielony; `deploy.yml` lintuje przed buildem; hooki lokalne blokują edycję z błędem lintu (dowiedzione przez `/10x-configure-hook`); `test-plan.md` §3 etap 1 = `complete`, §6.3 wypełnione; CLAUDE.md/AGENTS.md wymieniają `npm run lint`.

### Key Discoveries:

- `no-restricted-imports` z `regex` i `allowTypeImports` w rdzeniu ESLint 10 pokrywa regułę `data → core/text`; `@typescript-eslint/no-restricted-imports` jest przestarzałe (research §2).
- `eslint.config.mjs`, bo `package.json` nie ma `"type": "module"` (research Summary).
- Pliki `.mjs` poza tsconfig lintowane bez typów, bez `allowDefaultProject` (research §2).

## What We're NOT Doing

- Prettier/formatowanie, reguły stylu poza `recommendedTypeChecked`; `eslint-plugin-import-x`.
- Git pre-commit (Husky) — zalecenie w raporcie `/10x-configure-hook`, bez konfiguracji.
- Testy własności nad danymi (etap 3), smoke deployu (etap 2), e2e (§7).
- Wymagany status w ochronie gałęzi — osobna decyzja po pierwszym zielonym PR (Open Question 1).

## Implementation Approach

Trzy fazy: (1) ESLint lokalnie z regułami granic i czystym baseline; (2) CI na PR i lint w deployu; (3) hooki (`/10x-configure-hook`: audyt, dowód na zepsutym pliku) i dokumentacja (cookbook §6.3, status §3, CLAUDE.md, AGENTS.md).

## Phase 1: ESLint z regułami granic

### Overview

Instalacja, konfiguracja flat, skrypt `lint`, naprawa 3 błędów bazowych, test negatywny reguł granic.

### Changes Required:

#### 1. Zależności i skrypt

**File**: `package.json`, `package-lock.json`

**Contract**: `devDependencies`: `eslint ^10.12.0`, `@eslint/js ^10.0.1`, `typescript-eslint ^8.71.1`, `globals ^17.13.0`. Skrypt `"lint": "eslint --max-warnings 0 ."`.

#### 2. Konfiguracja

**File**: `eslint.config.mjs` (nowy)

**Contract**: Dokładnie konfiguracja z research §2: `globalIgnores(['dist/**', 'dev-dist/**'])`; obiekt `**/*.ts, **/*.mts` z `js.configs.recommended` + `tseslint.configs.recommendedTypeChecked`, `projectService: true`, `tsconfigRootDir: import.meta.dirname`; obiekt `**/*.mjs` z `js.configs.recommended` i `globals.node`; `globals.browser` dla `src/scenes/**`, `src/pwa/**`, `src/ui/**`, `src/main.ts`; `src/core/**`: `no-restricted-globals` (`window`, `document`, `navigator`, `localStorage`) i `no-restricted-imports` (`phaser`, `phaser/*`) z komunikatami; `src/data/**`: `no-restricted-imports` `patterns: [{ regex: '^(\\.\\./)+core/(?!text/)', allowTypeImports: true, message }]`. Komentarz nagłówkowy po angielsku z odwołaniem do AGENTS.md.

#### 3. Baseline

**File**: `src/core/tasks/generators/addSub.ts`, `src/core/tasks/generators/evenOdd.ts`, `src/core/tasks/generators/word.ts` (i inne, jeśli lint wskaże)

**Contract**: Usunąć zbędne asercje typu; w `word.ts` zawęzić `kinds` przez `isWordKind` zamiast `any`. Zero zmian zachowania (testy bez zmian przechodzą).

#### 4. Test negatywny reguł granic

**File**: `tests/lint-boundaries.test.ts` (nowy)

**Contract**: Test vitest uruchamia ESLint programowo (`import { ESLint } from 'eslint'`, `lintText` z `filePath` wskazującym fikcyjny plik w `src/core/x.ts` i `src/data/x.ts`) i sprawdza: `import Phaser from 'phaser'` w core → błąd `no-restricted-imports`; `window.alert()` w core → `no-restricted-globals`; `import { generators } from '../core/tasks/registry'` w data → błąd; `import type { Task } from '../core/tasks/types'` i `import { countNoun } from '../core/text/plural'` w data → brak błędów. `lintText` z `filePath` nieistniejącego pliku wymaga `projectService` z `allowDefaultProject`? Nie: test tworzy pliki tymczasowe w `src/core/__lint__/` i `src/data/__lint__/`? Zamiast tego użyć `ESLint` z `overrideConfig` wyłączającym reguły typowane dla tych ścieżek (`languageOptions.parserOptions.projectService: false`, parser bez typów) — reguły granic nie potrzebują typów. Ostateczny mechanizm do potwierdzenia w implementacji; kryterium: test przechodzi i faktycznie wywołuje reguły (asercja na `ruleId`).

### Success Criteria:

#### Automated Verification:

- `npm run lint` kończy się kodem 0; `npm run typecheck` i `npm test` zielone
- `npx vitest run tests/lint-boundaries.test.ts` przechodzi (4 asercje na `ruleId`)
- `grep -c "no-restricted-imports" eslint.config.mjs` ≥ 2; `grep -c allowTypeImports eslint.config.mjs` = 1

#### Manual Verification:

- Celowy `import { Game } from 'phaser'` w `src/core/rng.ts` → `npm run lint` czerwony z komunikatem o `core/`; cofnięty

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: CI na PR i lint w deployu

### Overview

Nowy workflow na `pull_request`; `deploy.yml` lintuje przed buildem.

### Changes Required:

#### 1. Workflow CI

**File**: `.github/workflows/ci.yml` (nowy)

**Contract**: `name: CI`; `on: pull_request` (wszystkie gałęzie docelowe) oraz `workflow_dispatch`; `permissions: contents: read`; `concurrency` per ref z `cancel-in-progress: true`; job `check` (ubuntu-latest, Node 22, `cache: npm`): `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run sample -- E3`, `npm run sample -- E4`, `npm run build`. Akcje pinowane jak w `deploy.yml` (`actions/checkout@v4`, `actions/setup-node@v7`).

#### 2. Lint w deployu

**File**: `.github/workflows/deploy.yml`

**Contract**: W jobie `build` krok `- run: npm run lint` przed `typecheck`.

### Success Criteria:

#### Automated Verification:

- `ruby -ryaml -e 'YAML.load_file(".github/workflows/ci.yml")'` i to samo dla `deploy.yml`; `grep -c 'npm run lint' .github/workflows/ci.yml .github/workflows/deploy.yml` = 1 w każdym
- `grep -c 'sample -- E3' .github/workflows/ci.yml` = 1

#### Manual Verification:

- Po pushu gałęzi i otwarciu PR workflow `CI` jest zielony (`gh run list --workflow ci.yml`)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Hooki i dokumentacja

### Overview

`/10x-configure-hook`: audyt i dowód hooków lokalnych z ESLint; cookbook i status w planie testów; CLAUDE.md/AGENTS.md.

### Changes Required:

#### 1. Hooki lokalne (poza repo)

**File**: `.claude/hooks/lint-edited-file.sh`, `.claude/hooks/end-of-turn.sh` (gitignored; zmiany tylko lokalne)

**Contract**: Wg `/10x-configure-hook`: `--max-warnings 0 --no-warn-ignored` w hooku per-edit, końcówka tury bez zmian poza `--max-warnings 0`; dowód na zepsutym pliku (lint), poprawnym, pomijanym typie, nieistniejącym, pustym payloadzie, `stop_hook_active`, edycji przez powłokę. Raport w `context/changes/testing-quality-gates/reviews/hooks-report.md`.

#### 2. Plan testów

**File**: `context/foundation/test-plan.md`

**Contract**: §6.3 „Adding a lint boundary rule”: lokalizacja `eslint.config.mjs`, wzorzec (obiekt `files` + `no-restricted-imports`/`no-restricted-globals`), test odniesienia `tests/lint-boundaries.test.ts`, komenda `npm run lint`; §6.6 notatka etapu; §5 wiersze lint/post-edit/content smoke `required`; §3 status etapu 1 wg postępu; nagłówek „Last updated”.

#### 3. Dokumentacja repo

**File**: `CLAUDE.md`, `AGENTS.md`

**Contract**: CLAUDE.md „Commands”: `npm run lint`; „Current state”: ESLint z regułami granic, CI na PR; usunąć „There is no lint script yet”. AGENTS.md: `npm run lint` w Commands, zdanie o CI na PR; ≤ 400 słów.

### Success Criteria:

#### Automated Verification:

- `grep -c 'npm run lint' CLAUDE.md AGENTS.md` ≥ 1 w każdym; `tail -n +2 AGENTS.md | wc -w` ≤ 400
- `grep -c 'tests/lint-boundaries.test.ts' context/foundation/test-plan.md` ≥ 1
- `bash -n .claude/hooks/lint-edited-file.sh .claude/hooks/end-of-turn.sh`

#### Manual Verification:

- Raport `/10x-configure-hook` z dowodami (7 przypadków) zapisany; edycja narzędziem Edit z błędem lintu odesłana przez hook

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- `tests/lint-boundaries.test.ts` (reguły granic na tekstach).

### Integration Tests:

- Workflow `CI` na PR tej zmiany; hooki dowiedzione payloadami.

### Manual Testing Steps:

1. Celowe naruszenie granicy i `npm run lint`.
2. Edycja z błędem lintu narzędziem Edit → hook odsyła.

## Performance Considerations

Pełny lint ~2 s, pojedynczy plik ~1,2 s (research §2); CI dokłada ~20 s.

## Migration Notes

Brak; baseline naprawiony w fazie 1.

## References

- Related research: `context/changes/testing-quality-gates/research.md`
- `context/foundation/test-plan.md` §2 ryzyka #5, #6; §5 bramki

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: ESLint z regułami granic

#### Automated

- [x] 1.1 `npm run lint`, `typecheck`, `npm test` zielone — fddf420
- [x] 1.2 `tests/lint-boundaries.test.ts` przechodzi (4 asercje na ruleId) — fddf420
- [x] 1.3 Konfiguracja ma 2 reguły `no-restricted-imports` i `allowTypeImports` — fddf420

#### Manual

- [x] 1.4 Celowy import Phasera w core → lint czerwony; cofnięty — fddf420

### Phase 2: CI na PR i lint w deployu

#### Automated

- [ ] 2.1 YAML obu workflowów parsuje; `npm run lint` w każdym
- [ ] 2.2 `sample -- E3` w ci.yml

#### Manual

- [ ] 2.3 Workflow CI zielony na PR

### Phase 3: Hooki i dokumentacja

#### Automated

- [ ] 3.1 `npm run lint` w CLAUDE.md i AGENTS.md; AGENTS ≤ 400 słów
- [ ] 3.2 Cookbook §6.3 wskazuje test odniesienia
- [ ] 3.3 `bash -n` hooków

#### Manual

- [ ] 3.4 Raport configure-hook z dowodami; edycja z błędem odesłana
