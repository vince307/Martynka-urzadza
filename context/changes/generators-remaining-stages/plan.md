# Generatory dla pozostałych etapów (E1–E2, E5–E6) — Implementation Plan

## Overview

Roadmapa S-03 (`generators-remaining-stages`, zamyka M1). Brakuje 7 typów grupy 1 (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP), kilku rozszerzeń istniejących generatorów (ADD_SUB `n − n` i F12, CALENDAR, EVEN_ODD z zerem, format liczb ≥ 10 000, COMPARE_NUM do 1 000 000, ROUNDING do setek i tysięcy, DIV z listą ilorazów, podpowiedź MULT dla pełnych dziesiątek i setek) oraz danych etapów `E1.ts`, `E2.ts`, `E5.ts`, `E6.ts`. Po planie `npm run sample -- <etap>` kończy się `Naruszenia: 0` dla wszystkich sześciu etapów, a `tests/contentInvariants.test.ts` i `tests/curriculum.test.ts` przechodzą po każdej umiejętności każdego etapu. Ryzyka test-planu #1 (zła odpowiedź / podpowiedź / odmiana) i #5 (dane etapu z niewykonalnymi parametrami, pustym krokiem lub zadaniami zdegenerowanymi).

## Current State Analysis

Z `context/changes/generators-remaining-stages/research.md` (sprawdzone na gałęzi):

- `src/core/tasks/registry.ts` ma 14 par `generators` / `parsers`; test „has a parser for every generator” w `tests/contentInvariants.test.ts` wymaga obu.
- `tests/curriculum.test.ts`: `GROUP_1` (14 typów) i `LATER` (13 typów rysunkowych); typ kroku spoza obu list przewraca test; `describe('curriculum E3–E4')`; granica liczona lokalnie z `params.max` (duplikat `boundOf` z `src/core/tasks/bounds.ts`).
- `tests/contentInvariants.test.ts`: `MIN_DISTINCT = 12`, `MAX_TOP_SHARE = 0.15`, `MAX_DEGENERATE_SHARE = 0.1`, `ARITHMETIC_LINE` / `BINARY_PROMPT` tylko `\d+`, skan granicy `/\d+/g`.
- `drawFree` w `src/core/tasks/generators/addSub.ts` daje `a − a` w 13–21 % losowań dla max 5–10 (łamie `MAX_DEGENERATE_SHARE`); `addSubHint(70, 9, '-')` daje jedną linię (F12). Pomocnicy `apply`, `sign`, `line` są prywatni w `addSub.ts`.
- `CalendarVariant` = `nextMonth | prevMonth | quarter | romanMonth`; `weekdays` w `src/data/calendar.ts` to gołe napisy bez przypadków, nieużywane.
- `parseRoundingParams` przyjmuje tylko `to: 10`; `DivParams` nie zna listy ilorazów; `describe` w `compareNum.ts` zna tylko dziesiątki i jedności; liczby pisane `${n}` bez spacji tysięcy.
- `stages` w `src/data/curriculum/index.ts` = E3, E4; bramka lokalna i `.github/workflows/ci.yml` (job `check`) uruchamiają `sample` tylko dla E3 i E4.
- Pomiar E1 (research §4): dwie rzeczywiście małe przestrzenie — COMPLEMENT do 10 (9 zadań) i EVEN_ODD `single` do 10 (10; z zerem 11).

## Desired End State

- Rejestr ma 21 typów; każdy nowy parser odrzuca niewykonalne parametry `TypeError`-em przy parsowaniu.
- `src/data/curriculum/` ma E1–E6; każdy krok z typem grupy 1 ma umiejętność; kroki tylko z typami grup 2–4 są puste (E1.1, E1.8, E1.10, E2.2, E2.8, E5.5, E5.12, E6.2, E6.3, E6.11).
- `npm run sample -- E1` … `-- E6` kończą się kodem 0 i `Naruszenia: 0`; bramka (profil § 2, `autonomous-run.env` `GATE_UNIT`) i `ci.yml` uruchamiają sample dla sześciu etapów.
- Niezmienniki treści przechodzą dla każdej umiejętności; jedyne odstępstwa to nazwane wyjątki `MIN_DISTINCT` dla `E1.6.even_odd_single_10` i `E1.7.complement_10` z komentarzem i zmierzoną wartością.

### Key Discoveries:

- Plik etapu może wejść dopiero, gdy wszystkie typy grupy 1 jego kroków mają generator (`tests/curriculum.test.ts`, „covers its group-1 types”) — stąd kolejność: generatory (fazy 1–5), E1+E2 (6), duże liczby (7–8), E5+E6 (9).
- Przypadek zdegenerowany naprawia generator (wzorzec `ONE_SHARE` / `drawQuotient` w `src/core/tasks/generators/div.ts`), nie próg.
- Typy z odpowiedzią-napisem (MISSING_OP, COMPARE_EXPR, CHOOSE_OP) walidator sprawdza tylko przez `choices`; ich poprawność (jednoznaczność, zgodność z treścią) musi pilnować test typu.
- `boundOf` czyta `max ?? maxProduct ?? maxDividend`; BONDS (`totals`) potrzebuje fallbacku, inaczej skan granicy go pominie.
- Polska norma zapisu: liczby czterocyfrowe bez spacji, od 10 000 grupy po trzy (katalog: „10 000”, „1 000 000”); grupowana liczba jest dziś niewidoczna dla `ARITHMETIC_LINE`, skanu granicy i `NUMBER_WORD` w `src/core/tasks/validate.ts`.

## What We're NOT Doing

- Typy grup 2–4 i tekstowe spoza ZADANIA §7 (SHAPES, COUNT, INEQUALITY, WRITTEN, PRICE, TIMES_MORE, ORDER_OPS, TIME_UNITS, UNIT_CHOICE, MIX, LOGIC, …) — trafiają do `LATER`, kroki zostają puste lub częściowe.
- Kafelki 3–4 dla odpowiedzi liczbowych E1 (ZADANIA §4 ADD_SUB) — w M1 `keypad`; follow-up `Trigger: S-04`.
- Luty w wariancie „ile dni ma miesiąc” (28/29) — pominięty; follow-up.
- NUMBER_WORDS powyżej 1000 (żaden krok E6 go nie wymienia), MISSING_OP z · i : (żaden krok S-03; 12 niejednoznacznych par), BONDS „połącz pary dające 10” (UI wyboru), CHOOSE_OP „z obrazkiem” (M6), COMPARE_NUM `step: 10`.
- Pełne dopracowanie treści E1–E2 i E5–E6 (PRD FR-004, Non-Goals: M8) — ale poprawność odpowiedzi, podpowiedzi, odmiany i zakresów nie jest łagodzona.
- F14 (pierwsza podpowiedź MISSING zdradza wynik, S-04), F10 (S-07), F6 (`deploy/`).
- Sceny, widżety, zapis.

## Implementation Approach

Dziesięć małych faz, każda zielona sama. Fazy 1–5 i 7–8 (`tdd`): generator lub rozszerzenie prowadzone czerwonym testem w `tests/<typ>.test.ts` (wzorzec `forEachDraw` z `tests/helpers.ts`, umiejętności zdefiniowane w teście, bez danych etapu); ≤ 2 nowe generatory na fazę. Fazy 6 i 9 (`impl`): dane etapów — czerwone/zielone mówią tu niezmienniki i `sample`. Faza 10 (`impl`): profil, env, CI, dokumentacja, follow-upy i seam sweep. Wszystkie teksty w `src/data/pl.ts` / `src/data/calendar.ts` / `src/data/wordTemplates.ts`; operatory z `src/core/tasks/symbols.ts`; każda podpowiedź `a op b = c` arytmetycznie prawdziwa, ostatnia zawiera odpowiedź liczbową.

**Bramka lokalna** (contract § Verification): fazy 1–5 używają bramki z kontraktu bez zmian. Faza 6 ZMIENIA komendę unit/integration na:

```
npm test && bash deploy/test-martynka-deploy.sh && bash deploy/ops/test-martynka-ops.sh && npm run sample -- E1 && npm run sample -- E2 && npm run sample -- E3 && npm run sample -- E4
```

Fazy 7–8 używają tej komendy. Faza 9 ZMIENIA ją na (obowiązuje fazy 9–10 i ship):

```
npm test && bash deploy/test-martynka-deploy.sh && bash deploy/ops/test-martynka-ops.sh && npm run sample -- E1 && npm run sample -- E2 && npm run sample -- E3 && npm run sample -- E4 && npm run sample -- E5 && npm run sample -- E6
```

Faza 10 zapisuje ją w profilu § 2, `context/foundation/autonomous-run.env` (`GATE_UNIT`) i `.github/workflows/ci.yml`.

Liczby testów zapisujemy jako baseline + delta: baseline na `main` @ `a24b502` = `Tests 236 passed` (kontrakt); każda faza mierzy na gałęzi przed zmianą i raportuje `<baseline gałęzi> + <nowe>`.

## Critical Implementation Details

**Wspólna arytmetyka.** CHAIN, MISSING_OP, COMPARE_EXPR i FACT_FAMILY potrzebują tego, co dziś prywatne w `addSub.ts` (`apply`, `sign`, `line`). Faza 2 wynosi je do `src/core/tasks/arith.ts` i `addSub.ts` z niego korzysta; kolejne fazy importują, nie kopiują.

**Jednoznaczność tekstowych odpowiedzi.** MISSING_OP: przy `+`/`−` jedyną niejednoznacznością jest `b = 0` — generator nie losuje zera. CHOOSE_OP: dla `sum` zamiana składników („3 + 5” zamiast „5 + 3”) jest też poprawna — nie może być rozpraszaczem.

**Format liczb.** `formatNumber` zmienia tylko liczby ≥ 10 000 (twarda spacja U+00A0); E1–E5 i E6 do 9 999 są bajtowo takie same. Wzorzec liczby jest jeden, eksportowany z `src/core/text/formatNumber.ts`, i używają go niezmienniki oraz `validate.ts`.

## Phase 1: ADD_SUB bez `n − n` i z podpowiedzią `DT − U` (F12); BONDS

Driver: tdd
Driver why: rzadkie `a − a`, rozbicie `70 − 9` i generator BONDS nie istnieją, a każde prowadzi failing test udziału / podpowiedzi / parsera (risk #1, #5).

### Overview

Napraw losowanie ADD_SUB, które łamie `MAX_DEGENERATE_SHARE` na każdym zakresie E1, dodaj szkolne rozbicie `DT − U` i generator domków liczb.

### Changes Required:

#### 1. ADD_SUB: rzadkie `a − a`, równomierne pary

**File**: `src/core/tasks/generators/addSub.ts`, `tests/addSub.test.ts`

**Intent**: Odejmowanie `a − a` ma pozostać możliwe (E1 uczy zera), ale rzadkie, jak iloraz 1 w DIV; w trybie bez kształtów pary losowane możliwie równomiernie, żeby najczęstsze zadanie małych zakresów nie przekraczało progu.

**Contract**: stała `SAME_SHARE` (≈ 0,05, nazwana i skomentowana jak `ONE_SHARE`) dla `a − a` w `drawFree` i w `drawShaped` dla kształtów o równych tokenach (`DT-DT`); poza tym `b < a` dla `−`. Test: dla `{ max: 5, ops: ['+','-'], bridge: 'any' }`, `{ max: 10, … }` i `{ max: 100, shapes: ['DT+DT','DT-DT'], bridge: 'none' }` udział `a − a` wśród odejmowań w 1000 losowań jest w (0; 0,1]; najczęstsze zadanie ≤ 15 %. Istniejące testy ADD_SUB i niezmienniki E3/E4 zostają zielone (wydruk `sample -- E3` może się zmienić; `sample -- E4` też — F12 zmienia podpowiedź E4.4 `sub_from_full_ten`, np. `90 − 4`).

#### 2. F12: podpowiedź `DT − U`

**File**: `src/core/tasks/generators/addSub.ts`, `tests/addSub.test.ts`

**Intent**: `70 − 9` uczy metody „odejmij dziesiątkę, dodaj resztę”, zamiast jednej linii z wynikiem.

**Contract**: `addSubHint(a, b, '-')` dla `a % 10 === 0`, `a ≥ 20`, `1 ≤ b ≤ 9` zwraca `['70 − 10 = 60', '60 + 1 = 61']` (dla 70 − 9); `10 − b` zostaje jedną linią (E1: „10 − 10 = 0” byłoby złą metodą). Test na `addSubHint(70, 9, '-')`, `addSubHint(20, 7, '-')` i `addSubHint(10, 3, '-')`.

#### 3. BONDS — domki liczb

**File**: `src/core/tasks/generators/bonds.ts` (nowy), `tests/bonds.test.ts` (nowy), `src/core/tasks/registry.ts`, `src/core/tasks/bounds.ts`, `src/data/pl.ts`

**Intent**: Rozkład liczby na dwa składniki z jednym pustym okienkiem (E1.3, E1.4, E1.7).

**Contract**: `BondsParams { totals: number[]; zero: boolean }` (`zero` domyślnie `false`); `parseBondsParams` rzuca `TypeError` dla pustej listy, liczby niecałkowitej lub sumy bez pary (np. `totals: [1]` bez `zero`). Losowanie jednostajne po parach `(total, a)` (nie „najpierw total”), okienko lewe lub prawe: polecenie z `pl.tasks.bonds(total)` + `"7 = 3 + □"` (`BOX`), `answer` liczba, `answer: 'keypad'` po stronie danych. Podpowiedź: pierwsze zdanie bez wyniku („Ile trzeba dodać do 3, żeby było 7?”), potem `3 + 4 = 7`. `boundOf` w `bounds.ts` zwraca największą z `params.totals`, gdy brak `max`/`maxProduct`/`maxDividend`. Test: 1000 losowań dla `[2,3,4,5]`, `[6,7]`, `[10]` — `validateTask` czysty, ostatnia linia podpowiedzi zawiera odpowiedź, ≥ 12 różnych, top ≤ 15 %; testy negatywne parsera.

### Success Criteria:

#### Automated Verification:

- Bramka z kontraktu (lint, typecheck, unit z `sample -- E3`/`E4`, build) zielona; `npm test` = baseline gałęzi + nowe testy ADD_SUB i BONDS, 0 failed
- `npx vitest run tests/addSub.test.ts tests/bonds.test.ts` zielone; `parseBondsParams({ totals: [1] })` rzuca `TypeError`
- Celowe zepsucie: `SAME_SHARE` → 1/a (stare losowanie) przewraca test udziału `a − a`; usunięcie gałęzi `DT − U` przewraca test F12; cofnięte. Meta-check: test udziału liczy losowania generatora, nie porównuje stałej z progiem

---

## Phase 2: CHAIN i MISSING_OP

Driver: tdd
Driver why: oba generatory nie istnieją; failing testy wyników pośrednich i jednoznaczności znaku prowadzą implementację (risk #1).

### Overview

Trzy składniki od lewej (E1.5) i brakujący znak `+`/`−` (E1.9), na wspólnej arytmetyce wyniesionej z ADD_SUB.

### Changes Required:

#### 1. Wspólna arytmetyka

**File**: `src/core/tasks/arith.ts` (nowy), `src/core/tasks/generators/addSub.ts`

**Intent**: Jedno miejsce na „policz”, „znak”, „linię działania”, żeby nowe generatory nie kopiowały prywatnych pomocników ADD_SUB.

**Contract**: `applyOp(a, b, op)`, `opSign(op)` (`-` → `MINUS`), `arithLine(a, b, op)` → `"a op b = c"` dla `op: '+' | '-'` (linia mnożenia `checkDiv` w fazie 4 składa się z `TIMES` z `symbols.ts`, jak w `div.ts`); `addSub.ts` importuje je zamiast własnych `apply`/`sign`/`line`; zachowanie ADD_SUB bez zmian (istniejące testy).

#### 2. CHAIN

**File**: `src/core/tasks/generators/chain.ts` (nowy), `tests/chain.test.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: „2 + 3 + 4”, „9 − 2 − 3”, „5 + 4 − 3” w zakresie kroku.

**Contract**: `ChainParams { max: number; ops: ('+'|'-')[]; terms: 3 }`; parser: `max ≥ 3`, niepuste `ops`, `terms` tylko 3 (`TypeError` inaczej). Składniki ≥ 1, każdy wynik pośredni i końcowy w [1; max] (generator pilnuje sam — `BINARY_PROMPT` nie obejmuje trzech składników, więc niezmienniki „zero operand” i „degenerate” go nie widzą). Polecenie `"2 + 3 + 4"`, odpowiedź liczba, podpowiedź dwie linie `arithLine`: `2 + 3 = 5`, `5 + 4 = 9`. Test: 1000 losowań `{ max: 9, ops: ['+','-'] }` — wyniki pośrednie w zakresie, ≥ 12 różnych, top ≤ 15 %, ostatnia linia = odpowiedź.

#### 3. MISSING_OP

**File**: `src/core/tasks/generators/missingOp.ts` (nowy), `tests/missingOp.test.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`

**Intent**: „8 □ 2 = 6” → „−”, kafelki `+` i `−`.

**Contract**: `MissingOpParams { max: number; ops: ('+'|'-')[] }`; parser odrzuca `*` i `/` (`TypeError` z uzasadnieniem: niejednoznaczne pary, poza S-03) oraz `ops` z jednym znakiem (zadanie bez wyboru). `b ≥ 1`, wynik w [0; max], `a − a` rzadko (`SAME_SHARE` z fazy 1 lub ta sama stała). `answer` = `'+'` lub `MINUS`, `choices` = oba znaki w losowej kolejności. Podpowiedź: zdanie z `pl.tasks` o kierunku („Wynik jest mniejszy niż 8, więc odejmujemy.”), potem `arithLine`. Test: dla każdego losowania dokładnie jeden znak daje równość (sprawdzone przez `applyOp` dla obu znaków); 110 możliwych zadań dla max 10 → ≥ 12 różnych.

### Success Criteria:

#### Automated Verification:

- Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy CHAIN i MISSING_OP, 0 failed; `grep -n "const apply\b\|const sign\b" src/core/tasks/generators/addSub.ts` puste
- Celowe zepsucie: CHAIN bez kontroli wyniku pośredniego (`9 − 5 − 6`) przewraca test zakresu; MISSING_OP z `b = 0` dopuszczonym przewraca test jednoznaczności; cofnięte. Meta-check: test jednoznaczności liczy oba znaki niezależnie od `answer` generatora (nie wyrocznia z implementacji)

---

## Phase 3: COMPARE_EXPR i SEQUENCE

Driver: tdd
Driver why: oba generatory nie istnieją; failing testy udziału „=” i braku liczb ujemnych w ciągu malejącym prowadzą implementację (risk #1).

### Overview

Porównanie wyników dwóch działań (E1.7) i ciąg z luką (E2.7, dziesiątki do 100).

### Changes Required:

#### 1. COMPARE_EXPR

**File**: `src/core/tasks/generators/compareExpr.ts` (nowy), `tests/compareExpr.test.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: „3 + 4 □ 9 − 1” → „<”.

**Contract**: `CompareExprParams { max: number; ops: ('+'|'-')[] }`; oba wyrażenia: składniki ≥ 1, wynik w [0; max]; „=” wymuszone z prawdopodobieństwem ~1/6 (jak `generateCompareNum`), przy czym dwa identyczne wyrażenia są odrzucane. `choices` = `SIGNS` z `compareNum.ts`, `answer` znak. Podpowiedź: `3 + 4 = 7`, `9 − 1 = 8`, `7 < 8` (ostatnia linia nie jest `ARITHMETIC_LINE`, więc nie podlega regule „last hint”). Test: znak zgodny z wynikami policzonymi `applyOp`; udział „=” w (0,1; 0,25); ≥ 12 różnych.

#### 2. SEQUENCE

**File**: `src/core/tasks/generators/sequence.ts` (nowy), `tests/sequence.test.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`

**Intent**: „10, 20, □, 40” → 30; w górę i w dół.

**Contract**: `SequenceParams { max: number; steps: number[]; length: number; start: 'multiple' | 'any'; directions: ('up'|'down')[] }` (domyślnie `length: 4`, `start: 'multiple'`, `directions: ['up','down']`); parser: `steps` dodatnie całkowite, `length` 4–6, wykonalność (`(length − 1) · min(steps) ≤ max`) albo `TypeError`. Wszystkie wyrazy w [0; max], jedna luka `BOX` w dowolnym miejscu, liczby oddzielone `", "`. Polecenie z `pl.tasks.sequence` + ciąg; podpowiedź: zdanie o regule („Każda następna liczba jest o 10 większa.”), potem `arithLine` od sąsiada do luki (`20 + 10 = 30`; luka na początku: `20 − 10 = 10`). Test: brak liczb ujemnych przy `down`, ostatnia linia zawiera odpowiedź, `{ max: 100, steps: [10] }` ≥ 12 różnych; parser odrzuca `{ max: 20, steps: [10], length: 4 }`.

### Success Criteria:

#### Automated Verification:

- Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy COMPARE_EXPR i SEQUENCE, 0 failed
- Celowe zepsucie: COMPARE_EXPR bez wymuszania „=” (udział ~9 %) przewraca test udziału; SEQUENCE `down` bez kontroli dolnej granicy przewraca test ujemnych; cofnięte. Meta-check: test znaku liczy wyniki sam (`applyOp`), nie czyta podpowiedzi generatora

---

## Phase 4: FACT_FAMILY i CHOOSE_OP

Driver: tdd
Driver why: oba generatory nie istnieją; failing testy „podpowiedź nie zdradza wyniku w 1. kroku” i „dokładnie jeden poprawny kafelek” prowadzą implementację (risk #1).

### Overview

Przemienność i sprawdzanie działań (E2.4, E2.6, E5.9, E6.7) oraz wybór działania do treści (E1.3).

### Changes Required:

#### 1. FACT_FAMILY

**File**: `src/core/tasks/generators/factFamily.ts` (nowy), `tests/factFamily.test.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`

**Intent**: Warianty: `swap` („4 + 7 = 7 + □” → 4), `checkSub` („12 − 5 = 7. Sprawdź: 7 + 5 = □” → 12), `checkAdd` („468 + 216 = 684. Sprawdź: 684 − 216 = □” → 468), `checkDiv` („42 : 6 = 7. Sprawdź: 7 · 6 = □” → 42).

**Contract**: `FactFamilyParams { max: number; variants: ('swap'|'checkSub'|'checkAdd'|'checkDiv')[] }`; `max` ogranicza wszystkie liczby (dla `checkDiv` iloczyn); parser odrzuca pustą listę, nieznany wariant i `max` za mały dla wariantu. Składniki ≥ 1, `swap` z `a ≠ b`; `checkDiv` z dzielnikiem i ilorazem ≥ 2. Słowo „Sprawdź” i zdania podpowiedzi w `pl.tasks`. Podpowiedź: pierwsza linia to reguła bez liczby-wyniku („Zamiana składników nie zmienia sumy.”, „Dodaj wynik i odjemnik.”), ostatnia to `arithLine` zawierająca odpowiedź. Test: 1000 losowań na wariant — pierwsza linia podpowiedzi nie zawiera odpowiedzi, ostatnia zawiera; arytmetyka zdania w poleceniu prawdziwa (parsowana z polecenia, nie z generatora); wszystkie liczby ≤ max; ≥ 12 różnych dla `{ max: 20, variants: ['swap'] }`.

#### 2. CHOOSE_OP

**File**: `src/core/tasks/generators/chooseOp.ts` (nowy), `tests/chooseOp.test.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`

**Intent**: Treść z `templates` (`src/data/wordTemplates.ts`) + „Które działanie pasuje?” → kafelek z działaniem.

**Contract**: `ChooseOpParams { max: number; kinds: ('sum'|'left'|'moreBy')[] }`; parser odrzuca inne rodzaje (`start`, `twoSteps`, … nie mają jednego bezpośredniego działania) i `max` poniżej minimum z `word.ts`. Liczby z tej samej funkcji co WORD: `drawNumbers` w `word.ts` staje się eksportowana i CHOOSE_OP ją importuje (bez kopii — seam sweep fazy 10), wynik w [0; max], `left`: a ≥ b. `answer` = działanie z pierwszej linii podpowiedzi szablonu bez wyniku (`"5 + 3"`), `choices` = 3 różne napisy: odpowiedź, to samo z drugim znakiem (bez ujemnych: `"3 − 5"` niedozwolone), to samo działanie z inną liczbą; zamiana składników sumy NIE jest rozpraszaczem. Podpowiedź: zdanie o kierunku z `pl.tasks` per rodzaj („Przybyło, więc dodajemy.”), bez działania-odpowiedzi w pierwszej linii. Test: dokładnie jeden kafelek ma wartość równą odpowiedzi szablonu (policzone z kafelków); brak kafelka z wynikiem ujemnym; pierwsza linia podpowiedzi ≠ odpowiedź; odmiana czysta (`validateTask` ze słownikiem).

### Success Criteria:

#### Automated Verification:

- Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy FACT_FAMILY i CHOOSE_OP, 0 failed
- Celowe zepsucie: CHOOSE_OP z zamianą składników jako rozpraszaczem przewraca test „dokładnie jeden poprawny kafelek”; FACT_FAMILY z wynikiem w pierwszej linii podpowiedzi przewraca test; cofnięte. Meta-check: test kafelków liczy wartość każdego kafelka sam, więc łapie też drugi poprawny kafelek, którego generator nie oznaczył

---

## Phase 5: CALENDAR — dni tygodnia, dni miesiąca, fakty o czasie; EVEN_ODD z zerem

Driver: tdd
Driver why: warianty i parametr `min` nie istnieją; failing testy („po niedzieli” → poniedziałek, „ile dni ma kwiecień” → 30, „czy 0 jest parzyste”) prowadzą rozszerzenie (risk #1).

### Overview

Rozszerzenia dla E1.4, E2.10, E5.11, E6.1 i E1.6 bez nowych typów.

### Changes Required:

#### 1. Dane kalendarza

**File**: `src/data/calendar.ts`

**Intent**: Dni tygodnia z przypadkami po „po” i „przed”, liczba dni miesiąca, mała pula faktów o czasie.

**Contract**: `Weekday { name; after; before }` — `after` (miejscownik): poniedziałku, wtorku, środzie, czwartku, piątku, sobocie, niedzieli; `before` (narzędnik): poniedziałkiem, wtorkiem, środą, czwartkiem, piątkiem, sobotą, niedzielą; `weekdays: readonly Weekday[]`. `Month.days: 28 | 30 | 31`. `timeFacts: readonly { question: string; answer: number; hint: string }[]` (dekada 10 lat, rok 12 miesięcy, rok 365 dni, tydzień 7 dni, wiek 100 lat).

#### 2. CALENDAR — nowe warianty

**File**: `src/core/tasks/generators/calendar.ts`, `tests/calendar.test.ts`, `src/data/pl.ts`

**Intent**: `nextWeekday` / `prevWeekday` (z zawinięciem niedziela ↔ poniedziałek), `monthDays` (bez lutego), `timeFacts`.

**Contract**: `CalendarVariant` += `'nextWeekday' | 'prevWeekday' | 'monthDays' | 'timeFacts'`. `nextWeekday`: „Jaki dzień tygodnia jest po środzie?” → `'czwartek'`, `choices` 3 nazwy (`pickChoices`); `monthDays`: „Ile dni ma kwiecień?” → 30, `choices [30, 31]`, luty nigdy nie losowany; `timeFacts`: pytanie z danych → liczba, `choices` przez `numberChoices`. Podpowiedzi z `pl.tasks` / danych, pierwsza linia bez wyniku (lista dni tygodnia; „Policz na knykciach”). Test: dla każdego dnia `next`/`prev` zgodne z kolejnością `weekdays` (sprawdzone indeksem, nie tekstem generatora), w tym niedziela → poniedziałek; `monthDays` nigdy luty, odpowiedź = `Month.days`; istniejące warianty bez zmian.

#### 3. EVEN_ODD z zerem

**File**: `src/core/tasks/generators/evenOdd.ts`, `tests/evenOdd.test.ts`

**Intent**: E1.6 „Zero, parzyste i nieparzyste” — zero jako liczba parzysta.

**Contract**: `EvenOddParams.min?: 0 | 1` (domyślnie 1 — E3 bez zmian); `single` losuje z [min; max]; podpowiedź dla 0 poprawna („0 kończy się na 0, to liczba parzysta”). Test: `{ max: 10, min: 0, variant: 'single' }` daje 0 i odpowiedź „parzysta”; parser odrzuca `min: 2`.

### Success Criteria:

#### Automated Verification:

- Bramka z kontraktu zielona; `npm test` = baseline gałęzi + nowe testy CALENDAR i EVEN_ODD, 0 failed; wydruk `npm run sample -- E3 --seed 2` dla kroków E3.7 i E3.11 identyczny przed i po fazie (diff pusty)
- Celowe zepsucie: `nextWeekday` bez zawinięcia (niedziela → `undefined`) przewraca test; `monthDays` z lutym przewraca test; cofnięte. Meta-check: test kolejności używa indeksów `weekdays`, więc zepsute dane przypadków (`after`) wyłapie dopiero odczyt nauczyciela — zapisane w § 5 handoffu

---

## Phase 6: Dane E1 i E2

Driver: impl
Driver why: same dane i listy typów w teście; czerwone/zielone mówią istniejące niezmienniki i `sample`, nie nowy test prowadzący (risk #5).

### Overview

`E1.ts`, `E2.ts`, rejestracja w `stages`, listy typów w `tests/curriculum.test.ts`, nazwane wyjątki małych przestrzeni. **Ta faza zmienia komendę bramki** (sample E1 i E2 — patrz Implementation Approach).

### Changes Required:

#### 1. Dane etapów

**File**: `src/data/curriculum/E1.ts`, `src/data/curriculum/E2.ts` (nowe), `src/data/curriculum/index.ts`

**Intent**: Wszystkie kroki z ZADANIA §3 (tytuły i typy z katalogu), umiejętności dla typów grupy 1, odpowiedzi liczbowe `keypad`.

**Contract**: wzór `E3.ts` (pomocnik `skill`, id `E<n>.<krok>.<nazwa>`). E1: E1.2 `compare_num_5` `{ max: 5 }`; E1.3 `add_sub_5` `{ max: 5, ops: ['+','-'], bridge: 'any' }`, `missing_5` `{ max: 5, ops: ['+','-'] }`, `bonds_5` `{ totals: [2,3,4,5] }`, `choose_op_5` `{ max: 5, kinds: ['sum','left'] }`; E1.4 `bonds_6_7` `{ totals: [6,7] }`, `calendar_weekdays` `{ variants: ['nextWeekday','prevWeekday'] }`; E1.5 `add_sub_9` `{ max: 9, … }`, `chain_9` `{ max: 9, ops: ['+','-'], terms: 3 }`, `word_9` `{ max: 9, kinds: ['sum','left','twoSteps'] }`; E1.6 `even_odd_single_10` `{ max: 10, min: 0, variant: 'single' }`, `even_odd_select_10` `{ max: 10, variant: 'select' }`; E1.7 `bonds_10` `{ totals: [10] }`, `complement_10` `{ max: 10, targets: [10] }`, `compare_expr_10` `{ max: 10, ops: ['+','-'] }`; E1.9 `add_sub_10` `{ max: 10, … }`, `missing_op_10` `{ max: 10, ops: ['+','-'] }`; E1.11 `calendar_months` `{ variants: ['nextMonth','prevMonth'] }`; puste: E1.1, E1.8, E1.10. E2: E2.1 `add_sub_20_units` `{ max: 20, shapes: ['DU+U','DU-U'], bridge: 'none' }`; E2.3 `add_bridge_20` `{ max: 20, ops: ['+'], bridge: 'ten' }`; E2.4 `fact_swap_20` `{ max: 20, variants: ['swap'] }`; E2.5 `sub_bridge_20` `{ max: 20, ops: ['-'], bridge: 'ten' }`; E2.6 `fact_check_sub_20` `{ max: 20, variants: ['checkSub'] }`; E2.7 `sequence_tens_100` `{ max: 100, steps: [10], start: 'multiple' }`, `compare_num_100` `{ max: 100 }`, `add_sub_tens_100` `{ max: 100, shapes: ['DT+DT','DT-DT'], bridge: 'none' }`; E2.9 `add_sub_99` `{ max: 99, shapes: ['DT+U','DU-U'], bridge: 'none' }`; E2.10 `calendar_20` `{ variants: ['nextMonth','prevMonth','nextWeekday','prevWeekday'] }`; puste: E2.2, E2.8. Parametry, które parser odrzuci lub które łamią niezmiennik, poprawia się w danych zgodnie z krokiem — nie w progu.

#### 2. Listy typów i wyjątki

**File**: `tests/curriculum.test.ts`, `tests/contentInvariants.test.ts`

**Intent**: Nowe typy grupy 1 i typy E1/E2 spoza grupy 1; dwa nazwane wyjątki `MIN_DISTINCT`.

**Contract**: `GROUP_1` += BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP (komentarz: grupa 1 ZADANIA §7 kompletna); `LATER` += SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, COUNT, ORDINAL, INEQUALITY, MONEY_PAY, ARROW_TABLE (komentarz: także typy tekstowe spoza §7). W `contentInvariants.test.ts` mapa `SMALL_SPACES: Record<skillId, { minDistinct: number; measured: string }>` z wpisami dla `E1.7.complement_10` (9 zadań — dopełnienie do 10 ma dokładnie 9) i `E1.6.even_odd_single_10` (11 — liczby 0–10), z wartościami ZMIERZONYMI w tej fazie (1000 losowań, seedy jak w teście; liczba różnych par i samych poleceń); wyjątek obejmuje tylko `MIN_DISTINCT` tylko tych id — `MAX_TOP_SHARE` i reszta reguł dalej obowiązują.

### Success Criteria:

#### Automated Verification:

- Bramka z NOWĄ komendą unit (z `npm run sample -- E1 && npm run sample -- E2`) zielona: lint, typecheck, unit, build; `npm test` = baseline gałęzi + testy umiejętności E1/E2, 0 failed
- `npm run sample -- E1` i `npm run sample -- E2` kod 0, `Naruszenia: 0`; `brak generatora` (skrypt drukuje go tylko dla kroków bez umiejętności) dokładnie w krokach E1.1, E1.8, E1.10, E2.2, E2.8 — same typy z `LATER`; typy `LATER` w krokach częściowych (E1.2 COUNT/ORDINAL, E1.9 INEQUALITY, E1.11, E2.1, E2.6, E2.9, E2.10) pilnuje `tests/curriculum.test.ts`
- Celowe zepsucie: usunięcie wpisu `E1.7.complement_10` z `SMALL_SPACES` przewraca niezmiennik z komunikatem „only 9 distinct tasks”; usunięcie umiejętności `E1.3.bonds_5` przewraca „covers its group-1 types”; cofnięte. Meta-check: wyjątek jest per id (inne umiejętności nadal mają próg 12), co pokazuje to, że zepsucie jednego wpisu przewraca tylko tę umiejętność

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6` i `npm run sample -- E2 --count 6`: każde zadanie nowych kroków — odpowiedź, podpowiedź, odmiana, przypadki dni tygodnia, sens treści CHOOSE_OP; wynik w `reviews/` lub w handoffie

---

## Phase 7: Duże liczby — `formatNumber` i COMPARE_NUM do 1 000 000

Driver: tdd
Driver why: format i podpowiedź dla dużych liczb nie istnieją; failing testy `formatNumber(1000000)` i podpowiedzi bez „dziesiątek” prowadzą zmianę (risk #1).

### Overview

Wspólny zapis liczb ≥ 10 000 i jeden wzorzec liczby dla niezmienników i walidatora; COMPARE_NUM dla E6.10.

### Changes Required:

#### 1. Format i wzorzec liczby

**File**: `src/core/text/formatNumber.ts` (nowy), `tests/formatNumber.test.ts` (nowy), `src/core/tasks/validate.ts`, `tests/contentInvariants.test.ts`

**Intent**: „10 000”, „1 000 000” po polsku, a niezmienniki nadal widzą arytmetykę i granice takich liczb.

**Contract**: `formatNumber(n)` — `n < 10 000` bez zmian (`'9999'`), od 10 000 grupy po trzy z U+00A0; `NUMBER_SOURCE` (źródło regexu: `\d{1,3}(?:\u00A0\d{3})+|\d+` — separator zapisany w kodzie jawnie jako `\u00A0`, nie jako niewidoczny znak) i `parseNumber(text)`. `ARITHMETIC_LINE`, `BINARY_PROMPT` i skan granicy w `contentInvariants.test.ts` oraz `NUMBER_WORD` w `validate.ts` budowane z `NUMBER_SOURCE` i liczone przez `parseNumber`. Test: `formatNumber(10000) === '10 000'`, `formatNumber(1000000)`, `formatNumber(9999) === '9999'`; `parseNumber` odwrotne; regex z `NUMBER_SOURCE` dopasowuje „10 000 + 1 = 10 001” w całości.

#### 2. COMPARE_NUM ≥ 1000

**File**: `src/core/tasks/generators/compareNum.ts`, `tests/compareNum.test.ts`, `src/data/pl.ts`

**Intent**: Porównanie do 1 000 000 z podpowiedzią „więcej cyfr = większa” albo „pierwsza różna cyfra od lewej”.

**Contract**: o rodzaju podpowiedzi decyduje parametr, nie wylosowana liczba: dla `params.max ≤ 100` zachowanie, zużycie rng i podpowiedź bez zmian (E1.2, E2.7, E4.1 — E4.1 losuje też 100 i ma dalej „100 to 10 dziesiątek”); dla `params.max > 100` podpowiedź z `pl.tasks`: różna liczba cyfr → zdanie o liczbie cyfr; równa → pierwsza różna cyfra od lewej i jej rząd; ostatnia linia `a < b` w zapisie `formatNumber`. Dla `max > 1000` z prawdopodobieństwem ~1/3 liczby mają różną liczbę cyfr. Test: `{ max: 1000000 }` — podpowiedź bez słowa „dziesiątek”/„jedności”, liczby ≥ 10 000 ze spacją U+00A0, znak zgodny z wartościami; `sample -- E4` krok E4.1 identyczny przy tym samym seedzie.

### Success Criteria:

#### Automated Verification:

- Bramka z komendą z fazy 6 (sample E1–E4) zielona; `npm test` = baseline gałęzi + testy formatNumber i COMPARE_NUM, 0 failed
- Celowe zepsucie: `ARITHMETIC_LINE` z powrotem na `\d+` przewraca test dopasowania wzorca; `formatNumber` bez grupowania przewraca test; cofnięte. Meta-check: test wzorca sprawdza linię z grupowaną liczbą, której stary regex nie dopasowuje — więc dowodzi, że niezmiennik przestał być ślepy, a nie tylko że funkcja istnieje

---

## Phase 8: ROUNDING do setek i tysięcy, DIV z listą ilorazów, podpowiedź MULT dla pełnych dziesiątek

Driver: tdd
Driver why: `to: 100` dziś rzuca w parserze, `quotients` i rozbicie `4 · 70` nie istnieją; każde prowadzi failing test parsera / podpowiedzi (risk #1, #5).

### Overview

Trzy małe rozszerzenia potrzebne E6.4, E6.8, E6.9.

### Changes Required:

#### 1. ROUNDING `to: 100 | 1000`

**File**: `src/core/tasks/generators/rounding.ts`, `tests/rounding.test.ts`, `src/data/pl.ts`

**Intent**: „Która pełna setka jest najbliżej liczby 4372?” / „Który pełny tysiąc …?” (rodzaj męski).

**Contract**: `RoundingParams.to: 10 | 100 | 1000`; parser: `max ≤ 10 000`, istnieje liczba w (to; max) niebędąca wielokrotnością `to` ani połówką (`n % to === to/2` pomijane — katalog nie rozstrzyga remisu) albo `TypeError`. Polecenia i podpowiedzi przez `formatNumber`. `to: 10` bez zmian (E4.4 identyczny przy tym samym seedzie). Test: `parseRoundingParams({ max: 10000, to: 100 })` nie rzuca; `{ max: 150, to: 100 }` rzuca; odpowiedź jest wielokrotnością `to` i najbliższa; brak remisów.

#### 2. DIV `quotients`

**File**: `src/core/tasks/generators/div.ts`, `tests/div.test.ts`

**Intent**: 800 : 4, 360 : 4 (E6.8) i 96 : 6 (E6.4) bez dowolnych ilorazów.

**Contract**: `DivParams.quotients?: number[]`; gdy podane, iloraz losowany z listy z dzielnikiem z `divisors` przy `d · q ≤ maxDividend`; parser: lista dodatnich całkowitych, istnieje para albo `TypeError`; `ONE_SHARE` tylko bez `quotients`. Test: `{ maxDividend: 1000, divisors: [2,…,9], quotients: [20,…,90,100,…,500] }` — iloraz zawsze z listy; brak pary → `TypeError`.

#### 3. Podpowiedź MULT dla wielokrotności 10 i 100

**File**: `src/core/tasks/generators/mult.ts`, `tests/mult.test.ts`

**Intent**: `4 · 70` → `4 · 7 = 28`, `28 · 10 = 280` zamiast połowienia (poprawne, ale nieszkolne).

**Contract**: nowa gałąź tylko dla DRUGIEGO czynnika `b` (tego z `factors`): `b = k · 10` z k 2–9 albo `b = k · 100` z k 2–9, przy `a` 2–9 — dwie linie: tabliczka (`4 · 7 = 28`), potem `28 · 10 = 280` / `6 · 100 = 600`; `b = 10` i `b = 100` zostają jedną linią (jak dziś `b === 10`), a pierwszy czynnik `a = 10` (E3.9 `mult_30`, `maxFactor: 10`, np. `10 · 3`) nie wchodzi do gałęzi; inne przypadki bez zmian (E3/E4 identyczne). Test: `multHint(4, 70)`, `multHint(3, 200)` — ostatnia linia zawiera iloczyn; `multHint(10, 3)`, `multHint(7, 10)` i `multHint(3, 100)` równe wynikom sprzed zmiany (jedna linia dla ·10/·100).

### Success Criteria:

#### Automated Verification:

- Bramka z komendą z fazy 6 zielona; `npm test` = baseline gałęzi + testy ROUNDING, DIV, MULT, 0 failed; `npm run sample -- E3 --seed 2` i `-- E4 --seed 2` identyczne jak przed fazą (diff pusty)
- Celowe zepsucie: ROUNDING bez pomijania połówek przewraca test remisu; DIV ignorujący `quotients` przewraca test; cofnięte. Meta-check: test „najbliższa” liczy odległość sam, a nie porównuje z podpowiedzią

---

## Phase 9: Dane E5 i E6

Driver: impl
Driver why: same dane i lista `LATER`; czerwone/zielone mówią niezmienniki i `sample` (risk #5).

### Overview

`E5.ts`, `E6.ts`, rejestracja w `stages`, reszta `LATER`. **Ta faza zmienia komendę bramki** (sample E1–E6 — patrz Implementation Approach).

### Changes Required:

#### 1. Dane etapów

**File**: `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts` (nowe), `src/data/curriculum/index.ts`

**Contract**: E5: E5.1 `add_sub_100_units` `{ max: 100, shapes: ['DU+U','DU-U'], bridge: 'any' }`; E5.2 `roman_12` `{ max: 12 }`, `add_sub_100_two_digit` `{ max: 100, shapes: ['DU+DT','DU+DU','DU-DU'], bridge: 'none' }`; E5.3 `number_words_100` `{ max: 100 }`, `calendar_months` `{ variants: ['nextMonth','prevMonth','quarter','romanMonth'] }`; E5.4 `mult_0_1_5_10` `{ maxProduct: 100, factors: [0,1,5,10], allowZeroOne: true }`, `div_50` `{ maxDividend: 50 }`; E5.6 `add_sub_100_bridge` `{ max: 100, shapes: ['DU+DU','DU-DU'], bridge: 'ten' }`; E5.7 `compare_diff_100` `{ max: 100 }`; E5.8 `mult_6_9` `{ maxProduct: 100, factors: [6,7,8,9] }`; E5.9 `div_100` `{ maxDividend: 100 }`, `fact_check_div_100` `{ max: 100, variants: ['checkDiv'] }`; E5.10 `word_100` `{ max: 100, kinds: ['groups','share','each','sum','left'] }`; E5.11 `calendar_days` `{ variants: ['monthDays','quarter'] }`; puste E5.5, E5.12. E6: E6.1 `calendar_time` `{ variants: ['timeFacts','monthDays','quarter'] }`; E6.4 `mult_teens` `{ maxProduct: 100, maxFactor: 9, factors: [11,…,19] }`, `div_teens` `{ maxDividend: 100, divisors: [2,…,9], quotients: [11,…,19] }`; E6.5 `complement_100_1000` `{ max: 1000, targets: [100, 1000] }`; E6.6 `add_sub_1000_units_tens` `{ max: 1000, shapes: ['HTU+U','HT+DT','HTU-U','HT-DT'], bridge: 'any' }`; E6.7 `fact_check_1000` `{ max: 1000, variants: ['checkAdd','checkSub'] }`; E6.8 `sub_from_hundreds` `{ max: 1000, shapes: ['H-HTU'], bridge: 'any' }`, `mult_tens_hundreds` `{ maxProduct: 1000, maxFactor: 9, factors: [10,…,90,100,…,500] }`, `div_tens_hundreds` `{ maxDividend: 1000, divisors: [2,…,9], quotients: [10,…,90,100,…,500] }`; E6.9 `rounding_100` `{ max: 10000, to: 100 }`, `rounding_1000` `{ max: 10000, to: 1000 }`; E6.10 `roman_2000` `{ max: 2000 }`, `compare_num_1000000` `{ max: 1000000 }`; puste E6.2, E6.3, E6.11. Parametry odrzucone przez parser lub łamiące niezmiennik poprawia się w danych zgodnie z krokiem.

#### 2. `LATER`

**File**: `tests/curriculum.test.ts`

**Contract**: `LATER` += WRITTEN, CLOCK_ELAPSED, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, TIME_UNITS, MIX, LOGIC.

### Success Criteria:

#### Automated Verification:

- Bramka z NOWĄ komendą unit (sample E1–E6) zielona: lint, typecheck, unit, build; `npm test` = baseline gałęzi + testy umiejętności E5/E6, 0 failed
- `npm run sample -- E5` i `-- E6` kod 0, `Naruszenia: 0`; `brak generatora` (tylko kroki bez umiejętności) dokładnie w E5.5, E5.12, E6.2, E6.3, E6.11 — same typy z `LATER`; E5.4 udział ·0/·1 ≤ 35 % (komunikat niezmiennika nie występuje)
- Celowe zepsucie: `E6.9.rounding_100` z `max: 150` przewraca niezmiennik na parsowaniu (`TypeError`), a `npm run sample -- E6` kończy się kodem ≠ 0; cofnięte. Meta-check: dowodzi wykrycia niewykonalnych danych przy parsowaniu (risk #5), a nie tylko przy losowaniu

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E5 --count 6` i `npm run sample -- E6 --count 6`: odpowiedzi, podpowiedzi (`4 · 70` → `4 · 7 = 28`, `28 · 10 = 280`; DIV zostaje przy sprawdzeniu mnożeniem `4 · 200 = 800` dla `800 : 4` — żadna faza nie buduje rozbicia „8 : 4 → 800 : 4”), zapis liczb ≥ 10 000, sens porównań do 1 000 000, odczyt `E6.4.mult_teens` i `E6.5.complement_100_1000` (Known risks)

---

## Phase 10: Bramka, CI, dokumentacja, follow-upy i seam sweep

Driver: impl
Driver why: konfiguracja, dokumentacja i porządki po fazach 1–9, bez nowej logiki.

### Overview

Nowa komenda bramki trafia do profilu, env i CI; dokumentacja i test-plan opisują sześć etapów i wyjątki; follow-upy zapisane; pozostałości faz usunięte.

### Changes Required:

#### 1. Bramka i CI

**File**: `context/foundation/autonomous-run.md` (§ 2), `context/foundation/autonomous-run.env` (`GATE_UNIT`), `.github/workflows/ci.yml`

**Intent**: Lokalna bramka i wymagany check PR uruchamiają sample dla każdego etapu z danymi.

**Contract**: § 2 wiersz unit/integration i `GATE_UNIT` = komenda z fazy 9; komentarz `GATE_SMOKE` w env wymienia E1–E6; `ci.yml` job `check`: kroki `- run: npm run sample -- E1` … `-- E6` w kolejności etapów i komentarz nagłówka „sample E1–E6”.

#### 2. Dokumentacja

**File**: `CLAUDE.md`, `AGENTS.md`, `context/foundation/test-plan.md`

**Contract**: CLAUDE.md „Commands” — sample dla dowolnego etapu E1–E6; AGENTS.md (≤ 400 słów) — „CI runs sample for every stage”; test-plan § 6.2 — wyjątki małych przestrzeni jako mapa `SMALL_SPACES` w `tests/contentInvariants.test.ts` (zamiast „lower them with a comment”), wzorzec liczby z `formatNumber.ts`; tabela narzędzi (content smoke) — E1–E6.

#### 3. Follow-upy

**File**: `context/changes/generators-remaining-stages/follow-ups/review-fixes.md` (nowy)

**Contract**: wpisy z linią `Trigger:` — kafelki 3–4 dla odpowiedzi liczbowych E1 (`Trigger: S-04`); luty 28/29 w `monthDays` (`Trigger: S-17`); BONDS „połącz pary dające 10” i CHOOSE_OP z obrazkiem (`Trigger: S-13`); dopracowanie treści E1–E2/E5–E6 (`Trigger: S-17`).

#### 4. Seam sweep

**File**: `tests/curriculum.test.ts`, `src/core/tasks/generators/*.ts`, `src/data/curriculum/*.ts`, `src/core/tasks/bounds.ts`

**Contract**: `curriculum.test.ts` liczy granicę przez `boundOf` (nie lokalnie z `params.max`) i `describe('curriculum')` zamiast „E3–E4”; komentarze GROUP_1/LATER, nagłówek `rounding.ts` („hundreds and thousands arrive with E6”), nagłówki `E3.ts` itd. aktualne; brak zduplikowanych pomocników (arytmetyka tylko w `arith.ts`, kafelki tylko w `distractors.ts`, wybór osób tylko w `word.ts`/`wordTemplates.ts`); `grep -rn "S-03" src tests` zwraca tylko prawdziwe odniesienia.

### Success Criteria:

#### Automated Verification:

- Bramka z komendą z fazy 9 zielona; `grep -c "npm run sample -- E" .github/workflows/ci.yml` = 6; `bash -c "$(grep '^GATE_UNIT=' context/foundation/autonomous-run.env | cut -d= -f2- | tr -d '\"')"` kod 0; `tail -n +2 AGENTS.md | wc -w` ≤ 400
- Seam sweep: `grep -n "params.max" tests/curriculum.test.ts` puste; `grep -n "E3–E4" tests/curriculum.test.ts` puste; `grep -rn "const apply\b\|const sign\b" src/core/tasks/generators` puste; `test -f context/changes/generators-remaining-stages/follow-ups/review-fixes.md` i `grep -c "Trigger:" context/changes/generators-remaining-stages/follow-ups/review-fixes.md` ≥ 4
- Celowe zepsucie: usunięcie E5 z `stages` w `src/data/curriculum/index.ts` — `npm test` zostaje zielony (testy iterują po `stages`), a `GATE_UNIT` z env kończy się kodem ≠ 0 na `npm run sample -- E5` (`usage()`, kod 2); stara komenda E3/E4 przeszłaby; cofnięte. Meta-check: zepsucie, które łapie też `npm test` (np. `maxDividend: 1`), przewróciłoby bramkę przed krokiem sample i nie dowodziłoby niczego o sample E5 — to łapie wyłącznie nowy krok

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`, `npm run sample -- E2 --count 6`, `npm run sample -- E5 --count 6`, `npm run sample -- E6 --count 6` — każde zadanie każdego kroku z danymi (kontrakt, reguły S-03; impl-review)
- [reviewer] (CI at ship) Job `check` workflow `CI` na PR: w logu (`gh run view <id> --log --job <job id>`) kroki pasujące do regexu `##\[group\]Run npm run sample -- E[1256]$` (wzór linii widzianej w runie 38278623270: `##[group]Run npm run sample -- E4`; regex sprawdzony w plan-review na logu joba `check` 114910141466 — `grep -E` dopasowuje oba kroki E3/E4 w wariancie `E[34]`, linie bez `\r`), każdy zakończony linią `Naruszenia: 0` (kolumna kroku w logu nazywa krok); `gh` poza sandboxem bez potoków — log zapisać do pliku w scratchpadzie, potem `grep -E`
- [human] Maintainer czyta ten sam wydruk `npm run sample -- <etap> --count 6` dla E1, E2, E5, E6 przed merge'em (run zatrzymuje się na PR)
- [human] Decyzja: odpowiedzi liczbowe E1 przez klawiaturkę zamiast 3–4 kafelków z ZADANIA §4 (ADD_SUB) — akceptacja albo przeniesienie do S-04 (follow-up już zapisany)

---

## Testing Strategy

### Unit Tests:

- Po jednym pliku na nowy generator (`bonds`, `chain`, `missingOp`, `compareExpr`, `sequence`, `factFamily`, `chooseOp`) plus `formatNumber`; rozszerzone `addSub`, `calendar`, `evenOdd`, `compareNum`, `rounding`, `div`, `mult`. Każdy: 1000 losowań z `validateTask`, test negatywny parsera, test własności liczonej niezależnie od generatora (jednoznaczność znaku, poprawny kafelek, kolejność dni).
- `tests/contentInvariants.test.ts` i `tests/curriculum.test.ts` automatycznie po E1–E6.

### Integration Tests:

- `npm run sample -- E1` … `-- E6` w bramce i CI.

### Manual Testing Steps:

1. Odczyt nauczyciela po fazach 6 i 9 (`--count 6`).
2. Końcowy odczyt E1, E2, E5, E6 (reviewer, potem maintainer).

## Performance Considerations

~120 umiejętności × 1000 losowań w niezmiennikach (dziś 29 w < 5 s) — oczekiwane ~15 s; generatory O(1) z limitem prób, enumeracje parserów ≤ 10 000 par.

## Migration Notes

Brak (profil § 4: bez bazy; zapis od S-11). Identyfikatory umiejętności E3/E4 bez zmian.

## References

- Research: `context/changes/generators-remaining-stages/research.md`
- `docs/ZADANIA.md` §2–§4, §7; `context/foundation/prd.md` FR-004, FR-005; `context/foundation/test-plan.md` §2 (#1, #5), §6.2
- Wzorce: `context/archive/2026-10-12-generators-e3-e4/plan.md`, `context/archive/2026-10-12-testing-content-invariants/plan.md`
- Follow-up F12: `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md`

## Known risks

Z plan-review (`reviews/plan-review.md`); nie blokują, rozstrzyga odczyt nauczyciela (9.4, 10.4) albo M8:

- **`E6.4.mult_teens`**: podpowiedź MULT dla `4 · 13` to połowienie/dokładanie (`4 · 12 = 48`, `48 + 4 = 52`) — arytmetycznie poprawna, ale szkolna metoda to `4 · 10 + 4 · 3`. Faza 8 jej nie zmienia; jeśli odczyt uzna ją za błąd metody, follow-up `Trigger: S-17` (nie nowa faza).
- **`E6.5.complement_100_1000`**: `targets: [100, 1000]` czyta „dopełnianie do setki” jako „do 100”; możliwe też „do następnej pełnej setki” (340 → 400), czego COMPLEMENT dziś nie umie (tylko następna dziesiątka). Odczyt nauczyciela decyduje; inna interpretacja = follow-up.
- **E5.4 ·0/·1** blisko progu (32,8 % vs 35 %) — jak w § 5 handoffu: poprawka danych, nie progu.

## Autonomous decisions

1. **10 faz zamiast 7 z research §6, slice nie dzielony.** Odrzucone: 7 faz (faza z 2 generatorami + 2 poprawkami ADD_SUB i faza z 4 rozszerzeniami dużych liczb), podział S-03 w roadmapie. Dlaczego: każdą fazę robi świeży agent, mniejsze fazy = mniejsze ryzyko czerwonej bramki; ≤ 2 nowe generatory lub ≤ 3 małe rozszerzenia na fazę; podział slice'u nie zmniejsza pracy, a S-03 zamyka M1. Zmieniłoby: plan-review uznający fazę za za dużą (dalszy podział) albo za drobną (scalenie 7+8).
2. **Profil, env i CI w osobnej fazie 10** (prompt kroku). Fazy 6 i 9 tylko nazywają nową komendę bramki. Zmieniłoby: orchestrator wymagający zgodności `ci.yml` w każdej fazie.
3. **Luty pominięty w `monthDays`** (rekomendacja research). Odrzucone: odpowiedź „28 albo 29” (wymaga `check` z wieloma odpowiedziami). Zgodne z ZADANIA §2 E5 („miesiące 30/31 dni”). Zmieniłoby: ekran S-04 z wieloma poprawnymi kafelkami.
4. **EVEN_ODD z zerem (`min: 0`) w E1.6** (rekomendacja research), wyjątek `MIN_DISTINCT` = zmierzona wartość (~11). Odrzucone: max 12 (liczby 11–12 wchodzą dopiero w E1.10). Zmieniłoby: pomiar w fazie 6 inny niż ~11 — wtedy wpisuje się zmierzoną wartość.
5. **E1 odpowiedzi liczbowe `keypad`** (rekomendacja research) — wbrew literze ZADANIA §4 ADD_SUB („3–4 kafelki (E1)”), stąd wiersz `[human]` w fazie 10 i follow-up `Trigger: S-04`. PRD FR-006 dopuszcza „kafelki lub klawiaturka”. Zmieniłoby: S-04 wymagające kafelków dla E1 przed M2.
6. **Wyjątki małych przestrzeni per id** (research §4, decyzja 1 handoffu research). Odrzucone: obniżenie progu globalnie, poszerzenie danych poza krok. Zmieniłoby: wierny krokowi wariant z ≥ 12 zadaniami.
7. **`formatNumber` od 10 000 z U+00A0** (polska norma; katalog pisze „1000”, „10 000”). Odrzucone: spacja od 1000, zwykła spacja (łamanie linii na ekranie). Zmieniłoby: decyzja graficzna S-04 o innym separatorze — zmienia się jedna funkcja i wzorzec.
8. **Podpowiedź MULT dla wielokrotności 10/100 w zakresie** (research: opcjonalne). Dlaczego: mała zmiana, a obecna podpowiedź „4 · 35 = 140, 140 + 140 = 280” nie przejdzie odczytu nauczyciela jako metoda szkolna. COMPARE_NUM `step: 10` — poza zakresem (E2.7 pokrywa COMPARE_NUM `{ max: 100 }`). Zmieniłoby: impl-review uznający rozbicie za zbędne.
9. **CHOOSE_OP tylko `sum`, `left`, `moreBy`.** Odrzucone: `start`, `twoSteps` (brak jednego działania wprost z treści w E1). Zmieniłoby: krok wymagający pytania do treści („treść bez pytania + 3 pytania”) — osobny wariant później.
10. **F12 tylko dla `a ≥ 20`.** `10 − b` zostaje jedną linią (rozbicie „10 − 10 = 0, 0 + 3” byłoby złą metodą w E1). Zmieniłoby: odczyt nauczyciela wskazujący inną metodę dla E4.4.
11. **Status roadmapy `planning` commitowany z planem** (kontrakt: czyste drzewo wygrywa nad „zostaw dla użytkownika” skilla).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: ADD_SUB bez `n − n` i z podpowiedzią `DT − U` (F12); BONDS

#### Automated

- [x] 1.1 Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy ADD_SUB i BONDS — 3361723
- [x] 1.2 `tests/addSub.test.ts` i `tests/bonds.test.ts` zielone; `parseBondsParams({ totals: [1] })` rzuca `TypeError` — 3361723
- [x] 1.3 Celowe zepsucie `SAME_SHARE` i gałęzi `DT − U` przewraca testy; cofnięte; meta-check — 3361723

### Phase 2: CHAIN i MISSING_OP

#### Automated

- [x] 2.1 Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy CHAIN i MISSING_OP; `apply`/`sign` tylko w `arith.ts` — c0e8bc9
- [x] 2.2 Celowe zepsucie wyniku pośredniego CHAIN i `b = 0` w MISSING_OP przewraca testy; cofnięte; meta-check — c0e8bc9

### Phase 3: COMPARE_EXPR i SEQUENCE

#### Automated

- [x] 3.1 Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy COMPARE_EXPR i SEQUENCE — 308c458
- [x] 3.2 Celowe zepsucie udziału „=” i dolnej granicy ciągu przewraca testy; cofnięte; meta-check — 308c458

### Phase 4: FACT_FAMILY i CHOOSE_OP

#### Automated

- [x] 4.1 Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy FACT_FAMILY i CHOOSE_OP — 0b5382e
- [x] 4.2 Celowe zepsucie rozpraszacza CHOOSE_OP i pierwszej linii podpowiedzi FACT_FAMILY przewraca testy; cofnięte; meta-check — 0b5382e

### Phase 5: CALENDAR — dni tygodnia, dni miesiąca, fakty o czasie; EVEN_ODD z zerem

#### Automated

- [x] 5.1 Bramka z kontraktu zielona; `npm test` = baseline gałęzi + testy CALENDAR i EVEN_ODD; E3.7/E3.11 w `sample -- E3` bez zmian przy tym samym seedzie — 8f4a7ee
- [x] 5.2 Celowe zepsucie zawinięcia tygodnia i lutego w `monthDays` przewraca testy; cofnięte; meta-check — 8f4a7ee

### Phase 6: Dane E1 i E2

#### Automated

- [x] 6.1 Bramka z NOWĄ komendą unit (sample E1–E4) zielona; `npm test` = baseline gałęzi + testy umiejętności E1/E2 — ea0f698
- [x] 6.2 `sample -- E1` i `-- E2` kod 0, `Naruszenia: 0`; `brak generatora` tylko dla typów z `LATER` — ea0f698
- [x] 6.3 Celowe zepsucie wpisu `SMALL_SPACES` i umiejętności `E1.3.bonds_5` przewraca testy; cofnięte; meta-check — ea0f698

#### Manual

- [ ] 6.4 [reviewer] Odczyt nauczyciela `sample -- E1 --count 6` i `-- E2 --count 6`

### Phase 7: Duże liczby — `formatNumber` i COMPARE_NUM do 1 000 000

#### Automated

- [ ] 7.1 Bramka z komendą z fazy 6 zielona; `npm test` = baseline gałęzi + testy formatNumber i COMPARE_NUM
- [ ] 7.2 Celowe zepsucie wzorca liczby i grupowania przewraca testy; cofnięte; meta-check

### Phase 8: ROUNDING do setek i tysięcy, DIV z listą ilorazów, podpowiedź MULT dla pełnych dziesiątek

#### Automated

- [ ] 8.1 Bramka z komendą z fazy 6 zielona; `npm test` = baseline gałęzi + testy ROUNDING, DIV, MULT; `sample -- E3/E4 --seed 2` bez zmian
- [ ] 8.2 Celowe zepsucie remisu ROUNDING i `quotients` DIV przewraca testy; cofnięte; meta-check

### Phase 9: Dane E5 i E6

#### Automated

- [ ] 9.1 Bramka z NOWĄ komendą unit (sample E1–E6) zielona; `npm test` = baseline gałęzi + testy umiejętności E5/E6
- [ ] 9.2 `sample -- E5` i `-- E6` kod 0, `Naruszenia: 0`; `brak generatora` tylko dla `LATER`; E5.4 ·0/·1 ≤ 35 %
- [ ] 9.3 Celowe zepsucie `E6.9.rounding_100` (`max: 150`) przewraca niezmiennik i `sample -- E6`; cofnięte; meta-check

#### Manual

- [ ] 9.4 [reviewer] Odczyt nauczyciela `sample -- E5 --count 6` i `-- E6 --count 6`

### Phase 10: Bramka, CI, dokumentacja, follow-upy i seam sweep

#### Automated

- [ ] 10.1 Bramka z komendą z fazy 9 zielona; 6 kroków sample w `ci.yml`; `GATE_UNIT` z env kod 0; AGENTS.md ≤ 400 słów
- [ ] 10.2 Seam sweep: `boundOf` w `curriculum.test.ts`, brak „E3–E4”, brak zduplikowanych pomocników, follow-upy z `Trigger:`
- [ ] 10.3 Celowe zepsucie `E5.4.div_50` przewraca `GATE_UNIT` z env; cofnięte; meta-check

#### Manual

- [ ] 10.4 [reviewer] Odczyt nauczyciela `sample -- <etap> --count 6` dla E1, E2, E5, E6
- [ ] 10.5 [reviewer] (CI at ship) Job `check`: kroki `##\[group\]Run npm run sample -- E[1256]$` z `Naruszenia: 0`
- [ ] 10.6 [human] Maintainer czyta wydruk `sample -- <etap> --count 6` dla E1, E2, E5, E6 przed merge'em
- [ ] 10.7 [human] Decyzja: E1 `keypad` zamiast 3–4 kafelków (ZADANIA §4)
