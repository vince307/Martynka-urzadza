# Generatory zadań grupy 1 dla E3–E4 — Implementation Plan

## Overview

Roadmapa S-02 (`generators-e3-e4`, etap M1). Na harnessie F-03 powstają generatory 14 typów zadań występujących w krokach E3–E4 (ADD_SUB z kształtami liczb, MISSING, COMPLEMENT, ROUNDING, MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR, WORD, COMPARE_DIFF), każdy z poprawną odpowiedzią, rozpraszaczami dla kafelków, podpowiedzią krok po kroku i polskimi tekstami z `data/` z poprawną odmianą liczebników; dane `data/curriculum/E3.ts` i `E4.ts` dostają umiejętności z parametrami dla każdego kroku, który ma typ grupy 1; `npm run sample -- E3` i `-- E4` kończą się bez naruszeń; każdy typ ma test 1000 losowań. Decyzje właściciela (2026-10-12): zakres = 14 typów z kroków E3–E4 (7 typów grupy 1 bez kroku w E3–E4 idzie do S-03); zadania tekstowe z małą pulą imion z rodzajem.

## Current State Analysis

Z `context/changes/generators-e3-e4/research.md`:

- Harness F-03: `Task` (`prompt`, `speak?`, `answer: number | string | number[]`, `choices?`, `hint[]`, `check?`), `Generator = (skill, rng) => Task`, rejestr `type → generator` (tylko ADD_SUB), `validateTask` (zakres, ujemne, rozpraszacze, puste `hint`, odmiana ze słownika `data/nouns.ts`), `sample` z `max` z `params.max`, wzorzec testu 1000 losowań (20 seedów × 50) z `validateTask` w pętli.
- ADD_SUB losuje `a` potem `b ∈ [1, max−a]` (skośne) i nie zna `shape`; kroki E4.2/4/5/8 i E3.8 są wprost listami kształtów (36 + 2, 50 − 3, 52 + 20, 35 + 34, 530 + 400).
- Kroki E3 (11) i E4 (8) z typami w `docs/ZADANIA.md:104-126`; zakresy §2; opisy typów §4; prezentacja §1 (E3–E6: 1–3 zdania, konteksty ze świata gry, imiona neutralne, odpowiedź kafelkami 3–4 lub klawiaturką).
- `data/pl.ts` ma tylko teksty nakładek; brak `data/wordTemplates.ts`, `data/calendar.ts`, liczebników słownych i cyfr rzymskich.

## Desired End State

`npm test` zielone (testy per typ + test szablonów + test wszystkich umiejętności E3/E4); `npm run sample -- E3` i `npm run sample -- E4` kończą się kodem 0, `Naruszenia: 0`, a „brak generatora” pojawia się wyłącznie przy typach grup 2–3 (CLOCK, MASS, DATA, PUZZLE_GRID, LENGTH, PLACE_VALUE, GRID, MULT_GROUPS, TEMPERATURE, MONEY_*, CAPACITY, PERIMETER); każdy krok z typem grupy 1 ma co najmniej jedną umiejętność; polecenia po polsku czytelne dla dziecka w klasie 2, odmiana poprawna dla wszystkich liczb w zakresie; żadnych tekstów poza `src/data/`.

### Key Discoveries:

- `validateTask` już obsługuje `choices` i `answer: number[]`; wystarczy, że generatory kafelkowe zawsze dają 3–4 różne kafelki z odpowiedzią (research §4).
- Odmiana testowalna generycznie: każdy szablon przepuszczony przez `validateTask` z pełnym słownikiem dla n = 0…100 (research §3).
- Kształty liczb jako tokeny `U` (1–9), `DU` (10–99), `DT` (pełne dziesiątki 10–90), `H` (pełne setki 100–900), `HT` (setki + dziesiątki, 110–990 z jednością 0), `HTU` (100–999) pokrywają wszystkie przykłady katalogu (research §1, follow-up F-03).
- Rodzaj imienia decyduje o formie czasownika w czasie przeszłym; szablony dostają `{ name, gender }` i wybierają formę (research §3).

## What We're NOT Doing

- Typy grupy 1 bez kroku w E3–E4: BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP (S-03) i dane E1–E2, E5–E6 (S-03).
- Typy grup 2–3 (CLOCK, PLACE_VALUE, MULT_GROUPS, MONEY_*, MASS, LENGTH, TEMPERATURE, …): S-13/S-14.
- Sceny, widżety, lektor, `speak` (zostaje równy `prompt`, gdy potrzebny), adaptacja (S-04, S-05, S-07).
- Minigry i zagadki (S-15); pełna jakość treści E1–E2/E5–E6 (PRD Non-Goals).
- Zmiany w harnessie poza drobnymi rozszerzeniami walidatora i `sample`.

## Implementation Approach

Cztery fazy według rodzin typów, każda z danymi etapu i testami, żeby `sample` rósł przyrostowo: (1) arytmetyka na kształtach liczb (ADD_SUB z `shape`, MISSING, COMPLEMENT, ROUNDING) i szkielet `E4.ts`; (2) mnożenie, dzielenie i liczby (MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR) z pomocnikami tekstowymi i rozpraszaczami; (3) zadania tekstowe (szablony, konteksty, imiona, WORD, COMPARE_DIFF); (4) test wszystkich umiejętności, `sample` dla obu etapów, dokumentacja. Każdy generator: `parse<Type>Params` z `TypeError`, losowanie z limitem prób, podpowiedź krok po kroku; teksty tylko z `data/`.

## Critical Implementation Details

**Kierunek zależności.** Generatory w `core/` importują teksty z `data/` (jak `sample` i testy); `data/` nie importuje z `core/` nic poza typami i `plural`. Sceny (S-04) będą importować oba.

**Rozpraszacze.** Wspólny pomocnik losuje kafelki bliskie odpowiedzi (±1, ±2, ±10, zamiana cyfr, sąsiedni miesiąc), nigdy ujemne, zawsze różne; kolejność kafelków losowa, odpowiedź w zbiorze. Dla tekstów (słowa, rzymskie) rozpraszacze to inne wartości z tej samej puli.

**Remis przy zaokrąglaniu.** ROUNDING nie losuje liczb kończących się na 5 (katalog nie rozstrzyga reguły; S-03/E6 doprecyzuje przy setkach).

**Imiona i rodzaj.** `{ name: 'Ola', gender: 'f' }`; szablon podaje czasownik parą `['kupił', 'kupiła']`. Imiona wyłącznie w mianowniku (zdania zaczynają się od imienia), żeby uniknąć deklinacji.

## Phase 1: Arytmetyka na kształtach liczb (ADD_SUB `shape`, MISSING, COMPLEMENT, ROUNDING)

### Overview

Kształty liczb dla ADD_SUB, trzy nowe generatory arytmetyczne, krótkie polecenia w `pl.ts`, dane E3.2/6/8 i E4.2/4/5/8.

### Changes Required:

#### 1. Kształty liczb

**File**: `src/core/tasks/shapes.ts` (nowy), `tests/shapes.test.ts` (nowy)

**Intent**: Losowanie składników według kształtu z katalogu.

**Contract**: `export type ShapeToken = 'U' | 'DU' | 'DT' | 'H' | 'HT' | 'HTU'`; `export interface Shape { left: ShapeToken; op: '+' | '-'; right: ShapeToken }`; `export const parseShape = (text: string): Shape` (`'DU+U'`, `'DT-U'`, `'HTU-DT'`; `TypeError` dla innych); `export const drawToken = (token: ShapeToken, rng: Rng, max: number): number` losuje liczbę z zakresu tokena przyciętego do `max` (`U` 1–9, `DU` 10–99, `DT` 10–90 krok 10, `H` 100–900 krok 100, `HT` 110–990 z jednością 0, `HTU` 100–999; `RangeError`, gdy zakres pusty). Test: 1000 losowań każdego tokena mieści się w zakresie i ma wymaganą postać cyfr.

#### 2. ADD_SUB z kształtami

**File**: `src/core/tasks/generators/addSub.ts`, `src/data/curriculum/E3.ts`, `tests/addSub.test.ts`

**Intent**: Parametr `shapes` zamiast skośnego losowania tam, gdzie katalog podaje kształty.

**Contract**: `AddSubParams` dostaje `shapes?: readonly Shape[]`; gdy `shapes` podane, `ops` wynika z kształtów (parser odrzuca `ops` sprzeczne z `shapes`), losowanie: wybór kształtu, `left`/`right` z `drawToken`, dla `-` zamiana tak, by odjemna ≥ odjemnik gdy tokeny równe (inaczej odrzucenie), filtr `max` i `bridge`, limit prób. Bez `shapes` działa jak dziś. E3.8 dostaje `shapes: ['DU+U', 'DU-U', 'DU+DU', 'DU-DU']`, `bridge: 'any'`, `max: 30`. Test: dla każdego kształtu 1000 losowań ma właściwe postacie składników.

#### 3. MISSING, COMPLEMENT, ROUNDING

**File**: `src/core/tasks/generators/missing.ts`, `complement.ts`, `rounding.ts` (nowe), `tests/missing.test.ts`, `tests/complement.test.ts`, `tests/rounding.test.ts` (nowe), `src/core/tasks/registry.ts`

**Intent**: Okienko w działaniu, dopełnianie, najbliższa dziesiątka.

**Contract**: MISSING: params `{ max, ops: ('+'|'-'|'*'|'/')[], bridge?, slot?: ('left'|'right'|'result')[] }`; buduje działanie jak ADD_SUB (lub MULT/DIV dla `*`/`/` z `maxProduct = max`) i ukrywa jedną pozycję znakiem `□`: `prompt: "□ + 5 = 12"`, `answer` = ukryta liczba, `hint` = działanie odwrotne (`"12 − 5 = 7"`). COMPLEMENT: params `{ targets?: number[], toNextTen?: boolean, max }`; `prompt` z `pl.tasks.complement(n, target)` („Ile brakuje od 7 do 10?”), `answer = target − n`, `hint: ["7 + 3 = 10"]`; `toNextTen` losuje `n` niebędące pełną dziesiątką i cel = następna dziesiątka. ROUNDING: params `{ max, to: 10 }`; `prompt` z `pl.tasks.rounding(n)` („Która pełna dziesiątka jest najbliżej 47?”), odpowiedź klawiaturką, bez liczb z jednością 5, `hint: ["47 jest między 40 a 50", "bliżej 50"]`. Rejestr: cztery wpisy.

#### 4. Polecenia i dane

**File**: `src/data/pl.ts`, `src/data/curriculum/E3.ts`, `src/data/curriculum/E4.ts` (nowy), `src/data/curriculum/index.ts`

**Intent**: Krótkie polecenia jako funkcje w `pl.tasks`; E4 jako dane z 8 krokami.

**Contract**: `pl.tasks`: `missing: 'Jaka liczba pasuje w okienku?'`, `complement: (n, target) => string`, `rounding: (n) => string` (i kolejne typy w fazach 2–3). `E4.ts`: 8 kroków z tytułami i typami z katalogu; umiejętności: E4.2 ADD_SUB `shapes ['DU+U','DU-U','DT-U']`, `bridge 'none'`, max 100 (36 + 2, 47 − 5, 47 + 3, 50 − 3; dojście do pełnej dziesiątki nie jest przekroczeniem, więc jedna umiejętność); E4.4 COMPLEMENT `toNextTen`, ADD_SUB `shapes ['DT-U','DU+U','DU-U']` `bridge 'ten'`, ROUNDING max 100; E4.5 ADD_SUB `shapes ['DU+DT','DU-DT','DU+DU','DU-DU']` `bridge 'none'`; E4.6 MISSING `ops ['*','/']` max 50; E4.8 ADD_SUB `shapes ['HT+H','HTU+DT','HTU-DT']` `bridge 'none'` max 1000. E3.2 dodaje MISSING `ops ['+','-']` max 20 `bridge 'ten'`. `index.ts` rejestruje E4.

### Success Criteria:

#### Automated Verification:

- `npm test` zielone z nowymi plikami `shapes`, `missing`, `complement`, `rounding`; `npm run typecheck`
- `npm run sample -- E4` kod 0 i `Naruszenia: 0`; kroki E4.2, E4.4, E4.5, E4.6, E4.8 mają zadania; `npm run sample -- E3` kod 0
- `grep -rn "from 'phaser'" src/core src/data` = 0; `grep -cE -f <regex polskich literałów> src/core/tasks/generators/*.ts` = 0 (teksty tylko w `data/`)

#### Manual Verification:

- Odczyt `sample -- E4 --seed 2`: kształty zgodne z przykładami katalogu (36 + 2, 50 − 3, 52 + 20, 35 + 34, 530 + 400), podpowiedzi poprawne

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Mnożenie, dzielenie i liczby (MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR)

### Overview

Osiem generatorów z kafelkami lub klawiaturką, pomocniki tekstowe (liczebniki słowne, cyfry rzymskie, kalendarz), rozpraszacze.

### Changes Required:

#### 1. Pomocniki

**File**: `src/core/tasks/distractors.ts`, `src/core/text/numberWords.ts`, `src/core/text/roman.ts` (nowe), `src/data/calendar.ts` (nowy), `tests/numberWords.test.ts`, `tests/roman.test.ts`, `tests/distractors.test.ts` (nowe)

**Contract**: `distractors.ts`: `export const numberChoices = (answer: number, rng: Rng, opts: { count: 3 | 4; min: number; max: number; near?: number[] }): number[]` (bliskie wartości ±1, ±2, ±10, zamiana cyfr, bez ujemnych, bez duplikatów, w zakresie, losowa kolejność z odpowiedzią); `export const pickChoices = <T>(answer: T, pool: readonly T[], count: number, rng: Rng): T[]`. `numberWords.ts`: `numberToWords(n: number): string` dla 0–1000 (zero, jeden…dziewiętnaście, dwadzieścia…dziewięćdziesiąt, sto, dwieście, trzysta, czterysta, pięćset…dziewięćset, tysiąc; „dwadzieścia trzy”, „sto pięć”), `RangeError` poza zakresem; test tabeli (0, 1, 11, 15, 20, 23, 30, 100, 105, 230, 999, 1000). `roman.ts`: `toRoman(n)` i `fromRoman(text)` dla 1–3999 (potrzebne I–XII); test obu kierunków dla 1–12 i kilku większych. `calendar.ts`: `months` (nazwa mianownik, dopełniacz „stycznia”, miejscownik „w styczniu”, numer, kwartał), `quarters` (I–IV), `weekdays`; wyłącznie dane.

#### 2. Generatory

**File**: `src/core/tasks/generators/{mult,div,half,compareNum,evenOdd,numberWords,roman,calendar}.ts` (nowe), odpowiadające `tests/*.test.ts`, `src/core/tasks/registry.ts`, `src/data/pl.ts`

**Contract**:
- MULT: params `{ maxProduct, factors?: number[], allowZeroOne?: boolean, maxFactor?: number }`; `prompt "7 · 4"`, `answer`, `hint` rozbicie (`"7 · 2 = 14", "14 + 14 = 28"`) lub suma po kolei dla małych czynników; `·` to U+00B7.
- DIV: params `{ maxDividend, divisors?: number[], maxQuotient? }`; dzielenie bez reszty, `prompt "28 : 4"`, `hint ["4 · 7 = 28"]`; `:` jako znak dzielenia.
- HALF: params `{ max }` (parzyste), `prompt` z `pl.tasks.half(n)` („Ile to połowa z 18?”), `hint ["18 : 2 = 9", "9 + 9 = 18"]`.
- COMPARE_NUM: params `{ max }`, `prompt "47 □ 74"`, `choices ['<', '>', '=']`, `answer` znak, `hint` z `pl.tasks.compareHint` (dziesiątki/jedności); losuje równe liczby z prawdopodobieństwem ~1/6.
- EVEN_ODD: params `{ max, variant: 'single' | 'select' }`; `single`: `prompt` z `pl.tasks.evenOdd(n)` („Czy 17 to liczba parzysta?”), `choices [pl.tasks.even, pl.tasks.odd]`, `answer` tekst, `hint` („17 kończy się na 7, to liczba nieparzysta”); `select`: `prompt pl.tasks.selectEven`, `choices` 6 liczb (2–4 parzyste), `answer: number[]` posortowane, `check(input)` porównuje zbiory.
- NUMBER_WORDS: params `{ max, kind?: 'any' | 'tens' | 'hundreds' }`, dwa warianty losowane: cyfry → słowa (`choices` 3 zapisy słowne) albo słowa → cyfry (`choices` 3 liczby); rozpraszacze bliskie (23 vs 32 vs 13); `hint` rozbicie („dwadzieścia trzy = 20 + 3”).
- ROMAN: params `{ max: 12 }`, warianty: rzymska → arabska (kafelki liczb), arabska → rzymska (kafelki rzymskie), kontekst z `pl.tasks.romanContexts` (piętro, godzina na zegarze, miesiąc); `hint` z wartościami znaków.
- CALENDAR: params `{ variants: ('nextMonth'|'prevMonth'|'quarter'|'romanMonth')[] }`; `nextMonth`: „Który miesiąc jest po marcu?” (`choices` 3 nazwy); `quarter`: „W którym kwartale jest maj?” (`choices` I–IV); `romanMonth`: „Jaki miesiąc oznacza data 7 V?” (`choices` 3 nazwy); `hint` z listą miesięcy/kwartału.
Rejestr: osiem wpisów. `pl.tasks` rozszerzone o potrzebne polecenia i podpowiedzi jako funkcje.

#### 3. Dane

**File**: `src/data/curriculum/E3.ts`, `src/data/curriculum/E4.ts`

**Contract**: E3.7 EVEN_ODD (max 30, oba warianty jako dwie umiejętności), NUMBER_WORDS (max 30); E3.9 MULT (`maxProduct 30`, `allowZeroOne`); E3.10 DIV (`maxDividend 30`), HALF (max 30); E3.11 ROMAN (max 12), CALENDAR (`quarter`, `romanMonth`, `nextMonth`); E4.1 COMPARE_NUM (max 100); E4.6 MULT (`maxProduct 50`), MULT (`factors [5, 10]`, `maxProduct 100`), DIV (`maxDividend 50`), DIV (`divisors [5, 10]`, `maxDividend 100`).

### Success Criteria:

#### Automated Verification:

- `npm test` zielone (nowe testy: 8 generatorów + 3 pomocniki); `npm run typecheck`
- `npm run sample -- E3` i `-- E4` kod 0, `Naruszenia: 0`; kroki E3.7, E3.9, E3.10, E3.11, E4.1, E4.6 mają zadania
- `node --import tsx -e` sprawdza `numberToWords(23) === 'dwadzieścia trzy'`, `toRoman(12) === 'XII'`, `fromRoman('IX') === 9`

#### Manual Verification:

- Odczyt `sample` dla E3.7–E3.11 i E4.1/E4.6: polecenia naturalne, rozpraszacze sensowne, podpowiedzi poprawne

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Zadania tekstowe (WORD, COMPARE_DIFF)

### Overview

Szablony z kontekstami świata gry i imionami z rodzajem; dwa generatory; test odmiany dla wszystkich liczb.

### Changes Required:

#### 1. Szablony

**File**: `src/data/wordTemplates.ts` (nowy), `src/data/nouns.ts`, `tests/wordTemplates.test.ts` (nowy)

**Contract**: `export interface Person { name: string; gender: 'f' | 'm' }`; `export const people: readonly Person[]` (8 imion: Ola, Kuba, Zosia, Franek, Hania, Staś, Ania, Tomek); `export interface Context { noun: PluralForms; place?: string }`; `export const contexts` (rogaliki w kawiarni, ciastka, filiżanki, kwiaty w ogrodzie, poduszki, książki na półce, klocki, kredki, złote na remont); `export interface WordTemplate { id: string; kind: 'sum' | 'left' | 'start' | 'twoSteps' | 'compareMore' | 'compareLess' | 'moreBy' | 'age' | 'groups' | 'share' | 'each'; build(args: { a: number; b: number; c?: number; person: Person; other?: Person; ctx: Context }): { prompt: string; hint: string[] } }`; `export const templates: readonly WordTemplate[]` z co najmniej jednym szablonem na `kind`; czasowniki w czasie przeszłym jako para wg rodzaju (`verb(person, ['kupił', 'kupiła'])`); liczby z `countNoun`. Wszystkie rzeczowniki szablonów w `data/nouns.ts`. Test: każdy szablon × każda osoba × n = 0…100 (dla a, b) przechodzi `validateTask` z pełnym słownikiem bez naruszeń odmiany; prompt nie zawiera `undefined`, `NaN`, podwójnych spacji.

#### 2. Generatory

**File**: `src/core/tasks/generators/word.ts`, `compareDiff.ts` (nowe), `tests/word.test.ts`, `tests/compareDiff.test.ts`, `src/core/tasks/registry.ts`

**Contract**: WORD: params `{ max, kinds: WordTemplate['kind'][], maxFactor? }`; losuje szablon z `kinds`, liczby w zakresie tak, by wynik ∈ [0, max] i był sensowny (`left`: a ≥ b; `twoSteps`: a ≥ b + c; `groups`: n · m ≤ max; `share`: dzielenie bez reszty), `prompt` z szablonu, `answer`, `hint` = działanie z szablonu + ewentualny krok (np. `["9 − 4 = 5", "5 − 3 = 2"]`), `speak` pomijane. COMPARE_DIFF: params `{ max }`; dwie osoby i liczby a ≠ b, pytanie „O ile więcej … ma X?” lub „O ile mniej…”, `answer |a − b|`, `hint ["12 − 7 = 5"]`.

#### 3. Dane

**File**: `src/data/curriculum/E3.ts`, `src/data/curriculum/E4.ts`

**Contract**: E3.1 WORD (`max 20`, `kinds ['sum','left','start','twoSteps','moreBy']`), COMPARE_DIFF (`max 20`); E3.9 WORD (`kinds ['groups']`, `max 30`); E3.10 WORD (`kinds ['share','each']`, `max 30`); E4.4 lub E4.5 WORD (`max 100`, `kinds ['sum','left','twoSteps','age']`) — dodane do kroku E4.5 jako utrwalenie.

### Success Criteria:

#### Automated Verification:

- `npm test` zielone (szablony × osoby × 0…100 bez naruszeń; WORD i COMPARE_DIFF po 1000 losowań); `npm run typecheck`
- `npm run sample -- E3` kod 0 z zadaniami w E3.1; `grep -c 'undefined\|NaN' <(npm run sample -- E3 --count 20)` = 0

#### Manual Verification:

- Odczyt 20 zadań tekstowych (`--count 20` dla E3.1): zdania poprawne gramatycznie, odmiana, rodzaj czasownika zgodny z imieniem

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Test całego programu E3–E4, sample i dokumentacja

### Overview

Jeden test przechodzi przez wszystkie umiejętności obu etapów; dokumentacja opisuje rodziny generatorów.

### Changes Required:

#### 1. Test programu

**File**: `tests/curriculum.test.ts` (nowy)

**Contract**: Dla każdego etapu z `stages` i każdej umiejętności: generator istnieje w rejestrze (dla typów grupy 1 z listy w teście), 200 losowań (4 seedy × 50) bez naruszeń `validateTask` (z `max` i słownikiem), `prompt` niepusty, `answer` zdefiniowane, `choices` (jeśli są) 3–6 pozycji; kroki bez umiejętności mają wyłącznie typy spoza grupy 1 (lista grup 2–3 w teście).

#### 2. Sample i dokumentacja

**File**: `scripts/sample.ts`, `CLAUDE.md`, `AGENTS.md`

**Contract**: `sample` wypisuje `choices`, gdy są (`[<, >, =]`), i `answer` tablicowe jako listę; CLAUDE.md „Current state”: generatory 14 typów, `data/wordTemplates.ts`, `data/calendar.ts`, pomocniki tekstowe; „Target architecture” bez zmian. AGENTS.md: zdanie o `data/wordTemplates.ts` i słowniku; ≤ 400 słów.

### Success Criteria:

#### Automated Verification:

- `npm test` zielone z `curriculum.test.ts`; `npm run typecheck`; `npm run build`
- `npm run sample -- E3` i `-- E4` kod 0; `brak generatora` tylko dla typów grup 2–3 (sprawdzenie `grep 'brak generatora' | grep -vE 'CLOCK|MASS|DATA|PUZZLE_GRID|LENGTH|PLACE_VALUE|GRID|MULT_GROUPS|TEMPERATURE|MONEY|CAPACITY|PERIMETER'` puste)
- `tail -n +2 AGENTS.md | wc -w` ≤ 400; `grep -c wordTemplates CLAUDE.md` ≥ 1

#### Manual Verification:

- Właściciel czyta `sample -- E3` i `-- E4` (lub ich fragment) i akceptuje jakość poleceń dla klasy 2

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Po jednym pliku na generator (1000 losowań z `validateTask`), pomocniki (`shapes`, `distractors`, `numberWords`, `roman`), szablony (odmiana 0…100), program (`curriculum.test.ts`).

### Integration Tests:

- `npm run sample -- E3` / `-- E4` w kryteriach faz; workflow uruchamia `npm test`.

### Manual Testing Steps:

1. Odczyt `sample` po każdej fazie (seedy 1–3).
2. Właściciel ocenia 20 zadań tekstowych z E3.1.

## Performance Considerations

~14 typów × ~25 umiejętności × 1000 losowań w testach: generatory O(1) z odrzucaniem (limit 1000 prób); test szablonów 11 × 8 × 101 × 2 ≈ 18 000 walidacji regexem — poniżej 2 s.

## Migration Notes

`AddSubParams` bez `shapes` działa jak w F-03; `E3.ts` z F-03 zachowuje identyfikatory umiejętności (`E3.2.add_sub_20_bridge`, …), więc przyszły zapis (S-11) nie ma czego migrować.

## References

- Related research: `context/changes/generators-e3-e4/research.md`
- `docs/ZADANIA.md` §1–§4, §7; `context/foundation/prd.md` FR-004, FR-005
- Follow-up F-03: `context/archive/2026-10-12-generator-test-harness/follow-ups/review-fixes.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Arytmetyka na kształtach liczb (ADD_SUB `shape`, MISSING, COMPLEMENT, ROUNDING)

#### Automated

- [ ] 1.1 `npm test` z shapes/missing/complement/rounding, `typecheck`
- [ ] 1.2 `sample -- E4` i `-- E3` kod 0; kroki E4.2/4/5/6/8 mają zadania
- [ ] 1.3 Brak Phasera w core/data; brak polskich literałów w generatorach

#### Manual

- [ ] 1.4 Odczyt `sample -- E4 --seed 2`: kształty jak w katalogu, podpowiedzi poprawne

### Phase 2: Mnożenie, dzielenie i liczby (MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR)

#### Automated

- [ ] 2.1 `npm test` z 8 generatorami i 3 pomocnikami, `typecheck`
- [ ] 2.2 `sample -- E3`/`E4` kod 0; kroki E3.7/9/10/11, E4.1/6 mają zadania
- [ ] 2.3 numberToWords(23), toRoman(12), fromRoman('IX') przez tsx

#### Manual

- [ ] 2.4 Odczyt `sample` E3.7–E3.11, E4.1/E4.6: polecenia, rozpraszacze, podpowiedzi

### Phase 3: Zadania tekstowe (WORD, COMPARE_DIFF)

#### Automated

- [ ] 3.1 `npm test` z szablonami (0…100) i WORD/COMPARE_DIFF, `typecheck`
- [ ] 3.2 `sample -- E3` kod 0 z E3.1; bez `undefined`/`NaN`

#### Manual

- [ ] 3.3 Odczyt 20 zadań tekstowych E3.1: gramatyka, odmiana, rodzaj

### Phase 4: Test całego programu E3–E4, sample i dokumentacja

#### Automated

- [ ] 4.1 `npm test` z curriculum.test.ts, `typecheck`, `build`
- [ ] 4.2 `sample` E3/E4 kod 0; `brak generatora` tylko dla grup 2–3
- [ ] 4.3 AGENTS.md ≤ 400 słów; `wordTemplates` w CLAUDE.md

#### Manual

- [ ] 4.4 Właściciel akceptuje jakość poleceń `sample` E3/E4
