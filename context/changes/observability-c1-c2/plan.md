# Granica błędów, zwalnianie wejścia po wyjątku, stan lektora w ustawieniach i opanowanie bez kary — Implementation Plan

## Overview

Zmiana spoza roadmapy (`observability-c1-c2`, autonomiczny run `2026-10-13-fix-observability`, gałąź
`feat/observability-c1-c2` z `main` @ `a34aeee`) — szybka poprawka przed S-09 z audytu
`context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md` (PR #25):

- **C-1** — nieprzechwycony wyjątek zatrzymuje pętlę Phasera: zamrożony ekran bez słowa. Po zmianie: jedna granica
  błędów na krawędzi (`window` `error` + `unhandledrejection`), czysty klasyfikator w `core` odsiewa szum przeglądarki,
  a dziecko widzi spokojną kartę DOM z jednym przyciskiem „zacznij od nowa” (`location.reload()`). Nic nie opuszcza
  urządzenia; oryginał w `console.error`.
- **C-2 (+ L-8, F6)** — okno rodzica zamyka się przed callbackiem, wyjątek w callbacku zostawia przełącznik wejścia
  wstrzymany (dotyk martwy). Po zmianie: zwolnienie w `finally` (czysty helper sesji w `core`), wyjątek leci dalej do
  granicy; `createInputSuspender` przywraca `enabled` nawet gdy `onRelease` rzuci (reset wskaźników S-08 F1 zostaje).
- **H-6** — panel ustawień pokazuje „Włączone” przy braku polskiego głosu. Po zmianie: pod przełącznikiem linia
  „brak polskiego głosu”, śledząca `Narrator.onAvailability` przez cały czas otwarcia panelu.
- **H-7 (decyzja opiekuna, 2026-10-13)** — błąd w pierwszej próbie zeruje serię i **nie odejmuje** punktu opanowania.
  PRD FR-013 i `docs/ZADANIA.md` § 1 zmieniają się w tej samej zmianie.

Brak wiersza roadmapy: statusów w `context/foundation/roadmap.md` nie ruszamy.

## Current State Analysis

Z `research.md` (commit `2c49bff`) i odczytu kodu w tym kroku (`feat/observability-c1-c2` @ `2c49bff`):

- `src/main.ts`: brak handlera `error`/`unhandledrejection`; `createGame` → `preBoot` ustawia `REGISTRY_KEYS.inputSuspender`
  (`createInputSuspender(booting.input, () => pointers.forEach(reset))`); `month` z `e2eMonth(location.search)` tylko pod
  `__E2E_HOOK__`; `mountInstallHint(…, () => suspender.suspend())`.
- Phaser 4.2.1 nie łapie niczego w pętli, scenach, emiterze ani dispatchu wejścia. Trzy nośniki wyjątku:
  (a) `RequestAnimationFrame.step` woła callback przed `requestAnimationFrame(step)` → pętla martwa;
  (b) wejście dotykowe biegnie synchronicznie w listenerze DOM → `error`, pętla żyje z połowicznym stanem;
  (c) `FontFile.onProcess` `.then(onProcessComplete).catch(warn + onProcessComplete)` → wyjątek w `BootScene.create`
  (i w scenie startowanej synchronicznie) kończy jako `unhandledrejection` (wniosek z kodu, nie ślad runtime).
- `src/core/inputSuspend.ts` `createInputSuspender`: `onRelease?.(); target.enabled = true;` bez `finally` (L-8).
- Trzy właściciele blokady: `mountInstallHint` (bez punktów wyjątku), `WelcomeScene.openParent` → `start`
  (rzutowanie rejestru bez strażnika — F6; `startLearning` przed `resumeInput()`), `UIScene.openSettings` →
  `onPass` (`getStage`, `progressView`, `openSettingsPanel`) → `applySettings` (`changeStageByParent` przed
  `closeSettings()`). Dialogi `src/ui/dom/{parentGate,stagePanel,settingsPanel}.ts` robią `handle.close()` przed
  callbackiem i nie dotykają przełącznika — właściwy podział, zostaje.
- `src/ui/dom/settingsPanel.ts` `SettingsPanelOptions` bez informacji o głosie; `Narrator.available` i
  `Narrator.onAvailability(cb) → unsubscribe` istnieją (woła od razu i przy każdej zmianie, `voiceschanged` + polling).
- `src/core/mastery.ts` `recordRound`: gałąź błędu `Math.max(0, mastery − rules.loss)`; `MasteryRules.loss`;
  `balance.mastery.loss = 1` („a miss = -1”). Testy: `tests/mastery.test.ts` (nagłówek, dwa testy „lowers…”, `[second,
  retype]` → 0, pin `balance.mastery` `toEqual(RULES)`), `tests/curriculumEnd.test.ts` (`MASTERY`, test rozgrzewki 4 → 3).
- `vite/e2eHookGuard.mjs` `checkE2EHook` zna jeden znacznik (`E2E_HOOK_MARKER = '__martynkaE2E'`); nieobecność
  `e2eMonth` w `dist/` opiera się wyłącznie na DCE. Komunikat `e2e hook: absent (N chunks checked)` czyta profil (§ 2).
- `vitest` w środowisku `node`, bez jsdom/happy-dom: DOM tylko w e2e. `playwright.config.ts` `ROUND_SPEC` kieruje specy
  do projektu `chromium-hook` (4397). `tests/e2e/support/hook.ts` ma `silenceSpeech` (zero głosów);
  `tests/e2e/narrator.spec.ts` wstrzykuje listę głosów.
- Brak `context/foundation/lessons.md` (sprawdzone) — żadna lekcja nie ma zastosowania.
- Baseline (kontrakt): `main` @ `a34aeee`: unit 948, e2e 18. Każda faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Wyjątek z dowolnego nośnika (klatka pętli, listener dotyku, start gry w obietnicy czcionki) pokazuje jedną kartę
  DOM nad canvasem i dialogami rodzica (pod nakładką „Obróć tablet”): spokojny tytuł, jedno zdanie, przycisk
  ponownego uruchomienia, mały identyfikator wersji dla rodzica; bez stosu, bez słowa „błąd”, bez obietnicy zachowania
  postępów. Pod kartą wejście gry wstrzymane, pętla uśpiona; druga awaria nie dokłada drugiej karty. Szum („ResizeObserver
  loop…”, „Script error.”, skrypty obce, odrzucenia `AbortError`/`NotAllowedError`) nie pokazuje karty.
- Wyjątek w callbacku okna rodzica (powitanie, ustawienia) zwalnia blokadę wejścia dokładnie raz i trafia do granicy.
  `createInputSuspender` przywraca `enabled = true` także gdy `onRelease` rzuci; reset wskaźników zostaje.
- Panel ustawień przy braku polskiego głosu pokazuje pod przełącznikiem czytania linię o braku głosu; przełącznik działa
  (wybór rodzica zapisany na później); linia znika, gdy głos dojdzie przy otwartym panelu.
- Błąd w pierwszej próbie: seria = 0, opanowanie bez zmian; opanowanie nigdy nie maleje. PRD FR-013 i ZADANIA § 1 mówią to samo.
- Build produkcyjny: `e2e hook: absent (N chunks checked)` z listą znaczników (`__martynkaE2E`, `e2eMonth`, `e2eFail`,
  `e2e-forced-failure`); build e2e zawiera wszystkie (wymóg od fazy 4). Spec `tests/e2e/error-boundary.spec.ts` (#15, proposed) i test H-6
  w `tests/e2e/parent-settings.spec.ts` (#14, proposed).

### Key Discoveries:

- Granica potrzebuje **obu** listenerów: start gry biegnie w `.then` obietnicy czcionki (`FontFile.onProcess`).
- Zwolnienie musi owijać **callback w scenie**, nie `openDialog`: wyjątki padają po `handle.close()`, w kodzie sceny.
- Po C-2 karta sama trzyma wejście (końcowa), więc odzyskanego wejścia nie widać w e2e (`snapshot.inputEnabled`
  = `false` przez kartę) — zwolnienie dowodzi vitest, e2e dowodzi kartę zamiast martwego ekranu.
- Bez kary dziecko z 60–70 % trafności w pierwszej próbie odblokowuje krok 3-umiejętnościowy w ~25–35 rund (wcześniej
  praktycznie nigdy) — kalibracja to S-17 (research § 4).

## What We're NOT Doing

- Telemetria, wysyłka błędów, lokalny bufor błędów z „Skopiuj” (audyt: zmiana zakresu PRD) — tylko `console.error`.
- Wznawianie pętli Phasera po wyjątku; `try/catch` w każdej scenie; guard budowy rundy (H-1/H-2 — łapie je granica);
  „najpierw zbuduj, potem zatwierdź” w `TaskScene` (M-1, M-2, M-13); ślad lektora (H-3, H-4, M-7, M-10, L-5); widoki
  rodzica (H-8, H-10, M-8, M-12); wdrożenie i mapy źródeł (H-9, M-9, H-5, M-6, L-9).
- `audio: { noAudio: true }` (zmienia konfigurację, którą S-16 i dźwięk będą stroić; klasyfikator odsiewa odrzucenia audio).
- Pokazanie rodzicowi „opanowane k / potrzebne ⌈n/2⌉” (H-7, część widoczności) i strojenie progów (S-17).
- Ukrywanie/wyłączanie przełącznika czytania bez głosu; zmiana przycisku głośnika HUD.
- Zmiany w `src/pwa/` (follow-up F4 `beforeinstallprompt` zostaje), F5 (stan przytrzymania przy obcej nakładce — karta
  jest końcowa), happy-dom/jsdom, edycja archiwów, ręczna edycja `test-plan.md` (ryzyko #15 → follow-up).
- E2E w CI, WebKit/iPad (ręcznie).

## Implementation Approach

Trzy fazy czystej logiki test-first: (1) bezpieczne zwolnienie wejścia (L-8 + helper sesji), (2) reguła opanowania
H-7 z dokumentami, (3) klasyfikator sygnału błędu, parser `?e2eFail=` i strażnik buildu z listą znaczników. Faza 4
skleja granicę na krawędzi: `src/ui/dom/errorBoundary.ts` (listenery → `ErrorSignal` → `isFatalSignal`) i jedną
nową kartę `src/ui/dom/errorCard.ts`, miejsca wyzwolenia tylko w buildzie e2e, sceny na helperze sesji (C-2, F6).
Faza 5: linia „brak głosu” w panelu (zmiana istniejącego komponentu) + luki projektu, follow-upy, `CLAUDE.md`, seam
sweep. Fazy e2e po seam sweep: 6 — ryzyko #15 (proposed), 7 — dopisek do #14 (proposed).

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**. Komunikat
strażnika buildu zostaje dosłownie `e2e hook: absent (N chunks checked)` / `present (…)` (profil § 2 go cytuje). Faza 6
poszerza `ROUND_SPEC` o `error-boundary` (ta sama komenda `npx playwright test`).

## Critical Implementation Details

**Kolejność w `main.ts` (faza 4).** Granica instalowana **przed** `createGame` (łapie start w obietnicy czcionki).
Gra powstaje później, więc reakcja na awarię czyta `game` leniwie: `mountErrorCard` (najpierw — dziecko ma zobaczyć
kartę, nawet gdy reszta zawiedzie) → wstrzymanie wejścia przez `REGISTRY_KEYS.inputSuspender`, jeśli gra i licznik już
są (uchwyt nigdy nie zwalniany) → `game.loop.sleep()`. **Każdy** krok, także `mountErrorCard`, w osobnym `try/catch` z
`console.error`, a `installErrorBoundary` woła `onFatal` w `try/catch` i trzyma flagę „już obsługuję” (wejście
ponowne tylko loguje) — handler awarii nie może sam rzucić (rekurencja `error`: rzut z listenera to kolejne zdarzenie
`error`). Karta idempotentna: druga awaria tylko loguje. (plan-review F3)

**Helper sesji (kontrakt dla faz 1 i 4).** W `src/core/inputSuspend.ts`:
`openInputSession(suspender: InputSuspender): InputSession` z `run<T>(fn: () => T): T` (wyjątek → `end()`, potem
rzut dalej, bez opakowania), `end(): void` (idempotentne: zwolnienie uchwytu raz) i `active(): boolean`. Sesja otwiera
wstrzymanie w chwili utworzenia. Sceny trzymają `InputSession | undefined` zamiast `releaseInput`; każdy callback okna
(`onPass`, `onConfirm`, `onCancel`) biegnie w `session.run(…)`; `closeSettings`/`resumeInput` = `session.end()`.

**Miejsca wyzwolenia e2e (faza 4).** `?e2eFail=step|boot|settings` → `e2eFail(search)` czytane w `main.ts`
tylko pod `__E2E_HOOK__`, zapisane w rejestrze pod `REGISTRY_KEYS.forcedFailure` (komentarz „e2e build only; never set
in production”). **Nazwa i wartość klucza nie mogą zawierać żadnego znacznika strażnika** — `REGISTRY_KEYS` z
`src/data/layout.ts` trafia do `dist/` w całości (nazwy właściwości nie są mangle'owane), więc klucz `e2eFail` wywróciłby
build produkcyjny (plan-review F1). Każde miejsce:
`if (__E2E_HOOK__ && registry.get(REGISTRY_KEYS.forcedFailure) === '<site>') throw new Error(E2E_FORCED_FAILURE)`
(`E2E_FORCED_FAILURE = 'e2e-forced-failure'` z `src/testing/e2eHook.ts`; sceny importują z tego modułu tylko tę stałą,
używaną wyłącznie za `__E2E_HOOK__` — komentarz nagłówka modułu poprawiony). `step`: `TaskScene.update` (jednorazowo;
nośnik a). `boot`: `BootScene.create` (nośnik c). `settings`: pierwsza linia `UIScene.applySettings` wewnątrz
`session.run` (C-2 + nośnik b). Bez `welcome` (plan-review F5: karta na `.overlay` jest nieprzezroczysta, zrzut nad
powitaniem = zrzut nad zadaniem; zwolnienie w `WelcomeScene` dowodzi vitest + przegląd 4.6). DCE usuwa wszystko w
produkcji; strażnik i grep to dowodzą.

## Phase 1: Bezpieczne zwolnienie wejścia — L-8 i helper sesji

Driver: tdd
Driver why: helper sesji nie istnieje, a `createInputSuspender` bez `finally` gubi `enabled` — failing testy (rzucający `onRelease`, rzucający callback w `run`) prowadzą implementację.

### Overview

Czysta logika w `src/core/inputSuspend.ts`: zwolnienie, które nie zależy od wyniku callbacku.

### Changes Required:

#### 1. Licznik

**File**: `src/core/inputSuspend.ts`

**Intent**: przy zejściu licznika do zera `onRelease` w `try`, `target.enabled = true` w `finally`; wyjątek z `onRelease`
leci dalej (do granicy), ale gra odzyskuje wejście. Kolejność „`onRelease` przed `enabled`” (S-08 F1) zostaje.

**Contract**: sygnatura `createInputSuspender` bez zmian; nowe `openInputSession` wg Critical Implementation Details.
Bez importów z Phasera i DOM.

#### 2. Testy

**File**: `tests/inputSuspend.test.ts`

**Intent**: rzucający `onRelease` → rzut widoczny, `target.enabled === true`, `suspended() === false`, kolejne
`suspend`/zwolnienie działa; istniejące 7 przypadków (w tym kolejność) zielone. Sesja: utworzenie wstrzymuje; `run`
zwraca wynik i nie zwalnia; `run` z rzucającym `fn` → ten sam obiekt błędu wyrzucony, `enabled === true`, `active() ===
false`; `end()` dwa razy → jedno zwolnienie (druga, równoległa blokada trzyma `enabled === false`); `run` po `end()`
wykonuje `fn` bez ponownego wstrzymania.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie brak eksportu — eksport-stub najpierw), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `target.enabled = true` przeniesione z `finally` za `onRelease` → test rzucającego `onRelease` czerwony; `run` bez `end()` w gałęzi wyjątku → test sesji czerwony; przywrócone; meta-check: oczekiwania z kontraktu runu („release must happen even when the callback throws”), nie z implementacji
- Pełna bramka lokalna zielona

---

## Phase 2: Opanowanie bez kary za błąd (H-7, decyzja opiekuna)

Driver: tdd
Driver why: reguła mastery zmienia zachowanie — odwrócone testy (błąd → opanowanie bez zmian, seria 0; własność „nigdy nie maleje”) są czerwone na dzisiejszym `recordRound` i prowadzą zmianę.

### Overview

`recordRound` przy wyniku `second`/`retype` zeruje serię i zostawia opanowanie; pole `loss` znika z reguł i balansu;
dokumenty produktu mówią to samo.

### Changes Required:

#### 1. Reguła i dane

**File**: `src/core/mastery.ts`, `src/data/balance.ts`

**Intent**: usunąć `MasteryRules.loss` i `balance.mastery.loss`; gałąź błędu: `streak[skillId] = 0`, a
`mastery[skillId] = mastery[skillId] ?? 0` (zapis klucza jak dziś — konsumenci bez zmian). Komentarz `balance.mastery`:
„3 correct first tries in a row = +1; a miss resets the streak and never lowers mastery (maintainer decision 2026-10-13)”.

**Contract**: `MasteryRules` bez `loss`; historia (`ok`, `firstTry`, `example`) bez zmian.

#### 2. Testy

**File**: `tests/mastery.test.ts`, `tests/curriculumEnd.test.ts`

**Intent**: nagłówek i `RULES` bez −1; testy „lowers…” odwrócone na „keeps mastery and resets the streak after a
second-try answer / after a retype”; `[second, retype]` z pustego ucznia → `mastery.S === 0`; pin `balance.mastery`
`toEqual(RULES)` dalej; nowa własność: dla losowych sekwencji wyników (seed z `tests/helpers.ts`) opanowanie po każdym
`recordRound` ≥ przed. `curriculumEnd`: `MASTERY` bez `loss`; test rozgrzewki zachowuje sens „rozgrzewka zapisuje
wynik” przez inny obserwowalny skutek (wpis historii `firstTry: false` i seria 0), opanowanie zostaje 4.

#### 3. Dokumenty produktu (decyzja opiekuna)

**File**: `context/foundation/prd.md` (FR-013), `docs/ZADANIA.md` (§ 1 „Adaptacja trudności”)

**Intent**: FR-013: „(seria poprawnych podnosi, błąd zeruje serię)” i „(start: 60/30/10, 3 z rzędu +1, błąd zeruje serię
bez odejmowania)”; ZADANIA: „3 poprawne z rzędu → +1; błąd zeruje serię, opanowanie nie spada (długość serii i wartości
zmian w `balance.ts`)”. Opis w commicie: decyzja opiekuna 2026-10-13, nie agenta. Archiwa bez zmian.

### Success Criteria:

#### Automated Verification:

- Odwrócone i nowe testy czerwone przed zmianą `recordRound` (asercja), zielone po; unit `<baseline gałęzi> + N` (N = nowe testy; odwrócone nie zmieniają liczby)
- `grep -rn "loss" src/core/mastery.ts src/data/balance.ts` pusty; `grep -n "−1" docs/ZADANIA.md` bez zdania o błędzie; FR-013 bez „błąd obniża” / „błąd −1”
- Deliberate break: przywrócone odejmowanie 1 w gałęzi błędu → testy „keeps mastery” i własność czerwone; przywrócone; meta-check: oczekiwania z decyzji opiekuna w kontrakcie runu, nie z kodu
- `npm run sample -- E1` … `E6` zielone (treść zadań nietknięta); pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela nowych zdań FR-013 i ZADANIA § 1 (jasne dla rodzica i nauczyciela, zgodne z regułą w kodzie)
- [human] Decyzja opiekuna H-7 odzwierciedlona: FR-013 i ZADANIA § 1 mówią „błąd zeruje serię, opanowanie nie spada”; świadomość, że krok odblokuje się dziecku z 60–70 % trafności (~25–35 rund) — kalibracja w S-17

---

## Phase 3: Klasyfikator sygnału błędu, parser `?e2eFail=` i strażnik z listą znaczników

Driver: tdd
Driver why: `isFatalSignal`, `e2eFail` i lista znaczników strażnika nie istnieją — failing testy (szum vs awaria, parser jak `e2eMonth`, nieobecność każdego znacznika w produkcji) prowadzą implementację.

### Overview

Czysta decyzja „pokazać kartę czy nie”, czysty parser wyzwalacza testowego i dowód, że wyzwalacz nie trafia do `dist/`.

### Changes Required:

#### 1. Klasyfikator

**File**: `src/core/errorSignal.ts` (nowy)

**Intent**: decyzja na zwykłym obiekcie, bez globali przeglądarki (granica ESLint). Niegroźne: `kind 'error'` bez obiektu
błędu z komunikatem pustym, `'Script error.'` albo zaczynającym się od `'ResizeObserver loop'`; każdy sygnał `foreign`
(plik spoza originu: rozszerzenie, obcy skrypt); `kind 'rejection'` z `name` `AbortError` albo `NotAllowedError`
(polityka autoodtwarzania audio/mowy — karta po każdym przeładowaniu byłaby pętlą). Wszystko inne — awaria.

**Contract**: `interface ErrorSignal { kind: 'error' | 'rejection'; message: string; hasError: boolean; name?: string; foreign: boolean }`;
`isFatalSignal(signal: ErrorSignal): boolean`.

#### 2. Parser i znacznik

**File**: `src/testing/e2eHook.ts`

**Intent**: `e2eFail(search): E2EFailSite | null` obok `e2eMonth` (`'step' | 'boot' | 'settings'`, reszta
`null`); `E2E_FORCED_FAILURE = 'e2e-forced-failure'` (komunikat rzucanego błędu = znacznik strażnika).

#### 3. Strażnik buildu

**File**: `vite/e2eHookGuard.mjs`

**Intent**: `E2E_HOOK_MARKERS = ['__martynkaE2E', 'e2eMonth', 'e2eFail', 'e2e-forced-failure']` (`E2E_HOOK_MARKER` zostaje
jako pierwszy element dla istniejącego testu); produkcja: żaden znacznik w żadnym chunku (komunikat nazywa znacznik i
chunk). Build e2e w tej fazie sprawdza dalej **tylko** `__martynkaE2E` — `e2eFail` i `E2E_FORCED_FAILURE` nie mają
jeszcze wywołań (wpięcie w fazie 4), więc tree-shaking usuwa je z buildu e2e i wymóg „każdy znacznik obecny” wywróciłby
`npx playwright test` tej fazy (plan-review F2). Funkcja przyjmuje osobną listę znaczników wymaganych w buildzie e2e
(`E2E_REQUIRED_MARKERS`, dziś `['__martynkaE2E']`); faza 4 poszerza ją do pełnej listy. Komunikat sukcesu dosłownie bez zmian.

#### 4. Testy

**File**: `tests/errorSignal.test.ts` (nowy), `tests/e2eMonth.test.ts` (albo nowy `tests/e2eFail.test.ts`), `tests/e2eHookGuard.test.ts`

**Intent**: klasyfikator: `error` z obiektem → awaria; `'ResizeObserver loop completed with undelivered notifications'`
i `'ResizeObserver loop limit exceeded'` bez obiektu → szum; ten sam komunikat **z** obiektem → awaria; `'Script error.'`
i `''` → szum; `foreign` → szum; odrzucenie `Error` / ciągu / `undefined` → awaria; `AbortError`, `NotAllowedError` →
szum; `TypeError` → awaria. Parser: każda z 3 wartości (`welcome` → `null`), wielkość liter, pusty, nieznany, powtórzony parametr. Strażnik:
chunk z samym `e2eFail` w produkcji → błąd nazywający `e2eFail`; build e2e bez znacznika z listy wymaganych → błąd
(lista wstrzyknięta w teście, np. `['__martynkaE2E', 'e2e-forced-failure']`); czysty →
ten sam komunikat co dziś; test „guards the property the hook really installs” rozszerzony: każdy znacznik występuje
dosłownie w `src/testing/e2eHook.ts`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- `npm run build` drukuje dosłownie `e2e hook: absent (` … `chunks checked)`; `E2E_HOOK=1` build: `e2e hook: present (`
- Deliberate break: klasyfikator bez reguły `hasError` (każde `ResizeObserver…` to szum) → test „ten sam komunikat z obiektem” czerwony; strażnik sprawdza tylko pierwszy znacznik → test `e2eFail` w produkcji czerwony; przywrócone; meta-check: przypadki szumu z research § 1 (źródła zdarzeń bez `ErrorEvent.error`), nie z implementacji
- Pełna bramka lokalna zielona

---

## Phase 4: Granica błędów z kartą, miejsca wyzwolenia e2e i sceny na helperze sesji

Driver: impl
Driver why: sklejka na krawędzi (listenery okna, karta DOM, `main.ts`) i w scenach na logice z faz 1 i 3 — zachowanie widać tylko w renderowanej stronie, dowód w e2e fazy 6.

### Overview

Jeden nowy komponent UI (karta). Granica w `src/ui/dom/`, wpięta w `main.ts`; C-2 i F6 w `WelcomeScene`/`UIScene`.

### Changes Required:

#### 1. Granica

**File**: `src/ui/dom/errorBoundary.ts` (nowy)

**Intent**: `installErrorBoundary(win, onFatal)` — listenery `error` i `unhandledrejection` w fazie bąbelkowania (nie
`capture`: błędy zasobów się nie bąbelkują); mapuje `ErrorEvent`/`PromiseRejectionEvent` na `ErrorSignal` (`foreign` =
niepusty `filename` spoza `location.origin`); `console.error` z oryginałem dla awarii, `console.warn` z komunikatem dla
szumu; awaria → `onFatal(error)` (raz na zdarzenie). Zwraca funkcję odinstalowania.

**Contract**: `installErrorBoundary(win: Window, onFatal: (error: unknown) => void): () => void`; decyzja tylko przez `isFatalSignal`.

#### 2. Karta

**File**: `src/ui/dom/errorCard.ts` (nowy), `src/style.css`, `src/data/pl.ts`

**Intent**: `mountErrorCard(parent, buildId, onRestart)` na `createOverlay('overlay-error', …)`: tytuł, jedno zdanie,
`createButton` z restartem, mały tekst wersji (`.overlay-muted`); `role="alertdialog"`, `aria-labelledby` tytułu, fokus
na przycisku; idempotentne (drugi montaż zwraca istniejącą kartę). `.overlay-error` z `z-index: 18` (nad dialogami
rodzica 15, pod „Obróć tablet” 20). Komentarz `DESIGN-GAP 29`. Teksty `pl.errorCard`: `title: 'Ups! Gra się zatrzymała.'`,
`body: 'Dotknij przycisku, a gra uruchomi się od nowa.'`, `restart: 'Zacznij od nowa'`, `build: (id) => \`Wersja ${id}\``
— bez „błąd”/„awaria”, bez obietnicy zachowania postępów (PRD „Postęp nigdy nie ginie” działa dopiero od S-11).

#### 3. Wpięcie

**File**: `src/main.ts`, `src/data/layout.ts`

**Intent**: wg Critical Implementation Details (granica przed `createGame`, karta → wstrzymanie → `game.loop.sleep()`,
restart = `window.location.reload()`). `e2eFail` czytane tylko pod `__E2E_HOOK__` i ustawiane w `preBoot` pod
`REGISTRY_KEYS.forcedFailure` (nowy klucz z komentarzem „e2e build only; never set in production”; nazwa i wartość bez
znacznika strażnika — F1).

#### 3a. Strażnik — pełna lista w buildzie e2e

**File**: `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts`

**Intent**: `E2E_REQUIRED_MARKERS` = pełna lista `E2E_HOOK_MARKERS` (wszystkie wywołania istnieją od tej fazy); test
pinuje, że lista wymagana równa się liście zakazanej. Build `E2E_HOOK=1` drukuje `e2e hook: present (`.

#### 4. Sceny

**File**: `src/scenes/UIScene.ts`, `src/scenes/WelcomeScene.ts`, `src/scenes/TaskScene.ts`, `src/scenes/BootScene.ts`

**Intent**: `UIScene` i `WelcomeScene` trzymają `InputSession` zamiast `releaseInput`; każdy callback okna w
`session.run(…)`; `closeSettings`/`resumeInput` = `end()`; strażniki otwarcia na `session?.active()`. F6:
`WelcomeScene.openParent` z tym samym strażnikiem `undefined` co `UIScene.openSettings`. Miejsca wyzwolenia `step`,
`boot`, `settings` wg Critical Implementation Details (bez `welcome`). Shutdown scen kończy sesję jak dziś.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0`
- `npm run build` drukuje `e2e hook: absent (`; `E2E_HOOK=1` build drukuje `e2e hook: present (` z pełną listą wymaganą; `grep -rlE "e2eFail|e2e-forced-failure|e2eMonth|__martynkaE2E" dist/` pusty; `grep -rn "releaseInput" src/` pusty
- Deliberate break: `main.ts` bez `installErrorBoundary` → unit zielone (zapis w handoff §3: ta faza nie twierdzi pokrycia; dowód w e2e fazy 6); `UIScene` woła `applySettings` poza `session.run` → unit zielone (zwolnienie dowodzi faza 1, sklejkę — przegląd); przywrócone; meta-check zapisany
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (N = test pinu listy wymaganej)

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.errorCard` (`title`, `body`, `restart`, `build`): spokojnie, bez winy dziecka, bez obietnicy zachowania postępów, krótko
- [reviewer] Każdy callback okna rodzica w `session.run`, wstrzymanie zwalniane dokładnie raz, wyjątek nie połykany; handler awarii nie może rzucić; miejsca `e2eFail` tylko pod `__E2E_HOOK__`; brak tekstu i liczb w scenach
- [visual] Zrzuty karty po awarii w klatce (`?e2eFail=step`) i po awarii startu (`?e2eFail=boot`) przy 1440×900 i 1024×768, z serwera z `E2E_HOOK=1` na porcie 4399
- [human] Odstępstwo od dosłownego PRD („nie da się niczego stracić”): do S-11 restart z karty kończy sesję — dziecko wraca do powitania, gwiazdki i etap sesji przepadają; karta pojawia się na każdą awarię, także gdy pętla jeszcze żyje

---

## Phase 5: Linia „brak polskiego głosu” w panelu, luki projektu, follow-upy i seam sweep

Driver: impl
Driver why: zmiana istniejącego komponentu DOM (bez nowej logiki w `core`) plus dokumentacja i porządki — dowód linii w e2e fazy 7.

### Overview

H-6 w panelu ustawień; ostatnia faza `impl`/`tdd`: seam sweep całej zmiany.

### Changes Required:

#### 1. Panel

**File**: `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`, `src/data/pl.ts`

**Intent**: opcja `watchVoice?: (callback: (available: boolean) => void) => () => void` (UIScene podaje
`(cb) => narrator.onAvailability(cb)`; bez lektora — linia widoczna). Subskrypcja przy otwarciu, odpięcie na każdej
ścieżce zamknięcia (zatwierdź, anuluj, Escape, `closeDialog?.()` z shutdown). Pod przyciskami czytania akapit
`pl.settings.noVoice` (`'Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi.'`),
widoczny tylko przy `available === false`; przełącznik zostaje aktywny. Komentarz `DESIGN-GAP 30`.

**Contract**: `SettingsPanelOptions.watchVoice` opcjonalne; reszta opcji bez zmian.

#### 2. Luki projektu i follow-upy

**File**: `docs/design-gaps.md`, `context/changes/observability-c1-c2/follow-ups/review-fixes.md` (nowy)

**Intent**: wiersze 29 (karta awarii: kit nie ma ekranu błędu; nakładka z części dialogów S-06, z 18, wersja dla rodzica)
i 30 (linia o braku polskiego głosu w panelu). Follow-upy z `Trigger:` — ryzyko #15 do test-planu (`Trigger:
/10x-test-plan refresh`); kalibracja odblokowania po H-7 (`Trigger: S-17`); karta obiecuje powrót do postępów po zapisie
(`Trigger: S-11`); widoczność „opanowane k / ⌈n/2⌉” dla rodzica (`Trigger: S-17 or a parent's feedback`); F5 stan
przytrzymania przy nakładce, po której gra toczy się dalej (`Trigger: any non-terminal overlay that suspends input`);
`audio.noAudio` / odrzucenia audio (`Trigger: S-16 or the first sound`); audyt M-1/M-2/M-13, H-3/H-4 jako otwarte
(`Trigger: next change to TaskScene / narrator`); lista szumu `AbortError`/`NotAllowedError` do przejrzenia, bo
IndexedDB odrzuca przerwaną transakcję jako `AbortError` (prawdziwa awaria zapisu byłaby tylko `console.warn`) (`Trigger:
S-11 or the first promise the app itself awaits`); przekazanie z `BootScene.create` wyjąć z obietnicy czcionki Phasera,
żeby oryginalny wyjątek startu doszedł do granicy (dziś `.catch` `FontFile` go połyka jako „Font failed to load”, a kartę
wywołuje wtórny `TypeError`) (`Trigger: S-11 or the next change to BootScene`). Zamknięte: S-06 „`mountInstallHint` przepuszcza stuknięcie”, S-05 cele
haka w pokoju (dowody z research).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, pliki faz 1–4

**Intent**: Current state: granica błędów (`src/ui/dom/{errorBoundary,errorCard}.ts`, `src/core/errorSignal.ts`),
`openInputSession`, `?e2eFail=` (tylko build e2e) i lista znaczników strażnika, reguła opanowania bez −1, linia „brak
głosu”. Seam sweep: nieaktualne komentarze (`inputSuspend.ts` nagłówek, `UIScene`/`WelcomeScene` o `releaseInput`,
`mastery.ts` nagłówek, `e2eHookGuard.mjs` o jednym znaczniku), martwe pola (`loss`, `releaseInput`), duplikaty.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (`parent-settings.spec.ts` z `silenceSpeech` widzi nową linię i nie pęka)
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/ui/dom/errorcard.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł (profil § 10). Panel bez `watchVoice` → unit zielone (dowód w e2e fazy 7, zapis w handoff §3)
- `grep -rn "a miss = -1\|releaseInput" src/` pusty
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.settings.noVoice` (zrozumiały dla rodzica, bez żargonu technicznego)
- [reviewer] Seam sweep: brak martwych pól i nieaktualnych komentarzy z faz 1–5; DESIGN-GAP 29–30 w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [visual] Zrzuty panelu ustawień bez polskiego głosu (linia widoczna) i z polskim głosem (linia nieobecna) przy 1440×900 i 1024×768; „Zatwierdź”/„Anuluj” widoczne bez przewijania
- [human] Przełącznik czytania zostaje aktywny bez głosu (wybór rodzica zapisany na później) — PRD milczy o ustawieniu; FR-009 ukrywa tylko przycisk HUD

---

## Phase 6: Karta zamiast zamrożonego ekranu — e2e (#15 proposed)

Driver: e2e
Driver why: ryzyko #15 (proposed, test-plan refresh pending): wyjątek zostawia zamrożony ekran bez słowa albo martwy dotyk — istnieje tylko w renderowanej stronie (pętla RAF, obietnica czcionki, listener dotyku); zbudowane w fazie 4, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/error-boundary.spec.ts` (projekt `chromium-hook`), 4 testy.

### Changes Required:

#### 1. Projekt i pomocnik

**File**: `playwright.config.ts`, `tests/e2e/support/welcome.ts`

**Intent**: `ROUND_SPEC` obejmuje `error-boundary` (wpis `webServer` aplikacji nietknięty). `openWelcome`/`passWelcome`
dostają opcjonalny parametr zapytania (np. `{ e2eFail: 'step' }`), doklejany do URL obok `e2eMonth` — dziś `openWelcome`
przyjmuje tylko miesiąc (plan-review F8); istniejące wywołania bez zmian.

#### 2. Spec granicy

**File**: `tests/e2e/error-boundary.spec.ts` (nowy)

**Intent**: (a) „#15 (proposed) an exception in a frame shows the restart card instead of a frozen screen”:
`silenceSpeech`, `passWelcome` z `?e2eFail=step` → `getByRole('alertdialog', { name: pl.errorCard.title })`
widoczny, `snapshot.inputEnabled === false`, tekst wersji = `data-build`; tap „Zacznij od nowa” → nowa nawigacja
(`page.waitForEvent('load')`). (b) „#15 (proposed) a failure while the game boots shows the card” (`?e2eFail=boot`,
nośnik `unhandledrejection` — patrz Known risks). (c) „#15 (proposed) an exception in the parent settings callback shows
the card, not a dead screen”: `passWelcome` → przytrzymanie, bramka, panel, „Zatwierdź” z `?e2eFail=settings` → karta
widoczna, dialog „Ustawienia rodzica” nieobecny. (d) „#15 (proposed) browser noise does not show the card”:
`page.evaluate` → `window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications' }))`
→ karta `toHaveCount(0)`, następne poprawne stuknięcie w rundzie działa (`answerRight` → faza `done`).

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; nigdy `page.clock`; teksty przez `getByRole`
z wartościami z `pl`; żadnej asercji na stosie/komunikacie wyjątku.

**Chromium niedostępny w sesji agenta**: protokół `context/runs/2026-10-13-fix-observability/prompt-phase.md` — spec
bez commita, `e2e-request-p6.md` z komendami i patchami przerw `e2e-break-p6.patch`, `e2e-break-p6b.patch` (tylko kod
produkcyjny, REGUŁA), `STATUS: BLOCKED — e2e needs orchestrator run (request file written)`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/error-boundary.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4` passed
- Deliberate break (patch, REGUŁA): `errorBoundary.ts` bez listenera `unhandledrejection` → (b) czerwony, (a) zielony (dowód, że oba listenery są potrzebne; jeśli (b) zostaje zielony, nośnik startu to `error` — zapis w handoff §3 i `## Known risks`); przywrócone
- Druga przerwa (patch, REGUŁA): `isFatalSignal` zwraca zawsze `true` → (d) czerwony; przywrócone; meta-check: unit fazy 3 też czerwony — wariant sklejki: `errorBoundary.ts` ustawia `hasError: true` zawsze → e2e (d) czerwony, unit zielony
- `npm run build` drukuje `e2e hook: absent (`; `grep -rlE "e2eFail|e2e-forced-failure" dist/` pusty; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 7: Linia o braku polskiego głosu w panelu — e2e (#14 proposed)

Driver: e2e
Driver why: H-6 to ryzyko #14 (proposed, panel rodzica): linia zależy od `speechSynthesis` przeglądarki i subskrypcji w otwartym panelu DOM — widać ją tylko w renderowanej stronie; zbudowane w fazie 5, kontrakt `E2E=on`.

### Overview

Jeden test w `tests/e2e/parent-settings.spec.ts` (wydzielony z dawnej fazy 6 przez plan-review F7).

### Changes Required:

#### 1. Test H-6

**File**: `tests/e2e/parent-settings.spec.ts`, `tests/e2e/support/hook.ts`

**Intent**: „#14 (proposed) the settings panel says when no Polish voice exists”: z `silenceSpeech` → panel → tekst
`pl.settings.noVoice` widoczny; z polską atrapą głosu (wzorzec listy z `narrator.spec.ts`, wydzielony do
`tests/e2e/support/hook.ts` jako `fakePolishVoice(page)`, jeśli kopia byłaby druga) → tekst `toHaveCount(0)`.

**Chromium niedostępny w sesji agenta**: jak w fazie 6 — `e2e-request-p7.md`, patch `e2e-break-p7.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/parent-settings.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 1` passed
- Deliberate break (patch, REGUŁA): `UIScene` nie podaje `watchVoice` → test H-6 czerwony na braku linii; przywrócone; meta-check: unit zielone (szew sceny)
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Zwolnienie wejścia: rzucający `onRelease`, sesja z rzucającym `fn`, idempotentne `end` (`inputSuspend.test.ts`).
- Opanowanie: błąd → seria 0, opanowanie bez zmian; własność „nigdy nie maleje”; rozgrzewka (`mastery.test.ts`, `curriculumEnd.test.ts`).
- Klasyfikator szumu i awarii (`errorSignal.test.ts`); parser `e2eFail`; strażnik z listą znaczników (`e2eHookGuard.test.ts`).

### Integration Tests:

- `npm run sample -- E1..E6`; `npm run build` ze strażnikiem (absent/present); e2e: istniejące 18 + #15 (proposed) × 4 (faza 6) + #14 (proposed) × 1 (faza 7).

### Manual Testing Steps:

1. Zrzuty: karta nad zadaniem i nad powitaniem; panel bez głosu i z głosem — 1440×900 i 1024×768.
2. Odczyt nauczyciela: `pl.errorCard`, `pl.settings.noVoice`, FR-013 i ZADANIA § 1.
3. iPad/Android: karta czytelna, „Zacznij od nowa” uruchamia grę od powitania; panel na Androidzie bez polskiego głosu pokazuje linię.

## Performance Considerations

Dwa listenery okna i klasyfikator wołane tylko przy zdarzeniu błędu — koszt zerowy w normalnej grze. Subskrypcja głosu
żyje tylko przy otwartym panelu.

## Migration Notes

Brak (profil § 4: brak bazy, format zapisu dopiero S-11). Usunięcie `MasteryRules.loss` dotyczy reguły w pamięci sesji.

## Known risks

- **Nośnik startu — potwierdzony odczytem kodu, nie śladem runtime** (plan-review F4): `LoaderPlugin.loadComplete`
  niszczy pliki (`File.destroy` → `loader = null`) **przed** `emit(COMPLETE)`, a `SceneManager` słucha `once` — wyjątek w
  `BootScene.create` łapie `.catch` w `FontFile.onProcess` (`console.warn('Font failed to load')`, bez obiektu błędu),
  drugie `onProcessComplete` rzuca `TypeError` na `this.loader === null` → `unhandledrejection` z **wtórnym** `TypeError`.
  Karta się pojawi, drugiego `create` nie ma; ale oryginalny wyjątek startu nie trafia do `console.error` granicy —
  follow-up (`Trigger: S-11 or the next change to BootScene`). Przerwa 6.2 potwierdza nośnik w runtime.
- **Szum spoza listy** (inne przeglądarki, rozszerzenia z originem strony): mógłby pokazać kartę bez potrzeby. Lista w
  czystej funkcji, łatwa do poszerzenia; `console.warn`/`console.error` pokazują, co przyszło.
- **Restart traci sesję do S-11** (wiersz `[human]` 4.8): karta nie obiecuje zachowania postępów.
- **Szybsze odblokowanie po H-7** (wiersz `[human]` 2.6): dziecko z 30–40 % błędów może odblokować krok — S-17.
- **Chromium w sesji agenta**: fazy 6 i 7 mogą wymagać protokołu pliku żądania (`prompt-phase.md`).
- **`AbortError`/`NotAllowedError` jako szum** (plan-review F6): dziś w `src/` nie ma żadnej obietnicy (`grep` `.then(`,
  `await`, `new Promise` pusty; `registerServiceWorker` i `prompt()` mają własne `.catch`), a Phaser nie odrzuca tymi nazwami
  w ścieżkach, których gra używa — nic prawdziwego się nie ukrywa. Od S-11 przerwana transakcja IndexedDB to `AbortError`
  → follow-up z `Trigger: S-11`.
- **Fokus pod kartą**: jeśli awaria (nie z callbacku) wypadnie przy otwartym oknie rodzica, `openDialog` dalej trzyma Tab
  w oknie pod kartą — tylko klawiatura (cel: dotyk), karta końcowa; bez zmian.

## References

- Research: `context/changes/observability-c1-c2/research.md`; change: `context/changes/observability-c1-c2/change.md`
- Audyt: `context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md` (C-1, C-2, H-6, H-7, L-8)
- Kontrakt runu: `context/runs/2026-10-13-fix-observability/agent-contract.md` („Slice-specific rules”)
- PRD: `context/foundation/prd.md` FR-009, FR-013, FR-014, NFR Prywatność, Business rules; `docs/ZADANIA.md` § 1
- Test-plan: `context/foundation/test-plan.md` (#11; proponowane #14, #15); `context/foundation/test-stack.md` § E2E
- Follow-upy: `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md` (F5, F6)
- Format: `context/archive/2026-10-13-parent-settings-progress/plan.md`

## Autonomous decisions

1. **H-7: decyzja opiekuna (2026-10-13), nie agenta** — błąd zeruje serię, opanowanie nie spada; `loss` usunięte z reguł i
   balansu; FR-013 i ZADANIA § 1 zmienione w fazie 2. Odrzucone: `loss: 0` (martwe pokrętło zapraszające do powrotu
   kary). Zmieniłoby: opiekun zechce strojonej kary w S-17 — pole wraca z domyślnym 0.
2. **Helper sesji `openInputSession` w `core` zamiast `finally` w każdej scenie** (research § 2, opcja b). Dlaczego:
   jedno miejsce testowalne w vitest bez DOM, sceny tylko owijają callbacki. Odrzucone: `finally` per właściciel (pięć
   miejsc, łatwe do pominięcia, niedowodliwe w unit); zwalnianie w `openDialog` (wyjątki padają w kodzie sceny).
   Zmieniłoby: nowy właściciel blokady, który nie jest sceną z dialogiem — wtedy dalej ten sam helper.
3. **Karta na każdą awarię, restart = `location.reload()`, pętla usypiana, wejście wstrzymane na zawsze** (change.md
   decyzja 1, research § 1). Odrzucone: wznawianie pętli; karta tylko dla nośnika RAF (nierozpoznawalny w handlerze).
   → `[human]` 4.8. Zmieniłoby: zapis S-11 (przycisk może obiecać powrót do postępów).
4. **Odrzucenia `AbortError`/`NotAllowedError` to szum** (research Open Question 3). Dlaczego: polityka autoodtwarzania
   audio/mowy odrzuca je bez winy aplikacji, a karta po przeładowaniu wróciłaby w pętli. Odrzucone: wszystkie odrzucenia
   jako awaria. Zmieniłoby: aplikacja sama zacznie używać tych nazw dla prawdziwych błędów.
5. **Bez `audio: { noAudio: true }`** (research Open Question 2) — klasyfikator i rzadkość odrzuceń audio wystarczają;
   konfiguracja dźwięku należy do S-16. **`game.loop.sleep()` przy karcie: tak** — zatrzymuje scenę w połowicznym stanie
   (nośnik b). Zmieniłoby: Phaser zgłosi problem ze `sleep` na martwej pętli — wtedy tylko wejście.
6. **H-6: `watchVoice` (subskrypcja), przełącznik aktywny** (research § 5, change.md decyzja 6). Odrzucone: statyczne
   `voiceAvailable` (nieaktualne, gdy głos dojdzie po otwarciu); wyłączenie przełącznika (gubi wybór rodzica). →
   `[human]` 5.9. Zmieniłoby: kit dostanie wzór stanu „niedostępne”.
7. **Wyzwalacz e2e `?e2eFail=step|boot|settings`** czytany jak `?e2eMonth`, rejestr `REGISTRY_KEYS.forcedFailure`,
   znacznik `e2e-forced-failure`, strażnik z listą (`__martynkaE2E`, `e2eMonth`, `e2eFail`, `e2e-forced-failure`) —
   kontrakt („prove it with the build guard and a grep”). Odrzucone: `fail()` na `window.__martynkaE2E` (hak jest
   tylko do odczytu); sam `page.evaluate` (nie odtwarza nośników a, c ani C-2). `welcome` usunięte w plan-review (F5):
   karta jest nieprzezroczysta, więc zrzut nad powitaniem niczego nie dodaje. Klucz rejestru `forcedFailure` (nie
   `e2eFail` — F1). Zmieniłoby: Phaser dostanie własny hook błędów.
8. **Teksty**: karta „Ups! Gra się zatrzymała.” / „Dotknij przycisku, a gra uruchomi się od nowa.” / „Zacznij od nowa” /
   „Wersja …”; panel: „Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi.” (kierunek
   z audytu; bez „błąd”, bez obietnicy postępów). Teacher read w fazach 4 i 5. Zmieniłoby: odczyt nauczyciela.
9. **Siedem faz (plan-review F7 podzielił e2e); e2e na końcu po seam sweep (faza 5)**: faza 6 — granica (#15 proposed),
   faza 7 — linia H-6 (#14 proposed), jak S-06..S-08.
10. **Brak wiersza roadmapy** — zmiana spoza roadmapy, statusów nie edytujemy (prompt kroku).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Bezpieczne zwolnienie wejścia — L-8 i helper sesji

#### Automated

- [x] 1.1 Nowe testy (rzucający `onRelease`, sesja) czerwone przed (asercja), zielone po; unit `<baseline gałęzi> + N` — 6ad5d53
- [x] 1.2 Deliberate break: `enabled` poza `finally` / `run` bez `end()` przy wyjątku → czerwone; przywrócone; meta-check — 6ad5d53
- [x] 1.3 Pełna bramka lokalna zielona — 6ad5d53 (e2e: orchestrator gate, 18/18 on 6ad5d53 per run-log)

### Phase 2: Opanowanie bez kary za błąd (H-7, decyzja opiekuna)

#### Automated

- [x] 2.1 Odwrócone i nowe testy czerwone przed zmianą `recordRound`, zielone po; unit `<baseline gałęzi> + N` — 1af1734
- [x] 2.2 `loss` usunięte z `mastery.ts` i `balance.ts`; FR-013 i ZADANIA § 1 bez kary za błąd — 1af1734
- [x] 2.3 Deliberate break: odejmowanie przywrócone → „keeps mastery” i własność czerwone; przywrócone; meta-check — 1af1734
- [x] 2.4 `sample` E1–E6 zielone; pełna bramka lokalna zielona — 1af1734 (e2e: orchestrator gate)

#### Manual

- [ ] 2.5 [reviewer] Odczyt nauczyciela nowych zdań FR-013 i ZADANIA § 1
- [ ] 2.6 [human] Decyzja opiekuna H-7 w FR-013 i ZADANIA § 1; odblokowanie przy 60–70 % trafności (~25–35 rund) — kalibracja S-17

### Phase 3: Klasyfikator sygnału błędu, parser `?e2eFail=` i strażnik z listą znaczników

#### Automated

- [x] 3.1 Nowe testy klasyfikatora, parsera i strażnika czerwone przed, zielone po; unit `<baseline gałęzi> + N` — 478a100
- [x] 3.2 Build: komunikat `e2e hook: absent (` / `present (` dosłownie bez zmian — 478a100
- [x] 3.3 Deliberate break: klasyfikator bez reguły `hasError` / strażnik tylko pierwszy znacznik → czerwone; przywrócone; meta-check — 478a100
- [x] 3.4 Pełna bramka lokalna zielona — 478a100 (e2e: orchestrator gate)

### Phase 4: Granica błędów z kartą, miejsca wyzwolenia e2e i sceny na helperze sesji

#### Automated

- [x] 4.1 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` — b2affa1 (e2e 18/18: orchestrator gate, run log)
- [x] 4.2 Build `e2e hook: absent` / `present` (pełna lista wymagana); znaczniki e2e nieobecne w `dist/`; `releaseInput` usunięte z `src/` — b2affa1
- [x] 4.3 Deliberate break: bez `installErrorBoundary` / `applySettings` poza `session.run` → unit zielone; zapis w handoff §3; meta-check — b2affa1
- [x] 4.4 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (pin listy wymaganej) — b2affa1 (e2e: orchestrator gate)

#### Manual

- [ ] 4.5 [reviewer] Odczyt nauczyciela `pl.errorCard` (tytuł, zdanie, przycisk, wersja)
- [ ] 4.6 [reviewer] Callbacki okien w `session.run`, zwolnienie raz, wyjątek nie połykany, handler awarii nie rzuca, `e2eFail` tylko pod `__E2E_HOOK__`
- [ ] 4.7 [visual] Zrzuty karty po awarii w klatce (`step`) i startu (`boot`) — 1440×900 i 1024×768
- [ ] 4.8 [human] Odstępstwo od PRD „niczego stracić”: do S-11 restart z karty kończy sesję; karta na każdą awarię

### Phase 5: Linia „brak polskiego głosu” w panelu, luki projektu, follow-upy i seam sweep

#### Automated

- [x] 5.1 `validate-rule-files.sh` PASS — 799a75f
- [ ] 5.2 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0`
- [x] 5.3 Deliberate break: `CLAUDE.md` wskazuje nieistniejący plik → FAIL; przywrócone; panel bez `watchVoice` → unit zielone, zapis w handoff §3; meta-check — 799a75f
- [x] 5.4 `a miss = -1` i `releaseInput` nieobecne w `src/` — 799a75f
- [x] 5.5 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — 799a75f (e2e: orchestrator gate)

#### Manual

- [ ] 5.6 [reviewer] Odczyt nauczyciela `pl.settings.noVoice`
- [ ] 5.7 [reviewer] Seam sweep: martwe pola, komentarze, duplikaty; DESIGN-GAP 29–30 w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [ ] 5.8 [visual] Zrzuty panelu bez polskiego głosu i z polskim głosem — 1440×900 i 1024×768
- [ ] 5.9 [human] Przełącznik czytania aktywny bez głosu (PRD milczy; FR-009 ukrywa tylko przycisk HUD)

### Phase 6: Karta zamiast zamrożonego ekranu — e2e (#15 proposed)

#### Automated

- [ ] 6.1 Spec `error-boundary` zielony; pełne e2e `<baseline gałęzi e2e> + 4`
- [ ] 6.2 Deliberate break: bez listenera `unhandledrejection` → test startu czerwony (albo zapis nośnika); przywrócone
- [ ] 6.3 Druga przerwa: `isFatalSignal` zawsze `true` (wariant sklejki: `hasError` zawsze `true`) → test szumu czerwony; przywrócone; meta-check
- [ ] 6.4 Build `e2e hook: absent`; znaczniki e2e nieobecne w `dist/`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 7: Linia o braku polskiego głosu w panelu — e2e (#14 proposed)

#### Automated

- [ ] 7.1 Test H-6 w `parent-settings` zielony; pełne e2e `<baseline gałęzi e2e> + 1`
- [ ] 7.2 Deliberate break: `UIScene` bez `watchVoice` → test H-6 czerwony; przywrócone; meta-check
- [ ] 7.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite
