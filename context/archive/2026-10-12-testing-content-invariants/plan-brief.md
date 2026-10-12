# Niezmienniki treści — Plan Brief

> Full plan: `context/changes/testing-content-invariants/plan.md`
> Research: `context/changes/testing-content-invariants/research.md`

## What & Why

Etap 3 planu testów: jeden generyczny test własności nad wszystkimi umiejętnościami (arytmetyka podpowiedzi, granice liczb, różnorodność, zdegenerowane), wykrywanie niewykonalnych parametrów przy parsowaniu, DIV bez nadmiaru `n : n`, lista odczytu nauczyciela w szablonie PR i CLAUDE.md. Ryzyka #1, #5; przygotowanie pod S-03, gdzie przybędzie danych.

## Starting Point

`curriculum.test.ts` (walidator, 200 losowań); pomiar 29 umiejętności w research; brak rejestru parserów; F11 (wykonalność) otwarte.

## Desired End State

Test niezmienników w `npm test`; parsery odrzucają niewykonalne dane; lista odczytu nauczyciela widoczna przy każdym PR i w regułach agenta; etap 3 `complete`.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Progi | ≥ 12 różnych (polecenie+kafelki), najczęstsze ≤ 15 %, zdegenerowane ≤ 10 % | Zapas względem pomiaru 29 umiejętności | Research |
| Trywialna podpowiedź | Nie jest naruszeniem; sprawdzamy arytmetykę i zakończenie odpowiedzią | Jednokrokowe działania | Research |
| Wykonalność | Enumeracja kształtów w `parseAddSubParams`; minima dla MULT/DIV/WORD | Mikrosekundy, błąd z nazwą kształtu zamiast 1000 prób | Research |
| DIV | Iloraz 1 rzadko (1/10) | 17 % `n : n` w E3.10 | Research |
| Lista nauczyciela | Szablon PR + CLAUDE.md + cookbook | Agent używa `--body-file`, więc sam szablon nie wystarcza | Research |

## Scope

**In scope:** rejestr parserów, wykonalność, DIV, `tests/contentInvariants.test.ts`, `src/core/tasks/bounds.ts`, szablon PR, CLAUDE.md, AGENTS.md, test-plan §6.2/§6.6/§3.

**Out of scope:** F12/F14 (treść), nowe generatory i etapy, CI-wymuszanie listy.

## Architecture / Approach

Jeden test iteruje `stages` → rejestr parserów/generatorów → `forEachDraw` → niezmienniki; wyłączenia jako jawne listy.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Parsery | rejestr, wykonalność, DIV | Enumeracja a `bridge 'none'` z `hasCarry` |
| 2. Test | niezmienniki dla 29 umiejętności | Progi zbyt ciasne dla S-03 (regulowane) |
| 3. Lista | szablon PR, docs | — |

**Prerequisites:** etap 2 zmergowany (tak).
**Estimated effort:** jedna sesja.

## Open Risks & Assumptions

- Progi mogą wymagać korekty przy E1 (mała przestrzeń liczb do 10): test ma czytelne komunikaty i stałe w jednym miejscu.

## Success Criteria (Summary)

- Niezmienniki w CI; niewykonalne parametry = `TypeError`; lista nauczyciela przy PR.
