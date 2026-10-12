<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Harness testów generatorów

- **Plan**: context/changes/generator-test-harness/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-12
- **Verdict**: APPROVED
- **Findings**: 1 critical, 5 warnings, 4 observations (wszystkie krytyczne i ostrzeżenia naprawione przed zamknięciem)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Zakres git: `main..m1/generator-test-harness` (3 commity faz + commit poprawek). Pozycje „Changes Required” faz 1–3 obecne (drobne odchylenia: brak nieużywanego `min?` w `AddSubParams`, `Partial<Record>` zamiast `Record<…, | undefined>`, dwa skrócone tytuły kroków E3, dodatkowe eksporty `crossesTen`/`MINUS`/`availableStages`/`seedFromString` używane przez testy i skrypt). Żadna pozycja „What We're NOT Doing” nie weszła. Kryteria automatyczne 1.1–1.4, 2.1–2.3, 3.1–3.4 powtórzone po poprawkach: przechodzą (45 testów, typecheck, `sample -- E3` kod 0 i `Naruszenia: 0`, `E9` kod 2, determinizm, AGENTS.md 400 słów). Ręczne 1.5 (`vitest related src/core/rng.ts --run` uruchamia `tests/rng.test.ts`), 2.4 (E3 zgodne z ZADANIA §3), 3.5 (odczyt `sample` z dwoma seedami) wykonane przez agenta.

## Findings

### F1 — Zdegenerowane podpowiedzi `+ 0 =` / `− 0 =`

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts (crossesTen, hintFor)
- **Detail**: `crossesTen` liczyło dojście do pełnej dziesiątki (8 + 2) i odejmowanie od pełnej dziesiątki (20 − 7) jako przekroczenie; podpowiedzi dla dziecka zawierały kroki `20 + 0 = 20` (41 % zadań E3.2 w próbie 2000 losowań). Testy sprawdzały tylko wynik ostatniego kroku.
- **Fix**: Przekroczenie tylko w jednościach (`> 10` dla +, `0 < a%10 < b%10` dla −); podpowiedź „najpierw dziesiątki, potem jedności” bez kroków zerowych; test sprawdza arytmetykę każdego kroku i brak `+ 0 =`.
- **Decision**: FIXED (2026-10-12)

### F2 — `bridge: 'ten'` z małym `max` wyczerpuje 1000 prób

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts (parseAddSubParams)
- **Fix**: `TypeError` dla `bridge === 'ten' && max < 11`; test.
- **Decision**: FIXED (2026-10-12)

### F3 — Składniki zerowe i skośny rozkład

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts (drawOperands)
- **Detail**: 16–21 % zadań E3.6/E3.8 miało `30 + 0`, `0 + 7`; `a = max` zawsze z zerem.
- **Fix**: Składniki ≥ 1 (`a ∈ [1, max−1]`, `b ∈ [1, max−a]` dla +; `b ∈ [1, a]` dla −). Skośność rozkładu i „dwie dwucyfrowe” (kształt) zostają dla S-02 (`shape`).
- **Decision**: FIXED (2026-10-12); kształt → S-02

### F4 — Fałszywe „ujemne” dla okienek (`□ − 7`)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/validate.ts (NEGATIVE_NUMBER)
- **Fix**: Minus liczony jako liczba ujemna tylko na początku tekstu lub po `=`, `(`, `,`, `:`, `;`; test z `□ − 7 = 5` i `answer: -2`.
- **Decision**: FIXED (2026-10-12)

### F5 — `sample`: opcje przed etapem i globalny licznik seedów

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/sample.ts
- **Fix**: Parser argumentów pomija wartość po `--seed/--count`; seed per losowanie z `seedFromString(`${seed}:${skill.id}:${i}`)` (nowa funkcja w `core/rng.ts`).
- **Decision**: FIXED (2026-10-12)

### F6 — Test ADD_SUB: `expect` poza `it`, brak `validateTask` w pętli

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/addSub.test.ts
- **Fix**: Liczba umiejętności sprawdzana w `it` (`> 0`); każde z 1000 losowań przechodzi `validateTask` z `max` i słownikiem; dodatkowe testy `crossesTen` i rozbicia dziesiątek.
- **Decision**: FIXED (2026-10-12)

### F7 — Brak złotego wektora rng i walidacji seeda

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: tests/rng.test.ts, src/core/rng.ts
- **Fix**: Test przypina pierwsze trzy wartości dla seeda 42; `createRng` odrzuca seedy niecałkowite (większe wartości zawijają do 32 bitów, udokumentowane).
- **Decision**: FIXED (2026-10-12)

### F8 — Podwójne zgłoszenie `negative` + `range` dla ujemnej odpowiedzi

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/validate.ts
- **Fix**: — (celowo: obie reguły są prawdziwe; raport ma być pełny).
- **Decision**: ACCEPTED

### F9 — Nieaktualne zdania w dokumentacji

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: CLAUDE.md:15, AGENTS.md:32
- **Fix**: „`tests/` puste” usunięte; sygnatura generatora `(skill, rng) => Task`.
- **Decision**: FIXED (2026-10-12)

### F10 — Kształt liczb (`shape`) i skośność rozkładu składników

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts, src/data/curriculum/E3.ts (krok 8 „dwie dwucyfrowe”)
- **Detail**: Losowanie `a` potem `b ∈ [1, max−a]` faworyzuje małe `b`; tytuł kroku 8 nie jest egzekwowany parametrami.
- **Fix**: W S-02 wprowadzić `shape` (ZADANIA §4) i losowanie z listy dopuszczalnych kształtów; zapisane w `follow-ups/review-fixes.md`.
- **Decision**: DEFERRED (S-02)
