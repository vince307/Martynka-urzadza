# Adaptacja trudności: wagi kroków, opanowanie 0–5, „Nowa umiejętność!” i łagodzenie — Implementation Plan

## Overview

Roadmapa S-07 (`adaptive-curriculum`, M3, FR-013, FR-014, PRD Business Logic). Gra przestaje losować umiejętności
jednostajnie z całego etapu (`pickSkills`, S-04). Każde zadanie zwykłej rundy pochodzi z **odblokowanych kroków** według
wag z `balance` (bieżący krok 60 / wcześniejsze kroki etapu 30 / cały poprzedni etap 10, puste koszyki renormalizowane).
Gra prowadzi **opanowanie 0–5** każdej umiejętności liczone tylko z pierwszej próby (3 poprawne z rzędu +1, błąd w
pierwszej próbie −1), **odblokowuje następny grywalny krok**, gdy ≥ `ceil(0.5 · n)` grywalnych umiejętności bieżącego
kroku ma opanowanie ≥ 4, i wtedy po „Kolejna runda” pokazuje kartę z kitu **„Nowa umiejętność!”** z krótką nazwą kroku
dla dziecka. Po dwóch rundach z rzędu z mniej niż 3 poprawnymi w pierwszej próbie dwie następne rundy losują z **wagami
łagodzenia** (20/50/30). Do S-11 nie ma zapisu, więc punkt startowy odblokowania to **podłoga kalendarza szkolnego**
(`calendarStart`, research § 1, reguła D): E3 w październiku = kroki 1, 2, 6; od stycznia cały etap. Polecenia w rundzie
i w rozgrzewce się nie powtarzają (dwa follow-upy `Trigger: S-07`), a `core` przestaje importować typ z `data` (F5).

## Current State Analysis

Z `context/changes/adaptive-curriculum/research.md` (commit `f955712`) i odczytu kodu w tym kroku
(`feat/adaptive-curriculum` @ `f955712`):

- `src/core/round/pick.ts`: prywatny predykat `playable` (`tiles`/`keypad` + zarejestrowany generator),
  `firstPlayableSteps(stage, n)`, `pickSkills(stage, rng, count)` (jednostajnie, z powtórzeniami, cały etap),
  `buildRound(stage, rng, rules, tileCount)` (jedyny wołający: `TaskScene.freshRound`; testy `tests/pick.test.ts`).
- `src/core/round/warmup.ts` `buildWarmup` (3 z poprzedniego etapu + 3 z pierwszych 2 grywalnych kroków, przez
  `pickSkills`), `warmupResult`. Duplikat polecenia możliwy w obu.
- `src/core/placement.ts`: `SessionLearner = Pick<LearnerState, 'age' | 'stage' | 'stageOverriddenByParent'> &
  { warmupPending }`; `type PlacementData = typeof placementData` — import typu z `src/data/placement.ts` (F5).
  Konsumenci `SessionLearner`: `src/ui/dom/stagePanel.ts` (`onConfirm(placeByParent(...))`), `src/scenes/BootScene.ts`
  (`needsPlacement`), `src/scenes/WelcomeScene.ts` (`start(placeByChild(...))`), `src/scenes/TaskScene.ts` (`create`,
  `finishWarmup`), `src/testing/e2eHook.ts` (`learner()` — płytka kopia `Object.freeze({ ...value })`), `tests/placement.test.ts`.
- `src/core/types.ts` `LearnerState` ma już `unlockedStep: Record<StageId, number>`, `mastery`, `streak`, `history`
  (`{ skillId, ok, firstTry, at }`); `StepDef.title` jest „author-facing … not shown to the child”.
- `src/scenes/TaskScene.ts`: `freshRound` (rozgrzewka albo `buildRound`), `advance` (przy `finished` w rozgrzewce →
  `finishWarmup`), `startNextRound` („Kolejna runda”), `toRoom`/`onWake` (pokój = `scene.switch`, stan rundy żyje),
  `snapshot`/`targets` dla haka. Miesiąc sesji w `REGISTRY_KEYS.month` (`src/main.ts`, `?e2eMonth` tylko w buildzie e2e).
- `src/data/balance.ts`: `round`, `warmup`, `parentGate`, `keypad`, `narrator`, `tiles` (`as const`).
- Grywalne kroki (research § 1, policzone): E1 2,3,4,5,6,7,9,11; E2 1,3,4,5,6,7,9,10; E3 1,2,6,7,8,9,10,11; E4
  1,2,4,5,6,8; E5 1,2,3,4,6,7,8,9,10,11; E6 1,4,5,6,7,8,9,10 — razem 48. Tabelę `calendarStart` z research § 1
  sprawdziłem w tym kroku skryptem poza repo (formuła = tabela, wszystkie 36 pól).
- Kit: `designs/martynka-maths-A-v1/screenshots/unlock.png`, `preview.js` (`screen==='unlock'`, karta po „Kolejna
  runda”), `maths.css` `.unlock-card` (left 388, top 284, 1144×660, ramka 7 px `#d8bc6f`, promień 46, gradient
  `#fffef4`→`#fff0c8`; `h2` 66 px/800, margines 56; `.unlock-art` 200×200; `.unlock-name` 48 px/750; przycisk 450×108,
  44 px, `bottom: 36`). Widżety-wzorce: `src/ui/widgets/SummaryPanel.ts`, `PageButton.ts`.
- E2E: `tests/e2e/support/welcome.ts` `passWelcome` (rodzic, wiek „10+”, E3 — przy regule D cały E3 = ostatni krok, brak
  odblokowania, deterministycznie), `passWelcomeAsChild(page, age, month)`; `playwright.config.ts` `ROUND_SPEC`
  (projekt `chromium-hook`, port 4397). Żaden spec nie zbiera 12 poprawnych pierwszych prób jednej umiejętności w zwykłych
  rundach (research § 5), więc karta w nich nie wypadnie.
- `context/foundation/lessons.md` nie istnieje — żadna lekcja nie obowiązuje.
- Baseline (kontrakt): `main` @ `fd68216`: unit 767, e2e 14. Każda faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Zwykła runda: 5 zadań z umiejętności kroków ≤ `unlockedStep[stage]` bieżącego etapu i z całego poprzedniego etapu, wg
  wag 60/30/10 (puste koszyki pominięte); żadne polecenie nie powtarza się w rundzie ani w rozgrzewce (z limitem prób).
- Po każdej rundzie (także rozgrzewce) opanowanie i historia rosną/maleją tylko z pierwszej próby; po zwykłej rundzie
  ewentualnie odblokowanie jednego kroku i licznik słabych rund.
- „Kolejna runda” przy oczekującym odblokowaniu → karta „Nowa umiejętność!” z ikoną książki (placeholder) i nazwą kroku;
  „Dalej” startuje rundę już z nowym krokiem. Karta czeka przez „Do pokoju” i powrót.
- Zimny start: `unlockedStep` każdego etapu = `calendarStart(stage, age, month)`; po korekcie rozgrzewki etap niższy
  ma już swoją podłogę (za kalendarzem = cały etap).
- Liczby wyłącznie w `balance.curriculum`, `balance.mastery`, `balance.easing`, `balance.round.uniqueRetries`; nazwy
  kroków dla dziecka w `src/data/curriculum/*` (`StepDef.childName`), teksty karty w `pl.unlock`.
- Hak e2e (tylko build e2e): głęboko zamrożona kopia ucznia, `screen: 'unlock'`, `unlock`, `targets.unlockNext`; build
  produkcyjny dalej `e2e hook: absent`. Nowy spec `#13 (proposed)` gra do karty przez dotyk.

### Key Discoveries:

- Reguła startowego kroku nie istnieje w żadnym źródle; jedyne zakotwiczenie to PRD Success Criteria „zgodne z tym, co jest
  aktualnie w szkole” — stąd podłoga kalendarza (decyzja 1, wiersz `[human]`).
- Dosłowna „większość” (`> 0.5`) przy kroku z 2 umiejętnościami wymaga obu, czyli jedna trudna blokuje krok, wbrew ZADANIA §1
  i notce Socratesa w PRD FR-014 — próg `≥ ceil(0.5 · n)` (decyzja 3).
- `?e2eMonth` (nigdy `page.clock`: Playwright zamraża `Date.now()`, a Phaser 4.2.1 `TweenManager.getDelta` liczy z niego
  krok tweenów — plan-review S-06 F1).
- Ścieżka rodzica do etapu niższego niż kalendarzowy daje `behind` → cały etap odblokowany (dzisiejsze `passWelcome`).

## What We're NOT Doing

- Trwałość (S-11): stan adaptacji żyje w uczniu sesji w rejestrze; zimny start = podłoga kalendarza, opanowanie 0.
  Żadnego `localStorage`.
- Podgląd postępów i zmiana etapu przez rodzica (S-08), przełącznik `autoRead` (S-08).
- Automatyczny awans etapu po ostatnim kroku (decyzja 6).
- „Mniejszy zakres” przez przepisywanie `params` w locie i „tryb z obrazkami” (S-14) — łagodzenie tylko wagami (decyzja 4).
- Docelowa sztuka książki na karcie (`assets/icons/book.png`, S-16) — placeholder rysowany w kodzie.
- ` = ?` po wyrażeniu (follow-up przeniesiony na `Trigger: S-16`).
- Ręczna edycja `context/foundation/test-plan.md` i `test-stack.md` (ryzyko #13 i projekt `chromium-hook` → follow-upy).
- Przeniesienie helperów e2e istniejących speców do wspólnego modułu (follow-up F2, `Trigger: S-08`); nowy spec już
  korzysta ze wspólnego `tests/e2e/support/hook.ts`.
- E2E w CI, WebKit/iPad (ręcznie).

## Implementation Approach

Logika najpierw, test-first, w `src/core/` (fazy 1–4): typy danych i opanowanie, podłoga kalendarza i start nauki,
wybór wg wag z unikalnością poleceń, koniec rundy (odblokowanie + łagodzenie). Faza 5 skleja to w scenach bez nowych
komponentów (karta jeszcze nie istnieje: odblokowanie po cichu przesuwa krok). Faza 6 dodaje 48 nazw kroków dla dziecka
(dane + test + teacher read), faza 7 — jeden nowy komponent `UnlockCard` i jego przepływ, faza 8 — seam sweep, luki,
follow-upy i wiersze decyzji, faza 9 — e2e ryzyka #13 (proposed). Każda faza zostawia grę grywalną i całą bramkę zieloną.

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**. Faza 9 poszerza
`ROUND_SPEC` w `playwright.config.ts` (ta sama komenda `npx playwright test`; wpis `webServer` aplikacji nietknięty).

**Szew ucznia.** `PlacedLearner` (dzisiejszy kształt: `age`, `stage`, `stageOverriddenByParent`, `warmupPending`) zwraca
placement; `SessionLearner = PlacedLearner & Adaptation & { pendingUnlock: number | null }`, gdzie
`Adaptation = Pick<LearnerState, 'unlockedStep' | 'mastery' | 'streak' | 'history' | 'weakStreak' | 'easedRounds'>`.
`LearnerState` dostaje `weakStreak` i `easedRounds` (S-11 zapisze je w wersji 1 bez migracji). Wszystkie aktualizacje to
czyste funkcje `(adaptation, wejście, rules) → adaptation`; scena woła je w jednym miejscu (koniec rundy).

## Critical Implementation Details

**Reguła D — dokładna formuła** (miesiąc `getMonth()` 0–11; `order` = indeks w `E1…E6`):

```
pos(month)    = (month + 4) mod 12           // wrzesień 0 … czerwiec 9, lipiec 10, sierpień 11
semStart(E)   = 0 dla E1/E3/E5, 5 dla E2/E4/E6
behind        = order(stage) < order(proposeStage(age, month))
progress      = behind ? 1 : clamp((pos − semStart + 0.5) / 5, 0, 1)
k             = clamp(max(minStartSteps, ceil(progress · P)), 1, P)   // P = liczba grywalnych kroków etapu
calendarStart = numer k-tego grywalnego kroku etapu
```

Oczekiwane wartości (etap = kalendarzowy, miesiące półrocza 1–5, potem „po półroczu”) — wyrocznia testu fazy 2:
E1 3,4,5,7,11,11; E2 3,4,5,7,10,10; E3 2,6,7,9,11,11; E4 2,2,4,6,8,8; E5 2,3,6,8,10,11; E6 4,5,6,8,10,10.

**Kiedy aktualizować ucznia.** Raz, przy przejściu rundy w `finished` w `TaskScene.advance` (to samo miejsce co dziś
`finishWarmup`), nie przy „Kolejna runda” — „Do pokoju” i powrót nie mogą pominąć ani zdublować wyniku. Kolejność dla
rozgrzewki: opanowanie z jej wyników, potem `warmupResult` (etap); dla zwykłej rundy: opanowanie → odblokowanie →
łagodzenie (`easedRounds` zmniejszane za rundę rozegraną w łagodzeniu, zanim nowa seria słabych rund może je ustawić).

**Karta i przycisk.** `pendingUnlock` w uczniu sesji (rejestr), nie w polu sceny: „Kolejna runda” przy `pendingUnlock !==
null` pokazuje kartę zamiast nowej rundy; „Dalej” czyści `pendingUnlock` i startuje rundę. `unlockedStep` jest już
podniesiony na końcu rundy, więc runda po karcie losuje z nowego kroku.

## Phase 1: Typy danych w core i opanowanie z pierwszej próby

Driver: tdd
Driver why: `src/core/mastery.ts` nie istnieje; failing testy na serii 3 → +1, błąd → −1, granice 0/5, drugą próbę i przycinanie historii prowadzą implementację.

### Overview

Interfejsy reguł i danych w `core` (F5), `balance.mastery`, czysta aktualizacja opanowania, serii i historii z wyników
jednej rundy.

### Changes Required:

#### 1. Typy

**File**: `src/core/types.ts`, `src/core/placement.ts`, `src/data/placement.ts`

**Intent**: `LearnerState` + `weakStreak: number`, `easedRounds: number` (komentarze jak reszta pól). Typ
`Adaptation = Pick<LearnerState, 'unlockedStep' | 'mastery' | 'streak' | 'history' | 'weakStreak' | 'easedRounds'>`.
`PlacementData` jako interfejs w `core` (`ages`, `monthBands`, `table`); `src/data/placement.ts` go spełnia
(`satisfies`), `core/placement.ts` nie importuje już nic z `data` (zamyka F5).

**Contract**: `export interface PlacementData`, `export type Adaptation`; `grep -rn "from '../data" src/core/` pusty.

#### 2. Balans i logika

**File**: `src/data/balance.ts`, `src/core/mastery.ts` (nowy)

**Intent**: `mastery: { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, loss: 1, historyLength: 200 }` z komentarzem
(ZADANIA §1 „Adaptacja trudności”, plan §5 „ostatnie ~200”). `recordRound(adaptation, results, at, rules)`: dla każdego
`{ skillId, outcome }` w kolejności — `'first'` → seria +1, przy `streakForGain` opanowanie `+gain` (max `max`) i seria 0;
`'second'`/`'retype'` → opanowanie `−loss` (min 0), seria 0; `null` (nierozegrane) pomijane; wpis historii `{ skillId,
ok: outcome !== 'retype', firstTry: outcome === 'first', at }`, historia przycięta do ostatnich `historyLength`.
`MasteryRules` interfejs w `core/mastery.ts`, `balance.mastery` go spełnia.

**Contract**: `recordRound(a: Adaptation, results: readonly { skillId: string; outcome: Outcome | null }[], at: number, rules: MasteryRules): Adaptation` — nie mutuje wejścia.

#### 3. Testy

**File**: `tests/mastery.test.ts` (nowy), `tests/placement.test.ts`

**Intent**: 3 × `'first'` → +1; 2 × `'first'` + `'second'` → −1 i seria 0; `'second'` nigdy nie podnosi; dno 0, sufit 5;
12 poprawnych z 0 → 4; historia: `ok`/`firstTry` dla trzech wyników, przycięcie do 200 (najstarsze odpadają), `at`
przeniesione; brak mutacji wejścia (`Object.freeze` na wejściu). Placement: istniejące testy dalej zielone na interfejsie.

### Success Criteria:

#### Automated Verification:

- `tests/mastery.test.ts` czerwony przed implementacją, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `'second'` liczone jak `'first'` → test „druga próba nie podnosi” czerwony; seria nie zerowana po zysku → test 6 × `'first'` = +2 czerwony; przywrócone; meta-check: liczby czytane z `balance.mastery`, oczekiwania w teście wyprowadzone z reguły ZADANIA §1, nie z implementacji
- `grep -rn "from '../data" src/core/` pusty (F5)
- Pełna bramka lokalna zielona

---

## Phase 2: Podłoga kalendarza i start nauki

Driver: tdd
Driver why: `src/core/curriculum.ts` nie istnieje; failing test z tabelą reguły D (6 etapów × 6 kolumn), przypadkami `behind` i `minStartSteps` prowadzi implementację.

### Overview

`calendarStart` (reguła D z Critical Implementation Details), grywalne kroki etapu i budowa stanu adaptacji dla
świeżo umieszczonego ucznia.

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `curriculum: { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 }`
z komentarzem (ZADANIA §1 wagi ~60/30/10; `minStartSteps` i podłoga — research § 1, wiersz `[human]` 8.6).

**Contract**: tylko stałe; `CurriculumRules` interfejs w `core/curriculum.ts`.

#### 2. Logika

**File**: `src/core/curriculum.ts` (nowy), `src/core/round/pick.ts`

**Intent**: `playable` wyeksportowane z `pick.ts` (jedno źródło predykatu). `playableSteps(stage): number[]` (numery
kroków z ≥ 1 grywalną umiejętnością, kolejno). `calendarStart(stage, age, month, data, rules)` wg formuły; RangeError dla
etapu bez grywalnych kroków (żaden dziś). `startLearning(stages, age, month, data, rules): Adaptation` →
`unlockedStep` dla **każdego** etapu z `stages` = `calendarStart`, puste `mastery`/`streak`/`history`, `weakStreak` 0,
`easedRounds` 0 (dzięki temu korekta rozgrzewki i zmiana etapu w S-08 mają gotową podłogę). Po S-11 ta sama funkcja daje
podłogę `max(zapisany, calendarStart)` — tu tylko komentarz.

**Contract**: `calendarStart(stage: StageDef, age: number, month: number, data: PlacementData, rules: CurriculumRules): number`; `startLearning(stages: Readonly<Partial<Record<StageId, StageDef>>>, age: number, month: number, data: PlacementData, rules: CurriculumRules): Adaptation`.

#### 3. Testy

**File**: `tests/curriculumStart.test.ts` (nowy)

**Intent**: Wyrocznia z Critical Implementation Details wpisana w teście (etap kalendarzowy, 5 miesięcy półrocza + „po
półroczu”: wiek i miesiąc dobrane tak, by `proposeStage` dał ten etap — np. E3: wiek 8, wrzesień–styczeń); `behind`
(E2 dla wieku 8 w październiku → ostatni grywalny krok E2 = 10; E3 dla wieku 10 → 11); etap przed swoim półroczem
(E4 dla wieku 8 we wrześniu → 2, `minStartSteps`); `playableSteps` na prawdziwych `stages` = lista z Current State;
`startLearning` daje wpis dla każdego z 6 etapów i puste liczniki.

### Success Criteria:

#### Automated Verification:

- `tests/curriculumStart.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `semStart` E4 = 0 → tabela E4 czerwona; `behind` liczone `<=` → przypadek etapu kalendarzowego czerwony; przywrócone; meta-check: wyrocznia to tabela z planu (policzona niezależnie skryptem w kroku planu), nie wywołanie funkcji
- Pełna bramka lokalna zielona

---

## Phase 3: Wybór umiejętności wg wag i unikalne polecenia

Driver: tdd
Driver why: picker koszyków i reguła unikalności nie istnieją; failing testy (tylko odblokowane kroki, rozkład 60/30/10, renormalizacja pustych koszyków, brak duplikatu `prompt`, limit bez zawieszenia) prowadzą implementację.

### Overview

Koszyki `current` / `earlier` / `previous`, losowanie wg wag, budowa rundy adaptacyjnej i wspólna funkcja unikalnych
poleceń dla rundy i rozgrzewki (follow-upy S-05 i S-06).

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `round.uniqueRetries: 20` (research § 3: najmniejsza pula 9 poleceń, szansa porażki ≈ 10⁻⁷).

#### 2. Logika

**File**: `src/core/curriculum.ts`, `src/core/round/unique.ts` (nowy), `src/core/round/warmup.ts`, `src/core/round/pick.ts`

**Intent**: `skillBuckets(stage, previous, unlockedStep)` → `current` = grywalne umiejętności kroku `unlockedStep`
(gdy krok niegrywalny — najbliższy niższy grywalny; gdy żadnego niższego nie ma — pierwszy grywalny krok etapu),
`earlier` = grywalne kroków < bieżącego, `previous` = grywalne całego
poprzedniego etapu (`[]` dla E1). `pickRoundSkills(buckets, weights, rng, count)` — koszyk proporcjonalnie do wagi wśród
niepustych (`rng.next()`), potem `rng.pick` w koszyku; wszystkie koszyki puste → `RangeError` jak w `pickSkills`
(nieosiągalne: `current` nigdy nie jest pusty). Runda zawsze ma `count` zadań: `distinctTasks` po limicie przyjmuje
duplikat, nie skraca rundy. `distinctTasks(skills, rng, generate, retries)` — dla każdej
pozycji zadanie tej samej umiejętności, losowane ponownie do `retries` razy, gdy `prompt` już padł; po limicie duplikat
zostaje. `buildAdaptiveRound(stage, previous, adaptation, weights, rng, rules, tileCount)` w `curriculum.ts`;
`buildWarmup` przechodzi przez `distinctTasks` (sygnatura + `retries`). `buildRound`/`pickSkills` zostają (rozgrzewka,
istniejące testy); seam sweep usuwa `buildRound`, jeśli po fazie 5 nikt go nie woła.

**Contract**: `pickRoundSkills(b: SkillBuckets, w: Weights, rng: Rng, count: number): SkillDef[]`; `distinctTasks(skills: readonly SkillDef[], rng: Rng, generate: (s: SkillDef) => Task, retries: number): Task[]`; `Weights = { current: number; earlier: number; previous: number }`.

#### 3. Testy

**File**: `tests/curriculumPick.test.ts` (nowy), `tests/warmup.test.ts`

**Intent**: Wszystkie etapy × kalendarzowe starty × 200 ziaren: każda umiejętność rundy należy do kroków ≤ bieżący albo do
poprzedniego etapu i jest grywalna; 20 000 losowań na E3 krok 6: udziały koszyków 60/30/10 ± 2 p.p.; E1 na pierwszym
grywalnym kroku: tylko `current` (puste `earlier` i `previous` → 100%); wagi łagodzenia działają tak samo (20/50/30).
Unikalność: wszystkie etapy × starty × 200 ziaren — brak duplikatu `prompt` w rundzie i w rozgrzewce; generator stały
(pula 1) → `distinctTasks` kończy się duplikatami po `retries` próbach (bez zawieszenia, licznik wywołań ≤ (retries + 1) ·
długość).

### Success Criteria:

#### Automated Verification:

- `tests/curriculumPick.test.ts` czerwony przed, zielony po; `tests/warmup.test.ts` z testem unikalności zielony; unit `<baseline gałęzi> + N`
- Deliberate break: `earlier` obejmuje kroki > bieżącego → test „tylko odblokowane” czerwony; brak ponownego losowania w `distinctTasks` → test duplikatów czerwony; przywrócone; meta-check: testy chodzą po prawdziwych `stages`, a rozkład liczony z próby, nie z wag w kodzie
- `npm run sample -- E1` … `-- E6` `Naruszenia: 0`
- Pełna bramka lokalna zielona

---

## Phase 4: Koniec rundy — odblokowanie kroku i łagodzenie

Driver: tdd
Driver why: reguła odblokowania (`≥ ceil(share · n)`, jeden krok na rundę, ostatni krok) i licznik słabych rund nie istnieją; failing testy prowadzą implementację.

### Overview

Jedna funkcja końca rundy: opanowanie (faza 1), odblokowanie, łagodzenie; rozgrzewka tylko opanowanie.

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `easing: { weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } }` z
komentarzem (ZADANIA §1 / PRD FR-014 „dwie rundy z rzędu poniżej 3/5”; wagi zamiast „mniejszy zakres, tryb z obrazkami” —
wiersz `[human]` 8.9).

#### 2. Logika

**File**: `src/core/curriculum.ts`

**Intent**: `unlockReady(stage, adaptation, rules)` — `n` grywalnych umiejętności bieżącego kroku, `m` z opanowaniem ≥
`unlockAt`; gotowe, gdy `m ≥ ceil(unlockShare · n)` i istnieje następny grywalny krok. `endRound(adaptation, stage,
results, at, kind, rules)`: `recordRound`; dla `kind === 'round'`: odblokowanie (najwyżej jeden krok →
`unlocked: number`), potem łagodzenie: jeśli runda grana w łagodzeniu (`easedRounds > 0`) → `easedRounds − 1`; słaba
runda (`'first'` < `weakBelow`) → `weakStreak + 1`, inaczej 0; `weakStreak === weakRounds` → `easedRounds = rounds`,
`weakStreak = 0`. Odblokowanie działa także w łagodzeniu (decyzja 5). `kind === 'warmup'`: tylko `recordRound`.
`roundWeights(adaptation, rules)` → wagi łagodzenia, gdy `easedRounds > 0`, inaczej zwykłe.

**Contract**: `endRound(a: Adaptation, stage: StageDef, results: readonly RoundResult[], at: number, kind: 'round' | 'warmup', rules: { curriculum: CurriculumRules; mastery: MasteryRules; easing: EasingRules }): { adaptation: Adaptation; unlocked: number | null }`.

#### 3. Testy

**File**: `tests/curriculumEnd.test.ts` (nowy)

**Intent**: Na prawdziwych `stages` (budowane stany opanowania): krok z 2 umiejętnościami — 1 z 2 ≥ 4 odblokowuje (n=2 →
1), krok z 3 — 1 z 3 nie, 2 z 3 tak; krok z 5 (E4 krok 6) — 3 z 5; następny grywalny krok pomija niegrywalne (E3 2 → 6);
ostatni grywalny krok → `null`; jeden krok na rundę nawet przy dwóch gotowych; 2 słabe rundy → `easedRounds` 2, potem
2 rundy w łagodzeniu → 0; słaba + dobra + słaba → brak łagodzenia; rozgrzewka nie rusza `weakStreak`, `easedRounds` ani
`unlockedStep`; odblokowanie w trakcie łagodzenia działa.

### Success Criteria:

#### Automated Verification:

- `tests/curriculumEnd.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: próg `>` zamiast `>=` (`m > ceil(share · n)`) → test n=2 czerwony; `weakStreak` nie zerowany po dobrej rundzie → test „słaba + dobra + słaba” czerwony; przywrócone; meta-check: oczekiwania (1 z 2, 2 z 3, 3 z 5) wypisane w teście z decyzji 3, nie z `balance`
- Pełna bramka lokalna zielona

---

## Phase 5: Sklejka w scenach — uczeń sesji, runda adaptacyjna, koniec rundy, hak

Driver: impl
Driver why: sklejka scen nad logiką faz 1–4 bez nowych komponentów; dowodzą jej istniejące specy e2e (przepływ) i odczyt haka.

### Overview

Uczeń sesji niesie stan adaptacji; `TaskScene` losuje rundy przez `buildAdaptiveRound` i na końcu rundy woła
`endRound`. Karty jeszcze nie ma: odblokowanie przesuwa krok po cichu i zapisuje `pendingUnlock` (karta w fazie 7).

### Changes Required:

#### 1. Uczeń

**File**: `src/core/placement.ts`, `src/ui/dom/stagePanel.ts`, `src/scenes/WelcomeScene.ts`, `src/scenes/BootScene.ts`, `tests/placement.test.ts`

**Intent**: `PlacedLearner` = dzisiejszy kształt (zwracany przez `placeByChild`/`placeByParent`, `onConfirm` panelu);
`SessionLearner = PlacedLearner & Adaptation & { pendingUnlock: number | null }`. `WelcomeScene.start(placed)` →
`{ ...placed, ...startLearning(stages, placed.age, month, placementData, balance.curriculum), pendingUnlock: null }` →
rejestr. `needsPlacement` bez zmian.

**Contract**: `REGISTRY_KEYS.learner` trzyma pełny `SessionLearner`; komentarz w `layout.ts` zaktualizowany.

#### 2. Scena zadań

**File**: `src/scenes/TaskScene.ts`

**Intent**: `freshRound` (zwykła runda) → `buildAdaptiveRound(stage, previous, learner, roundWeights(learner,
balance.easing), …)`; rozgrzewka bez zmian (już unikalna). `advance` przy przejściu w `finished`: `endRound(learner,
stage, results z tasks[i].skillId + outcomes[i], Date.now(), warmup ? 'warmup' : 'round', balance)` → uczeń w rejestrze
(`unlocked` → `pendingUnlock`); dla rozgrzewki potem dotychczasowe `warmupResult` (`finishWarmup` bierze ucznia już po
`endRound`). `TaskSnapshot` bez nowych pól poza tym, co potrzebne fazie 7.

**Contract**: scena nie liczy wag, progów ani serii — tylko woła `core`; liczby wyłącznie z `balance`.

#### 3. Hak

**File**: `src/testing/e2eHook.ts`

**Intent**: `learner()` → głęboka, zamrożona kopia (`structuredClone` + rekurencyjne `Object.freeze`), bo `unlockedStep`,
`mastery`, `streak`, `history` są zagnieżdżone; typ `Readonly<SessionLearner>`.

**Contract**: hak tylko do odczytu; znacznik `__martynkaE2E` tylko w tym pliku.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0`; unit `<baseline gałęzi> + 0` (zmiany typów w `tests/placement.test.ts`)
- Deliberate break: `WelcomeScene.start` bez `startLearning` (uczeń bez `unlockedStep`) → `npx playwright test` czerwony (runda się nie buduje); przywrócone; meta-check: czerwień dowodzi, że runda zależy od stanu adaptacji w rejestrze — rozkład wag dowodzą unit fazy 3
- `npm run build` drukuje `e2e hook: absent`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Kod sceny: `endRound` wołane dokładnie raz na rundę (przejście w `finished`), także gdy dziecko wybierze „Do pokoju” i wróci; brak liczb balansu i tekstu w `TaskScene`

---

## Phase 6: Nazwy kroków dla dziecka

Driver: tdd
Driver why: pole `StepDef.childName` nie istnieje; failing test „każdy grywalny krok ma krótką nazwę” prowadzi uzupełnienie 48 nazw w danych.

### Overview

Krótka nazwa kroku dla dziecka (kit: „Dodawanie do 10”, „Dodawanie do 100”) w danych każdego grywalnego kroku E1–E6;
`npm run sample` ją drukuje do odczytu nauczyciela. S-08 pokaże ją rodzicowi jako bieżący krok.

### Changes Required:

#### 1. Typ i dane

**File**: `src/core/types.ts`, `src/data/curriculum/E1.ts` … `E6.ts`

**Intent**: `StepDef.childName?: string` (komentarz: pokazywana dziecku na karcie „Nowa umiejętność!”, mianownik, krótko).
48 nazw dla grywalnych kroków (lista w Current State), forma kitu: rzeczownik odczasownikowy lub rzeczownik + zakres,
mianownik, bez kropki, ≤ 28 znaków (jedna linia 48 px w 1144 px), zrozumiała dla dziecka danego etapu (np. „Porównywanie
liczb do 20”, „Mnożenie do 30”, „Liczby rzymskie”). Nazwy z treści kroku (`title`, `types`, zakres z `params`), bez
kopiowania podręczników.

**Contract**: dane; brak nazwy dla kroków niegrywalnych.

#### 2. Sample i test

**File**: `scripts/sample.ts`, `tests/curriculum.test.ts`

**Intent**: Nagłówek kroku w `npm run sample` pokazuje `childName` obok `title`. Test: każdy grywalny krok (predykat
`playable`) ma `childName` niepusty, ≤ 28 znaków, zaczyna się wielką literą, bez kropki na końcu; nazwy w etapie są
różne.

### Success Criteria:

#### Automated Verification:

- `tests/curriculum.test.ts` (nowy test nazw) czerwony przed danymi, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: usunięta nazwa E3 kroku 6 → test czerwony; nazwa 40 znaków → test czerwony; przywrócone; meta-check: test liczy grywalne kroki tym samym predykatem co picker, więc nowy grywalny krok bez nazwy też go złamie
- `npm run sample -- E1` … `-- E6` `Naruszenia: 0` i drukują nazwy
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela 48 nazw (`npm run sample -- E1 … E6 --count 6`): poprawna polszczyzna, mianownik, zgodność z treścią kroku i zakresem, zrozumiałe dla dziecka etapu; zapis w `reviews/teacher-read.md`

---

## Phase 7: Karta „Nowa umiejętność!”

Driver: impl
Driver why: nowy widżet i przepływ sceny nad logiką z fazy 4 i danymi z fazy 6; wygląd dowodzi bramka wizualna, przepływ dotykiem e2e fazy 9.

### Overview

Jeden nowy komponent `UnlockCard` (kit `unlock.png`) na notesie: tytuł, placeholder książki, nazwa kroku, przycisk
„Dalej”. Pokazywany po „Kolejna runda”, gdy `pendingUnlock`.

### Changes Required:

#### 1. Tokeny i teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`, `tests/layout.test.ts`

**Intent**: `UNLOCK_LAYOUT` z `maths.css` `.unlock-card` (karta, tytuł, `.unlock-art` 200×200, nazwa, przycisk 450×108 w
`bottom: 36`); kolory ramki i gradientu w `PLACEHOLDER_COLORS`; przycisk w `TASK_TOUCH_TARGETS`. `pl.unlock = { title:
'Nowa umiejętność!', next: 'Dalej', spoken: (name) => … }` (osobny klucz, ten sam tekst co `pl.round.next` — karta nie
zależy od paska rundy); styl tekstu tytułu 66 px/800 i nazwy 48 px/750 w `textStyle`.

**Contract**: tylko stałe.

#### 2. Widżet i scena

**File**: `src/ui/widgets/UnlockCard.ts` (nowy), `src/scenes/TaskScene.ts`

**Intent**: `UnlockCard` (wzorzec `SummaryPanel`): `show(name)`, `hide()`, `targets().next`; placeholder książki
rysowany w kodzie (DESIGN-GAP: sztuka S-16). `TaskScene.startNextRound`: przy `learner.pendingUnlock !== null` chowa
podsumowanie i pokazuje kartę z `childName` kroku (z `getStage(stage).steps`), ustawia narrację karty (`pl.unlock.spoken`)
i czyta ją, gdy `autoRead` (stuknięcie było gestem); „Dalej” → `pendingUnlock: null` w rejestrze → nowa runda.
„Do pokoju” z podsumowania nie zmienia `pendingUnlock`, więc karta pojawia się po powrocie i „Kolejna runda”.
Stan „karta otwarta” należy do `render()` (plan-review F3): dziś `render()` pokazuje `SummaryPanel` zawsze, gdy
`currentSummary()` daje wynik, a `startNextRound` i `wake` wołają `render()` — gałąź karty idzie przed gałęzią
podsumowania (karta widoczna → podsumowanie i warstwa zadania ukryte, `roomSwitch` false), inaczej podsumowanie wraca
nad kartę.
`TaskSnapshot.unlock: { step: number; name: string } | null`; `targets.unlockNext`. Komentarze DESIGN-GAP (lektor na
karcie; karta po „Do pokoju”).

**Contract**: scena nie wybiera nazwy ani kroku — bierze `pendingUnlock` z ucznia i nazwę z danych.

#### 3. Hak

**File**: `src/testing/e2eHook.ts`

**Intent**: `screen: 'unlock'`, gdy `round.unlock !== null`; kolejność rozstrzygania `room` → `unlock` → `summary` →
`task`; `targets.unlockNext` (`null` w pokoju).

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts` obejmuje przycisk karty (≥ `MIN_TOUCH_TARGET`, w scenie, na notesie); unit `<baseline gałęzi> + N`
- Deliberate break: przycisk karty 90 px → test układu czerwony; przywrócone; meta-check: przepływ karty (pokazanie, „Dalej”, pokój) dowodzi e2e fazy 9, nie ten test
- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); `npm run build` drukuje `e2e hook: absent`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.unlock` (tytuł z kitu, „Dalej”, zdanie dla lektora)
- [visual] Zrzuty: podsumowanie z oczekującą kartą, karta „Nowa umiejętność!” (nazwa najdłuższa i najkrótsza), runda po „Dalej” — przy 1440×900 i 1024×768; porównanie z `designs/martynka-maths-A-v1/screenshots/unlock.png`

---

## Phase 8: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–7, bez nowej logiki.

### Overview

Luki projektu, follow-upy, `CLAUDE.md`, przegląd szwów i wiersze decyzji.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: Wiersze 22+: lektor na karcie (kit milczy; czytamy tytuł i nazwę, gdy `autoRead`); karta po „Do pokoju”
(kit pokazuje tylko ścieżkę „Kolejna runda”); placeholder książki do S-16. Każdy z komentarzem `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/adaptive-curriculum/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — ryzyko #13 (brzmienie z research § 5) i #12 do test-planu (`/10x-test-plan refresh`);
`test-stack.md` § E2E bez projektu `chromium-hook`/portu 4397 (`/10x-e2e-setup` re-run); ` = ?` po wyrażeniu
(`Trigger: S-16`, przeniesione z S-04); S-11: zapis pełnego `SessionLearner` i podłoga `max(zapisany, calendarStart)` na
starcie sesji; „wcześniejszy zapis ucznia” z S-06 obejmuje teraz także opanowanie (`Trigger: before S-11, or any deploy
used for daily play`); S-08: historia nie trzyma treści zadania ani złej odpowiedzi („przykłady błędów” — S-08 decyduje o
polu); S-17: kalibracja wag, `minStartSteps`, łagodzenia i progu w playteście, oraz formuły podłogi (indeks grywalnych kroków vs
wszystkich kroków podręcznika zaokrąglony w dół — plan-review F1: E3 październik krok 6, E6 luty krok 4).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, `src/core/round/pick.ts`, pliki faz 1–7

**Intent**: Current state w `CLAUDE.md`: `core/curriculum.ts`, `core/mastery.ts`, `core/round/unique.ts`, uczeń sesji
z adaptacją, karta, nazwy kroków, `balance.curriculum/mastery/easing`. Seam sweep: `buildRound` usunięte, jeśli
nieużywane (z testami w `tests/pick.test.ts`); nieaktualne komentarze (`pick.ts` nagłówek „uniform”, `TaskScene`
`freshRound`, `REGISTRY_KEYS.learner`); duplikaty predykatu `playable`; martwe klucze.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: profil wskazuje nieistniejący plik → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta § 10 profilu
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` (albo − liczba testów usuniętego `buildRound`, nazwana w handoff)

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–7; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [human] Do S-11 każdy zimny start zeruje opanowanie i wraca do podłogi kalendarza (oprócz powitania i gwiazdek); dziecko może drugi raz zobaczyć „Nowa umiejętność!” dla kroku odblokowanego wczoraj; follow-up „wcześniejszy zapis ucznia” dotyczy teraz także postępu nauki
- [human] Reguła D (podłoga kalendarza, brak dosłownego tekstu PRD; kotwica: Success Criteria „zgodne z tym, co jest aktualnie w szkole”). Co dziecko widzi na produkcji do S-11: E3 w październiku gra tylko kroki 1, 2, 6 (+10% E2); cały etap od stycznia; ścieżka rodzica do etapu niższego niż kalendarzowy odblokowuje cały etap. Uwaga (plan-review F1): przy E3 październik i E6 luty podłoga wyprzedza kolejność podręcznika o ~1 miesiąc (Known risks)
- [human] „Większość” = `≥ ceil(0.5 · n)` (krok z 2 umiejętnościami odblokowuje 1 z 2), wbrew dosłownej większości `> 0.5` z PRD FR-014 — zgodnie z „jedna trudna umiejętność nie blokuje kroku”
- [human] Odblokowanie działa także w trakcie łagodzenia (PRD milczy; `change.md` decyzja 4 mówiła „nie”)
- [human] Łagodzenie = wagi 20/50/30 przez 2 rundy zamiast dosłownego PRD Business Logic „mniejszy zakres, tryb z obrazkami” (zakresy chronią parsery i teacher read; tryb z obrazkami to S-14)
- [human] Brak automatycznego awansu etapu po ostatnim kroku — zmiana etapu to rodzic (S-08)

---

## Phase 9: Odblokowanie kroku przez dotyk — e2e (#13, proposed)

Driver: e2e
Driver why: ryzyko #13 (proposed, test-plan refresh pending): karta „Nowa umiejętność!” blokująca przejście albo niepokazana istnieje tylko w renderowanym UI i przepływie sceny; zbudowane w fazach 5 i 7, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/adaptive.spec.ts` (projekt `chromium-hook`): rodzic ustawia E4 we wrześniu (`?e2eMonth=8`, wiek 8 →
propozycja E3, wybór „Klasa 2, II półrocze” = inny etap, bez rozgrzewki) → reguła D: `unlockedStep.E4 === 2` (jedna
umiejętność `E4.2.add_sub_100_units`, bieżący koszyk 60%) → dziecko gra poprawnie, aż karta. Miesiąc tylko przez
`?e2eMonth` — nigdy `page.clock` (zamraża tweeny Phasera).

### Changes Required:

#### 1. Helpery

**File**: `tests/e2e/support/hook.ts` (nowy), `tests/e2e/support/welcome.ts`

**Intent**: `support/hook.ts`: `readHook`, `fromHook`, `snapshot`, `targets`, `tapScene`, `answerRight`, `tapNext`,
`screenIs` dla nowego specu (istniejące specy migrują w S-08, follow-up F2). `welcome.ts`: `passWelcomeAsParent(page,
{ age, stageLabel, month })` (ta sama ścieżka bramki co `passWelcome`; `passWelcome` deleguje z wiekiem „10+”, E3, bez
miesiąca — zachowanie bez zmian).

#### 2. Spec i projekt

**File**: `tests/e2e/adaptive.spec.ts` (nowy), `playwright.config.ts`

**Intent**: `ROUND_SPEC` obejmuje `adaptive`. Jeden test „#13 (proposed) mastering the current step shows „Nowa
umiejętność!” after „Kolejna runda”, and „Dalej” starts a round on the unlocked step”: start jak w Overview; pętla ≤ 12 rund
(5 zadań poprawnie za pierwszym razem, „Dalej”) — na każdym podsumowaniu przed kartą `learner.unlockedStep.E4 === 2` albo
`pendingUnlock` ustawione; po „Kolejna runda” przy `pendingUnlock` → `screen === 'unlock'`, `unlock.step === 4`,
`learner.unlockedStep.E4 === 4`; „Dalej” (`targets.unlockNext`) → `screen === 'task'`, `index === 0`, `pendingUnlock`
`null`; następna runda do końca → „Kolejna runda” → `screen === 'task'` (karta nie wraca). W tym samym teście (plan-review
F2: jeden przebieg zamiast dwóch pełnych dojść do karty) czekanie przez pokój: na pierwszym podsumowaniu z `pendingUnlock`
→ „Do pokoju” → pokój → powrót → podsumowanie → „Kolejna runda” → `screen === 'unlock'` (tytuł testu wymienia oba
zachowania: „… and the card waits through „Do pokoju””). `test.setTimeout(180_000)` — pod górną granicę pętli (12 rund,
nie oczekiwane ~4), bo istniejące specy mają 60 s na ~1–2 rundy; zmierzony czas w handoff §3. Stuknięcia
`page.touchscreen.tap`; żadnego zapisu stanu z testu, żadnego stałego ziarna, żadnej asercji treści zadania.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `npx playwright test tests/e2e/adaptive.spec.ts`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/adaptive.spec.ts` zielony (1 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 1` passed
- Deliberate break (patch tylko na kodzie produkcyjnym, REGUŁA): `src/scenes/TaskScene.ts` `startNextRound` ignoruje `pendingUnlock` (zawsze nowa runda, karta nigdy) → test czerwony na oczekiwaniu `screen === 'unlock'`; przywrócone; meta-check: unit (`curriculumEnd.test.ts`) zielone przy tej przerwie, więc spec dowodzi sklejki sceny — cytat czerwieni w handoff §3. Gdy Chromium nie startuje w sesji: patch w `context/runs/2026-10-12-s04-s08/e2e-break-s07-p9.patch` + `e2e-request-s07-p9.md` (protokół `prompt-phase.md`)
- Druga przerwa (patch, REGUŁA): `TaskScene` „Dalej” karty nie czyści `pendingUnlock` → test czerwony na „karta nie wraca” (karta pokazuje się ponownie); przywrócone; meta-check: dowodzi, że karta nie blokuje kolejnych rund
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Testing Strategy

### Unit Tests:

- Opanowanie: seria, granice, druga próba, historia (`mastery.test.ts`).
- Reguła D: tabela 6 etapów × 6 kolumn, `behind`, `minStartSteps`, `startLearning` (`curriculumStart.test.ts`).
- Wybór: tylko odblokowane kroki, rozkład 60/30/10 i 20/50/30, puste koszyki, unikalność w rundzie i rozgrzewce, limit
  (`curriculumPick.test.ts`, `warmup.test.ts`).
- Koniec rundy: `≥ ceil(0.5 · n)`, jeden krok, ostatni krok, przeskok niegrywalnych, łagodzenie, rozgrzewka
  (`curriculumEnd.test.ts`).
- Dane: nazwy kroków dla każdego grywalnego kroku (`curriculum.test.ts`); układ karty (`layout.test.ts`).

### Integration Tests:

- `npm run sample -- E1..E6` (z nazwami kroków); `npm run build` ze strażnikiem haka; seed #8, #11, lektor, #12 i nowy
  `#13 (proposed)` w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty: podsumowanie, karta (dwie długości nazwy), runda po „Dalej” — 1440×900 i 1024×768.
2. Odczyt nauczyciela: 48 nazw kroków, `pl.unlock`.
3. iPad: karta czytelna, „Dalej” palcem, lektor na karcie przy E1–E2.

## Performance Considerations

Losowanie rundy: najwyżej `(uniqueRetries + 1) · 5` wywołań generatora (w praktyce 5–6). Historia przycięta do 200
wpisów; aktualizacja raz na rundę. Bez wpływu na start.

## Migration Notes

Brak: bez bazy danych (profil § 4). `LearnerState` dostaje `weakStreak` i `easedRounds` przed powstaniem formatu zapisu
(S-11), więc wersja 1 zapisze je bez migracji. `pendingUnlock` i `warmupPending` zostają poza `LearnerState`.

## Known risks

- **Podłoga kalendarza bez tekstu źródłowego** (wiersz `[human]` 8.6): do S-11 każdy zimny start wraca do kalendarza;
  dziecko szybsze od klasy co dzień od nowa zdobywa te same kroki (karta może się powtórzyć).
- **Rozkład w e2e**: test #13 zależy od losowania (60% bieżący koszyk); ≤ 12 rund daje ~60 zadań wobec potrzebnych 12 z
  jednej umiejętności — prawdopodobieństwo porażki pomijalne; oczekiwane ~4 rundy, najgorszy przypadek 12 rund mieści się w
  `test.setTimeout(180_000)` (plan-review F2). Jeśli zmierzona runda E4 na klawiaturze przekracza ~12 s, faza 9 podnosi limit
  i zapisuje pomiar w handoff §3.
- **Podłoga kalendarza wyprzedza podręcznik tam, gdzie niegrywalne kroki są skupione** (plan-review F1): formuła liczy postęp
  na indeksie *grywalnych* kroków z `ceil` i `minStartSteps`, więc E3 w październiku stoi na kroku 6 („Liczby 21–30”),
  choć wg kolejności podręcznika (11 kroków, ~30% półrocza) klasa jest w okolicy kroków 3–4 (zegar, waga — niegrywalne);
  E6 w lutym startuje od kroku 4 (6 · 12), podręcznik jest przy krokach 1–2. E1 i E5 zgadzają się z podręcznikiem z
  dokładnością do kroku. Łagodzenie (20/50/30) i 40% z wcześniejszych kroków/poprzedniego etapu tłumią skutek; alternatywa
  (postęp na indeksie wszystkich kroków podręcznika, zaokrąglony w dół do grywalnego kroku) zostaje do kalibracji S-17
  (follow-up w fazie 8) i jest widoczna w wierszu `[human]` 8.6.
- **Miesiąc w e2e tylko przez `?e2eMonth`**: `page.clock` zamroziłby tweeny Phasera 4; parametr istnieje tylko w buildzie
  e2e (`grep -rl e2eMonth dist/` pusty).
- **Chromium w sesji agenta** (`MachPortRendezvous`): fazy z e2e w bramce oddają e2e orkiestratorowi (`prompt-phase.md`);
  faza 9 pisze `e2e-request-s07-p9.md` z patchami przerw z Success Criteria.
- **Nazwy kroków to nowa treść** — błąd językowy zobaczy dziecko na karcie; teacher read w fazie 6.

## References

- Research: `context/changes/adaptive-curriculum/research.md`; change: `context/changes/adaptive-curriculum/change.md`
- PRD: `context/foundation/prd.md` FR-013, FR-014, Business Logic, Success Criteria
- Plan gry: `Martynka-urzadza.md` §2 p. 3, §4, §5, §6, §11 (M3); `docs/ZADANIA.md` §1 „Etapy”, „Adaptacja trudności”, §3
- Test-plan: `context/foundation/test-plan.md` ryzyko #11 (+ proponowane #12, #13 — research § 5); `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/screenshots/unlock.png`, `preview.js` (`screen==='unlock'`), `maths.css` (`.unlock-card`), `style-guide.md`
- Follow-upy: `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`, `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`, `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` (`Trigger: S-07`)
- Format: `context/archive/2026-10-13-first-launch-placement/plan.md`

## Autonomous decisions

1. **Startowy krok = podłoga kalendarza szkolnego (reguła D, decyzja orkiestratora).** `calendarStart(stage, age, month)`:
   etap za kalendarzem → cały; inaczej postęp półrocza z miesiąca, nie mniej niż `minStartSteps` (2). Odrzucone: A pierwszy
   grywalny krok (regresja różnorodności na produkcji do S-11: E3 ≈ 86% z kroku 1), B cały etap (nic do odblokowania, FR-014
   martwe), C cały etap tylko na ścieżce rodzica. Brak dosłownego tekstu PRD → wiersz `[human]` 8.6 z tym, co dziecko widzi
   do S-11. Zmieniłoby: autor chce kroków wyłącznie zasłużonych (A) albo przychodzi zapis (S-11 — wtedy `max(zapisany,
   podłoga)`).
2. **Stan adaptacji w uczniu sesji (rejestr), w kształcie `LearnerState`, do S-11** (`change.md` decyzja 1). Odrzucone:
   `localStorage`, pola sceny, wyciągnięcie S-11. → `[human]` 8.5. Zmieniłoby: follow-up „early save”.
3. **„Większość” = `≥ ceil(0.5 · n)`** (research § 2). Odrzucone: `> 0.5` (`change.md` decyzja 2 — przy n=2 jedna trudna
   umiejętność blokuje krok, wbrew ZADANIA §1 i notce PRD FR-014). → `[human]` 8.7. Zmieniłoby: autor czyta „większość”
   dosłownie — `unlockShare` i operator w jednej funkcji.
4. **Łagodzenie = wagi 20/50/30 przez 2 rundy** (`change.md` decyzja 4). Odrzucone: przeskalowane `params` (omijają parsery i
   teacher read), tryb z obrazkami (S-14), cofanie `unlockedStep` („nie da się niczego stracić”). → `[human]` 8.9.
   Zmieniłoby: autor chce dosłownie mniejszego zakresu — łagodne warianty jako osobne umiejętności w danych.
5. **Odblokowanie działa także w łagodzeniu** (research: źródła milczą; odwrócenie `change.md` decyzji 4). Dlaczego: opanowanie
   liczy się z prawdziwych pierwszych prób, a w łagodzeniu bieżący krok ma 20% — gotowość jest rzadka i uczciwa; prostsza
   reguła. → `[human]` 8.8. Zmieniłoby: playtest S-17 pokaże karty w trakcie słabej passy jako mylące.
6. **Brak automatycznego awansu etapu** (`change.md` decyzja 5). → `[human]` 8.10. Zmieniłoby: autor zechce awansu.
7. **Rozgrzewka liczy się do opanowania, nie do łagodzenia ani odblokowania**; rozgrzewka losuje dalej przez `pickSkills`
   (testuje początek etapu), dostaje tylko unikalność poleceń. Zmieniłoby: nic w tym slice.
8. **Unikalność po `Task.prompt`, ponowne losowanie tej samej umiejętności do 20 razy, potem duplikat** (research § 3).
   Odrzucone: ponowne losowanie umiejętności (zmienia rozkład wag), `skillId + answer` (słabsze). Zmieniłoby: teacher read
   znajdzie bliskie duplikaty o różnych stringach.
9. **Karta jako widżet `UnlockCard` w `TaskScene`, po „Kolejna runda”, czeka przez „Do pokoju”** (`change.md` decyzja 3;
   kit `preview.js`). Lektor czyta kartę, gdy `autoRead` (kit milczy → DESIGN-GAP). Odrzucone: `UnlockScene`, nakładka DOM,
   karta w trakcie rundy, karta bez lektora (dzieci E1 nie przeczytają nazwy). Zmieniłoby: rewizja kitu.
10. **`unlockedStep` dla wszystkich 6 etapów przy starcie nauki**, żeby korekta rozgrzewki i S-08 nie liczyły podłogi drugi raz.
    Odrzucone: wpis tylko dla bieżącego etapu (`Partial` i doliczanie w scenie). Zmieniłoby: S-11, jeśli zapis ma trzymać
    tylko etapy grane.
11. **Fazy e2e po seam sweep; jedna faza z jednym testem (plan-review F2: czekanie przez „Do pokoju” wplecione w ten sam przebieg) i dwiema przerwami-regułami** (decyzja orkiestratora: #13 jako
    „proposed, test-plan refresh pending”, miesiąc tylko `?e2eMonth`). Spec przez ścieżkę rodzica (E4 we wrześniu, krok 2 z
    jedną umiejętnością) — najkrótsza droga do karty przez produkt (~4 rundy). Odrzucone: ustawianie opanowania z testu,
    stałe ziarno, nadpisanie balansu w buildzie e2e. Nowy spec korzysta ze wspólnego `support/hook.ts`; migracja starych
    speców zostaje follow-upem F2 (`Trigger: S-08`). Zmieniłoby: S-08 przenosi helpery wcześniej.
12. **Historia bez treści zadania** (plan §5 `LearnerState.history`). „Przykłady błędów” S-08 to follow-up. Zmieniłoby: S-08
    wymaga pola `prompt` — dopisanie przed S-11 nie wymaga migracji.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Typy danych w core i opanowanie z pierwszej próby

#### Automated

- [x] 1.1 `tests/mastery.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 8fd7bd0
- [x] 1.2 Deliberate break: `'second'` jak `'first'` / seria nie zerowana → czerwony; przywrócone; meta-check (reguła z ZADANIA, liczby z `balance`) — 8fd7bd0
- [x] 1.3 `grep -rn "from '../data" src/core/` pusty (F5) — 8fd7bd0
- [x] 1.4 Pełna bramka lokalna zielona — e2e 14/14 on 8fd7bd0 (orchestrator, run-log line "S-07 p1 tdd")

### Phase 2: Podłoga kalendarza i start nauki

#### Automated

- [x] 2.1 `tests/curriculumStart.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 1c384c5
- [x] 2.2 Deliberate break: `semStart` E4 = 0 / `behind` `<=` → czerwony; przywrócone; meta-check (wyrocznia z planu) — 1c384c5
- [x] 2.3 Pełna bramka lokalna zielona — 1c384c5 (e2e 14/14 on 1c384c5, orchestrator)

### Phase 3: Wybór umiejętności wg wag i unikalne polecenia

#### Automated

- [x] 3.1 `tests/curriculumPick.test.ts` czerwony przed, zielony po; `tests/warmup.test.ts` z unikalnością zielony; unit `<baseline gałęzi> + N` — ee93ff9
- [x] 3.2 Deliberate break: `earlier` z krokami > bieżącego / brak ponownego losowania → czerwony; przywrócone; meta-check (prawdziwe `stages`, rozkład z próby) — ee93ff9
- [x] 3.3 `npm run sample -- E1` … `-- E6` `Naruszenia: 0` — ee93ff9
- [x] 3.4 Pełna bramka lokalna zielona — ee93ff9 (e2e 14/14 on ee93ff9, orchestrator)

### Phase 4: Koniec rundy — odblokowanie kroku i łagodzenie

#### Automated

- [x] 4.1 `tests/curriculumEnd.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — dba1791
- [x] 4.2 Deliberate break: `>` zamiast `>=` / `weakStreak` nie zerowany → czerwony; przywrócone; meta-check (oczekiwania z decyzji 3) — dba1791
- [x] 4.3 Pełna bramka lokalna zielona — dba1791 (e2e: orchestrator gate)

### Phase 5: Sklejka w scenach — uczeń sesji, runda adaptacyjna, koniec rundy, hak

#### Automated

- [x] 5.1 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); unit `<baseline gałęzi> + 0` — orchestrator, run-log line "S-07 p5 impl" (e2e 14/14 on 0aedeff; break red: #12 first-launch.spec.ts:146, #11 support/welcome.ts:76; restored)
- [x] 5.2 Deliberate break: `WelcomeScene.start` bez `startLearning` → e2e czerwony; przywrócone; meta-check (runda zależy od stanu w rejestrze) — orchestrator, run-log line "S-07 p5 impl" (e2e 14/14 on 0aedeff; break red: #12 first-launch.spec.ts:146, #11 support/welcome.ts:76; restored)
- [x] 5.3 `npm run build` drukuje `e2e hook: absent` — 0aedeff
- [x] 5.4 Pełna bramka lokalna zielona — 0aedeff (e2e: orchestrator gate)

#### Manual

- [ ] 5.5 [reviewer] `endRound` raz na rundę (także przez „Do pokoju”), brak liczb i tekstu w `TaskScene`

### Phase 6: Nazwy kroków dla dziecka

#### Automated

- [x] 6.1 `tests/curriculum.test.ts` (test nazw) czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 58bf417
- [x] 6.2 Deliberate break: brak nazwy E3.6 / nazwa 40 znaków → czerwony; przywrócone; meta-check (ten sam predykat `playable`) — 58bf417
- [x] 6.3 `npm run sample -- E1` … `-- E6` `Naruszenia: 0` i drukują nazwy — 58bf417
- [x] 6.4 Pełna bramka lokalna zielona — 58bf417 (e2e: orchestrator gate)

#### Manual

- [ ] 6.5 [reviewer] Odczyt nauczyciela 48 nazw kroków (`reviews/teacher-read.md`)

### Phase 7: Karta „Nowa umiejętność!”

#### Automated

- [x] 7.1 `tests/layout.test.ts` obejmuje przycisk karty; unit `<baseline gałęzi> + N` — e584911
- [x] 7.2 Deliberate break: przycisk karty 90 px → czerwony; przywrócone; meta-check (przepływ → e2e fazy 9) — e584911
- [ ] 7.3 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); build `e2e hook: absent` — build `e2e hook: absent` e584911; e2e open: orchestrator gate
- [x] 7.4 Pełna bramka lokalna zielona — e584911 (e2e: orchestrator gate)

#### Manual

- [ ] 7.5 [reviewer] Odczyt nauczyciela `pl.unlock`
- [ ] 7.6 [visual] Zrzuty: podsumowanie z oczekującą kartą, karta (najdłuższa i najkrótsza nazwa), runda po „Dalej” przy 1440×900 i 1024×768 vs `unlock.png`

### Phase 8: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [ ] 8.1 `validate-rule-files.sh` PASS
- [ ] 8.2 Deliberate break: profil wskazuje nieistniejący plik → FAIL; przywrócone; meta-check
- [ ] 8.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` (albo − testy usuniętego `buildRound`)

#### Manual

- [ ] 8.4 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze; DESIGN-GAP w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [ ] 8.5 [human] Do S-11 zimny start zeruje opanowanie i wraca do podłogi kalendarza; karta może się powtórzyć; „early save” obejmuje postęp nauki
- [ ] 8.6 [human] Reguła D (podłoga kalendarza): E3 w październiku tylko kroki 1, 2, 6; cały etap od stycznia; ścieżka rodzica do niższego etapu odblokowuje cały etap
- [ ] 8.7 [human] „Większość” = `≥ ceil(0.5 · n)` wbrew dosłownemu `> 0.5` z FR-014
- [ ] 8.8 [human] Odblokowanie także w trakcie łagodzenia (PRD milczy)
- [ ] 8.9 [human] Łagodzenie = wagi 20/50/30 przez 2 rundy zamiast „mniejszy zakres, tryb z obrazkami”
- [ ] 8.10 [human] Brak automatycznego awansu etapu po ostatnim kroku (zmiana etapu w S-08)

### Phase 9: Odblokowanie kroku przez dotyk — e2e (#13, proposed)

#### Automated

- [ ] 9.1 `npx playwright test tests/e2e/adaptive.spec.ts` zielony (1 passed); pełne e2e `<baseline gałęzi e2e> + 1`
- [ ] 9.2 Deliberate break: `TaskScene.startNextRound` ignoruje `pendingUnlock` → test czerwony; przywrócone; meta-check (unit zielone)
- [ ] 9.3 Druga przerwa: „Dalej” karty nie czyści `pendingUnlock` → test czerwony; przywrócone; meta-check
- [ ] 9.4 Build `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
