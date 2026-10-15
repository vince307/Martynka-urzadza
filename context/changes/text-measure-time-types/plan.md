# Typy tekstowe: czas, jednostki, ceny, kolejność działań, nierówności i runda powtórkowa (E1, E5–E6) — Implementation Plan

## Overview

Slice roadmapy **S-14c** (`text-measure-time-types`, etap M6), autonomiczny run `2026-10-15-fix-s14c-s14d`, gałąź
`feat/text-measure-time-types` z `main` @ `e2f7caa`. Dziecko dostaje w rundzie:

- **INEQUALITY** (E1.9): „5 + □ < 8” na kafelkach, **kilka kafelków jest dobrych** (`Task.check`), scena podświetla
  stuknięty kafelek;
- **ORDER_OPS** (E5.11), **TIMES_MORE** i **PRICE** (E5.10) — zadania tekstowe na klawiaturze;
- **CLOCK_ELAPSED** (E5.3 godzina końca na kafelkach, E5.8 i E6.2 minuty/godziny na klawiaturze) i **TIME_UNITS** (E6.1);
- **UNIT_CHOICE** (E5.7, kafelki z jednostką) i **tekstowe warianty** MASS (E5.7, E6.3, E6.5), LENGTH (E5.12, E6.3),
  CAPACITY (E5.5 `capacity_half_l_e5`, follow-up S-14b) i PLACE_VALUE ≥ 1000 (E6.9, E6.10);
- **rundę powtórkową** E6.11 („Test przed klasą 4”, MIX) jako **krok programu**: zwykła runda (`kind: 'round'`), która
  losuje najpierw krok E6, potem umiejętność; harmonogram wariantów S-15 bez zmian.

Bez nowych widżetów i bez nowego trybu odpowiedzi. Format zapisu zostaje **v2** (żadna faza nie potrzebuje v3).

## Current State Analysis

Z `research.md` (commit `bf50bca`), `change.md` i odczytów w tym kroku (kotwice: symbole):

- **Rejestr** (`src/core/tasks/registry.ts` `generators`/`parsers`): 37 typów, żadnego z siedmiu nowych. W
  `tests/curriculum.test.ts` nowe typy są w `LATER` (wolno nie mieć umiejętności); `GROUP_1` wymaga umiejętności w każdym
  kroku, który typ wymienia. Każdy z siedmiu typów występuje dokładnie w krokach z outcome'u roadmapy (grep `src/data/curriculum/`).
- **`check`**: `isCorrect` (`src/core/round.ts`) woła `task.check` przed porównaniem — w każdej fazie rundy. Brakuje: scena
  podświetla `task.answer` (`TaskScene`, `this.tiles.markCorrect(... task.answer ...)`), `answerWrong`
  (`tests/e2e/support/hook.ts`) bierze pierwszy kafelek `!== state.answer`, `numberChoices`/`pickChoices`
  (`src/core/tasks/distractors.ts`), `validateTask` (`src/core/tasks/validate.ts`) i `leaksAnswer` (`src/core/round/hints.ts`)
  nie znają `check`. `answerRight` (stuka `=== state.answer`) jest bezpieczny.
- **Krok bez umiejętności jest niewidoczny**: `playableSteps` (`src/core/curriculum.ts`) = `step.skills.some(playable)`;
  E6.2 i E6.11 mają `skills: []`. `calendarStart` liczy `k = ceil(progress · n)` po `playableSteps`; `floorToCalendar`
  podnosi zapisany krok do startu kalendarza. `firstPlayableSteps` (`src/core/round/pick.ts`) ma własny filtr
  `skills.some(playable)`. `skillBuckets` składa `current`/`earlier`/`previous`, `pickRoundSkills` losuje kubeł wg wag, potem
  umiejętność jednostajnie; `withoutArtBlocked` (`src/core/round/artFilter.ts`) z `minCurrent`.
- **Testy przypięte do dzisiejszego E6**: `tests/curriculumStart.test.ts` (lista `playableSteps` E6 `[1, 3..10]`, wyrocznia E6
  `[3, 4, 6, 8, 10, 10]`), `tests/curriculumPick.test.ts` (komentarz i asercja „E6 step 2 has no playable skill”),
  `tests/curriculumEnd.test.ts` (dwa przypadki E6 step 2), `tests/progress.test.ts` („E6 step 2 … 1st of 9”),
  `tests/perimeterSkills.test.ts` (E6.3 dokładnie `['E6.3.perimeter_composite']`, E5.12 dwie umiejętności), `tests/mass.test.ts`
  (każde zadanie MASS ma `visual.kind === 'scale'`). E2E: jedynie `tests/e2e/written-column.spec.ts` gra E6 (wymuszone
  `E6.7.written_sub_1000`, ścieżka rodzica — bez rozgrzewki), więc zmiana startu E6 go nie dotyka; E1 grają
  `first-launch`, `minigames`, `save-*` (kroki E1 z kalendarza października, E1.9 tam nie wypada), a etap E2 losuje 10 %
  z całego E1 (`previous`) — stąd poprawka `answerWrong` w fazie, w której INEQUALITY staje się grywalne.
- **Klawiatura**: `keypadInput` (`src/core/round/keypad.ts`) — liczby całkowite ≥ 0, `balance.keypad.maxDigits` = 7. Godzina
  („8.45”) albo kwota mieszana może być tylko kafelkiem tekstowym albo pytaniem o jedną liczbę.
- **Generatory do rozszerzenia**: `mass.ts` (`parseMassParams` wymaga `weights`, każdy wariant rysuje wagę; `artBlocked`
  blokuje MASS przy brakującej grafice), `length.ts` (unia `ruler | convert`, `convert` już tekstowy), `placeValue.ts`
  (`parsePlaceValueParams` rzuca dla `max > 999` w każdym wariancie), `capacity.ts` (`toLitres | howMany`, oba z `jugs`;
  `artBlocked` zwalnia `howMany`). Wzorzec pętli z limitem: `MAX_ATTEMPTS` (`chooseOp.ts`, `chain.ts`, `word.ts`).
- **Walidator i inwarianty**: `NUMBER_WORD` sprawdza odmianę słownikowych rzeczowników dla każdego n; `ACCUSATIVE_ONE` zna tylko
  `ma|mają|miał(a)|kupił(a)|oddał(a)|dostał(a)|zabrano|dołożono|o|za`; `tests/contentInvariants.test.ts`: `screenBound`,
  `UNBOUNDED_TYPES` (`src/core/tasks/bounds.ts`), `KEYPAD_HINT_MAX` 64, `ARITHMETIC_LINE` zakotwiczona `^a op b = c$`,
  `MIN_DISTINCT` 12, top ≤ 15 %, `ANSWER_LINE_TYPES`. Brakuje 23 rzeczowników (research § 6).
- **Mowa**: narrator czyta `task.speak ?? task.prompt` (`src/core/narration/spoken.ts`); CLOCK podaje `speak`
  (`pl.tasks.clockSetSpeak`); `formatTime` (`src/core/text/time.ts`) daje „8.15”.
- **Kit** (read-only): ekrany `task-tiles.png`, `task-keypad.png`, `hint-*.png`, `solution-step-*.png`, `unlock.png` — bez widoku
  „kilka dobrych kafelków”. `docs/design-gaps.md` kończy się na wierszu **97** → nowe wiersze od **98**.
- `context/foundation/lessons.md` nie istnieje (sprawdzone) — żadna lekcja nie obowiązuje.

## Desired End State

- `npm run sample -- E1|E5|E6 --count 6` drukuje zadania wszystkich nowych umiejętności bez naruszeń; każdy z siedmiu
  typów jest w `GROUP_1` testu programu (krok, który go wymienia, musi mieć umiejętność); E6.2 i E6.11 są grywalne.
- Dziecko E1 stuka **dowolny** dobry kafelek nierówności i dostaje gwiazdkę, a zielony robi się kafelek stuknięty; zły
  kafelek daje podpowiedź i drugą próbę; rozwiązanie pokazuje jeden przykład („np. 2”).
- Uczeń E6 na E6.10 po odblokowaniu widzi kartę „Nowa umiejętność!” z nazwą powtórki; runda na E6.11 losuje zadania z wielu
  kroków E6 (krok, potem umiejętność) i ~14 % z E5; start kalendarza i rozgrzewka nigdy nie wypadają na E6.11.
- Dwa nowe spece e2e (#11, #13) zielone; progi odblokowania wymienione w PR; zapis v2, fixture'y bez zmian.

### Key Discoveries:

- `isCorrect` już honoruje `check` (także w retype), więc INEQUALITY potrzebuje tylko otoczki: scena, hak, helper e2e,
  walidator, przeciek, dystraktory — wszystko w fazach 1–2, zanim zadanie stanie się grywalne.
- Wyłączenie kroku powtórkowego z `calendarStart` daje E6 n = 10 grywalnych kroków startowych po fazie 4 i nadal 10 po
  fazie 8 — wyrocznia E6 z fazy 4 nie zmienia się w fazie 8, co jest dowodem wyłączenia (deliberate break fazy 8).
- `firstPlayableSteps` już pomija krok bez własnych umiejętności, więc rozgrzewka wyklucza E6.11 bez zmian kodu (test to przypina).
- Każdy wariant tekstowy idzie wzorem `convert` z `length.ts`: członek unii parametrów bez `visual`, kontrole rysunku
  (parsery, `artBlocked`, testy rysunku) per wariant.

## What We're NOT Doing

- „Ustaw zegar” w E5–E6 i zegar co minutę na tarczy — żaden krok E5–E6 nie ma CLOCK w `types:` → follow-up
  `Trigger: a CLOCK step in E5–E6 or a tablet test`.
- Banknoty 200/500 zł — PRICE w E5 to pełne złote ≤ 100 → `Trigger: a money skill above 100 zł`.
- WRITTEN „brakujące cyfry” i F9 (`MAX_ATTEMPTS` w `written.ts`) → `Trigger: the next change to WRITTEN`.
- ARROW_TABLE „·n”, łańcuch, kilka pustych pól → `Trigger: a multi-number reducer`.
- LOGIC w E6.11 (pula zagadek S-15 to E3–E4, `balance.variants.puzzleStages`) → zostaje follow-up F1 S-15.
- „Mnożenie kilku liczb” z opisu E5.10 (nie jest typem z outcome'u) i kwoty z groszami w PRICE.
- Rozkład jazdy jako tabelka (`TaskVisual`) — podany tekstem; tytuł „Powtórka” w HUD; stan „zdany test” w zapisie (v3).
- Nowy tryb odpowiedzi, nowe widżety, zmiana `keypadSolution`, zmiana formatu zapisu.

## Implementation Approach

Kolejność: najpierw otoczka `check` w czystym `core`, potem INEQUALITY grywalne z poprawkami sceny i e2e, potem typy
tekstowe w grupach ≤ 3 generatory/warianty na fazę — **generator i dane razem** (faza tdd: failing testy generatora prowadzą,
dane na końcu fazy, odczyt nauczyciela `sample` z tej fazy), potem krok powtórkowy, seam sweep, dwie fazy e2e.

1. `check` w walidatorze, przecieku i dystraktorach; generator INEQUALITY (tdd, bez umiejętności).
2. INEQUALITY grywalne w E1.9: scena, hak, `answerWrong`, dane, DESIGN-GAP 98 (impl).
3. ORDER_OPS, TIMES_MORE, PRICE + dane E5.10, E5.11 (tdd).
4. CLOCK_ELAPSED, TIME_UNITS + dane E5.3, E5.8, E6.1, E6.2 + testy przypięte do E6 (tdd).
5. UNIT_CHOICE i MASS tekstowy + dane E5.7, E6.3 (masa), E6.5 (tdd).
6. LENGTH i CAPACITY tekstowe + dane E5.12, E6.3 (długość), E5.5 (tdd).
7. PLACE_VALUE ≥ 1000 + dane E6.9, E6.10 (tdd).
8. Krok powtórkowy MIX (E6.11) (tdd).
9. Seam sweep, dokumentacja, luki projektu, follow-upy (impl, ostatnia impl).
10. E2E #11: nierówność z kilkoma dobrymi kafelkami dotykiem (e2e).
11. E2E #13 #11: runda powtórkowa z zaimportowanego zapisu i sześciocyfrowa odpowiedź na klawiaturze (e2e).

**Reguła kolejności (kontrakt):** żadna umiejętność INEQUALITY nie trafia do danych przed fazą 2, a faza 2 w jednym
commicie zmienia scenę, hak, `answerWrong` i dane — dziecko nigdy nie zobaczy dobrego kafelka pokazanego jako zły. Faza,
która czyni E6.2 grywalnym (4), aktualizuje każdy test przypięty do E6 (lista w Current State Analysis); faza 8 zmienia E6.11
bez zmiany wyroczni startu. Każda faza zostawia pełny zestaw zielony (e2e po fazie uruchamia orkiestrator, `--workers=4`,
protokół request-file — profil § 8).

**Progi odblokowania** (`ceil(0.5 · n)` po grywalnych umiejętnościach; PR body je wymienia):

| Krok | nowe umiejętności | n przed → po | próg przed → po | faza |
|---|---|---|---|---|
| E1.9 | `E1.9.inequality_10` | 2 → 3 | 1 → 2 | 2 |
| E5.10 | `E5.10.price_100`, `E5.10.times_more_100` | 1 → 3 | 1 → 2 | 3 |
| E5.11 | `E5.11.order_ops_100` | 1 → 2 | 1 → 1 | 3 |
| E5.3 | `E5.3.clock_end_lesson` | 2 → 3 | 1 → 2 | 4 |
| E5.8 | `E5.8.clock_span_timetable` | 1 → 2 | 1 → 1 | 4 |
| E6.1 | `E6.1.time_units` | 3 → 4 | 2 → 2 | 4 |
| E6.2 | `E6.2.clock_to_hour`, `E6.2.clock_span_programme` | 0 → 2 | — → 1 | 4 |
| E5.7 | `E5.7.unit_choice`, `E5.7.mass_grams` | 2 → 4 | 1 → 2 | 5 |
| E6.3 | `E6.3.mass_tare_kg` (5), `E6.3.length_two_units` (6) | 1 → 3 | 1 → 2 | 5–6 |
| E6.5 | `E6.5.mass_tonne` | 2 → 3 | 1 → 2 | 5 |
| E5.12 | `E5.12.length_scale` | 2 → 3 | 1 → 2 | 6 |
| E5.5 | `E5.5.capacity_half_l_e5` | 2 → 3 | 1 → 2 | 6 |
| E6.9 | `E6.9.place_value_10000` | 2 → 3 | 1 → 2 | 7 |
| E6.10 | `E6.10.place_value_1000000` | 2 → 3 | 1 → 2 | 7 |
| E6.11 | krok powtórkowy (bez własnych umiejętności) | — | — | 8 |

Dziecko zapisane na tych krokach odblokowuje następny wolniej; nic nie ginie (`endRound` tylko podnosi `unlockedStep`,
`floorToCalendar` bierze max). Identyfikatory umiejętności są propozycją planu; faza może je zmienić tylko razem z tą tabelą.

## Critical Implementation Details

**`check` w zadaniach liczbowych (faza 1; zależą fazy 2, 10).** `validateTask`: gdy `task.check` istnieje — `check(answer)`
prawdziwe, `answer ∈ choices`, co najmniej jeden kafelek nie przechodzi `check` (inaczej nie ma złej odpowiedzi), dla tiles co
najmniej dwa przechodzą (jest „wiele dobrych” — reguła tylko dla zadań `tiles` z `check`, EVEN_ODD `select` jej nie dostaje).
`leaksAnswer(task, line)`: przy `check` przeciek = ostatnia liczba linii przyjmowana przez `check` (nie tylko równa `answer`).
INEQUALITY: kształty `a + □ < c`, `a + □ > c`, `□ + a < c`, `a − □ > c`, wszystkie liczby 0–10, suma ≤ 10 (`□` = `BOX` z
`symbols.ts`); 4 kafelki: 2 dobre + 2 złe, złe przy granicy (wartość równości i jedna za nią); kanoniczna odpowiedź = dobry
kafelek ≥ 1; własny budowniczy kafelków w generatorze (nie `numberChoices`). Podpowiedź (teksty w `pl.tasks.*`):
1 „Najpierw znajdź równość: 5 + □ = 8.” → 2 „5 + 3 = 8, więc w okienku musi być mniej niż 3.” → 3 linia kończąca się
kanoniczną odpowiedzią („Na przykład 5 + 2 = 7, a 7 < 8. Pasuje 2.” — ostatnia liczba = odpowiedź, więc `solutionSteps` nie
dokleja gołego „2”). Pierwsza linia nie może kończyć się liczbą przyjmowaną przez `check`.

**Scena i hak dla `check` (faza 2).** `TaskScene` przy poprawnej odpowiedzi w zadaniu z `check` podświetla wartość
**zgłoszoną** (scena zna ją w `submit`), bez `check` — `task.answer` jak dziś; `markHint` w retype nadal pokazuje
`task.answer` (jeden przykład do przepisania, `check` przyjmie każdy dobry). Migawka zadania w haku: `correctChoices:
(number | string)[] | null` (kafelki przepuszczone przez `check`, `null` bez `check`) i `markedTile: number | string | null`
(kafelek podświetlony jako dobry — czytany z `AnswerTiles` jako wartość, którą widżet faktycznie maluje, np. getter
`markedValue()`, a nie z pola sceny ustawianego obok; inaczej break p10a nie zrobi się czerwony). Wartość zgłoszona żyje w polu
sceny ustawianym w `submit` i czyszczonym przy zmianie zadania, więc ponowny `render` maluje to samo. `answerWrong` dla kafelków
bierze kafelek spoza `correctChoices` (bez `check` — `!== answer`). **`vite/e2eHookGuard.mjs` bez zmian:** `TaskScene.snapshot()`
jest kodem produkcyjnym (pola migawki, np. `hintVisual`, są w `dist/_app/index-*.js`), więc nazwy pól jako znaczniki wywróciłyby
`npm run build` (plan-review F1).

**Krok powtórkowy (faza 8; zależy faza 11).**

```ts
// src/core/types.ts
interface StepDef { …; review?: true }          // review step: no own skills, draws from the stage's other steps
// src/core/curriculum.ts
export const stepPlayable = (step: StepDef): boolean => step.review === true || step.skills.some(playable);
// playableSteps, currentStep, unlockReady → stepPlayable; calendarStart → playable steps WITHOUT review steps
// src/core/round/pick.ts
interface SkillBuckets { current; earlier; previous; currentGroups?: readonly (readonly SkillDef[])[] }
// pickRoundSkills: when the drawn bucket is `current` and `currentGroups` has a non-empty group,
// pick a group uniformly (one per step), then a skill uniformly inside it; otherwise as today.
```

`skillBuckets` dla kroku `review`: `current` = wszystkie grywalne umiejętności niepowtórkowych kroków etapu (płasko, dla progów
i filtrów), `currentGroups` = te same umiejętności pogrupowane po kroku (puste grupy pominięte), `earlier` = `[]`, `previous` jak
dziś (całe E5). `withoutArtBlocked` filtruje też `currentGroups`; gdy `current` wraca do niefiltrowanego (za mało zostało), wraca
też niefiltrowane `currentGroups`. `minCurrent` = 1 dla kroku powtórkowego ustawia `buildAdaptiveRound` (`src/core/curriculum.ts`,
dziś `unlockThreshold(buckets.current.length, …)` — dla ~25 umiejętności E6 dałoby 13), nie `artFilter.ts`. Rozgrzewka
(`firstPlayableSteps`) i `pickSkills` bez zmian (krok bez umiejętności odpada sam). Wagi: 60/30/10 z pustym `earlier` → ~86 % E6,
~14 % E5; łagodzenie 20/50/30 → ~40/60. Brak nowego stanu: `recordRound` zapisuje mastery prawdziwych umiejętności.

**Wyrocznia startu E6 (faza 4, niezmienna w fazie 8).** E6 to etap wiosenny; po fazie 4 grywalne kroki startowe 1–10 (n = 10),
postęp 0.1, 0.3, 0.5, 0.7, 0.9, potem 1 → `[2, 3, 5, 7, 9, 10]` — ten sam wiersz co E2 (n = 10, wiosna) w tej samej tabeli, więc
wynik zaokrąglenia jest już sprawdzony w repo. Lista `playableSteps(E6)`: faza 4 `[1..10]`, faza 8 `[1..11]`.

**Mowa dla czasu i dużych liczb (fazy 4, 7).** `spokenTime(hour, minute)` w `src/core/text/time.ts` („8 15”, pełna godzina „8”);
każde zadanie, którego polecenie zawiera godzinę, ustawia `speak` z `spokenTime` zamiast „8.15”; polecenia z liczbami ≥ 10 000
(grupowane spacją przez `formatNumber`) ustawiają `speak` z liczbą bez spacji grupującej. Test: żadne `speak` nowych typów nie
zawiera wzorca godziny z kropką ani liczby z odstępem grupującym.

**Walidator (fazy 3–7).** `ACCUSATIVE_ONE` dostaje `trwa|trwał|trwała|trwało` (faza 4); unikać miejscownika/narzędnika czasu
(„po 45 minutach”) — zwroty „trwa 45 minut”, „za 15 minut”, „od 7.40 do 8.25”. Po „więcej/mniej” rzeczownik w dopełniaczu
l.mn. (forma `many`) — walidator tego nie widzi, pilnuje odczyt nauczyciela. Każdy nowy rzeczownik w `src/data/nouns.ts`
(formy z research § 6) w fazie, która go używa. `screenBound` per typ: CLOCK_ELAPSED do `UNBOUNDED_TYPES` (jak CLOCK) z
ograniczeniem odpowiedzi w parametrach; TIME_UNITS, MASS/LENGTH/CAPACITY/PLACE_VALUE tekst — `max` w parametrach pokrywa
liczby pokazane (1000 g, 2000 kg, 1 000 000).

## Phase 1: `check` w walidatorze, przecieku i dystraktorach; generator INEQUALITY

Driver: tdd
Driver why: reguły `check` w `validateTask`/`leaksAnswer` i czysty generator INEQUALITY z własnym budowniczym kafelków nie istnieją — failing testy (dwa dobre i dwa złe kafelki, przeciek liczby przyjmowanej przez `check`, kanoniczna ≥ 1) prowadzą implementację.

### Overview

Zadanie z kilkoma dobrymi kafelkami istnieje i jest walidowane; nie ma jeszcze umiejętności w programie.

### Changes Required:

#### 1. Walidator i przeciek

**File**: `src/core/tasks/validate.ts`, `src/core/round/hints.ts`

**Intent**: reguły `check` i przecieku wg Critical Implementation Details; EVEN_ODD (`select`) zostaje zielony.

**Contract**: nowe kody naruszeń w `validateTask` (np. `check-answer`, `check-no-wrong`, `check-one-right`); `leaksAnswer` z
gałęzią `check`.

#### 2. Generator INEQUALITY

**File**: `src/core/tasks/generators/inequality.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts` (`tasks.inequality*`, linie podpowiedzi)

**Intent**: kształty, kafelki i podpowiedź wg Critical Implementation Details; pętla losowania z `MAX_ATTEMPTS` i rzutem z
parametrami; parser odrzuca niewykonalne dane (np. `max` < 4, brak kształtu, w którym mieszczą się 2 dobre i 2 złe).

**Contract**: `generateInequality: Generator`, `parseInequalityParams` `{ max: number; shapes: ('add<' | 'add>' | 'box+<' | 'sub>')[] }`;
zadanie ma `check`, `choices` (4), `input: 'tiles'`, `answer` liczba.

#### 3. Testy

**File**: `tests/inequality.test.ts` (nowy), `tests/validate.test.ts`, `tests/hints.test.ts`, `tests/solvableInMode.test.ts` (ręczny przypadek tiles z `check`)

**Intent**: 1000 losowań (`tests/helpers.ts`): `validateTask` czyste, dokładnie 2 dobre kafelki liczone w teście z
nierówności (wyrocznia niezależna od `check` generatora), odpowiedź ≥ 1, suma ≤ 10, pierwsza linia bez liczby przyjmowanej;
walidator: zadanie z `check` i wszystkimi kafelkami dobrymi / `check(answer)` fałszywe → naruszenie; `leaksAnswer` na
linii kończącej się innym dobrym kafelkiem → przeciek.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; `INEQUALITY` nadal w `LATER` (bez umiejętności); `npm run sample -- E1` … `E6` bez zmian w wyjściu
- Deliberate break: budowniczy daje 3 dobre kafelki / `leaksAnswer` ignoruje `check` / walidator nie wymaga złego kafelka → odpowiednie testy czerwone; przywrócone; meta-check: liczba dobrych kafelków liczona w teście z nierówności, nie przez `task.check`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów INEQUALITY (6 losowań na kształt z testu): polecenie, kafelki przy granicy, podpowiedź bez wyniku w 1. linii, „Pasuje 2.”

---

## Phase 2: INEQUALITY grywalne w E1.9 — scena, hak, `answerWrong`, dane

Driver: impl
Driver why: podświetlenie zgłoszonego kafelka w `TaskScene`, pola haka, helper e2e i dane E1.9 — ryzyko w scenie i w treści, logika z fazy 1; kontrakt wymaga ich w jednym commicie z danymi.

### Overview

Dziecko E1 gra nierówności; każdy dobry kafelek daje gwiazdkę i świeci na zielono.

### Changes Required:

#### 1. Scena i hak

**File**: `src/scenes/TaskScene.ts`, `src/ui/widgets/AnswerTiles.ts` (getter malowanej wartości), `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` (nie `vite/e2eHookGuard.mjs` — plan-review F1)

**Intent**: wg Critical Implementation Details („Scena i hak dla `check`”); `Snapshot` w helperach e2e dostaje `correctChoices`
i `markedTile`; `answerWrong` dla kafelków bierze kafelek spoza `correctChoices`.

**Contract**: `TaskSnapshot.correctChoices`, `TaskSnapshot.markedTile`; `answerRight` bez zmian.

#### 2. Dane i luka projektu

**File**: `src/data/curriculum/E1.ts`, `tests/curriculum.test.ts`, `docs/design-gaps.md`, `src/data/pl.ts` (jeśli `childName` się zmienia)

**Intent**: E1.9 + `E1.9.inequality_10` (`tiles`, `max: 10`, cztery kształty); `INEQUALITY` z `LATER` do `GROUP_1`; wiersz
**98** „kit nie ma widoku zadania z kilkoma dobrymi kafelkami: zielony stuknięty kafelek, rozwiązanie z jednym przykładem” +
komentarz `DESIGN-GAP` przy podświetleniu w `TaskScene`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje `E1.9.inequality_10`
- `npm run sample -- E1 --count 6` bez naruszeń, z zadaniami E1.9 nierówności
- Deliberate break: usunięty `INEQUALITY` z umiejętności E1.9 przy typie w `GROUP_1` → `tests/curriculum.test.ts` czerwony; przywrócone; meta-check: dowodzi pokrycia typu, nie sceny (scenę dowodzi faza 10)
- `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (stare spece z `answerWrong` zielone)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E1.9 `--count 6` (kształty, kafelki przy granicy, „mniej niż”/„więcej niż” w podpowiedzi, mowa „mniejsze niż”)
- [visual] Zrzuty: nierówność pierwsza próba, stuknięty dobry kafelek niekanoniczny (zielony), zły kafelek z podpowiedzią, druga próba, krok 1 i ostatni krok rozwiązania („Pasuje …”), retype — 1440×900 i 1024×768

---

## Phase 3: ORDER_OPS, TIMES_MORE, PRICE + dane E5.10, E5.11

Driver: tdd
Driver why: trzy czyste generatory z parserami nie istnieją — failing testy (lewa-do-prawej ≠ poprawny wynik, iloczyn/iloraz w tabliczce, ilość · cena ≤ 100, odmiana towarów) prowadzą implementację.

### Overview

Kolejność działań i zadania „razy więcej” / „ile zapłacił” w E5.

### Changes Required:

#### 1. Generatory

**File**: `src/core/tasks/generators/{orderOps,timesMore,price}.ts` (nowe), `src/core/tasks/registry.ts`, `src/data/pl.ts`, `src/data/wordTemplates.ts` (towary PRICE z biernikiem), `src/data/nouns.ts` (zeszyt, długopis, bułka i inne użyte towary)

**Intent**: ORDER_OPS — `a + b · c`, `a − b : c`, `a · b + c`, `a : b − c`, wyniki 0–100, iloczyny/ilorazy w tabliczce ≤ 100,
odrzucenie, gdy liczenie od lewej daje ten sam wynik; podpowiedź linie jednego działania („Najpierw mnożenie: 6 · 8.” → „6 · 8 = 48” →
„6 + 48 = 54”). TIMES_MORE — `more` („3 razy więcej”: iloczyn), `less` (iloraz), `factor` („ile razy więcej”), ≤ 100, czynniki ≤ 10,
imię z płcią i kontekst z `wordTemplates.ts`; 1. linia odróżnia „razy” od „o” bez wyniku. PRICE — `total` (ilość · cena), `unit`
(cena jednostkowa), pełne złote ≤ 100; „kupiła 3 zeszyty”, „kupiła 1 bułkę”. Pętle z `MAX_ATTEMPTS`.

**Contract**: `parseOrderOpsParams { forms: (…)[]; max: number }`, `parseTimesMoreParams { variants: ('more'|'less'|'factor')[]; max; maxFactor }`,
`parsePriceParams { variants: ('total'|'unit')[]; max; maxQty }`; odpowiedź liczba, `keypad`.

#### 2. Dane

**File**: `src/data/curriculum/E5.ts`, `tests/curriculum.test.ts`

**Intent**: E5.10 + `E5.10.price_100`, `E5.10.times_more_100`; E5.11 + `E5.11.order_ops_100`; `childName` E5.11 obejmuje kolejność
działań; `ORDER_OPS`, `TIMES_MORE`, `PRICE` z `LATER` do `GROUP_1`.

#### 3. Testy

**File**: `tests/orderOps.test.ts`, `tests/timesMore.test.ts`, `tests/price.test.ts` (nowe)

**Intent**: 1000 losowań na wariant; wynik liczony w teście z liczb polecenia (wyrocznia), ORDER_OPS: od lewej ≠ wynik, każda
linia podpowiedzi to jedno działanie; TIMES_MORE: „więcej” w poleceniu ⇒ odpowiedź > liczba bazowa; PRICE: towar w bierniku
po „kupił(a)” dla 1, formy 2–4/5+ ze słownika.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; `npm run sample -- E5 --count 6` bez naruszeń
- Deliberate break: ORDER_OPS liczy od lewej / TIMES_MORE `less` mnoży / PRICE bez biernika dla 1 → odpowiednie testy czerwone; przywrócone; meta-check: wyrocznia liczy z polecenia, nie z `task.answer`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E5 --count 6`, kroki E5.10, E5.11: odmiana towarów i „razy więcej naklejek” (dopełniacz), rodzaj czasownika wg imienia, podpowiedzi uczące metody, polecenia 1–3 zdania
- [visual] Zrzuty: PRICE pierwsza próba (najdłuższe polecenie z próbki), TIMES_MORE z podpowiedzią, ORDER_OPS krok 1 i ostatni krok rozwiązania — 1440×900 i 1024×768

---

## Phase 4: CLOCK_ELAPSED, TIME_UNITS + dane E5.3, E5.8, E6.1, E6.2 + testy przypięte do E6

Driver: tdd
Driver why: dwa czyste generatory, `spokenTime` i reguła `trwa` w walidatorze nie istnieją — failing testy (godzina końca przez północ, minuty liczone od pełnej godziny, przeliczenia jednostek, `speak` bez „8.15”) prowadzą implementację.

### Overview

Upływ czasu i jednostki czasu w E5–E6; E6.2 staje się grywalny, więc start kalendarza E6 i testy przypięte do E6 zmieniają się w tej fazie.

### Changes Required:

#### 1. Generatory i tekst

**File**: `src/core/tasks/generators/{clockElapsed,timeUnits}.ts` (nowe), `src/core/tasks/registry.ts`, `src/core/text/time.ts` (`spokenTime`), `src/core/tasks/bounds.ts` (`UNBOUNDED_TYPES` + CLOCK_ELAPSED), `src/core/tasks/validate.ts` (`ACCUSATIVE_ONE` + `trwa…`), `src/data/pl.ts`, `src/data/nouns.ts` (sekunda, doba, kwadrans, lekcja, przerwa, film, pociąg, autobus, …)

**Intent**: CLOCK_ELAPSED warianty: `end` (kafelki z `formatTime`: start + czas trwania → koniec; lekcja 45 min, przez północ w
pełnych godzinach; dystraktory ± 5/10/15 min i ± 1 h jak w `clock.ts`), `span` (klawiatura, minuty od–do, dowolna minuta,
≤ `maxSpan`; rozkład jazdy tekstem), `toHour` (klawiatura, minuty do pełnej godziny), `nightHours` (klawiatura, pełne godziny
przez północ). `end` jest tylko `tiles`, pozostałe tylko `keypad` (parser odrzuca mieszanie). Podpowiedź liczy do pełnej
godziny, potem resztę (research § 2). TIME_UNITS: h↔min, min↔s, doba↔h, kwadrans→min, oba kierunki, „Ile minut to 3
kwadranse?” (bez zgody czasownika z liczebnikiem). `speak` wg Critical Implementation Details.

**Contract**: `parseClockElapsedParams { variants: ('end'|'span'|'toHour'|'nightHours')[]; maxSpan: number; lesson?: true }`,
`parseTimeUnitsParams { pairs: (…)[]; max: number }`; `spokenTime(hour, minute): string`.

#### 2. Dane i testy przypięte do E6

**File**: `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts`, `tests/curriculum.test.ts`, `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`

**Intent**: E5.3 + `E5.3.clock_end_lesson` (`end`, tiles); E5.8 + `E5.8.clock_span_timetable` (`span`, `nightHours`); E6.1 +
`E6.1.time_units`; E6.2 + `E6.2.clock_to_hour`, `E6.2.clock_span_programme`, `childName` dla E6.2; `CLOCK_ELAPSED`,
`TIME_UNITS` z `LATER` do `GROUP_1`. Testy: `playableSteps(E6)` → `[1..10]`, wyrocznia E6 → `[2, 3, 5, 7, 9, 10]` z komentarzem
liczonym ręcznie (S-14c); przypadki „E6 step 2 has no playable skill” w `curriculumPick`/`curriculumEnd`/`progress` przepisane na
etap syntetyczny z pustym krokiem po grywalnym (zachowanie „najbliższy niższy grywalny” nadal przetestowane) i na nowe E6.

#### 3. Testy generatorów

**File**: `tests/clockElapsed.test.ts`, `tests/timeUnits.test.ts`, `tests/time.test.ts` (lub istniejący test tekstu czasu), `tests/validate.test.ts`

**Intent**: 1000 losowań na wariant; wynik liczony w teście z godzin polecenia (minuty od północy, modulo doba); `end` ma
dokładnie jeden kafelek równy wynikowi; `speak` bez `\d+\.\d{2}`; „trwa 1 godzina” → naruszenie, „trwa 1 godzinę” czyste.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń; E6.2 w próbce
- Deliberate break: `end` przez północ bez modulo doba / `toHour` liczy od 0 zamiast od 60 / `speak` z „8.15” → odpowiednie testy czerwone; przywrócone; meta-check: wyrocznia czasu liczy z polecenia
- Deliberate break: wyrocznia E6 zostawiona na `[3, 4, 6, 8, 10, 10]` → `tests/curriculumStart.test.ts` czerwony (dowód, że E6.2 zmienia start); przywrócone
- `tests/fixtures/` bez zmian; pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E5.3, E5.8, E6.1, E6.2 `--count 6`: zapis godzin „8.05”, „trwa 45 minut”, rozkład jazdy tekstem zrozumiały, kwadranse/doby odmienione, podpowiedź „do pełnej godziny” bez wyniku w 1. linii
- [visual] Zrzuty: E5.3 kafelki godzin (pierwsza próba), E5.3 podpowiedź, E5.8 rozkład jazdy na klawiaturze, E6.2 „do pełnej godziny”, TIME_UNITS krok rozwiązania — 1440×900 i 1024×768
- [human] Głos tabletu czyta `spokenTime` („8 15”) jako godzinę, nie „osiem kropka piętnaście” (lista kontrolna po runie)

---

## Phase 5: UNIT_CHOICE i MASS tekstowy + dane E5.7, E6.3 (masa), E6.5

Driver: tdd
Driver why: generator UNIT_CHOICE i tekstowy wariant MASS z wyłączeniem w `artBlocked` nie istnieją — failing testy (jedna sensowna jednostka, netto = brutto − tara, przeliczenia t/q/kg/g, wariant tekstowy nieblokowany) prowadzą implementację.

### Overview

Sensowna jednostka na kafelkach i masa bez rysunku wagi.

### Changes Required:

#### 1. UNIT_CHOICE

**File**: `src/core/tasks/generators/unitChoice.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/measures.ts` (przedmioty z zakresem i jednostką), `src/data/pl.ts`, `src/data/nouns.ts` (przedmioty w mianowniku)

**Intent**: „Długopis ma 14 □.” → mm/cm/m/km, „Jabłko waży 150 □.” → g/dag/kg; zakresy przedmiotów dobrane tak, by tylko jedna
jednostka była sensowna; kafelki 3–4 jednostki tej samej wielkości; 1. linia podpowiedzi bez jednostki-odpowiedzi (porównanie
z palcem/pokojem), ostatnia „Długopis ma 14 cm.”.

**Contract**: `parseUnitChoiceParams { quantities: ('length'|'mass')[] }`; odpowiedź string, `tiles`.

#### 2. MASS tekstowy

**File**: `src/core/tasks/generators/mass.ts`, `src/core/round/artFilter.ts`, `src/data/measures.ts` (gram, tona, kwintal), `src/data/nouns.ts` (gram, dekagram, kilogram, tona, kwintal)

**Intent**: członek unii `text` z rodzajami `net|gross|tare` (g w E5.7, kg/dag w E6.3), `kgToG`, `fractionKg` (½, ¼ kg w g),
`tToKg`, `qToKg`; bez `visual`; `parseMassParams` wymaga `weights` tylko dla wariantów z wagą; `artBlocked` zwraca `false` dla
`text` (jak CAPACITY `howMany`).

**Contract**: `MassParams` z nowym członkiem `{ variant: 'text'; kinds: (…)[]; max: number }`. Dziś `MassParams` to płaski obiekt
(`variant: 'read' | 'half' | 'convert'`, `unit`, `weights`, `max`) — faza zamienia go w unię rozróżnianą po `variant`, a `artBlocked`
(`src/core/round/artFilter.ts`) zawęża typ przed odczytem `weights` (plan-review F7).

#### 3. Dane i testy

**File**: `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts`, `tests/curriculum.test.ts`, `tests/unitChoice.test.ts` (nowy), `tests/mass.test.ts`, `tests/artFilter.test.ts`, `tests/perimeterSkills.test.ts`

**Intent**: E5.7 + `E5.7.unit_choice`, `E5.7.mass_grams`; E6.3 + `E6.3.mass_tare_kg`; E6.5 + `E6.5.mass_tonne`; `UNIT_CHOICE` do
`GROUP_1`; `tests/mass.test.ts` wymaga `scale` tylko w wariantach z wagą; `perimeterSkills` przypina E6.3 do nowej listy (bez
zmiany sensu: jedna umiejętność obwodu na klawiaturze); test `artBlocked` dla `text`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń
- Deliberate break: przedmiot z zakresem, w którym dwie jednostki są sensowne / `artBlocked` blokuje `text` / tara > brutto → odpowiednie testy czerwone; przywrócone; meta-check: test `artBlocked` używa prawdziwych parametrów E5.7, nie ręcznych
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E5.7, E6.3, E6.5 `--count 6`: jednostki jednoznaczne, brutto/netto/tara po szkolnemu, „3 kwintale”, „2 tony”, podpowiedzi bez wyniku w 1. linii
- [visual] Zrzuty: UNIT_CHOICE kafelki jednostek (pierwsza próba i podpowiedź), MASS tara na klawiaturze, MASS tona krok rozwiązania — 1440×900 i 1024×768

---

## Phase 6: LENGTH i CAPACITY tekstowe + dane E5.12, E6.3 (długość), E5.5

Driver: tdd
Driver why: tekstowe warianty `scale` i `twoUnit` w `length.ts` oraz `text` w `capacity.ts` nie istnieją — failing testy (skala całkowita w obie strony, „4 cm 7 mm = 47 mm”, ½ i ¼ l w obie strony z różnorodnością ≥ 12) prowadzą implementację.

### Overview

Skala planu, wyrażenia dwumianowe i „ile szklanek” bez rysunków; zamyka follow-up `capacity_half_l_e5`.

### Changes Required:

#### 1. LENGTH tekstowy

**File**: `src/core/tasks/generators/length.ts`, `src/data/pl.ts`, `src/data/nouns.ts` (metr, centymetr, milimetr, kilometr, gdy pisane słownie)

**Intent**: `scale` („Na planie 1 cm to 2 m. Pokój na planie ma 4 cm. Ile metrów ma naprawdę?” i odwrotnie z podzielnością),
`twoUnit` („4 cm 7 mm = □ mm”, „2 m 35 cm = □ cm”, odwrotnie „47 mm = 4 cm □ mm” z jednym okienkiem); bez `visual`.

**Contract**: `LengthParams` + `{ variant: 'scale'; … }` i `{ variant: 'twoUnit'; pairs: ('cm-mm'|'m-cm')[]; max }`.

#### 2. CAPACITY tekstowy

**File**: `src/core/tasks/generators/capacity.ts`, `src/core/round/artFilter.ts`, `src/data/pl.ts`

**Intent**: wariant `text`: „Ile szklanek po ¼ l nalejesz z 3 l?” i „8 szklanek po ½ l to ile litrów?”, ½ i ¼ l, do 5 l;
`artBlocked` zwalnia `text`. Gdy inwarianty różnorodności nie przejdą bez obniżania progów → umiejętność nie wchodzi, follow-up
z `Trigger: S-17` (decyzja autonomiczna 5).

#### 3. Dane i testy

**File**: `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts`, `tests/length.test.ts`, `tests/capacity.test.ts`, `tests/perimeterSkills.test.ts`, `tests/artFilter.test.ts`

**Intent**: E5.12 + `E5.12.length_scale`; E6.3 + `E6.3.length_two_units`; E5.5 + `E5.5.capacity_half_l_e5`; `perimeterSkills`
(E5.12 trzy umiejętności, próg 2; E6.3 lista z fazy 5 + długość).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń; `capacity_half_l_e5` spełnia `MIN_DISTINCT` i top ≤ 15 % bez wpisu w `SMALL_SPACES`
- Deliberate break: skala z resztą / `twoUnit` mm liczone ·100 / `artBlocked` blokuje CAPACITY `text` → odpowiednie testy czerwone; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E5.5, E5.12, E6.3 `--count 6`: skala po szkolnemu, zapis „4 cm 7 mm”, ułamki „½ l” czytelne, „szklanek” odmienione
- [visual] Zrzuty: LENGTH skala (pierwsza próba), `twoUnit` z okienkiem w środku polecenia, CAPACITY tekst krok rozwiązania — 1440×900 i 1024×768

---

## Phase 7: PLACE_VALUE ≥ 1000 + dane E6.9, E6.10

Driver: tdd
Driver why: tekstowe warianty PLACE_VALUE powyżej 999 i reguła 999 per wariant w `parsePlaceValueParams` nie istnieją — failing testy (rozkład 4382, „ile tysięcy to 250 000”, odpowiedź ≤ 7 cyfr, `speak` bez spacji grupującej) prowadzą implementację.

### Overview

Tysiące i rzędy do miliona tekstem na klawiaturze.

### Changes Required:

#### 1. Generator

**File**: `src/core/tasks/generators/placeValue.ts`, `src/data/pl.ts`, `src/data/nouns.ts` (tysiąc/tysiące/tysięcy)

**Intent**: `thousands` (E6.9, do 10 000: cyfra rzędu, okienko w rozkładzie „4382 = 4000 + □ + 80 + 2”, budowa z „3 tysiące, 5
setek, 2 dziesiątki i 7 jedności”), `orders` (E6.10, do 1 000 000: „Ile tysięcy to 250 000?”, „Ile setek tysięcy ma 700 000?”,
złożenie „3 setki tysięcy i 40 tysięcy” → 340 000); liczby przez `formatNumber`; `speak` bez spacji grupującej; reguła 999 tylko
dla wariantów z klockami.

**Contract**: `PlaceValueParams` + `{ variant: 'thousands'; max: number }` i `{ variant: 'orders'; max: number }`; odpowiedź ≤ `balance.keypad.maxDigits` cyfr.

#### 2. Dane i testy

**File**: `src/data/curriculum/E6.ts`, `tests/placeValue.test.ts`

**Intent**: E6.9 + `E6.9.place_value_10000`; E6.10 + `E6.10.place_value_1000000` (wariant złożenia daje odpowiedzi ≥ 100 000 —
potrzebne fazie 11; test przypina, że co najmniej 50 % losowań `E6.10.place_value_1000000` ma odpowiedź ≥ 100 000, żeby spec fazy 11
nie był losowo czerwony — plan-review F4); 1000 losowań, wynik liczony w teście z liczb polecenia.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E6 --count 6` bez naruszeń; `PLACE_VALUE` w E6.9/E6.10 pokryte
- Deliberate break: `max: 1000000` na wariancie `read` (klocki) → parser czerwony / `speak` z „250 000” → test czerwony / odpowiedź 8-cyfrowa → test czerwony; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E6.9, E6.10 `--count 6`: „3 tysiące, 5 setek”, zapis z odstępem od 10 000, podpowiedź rzędami bez wyniku w 1. linii
- [visual] Zrzuty: E6.9 okienko w rozkładzie, E6.10 polecenie z 250 000 i sześciocyfrowa odpowiedź wpisana na klawiaturze, krok rozwiązania — 1440×900 i 1024×768

---

## Phase 8: Krok powtórkowy MIX (E6.11)

Driver: tdd
Driver why: `StepDef.review`, `stepPlayable`, przepis kubłów powtórki z `currentGroups`, losowanie krok-potem-umiejętność i wyłączenie z `calendarStart` to czysta logika `core` — failing testy (E6.11 grywalny, nie jest startem ani rozgrzewką, runda z wielu kroków, wyrocznia E6 bez zmian) prowadzą implementację.

### Overview

E6.11 odblokowuje się po E6.10 i gra rundy z całego etapu.

### Changes Required:

#### 1. Model i program

**File**: `src/core/types.ts`, `src/core/curriculum.ts`, `src/core/round/pick.ts`, `src/core/round/artFilter.ts`, `src/core/progress.ts` (jeśli liczy kroki własnym filtrem)

**Intent**: wg Critical Implementation Details („Krok powtórkowy”). Każda ścieżka ustawiająca `unlockedStep` bez odblokowania
(`calendarStart`, `floorToCalendar`, `changeStageByParent` w `src/core/placement.ts`, spadek po rozgrzewce) nigdy nie ląduje na
kroku powtórkowym.

**Contract**: `StepDef.review?: true`, `stepPlayable(step)`, `SkillBuckets.currentGroups?`.

#### 2. Dane

**File**: `src/data/curriculum/E6.ts`, `tests/curriculum.test.ts`

**Intent**: E6.11 `review: true`, `childName` (np. „Powtórka roku”); `MIX` zostaje w `LATER` jako typ (krok pokrywa go flagą),
test programu: krok z `MIX` w `types` ma `review: true` i odwrotnie; `LOGIC` w `LATER`.

#### 3. Testy

**File**: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`, `tests/warmup.test.ts`, `tests/pick.test.ts`, `tests/review.test.ts` (nowy), `tests/variants.test.ts` (jeśli istnieje — harmonogram)

**Intent**: `playableSteps(E6)` = `[1..11]`; wyrocznia E6 bez zmian (`[2, 3, 5, 7, 9, 10]`); `firstPlayableSteps(E6, 2)` = E6.1, E6.2;
`unlockReady` z E6.10 daje 11, z E6.11 `null`; `skillBuckets(E6, E5, 11)`: `current` = umiejętności E6.1–E6.10, `earlier` pusty,
`currentGroups` 10 grup; po wielu ziarnach rundy powtórki: udział każdego kroku E6 w `current` bliski 1/10 (krok-pierwszy, nie
umiejętność-pierwsza), żadna umiejętność spoza E6/E5; `withoutArtBlocked` dla powtórki z `minCurrent` 1; `nextRoundKind`/`afterRound`
(`src/core/variants.ts`) dają ten sam harmonogram dla ucznia na E6.11 co na E6.10.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E6` bez naruszeń; `tests/fixtures/` bez zmian (zapis v2)
- Deliberate break: `calendarStart` bez wyłączenia kroku powtórkowego → wyrocznia E6 czerwona (lipiec 10 → 11 i komórki wiosny); przywrócone; meta-check: dowodzi wyłączenia, nie liczby kroków
- Deliberate break: `pickRoundSkills` ignoruje `currentGroups` → test udziału kroków czerwony; przywrócone
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Krok powtórkowy bez stanu w zapisie; `kind: 'round'`; brak nowego `RoundKind`; S-15 bez zmian
- [visual] Zrzuty: karta „Nowa umiejętność!” z nazwą E6.11 i zadanie rundy powtórkowej (stan osiągnięty importem zapisu z `unlockedStep.E6 = 10` i mastery 4 dla umiejętności E6.10 — jedna runda odblokowuje E6.11 — albo importem na 11) — 1440×900 i 1024×768

---

## Phase 9: Seam sweep, dokumentacja, luki projektu, follow-upy

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Porządek przed e2e.

### Changes Required:

#### 1. Seam sweep

**File**: cała zmiana

**Intent**: zduplikowane helpery (liczenie minut od północy w `clockElapsed.ts` vs `clock.ts`, budowniczowie kafelków
INEQUALITY/UNIT_CHOICE vs `distractors.ts`, odmiana towarów vs `wordTemplates.ts`, `formatNumber` vs ręczne grupowanie),
nieaktualne komentarze (`playableSteps` „at least one playable skill”, `skillBuckets` trzy kubły, `artBlocked` lista wyjątków,
`parsePlaceValueParams` „blocks show at most 999”, nagłówek `GROUP_1`/`LATER`), komentarze `DESIGN-GAP` ↔ wiersze 98+.

#### 2. Dokumenty i follow-upy

**File**: `CLAUDE.md` („Current state”: zdanie o S-14c — siedem typów, warianty tekstowe, `check` w kafelkach, `StepDef.review`/
`stepPlayable`, `spokenTime`; usunięcie „Not yet present … ” dla typów, które już są), `docs/design-gaps.md`,
`context/changes/text-measure-time-types/follow-ups/review-fixes.md`

**Intent**: follow-upy z `Trigger:` — „ustaw zegar” E5–E6 → `a CLOCK step in E5–E6 or a tablet test`; banknoty 200/500 →
`a money skill above 100 zł`; WRITTEN „brakujące cyfry” i F9 → `the next change to WRITTEN`; ARROW_TABLE wieloliczbowy →
`a multi-number reducer`; LOGIC w E6.11 → `S-15 F1 (puzzle pool for E5–E6)`; rozkład jazdy jako tabelka → `a teacher read or
tablet test finding the text timetable unreadable`; tytuł powtórki w HUD → `a kit view for the review round`; porównania mas
„cięższe/lżejsze” zostają przy rysowanej wadze (część follow-upu S-14 „warianty tekstowe MASS”) → `a teacher read asking for text
mass comparisons`; przykład błędu INEQUALITY w podglądzie rodzica pokazuje jedną kanoniczną odpowiedź → `a v3 save or a parent
asking about it`; (warunkowo) `capacity_half_l_e5` → `S-17`.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- Komentarze `DESIGN-GAP` w `src/` ↔ wiersze 98+ w `docs/design-gaps.md`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Każdy follow-up ma `Trigger:`; brak nieaktualnych komentarzy o kroku bez umiejętności i o 999; brak duplikatu liczenia czasu
- [human] Decyzje wbrew dosłownemu ZADANIA/PRD: INEQUALITY na kafelkach (ZADANIA „wpisz liczbę”), rozwiązanie z jednym przykładem; MIX losuje krok, potem umiejętność (ZADANIA milczy) i ~14 % z E5; E6.11 nie jest startem kalendarza ani rozgrzewką; LOGIC w E6.11 pominięty; rozkład jazdy tekstem; PRICE w pełnych złotych; bez „ustaw zegar” w E5–E6; wyższe progi odblokowania na żywych zapisach (E1.9, E5.3, E5.5, E5.7, E5.10, E5.12, E6.3, E6.5, E6.9, E6.10 — tabela progów; wolniej, nic nie ginie) i start E6 jesienią/wiosną przesunięty o E6.2

---

## Phase 10: Nierówność z kilkoma dobrymi kafelkami dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku): dobry kafelek niekanoniczny daje gwiazdkę i świeci, zły daje podpowiedź — istnieje tylko w renderowanej scenie; zbudowane w fazie 2, `E2E=on`.

### Overview

Nowy `tests/e2e/inequality.spec.ts` (projekt `chromium-hook`), umiejętność przez `?e2eSkills=E1.9.inequality_10` i `e2eVariant=off`; cel < 60 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`inequality` w `ROUND_SPEC`), `tests/e2e/inequality.spec.ts` (nowy)

**Intent**: (a) „#11 an inequality takes a right tile that is not the model answer and marks the tapped tile”: E1 ścieżką
rodzica (pary wiek/etap z `tests/e2e/art-tasks.spec.ts`), kafelek z `correctChoices` różny od `answer` → gwiazdka,
`markedTile` = stuknięta wartość. (b) „#11 a wrong inequality tile gives a hint and a second try that still pays”:
`answerWrong` → pasek podpowiedzi, `answerRight` → gwiazdka.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na migawce. Chromium niedostępny →
protokół request-file (`e2e-request-p10.md`, patche `e2e-break-p10a…b.patch`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/inequality.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`
- Deliberate break (patch `e2e-break-p10a.patch`): scena podświetla `task.answer` zamiast zgłoszonej wartości → (a) czerwony; meta-check: dowodzi sceny, nie `isCorrect`
- Deliberate break (patch `e2e-break-p10b.patch`): `isCorrect` ignoruje `check` (porównanie `===`) → (a) czerwony (brak gwiazdki za niekanoniczny); każdy oczekiwany czerwony uruchomiony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 11: Runda powtórkowa z zaimportowanego zapisu i sześciocyfrowa odpowiedź — e2e (#13, #11)

Driver: e2e
Driver why: ryzyko #13 (runda losuje tylko z odblokowanych kroków) dla kroku powtórkowego osiągniętego ścieżką produktu (import zapisu) i #11 dla odpowiedzi ≥ 100 000 na klawiaturze — widoczne tylko w renderowanej grze; zbudowane w fazach 7–8, `E2E=on`.

### Overview

Nowy `tests/e2e/review-round.spec.ts` (projekt `chromium-hook`); cel < 90 s.

### Changes Required:

#### 1. Konfiguracja, wsparcie i spec

**File**: `playwright.config.ts` (`review-round` w `ROUND_SPEC`), `tests/e2e/review-round.spec.ts` (nowy), `tests/e2e/support/*` (wspólny helper importu wyciągnięty z `tests/e2e/save-transfer.spec.ts`, jeśli jest tam lokalny)

**Intent**: (a) „#13 the year review step unlocks after E6.10 and its round draws from several E6 steps”: zapis v2 (stała w specu,
jak w `save-transfer.spec.ts`) z etapem E6, `unlockedStep.E6 = 10`, `warmupPending: false` i mastery 4 dla wszystkich umiejętności
E6.10, import przez panel rodzica („Wczytaj z pliku”, napisy z `pl.ts`), `?e2eMonth` przypięty, `e2eVariant=off`; jedna runda
`answerRight` → „Kolejna runda” → karta odblokowania (`screen: 'unlock'`, nazwa E6.11 z danych) → „Dalej”; runda powtórki 5 zadań
`answerRight`; `learner.unlockedStep.E6 = 11`; `learner.history` zadań tej rundy: każde z E6.1–E6.10 albo E5, co najmniej 2 różne
kroki E6 (gdy runda ma < 2 kroki E6 — kolejna runda, najwyżej 3, asercja po wszystkich). Dlaczego karta: bez fazy 8 zapis z
`unlockedStep.E6 = 11` gra E6.10 jako bieżący, a `earlier` i tak losuje wiele kroków E6 — sama historia nie odróżnia kroku
powtórkowego od jego braku (plan-review F2). (b) „#11 a six-digit place-value answer is typed on the keypad”: E6,
`?e2eSkills=E6.10.place_value_1000000`, rundy aż do zadania z odpowiedzią ≥ 100 000 (najwyżej 3 rundy; udział ≥ 50 % przypina faza
7), `answerRight` → gwiazdka.

**Contract**: jak faza 10; request-file `e2e-request-p11.md`, patche `e2e-break-p11a…b.patch`; nigdy nie pisać IndexedDB z testu.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/review-round.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`; czas pełnego zestawu zapisany
- Deliberate break (patch `e2e-break-p11a.patch`): `stepPlayable` bez klauzuli `review` (E6.11 niegrywalny, `unlockReady` z E6.10 daje `null`) → (a) czerwony (brak karty odblokowania); meta-check: dowodzi odblokowania i grywalności kroku powtórkowego, nie samego losowania
- Deliberate break (patch `e2e-break-p11b.patch`): `balance.keypad.maxDigits` 5 → (b) czerwony; każdy oczekiwany czerwony osobno (`-g`); przywrócone; meta-check: dowodzi limitu klawiatury, nie generatora
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `check`: walidator (dobra odpowiedź, zły kafelek istnieje, ≥ 2 dobre w kafelkach), przeciek liczby przyjmowanej przez `check`.
- Każdy nowy generator i wariant: 1000 losowań, wynik liczony w teście z liczb polecenia (wyrocznia), odmiana, `speak`.
- Krok powtórkowy: grywalność, wyłączenie ze startu i rozgrzewki, kubły i udział kroków, harmonogram S-15 bez zmian.

### Integration Tests:

- `tests/solvableInMode.test.ts`, `tests/contentInvariants.test.ts` i `tests/curriculum.test.ts` obejmują nowe umiejętności automatycznie.
- E2E: `inequality.spec.ts` (#11), `review-round.spec.ts` (#13, #11).

### Manual Testing Steps:

1. Odczyt nauczyciela `npm run sample -- E1|E5|E6 --count 6` w fazach 1–7.
2. Zrzuty stanów (fazy 2–8) w 1440×900 i 1024×768.
3. Na tablecie: głos czyta godziny i duże liczby (faza 4 `[human]`), stukanie kafelków godzin i jednostek.

## Performance Considerations

Brak: ~15 nowych umiejętności × 1000 losowań w inwariantach (unit + kilka sekund); losowanie powtórki to jedno dodatkowe `rng.pick`.

## Migration Notes

Format zapisu **v2** bez zmian: nowe umiejętności to nowe klucze w otwartej mapie `mastery` (`validLearner`), `review` żyje tylko w
danych, `unlockedStep` liczba. Zapisany uczeń z `E6: 2` gra od teraz E6.2 jako bieżący krok (zamiast E6.1); progi rosną wg tabeli,
bez cofania `unlockedStep`. Fixture'y `tests/fixtures/save-v1*.json`, `save-v2*.json` bajtowo bez zmian.

## Known risks

- **Kafelki E1 z dwoma dobrymi** mogą mylić 6-latka — zmieniłoby: odczyt nauczyciela/playtest → opcja B (jeden dobry kafelek, `check` jako straż).
- **Długie polecenia tekstowe** (rozkład jazdy, PRICE, budowa liczby słowami) przy 1024 px — zmieniłoby: zrzut z zawinięciem poza obszar → skrócenie szablonu w `pl.ts`, nie nowy układ.
- **Głos tabletu** dla „8 15” i dużych liczb — `[human]` faza 4; zmieniłoby: zła wymowa → `speak` słowami.
- **E6.2 w rozgrzewce E6** (pierwsze dwa grywalne kroki to teraz E6.1, E6.2) — świadomie przyjęte.
- **Chromium w sesji agenta**: e2e uruchamia orkiestrator; fazy 10–11 protokół request-file.
- **Rozmiar fazy 4** (CLOCK_ELAPSED z czterema wariantami, TIME_UNITS, `spokenTime`, reguła `trwa`, ~8 rzeczowników, dane czterech
  kroków i pięć przepisanych testów E6) — największa faza treści (plan-review F6). Zmieniłoby: agent fazy zbliża się do limitu
  kontekstu → zatrzymuje się po CLOCK_ELAPSED + E5.3/E5.8/E6.2 + testach E6 (commit `… (p4a)`), TIME_UNITS + E6.1 idzie osobnym
  commitem `… (p4b)` w tej samej fazie; wiersze Progress 4.x odhaczane po drugim commicie.
- **Losowość e2e fazy 11** — asercje „≥ 2 kroki E6” i „odpowiedź ≥ 100 000” są probabilistyczne; łagodzone limitem 3 rund i udziałem
  ≥ 50 % przypiętym w fazie 7 (plan-review F4). Zmieniłoby: flake w bramce → szew e2e z markerem albo deterministyczne ziarno.

## References

- Research: `context/changes/text-measure-time-types/research.md`; change: `context/changes/text-measure-time-types/change.md`
- Kontrakt runu: `context/runs/2026-10-15-fix-s14c-s14d/agent-contract.md` (§ S-14c); profil `context/foundation/autonomous-run.md` § 6, § 8, § 9
- Katalog: `docs/ZADANIA.md` § 2 (zakresy E1, E5, E6), § 3 (E1.9, E5.3, E5.5, E5.7, E5.8, E5.10–E5.12, E6.1–E6.3, E6.5, E6.9–E6.11), § 4 (INEQUALITY, TIMES_MORE, ORDER_OPS, PRICE, CLOCK_ELAPSED, TIME_UNITS, UNIT_CHOICE, MASS, LENGTH, PLACE_VALUE); PRD FR-023
- Test-plan: `context/foundation/test-plan.md` ryzyka #1, #5, #11, #13, #17; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-14-number-line-written-arrows/plan.md` (progi, follow-upy, request-file), `context/archive/2026-10-14-art-tasks-all-stages/` (warianty z `measures.ts`, `artBlocked`), `src/core/tasks/generators/length.ts` (`convert`), `src/core/tasks/generators/evenOdd.ts` (`check`)

## Autonomous decisions

1. **INEQUALITY: kilka dobrych kafelków (opcja A), 2 dobre + 2 złe, rozwiązanie z jednym przykładem.** Odrzucone: jeden dobry
   kafelek (B). Dlaczego: ZADANIA § 4 „wiele poprawnych odpowiedzi”; `isCorrect` już to obsługuje; cztery otoczki w fazach 1–2.
   Wbrew dosłownemu „wpisz liczbę” (E1 gra kafelkami) → `[human]` 9.6. Zmieniłoby: odczyt nauczyciela/playtest uznający dwa dobre
   kafelki za mylące.
2. **MIX = `StepDef.review` + `stepPlayable` + `currentGroups`, losowanie krok-potem-umiejętność, zwykła `kind: 'round'`.**
   Odrzucone: generator MIX (łamie `(skill, rng) => Task`, mastery pod jednym id), osobny `RoundKind` (rusza `variants.ts` i v2),
   losowanie jednostajne po umiejętnościach (kroki z wieloma umiejętnościami dominują). Dlaczego: research § 4, zero stanu w
   zapisie. ZADANIA milczy o wagach → `[human]` 9.6. Zmieniłoby: autor chcący wag po umiejętnościach albo „zdanego testu” (v3 → stop na PR).
3. **Krok powtórkowy nie jest startem kalendarza ani rozgrzewką; `previous` (E5) zostaje w rundzie powtórki.** Odrzucone: wakacyjny
   start na E6.11 (podnosiłby zapisanych uczniów przez `floorToCalendar`). Dlaczego: ZADANIA „finałowe wyzwanie”. Zmieniłoby: autor
   chcący powtórki jako domyślnego startu po roku.
4. **Generator i dane w jednej fazie tdd (≤ 3 generatory/warianty), poza INEQUALITY rozdzielonym na core (1) i scenę+dane (2).**
   Odrzucone: wzorzec S-14b (generatory bez danych, dane później). Dlaczego: odczyt nauczyciela czyta prawdziwe `sample` w tej samej
   fazie; INEQUALITY wymaga sceny w tym samym commicie co dane (polecenie kroku). Zmieniłoby: faza przekraczająca kontekst agenta → podział.
5. **`capacity_half_l_e5` w zakresie jako tekst (½ i ¼ l w obie strony).** Odrzucone: przeniesienie triggera od razu. Dlaczego:
   research ≥ 20 różnych zadań. Zmieniłoby: inwarianty różnorodności czerwone bez obniżania progów → umiejętność wypada, follow-up `Trigger: S-17`.
6. **Brak nowych widżetów; rozkład jazdy tekstem; PRICE w pełnych złotych; bez „ustaw zegar” E5–E6; LOGIC poza zakresem; F9 poza.**
   Dlaczego: roadmapa „tekstowy, bez widżetów”, change.md decyzje 2, 5, 6. → `[human]` 9.6 i follow-upy w fazie 9. Zmieniłoby: krok
   E5–E6 z CLOCK w `types:`, kwoty > 100 zł w ZADANIA.
7. **`speak` przez `spokenTime` („8 15”) i liczby bez spacji grupującej, nie rozszerzenie `numberWords` ponad 1000.** Odrzucone:
   słowne liczby do miliona w narratorze (duża zmiana `spoken.ts`). Zmieniłoby: `[human]` 4.x — głos tabletu źle czyta → `speak` słowami.
8. **E2E: dwa spece (INEQUALITY, powtórka + 6 cyfr); powtórka osiągana importem zapisu, nie nowym szwem e2e.** Odrzucone:
   `?e2eUnlock` (nowy znacznik produkcyjnego ryzyka), granie do odblokowania (dziesiątki rund). Dlaczego: import to ścieżka produktu,
   precedens `save-transfer.spec.ts`. Zmieniłoby: import zbyt wolny/kruchy w specu → szew e2e z markerem w `vite/e2eHookGuard.mjs`.
9. **Brak `AskUserQuestion` (kontrakt reguła 1):** złożoność HIGH, wszystkie pytania rozstrzygnięte z research/change.md; roadmapa
   S-14c → `planning` w commicie planu; zapis zostaje v2 — żadna faza nie potrzebuje v3.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `check` w walidatorze, przecieku i dystraktorach; generator INEQUALITY

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — 9507da3
- [x] 1.2 Klucze `generators`/`parsers` równe; `INEQUALITY` nadal w `LATER` (bez umiejętności); `npm run sample -- E1` … `E6` bez zmian w wyjściu — 9507da3
- [x] 1.3 Deliberate break: budowniczy daje 3 dobre kafelki / `leaksAnswer` ignoruje `check` / walidator nie wymaga złego kafelka → czerwone; przywrócone; meta-check — 9507da3
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 9507da3

#### Manual

- [ ] 1.5 [reviewer] Odczyt nauczyciela szablonów INEQUALITY (6 losowań na kształt z testu): polecenie, kafelki przy granicy, podpowiedź bez wyniku w 1. linii, „Pasuje 2.”

### Phase 2: INEQUALITY grywalne w E1.9 — scena, hak, `answerWrong`, dane

#### Automated

- [x] 2.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje `E1.9.inequality_10`
- [x] 2.2 `npm run sample -- E1 --count 6` bez naruszeń, z zadaniami E1.9 nierówności
- [x] 2.3 Deliberate break: usunięty `INEQUALITY` z umiejętności E1.9 przy typie w `GROUP_1` → `tests/curriculum.test.ts` czerwony; przywrócone; meta-check
- [x] 2.4 `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- [x] 2.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (stare spece z `answerWrong` zielone)

#### Manual

- [ ] 2.6 [reviewer] Odczyt nauczyciela `sample` E1.9 `--count 6` (kształty, kafelki przy granicy, „mniej niż”/„więcej niż” w podpowiedzi, mowa „mniejsze niż”)
- [ ] 2.7 [visual] Zrzuty: nierówność pierwsza próba, stuknięty dobry kafelek niekanoniczny (zielony), zły kafelek z podpowiedzią, druga próba, krok 1 i ostatni krok rozwiązania („Pasuje …”), retype — 1440×900 i 1024×768

### Phase 3: ORDER_OPS, TIMES_MORE, PRICE + dane E5.10, E5.11

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Klucze `generators`/`parsers` równe; `npm run sample -- E5 --count 6` bez naruszeń
- [ ] 3.3 Deliberate break: ORDER_OPS liczy od lewej / TIMES_MORE `less` mnoży / PRICE bez biernika dla 1 → czerwone; przywrócone; meta-check
- [ ] 3.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.5 [reviewer] Odczyt nauczyciela `npm run sample -- E5 --count 6`, kroki E5.10, E5.11: odmiana towarów i „razy więcej naklejek” (dopełniacz), rodzaj czasownika wg imienia, podpowiedzi uczące metody, polecenia 1–3 zdania
- [ ] 3.6 [visual] Zrzuty: PRICE pierwsza próba (najdłuższe polecenie z próbki), TIMES_MORE z podpowiedzią, ORDER_OPS krok 1 i ostatni krok rozwiązania — 1440×900 i 1024×768

### Phase 4: CLOCK_ELAPSED, TIME_UNITS + dane E5.3, E5.8, E6.1, E6.2 + testy przypięte do E6

#### Automated

- [ ] 4.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 4.2 `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń; E6.2 w próbce
- [ ] 4.3 Deliberate break: `end` przez północ bez modulo doba / `toHour` liczy od 0 / `speak` z „8.15” → czerwone; przywrócone; meta-check
- [ ] 4.4 Deliberate break: wyrocznia E6 zostawiona na `[3, 4, 6, 8, 10, 10]` → `tests/curriculumStart.test.ts` czerwony; przywrócone
- [ ] 4.5 `tests/fixtures/` bez zmian; pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 4.6 [reviewer] Odczyt nauczyciela `sample` E5.3, E5.8, E6.1, E6.2 `--count 6`: zapis godzin, „trwa 45 minut”, rozkład jazdy tekstem, kwadranse/doby odmienione, podpowiedź „do pełnej godziny” bez wyniku w 1. linii
- [ ] 4.7 [visual] Zrzuty: E5.3 kafelki godzin (pierwsza próba), E5.3 podpowiedź, E5.8 rozkład jazdy na klawiaturze, E6.2 „do pełnej godziny”, TIME_UNITS krok rozwiązania — 1440×900 i 1024×768
- [ ] 4.8 [human] Głos tabletu czyta `spokenTime` („8 15”) jako godzinę, nie „osiem kropka piętnaście”

### Phase 5: UNIT_CHOICE i MASS tekstowy + dane E5.7, E6.3 (masa), E6.5

#### Automated

- [ ] 5.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 5.2 `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń
- [ ] 5.3 Deliberate break: przedmiot z dwiema sensownymi jednostkami / `artBlocked` blokuje `text` / tara > brutto → czerwone; przywrócone; meta-check
- [ ] 5.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.5 [reviewer] Odczyt nauczyciela `sample` E5.7, E6.3, E6.5 `--count 6`: jednostki jednoznaczne, brutto/netto/tara po szkolnemu, „3 kwintale”, „2 tony”, podpowiedzi bez wyniku w 1. linii
- [ ] 5.6 [visual] Zrzuty: UNIT_CHOICE kafelki jednostek (pierwsza próba i podpowiedź), MASS tara na klawiaturze, MASS tona krok rozwiązania — 1440×900 i 1024×768

### Phase 6: LENGTH i CAPACITY tekstowe + dane E5.12, E6.3 (długość), E5.5

#### Automated

- [ ] 6.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 6.2 `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń; `capacity_half_l_e5` spełnia `MIN_DISTINCT` i top ≤ 15 % bez wpisu w `SMALL_SPACES`
- [ ] 6.3 Deliberate break: skala z resztą / `twoUnit` mm liczone ·100 / `artBlocked` blokuje CAPACITY `text` → czerwone; przywrócone; meta-check
- [ ] 6.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 6.5 [reviewer] Odczyt nauczyciela `sample` E5.5, E5.12, E6.3 `--count 6`: skala po szkolnemu, zapis „4 cm 7 mm”, ułamki „½ l” czytelne, „szklanek” odmienione
- [ ] 6.6 [visual] Zrzuty: LENGTH skala (pierwsza próba), `twoUnit` z okienkiem w środku polecenia, CAPACITY tekst krok rozwiązania — 1440×900 i 1024×768

### Phase 7: PLACE_VALUE ≥ 1000 + dane E6.9, E6.10

#### Automated

- [ ] 7.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 7.2 `npm run sample -- E6 --count 6` bez naruszeń; `PLACE_VALUE` w E6.9/E6.10 pokryte
- [ ] 7.3 Deliberate break: `max: 1000000` na wariancie z klockami → parser czerwony / `speak` z „250 000” → czerwony / odpowiedź 8-cyfrowa → czerwony; przywrócone; meta-check
- [ ] 7.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 7.5 [reviewer] Odczyt nauczyciela `sample` E6.9, E6.10 `--count 6`: „3 tysiące, 5 setek”, zapis z odstępem od 10 000, podpowiedź rzędami bez wyniku w 1. linii
- [ ] 7.6 [visual] Zrzuty: E6.9 okienko w rozkładzie, E6.10 polecenie z 250 000 i sześciocyfrowa odpowiedź wpisana na klawiaturze, krok rozwiązania — 1440×900 i 1024×768

### Phase 8: Krok powtórkowy MIX (E6.11)

#### Automated

- [ ] 8.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 8.2 `npm run sample -- E6` bez naruszeń; `tests/fixtures/` bez zmian (zapis v2)
- [ ] 8.3 Deliberate break: `calendarStart` bez wyłączenia kroku powtórkowego → wyrocznia E6 czerwona; przywrócone; meta-check
- [ ] 8.4 Deliberate break: `pickRoundSkills` ignoruje `currentGroups` → test udziału kroków czerwony; przywrócone
- [ ] 8.5 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 8.6 [reviewer] Krok powtórkowy bez stanu w zapisie; `kind: 'round'`; brak nowego `RoundKind`; S-15 bez zmian
- [ ] 8.7 [visual] Zrzuty: karta „Nowa umiejętność!” z nazwą E6.11 i zadanie rundy powtórkowej — 1440×900 i 1024×768

### Phase 9: Seam sweep, dokumentacja, luki projektu, follow-upy

#### Automated

- [ ] 9.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 9.2 Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- [ ] 9.3 Komentarze `DESIGN-GAP` w `src/` ↔ wiersze 98+ w `docs/design-gaps.md`
- [ ] 9.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 9.5 [reviewer] Każdy follow-up ma `Trigger:`; brak nieaktualnych komentarzy o kroku bez umiejętności i o 999; brak duplikatu liczenia czasu
- [ ] 9.6 [human] Decyzje wbrew dosłownemu ZADANIA/PRD: INEQUALITY na kafelkach z jednym przykładem w rozwiązaniu; MIX krok-potem-umiejętność i ~14 % z E5; E6.11 poza startem i rozgrzewką; bez LOGIC; rozkład jazdy tekstem; PRICE w pełnych złotych; bez „ustaw zegar” E5–E6; wyższe progi odblokowania na żywych zapisach (tabela progów) i start E6 przesunięty o E6.2

### Phase 10: Nierówność z kilkoma dobrymi kafelkami dotykiem — e2e (#11)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/inequality.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`
- [ ] 10.2 Deliberate break (patch `e2e-break-p10a.patch`): scena podświetla `task.answer` zamiast zgłoszonej wartości → (a) czerwony; meta-check
- [ ] 10.3 Deliberate break (patch `e2e-break-p10b.patch`): `isCorrect` ignoruje `check` → (a) czerwony; każdy czerwony osobno (`-g`); przywrócone
- [ ] 10.4 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 11: Runda powtórkowa z zaimportowanego zapisu i sześciocyfrowa odpowiedź — e2e (#13, #11)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/review-round.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`; czas pełnego zestawu zapisany
- [ ] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): `stepPlayable` bez klauzuli `review` → (a) czerwony (brak karty odblokowania)
- [ ] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): `balance.keypad.maxDigits` 5 → (b) czerwony; każdy czerwony osobno (`-g`); przywrócone; meta-check
- [ ] 11.4 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
