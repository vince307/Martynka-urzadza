# E1 z obrazkami: figury, szlaczki, porównywanie liczebności, „który z kolei”, CHOOSE_OP z obrazkiem i płacenie monetami — Implementation Plan

## Overview

Slice roadmapy **S-14d** (`e1-shapes-picture-mode`, etap M6), autonomiczny run `2026-10-15-fix-s14c-s14d`, gałąź
`feat/e1-shapes-picture-mode` z `main` @ `10d6fe7`. Sześciolatek dostaje w rundzie:

- **E1.1 grywalny** (dziś `skills: []`): **SHAPES** („Dotknij trójkąta.”, „Który nie pasuje?” na kafelkach z narysowanymi
  figurami, „Dotknij wszystkich kół.” w trybie `select`), **PATTERN** (szlaczek figur z pustym miejscem, „Co będzie dalej?”,
  kafelki z figurami) i **COMPARE_QTY** (dwie grupy ikon, kafelki „Po lewej” / „Po prawej” / „Tyle samo”);
- **ORDINAL** w E1.2 („Który z kolei od lewej jest klucz?”, rząd różnych ikon, kafelki z liczbami 1–5);
- **CHOOSE_OP z obrazkiem** w E1.3 (dwie grupy ikon i strzałka „przybywa / ubywa”, 3 działania na kafelkach) jako nowa
  umiejętność; przy okazji naprawa „kupił jeszcze 2 złote” (`Context.price` jako flaga „da się kupić”);
- **MONEY_PAY** w E1.11 i E2.2 jako **trzecia gałąź `drag`** (`coins`): taca nominałów → portfel, „OK”; wariant
  „najmniejszą liczbą monet”; generyczny reduktor taca→mata wspólny z klockami (S13-09 naprawiony we wspólnym jądrze);
- **tryb z obrazkami**: czysty filtr doboru umiejętności w rundzie E1 (wiek 6 we wrześniu–styczniu albo aktywne łagodzenie),
  bez nowego ekranu i bez pola w zapisie.

Format zapisu zostaje **v2** — żadna faza nie potrzebuje v3 (nowe umiejętności to nowe klucze w otwartej mapie `mastery`,
tryb z obrazkami wynika z wieku, etapu, miesiąca i `easedRounds`, które już są w zapisie lub w sesji).

## Current State Analysis

Źródło: `research.md` (cztery workery + kotwice sprawdzone w głównym kontekście) i odczyty tego kroku.

- **Rejestr** (`src/core/tasks/registry.ts`): 44 typy; brak SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, ORDINAL,
  MONEY_PAY. W `tests/curriculum.test.ts` wszystkie stoją w `LATER` („allowed to have no skill yet”); typ przeniesiony do
  `GROUP_1` musi mieć umiejętność w każdym kroku, który go wymienia. Kroki wymieniające nowe typy: E1.1 (SHAPES, PATTERN,
  COMPARE_QTY, SPATIAL, SYMMETRY), E1.2 (ORDINAL), E1.11 i E2.2 (MONEY_PAY).
- **Kafelki mają tylko tekst**: `AnswerTiles.setChoices` i `SelectTiles.setChoices` (`src/ui/widgets/`) rysują prostokąt i
  `String(value)`. Narrator czyta polecenie i podpowiedzi (`src/core/narration/spoken.ts`), nigdy kafelków — dla 6-latka
  kafelki „koło”/„trójkąt” są nieczytelne. Figury (koło, kwadrat, trójkąt, gwiazda, serce) umie już rysować
  `CoordGrid.drawItem` (`src/ui/widgets/CoordGrid.ts`, S-13b).
- **Rysunki** (`src/core/tasks/visual.ts` `TaskVisual`): `icons {icon, groups, framed}` jest (COUNT, MULT_GROUPS; widżet
  `IconGroups`), brak rzędu różnych ikon, szlaczka i strzałki. `validateVisual`, `visualKey`, `describeVisual`,
  `TaskPicture.render` to wyczerpujące `switch`e; `visualShape` domyślnie `wide`.
- **Drag**: `dragMode` (`src/core/tasks/dragMode.ts`) zna `blocks` i `clock`, dla innego rysunku rzuca. `TaskScene` trzyma
  boolean `clockTask` i rozgałęzia `feedDrag`, render, `okTarget`, `snapshot`, `targets` na nim.
  `stepBlockDrag` (`src/core/blockDrag.ts`, 79 linii): ~57 linii niezależnych od rodzaju; S13-09 — `down` z tym samym
  `pointerId` w trakcie niesienia zwraca stan bez zmian (zgubiony `touchcancel` zostawia klocek „w powietrzu”).
- **Odpowiedź**: `Task.answer: number | string | number[]`, `Task.check?`; `isCorrect` (`src/core/round.ts`): `check`
  najpierw, potem równość zbiorów dla tablic, potem `===`. `captureFirstWrong` zapisuje tylko liczby i napisy.
- **Pieniądze**: `MONEY` (grosze), `COIN_IDS`, `NOTE_IDS`, `ART_LIMITS.moneyItems = 10` (`src/data/measures.ts`); 15 plików
  WebP w `public/assets/tasks/money/`; `artBlocked` (`src/core/round/artFilter.ts`) zna MONEY_COUNT, MASS, CAPACITY.
- **E2E** (`tests/e2e/support/hook.ts`): `answerRight`/`answerWrong` — kafelki, `select`, `drag && state.clock` → `setClock`,
  **gołe `drag` → `buildOnMat`**, cyfry, klawiatura, `never`. Snapshot nie ma `dragMode`. Zadanie MONEY_PAY wpadłoby w gałąź
  klocków i skończyło się timeoutem w ~13 nieprzypiętych specach (pula `previous` i rozgrzewka E2 losują E1.11/E2.2).
- **Program**: E1.2 = 2 umiejętności (próg 1), E1.3 = 4 (próg 2), E1.11 = 5 (próg 3), E2.2 = 3 (próg 2);
  `E1.2.count_5` ma `min: 1` (O4: jedna ikona). `calendarStart` dla E1 (n = 10, kroki 2…11) = `[3, 4, 6, 8, 10, 11]`,
  przypięte w `tests/curriculumStart.test.ts` (`ORACLE`, lista `playableSteps`) i w tytule testu „E1 step 1 is the only
  gap left at the start” (`tests/curriculumEnd.test.ts`).
- **Rejestr sesji**: `REGISTRY_KEYS.month` (`src/data/layout.ts`) — miesiąc 0–11 ustawiany w `main.ts`; `buildAdaptiveRound`
  (`src/core/curriculum.ts`) dostaje opcjonalne `art` i stosuje `withoutArtBlocked` po `skillBuckets` — to samo miejsce
  przyjmie filtr trybu z obrazkami. `placementData` (`src/data/placement.ts`): `months.autumn = [8, 9, 10, 11, 0]`.
- **Szablony**: `sum.bought` + kontekst `złoty` bez `price` daje w CHOOSE_OP „kupił jeszcze 2 złote”; `Context.price` już
  znaczy „none = never bought”; ten sam niefiltrowany `rng.pick(contexts)` jest w WORD (`sum`) i COMPARE_DIFF.
- **Luki projektu**: najwyższy wiersz `docs/design-gaps.md` = 99, nowe od **100**; wiersz 21 („tryb z obrazkami nie ma
  ekranu”) otwarty. Brak grafiki portfela w `designs/`.

## Desired End State

- 6-latek w E1.1 dotyka figur narysowanych na kafelkach, uzupełnia szlaczek, porównuje dwie grupy ikon; w E1.2 wskazuje
  liczbą, który z kolei jest przedmiot; w E1.3 wybiera działanie do obrazka; w E1.11/E2.2 przeciąga monety do portfela i
  stuka „OK”. Każde zadanie ma podpowiedź po polsku (czytaną przez narratora) i drugą próbę, która nadal daje gwiazdkę.
- `npm run sample -- E1 --count 6` i `-- E2 --count 6` bez naruszeń, z nowymi umiejętnościami; inwarianty treści zielone bez
  nowych wpisów w `SMALL_SPACES`, chyba że faza zapisze powód.
- Runda E1 sześciolatka (wrzesień–styczeń) lub ucznia E1 w łagodzeniu bierze najpierw umiejętności z obrazkiem.
- `answerRight`/`answerWrong` przełączają się wyczerpująco na `snapshot.dragMode`; nieznana gałąź rzuca czytelnym błędem.
- Dwa nowe spece e2e (`picture-tasks`, `money-pay`) w `ROUND_SPEC`, pełny zestaw `<baseline gałęzi e2e> + N` z `--workers=4`.
- Zapis v2, fixture'y `tests/fixtures/` bajtowo bez zmian.

### Key Discoveries:

- `dragMode` decyduje z rysunku, nigdy z typu odpowiedzi (`src/core/tasks/dragMode.ts`) — `money` z `pay` dostaje `coins`.
- `stepClockSet` (`src/core/clockSet.ts`) traktuje każdy `down` jako nowy chwyt — wzór naprawy S13-09.
- `withoutArtBlocked` (`src/core/round/artFilter.ts`) to wzór filtra kubłów, który nie schodzi poniżej progu odblokowania.
- `IconGroups` + `ICONS` (12 id w `src/data/measures.ts`) wystarczą dla COMPARE_QTY; ORDINAL i CHOOSE_OP potrzebują rozszerzeń.
- `nouns` (`src/data/nouns.ts`) nie ma rodzaju → kafelki ORDINAL z liczbami, nie z liczebnikami porządkowymi.
- `prostokąt` nie ma w `nouns.ts` (koło, kwadrat, trójkąt są).

## What We're NOT Doing

- **SPATIAL** (brak sceny w kicie i w paczkach), **SYMMETRY** (tryb „przełącz kratkę”), **BONDS „połącz pary”** (tryb łączenia
  par) — zostają w `LATER`, follow-upy z triggerami (faza 9). Wbrew blokowi roadmapy S-14d → `[human]` 9.7.
- ORDINAL „dotknij czwartego od prawej” (dotyk w rysunku) i kafelki z liczebnikami słownymi; ORDINAL do 10 w późniejszym kroku E1.
- 10 zł banknot na tacy E1.11 (ZADANIA § 2 wymienia go dla E1) — tylko monety 1, 2, 5 zł; banknot od E2.2.
- Oś liczbowa jako podpowiedź E1 i E1.10 `place_read_12` — follow-upy z nowymi triggerami.
- Ekran albo przełącznik „trybu z obrazkami” (ustawienie rodzica = pole w `Settings` = v3).
- Grafika portfela, 12 dodatkowych ikon z paczki expansion (12 obecnych wystarcza dla inwariantów).
- Zapis błędnego portfela jako przykładu błędu w podglądzie rodzica (`captureFirstWrong` zapisuje tylko liczby/napisy).
- Zmiana wag łagodzenia 20/50/30, harmonogramu wariantów S-15 (`src/core/variants.ts`) i minigier (`WORD_TYPES`).

## Implementation Approach

Kolejność z research (decyzja 3): najpierw treść kafelkowa (figury, potem ikony), potem tryb z obrazkami, na końcu MONEY_PAY.
Każdy typ najpierw jako czysty generator z failing testami (faza `tdd`), potem widżet + dane + odczyt nauczyciela (faza
`impl`). MONEY_PAY w trzech fazach: wspólny reduktor (tdd, z e2e klocków w tej samej fazie), generator i model (tdd), scena +
portfel + hak + helpery e2e + dane w **jednej** fazie (reguła bezpieczeństwa kontraktu). Seam sweep przed fazami e2e.

## Critical Implementation Details

**Twarze kafelków (fazy 1–2; zależą 3–4, 10).** Wybór, który dziecko musi rozróżnić bez czytania, jest obrazkiem. Kod
twarzy to napis `shape:<figure>:<colour>:<size>` (np. `shape:triangle:red:big`), parsowany przez czystą funkcję w
`src/core/tasks/faces.ts` (`parseFace`, `faceKey`, `isFace`); figury `circle | square | rectangle | triangle` (+ `star`,
`heart` z `GRID_ITEM_IDS` tylko w PATTERN), kolory i rozmiary z `src/data/shapes.ts` (nazwy po polsku: mianownik, biernik,
dopełniacz l.mn. — „Dotknij trójkąta”, „wszystkich kół”). Wszystkie twarze w jednym zadaniu są **różne** (reguła walidatora
`faces-distinct`), więc `select` nie dostaje dwóch takich samych wartości. Kafelek z twarzą rysuje figurę (wspólny helper
`drawFace` wyjęty z `CoordGrid.drawItem` do `src/ui/widgets/faceDraw.ts`), kafelek bez twarzy — tekst jak dziś. Podgląd
rodzica nigdy nie pokazuje surowego kodu: `faceLabel(code)` (`src/core/text/faces.ts` albo w `faces.ts` z nazwami z danych)
daje „czerwony trójkąt”.

**MONEY_PAY: kontrakt odpowiedzi (fazy 6–8).** Portfel zgłasza `number[]` — grosze każdej położonej monety. `Task.answer` =
lista zachłanna (najmniej monet; zachłanny jest optymalny dla serii 1-2-5-10); `check(input)`: tablica liczb z nominałów tacy,
suma = cel, a w wariancie `fewest` dodatkowo `input.length === answer.length`. Bez `check` równość zbiorów w `isCorrect`
przyjęłaby `[200, 200, 100]` za `[200, 100]`. Rysunek: `visual: { kind: 'money'; items: [...]; pay: { tray: MoneyId[];
fewest: boolean } }` — `items` puste (nic nie leży na stole), taca z `pay.tray`. `dragMode`: `money` z `pay` → `'coins'`;
`money` bez `pay` nadal rzuca w gałęzi drag (MONEY_COUNT jest `tiles`).

**Wspólny reduktor (faza 6).**

```ts
// src/core/trayDrag.ts — generic tray-to-mat gesture over a kind K
export type Counts<K extends string> = Readonly<Record<K, number>>;
export interface TrayDragState<K extends string> { mat: Counts<K>; carrying: Carrying<K> | null }
export interface TrayDragRules { startDistance: number; maxPerKind?: number; maxTotal?: number }
export const stepTrayDrag = <K extends string>(state, event, geo: TrayDragGeo<K>, rules: TrayDragRules) => …;
// src/core/blockDrag.ts keeps BlockKind, Mat, emptyMat, matValue, initialBlockDrag, stepBlockDrag as a thin instance
```

`down` w trakcie niesienia (ten sam albo inny `pointerId`) = upuszczenie bez zmiany maty + nowy chwyt w punkcie `down`
(S13-09; jak `stepClockSet`). `BlockMat`, `canonicalInput`, `tests/blockDrag.test.ts` zostają zielone bez zmian sygnatur
publicznych `blockDrag.ts` (poza zmienionym zachowaniem S13-09, które dostaje nowy test). Portfel = liczności na nominał;
stuknięcie monety w portfelu zdejmuje jedną monetę tego nominału; `walletCoins(counts)` → lista groszy malejąco.

**Taca i portfel (fazy 6, 8).** Najwyżej 4 rodzaje na zadanie; 3 rodzaje (E1.11: 1, 2, 5 zł) w jednym rzędzie (136 px), 4
rodzaje (E2.2: + 10 zł) w siatce 2 × 2 (≥ 96 px każdy kafelek w skali 1920×1080); portfel na prostokącie maty
(`TASK_LAYOUT.drag`), położone monety w rzędach jak `moneyLayout`, każda z opakowaniem dotyku ≥ 96 px; limit monet w portfelu
`ART_LIMITS.moneyItems` (10). Liczby w `balance.ts` / `layout.ts`, nie w scenie.

**Scena (faza 8).** `TaskScene` zamienia boolean `clockTask` na pole `dragKind: DragMode | null` ustawiane raz przy otwarciu
zadania z `dragMode(task)`; każde rozgałęzienie (otwarcie, render, `feedDrag`, reset po złej odpowiedzi, `okTarget`,
`snapshot`, `targets`) to `switch` z gałęzią `never`. Snapshot haka: `dragMode: DragMode | null`, `wallet: number[] | null`
(grosze położonych monet), `carrying` dla monet; `targets.coins: { tray: { id, grosze, point }[]; wallet: Point[]; ok } | null`.

**Helpery e2e (faza 8).** `answerRight`/`answerWrong`: po kafelkach i `select` — `if (state.input === 'drag') switch
(state.dragMode) { case 'blocks': buildOnMat; case 'clock': setClock; case 'coins': payCoins; default: throw unanswerable }`.
`payCoins(page, grosze[])` (jak `buildOnMat`: jedna sesja dotyku, przeciągnięcie z tacy do portfela, sondowanie
`snapshot.wallet` po każdej monecie, potem „OK”). `answerWrong` dla monet: cel + 1 zł (zwykły) albo dobra suma z jedną monetą
za dużo (`fewest`, ćwiczy `check`).

**Tryb z obrazkami (faza 5).** `pictureMode(learner, month)` = etap E1 i (wiek 6 i `month ∈ placementData.months.autumn`
albo `easedRounds > 0`). `hasPicture(skill)` — statyczna tabela typ → (parametry) w `src/data/pictureSkills.ts`, trzymana w
prawdzie testem, który losuje każdą umiejętność E1/E2 i porównuje z `task.visual !== undefined || choices.some(isFace)`.
`buildAdaptiveRound(…, { picture: boolean })`: po `skillBuckets` i `withoutArtBlocked` filtruje `earlier` i `previous` do
umiejętności z obrazkiem, `current` tylko gdy zostaje co najmniej `unlockThreshold`; kubeł, który by opustoszał, wraca
niefiltrowany. Wywołujący liczy `pictureMode` z `REGISTRY_KEYS.month` i ucznia sesji.

**Start kalendarza E1 (faza 2).** E1.1 grywalny → `startableSteps(E1)` = 1…11 (n = 11); wrzesień: `ceil(0.1·11) = 2` → krok 2
(było 3); pozostałe miesiące bez zmian → wiersz `ORACLE` E1 `[2, 4, 6, 8, 10, 11]` (liczony ręcznie z reguły D, nie z kodu),
`playableSteps(E1)` = `[1…11]`. `floorToCalendar` nigdy nie obniża zapisanego kroku.

**Progi odblokowania (`ceil(0.5 · n)`).**

| Krok | Przed | Po | Próg przed → po | Faza |
|---|---|---|---|---|
| E1.1 | 0 (niegrywalny) | 4 (shapes_pick, shapes_all, pattern, compare_qty) | — → 2 | 2 (3 umiejętności, próg 2), 4 (+1) |
| E1.2 | 2 | 3 (+ ordinal_5) | 1 → **2** | 4 |
| E1.3 | 4 | 5 (+ choose_op_picture_5) | 2 → **3** | 4 |
| E1.11 | 5 | 6 (+ money_pay_10) | 3 → 3 | 8 |
| E2.2 | 3 | 4 (+ money_pay_20) | 2 → 2 | 8 |

Wolniejsze odblokowanie na żywych zapisach dla E1.2 i E1.3 (nic nie ginie) → `[human]` 9.7.

## Phase 1: Twarze kafelków, SHAPES i PATTERN w core

Driver: tdd
Driver why: kod twarzy (`parseFace`, `faceLabel`), reguła `faces-distinct`, rysunek `pattern` i dwa czyste generatory nie istnieją — failing testy (jedna dobra twarz wśród kafelków, intruz różni się jedną cechą, szlaczek okresowy z jednoznacznym następnikiem) prowadzą implementację.

### Overview

Zadania SHAPES i PATTERN generują się i przechodzą walidator; bez umiejętności w programie.

### Changes Required:

#### 1. Kod twarzy i dane figur

**File**: `src/core/tasks/faces.ts` (nowy), `src/data/shapes.ts` (nowy: figury, kolory, rozmiary, polskie formy), `src/data/nouns.ts` (`prostokąt`)

**Intent**: wg Critical Implementation Details („Twarze kafelków”); kolory to nazwy tokenów z `layout.ts`, nie wartości.

**Contract**: `parseFace(value): Face | null`, `isFace(value): boolean`, `faceLabel(code): string`, `Face { figure; colour; size }`.

#### 2. Rysunek `pattern` i walidator

**File**: `src/core/tasks/visual.ts`, `src/core/tasks/validate.ts`

**Intent**: nowy rodzaj `{ kind: 'pattern'; items: readonly (string | null)[] }` (kody twarzy, dokładnie jeden `null` na końcu)
we wszystkich wyczerpujących `switch`ach (`validateVisual`, `visualKey`, `describeVisual`); reguła `faces-distinct` dla
`choices` z twarzami; `answer` twarz należy do `choices`.

**Contract**: `TaskVisual` + `pattern`; kod naruszenia `faces-distinct`.

#### 3. Generatory

**File**: `src/core/tasks/generators/shapes.ts`, `pattern.ts` (nowe), `src/core/tasks/registry.ts`, `src/data/pl.ts` (`tasks.shapes*`, `tasks.pattern*`, linie podpowiedzi)

**Intent**: SHAPES warianty `name` („Dotknij trójkąta.”, 3–4 kafelki, jedna figura docelowa), `odd` („Który nie pasuje?”,
4 kafelki, trzy zgodne w cesze, intruz inny w dokładnie jednej: figura, kolor albo rozmiar), `all` („Dotknij wszystkich
kół.”, `select`, 5–6 kafelków, 2–3 docelowe, `check` = zbiór docelowych). PATTERN: okresy AB, ABB, AAB, ABC (figura i/lub
kolor), 6–8 pokazanych + puste miejsce, 3 kafelki z twarzami, następnik jednoznaczny. Podpowiedzi wg research § 2 (wynik dopiero
w ostatniej linii, opisany słowami, nie kodem). Pętla z `MAX_ATTEMPTS` i rzutem z parametrami; parsery odrzucają niewykonalne dane.

**Contract**: `parseShapesParams { variants: ('name' | 'odd' | 'all')[]; figures: Figure[] }`,
`parsePatternParams { periods: ('AB' | 'ABB' | 'AAB' | 'ABC')[]; figures: Figure[] }`; SHAPES `name`/`odd` → `input: 'tiles'`,
`all` → `select` z `check` (wariant `all` żyje w osobnej umiejętności, bo tryb odpowiedzi jest per umiejętność).

#### 3a. Odpowiedzi z twarzami w modelu rundy (plan-review F1, F2)

**File**: `src/core/tasks/types.ts` i `src/core/types.ts` (`Task.answer: number | string | number[] | string[]`), `src/core/round/select.ts` (`selectionAnswer`), `src/core/round/hints.ts` (`solutionSteps`), `src/core/save.ts` (tylko jeśli typ `example.answer` tego wymaga — format v2 bez zmian, `validExample` nadal przyjmuje to, co v2 zapisał)

**Intent**: (F1) `selectionAnswer` dziś odrzuca napisy (`filter(value is number)`), więc SHAPES `all` z twarzami zawsze
wysyłałby `[]` — dziecko utknęłoby w `retype` na zawsze. Nowy kontrakt: liczby rosnąco jak dziś, napisy w kolejności
`choices` (typ `SelectValue[]`); test: zaznaczone twarze wracają, zestaw liczb bez zmian (EVEN_ODD). (F2) `solutionSteps`
dla odpowiedzi-twarzy dopisuje dziś „Wynik: shape:triangle:red:big” (pokazane i czytane przez narratora): dla `isFace(answer)`
linia wyniku dostaje `faceLabel(answer)`, nigdy kod; test na `solutionSteps` i na `spokenTask` w fazie `solution`.

**Contract**: `selectionAnswer(selected): SelectValue[]`; żaden tekst widziany lub czytany nie zawiera `shape:`.

#### 4. Testy

**File**: `tests/faces.test.ts`, `tests/shapes.test.ts`, `tests/pattern.test.ts` (nowe), `tests/validate.test.ts`, `tests/select.test.ts`, `tests/hints.test.ts` (lub istniejące pliki tych modułów)

**Intent**: 1000 losowań (`tests/helpers.ts`), wyrocznia w teście: docelowa figura liczona z kodów twarzy kafelków, intruz =
jedyny kafelek różny od pozostałych trzech w policzonej cesze, następnik szlaczka = element `items[len mod okres]` liczony z
pokazanych; `faces-distinct` łapie duplikat; `faceLabel` daje polską nazwę (biernik/mianownik z danych).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; SHAPES i PATTERN nadal w `LATER`; `npm run sample -- E1` … `E6` bez zmian w wyjściu
- Deliberate break: intruz różni się dwiema cechami / szlaczek bez pustego miejsca na końcu / `faces-distinct` wyłączony / `selectionAnswer` znów odrzuca napisy / `solutionSteps` dopisuje surowy kod → odpowiednie testy czerwone; przywrócone; meta-check: wyrocznia liczy cechy z kodów twarzy, nie z pól generatora
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów SHAPES i PATTERN (6 losowań na wariant z testu, `faceLabel` zamiast kodów): „Dotknij trójkąta”, „wszystkich kół”, podpowiedzi „Trójkąt ma 3 rogi” bez wyniku w 1. linii

---

## Phase 2: Figury na kafelkach, szlaczek i E1.1 grywalny

Driver: impl
Driver why: rysowanie figur w `AnswerTiles`/`SelectTiles` i nowy widżet szlaczka żyją tylko na płótnie; logika z fazy 1, dane E1.1 przestawiają start kalendarza — dowód w testach przypiętych, `sample`, zrzutach i e2e fazy 10.

### Overview

Dziecko gra E1.1 (SHAPES dwie umiejętności, PATTERN); start kalendarza E1 we wrześniu schodzi o krok.

### Changes Required:

#### 1. Rysowanie figur (helper + kafelki)

**File**: `src/ui/widgets/faceDraw.ts` (nowy helper wyjęty z `CoordGrid.drawItem`), `src/ui/widgets/CoordGrid.ts`, `src/ui/widgets/AnswerTiles.ts`, `src/ui/widgets/SelectTiles.ts` (także `onSubmit: (value: SelectValue[]) => void` po zmianie `selectionAnswer` z fazy 1)

**Intent**: kafelek z twarzą rysuje figurę (kontur 4 px, kolor z tokenów, rozmiar `big`/`small` widoczny), bez napisu;
`CoordGrid` używa tego samego helpera (bez zmiany wyglądu siatki). Komentarz `DESIGN-GAP` (wiersz 100).

**Contract**: `drawFace(graphics, face, cx, cy, box)`; `setChoices` bez zmiany sygnatury.

#### 2. Widżet szlaczka

**File**: `src/ui/widgets/PatternRow.ts` (nowy), `src/ui/widgets/TaskPicture.ts`, `src/core/round/pictureLayout.ts` (jeśli rozmiar `wide` nie wystarcza)

**Intent**: rząd figur z pustym polem (przerywana ramka) na końcu, w obszarze rysunku; `TaskPicture.render` z przypadkiem
`pattern`. Komentarz `DESIGN-GAP` (wiersz 101).

**Contract**: `PatternRow.render(items, rect)`.

#### 3. Dane, podgląd rodzica i testy przypięte

**File**: `src/data/curriculum/E1.ts` (E1.1: `E1.1.shapes_pick` tiles `name`+`odd`, `E1.1.shapes_all` select, `E1.1.pattern`; `childName` ≤ 28 znaków), `src/core/progress.ts` lub `src/ui/dom/progressView.ts` (przykład błędu z twarzą przez `faceLabel`), `tests/curriculum.test.ts` (SHAPES, PATTERN → `GROUP_1`), `tests/curriculumStart.test.ts` (`ORACLE` E1 `[2, 4, 6, 8, 10, 11]` z komentarzem obliczenia, `playableSteps` `[1…11]`), `tests/curriculumEnd.test.ts` (tytuł i asercja bez „E1 step 1 is the only gap”), `tests/curriculumPick.test.ts` (test „an unplayable step below every playable one…” przypina `playableSteps(E1)[0] > 1` — przepisany na syntetycznym etapie z niegrywalnym krokiem 1, plan-review F3), `docs/design-gaps.md` (wiersze 100, 101)

**Intent**: E1.1 grywalny; testy przypięte zmienione w tej samej fazie (reguła kontraktu). Przykład błędu SHAPES w podglądzie
rodzica to polska nazwa, nie kod.

**Contract**: 3 umiejętności E1.1, próg 2; zapis v2.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje trzy umiejętności E1.1
- `npm run sample -- E1 --count 6` bez naruszeń, z zadaniami E1.1
- Deliberate break: wiersz `ORACLE` E1 zostawiony na `[3, 4, 6, 8, 10, 11]` → `tests/curriculumStart.test.ts` czerwony; przywrócone; meta-check: wyrocznia z reguły D, nie z `calendarStart`
- Deliberate break: usunięta umiejętność PATTERN z E1.1 przy typie w `GROUP_1` → `tests/curriculum.test.ts` czerwony; przywrócone
- `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`answerRight` po wartości kafelka działa dla twarzy)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`, krok E1.1: polecenia ≤ 1–2 zdania, biernik/dopełniacz figur, intruz jednoznaczny, szlaczek z jednym możliwym następnikiem, podpowiedzi uczące „policz rogi”
- [visual] Zrzuty: SHAPES `name` pierwsza próba, SHAPES `odd` z podpowiedzią, SHAPES `all` (select, dwie zaznaczone), PATTERN pierwsza próba i ostatni krok rozwiązania, karta „Nowa umiejętność!” z `childName` E1.1, siatka `CoordGrid` E3.7 bez zmian — 1440×900 i 1024×768

---

## Phase 3: COMPARE_QTY, ORDINAL, CHOOSE_OP z obrazkiem w core; naprawa „złotych”

Driver: tdd
Driver why: dwa czyste generatory, rysunek `row`, pole `motion` i wariant obrazkowy CHOOSE_OP nie istnieją, a filtr kontekstów kupowanych jest błędny — failing testy (większa grupa liczona z `groups`, pozycja od lewej liczona z `row`, działanie zgodne ze strzałką, żaden kontekst bez `price` w szablonie kupowania) prowadzą implementację.

### Overview

Trzy nowe kształty zadań z ikonami generują się i przechodzą walidator; szablony „kupił” biorą tylko konteksty z ceną.

### Changes Required:

#### 1. Rysunki

**File**: `src/core/tasks/visual.ts`, `src/data/measures.ts` (`ART_LIMITS.rowIcons`, jeśli potrzebny)

**Intent**: nowy `{ kind: 'row'; icons: readonly IconId[]; mark: 'left' }` (3–5 różnych ikon, znacznik startu z lewej) i
opcjonalne `motion?: 'come' | 'go'` w `icons` (dwie grupy; strzałka do drugiej grupy albo od niej); wszystkie wyczerpujące
`switch`e, `visualKey` z `motion`, `artBlocked`/`ART_LIMITS` dla ikon.

**Contract**: `TaskVisual` + `row`; `icons.motion?`.

#### 2. Generatory i wariant

**File**: `src/core/tasks/generators/compareQty.ts`, `ordinal.ts` (nowe), `chooseOp.ts`, `src/core/tasks/registry.ts`, `src/data/pl.ts` (`tasks.compareQty*` z kafelkami „Po lewej”, „Po prawej”, „Tyle samo”, `tasks.ordinal*`, `tasks.chooseOpPicture*`)

**Intent**: COMPARE_QTY: dwie grupy 1–10 tej samej ikony, pytanie „więcej”/„mniej”, równe grupy w stałym udziale (~20 %),
odpowiedź = napis kafelka. ORDINAL: rząd 3–`max` różnych ikon, „Który z kolei od lewej jest klucz?”, kafelki z liczbami
(`numberChoices`), pozycje równomiernie. CHOOSE_OP wariant `picture`: dwie grupy ikon z `motion`, sumy ≤ `max`, kafelki z 3
wyrażeniami jak dziś, polecenie 1–2 zdania („Na talerzu były 3 jabłka. Dołożono 2.”). Podpowiedzi wg research § 2.
Rzeczowniki z formami w `nouns.ts` (dopełniacz l.mn. po „więcej”).

**Contract**: `parseCompareQtyParams { max; ask: ('more' | 'less')[]; equalShare }`, `parseOrdinalParams { max: 3..10 }`,
CHOOSE_OP `kinds` + `'picture'` (parser odrzuca `picture` z `max` > 10).

#### 3. Naprawa „kupił jeszcze 2 złote”

**File**: `src/core/tasks/generators/chooseOp.ts`, `word.ts`, `compareDiff.ts`, `src/data/wordTemplates.ts` (komentarz `price`)

**Intent**: szablony kupowania (`sum.bought` i odpowiedniki) losują tylko z kontekstów z `price`; bez nowego pola.

**Contract**: `Context.price` = flaga „da się kupić” (komentarz), filtr przed `rng.pick`.

#### 4. Testy

**File**: `tests/compareQty.test.ts`, `tests/ordinal.test.ts` (nowe), `tests/chooseOp.test.ts`, `tests/word.test.ts`, `tests/compareDiff.test.ts`

**Intent**: 1000 losowań; wyrocznie: większa/mniejsza grupa z `visual.groups`, pozycja = indeks ikony z polecenia w
`visual.icons` + 1, działanie = `+` dla `come`, `−` dla `go` z liczb grup; żaden szablon kupowania z kontekstem bez `price`
(1000 losowań WORD/COMPARE_DIFF/CHOOSE_OP, w tym ziarno, które dziś daje „złote”).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; `npm run sample -- E1` … `E6` bez naruszeń (wyjście E1.3/E2 może się zmienić tylko przez filtr kontekstów)
- Deliberate break: ORDINAL liczy od prawej / CHOOSE_OP `go` daje `+` / filtr `price` usunięty → odpowiednie testy czerwone; przywrócone; meta-check: wyrocznia z rysunku, nie z `answer`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów COMPARE_QTY, ORDINAL, CHOOSE_OP `picture` (6 losowań z testu): „więcej jabłek” (dopełniacz), „który z kolei”, „Dołożono/Zabrano”, podpowiedzi „pokazuj palcem: 1, 2, 3” bez wyniku w 1. linii

---

## Phase 4: Rząd ikon i strzałka; COMPARE_QTY, ORDINAL i CHOOSE_OP z obrazkiem w programie; O4

Driver: impl
Driver why: nowy widżet rzędu ikon i strzałka w `IconGroups` widać tylko na płótnie; dane E1.1–E1.3 zmieniają progi przypięte testami — logika z fazy 3, dowód w `sample`, progach, zrzutach i e2e fazy 10.

### Overview

E1.1 ma cztery umiejętności, E1.2 ORDINAL, E1.3 CHOOSE_OP z obrazkiem; `count_5` nie losuje jednej ikony.

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/IconRow.ts` (nowy), `src/ui/widgets/IconGroups.ts` (strzałka `motion` rysowana w kodzie), `src/ui/widgets/TaskPicture.ts`, `src/ui/widgets/artLayout.ts` (układ rzędu)

**Intent**: rząd ikon (art z `TASK_ART`, stand-in z `ArtImage`) ze znacznikiem startu po lewej; strzałka „przybywa”
(do grupy) / „ubywa” (od grupy) rozróżniona kształtem, nie tylko kolorem. Komentarze `DESIGN-GAP` (wiersz 102).

**Contract**: `IconRow.render(icons, rect)`; `IconGroups.render` z opcjonalnym `motion`.

#### 2. Dane i testy

**File**: `src/data/curriculum/E1.ts` (`E1.1.compare_qty_10`, `E1.2.ordinal_5` `max: 5`, `E1.3.choose_op_picture_5`, `E1.2.count_5` `min: 2`), `tests/curriculum.test.ts` (COMPARE_QTY, ORDINAL → `GROUP_1`), test progów (jeśli przypina liczby umiejętności E1.2/E1.3), `docs/design-gaps.md` (wiersz 102)

**Intent**: progi wg tabeli; O4 zamknięty (`min: 2`).

**Contract**: E1.1 4 umiejętności, E1.2 3, E1.3 5; zapis v2.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje nowe umiejętności
- `npm run sample -- E1 --count 6` bez naruszeń, z E1.1 compare_qty, E1.2 ordinal, E1.3 choose_op_picture; `count_5` nigdy 1
- Deliberate break: `E1.2.count_5` z powrotem `min: 1` przy teście „co najmniej 2 ikony” → czerwony; przywrócone; meta-check: liczba ikon z `visual.groups`
- `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`, kroki E1.1–E1.3: kafelki „Po lewej/Po prawej/Tyle samo”, „który z kolei od lewej”, CHOOSE_OP obrazkowy z 3 sensownymi działaniami, brak „złotych” w zakupach
- [visual] Zrzuty: COMPARE_QTY pierwsza próba i „tyle samo”, ORDINAL z podpowiedzią, CHOOSE_OP `come` i `go`, COUNT E1.2 po O4 — 1440×900 i 1024×768

---

## Phase 5: Tryb z obrazkami jako filtr doboru rundy

Driver: tdd
Driver why: `pictureMode`, statyczna tabela `hasPicture` i filtr kubłów w `buildAdaptiveRound` to czysta logika `core`, której nie ma — failing testy (6-latek w październiku dostaje ≥ 90 % umiejętności z obrazkiem w `earlier`, w lutym nie; łagodzenie włącza; `current` nie schodzi poniżej progu; tabela zgodna z losowaniem) prowadzą implementację.

### Overview

Runda E1 sześciolatka jesienią albo ucznia E1 w łagodzeniu bierze najpierw zadania z obrazkiem; nic w zapisie.

### Changes Required:

#### 1. Reguła i tabela

**File**: `src/core/pictureMode.ts` (nowy), `src/data/pictureSkills.ts` (nowy), `src/data/placement.ts` (tylko odczyt pasma)

**Intent**: wg Critical Implementation Details („Tryb z obrazkami”); tylko etap E1.

**Contract**: `pictureMode(learner: SessionLearner, month: number): boolean`; `hasPicture(skill: SkillDef): boolean`.

#### 2. Filtr i wywołujący

**File**: `src/core/curriculum.ts` (`buildAdaptiveRound` opcja `picture`), `src/core/round/pictureFilter.ts` (nowy, wzór `withoutArtBlocked`), `src/scenes/TaskScene.ts` (liczy `pictureMode` z `REGISTRY_KEYS.month`), `docs/design-gaps.md` (wiersz 21 zaktualizowany: „tryb bez ekranu, filtr doboru”, wiersz 104)

**Intent**: filtr po `withoutArtBlocked`; kubeł pusty po filtrze wraca niefiltrowany; rozgrzewka bez zmian.

**Contract**: `buildAdaptiveRound(…, art?, options?: { picture?: boolean })`.

#### 3. Testy

**File**: `tests/pictureMode.test.ts` (nowy), `tests/curriculum.test.ts` lub `tests/adaptiveRound.test.ts`

**Intent**: tabela 5 wieków × 12 miesięcy × łagodzenie; udział umiejętności z obrazkiem w 1000 rundach (20 ziaren) w `earlier`
i `previous`; próg `current`; test zgodności `hasPicture` z losowaniem każdej umiejętności E1/E2 (wyrocznia z zadania, nie z tabeli).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `pictureMode` bez warunku miesiąca / filtr zjada cały `current` / wpis w `pictureSkills.ts` zmieniony na fałsz dla COUNT → odpowiednie testy czerwone; przywrócone; meta-check: zgodność tabeli liczona z wygenerowanych zadań
- `tests/fixtures/` bez zmian (zapis v2); pełna bramka lokalna zielona
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (spece z 6-latkiem jesienią grają rundy z obrazkami)

#### Manual Verification:

- [reviewer] Żadnego pola w `Settings`/`SavedLearner`; `variants.ts` i wagi łagodzenia bez zmian; wiersz 21 opisuje tryb uczciwie

---

## Phase 6: Wspólny reduktor taca→mata, S13-09 i geometria tacy monet

Driver: tdd
Driver why: generyczny `stepTrayDrag`, zachowanie S13-09 (nowy chwyt w trakcie niesienia), `walletCoins`, `fewestCoins` i geometria tacy 2 × 2 nie istnieją — failing testy (drugi `down` tym samym palcem nie zostawia klocka w powietrzu, limit `maxTotal`, ≥ 96 px przy 4 rodzajach, zachłanne minimum) prowadzą implementację.

### Overview

Klocki działają na wspólnym jądrze bez zmiany zachowania (poza S13-09); monety mają reduktor, układ i liczenie, bez sceny.

### Changes Required:

#### 1. Reduktor

**File**: `src/core/trayDrag.ts` (nowy), `src/core/blockDrag.ts` (cienka instancja), `src/data/balance.ts` (`coinDrag: { startDistance; maxTotal }`)

**Intent**: wg Critical Implementation Details („Wspólny reduktor”); publiczne nazwy `blockDrag.ts` bez zmian.

**Contract**: `stepTrayDrag<K>`, `TrayDragRules { startDistance; maxPerKind?; maxTotal? }`.

#### 2. Portfel i układ

**File**: `src/core/coins.ts` (nowy: `walletCoins`, `fewestCoins`, `walletValue`), `src/core/round/dragLayout.ts` (wariant `coins`: taca w rzędzie ≤ 3 rodzaje, 2 × 2 dla 4, pozycje monet w portfelu), `src/data/layout.ts` (stałe tacy monet)

**Intent**: każdy kafelek tacy i każda położona moneta ≥ `MIN_TOUCH_TARGET`; > 4 rodzaje odrzucone.

**Contract**: `coinLayout(kinds: MoneyId[], wallet: Counts<MoneyId>)`; `fewestCoins(target: number, tray: MoneyId[]): number[]`.

#### 3. Testy

**File**: `tests/trayDrag.test.ts`, `tests/coins.test.ts`, `tests/coinLayout.test.ts` (nowe), `tests/blockDrag.test.ts` (S13-09)

**Intent**: istniejące testy klocków bez zmian zielone; nowe: S13-09, `maxTotal`, stuknięcie monety w portfelu zdejmuje jedną;
`fewestCoins` porównany z przeszukaniem wyczerpującym dla celów 1–20 zł (wyrocznia niezależna od algorytmu zachłannego);
geometria 3 i 4 rodzajów.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; `tests/blockDrag.test.ts` (stare przypadki) zielony bez edycji asercji; unit `<baseline gałęzi> + N`
- Deliberate break: `down` w trakcie niesienia zwraca `state` (stare S13-09) → nowy test czerwony; `fewestCoins` zwraca pierwszą znalezioną kombinację → test wyczerpujący czerwony; tacy 4 rodzajów w jednym rzędzie → test 96 px czerwony; przywrócone; meta-check: przeszukanie wyczerpujące w teście, nie z `coins.ts`
- Pełna bramka lokalna zielona
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`, w tym `drawn-tasks.spec` (klocki na wspólnym reduktorze) — wymagane w tej fazie (kontrakt)

#### Manual Verification:

- [reviewer] `blockDrag.ts` to cienka instancja; brak duplikatu logiki gestu; S13-09 opisany w komentarzu reduktora

---

## Phase 7: Generator MONEY_PAY, gałąź `coins` w `dragMode` i model odpowiedzi

Driver: tdd
Driver why: generator z odpowiedzią `number[]` i `check`, gałąź `coins`, `canonicalInput` dla monet, reguły walidatora i `artBlocked` dla tacy nie istnieją — failing testy (`[200, 200, 100]` dla celu 5 zł przyjęte w zwykłym, odrzucone w `fewest`; `money` bez `pay` nadal rzuca w drag; brak monety na tacy blokuje umiejętność) prowadzą implementację.

### Overview

Zadanie MONEY_PAY powstaje, waliduje się i jest rozwiązywalne w trybie `drag`; bez umiejętności w programie (nieosiągalne).

### Changes Required:

#### 1. Model i tryb

**File**: `src/core/tasks/visual.ts` (`money.pay?`), `src/core/tasks/dragMode.ts` (`'coins'`), `src/core/round/canonicalInput.ts` (gałąź monet = `answer`), `src/core/tasks/validate.ts` (reguły: `check(answer)`, cel osiągalny tacą w ≤ `maxTotal` monetach, ≤ 4 rodzaje), `src/core/round/artFilter.ts` (`artBlocked`: brak tekstury monety z tacy)

**Intent**: wg Critical Implementation Details („MONEY_PAY: kontrakt odpowiedzi”).

**Contract**: `DragMode = 'blocks' | 'clock' | 'coins'`; `money: { items; pay?: { tray: MoneyId[]; fewest: boolean } }`.

#### 2. Generator

**File**: `src/core/tasks/generators/moneyPay.ts` (nowy), `src/core/tasks/registry.ts`, `src/data/pl.ts` (`tasks.moneyPay*`: „Zapłać 7 zł.”, „Zapłać 7 zł najmniejszą liczbą monet.”, podpowiedzi „Połóż największą monetę, która nie jest za duża.” → „5 zł i jeszcze 2 zł.” → „5 zł + 2 zł = 7 zł”)

**Intent**: cele jednostajnie z zakresu (E1 2–10 zł, E2 3–20 zł), warianty `pay`/`fewest`, kwoty przez `formatMoney`.

**Contract**: `parseMoneyPayParams { tray: MoneyId[]; min; max; variants: ('pay' | 'fewest')[] }` (odrzuca > 4 rodzaje,
nominały spoza `MONEY`, cel nieosiągalny); zadanie `input: 'drag'`, `answer: number[]`, `check`.

#### 3. Testy

**File**: `tests/moneyPay.test.ts` (nowy), `tests/dragMode.test.ts`, `tests/canonicalInput.test.ts`, `tests/artFilter.test.ts`, `tests/solvableInMode.test.ts` (ręczny przypadek monet)

**Intent**: 1000 losowań; `check` na zestawach z przeszukania wyczerpującego (każdy zestaw o dobrej sumie przyjęty w `pay`,
tylko minimalne w `fewest`); różnorodność ≥ `MIN_DISTINCT` dla zakresu E1; ostatnia podpowiedź podaje kwotę celu słowami
(`solutionSteps` nie dopisze linii wyniku dla tablicy — plan-review F5).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Klucze `generators`/`parsers` równe; MONEY_PAY nadal w `LATER`; `npm run sample -- E1` … `E6` bez zmian w wyjściu
- Deliberate break: `check` bez warunku długości w `fewest` / `dragMode` daje `coins` dla `money` bez `pay` / `artBlocked` ignoruje tacę → odpowiednie testy czerwone; przywrócone; meta-check: zestawy z przeszukania w teście
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela szablonów MONEY_PAY (6 losowań na wariant z testu): „Zapłać 7 zł”, „najmniejszą liczbą monet”, podpowiedź uczy „od największej monety”, wynik dopiero w ostatniej linii

---

## Phase 8: Portfel w scenie, hak `dragMode`, wyczerpujące helpery e2e i MONEY_PAY w E1.11, E2.2

Driver: impl
Driver why: przełącznik `dragKind` w `TaskScene`, widżet portfela, pola haka i helpery e2e żyją w renderowanej grze; reguła kontraktu wymaga ich w tej samej fazie co dane, które czynią MONEY_PAY osiągalnym — dowód w pełnym e2e (~13 nieprzypiętych speców) i fazie 11.

### Overview

Dziecko płaci monetami w E1.11 i E2.2; każdy spec, który wylosuje zadanie z monetami, odpowiada na nie poprawnie.

### Changes Required:

#### 1. Widżet i scena

**File**: `src/ui/widgets/CoinWallet.ts` (nowy: taca nominałów z grafiką monet, portfel rysowany w kodzie, „OK”), `src/scenes/TaskScene.ts`

**Intent**: wg Critical Implementation Details („Scena”, „Taca i portfel”); monety jako `ArtImage` (stand-in z kwotą przy
brakującej teksturze), portfel = przerywany prostokąt maty z podpisem kwoty dopiero w rozwiązaniu (nie zdradza sumy w trakcie).
Komentarz `DESIGN-GAP` (wiersz 103).

**Contract**: `CoinWallet.render(layout, counts, carrying)`, `targets()`, `okTarget()`; `TaskScene.dragKind: DragMode | null`.

#### 2. Hak i helpery e2e

**File**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: wg Critical Implementation Details („Helpery e2e”); `vite/e2eHookGuard.mjs` bez zmian (pola migawki są w kodzie
produkcyjnym — nazwy pól jako znaczniki wywróciłyby `npm run build`, plan-review S-14c F1).

**Contract**: `Snapshot.dragMode`, `Snapshot.wallet`, `Targets.coins`; `payCoins(page, grosze[])`.

#### 3. Dane

**File**: `src/data/curriculum/E1.ts` (`E1.11.money_pay_10`: taca `coin-1zl`, `coin-2zl`, `coin-5zl`, cele 2–10 zł, `pay`+`fewest`), `src/data/curriculum/E2.ts` (`E2.2.money_pay_20`: + `note-10zl`, cele 3–20 zł), `src/data/pictureSkills.ts` (MONEY_PAY), `tests/curriculum.test.ts` (MONEY_PAY → `GROUP_1`), `docs/design-gaps.md` (wiersz 103)

**Intent**: progi wg tabeli; jeśli agent zbliża się do limitu kontekstu — commit `… (p8a)` z §1–2 (bez danych, spece zielone),
potem `… (p8b)` z §3; wiersze Progress odhaczane po drugim.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje `E1.11.money_pay_10` i `E2.2.money_pay_20`
- `npm run sample -- E1 --count 6` i `-- E2 --count 6` bez naruszeń, z zadaniami MONEY_PAY
- Deliberate break: `case 'coins'` usunięty z `answerRight` → `npm run typecheck` czerwony na `never` (nie timeout); przywrócone; meta-check: dowodzi wyczerpującości helpera, nie sceny (scenę dowodzi faza 11)
- `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` z `--workers=4` (nieprzypięte spece mogą losować E1.11/E2.2); czas `adaptive.spec` zapisany

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6` i `-- E2 --count 6`, kroki E1.11 i E2.2: kwoty, „najmniejszą liczbą monet”, podpowiedź od największej monety, banknot 10 zł tylko w E2
- [visual] Zrzuty: MONEY_PAY E1 pusta taca i portfel (pierwsza próba), moneta w trakcie przeciągania, portfel z 3 monetami, zły portfel z podpowiedzią, rozwiązanie z listą monet; E2 taca 2 × 2 z banknotem; stand-in monety (`?e2eArt=missing`) — 1440×900 i 1024×768

---

## Phase 9: Seam sweep, dokumentacja, luki projektu, follow-upy

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps 100+, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Porządek przed e2e.

### Changes Required:

#### 1. Seam sweep

**File**: cała zmiana

**Intent**: zduplikowane helpery (rysowanie figur `faceDraw` vs resztki w `CoordGrid`, liczenie groszy w `coins.ts` vs
`money.ts`/`formatMoney`, układ monet vs `moneyLayout`, filtr `pictureFilter` vs `withoutArtBlocked`), nieaktualne komentarze
(`dragMode` „blocks or clock”, `TaskScene` „core/blockDrag or core/clockSet”, nagłówek `E1.ts` „drawing and art types arrive
in M6”, `LATER`/`GROUP_1`, `Context.price`, `balance.easing` o trybie z obrazkami), komentarze `DESIGN-GAP` ↔ wiersze 100+.

#### 2. Dokumenty i follow-upy

**File**: `CLAUDE.md` („Current state”: zdanie o S-14d — twarze kafelków, SHAPES/PATTERN/COMPARE_QTY/ORDINAL/CHOOSE_OP z
obrazkiem, gałąź `coins` i `trayDrag`, tryb z obrazkami jako filtr; „Not yet present” bez MONEY_PAY, z SPATIAL i SYMMETRY),
`docs/design-gaps.md`, `context/changes/e1-shapes-picture-mode/follow-ups/review-fixes.md`

**Intent**: follow-upy z `Trigger:` — **SPATIAL** → `art for a SPATIAL scene or S-16`; **SYMMETRY** → `a toggle-cells answer
mode`; **BONDS „połącz pary”** → `a pairing answer mode`; ORDINAL „dotknij czwartego” → `a tap-in-picture answer mode`; ORDINAL
słownie i do 10 → `noun gender data in nouns.ts or an E1 step with ordinals to 10`; oś-podpowiedź E1 → `a layout band above the
tiles`; E1.10 `place_read_12` → `a content-invariants exception for tiny task spaces or [human] teacher read of E1.10`; zły
portfel w podglądzie rodzica → `a v3 save or a parent asking for it`; grafika portfela → `the author delivers wallet art`;
10 zł w E1.11 → `[human] 9.7 teacher read`.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- Komentarze `DESIGN-GAP` w `src/` ↔ wiersze 100+ w `docs/design-gaps.md`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Każdy follow-up ma `Trigger:` (w tym SPATIAL, SYMMETRY, BONDS pary); brak nieaktualnych komentarzy o dwóch gałęziach drag; brak duplikatu rysowania figur
- [human] Test na tablecie z prawdziwym palcem 6-latka: przeciąganie monety do portfela i zdejmowanie stuknięciem, stukanie kafelków z figurami i „Po lewej/Po prawej/Tyle samo” (cele ≥ 96 px, brak chybień, czytelność figur `small`)
- [human] Decyzje wbrew dosłownemu ZADANIA/PRD/roadmapie: SPATIAL, SYMMETRY, BONDS „połącz pary” poza slice'em; ORDINAL tylko liczby i do 5 w E1.2 (ZADANIA „E1 do 10”, „dotknij czwartego”); E1.11 bez banknotu 10 zł; tryb z obrazkami jako filtr bez ekranu, tylko E1 (ZADANIA wymienia go też przy łagodzeniu innych etapów); wyższe progi E1.2 (1 → 2) i E1.3 (2 → 3) na żywych zapisach; start E1 we wrześniu na E1.1 zamiast E1.3; E1.1 w rozgrzewce E2

---

## Phase 10: Zadania z obrazkami dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) dla kafelków z figurami, `select` figur, szlaczka, porównania grup i rzędu ikon — istnieje tylko w renderowanej scenie; zbudowane w fazach 2 i 4, `E2E=on`.

### Overview

Nowy `tests/e2e/picture-tasks.spec.ts` (projekt `chromium-hook`), umiejętności przez `?e2eSkills=` + `e2eVariant=off`; cel < 90 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`picture-tasks` w `ROUND_SPEC`), `tests/e2e/picture-tasks.spec.ts` (nowy)

**Intent**: (a) „#11 a shape tile drawn as a figure is tapped and pays a star”: E1 ścieżką rodzica (pary wiek/etap z
`tests/e2e/art-tasks.spec.ts`), `?e2eSkills=E1.1.shapes_pick,E1.1.pattern`, `answerWrong` → pasek podpowiedzi →
`answerRight` → gwiazdka; `snapshot.visual.kind === 'pattern'` co najmniej raz w rundzie. (b) „#11 select all circles and
compare two groups by touch”: `E1.1.shapes_all,E1.1.compare_qty_10`, runda `answerRight`, 5 gwiazdek + premia.
(c) „#11 which one in the row is answered on number tiles”: `E1.2.ordinal_5`, `E1.3.choose_op_picture_5`, rundą.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na migawce; napisy z `pl.ts`.
Chromium niedostępny → protokół request-file (`e2e-request-p10.md`, patche `e2e-break-p10a…b.patch`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/picture-tasks.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`
- Deliberate break (patch `e2e-break-p10a.patch`): `AnswerTiles` przesuwa strefę dotyku kafelka z twarzą (cel ≠ rysunek) → (a) czerwony; meta-check: dowodzi celu dotyku kafelka, nie generatora
- Deliberate break (patch `e2e-break-p10b.patch`): `SelectTiles` nie przełącza zaznaczenia kafelka z twarzą → (b) czerwony; każdy oczekiwany czerwony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 11: Płacenie monetami dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 dla trzeciej gałęzi `drag`: przeciąganie monety w skali FIT, zdejmowanie stuknięciem, `cancel` bez monety, „najmniej monet” z `check` — istnieje tylko w przeglądarce; zbudowane w fazach 6–8, `E2E=on`.

### Overview

Nowy `tests/e2e/money-pay.spec.ts` (projekt `chromium-hook`); cel < 90 s.

### Changes Required:

#### 1. Konfiguracja i spec

**File**: `playwright.config.ts` (`money-pay` w `ROUND_SPEC`), `tests/e2e/money-pay.spec.ts` (nowy)

**Intent**: (a) „#11 coins dragged into the wallet pay the amount and earn a star”: E1 (pary z `art-tasks.spec.ts`),
`?e2eSkills=E1.11.money_pay_10&e2eVariant=off`, `answerRight` (= `payCoins`) dla 5 zadań → 5 gwiazdek. (b) „#11 a wallet with
one coin too many in the fewest-coins task gives a hint and a second try”: zadanie `fewest`, `answerWrong` → podpowiedź →
`answerRight` → gwiazdka. (c) „#11 a cancelled drag and a tap on a wallet coin leave the right amount”: `cancelTouch` z tacy →
`snapshot.wallet` bez zmian; moneta położona i zdjęta stuknięciem → `wallet` pusty. (d) E2.2 z tacą 2 × 2 (`E2.2.money_pay_20`)
jedno zadanie z banknotem.

**Contract**: jak faza 10; request-file `e2e-request-p11.md`, patche `e2e-break-p11a…c.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/money-pay.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 4`; czas pełnego zestawu zapisany
- Deliberate break (patch `e2e-break-p11a.patch`): `case 'coins'` w `answerRight` zamieniony na `buildOnMat` → (a) czerwony z czytelnym błędem w ≤ 30 s, nie timeout całego testu; meta-check: dowodzi, że helper nie ma fallbacku do klocków
- Deliberate break (patch `e2e-break-p11b.patch`): `check` MONEY_PAY bez warunku długości → (b) czerwony (gwiazdka za zły portfel); meta-check: dowodzi `check` w ścieżce sceny, nie w unit
- Deliberate break (patch `e2e-break-p11c.patch`): `cancel` w `stepTrayDrag` kładzie monetę → (c) czerwony; każdy oczekiwany czerwony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Twarze: parsowanie, `faceLabel`, `faces-distinct`; każdy nowy generator 1000 losowań z wyrocznią liczoną z rysunku/twarzy.
- Reduktor: stare przypadki klocków bez zmian, S13-09, `maxTotal`; `fewestCoins` vs przeszukanie wyczerpujące; geometria ≥ 96 px.
- Tryb z obrazkami: tabela wiek × miesiąc × łagodzenie, udziały w 1000 rundach, zgodność `hasPicture` z losowaniem.
- MONEY_PAY: `check` na wszystkich zestawach o dobrej sumie, `dragMode`, `canonicalInput`, `artBlocked`.

### Integration Tests:

- `tests/solvableInMode.test.ts`, `tests/contentInvariants.test.ts`, `tests/curriculum.test.ts` obejmują nowe umiejętności.
- E2E: `picture-tasks.spec.ts` (#11), `money-pay.spec.ts` (#11); pełny zestaw po fazach 6 i 8 (reduktor, helpery).

### Manual Testing Steps:

1. Odczyt nauczyciela `npm run sample -- E1 --count 6` (fazy 1–4, 7–8) i `-- E2 --count 6` (faza 8).
2. Zrzuty stanów faz 2, 4, 8 w 1440×900 i 1024×768.
3. Tablet z 6-latkiem: przeciąganie monet, kafelki z figurami (faza 9 `[human]`).

## Performance Considerations

~8 nowych umiejętności × 1000 losowań w inwariantach (kilka sekund unit); filtr trybu z obrazkami to jedno przejście po kubłach.
E2E: dwa nowe spece ~3 min łącznie przy `--workers=4`; `adaptive.spec` blisko 180 s — faza 8 zapisuje jego czas.

## Migration Notes

Format zapisu **v2** bez zmian: nowe umiejętności to nowe klucze `mastery` (`validLearner`), tryb z obrazkami nie ma stanu,
`unlockedStep` liczba. Zapisany uczeń E1 na E1.2/E1.3 odblokowuje wolniej (wyższy próg, nic nie ginie); `floorToCalendar` nie
obniża kroku. Fixture'y `tests/fixtures/save-v1*.json`, `save-v2*.json` bajtowo bez zmian. Gdyby faza potrzebowała v3 — STOP
na otwartym PR z wierszem `[human]` (kontrakt runu).

## Known risks

- **`taskKey` (`src/core/round/unique.ts`) pomija `choices` poza `select`** — SHAPES `name` bez rysunku ma tylko kilka
  poleceń („Dotknij trójkąta.”), więc dwa zadania z tym samym poleceniem i innymi kafelkami liczą się jako duplikat; przy
  jednej umiejętności na zadanie rundy to tylko przerysowanie (plan-review F4). Zmieniłoby: `sample`/test unikalności
  pokazujący brak wariantów → klucz z twarzą docelową.
- **Rozwiązanie MONEY_PAY bez linii „Wynik”**: `solutionSteps` uznaje odpowiedź-tablicę za zamkniętą, więc ostatnia
  podpowiedź musi podać kwotę słowami („5 zł + 2 zł = 7 zł”) — test generatora w fazie 7 to sprawdza (plan-review F5).
- **`tests/artFilter.test.ts` (E2.2 „keeps the current step whole”)** zależy od tego, że `artBlocked` zna MONEY_PAY
  (faza 7) — bez tego dodanie `E2.2.money_pay_20` w fazie 8 zmienia wynik filtra (plan-review F5).

- **Rozmiar fazy 8** (scena + widżet + hak + helpery + dane) — zmieniłoby: limit kontekstu agenta → commity `p8a`/`p8b` w tej samej fazie.
- **Figury `small` na 1024 px** mogą być za małe dla 6-latka — zmieniłoby: zrzut/tablet → minimalny rozmiar figury w `layout.ts`.
- **6-latek jesienią** w e2e (dzisiejszy miesiąc październik) dostaje rundy z obrazkami w nieprzypiętych specach — helpery
  kafelków i `select` już to obsługują; zmieniłoby: flake → przypięcie `e2eMonth`.
- **Chromium w sesji agenta**: e2e uruchamia orkiestrator przy każdej bramce; fazy 10–11 protokół request-file.

## References

- Research: `context/changes/e1-shapes-picture-mode/research.md`; change: `context/changes/e1-shapes-picture-mode/change.md`
- Kontrakt runu: `context/runs/2026-10-15-fix-s14c-s14d/agent-contract.md` (§ S-14d); profil `context/foundation/autonomous-run.md` § 6, § 8, § 9
- Katalog: `docs/ZADANIA.md` § 1 (wiek, łagodzenie, prezentacja E1–E2), § 2 (pieniądze E1/E2), § 3 (E1.1–E1.3, E1.11, E2.2), § 4 (SHAPES, PATTERN, COMPARE_QTY, ORDINAL, CHOOSE_OP, MONEY_PAY); PRD FR-023
- Test-plan: `context/foundation/test-plan.md` ryzyka #1, #5, #11, #13, #17; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/plan.md` (druga gałąź `drag`, `dragMode`, `clockSet.ts`, helpery e2e), `context/archive/2026-10-15-text-measure-time-types/plan.md` (progi, `check`, request-file), `src/core/round/artFilter.ts` (`withoutArtBlocked`)

## Autonomous decisions

1. **Zakres: SHAPES, PATTERN, COMPARE_QTY, ORDINAL (liczby, do 5), CHOOSE_OP z obrazkiem, MONEY_PAY, tryb z obrazkami, O4,
   naprawa „złotych”; bez SPATIAL, SYMMETRY, BONDS „połącz pary”.** Odrzucone: cały blok roadmapy. Dlaczego: SPATIAL nie ma
   sceny w kicie (wymyślanie), SYMMETRY i pary to dwa nowe tryby odpowiedzi podwajające ryzyko e2e (research decyzja 3). Wbrew
   blokowi roadmapy → `[human]` 9.7. Zmieniłoby: grafika sceny SPATIAL albo slice z trybem „przełącz kratkę”/„łącz pary”.
2. **Twarze kafelków jako kod napisu `shape:…` rysowany przez wspólny helper.** Odrzucone: kafelki z nazwami figur (narrator
   ich nie czyta). Dlaczego: research Summary 1. Zmieniłoby: narrator czytający kafelki albo teacher read akceptujący tekst.
3. **ORDINAL na kafelkach z liczbami, zakres 5 w E1.2.** Odrzucone: liczebniki słowne (brak rodzaju w `nouns.ts`), „dotknij
   czwartego” (nowy tryb). Wbrew ZADANIA „E1 do 10” → `[human]` 9.7. Zmieniłoby: dane rodzaju rzeczowników, krok E1 z ORDINAL do 10.
4. **CHOOSE_OP z obrazkiem jako nowa umiejętność** (próg E1.3 2 → 3). Odrzucone: zamiana parametrów istniejącej (mastery
   mieszałaby obraz i tekst). Zmieniłoby: playtest pokazujący, że E1.3 odblokowuje się za wolno → wariant w istniejącej umiejętności.
5. **Tryb z obrazkami = filtr kubłów w `buildAdaptiveRound`, tylko E1, wiek 6 w paśmie jesiennym albo `easedRounds > 0`.**
   Odrzucone: ekran/przełącznik rodzica (v3), zamiana wag łagodzenia, filtr w E2+ (zadania z obrazkiem różnią się tylko w E1).
   Wbrew dosłownemu ZADANIA (łagodzenie „tryb z obrazkami” dla wszystkich) → `[human]` 9.7. Zmieniłoby: widok kitu, zgoda na v3.
6. **Generyczny reduktor `trayDrag` (klocki i monety jako instancje), S13-09 naprawiony we wspólnym jądrze.** Odrzucone:
   osobny `coinDrag.ts` (≈ 57 zduplikowanych linii, S13-09 otwarty w jednej kopii). Dlaczego: research Summary 3 (≥ 70 %).
   E2E klocków w tej samej fazie (kontrakt). Zmieniłoby: plan-review uznający ryzyko regresji klocków za większe niż duplikację.
7. **Odpowiedź MONEY_PAY = `number[]` groszy + `check`** (odwraca decyzję 6 change.md). Odrzucone: liczba groszy (nie wyraża
   „najmniej monet”), równość zbiorów (błędna dla powtórzonych monet). Zmieniłoby: wycięcie wariantu `fewest`.
8. **E1.11 tylko monety 1, 2, 5 zł; banknot 10 zł od E2.2; najwyżej 4 rodzaje na tacy.** Odrzucone: 10 zł w E1 („zapłać 10 zł”
   jednym ruchem; 4 rodzaje w rzędzie < 96 px). Wbrew ZADANIA § 2 → `[human]` 9.7. Zmieniłoby: odczyt nauczyciela.
9. **Portfel rysowany w kodzie (przerywana mata), suma widoczna dopiero w rozwiązaniu.** Odrzucone: suma na żywo (zdradza
   odpowiedź), wymyślona grafika portfela. DESIGN-GAP wiersz 103. Zmieniłoby: grafika autora.
10. **E1.1 zostaje w rozgrzewce E2.** Dlaczego: łatwa treść, rozgrzewka tylko obniża. Zmieniłoby: odczyt nauczyciela uznający
    figury za dziwne dla 7-latka → wyłączenie typów „tylko E1” z rozgrzewki.
11. **Kolejność i rozmiar faz**: każdy typ najpierw `tdd` w core, potem `impl` widżet + dane (≤ 2 nowe komponenty, ≤ 3
    generatory na fazę); MONEY_PAY w trzech fazach, scena + hak + helpery + dane razem (reguła bezpieczeństwa). Zmieniłoby: limit
    kontekstu → podział commitów w fazie, nie zmiana kolejności.
12. **Brak `AskUserQuestion` (kontrakt reguła 1):** złożoność HIGH, wszystkie pytania rozstrzygnięte z research/change.md i
    kontraktu; roadmapa S-14d → `planning` w commicie planu; zapis zostaje v2 — żadna faza nie potrzebuje v3.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Twarze kafelków, SHAPES i PATTERN w core

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — a230f1a
- [x] 1.2 Klucze `generators`/`parsers` równe; SHAPES i PATTERN nadal w `LATER`; `npm run sample -- E1` … `E6` bez zmian w wyjściu — a230f1a
- [x] 1.3 Deliberate break: intruz różni się dwiema cechami / szlaczek bez pustego miejsca na końcu / `faces-distinct` wyłączony / `selectionAnswer` odrzuca napisy / surowy kod w `solutionSteps` → czerwone; przywrócone; meta-check — a230f1a
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — a230f1a

#### Manual

- [ ] 1.5 [reviewer] Odczyt nauczyciela szablonów SHAPES i PATTERN (6 losowań na wariant z testu, `faceLabel` zamiast kodów): „Dotknij trójkąta”, „wszystkich kół”, podpowiedzi bez wyniku w 1. linii

### Phase 2: Figury na kafelkach, szlaczek i E1.1 grywalny

#### Automated

- [x] 2.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje trzy umiejętności E1.1 — b9b16d5
- [x] 2.2 `npm run sample -- E1 --count 6` bez naruszeń, z zadaniami E1.1 — b9b16d5
- [x] 2.3 Deliberate break: wiersz `ORACLE` E1 zostawiony na `[3, 4, 6, 8, 10, 11]` → `tests/curriculumStart.test.ts` czerwony; przywrócone; meta-check — b9b16d5
- [x] 2.4 Deliberate break: usunięta umiejętność PATTERN z E1.1 przy typie w `GROUP_1` → `tests/curriculum.test.ts` czerwony; przywrócone — b9b16d5
- [x] 2.5 `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (` — b9b16d5
- [x] 2.6 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`answerRight` po wartości kafelka działa dla twarzy) — orchestrator note: full e2e on b9b16d5, --workers=4, 86 passed (5.9 min)

#### Manual

- [ ] 2.7 [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`, krok E1.1: polecenia, biernik/dopełniacz figur, intruz jednoznaczny, szlaczek z jednym następnikiem, podpowiedzi „policz rogi”
- [ ] 2.8 [visual] Zrzuty: SHAPES `name` pierwsza próba, SHAPES `odd` z podpowiedzią, SHAPES `all` (select), PATTERN pierwsza próba i ostatni krok rozwiązania, karta „Nowa umiejętność!” E1.1, `CoordGrid` E3.7 bez zmian — 1440×900 i 1024×768

### Phase 3: COMPARE_QTY, ORDINAL, CHOOSE_OP z obrazkiem w core; naprawa „złotych”

#### Automated

- [x] 3.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 670e988
- [x] 3.2 Klucze `generators`/`parsers` równe; `npm run sample -- E1` … `E6` bez naruszeń — 670e988
- [x] 3.3 Deliberate break: ORDINAL liczy od prawej / CHOOSE_OP `go` daje `+` / filtr `price` usunięty → czerwone; przywrócone; meta-check — 670e988
- [x] 3.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 670e988 (e2e: orchestrator note, full run on 670e988, --workers=4, 86 passed, 5.7 min)

#### Manual

- [ ] 3.5 [reviewer] Odczyt nauczyciela szablonów COMPARE_QTY, ORDINAL, CHOOSE_OP `picture` (6 losowań z testu): dopełniacz po „więcej”, „który z kolei”, „Dołożono/Zabrano”, podpowiedzi bez wyniku w 1. linii

### Phase 4: Rząd ikon i strzałka; COMPARE_QTY, ORDINAL i CHOOSE_OP z obrazkiem w programie; O4

#### Automated

- [x] 4.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje nowe umiejętności — c6c6600
- [x] 4.2 `npm run sample -- E1 --count 6` bez naruszeń, z E1.1 compare_qty, E1.2 ordinal, E1.3 choose_op_picture; `count_5` nigdy 1 — c6c6600
- [x] 4.3 Deliberate break: `E1.2.count_5` z powrotem `min: 1` → test „co najmniej 2 ikony” czerwony; przywrócone; meta-check — c6c6600
- [x] 4.4 `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (` — c6c6600
- [x] 4.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — orchestrator note: 86 passed (5.8 min, --workers=4) on c6c6600

#### Manual

- [ ] 4.6 [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`, kroki E1.1–E1.3: kafelki porównania, „który z kolei od lewej”, CHOOSE_OP obrazkowy, brak „złotych” w zakupach
- [ ] 4.7 [visual] Zrzuty: COMPARE_QTY pierwsza próba i „tyle samo”, ORDINAL z podpowiedzią, CHOOSE_OP `come` i `go`, COUNT E1.2 po O4 — 1440×900 i 1024×768

### Phase 5: Tryb z obrazkami jako filtr doboru rundy

#### Automated

- [x] 5.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — d29760e
- [x] 5.2 Deliberate break: `pictureMode` bez warunku miesiąca / filtr zjada cały `current` / wpis tabeli fałszywy dla COUNT → czerwone; przywrócone; meta-check — d29760e
- [x] 5.3 `tests/fixtures/` bez zmian (zapis v2); pełna bramka lokalna zielona — d29760e
- [x] 5.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` — orchestrator note: 86 passed on d29760e (`--workers=4`, 5.7 min)

#### Manual

- [ ] 5.5 [reviewer] Żadnego pola w `Settings`/`SavedLearner`; `variants.ts` i wagi łagodzenia bez zmian; wiersz 21 opisuje tryb uczciwie

### Phase 6: Wspólny reduktor taca→mata, S13-09 i geometria tacy monet

#### Automated

- [x] 6.1 Nowe testy czerwone przed implementacją, zielone po; `tests/blockDrag.test.ts` (stare przypadki) zielony bez edycji asercji; unit `<baseline gałęzi> + N` — a992ecf
- [x] 6.2 Deliberate break: stare S13-09 / `fewestCoins` pierwsza kombinacja / taca 4 rodzajów w jednym rzędzie → czerwone; przywrócone; meta-check — a992ecf
- [x] 6.3 Pełna bramka lokalna zielona — a992ecf
- [x] 6.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`, w tym `drawn-tasks.spec` (klocki na wspólnym reduktorze) — orchestrator note: 86 passed on a992ecf (`--workers=4`, 5.9 min), drawn-tasks x2 10/10

#### Manual

- [ ] 6.5 [reviewer] `blockDrag.ts` to cienka instancja; brak duplikatu logiki gestu; S13-09 opisany w komentarzu reduktora

### Phase 7: Generator MONEY_PAY, gałąź `coins` w `dragMode` i model odpowiedzi

#### Automated

- [x] 7.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 1929895
- [x] 7.2 Klucze `generators`/`parsers` równe; MONEY_PAY nadal w `LATER`; `npm run sample -- E1` … `E6` bez zmian w wyjściu — 1929895
- [x] 7.3 Deliberate break: `check` bez warunku długości w `fewest` / `coins` dla `money` bez `pay` / `artBlocked` ignoruje tacę → czerwone; przywrócone; meta-check — 1929895
- [x] 7.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — orchestrator note: full e2e on 1929895, --workers=4, 86 passed (6.2 min)

#### Manual

- [ ] 7.5 [reviewer] Odczyt nauczyciela szablonów MONEY_PAY (6 losowań na wariant z testu): „Zapłać 7 zł”, „najmniejszą liczbą monet”, podpowiedź „od największej monety”

### Phase 8: Portfel w scenie, hak `dragMode`, wyczerpujące helpery e2e i MONEY_PAY w E1.11, E2.2

#### Automated

- [x] 8.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `tests/solvableInMode.test.ts` obejmuje `E1.11.money_pay_10` i `E2.2.money_pay_20`
- [x] 8.2 `npm run sample -- E1 --count 6` i `-- E2 --count 6` bez naruszeń, z zadaniami MONEY_PAY
- [x] 8.3 Deliberate break: `case 'coins'` usunięty z `answerRight` → `npm run typecheck` czerwony na `never`; przywrócone; meta-check
- [x] 8.4 `tests/fixtures/` bez zmian; `npm run build` drukuje `e2e hook: absent (`
- [ ] 8.5 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` z `--workers=4`; czas `adaptive.spec` zapisany

#### Manual

- [ ] 8.6 [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6` i `-- E2 --count 6`, kroki E1.11 i E2.2: kwoty, „najmniejszą liczbą monet”, podpowiedź od największej monety, banknot 10 zł tylko w E2
- [ ] 8.7 [visual] Zrzuty: MONEY_PAY E1 pusta taca i portfel, moneta w trakcie przeciągania, portfel z 3 monetami, zły portfel z podpowiedzią, rozwiązanie; E2 taca 2 × 2 z banknotem; stand-in monety (`?e2eArt=missing`) — 1440×900 i 1024×768

### Phase 9: Seam sweep, dokumentacja, luki projektu, follow-upy

#### Automated

- [ ] 9.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 9.2 Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- [ ] 9.3 Komentarze `DESIGN-GAP` w `src/` ↔ wiersze 100+ w `docs/design-gaps.md`
- [ ] 9.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 9.5 [reviewer] Każdy follow-up ma `Trigger:` (w tym SPATIAL, SYMMETRY, BONDS pary); brak nieaktualnych komentarzy o dwóch gałęziach drag; brak duplikatu rysowania figur
- [ ] 9.6 [human] Test na tablecie z prawdziwym palcem 6-latka: przeciąganie monety do portfela i zdejmowanie stuknięciem, stukanie kafelków z figurami i „Po lewej/Po prawej/Tyle samo”
- [ ] 9.7 [human] Decyzje wbrew dosłownemu ZADANIA/PRD/roadmapie: SPATIAL, SYMMETRY, BONDS „połącz pary” poza slice'em; ORDINAL tylko liczby i do 5; E1.11 bez banknotu 10 zł; tryb z obrazkami jako filtr tylko w E1; wyższe progi E1.2 i E1.3 na żywych zapisach; start E1 we wrześniu na E1.1; E1.1 w rozgrzewce E2

### Phase 10: Zadania z obrazkami dotykiem — e2e (#11)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/picture-tasks.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`
- [ ] 10.2 Deliberate break (patch `e2e-break-p10a.patch`): strefa dotyku kafelka z twarzą przesunięta → (a) czerwony; meta-check
- [ ] 10.3 Deliberate break (patch `e2e-break-p10b.patch`): `SelectTiles` nie przełącza kafelka z twarzą → (b) czerwony; każdy czerwony osobno (`-g`); przywrócone
- [ ] 10.4 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 11: Płacenie monetami dotykiem — e2e (#11)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/money-pay.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 4`; czas pełnego zestawu zapisany
- [ ] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): `case 'coins'` → `buildOnMat` → (a) czerwony z czytelnym błędem, nie timeout; meta-check
- [ ] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): `check` MONEY_PAY bez warunku długości → (b) czerwony; meta-check
- [ ] 11.4 Deliberate break (patch `e2e-break-p11c.patch`): `cancel` kładzie monetę → (c) czerwony; każdy czerwony osobno (`-g`); przywrócone
- [ ] 11.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
