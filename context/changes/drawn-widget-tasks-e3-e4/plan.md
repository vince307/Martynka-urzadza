# Zadania z rysunkami w kodzie dla E3–E4 (zegar, linijka, klocki, diagram) i tryby `select`/`drag` — Implementation Plan

## Overview

Slice roadmapy **S-13** (`drawn-widget-tasks-e3-e4`, etap M6), autonomiczny run `2026-10-13-s12-s14`, gałąź
`feat/drawn-widget-tasks-e3-e4` z `main` @ `b57433c`. Dziecko w rundzie dostaje zadania z rysunkiem narysowanym w kodzie
(Phaser Graphics) i odpowiada dotykiem:

- **CLOCK** (odczyt tarczy, wybór z 3) — E3.3 pełne godziny i „za 2 godziny”, E3.11 zapis 24-godzinny, E4.3 minuty co 5,
  pół godziny, kwadrans;
- **LENGTH** — E3.5 odcinek w cm na linijce, E4.7 odcinek w mm i zamiana m ↔ cm;
- **PLACE_VALUE** — odczyt klocków dziesiątkowych (E3.6, E4.1, E4.8) i **budowa liczby z klocków przeciąganiem** (E3.6, E4.1);
- **DATA** — diagram słupkowy (E3.4: najwięcej, najmniej, ile, o ile więcej);
- tryb **`select`** (zaznacz wszystkie liczby parzyste + „OK”) — gotowe umiejętności E1.6 i E3.7 wchodzą do rund;
- tryb **`drag`** (klocek z zasobnika na matę) — pierwszy gest przeciągania w grze.

PUZZLE_GRID, GRID, PERIMETER i „ustaw zegar” przeciąganiem wskazówek idą do nowej pozycji roadmapy **S-13b**
(`drawn-grid-tasks-e3-e4`, proposed); oś liczbowa, słupek pisemny, grafy i figury E1–E2 zostają w S-14. Format zapisu
zostaje **v1**.

## Current State Analysis

Z `research.md` (commit `bf5b81c`) i odczytu kodu w tym kroku:

- `Task` (`src/core/tasks/types.ts`): `visual?: unknown` — **nic go nie czyta**; `answer: number | string | number[]`,
  `choices?`, `check?`, `hint`, `speak?`, `tileRange?`.
- `roundView` (`src/core/round/view.ts`): `input: task.choices ? 'tiles' : 'keypad'` — tryb wywodzony z `choices`, nie ze
  `skill.answer`; zadanie `select` (ma `choices`) narysowałoby się jak zwykłe kafelki.
- `playable` (`src/core/round/pick.ts`): tylko `tiles`/`keypad` z generatorem; jedyny filtr dla `firstPlayableSteps`,
  `pickSkills`, `curriculum.ts` (`playableSteps`, `calendarStart`, `skillBuckets`, `unlockReady`) i `progress.ts`.
- `distinctTasks` (`src/core/round/unique.ts`): klucz `task.prompt`; `tests/contentInvariants.test.ts`: klucz
  `prompt|choices`, `MIN_DISTINCT` 12, `MAX_TOP_SHARE` 0.15. Stały prompt „Która godzina?” z różnymi tarczami byłby
  „duplikatem”.
- `generateTask` (`src/core/tasks/generateTask.ts`): jedyne wejście skill → task; dokłada kafelki liczbowe skillom `tiles`.
- `firstHint` (`src/core/round/hints.ts`) `leaksAnswer` sprawdza tylko odpowiedzi liczbowe.
- `UNBOUNDED_TYPES` (`src/core/tasks/bounds.ts`) = CALENDAR, ROMAN, NUMBER_WORDS.
- `captureFirstWrong` (`src/core/round.ts`) zapisuje tylko `given` number|string — odpowiedź tablicowa (`select`) nie trafia
  do historii, więc `validExample` (`src/core/save.ts`) nie odrzuci zapisu.
- `TaskScene` (`src/scenes/TaskScene.ts`): `render`, `hideTaskLayer(input: 'tiles' | 'keypad')`, `drawPrompt`,
  `promptBottom` → `SolutionSteps.show(bar, centerX, top, maxWidth)` pod promptem — **dokładnie w miejscu, gdzie stanie
  rysunek**; `snapshot` zwraca `answer` przez referencję; `answerSpot`, `targets`.
- `TASK_LAYOUT` (`src/data/layout.ts`): prompt (960,290) w 1300; `promptBeside` (620,290) w 800; kafelki od y 712;
  klawiatura x 1040–1556 od y 342; pasek y 864–960. Wolne pola: tryb kafelków — pas y ≈ 376–700 (kit `task-tiles.png`
  pole obrazków x 661–1261, y 356–690); tryb klawiatury — lewa kolumna x ≈ 236–1004, y ≈ 380–848.
- Krok puste (`skills: []`): E3.3, E3.4, E3.5, E4.3, E4.7. Umiejętności `select` już istnieją:
  `E1.6.even_odd_select_10`, `E3.7.select_even_30` (generator EVEN_ODD wariant `select` z `check` przez `sameSet`).
- Generatory importują `src/data/pl.ts`, `src/data/nouns.ts`, `src/data/calendar.ts` (wzorzec dla tekstów i etykiet).
- E2E: `tests/e2e/support/hook.ts` `Snapshot.input: 'tiles' | 'keypad'`, `answerRight`/`answerWrong`/`playTaskRight`
  znają tylko kafelki (równość wartości) i klawiaturę (liczba); `holdTouch` (CDP `Input.dispatchTouchEvent`) to wzór dla
  `dragTouch`. Sześć speców (`task-round`, `narrator`, `parent-settings`, `save-restart`, `save-transfer`,
  `error-boundary`) przez `passWelcome` gra E3 od kroku 11 z losowaniem z kroków 1–10. `playwright.config.ts`
  `ROUND_SPEC` — regex speców projektu `chromium-hook`. Szwy URL e2e: `?e2eMonth`, `?e2eFail`, `?e2eStars`, `?e2eSave`
  (markery w `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`).
- Testy przypięte do dzisiejszej kolejności kroków: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`,
  `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`, `tests/pick.test.ts`, `tests/roundView.test.ts`; e2e
  `first-launch.spec.ts` (8 lat, październik → E3 krok 6, po zmianie 4), `adaptive.spec.ts` (E4: odblokowanie 2→4, po
  zmianie 2→3, `expectedName` czytane z danych).
- `docs/design-gaps.md`: najwyższy wiersz 51; S-13 zaczyna od 52. `context/foundation/lessons.md` nie istnieje — żadna
  lekcja nie ma zastosowania.
- Baseline (kontrakt): `main` @ `b57433c`: unit `1247 passed`, e2e `37 passed`. Gałąź = main + same dokumenty; każda
  faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Zadanie z rysunkiem pokazuje prompt, rysunek (tarcza, linijka z odcinkiem, klocki, diagram) i odpowiedź: kafelki pod
  rysunkiem albo klawiaturę obok niego. Podpowiedź po pierwszym błędzie i kroki rozwiązania po drugim pojawiają się
  **obok** rysunku, który zostaje widoczny.
- Zadanie `select`: kafelki liczb przełączają zaznaczenie (kit `.answer.selected`), „OK” zatwierdza zbiór; zły zbiór →
  podpowiedź i druga próba jak w innych zadaniach.
- Zadanie `drag`: zasobnik (dziesiątka, jedność) i pusta mata; klocek przeciągnięty na matę zostaje, upuszczony poza
  matą wraca, stuknięcie klocka w zasobniku dokłada go, stuknięcie klocka na macie zdejmuje go; „OK” zatwierdza
  zbudowaną liczbę. Przerwany dotyk (system, drugi palec, dialog rodzica) nigdy nie kładzie klocka.
- Kroki E3.3, E3.4, E3.5, E4.3, E4.7 są grywalne i mają `childName`; E3.6, E3.11, E4.1, E4.8 dostają nowe umiejętności.
  Start kalendarzowy, odblokowania i pula „wcześniejsze” liczą się same przez `playable`.
- Treść: każdy nowy generator czysty, z parserem, testem 1000 losowań, inwariantami treści (z rysunkiem w kluczu
  unikalności) i odczytem nauczyciela z `npm run sample`, który drukuje rysunek jedną linią.
- Zapis v1 bez zmian; fixtury `tests/fixtures/save-v1*.json` nietknięte.
- E2E: nowy `tests/e2e/drawn-tasks.spec.ts` gra dotykiem zadanie z rysunkiem, `select` i `drag` (z przerwanym dotykiem).

### Key Discoveries:

- `playable` to jeden przełącznik dla całego programu — dopuszczenie `select`/`drag` to jedna linia, a jej zasięg to
  helpery e2e, nie `core` (research § Architecture Insights).
- Wbudowany drag Phasera liczy anulowany dotyk jako upuszczenie, a `Pointer.reset()` z przełącznika wejścia nie czyści jego
  stanu (odczyt źródła 4.2.1) → własny reduktor w `core` na surowych zdarzeniach, jak `longPress`/`roomGesture`.
- Marker szwu e2e jest szukany jako tekst w `dist/` — klucz rejestru dla wymuszonych umiejętności **nie może** nazywać się
  jak marker (patrz Critical Implementation Details).

## What We're NOT Doing

- PUZZLE_GRID (E3.5 kwadrat magiczny), GRID (E3.7 siatka, kodowanie), PERIMETER (E4.7 obwód), CLOCK „ustaw zegar”
  przeciąganiem wskazówek → **S-13b** (nowa pozycja roadmapy, `proposed`).
- Oś liczbowa, WRITTEN (słupek pisemny, od E5), ARROW_TABLE (grafy), COUNT/ORDINAL/SHAPES/PATTERN (E1–E2), MASS/CAPACITY
  i reszta grupy 3 → S-14 (już w jej zakresie).
- BONDS „połącz pary” i CHOOSE_OP z obrazkiem (follow-up S-03) — przeniesione z triggerem „S-13b or S-14”.
- Podświetlanie na rysunku w podpowiedzi (kit `.cup.counted`) — podpowiedzi tylko tekstowe; follow-up.
- Rysunek w podglądzie postępów rodzica (`MistakeExample` zostaje prompt + `given`); każda zmiana formatu zapisu.
- `drag` dla setek (E4.8) i regrupowanie 10 jedności → dziesiątka na macie.
- Wbudowany drag Phasera (`setDraggable`, `dropZone`).
- Zmiany w `deploy/`, `designs/`, `.claude/`; E2E w CI; integracja paczek grafiki.

## Implementation Approach

Trzy fazy czystej logiki test-first: (1) model rysunku i trybu odpowiedzi + unikalność + `sample`; (2) generatory CLOCK
i LENGTH; (3) generatory PLACE_VALUE i DATA. Generatory w fazach 2–3 nie trafiają jeszcze do danych programu (kolejność
kroków zmienia się raz, w fazie 6). Potem dwie fazy widżetów po dwa komponenty: (4) obszar rysunku w `TaskScene` +
`ClockFace` + `Ruler`; (5) `BaseTenBlocks` + `BarChart`. (6) nowe umiejętności w `E3.ts`/`E4.ts` z aktualizacją testów
przypiętych do kolejności i speców `first-launch`/`adaptive`. (7) tryb `select`: widżet + helpery e2e + szew `?e2eSkills` +
`playable` dopuszcza `select` — w jednej fazie. (8) reduktor przeciągania w `core` (tdd). (9) tryb `drag`: tacka i mata,
PLACE_VALUE „zbuduj”, helpery e2e, `playable` dopuszcza `drag`. (10) dokumentacja, follow-upy, seam sweep. (11) e2e (#11).
Plan-review F1 rozdzielił dawne fazy 5 (widżety + dane) i 8 (drag + dokumentacja + sweep).

**Reguła kolejności (research decyzja 5):** helpery e2e uczą się trybu w tej samej fazie (albo wcześniej), w której
`playable` go dopuszcza; testy i specy przypięte do kolejności kroków zmieniają się w tej samej fazie co dane. Każda faza
zostawia pełny zestaw zielony.

**Bramka lokalna** (kontrakt § Verification): komendy bez zmian. Faza 11 dopisuje `drawn-tasks` do `ROUND_SPEC`. E2E po
każdej fazie zwykle uruchamia orkiestrator (protokół request-file, profil § 8).

## Critical Implementation Details

**Kontrakt modelu (faza 1; zależą od niego wszystkie fazy).** Nowy `src/core/tasks/visual.ts`:

```ts
export type AnswerMode = SkillDef['answer'];   // 'tiles' | 'keypad' | 'drag' | 'select'
export type TaskVisual =
    | { kind: 'clock'; hour: number; minute: number }                    // hour 0–23 (12h dial draws hour % 12), minute 0–59
    | { kind: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; fromMm: number; toMm: number }  // segment in mm, always integers
    | { kind: 'blocks'; hundreds: number; tens: number; ones: number }   // each 0–9
    | { kind: 'bars'; bars: readonly { label: string; value: number }[]; scaleMax: number };
export const visualKey: (v: TaskVisual | undefined) => string;      // '' for none; stable, field order fixed
export const validateVisual: (v: TaskVisual) => string[];           // violations, [] when fine
export const describeVisual: (v: TaskVisual) => string;             // one line for sample: "[clock 15.00]", "[ruler 0–15 cm, 3–8 cm]"
```

`Task.visual?: TaskVisual`, `Task.input?: AnswerMode` — `generateTask` **zawsze** stempluje `input = skill.answer`;
`RoundView.input: AnswerMode = task.input ?? (task.choices ? 'tiles' : 'keypad')` (fallback tylko dla zadań budowanych ręcznie
w testach), `RoundView.visual: TaskVisual | null`. Klucz unikalności zadania = `` `${prompt}|${visualKey(visual)}` `` w
`distinctTasks` i (z `choices`) w inwariantach treści. Czas jako tekst: `formatTime(hour, minute)` w nowym
`src/core/text/time.ts` → `"15.00"`, `"7.05"`, `"0.30"` (kropka, minuty zawsze dwie cyfry; notacja ZADANIA § 4).

**Szew `?e2eSkills` (faza 7).** `e2eSkills(search): string[] | null` w `src/testing/e2eHook.ts` (lista id umiejętności po
przecinku); `src/main.ts` czyta go tylko w gałęzi `__E2E_HOOK__` i kładzie do rejestru pod kluczem
`REGISTRY_KEYS.forcedSkills = 'forcedSkills'` — **nie** `e2eSkills`, bo `REGISTRY_KEYS` jest w buildzie produkcyjnym, a
`checkE2EHook` szuka markerów jako tekstu. `TaskScene.freshRound` (nie rozgrzewka): gdy lista jest ustawiona i każde id
istnieje w bieżącym etapie i jest `playable` (plan-review F7: id trybu jeszcze niedopuszczonego nie może dojść do
`render`), skille rundy = te id powtarzane do długości rundy (5), inaczej zwykły dobór. Marker `e2eSkills`
dopisany do `E2E_HOOK_MARKERS`; `npm run build` drukuje `e2e hook: absent (`.

**Reduktor przeciągania (faza 8).** Nowy `src/core/blockDrag.ts`, wzór `src/core/longPress.ts`:
`BlockKind = 'hundred' | 'ten' | 'one'`; stan `{ mat: Record<BlockKind, number>; carrying: null | { pointerId; kind;
from: 'tray' | 'mat'; x; y; startX; startY; moved: boolean } }`; zdarzenia `down{pointerId,x,y}`, `move`, `up`, `cancel`,
`reset`; geometria wstrzyknięta jako czyste funkcje `trayAt(x,y): BlockKind | null`, `matBlockAt(x,y): BlockKind | null`,
`onMat(x,y): boolean` (z `src/core/round/dragLayout.ts`, jak `src/core/roomHit.ts`). Reguły: `down` na klocku zasobnika
lub maty zaczyna niesienie (`down` drugim palcem przy niesieniu = `cancel`); `move` powyżej
`balance.blockDrag.startDistance` ustawia `moved`; `up` z `moved` nad matą → klocek na macie (z zasobnika: +1 do limitu
`balance.blockDrag.maxPerKind` = 9; z maty: bez zmiany); `up` z `moved` poza matą → klocek z zasobnika wraca, klocek z maty
schodzi (−1); `up` bez `moved` = stuknięcie: zasobnik → +1, mata → −1; `cancel`/`reset` → `carrying = null`, mata bez
zmian (**anulowany dotyk nigdy nie kładzie ani nie zdejmuje klocka**). `matValue(mat) = 100·hundred + 10·ten + one`.
Scena: `pointerdown`/`pointermove`/`pointerup` na całej scenie, `pointerupoutside` i `wasCanceled` → `cancel`, przełącznik
wejścia (`inputSuspend`) i `sleep`/`wake` → `reset`; nowe zadanie → pusta mata.

**Rysunek a kroki rozwiązania (faza 4).** Jedna czysta funkcja `pictureLayout(input, solution: boolean)` w
`src/core/round/pictureLayout.ts` (prostokąty w przestrzeni 1920×1080 z liczb w `TASK_LAYOUT.picture`) daje prostokąt
rysunku i prostokąt linii rozwiązania: **kafelki** — bez rozwiązania rysunek na środku pasa (x 661–1261, y 356–690 jak
kit); z rozwiązaniem rysunek w lewej części pasa (x ≈ 236–860), linie po prawej (x ≈ 900–1684, ta sama górna krawędź);
**klawiatura** — rysunek w lewej kolumnie pod promptem (x ≈ 236–1004, y ≈ 380–848); z rozwiązaniem rysunek zmniejszony do
górnej części kolumny, linie pod nim (`SolutionSteps` już skaluje do `minScale` 0.6). Zadanie bez rysunku — dzisiejsze
położenie linii bez zmian. Widżety rysują się w podanym prostokącie (skala z mniejszego boku).

## Phase 1: Model rysunku i trybu odpowiedzi w `core`, unikalność i `sample`

Driver: tdd
Driver why: `TaskVisual`, `visualKey`, `Task.input` i klucz unikalności z rysunkiem nie istnieją — failing testy czystego modelu, `generateTask`, `roundView` i `distinctTasks` prowadzą zmianę bez sceny.

### Overview

Infrastruktura, od której zależy każda kolejna faza; żadna nowa umiejętność nie staje się grywalna.

### Changes Required:

#### 1. Model rysunku

**File**: `src/core/tasks/visual.ts` (nowy), `src/core/tasks/types.ts`

**Intent**: unia `TaskVisual`, `AnswerMode`, `visualKey`, `validateVisual`, `describeVisual` wg kontraktu modelu;
`Task.visual` zawężone z `unknown`, nowe `Task.input?`.

**Contract**: sygnatury z Critical Implementation Details. `validateVisual`: `clock` godzina 0–23, minuta 0–59; `ruler`
`0 ≤ fromMm < toMm ≤ lengthCm·10`, `unit 'cm'` ⇒ `fromMm`, `toMm` podzielne przez 10; `blocks` każda liczba 0–9, suma > 0;
`bars` 2–5 słupków, etykiety różne i niepuste, `0 ≤ value ≤ scaleMax`.

#### 2. Tryb odpowiedzi na zadaniu

**File**: `src/core/tasks/generateTask.ts`, `src/core/round/view.ts`

**Intent**: `generateTask` stempluje `input: skill.answer` na każdym zadaniu (przed i po dołożeniu kafelków); `roundView`
bierze tryb z zadania, dodaje `visual`. Zamyka follow-up S-04 „carry the mode on Task”.

**Contract**: `RoundView.input: AnswerMode`, `RoundView.visual: TaskVisual | null`.

#### 3. Scena i hak — tylko typy

**File**: `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: typy szersze o `select`/`drag` (`hideTaskLayer`, `drawPrompt`, `TaskSnapshot.input`, `Snapshot.input`);
`TaskScene.render` rzuca `Error('Unsupported input mode …')` dla `select`/`drag` (nieosiągalne: `playable` ich nie
dopuszcza; granica błędów pokaże kartę) — usunięte w fazach 7 i 9.

#### 4. Unikalność, walidacja, czas, `sample`

**File**: `src/core/round/unique.ts`, `src/core/tasks/validate.ts`, `src/core/text/time.ts` (nowy), `scripts/sample.ts`,
`tests/contentInvariants.test.ts`

**Intent**: `distinctTasks` porównuje `prompt|visualKey`; `validateTask` dokłada `validateVisual`, gdy `visual` jest;
`formatTime`; `sample` drukuje linię `visual: <describeVisual>` pod promptem, gdy zadanie ma rysunek; klucz inwariantów
`prompt|visualKey|choices`.

#### 5. Testy

**File**: `tests/visual.test.ts` (nowy), `tests/time.test.ts` (nowy), `tests/generateTask.test.ts`, `tests/roundView.test.ts`,
`tests/curriculumPick.test.ts` (testy `distinctTasks`), `tests/validate.test.ts`

**Intent**: `visualKey` — różna minuta/odcinek/słupek → różny klucz, ta sama treść w innym obiekcie → ten sam klucz,
`undefined` → `''`; `validateVisual` — po jednym przypadku złym na regułę; `formatTime(15,0)='15.00'`, `(7,5)='7.05'`,
`(0,30)='0.30'`; każde zadanie z `generateTask` ma `input === skill.answer` (wszystkie umiejętności E1–E6, w tym obie
`select`); `roundView` dla zadania `select` → `input 'select'`, dla zadania bez `input` → fallback; `distinctTasks` nie
losuje ponownie zadania o tym samym prompcie i innym `visual`, losuje przy identycznym. `pick.test.ts` „never returns
select or drag” zostaje (playable bez zmian).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie brak eksportu — stub najpierw), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `distinctTasks` z kluczem samego `prompt` → test „ten sam prompt, inny rysunek” czerwony; `generateTask` bez stempla `input` → test trybu czerwony; `visualKey` pomija `minute` → test klucza czerwony; przywrócone; meta-check: oczekiwania z research § 1–2, nie z implementacji
- `npm run sample -- E3` bez zmian w wyjściu poza brakiem regresji (żaden generator nie ma jeszcze rysunku); `git diff --stat tests/fixtures/` pusty
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `src/core/tasks/visual.ts` bez Phasera i globali; `TaskVisual` niesie tylko liczby i etykiety (bez kolorów i pikseli)

---

## Phase 2: Generatory CLOCK i LENGTH

Driver: tdd
Driver why: generatory CLOCK i LENGTH nie istnieją — failing testy 1000 losowań, parsera i przypadków brzegowych (północ, przejście przez 12, odcinek nie od zera) prowadzą czyste funkcje `(skill, rng) => Task`.

### Overview

Dwa typy z rysunkiem, jeszcze bez danych programu (kroki zmieniają się w fazie 6).

### Changes Required:

#### 1. CLOCK

**File**: `src/core/tasks/generators/clock.ts` (nowy), `src/core/tasks/registry.ts`, `src/core/tasks/bounds.ts`

**Intent**: warianty `read` (tarcza → która godzina), `later` (tarcza → która będzie za `n` godzin, `n` 1–`maxShift`,
z przejściem przez 12), `h24` (popołudniowa godzina na tarczy → zapis 24-godzinny 13.00–23.00). `minuteStep` 60 (pełne
godziny), 30, 15, 5. **Dziedzina godzin (plan-review F4):** `read` i `later` losują `hour` 1–12 (tarcza 12-godzinna,
dwunasta to „12.00”, nigdy „0.00”), `later` liczy modulo 12 z wynikiem 1–12 (11.00 + 2 → 1.00, 10.00 + 2 → 12.00); `h24`
losuje 13–23 (tarcza rysuje `hour % 12`, prompt mówi „po południu”), dystraktor „bez 12” (3.00 zamiast 15.00) jest
obowiązkowy. Odpowiedź tekstem `formatTime`, **3 kafelki** (`choices`, ZADANIA „wybór z 3”); dystraktory: zamienione
wskazówki (gdy dają poprawny czas), ±1 godzina, ±`minuteStep`; różne, w zakresie. Rysunek `clock`. `speak` nazywa rysunek
bez czasu („Popatrz na zegar. Która godzina?”). Podpowiedzi: krótka wskazówka → godzina, długa → minuty, ostatnia zawiera
odpowiedź. CLOCK dopisany do `UNBOUNDED_TYPES` (ograniczony własnymi parametrami).

**Contract**: parametry `{ variant: 'read' | 'later' | 'h24'; minuteStep: 60 | 30 | 15 | 5; maxShift?: number }`; parser
odrzuca nieznany wariant, `minuteStep` spoza listy, `later` bez `maxShift` 1–11, `h24` z `minuteStep` ≠ 60.

#### 2. LENGTH

**File**: `src/core/tasks/generators/length.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: warianty `ruler` (linijka `lengthCm`, odcinek od `fromMm` do `toMm`; `unit 'cm'` — końce na pełnych cm,
odpowiedź w cm; `unit 'mm'` — końce na mm, odpowiedź w mm; odcinek może nie zaczynać się od zera z prawdopodobieństwem
`startShift`) i `convert` (tekst „1 m 20 cm to ile centymetrów?” → cm, bez rysunku). Klawiatura (liczby całkowite —
brak przecinka na klawiaturze). Podpowiedzi metodą szkolną: „Odczytaj, gdzie odcinek się zaczyna i gdzie kończy”, „8 − 3 =
5”, ostatnia z odpowiedzią i jednostką.

**Contract**: `{ variant: 'ruler'; unit: 'cm' | 'mm'; lengthCm: number; minMm: number; maxMm: number; startShift: number }
| { variant: 'convert'; maxM: number; cmStep: number }`; parser odrzuca odcinek dłuższy niż linijka, `unit 'cm'` z
`minMm`/`maxMm` niepodzielnymi przez 10, `startShift` spoza 0–1.

#### 3. Teksty, rzeczowniki, wycieki podpowiedzi

**File**: `src/data/pl.ts`, `src/data/nouns.ts`, `src/core/round/hints.ts`, `tests/contentInvariants.test.ts`

**Intent**: `pl.tasks.clock*`, `pl.tasks.length*` (prompty, `speak`, podpowiedzi); rzeczowniki `godzina`, `minuta`,
`centymetr`, `milimetr`, `metr` z biernikiem (dopisane tylko te użyte w tekstach). `leaksAnswer` sprawdza też odpowiedź
tekstową (pierwsza podpowiedź zawierająca `"15.00"` jest wstrzymana); reguła inwariantu „ostatnia podpowiedź zawiera
odpowiedź” przyjmuje odpowiedź tekstową.

#### 4. Testy

**File**: `tests/clock.test.ts` (nowy), `tests/length.test.ts` (nowy), `tests/hints.test.ts` (klucze rejestru sprawdza istniejący `tests/contentInvariants.test.ts`)

**Intent**: `forEachDraw` (20 ziaren × 50) dla każdego wariantu na syntetycznych umiejętnościach z parametrami
planowanymi dla E3/E4 (tabela w fazie 6): odpowiedź przeliczona z rysunku niezależnie (wyrocznia z `hour`/`minute`/`fromMm`
/`toMm`, nie z implementacji), `validateTask` + `validateVisual` bez naruszeń, odpowiedź wśród 3 różnych kafelków, `later`
przez 12 (11.00 + 2 → 1.00), `h24` 13–23, `read`/`later` tylko 1–12 (nigdy „0.00”), odcinek nie od zera występuje; parser odrzuca każdy zły przypadek z kontraktu;
`firstHint` dla zadania CLOCK z czasem w pierwszej podpowiedzi → `null`. `tests/hints.test.ts`: `try/catch { continue }`
wokół losowania liczy pominięcia i oczekuje ich dokładnej liczby (follow-up `Trigger: next change to tests/hints.test.ts`,
archiwum `2026-10-12-task-round-stars` — ta faza go uruchamia; plan-review F3).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `later` liczy bez przejścia przez 12 (`hour + n`) → test „11.00 + 2” czerwony; `ruler` liczy od zera zamiast od `fromMm` → wyrocznia czerwona; `leaksAnswer` znów tylko liczbowy → test wycieku czerwony; przywrócone; meta-check: wyrocznia liczy z pól rysunku, nie z `task.answer`
- Klucze `generators` i `parsers` w rejestrze równe (istniejący test zielony)
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów `pl.tasks.clock*`/`length*` i po 6 losowań na wariant wydrukowanych z testu (`sample` pokaże je dopiero w fazie 6): odmiana („za 2 godziny”, „5 centymetrów”), podpowiedzi uczą metody bez wyniku w pierwszym kroku, dystraktory bliskie i jednoznaczne

---

## Phase 3: Generatory PLACE_VALUE (odczyt i budowa) i DATA

Driver: tdd
Driver why: PLACE_VALUE i DATA nie mają generatorów — failing testy 1000 losowań, wyrocznie z pól rysunku i parsery (remis w diagramie, zero dziesiątek, limit 9 klocków) prowadzą czyste funkcje.

### Overview

Pozostałe dwa typy; wariant `build` jest gotowy w `core`, choć tryb `drag` dojdzie w fazie 9.

### Changes Required:

#### 1. PLACE_VALUE

**File**: `src/core/tasks/generators/placeValue.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: warianty `read` (klocki → „Jaka to liczba?”, klawiatura), `tens` (klocki → „Ile dziesiątek?”, klawiatura),
`decompose` (tekst „47 = 40 + □”, klawiatura, bez rysunku), `build` („Zbuduj z klocków liczbę 23.”, odpowiedź liczba, bez
rysunku — mata startuje pusta, tryb `drag`). Rysunek `blocks` z rozkładu liczby (każda cyfra ≤ 9 z definicji). Liczby
`min`–`max` z parametrów; zero jedności i zero dziesiątek występują. Podpowiedzi: „Policz dziesiątki: 2 dziesiątki to 20”,
„Dodaj jedności: 20 + 3”, ostatnia z odpowiedzią.

**Contract**: `{ variant: 'read' | 'tens' | 'decompose' | 'build'; min: number; max: number }`; parser odrzuca
`max > 999`, `min > max`, `build` z `max > 99` (decyzja: budowa bez setek).

#### 2. DATA

**File**: `src/core/tasks/generators/data.ts` (nowy), `src/data/charts.ts` (nowy), `src/core/tasks/registry.ts`

**Intent**: diagram słupkowy `bars` z 3–4 słupkami, wartości `1`–`maxValue`; warianty `most`, `least` (kafelki z
etykietami, wartości różne — bez remisu na szczycie i na dnie), `howMany` („Ile dzieci wybrało jabłka?”, klawiatura),
`diff` („O ile więcej … niż …?”, klawiatura, różnica > 0). Etykiety i zdania z `src/data/charts.ts` (tematy: ulubiony
owoc, zwierzę, kolor — każdy rzeczownik w `src/data/nouns.ts` z odmianą użytą w prompcie). `scaleMax` = `maxValue`.

**Contract**: `{ variant: 'most' | 'least' | 'howMany' | 'diff'; maxValue: number; bars: 3 | 4 }`; parser odrzuca
`maxValue < bars` (nie da się różnych wartości), `maxValue > 20`.

#### 3. Teksty i rzeczowniki

**File**: `src/data/pl.ts`, `src/data/nouns.ts`

**Intent**: `pl.tasks.placeValue*`, `pl.tasks.data*`; rzeczowniki `setka` i nazwy z `charts.ts` z biernikiem.

#### 4. Testy

**File**: `tests/placeValue.test.ts` (nowy), `tests/data.test.ts` (nowy)

**Intent**: `forEachDraw` dla każdego wariantu z parametrami z tabeli fazy 6: odpowiedź = `100·h + 10·t + o` z pól
rysunku; `tens` = `t`; `decompose` się zgadza; `build` bez rysunku, odpowiedź w `min`–`max`; DATA: odpowiedź `most`/`least`
liczona z `bars` (jedyne maksimum/minimum), `diff` = różnica wartości nazwanych w prompcie, `validateVisual` bez naruszeń;
parser odrzuca każdy zły przypadek.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: DATA dopuszcza remis wartości → test „jedyne maksimum” czerwony; `read` składa `10·h + t + o` → wyrocznia czerwona; parser przyjmuje `build` z `max` 150 → test parsera czerwony; przywrócone; meta-check: wyrocznia z pól rysunku
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów `pl.tasks.placeValue*`/`data*` i `src/data/charts.ts` (6 losowań na wariant z testu): „2 dziesiątki i 3 jedności”, „O ile więcej dzieci wybrało…”, sensowne tematy, rodzaj gramatyczny i odmiana

---

## Phase 4: Obszar rysunku w `TaskScene`, `ClockFace` i `Ruler`

Driver: impl
Driver why: dwa nowe widżety Phaser Graphics i sklejka w `TaskScene` (obszar rysunku, kroki rozwiązania obok rysunku) — zachowanie widać tylko na płótnie; czysta geometria `pictureLayout` dostaje test jednostkowy, reszta dowód w zrzutach i e2e fazy 11.

### Overview

Pierwszy rysunek na ekranie zadania; rysunki CLOCK i LENGTH gotowe na dane z fazy 6.

### Changes Required:

#### 1. Geometria

**File**: `src/core/round/pictureLayout.ts` (nowy), `src/data/layout.ts`, `tests/pictureLayout.test.ts` (nowy)

**Intent**: `pictureLayout(input, solution)` wg Critical Implementation Details; liczby w `TASK_LAYOUT.picture` (prostokąty
z kitu). Test: prostokąty w notesie (x 196–1724, y 220–976), rysunek nie nachodzi na kafelki/klawiaturę/pasek, z
rozwiązaniem linie i rysunek rozłączne.

**Contract**: `pictureLayout(input: AnswerMode, solution: boolean): { picture: Rect; lines: Rect | null }`
(`lines: null` = dzisiejsze położenie linii).

#### 2. Widżety

**File**: `src/ui/widgets/ClockFace.ts` (nowy), `src/ui/widgets/Ruler.ts` (nowy), `src/ui/widgets/TaskPicture.ts` (nowy, cienki
dyspozytor)

**Intent**: `ClockFace` wg `reference/clock.svg` (karta, obręcz, 60 kresek: co 5 min 4 px, minutowe 2 px, cyfry 1–12,
wskazówka godzinowa krótka/gruba teal, minutowa długa `#54BEB4`, piasta; godzina wskazówki uwzględnia minuty); `Ruler` wg
`reference/ruler.svg` (korpus maślany, cm co 56 px skalowane do prostokąta, kreski cm/pół cm, mm dla `unit 'mm'`, cyfry
cm), nad linijką odcinek z końcami (DESIGN-GAP 56). `TaskPicture.render(visual | null, rect)` wybiera widżet; rodzaje
`blocks`/`bars` rysują prostokąt-placeholder z etykietą do fazy 5 (dane programu dopiero w fazie 6, po widżetach). Kolory z `PLACEHOLDER_COLORS`/palety kitu w
`src/data/layout.ts`.

**Contract**: wzorzec widżetów: `constructor(scene)`, `render(...)` czyści i rysuje, `setVisible`, `bounds(): Rect` dla haka.

#### 3. Scena

**File**: `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`

**Intent**: `TaskPicture` tworzony w `create`, dołączony do `hideTaskLayer`; `render` rysuje rysunek przy zmianie zadania i
przy wejściu/wyjściu z rozwiązania (prostokąt z `pictureLayout`); `SolutionSteps.show` dostaje prostokąt linii, gdy jest;
prompt przy rysunku w trybie kafelków bez zmian (nad pasem). Hak: `snapshot.visual` (kopia) i `targets.picture`
(`bounds()` albo `null`), `snapshot.answer` kopiowany (tablica → nowa tablica; follow-up S-04 „answer by reference”).

#### 4. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersz 52 (rysunek obok klawiatury — kit ma tylko obrazki nad kafelkami), 56 (odcinek mierzony nad linijką),
57 (kroki rozwiązania obok rysunku — kit `solution-step-*.png` bez rysunku); komentarze `DESIGN-GAP 52/56/57` w kodzie.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`pictureLayout`); e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- Deliberate break: `pictureLayout` z rozwiązaniem zwraca te same prostokąty co bez → test rozłączności czerwony; przywrócone; meta-check: test geometrii nie dowodzi, że scena go używa — to dowodzą zrzuty i e2e fazy 11
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [visual] Zrzuty (szew `?e2eSkills` jeszcze nie istnieje — umiejętności CLOCK/LENGTH podpięte lokalnie w pliku `*.local`, nie commitowane, albo zrzuty przeniesione do fazy 6 — wiersz 6.8): tarcza w trybie kafelków (pełna godzina i 7.45), tarcza z paskiem podpowiedzi, tarcza z krokami rozwiązania obok, linijka cm z odcinkiem nie od zera (klawiatura), linijka mm, linijka z krokami rozwiązania — 1440×900 i 1024×768
- [reviewer] Widżety bez tekstów i liczb balansu w kodzie (teksty z `pl`, geometria z `layout.ts`); `TaskPicture` w `hideTaskLayer`
- [human] Decyzja wbrew podpisowi kitu `reference/clock.svg` („3:30”): czasy w grze zapisane kropką wg ZADANIA § 4 („15.00”, „7.30”)

---

## Phase 5: `BaseTenBlocks` i `BarChart`

Driver: impl
Driver why: dwa nowe widżety Phaser Graphics bez zmiany danych — zachowanie widać tylko na płótnie; dowód w bramce, zrzutach fazy 6 (gdy dane istnieją) i e2e fazy 11.

### Overview

Wszystkie cztery rysunki odczytu gotowe przed danymi programu; `TaskPicture` bez placeholderów. Plan-review F1: dawna faza 5
(dwa widżety + dane + testy przypięte + dwa specy e2e) rozdzielona na tę fazę i fazę 6.

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/BaseTenBlocks.ts` (nowy), `src/ui/widgets/BarChart.ts` (nowy), `src/ui/widgets/TaskPicture.ts`

**Intent**: `BaseTenBlocks` wg `reference/base-ten.svg` (płytka 100 z siatką 10×10, pręt 10 z 10 komórkami, kostka 1,
kontur teal 4 px; grupy setki | dziesiątki | jedności od lewej, zawijanie, gdy się nie mieszczą); `BarChart` (DESIGN-GAP 53:
oś pionowa 0–`scaleMax` z liniami siatki co 1 lub 2, słupki w kolorach `PLACEHOLDER_COLORS`, etykiety pod słupkami,
wartości **bez** podpisów nad słupkami — dziecko odczytuje z osi). `TaskPicture` bez placeholderów.

**Contract**: wzorzec widżetów z fazy 4; `BaseTenBlocks` eksportuje czystą geometrię klocka (rozmiar komórki), z której
skorzysta mata w fazie 9.

#### 2. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersz 53 (diagram słupkowy — brak referencji); komentarz `DESIGN-GAP 53` w `BarChart`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` lub `+ N` (test czystej geometrii klocka, jeśli wydzielona); e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- `TaskPicture` bez gałęzi placeholdera (`grep -n "placeholder" src/ui/widgets/TaskPicture.ts` pusty); `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Widżety bez tekstów i liczb balansu w kodzie (geometria z `layout.ts`); geometria klocka wyeksportowana dla maty; wiersz DESIGN-GAP 53

---

## Phase 6: Nowe kroki grywalne E3/E4 — dane programu, testy przypięte do kolejności i e2e

Driver: impl
Driver why: zmiana danych programu, która przestawia kolejność kroków — dowód w zaktualizowanych testach przypiętych do kolejności (wyrocznia startu liczona ręcznie), inwariantach treści, odczycie nauczyciela i e2e `first-launch`/`adaptive`; generatory i widżety już istnieją.

### Overview

Kroki E3.3, E3.4, E3.5, E4.3, E4.7 grywalne (tryby `tiles`/`keypad` — helpery e2e już je znają: `answerRight`/`answerWrong`
porównują wartości kafelków bez względu na typ, więc kafelki tekstowe „15.00” i etykiety diagramu działają). Jedyna faza,
która zmienia kolejność kroków.

### Changes Required:

#### 1. Dane programu

**File**: `src/data/curriculum/E3.ts`, `src/data/curriculum/E4.ts`

**Intent**: nowe umiejętności (id wg konwencji `E<etap>.<krok>.<nazwa>`) i `childName` nowych kroków:

| Krok | `childName` | Umiejętności (typ, parametry, tryb) |
|---|---|---|
| E3.3 | „Zegar: pełne godziny” | `clock_read_full` CLOCK `{read, 60}` tiles; `clock_later_full` CLOCK `{later, 60, maxShift 3}` tiles |
| E3.4 | „Diagramy” | `data_most_10` DATA `{most, 10, 4}` tiles; `data_least_10` `{least, 10, 4}` tiles; `data_howmany_10` `{howMany, 10, 3}` keypad; `data_diff_10` `{diff, 10, 3}` keypad |
| E3.5 | „Mierzenie odcinków” | `length_ruler_cm_15` LENGTH `{ruler, cm, 15, 20, 120, 0.4}` keypad |
| E3.6 | (jest) | + `place_read_30` PLACE_VALUE `{read, 11, 30}` keypad; `place_tens_30` `{tens, 11, 30}` keypad |
| E3.11 | (jest) | + `clock_24h` CLOCK `{h24, 60}` tiles |
| E4.1 | (jest) | + `place_read_100` `{read, 20, 99}` keypad; `place_decompose_100` `{decompose, 21, 99}` keypad |
| E4.3 | „Zegar: minuty, pół godziny, kwadrans” | `clock_read_half` CLOCK `{read, 30}` tiles; `clock_read_quarter` `{read, 15}` tiles; `clock_read_5` `{read, 5}` tiles |
| E4.7 | „Metry, centymetry, milimetry” | `length_ruler_mm_10` LENGTH `{ruler, mm, 10, 11, 95, 0.3}` keypad; `length_convert_m` `{convert, 5, 10}` keypad |
| E4.8 | (jest) | + `place_read_1000` `{read, 100, 999}` keypad |

`childName` i nazwy w tabeli to propozycja; odczyt nauczyciela może je poprawić (zmiana bez wpływu na kolejność).

#### 2. Testy przypięte do kolejności i e2e

**File**: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/curriculumEnd.test.ts`,
`tests/progress.test.ts`, `tests/warmup.test.ts`/`tests/placement.test.ts` (jeśli przypinają krok startu),
`tests/e2e/first-launch.spec.ts`, `tests/e2e/adaptive.spec.ts`

**Intent**: grywalne kroki E3 `[1..11]`, E4 `[1..8]` (`playableSteps` w `tests/curriculumStart.test.ts`); `ORACLE` startu
kalendarzowego dla E3/E4 przeliczony ręcznie z reguły D (`k = min(n, max(minStartSteps, ceil(progress·n)))`) — tabela
research § 3 (a) jako wyrocznia, nie z implementacji (research wyprowadził ręcznie tylko październik — pozostałe miesiące
wiersza liczone ręcznie w tej fazie i zapisane w komentarzu testu); `startLearning` → `unlockedStep.E3` 4 (październik);
„earlier” przy E3 kroku 6 = kroki 1–5; testy „nieodgrywalny krok odblokowany” przeniesione na krok, który zostaje pusty
(np. E2.2 albo E5.5 — sprawdzone grepem `skills: []`); odblokowania E3 2→3, E4 2→3, 6→7; postęp „E3 ma 11 kroków”. E2E:
`first-launch` (8 lat, październik → E3 krok 4 po rozgrzewce), `adaptive` (E4: następny krok 3, nazwa z `childName`).
Fixtura `tests/fixtures/save-v1.json` bez zmian (jej `pendingUnlock {E3, 3}` staje się prawdziwą kartą — test ładowania
zostaje zielony).

#### 3. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersz 58 (podgląd błędów rodzica bez rysunku: „Która godzina?” bez tarczy, `MistakeExample` bez zmiany
formatu).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (inwarianty treści obejmują nowe umiejętności automatycznie)
- `npm run sample -- E3 --count 6` i `npm run sample -- E4 --count 6` bez naruszeń; każde zadanie nowej umiejętności drukuje linię `visual:` (poza `decompose`, `convert`)
- Żaden krok z typem grupy 1 nie jest pusty (istniejący inwariant); kroki E3.3, E3.4, E3.5, E4.3, E4.7 mają `childName` (nowy test: każdy grywalny krok ma `childName`)
- Deliberate break: usunięty `childName` E4.3 → nowy test czerwony (i `adaptive.spec` czerwony na karcie — orkiestrator); E3.4 z powrotem `skills: []` → `playableSteps` E3 i wiersz `ORACLE` E3 czerwone; przywrócone; meta-check: wyrocznia startu liczona ręcznie z reguły D, a przerwa zmienia dane, nie stałą `RULES` testu (plan-review F2: zmiana `minStartSteps` w `balance.ts` nie czerwieni testu, który ma własne `RULES`)
- E2E (orkiestrator, `e2e-request-p6.md`): `first-launch.spec.ts` i `adaptive.spec.ts` zielone; pełne `npx playwright test` `<baseline gałęzi e2e> + 0`
- `git diff --stat tests/fixtures/` pusty; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E3 --count 6` i `E4 --count 6` dla kroków E3.3, E3.4, E3.5, E3.6, E3.11, E4.1, E4.3, E4.7, E4.8 (każde zadanie, z linią rysunku): poprawność odczytu, odmiana, biernik, podpowiedzi bez wyniku w pierwszym kroku, dystraktory zegara jednoznaczne, `childName` zrozumiałe dla 8-latka
- [visual] Zrzuty: klocki odczyt (E3.6 i E4.8 z setkami, klawiatura), diagram `most` (kafelki z etykietami) i `diff` (klawiatura), diagram z krokami rozwiązania, karta „Nowa umiejętność!” z `childName` E3.3; oraz zrzuty zegara/linijki z fazy 4 (4.4), jeśli tam nie powstały — 1440×900 i 1024×768
- [human] Decyzja wbrew literze roadmapy S-13 („oś liczbowa, słupek pisemny, grafy i figury”): S-13 dostarcza zegar, linijkę, klocki i diagram; PUZZLE_GRID, GRID, PERIMETER, „ustaw zegar” → S-13b; oś, słupek pisemny, grafy, figury E1–E2 → S-14; DATA wchodzi, choć nie ma go w liście grupy 2 planu § 11 M6

---

## Phase 7: Tryb `select` — zaznaczanie kafelków, helpery e2e i szew `?e2eSkills`

Driver: impl
Driver why: nowy widżet zaznaczania i sklejka w `TaskScene`/haku/helperach e2e; logika poprawności już istnieje (`check` przez `sameSet` w EVEN_ODD) — czysty stan zaznaczenia to jedna funkcja z testem, dowód przepływu w e2e fazy 11.

### Overview

Dwie gotowe umiejętności `select` (E1.6, E3.7) wchodzą do rund. Helpery e2e uczą się `select` w tej samej fazie, w której
`playable` go dopuszcza.

### Changes Required:

#### 1. Stan zaznaczenia

**File**: `src/core/round/select.ts` (nowy), `tests/select.test.ts` (nowy)

**Intent**: `toggleSelected(selected: readonly (number|string)[], value): (number|string)[]` (kolejność wg kafelków),
`selectionAnswer(selected): number[]` (posortowane); pusty zbiór przy „OK” to zwykła odpowiedź (zła, gdy są parzyste).

#### 2. Widżet

**File**: `src/ui/widgets/SelectTiles.ts` (nowy)

**Intent**: kafelki jak `AnswerTiles` (ta sama geometria `tileRow`), stuknięcie przełącza stan „zaznaczony” (kit
`.answer.selected`: tło `#d7ebc1`, ramka `#547e3d`, znaczek ✓ — kolory w `layout.ts`), przycisk „OK” w stylu OK klawiatury
(istniejący `pl.round.okKey` — bez nowego słowa) wyśrodkowany pod kafelkami nad paskiem; `markHint`
w `retype` zaznacza poprawne. DESIGN-GAP 54 (rewizja wiersza 7).

**Contract**: `constructor(scene, onSubmit: (value: number[]) => void)`, `setChoices`, `setActive`, `setVisible`,
`targets(): { value; x; y }[]`, `okTarget()`, `selected()`.

#### 3. Scena, hak, `playable`

**File**: `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`, `src/core/round/pick.ts`, `tests/pick.test.ts`

**Intent**: tryb `select` w `render`/`hideTaskLayer`/`answerSpot` (gwiazdka leci z „OK”); zaznaczenie czyszczone przy nowym
zadaniu i po złej odpowiedzi; usunięty `throw` dla `select`. Hak: `snapshot.selected`, `targets.selectTiles`,
`targets.selectOk`. `playable` dopuszcza `select`; `pick.test.ts` „never returns select or drag” → „never returns drag”,
nowy test: umiejętności `select` E1.6/E3.7 są w puli.

#### 4. Szew `?e2eSkills`

**File**: `src/testing/e2eHook.ts`, `src/main.ts`, `src/data/layout.ts` (`REGISTRY_KEYS.forcedSkills`),
`src/scenes/TaskScene.ts` (`freshRound`), `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts`

**Intent**: wg Critical Implementation Details. Marker `e2eSkills` w `E2E_HOOK_MARKERS`.

#### 5. Helpery e2e

**File**: `tests/e2e/support/hook.ts`

**Intent**: `Snapshot.selected`, `Targets.selectTiles/selectOk`; `answerRight` dla `select` — stuka kafelki z `answer`
(tablica) i „OK”; `answerWrong` — stuka jeden kafelek spoza `answer` (zawsze istnieje: EVEN_ODD ma nieparzyste) i „OK”,
zwraca podany zbiór; typ zwrotu `answerWrong` poszerzony. `playTaskRight`/`playRoundRight` działają dla `select`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- E2E (orkiestrator, `e2e-request-p7.md`): pełne `npx playwright test` `<baseline gałęzi e2e> + 0` — sześć speców z losowaniem E3 zielonych z `select` w puli; dodatkowo raz `npx playwright test tests/e2e/task-round.spec.ts` z lokalną (niecommitowaną) zmianą wywołania w specu na `passWelcome(page, { e2eSkills: 'E3.7.select_even_30' })` (`passWelcome` już przyjmuje `query`) — zielony (dowód helpera przed fazą 11)
- `npm run build` drukuje `e2e hook: absent (`; `grep -c e2eSkills dist/_app/*.js` = 0
- Deliberate break: `toggleSelected` nie zdejmuje zaznaczenia → test czerwony; marker `e2eSkills` usunięty z `E2E_HOOK_MARKERS` przy kluczu rejestru nazwanym `e2eSkills` → strażnik buildu nie łapie wycieku (meta-check: dlatego klucz rejestru ma inną nazwę; zapis w handoff §3); przywrócone

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.tasks.selectEven`/`selectEvenHint` w E1.6 i E3.7 (`npm run sample -- E1 --count 6`, `E3`); `answerWrong` dla `select` nie zależy od kolejności kafelków
- [visual] Zrzuty: `select` przed stuknięciem, z dwoma zaznaczonymi, po złym zbiorze (pasek podpowiedzi), w krokach rozwiązania i w `retype` (zaznaczone poprawne) — 1440×900 i 1024×768

---

## Phase 8: Reduktor przeciągania klocków w `core`

Driver: tdd
Driver why: `blockDrag` i geometria zasobnika/maty nie istnieją — failing testy sekwencji zdarzeń (anulowany dotyk, drugi palec, upuszczenie poza matą, limit 9, stuknięcie) prowadzą czysty reduktor przed jakąkolwiek sceną.

### Overview

Cała logika gestu `drag` testowalna bez przeglądarki (wzór `longPress`/`roomGesture`).

### Changes Required:

#### 1. Reduktor i geometria

**File**: `src/core/blockDrag.ts` (nowy), `src/core/round/dragLayout.ts` (nowy), `src/data/balance.ts`, `src/data/layout.ts`

**Intent**: wg Critical Implementation Details; `dragLayout(kinds: BlockKind[])` daje prostokąty zasobnika (po jednym na
rodzaj), maty i pozycje klocków na macie (kolumny wg rodzaju) oraz punkty wewnętrzne do e2e (`interiorPoint`, jak
`roomHit.holdPoint`). Tryb `drag` ma własny układ: zasobnik w prawej części notesu (x ≈ 1240–1680, w miejscu
klawiatury), mata w lewej (x ≈ 236–1180, y ≈ 380–840), „OK” pod zasobnikiem.
`balance.blockDrag = { startDistance: 12, maxPerKind: 9 }`.

**Contract**: `stepBlockDrag(state, event, geo): BlockDragState`, `matValue(mat): number`, `emptyMat()`,
`dragLayout(kinds): { tray: Record<BlockKind, Rect>; mat: Rect; ok: Rect; matBlock(kind, i): Rect }`.

#### 2. Testy

**File**: `tests/blockDrag.test.ts` (nowy), `tests/dragLayout.test.ts` (nowy)

**Intent**: zasobnik → przesunięcie → `up` nad matą → +1; `up` poza matą → bez zmiany; `cancel` w trakcie → bez zmiany
(i `carrying` null); drugi palec → `cancel`; `move` innego `pointerId` ignorowany; stuknięcie zasobnika +1, stuknięcie
klocka maty −1; klocek z maty upuszczony poza matą −1; 10. dziesiątka → mata zostaje 9; `reset` po przełączniku wejścia;
`matValue({ten:2, one:3})` = 23. Geometria: prostokąty w notesie, rozłączne, punkt wewnętrzny w środku z marginesem,
9 klocków każdego rodzaju mieści się na macie.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `cancel` traktowany jak `up` → test „przerwany dotyk nie kładzie klocka” czerwony; brak limitu `maxPerKind` → test 10. dziesiątki czerwony; `up` bez progu `moved` jako upuszczenie z maty → test stuknięcia czerwony; przywrócone; meta-check: oczekiwania z research § 7, nie z implementacji
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `blockDrag.ts` bez Phasera i globali; zdarzenia surowe (bez `drag`/`drop` Phasera); liczby w `balance.ts`

---

## Phase 9: Tryb `drag` — zasobnik i mata, PLACE_VALUE „zbuduj”, helpery e2e

Driver: impl
Driver why: nowy widżet maty z zasobnikiem i sklejka zdarzeń wskaźnika w `TaskScene` na gotowym reduktorze z fazy 8, helper CDP i dane — zachowanie dotyku widać tylko w przeglądarce.

### Overview

Pierwsze zadanie przeciągania: „Zbuduj z klocków liczbę 23.” (E3.6, E4.1). Helpery e2e uczą się `drag` w tej samej fazie,
w której `playable` go dopuszcza. Dokumentacja i seam sweep są w fazie 10 (plan-review F1).

### Changes Required:

#### 1. Widżet

**File**: `src/ui/widgets/BlockMat.ts` (nowy), `docs/design-gaps.md`

**Intent**: zasobnik (pręt i kostka z geometrii `BaseTenBlocks`, podpisy rodzaju z `pl`), mata (jasne pole z ramką
przerywaną), klocki na macie wg `dragLayout`, niesiony klocek pod palcem (cień kitu 4 px), „OK” jak w `SelectTiles`;
`render(state)` z `BlockDragState`. DESIGN-GAP 55 (zasobnik, mata, upuszczenie poza celem — brak w kicie): wiersz i komentarz.

**Contract**: `constructor(scene, onSubmit: (value: number) => void)`, `render(state, active)`, `setVisible`,
`targets(): { tray: Record<BlockKind, Point>; mat: Point; ok: Point; matBlocks: { kind; x; y }[] }` (punkty wewnętrzne).

#### 2. Scena, hak, `playable`, dane

**File**: `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`, `src/core/round/pick.ts`, `src/data/curriculum/E3.ts`,
`src/data/curriculum/E4.ts`, `tests/pick.test.ts`

**Intent**: tryb `drag` w `render`/`hideTaskLayer`/`answerSpot`; zdarzenia wskaźnika sceny → `stepBlockDrag` tylko przy
`inputActive` i trybie `drag` (wzór `RoomScene.create`/`update`); przełącznik wejścia i `sleep`/`wake` → `reset`; nowe
zadanie i zła odpowiedź → pusta mata; usunięty `throw`. Hak: `snapshot.mat`, `snapshot.carrying` (bool), `targets.drag`.
`playable` dopuszcza `drag` (wszystkie cztery tryby) i nagłówek `pick.ts` przestaje mówić „wait for their own UI”. Dane:
`E3.6.place_build_30` PLACE_VALUE `{build, 11, 30}` drag, `E4.1.place_build_100` `{build, 21, 99}` drag (kroki już grywalne
— kolejność kroków bez zmian; zmienia się tylko liczba umiejętności kroku, więc próg `ceil(0.5·n)` — pełny unit i e2e to
sprawdzają). `pick.test.ts`: umiejętności `drag` w puli.

#### 3. Helpery e2e

**File**: `tests/e2e/support/hook.ts`

**Intent**: `dragTouch(page, from, to, steps = 8)` obok `holdTouch` (CDP `touchStart` → `touchMove`×steps →
`touchEnd`) i `cancelTouch(page, from, to)` (kończy `touchCancel`); `answerRight` dla `drag` — rozkład `answer` na
dziesiątki i jedności, `dragTouch` z `targets.drag.tray[kind]` do `targets.drag.mat` tyle razy, potem „OK”;
`answerWrong` — buduje `answer + 1` (dodatkowa jedność; `answer − 1` gdy jedności = 9) i „OK”. Między przeciągnięciami
`expect.poll` na `snapshot.mat`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `npm run sample -- E3 --count 6` i `E4` bez naruszeń (nowe umiejętności `build`)
- E2E (orkiestrator, `e2e-request-p9.md`): pełne `npx playwright test` `<baseline gałęzi e2e> + 0` — specy z losowaniem E3 zielone z `select` i `drag` w puli
- `grep -rn "Unsupported input mode" src/` pusty; `grep -n "wait for their own UI" src/core/round/pick.ts` pusty
- Deliberate break: `playable` bez `drag` → test „umiejętności `drag` w puli” czerwony; przywrócone; meta-check: sklejkę zdarzeń sceny (anulowanie ≠ upuszczenie) dowodzi dopiero e2e fazy 11 (`e2e-break-p11b.patch`)
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `build` w E3.6 i E4.1 (`npm run sample -- E3 --count 6`, `E4`): „Zbuduj z klocków liczbę 23.”, podpowiedzi „2 dziesiątki i 3 jedności”
- [visual] Zrzuty (gest przez rzutowy spec Playwright `*.local` na buildzie haka, profil § 8): `drag` start (pusta mata), klocek w locie pod palcem, po upuszczeniu na matę (2 pręty, 3 kostki), po upuszczeniu poza matą (klocek wrócił), pasek podpowiedzi po złej liczbie, kroki rozwiązania obok maty, podsumowanie rundy po zadaniu z rysunkiem (nic nie zostaje) — 1440×900 i 1024×768
- [human] Prawdziwy tablet (iPad z ekranu początkowego, Android PWA): przeciąganie klocka palcem płynne, upuszczenie na krawędzi maty przewidywalne, stuknięcie dokłada/zdejmuje, gest systemowy (przeciągnięcie od krawędzi) nie kładzie klocka; `select` zaznacza bez przypadkowych podwójnych stuknięć

---

## Phase 10: Dokumentacja, follow-upy i seam sweep

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, luki projektu, follow-upy i `CLAUDE.md`; nic do prowadzenia failing testem, dowód w walidatorze plików reguł i pełnej bramce.

### Overview

Zamknięcie zmiany przed e2e: dokumenty zgodne z kodem, martwy kod i komentarze z faz 1–9 usunięte, każdy odłożony temat ma
`Trigger:`.

### Changes Required:

#### 1. Luki, follow-upy, dokumentacja

**File**: `docs/design-gaps.md`, `context/changes/drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md` (nowy), `CLAUDE.md`

**Intent**: sprawdzenie, że wiersze 52–58 i komentarze `DESIGN-GAP` w kodzie się zgadzają; wiersz 7 oznaczony jako
zamknięty przez 54/55. Follow-upy z `Trigger:`: S-13b (PUZZLE_GRID, GRID, PERIMETER, „ustaw zegar”; `Trigger: S-13b`),
BONDS pary / CHOOSE_OP z obrazkiem (`Trigger: S-13b or S-14`), podświetlenie na rysunku w podpowiedzi (`Trigger: S-14 or a
teacher read asking for it`), rysunek w podglądzie błędów rodzica i przykład błędu dla `select` (tablica nie trafia do
`firstWrong`; `Trigger: first save-format change (v2)`), oś liczbowa jako podpowiedź ADD_SUB (`Trigger: S-14`),
regrupowanie 10 jedności i setki na macie (`Trigger: S-14 or a child stuck on E4.8`). Zamknięte tu: follow-upy S-04
„select/drag UI”, „mode on Task”, „snapshot answer copy” (archiwum `2026-10-12-task-round-stars`). Follow-upy z triggerem
plikowym, który ta zmiana uruchamia (plan-review F3) — każdy zamknięty, jeśli faza dotknęła ich kodu, albo przeniesiony z
nowym `Trigger:` i powodem: wskaźnik kroków rozwiązania (`Trigger: the next change to SolutionSteps`, archiwum
`2026-10-12-narrator-round-summary`; faza 4 zmienia tylko prostokąt `SolutionSteps.show`), „Oblicz.” przed porównaniami
(`Trigger: S-17 or the next change to drawPrompt`; faza 1 poszerza tylko typy), ustalenia audytu M-1, M-2, M-13, H-3, H-4
(`Trigger: next change to TaskScene / narrator`, archiwum `2026-10-13-observability-c1-c2` — przeczytać, zamknąć dotknięte).
`CLAUDE.md` Current state: zdanie o S-13 (`TaskVisual`, `Task.input`, `pictureLayout`, widżety, `blockDrag`, `select`,
`?e2eSkills`); „Not yet present” poprawione (grupa 2–4 tylko częściowo; grid/obwód w S-13b).

#### 2. Seam sweep

**File**: pliki faz 1–9

**Intent**: brak martwego `throw` dla trybów; `TaskPicture` bez placeholderów; jedna geometria klocka (`BaseTenBlocks` ↔
`BlockMat`); jedna geometria OK (`SelectTiles` ↔ `BlockMat`); nieaktualne komentarze (`view.ts`, `types.ts` „drawing
description”); `answerSpot` z gałęzią na każdy tryb; `hideTaskLayer` ukrywa każdy nowy widżet (zrzut ekranu podsumowania
po zadaniu z rysunkiem — wiersz 9.7 [visual]).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/blockdrag.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł, nie treść zdań
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Seam sweep: martwy kod, komentarze, duplikaty geometrii z faz 1–9; DESIGN-GAP 52–58; follow-upy z `Trigger:` (także plikowe z plan-review F3)
- [human] Decyzje wbrew literze ZADANIA § 4: CLOCK bez „przeciągania wskazówek” (→ S-13b); 24-godzinny w kierunku tarcza → „15.00” (ZADANIA: „15.00 to która na tarczy?”); budowa liczby także stuknięciem w zasobnik i bez setek (E4.8 tylko odczyt); podgląd błędów rodzica bez rysunku
- [human] Akceptacja tekstów nowych zadań (`pl.tasks.clock*`, `length*`, `placeValue*`, `data*`, `src/data/charts.ts`) i `childName` E3.3, E3.4, E3.5, E4.3, E4.7

---

## Phase 11: Zadania z rysunkiem, `select` i `drag` dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) dla nowych trybów i rysunku istnieje tylko w renderowanej stronie z CDP touch i skalowaniem FIT; zbudowane w fazach 4–10, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/drawn-tasks.spec.ts` (projekt `chromium-hook`), umiejętności wymuszone szwem `?e2eSkills` (etap E3 przez
`passWelcome`, ścieżka rodzica pomija rozgrzewkę).

### Changes Required:

#### 1. Konfiguracja i helpery

**File**: `playwright.config.ts`, `tests/e2e/support/welcome.ts`

**Intent**: `drawn-tasks` w regexie `ROUND_SPEC`; `passWelcome(page, query?)` już przyjmuje parametry URL
(`Record<string, string>`, np. `{ e2eSkills: '…' }`) — `welcome.ts` bez zmian (plan-review F6). Komenda bramki bez zmian.

#### 2. Spec

**File**: `tests/e2e/drawn-tasks.spec.ts` (nowy)

**Intent**: (a) „#11 a clock task shows the face and is answered by tapping a time tile”: `?e2eSkills=E3.3.clock_read_full`
→ `snapshot.visual.kind === 'clock'`, `targets.picture` nie `null` i wewnątrz notesu → `answerWrong` → pasek podpowiedzi,
rysunek dalej widoczny → `answerRight` → gwiazdka. (b) „#11 a select task needs the whole set: a partial set gets a hint, the
full set and OK earn the star”: `?e2eSkills=E3.7.select_even_30` → stuknięcie jednego parzystego i „OK” → faza `second` →
`answerRight` → `outcomes[0] === 'second'`, gwiazdka; zaznaczenie po złej odpowiedzi wyczyszczone (`snapshot.selected`
pusty). (c) „#11 a drag task builds the number on the mat by touch”: `?e2eSkills=E3.6.place_build_30` → `dragTouch` pręt i
kostki → `snapshot.mat` rośnie po każdym upuszczeniu → przeciągnięcie kostki poza matę → `mat` bez zmiany → stuknięcie
klocka na macie → `mat` −1 → zbudowanie odpowiedzi → „OK” → gwiazdka. (d) „#11 a cancelled touch never places a block”:
`cancelTouch` z zasobnika nad matę → `snapshot.mat` bez zmiany, `carrying === false`; potem zwykłe przeciągnięcie działa.
(e) „#11 a round of drawn tasks plays to the summary”: `?e2eSkills=E3.3.clock_read_full,E3.4.data_most_10,E3.5.length_ruler_cm_15,E3.6.place_build_30,E3.7.select_even_30`
→ `playRoundRight(page, 5)` → podsumowanie z 5 gwiazdkami + premia.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; punkty z haka (wnętrza kształtów); żadnego
`page.clock`, żadnego czekania na czas — `expect.poll` na migawce.

**Chromium niedostępny w sesji agenta**: protokół request-file — spec bez commita, `e2e-request-p11.md` w katalogu zmiany
(komendy zielonych uruchomień i tabela przerw jak `context/archive/2026-10-13-save-export-import-reset/` — plik
`e2e-request-p7.md`), patche `e2e-break-p11a.patch` … `e2e-break-p11d.patch` (tylko kod produkcyjny), `STATUS: BLOCKED —
e2e needs orchestrator run (request file written)`; agent kończący commituje spec po wyniku orkiestratora. Wzór uruchomienia
w podagencie: jedno zwykłe `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts …`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/drawn-tasks.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 5` passed
- Deliberate break (patch `e2e-break-p11a.patch`): „OK” w `SelectTiles` wysyła pusty zbiór zamiast zaznaczonego → (b), (e) czerwone; przywrócone
- Deliberate break (patch `e2e-break-p11b.patch`): `TaskScene` mapuje `wasCanceled`/`pointerupoutside` na `up` zamiast `cancel` → (d) czerwony; meta-check: unit fazy 8 zielone przy tej przerwie — e2e dowodzi sklejki, nie reduktora
- Deliberate break (patch `e2e-break-p11c.patch`): `TaskScene.render` nie pokazuje `TaskPicture` (`setVisible(false)`) → (a) czerwony na `targets.picture`; meta-check: hak czyta widoczność widżetu, nie piksele — piksele dowodzą zrzuty fazy 4–5
- Deliberate break (patch `e2e-break-p11d.patch`): upuszczenie z `moved` poza matą dokłada klocek → (c) czerwony; przywrócone; meta-check: tę regułę pilnują też unit fazy 8 — e2e dowodzi, że scena oddaje zdarzenia reduktorowi (plan-review F8)
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Model: `visualKey`, `validateVisual`, `formatTime`, `input` na każdym zadaniu, `roundView` z trybem i rysunkiem, `distinctTasks` z rysunkiem.
- Generatory: 1000 losowań na wariant, wyrocznie z pól rysunku, parsery, wyciek podpowiedzi tekstowej, przejście przez 12, odcinek nie od zera, brak remisów w diagramie.
- Program: kolejność kroków, start kalendarzowy (wyrocznia z reguły D), odblokowania, `childName` każdego grywalnego kroku, inwarianty treści dla wszystkich nowych umiejętności.
- Gesty: `toggleSelected`, `stepBlockDrag` (anulowanie, drugi palec, limit, stuknięcie), `dragLayout`, `pictureLayout`.

### Integration Tests:

- `npm run sample -- E1..E6` (z linią rysunku), `npm run build` ze strażnikiem haka (nowy marker `e2eSkills`); e2e: istniejące 37 (w tym `first-launch` i `adaptive` po zmianie kolejności, sześć speców z losowaniem E3 z nowymi trybami) + 5 nowych.

### Manual Testing Steps:

1. Zrzuty każdego stanu z faz 4, 6, 7, 9 — 1440×900 i 1024×768.
2. Odczyt nauczyciela wszystkich zmienionych kroków (E1.6, E3.3–E3.7, E3.11, E4.1, E4.3, E4.7, E4.8).
3. Tablet: przeciąganie i zaznaczanie palcem, gest systemowy w trakcie przeciągania.

## Performance Considerations

Rysunki to kilka Graphics na zadanie, przerysowywane tylko przy zmianie zadania lub fazy (jak prompt); niesiony klocek
przerysowuje się na `pointermove` (jeden prostokąt). Generatory bez pętli odrzucania poza DATA (różne wartości słupków —
losowanie bez zwracania z `1..maxValue`, bez odrzucania).

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1; nowe umiejętności nie mają wpisów w `mastery`/`streak` (= 0); `unlockedStep` to numer kroku,
niezależny od grywalności. Uczeń zapisany na E3.6 zostaje na 6 (kroki 3–5 trafiają do puli „wcześniejsze”); zapis E4 krok 2
wczytany w marcu `floorToCalendar` podnosi do 3 (oczekiwany skutek reguły D). Stan zaznaczenia i maty jest sesyjny.

## Known risks

- **Pula „wcześniejsze”**: dziecko na E3 ≥ 6 dostaje zegar, diagram i linijkę jako powtórkę, choć nie miało ich jako
  „bieżących” — zadania odczytu są łatwe, mastery startuje od 0 (bez presji odblokowania). Zgłoszone, nie błąd.
- **E3.5 i E4.7 częściowe** (bez PUZZLE_GRID/PERIMETER/CAPACITY): dziecko odblokowuje je samą linijką; S-13b/S-14 dołożą
  umiejętności, co zmieni próg `ceil(0.5·n)` — akceptowane.
- **Przeciąganie na iPadzie**: gest od krawędzi ekranu może dać `touchcancel` — reduktor go ignoruje (dowód e2e (d)), ale
  odczucie sprawdza tylko `[human]` 9.8.
- **Chromium w sesji agenta**: fazy 6, 7, 9, 11 mogą wymagać protokołu request-file.
- **Zrzuty fazy 4** bez szwu `?e2eSkills` (dochodzi w fazie 7): zrzuty zegara/linijki mogą przejść do fazy 6 (dane) — wiersz
  4.4 zamyka się wtedy razem z 6.8.
- **`select` bez przykładu błędu i z powtórką promptu** (plan-review F9): pierwsza zła odpowiedź `select` to tablica, której
  `captureFirstWrong` (`src/core/round.ts`) nie zapisuje — podgląd rodzica nie pokaże przykładu (follow-up v2, faza 10);
  prompt `select` jest stały i bez rysunku, więc dwa zadania `select` w jednej rundzie mają ten sam klucz `distinctTasks`
  (jak dziś każdy stały prompt) — akceptowane, pula E3 ma ~25 umiejętności.

## References

- Research: `context/changes/drawn-widget-tasks-e3-e4/research.md`; change: `context/changes/drawn-widget-tasks-e3-e4/change.md`
- Kontrakt runu: `context/runs/2026-10-13-s12-s14/agent-contract.md` („S-13 drawn-widget-tasks-e3-e4 and S-14”)
- Katalog: `docs/ZADANIA.md` § 3 (kroki E3/E4), § 4 (CLOCK, LENGTH, PLACE_VALUE, DATA), § 7 (model generatora)
- PRD: `context/foundation/prd.md` FR-023, FR-006; plan `Martynka-urzadza.md` § 11 M6, § 14
- Test-plan: `context/foundation/test-plan.md` ryzyka #1, #5, #11, #12, #13; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md` („Code-drawn helpers”), `reference/clock.svg`, `ruler.svg`, `base-ten.svg`, `screenshots/task-tiles.png`, `task-keypad.png`
- Wzorce: `src/core/longPress.ts`, `src/core/roomGesture.ts`, `src/core/roomHit.ts`, `context/archive/2026-10-13-variant-change-room-done/`, `context/archive/2026-10-12-generators-e3-e4/`; format planu: `context/archive/2026-10-13-save-export-import-reset/plan.md`

## Autonomous decisions

1. **Podział slice'a utrzymany: S-13 = infrastruktura rysunku + CLOCK (odczyt), LENGTH, PLACE_VALUE (odczyt i budowa
   `drag`), DATA, `select`, `drag`; PUZZLE_GRID, GRID, PERIMETER i „ustaw zegar” → S-13b (proposed, dopisane do roadmapy w
   tym commicie).** Odrzucone: wciągnięcie siatki (12+ faz), przeniesienie `drag` do S-13b (plan mieści się w 9 fazach z
   `drag`, więc warunek research „> 9 faz” nie zachodzi; plan-review podzielił tę samą pracę na 11 mniejszych faz — zakres się
   nie zmienił, więc warunek, który mierzył zakres, dalej nie zachodzi). Wbrew literze roadmapy → `[human]` 6.9. Zmieniłoby: faza 9
   przekraczająca budżet kontekstu agenta — wtedy `drag` (fazy 8–9) wychodzi do S-13b, a S-13 kończy się na fazie 7 + 10 + e2e.
2. **Zakres DATA: diagram słupkowy, 3–4 słupki, wartości 1–10 w E3.4, wartości różne (bez remisu na szczycie i dnie),
   etykiety z `src/data/charts.ts` (tematy z rzeczownikami w słowniku).** Odrzucone: wartości do 20 (oś za gęsta na 450 px),
   piktogram (drugi widżet), tabela (tekst). Zmieniłoby: odczyt nauczyciela uznający 10 za za mało dla połowy E3 albo
   `[visual]`, w którym oś 0–10 jest nieczytelna.
3. **Kroki rozwiązania obok rysunku, rysunek zostaje widoczny** (`pictureLayout`: kafelki — rysunek w lewo, linie w prawo;
   klawiatura — rysunek mniejszy u góry, linie pod nim). Odrzucone: ukrycie rysunku na czas rozwiązania (dziecko traci to,
   co liczy), linie pod rysunkiem w trybie kafelków (brak miejsca nad kafelkami). DESIGN-GAP 57. Zmieniłoby: zrzut, w którym
   linie po prawej są za wąskie dla kroków (> 3 linie przy `minScale`).
4. **Bez podświetlania na rysunku w podpowiedzi** (tylko tekst). Odrzucone: pole `highlight` w widoku (kit `.cup.counted`)
   — piąty element zakresu bez wymogu katalogu. Follow-up. Zmieniłoby: odczyt nauczyciela, że podpowiedź do zegara bez
   wskazania wskazówki nie uczy.
5. **`drag` z własnym reduktorem w `core`; stuknięcie w zasobnik też dokłada klocek, stuknięcie klocka na macie go
   zdejmuje.** Odrzucone: drag Phasera (anulowanie = upuszczenie), sam drag bez stuknięcia (7-latki na szkle), przycisk
   „wyczyść matę” (dodatkowy element bez kitu). Wbrew literze ZADANIA („przeciągane na tackę”) → `[human]` 10.6. Zmieniłoby:
   test na tablecie, w którym stuknięcia dokładają klocki przypadkiem.
6. **Budowa bez setek (`build` max 99, mata do 9 klocków na rodzaj, bez regrupowania).** Zmieniłoby: dziecko utknięte na E4.8
   — follow-up.
7. **CLOCK: odpowiedź kafelkami (3, tekst „15.00”/„7.30” wg ZADANIA), 24-godzinny jako „popołudniowa godzina na tarczy →
   zapis 13–23”.** Odrzucone: klawiatura (brak kropki), słowa („piętnasta” — dłuższe kafelki, inny zapis niż szkoła),
   kafelki z tarczami (trzy tarcze na ekranie — nowy widżet). Wbrew podpisowi kitu „3:30” → `[human]` 4.6; kierunek 24-godzinny wbrew przykładowi ZADANIA → `[human]` 10.6. Zmieniłoby:
   odczyt nauczyciela wskazujący zapis słowny w podręcznikach etapu.
8. **LENGTH na klawiaturze, odpowiedzi całkowite (cm w E3, mm w E4); m ↔ cm tekstem.** Odrzucone: pół centymetra w E3
   (klawiatura bez przecinka). Zmieniłoby: krok wymagający ułamków — dopiero E5+.
9. **Szew e2e `?e2eSkills` (hak, marker w strażniku) zamiast losowania do skutku.** Research zakładał brak nowego szwu;
   deterministyczny spec `select`/`drag` go wymaga (losowanie przy 1 z ~25 umiejętności E3 = niestabilny test). Klucz rejestru
   `forcedSkills` (nie marker). Zmieniłoby: istniejący sposób wymuszenia zadania w buildzie haka (nie znaleziony).
10. **Kolejność kroków zmienia się raz (faza 6) — generatory w fazach 2–3 bez danych programu**; odczyt nauczyciela przez
    `sample` w fazie 6 i 9, w fazach 2–3 z losowań drukowanych w teście. Odrzucone: dane w fazach 2–3 (trzykrotna aktualizacja
    testów przypiętych i speców `first-launch`/`adaptive`). Zmieniłoby: brak.
11. **Helpery e2e w fazie, która dopuszcza tryb** (7 — `select`, 9 — `drag`), dowód helpera `select` jednorazowym
    uruchomieniem z `?e2eSkills` w fazie 7; pełna spec w fazie 11. Research decyzja 5.
12. **Brak zmiany zapisu; podgląd rodzica bez rysunku** (DESIGN-GAP 58, follow-up z triggerem v2) → `[human]` 10.6.
13. **Jedenaście faz (po plan-review F1; plan pisał dziewięć): 3 × tdd (model, CLOCK+LENGTH, PLACE_VALUE+DATA), 1 × tdd
    (reduktor), 6 × impl (ClockFace+Ruler, BaseTenBlocks+BarChart, dane E3/E4, SelectTiles, BlockMat, dokumentacja + seam
    sweep; po ≤ 2 nowe komponenty UI, `TaskPicture` to dyspozytor), 1 × e2e po seam sweep.**
14. **Roadmapa: S-13 → `planning`** (skill) i nowa pozycja **S-13b `drawn-grid-tasks-e3-e4` (proposed)**, commit z planem.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Model rysunku i trybu odpowiedzi w `core`, unikalność i `sample`

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`@@SHA@@
- [x] 1.2 Deliberate break: klucz samego `prompt` / brak stempla `input` / `visualKey` bez `minute` → czerwone; przywrócone; meta-check@@SHA@@
- [x] 1.3 `npm run sample -- E3` bez regresji; `tests/fixtures/` bez zmian@@SHA@@
- [ ] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 1.5 [reviewer] `visual.ts` bez Phasera i globali; `TaskVisual` tylko liczby i etykiety

### Phase 2: Generatory CLOCK i LENGTH

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Deliberate break: `later` bez przejścia przez 12 / `ruler` od zera / `leaksAnswer` tylko liczbowy → czerwone; przywrócone; meta-check
- [ ] 2.3 Klucze `generators` i `parsers` równe
- [ ] 2.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 2.5 [reviewer] Odczyt nauczyciela szablonów CLOCK/LENGTH i 6 losowań na wariant z testu

### Phase 3: Generatory PLACE_VALUE (odczyt i budowa) i DATA

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Deliberate break: remis w DATA / zła składnia `read` / parser przyjmuje `build` 150 → czerwone; przywrócone; meta-check
- [ ] 3.3 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.4 [reviewer] Odczyt nauczyciela szablonów PLACE_VALUE/DATA i `charts.ts`

### Phase 4: Obszar rysunku w `TaskScene`, `ClockFace` i `Ruler`

#### Automated

- [ ] 4.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- [ ] 4.2 Deliberate break: `pictureLayout` bez rozdzielenia przy rozwiązaniu → czerwony; przywrócone; meta-check
- [ ] 4.3 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 4.4 [visual] Zrzuty: tarcza (pełna godzina, 7.45), tarcza z podpowiedzią, tarcza z krokami obok, linijka cm nie od zera, linijka mm, linijka z krokami — 1440×900 i 1024×768
- [ ] 4.5 [reviewer] Widżety bez tekstów i liczb balansu; `TaskPicture` w `hideTaskLayer`
- [ ] 4.6 [human] Decyzja wbrew podpisowi kitu „3:30”: czasy zapisane kropką wg ZADANIA („15.00”, „7.30”)

### Phase 5: `BaseTenBlocks` i `BarChart`

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0 lub + N`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- [ ] 5.2 `TaskPicture` bez placeholdera; `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 5.3 [reviewer] Widżety bez tekstów i liczb balansu; geometria klocka wyeksportowana; DESIGN-GAP 53

### Phase 6: Nowe kroki grywalne E3/E4 — dane programu, testy przypięte do kolejności i e2e

#### Automated

- [ ] 6.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 6.2 `npm run sample -- E3 --count 6` i `E4 --count 6` bez naruszeń, z linią `visual:`
- [ ] 6.3 Żaden krok grupy 1 pusty; każdy grywalny krok ma `childName`
- [ ] 6.4 Deliberate break: brak `childName` E4.3 / E3.4 z powrotem `skills: []` → czerwone; przywrócone; meta-check
- [ ] 6.5 E2E (orkiestrator): `first-launch` i `adaptive` zielone; pełne `<baseline gałęzi e2e> + 0`
- [ ] 6.6 `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 6.7 [reviewer] Odczyt nauczyciela `sample` E3/E4 `--count 6` dla E3.3, E3.4, E3.5, E3.6, E3.11, E4.1, E4.3, E4.7, E4.8
- [ ] 6.8 [visual] Zrzuty: klocki (E3.6, E4.8), diagram `most` i `diff`, diagram z krokami, karta „Nowa umiejętność!” E3.3 (i zegar/linijka, jeśli 4.4 ich nie ma) — 1440×900 i 1024×768
- [ ] 6.9 [human] Decyzja wbrew literze roadmapy S-13: bez osi, słupka pisemnego, grafów, figur; grid/obwód/„ustaw zegar” → S-13b; DATA w zakresie

### Phase 7: Tryb `select` — zaznaczanie kafelków, helpery e2e i szew `?e2eSkills`

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 7.2 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` z `select` w puli; jednorazowo `task-round` z `?e2eSkills=E3.7.select_even_30` zielony
- [ ] 7.3 `npm run build` drukuje `e2e hook: absent (`; `e2eSkills` nieobecny w `dist/`
- [ ] 7.4 Deliberate break: `toggleSelected` nie zdejmuje → czerwony; meta-check nazwy klucza rejestru vs marker; przywrócone

#### Manual

- [ ] 7.5 [reviewer] Odczyt nauczyciela `selectEven` w E1.6 i E3.7; `answerWrong` dla `select` niezależny od kolejności
- [ ] 7.6 [visual] Zrzuty: `select` przed, z dwoma zaznaczonymi, po złym zbiorze, w krokach, w `retype` — 1440×900 i 1024×768

### Phase 8: Reduktor przeciągania klocków w `core`

#### Automated

- [ ] 8.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 8.2 Deliberate break: `cancel` jak `up` / brak `maxPerKind` / `up` bez progu jako upuszczenie → czerwone; przywrócone; meta-check
- [ ] 8.3 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 8.4 [reviewer] `blockDrag.ts` bez Phasera i globali; surowe zdarzenia; liczby w `balance.ts`

### Phase 9: Tryb `drag` — zasobnik i mata, PLACE_VALUE „zbuduj”, helpery e2e

#### Automated

- [ ] 9.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `sample` E3/E4 bez naruszeń
- [ ] 9.2 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` z `select` i `drag` w puli
- [ ] 9.3 `Unsupported input mode` i „wait for their own UI” usunięte
- [ ] 9.4 Deliberate break: `playable` bez `drag` → test puli czerwony; przywrócone; meta-check
- [ ] 9.5 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 9.6 [reviewer] Odczyt nauczyciela `build` w E3.6 i E4.1
- [ ] 9.7 [visual] Zrzuty: `drag` start, klocek w locie, po upuszczeniu na matę, po upuszczeniu poza matą, podpowiedź, kroki obok maty, podsumowanie po zadaniu z rysunkiem — 1440×900 i 1024×768
- [ ] 9.8 [human] Prawdziwy tablet (iPad, Android): odczucie przeciągania, krawędź maty, stuknięcia, gest systemowy; `select` bez przypadkowych stuknięć

### Phase 10: Dokumentacja, follow-upy i seam sweep

#### Automated

- [ ] 10.1 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- [ ] 10.2 `validate-rule-files.sh` PASS
- [ ] 10.3 Deliberate break: `CLAUDE.md` z nieistniejącą ścieżką → FAIL; przywrócone; meta-check
- [ ] 10.4 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 10.5 [reviewer] Seam sweep: martwy kod, komentarze, duplikaty geometrii; DESIGN-GAP 52–58; follow-upy z `Trigger:` (także plikowe)
- [ ] 10.6 [human] Decyzje wbrew literze ZADANIA: CLOCK bez przeciągania wskazówek; 24-godzinny tarcza → „15.00”; budowa także stuknięciem i bez setek; podgląd rodzica bez rysunku
- [ ] 10.7 [human] Akceptacja tekstów nowych zadań i `childName` E3.3, E3.4, E3.5, E4.3, E4.7

### Phase 11: Zadania z rysunkiem, `select` i `drag` dotykiem — e2e (#11)

#### Automated

- [ ] 11.1 `drawn-tasks.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 5`
- [ ] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): „OK” wysyła pusty zbiór → (b), (e) czerwone; przywrócone
- [ ] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): anulowany dotyk jako `up` → (d) czerwony; meta-check
- [ ] 11.4 Deliberate break (patch `e2e-break-p11c.patch`): rysunek ukryty → (a) czerwony; meta-check
- [ ] 11.5 Deliberate break (patch `e2e-break-p11d.patch`): upuszczenie poza matą dokłada → (c) czerwony; przywrócone
- [ ] 11.6 `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
