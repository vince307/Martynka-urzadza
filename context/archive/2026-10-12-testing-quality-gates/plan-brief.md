# Bramki jakości i granice modułów — Plan Brief

> Full plan: `context/changes/testing-quality-gates/plan.md`
> Research: `context/changes/testing-quality-gates/research.md`

## What & Why

Etap 1 planu testów: ESLint 10 z regułami granic (`core` bez Phasera i globali, `data` tylko `core/text` i typy), lint w hookach, skryptach i CI na PR (z `sample` E3/E4 jako smoke treści). Ryzyka #6 i #5.

## Starting Point

Granice spełnione, ale nieegzekwowane; brak ESLint; CI tylko po pushu na `main`; hooki lokalne gotowe.

## Desired End State

`npm run lint` zielone, naruszenie granicy = błąd; PR uruchamia `ci.yml`; hooki dowiedzione; plan testów §6.3 wypełniony, etap 1 `complete`.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Konfiguracja | `eslint.config.mjs`, `defineConfig`, `recommendedTypeChecked`, `projectService` | ESLint 10 flat; zweryfikowana na kopii repo | Research |
| Granice | Rdzeniowe `no-restricted-imports` (regex, `allowTypeImports`) i `no-restricted-globals` per `files` | Wersja TS reguły przestarzała; bez własnych skryptów | Research |
| CI | Nowy `ci.yml` na `pull_request` + lint w `deploy.yml` | Bramka „CI on PR” z planu testów | Plan |
| Test reguł | `tests/lint-boundaries.test.ts` przez API ESLint | Reguła granic sama ma test, inaczej dryf konfiguracji przejdzie niezauważony | Plan |

## Scope

**In scope:** ESLint + config + baseline, test reguł, `ci.yml`, lint w deployu, hooki (lokalne), test-plan §3/§5/§6, CLAUDE.md, AGENTS.md.

**Out of scope:** Prettier, import-x, Husky, wymagany status w ochronie gałęzi (decyzja po), etapy 2–4.

## Architecture / Approach

Reguły scoped per katalog w jednym pliku konfiguracji; te same komendy w hookach, `npm run lint`, `ci.yml` i `deploy.yml`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. ESLint | config, baseline, test reguł | `lintText` z fikcyjną ścieżką a `projectService` |
| 2. CI | `ci.yml`, lint w deployu | — |
| 3. Hooki i docs | configure-hook z dowodami, cookbook | hooki poza repo |

**Prerequisites:** S-02 zmergowane (tak).
**Estimated effort:** jedna sesja.

## Open Risks & Assumptions

- Test reguł granic może wymagać wyłączenia reguł typowanych dla tekstów lintowanych programowo.

## Success Criteria (Summary)

- Lint i CI zielone; naruszenia granic czerwone; hooki dowiedzione; dokumentacja aktualna.
