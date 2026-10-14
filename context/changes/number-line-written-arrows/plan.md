# Słupek pisemny z okienkami cyfr, grafy strzałkowe i oś liczbowa (rysunek i podpowiedź) — Implementation Plan

## Overview

Slice roadmapy **S-14b** (`number-line-written-arrows`, etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`,
gałąź `feat/number-line-written-arrows` z `main` @ `882cd93` (po S-15). Dziecko dostaje w rundzie:

- **WRITTEN** — dodawanie i odejmowanie pisemne w słupku (E5.2 dwucyfrowe do 100, E6.7 trzycyfrowe z przekroczeniem):
  słupek rysowany w kodzie, wynik wpisywany **cyfra po cyfrze do okienek, od jedności** — nowy tryb odpowiedzi
  `digits` („cyfra w okienku”), odpowiedź nadal jest liczbą;
- **ARROW_TABLE** — graf strzałkowy (liczba → „+n”/„−n” → □ albo □ → „+n” → liczba) i tabelka (wiersz wejść, jedna reguła,
  jedno puste pole) w E2.6, do 20, klawiatura;
- **oś liczbowa jako rysunek** — w istniejącym `E2.7.sequence_tens_100` (oś 0–100 co 10, okienko na brakującym wyrazie)
  i w nowej umiejętności `E3.9.mult_groups_jumps` (skoki po k na osi, odpowiedź: działanie na kafelku);
- **oś liczbowa jako podpowiedź ADD_SUB** — nowe pole `Task.hintVisual`, pokazywane dopiero po pierwszym błędzie
  (faza podpowiedzi, kroki rozwiązania, retype), dla umiejętności ADD_SUB na klawiaturze z wynikiem ≤ 30 (E2.1, E2.3,
  E2.5, E3.2, E3.6, E3.8); lądowanie nigdy nie jest podpisane.

Przy okazji: strażnik wyczerpywalności trybów odpowiedzi (`never`), żeby nowy tryb nie mógł po cichu wpaść w gałąź
kafelków/klawiatury (lekcja S-13b), oraz follow-up O5 (pierwsza podpowiedź `E5.5.capacity_quarter_l` ≤ 64 znaki).
Format zapisu zostaje **v2**.

## Current State Analysis

Z `research.md` (commit `0be6013`), `change.md` i odczytów w tym kroku (kotwice: symbole):

- **Tryby odpowiedzi**: `SkillDef.answer: 'tiles' | 'keypad' | 'drag' | 'select'` (`src/core/types.ts`), `AnswerMode =
  SkillDef['answer']` (`src/core/tasks/visual.ts`). Żaden konsument nie jest wyczerpujący: `pictureLayout`/`answerSpans`/
  `tallOf` (`src/core/round/pictureLayout.ts`) kończą się gałęzią kafelków, `roundView` ma `input ?? (choices ? 'tiles' :
  'keypad')` (`src/core/round/view.ts`), `FeedbackBar.update` wybiera `barSpan[input === 'keypad' ? 'keypad' : 'tiles']`,
  `TaskScene.render`/`drawPrompt`/`answerSpot` to łańcuchy `if`, `answerRight`/`answerWrong` w `tests/e2e/support/hook.ts`
  kończą się gałęzią klawiatury, a `Snapshot.input` to ręczna unia czterech trybów.
- **`playable`** (`src/core/round/pick.ts`) wpuszcza tryb **i** wymaga zarejestrowanego generatora; komentarz każe
  helperom e2e znać tryb wcześniej. `?e2eSkills` ignoruje umiejętności niegrywalne (`TaskScene`), więc e2e trybu wymaga
  `playable`.
- **Testy iterują wszystkie umiejętności z generatorem, nie tylko grywalne**: `tests/solvableInMode.test.ts`
  (`canonicalInput` + maszyna stanów rundy) i `tests/contentInvariants.test.ts` (walidator, arytmetyka podpowiedzi
  `ARITHMETIC_LINE` zakotwiczona `^a op b = c$`, ostatnia linia z odpowiedzią, `KEYPAD_HINT_MAX` 64 dla `keypad`,
  `LONG_KEYPAD_HINTS` = {`E5.5.capacity_quarter_l`}).
- **Klawiatura** (`src/ui/widgets/Keypad.ts`): własny `buffer`, `keypadInput` (`src/core/round/keypad.ts`), `onSubmit(number)`;
  brak wywołania „surowego klawisza”.
- **Rysunki**: `TaskVisual` ma 12 rodzajów; żadnego słupka, grafu ani osi. `validateVisual(v)` nie zna odpowiedzi —
  reguły przecieku idą do `validateTask`. `TaskPicture` rozdziela po `kind`.
- **Podpowiedź** to tylko tekst (`Task.hint: string[]`, `firstHint`/`solutionSteps` w `src/core/round/hints.ts`).
  `addSubHint` (`src/core/tasks/generators/addSub.ts`) rozkłada działanie (skok dziesiątkami, „do dziesiątki” + reszta).
- **Układ**: beside-keypad wyrażenie `TASK_LAYOUT.expression` (620, 456), rysunek przy klawiaturze `picture.keypad`
  (236, 470, 768 × 378), w rozwiązaniu `keypadSolution` (rysunek 190 px + linie 180 px). Ekran E1 (kafelki) nie ma wolnego
  pasa między `expressionWide` (y 500) a kafelkami (`tiles.top` 712).
- **S-15**: `drawTask` (`src/core/minigames/word.ts`) odrzuca zadania z `visual`, ale przepuściłby `hintVisual`.
- **Kroki**: E2.6 1 umiejętność (`fact_check_sub_20`), E2.7 3 (`sequence_tens_100` keypad), E3.9 **4** (`mult_30`,
  `mult_groups_result`, `mult_groups_expr`, `word_groups_30`), E5.2 2 (`roman_12`, `add_sub_100_two_digit` z `bridge: 'none'`),
  E6.7 1 (`fact_check_1000`). `tests/curriculum.test.ts` `LATER` zawiera `ARROW_TABLE`, `WRITTEN`.
- **Kit** (read-only): `designs/martynka-maths-A-v1/reference/written-addition.svg` (słupek gotowy, przeniesienie jako złote
  kółko nad dziesiątkami, bez okienek), `reference/number-line.svg` (0–10, łuki `#54BEB4`), style guide „Code-drawn helpers”.
  Brak: okienek cyfr, aktywnego okienka, pożyczki, grafu/tabelki, osi w podpowiedzi, osi 0–100, skoków k > 1 → DESIGN-GAP
  od wiersza **88** (`docs/design-gaps.md` kończy się na 87).

## Desired End State

- Runda E5/E6 losuje zadania WRITTEN: słupek z cyframi w kolumnach, okienka wyniku, dziecko stuka cyfry na klawiaturze,
  okienka wypełniają się od jedności w lewo; „OK” zgłasza liczbę dopiero przy pełnych okienkach; po błędzie okienka
  się czyszczą, podpowiedź pokazuje kolumnę jedności i małą cyfrę przeniesienia/pożyczki, kroki rozwiązania stoją obok
  słupka, retype jak w każdym trybie.
- Runda E2 losuje grafy i tabelki strzałkowe (klawiatura); E2.7 pokazuje ciąg na osi; E3.9 ma skoki na osi z kafelkami
  działań; zadania ADD_SUB ≤ 30 na klawiaturze w E2–E3 po pierwszym błędzie pokazują oś ze skokami pod wyrażeniem.
- Dodanie szóstego trybu odpowiedzi łamie typecheck w każdym konsumencie (core, scena, pasek, helpery e2e) zamiast
  wpadać po cichu w kafelki/klawiaturę; `tests/answerModes.test.ts` pilnuje listy trybów wpuszczanych przez `playable`.
- `npm run sample -- E2|E3|E5|E6 --count 6` drukuje nowe zadania z liniami `visual:`/`hint visual:` bez naruszeń; dwa nowe
  spece e2e (#11) zielone; progi odblokowania wymienione w PR.

### Key Discoveries:

- `canonicalInput` (`src/core/round/canonicalInput.ts`) to brama rozwiązywalności każdego trybu — `digits` dostaje gałąź,
  która rzuca, gdy liczba cyfr odpowiedzi ≠ liczbie okienek.
- `ARITHMETIC_LINE` jest zakotwiczona na całej linii — linie kolumn („Jedności: 8 + 7 = 15. Piszę 5, 1 dalej.”) nie są
  przez inwariant liczone, więc arytmetykę kolumn sprawdza test generatora; ostatnia linia WRITTEN musi brzmieć
  `38 + 27 = 65` (inwariant „odpowiedź w ostatniej linii”).
- `firstHint` odrzuca linię, której ostatnia liczba = odpowiedź; linia jedności kończy się cyfrą przeniesienia albo cyfrą
  jedności, nigdy wynikiem.
- E2E: żaden spec nie gra E5/E6 poza wymuszonymi umiejętnościami `art-tasks` (E5), więc `digits` nie trafi do starych
  speców; podpowiedź-oś trafi do rund E3 (domyślny etap `passWelcome`) — faza 6 sprawdza i aktualizuje spece.

## What We're NOT Doing

- Wariant WRITTEN „brakujące cyfry w słupku” (E6) → follow-up `Trigger: S-14c or the next change to WRITTEN`.
- Wpisywanie przeniesienia przez dziecko (okienko przeniesienia) — przeniesienie/pożyczkę rysuje gra w podpowiedzi i
  rozwiązaniu (`[human]` 9.6).
- ARROW_TABLE z „·n”, łańcuch dwóch strzałek, tabelka z kilkoma pustymi polami → follow-up `Trigger: S-14c or a multi-number reducer`.
- Oś-podpowiedź dla E1 (kafelki) i ADD_SUB > 30 → follow-up `Trigger: S-14d (E1 picture mode) or a layout band above the tiles`.
- Nowe umiejętności SEQUENCE poza E2.7; zamiana rysunku `icons` w istniejących MULT_GROUPS.
- E1.10 `place_read_12` → `Trigger: S-14d`; E5.5 `capacity_half_l_e5` → `Trigger: S-14c`; `ArtPool`/S14-09/S14-10 →
  `Trigger: the next widget built on ArtImage` (wszystkie rysunki tego slice'a są w kodzie).
- Zmiana formatu zapisu (zostaje v2), minigra „Łańcuch strzałek”, zmiana `keypadSolution`.

## Implementation Approach

Jak S-13b: najpierw czysty `core` test-first (strażnik trybów + reduktor okienek, modele rysunków i generatory, rysunek
podpowiedzi), potem widżety z danymi (≤ 2 nowe komponenty UI na fazę), seam sweep, dwie fazy e2e.

1. Strażnik trybów, tryb `digits` w `core`, reduktor okienek, `canonicalInput` (tdd).
2. Rysunki `column` i `numberLine`, generator WRITTEN (tdd).
3. Rysunek `arrows`, generator ARROW_TABLE, oś w SEQUENCE i wariant MULT_GROUPS `jumps` (tdd).
4. Rysunek podpowiedzi `Task.hintVisual`, oś w ADD_SUB, widok rundy, układ, filtr minigry (tdd).
5. Widżety `NumberLine` i `ArrowGraph`, dane E2.6, E2.7, E3.9 (impl).
6. Oś-podpowiedź w `TaskScene`, dane ADD_SUB ≤ 30 (impl).
7. Widżet `WrittenColumn`, klawiatura w trybie klawiszy, gałąź `digits` w scenie i pasku, migawka haka (impl).
8. Helpery e2e `digits`, `playable` wpuszcza `digits`, dane WRITTEN E5.2/E6.7, O5 (impl).
9. Dokumentacja, luki projektu, follow-upy i seam sweep (impl, ostatnia impl).
10. E2E #11: słupek pisemny dotykiem (e2e).
11. E2E #11: oś, grafy i oś-podpowiedź dotykiem (e2e).

**Reguła kolejności (kontrakt):** `digits` wchodzi do unii w fazie 1, ale `playable` wpuszcza go dopiero w fazie 8, razem z
helperami e2e (`typeDigits`, gałęzie `answerRight`/`answerWrong`); każda faza, która zmienia zachowanie istniejącego speca,
aktualizuje go w tej samej fazie; każda faza zostawia pełny zestaw zielony (e2e po fazie uruchamia orkiestrator,
`--workers=4`, protokół request-file — profil § 8).

**Progi odblokowania** (`ceil(0.5 · n)` po grywalnych umiejętnościach; PR body je wymienia; research § F):

| Krok | umiejętności przed → po | próg przed → po | faza |
|---|---|---|---|
| E2.6 (+ `arrow_graph_20`, `arrow_table_20`) | 1 → 3 | 1 → 2 | 5 |
| E2.7 (oś w `sequence_tens_100`) | 3 → 3 | 2 → 2 | 5 |
| E3.9 (+ `mult_groups_jumps`) | 4 → 5 | 2 → 3 | 5 |
| E5.2 (+ `written_add_100`, `written_sub_100`) | 2 → 4 | 1 → 2 | 8 |
| E6.7 (+ `written_add_1000`, `written_sub_1000`) | 1 → 3 | 1 → 2 | 8 |

Dziecko zapisane na tych krokach odblokowuje następny wolniej; nic nie ginie (`unlockedStep` tylko rośnie,
`floorToCalendar`).

## Critical Implementation Details

**Kontrakt trybu (faza 1; zależą fazy 7, 8, 10).** `ANSWER_MODES = ['tiles', 'keypad', 'drag', 'select', 'digits'] as const`
w `src/core/types.ts`, `SkillDef['answer'] = (typeof ANSWER_MODES)[number]`. Konsumenci w `core` (`pictureLayout`,
`answerSpans`, `canonicalInput`, mode-rule w `validateTask`) przechodzą na `switch` z `const _exhaustive: never = mode`;
UI (`TaskScene`, `FeedbackBar`) w fazie 7, helpery e2e w fazie 8. `roundView` zachowuje fallback tylko dla zadań bez
`input` (zadania ręczne w testach). Reduktor `src/core/round/digitBoxes.ts`:

```ts
interface DigitBoxes { readonly count: number; readonly digits: readonly number[] }   // digits[0] = ones, filled right to left
startDigitBoxes(count: number): DigitBoxes
stepDigitBoxes(s: DigitBoxes, key: KeypadKey): { state: DigitBoxes; submit: number | null }
// digit: fills the next box leftwards (ignored when full); 'delete': clears the last filled; 'ok': submit only when full
digitBoxCount(task: Task): number   // from visual.kind === 'column' (its `columns`); throws for any other drawing — PHASE 2 (the `column` kind does not exist before it)
```

`active` = `digits.length` (indeks okienka od jedności); po złym zgłoszeniu scena woła `startDigitBoxes` (czyści wszystko —
zostawienie dobrych cyfr pokazałoby, które są dobre).

**Rysunki (fazy 2–4; zależą fazy 5–8).** `TaskVisual` rozszerzony o:

```ts
| { kind: 'column'; op: '+' | '−'; a: number; b: number; columns: number }        // operands right-aligned; result has exactly `columns` digits
| { kind: 'numberLine'; from: number; to: number; tick: number; labels: readonly number[]; box: number | null; jumps: readonly { from: number; to: number }[] }
| { kind: 'arrows'; layout: 'graph'; op: '+' | '−'; n: number; input: number | null; output: number | null }   // exactly one null
| { kind: 'arrows'; layout: 'table'; op: '+' | '−'; n: number; inputs: readonly number[]; outputs: readonly (number | null)[] }  // exactly one null
```

`columnMarks(visual, show: 'none' | 'first' | 'all')` (czysta, `src/core/tasks/written.ts`) zwraca znaki metody: przy
dodawaniu mała cyfra przeniesienia nad następną kolumną; przy odejmowaniu skreślona cyfra odjemnej, nad nią cyfra
zmniejszona i „1” przed cyfrą kolumny, która pożycza. Scena: `first` w fazie podpowiedzi (pierwsza kolumna z
przeniesieniem/pożyczką), `all` w rozwiązaniu i retype, `none` przy pierwszej próbie. Notacja pochodzi z wiedzy ogólnej
(ZADANIA: „przeniesienie zaznaczane małą cyfrą”), nie z kitu ani repo → DESIGN-GAP i `[human]` 8.8.
`validateVisual`: `numberLine` — `from < to`, liczba kresek `(to − from) / tick + 1 ≤ balance.numberLine.maxTicks` (31),
podpisy, okienko i końce skoków na kreskach w zakresie; `column` — `columns` = cyfry szerszego składnika, wynik ma
dokładnie `columns` cyfr, odejmowanie bez wyniku ujemnego; `arrows` — dokładnie jedno puste pole, pozostałe zgodne z regułą,
wartości 0..20. `visualKey`/`describeVisual` (`[column 38 + 27]`, `[line 0–100/10 labels 30 40 60 box 50]`,
`[arrows graph 7 +5 □]`), `visualShape` = `wide`.

**Reguła przecieku osi (fazy 2–4).** W `validateTask`: dla liczbowej odpowiedzi żaden `numberLine` zadania (`visual` ani
`hintVisual`) nie ma odpowiedzi w `labels`; jeśli rysunek ma okienko na osi, okienko = odpowiedź tylko w zadaniu, które o nią
pyta (SEQUENCE). Inwariant w `tests/contentInvariants.test.ts` sprawdza to na 1000 losowaniach.

**Podpowiedź WRITTEN (faza 2).** Linie per kolumna, od jedności: „Jedności: 8 + 7 = 15. Piszę 5, 1 dalej.”, „Dziesiątki: 3 + 2
+ 1 = 6.”; odejmowanie: „Jedności: 3 − 8 nie da się. Pożyczam dziesiątkę: 13 − 8 = 5.”; ostatnia linia zawsze pełne działanie
`38 + 27 = 65` (inwariant). Teksty w `pl.tasks.*`; arytmetykę każdej linii kolumny sprawdza `tests/written.test.ts`
(inwariant jej nie czyta). Pierwsza podpowiedź ≤ 64 znaki (`KEYPAD_HINT_MAX` rozszerzone na `digits` w fazie 8).

**Oś-podpowiedź (faza 4).** `Task.hintVisual?: TaskVisual` (jeden rysunek, nie para hint/solution), budowany z tych samych
skoków co `addSubHint` (wspólna `addSubJumps(a, op, b)`, bez parsowania tekstu). Okno osi: od pełnej dziesiątki ≤ min(start,
wynik) do pełnej dziesiątki ≥ max, ≤ 30 jednostek, kreska co 1; podpisy: start, pośrednie lądowania, wielokrotności 5 —
**bez wyniku**; okienko na lądowaniu. Opt-in w danych: `line: true` w parametrach ADD_SUB; parser odrzuca przy `max > 30`;
`validateTask` odrzuca `hintVisual` przy trybie innym niż `keypad` (E1 poza zakresem). `RoundView.hintPicture: TaskVisual |
null` = `hintVisual` w fazach `second`, `solution`, `retype`, inaczej `null`. `drawTask` minigry zwraca zadanie bez `hintVisual`.

## Phase 1: Strażnik trybów i tryb `digits` w `core`

Driver: tdd
Driver why: lista trybów, wyczerpujące `switch`e w `core`, czysty reduktor okienek i gałąź `digits` w `canonicalInput` nie istnieją — failing testy (okienka od jedności, „OK” przy niepełnych, liczba cyfr ≠ okienkom rzuca) prowadzą implementację.

### Overview

Nowy tryb istnieje w typach i w czystej logice, ale nie jest grywalny; każdy konsument w `core` jest wyczerpujący.

### Changes Required:

#### 1. Lista trybów i wyczerpywalność w `core`

**File**: `src/core/types.ts`, `src/core/tasks/visual.ts`, `src/core/round/pictureLayout.ts`, `src/core/tasks/validate.ts`

**Intent**: `ANSWER_MODES` jako jedyne źródło unii; `pictureLayout`, `answerSpans`, `tallOf` i mode-rule walidatora przechodzą
na `switch` z gałęzią `never`; `digits` dostaje własny układ (słupek w stałym miejscu w każdej fazie, linie rozwiązania obok).

**Contract**: kontrakt trybu w Critical Implementation Details; `PictureSpec.digits: { picture: Rect; lines: Rect }` z
liczbami w `TASK_LAYOUT.picture.digits` (prowizorycznie słupek x 236, y 340, 440 × 508; linie x 700, y 340, 320 × 508; DESIGN-GAP,
zrzuty w fazie 8); walidator: `digits` wymaga rysunku `column` (do fazy 2: każde zadanie `digits` jest naruszeniem `mode`).

#### 2. Reduktor okienek

**File**: `src/core/round/digitBoxes.ts` (nowy)

**Intent**: wpisywanie cyfr do okienek od jedności, kasowanie ostatniej, zgłoszenie tylko przy pełnych okienkach.

**Contract**: `startDigitBoxes`, `stepDigitBoxes` (kontrakt wyżej); `KeypadKey` z `src/core/round/keypad.ts`. `digitBoxCount` dopiero w fazie 2
(plan-review F1: porównanie `visual.kind === 'column'` nie kompiluje się, dopóki rodzaju `column` nie ma w `TaskVisual`).

#### 3. Kanoniczne wejście

**File**: `src/core/round/canonicalInput.ts`

**Intent**: `switch` z `never`; w fazie 1 `case 'digits'` rzuca ze `skillId` („digits needs a column drawing”) — żadna
umiejętność `digits` jeszcze nie istnieje. Pełna gałąź (liczba całkowita ≥ 0 o dokładnie `digitBoxCount(task)` cyfrach, złożona
przez reduktor od jedności) w fazie 2, razem z rodzajem `column` (plan-review F1).

#### 4. Testy

**File**: `tests/digitBoxes.test.ts` (nowy), `tests/answerModes.test.ts` (nowy), `tests/pictureLayout.test.ts`, `tests/solvableInMode.test.ts` (przypadki ręczne `digits`)

**Intent**: reduktor (kolejność od jedności, pełne okienka ignorują cyfry, `delete` na pustych, `ok` niepełne → `null`, 0 na
początku liczby wielocyfrowej jako cyfra jedności dozwolone); `answerModes`: `ANSWER_MODES` ma 5 trybów, `playable` wpuszcza
dokładnie `['tiles', 'keypad', 'drag', 'select']` (jawna lista „wpuszczonych”, faza 8 ją zmienia), każdy tryb ma układ
`pictureLayout` różny od `tilesSolution` dla `digits`; `canonicalInput` dla `digits` w fazie 1 rzuca (przypadek ręczny).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: usunięty `case 'digits'` w `pictureLayout` → typecheck czerwony (`never`); reduktor wypełnia od lewej → `tests/digitBoxes.test.ts` czerwony; `playable` wpuszcza `digits` → `tests/answerModes.test.ts` czerwony; przywrócone; meta-check: break typów dowodzi strażnika, nie zachowania układu
- `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Żaden konsument trybu w `src/core/` nie kończy się cichym `return` kafelków/klawiatury; reduktor bez Phasera

---

## Phase 2: Rysunki `column` i `numberLine`, generator WRITTEN

Driver: tdd
Driver why: dwa nowe rodzaje `TaskVisual` (walidacja, klucz, opis, przeciek osi), `columnMarks` i czysty generator słupka z parserem — failing testy (wynik ma dokładnie `columns` cyfr, E6 zawsze z przekroczeniem, arytmetyka każdej linii kolumny, znaki przeniesienia/pożyczki) prowadzą implementację.

### Overview

Słupek i oś jako dane; WRITTEN zarejestrowany, ale bez umiejętności w programie (dane w fazie 8).

### Changes Required:

#### 1. Rodzaje rysunków

**File**: `src/core/tasks/visual.ts`, `src/core/tasks/validate.ts`, `src/data/balance.ts` (`numberLine.maxTicks` 31),
`src/ui/widgets/TaskPicture.ts` (tylko jawne `case 'column'`/`case 'numberLine'`, które rzucają — `switch` w `render` ma gałąź
`never`, więc bez nich typecheck fazy jest czerwony; plan-review F2), `src/core/round/digitBoxes.ts` (`digitBoxCount`),
`src/core/round/canonicalInput.ts` (pełna gałąź `digits`)

**Intent**: `column` i `numberLine` wg kontraktu (Critical Implementation Details), reguła przecieku osi w `validateTask`,
mode-rule `digits` ↔ `column`; `digitBoxCount` i gałąź `digits` w `canonicalInput` przeniesione z fazy 1 (plan-review F1).

**Contract**: `validateVisual` z gałęzią wyczerpującą; `visualKey`, `describeVisual`, `visualShape`.

#### 2. Generator WRITTEN i znaki metody

**File**: `src/core/tasks/generators/written.ts` (nowy), `src/core/tasks/written.ts` (nowy: `columnMarks`, wspólna pętla
kolumn), `src/core/tasks/registry.ts`, `src/data/pl.ts` (`tasks.writtenAdd`, `writtenSub`, linie kolumn)

**Intent**: parametry `{ op: '+' | '−', digits: 2 | 3, carry: 'any' | 'required' }`; `digits: 2` → składniki dwucyfrowe, wynik
10–99; `digits: 3` → trzycyfrowe, wynik 100–999; `required` → co najmniej jedno przeniesienie/pożyczka. Polecenie „Dodaj w
słupku: 38 + 27” / „Odejmij w słupku: 65 − 48” (narrator czyta liczby; scena w fazie 7 rysuje tylko zdanie, liczby są w
słupku). Podpowiedzi wg Critical Implementation Details. Parser odrzuca niewykonalne dane.

**Contract**: `generateWritten: Generator`, `parseWrittenParams`; zarejestrowane w `generators` i `parsers`; `columnMarks(visual, show)`.

#### 3. Testy

**File**: `tests/written.test.ts` (nowy), `tests/visual.test.ts`, `tests/digitBoxes.test.ts` (`digitBoxCount`), `tests/solvableInMode.test.ts` (ręczny przypadek `digits` z rysunkiem `column`)

**Intent**: 1000 losowań na wariant (`tests/helpers.ts`): `validateTask` czyste, liczba cyfr wyniku, `required` zawsze z
przeniesieniem, arytmetyka każdej linii kolumny liczona niezależnie od generatora (z `a`, `b`), ostatnia linia = pełne
działanie, `firstHint` nie zdradza wyniku; `columnMarks` na przykładach z ręki (38 + 27, 65 − 48, 468 + 216, 365 − 156, 500 − 284);
`numberLine` z odpowiedzią w podpisach → naruszenie.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; `WRITTEN` nadal w `LATER` (bez umiejętności)
- Deliberate break: wynik E5 dopuszcza 100 / `required` bez przeniesienia / podpis osi = odpowiedź przechodzi walidator → odpowiednie testy czerwone; przywrócone; meta-check: arytmetyka kolumn liczona w teście z operandów, nie z linii generatora
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów WRITTEN (6 losowań na wariant z testu/`describeVisual`): linie kolumn, „1 dalej”, pożyczka, polecenia

---

## Phase 3: Rysunek `arrows`, generator ARROW_TABLE, oś w SEQUENCE i skoki MULT_GROUPS

Driver: tdd
Driver why: nowy rodzaj `arrows`, czysty generator grafów/tabelek, opcja `line` generatora SEQUENCE i wariant `jumps` MULT_GROUPS nie istnieją — failing testy (jedno puste pole, zgodność z regułą, brak podpisu brakującego wyrazu, skoki = grupy) prowadzą implementację.

### Overview

Trzy rysunki-dane gotowe dla widżetów fazy 5; żadnych nowych umiejętności.

### Changes Required:

#### 1. ARROW_TABLE

**File**: `src/core/tasks/visual.ts` (`arrows`), `src/core/tasks/generators/arrowTable.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`,
`src/ui/widgets/TaskPicture.ts` (jawne `case 'arrows'`, które rzuca do fazy 5 — plan-review F2)

**Intent**: warianty `graph` (puste wyjście albo puste wejście — odwrotność łączy się ze „sprawdzaniem odejmowania” E2.6) i
`table` (3–4 różne wejścia, jedna reguła, jedno puste wyjście); `op` `+`/`−`, `n` 2–10, wartości 0..`max` (E2: 20, z
przekroczeniem dziesiątki). Polecenie „Uzupełnij graf.” / „Uzupełnij tabelkę.”; podpowiedź: linia działania pustego pola
(„7 + 5 = 12”, odwrotność „12 − 5 = 7”), poprzedzona linią reguły bez wyniku.

**Contract**: `parseArrowTableParams` `{ variants: ('graphOut' | 'graphIn' | 'table')[], max: number, n: [min, max] }`; odpowiedź liczba; tryb `keypad`.

#### 2. Oś w SEQUENCE

**File**: `src/core/tasks/generators/sequence.ts`

**Intent**: opcja `line: true` dodaje `visual: numberLine` (zakres 0..`max`, kreska co `steps[0]`, podpisane podane wyrazy,
okienko na brakującym); parser odrzuca, gdy oś przekracza `maxTicks`.

#### 3. Skoki MULT_GROUPS

**File**: `src/core/tasks/generators/multGroups.ts`, `src/data/pl.ts` (`multGroupsJumps`, podpowiedź)

**Intent**: wariant `jumps`: oś 0..g·k (kreska co 1, podpisy co 5), g łuków „+k” od 0; odpowiedź = działanie na kafelkach jak
`expr` (te same dystraktory); polecenie „Które działanie pokazują skoki?”.

#### 4. Testy

**File**: `tests/arrowTable.test.ts` (nowy), `tests/sequence.test.ts`, `tests/multGroups.test.ts`

**Intent**: 1000 losowań na wariant; graf/tabelka: dokładnie jedno puste pole, wypełnione zgodne z regułą liczoną w teście,
odpowiedź w 0..20; SEQUENCE z osią: brakujący wyraz nie w `labels`, okienko = odpowiedź; `jumps`: liczba łuków = grup, długość = k.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; `sample` E2 i E3 bez zmian w wyjściu (dane jeszcze bez opcji)
- Deliberate break: tabelka z dwoma pustymi polami / brakujący wyraz podpisany na osi / `jumps` z k+1 → czerwone; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów ARROW_TABLE, osi SEQUENCE i `jumps` (6 losowań na wariant)

---

## Phase 4: Rysunek podpowiedzi `Task.hintVisual` i oś w ADD_SUB

Driver: tdd
Driver why: pole `hintVisual`, `addSubJumps`, `RoundView.hintPicture`, układ podpowiedzi i filtr minigry to czysta logika `core` — failing testy (rysunek dopiero w `second`, lądowanie bez podpisu, `line` przy `max > 30` odrzucone, minigra bez `hintVisual`) prowadzą implementację.

### Overview

Nowe pojęcie „rysunek podpowiedzi” w modelu, widoku i układzie; dane jeszcze go nie włączają.

### Changes Required:

#### 1. Model i generator

**File**: `src/core/tasks/types.ts` (`hintVisual?`), `src/core/tasks/generators/addSub.ts` (`addSubJumps`, opcja `line`), `src/core/tasks/validate.ts`

**Intent**: `addSubHint` i oś budowane z jednej listy skoków; opcja `line` wg Critical Implementation Details; walidator:
reguła przecieku dla `hintVisual`, `hintVisual` tylko przy `keypad`.

**Contract**: `addSubJumps(a: number, op: AddSubOp, b: number): { from: number; to: number }[]`; `AddSubParams.line?: true`.

#### 2. Widok i układ

**File**: `src/core/round/view.ts`, `src/core/round/pictureLayout.ts`, `src/data/layout.ts`

**Intent**: `RoundView.hintPicture` (fazy `second`/`solution`/`retype`); `hintPictureLayout(spec, input)` zwraca prostokąt osi pod
wyrażeniem i linii rozwiązania pod osią — tylko `keypad`, inne tryby rzucają.

**Contract**: `PictureSpec.hint: { keypad: { picture: Rect; lines: Rect } }` — prowizorycznie oś x 236, y 530, 768 × 190; linie
x 236, y 730, 768 × 118 (DESIGN-GAP, zrzuty w fazie 6).

#### 3. Minigra i próbki

**File**: `src/core/minigames/word.ts` (`drawTask`), `scripts/sample.ts`

**Intent**: `drawTask` zwraca zadanie bez `hintVisual` (runda słowna ma własny układ, DESIGN-GAP 85); `sample` drukuje linię
`hint visual: <describeVisual>`.

#### 4. Testy

**File**: `tests/addSub.test.ts`, `tests/roundView.test.ts`, `tests/pictureLayout.test.ts`, `tests/wordRound.test.ts`, `tests/contentInvariants.test.ts`

**Intent**: skoki sumują się do wyniku, przejście przez dziesiątkę = dwa skoki z lądowaniem na pełnej dziesiątce, okno ≤ 30,
wynik nie w `labels`; `hintPicture` `null` w `first`/`done`; minigra słowna na skillu z `line` nie niesie `hintVisual`;
inwariant przecieku osi dla `visual` i `hintVisual`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E1` … `E6` bez zmian w wyjściu (żadna umiejętność nie ma jeszcze `line`)
- Deliberate break: `hintPicture` w fazie `first` / wynik w `labels` / `drawTask` przepuszcza `hintVisual` → czerwone; przywrócone; meta-check: test minigry używa prawdziwego `wordTask`, nie ręcznego zadania
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Skoki osi i linie `addSubHint` pochodzą z jednej funkcji; brak parsowania tekstu podpowiedzi

---

## Phase 5: Widżety `NumberLine` i `ArrowGraph`, dane E2.6, E2.7, E3.9

Driver: impl
Driver why: dwa widżety rysowane w kodzie i dane kroków — ryzyko w renderowaniu i treści, logika już przetestowana w fazach 2–3; brak zbudowanej cechy dla e2e.

### Overview

Oś i graf/tabelka widoczne w rundzie; E2.6 i E3.9 dostają nowe umiejętności, E2.7 oś.

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/NumberLine.ts` (nowy), `src/ui/widgets/ArrowGraph.ts` (nowy), `src/ui/widgets/TaskPicture.ts`, `src/data/layout.ts`

**Intent**: `NumberLine` wg `reference/number-line.svg` (oś 4 px z grotem, kreski 2 px, podpisy 28 px, łuki `#54BEB4` z grotem i
etykietą „+k”/„−k”, złote kropki startu, okienko przerywane na kresce okienka); `ArrowGraph` (kółka liczb, strzałka z regułą,
tabelka z wierszem wejść i wyjść, puste pole przerywane). Kolory z `PLACEHOLDER_COLORS`/palety, liczby z `TASK_LAYOUT`.
DESIGN-GAP: oś 0–100 z okienkiem, skoki k > 1, graf/tabelka (wiersze 88+).

**Contract**: kontrakt widżetu jak `NumberCells` (`render(visual, rect)`, `setVisible`, `shown`); `TaskPicture`: rzucające
`case 'numberLine'`/`case 'arrows'` z faz 2–3 zastąpione widżetami (a `column` w fazie 7 — do tego czasu rzuca jawnie, bo `digits` niegrywalny).

#### 2. Dane

**File**: `src/data/curriculum/E2.ts`, `src/data/curriculum/E3.ts`, `tests/curriculum.test.ts`

**Intent**: E2.6 + `E2.6.arrow_graph_20` (`graphOut`, `graphIn`) i `E2.6.arrow_table_20` (keypad), `childName` „Sprawdzanie
odejmowania i grafy”; E2.7 `sequence_tens_100` + `line: true`; E3.9 + `E3.9.mult_groups_jumps` (tiles). `ARROW_TABLE` z `LATER`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E2 --count 6` i `E3 --count 6` bez naruszeń, z liniami `visual:` dla E2.6, E2.7, E3.9
- Deliberate break: `TaskPicture` bez gałęzi `arrows` → typecheck czerwony; przywrócone; meta-check
- `tests/fixtures/` bez zmian; `e2e hook: absent (`; `art-tasks.spec` nadal wymusza `mult_groups_result`/`expr`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E2.6, E2.7, E3.9 `--count 6`
- [visual] Zrzuty: graf z pustym wyjściem, graf z pustym wejściem, tabelka, ciąg na osi E2.7, ciąg w fazie rozwiązania (oś w 768 × 190), skoki E3.9 z kafelkami, skoki z podpowiedzią — 1440×900 i 1024×768

---

## Phase 6: Oś-podpowiedź w `TaskScene`, dane ADD_SUB ≤ 30

Driver: impl
Driver why: wpięcie `hintPicture` w scenę (ten sam `TaskPicture`, prostokąt podpowiedzi, linie pod osią) i dane — ryzyko w układzie przy klawiaturze; logika z fazy 4.

### Overview

Po pierwszym błędzie w zadaniu ADD_SUB ≤ 30 na klawiaturze pod wyrażeniem pojawia się oś ze skokami.

### Changes Required:

#### 1. Scena i hak

**File**: `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`

**Intent**: gdy `view.hintPicture` i brak `view.visual`, rysunek w `hintPictureLayout(...).picture`, linie rozwiązania w `.lines`;
znika przy następnym zadaniu. Hak: `targets.hintPicture` (prostokąt albo `null`) i `snapshot.hintVisual` (rodzaj albo `null`);
`targets.picture` zostaje dla `task.visual`.

#### 2. Dane i spece

**File**: `src/data/curriculum/E2.ts`, `src/data/curriculum/E3.ts`, istniejące spece e2e dotknięte zmianą

**Intent**: `line: true` w `E2.1.add_sub_20_units`, `E2.3.add_bridge_20`, `E2.5.sub_bridge_20`, `E3.2.add_sub_20_bridge`,
`E3.6.add_sub_30_nobridge`, `E3.8.add_sub_30_bridge`. Spece grające rundy E3/E4 z błędem (np. `task-round`, `adaptive`,
`narrator`) sprawdzone pod kątem założeń o pustym obszarze w fazie podpowiedzi i zaktualizowane w tej fazie.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E2 --count 6` i `E3 --count 6` bez naruszeń, z linią `hint visual:` dla sześciu umiejętności
- Deliberate break: `line: true` na umiejętności z `max: 100` → parser czerwony (`contentInvariants`); przywrócone; meta-check
- `e2e hook: absent (`; E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E2.1, E2.3, E2.5, E3.2, E3.6, E3.8 `--count 6` (`hint visual:` ↔ linie podpowiedzi)
- [visual] Zrzuty: ADD_SUB pierwsza próba (bez osi), podpowiedź z osią (dodawanie przez dziesiątkę), podpowiedź z osią (odejmowanie), krok 1 i ostatni krok rozwiązania z osią i liniami, retype — 1440×900 i 1024×768

---

## Phase 7: Widżet `WrittenColumn`, klawiatura klawiszy, gałąź `digits` w scenie

Driver: impl
Driver why: nowy widżet, tryb klawiszy w `Keypad` i wyczerpujące gałęzie w `TaskScene`/`FeedbackBar` — UI bez nowej logiki `core`; tryb jeszcze niegrywalny, więc bez e2e.

### Overview

Scena potrafi wyświetlić i obsłużyć zadanie `digits`; `playable` nadal go nie wpuszcza.

### Changes Required:

#### 1. Słupek

**File**: `src/ui/widgets/WrittenColumn.ts` (nowy), `src/ui/widgets/TaskPicture.ts`, `src/data/layout.ts`

**Intent**: słupek wg `reference/written-addition.svg` (cyfry 72 px w kolumnach co 82 px, znak 64 px, kreska 4 px), wiersz
okienek wyniku (aktywne okienko wyróżnione kształtem i kolorem — style guide), znaki z `columnMarks` (przeniesienie: mała
cyfra w złotym kółku; pożyczka: skreślenie, mała cyfra nad, „1” przed cyfrą). DESIGN-GAP: okienka, aktywne okienko,
pożyczka (wiersze 88+).

**Contract**: `render(visual, rect, marks, boxes: DigitBoxes)`; `TaskPicture` rozdziela `column` wyczerpująco.

#### 2. Klawiatura i scena

**File**: `src/ui/widgets/Keypad.ts`, `src/scenes/TaskScene.ts`, `src/ui/widgets/FeedbackBar.ts`

**Intent**: `Keypad` z opcjonalnym `onKey` (tryb klawiszy: pole tekstowe ukryte, klawisze idą do reduktora sceny); scena trzyma
`DigitBoxes`, odświeża słupek, zgłasza `submit` przez `TaskScene.submit`, po złej odpowiedzi czyści okienka; `drawPrompt`
rysuje w `digits` samo zdanie polecenia; widoczność/aktywność widżetów, `markCorrect`, `answerSpot`, prostokąt linii przez
jeden `switch` po trybie z `never`; `FeedbackBar.update` wyczerpujący (`digits` → pasek klawiatury).

#### 3. Migawka haka

**File**: `src/testing/e2eHook.ts`, `TaskScene.snapshot`/`targets`

**Intent**: `snapshot.digits: { count; filled: number[] } | null`; `targets.keys` bez zmian; `targets.picture` = prostokąt słupka.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: usunięty `case 'digits'` w `switch` sceny → typecheck czerwony (`never`); przywrócone; meta-check: dowodzi strażnika UI
- `tests/answerModes.test.ts` nadal: `playable` bez `digits`; `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Scena tylko karmi reduktor; brak liczb balansu i tekstów gracza w `WrittenColumn`; żaden `if` po trybie w `TaskScene` bez gałęzi `never`

---

## Phase 8: Helpery e2e `digits`, `playable` wpuszcza `digits`, dane WRITTEN, O5

Driver: impl
Driver why: helpery e2e, przełączenie `playable` i dane E5.2/E6.7 — zmiana grywalności i treści, nie nowa logika; kontrakt wymaga helperów w tej samej fazie co `playable`.

### Overview

Słupek grywalny w E5 i E6; e2e umie odpowiedzieć w trybie `digits`.

### Changes Required:

#### 1. Helpery e2e

**File**: `tests/e2e/support/hook.ts`

**Intent**: `Snapshot.input: AnswerMode` (import typu z `src/core/tasks/visual`), `typeDigits(page, n)` (cyfry od jedności +
„OK” przez `targets.keys`), gałęzie `digits` w `answerRight`/`answerWrong` (zła odpowiedź = ta sama liczba cyfr, np. ±1 w
zakresie) — oba helpery jako `switch` z `never`.

#### 2. Grywalność i dane

**File**: `src/core/round/pick.ts`, `tests/answerModes.test.ts`, `src/data/curriculum/E5.ts`, `src/data/curriculum/E6.ts`, `tests/curriculum.test.ts`, `tests/contentInvariants.test.ts`,
`tests/pick.test.ts` (lista trybów w asercji `toContain(skill.answer)` i filtr `eligible`), `tests/curriculumPick.test.ts` (niezależna wyrocznia `isPlayable`)

**Intent**: `playable` wpuszcza `digits` (komentarz zaktualizowany); E5.2 + `E5.2.written_add_100` (`carry: 'any'`),
`E5.2.written_sub_100`, `childName` „Dwucyfrowe, rzymskie i słupek”; E6.7 + `E6.7.written_add_1000`, `E6.7.written_sub_1000`
(`carry: 'required'`), `childName` „Słupek i sprawdzanie działań”; `WRITTEN` z `LATER`; `KEYPAD_HINT_MAX` obejmuje `digits`. Dwie ręczne listy czterech trybów w testach (`tests/pick.test.ts`,
`isPlayable` w `tests/curriculumPick.test.ts`) dostają `digits` — inaczej `skillBuckets` E6 (`previous` = całe E5 z WRITTEN) i
losowania E5/E6 w `pick.test` są czerwone (plan-review F3); wyrocznia zostaje jawną listą (niezależna od `playable`).

#### 3. O5

**File**: `src/data/pl.ts` (`capacityHalfFact`/`capacityQuarterAlso`), `tests/contentInvariants.test.ts`

**Intent**: pierwsza podpowiedź `E5.5.capacity_quarter_l` ≤ 64 znaki (skrócenie albo podział na dwie linie); wpis z
`LONG_KEYPAD_HINTS` usunięty (zbiór pusty zostaje jako reguła).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; rozwiązywalność obejmuje cztery umiejętności WRITTEN
- `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń, z linią `visual: [column …]`
- Deliberate break: `answerRight` bez gałęzi `digits` → typecheck czerwony (`never`); E6 `carry: 'any'` z wynikiem < 100 → rozwiązywalność/walidator czerwone; `LONG_KEYPAD_HINTS` pusty przy starym tekście → inwariant czerwony; przywrócone; meta-check
- `tests/fixtures/` bez zmian; `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E5.2, E6.7 i E5.5 `--count 6` (linie kolumn, „1 dalej”, pożyczka, skrócona podpowiedź O5)
- [visual] Zrzuty: słupek E5 pusty, częściowo wypełniony (aktywne okienko), podpowiedź z przeniesieniem, kroki rozwiązania obok słupka, odejmowanie z pożyczką w rozwiązaniu, słupek E6 trzycyfrowy, retype, poprawna odpowiedź — 1440×900 i 1024×768
- [human] Notacja przeniesienia i pożyczki w słupku (mała cyfra w kółku nad następną kolumną; skreślenie, cyfra zmniejszona nad, „1” przed cyfrą) pochodzi z wiedzy ogólnej, nie z repo ani kitu — autor potwierdza albo podaje szkolny zapis

---

## Phase 9: Dokumentacja, luki projektu, follow-upy i seam sweep

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Porządek przed e2e.

### Changes Required:

#### 1. Seam sweep

**File**: cała zmiana

**Intent**: zduplikowane helpery (pętla kolumn w `written.ts` vs generator, okienko przerywane w `NumberLine`/`ArrowGraph`/
`WrittenColumn` → jedna funkcja rysująca, rozmieszczenie podpisów osi), nieaktualne komentarze (`playable` „tiles, keypad,
select or drag”, `pictureLayout` nagłówek, `roundView` fallback), komentarze `DESIGN-GAP` ↔ wiersze 88+.

#### 2. Dokumenty i follow-upy

**File**: `CLAUDE.md` („Current state”: zdanie o S-14b — `digits`, `ANSWER_MODES`/`never`, `column`/`numberLine`/`arrows`,
`hintVisual`, WRITTEN, ARROW_TABLE; poprawka „save format v1” → v2 w akapicie S-11/S-15, skoro i tak dotykamy akapitu),
`docs/design-gaps.md`, `context/changes/number-line-written-arrows/follow-ups/review-fixes.md`

**Intent**: follow-upy z `Trigger:` — WRITTEN „brakujące cyfry” → `S-14c or the next change to WRITTEN`; ARROW_TABLE „·n”,
łańcuch, kilka pustych pól → `S-14c or a multi-number reducer`; oś-podpowiedź E1/kafelki i > 30 → `S-14d (E1 picture mode) or a
layout band above the tiles`; `place_read_12` → `S-14d`; `capacity_half_l_e5` → `S-14c`; `ArtPool`/S14-09/S14-10 → `the next
widget built on ArtImage`; O6/O2 → zamknięte dla osi (190 px wystarcza) i słupka (układ `digits`), zostaje dla innych rysunków
`Trigger: next change to the solution layout beside the keypad`.

### Success Criteria:

#### Automated Verification:

- `bash scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- Komentarze `DESIGN-GAP (docs/design-gaps.md row 8x/9x)` w `src/` ↔ wiersze 88+ w `docs/design-gaps.md`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Każdy follow-up ma `Trigger:`; brak komentarzy o czterech trybach; brak duplikatu rysowania okienka
- [human] Decyzje wbrew dosłownemu tekstowi ZADANIA/PRD: ARROW_TABLE bez „·3” i bez łańcucha strzałek, WRITTEN bez „brakujących cyfr”, przeniesienie rysowane przez grę (dziecko go nie wpisuje), oś-podpowiedź bez E1 i bez ADD_SUB > 30, oś SEQUENCE tylko w E2.7, E5.2 słupek z przeniesieniem (przykłady kroku są bez); wyższe progi odblokowania na żywych zapisach dla E2.6, E3.9, E5.2, E6.7 (tabela progów — wolniej, nic nie ginie)

---

## Phase 10: Słupek pisemny dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) dla trybu `digits`: kolejność okienek od jedności, czyszczenie po błędzie, słupek i linie obok w rozwiązaniu — istnieje tylko w renderowanej scenie; zbudowane w fazach 7–8, `E2E=on`.

### Overview

Nowy `tests/e2e/written-column.spec.ts` (projekt `chromium-hook`), umiejętności przez `?e2eSkills`; cel < 60 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`written-column` w `ROUND_SPEC`), `tests/e2e/written-column.spec.ts` (nowy)

**Intent**: (a) „#11 a written column takes digits ones-first and pays a star”: E5, `E5.2.written_add_100` → po pierwszym
klawiszu `snapshot.digits.filled` = [cyfra jedności] → `typeDigits` → gwiazdka. (b) „#11 a wrong column gets a hint and a
cleared second try”: `answerWrong` → pasek podpowiedzi, `digits.filled` puste → `answerRight` → gwiazdka. (c) „#11 the
solution keeps the column with its lines beside it and a retype ends the task”: E6, `E6.7.written_sub_1000` → dwa razy
`answerWrong` → `solution`, `targets.picture` w `TASK_LAYOUT.picture.digits.picture` → retype → gwiazdka.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na migawce. Chromium niedostępny →
protokół request-file (`e2e-request-p10.md`, patche `e2e-break-p10a…c.patch`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/written-column.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`
- Deliberate break (patch `e2e-break-p10a.patch`): `stepDigitBoxes` wypełnia od lewej → (a) czerwony
- Deliberate break (patch `e2e-break-p10b.patch`): scena nie czyści okienek po złej odpowiedzi → (b) czerwony; meta-check: dowodzi resetu w scenie, nie w reduktorze
- Deliberate break (patch `e2e-break-p10c.patch`): `digits` w rozwiązaniu bierze `keypadSolution` → (c) czerwony; każdy oczekiwany czerwony uruchomiony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 11: Oś, grafy i oś-podpowiedź dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 dla nowych rysunków przy klawiaturze i kafelkach oraz dla rysunku pojawiającego się dopiero po błędzie — widoczne tylko w renderowanej scenie; zbudowane w fazach 5–6, `E2E=on`.

### Overview

Nowy `tests/e2e/number-line.spec.ts` (projekt `chromium-hook`); cel < 60 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`number-line` w `ROUND_SPEC`), `tests/e2e/number-line.spec.ts` (nowy)

**Intent**: (a) „#11 an ADD_SUB number line shows only after a miss”: E3, `E3.8.add_sub_30_bridge` → `targets.hintPicture`
`null` przy pierwszej próbie → `answerWrong` → `hintPicture` w prostokącie `TASK_LAYOUT.picture.hint.keypad.picture` →
`answerRight` → gwiazdka. (b) „#11 an arrow graph takes the keypad”: E2, `E2.6.arrow_graph_20` → `targets.picture` nie
`null` → `answerRight` → gwiazdka. (c) „#11 number-line jumps take an expression tile”: E3, `E3.9.mult_groups_jumps` →
`snapshot.visual` = `numberLine` → `answerRight` (kafelek) → gwiazdka.

**Contract**: jak faza 10; request-file `e2e-request-p11.md`, patche `e2e-break-p11a…c.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/number-line.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas pełnego zestawu zapisany
- Deliberate break (patch `e2e-break-p11a.patch`): `hintPicture` także w fazie `first` → (a) czerwony
- Deliberate break (patch `e2e-break-p11b.patch`): `ArrowGraph.render` nic nie rysuje (`shown()` false) → (b) czerwony; meta-check: hak czyta `shown()`
- Deliberate break (patch `e2e-break-p11c.patch`): `jumps` bez odpowiedzi w `choices` → (c) czerwony; każdy oczekiwany czerwony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Reduktor okienek, `canonicalInput` dla `digits`, lista trybów vs `playable`, wyczerpywalność przez `never` (typecheck).
- WRITTEN: liczba cyfr wyniku, przeniesienie wymagane w E6, arytmetyka linii kolumn liczona w teście, `columnMarks`.
- ARROW_TABLE, SEQUENCE z osią, MULT_GROUPS `jumps`, ADD_SUB z `line`: 1000 losowań, reguła przecieku osi.
- `RoundView.hintPicture` per faza, `hintPictureLayout`, minigra słowna bez `hintVisual`.

### Integration Tests:

- `tests/solvableInMode.test.ts` i `tests/contentInvariants.test.ts` obejmują nowe umiejętności automatycznie.
- E2E #11: `written-column.spec.ts`, `number-line.spec.ts`.

### Manual Testing Steps:

1. Odczyt nauczyciela `npm run sample -- E2|E3|E5|E6 --count 6` w fazach 5, 6, 8.
2. Zrzuty stanów (fazy 5, 6, 8) w 1440×900 i 1024×768.
3. Na tablecie: stuknięcia cyfr w okienka, czytelność osi 0–30 przy 1024 px (lista kontrolna po runie).

## Performance Considerations

Brak: rysunki to kilkadziesiąt prymitywów `Graphics`; 1000 losowań na umiejętność dodaje kilkanaście testów (czas unit < +2 s).

## Migration Notes

Format zapisu **v2** bez zmian (odpowiedź `digits` to liczba, `MistakeExample.given` bez zmian; `validLearner` nie zna ID
umiejętności). Nowe umiejętności startują z mastery 0; progi rosną zgodnie z tabelą, bez cofania `unlockedStep`.

## Known risks

- **Miejsce słupka i linii obok** (prowizoryczne prostokąty `digits`) — linie kolumn ~40 znaków zawijają się w 320 px;
  zmieniłoby: zrzut 8.x z nieczytelnymi liniami → linie pod słupkiem w pasku (zmiana `PictureSpec.digits`).
- **Oś 0–30 przy 1024 px** (~19 CSS px na kreskę) — podpisy tylko co 5; zmieniłoby: zrzut/tablet → okno osi ≤ 20 jednostek
  (wąska opcja w `addSubJumps`) albo oś tylko dla skoku przez dziesiątkę.
- **Spece grające E3 z błędem** zobaczą oś-podpowiedź (faza 6); hak trzyma `targets.picture` bez zmian, więc ryzyko niskie.
- **Chromium w sesji agenta**: e2e uruchamia orkiestrator; fazy 10–11 protokół request-file.
- **Minigra słowna wymusza `answer: 'tiles'`** (`drawTask` → `generateTask({ ...skill, answer: 'tiles' })`, bez `validateTask`):
  skill ADD_SUB z `line: true` da tam `hintVisual` na zadaniu kafelkowym; jedyną zaporą jest zdjęcie pola w `drawTask` (faza 4,
  test na prawdziwym `wordTask`) — zmieniłoby: nowa minigra wołająca `generateTask` bez tego filtra (plan-review F4).
- **Notacja pożyczki** bez źródła w repo — `[human]` 8.8; zmieniłoby: inna szkolna notacja autora → tylko `columnMarks` i widżet.

## References

- Research: `context/changes/number-line-written-arrows/research.md`; change: `context/changes/number-line-written-arrows/change.md`
- Kontrakt runu: `context/runs/2026-10-14-save-s13b-s15-s14b/agent-contract.md` (§ S-14b); profil `context/foundation/autonomous-run.md` § 6, § 8, § 9
- Katalog: `docs/ZADANIA.md` § 1 (podpowiedź: oś), § 2 (zakresy E2, E5, E6), § 3 (E2.6, E2.7, E3.9, E5.2, E6.7), § 4 (ARROW_TABLE, WRITTEN, SEQUENCE, MULT_GROUPS); PRD FR-023
- Test-plan: `context/foundation/test-plan.md` ryzyka #1, #5, #11, #13, #17; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md` („Code-drawn helpers”, „Font and spacing”), `reference/written-addition.svg`, `reference/number-line.svg`, `reference/helper-metadata.json`
- Wzorce: `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/plan.md` (`dragMode`, `canonicalInput`, helper przed `playable`), `context/archive/2026-10-14-minigame-daily-puzzle/` (`drawTask`), `src/core/round/canonicalInput.ts`, `src/ui/widgets/TaskPicture.ts`, `src/core/tasks/generators/addSub.ts`

## Autonomous decisions

1. **`digits` jako nowy `AnswerMode` z liczbą jako odpowiedzią; okienka = kolumny szerszego składnika, wynik ograniczony do tej
   liczby cyfr.** Odrzucone: odpowiedź tablicą cyfr (bez `captureFirstWrong`, porównanie jak zbiór, presja na zapis v3);
   „klawiatura z fokusem” w `keypad`; okienka = długość odpowiedzi (zdradza przeniesienie do nowej kolumny). Dlaczego: research
   Summary 1, 3. Zmieniłoby: teacher read wymagający wyniku 100 w E5 (wtedy zawsze obecne trzecie okienko).
2. **Strażnik wyczerpywalności: `ANSWER_MODES` + `switch` z `never` w `core` (faza 1), UI (faza 7), helperach e2e (faza 8),
   plus `tests/answerModes.test.ts` z jawną listą trybów wpuszczonych przez `playable`.** Odrzucone: sam test po trybach
   (nie widzi gałęzi w scenie). Dlaczego: polecenie kroku; lekcja S-13b (S13-04). Zmieniłoby: nic.
3. **Kolejność wpisywania od jedności w lewo; po błędzie wszystkie okienka czyszczone; przeniesienie/pożyczkę rysuje gra
   (`first` w podpowiedzi, `all` w rozwiązaniu), dziecko ich nie wpisuje.** Wbrew dosłownemu ZADANIA („przeniesienie
   zaznaczane małą cyfrą” — zaznacza je gra) → `[human]` 9.6; notacja z wiedzy ogólnej → `[human]` 8.8. Zmieniłoby: teacher read
   / autor — okienko przeniesienia jako część trybu (odpowiedź nadal liczbą).
4. **E5.2 słupek z przeniesieniem dozwolonym (`carry: 'any'`), E6.7 z wymaganym.** Odrzucone: E5.2 bez przeniesienia (przykłady
   kroku 23 + 42, 65 − 42). Dlaczego: słupek uczy przeniesienia; research Open Q 1. → `[human]` 9.6. Zmieniłoby: teacher read.
5. **MULT_GROUPS `jumps` z odpowiedzią „działanie” na kafelkach.** Odrzucone: liczba lądowania z okienkiem (nowa powierzchnia
   przecieku). Dlaczego: research Open Q 2, dystraktory `expr`. Zmieniłoby: teacher read uznający pytanie o wynik za lepsze.
6. **Jeden rysunek podpowiedzi `hintVisual` (nie para hint/solution), lądowanie zawsze bez podpisu, okienko na lądowaniu.**
   Odrzucone: dwa rysunki z podpisanym lądowaniem w rozwiązaniu (wynik i tak stoi w ostatniej linii; dwa rysunki = dwa razy
   walidacja). Zmieniłoby: zrzuty pokazujące, że dzieci potrzebują pełnej osi w rozwiązaniu.
7. **Oś-podpowiedź tylko dla ADD_SUB ≤ 30 na klawiaturze (E2.1, E2.3, E2.5, E3.2, E3.6, E3.8), bez E1 (kafelki).** Odrzucone: E1.3,
   E1.5, E1.9 (ekran E1 nie ma pasa między wyrażeniem a kafelkami; nowy układ kafelków to S-14d). Wbrew ZADANIA § 1 (oś jako
   podpowiedź ogólnie) → `[human]` 9.6, follow-up. Zmieniłoby: S-14d z trybem obrazkowym E1 albo zrzut z miejscem nad kafelkami.
8. **Prostokąty układu prowizoryczne w `TASK_LAYOUT` (słupek 440 × 508 + linie obok; oś-podpowiedź 768 × 190 pod wyrażeniem),
   potwierdzane bramką wizualną, nie zmiana `keypadSolution`.** Research Open Q 3; O6/O2 zamknięte dla osi i słupka.
   Zmieniłoby: zrzut z nakładaniem na wyrażenie/pasek.
9. **ARROW_TABLE: graf (puste wyjście albo wejście) i tabelka z jednym pustym polem na klawiaturze, `+`/`−`, do 20; bez „·n” i
   łańcucha.** Wbrew ZADANIA § 4 (wymienia „·3” i łańcuch) → `[human]` 9.6, follow-up. Dlaczego: mnożenie zaczyna się w E3,
   ARROW_TABLE jest tylko w E2.6; łańcuch to drugi pusty wynik. Zmieniłoby: reduktor wielu liczb.
10. **`Keypad` z opcjonalnym `onKey` zamiast drugiego widżetu klawiatury** (research Open Q 5): `targets.keys` bez zmian dla e2e.
    Zmieniłoby: konflikt stanu `buffer` z trybem klawiszy w implementacji.
11. **O5 w zakresie (faza 8), `place_read_12`/`capacity_half_l_e5`/`ArtPool` tylko przeniesione triggerem** (change.md).
    Zmieniłoby: oś dająca sens 11–12 (nie daje — dwie liczby).
12. **Brak `AskUserQuestion` (kontrakt reguła 1):** złożoność HIGH, wszystkie pytania rozstrzygnięte z research/change.md;
    roadmapa S-14b → `planning` w commicie planu; 11 faz z reguły ≤ 2 komponentów UI na fazę.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Strażnik trybów i tryb `digits` w `core`

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — cfea708
- [x] 1.2 Deliberate break: usunięty `case 'digits'` w `pictureLayout` → typecheck czerwony; reduktor od lewej → czerwony; `playable` wpuszcza `digits` → czerwony; przywrócone; meta-check — cfea708
- [x] 1.3 `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian — cfea708
- [ ] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 1.5 [reviewer] Żaden konsument trybu w `src/core/` nie kończy się cichym `return` kafelków/klawiatury; reduktor bez Phasera

### Phase 2: Rysunki `column` i `numberLine`, generator WRITTEN

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Klucze `generators`/`parsers` równe; `WRITTEN` nadal w `LATER` (bez umiejętności)
- [ ] 2.3 Deliberate break: wynik E5 dopuszcza 100 / `required` bez przeniesienia / podpis osi = odpowiedź → czerwone; przywrócone; meta-check
- [ ] 2.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 2.5 [reviewer] Odczyt nauczyciela szablonów WRITTEN (6 losowań na wariant z testu/`describeVisual`): linie kolumn, „1 dalej”, pożyczka, polecenia

### Phase 3: Rysunek `arrows`, generator ARROW_TABLE, oś w SEQUENCE i skoki MULT_GROUPS

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Klucze `generators`/`parsers` równe; `sample` E2 i E3 bez zmian w wyjściu (dane jeszcze bez opcji)
- [ ] 3.3 Deliberate break: tabelka z dwoma pustymi polami / brakujący wyraz podpisany na osi / `jumps` z k+1 → czerwone; przywrócone; meta-check
- [ ] 3.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.5 [reviewer] Odczyt nauczyciela szablonów ARROW_TABLE, osi SEQUENCE i `jumps` (6 losowań na wariant)

### Phase 4: Rysunek podpowiedzi `Task.hintVisual` i oś w ADD_SUB

#### Automated

- [ ] 4.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 4.2 `npm run sample -- E1` … `E6` bez zmian w wyjściu (żadna umiejętność nie ma jeszcze `line`)
- [ ] 4.3 Deliberate break: `hintPicture` w fazie `first` / wynik w `labels` / `drawTask` przepuszcza `hintVisual` → czerwone; przywrócone; meta-check
- [ ] 4.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 4.5 [reviewer] Skoki osi i linie `addSubHint` pochodzą z jednej funkcji; brak parsowania tekstu podpowiedzi

### Phase 5: Widżety `NumberLine` i `ArrowGraph`, dane E2.6, E2.7, E3.9

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 5.2 `npm run sample -- E2 --count 6` i `E3 --count 6` bez naruszeń, z liniami `visual:` dla E2.6, E2.7, E3.9
- [ ] 5.3 Deliberate break: `TaskPicture` bez gałęzi `arrows` → typecheck czerwony; przywrócone; meta-check
- [ ] 5.4 `tests/fixtures/` bez zmian; `e2e hook: absent (`; `art-tasks.spec` nadal wymusza `mult_groups_result`/`expr`
- [ ] 5.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.6 [reviewer] Odczyt nauczyciela `sample` E2.6, E2.7, E3.9 `--count 6`
- [ ] 5.7 [visual] Zrzuty: graf z pustym wyjściem, graf z pustym wejściem, tabelka, ciąg na osi E2.7, ciąg w fazie rozwiązania (oś w 768 × 190), skoki E3.9 z kafelkami, skoki z podpowiedzią — 1440×900 i 1024×768

### Phase 6: Oś-podpowiedź w `TaskScene`, dane ADD_SUB ≤ 30

#### Automated

- [ ] 6.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 6.2 `npm run sample -- E2 --count 6` i `E3 --count 6` bez naruszeń, z linią `hint visual:` dla sześciu umiejętności
- [ ] 6.3 Deliberate break: `line: true` na umiejętności z `max: 100` → parser czerwony; przywrócone; meta-check
- [ ] 6.4 `e2e hook: absent (`; E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 6.5 [reviewer] Odczyt nauczyciela `sample` E2.1, E2.3, E2.5, E3.2, E3.6, E3.8 `--count 6` (`hint visual:` ↔ linie podpowiedzi)
- [ ] 6.6 [visual] Zrzuty: ADD_SUB pierwsza próba (bez osi), podpowiedź z osią (dodawanie przez dziesiątkę), podpowiedź z osią (odejmowanie), krok 1 i ostatni krok rozwiązania z osią i liniami, retype — 1440×900 i 1024×768

### Phase 7: Widżet `WrittenColumn`, klawiatura klawiszy, gałąź `digits` w scenie

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 7.2 Deliberate break: usunięty `case 'digits'` w `switch` sceny → typecheck czerwony; przywrócone; meta-check
- [ ] 7.3 `tests/answerModes.test.ts` nadal: `playable` bez `digits`; `e2e hook: absent (`
- [ ] 7.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 7.5 [reviewer] Scena tylko karmi reduktor; brak liczb balansu i tekstów gracza w `WrittenColumn`; żaden `if` po trybie w `TaskScene` bez gałęzi `never`

### Phase 8: Helpery e2e `digits`, `playable` wpuszcza `digits`, dane WRITTEN, O5

#### Automated

- [ ] 8.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; rozwiązywalność obejmuje cztery umiejętności WRITTEN
- [ ] 8.2 `npm run sample -- E5 --count 6` i `E6 --count 6` bez naruszeń, z linią `visual: [column …]`
- [ ] 8.3 Deliberate break: `answerRight` bez gałęzi `digits` → typecheck czerwony; E6 `carry: 'any'` z wynikiem < 100 → czerwone; stary tekst O5 przy pustym `LONG_KEYPAD_HINTS` → inwariant czerwony; przywrócone; meta-check
- [ ] 8.4 `tests/fixtures/` bez zmian; `e2e hook: absent (`
- [ ] 8.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 8.6 [reviewer] Odczyt nauczyciela `sample` E5.2, E6.7 i E5.5 `--count 6` (linie kolumn, „1 dalej”, pożyczka, skrócona podpowiedź O5)
- [ ] 8.7 [visual] Zrzuty: słupek E5 pusty, częściowo wypełniony (aktywne okienko), podpowiedź z przeniesieniem, kroki rozwiązania obok słupka, odejmowanie z pożyczką w rozwiązaniu, słupek E6 trzycyfrowy, retype, poprawna odpowiedź — 1440×900 i 1024×768
- [ ] 8.8 [human] Notacja przeniesienia i pożyczki w słupku pochodzi z wiedzy ogólnej, nie z repo ani kitu — autor potwierdza albo podaje szkolny zapis

### Phase 9: Dokumentacja, luki projektu, follow-upy i seam sweep

#### Automated

- [ ] 9.1 `bash scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 9.2 Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- [ ] 9.3 Komentarze `DESIGN-GAP` w `src/` ↔ wiersze 88+ w `docs/design-gaps.md`
- [ ] 9.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 9.5 [reviewer] Każdy follow-up ma `Trigger:`; brak komentarzy o czterech trybach; brak duplikatu rysowania okienka
- [ ] 9.6 [human] Decyzje wbrew dosłownemu ZADANIA/PRD: ARROW_TABLE bez „·3” i łańcucha, WRITTEN bez „brakujących cyfr”, przeniesienie rysowane przez grę, oś-podpowiedź bez E1 i > 30, oś SEQUENCE tylko w E2.7, E5.2 z przeniesieniem; wyższe progi odblokowania na żywych zapisach (E2.6, E3.9, E5.2, E6.7)

### Phase 10: Słupek pisemny dotykiem — e2e (#11)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/written-column.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`
- [ ] 10.2 Deliberate break (patch `e2e-break-p10a.patch`): `stepDigitBoxes` wypełnia od lewej → (a) czerwony
- [ ] 10.3 Deliberate break (patch `e2e-break-p10b.patch`): scena nie czyści okienek po złej odpowiedzi → (b) czerwony; meta-check
- [ ] 10.4 Deliberate break (patch `e2e-break-p10c.patch`): `digits` w rozwiązaniu bierze `keypadSolution` → (c) czerwony; każdy czerwony osobno (`-g`); przywrócone
- [ ] 10.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 11: Oś, grafy i oś-podpowiedź dotykiem — e2e (#11)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/number-line.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas pełnego zestawu zapisany
- [ ] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): `hintPicture` także w fazie `first` → (a) czerwony
- [ ] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): `ArrowGraph.render` nic nie rysuje → (b) czerwony; meta-check
- [ ] 11.4 Deliberate break (patch `e2e-break-p11c.patch`): `jumps` bez odpowiedzi w `choices` → (c) czerwony; każdy czerwony osobno (`-g`); przywrócone
- [ ] 11.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
