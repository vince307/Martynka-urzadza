# Harness testów generatorów — Plan Brief

> Full plan: `context/changes/generator-test-harness/plan.md`
> Research: `context/changes/generator-test-harness/research.md`

## What & Why

Roadmapa F-03 (etap M1, fundament): vitest na `src/core/`, seedowany rng, model zadania, pierwszy generator (ADD_SUB) z danymi E3, walidator naruszeń i skrypt `npm run sample -- E3` z raportem (FR-005). Bez tego generatory z S-02/S-03 byłyby sprawdzane ręcznie, a błędy odpowiedzi trafiłyby do dziecka.

## Starting Point

Szkielet M0 (Phaser 4.2, Vite 6.4, PWA), `src/core/types.ts` z `SkillDef`, pusty `tests/`, brak vitest; hooki lokalne już wołają vitest, gdy jest zainstalowany; workflow bez testów.

## Desired End State

`npm test` przechodzi (rng, odmiana, ADD_SUB 1000 losowań, walidator); `npm run typecheck` obejmuje `tests/` i `scripts/`; `npm run sample -- E3` wypisuje 3 zadania na krok (kroki bez generatora oznaczone) i `Naruszenia: 0`; workflow uruchamia testy przed buildem.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Konfiguracja testów | `vitest.config.mts` w roocie, niezależny od `vite/` | Testy bez pluginu PWA i `define` | Research |
| Skrypt TS | `node --import tsx scripts/sample.ts` | Node strip-types nie rozwiązuje importów bez rozszerzeń; `tsx` CLI pada w sandboxie na IPC | Research |
| Rng | sfc32 seedowany z liczby przez mulberry32 | Jakość i okres wystarczające, zapis trzyma `rngSeed: number` | Research |
| Pierwszy generator | Tylko ADD_SUB (E3 kroki 2/6/8), prompt jako wyrażenie | Dowód działania harnessu; polecenia słowne i reszta typów w S-02 | Plan |
| Walidator | Funkcja w `core/` używana przez testy i `sample` | Jeden zestaw reguł (zakres, ujemne, rozpraszacze, odmiana) | Research |
| Odmiana | `inflect(n, [one, few, many])` z regułą 2–4/12–14 | Wymóg planu §14 i FR-004; test zestawu przypadków | Research |
| CI | `npm test` w jobie build | Testy bramkują deploy | Plan |

## Scope

**In scope:** vitest, tsx, `@types/node`, `vitest.config.mts`, tsconfig (`tests`, `scripts`, strictPropertyInitialization), `core/rng.ts`, `core/text/plural.ts`, `core/tasks/{types,registry,validate}.ts`, `core/tasks/generators/addSub.ts`, `data/curriculum/{E3,index}.ts`, `data/nouns.ts`, `scripts/sample.ts`, testy, workflow, CLAUDE.md, AGENTS.md.

**Out of scope:** pozostałe generatory i etapy, szablony WORD, ESLint, pokrycie, testy scen, zmiany w deployu i PWA.

## Architecture / Approach

`data/curriculum/E3.ts` (SkillDef z parametrami) → `core/tasks/registry.ts` (`type → Generator`) → `generateAddSub(skill, rng)` → `Task` → `validateTask(task, ctx)`; `scripts/sample.ts` iteruje kroki etapu i drukuje raport; testy vitest wołają te same funkcje z seedowanym rng.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Harness | vitest, tsconfig, rng, odmiana, `npm test` w CI | `strictPropertyInitialization` mogłoby ujawnić błędy (BootScene bez pól, więc nie) |
| 2. Model i ADD_SUB | typy zadania, rejestr, generator z testem 1000 losowań, dane E3 | Losowanie przez odrzucanie przy `bridge: 'ten'` i małym `max` (limit prób) |
| 3. Walidator i sample | `validateTask`, słownik, `npm run sample -- E3`, docs | Wykrywanie odmiany ograniczone do słownika |

**Prerequisites:** F-01 (układ `core/`), S-01 zmergowane (tak).
**Estimated effort:** jedna sesja agenta.

## Open Risks & Assumptions

- Raport odmiany wykrywa tylko rzeczowniki ze słownika; pełna jakość treści to S-02.
- `tsx` w CI działa przez `node --import`; `npm run sample` nie jest częścią workflow.

## Success Criteria (Summary)

- `npm test` i `npm run typecheck` zielone lokalnie i w workflow.
- `npm run sample -- E3` pokazuje 9 zadań ADD_SUB i raport bez naruszeń.
- S-02 może dopisywać generatory bez zmian w harnessie.
