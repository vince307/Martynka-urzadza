# Zadania na siatce (kwadrat magiczny, kodowanie pól, obwody) i „ustaw zegar” przeciąganiem wskazówek — Implementation Plan

## Overview

Slice roadmapy **S-13b** (`drawn-grid-tasks-e3-e4`, etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`, gałąź
`feat/drawn-grid-tasks-e3-e4` z `main` @ `9554e96`. Dziecko dostaje w rundzie nowe zadania rysowane w kodzie:

- **PUZZLE_GRID** — kwadrat magiczny 3 × 3 i piramida liczb z jednym pustym polem (E3.5), klawiatura;
- **GRID** — kratka z literami kolumn i numerami wierszy, przedmioty na polach: „Na którym polu leży serce?” → „C2”,
  „Co leży na polu B3?” → „gwiazdka” (E3.7), kafelki tekstowe;
- **PERIMETER** — obwód prostokąta/kwadratu i trójkąta z podpisanymi bokami (E4.7), bok z obwodu (E5.12, nowy krok
  grywalny), obwód figury złożonej na kratkach (E6.3, nowy krok grywalny), klawiatura;
- **CLOCK „ustaw”** — dziecko przeciąga wskazówki na tarczy i naciska „OK”: pełne godziny (E3.3), 24 h (E3.11),
  kwadranse z przyciąganiem co 5 minut (E4.3) — druga gałąź trybu `drag` (dziś tylko klocki).

Przy okazji zamykamy audyt S13-01…S13-04 i S13-07 (rozwiązywalność `select`/`drag` w swoim trybie, błędy generatora bez
`skill.id`), follow-up „obszar rysunku dla `select`/`drag`” i S13-08 (zerowa wysokość rysunku pod długim poleceniem).
Format zapisu zostaje **v1**.

## Current State Analysis

Z `research.md` (commit `4a772ac`) i `change.md`, potwierdzone odczytem w tym kroku:

- **Model zadania** (`src/core/tasks/types.ts`): `answer: number | string | number[]`, `check?`, `input?: AnswerMode`,
  `visual?: TaskVisual`. `TaskVisual` (`src/core/tasks/visual.ts`) ma 9 rodzajów (`clock`, `ruler`, `blocks`, `bars`,
  `money`, `scale`, `jugs`, `thermometer`, `icons`) — nic dla pól liczb, kratki ani figury. Rejestr
  (`src/core/tasks/registry.ts`) nie zna PUZZLE_GRID, GRID, PERIMETER.
- **Pułapka `retype`** (S13-01…04): `isCorrect` w `src/core/round.ts` porównuje `===` bez `check` dla tablic; `answer()`
  w `retype` zwraca ten sam stan przy złej odpowiedzi, więc odpowiedź, której widżet nie potrafi wytworzyć, zostawia
  dziecko bez „Dalej”. `TaskScene.render` woła `dragKinds(typeof task0.answer === 'number' ? task0.answer : 0)`
  (`src/core/round/dragLayout.ts` `dragKinds`) — zadanie zegara z odpowiedzią tekstową dostałoby po cichu tacę klocków.
  `validateTask` (`src/core/tasks/validate.ts`) pomija tablice i nie zna trybu; `tests/generateTask.test.ts` sprawdza tylko
  `tiles`; `generateTask` nie dopisuje `skill.id` do błędów parserów (S13-07).
- **Gest**: wzorzec czystego reduktora `stepBlockDrag` (`src/core/blockDrag.ts`: `down/move/up/cancel/reset`, strażnik
  `pointerId`, próg `balance.blockDrag.startDistance`); `TaskScene.create` już kieruje `pointerupoutside` → `cancel` i sen
  sceny → `reset` do `feedDrag`. `down` w trakcie przenoszenia z tym samym `pointerId` jest ignorowany (S13-09) — nie
  kopiujemy tego do zegara.
- **Tarcza**: `src/ui/widgets/ClockFace.ts` (`DIAL`: promień 150, minutowa 106, godzinowa 78; tylko wyświetlanie),
  `clockHandAngles` w `src/core/round/pictureLayout.ts`. W `TASK_LAYOUT.drag.mat` (944 × 460) skala ≈ 1,53, łuk 5 minut
  na końcu minutowej ≈ 85 px sceny; w prostokącie kafelków (600 × 294) tylko ≈ 53 px — zegar do ustawienia nie może
  używać `TASK_LAYOUT.picture.tiles`.
- **Układ**: `pictureLayout` ma gałęzie `tall`, `keypad` i domyślną, która wysyła `select`/`drag` do prostokąta kafelków
  nachodzącego na `TASK_LAYOUT.select.top` (follow-up S-13). `keypadSolution.picture` = 768 × 190.
- **Podpowiedzi**: `firstHint` (`src/core/round/hints.ts`) chowa `hint[0]`, gdy zdradza odpowiedź (`leaksAnswer`), poza
  `FIRST_HINT_EXEMPT_TYPES`; `solutionSteps` dokleja linię wyniku.
- **Program** (`src/data/curriculum/E3.ts`–`E6.ts`): E3.3 2 umiejętności, E3.5 1, E3.7 3, E3.11 4, E4.3 3, E4.7 4; E5.12
  i E6.3 `skills: []`. Próg odblokowania `ceil(0.5 · n)` (`unlockThreshold` w `src/core/curriculum.ts`), tylko do przodu.
- **E2E**: `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` znają kafelki, klawiaturę, `select` i matę
  (`buildOnMat`, `dragTouch`, `cancelTouch`); hak `src/testing/e2eHook.ts` wystawia `mat`, `carrying`, `targets.drag`.
  `tests/e2e/adaptive.spec.ts` (E4 od kroku 2, `test.setTimeout(180_000)`) gra rundy z pulą poprzedniego etapu (E3) i
  kończy rundą na E4.3 — zadania „ustaw zegar” trafią do niego.
- `docs/design-gaps.md`: ostatni wiersz 72; ten slice zaczyna od **73**. Plik lekcji w `context/foundation/` nie istnieje
  (sprawdzone) — żadna lekcja nie obowiązuje; stosujemy lekcje z impl-review S-13 zapisane w archiwach (F1: hak czyta stan
  widżetu, nie prostokąt układu; F2: czas e2e mierzony).
- Baseline (kontrakt): `main` @ `9554e96`: unit `1927 passed`, e2e `57 passed`. Gałąź = main + dokumenty; każda faza mierzy
  na gałęzi i raportuje baseline + delta.

## Desired End State

- Każda umiejętność E1–E6 jest **rozwiązywalna w swoim trybie** (test jednostkowy przez `generateTask`, 20 ziaren × 50):
  kanoniczne wejście trybu doprowadza rundę do `done`; nieznana gałąź `drag` rzuca w `core`, nie rysuje tacy.
- Kwadrat magiczny / piramida, kratka z polami i figury z bokami rysowane w kodzie przez `TaskPicture`; obwód przy
  klawiaturze w fazie rozwiązania nadal czytelny (skalowany do 768 × 190, komórka ≥ 36 px).
- „Ustaw zegar”: tarcza w obszarze maty, uchwyty ≥ 96 px na końcach wskazówek, przyciąganie do pełnych godzin (E3) lub do
  5 minut (E4), „OK” w miejscu `drag.ok`; zła odpowiedź → podpowiedź → druga próba → kroki → ponowne ustawienie.
- E3.3, E3.5, E3.7, E3.11, E4.3, E4.7 z nowymi umiejętnościami; E5.12 i E6.3 grywalne z `childName`.
- E2E: dwa nowe spece (#11) — zadania siatki i zegar ustawiany dotykiem; `adaptive.spec` zielony w swoim limicie.

### Key Discoveries:

- Odpowiedź zegara = istniejący napis `formatTime(h, m)` (`src/core/text/time.ts`), godzina 1–12 (nigdy „0.00”); dla h24
  odpowiedzią jest forma tarczy („3.00” dla „15.00”). Pasuje do `captureFirstWrong`, `validExample` i `solutionSteps` bez
  zmian — zapis zostaje v1 (research § Summary 1).
- Wybór gałęzi `drag` musi wynikać z `task.visual.kind` w czystej funkcji `core` (nie z typu odpowiedzi), inaczej S13-04
  wraca przy każdym nowym rodzaju.
- `helper-metadata.json` `grid.verticesL` (kit) to wielokąt na węzłach kratki — jeden model figury obsługuje prostokąty E4
  i figury złożone E6 (research § E).

## What We're NOT Doing

- GRID „droga po kratkach wg strzałek” (E1–E2) i GRID E5 — żaden krok tych etapów nie ma typu GRID w obecnych danych;
  PUZZLE_GRID „trójkąty liczb” i „uzupełnij pole” — kwadrat i piramida wystarczają na E3.5.
- Tekstowe warianty LENGTH (skala, wyrażenia dwumianowe) i MASS (brutto/netto/tara) w E5.12/E6.3 → **S-14c** (bez zmian).
- BONDS z parami i CHOOSE_OP z obrazkiem → **S-14d** (trigger `S-13b or S-14` przeniesiony w fazie 10).
- Zegar „ustaw” w E5–E6 (dowolne minuty) i E1–E2; pełny przekładniowy zegar (minutowa ciągnie godzinową obrotami).
- Odpowiedź zegara na kafelkach jako awaryjna; nowy tryb odpowiedzi poza gałęzią `drag`.
- Poprawka S13-09 w `blockDrag` (tylko gdy reduktory się łączą — tu nie), S13-05, S13-06 (czeka na v2), S13-11…14.
- Zapis przykładu pomyłki jako obiektu, zmiana formatu zapisu; rysunek w podglądzie postępów rodzica.
- Zmiana reguły progu (`ceil(0.5 · n)`) — PRD FR-014 „większość” vs połowa to istniejące zachowanie (research § F).

## Implementation Approach

Jak S-13/S-14: najpierw czysty `core` test-first (rozwiązywalność, model rysunków, generatory, reduktor zegara), potem
widżety z danymi **tylko w krokach już grywalnych** (kolejność kroków się nie zmienia), potem jedna faza nowych kroków
grywalnych (kolejność zmienia się raz), seam sweep, dwie fazy e2e.

1. Rozwiązywalność w trybie: `isCorrect`, `validateTask`, `dragMode`, `canonicalInput`, `skill.id` w błędach (tdd).
2. Model rysunków `cells`/`grid`/`figure` i generator PUZZLE_GRID (tdd).
3. Generatory GRID i PERIMETER (tdd).
4. Reduktor „ustaw zegar”, wariant CLOCK `set`, układ zegara i obszar `select`/`drag` w `pictureLayout` (tdd).
5. Widżety `NumberCells` + `CoordGrid`, umiejętności E3.5 i E3.7 (impl).
6. Widżet `FigureGrid`, rysunek przy klawiaturze w rozwiązaniu, umiejętności PERIMETER E4.7 (impl).
7. Tarcza z uchwytami, gałąź zegara w `TaskScene`, hak `clock`, helpery e2e — bez danych (impl).
8. Umiejętności „ustaw zegar” w E3.3, E3.11, E4.3, czas `adaptive.spec` (impl).
9. Nowe kroki grywalne E5.12 i E6.3 + testy przypięte do kolejności (impl).
10. Dokumentacja, luki projektu, follow-upy, seam sweep (impl, ostatnia impl).
11. E2E #11: zadania siatki (e2e).
12. E2E #11: zegar ustawiany dotykiem (e2e).

**Reguła kolejności (kontrakt):** helpery e2e znają gałąź zegara (faza 7) zanim dane czynią ją grywalną (faza 8); każda
faza, która zmienia zachowanie istniejącego speca, aktualizuje go w tej samej fazie; każda faza zostawia pełny zestaw
zielony. E2E po fazie zwykle uruchamia orkiestrator (protokół request-file, profil § 8).

**Progi odblokowania** (PR body je wymienia; research § F):

| Krok | umiejętności przed → po | próg przed → po | faza |
|---|---|---|---|
| E3.3 (+ `clock_set_full`) | 2 → 3 | 1 → 2 | 8 |
| E3.5 (+ `magic_square_30`, `pyramid_30`) | 1 → 3 | 1 → 2 | 5 |
| E3.7 (+ `grid_where`, `grid_what`) | 3 → 5 | 2 → 3 | 5 |
| E3.11 (+ `clock_set_24h`) | 4 → 5 | 2 → 3 | 8 |
| E4.3 (+ `clock_set_quarter`) | 3 → 4 | 2 → 2 | 8 |
| E4.7 (+ `perimeter_rect`, `perimeter_triangle`) | 4 → 6 | 2 → 3 | 6 |
| E5.12 (nowy grywalny: `perimeter_side_square`, `perimeter_side_rect`) | 0 → 2 | — → 1 | 9 |
| E6.3 (nowy grywalny: `perimeter_composite`) | 0 → 1 | — → 1 | 9 |

## Critical Implementation Details

**Kontrakt modelu (faza 2; zależą od niego fazy 3, 5, 6, 9).** `TaskVisual` rozszerzony o:

```ts
| { kind: 'cells'; layout: 'square3' | 'pyramid3'; values: readonly (number | null)[] }   // 9 or 6 cells, exactly one null (the empty cell)
| { kind: 'grid'; columns: number; rows: number; items: readonly { item: GridItemId; col: number; row: number }[] }  // labels A.. and 1..; cols ≤ 6, rows ≤ 5, items 2..5 on distinct cells
| { kind: 'figure'; lattice: boolean; vertices: readonly (readonly [number, number])[]; sides: readonly (number | null)[] }  // polygon in lattice units; sides[i] labels edge i→i+1 (null = no label)
```

`GridItemId` (koło, kwadrat, trójkąt, gwiazdka, serce) i rzeczowniki w `src/data/` (lista id + rzeczownik słownika);
`validateVisual` z gałęzią wyczerpującą (`const _: never`), `visualKey`, `describeVisual`: `[cells square3 8 1 6 3 5 7 4 _ 2]`,
`[grid 5×4 serce C2, gwiazdka B3]`, `[figure lattice 6 vertices]`, `[figure 3 cm 5 cm 3 cm 5 cm]`. `visualShape` = `wide` dla
wszystkich trzech. Rodzaje nie mają grafiki rastrowej (`artFilter` ich nie dotyczy — test).

**Zegar (faza 4; zależą fazy 7–8).** Wizualizacja: istniejący `{ kind: 'clock', hour, minute }` z flagą `set: true`
i polem `snap: 60 | 5` (60 dla `minuteStep` 60, inaczej 5 — jedyne źródło przyciągania dla sceny, `canonicalInput` i haka;
plan-review F2) (stan początkowy wskazówek ≠ odpowiedź, wskazówki się nie nakładają). Reduktor `src/core/clockSet.ts`:
`stepClockSet(state, event, geo, rules)`, zdarzenia jak `BlockDragEvent` (`down/move/up/cancel/reset`, `pointerId`),
`geo` = środek, skala, długości wskazówek (z `TASK_LAYOUT`/`DIAL`, nie z widżetu), `rules` = `snapMinutes` (60 albo 5, z
`visual.snap` zadania), `grabRadius` (≥ 48 px sceny) z `balance.clockSet`. Kąt = `atan2(dx, -dy)` zgodnie z ruchem zegara od 12; liczy się kąt,
nie promień. Chwytanie: wskazówka bliższa kątowo, remis rozstrzyga promień (dalej niż połowa między końcami → minutowa);
przy `snapMinutes` 60 minutowa jest nieruchoma na 12. Godzina = najbliższa z 12 pozycji do `θ_godz − m · 0,5°` → 1..12;
godzinowa zawsze rysowana w `clockHandAngles(h, m)`. `down` podczas przenoszenia = nowy chwyt (nie wzór S13-09).
`cancel`/`reset` przywracają pozę sprzed chwytu. Wynik `clockValue(state) = formatTime(h, m)`.

**Wybór gałęzi `drag` (faza 1).** `dragMode(task): 'blocks' | 'clock'` w `src/core/tasks/dragMode.ts` (nie w `src/core/round/`: woła go też
`validateTask`, a `core/round` importuje z `core/tasks`, nie odwrotnie; plan-review F3) — `visual.kind === 'clock'` →
`clock`, brak rysunku lub `blocks` → `blocks`, inny rodzaj → `throw` z `skill`/typem. `TaskScene.render` używa go zamiast
`typeof task0.answer`; `dragKinds` dostaje liczbę tylko z gałęzi klocków.

**`canonicalInput(task)` (faza 1, testowy wzorzec w `src/core/round/`):** `tiles`/`keypad` → `answer`; `select` →
`answer` (musi być ⊆ `choices` i przejść `check`); `drag` klocki → liczba ≤ 999 z cyframi ≤ `maxPerKind`; `drag` zegar →
odpowiedź musi należeć do zbioru osiągalnego reduktora (`reachableTimes(snapMinutes)`, dodane w fazie 4 — do tego czasu
gałąź zegara rzuca „no reachable set”). Test „każda umiejętność E1–E6 rozwiązywalna w swoim trybie” jest jedynym strażnikiem
pułapki `retype` dla przyszłych trybów.

## Phase 1: Rozwiązywalność w trybie odpowiedzi (S13-01…04, S13-07)

Driver: tdd
Driver why: `isCorrect` dla tablic, walidacja świadoma trybu, `dragMode`, `canonicalInput` i `skill.id` w błędach to czyste funkcje `core`, dziś nieistniejące albo błędne — failing testy (np. tablica `select` bez `check` nigdy poprawna, zegar dostaje klocki) prowadzą każdą z nich.

### Overview

Zabezpieczenie przed pułapką `retype` zanim pojawi się pierwszy `drag` z odpowiedzią nieliczbową. Żadna nowa umiejętność.

### Changes Required:

#### 1. Poprawność odpowiedzi tablicowej

**File**: `src/core/round.ts`

**Intent**: `isCorrect` porównuje tablice jako zbiory, gdy zadanie nie ma `check` (S13-01).

**Contract**: `isCorrect(task, input)` — `check` wygrywa; tablica vs tablica = te same elementy bez względu na kolejność.

#### 2. Walidator świadomy trybu

**File**: `src/core/tasks/validate.ts`

**Intent**: tablicowa odpowiedź musi być ⊆ `choices`; tryb `drag` bez znanej gałęzi = naruszenie (S13-03).

**Contract**: nowe kody naruszeń w `validateTask` (gałąź `drag` przez `dragMode` z `src/core/tasks/dragMode.ts`); bez zmian dla
odpowiedzi liczbowych/tekstowych.

#### 3. Gałąź `drag` i kanoniczne wejście

**File**: `src/core/tasks/dragMode.ts` (nowy), `src/core/round/canonicalInput.ts` (nowy), `src/scenes/TaskScene.ts`

**Intent**: `dragMode` (kontrakt w Critical Implementation Details) zastępuje `typeof task0.answer` w `TaskScene.render`;
`canonicalInput` daje wejście, którym widżet trybu potrafi odpowiedzieć (S13-04).

**Contract**: `dragMode(task: Task): 'blocks' | 'clock'` (rzuca dla innych rodzajów); `canonicalInput(task: Task):
number | string | number[]` (rzuca, gdy odpowiedź poza zasięgiem widżetu).

#### 4. `skill.id` w błędach generatora

**File**: `src/core/tasks/registry.ts` (`generateTask`)

**Intent**: błąd parsera/generatora opakowany z `skill.id` w komunikacie (S13-07), `cause` zachowany.

**Contract**: `generateTask(skill, rng)` rzuca `Error` z `skill.id` i `cause`.

#### 5. Testy

**File**: `tests/solvableInMode.test.ts` (nowy), `tests/generateTask.test.ts`, `tests/round.test.ts`

**Intent**: każda umiejętność E1–E6 przez `generateTask` (`tests/helpers.ts`, 20 × 50): `validateTask` czyste,
`answer(startRound…, canonicalInput(task))` dochodzi do `done`; `generateTask.test.ts` przestaje pomijać `select` (S13-02).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `isCorrect` wraca do `===` / `dragMode` zwraca `blocks` dla zegara (zadanie testowe z `visual.kind: 'clock'`) / `generateTask` bez `skill.id` → odpowiednie testy czerwone; przywrócone; meta-check: test rozwiązywalności łapie pułapkę przez maszynę stanów rundy, nie przez lustro implementacji
- `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `dragMode`/`canonicalInput` bez Phasera; `TaskScene.render` nie zgaduje gałęzi z typu odpowiedzi

---

## Phase 2: Model rysunków `cells`/`grid`/`figure` i generator PUZZLE_GRID

Driver: tdd
Driver why: trzy nowe rodzaje `TaskVisual` (walidacja, klucz, opis) i czysty generator kwadratu magicznego/piramidy z parserem — failing testy (pole puste dokładnie jedno, sumy wierszy/kolumn/przekątnych równe, cegła = suma dwóch pod nią, limit ≤ 30) prowadzą implementację.

### Overview

Model dla faz 3, 5, 6, 9 i pierwszy generator; żadna umiejętność w danych.

### Changes Required:

#### 1. Rodzaje rysunków

**File**: `src/core/tasks/visual.ts`, `src/data/gridItems.ts` (nowy)

**Intent**: rodzaje `cells`, `grid`, `figure` wg kontraktu; id przedmiotów kratki z rzeczownikami słownika.

**Contract**: jak w Critical Implementation Details; `src/ui/widgets/TaskPicture.ts` dostaje tymczasowe `case 'cells' | 'grid' |
'figure'` bez rysunku (`this.drawn = null`, komentarz „widget in phase 5/6”), bo jego `switch` kończy się `const unreachable:
never` — bez tego typecheck fazy 2 jest czerwony (plan-review F1); fazy 5–6 zastępują te gałęzie widżetami. Reguły `validateVisual`: liczba pól wg układu, dokładnie jedno `null`,
pola kratki w zakresie i różne, wielokąt zamknięty ≥ 3 wierzchołki, `sides.length === vertices.length`, `lattice` ⇒
wierzchołki całkowite i krawędzie poziome/pionowe.

#### 2. Generator PUZZLE_GRID

**File**: `src/core/tasks/generators/puzzleGrid.ts` (nowy), `src/core/tasks/registry.ts`, `src/core/tasks/bounds.ts`

**Intent**: `variant: 'magic' | 'pyramid'`, `max` (≤ 30): kwadrat magiczny z permutacji/obrotów wzorca Lo Shu przesuniętego
o stałą (suma ≤ `max`), jedno pole puste losowane; piramida 3 + 2 + 1 cegieł, szczyt ≤ `max`, puste pole w dowolnym rzędzie
(wynik dodawaniem albo odejmowaniem). Podpowiedzi: hint[0] metoda bez wyniku („Dodaj liczby w pełnym wierszu — tyle samo
musi dać każdy wiersz i kolumna.” / „Liczba w cegle to suma dwóch cegieł pod nią.”), potem działania szkolne, potem wynik.

**Contract**: `(skill, rng) => Task` z `input: 'keypad'`, `answer: number`, `visual.kind: 'cells'`; parser odrzuca `max`
poza 15..30 i nieznany wariant; teksty w `src/data/pl.ts` `tasks.*`.

#### 3. Testy

**File**: `tests/puzzleGrid.test.ts`, `tests/visual.test.ts`

**Intent**: 1000 losowań na wariant (wyrocznia z pól rysunku: suma linii, suma cegieł), parser, `validateVisual` każdego
nowego rodzaju (przypadki dobre i złe), `describeVisual`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- 1000 losowań na wariant bez naruszeń; klucze `generators`/`parsers` równe; progi inwariantów dla parametrów planowanych umiejętności zmierzone
- Deliberate break: dwa puste pola / przekątna z inną sumą / `figure` z krawędzią ukośną przy `lattice` → czerwone; przywrócone; meta-check: wyrocznia liczy z rysunku, nie z `answer`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów PUZZLE_GRID i 6 losowań na wariant (skrypt jednorazowy albo test drukujący) — hint[0] uczy metody, nie zdradza wyniku

---

## Phase 3: Generatory GRID i PERIMETER

Driver: tdd
Driver why: dwa czyste generatory z parserami — failing testy (pole odpowiedzi zawiera przedmiot, dystraktory z zamienioną literą/cyfrą bez drugiej poprawnej, obwód = suma boków figury, bok z obwodu całkowity, figura złożona na kratkach prostokątna) prowadzą implementację.

### Overview

Generatory dla faz 5, 6, 9; żadna umiejętność w danych.

### Changes Required:

#### 1. GRID

**File**: `src/core/tasks/generators/grid.ts` (nowy), `src/core/tasks/registry.ts`, `src/core/tasks/bounds.ts`

**Intent**: `variant: 'where' | 'what'`, kratka 5 × 4 (A–E, 1–4), 3–4 różne przedmioty na różnych polach. `where`: „Na
którym polu leży serce?” → kafelki „C2” + dystraktory (zamieniona kolejność, sąsiednia kolumna/wiersz — nigdy inny
przedmiot w tym polu). `what`: „Co leży na polu B3?” → nazwy przedmiotów z kratki. Hint[0]: „Najpierw litera kolumny,
potem numer wiersza.”

**Contract**: `input: 'tiles'`, `answer: string`, `choices` 3–4, `visual.kind: 'grid'`; GRID w `UNBOUNDED_TYPES`.

#### 2. PERIMETER

**File**: `src/core/tasks/generators/perimeter.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: `variant: 'rect' | 'triangle' | 'sideSquare' | 'sideRect' | 'composite'`. `rect` — prostokąt lub kwadrat, boki
2–20 cm podpisane, obwód ≤ `max`; `triangle` — trzy boki 2–20 cm (nierówność trójkąta); `sideSquare` — obwód kwadratu ≤ 40
(dzielenie przez 4 w tabliczce), odpowiedź bok; `sideRect` — obwód i jeden bok, odpowiedź drugi bok (obwód parzysty ≤ 100);
`composite` — figura prostokątna na kratkach 1 kratka = 1 cm (L, U, schodki; 6–8 wierzchołków), bez podpisów, obwód ≤ 40.
Hinty wg research § D (obwód = suma boków; `2 · (a + b)`; „Kwadrat ma 4 równe boki.”; „Policz kratki wzdłuż każdego boku.”).

**Contract**: `input: 'keypad'`, `answer: number`, `visual.kind: 'figure'` (rysunek nie w skali dla `rect`/`triangle` —
proporcje ograniczone, liczby w podpisach); rzeczowniki z liczbami (np. „bok”) w `src/data/nouns.ts` z biernikiem.

#### 3. Testy

**File**: `tests/grid.test.ts`, `tests/perimeter.test.ts`

**Intent**: 1000 losowań na wariant; wyrocznie z rysunku (przedmiot na polu odpowiedzi, suma długości krawędzi wielokąta
liczona z wierzchołków dla `composite`, z `sides` dla reszty); brak drugiej poprawnej wśród kafelków; parsery.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- 1000 losowań na wariant bez naruszeń; klucze `generators`/`parsers` równe; progi inwariantów dla parametrów planowanych umiejętności zmierzone
- Deliberate break: dystraktor z polem, na którym też leży szukany przedmiot / `composite` liczy pole zamiast obwodu / `sideRect` z nieparzystym obwodem → czerwone; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów GRID/PERIMETER i 6 losowań na wariant: biernik („leży serce”, „ma 4 boki”), jednostki, hinty bez wyniku w hint[0]

---

## Phase 4: Reduktor „ustaw zegar”, wariant CLOCK `set` i układ zegara

Driver: tdd
Driver why: czysty reduktor kąta (chwyt, przyciąganie, `cancel`/`reset`, nowy chwyt w trakcie), wariant generatora i geometria układu nie istnieją — failing testy (kąt 95° → 3.00 przy 60 min, minutowa przy 5 min, godzina nigdy 0, `pointerupoutside` → `cancel` wraca do pozy) prowadzą implementację.

### Overview

Cała logika zegara do ustawiania w `core`; scena i dane w fazach 7–8.

### Changes Required:

#### 1. Reduktor

**File**: `src/core/clockSet.ts` (nowy), `src/data/balance.ts` (`clockSet: { grabRadius, startDistance }`)

**Intent**: kontrakt w Critical Implementation Details; `reachableTimes(snapMinutes)` dla `canonicalInput`.

**Contract**: `stepClockSet(state, event, geo, rules) => ClockSetState`; `ClockSetState = { hour: 1..12; minute; carrying:
'hour' | 'minute' | null; pointerId; before }`; `clockValue(state): string`.

#### 2. Wariant `set` w CLOCK

**File**: `src/core/tasks/generators/clock.ts`, `src/core/tasks/visual.ts`, `src/core/narration/spoken.ts`

**Intent**: `variant: 'set'` z `minuteStep` (60, 30, 15 — odpowiedzi) i `h24?: boolean` (polecenie „Ustaw zegar na 15.00.”,
odpowiedź „3.00”); `visual: { kind: 'clock', hour, minute, set: true, snap }` (`snap` 60 przy `minuteStep` 60, inaczej 5) z pozą startową ≠ odpowiedź; hint[0] uczy wskazówek
bez napisu odpowiedzi (np. `clockHandsHint`), potem „Krótką wskazówkę ustaw na 4.”, „Długą wskazówkę ustaw na 6.”;
`describeVisual` `[clock set from 9.00]`; czytane polecenie nie czyta pozy startowej.

**Contract**: `input: 'drag'`, `answer: formatTime(h, m)`; parser: `set` + `h24` tylko z `minuteStep` 60.

#### 3. Układ

**File**: `src/core/round/pictureLayout.ts`, `src/core/round/canonicalInput.ts`, `src/data/layout.ts`

**Intent**: `drag` + zegar → tarcza w `TASK_LAYOUT.drag.mat`, „OK” w `drag.ok`, linie rozwiązania w `drag.solutionLines`;
`select` z rysunkiem → prostokąt nad `TASK_LAYOUT.select.top` (follow-up S-13); `belowPrompt` nie zwraca zerowej wysokości
(minimum + test z najdłuższym nowym poleceniem, S13-08); `canonicalInput` dla zegara używa `reachableTimes`.

**Contract**: `clockSetLayout(spec): { centre; scale; ok: Rect; lines: Rect }` (geometria reduktora z tego samego źródła).

#### 4. Testy

**File**: `tests/clockSet.test.ts`, `tests/clock.test.ts`, `tests/pictureLayout.test.ts`

**Intent**: kąty → czas dla obu przyciągań, chwyt wg kąta i promienia, `cancel`, `reset`, nowy `down` w trakcie, inny
`pointerId` ignorowany; 1000 losowań `set` (odpowiedź ∈ `reachableTimes`, poza ≠ odpowiedź); układ bez nakładania.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: przyciąganie godziny daje 0 dla 12 / `cancel` zostawia nową pozę / `select` z rysunkiem znów w prostokącie kafelków → czerwone; przywrócone; meta-check: test kąta liczy punkt z geometrii układu, nie z reduktora
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela wariantu `set` (6 losowań na `minuteStep` i h24): polecenie, hinty uczą wskazówek, krok rozwiązania nie zdradza w hint[0]

---

## Phase 5: Widżety `NumberCells` i `CoordGrid`, umiejętności E3.5 i E3.7

Driver: impl
Driver why: dwa widżety rysowane w kodzie i dane w krokach już grywalnych — zachowanie widać tylko na płótnie; geometria i treść pokryte testami faz 2–3, dowód w inwariantach, `sample`, zrzutach i e2e fazy 11.

### Overview

Kwadrat magiczny, piramida i kratka z polami w rundzie. Progi E3.5 1 → 2, E3.7 2 → 3.

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/NumberCells.ts`, `src/ui/widgets/CoordGrid.ts` (nowe), `src/ui/widgets/TaskPicture.ts`

**Intent**: kontury 4 px, kratki 2 px, kolory z `PLACEHOLDER_COLORS`/palety kitu; puste pole wyróżnione geometrią (ramka
przerywana / „?”) i kolorem; kratka 5 × 4 z literami i cyframi, przedmioty rysowane kształtami. `shown()` dla haka.
`DESIGN-GAP` komentarze → wiersze 73 (pola liczb), 74 (oznaczenia i przedmioty kratki, 5 × 4 zamiast 8 × 5 kitu).

**Contract**: wzorzec widżetu z `TaskPicture` (tworzone raz, `show(visual, rect)`, `hide()`); hak `targets.picture` gdy `shown()`.

#### 2. Dane

**File**: `src/data/curriculum/E3.ts`, `src/data/pl.ts`

**Intent**: `E3.5.magic_square_30`, `E3.5.pyramid_30` (keypad), `E3.7.grid_where`, `E3.7.grid_what` (tiles); `childName`
E3.5 „Kwadrat magiczny i odcinki”, E3.7 „Siatka, parzyste i liczby słowami”.

#### 3. Testy przypięte

**File**: `tests/contentInvariants.test.ts`, `tests/artFilter.test.ts`, `tests/progress.test.ts`

**Intent**: progi i sumy kroków zgodne z tabelą; `playableSteps` bez zmian.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E3 --count 6` bez naruszeń, z linią `visual:`
- Deliberate break: `TaskPicture` bez gałęzi `cells` → typecheck czerwony; przywrócone; meta-check
- `playableSteps` E3 bez zmian; `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`drawn-tasks.spec` wymusza umiejętności — bez zmian)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E3.5, E3.7 `--count 6`
- [visual] Zrzuty: kwadrat magiczny (klawiatura), piramida, kwadrat z podpowiedzią, kwadrat z krokami przy klawiaturze, kratka „gdzie” (kafelki), kratka „co” z podpowiedzią — 1440×900 i 1024×768

---

## Phase 6: Widżet `FigureGrid`, rysunek przy klawiaturze w rozwiązaniu, PERIMETER w E4.7

Driver: impl
Driver why: jeden widżet figury (kratka węzłów + podpisy boków) i skalowanie do 768 × 190 w fazie rozwiązania — widać tylko na płótnie; dane w kroku już grywalnym, dowód w `sample`, zrzutach i e2e fazy 11.

### Overview

Obwody w E4.7 (próg 2 → 3).

### Changes Required:

#### 1. Widżet

**File**: `src/ui/widgets/FigureGrid.ts` (nowy), `src/ui/widgets/TaskPicture.ts`

**Intent**: wielokąt 4 px teal, kratka 2 px (`lattice`), podpisy boków przy środkach krawędzi na zewnątrz figury, czcionka
≥ 24 px sceny; w `keypadSolution.picture` skala z komórką ≥ 36 px. Rozmieszczenie podpisów i skala to czysta funkcja
`figureLayout(visual, rect)` w `src/core/round/figureLayout.ts` (nowy) z testem `tests/figureLayout.test.ts` (podpis na zewnątrz
wielokąta przy środku krawędzi, komórka ≥ 36 px w 768 × 190, nic poza prostokątem) — na nim stoi deliberate break 6.3
(plan-review F4); widżet tylko rysuje jej wynik. `DESIGN-GAP` → wiersze 75 (podpisy boków), 76 (siatka w
768 × 190).

#### 2. Dane

**File**: `src/data/curriculum/E4.ts`

**Intent**: `E4.7.perimeter_rect`, `E4.7.perimeter_triangle` (keypad, obwód ≤ 100); `childName` E4.7 „Metry, litry i obwody”.

#### 3. Testy przypięte

**File**: `tests/contentInvariants.test.ts`, `tests/artFilter.test.ts` (`E4.7` próg 3)

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E4 --count 6` bez naruszeń, z linią `visual:`
- Deliberate break: `FigureGrid` pomija podpisy (`sides` ignorowane) → test geometrii podpisów (czysta funkcja rozmieszczenia w `src/core/round/`) czerwony; przywrócone; meta-check
- `playableSteps` E4 bez zmian; `tests/fixtures/` bez zmian; `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E4.7 `--count 6`
- [visual] Zrzuty: prostokąt z bokami (klawiatura), trójkąt, obwód z podpowiedzią, obwód z krokami przy klawiaturze (768 × 190 — podpisy czytelne) — 1440×900 i 1024×768

---

## Phase 7: Tarcza z uchwytami, gałąź zegara w `TaskScene`, hak `clock` i helpery e2e

Driver: impl
Driver why: sklejka sceny (zdarzenia wskaźnika → `stepClockSet`, „OK” → `submit`) i rysowanie uchwytów żyją tylko na płótnie; reduktor pokryty w fazie 4 — dowód w e2e fazy 12 i w helperach, które muszą istnieć przed danymi fazy 8 (reguła kontraktu).

### Overview

Bez danych: gałąź zegara jest wywoływana tylko przez zadanie testowe w e2e-buildzie fazy 12 i od fazy 8.

### Changes Required:

#### 1. Tarcza do ustawiania

**File**: `src/ui/widgets/ClockFace.ts`, `src/ui/widgets/ClockSet.ts` (nowy: tarcza + „OK” przez `ActionButton`)

**Intent**: uchwyty ≥ 96 px na końcach wskazówek, stan „trzymam” wyróżniony geometrią (większy uchwyt) i kolorem;
`targets()` zwraca środek, końce wskazówek i „OK” (punkty wewnętrzne). `DESIGN-GAP` → wiersz 77.

#### 2. Scena

**File**: `src/scenes/TaskScene.ts`

**Intent**: `render` wybiera widżet przez `dragMode`; `feedDrag` kieruje zdarzenia do `stepClockSet` lub `stepBlockDrag`
(te same słuchacze, `pointerupoutside` → `cancel`, sen → `reset`); „OK” → `submit(clockValue(state))`; w fazie rozwiązania
linie w `drag.solutionLines`, retype ustawia zegar od nowa.

#### 3. Hak i helpery

**File**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: migawka `clock: { hour, minute, carrying }`, `targets.clock: { centre, hourTip, minuteTip, ok, radius }`;
helper `setClock(page, time)` — punkt docelowy z kąta i promienia z haka, jeden `dragTouch` na wskazówkę (≤ 4 kroki),
potem „OK”; `answerRight`/`answerWrong` z gałęzią zegara (zły czas = godzina + 1).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: pole `clock` usunięte z migawki w `src/testing/e2eHook.ts` → typecheck czerwony w `tests/e2e/support/hook.ts` (`setClock`); przywrócone; meta-check: dowodzi tylko kontraktu haka ↔ helper — zachowanie gałęzi na płótnie dowodzi faza 12 (przerwa p12a)
- `npm run build` drukuje `e2e hook: absent (`; `clock` tylko w buildzie haka
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Scena tylko karmi reduktor; brak liczb balansu i tekstów gracza w `ClockSet`

---

## Phase 8: Umiejętności „ustaw zegar” w E3.3, E3.11, E4.3 i czas `adaptive.spec`

Driver: impl
Driver why: dane w krokach już grywalnych — dowód w inwariantach, `sample`, rozwiązywalności w trybie i w `adaptive.spec`, do którego zadania zegara wchodzą (pula poprzedniego etapu i runda na E4.3).

### Overview

Progi E3.3 1 → 2, E3.11 2 → 3, E4.3 2 → 2.

### Changes Required:

#### 1. Dane

**File**: `src/data/curriculum/E3.ts`, `src/data/curriculum/E4.ts`, `src/data/pl.ts`

**Intent**: `E3.3.clock_set_full` (`minuteStep` 60), `E3.11.clock_set_24h` (`h24`), `E4.3.clock_set_quarter` (`minuteStep`
15, przyciąganie co 5 min); `childName` bez zmian (E3.3 „Zegar: pełne godziny”, E4.3 „Zegar: minuty i kwadrans”).

#### 2. E2E dotknięte zmianą

**File**: `tests/e2e/adaptive.spec.ts`

**Intent**: zmierzyć czas; jeśli > 160 s, `test.setTimeout(240_000)` (jak runda `drawn-tasks.spec`) z komentarzem — każdy
krok nadal czeka na migawkę, więc zawieszenie nie przejdzie; `first-launch.spec` (rozgrzewka z puli E3) zielony bez zmian.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje nowe umiejętności
- `npm run sample -- E3 --count 6` i `E4 --count 6` bez naruszeń
- Deliberate break: `clock_set_quarter` z `minuteStep` 7 → parser czerwony; generator dający 0.15 → rozwiązywalność czerwona; przywrócone; meta-check
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`; czas `adaptive.spec` zapisany (≤ limit)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E3.3, E3.11, E4.3 `--count 6`
- [visual] Zrzuty: ustaw zegar E3 (poza startowa), wskazówka trzymana, E4 kwadrans po ustawieniu, podpowiedź, kroki rozwiązania obok tarczy — 1440×900 i 1024×768 (gest przez jednorazowy spec Playwright `*.local`, profil § 8)
- [human] Gest na tablecie: przyciąganie co 5 min i chwyt wskazówki palcem dziecka (iPad/Android)

---

## Phase 9: Nowe kroki grywalne E5.12 i E6.3 oraz testy przypięte do kolejności

Driver: impl
Driver why: zmiana danych przestawiająca kolejność kroków — dowód w testach przypiętych (wyrocznia startu liczona ręcznie z reguły D), inwariantach, `childName` i e2e; generator i widżet już istnieją.

### Overview

Jedyna faza zmieniająca `playableSteps`: E5 1–12, E6 [1, 3–10].

### Changes Required:

#### 1. Dane

**File**: `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts`

**Intent**: E5.12 `perimeter_side_square`, `perimeter_side_rect` (`childName` „Obwody i boki”); E6.3 `perimeter_composite`
(`childName` „Obwody figur na kratkach”).

#### 2. Testy przypięte

**File**: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/progress.test.ts`,
`tests/curriculumEnd.test.ts`

**Intent**: nowe listy `playableSteps`, start kalendarzowy z reguły D (wyrocznia ręczna), „nieplayable step falls back”
z innym pustym krokiem (E6.2), E6.1 odblokowuje 3.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń
- Deliberate break: E6.3 bez `childName` → test `childName` grywalnych kroków czerwony; przywrócone; meta-check
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`first-launch`, `adaptive` zielone)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E5.12, E6.3 `--count 6`
- [visual] Zrzuty: bok kwadratu z obwodu, figura złożona na kratkach (klawiatura i krok rozwiązania), karta „Nowa umiejętność!” E5.12 — 1440×900 i 1024×768

---

## Phase 10: Dokumentacja, luki projektu, follow-upy i seam sweep

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Porządek przed e2e.

### Changes Required:

#### 1. Seam sweep

**File**: cała zmiana

**Intent**: zduplikowane helpery (rozmieszczenie podpisów, rysowanie kratki w `CoordGrid`/`FigureGrid` → jedna funkcja),
nieaktualne komentarze (`dragKinds` „answer number”, S13-04 w `TaskScene`), `UNBOUNDED_TYPES`, wiersze design-gaps 73–77
spójne z komentarzami `DESIGN-GAP`.

#### 2. Dokumenty

**File**: `CLAUDE.md` („Current state”: zdanie o S-13b — PUZZLE_GRID, GRID, PERIMETER, `clockSet`, `dragMode`,
`canonicalInput`, kroki E5.12/E6.3; usunąć „Not yet present: PUZZLE_GRID, GRID, PERIMETER, setting the clock hands”),
`docs/design-gaps.md`, `context/changes/drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`

**Intent**: follow-upy z `Trigger:` — BONDS/CHOOSE_OP → `S-14d`; zegar „ustaw” E5–E6 i co 5 min odpowiedzi → `S-14c or a
tablet test`; S13-09 → `next change to blockDrag`; S13-05/06/11…14 przeniesione z triggerami.

### Success Criteria:

#### Automated Verification:

- `bash scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- `grep -rn "DESIGN-GAP (docs/design-gaps.md row 7[3-7])" src/` ↔ wiersze 73–77 w `docs/design-gaps.md`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Każdy follow-up ma `Trigger:`; brak martwych komentarzy o klockach jako jedynym `drag`
- [human] Decyzje wbrew dosłownemu tekstowi ZADANIA: E4.3 „ustaw” tylko kwadranse (odczyt co 5 min zostaje), wskazówka godzinowa wybierana osobno (nie przekładnia), kratka 5 × 4 zamiast 8 × 5 kitu, zakresy tam, gdzie ZADANIA milczy (kwadrat ≤ 30, boki 2–20 cm, obwód E6 ≤ 40); wyższe progi odblokowania dla dzieci zapisanych na E3.3, E3.5, E3.7, E3.11, E4.7 (tabela progów — wolniej, nic nie ginie) i E6.1 → E6.3 zamiast E6.4

---

## Phase 11: Zadania siatki dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) dla kwadratu, kratki i figury istnieje tylko w renderowanej stronie: widżet narysowany (nie prostokąt układu), kafelki tekstowe pól, figura przy klawiaturze w fazie rozwiązania; zbudowane w fazach 5–6, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/grid-tasks.spec.ts` (projekt `chromium-hook`), umiejętności przez `?e2eSkills`; cel czasu < 60 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`grid-tasks` w `ROUND_SPEC`), `tests/e2e/grid-tasks.spec.ts` (nowy)

**Intent**: (a) „#11 a magic square shows its cells and takes the keypad after a hint”: E3, `E3.5.magic_square_30` →
`visual.kind === 'cells'`, `targets.picture` nie `null` → `answerWrong` → podpowiedź → `answerRight` → gwiazdka.
(b) „#11 a grid task takes a text tile”: `E3.7.grid_where` → kafelek „C2”. (c) „#11 a perimeter figure stays drawn beside
the keypad in the solution”: E4, `E4.7.perimeter_rect` → dwa razy `answerWrong` → `solution` → `targets.picture` w
`keypadSolution.picture` → retype → gwiazdka.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na migawce. Chromium
niedostępny → protokół request-file (`e2e-request-p11.md`, patche `e2e-break-p11a…c.patch`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/grid-tasks.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`
- Deliberate break (patch `e2e-break-p11a.patch`): `NumberCells.show` nie rysuje → (a) czerwony na `targets.picture`; meta-check: lekcja F1 — hak czyta `shown()`
- Deliberate break (patch `e2e-break-p11b.patch`): `grid` `choices` bez odpowiedzi → (b) czerwony na braku kafelka; meta-check: dowodzi ścieżki kafelka tekstowego, nie rysunku kratki (pozycji przedmiotów hak nie widzi — tylko zrzuty 5.7)
- Deliberate break (patch `e2e-break-p11c.patch`): figura w fazie rozwiązania w prostokącie kafelków → (c) czerwony; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 12: Zegar ustawiany dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 dla gestu kątowego: przyciąganie i chwyt w skali FIT, `pointerupoutside` → `cancel`, retype przeciąganiem — istnieje tylko w przeglądarce; zbudowane w fazach 4, 7, 8, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/clock-set.spec.ts` (projekt `chromium-hook`); cel < 60 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`clock-set` w `ROUND_SPEC`), `tests/e2e/clock-set.spec.ts` (nowy)

**Intent**: (a) „#11 setting the hour hand answers a full-hour clock”: E3, `E3.3.clock_set_full` → `dragTouch` z końca
godzinowej na pozycję odpowiedzi → `clock.hour` = cel → „OK” → gwiazdka. (b) „#11 a quarter needs both hands and a wrong
setting gets a hint and a second try”: E4, `E4.3.clock_set_quarter` → `answerWrong` → podpowiedź → `setClock` → gwiazdka.
(c) „#11 a drag ending outside the canvas cancels and leaves the hands where they were”: `cancelTouch` → `clock` = poza
startowa, `carrying` `null`; zwykły drag nadal działa.

**Contract**: jak faza 11; request-file `e2e-request-p12.md`, patche `e2e-break-p12a…c.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/clock-set.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas pełnego zestawu i `adaptive.spec` zapisane
- Deliberate break (patch `e2e-break-p12a.patch`): `TaskScene` przekazuje zdarzenia zegara do `stepBlockDrag` → (a) czerwony
- Deliberate break (patch `e2e-break-p12b.patch`): `snapMinutes` 60 dla E4 → (b) czerwony (minuty nieosiągalne); meta-check: dowodzi przyciągania na płótnie
- Deliberate break (patch `e2e-break-p12c.patch`): `pointerupoutside` nie wysyła `cancel` → (c) czerwony; każdy oczekiwany czerwony uruchomiony osobno (`-g`)
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Rozwiązywalność każdej umiejętności E1–E6 w swoim trybie; `isCorrect` tablic; `dragMode`; `skill.id` w błędach.
- Model `cells`/`grid`/`figure` (walidacja, klucz, opis); generatory PUZZLE_GRID, GRID, PERIMETER (1000 losowań, wyrocznie z
  rysunku); reduktor zegara (kąty, chwyt, przyciąganie, `cancel`/`reset`); wariant `set`; układ (`drag` zegar, `select` z
  rysunkiem, `belowPrompt` minimum).
- Program: progi z tabeli, `playableSteps`, start kalendarzowy, `childName`, inwarianty treści.

### Integration Tests:

- `npm run sample -- E3..E6 --count 6`; `npm run build` (strażnik haka); e2e: istniejące 57 (w tym `adaptive`, `first-launch`,
  `drawn-tasks`) + 3 (`grid-tasks`) + 3 (`clock-set`).

### Manual Testing Steps:

1. Zrzuty stanów z faz 5, 6, 8, 9 — 1440×900 i 1024×768.
2. Odczyt nauczyciela wszystkich zmienionych kroków (fazy 2–6, 8, 9).
3. Tablet: gest wskazówek palcem, czytelność podpisów boków przy klawiaturze.

## Performance Considerations

Widżety tworzą Graphics raz i przerysowują przy zmianie zadania; reduktor zegara liczy jeden `atan2` na ruch. Czas e2e:
`adaptive.spec` dostaje zadania zegara (≤ 2 przeciągnięcia po 4 kroki + „OK”, ≈ 1–2 s na zadanie); mierzony w fazach 8 i 12.

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1; fixtury nietknięte; nowe umiejętności startują z mastery 0. Uczeń zapisany na E3.3, E3.5,
E3.7, E3.11, E4.7 poniżej nowego progu potrzebuje jednej opanowanej umiejętności więcej (nic nie ginie, nikt nie jest
cofany); uczeń na E5.11 odblokuje E5.12; uczeń na E6.1 odblokuje E6.3 zamiast E6.4. Wzmianka w PR.

## Known risks

- **Precyzja gestu E4** (≈ 45 px CSS między pozycjami 5 min na tablecie 1024): odpowiedzi tylko kwadransowe łagodzą to;
  zmieniłoby: test tabletu z chybionymi przyciągnięciami → `snapMinutes` 15 w E4.3.
- **Czas `adaptive.spec`** blisko 180 s; plan pozwala podnieść do 240 s z zapisanym pomiarem (faza 8); zmieniłoby: > 240 s →
  helper zegara przez jedno CDP z mniejszą liczbą kroków.
- **Chromium w sesji agenta**: fazy 1–10 e2e uruchamia orkiestrator; 11–12 protokół request-file.
- **Podpisy boków w 768 × 190**: komórka ≥ 36 px, czcionka ≥ 24 px; zrzut 6.x to sprawdza; zmieniłoby: nieczytelne → kształt
  `tall` (układ „obok”) dla `figure`.
- **Obszar `select` z rysunkiem (faza 4)** nie ma dziś konsumenta (żadna umiejętność `select` nie ma `visual`); zamyka
  follow-up S-13 tanio, ale dowód to tylko test układu (plan-review F6). Zmieniłoby: koszt > 1 test → follow-up `Trigger: the first
  pictured select skill`.
- **Faza 4 najcięższa z `core`** (reduktor + wariant `set` + układ + `canonicalInput`); przy zbliżaniu się do limitu kontekstu
  agent kończy po reduktorze i wariancie (`NEEDS_CONTINUATION`), układ w tej samej fazie dokańcza następna sesja (plan-review F6).
- **Faza 11 break (b)**: hak nie widzi pozycji przedmiotów w pikselach — dowód poprawności rysunku kratki tylko w zrzutach.

## References

- Research: `context/changes/drawn-grid-tasks-e3-e4/research.md`; change: `context/changes/drawn-grid-tasks-e3-e4/change.md`
- Kontrakt runu: `context/runs/2026-10-14-save-s13b-s15-s14b/agent-contract.md` (§ S-13b); profil `context/foundation/autonomous-run.md` § 6, § 8, § 9
- Katalog: `docs/ZADANIA.md` § 2–4 (PUZZLE_GRID, GRID, PERIMETER, CLOCK); PRD FR-023, FR-014
- Test-plan: `context/foundation/test-plan.md` ryzyka #1, #5, #11, #13; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md` („Code-drawn helpers”, „Font and spacing”), `reference/square-grid.svg`, `reference/clock.svg`, `reference/helper-metadata.json`
- Wzorce: `context/archive/2026-10-14-art-tasks-all-stages/plan.md`, `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/` (`blockDrag`, `e2e-request-p11.md`), `src/core/blockDrag.ts`, `src/ui/widgets/TaskPicture.ts`, `src/core/tasks/generators/clock.ts`

## Autonomous decisions

1. **E3.5: magic + pyramid (próg 1 → 2); E3.7: dwie umiejętności GRID (`where`, `what`, próg 2 → 3).** Odrzucone: jedna
   umiejętność na krok (niższy próg, mniej różnorodności). Dlaczego: rekomendacja research (Open Q 1–2), jeden wariant na
   umiejętność jak CLOCK. Zmieniłoby: symulacja #17 pokazująca, że E3 przekracza budżet tempa.
2. **Zegar „ustaw” = `visual.kind: 'clock'` + `set: true`, nie nowy rodzaj.** Odrzucone: rodzaj `clockSet`. Dlaczego: jeden
   widżet tarczy, `describeVisual`/mowa rozgałęziają się po fladze (research Open Q 3). Zmieniłoby: tarcza do ustawiania z
   innym rysunkiem niż do odczytu.
3. **Rysunek siatki przy klawiaturze w rozwiązaniu: skalowanie do 768 × 190 (komórka ≥ 36 px), bez zmiany `keypadSolution`.**
   Odrzucone: powiększenie `keypadSolution` (zmienia każdy rysunek przy klawiaturze) i układ „obok” (figury są szerokie).
   Zmieniłoby: zrzut 6.x z nieczytelnymi podpisami → `visualShape('figure') = 'tall'`.
4. **E4.3 „ustaw” tylko kwadranse (`minuteStep` 15) z przyciąganiem co 5 min.** Odrzucone: odpowiedzi co 5 min (ZADANIA E4
   „minuty co 5” — zostaje w odczycie). Wbrew dosłownemu ZADANIA → `[human]` 10.6. Zmieniłoby: test tabletu z pewnym
   chwytem co 5 min → dodać `E4.3.clock_set_5`.
5. **Godzinowa wybierana osobno, rysowana sprzężona (`clockHandAngles`), nie przekładnia.** (research decyzja 3) →
   `[human]` 10.6. Zmieniłoby: dzieci na tablecie oczekują zachowania prawdziwego zegara.
6. **PERIMETER w E5.12 i E6.3 zostaje mimo 12 faz** (research decyzja 5 mówiła „> ~10 faz → E6.3 do follow-upu”). Dlaczego:
   E6.3 to tylko dane + wariant generatora w istniejących fazach 3 i 9; liczba faz wynika z reguły ≤ 2 komponentów UI, nie z
   zakresu. Zmieniłoby: faza 9 przekroczy budżet → E6.3 do follow-upu `Trigger: S-14c`.
7. **Kratka GRID 5 × 4 (A–E, 1–4), przedmioty rysowane kształtami (koło, kwadrat, trójkąt, gwiazdka, serce).** Odrzucone:
   8 × 5 kitu (za małe pola dla 8-latka w 600 × 294), ikony WebP (`artFilter`, pula). Wbrew kitowi → DESIGN-GAP 74 i `[human]`
   10.6. Zmieniłoby: teacher read prosi o przedmioty z życia (ikony paczki).
8. **Zakresy tam, gdzie ZADANIA milczy** (research decyzja 6: kwadrat i piramida ≤ 30, boki 2–20 cm, obwód E4 ≤ 100, E5
   ≤ 100 z dzieleniem w tabliczce, E6 ≤ 40 na kratkach) → `[human]` 10.6. Zmieniłoby: odczyt autora.
9. **`dragMode` i `canonicalInput` w fazie 1, przed jakimkolwiek zegarem** — test rozwiązywalności staje się bramą dla
   każdego przyszłego trybu (S13-01…04). Zmieniłoby: nic.
10. **`adaptive.spec`: pomiar w fazie 8, podniesienie limitu do 240 s dozwolone tylko z pomiarem > 160 s.** Odrzucone:
    wyłączenie zegara z rund `adaptive` (fałszywy obraz) i zmniejszenie `MAX_ROUNDS` (osłabia #13). Zmieniłoby: > 240 s.
11. **Brak `AskUserQuestion` (kontrakt reguła 1):** złożoność HIGH, wszystkie pytania rozstrzygnięte z research/change.md.
    Roadmapa S-13b → `planning` w commicie planu.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Rozwiązywalność w trybie odpowiedzi (S13-01…04, S13-07)

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — c84ece8
- [x] 1.2 Deliberate break: `isCorrect` wraca do `===` / `dragMode` zwraca `blocks` dla zegara / `generateTask` bez `skill.id` → czerwone; przywrócone; meta-check — c84ece8
- [x] 1.3 `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian — c84ece8
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — c84ece8

#### Manual

- [x] 1.5 [reviewer] `dragMode`/`canonicalInput` bez Phasera; `TaskScene.render` nie zgaduje gałęzi z typu odpowiedzi — impl review: `dragMode`/`canonicalInput` import no Phaser; `TaskScene.render` calls `dragMode` only for `drag`

### Phase 2: Model rysunków `cells`/`grid`/`figure` i generator PUZZLE_GRID

#### Automated

- [x] 2.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 2166514
- [x] 2.2 1000 losowań na wariant bez naruszeń; klucze `generators`/`parsers` równe; progi inwariantów zmierzone — 2166514
- [x] 2.3 Deliberate break: dwa puste pola / przekątna z inną sumą / `figure` z krawędzią ukośną przy `lattice` → czerwone; przywrócone; meta-check — 2166514
- [x] 2.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 2166514 (e2e: orchestrator note, full suite on 2166514, 57 passed)

#### Manual

- [x] 2.5 [reviewer] Odczyt nauczyciela szablonów PUZZLE_GRID i 6 losowań na wariant — impl review teacher read; magic-square gap line added (F1)

### Phase 3: Generatory GRID i PERIMETER

#### Automated

- [x] 3.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 3cb42cc
- [x] 3.2 1000 losowań na wariant bez naruszeń; klucze `generators`/`parsers` równe; progi inwariantów zmierzone — 3cb42cc
- [x] 3.3 Deliberate break: dystraktor z polem szukanego przedmiotu / `composite` liczy pole / `sideRect` z nieparzystym obwodem → czerwone; przywrócone; meta-check — 3cb42cc
- [x] 3.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 3cb42cc (e2e: orchestrator note, full suite on 3cb42cc, 57 passed)

#### Manual

- [x] 3.5 [reviewer] Odczyt nauczyciela szablonów GRID/PERIMETER i 6 losowań na wariant — impl review teacher read; E5.12/E6.3 ranges fixed (F3)

### Phase 4: Reduktor „ustaw zegar”, wariant CLOCK `set` i układ zegara

#### Automated

- [x] 4.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — e69e6e8
- [x] 4.2 Deliberate break: godzina 0 dla 12 / `cancel` zostawia nową pozę / `select` z rysunkiem w prostokącie kafelków → czerwone; przywrócone; meta-check — e69e6e8
- [x] 4.3 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — e69e6e8 (e2e: orchestrator note, full suite on e69e6e8, 57 passed)

#### Manual

- [x] 4.4 [reviewer] Odczyt nauczyciela wariantu `set` (6 losowań na `minuteStep` i h24) — impl review teacher read; full-hour hints fixed (F2)

### Phase 5: Widżety `NumberCells` i `CoordGrid`, umiejętności E3.5 i E3.7

#### Automated

- [x] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — c01c12e
- [x] 5.2 `npm run sample -- E3 --count 6` bez naruszeń, z linią `visual:` — c01c12e
- [x] 5.3 Deliberate break: `TaskPicture` bez gałęzi `cells` → typecheck czerwony; przywrócone; meta-check — c01c12e
- [x] 5.4 `playableSteps` E3 bez zmian; `tests/fixtures/` bez zmian; `e2e hook: absent (` — c01c12e
- [x] 5.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — c01c12e (e2e: orchestrator note, full suite on c01c12e, 57 passed)

#### Manual

- [x] 5.6 [reviewer] Odczyt nauczyciela `sample` E3.5, E3.7 `--count 6` — impl review teacher read (F1)
- [ ] 5.7 [visual] Zrzuty: kwadrat magiczny, piramida, kwadrat z podpowiedzią, kwadrat z krokami przy klawiaturze, kratka „gdzie”, kratka „co” z podpowiedzią — 1440×900 i 1024×768

### Phase 6: Widżet `FigureGrid`, rysunek przy klawiaturze w rozwiązaniu, PERIMETER w E4.7

#### Automated

- [x] 6.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — ab1fa91
- [x] 6.2 `npm run sample -- E4 --count 6` bez naruszeń, z linią `visual:` — ab1fa91
- [x] 6.3 Deliberate break: podpisy boków pominięte → test rozmieszczenia podpisów czerwony; przywrócone; meta-check — ab1fa91
- [x] 6.4 `playableSteps` E4 bez zmian; `tests/fixtures/` bez zmian; `e2e hook: absent (` — ab1fa91
- [x] 6.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — ab1fa91 (e2e: orchestrator note, full suite on ab1fa91, 57 passed)

#### Manual

- [x] 6.6 [reviewer] Odczyt nauczyciela `sample` E4.7 `--count 6` — impl review teacher read
- [ ] 6.7 [visual] Zrzuty: prostokąt z bokami, trójkąt, obwód z podpowiedzią, obwód z krokami przy klawiaturze (768 × 190) — 1440×900 i 1024×768

### Phase 7: Tarcza z uchwytami, gałąź zegara w `TaskScene`, hak `clock` i helpery e2e

#### Automated

- [x] 7.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — eacf9e0
- [x] 7.2 Deliberate break: pole `clock` usunięte z migawki haka → typecheck `setClock` czerwony; przywrócone; meta-check — eacf9e0 (impl review F6: the actual break was `TASK_LAYOUT.clockSet.dial.hourLength` 78 → 300 → 2 red in `tests/clockSet.test.ts`; the planned hook break is impossible with the hand-written `Snapshot`; scene routing is proven by p12a/p12b)
- [x] 7.3 `npm run build` drukuje `e2e hook: absent (`; `clock` tylko w buildzie haka — eacf9e0
- [x] 7.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — orchestrator note: 57 passed on eacf9e0

#### Manual

- [x] 7.5 [reviewer] Scena tylko karmi reduktor; brak liczb balansu i tekstów gracza w `ClockSet` — impl review: `ClockSet` uses `pl`, `balance`, `TASK_LAYOUT` only; scene feeds `stepClockSet`; OK ignored while a hand is held (F4)

### Phase 8: Umiejętności „ustaw zegar” w E3.3, E3.11, E4.3 i czas `adaptive.spec`

#### Automated

- [x] 8.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; rozwiązywalność obejmuje nowe umiejętności — d9b83f2
- [x] 8.2 `npm run sample -- E3 --count 6` i `E4 --count 6` bez naruszeń — d9b83f2
- [x] 8.3 Deliberate break: `minuteStep` 7 → parser czerwony; generator dający 0.15 → rozwiązywalność czerwona; przywrócone; meta-check — d9b83f2
- [x] 8.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`; czas `adaptive.spec` zapisany (≤ limit) — orchestrator note: 57 passed on d9b83f2, 4.0 min, adaptive.spec within its limit

#### Manual

- [x] 8.5 [reviewer] Odczyt nauczyciela `sample` E3.3, E3.11, E4.3 `--count 6` — impl review teacher read (F2)
- [ ] 8.6 [visual] Zrzuty: ustaw zegar E3, wskazówka trzymana, E4 kwadrans po ustawieniu, podpowiedź, kroki obok tarczy — 1440×900 i 1024×768
- [ ] 8.7 [human] Gest na tablecie: przyciąganie co 5 min i chwyt wskazówki palcem dziecka

### Phase 9: Nowe kroki grywalne E5.12 i E6.3 oraz testy przypięte do kolejności

#### Automated

- [x] 9.1 Pełna bramka lokalna zielona (bez e2e, patrz 9.4); unit `<baseline gałęzi> + N` — 486b501
- [x] 9.2 `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń — 486b501
- [x] 9.3 Deliberate break: E6.3 bez `childName` → test czerwony; przywrócone; meta-check — 486b501
- [x] 9.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (orchestrator note: 57 passed on 486b501, 4.0 min)

#### Manual

- [x] 9.5 [reviewer] Odczyt nauczyciela `sample` E5.12, E6.3 `--count 6` — impl review teacher read (F3)
- [ ] 9.6 [visual] Zrzuty: bok kwadratu z obwodu, figura złożona (klawiatura i krok rozwiązania), karta „Nowa umiejętność!” E5.12 — 1440×900 i 1024×768

### Phase 10: Dokumentacja, luki projektu, follow-upy i seam sweep

#### Automated

- [x] 10.1 `bash scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — e1d50d0
- [x] 10.2 Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone — e1d50d0
- [x] 10.3 Komentarze `DESIGN-GAP` ↔ wiersze 73–77 w `docs/design-gaps.md` — e1d50d0
- [x] 10.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — orchestrator note: 57 passed (4.0 min) on e1d50d0

#### Manual

- [x] 10.5 [reviewer] Każdy follow-up ma `Trigger:`; brak martwych komentarzy o klockach jako jedynym `drag` — impl review: every follow-up has `Trigger:`; stale block-only comment in `TaskScene.create` and row-77 comment in `layout.ts` fixed
- [ ] 10.6 [human] Decyzje wbrew dosłownemu ZADANIA/kitowi: E4.3 „ustaw” tylko kwadranse, godzinowa osobno, kratka 5 × 4, zakresy tam, gdzie ZADANIA milczy; wyższe progi odblokowania na żywych zapisach

### Phase 11: Zadania siatki dotykiem — e2e (#11)

#### Automated

- [x] 11.1 `npx playwright test tests/e2e/grid-tasks.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3` — orchestrator: grid-tasks 3 passed (28.5 s), full 60 passed (4.2 min) = 57 + 3 — 718f9cc
- [x] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): `NumberCells.show` nie rysuje → (a) czerwony; meta-check — orchestrator: red `not.toBeNull` Received null, restored — 718f9cc
- [x] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): `grid` `choices` bez odpowiedzi → (b) czerwony; meta-check — orchestrator: red `toContain` Expected "B4" Received ["B3","A4"], restored — 718f9cc
- [x] 11.4 Deliberate break (patch `e2e-break-p11c.patch`): figura w rozwiązaniu w prostokącie kafelków → (c) czerwony; przywrócone — orchestrator: red `toBeLessThanOrEqual` Expected <= 668 Received 690, restored — 718f9cc
- [x] 11.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite — 718f9cc

### Phase 12: Zegar ustawiany dotykiem — e2e (#11)

#### Automated

- [x] 12.1 `npx playwright test tests/e2e/clock-set.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czasy zapisane — orchestrator: clock-set 3 passed (29.1 s, serial); full 63 passed (4.2 min) = 60 + 3; adaptive.spec 1.5 min, no timeout change — 4c320dd
- [x] 12.2 Deliberate break (patch `e2e-break-p12a.patch`): zdarzenia zegara do `stepBlockDrag` → (a) czerwony — orchestrator: red `toBe` Expected 1, Received 11, restored — 4c320dd
- [x] 12.3 Deliberate break (patch `e2e-break-p12b.patch`): `snapMinutes` 60 dla E4 → (b) czerwony; meta-check — orchestrator: red `toBe` Expected 15, Received 0; hour-hand test stayed green (meta-check), restored — 4c320dd
- [x] 12.4 Deliberate break (patch `e2e-break-p12c.patch`): `pointerupoutside` bez `cancel` → (c) czerwony; każdy czerwony osobno (`-g`) — orchestrator: red `toMatchObject` (pose differs); deviation: cancelled pointer read as normal up, not `pointerupoutside` (CDP touchCancel reaches Phaser as pointerup with wasCanceled), restored — 4c320dd
- [x] 12.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite — lint, typecheck, 2222 tests, build `e2e hook: absent (2 chunks checked)`, ports 4397/4398 free — 4c320dd
