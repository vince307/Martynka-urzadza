# Niezmienniki treści — Implementation Plan

## Overview

Etap 3 planu testów: generyczny test własności nad wszystkimi umiejętnościami etapów (arytmetyka podpowiedzi, granica liczb, różnorodność, udział zadań zdegenerowanych, walidator), rejestr parserów z wykrywaniem niewykonalnych parametrów przy parsowaniu (ADD_SUB przez enumerację kształtów; MULT, DIV, WORD przez minima), DIV z rzadkim ilorazem 1, oraz lista odczytu nauczyciela w szablonie PR, CLAUDE.md i cookbooku. Ryzyka #1 i #5.

## Current State Analysis

Z `research.md`: pomiar 29 umiejętności (różnorodność, trywialność, równe składniki, czas); `curriculum.test.ts` sprawdza tylko walidator i pokrycie typów; brak rejestru parserów; ADD_SUB nie wykrywa niewykonalnych kombinacji kształt/bridge/max; DIV losuje iloraz 1 jednostajnie (17 % `n : n` w E3.10); lista odczytu nauczyciela nieformalna.

## Desired End State

`npm test` zawiera `tests/contentInvariants.test.ts` (1000 losowań na umiejętność: walidator, arytmetyka podpowiedzi, granica liczb, różnorodność ≥ 12 i ≤ 15 %, zdegenerowane ≤ 10 %, parsowanie przez rejestr); `parseAddSubParams({ max: 30, shapes: ['DU+DU'], bridge: 'ten' })` rzuca `TypeError` z nazwą kształtu; `E3.10.div_30` ma ≤ 10 % ilorazu 1; `.github/pull_request_template.md` z listą odczytu nauczyciela; CLAUDE.md i test-plan §6.2 opisują listę; etap 3 `complete`.

### Key Discoveries:

- Różnorodność liczona po parze (polecenie, kafelki); progi 12 / 15 % z zapasem dla obecnych danych (research §1).
- Jednoliniowa podpowiedź jest poprawna dla działań jednokrokowych; niezmiennikiem jest arytmetyka linii i zakończenie odpowiedzią (research Summary).
- Enumeracja kształtów przy parsowaniu to ≤ 8100 par, mikrosekundy (research Summary).

## What We're NOT Doing

- Rozbicie podpowiedzi `DT−U` (F12) i pierwsza podpowiedź okienka bez wyniku (F14): treść, S-03/S-04.
- Nowe generatory i dane etapów (S-03); testy scen; pokrycie kodu.
- Wymuszanie listy kontrolnej w CI (lista jest dla człowieka i agenta; CI sprawdza niezmienniki).

## Implementation Approach

Trzy fazy: (1) rejestr parserów i wykonalność w parserach + DIV; (2) generyczny test własności; (3) lista odczytu nauczyciela (szablon PR, CLAUDE.md, test-plan) i domknięcie.

## Phase 1: Rejestr parserów i wykonalność

### Changes Required:

#### 1. Rejestr parserów

**File**: `src/core/tasks/registry.ts`, generatory w `src/core/tasks/generators/*.ts`

**Contract**: `export const parsers: Readonly<Record<string, (params: Record<string, unknown>) => unknown>>` z wpisem dla każdego typu z `generators` (te same klucze); `export const getParser(type)`; test w fazie 2 sprawdza, że `Object.keys(parsers)` = `Object.keys(generators)`.

#### 2. Wykonalność

**File**: `src/core/tasks/generators/addSub.ts`, `mult.ts`, `div.ts`, `word.ts`, `src/core/tasks/shapes.ts`, `tests/addSub.test.ts`, `tests/mult.test.ts`, `tests/div.test.ts`, `tests/word.test.ts`

**Contract**: `shapes.ts`: `export const tokenValues = (token, max): number[]` (wszystkie wartości tokena ≤ max). `addSub.ts`: w `parseAddSubParams` dla każdego kształtu enumeracja par `(a, b)` z `tokenValues` sprawdzająca `apply ∈ [0, max]` i `bridgeMatches`; brak pary → `TypeError('ADD_SUB shape DU+DU has no solutions with max 30 and bridge ten')`. `mult.ts`: `TypeError`, gdy żaden iloczyn dozwolonych czynników nie mieści się w `maxProduct` (`allowZeroOne` liczy 0·x). `div.ts`: `TypeError`, gdy `min(divisors ?? [2]) > maxDividend`; iloraz 1 losowany z prawdopodobieństwem ~1/10 (poza tym 2…maxQuotient), test: udział `n : n` ≤ 10 % i > 0. `word.ts`: `TypeError`, gdy `max` poniżej minimum rodzaju (`sum/left/start/moreBy` 2, `twoSteps` 3, `groups/share/each` 4, `age` 6). Testy negatywne dla każdego parsera.

### Success Criteria:

#### Automated Verification:

- `npm test`, `npm run lint`, `npm run typecheck` zielone; `npm run sample -- E3` i `-- E4` kod 0
- `node --import tsx -e` z `parseAddSubParams({ max: 30, shapes: ['DU+DU'], bridge: 'ten' })` rzuca `TypeError` zawierający `DU+DU`

#### Manual Verification:

- Odczyt `sample -- E3 --seed 9` dla E3.10: iloraz 1 pojawia się rzadko

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Generyczny test własności

### Changes Required:

#### 1. Test

**File**: `tests/contentInvariants.test.ts` (nowy), `tests/helpers.ts`

**Contract**: Dla każdej umiejętności z `stages` (1000 losowań, 20 seedów × 50 przez `forEachDraw`): parser typu przyjmuje `skill.params`; `validateTask` bez naruszeń (`max` jak w `sample`); każda linia podpowiedzi `^(\d+) ([+−·:]) (\d+) = (\d+)$` prawdziwa; gdy odpowiedź liczbowa i ostatnia linia jest równością, kończy się odpowiedzią; wszystkie liczby w poleceniu i podpowiedziach ≤ granica (`max`/`maxProduct`/`maxDividend`), z wyjątkiem typów z listy `UNBOUNDED` (`CALENDAR`, `ROMAN`, `NUMBER_WORDS`); dla `+`/`−` brak składnika 0; udział `n : n` i `n − n` ≤ 10 %; udział czynników 0/1 w `·` ≤ 35 % i tylko gdy `allowZeroOne`; różnorodność: ≥ 12 różnych `prompt + '|' + choices` i najczęstsza ≤ 15 %. `helpers.ts`: `boundOf(skill)` wspólne z `sample`? (skrypt importuje własną wersję; wynieść do `src/core/tasks/bounds.ts` i użyć w obu).

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/contentInvariants.test.ts` przechodzi dla wszystkich 29 umiejętności w < 5 s; `npm test` zielone
- Celowe zepsucie (np. `E3.10.half_30` `max: 4` → różnorodność 2) przewraca test; cofnięte

#### Manual Verification:

- Przegląd listy wyłączeń `UNBOUNDED` i progów w teście względem research §1

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Lista odczytu nauczyciela i domknięcie

### Changes Required:

#### 1. Szablon PR i dokumentacja

**File**: `.github/pull_request_template.md` (nowy), `CLAUDE.md`, `AGENTS.md`, `context/foundation/test-plan.md`

**Contract**: Szablon PR: sekcja „Treść zadań (jeśli PR zmienia `src/data/` lub generatory)” z 8 punktami z research §3 jako checkbox; CLAUDE.md: akapit „Content changes” z tą listą (agent nie korzysta z szablonu PR przy `--body-file`); AGENTS.md: jedno zdanie odsyłające (≤ 400 słów); test-plan §6.2 wypełnione (lokalizacja testu, lista, komenda), §6.6 notatka, §3 status.

### Success Criteria:

#### Automated Verification:

- `test -f .github/pull_request_template.md`; `grep -ci 'teacher' CLAUDE.md context/foundation/test-plan.md` ≥ 1 w każdym (CLAUDE.md jest po angielsku); `tail -n +2 AGENTS.md | wc -w` ≤ 400; `npm test` zielone

#### Manual Verification:

- Odczyt szablonu PR i akapitu CLAUDE.md: lista kompletna i jednoznaczna

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Testy negatywne parserów; `tests/contentInvariants.test.ts`.

### Integration Tests:

- `sample` E3/E4 w CI.

### Manual Testing Steps:

1. `sample -- E3 --seed 9` (DIV).
2. Odczyt szablonu PR.

## Performance Considerations

29 × 1000 losowań ≈ 100 ms generowania + walidacja; enumeracja kształtów ≤ 8100 par per kształt.

## Migration Notes

Brak.

## References

- `context/changes/testing-content-invariants/research.md`; test-plan §2 #1, #5; follow-upy S-02 F11/F12/F14.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Rejestr parserów i wykonalność

#### Automated

- [x] 1.1 test, lint, typecheck zielone; sample E3/E4 kod 0 — b3de506
- [x] 1.2 `DU+DU`/`ten`/30 odrzucone przy parsowaniu — b3de506

#### Manual

- [x] 1.3 Odczyt `sample` E3.10: iloraz 1 rzadki — b3de506

### Phase 2: Generyczny test własności

#### Automated

- [x] 2.1 contentInvariants dla 29 umiejętności < 5 s; `npm test` zielone — 66b8c86
- [x] 2.2 Celowe zepsucie danych przewraca test; cofnięte — 66b8c86

#### Manual

- [x] 2.3 Przegląd wyłączeń i progów — 66b8c86

### Phase 3: Lista odczytu nauczyciela i domknięcie

#### Automated

- [x] 3.1 Szablon PR istnieje; „nauczyciel” w CLAUDE.md i test-plan; AGENTS ≤ 400; `npm test` — c3cc29b

#### Manual

- [x] 3.2 Odczyt szablonu i akapitu CLAUDE.md — c3cc29b
