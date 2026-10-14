# Zadania z grafiką paczki A (monety, waga, dzbanki, termometr, ikony) i widżety S-13 w E1–E2, E5–E6 — Implementation Plan

## Overview

Slice roadmapy **S-14** (`art-tasks-all-stages`, etap M6), autonomiczny run `2026-10-13-s12-s14`, gałąź
`feat/art-tasks-all-stages` z `main` @ `bb00d7f`. Pierwsza grafika rastrowa w grze: dziecko rozwiązuje w rundzie zadania
z ilustracjami paczki A v1 (`designs/martynka-maths-A-v1/`), przekonwertowanymi do WebP i zapisanymi w `public/assets/tasks/`:

- **MONEY_COUNT** i **MONEY_CHANGE** — monety i banknoty na stole (E1.11, E2.2, E2.8, E4.1);
- **MASS** — waga szalkowa w równowadze: przedmiot (ikona) na lewej szalce, odważniki na prawej (E1.11, E2.8, E3.4, E4.1, E5.5);
- **CAPACITY** — rząd dzbanków 1 l / ½ l / ¼ l (E2.2, E4.7, E5.5);
- **TEMPERATURE** — termometr (obudowa z paczki + słupek i podziałka w kodzie, wg `reference/thermometer-face.js`) (E3.11, E5.4, E6.1);
- **COUNT** i **MULT_GROUPS** — ikony paczki w jednej grupie, w dziesiątkach albo w ramkach-grupach (E1.2, E1.4, E1.10, E3.9);
- tanie **dane dla widżetów S-13** (CLOCK, DATA, LENGTH, PLACE_VALUE) w E1, E2, E5, E6.

Pięć pustych kroków staje się grywalnych: **E1.8, E1.10, E2.2, E2.8, E5.5**. MONEY_PAY (przeciąganie monet do portfela) i
reszta „pełnego zestawu typów” idą do nowych pozycji roadmapy **S-14b / S-14c / S-14d** (proposed, dopisane w tym commicie).
Format zapisu zostaje **v1**. Żaden nowy tryb odpowiedzi: każda nowa umiejętność to `tiles` albo `keypad`.

## Current State Analysis

Z `research.md` (commit `7ffc995`) i `change.md`, potwierdzone odczytem w tym kroku:

- **Brak grafiki rastrowej**: `src/scenes/BootScene.ts` `BootScene.preload` ładuje tylko font (`FONT_URL`); `public/assets/`
  nie istnieje. Precache (`vite/config.shared.mjs` `pwaOptions.workbox.globPatterns`) już obejmuje `webp`,
  `maximumFileSizeToCacheInBytes` 10 MiB. Błąd ładowania obrazu jest cichy (brak `loaderror`; `installErrorBoundary` pomija
  zasoby) i rysuje teksturę `__MISSING`.
- **Luka seeda (#8)**: `tests/e2e/seed.spec.ts` liczy tylko `response` — asset spoza precache daje `requestfailed`, spec
  zostaje zielony.
- **Model rysunku** (`src/core/tasks/visual.ts`): `TaskVisual` = `clock | ruler | blocks | bars`; `visualKey` i
  `describeVisual` są wyczerpujące, `validateVisual` ma `switch` bez gałęzi wyczerpującej (brak przypadku kompiluje się).
  `src/ui/widgets/TaskPicture.ts` dyspozytor rodzajów; `bounds()` zwraca prostokąt tylko gdy rysowany widżet `shown()`
  (poprawka F1 z S-13).
- **Tryby odpowiedzi**: `Keypad` bez minusa i przecinka; `AnswerTiles` rysuje `String(value)`; odpowiedzi tekstowe z
  `choices` generatora to sprawdzony wzór (CLOCK `timeChoices`). E1 jest tylko kafelkowe (nagłówek `src/data/curriculum/E1.ts`,
  przypięte w `tests/generateTask.test.ts`).
- **Walidator** (`src/core/tasks/validate.ts`): `ValidationContext { max?, nouns? }`; odrzuca ujemną odpowiedź, ujemne
  `choices` i `NEGATIVE_NUMBER` w tekstach — TEMPERATURE potrzebuje wyjątku. `NUMBER_WORD` nie zna przecinka („2,5 litra”
  czytane jako „5 litra”). `src/core/round/hints.ts` `leaksAnswer` sprawdza odpowiedzi tekstowe tylko dla czasu;
  `lastNumber` gubi minus.
- **Układ** (`src/data/layout.ts` `TASK_LAYOUT.picture`): `keypadSolution.picture` 768×190 — termometr 1:3 dostałby 63×190
  (follow-up O2 z S-13, wyzwolony). Trzy identyczne typy prostokąta: `src/core/round/dragLayout.ts` `Rect`,
  `src/core/round/pictureLayout.ts` `PictureRect`, `src/ui/widgets/geometry.ts` `Rect` (follow-up „next change to dragLayout
  or pictureLayout”, wyzwolony zmianą `pictureLayout`).
- **Program**: krok grywalny = ≥ 1 grywalna umiejętność (`src/core/curriculum.ts` `playableSteps`); pięć nowych kroków
  przestawia `calendarStart` (E1 lis 5→6, gru 7→8, sty 11→10; E2 lut 3→2, mar 4→3, cze 10→9, floor ahead 3→2; E5 paź 3→4) i
  `unlockReady` (zatrzymuje się na nowych krokach). Testy przypięte: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`,
  `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`, `tests/curriculum.test.ts` (research § 8).
- **Rzeczowniki** (`src/data/nouns.ts`): są `złoty`, `grosz`, `jabłko`, `gruszka`, `rogalik`, `książka`, `kredka`, `filiżanka`,
  `kwiatek`, `poduszka`, `talerz`, `ciastko`; brak `litr`, `kilogram`, `dekagram`, `stopień`, `moneta`, `banknot`,
  `odważnik`, `dzbanek`, `lampa`, `klucz`, `kłębek`, `czajniczek`. `pluralCategory` rzuca na liczbach ujemnych.
- **E2E**: `answerRight`/`answerWrong` (`tests/e2e/support/hook.ts`) odpowiadają kafelkiem równym odpowiedzi (także tekstowym)
  albo klawiaturą — nowe umiejętności nie wymagają helperów. Szew `?e2eSkills` (S-13) wymusza umiejętności bieżącego etapu;
  etap inny niż E3 przez `passWelcomeAsParent`. `adaptive.spec` blisko limitu 180 s (follow-up nie wyzwolony: brak nowych
  `drag`).
- `docs/design-gaps.md`: ostatni wiersz 58; S-14 zaczyna od 59. `context/foundation/lessons.md` nie istnieje (sprawdzone) —
  lekcje z impl-review S-13 (F1: widżet nigdy nie narysowany przeszedł e2e, bo sprawdzenie czytało prostokąt układu; F2:
  pełne e2e na granicy czasu) są zastosowane niżej w kontraktach haka i fazie 10.
- Baseline (kontrakt): `main` @ `bb00d7f`: unit `1482 passed`, e2e `42 passed`. Gałąź = main + dokumenty; każda faza mierzy
  na gałęzi i raportuje baseline + delta.

## Desired End State

- Zadanie z grafiką pokazuje prompt, ilustrację z paczki A (monety/banknoty, waga z odważnikami i przedmiotem, dzbanki,
  termometr, ikony) i odpowiedź kafelkami albo klawiaturą; podpowiedź i kroki rozwiązania obok ilustracji, która zostaje
  widoczna. Termometr przy klawiaturze w fazie rozwiązania stoi **po lewej**, linie po prawej (O2).
- Ujemne temperatury („−5 °C”, prawdziwy minus U+2212) i kwoty z groszami („3 zł 40 gr”) odpowiadane kafelkami tekstowymi;
  pełne złote, dekagramy, litry i stopnie dodatnie od E2/E3 klawiaturą.
- 38 plików WebP (15 money + 11 measuring + 12 icons) w `public/assets/tasks/{money,measuring,icons}/` (≈ 0,5 MB), generowanych `npm run art` z kitu,
  ładowanych w `BootScene.preload`, w precache; offline (seed #8) każdy z nich przychodzi z service workera.
- Brak obrazu nie zatrzymuje gry: widżet rysuje zastępczy kształt w kodzie, `BootScene` ostrzega w konsoli.
- E1.8, E1.10, E2.2, E2.8, E5.5 grywalne z `childName`; E1.2, E1.4, E1.11, E2.1, E2.9, E2.10, E3.4, E3.9, E3.11, E4.1, E4.7,
  E5.4, E5.7, E6.1, E6.5 z nowymi umiejętnościami.
- Treść: generatory czyste, z parserami, testami 1000 losowań, inwariantami treści, `sample` drukuje rysunek jedną linią;
  odczyt nauczyciela każdego zmienionego kroku.
- E2E: nowy `tests/e2e/art-tasks.spec.ts` (#11) czyta **własny stan widoczności** każdego widżetu i każdej tekstury
  (załadowana, nie `__MISSING`); seed (#8) sprawdza precache każdego obrazu.

### Key Discoveries:

- `pictureLayout` jest jedynym miejscem decyzji o prostokącie — wariant „obok” dla wysokich rysunków to czysta funkcja +
  liczby w `TASK_LAYOUT.picture` (research § 4).
- Kontrakt haka z S-13 (`bounds()` gdy `shown()`) nie mówi nic o teksturze: obraz `__MISSING` jest „widoczny”. Hak musi
  zwracać klucz i stan załadowania każdego pokazanego obrazu (lekcja F1).
- `designs/` jest gitignored — commitowane są tylko wyniki konwersji; `cwebp` potrzebny lokalnie, nie w CI (research § 2).

## What We're NOT Doing

- **MONEY_PAY** (przeciąganie monet do portfela, „najmniej monet”) → **S-14d** (research decyzja 1; wymaga nowego układu,
  widżetu `Wallet`, wariantu `drag`, haka i helperów e2e).
- MASS „cięższe/lżejsze” (waga przechylona — brak w kicie), gramy, 5 dag, ¼ kg na wadze, tona/kwintal, brutto/netto/tara →
  tekstowe warianty w **S-14c**; nigdy rysowane ani generowane.
- CAPACITY „półtora litra” (E6; brak naczynia 1,5 l), „dolewanie do pełna” z poziomem cieczy.
- WRITTEN, ARROW_TABLE, oś liczbowa (też jako podpowiedź ADD_SUB) → **S-14b**; typy tekstowe (CLOCK_ELAPSED, TIME_UNITS,
  UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, INEQUALITY, PLACE_VALUE ≥ 1000, MIX) → **S-14c**; E1.1 (SHAPES, PATTERN,
  COMPARE_QTY, SPATIAL, SYMMETRY), ORDINAL, BONDS z parami, CHOOSE_OP z obrazkiem, „tryb z obrazkami” → **S-14d**;
  PERIMETER (E4.7, E5.12, E6.3) → **S-13b**; LOGIC E6.11 → S-15/po v1.
- Znak minus i przecinek w `Keypad`; nowy tryb odpowiedzi.
- Atlas tekstur (M7/S-16), inne paczki z `designs/` (expansion, locations, evolution), `thermometer.png` (gotowe +10 °C),
  `room.png`.
- Sprawdzanie assetów w `check:deploy` (`scripts/deploy-check/parse.ts`) — seed #8 lokalnie wystarcza; zmiany w `deploy/`.
- Podświetlanie na rysunku w podpowiedzi (follow-up S-13 zostaje z triggerem „S-16 or a teacher read asking for it”).
- Zmiana formatu zapisu; rysunek w podglądzie postępów rodzica.

## Implementation Approach

Kolejność jak w S-13: najpierw czysty `core` (model, tekst, walidator, układ — tdd), potem pipeline assetów, potem
generatory test-first **bez danych programu**, potem widżety z danymi **tylko w krokach już grywalnych** (kolejność kroków się
nie zmienia), potem jedna faza nowych kroków grywalnych (kolejność zmienia się raz, testy przypięte w tej samej fazie), seam
sweep, e2e.

1. Model rysunku, formaty kwot/temperatur, walidator, wyciek odpowiedzi tekstowej, wspólny `Rect`, układ „obok” (tdd).
2. Pipeline WebP + tabela tekstur + ładowanie w `BootScene` + obraz z zapasowym rysunkiem + asercja seeda #8 (impl).
3. Generatory MONEY_COUNT, MONEY_CHANGE, MASS + dane miar (tdd).
4. Generatory CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS (tdd).
5. `MoneyTable` + `BalanceScale`, hak `art`, umiejętności w E1.11, E3.4, E4.1 (impl).
6. `Jugs` + `Thermometer`, układ „obok” w scenie, umiejętności w E3.11, E4.7, E5.4, E6.1 (impl).
7. `IconGroups`, umiejętności w E1.2, E1.4, E3.9 (impl).
8. Nowe kroki grywalne E1.8, E1.10, E2.2, E2.8, E5.5 + dane widżetów S-13 + testy przypięte + `childName` (impl).
9. Dokumentacja, design-gaps, follow-upy, zmiana profilu § 10, seam sweep (impl, ostatnia impl).
10. E2E #11 zadań z grafiką (e2e).

**Reguła kolejności (kontrakt, S-13):** helpery e2e znają każdą formę odpowiedzi, zanim `playable` ją dopuści — tu żadna
nowa forma (kafelki tekstowe już obsłużone); testy i specy przypięte do kolejności kroków zmieniają się w fazie 8, jedynej,
która ją zmienia. Każda faza zostawia pełny zestaw zielony.

**Bramka lokalna** (kontrakt § Verification) bez zmian w komendach. E2E po fazie zwykle uruchamia orkiestrator (protokół
request-file, profil § 8): agent pisze spec/patche i `e2e-request-pN.md`, orkiestrator uruchamia.

## Critical Implementation Details

**Kontrakt modelu (faza 1; zależą od niego fazy 3–8).** `src/core/tasks/visual.ts` rozszerzony o:

```ts
| { kind: 'money'; items: readonly MoneyId[] }                       // e.g. ['note-10zl', 'coin-2zl', 'coin-50gr'], 1..10, drawn in this order
| { kind: 'scale'; item: IconId; weights: readonly WeightId[] }      // balanced only; weights 1..6 on the right pan
| { kind: 'jugs'; jugs: readonly JugId[] }                           // 1..10 containers in a row
| { kind: 'thermometer'; celsius: number }                           // integer −30..30
| { kind: 'icons'; icon: IconId; groups: readonly number[]; framed: boolean }  // COUNT: [n] or [10, k]; MULT_GROUPS: equal groups, framed
```

Identyfikatory (`MoneyId` = `coin-01gr` … `note-500zl`, `WeightId` = `weight-1kg` … `weight-50dag`, `JugId` =
`container-1l` | `container-half-l` | `container-quarter-l`, `IconId` = 12 ikon kitu) i wartości (grosze, gramy, mililitry)
żyją w `src/data/measures.ts` jako dane (wartości z `manifest.json` kitu, nie z pikseli); `visual.ts` importuje tylko
typy/listy identyfikatorów (granica ESLint: core może importować `src/data` jak generatory). `validateVisual` dostaje
gałąź wyczerpującą (`const _: never = v`) i reguły: znane id, liczności jak w komentarzach, `celsius` całkowite w −30..30,
`icons` grupy dodatnie, suma ≤ 30, `framed` ⇒ ≥ 2 równe grupy. `describeVisual`: `[money note-10zl coin-2zl = 12 zł]`,
`[scale apple | weight-10dag weight-10dag]`, `[jugs 3 × 1 l]`, `[thermometer −5 °C]`, `[icons apple 10+2]`.

**Teksty liczb z jednostką** (faza 1, `src/core/text/measure.ts`, nowy): `formatMoney(grosze)` → `"5 zł"`, `"40 gr"`,
`"3 zł 40 gr"` (szkolny zapis E4; spacja zwykła); `formatCelsius(c)` → `"−5 °C"` (U+2212), `"0 °C"`, `"12 °C"` (bez plusa;
plus tylko w podziałce termometru, wg kitu); `spokenMoney`/`spokenCelsius` z liczebnikami słownymi do `speak` („3 złote
40 groszy”, „minus 5 stopni”; zgoda na `Math.abs`). Na ekranie tylko skróty (`zł`, `gr`, `kg`, `dag`, `l`, `°C`) — walidator
ich nie odmienia; pełne słowa jednostek w promptach tylko przy liczbach całkowitych („Ile kilogramów…?”, „5 litrów”).

**Wyjątek ujemny** (faza 1): `ValidationContext.allowNegative?: boolean`; `validate.ts` eksportuje
`NEGATIVE_TYPES = new Set(['TEMPERATURE'])`, a `validationBounds(skill)` (`bounds.ts`) ustawia flagę z `skill.type` dla każdego
wywołującego `validateTask` (lista w fazie 1 § 4). Z flagą: ujemna odpowiedź liczbowa, ujemne `choices` i `NEGATIVE_NUMBER` w tekstach są
dozwolone; reszta reguł bez zmian.

**Układ „obok”** (faza 1, użyty w fazie 6): `PictureSpec.keypadBeside: { picture: Rect; lines: Rect }` (≈ obrazek 236,470
240×378, linie 500,470 504×378); `pictureLayout(spec, input, solution, shape: VisualShape)` z
`visualShape(v: TaskVisual): 'wide' | 'tall'` w `visual.ts` (`tall` = `thermometer`; reszta `wide`). `keypad` + `solution` +
`tall` → `keypadBeside`; każda inna kombinacja jak dziś. Rysunek diagramu (O2 S-13) zostaje „wide” — follow-up bez zmian.

**Obraz z zapasem i hak** (fazy 2 i 5): `src/ui/widgets/ArtImage.ts` — jeden `Phaser.GameObjects.Image` tworzony raz,
`show(key, rect)` ustawia teksturę, pozycję i `setDisplaySize` z zachowaniem proporcji z tabeli; gdy
`!scene.textures.exists(key)` rysuje zastępczy kształt w kodzie (prostokąt w kolorze `PLACEHOLDER_COLORS` z krótką etykietą
id) — nigdy `__MISSING`. `state(): { key: string; loaded: boolean } | null` (null gdy ukryty; `loaded` = obraz widoczny z
istniejącą teksturą). Każdy widżet z grafiką ma `shown()` (jego własne obiekty widoczne) i `art()` (lista `state()` swoich
obrazów — tylko pokazanych, bez `null` i bez nieużytych obiektów puli, inaczej przerwa p10c nie zmieni długości listy;
plan-review F6); `TaskPicture.art()` zwraca listę widżetu rysującego; `TaskSnapshot.art` w `src/testing/e2eHook.ts` (tylko build
haka) i typ `Snapshot.art` w `tests/e2e/support/hook.ts`.

**Ładowanie** (faza 2): `src/data/taskArt.ts` `TASK_ART: readonly { key: string; url: string; width: number; height: number }[]`
(klucz `tasks/<folder>/<id>`, url `assets/tasks/<folder>/<id>.webp`, rozmiar wyjściowy), `BootScene.preload` woła
`this.load.image(key, url)` dla każdej pozycji i rejestruje `loaderror` → `console.warn` (nie fatal: `isFatalSignal` nie
widzi zasobów). Rozmiary wyjściowe ≤ 2× wyświetlania: ikony, monety, odważniki, dzbanki 256²; banknoty 384×256; waga 512×384;
obudowa termometru 256×768. Mapowanie skali termometru (`yForMinus30` 1260, `pixelsPerDegree` 16 w przestrzeni 512×1536) i
`sharedVisibleRect` dzbanków w `src/data/measures.ts`, skalowane przez widżet.

## Phase 1: Model rysunków z grafiką, teksty miar, walidator i układ „obok” w `core`

Driver: tdd
Driver why: nowe rodzaje `TaskVisual`, `formatMoney`/`formatCelsius`, wyjątek ujemny walidatora, ogólny wyciek odpowiedzi tekstowej, wspólny `Rect` i `pictureLayout` z kształtem to czyste funkcje bez sceny — failing testy prowadzą każdą z nich.

### Overview

Infrastruktura dla faz 3–8; żadna nowa umiejętność nie staje się grywalna, żaden widżet nie powstaje.

### Changes Required:

#### 1. Dane identyfikatorów i wartości miar

**File**: `src/data/measures.ts` (nowy)

**Intent**: identyfikatory i wartości z `manifest.json` kitu (monety/banknoty w groszach, odważniki w gramach, dzbanki w ml,
ikony z rzeczownikiem słownika — `pencil` → `kredka`, nie „ołówek”), zakres i mapowanie termometru, `sharedVisibleRect`.
Dla wagi: `SCALE_ITEMS` z wiarygodnym zakresem masy na ikonę (np. `cushion` 1–2 kg, `lamp` 2–5 kg, `apple` 10–20 dag,
`yarn` 10 dag) — żeby nie było „jabłka 5 kg” (odczyt nauczyciela w fazie 3).

**Contract**: `MONEY: readonly { id: MoneyId; grosze: number }[]`, `WEIGHTS: readonly { id: WeightId; grams: number }[]`,
`JUGS: readonly { id: JugId; ml: number }[]`, `ICONS: readonly { id: IconId; noun: string }[]`, `SCALE_ITEMS`,
`THERMOMETER { min: -30; max: 30; yForMinus30; pixelsPerDegree; frame: {w,h} }`. Typy id jako unie literałów.

#### 2. Model rysunku

**File**: `src/core/tasks/visual.ts`, `tests/visual.test.ts`

**Intent**: pięć nowych rodzajów wg Critical Implementation Details; `visualKey`, `validateVisual` (wyczerpujący),
`describeVisual`, `visualShape`.

**Contract**: sygnatury bez zmian poza nowym `visualShape(v: TaskVisual): VisualShape`.

#### 3. Teksty miar

**File**: `src/core/text/measure.ts` (nowy), `tests/measure.test.ts` (nowy)

**Intent**: `formatMoney`, `formatCelsius`, `spokenMoney`, `spokenCelsius` wg Critical Implementation Details; formy słowne z
`inflect` i słownika (zgoda na wartości bezwzględnej).

#### 4. Walidator i podpowiedzi

**File**: `src/core/tasks/validate.ts`, `src/core/tasks/bounds.ts`, `src/core/round/hints.ts`, `tests/validate.test.ts`,
`tests/hints.test.ts`, `tests/contentInvariants.test.ts`, `tests/helpers.ts`, `tests/curriculum.test.ts`,
`tests/generateTask.test.ts`, `tests/warmup.test.ts`, `scripts/sample.ts`

**Intent**: `allowNegative` + `NEGATIVE_TYPES`; `lastNumber` zachowuje minus („Wynik: −5”); `leaksAnswer` dla każdej
odpowiedzi tekstowej (pierwsza podpowiedź nie może zawierać tekstu odpowiedzi), inwariant „string answer in the last hint”
poszerzony z `CLOCK` na każdą odpowiedź tekstową. Flaga z typu umiejętności w jednym miejscu: `validationBounds(skill)`
w `src/core/tasks/bounds.ts` zwraca `{ max: boundOf(skill), allowNegative: NEGATIVE_TYPES.has(skill.type) }`, a **każde**
wywołanie `validateTask` dla umiejętności z programu (`scripts/sample.ts` ×2, `tests/contentInvariants.test.ts`,
`tests/helpers.ts`, `tests/curriculum.test.ts`, `tests/generateTask.test.ts`, `tests/warmup.test.ts` — rozgrzewka E6
losuje E6.1) rozkłada ten wynik obok `nouns` (plan-review F3).

#### 5. Wspólny prostokąt i układ „obok”

**File**: `src/core/geometry.ts` (nowy), `src/core/round/dragLayout.ts`, `src/core/round/pictureLayout.ts`,
`src/ui/widgets/geometry.ts`, `src/data/layout.ts`, `tests/pictureLayout.test.ts`, `tests/dragLayout.test.ts`

**Intent**: jeden `Rect` (+ `insideRect`, `interiorPoint`) w `core`, `dragLayout`/`pictureLayout` i `ui/widgets/geometry.ts`
go re-eksportują (zamyka follow-up „three Rect types”); `TASK_LAYOUT.picture.keypadBeside` i `pictureLayout(..., shape)`.
Oba wywołania w `TaskScene` (`render` i dopasowanie czcionki promptu — `const limit = pictureLayout(…, false)`) przekazują
kształt z rysunku (dziś zawsze `wide` — zachowanie bez zmian do fazy 6; plan-review F7).

**Contract**: `pictureLayout(spec: PictureSpec, input: AnswerMode, solution: boolean, shape: VisualShape)`; test: prostokąty
„obok” w notesie (x 196–1724, y 220–976), rozłączne, obrazek węższy niż wysoki, linie ≥ 480 px szerokości, żaden nie
nachodzi na klawiaturę (x ≥ 1040).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie brak eksportu — stub najpierw), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `validateVisual` bez reguły zakresu termometru / `formatMoney` gubi grosze przy pełnych złotych / `leaksAnswer` z powrotem tylko dla czasu / `pictureLayout` ignoruje `tall` → odpowiednie testy czerwone; przywrócone; meta-check: oczekiwania z kitu (`manifest.json`) i research § 3–5, nie z implementacji
- `npm run sample -- E1` … `E6` bez zmian w wyjściu (żaden generator nie ma jeszcze nowych rysunków); `git diff --stat tests/fixtures/` pusty
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `visual.ts`, `measure.ts`, `geometry.ts` bez Phasera i globali; `TaskVisual` niesie tylko id i liczby; wartości z `manifest.json`, nie z pikseli

---

## Phase 2: Pipeline WebP, tabela tekstur, ładowanie w `BootScene` i precache offline (#8)

Driver: impl
Driver why: skrypt konwersji, pliki binarne i ładowanie w scenie nie mają czystej logiki do prowadzenia testem; dowód w teście zgodności tabeli z plikami na dysku, w buildzie (precache) i w seedzie offline (#8, request-file).

### Overview

Pierwsza grafika w `public/`: 38 plików WebP w repo, załadowane na starcie, w precache, sprawdzone offline.

### Changes Required:

#### 1. Konwersja

**File**: `scripts/make-task-art.mjs` (nowy), `package.json` (`"art": "node scripts/make-task-art.mjs"`),
`public/assets/tasks/money/*.webp` (15), `public/assets/tasks/measuring/*.webp` (11: waga, 6 odważników, 3 dzbanki,
obudowa termometru), `public/assets/tasks/icons/*.webp` (12)

**Intent**: wzór `scripts/make-icons.mjs`: czyta `designs/martynka-maths-A-v1/manifest.json`, dla każdego wiązanego pliku
(lista w `change.md` § Design source) woła `cwebp -resize W H -q 85 -alpha_q 100 -m 6` (rozmiary z Critical Implementation
Details), wypisuje rozmiar wyjściowy; brak `cwebp` albo brak `designs/` → jasny komunikat i kod wyjścia ≠ 0. Wynik
deterministyczny (sprawdzone w research: ten sam SHA). Commitowane tylko wyniki; nic z `designs/`.

#### 2. Tabela tekstur i ładowanie

**File**: `src/data/taskArt.ts` (nowy), `src/scenes/BootScene.ts`

**Intent**: `TASK_ART` wg Critical Implementation Details (generowana ręcznie, nie w runtime); `BootScene.preload` ładuje
każdą pozycję, `loaderror` → `console.warn` z kluczem.

#### 3. Obraz z zapasem

**File**: `src/ui/widgets/ArtImage.ts` (nowy), `src/data/layout.ts` (kolor/etykieta zapasu)

**Intent**: helper wg Critical Implementation Details; jeszcze bez użycia w scenie (fazy 5–7).

#### 4. Test zgodności tabeli z plikami

**File**: `tests/taskArt.test.ts` (nowy)

**Intent**: każda pozycja `TASK_ART` ma plik w `public/assets/tasks/` (czytany z dysku, `fs`), nagłówek WebP (`RIFF`…`WEBP`)
i wymiary z nagłówka równe tabeli; żaden plik w `public/assets/tasks/` bez pozycji; każde id z `src/data/measures.ts` ma
teksturę; suma rozmiarów < 1 MB; klucz = ścieżka bez rozszerzenia (plan § 10).

#### 5. Seed offline (#8) — request-file

**File**: `tests/e2e/seed.spec.ts`, `context/changes/art-tasks-all-stages/e2e-request-p2.md`,
`context/changes/art-tasks-all-stages/e2e-break-p2.patch`

**Intent**: spec zbiera `requestfailed` (oczekiwane `[]`) i po przeładowaniu offline czeka (`expect.poll`), aż `servedBySw`
zawiera każdą ścieżkę `/` + `url` z `TASK_ART` (import z `src/data/taskArt.ts`). Patch przerwy: `globIgnores` z **jednym**
plikiem (`**/tasks/money/note-500zl.webp`) — dowodzi asercji per obraz, nie tylko „żadnych obrazów” (plan-review F5).
Chromium w sesji agenta zwykle nie startuje → spec bez commita do wyniku orkiestratora (profil § 8).

### Success Criteria:

#### Automated Verification:

- `tests/taskArt.test.ts` zielony; unit `<baseline gałęzi> + N`
- Deliberate break: usunięty jeden plik `.webp` / zmieniona szerokość w `TASK_ART` → `taskArt.test.ts` czerwony; przywrócone; meta-check: test czyta nagłówki plików z dysku, nie porównuje tabeli z samą sobą
- `npm run art` drugi raz: `git status --porcelain public/assets` pusty (deterministyczny wynik)
- `npm run build`: `dist/sw.js` wymienia `assets/tasks/` (38 wpisów), `e2e hook: absent (`
- E2E (orkiestrator): `seed.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 0`
- Deliberate break (patch `e2e-break-p2.patch`, `globIgnores` z jednym plikiem `note-500zl.webp`): seed czerwony na tym jednym `/assets/tasks/money/note-500zl.webp` (brak w `servedBySw` albo `requestfailed`); przywrócone; meta-check: przed zmianą tej fazy ten sam patch zostawiał seed zielony (luka z research § 1)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Pliki tylko w `public/assets/tasks/`, nazwy wg plan § 10 (`tasks/money/<nominał>`, `tasks/icons/<nazwa>`, `tasks/measuring/<id>`), nic z `designs/` w indeksie git; `ArtImage` bez tekstów gracza
- [human] Decyzja wbrew literze planu § 10: WebP zamiast PNG dla monet, banknotów i pomocy, luźne pliki zamiast atlasu, folder `tasks/measuring/` (rozszerzenie wzoru)

---

## Phase 3: Generatory MONEY_COUNT, MONEY_CHANGE i MASS

Driver: tdd
Driver why: trzy nowe czyste generatory `(skill, rng) => Task` z parserami — failing testy 1000 losowań, wyrocznie z pól rysunku (suma nominałów, suma odważników = masa przedmiotu) i przypadki brzegowe (reszta 0, kwota bez groszy, wiarygodna masa) prowadzą implementację.

### Overview

Generatory gotowe na dane z faz 5 i 8; jeszcze nie w programie.

### Changes Required:

#### 1. MONEY_COUNT i MONEY_CHANGE

**File**: `src/core/tasks/generators/money.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts` (`pl.tasks.money*`),
`src/data/nouns.ts`, `tests/money.test.ts` (nowy)

**Intent**: COUNT: losuje 1–`maxItems` nominałów z dozwolonej listy, suma ≤ `max`; odpowiedź liczba (pełne złote albo grosze,
jednostka w prompcie: „Ile złotych leży na stole?”, „Ile groszy…?”) albo tekst `formatMoney` z 3–4 kafelkami tekstowymi
(`answer: 'text'`: bliskie dystraktory — ±1 nominał, zamienione zł/gr). CHANGE: „X miał(a) N zł. Kupił(a) … za M zł. Ile
zostało?” z imieniem i płcią z `src/data/wordTemplates.ts`, rysunek = to, co miał(a); reszta > 0. Podpowiedzi uczą metody
(„Policz najpierw banknoty, potem monety.”, „Od kwoty odejmij cenę.”) bez wyniku w pierwszym kroku. `speak` słowami.

**Contract**: params `{ variant: 'count' | 'change'; ids: MoneyId[]; max: number /* grosze */; maxItems: number; answer: 'number-zl' | 'number-gr' | 'text' }`;
parser odrzuca nieznane id, `max` nieosiągalny z listy, `maxItems` > 10.

#### 2. MASS (waga w równowadze)

**File**: `src/core/tasks/generators/mass.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts`, `src/data/nouns.ts`,
`tests/mass.test.ts` (nowy)

**Intent**: przedmiot z `SCALE_ITEMS` z zakresem pasującym do jednostki, odważniki z listy sumują się do jego masy (≤ 6 sztuk);
„Waga jest w równowadze. Ile kilogramów waży poduszka?”; wariant `half` (E4.1, E5.5): przedmiot zważony odważnikami dag
(10–40 dag) → „Ile dekagramów brakuje do pół kilograma?” (50 − m); wariant `convert` (E2.8): przedmiot zważony odważnikami
dag (10–90 dag) → „Ile dekagramów brakuje do 1 kilograma?” (100 − m; podpowiedź „1 kg = 100 dag”). Żaden wariant nie ma
stałej odpowiedzi (plan-review F1: „pół kilograma = 50 dag” w każdym zadaniu to jedno zadanie, nie umiejętność).
Rzeczowniki nowe z biernikiem w kontekście („waży 1 kilogram”).

**Contract**: params `{ variant: 'read' | 'half' | 'convert'; unit: 'kg' | 'dag'; weights: WeightId[]; max: number }`; parser
odrzuca masę nieosiągalną z odważników i przedmiot bez zakresu w tej jednostce.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Każdy generator: 1000 losowań (20 ziaren × 50, `tests/helpers.ts`) bez naruszeń walidatora; suma nominałów/odważników = odpowiedź (wyrocznia z pól rysunku); klucze `generators` i `parsers` równe; dla parametrów każdej umiejętności planowanej w fazach 5 i 8 test mierzy progi `tests/contentInvariants.test.ts` (≥ 12 różnych `prompt|visualKey|choices`, najczęstsze ≤ 15 %) — porażka tu, nie w fazie danych (plan-review F1)
- Deliberate break: CHANGE dopuszcza resztę 0 / MASS bierze odważniki nie sumujące się do masy / parser przyjmuje nieznany nominał → czerwone; przywrócone; meta-check: wyrocznia liczy z `visual`, nie z `answer`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów `pl.tasks.money*`/`mass*` i 6 losowań na wariant z testu: zgoda liczebników („2 złote”, „5 złotych”, „1 grosz”), biernik („ma 1 monetę”), czasownik zgodny z płcią imienia, wiarygodne masy, pierwsza podpowiedź bez wyniku

---

## Phase 4: Generatory CAPACITY, TEMPERATURE, COUNT i MULT_GROUPS

Driver: tdd
Driver why: cztery czyste generatory z parserami — failing testy 1000 losowań i przypadki brzegowe (0 °C, −30/+30, ½ i ¼ l dające liczbę całkowitą, grupy równe, dystraktor „3 + 4” zamiast zamienionego „4 · 3”) prowadzą implementację.

### Overview

Pozostałe generatory z grafiką; jeszcze nie w programie.

### Changes Required:

#### 1. CAPACITY

**File**: `src/core/tasks/generators/capacity.ts` (nowy), registry, `pl.ts`, `nouns.ts`, `tests/capacity.test.ts`

**Intent**: rząd ≤ 10 dzbanków; „Ile to litrów?” — rząd może mieszać rodzaje dozwolone w kroku (`jugs`: 1 l pojedynczo, ½ l
parami, ¼ l czwórkami), więc suma zawsze całkowita, a przestrzeń zadań przekracza progi inwariantów (sam rząd jednego rodzaju
daje ≤ 10 różnych zadań i ≥ 20 % najczęstszego — plan-review F1); albo „Ile dzbanków po pół litra napełni 3 litry?”
(odwrotnie, rysunek pokazuje jeden dzbanek; litry 1..`maxLitres`). Odpowiedź zawsze całkowita (klawiatura bez przecinka);
ułamki tylko w prompcie jako „pół litra”/„ćwierć litra”.

**Contract**: params `{ jugs: JugId[]; variant: 'toLitres' | 'howMany'; maxLitres: number }` (`howMany`: dokładnie jeden
rodzaj); parser odrzuca rząd > 10 dzbanków i `maxLitres` nieosiągalne w ≤ 10 dzbankach (`toLitres`). Gdy krok ma z natury
mniejszą przestrzeń (np. `howMany` ¼ l), wpis `SMALL_SPACES` z pomiarem — ale próg najczęstszego zadania (15 %) obowiązuje.

#### 2. TEMPERATURE

**File**: `src/core/tasks/generators/temperature.ts` (nowy), registry, `pl.ts`, `nouns.ts`, `tests/temperature.test.ts`

**Intent**: `read`: termometr pokazuje `c` (wielokrotność `step` w `low..high`) → „Jaką temperaturę pokazuje termometr?”; odpowiedź
liczba (keypad, tylko `min ≥ 0`) albo tekst `formatCelsius` z 3–4 kafelkami (dystraktory: przeciwny znak, ± `step`);
`diff`: rano `a` (w tekście), teraz `b` na rysunku → „O ile stopni się ociepliło/ochłodziło?” → `|b − a|` liczba.
Podpowiedzi: „Znajdź koniec słupka i najbliższą liczbę.”, „Poniżej zera liczymy w dół.” `speak` z `spokenCelsius`.

**Contract**: params `{ variant: 'read' | 'diff'; low: number; high: number; step: number; answer: 'number' | 'text' }`
(nie `min`/`max`: `boundOf` czyta `params.max` jako górną granicę odpowiedzi i liczb w tekstach, a różnica sięga
`high − low`; plan-review F2); parser: `−30 ≤ low < high ≤ 30`, `answer 'number'` ⇒ `variant 'diff'` albo `low ≥ 0`;
`step` ≥ 2 przy rysunku (decyzja 6).

#### 3. COUNT i MULT_GROUPS

**File**: `src/core/tasks/generators/count.ts`, `src/core/tasks/generators/multGroups.ts` (nowe), registry, `pl.ts`, `nouns.ts`,
`tests/count.test.ts`, `tests/multGroups.test.ts`

**Intent**: COUNT: `n` ikon jednej nazwy, `[n]` albo `[10, n−10]` od 11, „Ile jest jabłek?” (dopełniacz liczby mnogiej z
`ICONS.noun`), 3 kafelki (ZADANIA: wybór z 3; dystraktory n ± 1). MULT_GROUPS: `g` ramek po `k` ikon, `g·k ≤ max`;
wariant `result` (kafelki liczbowe) i `expr` (kafelki tekstowe „3 · 4”; dystraktory „3 + 4”, „3 · 5”, nigdy zamienione
„4 · 3”, które też jest poprawne). Ikona `pencil` jako „kredka”.

**Contract**: COUNT `{ min: number; max: number; tens: boolean }`; MULT_GROUPS `{ variant: 'result' | 'expr'; groups: [min, max]; size: [min, max]; max: number }`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- 1000 losowań na wariant bez naruszeń (TEMPERATURE z `allowNegative`); wyrocznie z pól rysunku; klucze `generators`/`parsers` równe; progi inwariantów (≥ 12 różnych, najczęstsze ≤ 15 %) zmierzone dla parametrów każdej umiejętności planowanej w fazach 6–8 (plan-review F1)
- Deliberate break: TEMPERATURE `text` z łącznikiem zamiast U+2212 / CAPACITY ½ l z nieparzystym `n` / MULT_GROUPS `expr` z zamienionym iloczynem jako dystraktorem / COUNT 4 kafelki → czerwone; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów i 6 losowań na wariant: „pół litra”, „ćwierć litra”, „minus 5 stopni”, „2 stopnie”, „5 stopni”, „jabłek/gruszek/kredek”, grupy „3 talerzyki po 4” bez słowa spoza słownika

---

## Phase 5: `MoneyTable` i `BalanceScale`, hak `art`, umiejętności w E1.11, E3.4, E4.1

Driver: impl
Driver why: dwa nowe widżety na sprite'ach i sklejka w `TaskPicture`/haku — zachowanie widać tylko na płótnie; dane trafiają tylko do kroków już grywalnych (kolejność kroków bez zmian), dowód w inwariantach, `sample`, zrzutach i e2e fazy 10.

### Overview

Pierwsze zadania z grafiką w rundach: pieniądze i waga.

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/MoneyTable.ts`, `src/ui/widgets/BalanceScale.ts` (nowe), `src/ui/widgets/TaskPicture.ts`,
`src/data/layout.ts` (`TASK_LAYOUT.money`, `TASK_LAYOUT.scale`)

**Intent**: `MoneyTable`: banknoty w górnym rzędzie, monety w dolnym (od największego), rozmiar względny z kitu („nie w skali
fizycznej”: banknot szerszy od monety, monety jednej wielkości wizualnej różnicowanej lekko wg tabeli w `layout.ts`),
wszystkie w prostokącie rysunku. `BalanceScale`: obraz wagi w równowadze, ikona przedmiotu na lewej szalce, odważniki na
prawej (w rzędzie, przy > 3 w dwóch), punkty szalek w proporcjach obrazu kitu (`layout.ts`). Oba przez `ArtImage`, z
`shown()` i `art()`. `TaskPicture` dyspozytor bez placeholderów, `switch` wyczerpujący.

#### 2. Hak

**File**: `src/testing/e2eHook.ts`, `src/scenes/TaskScene.ts` (`snapshot`), `tests/e2e/support/hook.ts`

**Intent**: `TaskSnapshot.art: { key: string; loaded: boolean }[]` z `TaskPicture.art()` (lekcja F1: stan widżetu, nie
prostokąt układu); tylko build haka.

#### 3. Dane programu

**File**: `src/data/curriculum/E1.ts`, `E3.ts`, `E4.ts`

**Intent**: umiejętności (nazwy do odczytu nauczyciela):

| Krok | Umiejętności |
|---|---|
| E1.11 | `money_count_10` MONEY_COUNT `{count, [coin-1zl, coin-2zl, coin-5zl, note-10zl], 1000, 4, number-zl}` tiles; `money_change_10` `{change, …, 1000}` tiles; `mass_kg_10` MASS `{read, kg, [weight-1kg, weight-2kg, weight-5kg], 10}` tiles |
| E3.4 | `mass_kg_dag` MASS `{read, kg|dag, …}` keypad (dwie umiejętności: `mass_kg_10`, `mass_dag_100`) |
| E4.1 | `money_count_100` `{count, banknoty 10–100 zł + monety zł, 10000, 6, number-zl}` keypad (suma ≤ 100 zł: E4.1 to liczby do 100, trzycyfrowe dopiero E4.8 — plan-review F4; banknoty 200/500 zł ładowane, ale bez umiejętności → follow-up); `money_count_zl_gr` `{count, monety zł + gr, 2000, 6, text}` tiles; `money_change_100` keypad; `mass_half_kg` MASS `{half, dag}` keypad |

E1 zostaje kafelkowe (pin `tests/generateTask.test.ts`).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (inwarianty treści obejmują nowe umiejętności)
- `npm run sample -- E1 --count 6`, `E3`, `E4` bez naruszeń, z linią `visual:` dla nowych umiejętności
- Deliberate break: `TaskPicture` bez gałęzi `money` → `npm run typecheck` czerwony (wyczerpujący `switch`); przywrócone; meta-check: dowodzi kompletności dyspozytora, nie rysowania (to dowodzi e2e fazy 10)
- `playableSteps` dla E1, E3, E4 bez zmian (`tests/curriculumStart.test.ts` zielony bez edycji); `tests/fixtures/` bez zmian
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (nowe umiejętności E3.4 w puli losowych speców E3)
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E1.11, E3.4, E4.1 `--count 6`: kwoty, reszta, masy, kafelki „3 zł 40 gr”, podpowiedzi
- [reviewer] Widżety bez tekstów gracza i liczb balansu (geometria w `layout.ts`); `hideTaskLayer` chowa oba widżety
- [visual] Zrzuty przez `?e2eSkills` (etap przez `passWelcomeAsParent`): monety E1.11 z kafelkami, banknoty do 500 zł E4.1 (klawiatura), kwota zł + gr na kafelkach tekstowych, waga kg (E1, kafelki), waga dag (E3.4, klawiatura), waga z podpowiedzią, waga z krokami rozwiązania obok klawiatury, pieniądze z krokami rozwiązania obok kafelków — 1440×900 i 1024×768

---

## Phase 6: `Jugs` i `Thermometer`, układ „obok” w scenie, umiejętności w E3.11, E4.7, E5.4, E6.1

Driver: impl
Driver why: dwa nowe widżety (dzbanki na sprite'ach, termometr: obraz obudowy + słupek i podziałka w Graphics) i użycie kształtu `tall` w `TaskScene` — zachowanie widać tylko na płótnie; geometria już pokryta testem fazy 1, dowód w zrzutach i e2e fazy 10.

### Overview

Pojemność i temperatura; termometr przy klawiaturze w fazie rozwiązania stoi po lewej (O2).

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/Jugs.ts`, `src/ui/widgets/Thermometer.ts` (nowe), `src/ui/widgets/TaskPicture.ts`, `src/data/layout.ts`
(`TASK_LAYOUT.jugs`, `TASK_LAYOUT.thermometer`: kolory atrament `#245C59`, ciecz `#54BEB4` jako tokeny)

**Intent**: `Jugs`: dzbanki w rzędzie wyrównane do `sharedVisibleRect`, przy > 5 w dwóch rzędach. `Thermometer`: obraz
`thermometer-frame` z zachowaniem proporcji (nigdy rozciągnięty), na nim w Graphics port `drawThermometerFace` (rura,
ciecz do `y(c)`, bańka, kreski co 1/5/10 °C z gęstością zależną od skali — co 2 °C poniżej progu px, etykiety co 10 z
U+2212 i „+”, „°C”) w przestrzeni ramki przeskalowanej do prostokąta. Kontrakt `shown()`/`art()`; `shown()` termometru
wymaga widocznej ramki **i** twarzy (lekcja F1).

#### 2. Scena

**File**: `src/scenes/TaskScene.ts`

**Intent**: `render` przekazuje `visualShape(task.visual)` do `pictureLayout`; linie rozwiązania w prostokącie `keypadBeside.lines`.

#### 3. Dane programu

**File**: `src/data/curriculum/E3.ts`, `E4.ts`, `E5.ts`, `E6.ts`

| Krok | Umiejętności |
|---|---|
| E3.11 | `temperature_read_30` TEMPERATURE `{read, low −30, high 30, 5, text}` tiles |
| E4.7 | `capacity_half_l` CAPACITY `{[container-1l, container-half-l], toLitres, 6}` keypad; `capacity_litres_half` `{[container-half-l], howMany, 10}` keypad (litry 1..10 → `SMALL_SPACES` `minDistinct: 10` z pomiarem) |
| E5.4 | `temperature_read_0_30` `{read, low 0, high 30, 2, number}` keypad |
| E6.1 | `temperature_negative` `{read, low −30, high 30, 2, text}` tiles; `temperature_diff` `{diff, low −20, high 20, 2, number}` keypad (krok 2 °C jak decyzja 6 — rysunek pokazuje `b`) |

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E3/E4/E5/E6 --count 6` bez naruszeń (TEMPERATURE z `allowNegative`), z linią `visual:`
- Deliberate break: `TaskScene` przekazuje zawsze `wide` → zrzut/hak: `targets.picture` termometru w fazie rozwiązania ma szerokość ≥ wysokości — sprawdzone jednorazowym uruchomieniem hooka w `*.local` albo przeniesione do e2e fazy 10 (wiersz 10.5); przywrócone
- `playableSteps` bez zmian; `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (E3.11 tekstowe kafelki ujemne w puli losowych speców E3)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E3.11, E4.7, E5.4, E6.1: zapis „−5 °C”, różnice, „pół litra”, kafelki bez dwóch poprawnych
- [visual] Zrzuty: termometr dodatni (E5.4 klawiatura), ujemny z kafelkami tekstowymi (E3.11), termometr z podpowiedzią, termometr z krokami rozwiązania w układzie „obok” (obrazek po lewej, linie po prawej), różnica temperatur (E6.1), dzbanki ½ l (E4.7), dzbanki z krokami rozwiązania — 1440×900 i 1024×768

---

## Phase 7: `IconGroups`, umiejętności COUNT w E1.2, E1.4 i MULT_GROUPS w E3.9

Driver: impl
Driver why: jeden nowy widżet ikon (jedna grupa, dziesiątka + reszta, ramki grup rysowane w kodzie) i dane w krokach już grywalnych — zachowanie widać tylko na płótnie; dowód w inwariantach, `sample`, zrzutach i e2e fazy 10.

### Overview

Liczenie przedmiotów i mnożenie jako grupy na ikonach paczki.

### Changes Required:

#### 1. Widżet

**File**: `src/ui/widgets/IconGroups.ts` (nowy), `src/ui/widgets/TaskPicture.ts`, `src/data/layout.ts` (`TASK_LAYOUT.icons`)

**Intent**: siatka ikon w prostokącie (ikona ≥ 96 px sceny jak kit `task-tiles.png`, mniejsza tylko przy > 12); `[10, k]` —
dziesiątka w jednym rzędzie, reszta pod nią; `framed` — każda grupa w zaokrąglonej ramce w kodzie (talerzy brak w kicie —
DESIGN-GAP). `shown()`/`art()` przez `ArtImage` (jedna instancja na ikonę, pula do 30).

#### 2. Dane programu

**File**: `src/data/curriculum/E1.ts`, `E3.ts`

| Krok | Umiejętności |
|---|---|
| E1.2 | `count_5` COUNT `{1, 5, false}` tiles |
| E1.4 | `count_7` COUNT `{4, 7, false}` tiles |
| E3.9 | `mult_groups_result` MULT_GROUPS `{result, [2, 5], [2, 6], 30}` tiles; `mult_groups_expr` `{expr, …}` tiles |

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E1 --count 6`, `E3` bez naruszeń, z linią `visual:`
- Deliberate break: `count_5` jako `keypad` → `tests/generateTask.test.ts` („E1 has no keypad skill”) czerwony; przywrócone; meta-check: pin E1 obejmuje nowe umiejętności
- `playableSteps` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` E1.2, E1.4, E3.9: rzeczowniki ikon w dopełniaczu, „kredek” (nie „ołówków”), dystraktory iloczynu
- [visual] Zrzuty: liczenie 1–5 (E1.2), 6–7 (E1.4), grupy w ramkach z kafelkami liczb i z kafelkami „3 · 4” (E3.9), grupy z podpowiedzią — 1440×900 i 1024×768

---

## Phase 8: Nowe kroki grywalne E1.8, E1.10, E2.2, E2.8, E5.5, dane widżetów S-13 i testy przypięte do kolejności

Driver: impl
Driver why: zmiana danych programu, która przestawia kolejność kroków — dowód w testach przypiętych (wyrocznia startu kalendarzowego liczona ręcznie z reguły D), inwariantach, `childName`, odczycie nauczyciela i e2e `first-launch`/`adaptive`; generatory i widżety już istnieją.

### Overview

Jedyna faza zmieniająca kolejność kroków; pięć pustych kroków staje się grywalnych, widżety S-13 trafiają do E1/E2/E5/E6.

### Changes Required:

#### 1. Dane programu

**File**: `src/data/curriculum/E1.ts`, `E2.ts`, `E5.ts`, `E6.ts`

| Krok | `childName` | Umiejętności |
|---|---|---|
| E1.8 | „Centymetr i linijka” | `length_ruler_cm_10` LENGTH `{ruler, cm, 10, …}` tiles |
| E1.10 | „Liczby 11 i 12” | `count_12` COUNT `{11, 12, true}` tiles; `place_read_12` PLACE_VALUE `{read, 11, 12}` tiles |
| E1.11 | „Zegar, miesiące i pieniądze” (było „Miesiące roku”) | + `clock_read_full` CLOCK `{read, 60}` tiles |
| E2.1 | (jest) | + `place_read_20` PLACE_VALUE `{read, 11, 20}` keypad (10 liczb → wpis `SMALL_SPACES` `minDistinct: 10` z pomiarem; zmierzone w plan-review: 10 różnych, najczęstsze 11 %) |
| E2.2 | „Pieniądze do 20 zł i litr” | `money_count_20` `{count, monety zł + note-10zl/20zl, 2000, 5, number-zl}` keypad; `money_change_20` keypad; `capacity_litres` `{[container-1l], toLitres, 10}` keypad (E2 zna tylko litr: 10 zadań → wpis `SMALL_SPACES` `minDistinct: 10` z pomiarem, najczęstsze ≈ 10 %) |
| E2.8 | „Grosze, dekagramy, metr” | `money_count_gr` `{count, monety 1–50 gr, 100, 6, number-gr}` keypad; `mass_dag_100` MASS `{read, dag, …, 100}` keypad; `mass_convert` `{convert}` keypad; `length_convert_m` LENGTH `{convert, …}` keypad |
| E2.9 | (jest) | + `place_read_99` `{read, 20, 99}` keypad |
| E2.10 | (jest) | + `data_most_10` DATA tiles; `data_howmany_10` keypad; `clock_later_1h` CLOCK `{later, 60, maxShift 1}` tiles |
| E5.5 | „Litry i kilogramy” | `capacity_quarter_l` `{[container-1l, container-half-l, container-quarter-l], toLitres, 4}` keypad (¼ l czwórkami w rzędzie ≤ 10); `capacity_half_l_e5` `{container-half-l, howMany, 5}` keypad; `mass_half_kg_e5` MASS `{half}` keypad |
| E5.7 | (jest) | + `length_ruler_mm` LENGTH `{ruler, mm, 10, …}` keypad |
| E6.5 | (jest) | + `place_read_1000` PLACE_VALUE `{read, 100, 999}` keypad |

`childName` i nazwy to propozycja (≤ 28 znaków, wielka litera, bez kropki, różne w etapie); odczyt nauczyciela może je
poprawić. Kolejność cięcia przy przekroczeniu budżetu (research decyzja 5): najpierw E5.5 dodatki ½ l/½ kg (zostaje
`capacity_quarter_l`), potem `temperature_diff` (faza 6).

#### 2. Testy przypięte do kolejności i e2e

**File**: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`,
`tests/curriculum.test.ts`, `tests/warmup.test.ts` (jeśli przypina kroki rozgrzewki), `tests/e2e/first-launch.spec.ts`,
`tests/e2e/adaptive.spec.ts` (tylko jeśli czerwone)

**Intent**: `playableSteps`: E1 `[2..11]`, E2 `[1..10]`, E5 `[1..11]`; `ORACLE` przeliczony ręcznie z reguły D
(`k = min(n, max(minStartSteps, ceil(progress·n)))`) z komentarzem z arytmetyką (research § 7 jako wyrocznia: E1 lis 5→6,
gru 7→8, sty 11→10; E2 lut 3→2, mar 4→3, cze 10→9; E5 paź 3→4); test „unplayable unlocked step falls back” przeniesiony z
E5.5 na E5.12 (dalej pusty); `curriculumEnd` E2.1 długość 2, „E5 step 4 leads to step 5”; `progress` E5 krok 5 → E5.12;
pięć `childName`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- `npm run sample -- E1 … E6 --count 6` bez naruszeń, z linią `visual:`
- Puste kroki tylko E1.1, E5.12, E6.2, E6.3, E6.11; każdy grywalny krok ma `childName`
- Deliberate break: E2.2 z powrotem `skills: []` → `ORACLE`/`playableSteps` czerwone; brak `childName` E1.10 → `tests/curriculum.test.ts` czerwony; przywrócone; meta-check: wyrocznia z ręcznej arytmetyki, nie z wyniku `calendarStart`
- `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): `first-launch` i `adaptive` zielone; pełne `<baseline gałęzi e2e> + 0` (czas `adaptive.spec` zapisany w handoffie)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample` `--count 6` dla E1.8, E1.10, E1.11, E2.1, E2.2, E2.8, E2.9, E2.10, E5.5, E5.7, E6.5 i pięciu `childName`
- [visual] Zrzuty: linijka E1.8 na kafelkach, 11–12 w dziesiątce + reszta (E1.10), klocki E1.10, pieniądze E2.2 (klawiatura), grosze E2.8, waga dag E2.8, dzbanki ¼ l (E5.5), karta „Nowa umiejętność!” z nowym `childName` — 1440×900 i 1024×768
- [human] Decyzja wbrew literze roadmapy S-14 („każdy etap ma pełny zestaw typów”): zakres zawężony, reszta w S-14b/S-14c/S-14d/S-13b (roadmapa w commicie planu)

---

## Phase 9: Dokumentacja, luki projektu, follow-upy, zmiana profilu i seam sweep

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps, follow-upy z `Trigger:`, `CLAUDE.md` i zmiana profilu § 10; nic do prowadzenia failing testem, dowód w walidatorze plików reguł i pełnej bramce.

### Overview

Zamknięcie zmiany przed e2e.

### Changes Required:

#### 1. Luki i dokumentacja

**File**: `docs/design-gaps.md`, `CLAUDE.md`, `context/changes/art-tasks-all-stages/follow-ups/review-fixes.md` (nowy)

**Intent**: wiersze od 59 (z komentarzem `DESIGN-GAP` w kodzie): układ monet i banknotów na stole i ich skala względna;
przedmiot (ikona) na lewej szalce, waga tylko w równowadze; brak odważników gramowych/5 dag/tony; brak innych naczyń (1,5 l);
ramki zamiast talerzy dla MULT_GROUPS; ujemna temperatura i zł + gr na kafelkach (klawiatura bez minusa i przecinka);
termometr „obok” klawiatury w fazie rozwiązania (rew. wierszy 52/57); zapasowy kształt dla brakującej tekstury.
Follow-upy z `Trigger:`: MONEY_PAY + `Wallet` + uogólniony `blockDrag` (`Trigger: S-14d`), warianty tekstowe MASS/LENGTH,
PLACE_VALUE ≥ 1000 (`Trigger: S-14c`), oś liczbowa jako podpowiedź (przeniesiony `Trigger: S-14b`), podświetlenie rysunku
(`Trigger: S-16 or a teacher read asking for it`), diagram O2 (`Trigger: a teacher read or visual gate finding the chart
unreadable beside the keypad`), banknoty 200/500 zł bez umiejętności (`Trigger: S-14c or a money skill above 100 zł`),
atlas tekstur (`Trigger: S-16`), `check:deploy` dla assetów (`Trigger: a production report
of a missing task image`). Zamknięte: „three Rect types”, O2 dla termometru. `CLAUDE.md` Current state: zdanie o S-14
(`public/assets/tasks/`, `npm run art`, `TASK_ART`, `ArtImage`, pięć widżetów, `measure.ts`, `allowNegative`, hak `art`);
`npm run art` w Commands; „Not yet present” poprawione.

#### 2. Zmiana profilu (Profile change)

**File**: `context/foundation/autonomous-run.md` § 10

**Intent**: wiersz „Paths asserted on purpose although absent” — `public/assets` usunięty (istnieje od fazy 2); zostaje „none”
albo inne ścieżki, jeśli walidator ich wymaga. `autonomous-run.env` nie zawiera tej listy (sprawdzone) — bez zmian.

#### 3. Seam sweep

**File**: pliki faz 1–8

**Intent**: brak placeholderów w `TaskPicture`; jeden wzorzec `ArtImage` w pięciu widżetach (bez własnych `add.image`);
geometria i kolory tylko w `layout.ts`; `measures.ts` jedynym źródłem wartości (generator, walidator, `describeVisual`);
nieaktualne komentarze (`pictureLayout.ts` „select/drag fall back”, `types.ts` „clock, ruler, blocks, bars”); `hideTaskLayer`
chowa każdy nowy widżet (zrzut podsumowania po zadaniu z grafiką).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/ui/widgets/ArtImg.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł, nie treść zdań
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Seam sweep: martwy kod, komentarze, duplikaty geometrii, `ArtImage` w każdym widżecie; DESIGN-GAP od 59; follow-upy z `Trigger:`
- [visual] Zrzut podsumowania rundy po zadaniu z grafiką (żaden obraz nie zostaje na ekranie) — 1440×900 i 1024×768
- [human] Decyzje wbrew literze ZADANIA: MONEY_PAY odłożony (S-14d); MASS tylko w równowadze (bez cięższe/lżejsze, gramów, tony); ujemne temperatury i zł + gr kafelkami; temperatury E3 co 5 °C, E5–E6 co 2 °C
- [human] Akceptacja tekstów nowych zadań (`pl.tasks.money*`, `mass*`, `capacity*`, `temperature*`, `count*`, `multGroups*`) i `childName` E1.8, E1.10, E1.11, E2.2, E2.8, E5.5
- [human] Tablet (iPad DPR 2, Android): ostrość banknotów i termometru, WebP w Safari, czytelność „12 zł 50 gr” na kafelku

---

## Phase 10: Zadania z grafiką dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) dla zadań z grafiką rastrową istnieje tylko w renderowanej stronie: tekstura załadowana, widżet widoczny, układ „obok” w skali FIT; zbudowane w fazach 2–9, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/art-tasks.spec.ts` (projekt `chromium-hook`), umiejętności wymuszone `?e2eSkills`, etap przez
`passWelcomeAsParent` (E3, E4, E5). Jedno zadanie na rodzaj, jedna runda mieszana — cel czasu speca < 60 s (lekcja F2).

### Changes Required:

#### 1. Konfiguracja

**File**: `playwright.config.ts`

**Intent**: `art-tasks` w regexie `ROUND_SPEC`; komenda bramki bez zmian.

#### 2. Spec

**File**: `tests/e2e/art-tasks.spec.ts` (nowy)

**Intent**: (a) „#11 a money task shows every coin and note loaded and takes a text tile”: E4, `E4.1.money_count_zl_gr` →
`snapshot.visual.kind === 'money'`, `snapshot.art.length === visual.items.length`, każde `loaded` → `answerWrong` → pasek
podpowiedzi, `art` nadal pełne → `answerRight` → gwiazdka. (b) „#11 a balance scale task shows the scale, item and weights and
takes the keypad”: E3, `E3.4.mass_dag_100` → `art` = waga + przedmiot + każdy odważnik, wszystkie `loaded` → `answerRight`.
(c) „#11 a thermometer stays readable beside the keypad in the solution”: E5, `E5.4.temperature_read_0_30` → `art` ma
ramkę `loaded`, `targets.picture` nie `null` → dwa razy `answerWrong` → faza `solution` → `targets.picture` węższy niż wysoki
i na lewo od `TASK_LAYOUT.picture.keypadBeside.lines.x` → retype → gwiazdka. (d) „#11 a round of art tasks plays to the
summary”: E3, `?e2eSkills=E3.4.mass_kg_10,E3.9.mult_groups_result,E3.9.mult_groups_expr,E3.11.temperature_read_30,E3.4.mass_dag_100`
→ przed każdym zadaniem `snapshot.visual.kind` ∈ {`scale`, `icons`, `thermometer`} i każde `art` `loaded` (`forcedSkills`
po cichu wraca do rundy adaptacyjnej, gdy jedno id nie jest grywalne — plan-review F6) → `playRoundRight(page, 5)` →
podsumowanie (ujemne kafelki tekstowe, kafelki „3 · 4”, ikony w ramkach).

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; punkty z haka (wnętrza kształtów);
`expect.poll` na migawce, bez czekania na czas, bez `page.clock`.

**Chromium niedostępny w sesji agenta**: protokół request-file — spec bez commita, `e2e-request-p10.md` (komendy zielonych
uruchomień i tabela przerw jak `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/e2e-request-p11.md`), patche
`e2e-break-p10a.patch` … `e2e-break-p10d.patch` (tylko kod produkcyjny), `STATUS: BLOCKED — e2e needs orchestrator run
(request file written)`; agent kończący commituje spec po wyniku orkiestratora.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/art-tasks.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4` passed; czas pełnego zestawu i `adaptive.spec` zapisane
- Deliberate break (patch `e2e-break-p10a.patch`): `BootScene` ładuje folder `money` pod złym url → (a) czerwony na `loaded` (zapasowy kształt widoczny, tekstura brak); meta-check: dowodzi, że hak czyta teksturę, nie widoczność
- Deliberate break (patch `e2e-break-p10b.patch`): `Thermometer.render` nie pokazuje twarzy (słupka) → (c) czerwony na `targets.picture` null; meta-check: lekcja F1 — widżet niewidoczny nie przechodzi
- Deliberate break (patch `e2e-break-p10c.patch`): `MoneyTable` rysuje tylko pierwszy nominał → (a) czerwony na liczbie `art`
- Deliberate break (patch `e2e-break-p10d.patch`): `TaskScene` przekazuje zawsze `wide` → (c) czerwony na proporcji `targets.picture`; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Model: `visualKey`, `validateVisual` (pięć nowych rodzajów, wyczerpujący), `describeVisual`, `visualShape`; `formatMoney`,
  `formatCelsius`, formy mówione; `allowNegative`; `lastNumber` z minusem; `leaksAnswer` dla tekstu; `pictureLayout` z kształtem; wspólny `Rect`.
- Assety: `tests/taskArt.test.ts` (tabela ↔ pliki ↔ nagłówki WebP ↔ id w `measures.ts`, łączny rozmiar).
- Generatory: 1000 losowań na wariant, wyrocznie z pól rysunku, parsery, dystraktory (bez drugiej poprawnej), wiarygodne masy, odpowiedzi całkowite przy klawiaturze.
- Program: kolejność kroków, wyrocznia startu z reguły D, odblokowania, `childName`, inwarianty treści, pin E1 tylko kafelki.

### Integration Tests:

- `npm run sample -- E1..E6 --count 6` z linią rysunku; `npm run build` (precache 38 obrazów, strażnik haka); e2e: seed (#8) z
  asercją precache każdego obrazu, istniejące 42 (w tym `first-launch`, `adaptive` po zmianie kolejności) + 4 nowe.

### Manual Testing Steps:

1. Zrzuty każdego stanu z faz 5–9 — 1440×900 i 1024×768.
2. Odczyt nauczyciela wszystkich zmienionych kroków (fazy 3–8).
3. Tablet: ostrość grafiki, kafelki tekstowe, termometr obok klawiatury, offline z ekranu głównego.

## Performance Considerations

38 tekstur ≈ 0,5 MB ładowanych raz w `BootScene` (offline z precache; NFR start offline < 3 s — sprawdzane na tablecie
`[human]`). Widżety tworzą obrazy raz i tylko przestawiają teksturę/pozycję przy zmianie zadania; `IconGroups` z pulą ≤ 30.
Rozmiary ≤ 2× wyświetlania — bez mipmap, bez migotania przy skali FIT.

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1; fixtury nietknięte; nowe umiejętności startują z mastery 0. Uczeń zapisany na E1 (lis/gru) i
E5 (paź) wczytany po zmianie: `floorToCalendar` podnosi go o jeden krok (oczekiwany skutek reguły D); E2.1/E4.1 i inne kroki
z dołożonymi umiejętnościami odblokowują się wolniej (`ceil(0.5·n)`) — wzmianka w PR.

## Known risks

- **Rozgrzewka E2** dostaje zadania pieniężne z E2.2 (`firstPlayableSteps(E2, 2)` = kroki 1 i 2) — zgodne z programem, ale
  dla 7-latka we wrześniu pieniądze mogą być nowe; odczyt nauczyciela.
- **Czas e2e**: nowe umiejętności klawiaturowe/kafelkowe w E3/E4 nie spowalniają `adaptive.spec`, ale pełny zestaw rośnie o
  ~4 testy; faza 10 zapisuje czasy.
- **Tekstury na iPadzie**: WebP od iOS 14; ostrość przy DPR 2 tylko `[human]`. Zmieniłoby: pełna rozdzielczość banknotów/termometru (nadal WebP).
- **Chromium w sesji agenta**: fazy 2, 5–8, 10 mogą wymagać protokołu request-file.
- **Waga i pieniądze przy klawiaturze w fazie rozwiązania** dostają `keypadSolution.picture` 768×190 (waga ≈ 253×190,
  napisy odważników małe); „obok” tylko dla termometru (decyzja 8). Zrzuty 5.9 to sprawdzają; zmieniłoby: nieczytelne
  odważniki na zrzucie → kształt `tall`/„obok” także dla `scale` (jedna linia w `visualShape`) (plan-review F8).
- **Banknoty 200 zł i 500 zł** są w `TASK_ART` i precache, ale żadna umiejętność S-14 ich nie losuje (E4.1 ≤ 100 zł,
  plan-review F4) — follow-up w fazie 9 (`Trigger: S-14c or a money skill above 100 zł`).
- **`requestfailed` w seedzie** (#8): asercja `[]` może złapać niezwiązane żądanie offline; wtedy filtr do `/assets/` i `/_app/`
  zamiast osłabiania asercji.
- **Kafelki tekstowe w E6**: przy krokach co 2 °C zgadywanie z 3–4 kafelków bywa łatwe — research decyzja 2; zmieniłoby: pytanie dzielone („ile stopni poniżej zera?”).

## References

- Research: `context/changes/art-tasks-all-stages/research.md`; change: `context/changes/art-tasks-all-stages/change.md`
- Kontrakt runu: `context/runs/2026-10-13-s12-s14/agent-contract.md` („S-13 … and S-14”); profil `context/foundation/autonomous-run.md` § 6, § 8, § 10
- Katalog: `docs/ZADANIA.md` § 3 (kroki), § 4 (COUNT, MULT_GROUPS, Pieniądze, Miary), § 7; plan `Martynka-urzadza.md` § 10, § 11 M6, § 14; PRD FR-023
- Test-plan: `context/foundation/test-plan.md` ryzyka #8, #11; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md` („Money and measuring objects”, „Font and spacing”), `README.md` § Integration, `manifest.json`, `reference/thermometer-face.js`, `screenshots/task-tiles.png`
- Wzorce: `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/` (plan, `reviews/impl-review.md` F1/F2, `e2e-request-p11.md`), `scripts/make-icons.mjs`, `src/ui/widgets/TaskPicture.ts`, `src/core/tasks/generators/clock.ts` (`timeChoices`)

## Autonomous decisions

1. **Zakres S-14 = grafika paczki A (MONEY_COUNT, MONEY_CHANGE, MASS w równowadze, CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS)
   + dane widżetów S-13; reszta → S-14b (WRITTEN, ARROW_TABLE, oś), S-14c (typy tekstowe, warianty tekstowe MASS/LENGTH,
   PLACE_VALUE ≥ 1000, MIX), S-14d (E1.1, ORDINAL, pary, CHOOSE_OP z obrazkiem, tryb z obrazkami, MONEY_PAY), PERIMETER
   E5.12/E6.3 → S-13b.** Odrzucone: pełny zestaw typów (~25–30 faz). Wbrew literze roadmapy → `[human]` 8.9. Roadmapa
   uzupełniona w commicie planu. Zmieniłoby: polecenie opiekuna, by S-14 zamknął kryterium M6 sam.
2. **MONEY_PAY odłożony do S-14d (nie osobna pozycja).** Odrzucone: uogólniony `blockDrag` + `Wallet` w S-14 (≈ 2 fazy,
   ryzyko dla każdego speca z `answerRight`); osobna pozycja roadmapy (S-14d i tak wprowadza tryby dotykowe E1–E2). Wbrew
   ZADANIA → `[human]` 9.7. Zmieniłoby: zapas budżetu po fazie 8 albo prośba opiekuna.
3. **WebP (½ rozdzielczości, ≤ 2× wyświetlania), luźne pliki, folder `tasks/measuring/`; skrypt `cwebp` lokalnie, wyniki
   commitowane.** Odrzucone: PNG 1:1 (≈ 10 MB precache), atlas (M7), enkoder WASM w CI. Wbrew planowi § 10 → `[human]` 2.9.
   Zmieniłoby: rozmycie na iPadzie (pełna rozdzielczość tych plików) albo wymóg generowania w CI.
4. **Brak obrazu nie jest fatalny: zapasowy kształt w kodzie + `console.warn`; test jednostkowy pilnuje tabeli ↔ plików, seed
   pilnuje precache.** Odrzucone: karta błędu (kłóci się z „no fail states”). Zmieniłoby: decyzja, by brak grafiki był błędem buildu.
5. **Kafelki tekstowe dla ujemnych temperatur i zł + gr; klawiatura dla pełnych złotych, dag, litrów, stopni ≥ 0 od E2/E3;
   E1 tylko kafelki; `Keypad` bez zmian.** Wbrew domyślnej klawiaturze → `[human]` 9.7. Zmieniłoby: odczyt nauczyciela, że kafelki w E6 są za łatwe.
6. **Temperatury: E3.11 co 5 °C (na 294 px etykiety co 10, kreski co 5), E5.4 i E6.1 co 2 °C.** Odrzucone: każdy stopień
   (≈ 4,5 px/°C — nieczytelne na tablecie). Zmieniłoby: zrzut tabletu pokazujący czytelne kreski co 1 °C.
7. **MASS: masa przedmiotu z tabeli wiarygodnych zakresów na ikonę (`SCALE_ITEMS`)**; ½ kg jako 50 dag na wadze, ¼ kg nie
   rysowane (brak 5 dag). Zmieniłoby: nowe ikony/odważniki z inwentarza grafiki.
8. **Układ „obok” tylko dla kształtu `tall` (termometr); diagram O2 zostaje follow-upem.** Odrzucone: „obok” dla każdego
   rysunku przy klawiaturze (linijka i waga są szerokie — straciłyby). Zmieniłoby: zrzut, w którym diagram/waga są nieczytelne w 768×190.
9. **Wspólny `Rect` w `src/core/geometry.ts` w fazie 1** (trigger follow-upu S-13 wyzwolony zmianą `pictureLayout`).
10. **Hak `art` czyta stan tekstury i widoczności każdego obrazu (lekcja F1 z impl-review S-13); spec < 60 s, jedno zadanie
    na rodzaj (lekcja F2).**
11. **Kolejność kroków zmienia się raz (faza 8); fazy 5–7 dokładają dane tylko do kroków już grywalnych.** Odrzucone: dane w
    każdej fazie typu (pięciokrotna aktualizacja `ORACLE`). Zmieniłoby: brak.
12. **Brak nowego trybu odpowiedzi → helpery e2e bez zmian w fazach 5–8** (kontrakt: helper przed `playable` — spełniony
    trywialnie; kafelki tekstowe obsłużone od S-13).
13. **Dziesięć faz: 3 × tdd (1, 3, 4), 6 × impl (2, 5, 6, 7, 8, 9 — po ≤ 2 nowe komponenty UI: `ArtImage`; `MoneyTable` +
    `BalanceScale`; `Jugs` + `Thermometer`; `IconGroups`), 1 × e2e po seam sweep.** Asercja seeda #8 w fazie 2 (request-file),
    bo dowodzi pipeline'u tej fazy.
14. **Zmiana profilu § 10 w fazie 9** (wiersz `public/assets` „absent on purpose” nieaktualny od fazy 2); walidator przechodzi
    także przed nią, bo ścieżka istnieje.
15. **Roadmapa w commicie planu: S-14 → `planning`; nowe S-14b, S-14c, S-14d (`proposed`); S-13b poszerzony o PERIMETER
    E5.12/E6.3.** Brak `AskUserQuestion` (kontrakt reguła 1): złożoność HIGH, pytania rozstrzygnięte z research/change.md.
16. **Plan-review (2026-10-14) wprowadził poprawki F1–F7** (`reviews/plan-review.md`): progi inwariantów mierzone w fazach
    tdd, MASS `half`/`convert` jako „ile brakuje do …”, CAPACITY z mieszanym rzędem, TEMPERATURE `low/high` i krok 2 °C dla
    różnicy, `validationBounds` dla wszystkich wywołań walidatora, E4.1 ≤ 100 zł, seed z przerwą jednego pliku, spec (d) z
    asercją rodzajów. Zmieniłoby: teacher read uznający „ile brakuje” za zbyt trudne dla E2.8 → wariant tekstowy w S-14c.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Model rysunków z grafiką, teksty miar, walidator i układ „obok” w `core`

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 46aff1d (1482 → 1510, +28)
- [x] 1.2 Deliberate break: zakres termometru / `formatMoney` / `leaksAnswer` tylko czas / `pictureLayout` bez `tall` → czerwone; przywrócone; meta-check — 46aff1d
- [x] 1.3 `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian — 46aff1d
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 46aff1d (e2e 42 passed by the orchestrator on 759fde1)

#### Manual

- [ ] 1.5 [reviewer] `visual.ts`, `measure.ts`, `geometry.ts` bez Phasera i globali; tylko id i liczby; wartości z `manifest.json`

### Phase 2: Pipeline WebP, tabela tekstur, ładowanie w `BootScene` i precache offline (#8)

#### Automated

- [x] 2.1 `tests/taskArt.test.ts` zielony; unit `<baseline gałęzi> + N` — d4f4470 (1510 → 1515, +5)
- [x] 2.2 Deliberate break: usunięty `.webp` / zła szerokość w `TASK_ART` → czerwony; przywrócone; meta-check — d4f4470
- [x] 2.3 `npm run art` drugi raz: `public/assets` bez zmian — d4f4470 (SHA wszystkich 38 plików identyczne)
- [x] 2.4 `npm run build`: `sw.js` wymienia 38 wpisów `assets/tasks/`; `e2e hook: absent (` — d4f4470
- [x] 2.5 E2E (orkiestrator): `seed.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 0` — ab0dc05 (e2e by the orchestrator: seed 1 passed, break red, 42 passed)
- [x] 2.6 Deliberate break (patch `e2e-break-p2.patch`, `globIgnores` jednego `note-500zl.webp`): seed czerwony na tym pliku; przywrócone; meta-check — ab0dc05 (e2e by the orchestrator: seed 1 passed, break red, 42 passed)
- [x] 2.7 Pełna bramka lokalna zielona — ab0dc05 (e2e by the orchestrator: seed 1 passed, break red, 42 passed)

#### Manual

- [ ] 2.8 [reviewer] Pliki tylko w `public/assets/tasks/`, nazwy wg plan § 10, nic z `designs/` w git; `ArtImage` bez tekstów gracza
- [ ] 2.9 [human] Decyzja wbrew planowi § 10: WebP zamiast PNG, luźne pliki zamiast atlasu, folder `tasks/measuring/`

### Phase 3: Generatory MONEY_COUNT, MONEY_CHANGE i MASS

#### Automated

- [x] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — b6a947d
- [x] 3.2 1000 losowań na generator bez naruszeń; wyrocznie z pól rysunku; klucze `generators`/`parsers` równe; progi inwariantów dla parametrów planowanych umiejętności — b6a947d
- [x] 3.3 Deliberate break: reszta 0 / odważniki nie sumują się / nieznany nominał → czerwone; przywrócone; meta-check — b6a947d
- [x] 3.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — b6a947d (e2e 42 passed by the orchestrator on bb9ca57)

#### Manual

- [ ] 3.5 [reviewer] Odczyt nauczyciela szablonów `money*`/`mass*` i 6 losowań na wariant

### Phase 4: Generatory CAPACITY, TEMPERATURE, COUNT i MULT_GROUPS

#### Automated

- [x] 4.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — ba4e0da
- [x] 4.2 1000 losowań na wariant bez naruszeń (TEMPERATURE z `allowNegative`); klucze `generators`/`parsers` równe; progi inwariantów dla parametrów planowanych umiejętności — ba4e0da
- [x] 4.3 Deliberate break: łącznik zamiast U+2212 / ½ l z nieparzystym `n` / zamieniony iloczyn jako dystraktor / COUNT 4 kafelki → czerwone; przywrócone; meta-check — ba4e0da
- [x] 4.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — ba4e0da (e2e 42 passed by the orchestrator on 328bd03)

#### Manual

- [ ] 4.5 [reviewer] Odczyt nauczyciela szablonów `capacity*`/`temperature*`/`count*`/`multGroups*` i 6 losowań na wariant

### Phase 5: `MoneyTable` i `BalanceScale`, hak `art`, umiejętności w E1.11, E3.4, E4.1

#### Automated

- [x] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — 89e5ea0 (lint, typecheck, unit 1649 -> 1707 +58, deploy tests, sample E1-E6, build; e2e in 5.5)
- [x] 5.2 `npm run sample -- E1/E3/E4 --count 6` bez naruszeń, z linią `visual:` — 89e5ea0 (E1, E3, E4 exit 0, `visual:` lines read)
- [x] 5.3 Deliberate break: `TaskPicture` bez gałęzi `money` → typecheck czerwony; przywrócone; meta-check — 89e5ea0 (case 'money' removed: TS2322 not assignable to never)
- [x] 5.4 `playableSteps` E1/E3/E4 bez zmian; `tests/fixtures/` bez zmian — 89e5ea0 (curriculumStart and fixtures untouched, green)
- [x] 5.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — 89e5ea0 (e2e 42 passed by the orchestrator on 6186935)
- [x] 5.6 `npm run build` drukuje `e2e hook: absent (` — 89e5ea0

#### Manual

- [ ] 5.7 [reviewer] Odczyt nauczyciela `sample` E1.11, E3.4, E4.1 `--count 6`
- [ ] 5.8 [reviewer] Widżety bez tekstów gracza i liczb balansu; `hideTaskLayer` chowa oba
- [ ] 5.9 [visual] Zrzuty: monety E1.11, banknoty E4.1 (klawiatura), zł + gr na kafelkach, waga kg (kafelki), waga dag (klawiatura), waga z podpowiedzią, waga z krokami obok klawiatury, pieniądze z krokami obok kafelków — 1440×900 i 1024×768

### Phase 6: `Jugs` i `Thermometer`, układ „obok” w scenie, umiejętności w E3.11, E4.7, E5.4, E6.1

#### Automated

- [x] 6.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (e2e osobno, 6.5)
- [x] 6.2 `npm run sample -- E3/E4/E5/E6 --count 6` bez naruszeń, z linią `visual:`
- [ ] 6.3 Deliberate break: `TaskScene` zawsze `wide` → termometr w rozwiązaniu nie „obok” (jednorazowy hook `*.local` albo e2e 10.5); przywrócone
- [x] 6.4 `playableSteps` bez zmian; `tests/fixtures/` bez zmian; `e2e hook: absent (`
- [ ] 6.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 6.6 [reviewer] Odczyt nauczyciela `sample` E3.11, E4.7, E5.4, E6.1
- [ ] 6.7 [visual] Zrzuty: termometr dodatni (klawiatura), ujemny z kafelkami tekstowymi, z podpowiedzią, z krokami w układzie „obok”, różnica temperatur, dzbanki ½ l, dzbanki z krokami — 1440×900 i 1024×768

### Phase 7: `IconGroups`, umiejętności COUNT w E1.2, E1.4 i MULT_GROUPS w E3.9

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 7.2 `npm run sample -- E1/E3 --count 6` bez naruszeń, z linią `visual:`
- [ ] 7.3 Deliberate break: `count_5` jako `keypad` → pin E1 czerwony; przywrócone; meta-check
- [ ] 7.4 `playableSteps` bez zmian; `e2e hook: absent (`
- [ ] 7.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 7.6 [reviewer] Odczyt nauczyciela `sample` E1.2, E1.4, E3.9
- [ ] 7.7 [visual] Zrzuty: liczenie 1–5, 6–7, grupy w ramkach z kafelkami liczb i „3 · 4”, grupy z podpowiedzią — 1440×900 i 1024×768

### Phase 8: Nowe kroki grywalne E1.8, E1.10, E2.2, E2.8, E5.5, dane widżetów S-13 i testy przypięte do kolejności

#### Automated

- [ ] 8.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 8.2 `npm run sample -- E1 … E6 --count 6` bez naruszeń, z linią `visual:`
- [ ] 8.3 Puste tylko E1.1, E5.12, E6.2, E6.3, E6.11; każdy grywalny krok ma `childName`
- [ ] 8.4 Deliberate break: E2.2 `skills: []` / brak `childName` E1.10 → czerwone; przywrócone; meta-check
- [ ] 8.5 `tests/fixtures/` bez zmian; `e2e hook: absent (`
- [ ] 8.6 E2E (orkiestrator): `first-launch` i `adaptive` zielone; pełne `<baseline gałęzi e2e> + 0`; czas `adaptive.spec` zapisany

#### Manual

- [ ] 8.7 [reviewer] Odczyt nauczyciela `sample` `--count 6` E1.8, E1.10, E1.11, E2.1, E2.2, E2.8, E2.9, E2.10, E5.5, E5.7, E6.5 i `childName`
- [ ] 8.8 [visual] Zrzuty: linijka E1.8, 11–12 w dziesiątce + reszta, klocki E1.10, pieniądze E2.2, grosze E2.8, waga dag E2.8, dzbanki ¼ l, karta „Nowa umiejętność!” z nowym `childName` — 1440×900 i 1024×768
- [ ] 8.9 [human] Decyzja wbrew literze roadmapy S-14: zakres zawężony, reszta w S-14b/S-14c/S-14d/S-13b

### Phase 9: Dokumentacja, luki projektu, follow-upy, zmiana profilu i seam sweep

#### Automated

- [ ] 9.1 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- [ ] 9.2 `validate-rule-files.sh` PASS
- [ ] 9.3 Deliberate break: `CLAUDE.md` z nieistniejącą ścieżką → FAIL; przywrócone; meta-check
- [ ] 9.4 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 9.5 [reviewer] Seam sweep: martwy kod, komentarze, duplikaty geometrii, `ArtImage` w każdym widżecie; DESIGN-GAP od 59; follow-upy z `Trigger:`
- [ ] 9.6 [visual] Zrzut podsumowania rundy po zadaniu z grafiką — 1440×900 i 1024×768
- [ ] 9.7 [human] Decyzje wbrew ZADANIA: MONEY_PAY odłożony; MASS tylko w równowadze; ujemne i zł + gr kafelkami; temperatury co 5/2 °C
- [ ] 9.8 [human] Akceptacja tekstów nowych zadań i `childName` E1.8, E1.10, E1.11, E2.2, E2.8, E5.5
- [ ] 9.9 [human] Tablet (iPad DPR 2, Android): ostrość grafiki, WebP w Safari, czytelność „12 zł 50 gr”

### Phase 10: Zadania z grafiką dotykiem — e2e (#11)

#### Automated

- [ ] 10.1 `art-tasks.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`; czasy zapisane
- [ ] 10.2 Deliberate break (patch `e2e-break-p10a.patch`): zły url folderu `money` → (a) czerwony na `loaded`; meta-check
- [ ] 10.3 Deliberate break (patch `e2e-break-p10b.patch`): twarz termometru niewidoczna → (c) czerwony; meta-check
- [ ] 10.4 Deliberate break (patch `e2e-break-p10c.patch`): `MoneyTable` tylko pierwszy nominał → (a) czerwony
- [ ] 10.5 Deliberate break (patch `e2e-break-p10d.patch`): zawsze `wide` → (c) czerwony na proporcji; przywrócone
- [ ] 10.6 `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
