# Generatory zadań grupy 1 dla E3–E4 — Plan Brief

> Full plan: `context/changes/generators-e3-e4/plan.md`
> Research: `context/changes/generators-e3-e4/research.md`

## What & Why

Roadmapa S-02 (etap M1): generatory 14 typów zadań z kroków E3–E4 (ADD_SUB z kształtami, MISSING, COMPLEMENT, ROUNDING, MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR, WORD, COMPARE_DIFF) z polskimi poleceniami, rozpraszaczami, podpowiedziami i poprawną odmianą, plus dane E3/E4; to treść, którą córka (E3–E4) dostanie w rundach z S-04.

## Starting Point

Harness F-03: model `Task`, rejestr z jednym generatorem (ADD_SUB bez kształtów), walidator, `sample`, E3 z trzema umiejętnościami; brak E4, szablonów tekstowych, liczebników słownych, cyfr rzymskich, kalendarza.

## Desired End State

`npm test` zielone; `npm run sample -- E3` i `-- E4` bez naruszeń, „brak generatora” tylko dla typów grup 2–3; każdy krok z typem grupy 1 ma umiejętność; właściciel akceptuje jakość poleceń.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres typów | 14 typów z kroków E3–E4 (11 z §7 + COMPARE_DIFF, HALF, ROUNDING) | Dokładnie kroki katalogu; 7 typów bez kroku w E3–E4 → S-03 | Plan (decyzja właściciela) |
| Imiona | Mała pula z rodzajem, mianownik | „kupił/kupiła” zgodne, bez deklinacji imion | Plan (decyzja właściciela) |
| Kształty liczb | Tokeny U/DU/DT/H/HT/HTU w `shapes` ADD_SUB | Kroki E3.8, E4.2/4/5/8 są listami kształtów; follow-up F-03 | Research |
| Teksty | Polecenia jako funkcje w `pl.tasks`, szablony w `data/wordTemplates.ts`, kalendarz w `data/calendar.ts` | Zero tekstów w `core/`; odmiana przez `countNoun` | Research |
| Rozpraszacze | Wspólny pomocnik (bliskie liczby, zamiana cyfr, pula nazw) | Jedna reguła dla kafelków, sprawdzana walidatorem | Plan |
| Remis zaokrąglania | Bez liczb z jednością 5 | Katalog nie rozstrzyga reguły | Plan |
| EVEN_ODD | Oba warianty (`single` kafelki, `select` zbiór z `check`) | UI `select` dojdzie w S-04/S-13 | Research |

## Scope

**In scope:** 14 generatorów z testami 1000 losowań, pomocniki (`shapes`, `distractors`, `numberWords`, `roman`), dane `E3.ts`/`E4.ts`, `wordTemplates.ts`, `calendar.ts`, `nouns.ts`, `pl.tasks`, test programu, `sample` z kafelkami, dokumentacja.

**Out of scope:** 7 typów grupy 1 bez kroku w E3–E4 i etapy E1–E2/E5–E6 (S-03), typy grup 2–3, sceny, lektor, adaptacja, minigry.

## Architecture / Approach

`data/curriculum/E*.ts` (umiejętności z parametrami) → rejestr `core/tasks/registry.ts` → generator `(skill, rng) => Task` korzystający z `data/pl.ts`, `data/wordTemplates.ts`, `data/calendar.ts`, pomocników `core/text/*` i `core/tasks/{shapes,distractors}.ts` → `validateTask` w testach i `sample`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Arytmetyka | ADD_SUB `shapes`, MISSING, COMPLEMENT, ROUNDING, `E4.ts` | Kształty vs `bridge`/`max` mogą dawać puste zbiory (limit prób, testy per kształt) |
| 2. Mnożenie i liczby | MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR | Liczebniki słowne i formy miesięcy: literówki; testy tabel |
| 3. Zadania tekstowe | szablony, imiona, WORD, COMPARE_DIFF | Gramatyka; test odmiany 0…100 per szablon |
| 4. Program i docs | `curriculum.test.ts`, `sample` z kafelkami, dokumentacja | — |

**Prerequisites:** F-03 zmergowane (tak).
**Estimated effort:** 2–3 sesje agenta; odczyt jakości przez właściciela na końcu.

## Open Risks & Assumptions

- Walidator sprawdza odmianę tylko dla rzeczowników ze słownika; każdy nowy rzeczownik musi tam trafić (test szablonów to egzekwuje przez `validateTask`).
- Teksty poleceń będą jeszcze dostrajane po testach z graczem (S-17).

## Success Criteria (Summary)

- Testy zielone, `sample` E3/E4 bez naruszeń, kroki grupy 1 kompletne.
- Właściciel akceptuje jakość 20 zadań tekstowych i przegląd pozostałych typów.
