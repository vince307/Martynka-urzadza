# Pierwsze uruchomienie: wiek, etap, bramka rodzica i rozgrzewka — Implementation Plan

## Overview

Roadmapa S-06 (`first-launch-placement`, otwiera etap M3, FR-012). Na zimnym starcie gra pokazuje powitanie z kitu
(„Martynka urządza”, „Ile masz lat?”, przyciski 6–10). **Dziecko samo** stuka wiek: gra bierze etap z tabeli wiek ×
miesiąc (`docs/ZADANIA.md` §1), gdy etap ma etap niżej, rozgrywa rozgrzewkę 6 zadań (3 z poprzedniego etapu + 3 z
pierwszych kroków bieżącego), która po cichu obniża etap o jeden przy < 4 poprawnych za pierwszym razem, a potem
idą zwykłe rundy. **Rodzic** stuka „Rodzic” na powitaniu, przechodzi bramkę dla dorosłego (dwucyfrowa × dwucyfrowa,
klawiatura cyfr w DOM), w panelu wybiera wiek dziecka, widzi propozycję i potwierdza ją albo wybiera inny etap. Inny
etap = `stageOverriddenByParent` i brak rozgrzewki (odpowiedź na PRD Open Question 1). Wybrany etap zastępuje
`balance.defaultStage` jednym szwem (uczeń sesji w rejestrze gry), z którego S-07 (adaptacja), S-08 (ustawienia rodzica)
i S-11 (zapis) korzystają dalej. Spec e2e ryzyka #11 i lektora przechodzą powitanie wspólnym helperem; nowy spec
pierwszego uruchomienia cytuje proponowane ryzyko #12.

## Current State Analysis

Z `context/changes/first-launch-placement/research.md` (commit `fb871b2`) i odczytu kodu w tym kroku
(`feat/first-launch-placement` @ `17bdd18`):

- `src/scenes/BootScene.ts` `create` zawsze `scene.start(SCENE_KEYS.task)`; `src/main.ts` `createGame`:
  `scene: [BootScene, TaskScene, RoomScene, UIScene]`. `SCENE_KEYS` = `boot`, `task`, `room`, `ui`; `REGISTRY_KEYS` =
  `stars`, `narration`, `narrator`, `roomSwitch` (`src/data/layout.ts`).
- `src/scenes/TaskScene.ts` `create` czyta `getStage(balance.defaultStage)` (jedyny czytelnik), liczy
  `defaultAutoRead(stage.id, balance.narrator.autoReadStages)`, `freshRound` → `buildRound(this.stage, …, balance.round, …)`,
  uruchamia `UIScene`. `autoReadFirst` czyta tylko po „Dalej”/„Kolejna runda”. `advance` → `next(state)`; przy
  `finished` pokazuje `SummaryPanel`.
- `src/core/round.ts` `startRound(tasks, rules)` tnie do `rules.length`; `RoundState.outcomes`:
  `'first' | 'second' | 'retype' | null`. `src/core/round/pick.ts` `pickSkills` losuje jednostajnie z grywalnych
  umiejętności całego etapu (`playable` prywatne), `buildRound` z jednego etapu.
- `src/core/types.ts` `LearnerState` ma `age`, `stage: StageId`, `stageOverriddenByParent` (oraz pola S-07). Brak
  `src/core/placement.ts`, brak trwałości (`src/storage/` pusty) — zapis to S-11.
- `src/ui/dom/overlay.ts` (`createOverlay`, `createText`, `createButton` na `click`), style `.overlay` w `src/style.css`
  (`z-index: 10`, `.overlay-rotate` 20). **Phaser przekazuje dotyk z DOM nad canvasem do obiektów gry**
  (`TouchManager.onTouchStartWindow` → `InputManager.onTouchStart` → `InputPlugin.processDownEvents`, research §3):
  scena pod nakładką musi mieć `input.enabled = false`.
- `src/ui/widgets/PageButton.ts` reaguje w `pointerup` po wciśnięciu na sobie; `SummaryPanel` rysuje rząd gwiazdek od
  stałego `SUMMARY_LAYOUT.stars.left` (5 gwiazdek z kitu) — 6 gwiazdek rozgrzewki wyjdzie z osi.
- `src/testing/e2eHook.ts` `installE2EHook` woła `task().snapshot()` bezwarunkowo — bez działającej `TaskScene` rzuca.
  `tests/e2e/task-round.spec.ts` `beforeEach` i `tests/e2e/narrator.spec.ts` `openGame` robią `goto('/')` i czekają na
  rundę; po powitaniu utkną. `playwright.config.ts` `ROUND_SPEC = /(task-round|narrator)\.spec\.ts/` na projekcie
  `chromium-hook` (4397). Seed #8 nie zależy od sceny.
- Tabela wieku (research §1): wiek 6 → E1; 7 → E1/E2/E2; 8 → E3/E4/E4; 9 → E5/E6/E6; 10 → E6 (pasma
  wrzesień–styczeń / luty–czerwiec / lipiec–sierpień; `getMonth()` 8–11 i 0 / 1–5 / 6–7).
- `context/foundation/lessons.md` nie istnieje — żadna lekcja nie obowiązuje.
- Baseline (kontrakt): `main` @ `37a9a62`: unit 671, e2e 8 passed. Każda faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Zimny start: powitanie bez HUD-u. Stuknięcie wieku (dziecko samo) → runda bez udziału dorosłego: rozgrzewka 6 zadań,
  gdy etap z tabeli > E1, inaczej od razu zwykła runda 5 zadań. Po rozgrzewce zwykłe podsumowanie (gwiazdki jak w
  rundzie), etap po cichu −1 przy < 4 poprawnych za pierwszym razem; następne rundy na etapie po korekcie.
- „Rodzic” → bramka (działanie 13–19 × 13–19, klawiatura cyfr DOM, zła odpowiedź = nowe działanie i spokojny komunikat,
  „Anuluj” wraca) → panel (wiek 6–10, etapy E1–E6 z opisem „Klasa N, I/II półrocze”, propozycja oznaczona) →
  „Zatwierdź”: inny etap ⇒ runda 5 zadań bez rozgrzewki; potwierdzona propozycja ⇒ rozgrzewka jak u dziecka.
- Dotyk w bramkę/panel nie wciska niczego na powitaniu pod spodem.
- E1–E2: pierwsze zadanie po powitaniu czytane automatycznie (stuknięcie w canvas było gestem).
- `balance.defaultStage` nie istnieje; etap gry pochodzi wyłącznie z ucznia w rejestrze (`REGISTRY_KEYS.learner`).
- `npx playwright test`: seed #8, #11, lektor (przez wspólny helper ścieżki rodzica, etap E3 jak dziś) i nowy spec
  pierwszego uruchomienia (#12, proponowane); build produkcyjny dalej `e2e hook: absent`.

### Key Discoveries:

- Dotyk z nakładki DOM trafia do obiektów Phasera pod spodem (research §3) — `WelcomeScene.input.enabled = false`, póki
  bramka lub panel są otwarte; alternatywy (`input.windowEvents: false`, `preventDefault`) psują całą grę lub `click`.
- Dla persony PRD (7 lat, klasa 2) tabela w październiku daje E1 — ścieżka dziecka zagra za łatwo, ścieżka rodzica to
  naprawia (wiersz `[human]`).
- **Nie `page.clock.setFixedTime`** (plan-review F1): Playwright 1.64 zamraża nim `Date.now()`, a Phaser 4.2.1
  `TweenManager.getDelta` liczy krok tweenów z `Date.now()` — przy stałym czasie delta = 0, tweeny stoją (kamera po
  `TaskScene.shake` zostaje przesunięta o `-ANIMATION.shakeDistance`, gwiazdka `flyStar` wisi). Miesiąc w e2e ustala
  parametr adresu `?e2eMonth=N` czytany tylko w buildzie e2e (`__E2E_HOOK__`), wynik tabeli niezależny od dnia uruchomienia.
- Rozgrzewka losuje z pierwszych grywalnych kroków bieżącego etapu, bo pierwszy krok bywa pusty (E1.1, E2.2, E6.2–3).

## What We're NOT Doing

- Trwałość ucznia (S-11): wynik żyje w rejestrze sesji; powitanie przy każdym zimnym starcie do S-11 (dziecko przechodzi
  je samo). Żadnego `localStorage`.
- Ustawienia rodzica po długim przytrzymaniu i zmiana etapu w trakcie gry (S-08) — tylko ścieżka z powitania; S-08 użyje
  tego samego `openParentGate`.
- Wagi, opanowanie, `unlockedStep` (S-07); rozgrzewka losuje przez istniejące `pickSkills`.
- „Tryb z obrazkami” dla 6-latka (S-13/S-14) — 6 lat → zwykłe E1.
- Sztuka powitania (`welcome-flower`, `welcome-cushion`; S-16) — pominięta, DESIGN-GAP.
- Ręczna edycja `context/foundation/test-plan.md` (ryzyko #12 → follow-up `/10x-test-plan refresh`).
- Naprawa przepuszczania dotyku przez `mountInstallHint` (follow-up).
- E2E w CI, WebKit/iPad (manualnie).

## Implementation Approach

Logika najpierw, test-first, w `src/core/` (fazy 1–3: placement, rozgrzewka, bramka), dane w `src/data/placement.ts`
i `src/data/balance.ts`. Potem UI po ≤ 2 nowe komponenty na fazę: powitanie (4: `WelcomeScene` + `AgeButton`), bramka
i panel w DOM (5: `parentGate` + `stagePanel`), rozgrzewka w `TaskScene` bez nowych komponentów (6), seam sweep (7),
e2e (8–9). Każda faza zostawia grę grywalną i całą bramkę zieloną — dlatego faza 4 od razu daje istniejącym specom
wspólny helper „przejdź powitanie” (ścieżka dziecka przy miesiącu z `?e2eMonth=9`: wiek 8 w październiku → E3, rozgrzewki
jeszcze nie ma), a faza 6, która włącza rozgrzewkę, przełącza helper na ścieżkę rodzica (wiek 10, wybór E3 ≠ propozycja
E6 ⇒ bez rozgrzewki, niezależnie od daty).

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**. Faza 8 poszerza
`ROUND_SPEC` w `playwright.config.ts` (ta sama komenda `npx playwright test`).

**Szew ucznia.** `SessionLearner = Pick<LearnerState, 'age' | 'stage' | 'stageOverriddenByParent'> & { warmupPending: boolean }`
w `src/core/placement.ts`. `BootScene` pyta `needsPlacement(registry.learner ?? null)`; dziś zawsze `true`. S-11 poda tu
wczytany zapis (z `warmupPending`), więc powitanie pojawi się tylko przy prawdziwie pierwszym uruchomieniu, a zmiana
etapu przejdzie do ustawień S-08 za tą samą bramką.

## Critical Implementation Details

**Wejście pod nakładką.** Otwierając bramkę, `WelcomeScene` ustawia `this.input.enabled = false` przed zamontowaniem
nakładki i przywraca `true` dopiero po „Anuluj” (zamknięcie bez wyniku). Po „Zatwierdź” scena i tak przechodzi do
`TaskScene`. Nakładka nie robi `preventDefault` na `touchstart` (przyciski DOM działają na `click`, a Phaser odblokowuje
audio pierwszym dotykiem). `z-index` nakładki rodzica 15 (nad `.overlay` 10, pod `.overlay-rotate` 20).

**Moment korekty po rozgrzewce.** Gdy `advance` zmieni stan na `finished` w rundzie rozgrzewki, `TaskScene` od razu liczy
`warmupResult`, zapisuje ucznia (`stage`, `warmupPending: false`) w rejestrze i przelicza `this.stage` oraz `autoRead` —
nie przy „Kolejna runda”, żeby „Do pokoju” i powrót nie pominęły korekty. Podsumowanie rozgrzewki jest zwykłe; dziecko
nie widzi, że etap się zmienił.

**Rząd gwiazdek dla 6 zadań.** `SummaryPanel` liczy lewą krawędź rzędu z liczby gwiazdek, wyśrodkowaną tak, by 5 gwiazdek
dawało dokładnie `SUMMARY_LAYOUT.stars.left` z kitu.

## Phase 1: Wiek + miesiąc → etap i uczeń sesji

Driver: tdd
Driver why: `src/core/placement.ts` nie istnieje; failing testy na tabeli (12 miesięcy × 5 wieków) i na fladze rodzica prowadzą implementację.

### Overview

Tabela z `docs/ZADANIA.md` §1 jako dane, reguła i budowa ucznia sesji jako czyste funkcje.

### Changes Required:

#### 1. Dane tabeli

**File**: `src/data/placement.ts` (nowy)

**Intent**: Pasma miesięcy (`getMonth()`: wrzesień–styczeń 8–11 i 0, luty–czerwiec 1–5, lipiec–sierpień 6–7), wieki
z przycisków (6–10; 10 = „10+” z tabeli) i tabela pasmo × wiek → `StageId` dosłownie jak w ZADANIA §1 (trzecie pasmo
zostaje, choć dziś równe drugiemu).

**Contract**: `placementData: { ages: readonly number[]; monthBands: Record<Band, readonly number[]>; table: Record<Band, Record<number, StageId>> }`; import z `core` tylko typów (granica ESLint).

#### 2. Reguła i uczeń

**File**: `src/core/placement.ts` (nowy)

**Intent**: `previousStage(id)` (E1 → `null`); `proposeStage(age, month, data)` (RangeError dla wieku spoza `ages` albo
miesiąca spoza 0–11); `placeByChild(age, month, data)` → propozycja, `stageOverriddenByParent: false`,
`warmupPending: previousStage !== null`; `placeByParent(age, chosen, month, data)` → `chosen`, `overridden = chosen !==
proposal`, `warmupPending = !overridden && previousStage(chosen) !== null`; `needsPlacement(learner | null)`.

**Contract**: typ `SessionLearner`; funkcje czyste, miesiąc zawsze argumentem (żadnego `Date` w `core`).

#### 3. Testy

**File**: `tests/placement.test.ts` (nowy)

**Intent**: Oczekiwane etapy dla 12 miesięcy × 5 wieków wypisane w teście z ZADANIA §1 (niezależna wyrocznia, nie
odczyt danych); granice pasm (styczeń 0 vs luty 1, czerwiec 5 vs lipiec 6, sierpień 7 vs wrzesień 8); błędne wejścia;
flagi dziecka i rodzica (potwierdzenie propozycji, inny etap, E1 bez rozgrzewki); `needsPlacement`.

### Success Criteria:

#### Automated Verification:

- `tests/placement.test.ts` czerwony przed implementacją, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: styczeń w paśmie luty–czerwiec → test granic czerwony; `placeByParent` ustawia `overridden` także przy potwierdzeniu → czerwony; przywrócone; meta-check: oczekiwania pochodzą z tabeli dokumentu wpisanej w teście, nie z `placementData`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela: `src/data/placement.ts` porównane z `docs/ZADANIA.md` §1 wiersz po wierszu (wiek × pasmo); zapis w `reviews/teacher-read.md`

---

## Phase 2: Rozgrzewka — skład i korekta w dół

Driver: tdd
Driver why: skład rozgrzewki i reguła korekty nie istnieją; failing testy (skład na wszystkich etapach × ziarna, próg pierwszej próby, nigdy w górę) prowadzą implementację.

### Overview

Rozgrzewka = 6 zadań: 3 z poprzedniego etapu, potem 3 z pierwszych 2 grywalnych kroków bieżącego; korekta o jeden etap
w dół przy < 4 poprawnych za pierwszym razem. Liczby w `balance.warmup`.

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `warmup: { length: 6, previousCount: 3, currentSteps: 2, minFirstTry: 4 }` z komentarzem (ZADANIA §1 nie
podaje liczb — luka dokumentu, wiersz `[human]`).

**Contract**: tylko stałe.

#### 2. Logika

**File**: `src/core/round/warmup.ts` (nowy), `src/core/round/pick.ts`

**Intent**: `firstPlayableSteps(stage, n)` w `pick.ts` (kroki z ≥ 1 grywalną umiejętnością, w kolejności) obok
`playable`; `buildWarmup(stage, previous, rng, rules, tileCount)` → `previousCount` zadań z `pickSkills(previous, …)` +
reszta z `pickSkills({ ...stage, steps: firstPlayableSteps(stage, currentSteps) }, …)`, poprzedni etap najpierw;
`warmupResult(stage, outcomes, minFirstTry)` → `previousStage(stage) ?? stage`, gdy `outcomes === 'first'` < próg, inaczej
`stage`.

**Contract**: `buildWarmup(stage: StageDef, previous: StageDef, rng: Rng, opts: { length; previousCount; currentSteps }, tileCount: number): Task[]`; `warmupResult(stage: StageId, outcomes: readonly (Outcome | null)[], minFirstTry: number): StageId`.

#### 3. Sample i testy

**File**: `scripts/sample.ts`, `tests/warmup.test.ts` (nowy)

**Intent**: `npm run sample -- E3 --warmup` drukuje 6 zadań rozgrzewki etapu (E1 → komunikat „bez rozgrzewki”) do odczytu
nauczyciela. Testy: dla E2–E6 × 20 ziaren — długość 6, pierwsze 3 umiejętności z poprzedniego etapu, ostatnie 3 z
pierwszych 2 grywalnych kroków bieżącego (`forEachDraw`-podobnie), zadania przechodzą `validateTask`; `warmupResult`:
3 pierwsze próby → etap −1, 4 i 6 → bez zmiany, E1 → E1, nigdy wyżej, nigdy o dwa.

### Success Criteria:

#### Automated Verification:

- `tests/warmup.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `buildWarmup` z pełnego bieżącego etapu (bez przycięcia kroków) → test składu czerwony; próg `<=` zamiast `<` → test „4 zostaje” czerwony; przywrócone; meta-check: skład sprawdzany na prawdziwych `stages`, nie na atrapie
- `npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0`; `npm run sample -- E3 --warmup` drukuje 6 zadań
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E2 … E6 --warmup`: rozgrzewka to zadania „już przerobione” (poprzedni etap) i z początku bieżącego, sensowny start dla dziecka we wrześniu; zapis w `reviews/teacher-read.md`

---

## Phase 3: Bramka dla dorosłego — działanie i wpisywanie cyfr

Driver: tdd
Driver why: `src/core/parentGate.ts` nie istnieje; failing testy (zakres czynników poza programem E1–E6, sprawdzenie odpowiedzi, edycja cyfr) prowadzą implementację.

### Overview

Czysta logika bramki: losowanie działania, sprawdzenie, stan pola cyfr. DOM w fazie 5.

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `parentGate: { factorMin: 13, factorMax: 19, maxDigits: 3 }` (dwucyfrowa × dwucyfrowa, poza mnożeniem E6
„6 · 12, 4 · 70”; wynik 169–361).

**Contract**: tylko stałe.

#### 2. Logika

**File**: `src/core/parentGate.ts` (nowy)

**Intent**: `createChallenge(rng, range)` → `{ a, b }` z `[factorMin, factorMax]`; `checkAnswer(challenge, digits)`;
`gateInput(digits, key, maxDigits)` (`'0'`–`'9'` dopisuje do limitu, `'back'` kasuje ostatnią; brak zera wiodącego).
Zła odpowiedź nie liczy prób i nie blokuje (brak stanów porażki).

**Contract**: `GateChallenge`, `GateKey = '0' | … | '9' | 'back'`; funkcje czyste z `Rng` (`src/core/rng.ts`).

#### 3. Testy

**File**: `tests/parentGate.test.ts` (nowy)

**Intent**: 1000 losowań (`tests/helpers.ts`): oba czynniki w zakresie, żaden wielokrotnością 10, iloczyn > 100;
`checkAnswer` dla poprawnej, złej, pustej odpowiedzi; `gateInput` (limit cyfr, kasowanie na pustym, zero wiodące).

### Success Criteria:

#### Automated Verification:

- `tests/parentGate.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `factorMin` 2 w teście zakresu (czynnik jednocyfrowy) → czerwony; `gateInput` bez limitu → czerwony; przywrócone; meta-check: zakres czytany z `balance.parentGate`, test sprawdza własność (dwucyfrowe, nieokrągłe), nie liczby z balansu
- Pełna bramka lokalna zielona

---

## Phase 4: Powitanie, szew Boot → Welcome → Task i helper e2e

Driver: impl
Driver why: nowa scena i widżet nad logiką z fazy 1 plus sklejka haka i istniejących speców; czerwone/zielone daje test układu i istniejące specy e2e.

### Overview

Nowe komponenty: `WelcomeScene` (kit `welcome.png`: marka `pl.title`, „Ile masz lat?”, 5 przycisków) i `AgeButton`
(218×190). Stuknięcie wieku = ścieżka dziecka (`placeByChild`) → `TaskScene` na etapie ucznia. Rozgrzewka jeszcze
nie gra (pole `warmupPending` ignorowane do fazy 6). `balance.defaultStage` znika.

### Changes Required:

#### 1. Tokeny, klucze, teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `SCENE_KEYS.welcome`, `REGISTRY_KEYS.learner`, `REGISTRY_KEYS.month` (miesiąc sesji 0–11); `WELCOME_LAYOUT` z kitu (marka top 64, 62 px, 800; pytanie
top 290, 86 px, 750; wiek left 363, top 526, 218×190, odstęp 28, promień 38, ramka 5, cyfry 112 px); kolory
`#f8fff0`/`#dceecf`/`#abc49b` w `PLACEHOLDER_COLORS`; `WELCOME_TOUCH_TARGETS`. `pl.welcome.question` „Ile masz lat?”;
marka = `pl.title` (zamyka follow-up S-05).

**Contract**: tylko stałe.

#### 2. Sceny i widżet

**File**: `src/scenes/WelcomeScene.ts`, `src/ui/widgets/AgeButton.ts` (nowe), `src/scenes/BootScene.ts`, `src/scenes/TaskScene.ts`, `src/main.ts`, `src/data/balance.ts`, `tests/round.test.ts`

**Intent**: `AgeButton` reaguje w `pointerup` po wciśnięciu na sobie (wzorzec `PageButton`), ma `target()`.
`WelcomeScene`: rysuje kit (kwiat i poduszkę pomija — DESIGN-GAP), stuknięcie wieku → `placeByChild(age,
registry.get(REGISTRY_KEYS.month), placementData)` → `registry.set(learner)` → `scene.start(task)`; `targets()` → środki przycisków
z wiekiem. `BootScene.create` → `needsPlacement(registry.get(learner) ?? null) ? welcome : task`. `TaskScene.create` bierze
etap z ucznia (`getStage(learner.stage)`, błąd, gdy ucznia brak); `TaskSnapshot.stage`. `main.ts`: `WelcomeScene` w liście
scen (po `BootScene`); w `callbacks.preBoot` obok lektora `registry.set(REGISTRY_KEYS.month, month)`, gdzie
`month = (__E2E_HOOK__ ? e2eMonth(location.search) : null) ?? new Date().getMonth()` (scena nie woła `Date`). Usunąć
`balance.defaultStage` i jego asercję w `tests/round.test.ts` (`describe('balance')` — inaczej typecheck i unit czerwone).

**Contract**: `WelcomeScene.targets(): { ages: (Point & { age: number })[] }`; żadnego tekstu ani liczby balansu w scenie.

#### 3. Hak i helper e2e

**File**: `src/testing/e2eHook.ts`, `tests/e2e/support/welcome.ts` (nowy), `tests/e2e/task-round.spec.ts`, `tests/e2e/narrator.spec.ts`

**Intent**: Hak: `screen: 'welcome' | 'task' | 'summary' | 'room'` — przy aktywnej `WelcomeScene` `snapshot` i `targets`
nie wołają ani `task()`, ani `ui()` (`UIScene` jeszcze nie działa, `counter`/`speaker` niezainicjowane — getter rzuciłby, a
`readHook` zwróciłby `null` na zawsze); `e2eMonth(search): number | null` w tym samym module (`?e2eMonth=0..11`, inaczej
`null`; czyste parsowanie, nie zapisuje stanu gry); `learner` (kopia z rejestru albo `null`); `targets.ages`; przy otwartym pokoju `nextRound`/`toRoom`
→ `null` (follow-up S-05). Helper `passWelcome(page)` (moduł bez `.spec`): `goto('/?e2eMonth=9')` (październik; bez
`page.clock` — zamroziłby tweeny Phasera, F1), czeka na `screen === 'welcome'`, stuka wiek 8 przez `page.touchscreen.tap` (→ E3, jak dziś), czeka na
rundę. Oba specy używają helpera; tytuł testu lektora „silent at a cold start” przeformułowany („silent when the first
E3 round opens”).

**Contract**: hak tylko do odczytu, zamrożone kopie; znacznik `__martynkaE2E` tylko w `src/testing/e2eHook.ts`.

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts` obejmuje `WELCOME_TOUCH_TARGETS` (≥ `MIN_TOUCH_TARGET`, w scenie, bez nakładania); unit `<baseline gałęzi> + N`
- Deliberate break: wysokość przycisku wieku 90 → test układu czerwony; `BootScene` zawsze do `task` → `npx playwright test` czerwony (helper nie widzi powitania); przywrócone; meta-check: test układu czyta stałą widżetu, przejście scen dowodzą specy
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (te same testy przez helper); `npm run build` drukuje `e2e hook: absent`, a `grep -rl e2eMonth dist/` pusty
- `grep -rn defaultStage src/` pusty
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.welcome` (kopia z kitu „Ile masz lat?”) i marki
- [visual] Zrzut welcome przy 1440×900 i 1024×768; porównanie z `designs/martynka-maths-A-v1/screenshots/welcome.png`

---

## Phase 5: Bramka i panel rodzica w DOM (przycisk „Rodzic”)

Driver: impl
Driver why: nakładki DOM i sklejka sceny nad logiką z faz 1 i 3; dotyk przez nakładkę dowodzi e2e fazy 9.

### Overview

Nowe komponenty: `parentGate` (dialog: działanie, odczyt wpisanych cyfr, klawiatura 0–9, „⌫”, „OK”, „Anuluj”) i
`stagePanel` (wiek 6–10, etapy E1–E6 z opisem, propozycja oznaczona, „Zatwierdź”, „Anuluj”). „Rodzic” na powitaniu
(istniejący `PageButton`, wariant drugorzędny) otwiera bramkę, scena pod spodem bez wejścia.

### Changes Required:

#### 1. Tokeny, teksty, style

**File**: `src/data/layout.ts`, `src/data/pl.ts`, `src/style.css`

**Intent**: `WELCOME_LAYOUT.parent` (prawy dolny róg, ≥ 96 px) w `WELCOME_TOUCH_TARGETS`. `pl.parent`: „Rodzic”,
„Pytanie dla rodzica”, `gatePrompt(a, b)` „Ile to jest a · b?”, „To nie ta liczba. Spróbuj z nowym działaniem.”,
„Usuń” (etykieta „⌫”), „OK”, „Anuluj”, „Ustawienia startowe”, „Wiek dziecka”, „Etap nauki”, „propozycja”, „Zatwierdź”;
`pl.stages` E1–E6: „Klasa 1, I półrocze” … „Klasa 3, II półrocze” (ZADANIA §1 „Etapy”). Style `.overlay-parent`
(`z-index: 15`, panel w górnej części ekranu, przyciski ≥ 64 CSS px, `:focus-visible`, `aria-pressed` wyróżnione).

**Contract**: tylko stałe i CSS.

#### 2. Nakładki DOM

**File**: `src/ui/dom/parentGate.ts`, `src/ui/dom/stagePanel.ts` (nowe)

**Intent**: `openParentGate({ rng, onPass, onCancel })`: `role="dialog"`, `aria-modal`, `aria-labelledby`; działanie z
`createChallenge`, cyfry przez `gateInput`, odczyt w elemencie `aria-live="polite"`; „OK” → `checkAnswer`: dobrze →
zamknięcie i `onPass`, źle → nowe działanie, wyczyszczone pole, komunikat; klawisze cyfr/Backspace/Enter/Escape
(`keydown`); fokus na pierwszym przycisku. `openStagePanel({ month, onConfirm, onCancel })`: wybór wieku zaznacza i
oznacza propozycję (`proposeStage`), wybór etapu `aria-pressed`, „Zatwierdź” nieaktywne bez wieku; wynik
`placeByParent`. Obie zwracają funkcję zamykającą (sprzątanie nasłuchów).

**Contract**: moduły bez kodu na poziomie modułu; teksty z `pl`, liczby z `balance`; `openParentGate` gotowe do
ponownego użycia w S-08/S-12.

#### 3. Scena

**File**: `src/scenes/WelcomeScene.ts`

**Intent**: Przycisk „Rodzic”: `this.input.enabled = false` → bramka → panel (`month` z `REGISTRY_KEYS.month`) → `onConfirm(learner)` →
`registry.set(learner)` → `scene.start(task)`; „Anuluj” na bramce lub panelu → zamknięcie i `input.enabled = true`.
Komentarze DESIGN-GAP (przycisk „Rodzic”, bramka, panel). `targets().parent`; hak: `targets.parent`.

**Contract**: scena nie zna treści bramki; tylko otwiera i odbiera wynik.

### Success Criteria:

#### Automated Verification:

- Test układu obejmuje przycisk „Rodzic” (≥ `MIN_TOUCH_TARGET`, nie nachodzi na przyciski wieku); unit `<baseline gałęzi> + N`
- Deliberate break: „Rodzic” 90 px → test układu czerwony; przywrócone; meta-check: wyłączenia wejścia pod nakładką ten test nie dowodzi — dowodzi go e2e fazy 9 (test „dotyk nie przechodzi”)
- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`; helper dalej ścieżką dziecka)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela/rodzica `pl.parent` i `pl.stages`: krótko, poprawnie, spokojny komunikat po złej odpowiedzi (bez „błąd”), opisy etapów zgodne z ZADANIA §1; zapis w `reviews/teacher-read.md`
- [visual] Zrzuty: welcome z „Rodzic”, bramka, bramka po złej odpowiedzi (nowe działanie + komunikat), panel bez wieku, panel z wiekiem (propozycja zaznaczona), panel z innym etapem — przy 1440×900 i 1024×768
- [human] iPad (Safari, PWA): bramka i panel czytelne w poziomie, klawiatura cyfr DOM działa palcem, stuknięcie w nakładkę nie wciska wieku pod spodem

---

## Phase 6: Rozgrzewka w TaskScene, auto-czytanie po powitaniu, helper na ścieżkę rodzica

Driver: impl
Driver why: sklejka sceny nad `buildWarmup`/`warmupResult` (faza 2) bez nowych komponentów; dowodzi istniejący spec #11 (przerwa) i e2e fazy 8.

### Overview

Gdy uczeń ma `warmupPending`, pierwsza runda to rozgrzewka (6 kropek, gwiazdki jak w rundzie). Po jej końcu cicha
korekta etapu. Pierwsze zadanie po powitaniu czytane automatycznie, gdy `autoRead`. Helper e2e przechodzi na ścieżkę
rodzica, bo ścieżka dziecka gra teraz rozgrzewkę.

### Changes Required:

#### 1. Scena zadań

**File**: `src/scenes/TaskScene.ts`, `src/ui/widgets/SummaryPanel.ts`

**Intent**: `create`: `warmup = learner.warmupPending && previousStage(stage) !== null`; pierwsza runda z `buildWarmup` i
`RoundRules` `{ ...balance.round, length: balance.warmup.length }`; po pierwszym `render` `autoReadFirst()` (gest stuknięcia
w canvas już był; lektor bez odblokowania milczy). `advance`: przy przejściu w `finished` w rozgrzewce →
`warmupResult(stage.id, outcomes, balance.warmup.minFirstTry)` → uczeń w rejestrze (`stage`, `warmupPending: false`),
`this.stage`, `this.autoRead`, `warmup = false`. Kolejne rundy przez `freshRound` na nowym etapie. `TaskSnapshot.warmup`.
`SummaryPanel`: lewa krawędź rzędu gwiazdek z liczby gwiazdek (5 → `SUMMARY_LAYOUT.stars.left`). DESIGN-GAP: szósta
kropka i szósta gwiazdka.

**Contract**: scena nie liczy progu ani składu — tylko woła `core`.

#### 2. Helper e2e

**File**: `tests/e2e/support/welcome.ts`

**Intent**: `passWelcome(page)` = ścieżka rodzica: „Rodzic” (`targets.parent`, `touchscreen.tap`) → bramka: działanie z
tekstu DOM (`getByRole('dialog')`), wynik liczony w teście, cyfry `locator.tap()` → panel: wiek 10, etap „Klasa 2,
I półrocze” (E3 ≠ propozycja E6) → „Zatwierdź” → runda E3 bez rozgrzewki. Bez ustalonego zegara (wiek 10 → E6 w każdym
miesiącu). Odpowiedź bramki nigdy z haka.

**Contract**: specy #11 i lektora bez zmian poza helperem.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0`; unit `<baseline gałęzi> + 0` (logika w fazie 2)
- Deliberate break: helper na starej ścieżce dziecka (wiek 8, październik → E3 + rozgrzewka) → `task-round.spec.ts` czerwony (runda ma 6 zadań, nie 5); przywrócone; meta-check: czerwień dowodzi, że ścieżka dziecka naprawdę uruchamia rozgrzewkę w scenie — cytat w handoff §3
- Pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty: rozgrzewka (6 kropek) na task-tiles, podsumowanie rozgrzewki (6 gwiazdek wyśrodkowanych), zwykła runda po rozgrzewce (5 kropek) — przy 1440×900 i 1024×768
- [human] iPad: czy pierwsze zadanie E1/E2 po stuknięciu wieku jest czytane automatycznie (gest w `pointerup` canvasu)

---

## Phase 7: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–6, bez nowej logiki.

### Overview

Luki projektu, follow-upy, gołe liczby w widżetach (follow-up S-05), `CLAUDE.md`, przegląd szwów i wiersze decyzji.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: Wiersze 15+: przycisk „Rodzic” na powitaniu; bramka dla dorosłego; panel startowy (wiek + etap); szósta
kropka i szósta gwiazdka rozgrzewki; brak sztuki powitania (kwiat, poduszka); „tryb z obrazkami” dla 6 lat pominięty.
Każdy z komentarzem `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/first-launch-placement/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — ryzyko #12 do test-planu (`/10x-test-plan refresh`, treść z research §5); `mountInstallHint`
przepuszcza dotyk do rundy (następna zmiana `src/ui/dom` lub `src/pwa`); S-11: zapis `SessionLearner` z `warmupPending`
i `needsPlacement` na wczytanym stanie (powitanie tylko przy pierwszym uruchomieniu); S-08: zmiana etapu za tym samym
`openParentGate`; „tryb z obrazkami” (S-14); decyzja opiekuna o wcześniejszym zapisie samego ucznia (roadmapa, przed
codziennym użyciem); to samo polecenie dwa razy w rozgrzewce (S-07).

#### 3. Gołe liczby, dokumentacja, seam sweep

**File**: `src/data/layout.ts`, `src/ui/widgets/Keypad.ts`, `src/ui/widgets/RoomSwitchButton.ts`, `src/scenes/TaskScene.ts`, `CLAUDE.md`, `AGENTS.md` (jeśli opisuje sceny), pliki faz 1–6

**Intent**: `lineStyle(3/4, …)` w `Keypad.paintButton`/`paintField`, `4 * u` w `RoomSwitchButton.draw`,
`ANIMATION.shakeMs / 6` w `TaskScene.shake` → tokeny w `layout.ts` bez zmiany wyglądu. Current state w `CLAUDE.md`:
powitanie, placement, rozgrzewka, bramka DOM, uczeń sesji, hak. Seam sweep: nieaktualne komentarze (`BootScene` „hands
over to the task scene”, `main.ts` lista scen, `TaskScene.autoReadFirst` „never at a cold start”), martwe klucze, duplikaty
(kolory przycisków wieku vs paleta), nieużywane eksporty.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: profil wskazuje nieistniejący plik → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta § 10 profilu
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–6; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; gołe liczby z follow-upu S-05 zastąpione tokenami
- [human] Decyzja orkiestratora wbrew dosłownemu FR-012: dziecko samo startuje grę na etapie z wieku; potwierdzenie rodzica jest opcjonalne (przycisk „Rodzic”), bramka strzeże tylko zmiany etapu
- [human] Odpowiedź na PRD Open Question 1: rozgrzewka pomijana, gdy rodzic wybrał inny etap; gra po potwierdzeniu propozycji i na ścieżce dziecka
- [human] Luka ZADANIA §1: skład rozgrzewki 3 + 3 (pierwsze 2 grywalne kroki), próg < 4 z 6 pierwszych prób, E1 bez rozgrzewki, korekta cicha
- [human] Do S-11 powitanie przy każdym zimnym starcie; dziecko przechodzi je samo, ale 7-latka z klasy 2 dostaje w październiku E1, dopóki rodzic nie przejdzie ścieżki „Rodzic” (przy każdym zimnym starcie)
- [human] Bramka: 13–19 × 13–19 na klawiaturze cyfr DOM — wystarczająco trudne dla dziecka, wystarczająco proste dla rodzica (playtest S-17)

---

## Phase 8: Pierwsze uruchomienie dziecka — e2e (#12, proposed)

Driver: e2e
Driver why: ryzyko #12 (proposed, test-plan refresh pending): ścieżka dotyku powitanie → rozgrzewka → korekta istnieje tylko w renderowanym UI i przejściach scen; zbudowane w fazach 4 i 6, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/first-launch.spec.ts` (projekt `chromium-hook`), miesiąc z `goto('/?e2eMonth=9')` (październik; nigdy `page.clock`, F1).

### Changes Required:

#### 1. Spec i projekt

**File**: `tests/e2e/first-launch.spec.ts` (nowy), `playwright.config.ts`

**Intent**: `ROUND_SPEC` obejmuje `first-launch`. Test 1: wiek 8 → `learner.stage` E3, `warmup` true, 6 zadań wszystkie
dobrze za pierwszym razem → podsumowanie 6 gwiazdek → etap E3, „Kolejna runda” → runda 5 zadań, `warmup` false. Test 2:
wiek 8, ≥ 3 pierwsze próby błędne (dalej dobrze) → po rozgrzewce `learner.stage` E2, następna runda na E2. Test 3: wiek 6 →
E1, bez rozgrzewki, runda 5 zadań. Tytuły z `#12 (proposed)`. Stuknięcia `page.touchscreen.tap`; etap z haka (stan),
liczby zadań z kropek/`index`.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `npx playwright test tests/e2e/first-launch.spec.ts`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/first-launch.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 3` passed
- Deliberate break: `TaskScene` nie stosuje `warmupResult` → test 2 czerwony; przywrócone; meta-check: unit `warmup.test.ts` zielone przy tej przerwie, więc spec dowodzi sklejki sceny — cytat czerwieni w handoff §3
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Phase 9: Ścieżka rodzica przez bramkę dotykiem — e2e (#12, proposed)

Driver: e2e
Driver why: ryzyko #12 (proposed, test-plan refresh pending): bramka DOM nad canvasem, przepuszczanie dotyku do Phasera i wybór etapu istnieją tylko w przeglądarce; zbudowane w fazach 5–6, kontrakt `E2E=on`.

### Overview

Testy ścieżki rodzica w tym samym specu, odpowiedź bramki liczona z tekstu DOM.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/first-launch.spec.ts`

**Intent**: Test 4: „Rodzic” → zła odpowiedź → nowe działanie (inny tekst), komunikat, brak blokady → dobra odpowiedź →
panel: wiek 8 (`?e2eMonth=9`) → propozycja E3 oznaczona → wybór „Klasa 2, II półrocze” (E4) → „Zatwierdź” → runda 5 zadań,
`learner` `{ stage: 'E4', stageOverriddenByParent: true }`, bez rozgrzewki. Test 5: potwierdzenie propozycji → rozgrzewka
(6 zadań). Test 6: przy otwartej bramce `touchscreen.tap` w punkt przycisku wieku spod nakładki (`targets.ages`) →
`learner` dalej `null`, `screen` `welcome`, bramka otwarta; „Anuluj” → stuknięcie wieku działa.

**Contract**: jak w fazie 8.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/first-launch.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 3` passed
- Deliberate break: `WelcomeScene` bez `input.enabled = false` przy bramce → test 6 czerwony; przywrócone; meta-check: unit i test układu zielone przy tej przerwie, więc test dowodzi przepuszczania dotyku Phasera — cytat czerwieni w handoff §3
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Tabela 12 miesięcy × 5 wieków (wyrocznia z dokumentu), granice pasm, flagi ucznia (`placement.test.ts`).
- Skład rozgrzewki na prawdziwych etapach E2–E6 × ziarna, próg, nigdy w górę/o dwa/poniżej E1 (`warmup.test.ts`).
- Bramka: 1000 losowań, sprawdzenie, edycja cyfr (`parentGate.test.ts`); stałe układu powitania (`layout.test.ts`).

### Integration Tests:

- `npm run sample -- E1..E6` i `--warmup`; `npm run build` ze strażnikiem haka; seed #8, #11, lektor przez wspólny helper,
  nowy spec #12 (proposed) w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty: welcome, bramka (przed/po złej odpowiedzi), panel (3 stany), rozgrzewka, podsumowanie 6 gwiazdek, runda po
   rozgrzewce — przy 1440×900 i 1024×768.
2. Odczyt nauczyciela: tabela, rozgrzewka (`--warmup`), `pl.welcome`, `pl.parent`, `pl.stages`.
3. iPad: bramka/panel palcem, brak przebicia dotyku, auto-czytanie pierwszego zadania E1/E2.

## Performance Considerations

Nakładki DOM tworzone przy otwarciu i usuwane przy zamknięciu; rozgrzewka losuje 6 zadań jak zwykła runda. Bez wpływu
na start (powitanie rysowane raz).

## Migration Notes

Brak: bez bazy danych (profil § 4). Uczeń sesji ma kształt pól `LearnerState` + `warmupPending`, żeby S-11 zapisał go
bez przekształceń.

## Known risks

- **Persona vs tabela**: ścieżka dziecka daje 7-latce z klasy 2 w październiku E1 (za łatwo) przy każdym zimnym starcie
  do S-11, chyba że rodzic przejdzie ścieżkę „Rodzic”. Wiersz `[human]` 7.8.
- **Gest na iOS**: auto-czytanie pierwszego zadania po stuknięciu wieku może milczeć na iPadzie (sticky activation
  niepotwierdzona); przepływ działa bez mowy. Wiersz `[human]` 6.5.
- **Bramka do rozwiązania na kartce**: zdeterminowane dziecko E6 może policzyć 17 · 14 pisemnie; PRD wymaga ochrony
  przed celowym wejściem — zakres w `balance.parentGate`, playtest S-17.
- **Miesiąc w e2e tylko przez `?e2eMonth`** (plan-review F1): `page.clock.setFixedTime`/`install` zamrażają tweeny
  Phasera 4 (`TweenManager.getDelta` na `Date.now()`); parametr działa wyłącznie w buildzie e2e (`__E2E_HOOK__`), produkcja
  go nie zawiera (`grep -rl e2eMonth dist/` w 4.3).
- **Dotyk DOM poza `#game-container`**: „Zatwierdź” w panelu (DOM) nie przechodzi przez `unlockSpeech` w `main.ts`; na
  ścieżce rodzica dla E1/E2 lektor może milczeć do pierwszego stuknięcia w canvas, jeśli nakładka jest poza kontenerem —
  bez szkody dla przepływu (`Narrator.speak` bez `unlock` jest bezpieczne: `safely`, brak wyjątku). Wiersz 6.5.
- **Helper e2e zależny od opisu etapu** („Klasa 2, I półrocze”): zmiana `pl.stages` wymaga zmiany helpera — świadomie,
  bo spec stuka to, co widzi rodzic.

## References

- Research: `context/changes/first-launch-placement/research.md`; change: `context/changes/first-launch-placement/change.md`
- PRD: `context/foundation/prd.md` FR-012, US-03, Access Control, Open Question 1
- Plan gry: `Martynka-urzadza.md` §2 p. 1, §4, §5, §7, §11 (M3), §13; `docs/ZADANIA.md` §1
- Test-plan: `context/foundation/test-plan.md` ryzyko #11 (+ proponowane #12, research §5); `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/screenshots/welcome.png`, `maths.css` (`.welcome-brand`, `.page-title`, `.age-buttons`), `style-guide.md`
- Follow-upy: `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` (`Trigger: S-06`)
- Format: `context/archive/2026-10-12-narrator-round-summary/plan.md`

## Autonomous decisions

1. **Dziecko samo startuje grę; potwierdzenie rodzica opcjonalne (decyzja orkiestratora, wiążąca).** Stuknięcie wieku
   = etap z tabeli, rozgrzewka, gra; „Rodzic” na powitaniu = bramka → panel (wiek + etap) → potwierdzenie lub zmiana.
   Wbrew dosłownemu FR-012 („rodzic … potwierdza lub zmienia etap przed startem”) → wiersz `[human]` 7.5. Odrzucone:
   bramka jako warunek startu (research §6 opcja 1 — każdy zimny start do S-11 wymagałby dorosłego, regresja na
   produkcji, bo każdy slice jest wdrażany); ekran „Graj / Rodzic” po wyborze wieku (dodatkowe stuknięcie dziecka bez
   zysku); `localStorage` (drugi format obok S-11). Dlaczego: każdy slice idzie na produkcję, zapis dopiero w S-11.
   Zmieniłoby: zapis ucznia przed S-06 albo opiekun woli bramkę jako warunek.
2. **Panel rodzica zawiera wybór wieku**, więc ścieżka rodzica sama realizuje FR-012 (wiek → propozycja → potwierdź/zmień).
   Odrzucone: panel tylko z etapami (brak wieku dla `LearnerState.age`), rodzic po stuknięciu wieku przez dziecko (gra już
   wystartowała). Zmieniłoby: S-11 — wiek zapamiętany, panel S-08 może go pominąć.
3. **PRD Open Question 1** (`change.md` decyzja 4): inny etap niż propozycja ⇒ `stageOverriddenByParent`, bez rozgrzewki;
   potwierdzona propozycja i ścieżka dziecka ⇒ rozgrzewka. → wiersz `[human]` 7.6. Zmieniłoby: autor wybierze
   „rozgrzewka zawsze” — jedna linia w `placeByParent`.
4. **Rozgrzewka uczciwa także bez dorosłego**: 3 z poprzedniego etapu + 3 z pierwszych 2 grywalnych kroków bieżącego,
   liczy się tylko pierwsza próba, próg < 4 z 6, tylko w dół o jeden, E1 bez rozgrzewki, korekta cicha, gwiazdki jak w
   rundzie (brak stanów porażki). Rozgrzewki nie da się pominąć ani wybrać na ścieżce dziecka. → `[human]` 7.7.
   Odrzucone: pełny bieżący etap (we wrześniu fałszywe błędy na krokach nieprzerobionych), widoczny komunikat „etap
   niżej”. Zmieniłoby: playtest S-17 albo dane S-07.
5. **Bramka 13–19 × 13–19** (research Open Q 1, opcja a w wąskim zakresie). Odrzucone: dwucyfrowa × jednocyfrowa
   (uczeń E6 rozłoży 37 · 8 na 30 · 8 + 7 · 8 — PRD chce ochrony przed celowym wejściem), szerszy zakres 13–29 (trudny
   dla części dorosłych). → `[human]` 7.9. Zmieniłoby: playtest S-17.
6. **Klawiatura cyfr w DOM zamiast `<input inputmode="numeric">`** (research Open Q 2). Odrzucone: klawiatura systemowa
   (`-webkit-user-select: none`, zasłania pół ekranu na iPadzie). Zmieniłoby: nic w tym slice.
7. **Auto-czytanie pierwszego zadania po powitaniu, gdy `autoRead`** (research Open Q 4): stuknięcie wieku w canvas
   odblokowało lektora. → `[human]` 6.5. Zmieniłoby: odsłuch na iPadzie pokaże milczenie — bez szkody dla przepływu.
8. **Uczeń sesji w `REGISTRY_KEYS.learner`, `balance.defaultStage` usunięte, rozgrzewka w tej samej `TaskScene`**
   (`change.md` decyzja 3). Odrzucone: `scene.start(key, data)`, osobna `WarmupScene`. Zmieniłoby: nic.
9. **Kolejność faz z helperem e2e w fazie 4 (ścieżka dziecka z `?e2eMonth=9`) i zmianą na ścieżkę rodzica w fazie 6**,
   żeby każda faza była zielona w całej bramce, łącznie z e2e. Odrzucone: helper dopiero w fazie e2e (fazy 4–7 czerwone).
   Zmieniłoby: nic.
10. **Ryzyko #12 cytowane jako „proposed, test-plan refresh pending”**; wpis do test-planu to follow-up, nie ten run.
11. **Odpowiedź bramki nigdy z haka**: spec czyta działanie z DOM jak dorosły. Hak tylko do odczytu (`screen`, `learner`,
    `warmup`, `stage`, `targets.ages`, `targets.parent`), nieobecny w produkcji (strażnik builda).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wiek + miesiąc → etap i uczeń sesji

#### Automated

- [x] 1.1 `tests/placement.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — d79ba20 (671 → 742, +71)
- [x] 1.2 Deliberate break: styczeń w złym paśmie / `overridden` przy potwierdzeniu → czerwony; przywrócone; meta-check (wyrocznia z dokumentu) — d79ba20
- [x] 1.3 Pełna bramka lokalna zielona — d79ba20 (e2e: orchestrator run, 8 passed, run-log S-06 p1)

#### Manual

- [x] 1.4 [reviewer] Odczyt nauczyciela: `src/data/placement.ts` vs `docs/ZADANIA.md` §1 (`reviews/teacher-read.md`) — impl-review (PASS, wiersz po wierszu)

### Phase 2: Rozgrzewka — skład i korekta w dół

#### Automated

- [x] 2.1 `tests/warmup.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 403644c (742 → 753, +11)
- [x] 2.2 Deliberate break: skład z pełnego etapu / próg `<=` → czerwony; przywrócone; meta-check (prawdziwe `stages`) — 403644c
- [x] 2.3 `npm run sample -- E1` … `-- E6` `Naruszenia: 0`; `--warmup` drukuje 6 zadań — 403644c
- [x] 2.4 Pełna bramka lokalna zielona — 403644c (e2e: orchestrator gate)

#### Manual

- [x] 2.5 [reviewer] Odczyt nauczyciela `sample -- E2 … E6 --warmup` (`reviews/teacher-read.md`) — impl-review (PASS)

### Phase 3: Bramka dla dorosłego — działanie i wpisywanie cyfr

#### Automated

- [x] 3.1 `tests/parentGate.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — e4920f3
- [x] 3.2 Deliberate break: czynnik jednocyfrowy / `gateInput` bez limitu → czerwony; przywrócone; meta-check (własność, nie liczby) — e4920f3
- [x] 3.3 Pełna bramka lokalna zielona — e4920f3 (e2e: orchestrator gate)

### Phase 4: Powitanie, szew Boot → Welcome → Task i helper e2e

#### Automated

- [x] 4.1 `tests/layout.test.ts` obejmuje `WELCOME_TOUCH_TARGETS`; unit `<baseline gałęzi> + N` — a51338d (761 → 764, +3)
- [x] 4.2 Deliberate break: przycisk wieku 90 px → test układu czerwony; `BootScene` zawsze do `task` → e2e czerwony; przywrócone; meta-check — a51338d (unit: `expected 90 to be greater than or equal to 96`; e2e: orchestrator, run-log "S-06 p4 impl", `Expected: "welcome" / Received: undefined` at tests/e2e/support/welcome.ts:34, restored)
- [x] 4.3 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); build `e2e hook: absent`, `grep -rl e2eMonth dist/` pusty — a51338d (orchestrator: e2e 8/8, grep empty, run-log "S-06 p4 impl")
- [x] 4.4 `grep -rn defaultStage src/` pusty — a51338d
- [x] 4.5 Pełna bramka lokalna zielona — a51338d (e2e: orchestrator gate)

#### Manual

- [x] 4.6 [reviewer] Odczyt nauczyciela `pl.welcome` i marki — impl-review (PASS, `reviews/teacher-read.md`)
- [ ] 4.7 [visual] Zrzut welcome przy 1440×900 i 1024×768 vs `welcome.png`

### Phase 5: Bramka i panel rodzica w DOM (przycisk „Rodzic”)

#### Automated

- [x] 5.1 Test układu obejmuje „Rodzic”; unit `<baseline gałęzi> + N` — 012867b (764 → 765, +1)
- [x] 5.2 Deliberate break: „Rodzic” 90 px → czerwony; przywrócone; meta-check (wejście pod nakładką → e2e fazy 9) — 012867b
- [x] 5.3 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`) — 012867b (orchestrator: e2e 8/8, run-log "S-06 p5 impl")
- [x] 5.4 Pełna bramka lokalna zielona — 012867b (e2e: orchestrator gate)

#### Manual

- [x] 5.5 [reviewer] Odczyt nauczyciela/rodzica `pl.parent` i `pl.stages` (`reviews/teacher-read.md`) — impl-review (PASS)
- [ ] 5.6 [visual] Zrzuty welcome z „Rodzic”, bramka, bramka po złej odpowiedzi, panel w 3 stanach przy 1440×900 i 1024×768
- [ ] 5.7 [human] iPad: bramka i panel palcem, brak przebicia dotyku do powitania

### Phase 6: Rozgrzewka w TaskScene, auto-czytanie po powitaniu, helper na ścieżkę rodzica

#### Automated

- [x] 6.1 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); unit `<baseline gałęzi> + 0` — 96674ca (orchestrator: e2e 8/8, run-log "S-06 p6 impl"; unit 765 = +0)
- [x] 6.2 Deliberate break: helper na ścieżce dziecka → `task-round.spec.ts` czerwony (6 zadań); przywrócone; meta-check (rozgrzewka startuje w scenie) — 96674ca (orchestrator, run-log "S-06 p6 impl": `Expected: "summary" / Received: "task"` at tests/e2e/task-round.spec.ts:116, restored)
- [x] 6.3 Pełna bramka lokalna zielona — 96674ca (lint, typecheck, unit 765 = +0, deploy/ops, sample E1-E6 Naruszenia: 0, build e2e hook: absent; e2e: orchestrator gate)

#### Manual

- [ ] 6.4 [visual] Zrzuty rozgrzewka (6 kropek), podsumowanie 6 gwiazdek, runda po rozgrzewce przy 1440×900 i 1024×768
- [ ] 6.5 [human] iPad: auto-czytanie pierwszego zadania E1/E2 po stuknięciu wieku

### Phase 7: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [x] 7.1 `validate-rule-files.sh` PASS — PASS (rule files: 4, missing: 0)
- [x] 7.2 Deliberate break: profil wskazuje nieistniejący plik → FAIL; przywrócone; meta-check — `RULE_FILES` w `autonomous-run.env` + `NOPE.md` ⇒ `missing: 1`, FAIL; przywrócone, PASS (walidator czyta listę z profilu, nie stały zestaw)
- [x] 7.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — (lint, typecheck, unit 765 = +0, deploy/ops, sample E1-E6 Naruszenia: 0, build e2e hook: absent; e2e: orchestrator gate)

#### Manual

- [x] 7.4 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze; DESIGN-GAP w kodzie i w `docs/design-gaps.md`; gołe liczby z follow-upu S-05 — a6f091b (nieaktualne komentarze poprawione; duplikaty helperów e2e → follow-up F2; wiersz 21 bez komentarza zaakceptowany, `reviews/impl-review.md`)
- [ ] 7.5 [human] Decyzja orkiestratora wbrew FR-012: dziecko startuje samo na etapie z wieku, potwierdzenie rodzica opcjonalne
- [ ] 7.6 [human] Odpowiedź na PRD Open Question 1: bez rozgrzewki po zmianie etapu przez rodzica
- [ ] 7.7 [human] Luka ZADANIA §1: skład 3 + 3, próg < 4 z 6, E1 bez rozgrzewki, korekta cicha
- [ ] 7.8 [human] Do S-11 powitanie przy każdym zimnym starcie; 7-latka z klasy 2 dostaje E1 na ścieżce dziecka
- [ ] 7.9 [human] Bramka 13–19 × 13–19 na klawiaturze cyfr DOM (playtest S-17)

### Phase 8: Pierwsze uruchomienie dziecka — e2e (#12, proposed)

#### Automated

- [x] 8.1 `npx playwright test tests/e2e/first-launch.spec.ts` zielony; pełne e2e `<baseline gałęzi e2e> + 3` — 26f0787 (orchestrator: spec 3/3, suite 11/11)
- [x] 8.2 Deliberate break: `TaskScene` bez `warmupResult` → test 2 czerwony; przywrócone; meta-check (unit zielone) — 26f0787 (orchestrator: red at first-launch.spec.ts:169 Expected stage "E2", Received "E3")
- [x] 8.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite — 26f0787 (lint, typecheck, unit 765, build e2e hook absent; orchestrator e2e 11/11)

### Phase 9: Ścieżka rodzica przez bramkę dotykiem — e2e (#12, proposed)

#### Automated

- [x] 9.1 `npx playwright test tests/e2e/first-launch.spec.ts` zielony; pełne e2e `<baseline gałęzi e2e> + 3` — 3320b20 (orchestrator: spec 6/6, suite 14/14)
- [x] 9.2 Deliberate break: `WelcomeScene` bez `input.enabled = false` przy bramce → test 6 czerwony; przywrócone; meta-check (unit zielone) — 3320b20 (orchestrator: red at first-launch.spec.ts:286 expect(blocked.learner).toBeNull())
- [x] 9.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite — 3320b20 (lint, typecheck, unit 765, build e2e hook absent; orchestrator e2e 14/14)
