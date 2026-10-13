# Ustawienia rodzica: zmiana etapu, auto-czytanie i podgląd postępów za bramką — Implementation Plan

## Overview

Roadmapa S-08 (`parent-settings-progress`, M3, zamyka M3; PRD FR-015, US-03, Access Control, FR-009). W HUD (`UIScene`,
nad zadaniem, podsumowaniem, kartą i pokojem) pojawia się mała, wyciszona ikona ustawień w prawym dolnym rogu, poza
notesem. **Przytrzymanie jej przez 2000 ms** bez zjechania palcem dalej niż 30 px gry otwiera bramkę dla dorosłego
z S-06 (`openParentGate`, bez zmian), a po niej **panel ustawień rodzica** (DOM, na `openDialog`): wybór etapu (ta sama
grupa przycisków co w panelu startowym S-06, wydzielona do wspólnego kawałka), przełącznik automatycznego czytania
(włączone / wyłączone) i **zwięzły podgląd postępów**: „Krok N z M” bieżącego etapu z tytułem kroku oraz do 3 najsłabszych
umiejętności z opanowaniem i do 2 przykładów błędów (polecenie, odpowiedź dziecka, poprawna). „Zatwierdź” zmienia etap od
razu (otwarta runda zastąpiona świeżą rundą nowego etapu, gwiazdki zostają) i zapisuje wybór auto-czytania w sesji.
Pod dialogami gra nie dostaje żadnego dotyku: jeden globalny licznik wyłączający `game.input`, którego używają też
powitanie (S-06) i podpowiedź instalacji (follow-up S-06: dziś przepuszcza stuknięcia do rundy). Do S-11 wszystko żyje
w sesji.

## Current State Analysis

Z `context/changes/parent-settings-progress/research.md` (commit `db487d2`) i odczytu kodu w tym kroku
(`feat/parent-settings-progress` @ `965c602`):

- `src/scenes/UIScene.ts`: licznik, głośnik, „Do pokoju”; komentarz klasy zakazuje strefy pełnoekranowej (Phaser
  `topOnly` zatrzymałby stuknięcie). `create()` wymusza `this.input.enabled = true`. Uruchamiana tylko z
  `TaskScene.create` (`scene.launch`), więc nie istnieje na powitaniu.
- `src/scenes/TaskScene.ts`: pole `autoRead` liczone z `defaultAutoRead` w `create` i `finishWarmup` (komentarz „a parent
  switch comes with S-08”); `create()` zeruje `sessionStars` i `REGISTRY_KEYS.stars` (restart sceny wykluczony);
  `beginRound` robi `sessionStars += state.starsEarned` przed `freshRound()`; `finishRound` buduje
  `results = tasks.map(... { skillId, outcome })` i woła `endRound`; `onWake = () => this.render()`; listener
  `GAME_EVENTS.toRoom` ze strażnikiem `this.sys.isSleeping()`.
- `src/core/round.ts` `answer(state, input)` porównuje i odrzuca wpisaną wartość; `RoundState` jej nie pamięta.
- `src/core/mastery.ts` `recordRound` dopisuje `{ skillId, ok, firstTry, at }` i tnie do `historyLength` (200);
  `SkillResult = { skillId, outcome }`. `src/core/curriculum.ts`: `currentStepOf` prywatne (`const`), `playableSteps`
  eksportowane, `endRound`, `RoundResult = SkillResult`.
- `src/core/placement.ts`: `SessionLearner = PlacedLearner & Adaptation & { pendingUnlock }`, `placeByParent`,
  `STAGE_ORDER`. `src/core/types.ts`: `Settings = { autoRead: boolean }`, `SaveState.settings`, `LearnerState.history`.
- `src/core/narration/voice.ts` `defaultAutoRead(stageId, stages)`; `balance.narrator.autoReadStages = ['E1','E2']`.
- `src/ui/dom/dialog.ts` `openDialog` (rola dialog, pułapka fokusu, Escape → `onEscape`; `close()` bez callbacków);
  `src/ui/dom/parentGate.ts` `openParentGate`; `src/ui/dom/stagePanel.ts` `openStagePanel` (wiek + etap, tytuł
  „Ustawienia startowe”, grupa etapów inline z `group('stage', …)` i tagiem „propozycja”).
- `src/scenes/WelcomeScene.ts` `openParent`: `this.input.enabled = false` tylko dla powitania, `resume` w `onCancel`.
- `src/pwa/installHint.ts` `mountInstallHint(parent, platform, standalone)` niczego nie wyłącza (follow-up S-06).
- `src/testing/e2eHook.ts` `installE2EHook`: gettery `snapshot`/`targets`, głęboko zamrożony `learner`; strażnik buildu
  `vite/e2eHookGuard.mjs`. `REGISTRY_KEYS` (`src/data/layout.ts`): `stars`, `narration`, `narrator`, `roomSwitch`,
  `learner`, `month`. `HUD_LAYOUT` (`speaker`, `roomSwitch`), `HUD_TOUCH_TARGETS`, `MIN_TOUCH_TARGET = 96`,
  `TASK_LAYOUT.notebook` x 180–1740, y 204–992.
- E2E: `playwright.config.ts` `ROUND_SPEC = /(task-round|narrator|first-launch|adaptive)\.spec\.ts/` (projekt
  `chromium-hook`, port 4397, `hasTouch`). `tests/e2e/support/hook.ts` (S-07) ma `readHook`, `fromHook`, `snapshot`,
  `targets`, `tapScene`, `screenIs`, `tapTarget`, `answerRight`, `playTaskRight`, `playRoundRight` i prywatne
  `tapNumber`; kopie zostały w `task-round.spec.ts`, `first-launch.spec.ts`, `narrator.spec.ts` (oraz `answerWrong`,
  `phaseIs`, `tapNext`, ciche `speechSynthesis` w `addInitScript`); kroki bramki `gateProblem`, `typeIntoGate`,
  `openGate` są lokalne w `first-launch.spec.ts`. `narrator.spec.ts` ma już surowy CDP `Input.dispatchTouchEvent`.
- Brak jsdom/happy-dom: DOM S-06 pokrywa tylko e2e. `context/foundation/lessons.md` nie istnieje.
- Baseline (kontrakt): `main` @ `bfbd18a`: unit 881, e2e 15. Każda faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Ikona ustawień 96×96 w HUD (x 1782–1878, y 952–1048) widoczna nad zadaniem, podsumowaniem, kartą i pokojem; krótkie
  stuknięcie, przytrzymanie < 2000 ms, zjechanie > 30 px gry albo `touchcancel` — nic, bez żadnej informacji zwrotnej.
- Przytrzymanie ≥ 2000 ms → bramka S-06 (palec może jeszcze leżeć; podniesienie nie wciska niczego w dialogu) → panel
  „Ustawienia rodzica”. Pod oboma dialogami gra nie dostaje dotyku, lektor milknie; po zamknięciu wejście wraca.
- Panel: etapy (zaznaczony bieżący), auto-czytanie (zaznaczona wartość efektywna), podgląd postępów, „Zatwierdź”,
  „Anuluj” (i Escape). Podgląd: „Krok N z M: <tytuł kroku>”, do 3 najsłabszych umiejętności bieżącego etapu (tytuł kroku,
  opanowanie N/5, do 2 przykładów błędów) albo stan pusty.
- „Zatwierdź” z innym etapem: `learner.stage` nowy, `stageOverriddenByParent: true`, bez rozgrzewki, `pendingUnlock: null`,
  łagodzenie wyzerowane, opanowanie i historia zachowane; otwarta runda (także rozgrzewka, podsumowanie, karta)
  zastąpiona świeżą rundą nowego etapu, licznik gwiazdek bez zmian. Z pokoju — przy powrocie.
- Auto-czytanie: wybór rodzica (`settings.autoRead: true | false`) wygrywa i trwa przy zmianie etapu; bez wyboru (`null`)
  domyślna etapu (E1–E2 wł.).
- Hak e2e (tylko build e2e): `targets.settingsIcon`, `snapshot.settings`, `snapshot.inputEnabled`; build produkcyjny dalej
  `e2e hook: absent`. Spec `tests/e2e/parent-settings.spec.ts` (#14, proposed) przez dotyk.

### Key Discoveries:

- Phaser 4.2.1 nie ma `pointercancel` na obiekcie: `touchcancel` daje zwykły `pointerup` z `pointer.wasCanceled = true`
  (`Pointer.touchcancel`) — scena tłumaczy go na zdarzenie `cancel` maszyny.
- `InputPlugin.isActive` wymaga `manager.enabled`, a słuchacze okna `TouchManager` sprawdzają `manager.enabled` — jeden
  przełącznik `game.input.enabled` obejmuje wszystkie sceny (także śpiącą `TaskScene`) i nakładki DOM.
- `openDialog().close()` nie woła callbacków — przywrócenie wejścia idzie przez `onCancel`/`onConfirm`/Escape.
- Gwiazdki otwartej rundy są już na liczniku (`syncStars`), ale nie w `sessionStars` — zmiana etapu musi je dodać jak
  `beginRound`, inaczej licznik spadnie.
- Opanowanie 0 to zarówno „nigdy nie grane”, jak i „grane, < 3 dobrze” — ranking „najsłabszych” bierze tylko umiejętności
  z ≥ 1 błędem w pierwszej próbie.
- 22 z 48 grywalnych kroków ma > 1 grywalną umiejętność — tytuł kroku nie identyfikuje umiejętności; przykład błędu tak.

## What We're NOT Doing

- Trwałość (S-11): etap rodzica, auto-czytanie i historia żyją w sesji; zimny start = powitanie od nowa. Żadnego
  `localStorage`.
- Eksport, import, reset (S-12) — panel nie ma dla nich miejsca ani przycisków.
- Pełna tabela opanowania (FR-015 ją wyklucza); nowe etykiety umiejętności w `src/data/` (`SkillDef.label`).
- Zapis częściowej rundy przerwanej zmianą etapu do opanowania (odpowiedzi przerwanej rundy przepadają).
- Ikona na powitaniu (tam jest „Rodzic” z S-06); pasek postępu przytrzymania; gest wielopalcowy.
- Zmiana `pendingUnlock` na `{ stage, step }` (czyścimy przy zmianie etapu; typ zostaje dla S-11).
- Ręczna edycja `context/foundation/test-plan.md` i `test-stack.md` (ryzyko #14 → follow-up).
- Nowa zależność do testów DOM (happy-dom/jsdom): DOM pokrywa e2e, jak w S-06.
- `stopPropagation` w `openDialog` (`Trigger: first Phaser keyboard input` — S-08 nie dodaje klawiatury Phasera).
- E2E w CI, WebKit/iPad (ręcznie).

## Implementation Approach

Faza 1 to czysty refaktor helperów e2e (follow-up F2 S-06) bez zmiany asercji — kolejne fazy e2e na nim stoją. Fazy 2–5
to czysta logika w `src/core/` test-first: maszyna przytrzymania i licznik wstrzymania wejścia; ustawienia sesji
i zmiana etapu przez rodzica; pierwsza zła odpowiedź i przykłady w historii; podgląd postępów (bieżący krok, ranking).
Faza 6 skleja to w scenach bez nowych komponentów (globalne wstrzymanie wejścia, efektywne auto-czytanie, zmiana etapu
w `TaskScene`, przykłady do historii, hak). Faza 7 dodaje dwa komponenty: ikonę z przytrzymaniem w `UIScene` i panel
ustawień (etap + auto-czytanie, wspólna grupa etapów); faza 8 jeden: podgląd postępów w panelu. Faza 9 to seam sweep,
luki projektu, follow-upy i wiersze `[human]`. Fazy 10–11 to e2e ryzyka #14 (proposed).

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**. Faza 10 poszerza
`ROUND_SPEC` w `playwright.config.ts` o `parent-settings` (ta sama komenda `npx playwright test`; wpis `webServer`
aplikacji nietknięty).

**Szew sesji.** Rejestr gry zostaje magistralą: `REGISTRY_KEYS.learner` (`SessionLearner`) i nowy
`REGISTRY_KEYS.settings` (`Settings` z `autoRead: boolean | null`). Wszystkie przejścia to czyste funkcje w `core`; sceny
czytają wartości w chwili użycia. Stan dialogu należy do `UIScene` (jedyna scena obecna nad zadaniem i pokojem).

## Critical Implementation Details

**Maszyna przytrzymania (kontrakt dla faz 2 i 7).** `LongPressState = { kind: 'idle' } | { kind: 'holding'; id: number;
x: number; y: number; since: number } | { kind: 'fired'; id: number }`. Zdarzenia: `down(id, x, y, now)`,
`move(id, x, y)`, `up(id)`, `cancel()`, `tick(now)`, `reset()`. `down` przy `holding` innego palca → `idle` (dwa palce to
nie gest rodzica). `move` dalej niż `moveTolerance` od punktu startu (odległość euklidesowa w px gry) → `idle`. `tick`
przy `now − since ≥ holdMs` → `fired` i wynik `fire: true` **dokładnie raz**; `fired` ignoruje wszystko poza
`up`/`cancel`/`reset` (→ `idle`). Zdarzenia innego `id` niż trzymany są ignorowane. Czas zawsze argumentem (`time.now`
z `UIScene.update`), nigdy `pointer.downTime`/`getDuration()` (mieszają `event.timeStamp` z zegarem pętli).

**Kolejność zmiany etapu w `TaskScene` (faza 6).** Strażnik na wejściu (plan-review F3): `learner.stage ===
this.stage.id` → nic (zatwierdzenie samego auto-czytania albo tego samego etapu nie przerywa rundy); `UIScene` emituje
`GAME_EVENTS.parentStage` tylko, gdy `changeStageByParent` zwrócił inny obiekt. Dalej: `narrator.cancel()` → `tweens.killTweensOf(cameras.main)` i
`cameras.main.scrollX = 0` → `this.stage = getStage(learner.stage)`, `this.warmup = false`, `this.unlockShown = false` →
`sessionStars += state.starsEarned` → `state = freshRound()`, `shownIndex = -1` → `syncStars`-owy zapis licznika bez
lotu → `render()` → `autoReadFirst()` tylko gdy scena nie śpi. Dodanie gwiazdek **przed** `freshRound()`; po ukończonej
rundzie (podsumowanie na ekranie) `starsEarned` zawiera już premię, a `finishRound` się wykonał — jedno dodanie jest
poprawne. Wyzwalacz: zdarzenie `GAME_EVENTS.parentStage` z `UIScene` (słuchacz ze strażnikiem `isSleeping`, jak
`toRoom`) oraz porównanie `learner.stage !== this.stage.id` w `onWake`. **Nie** `changedata-learner`: `finishWarmup`
zapisuje ucznia z nowym etapem przed `this.stage = stage`, więc słuchacz rejestru odpaliłby się w środku rozgrzewki.

**Wstrzymanie wejścia.** Czysty licznik w `core` (`createInputSuspender(target: { enabled: boolean })` →
`suspend(): () => void`, `resume` idempotentne, `target.enabled` wraca do `true` dopiero przy zerowym liczniku);
jedna instancja na grę w rejestrze (`REGISTRY_KEYS.inputSuspender`, ustawiana w `preBoot` z `booting.input` —
`Game` tworzy `InputManager` w konstruktorze, `preBoot` biegnie później w `boot()`, sprawdzone w plan-review). Każde
wstrzymanie resetuje maszynę przytrzymania (podniesienie palca nad dialogiem jest gubione przez wyłączony manager).
**Zgubione `touchend` blokuje dotyk (plan-review F1):** bramka otwiera się, gdy palec jeszcze leży; `touchend` przy
`manager.enabled === false` nie dociera do `InputManager.onTouchEnd`, więc jedyny wskaźnik dotyku (`pointers[1]`,
`input.activePointers` = 1) zostaje `active` i każde następne `touchstart` nie znajduje wolnego wskaźnika — cała gra
głucha po zamknięciu panelu. Dlatego licznik przyjmuje `onRelease` wołane dokładnie raz przy powrocie do zera (przed
`target.enabled = true`), a `main.ts` podaje `() => game.input.pointers.forEach((p) => p.reset())` (to samo, co
`InputPlugin.resetPointers`, ale bez sceny).
`WelcomeScene.openParent` przechodzi na ten sam licznik (jeden mechanizm), `start()` zwalnia swoje wstrzymanie.

## Phase 1: Wspólne helpery e2e bez zmiany asercji

Driver: impl
Driver why: refaktor istniejących speców (follow-up F2 S-06, `Trigger: S-08`) — brak nowego zachowania, dowodem jest 15 zielonych speców bez zmienionej asercji.

### Overview

Kopie helperów z trzech speców przenoszone do `tests/e2e/support/hook.ts`, kroki bramki do `tests/e2e/support/welcome.ts`.
Żadna asercja, tytuł testu ani liczba testów się nie zmienia.

### Changes Required:

#### 1. Moduły wspólne

**File**: `tests/e2e/support/hook.ts`, `tests/e2e/support/welcome.ts`

**Intent**: `hook.ts` eksportuje dodatkowo `tapNumber`, `answerWrong`, `phaseIs`, `tapNext` (semantyka z
`task-round.spec.ts`: jednorazowy `expect`, nie polling — `tapTarget` zostaje osobno), `silenceSpeech(page)` (ciche
`speechSynthesis` z `addInitScript`), `toPage(page, point)` (mapowanie sceny na stronę, ta sama matematyka co
`tapScene`). Typy `Snapshot`/`Targets` dostają opcjonalne pola, których potrzebują specy (albo generyczne
`readHook`/`fromHook`), żeby specy zachowały swoje dodatkowe pola. `welcome.ts` importuje `readHook`/`tapScene` z
`hook.ts` (kopie znikają) i eksportuje `openWelcome(page, month?)`, `gateProblem`, `typeIntoGate`, `openGate(page,
month?)`; `passWelcomeAsParent` na nich.

**Contract**: zachowanie każdego helpera identyczne z kopią, którą zastępuje (plan-review: kopie porównane — identyczne poza
formą zapisu; przenoszone asercje to wyłącznie asercje wewnątrz helperów: `expect(box).not.toBeNull()` w `tapScene`/`toPage`,
`expect.poll(...).toBe(true)` w `fromHook`, `expect.poll(phase)` w `phaseIs`, `expect(next).not.toBeNull()` w `tapNext`,
`expect.poll(screen)` w `screenIs`, w krokach bramki `toBeVisible()` polecenia i dialogu, `expect(factors).not.toBeNull()`,
`expect(parent).toBeDefined()` i `expect.poll(screen).toBe('welcome')`; żadna asercja w treści `test(...)` się nie zmienia);
nagłówek `support/hook.ts` („Older specs keep their own copies…”) zaktualizowany; `cleanTask`, `playTask`, `playRound`
i atrapy mowy `narrator.spec.ts` zostają lokalne; `answer(page, right)` w narratorze jako jednolinijkowy wrapper.

#### 2. Specy

**File**: `tests/e2e/task-round.spec.ts`, `tests/e2e/first-launch.spec.ts`, `tests/e2e/narrator.spec.ts`,
`tests/e2e/adaptive.spec.ts`

**Intent**: usunąć kopie, importować z `support/`. Asercje i tytuły bez zmian.

### Success Criteria:

#### Automated Verification:

- `git diff --stat` faz 1 dotyka tylko `tests/e2e/**`; `grep -c "^const readHook\|^const tapScene\|^const fromHook" tests/e2e/*.spec.ts` = 0
- Liczba `expect(` w każdym specu przed = po, poza liniami przeniesionymi do `support/` (zliczenie w handoff §3); liczba `test(` = 15 bez zmian
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (15 passed)
- Deliberate break: `tests/e2e/support/hook.ts` `phaseIs` porównuje z odwrotną fazą → `task-round.spec.ts` i `first-launch.spec.ts` czerwone (dowód, że specy faktycznie używają wspólnego helpera); przywrócone; meta-check: break w helperze, nie w produkcie — dowodzi tylko przepięcia importów, co jest celem fazy
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

---

## Phase 2: Maszyna przytrzymania i licznik wstrzymania wejścia

Driver: tdd
Driver why: `src/core/longPress.ts` i `src/core/inputSuspend.ts` nie istnieją; failing testy (1999/2000 ms, ruch 30/31 px, cancel, drugi palec, jednokrotne `fire`; licznik zagnieżdżeń, idempotentne `resume`) prowadzą implementację.

### Overview

Czysty reduktor gestu z czasem jako argumentem i czysty licznik odwołań wyłączający wejście gry. Liczby w `balance`.

### Changes Required:

#### 1. Balans

**File**: `src/data/balance.ts`

**Intent**: `parentSettings: { holdMs: 2000, moveTolerance: 30, weakestCount: 3, examplesPerSkill: 2 }` z komentarzem
(US-03 AC: dłużej niż zwykłe przytrzymanie dziecka; 30 px gry < połowa ikony 96 px; FR-015 „3 najsłabsze”).

#### 2. Logika

**File**: `src/core/longPress.ts` (nowy), `src/core/inputSuspend.ts` (nowy)

**Intent**: `longPress(state, event, rules) → { state, fire }` wg Critical Implementation Details. `LongPressRules`
interfejs w `core`, `balance.parentSettings` go spełnia. `createInputSuspender(target)` — licznik; pierwsze `suspend`
ustawia `target.enabled = false`, ostatnie `resume` przywraca `true`; podwójne wywołanie tego samego `resume` nie
zmniejsza licznika drugi raz; `suspended()` do odczytu.

**Contract**: `longPress(state: LongPressState, event: LongPressEvent, rules: LongPressRules): { state: LongPressState; fire: boolean }`;
`createInputSuspender(target: { enabled: boolean }, onRelease?: () => void): { suspend(): () => void; suspended(): boolean }`
— `onRelease` wołane dokładnie raz przy każdym powrocie licznika do zera, przed `target.enabled = true` (plan-review
F1). Bez importów z Phasera i DOM (reguła granic ESLint).

#### 3. Testy

**File**: `tests/longPress.test.ts` (nowy), `tests/inputSuspend.test.ts` (nowy)

**Intent**: krótkie stuknięcie (down → up) nie odpala; tick 1999 ms nie, 2000 ms tak, kolejne ticki nie (jedno `fire`);
ruch 30 px zostaje, 31 px kasuje (także po przekątnej: 22 + 22); `cancel` i `reset` kasują; drugi `down` innego `id`
kasuje; `up` innego `id` ignorowany; `fired` → `up` → `idle` → nowy gest działa. Licznik: dwa `suspend`, jedno `resume`
→ nadal `false`; drugie → `true`; podwójny `resume` tego samego uchwytu nie przywraca przedwcześnie; `onRelease`
wołane raz przy zejściu do zera (nie przy pośrednim `resume`, nie przy podwójnym `resume`) i przed włączeniem `target`.

### Success Criteria:

#### Automated Verification:

- `tests/longPress.test.ts` i `tests/inputSuspend.test.ts` czerwone przed implementacją (asercja, nie brak modułu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `>` zamiast `>=` przy `holdMs` → test 2000 ms czerwony; `resume` bez strażnika idempotencji → test podwójnego `resume` czerwony; przywrócone; meta-check: wartości progów czytane z `balance.parentSettings`, oczekiwania z US-03 AC i tego planu, nie z implementacji
- Pełna bramka lokalna zielona

---

## Phase 3: Ustawienia sesji i zmiana etapu przez rodzica

Driver: tdd
Driver why: `effectiveAutoRead` i `changeStageByParent` nie istnieją; failing testy (null → domyślna etapu, wybór rodzica wygrywa przy każdym etapie; pola ucznia zmienione i zachowane, ten sam etap bez zmian) prowadzą implementację.

### Overview

Kształt `Settings` dla S-11 i czyste przejścia: efektywne auto-czytanie oraz uczeń po zmianie etapu przez rodzica.

### Changes Required:

#### 1. Typy

**File**: `src/core/types.ts`

**Intent**: `Settings.autoRead: boolean | null` z komentarzem (null = brak wyboru rodzica → domyślna etapu, FR-009).
`SaveState.settings` bez innych zmian (S-11 zapisze `null` w wersji 1 bez migracji).

#### 2. Logika

**File**: `src/core/narration/voice.ts`, `src/core/placement.ts`

**Intent**: `effectiveAutoRead(settings, stageId, autoReadStages) = settings.autoRead ?? defaultAutoRead(stageId,
autoReadStages)`; `initialSettings(): Settings` → `{ autoRead: null }`. `changeStageByParent(learner, stage)`: ten sam
etap → **ten sam obiekt** (scena nie przerywa rundy); inny → `stage`, `stageOverriddenByParent: true`,
`warmupPending: false`, `pendingUnlock: null` (follow-up S-07), `weakStreak: 0`, `easedRounds: 0`; zachowane
`age`, `unlockedStep`, `mastery`, `streak`, `history`.

**Contract**: `effectiveAutoRead(settings: Settings, stageId: StageId, autoReadStages: readonly string[]): boolean`;
`changeStageByParent(learner: SessionLearner, stage: StageId): SessionLearner` — nie mutuje wejścia.

#### 3. Testy

**File**: `tests/narratorVoice.test.ts`, `tests/placement.test.ts`

**Intent**: `null` + E1 → true, `null` + E3 → false, `false` + E1 → false, `true` + E4 → true; zmiana E3 → E4 przy
`warmupPending: true`, `pendingUnlock: 4`, `weakStreak: 1`, `easedRounds: 2` daje oczekiwane pola, a `unlockedStep`,
`mastery`, `streak`, `history` są równe (`toBe`) wejściowym; E3 → E3 zwraca ten sam obiekt; wejście zamrożone
(`Object.freeze`) nie rzuca.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `changeStageByParent` nie czyści `pendingUnlock` → test czerwony; `effectiveAutoRead` z `||` zamiast `??` → test `false` + E1 czerwony; przywrócone; meta-check: oczekiwania z decyzji 2 i 4 tego planu (follow-up S-07, reguła S-06 bez rozgrzewki)
- Pełna bramka lokalna zielona

---

## Phase 4: Pierwsza zła odpowiedź i przykłady błędów w historii

Driver: tdd
Driver why: `RoundState` nie pamięta wpisanej wartości, a historia nie ma przykładu; failing testy na `firstWrong`, `roundResults` i `recordRound` z przykładem prowadzą implementację.

### Overview

Reduktor rundy zapamiętuje pierwszą złą odpowiedź każdego zadania; wyniki rundy niosą przykład; historia trzyma go tylko
przy błędzie w pierwszej próbie. Mapowanie zadań na wyniki przechodzi ze sceny do `core`.

### Changes Required:

#### 1. Typy i reduktor

**File**: `src/core/types.ts`, `src/core/round.ts`

**Intent**: `MistakeExample = { prompt: string; given: number | string; answer: number | string | number[] }` (surowe
wartości, JSON-bezpieczne; formatowanie przy wyświetleniu). Wpis `LearnerState.history` dostaje opcjonalne
`example?: MistakeExample`. `RoundState.firstWrong: readonly (number | string | null)[]` — inicjowane `null` w
`startRound`, ustawiane tylko w gałęzi `case 'first'` przy złej odpowiedzi, gdy wejście to liczba albo tekst.
`roundResults(state): SkillResult[]` — `{ skillId, outcome, example? }`, przykład gdy `outcome` to `'second'`/`'retype'`
i `firstWrong[i] !== null` (`prompt` = `task.prompt`, `answer` = `task.answer`).

**Contract**: `roundResults(state: RoundState): SkillResult[]`; reduktor `answer` zostaje czysty.

#### 2. Historia

**File**: `src/core/mastery.ts`

**Intent**: `SkillResult.example?: MistakeExample`; `recordRound` kopiuje `example` do wpisu tylko gdy
`outcome !== 'first'`; długość historii bez zmian (`historyLength` 200 — najgorszy przypadek ~40 KB).

#### 3. Testy

**File**: `tests/round.test.ts`, `tests/mastery.test.ts`

**Intent**: zła odpowiedź w `first` zapisuje wartość (liczba z klawiatury, tekst z kafelka); druga zła odpowiedź
(`second`) jej nie nadpisuje; poprawna w `first` zostawia `null`; `roundResults` daje przykład dla `second` i
`retype`, nie dla `first` ani nierozegranych; `recordRound` z przykładem przy `first` go nie zapisuje (obrona), przy
`second` zapisuje, przycięcie historii zabiera przykład razem z wpisem.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed, zielone po; istniejące `tests/round.test.ts`/`tests/mastery.test.ts` zielone; unit `<baseline gałęzi> + N`
- Deliberate break: `firstWrong` nadpisywane także w `second` → test „druga zła nie nadpisuje” czerwony; `recordRound` zapisuje przykład przy `first` → test czerwony; przywrócone; meta-check: przykład ma pokazać pierwszą próbę (decyzja 3), test używa prawdziwego `Task` z generatora
- Pełna bramka lokalna zielona

---

## Phase 5: Podgląd postępów — bieżący krok i najsłabsze umiejętności

Driver: tdd
Driver why: ranking i „krok N z M” nie istnieją (`currentStepOf` prywatne); failing testy na filtrze etapu, progu ≥ 1 błędu, kolejności i stanie pustym prowadzą implementację.

### Overview

Czysty widok podglądu dla panelu: bieżący krok etapu i lista najsłabszych umiejętności z przykładami, wartości
sformatowane do wyświetlenia.

### Changes Required:

#### 1. Logika

**File**: `src/core/curriculum.ts`, `src/core/progress.ts` (nowy)

**Intent**: `currentStepOf` eksportowane jako `currentStep(stage, unlockedStep)` (jedno źródło dla `skillBuckets`,
`unlockReady` i podglądu). `progressView(stage, adaptation, rules)` → `{ step: { index, total, title }, weakest }`:
`index`/`total` po `playableSteps` (od 1), `title` = `StepDef.title`. `weakest`: kandydaci = grywalne umiejętności
**bieżącego etapu** z ≥ 1 wpisem historii `firstTry === false`; kolejność: opanowanie rosnąco, liczba błędów w pierwszej
próbie malejąco, nowszy błąd (`at`) pierwszy, potem kolejność w programie (krok, indeks) — deterministycznie; do
`weakestCount`; każda pozycja `{ skillId, title (tytuł kroku), mastery, max, examples }`, `examples` = do
`examplesPerSkill` najnowszych wpisów z `example`, sformatowane: liczba → `formatNumber` (`src/core/text/`), tekst bez
zmian, tablica → `join(', ')`, `\n` w poleceniu → spacja. Zero kandydatów → `weakest: []` (panel pokazuje stan pusty).

**Contract**: `progressView(stage: StageDef, adaptation: Adaptation, rules: { mastery: Pick<MasteryRules, 'max'>; view: { weakestCount: number; examplesPerSkill: number } }): ProgressView`;
`ProgressView.weakest[i].examples: readonly { prompt: string; given: string; answer: string }[]`.

#### 2. Testy

**File**: `tests/progress.test.ts` (nowy), `tests/curriculumEnd.test.ts`, `tests/curriculumPick.test.ts`

**Intent**: na prawdziwych `stages`: pusta historia → `weakest: []`, krok z podłogi; E3 z `unlockedStep` 11 → `index 8,
total 8`; wpisy innego etapu (E2 z koszyka `previous`) ignorowane; umiejętność tylko z poprawnymi odpowiedziami nie jest
kandydatem mimo opanowania 0; kolejność wg reguły (cztery umiejętności, by sprawdzić każde kryterium i obcięcie do 3);
do 2 najnowszych przykładów; formatowanie (`12 345` z NBSP, `\n` → spacja, tablica). `skillBuckets`/`unlockReady` dalej
zielone po eksporcie `currentStep`.

### Success Criteria:

#### Automated Verification:

- `tests/progress.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: filtr kandydatów `ok === false` zamiast `firstTry === false` → test z wynikiem `second` czerwony; brak filtra etapu → test z wpisem E2 czerwony; przywrócone; meta-check: oczekiwania z FR-015 („bieżący krok etapu”) i decyzji 6, nie z implementacji
- `grep -n "const currentStepOf" src/core/curriculum.ts` pusty (jedno źródło)
- Pełna bramka lokalna zielona

---

## Phase 6: Sklejka w scenach — wstrzymanie wejścia, auto-czytanie, zmiana etapu, przykłady, hak

Driver: impl
Driver why: glue scen i `main.ts` wokół logiki faz 2–5, bez nowego komponentu UI; przepływ dowodzi e2e faz 10–11.

### Overview

Globalne wstrzymanie wejścia (powitanie, podpowiedź instalacji), efektywne auto-czytanie w `TaskScene`, zmiana etapu w
miejscu, przykłady do historii, ustawienia sesji w rejestrze i hak tylko do odczytu. Jeszcze bez ikony i panelu.

### Changes Required:

#### 1. Rejestr, `main.ts`, podpowiedź instalacji

**File**: `src/data/layout.ts`, `src/main.ts`, `src/pwa/installHint.ts`

**Intent**: `REGISTRY_KEYS.settings` i `REGISTRY_KEYS.inputSuspender`; `GAME_EVENTS.parentStage`. `preBoot`: licznik
z `booting.input` z `onRelease` resetującym wskaźniki (`booting.input.pointers.forEach((p) => p.reset())`, plan-review
F1) i `initialSettings()` do rejestru. `mountInstallHint(parent, platform, standalone, suspend?)` —
wstrzymuje wejście na czas nakładki, zwalnia w `dismiss` (zamyka follow-up S-06 o przecieku stuknięć). `contextmenu`
→ `preventDefault` na `#game-container` (Android: długie przytrzymanie nie otwiera menu).

#### 2. Powitanie

**File**: `src/scenes/WelcomeScene.ts`

**Intent**: `openParent` używa licznika z rejestru zamiast `this.input.enabled`; `resume` w `onCancel` obu dialogów,
`start()` zwalnia wstrzymanie. Zachowanie powitania bez zmian (e2e `first-launch.spec.ts`).

#### 3. Zadanie

**File**: `src/scenes/TaskScene.ts`

**Intent**: pole `autoRead` znika — getter liczy `effectiveAutoRead(settings z rejestru, this.stage.id,
balance.narrator.autoReadStages)` w chwili użycia (`autoReadFirst`, `autoReadUnlock`, `snapshot`); przypisania w
`create`/`finishWarmup` usunięte. `finishRound` woła `roundResults(this.state)` (przykłady trafiają do historii).
Metoda `applyParentStage()` wg Critical Implementation Details; słuchacz `GAME_EVENTS.parentStage` (strażnik
`isSleeping`, sprzątanie w `shutdown`) i `onWake` porównujący `learner.stage !== this.stage.id` (bez auto-czytania
przy przebudzeniu).

**Contract**: scena nie decyduje o nowym etapie — czyta go z ucznia, którego zapisał `changeStageByParent`.

#### 4. Hak

**File**: `src/testing/e2eHook.ts`

**Intent**: `snapshot.settings` (zamrożona kopia rejestru) i `snapshot.inputEnabled` (`game.input.enabled`) także na
powitaniu. Nic, co ujawnia odpowiedź bramki.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (powitanie z licznikiem, auto-czytanie z getterem — `narrator.spec.ts` dalej czyta E1/E2 i milczy w E3)
- Deliberate break: `WelcomeScene.openParent` nie wstrzymuje wejścia → nic czerwonego w unit; zapis w handoff §3, że ten szew dowodzi dopiero e2e fazy 10 (meta-check: break, który nie czerwieni, nie jest dowodem — faza 6 nie twierdzi pokrycia); drugi break: getter `autoRead` ignoruje ustawienia rodzica → `npx playwright test tests/e2e/narrator.spec.ts` dalej zielony, bo ustawień nie da się jeszcze zmienić — świadomie, dowód w fazie 11
- `npm run build` drukuje `e2e hook: absent`; `grep -rl "parentStage\|inputSuspender" dist/` znajduje tylko bundle aplikacji (nazwy kluczy), `grep -rl "__martynkaE2E" dist/` pusty
- `grep -n "this.input.enabled" src/scenes/WelcomeScene.ts` pusty
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] `applyParentStage`: strażnik „ten sam etap → nic” (plan-review F3), gwiazdki dodane przed `freshRound`, brak `scene.restart`, strażnik `isSleeping`, `onWake` bez auto-czytania; brak liczb balansu i tekstu w scenach
- [human] iPad/Android w przeglądarce: stuknięcie w „Graj w przeglądarce” podpowiedzi instalacji nie trafia w kafelek pod spodem (wcześniej przeciekało)

---

## Phase 7: Ikona ustawień z przytrzymaniem i panel rodzica (etap, auto-czytanie)

Driver: impl
Driver why: dwa nowe komponenty UI (ikona w HUD, panel DOM) na logice faz 2–3; zachowanie w renderowanym UI dowodzi e2e fazy 10–11.

### Overview

`SettingsIcon` w `UIScene` z maszyną przytrzymania → bramka S-06 → nowy panel z wydzieloną grupą etapów i przełącznikiem
auto-czytania. Bez podglądu postępów (faza 8).

### Changes Required:

#### 1. Układ i teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `HUD_LAYOUT.settings` (left 1782, top 952, 96×96, wyciszone kolory z istniejącej palety HUD) i wpis w
`HUD_TOUCH_TARGETS`. `pl.settings`: `title` („Ustawienia rodzica”), `autoReadHeading` („Czytanie poleceń na głos”),
`autoReadOn` („Włączone”), `autoReadOff` („Wyłączone”); reszta (`stageHeading`, `confirm`, `cancel`, `pl.stages.*`)
ponownie użyta z `pl.parent`. Teksty bez liczebników.

#### 2. Ikona

**File**: `src/ui/widgets/SettingsIcon.ts` (nowy), `src/scenes/UIScene.ts`

**Intent**: zębatka rysowana w kodzie (Graphics, bez tekstu) i niewidzialna strefa tylko na ikonie (komentarz klasy
`UIScene` zostaje prawdziwy). `pointerdown` → `down`; scenowy `pointermove` tego samego `pointer.id` → `move`;
`pointerout` → `cancel`; `pointerup` (z `wasCanceled` → `cancel`) → `up`; `update(time)` → `tick` tylko w `holding`;
`sleep`/`shutdown` i każde wstrzymanie wejścia → `reset`. Żadnej informacji zwrotnej w trakcie. `fire` → `UIScene.openSettings()`:
`narrator.cancel()`, wstrzymanie wejścia, `openParentGate` → `openSettingsPanel`; „Zatwierdź” → `changeStageByParent`
i ustawienia do rejestru, `GAME_EVENTS.parentStage` tylko przy zmienionym etapie (plan-review F3), zwolnienie; „Anuluj”/Escape → zwolnienie. `settingsTarget()` dla haka.

**Contract**: `UIScene` nie decyduje o etapie ani o auto-czytaniu — woła `core` i zapisuje rejestr.

#### 3. Panel

**File**: `src/ui/dom/stageChoices.ts` (nowy, wydzielony), `src/ui/dom/stagePanel.ts`, `src/ui/dom/settingsPanel.ts` (nowy)

**Intent**: grupa przycisków etapów (rola `group`, `aria-labelledby`, `aria-pressed`, opcjonalny tag „propozycja”)
wydzielona z `openStagePanel` do `createStageChoices` — oba panele jej używają, panel startowy bez zmiany zachowania.
`openSettingsPanel({ stage, settings, autoReadDefault, onConfirm, onCancel })`: tytuł, grupa etapów (zaznaczony bieżący),
grupa auto-czytania (dwa przyciski, zaznaczona wartość efektywna; `settings.autoRead` zmienia się tylko po stuknięciu
rodzica, inaczej zostaje `null`), „Zatwierdź” (`parent-primary`), „Anuluj”; Escape = anuluj. Style z istniejących
`.parent-dialog`, `.parent-choices`, `.parent-actions`.

**Contract**: `onConfirm({ stage: StageId; autoRead: boolean | null })`.

#### 4. Hak

**File**: `src/testing/e2eHook.ts`

**Intent**: `targets.settingsIcon` z `UIScene.settingsTarget()` (nie null w pokoju; null na powitaniu).

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts`: ikona ≥ `MIN_TOUCH_TARGET`, w scenie, poza notesem (`TASK_LAYOUT.notebook`) i poza panelem pokoju, bez nakładania z „Do pokoju”, głośnikiem i licznikiem; unit `<baseline gałęzi> + N`
- Deliberate break: ikona przesunięta na x 1700 (nachodzi na notes) → test układu czerwony; przywrócone; meta-check: test chroni miejsce ikony (poza strefami dziecka), przepływ przytrzymania dowodzi e2e fazy 10
- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`; `first-launch.spec.ts` po wydzieleniu grupy etapów bez zmian); `npm run build` drukuje `e2e hook: absent`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela nowych napisów `pl.settings` (tytuł, nagłówek i dwa przyciski auto-czytania) — krótko, poprawna polszczyzna, bez liczebników
- [visual] Zrzuty: zadanie z ikoną w rogu, pokój z ikoną, bramka nad zadaniem, panel ustawień (etap E3 zaznaczony, auto-czytanie wył.) — przy 1440×900 i 1024×768

---

## Phase 8: Podgląd postępów w panelu

Driver: impl
Driver why: jeden nowy komponent DOM na `progressView` z fazy 5; treść w renderowanym panelu dowodzi e2e fazy 11.

### Overview

Sekcja podglądu w panelu ustawień: bieżący krok, najsłabsze umiejętności z opanowaniem i przykładami albo stan pusty.

### Changes Required:

#### 1. Teksty

**File**: `src/data/pl.ts`

**Intent**: `pl.settings.progressHeading` („Postępy”), `currentStep(index, total, title)` („Krok 3 z 8: <tytuł>”),
`weakestHeading` („Do poćwiczenia”), `mastery(value, max)` („opanowanie 2 z 5”), `example(prompt, given, answer)`
(„<polecenie> — odpowiedź dziecka: <given>, poprawnie: <answer>”), `empty` („Za mało odpowiedzi z błędami. Zajrzyj
tu po kilku rundach.”). Liczby w szablonach bez rzeczowników (bez odmiany).

#### 2. Komponent

**File**: `src/ui/dom/progressView.ts` (nowy), `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`, `src/style.css`

**Intent**: `createProgressView(view: ProgressView): HTMLElement` — nagłówek, akapit kroku, lista (`ul`, `aria-labelledby`
nagłówka „Do poćwiczenia”) z pozycjami: tytuł kroku, opanowanie, podlista przykładów (`white-space: normal`), albo akapit
stanu pustego. Panel dostaje `progress: ProgressView` (UIScene liczy `progressView` dla bieżącego etapu ucznia z
`balance`). **Budżet 1024×768 (plan-review F2):** czcionka dialogu `clamp(20px, 2.4vw, 32px)` ≈ 24,6 px; część bez
podglądu (tytuł ~56, nagłówek + siatka etapów 3 × 64 + 2 × 12 ≈ 260, auto-czytanie ≈ 110, akcje 64, odstępy 16, ramka
i padding 56) ≈ 640 px — mieści się; trzy pozycje podglądu z dwoma przykładami długich poleceń słownych (≈ 45 znaków
w wierszu przy 720 px) to ~800 px więcej, więc całość ~1400 px. Zostaje jedno przewijanie — istniejące
`overflow-y: auto` na `.overlay-parent` (bez drugiego, zagnieżdżonego przewijania na treści, które na dotyku łapie
gest); `.parent-actions` panelu ustawień dostaje `position: sticky; bottom: 0` z tłem `--parent-paper`, żeby
„Zatwierdź”/„Anuluj” były widoczne bez przewijania (S-06 miało właśnie ten błąd: „Zatwierdź” pod krawędzią 768 px);
przykłady `font-size: 0.8em`. Podgląd idzie pod etapami i auto-czytaniem (rodzic widzi decyzje bez przewijania).

**Contract**: komponent tylko renderuje `ProgressView`; żadnych obliczeń poza `pl`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); `npm run build` drukuje `e2e hook: absent`
- Deliberate break: `UIScene` podaje panelowi `progressView` z pustą historią zamiast ucznia → nic czerwonego w unit (dowód w e2e fazy 11; meta-check zapisany w handoff §3: ta faza nie twierdzi pokrycia)
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.settings.progressHeading`, `currentStep`, `weakestHeading`, `mastery`, `example`, `empty` — z przykładami realnych poleceń (BONDS z `\n`, WORD ~100 znaków, COMPARE z „<”) w `npm run sample -- E3 --count 6`
- [visual] Zrzuty panelu: stan pusty (zaraz po powitaniu), 1 słaba umiejętność, 3 słabe z przykładem długiego polecenia słownego — przy 1440×900 i 1024×768 (przewijanie zamiast ucięcia; „Zatwierdź” i „Anuluj” widoczne bez przewijania w każdym stanie)

---

## Phase 9: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–8, bez nowej logiki.

### Overview

Luki projektu, follow-upy, `CLAUDE.md`, przegląd szwów i wiersze decyzji `[human]`.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersze 25+: (25) ikona ustawień i jej miejsce (kit nie ma; prawy dolny róg poza notesem, zębatka w kodzie);
(26) panel ustawień rodzica (kit: „Parent review controls belong outside the game scene”; DOM jak dialogi S-06);
(27) podgląd postępów i stan pusty; (28) przytrzymanie bez informacji zwrotnej. Każdy z komentarzem `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/parent-settings-progress/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — ryzyko #14 do test-planu (brzmienie z research § 6, `Trigger: /10x-test-plan refresh`);
S-11: zapis `Settings` (`autoRead: boolean | null`) i historii z `example`, `pendingUnlock` jako `{ stage, step }`, jeśli
karta ma przetrwać sesję; „wcześniejszy zapis ucznia przed codzienną grą” obejmuje teraz ustawienia rodzica i podgląd
(`Trigger: before S-11, or any deploy used for daily play`); S-12: eksport/import/reset w tym samym panelu (eksport niesie przykłady błędów — notka prywatności, plan-review F6);
S-17: kalibracja `holdMs`/`moveTolerance` na tablecie.

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, pliki faz 1–8

**Intent**: Current state w `CLAUDE.md`: ustawienia rodzica (ikona, przytrzymanie, panel, podgląd),
`core/longPress.ts`, `core/inputSuspend.ts`, `core/progress.ts`, `REGISTRY_KEYS.settings`, `balance.parentSettings`.
Seam sweep: nieaktualne komentarze (`TaskScene` „a parent switch comes with S-08”, `UIScene` opis klasy, `stagePanel`),
duplikaty (`currentStepOf`, grupa etapów), martwe klucze, `Settings` w komentarzach.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/longpress.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł (profil § 10)
- `grep -rn "a parent switch comes with S-08" src/` pusty
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–8; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [human] Do S-11 wszystko jest sesyjne. Po zimnym starcie (zamknięcie karty, wyrzucenie z pamięci na iPadzie, aktualizacja) rodzic widzi: powitanie od nowa, etap z wieku albo z „Rodzic”, auto-czytanie domyślne etapu, a w podglądzie bieżący krok z podłogi kalendarza i stan pusty „Za mało odpowiedzi z błędami”. US-03 AC „zmiana etapu … jest zapamiętana” jest spełnione tylko w obrębie sesji
- [human] Przytrzymanie na iPadzie i Androidzie: 2 s wystarcza rodzicowi i nie zdarza się dziecku trzymającemu tablet za róg; brak lupy/menu kontekstowego/zaznaczenia; podniesienie palca nie wciska cyfry w bramce
- [human] Odstępstwa od dosłownego PRD: (a) otwarta runda przerwana zmianą etapu nie liczy się do opanowania; (b) „3 najsłabsze” = tylko umiejętności z ≥ 1 błędem w pierwszej próbie (może być mniej niż 3); (c) nazwa umiejętności dla rodzica = tytuł kroku + przykłady błędów (bez osobnych etykiet); (d) podgląd tylko z bieżącego etapu; (e) ustawienia za ikoną w HUD (nad zadaniem i pokojem), nie na powitaniu

---

## Phase 10: Wejście do ustawień tylko długim przytrzymaniem — e2e (#14, proposed)

Driver: e2e
Driver why: ryzyko #14 (proposed, test-plan refresh pending): dziecko wchodzi do ustawień stuknięciem albo zwykłym przytrzymaniem albo stuknięcie pod dialogiem trafia do gry — istnieje tylko w renderowanym UI (gest dotykowy, DOM nad canvasem); zbudowane w fazach 6–7, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/parent-settings.spec.ts` (projekt `chromium-hook`), pierwszy test: gest i izolacja wejścia.

### Changes Required:

#### 1. Helper i projekt

**File**: `tests/e2e/support/hook.ts`, `playwright.config.ts`

**Intent**: `holdTouch(page, point, ms, drift?)` — surowy CDP `Input.dispatchTouchEvent` (`touchStart` → opcjonalnie
5 × `touchMove` o `drift` px sceny przez `toPage` → `waitForTimeout(ms)` → `touchEnd`, `cdp.detach()`); jedyne
dopuszczalne czekanie stałym czasem to sam czas trzymania palca (to jest gest, nie synchronizacja). `ROUND_SPEC` obejmuje
`parent-settings`.

#### 2. Spec

**File**: `tests/e2e/parent-settings.spec.ts` (nowy)

**Intent**: test „#14 (proposed) only a 2-second hold on the settings icon opens the adult gate, and taps under the
dialog never reach the round”: `silenceSpeech`, `passWelcome` (E3, rodzic) → `screen === 'task'`; `tapScene` na ikonie,
`holdTouch` 1500 ms, potem `holdTouch` 2300 ms z dryfem 60 px → brak `getByRole('dialog', { name: 'Pytanie dla
rodzica' })` (`expect(...).toHaveCount(0)`) i `snapshot.inputEnabled === true`; asercja negatywna stoi **po** drugim
przytrzymaniu, więc od początku krótkiego minęło > 2000 ms bez dodatkowego `waitForTimeout` (plan-review F4);
`holdTouch` 2300 ms bez dryfu → dialog bramki widoczny, odczyt bramki pusty (podniesienie palca niczego nie wcisnęło),
`inputEnabled === false`; `tapScene` w kafelek/klawisz rundy przez dialog → po „Anuluj” `snapshot.phase === 'first'`,
`index` bez zmian, `inputEnabled === true`; następne stuknięcie odpowiedzi działa (runda żyje — to jest dowód
resetu wskaźników po zgubionym `touchend`, plan-review F1).

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `npx playwright test tests/e2e/parent-settings.spec.ts`;
żadnego zapisu stanu z testu, żadnej asercji treści zadania.

**Chromium niedostępny w sesji agenta**: patche przerw w `context/runs/2026-10-12-s04-s08/e2e-break-s08-p10.patch` i
`e2e-break-s08-p10b.patch` + `e2e-request-s08-p10.md` (protokół `prompt-phase.md`); orkiestrator uruchamia i zapisuje wyniki.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/parent-settings.spec.ts` zielony (1 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 1` passed
- Deliberate break (patch tylko na kodzie produkcyjnym, REGUŁA): `src/core/longPress.ts` odpala przy `down` (próg pominięty) → test czerwony na braku dialogu po krótkim stuknięciu; przywrócone; meta-check: unit `tests/longPress.test.ts` też czerwony — e2e dowodzi, że scena faktycznie używa maszyny (break w scenie: `UIScene` woła `openSettings` na `pointerdown` → e2e czerwony, unit zielony — ten wariant jest dowodem sklejki)
- Druga przerwa (patch, REGUŁA): `UIScene.openSettings` nie wstrzymuje wejścia → test czerwony na `phase`/`index` po stuknięciu przez dialog albo na `inputEnabled`; przywrócone; meta-check: unit zielone (szew sceny)
- Trzecia przerwa (patch, REGUŁA): `main.ts` tworzy licznik bez `onRelease` (wskaźniki nie resetowane) → test czerwony na „następne stuknięcie odpowiedzi działa” po „Anuluj”; przywrócone; meta-check: unit `inputSuspend.test.ts` zielony (szew `main.ts`)
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Phase 11: Zmiana etapu, auto-czytanie i podgląd przez dotyk — e2e (#14, proposed)

Driver: e2e
Driver why: ryzyko #14 (proposed, test-plan refresh pending): zmiana etapu nie działa od razu albo gwiazdki znikają, wybór auto-czytania nie trwa, podgląd nie pokazuje błędu — przepływ panel → scena istnieje tylko w renderowanym UI; zbudowane w fazach 6–8, kontrakt `E2E=on`.

### Overview

Dwa kolejne testy w `tests/e2e/parent-settings.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/parent-settings.spec.ts`

**Intent**: (a) „#14 (proposed) a parent stage change replaces the open round with the new stage at once and keeps the
stars, and the auto-read choice survives the next stage change”: `passWelcomeAsParent` (E3, `?e2eMonth=9` przez helper)
→ jedno zadanie poprawnie (`starsTotal` 1, `counterText`) → przytrzymanie → bramka (`openGate`-owe kroki z `welcome.ts`:
`gateProblem`/`typeIntoGate`) → panel → „Klasa 2, II półrocze”, auto-czytanie „Włączone”, „Zatwierdź” → `stage === 'E4'`,
`learner.stage === 'E4'`, `learner.stageOverriddenByParent === true`, `index === 0`, `phase === 'first'`,
`starsTotal`/`counterText` bez zmian, `settings.autoRead === true`, `autoRead === true` (E4 domyślnie wył.) → drugi raz:
„Klasa 2, I półrocze”, bez dotykania auto-czytania → `stage === 'E3'`, `autoRead === true`. (b) „#14 (proposed) the
progress view shows the empty state, then the skill missed on the first try with its example”: `passWelcomeAsParent`
(E3, `?e2eMonth=9`) → panel: tekst stanu pustego widoczny → „Anuluj” → runda: pierwsze zadanie `answerWrong` →
`answerRight`, reszta `answerRight`, „Dalej” do podsumowania → panel: lista „Do poćwiczenia” ma dokładnie 1 pozycję,
stan pusty znikł, pozycja zawiera wartość podaną przez test w `answerWrong` (wartość testu, nie treść zadania).
`test.setTimeout` jak istniejące specy rundy; czas zmierzony w handoff §3.

**Contract**: miesiąc tylko przez `?e2eMonth` (nigdy `page.clock`: zamraża tweeny Phasera 4); żadnej asercji treści
polecenia; nazwy dialogu i przycisków przez `getByRole` z tekstami z `pl`.

**Chromium niedostępny w sesji agenta**: patche `e2e-break-s08-p11.patch`, `-p11b.patch`, `-p11c.patch` +
`e2e-request-s08-p11.md` w `context/runs/2026-10-12-s04-s08/` (protokół `prompt-phase.md`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/parent-settings.spec.ts` zielony (3 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 3` passed (łącznie z fazą 10)
- Deliberate break (patch, REGUŁA): `TaskScene.applyParentStage` bez `sessionStars += state.starsEarned` → test (a) czerwony na `starsTotal`/`counterText`; przywrócone; meta-check: unit zielone (szew sceny)
- Druga przerwa (patch, REGUŁA): `src/core/progress.ts` kandydaci z `ok === false` zamiast `firstTry === false` → test (b) czerwony (stan pusty zostaje po błędzie w pierwszej próbie poprawionym w drugiej); przywrócone; meta-check: także unit fazy 5 czerwony — e2e dowodzi, że panel czyta historię ucznia (wariant sklejki: `TaskScene.finishRound` wraca do mapowania bez `roundResults` → przykład znika, e2e czerwony na wartości, unit zielony)
- Trzecia przerwa (patch, REGUŁA): `src/core/narration/voice.ts` `effectiveAutoRead` ignoruje `settings` → test (a) czerwony na `autoRead === true` w E4; przywrócone
- `npm run build` drukuje `e2e hook: absent`; `grep -rl e2eMonth dist/` pusty; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Przytrzymanie: próg, ruch, cancel, drugi palec, jednokrotne `fire` (`longPress.test.ts`); licznik wstrzymania (`inputSuspend.test.ts`).
- Ustawienia i etap: `effectiveAutoRead` (`narratorVoice.test.ts`), `changeStageByParent` (`placement.test.ts`).
- Historia: `firstWrong`, `roundResults` (`round.test.ts`), `recordRound` z przykładem (`mastery.test.ts`).
- Podgląd: bieżący krok, ranking, filtr etapu, stan pusty, formatowanie (`progress.test.ts`); układ ikony (`layout.test.ts`).

### Integration Tests:

- `npm run sample -- E1..E6`; `npm run build` ze strażnikiem haka; seed #8, #11, lektor, #12, #13 i nowe `#14 (proposed)` × 3 w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty: zadanie i pokój z ikoną, bramka, panel (etap + auto-czytanie), podgląd pusty / 1 / 3 pozycje — 1440×900 i 1024×768.
2. Odczyt nauczyciela: `pl.settings` (wszystkie nowe napisy) z prawdziwymi przykładami błędów.
3. iPad i Android: przytrzymanie 2 s, brak lupy i menu, palec podniesiony nad bramką nic nie wciska; podpowiedź instalacji nie przepuszcza stuknięcia.

## Performance Considerations

`progressView` liczone raz przy otwarciu panelu: 200 wpisów historii × kilkadziesiąt umiejętności etapu — pomijalne.
`tick` maszyny tylko w stanie `holding`. Historia z przykładami ~40 KB w najgorszym przypadku (pamięć sesji; S-11 zapisze).

## Migration Notes

Brak: bez bazy danych (profil § 4). `Settings.autoRead` staje się `boolean | null`, a wpis historii dostaje opcjonalne
`example`, zanim powstanie format zapisu (S-11) — wersja 1 zapisze je bez migracji.

## Known risks

- **Sesyjność do S-11** (wiersz `[human]` 9.6): rodzic, który ustawił etap i auto-czytanie, po zimnym starcie musi zrobić
  to ponownie; podgląd po zimnym starcie jest pusty.
- **Przytrzymanie na urządzeniach** (wiersz `[human]` 9.7): `TouchManager.capture = true` tłumi lupę w teorii; iPad i
  `contextmenu` na Androidzie sprawdza tylko urządzenie. `holdMs`/`moveTolerance` w `balance` do kalibracji.
- **Syntetyczne kliknięcie po podniesieniu palca nad dialogiem**: wniosek ze specyfikacji Touch Events (touchstart
  zablokowany przez canvas); e2e fazy 10 sprawdza pusty odczyt bramki po przytrzymaniu.
- **Chromium w sesji agenta** (`MachPortRendezvous`): fazy z e2e oddają e2e orkiestratorowi (`prompt-phase.md`); fazy
  10–11 piszą `e2e-request-s08-p10.md` / `-p11.md` z patchami przerw.
- **Panel przy 1024×768**: etapy (6 przycisków), auto-czytanie, podgląd z 3 pozycjami i długimi poleceniami słownymi ≈
  1400 px — nie zmieści się; faza 8: jedno przewijanie nakładki + przyklejone akcje (budżet w fazie 8, plan-review F2),
  bramka wizualna sprawdza, że „Zatwierdź” jest widoczne bez przewijania.
- **Prywatność przykładów błędów** (plan-review F6): `MistakeExample` żyje tylko w pamięci sesji (rejestr); nie trafia do
  `console.*` (w `src/` nie ma dziś żadnego wywołania — seam sweep fazy 9 to sprawdza: `grep -rn "console\." src/` bez
  nowych trafień); w haku jest tylko w buildzie e2e (`learner` w `snapshot`), produkcja `e2e hook: absent`. S-11/S-12 zapiszą
  i wyeksportują przykłady — follow-up fazy 9 to odnotowuje (plik eksportu zawiera polecenia i odpowiedzi dziecka).
- **Nowe polskie napisy** widzi rodzic (nie dziecko), ale błąd językowy obniża zaufanie — teacher read w fazach 7–8.

## References

- Research: `context/changes/parent-settings-progress/research.md`; change: `context/changes/parent-settings-progress/change.md`
- PRD: `context/foundation/prd.md` FR-015, US-03, Access Control, FR-009, NFR Prywatność
- Plan gry: `Martynka-urzadza.md` §1, §5 (`Settings.autoRead`, `LearnerState.history`), §6, §8, §11 (M3)
- Test-plan: `context/foundation/test-plan.md` (#11; proponowane #12, #13, #14); `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md` („Parent review controls belong outside the game scene”), `screen.css` `.hud` — brak widoku ustawień (DESIGN-GAP 25–28)
- Follow-upy: `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`, `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`, `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` (`Trigger: S-08`)
- Format: `context/archive/2026-10-13-adaptive-curriculum/plan.md`

## Autonomous decisions

1. **`Settings.autoRead: boolean | null`** (null = brak wyboru rodzica → domyślna etapu; rekomendacja research § 5,
   wytyczna orkiestratora). Odrzucone: `autoRead` + `autoReadByParent` (dwa pola, które mogą się rozjechać). Wybór
   rodzica trwa przy zmianie etapu. Zmieniłoby: autor chce, by zmiana etapu przywracała domyślną — jedna gałąź w
   `changeStageByParent` zerująca ustawienie.
2. **Zmiana etapu od razu, otwarta runda zastąpiona świeżą, gwiazdki zostają, odpowiedzi przerwanej rundy nie liczą się
   do opanowania** (`change.md` decyzja 2, research § 3). Odrzucone: zmiana od następnej rundy (US-03 Then — rodzic nie
   widzi efektu), zapis częściowej rundy (nowa ścieżka `endRound` dla rzadkiej akcji), `scene.restart` (zeruje gwiazdki).
   → `[human]` 9.8 (a). Zmieniłoby: autor chce dokończenia rundy w starym etapie — flaga w uczniu czytana w `freshRound`.
3. **Przykład błędu = pierwsza zła odpowiedź + polecenie + poprawna, tylko we wpisach z błędem w pierwszej próbie**
   (`change.md` decyzja 3, follow-up S-07). Odrzucone: `taskType` + `skillId` (rodzic nie zobaczy przykładu), osobny
   bufor (drugie źródło dla S-11), każda zła próba (druga po podpowiedzi mniej mówi). Zmieniłoby: rozmiar zapisu w S-11.
4. **Nazwa umiejętności dla rodzica = `StepDef.title` + opanowanie + przykłady** (rekomendacja research § 4, wytyczna
   orkiestratora). Odrzucone: `SkillDef.label` dla 82 umiejętności (duża nowa treść i teacher read), etykieta typu
   (nadal niejednoznaczna w 4 krokach). Dwie pozycje z tego samego kroku mają ten sam tytuł — przykłady je rozróżniają.
   → `[human]` 9.8 (c). Zmieniłoby: autor chce nazwanych umiejętności.
5. **Podgląd tylko z bieżącego etapu; kandydat = ≥ 1 błąd w pierwszej próbie; kolejność opanowanie ↑, liczba błędów ↓,
   nowszy błąd, kolejność programu** (research § 4, FR-015 „bieżący krok etapu i 3 najsłabsze”). Odrzucone: ranking po
   samym opanowaniu (0 dla nigdy-nie-granych), cała historia (miesza etap poprzedni i rozgrzewkę). → `[human]` 9.8 (b, d).
   Zmieniłoby: autor chce widzieć słabości z poprzedniego etapu po zmianie etapu.
6. **Przytrzymanie: 2000 ms, tolerancja 30 px gry, bez informacji zwrotnej, czysta maszyna z czasem z `update`**
   (`change.md` decyzja 1, research § 1, wytyczna orkiestratora). Odrzucone: `time.delayedCall` (drugi właściciel stanu),
   sprawdzanie na `pointerup` (bramka po puszczeniu jest mniej czytelna), pasek postępu (kusi dziecko), gest wielopalcowy.
   → `[human]` 9.7. Zmieniłoby: test na tablecie (dziecko trzyma róg) — dłuższy próg lub inny róg.
7. **Ikona w HUD (`UIScene`), prawy dolny róg poza notesem, nie na powitaniu** (`change.md` decyzja 1). → `[human]` 9.8 (e).
   Zmieniłoby: kit dostanie ikonę ustawień.
8. **Globalne wstrzymanie `game.input.enabled` z licznikiem; podpowiedź instalacji i powitanie na tym samym liczniku**
   (research § 2, wytyczna orkiestratora: follow-up S-06 wchodzi „za darmo”). Odrzucone: pętla po scenach (pomija śpiącą
   `TaskScene`, nie obejmuje nakładki instalacji). Zmieniłoby: widżet, który potrzebuje `POINTER_UP_OUTSIDE` przy
   otwartym dialogu (dziś brak).
9. **`pendingUnlock` czyszczone przy zmianie etapu** (follow-up S-07, `change.md`). Odrzucone tu: `{ stage, step }` (dla
   S-11, jeśli karta ma przetrwać sesję — follow-up). Zmieniłoby: S-11.
10. **Panel = jedna lista zmian z „Zatwierdź” / „Anuluj”**, nie natychmiastowe przełączniki: rodzic może obejrzeć podgląd
    i wyjść bez skutków, a zmiana etapu przerywa rundę tylko świadomie. Auto-czytanie zmienia się w ustawieniach tylko po
    stuknięciu jednego z jego przycisków (inaczej zostaje `null`). Zmieniłoby: playtest pokaże, że rodzic zapomina
    zatwierdzić.
11. **Brak testów DOM w vitest** (research § 6: brak jsdom/happy-dom; S-06 pokrywa DOM e2e). Logika panelu jest w `core`
    (`progressView`, `changeStageByParent`, `effectiveAutoRead`), panel tylko renderuje. Zmieniłoby: osobna decyzja o
    happy-dom.
12. **Fazy e2e po seam sweep, ryzyko „#14 (proposed, test-plan refresh pending)”, helper `holdTouch` przez surowy CDP,
    miesiąc tylko `?e2eMonth`, przerwy jako patche na kodzie produkcyjnym** (wytyczna orkiestratora; protokół
    `prompt-phase.md`). Deduplikacja helperów jako wczesna faza 1 bez zmiany asercji — orkiestrator uruchamia 15 speców.
    Zmieniłoby: Chromium dostępny w sesji agenta (przerwy bez patchy).
13. **Podgląd pokazuje opanowanie N z 5** — US-03 Then „podgląd pokazuje opanowanie umiejętności i najczęstsze błędy”;
    tylko dla najsłabszych pozycji (FR-015 wyklucza pełną tabelę). Zmieniłoby: nic w tym slice.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wspólne helpery e2e bez zmiany asercji

#### Automated

- [x] 1.1 Diff tylko w `tests/e2e/**`; brak lokalnych kopii `readHook`/`tapScene`/`fromHook` w specach — d72768a
- [x] 1.2 Liczba `expect(` przed = po (poza przeniesionymi do `support/`); 15 × `test(` bez zmian — d72768a
- [x] 1.3 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (15 passed) — d72768a (orchestrator, run-log "S-08 p1 impl": e2e 15/15 on d72768a)
- [x] 1.4 Deliberate break: `phaseIs` w `support/hook.ts` odwrócone → task-round i first-launch czerwone; przywrócone; meta-check — d72768a (orchestrator, run-log "S-08 p1 impl": phaseIs inverted red in task-round and first-launch at support/hook.ts:90, restored)
- [x] 1.5 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — d72768a (e2e: orchestrator gate)

### Phase 2: Maszyna przytrzymania i licznik wstrzymania wejścia

#### Automated

- [x] 2.1 `tests/longPress.test.ts` i `tests/inputSuspend.test.ts` czerwone przed (asercja), zielone po; unit `<baseline gałęzi> + N` — 7087b16 (RED: AssertionError expected true to be false / expected +0 to be 1; unit 881 + 21)
- [x] 2.2 Deliberate break: `>` zamiast `>=` / `resume` bez idempotencji → czerwone; przywrócone; meta-check (progi z `balance.parentSettings`) — 7087b16 (`>=` to `>` red in 5 longPress tests; `resume` without the guard red in 2 inputSuspend tests; restored)
- [x] 2.3 Pełna bramka lokalna zielona — 7087b16 (e2e: orchestrator gate)

### Phase 3: Ustawienia sesji i zmiana etapu przez rodzica

#### Automated

- [x] 3.1 Nowe testy `effectiveAutoRead` i `changeStageByParent` czerwone przed, zielone po; unit `<baseline gałęzi> + N` — 8f53d98 (RED: expected false to be true / expected 'E3' to be 'E4'; unit 902 + 8)
- [x] 3.2 Deliberate break: `pendingUnlock` nie czyszczone / `||` zamiast `??` → czerwone; przywrócone; meta-check — 8f53d98 (2 tests red: parent choice wins, fields reset; restored)
- [x] 3.3 Pełna bramka lokalna zielona — 8f53d98 (e2e 15 passed, run in this session)

### Phase 4: Pierwsza zła odpowiedź i przykłady błędów w historii

#### Automated

- [x] 4.1 Nowe testy `firstWrong`, `roundResults`, `recordRound` z przykładem czerwone przed, zielone po; unit `<baseline gałęzi> + N` — b34c1ee (RED: expected undefined to deeply equal [null x5]; unit 910 + 14 = 924)
- [x] 4.2 Deliberate break: `firstWrong` nadpisywane w `second` / przykład przy `first` → czerwone; przywrócone; meta-check — b34c1ee (2 tests red; restored)
- [x] 4.3 Pełna bramka lokalna zielona — b34c1ee (e2e: orchestrator gate)

### Phase 5: Podgląd postępów — bieżący krok i najsłabsze umiejętności

#### Automated

- [x] 5.1 `tests/progress.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 6238cb6 (RED: expected [] to deeply equal [ 'E3.1.word_20' ] / expected +0 to be 1; unit 924 + 23 = 947)
- [x] 5.2 Deliberate break: kandydaci z `ok === false` / brak filtra etapu → czerwone; przywrócone; meta-check — 6238cb6 (ok filter: second-try test red; other-stage candidates: 'ignores history of another stage' red; restored)
- [x] 5.3 `const currentStepOf` usunięte (jedno źródło `currentStep`) — 6238cb6
- [x] 5.4 Pełna bramka lokalna zielona — 6238cb6 (e2e: orchestrator gate)

### Phase 6: Sklejka w scenach — wstrzymanie wejścia, auto-czytanie, zmiana etapu, przykłady, hak

#### Automated

- [x] 6.1 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` — e2e 15/15 on ebd0351, orchestrator run (run-log line "S-08 p6 impl")
- [x] 6.2 Deliberate break: powitanie bez wstrzymania / getter bez ustawień → unit zielone; zapis w handoff §3, dowód w e2e faz 10–11; meta-check — ebd0351
- [x] 6.3 Build `e2e hook: absent`; `__martynkaE2E` nieobecne w `dist/` — ebd0351
- [x] 6.4 `this.input.enabled` usunięte z `WelcomeScene` — ebd0351
- [x] 6.5 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — ebd0351 (e2e: orchestrator gate)

#### Manual

- [x] 6.6 [reviewer] `applyParentStage`: strażnik tego samego etapu, gwiazdki przed `freshRound`, brak `scene.restart`, strażnik `isSleeping`, `onWake` bez auto-czytania; brak liczb i tekstu w scenach — impl-review (TaskScene.applyParentStage: all five guards present; no numbers/text in scenes)
- [ ] 6.7 [human] iPad/Android w przeglądarce: „Graj w przeglądarce” podpowiedzi instalacji nie trafia w kafelek pod spodem

### Phase 7: Ikona ustawień z przytrzymaniem i panel rodzica (etap, auto-czytanie)

#### Automated

- [x] 7.1 `tests/layout.test.ts` obejmuje ikonę (rozmiar, w scenie, poza notesem i panelem pokoju, bez nakładania z HUD); unit `<baseline gałęzi> + N` — b5efc5e (947 → 948, +1)
- [x] 7.2 Deliberate break: ikona na x 1700 → test układu czerwony; przywrócone; meta-check (przepływ → e2e fazy 10) — b5efc5e
- [x] 7.3 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); build `e2e hook: absent` — b5efc5e (orchestrator, run-log "S-08 p7 impl": e2e 15/15 on b5efc5e; build `e2e hook: absent`)
- [x] 7.4 Pełna bramka lokalna zielona — b5efc5e (e2e: orchestrator gate)

#### Manual

- [x] 7.5 [reviewer] Odczyt nauczyciela `pl.settings` (tytuł, nagłówek i przyciski auto-czytania) — 4388673 (impl-review teacher read: titles fine)
- [ ] 7.6 [visual] Zrzuty: zadanie z ikoną, pokój z ikoną, bramka nad zadaniem, panel ustawień — 1440×900 i 1024×768

### Phase 8: Podgląd postępów w panelu

#### Automated

- [x] 8.1 `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); build `e2e hook: absent` — 0d1d820 (orchestrator: e2e 15/15 on 0d1d820, build `e2e hook: absent`, run-log line "S-08 p8 impl")
- [x] 8.2 Deliberate break: panel z pustą historią → unit zielone; zapis w handoff §3, dowód w e2e fazy 11; meta-check — 0d1d820
- [x] 8.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — 0d1d820 (948 + 0; e2e: orchestrator gate)

#### Manual

- [x] 8.4 [reviewer] Odczyt nauczyciela napisów podglądu (`progressHeading`, `currentStep`, `weakestHeading`, `mastery`, `example`, `empty`) z realnymi poleceniami — 4388673 (impl-review teacher read with real E1/E3/E5 examples; „poprawnie:” → „poprawna:”)
- [ ] 8.5 [visual] Zrzuty podglądu: pusty, 1 pozycja, 3 pozycje z długim poleceniem — 1440×900 i 1024×768; „Zatwierdź”/„Anuluj” widoczne bez przewijania

### Phase 9: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [x] 9.1 `validate-rule-files.sh` PASS — e3f57e7
- [x] 9.2 Deliberate break: `CLAUDE.md` wskazuje nieistniejący plik → FAIL; przywrócone; meta-check — e3f57e7
- [x] 9.3 Komentarz „a parent switch comes with S-08” usunięty z `src/` — e3f57e7
- [x] 9.4 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — e3f57e7 (948 + 0; e2e: orchestrator gate)

#### Manual

- [x] 9.5 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze; DESIGN-GAP 25–28 w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:` — 4388673 (impl-review: duplicated DESIGN-GAP in SettingsIcon removed; gaps 25–28 match code; 6 Trigger lines)
- [ ] 9.6 [human] Do S-11 wszystko sesyjne: po zimnym starcie powitanie od nowa, auto-czytanie domyślne, podgląd z podłogi kalendarza i pusty; „zapamiętana” tylko w sesji
- [ ] 9.7 [human] Przytrzymanie 2 s na iPadzie i Androidzie: wygodne dla rodzica, nieosiągalne przypadkiem, bez lupy/menu, palec nie wciska cyfry bramki
- [ ] 9.8 [human] Odstępstwa od dosłownego PRD: przerwana runda poza opanowaniem; „3 najsłabsze” tylko z błędami; nazwa = tytuł kroku + przykłady; podgląd z bieżącego etapu; ikona w HUD, nie na powitaniu

### Phase 10: Wejście do ustawień tylko długim przytrzymaniem — e2e (#14, proposed)

#### Automated

- [x] 10.1 `npx playwright test tests/e2e/parent-settings.spec.ts` zielony (1 passed); pełne e2e `<baseline gałęzi e2e> + 1` — 2678e44 (orchestrator run 2026-10-13 (run-log/e2e-request-s08-p10): spec 1/1, suite 16/16)
- [x] 10.2 Deliberate break: `UIScene` otwiera ustawienia na `pointerdown` (albo maszyna odpala przy `down`) → test czerwony; przywrócone; meta-check (unit zielone przy wariancie sceny) — 2678e44 (break a red at spec:33 toHaveCount(0), Received 1; core test also red)
- [x] 10.3 Druga przerwa: `UIScene.openSettings` bez wstrzymania wejścia → test czerwony; przywrócone; meta-check — 2678e44 (break b red at spec:45 inputEnabled Received true; unit green)
- [x] 10.4 Trzecia przerwa: licznik bez `onRelease` (wskaźniki nie resetowane) → test czerwony na stuknięciu po „Anuluj”; przywrócone; meta-check — 2678e44 (break c red via spec:63 phase Expected done, Received second: pointer reset lost; unit green)
- [x] 10.5 Build `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite — 2678e44 (lint, typecheck, 948 unit, build e2e hook: absent; playwright by orchestrator; no servers left)

### Phase 11: Zmiana etapu, auto-czytanie i podgląd przez dotyk — e2e (#14, proposed)

#### Automated

- [x] 11.1 `npx playwright test tests/e2e/parent-settings.spec.ts` zielony (3 passed); pełne e2e `<baseline gałęzi e2e> + 3` — 51b4f9b (this session: spec 3/3 twice; full suite 18/18 = baseline 16 + 2)
- [x] 11.2 Deliberate break: `applyParentStage` bez dodania gwiazdek → test (a) czerwony; przywrócone; meta-check — 51b4f9b (break a red at spec:105 starsTotal Expected 1, Received 0; unit 948 green)
- [x] 11.3 Druga przerwa: `finishRound` bez `roundResults` (albo kandydaci z `ok === false`) → test (b) czerwony; przywrócone; meta-check — 51b4f9b (break b: finishRound maps roundResults without example → red at spec:166 toContainText "odpowiedź dziecka: 4,"; unit 948 green)
- [x] 11.4 Trzecia przerwa: `effectiveAutoRead` ignoruje ustawienia → test (a) czerwony; przywrócone — 51b4f9b (break c red at spec:108 autoRead Expected true, Received false; unit narratorVoice red too)
- [x] 11.5 Build `e2e hook: absent`; `e2eMonth` nieobecne w `dist/`; pełna bramka lokalna zielona; serwery 4397/4398 zabite — 51b4f9b (lint, typecheck, 948 unit, build e2e hook: absent, grep e2eMonth dist/ empty; 4397/4398 free)
