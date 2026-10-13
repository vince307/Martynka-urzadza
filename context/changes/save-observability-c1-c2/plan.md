# Zdrowie zapisu widoczne dla rodzica, przyczyna nieudanego odczytu i naprawa nieznanego pokoju — Implementation Plan

## Overview

Zmiana spoza roadmapy (`save-observability-c1-c2`, autonomiczny run `2026-10-13-fix-save-observability`, gałąź
`feat/save-observability-c1-c2` z `main` @ `4698110`) — poprawka z audytu
`context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md` (PR #34, § 6 kolejność 1–3):

- **C-1** — `loadSave` połyka błąd odczytu (`catch {}` → `{ kind: 'unavailable' }` bez nazwy); sesja nic nie zapisuje,
  nikt się o tym nie dowiaduje. Po zmianie: `unavailable` niesie nazwę błędu, `console.warn` w `start`, przed grą
  spokojna karta (wariant karty nieczytelnego zapisu, bez eksportu), a w panelu rodzica linia „zapis wyłączony”.
- **C-2 (+ M-R6, M-S5)** — trwałe porażki zapisu zostają w `console.error`; `AutosaveStatus` czyta tylko hak e2e;
  `block(reason)` gubi powód. Po zmianie: status runtime rośnie o `blockedBy`, `lastError`, `lastWriteAt`,
  `consecutiveFailures`; czysty `saveHealthView` w `core`; linia „Zapis gry” w panelu ustawień (za bramką dorosłego).
- **M-S4** — wiszący odczyt IndexedDB zostawia pustą stronę na zawsze. Po zmianie: limit `balance.save.loadTimeoutMs`
  w `loadSave` (wstrzyknięte timery) → `unavailable` z `error: 'timeout'`; porzucony odczyt dostaje własne `.catch`.
- **H-R3 (+ M-R5, L-R10)** — nieznany `currentRoom` w zapisie rysuje salon ze stanu innego pokoju, a pierwszy zakup
  nadpisuje `rooms.salon`. Po zmianie: czysta naprawa przy wczytaniu (`repairCurrentRoom`, znane id jako parametr),
  `RoomScene` bierze pokój i stan z jednego id, testy danych po wszystkich `ROOMS`.

Format zapisu zostaje v1 (`SAVE_VERSION = 1`); status żyje tylko w runtime autosavera. Nic nie opuszcza urządzenia.
Brak wiersza roadmapy: statusów w `context/foundation/roadmap.md` nie ruszamy.

## Current State Analysis

Z `research.md` (commit `1e17ccf`) i odczytu kodu w tym kroku (`feat/save-observability-c1-c2` @ `9df5f67`):

- `src/core/autosave.ts`: `LoadOutcome` wariant `{ kind: 'unavailable' }` bez pól; `loadSave(store)` z `catch {}` bez
  limitu czasu; `AutosaveStatus` = `load, blocked, dirty, writes, failures, skipped, lastReason`; `AutosaverOptions` ma
  `timers`, `blocked: boolean`, `log`, brak zegara; `attempt` rzuca zwykły `Error('autosave: encoded state does not
  validate')`; `block: () => {…}` ignoruje argument.
- `src/main.ts` `start`: magazyn `e2eSaveStore()` tylko dla `e2eSave(...) === 'unreadable'`, inaczej
  `createIdbSaveStore()`; `await loadSave(store)` bez limitu; karta `mountSaveFailedCard` i `console.warn` tylko dla
  `unreadable`; `createAutosaver({ blocked: unreadable || unavailable, log: console.error, … })`; `installErrorBoundary`
  callback → `booted.saver?.block('fatal')`; komentarz `DESIGN-GAP 43` („nothing is shown”).
- `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard(parent, { onExport, onContinue })` czyta `pl.saveFailed.*`
  na sztywno i zawsze buduje przycisk eksportu.
- `src/ui/dom/settingsPanel.ts` `SettingsPanelOptions` (`stage`, `autoRead`, `autoReadDefault`, `progress`,
  `watchVoice?`, `onConfirm`, `onCancel`, `parent?`); `src/ui/dom/progressView.ts` `createProgressView` — wzór sekcji,
  która tylko renderuje. Jedyny otwierający: `src/scenes/UIScene.ts` `openSettings` (wraca bez ucznia, czyli przed
  powitaniem panel jest nieosiągalny).
- `src/scenes/RoomScene.ts`: `room()` = `ROOMS[roomId()] ?? ROOMS[FIRST_ROOM]`, `roomState()` = `rooms[roomId()]` —
  dwa różne id przy nieznanym pokoju; `dispatch` pisze `rooms[room.id]` stanem z obcego pokoju.
- `src/core/save.ts` `validateSave` sprawdza `currentRoom ∈ rooms`, nie `ROOMS`; `core` nie importuje `src/data/`.
- `src/testing/e2eHook.ts` `e2eSave` zwraca `'unreadable' | null`; `e2eSaveStore()` bez parametru (przyszła wersja
  zapisu). Znacznik `e2eSave` już jest w `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`. Hak `save` =
  `deepFreeze({ ...saver.status() })` — nowe pola docierają bez zmiany haka.
- `src/data/balance.ts` `balance.save = { debounceMs: 500 }`.
- `tests/autosave.test.ts` `makeClock` ma wewnętrzne `now` (do wystawienia); test „reads once and reports fresh /
  loaded / unreadable / unavailable…” asertuje `toEqual({ kind: 'unavailable' })`. `tests/roomsData.test.ts`
  asertuje tylko `SALON`. Fixtury `tests/fixtures/save-v1.json`, `save-v1-fresh.json` zamrożone.
- `tests/e2e/save-restart.spec.ts` (projekt `chromium-hook`, `ROUND_SPEC`) — wzór „#2 FR-021 an unreadable save…”;
  `tests/e2e/support/welcome.ts` `openWelcome(page, month?, query)`, `passWelcome(page, query?)`, `openSettings(page)`.
- Brak `context/foundation/lessons.md` — żadna lekcja nie ma zastosowania.
- Baseline (kontrakt): `main` @ `4698110`: unit 1142, e2e 29. Każda faza mierzy na gałęzi i raportuje baseline + delta.

## Desired End State

- Odczyt, który rzuca albo nie odpowiada w `balance.save.loadTimeoutMs` (5000 ms), daje
  `{ kind: 'unavailable', error: '<name>' | 'timeout' }`, `console.warn` z nazwą, kartę przed grą („Graj dalej” bez
  eksportu), grę bez zapisu (`blockedBy: 'unavailable'`). Spóźnione odrzucenie porzuconego odczytu nie dochodzi do granicy
  błędów; spóźniony sukces jest ignorowany.
- Rodzic w panelu ustawień widzi sekcję „Zapis gry”: działa (z godziną ostatniego zapisu, jeśli był), ostatnie próby się
  nie udały, albo zapis wyłączony (nieczytelny / niedostępny / do ponownego uruchomienia). Dziecko nie widzi niczego
  nowego w grze.
- Zapis z nieznanym `currentRoom` wczytuje się do salonu; stan innych pokojów (także nieznanego) zostaje nietknięty;
  naprawa trafia na dysk dopiero zwykłym autozapisem po udanym odczycie. `RoomScene` nie może pomieszać dwóch id.
- `encodeSave` daje bajt w bajt ten sam wynik co przed zmianą (fixtury v1 w obie strony).
- E2E (#2): niedostępny odczyt → karta, zero zapisów, linia „wyłączony”; wiszący odczyt → karta po limicie; porażka zapisu
  → linia „nie udały się”; zwykły zapis → linia „działa”.

### Key Discoveries:

- Panel jest modalny (sesja wejścia), więc migawka `saver.status()` przy otwarciu jest dokładna; subskrypcja zbędna.
- Porzucony `store.read()` po limicie **musi** mieć `.catch` — inaczej `unhandledrejection` → `isFatalSignal` (nazwa spoza
  `QUIET_REJECTIONS`) → karta awarii nad działającą grą.
- Naprawa pokoju w `start` biegnie przed `preBoot` i przed listenerami `changedata`/`setdata`, więc sama niczego nie pisze.
- `validateSave` z `ROOMS` zamieniłby nieznany pokój w `corrupt` (karta przy każdym starcie, gra bez zapisu) — odrzucone.

## What We're NOT Doing

- Telemetria, wysyłka statusu, eksport statusu — tylko konsola i linia dla rodzica (PRD: brak telemetrii).
- Zmiana formatu zapisu, `SAVE_VERSION`, `validateSave` (także ścieżka pierwszego złego pola — sygnatura predykatu jest
  walidatorem importu S-12).
- Cofanie zakupu przy nieudanym zapisie (M-R6 zamyka sygnał w panelu, sceny dalej `void flush('now')`).
- Odblokowanie savera po spóźnionym sukcesie odczytu; wznowienie sesji ze spóźnionym zapisem.
- Liczba porażek w tekście dla rodzica (odmiana „raz/razy” — liczba tylko w haku i konsoli).
- M-S1 (`deploy/` zakazane w runie), M-S2 (`persist()`), M-S3 + L-S1 (powód i build na karcie), M-R4, L-S2, L-S3,
  L-R8, L-R9, L-R11 → follow-upy z `Trigger:`. Eksport/import/reset w panelu → S-12.
- Zmiany w `src/ui/dom/errorBoundary.ts`, `src/core/errorSignal.ts` (`QUIET_REJECTIONS`), `WelcomeScene`, `deploy/`.
- `page.clock`; czyszczenie IndexedDB z testu; E2E w CI; WebKit (ręcznie, wiersz `[human]`).

## Implementation Approach

Trzy fazy czystej logiki test-first: (1) status runtime autosavera + `saveHealthView` + dowód niezmienionego
`encodeSave`, (2) `loadSave` z nazwą błędu i limitem czasu + szwy `?e2eSave=` w buildzie hook, (3) naprawa nieznanego
pokoju + jeden resolver w `RoomScene` + testy danych po `ROOMS`. Faza 4: karta „zapis niedostępny” (sparametryzowana
istniejąca karta). Faza 5: sekcja „Zapis gry” w panelu (jeden nowy komponent DOM), luki projektu, follow-upy,
`CLAUDE.md`, seam sweep. Faza 6 (e2e, po seam sweep): ryzyko #2 — cztery testy w `tests/e2e/save-restart.spec.ts`.

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**; żadna faza nie
zmienia komendy bramki. Strażnik buildu bez zmian (znacznik `e2eSave` obejmuje nowe wartości).

## Critical Implementation Details

**Kontrakt statusu (faza 1, od niego zależą fazy 2, 4, 5, 6).** W `src/core/autosave.ts`:
`type BlockReason = 'unreadable' | 'unavailable' | 'fatal'`; `AutosaveStatus` += `blockedBy: BlockReason | null`,
`lastError: string | null` (tylko nazwa błędu, nigdy komunikat ani stos), `lastWriteAt: number | null`,
`consecutiveFailures: number`. `AutosaverOptions`: `blocked: boolean` → `blockedBy: BlockReason | null`, nowe
`now: () => number` i opcjonalne `loadError?: string` (początkowe `lastError`). `status().blocked` zostaje
(`= blockedBy !== null`; hak i spec S-11 go czytają). `block(reason: BlockReason)`: **pierwszy powód wygrywa**.
`attempt`: błąd walidacji ma `name = 'InvalidSave'`; sukces → `lastWriteAt = now()`, `consecutiveFailures = 0`;
porażka → `consecutiveFailures++`, `lastError = errorName(e)`; `failures` (licznik życia) bez zmian.
`errorName(e: unknown): string` = `name` obiektu, gdy jest niepustym ciągiem, inaczej `'Error'`.
`saveHealthView(status): SaveHealthView` w nowym `src/core/saveHealth.ts`:
`{ kind: 'off'; cause: BlockReason } | { kind: 'failing' } | { kind: 'ok'; lastWriteAt: number | null }` —
`blockedBy` → `off`; inaczej `consecutiveFailures > 0` → `failing`; inaczej `ok`.

**Limit odczytu (faza 2).** `loadSave(store, limit?: { timers; timeoutMs })` — bez `limit` zachowanie jak dziś (bez
wyścigu). Z `limit`: wyścig `store.read()` z `timers.setTimeout`; wygrana odczytu czyści timer; wygrana timera →
`{ kind: 'unavailable', error: 'timeout' }`. **Porzucona obietnica odczytu dostaje `.catch(() => undefined)` w chwili
startu wyścigu** (nie po przegranej), a jej spóźniony wynik nigdy nie zmienia zwróconego wyniku. Odrzucenie przed
limitem → `{ kind: 'unavailable', error: errorName(e) }`.

**Szwy e2e (faza 2).** `e2eSave(search): E2ESaveSeam | null`, `E2ESaveSeam = 'unreadable' | 'unavailable' | 'hang' |
'writefail'`; `e2eSaveStore(seam)`: `unreadable` — jak dziś (zapis z wersji 99); `unavailable` — `read` odrzuca
`DOMException('e2e', 'UnknownError')`; `hang` — `read` nigdy się nie rozstrzyga; `writefail` — `read` → `undefined`
(świeży start), `write` odrzuca `DOMException('e2e', 'QuotaExceededError')`. `E2E_LOAD_TIMEOUT_MS = 300` w
`src/testing/e2eHook.ts`; `start` używa go zamiast `balance.save.loadTimeoutMs` **tylko** pod `__E2E_HOOK__` i tylko
dla `hang`. Wszystko w `main.ts` za `__E2E_HOOK__` (DCE); dowód: `npm run build` → `e2e hook: absent (` i
`grep -rl "e2eSave" dist/` pusty.

**Kolejność w `start` (fazy 2–4).** `loadSave` → (unreadable: karta jak dziś | unavailable: karta z fazy 4, ten sam
wzorzec `await new Promise(... onContinue ...)`) → `if (booted.failed) return` → `loaded`: `floorToCalendar`, potem
`repairCurrentRoom` (`console.warn` z poprzednim id) → `createGame` → `createAutosaver`. Naprawa nigdy przed udanym odczytem
i nigdy z zapisem (S-11).

## Phase 1: Status zdrowia zapisu w runtime autosavera

Driver: tdd
Driver why: pola `blockedBy`/`lastError`/`lastWriteAt`/`consecutiveFailures`, powód w `block` i `saveHealthView` nie istnieją — failing testy w `tests/autosave.test.ts` i nowym `tests/saveHealth.test.ts` prowadzą implementację czystej logiki.

### Overview

C-2 i M-S5 w czystym `core`: status, który mówi, dlaczego zapis stoi i kiedy ostatnio się udał; widok dla rodzica.

### Changes Required:

#### 1. Autosaver

**File**: `src/core/autosave.ts`

**Intent**: rozszerzyć status i opcje wg Critical Implementation Details (kontrakt statusu); `block` zachowuje pierwszy
powód; błąd walidacji nazwany `InvalidSave`; wstrzyknięty zegar.

**Contract**: `BlockReason`, `AutosaveStatus` (+4 pola), `AutosaverOptions` (`blockedBy`, `now`, `loadError?`;
bez `blocked`), `Autosaver.block(reason: BlockReason)`, eksport `errorName`. `SaveState`/`encodeSave` nietknięte.

#### 2. Widok dla rodzica

**File**: `src/core/saveHealth.ts` (nowy)

**Intent**: czyste mapowanie statusu na trzy stany (bez tekstów — słowa w `pl.settings` w fazie 5).

**Contract**: `saveHealthView(status: AutosaveStatus): SaveHealthView` wg kontraktu.

#### 3. Wpięcie

**File**: `src/main.ts`

**Intent**: `createAutosaver({ blockedBy: unreadable → 'unreadable', unavailable → 'unavailable', inaczej null, now: () =>
Date.now(), … })`; `block('fatal')` bez zmian w wywołaniu.

#### 4. Testy

**File**: `tests/autosave.test.ts`, `tests/saveHealth.test.ts` (nowy), `tests/save.test.ts`

**Intent**: `makeClock` wystawia `now`. Migracja istniejących wywołań (plan-review F2): domyślne `blocked: false` w `setup`
→ `blockedBy: null` + `now: clock.now`; test ryzyka #2 „after a ${load} load nothing is ever written” → `setup({ load,
blockedBy: load, … })` z tymi samymi asercjami (`writes 0`, `blocked: true`, `skipped > 0`) plus `blockedBy: load` —
nie wolno go osłabić ani usunąć. Autosaver: start z `blockedBy: 'unavailable'` → `blocked: true`,
`blockedBy: 'unavailable'`, `lastError` = `loadError`; `block('fatal')` po `unavailable` → `blockedBy` zostaje
`'unavailable'`; `block('fatal')` na zdrowym → `'fatal'`; zapis udany → `lastWriteAt` = czas zegara,
`consecutiveFailures 0`; dwa nieudane (`store.write` rzuca `DOMException`-podobny `{ name: 'QuotaExceededError' }`) →
`consecutiveFailures 2`, `lastError 'QuotaExceededError'`, potem udany → `0`, `lastError` zostaje (ostatni błąd, nie
bieżący stan), `failures` dalej 2; snapshot, który nie przechodzi walidacji → `lastError 'InvalidSave'`; `errorName` dla
`Error`, obiektu z `name`, ciągu, `undefined`. `saveHealthView`: każdy `blockedBy` → `off` z tą przyczyną (także przy
porażkach), porażki bez blokady → `failing`, zdrowy → `ok` z `lastWriteAt` (także `null` przed pierwszym zapisem).
`save.test.ts`: fixtury `save-v1.json` i `save-v1-fresh.json` → `decodeSave` → `encodeSave` → `toEqual` fixtury (dowód,
że format v1 się nie zmienił) i brak kluczy statusu (`blockedBy`, `lastError`, `lastWriteAt`, `consecutiveFailures`)
w wyniku.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie brak eksportu — eksport-stub najpierw), zielone po; unit `<baseline gałęzi> + N`
- Fixtury v1 w obie strony (`decodeSave` → `encodeSave`) równe sobie; `SAVE_VERSION` = 1; `git diff --stat tests/fixtures/` pusty
- Deliberate break: `block` nadpisuje powód (ostatni wygrywa) → test „first reason wins” czerwony; `consecutiveFailures` nie zerowane po sukcesie → test czerwony; `saveHealthView` sprawdza porażki przed blokadą → test „off także przy porażkach” czerwony; przywrócone; meta-check: oczekiwania z audytu C-2/M-S5 i kontraktu runu, nie z implementacji
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] `lastError` niesie tylko nazwę błędu (nigdy komunikat ani stos); status nie trafia do `SaveState`; `core` bez globali (`Date.now` tylko w `main.ts`)

---

## Phase 2: Przyczyna nieudanego odczytu, limit czasu i szwy `?e2eSave=`

Driver: tdd
Driver why: `loadSave` dziś połyka nazwę i nie ma limitu, a parser `e2eSave` zna jedną wartość — failing testy (nazwa w `unavailable`, limit na wstrzykniętych timerach, spóźnione odrzucenie bez `unhandledrejection`, nowe wartości parsera) prowadzą zmianę.

### Overview

C-1 (przyczyna) i M-S4 (limit) w `core`; wpięcie limitu i szwów w `main.ts`; `console.warn` dla `unavailable`.

### Changes Required:

#### 1. Odczyt

**File**: `src/core/autosave.ts`, `src/data/balance.ts`

**Intent**: `LoadOutcome` `unavailable` z `error: string`; `loadSave` wg Critical Implementation Details (limit odczytu).
`balance.save.loadTimeoutMs: 5000` z komentarzem („a cold IndexedDB open on an older iPad; the page is blank while it
reads, so longer reads look like a crash”).

**Contract**: `loadSave(store: SaveStore, limit?: { timers: AutosaverOptions['timers']; timeoutMs: number }): Promise<LoadOutcome>`;
dalej nigdy nie odrzuca i nigdy nie pisze.

#### 2. Szwy e2e

**File**: `src/testing/e2eHook.ts`

**Intent**: `e2eSave` i `e2eSaveStore(seam)` wg Critical Implementation Details (szwy e2e); `E2E_LOAD_TIMEOUT_MS`.
Komentarz nagłówka modułu wymienia nowe wartości.

#### 3. Wpięcie

**File**: `src/main.ts`

**Intent**: magazyn: `__E2E_HOOK__ && seam ? e2eSaveStore(seam) : createIdbSaveStore()`; `loadSave(store, { timers,
timeoutMs })` z `balance.save.loadTimeoutMs` (pod `__E2E_HOOK__` i `seam === 'hang'`: `E2E_LOAD_TIMEOUT_MS`);
`console.warn(\`Save unavailable (${outcome.error}); playing without saving this session\`)`; `createAutosaver` dostaje
`loadError: outcome.error` dla `unavailable`. Karta dla `unavailable` dopiero w fazie 4.

#### 4. Testy

**File**: `tests/autosave.test.ts`, `tests/e2eSave.test.ts`

**Intent**: `loadSave`: odrzucenie `{ name: 'UnknownError' }` → `{ kind: 'unavailable', error: 'UnknownError' }`;
odrzucenie ciągiem → `error: 'Error'`; bez `limit` → wynik jak dziś dla pozostałych rodzajów; z `limit`: odczyt, który
nie odpowiada → po `advance(timeoutMs - 1)` dalej oczekuje, po `advance(1)` → `{ unavailable, 'timeout' }`; odczyt
szybszy od limitu → wynik odczytu i `clock.pending() === 0`; **odczyt odrzucony po limicie** → wynik `timeout`, a
`process.on('unhandledRejection', …)` w teście (przy odpięciu po teście) nie widzi nic po kilku mikrozadaniach i
`setImmediate`; odczyt rozwiązany po limicie → wynik dalej `timeout`, zero zapisów. Parser: każda z 4 wartości,
wielkość liter, pusty, nieznany; `e2eSaveStore`: `unavailable` odrzuca z nazwą `UnknownError`, `writefail` czyta
`undefined` i odrzuca zapis nazwą `QuotaExceededError`, `hang` nie rozstrzyga się w N mikrozadaniach.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- `npm run build` drukuje `e2e hook: absent (`; `grep -rl "e2eSave" dist/` pusty; `E2E_HOOK=1 npm run build` (lub build e2e z `playwright.config.ts`) drukuje `e2e hook: present (`
- Deliberate break: `.catch` porzuconego odczytu usunięte → test „odczyt odrzucony po limicie” czerwony; wyścig bez czyszczenia timera → test `pending() === 0` czerwony; `catch` bez nazwy (`error: 'Error'` zawsze) → test `UnknownError` czerwony; przywrócone; meta-check: przerwa `.catch` musi być czerwona przez asercję słuchacza `unhandledRejection` w teście, nie przez globalny raport vitest (zapis w handoff §3, który z nich zadziałał)
- Pełna bramka lokalna zielona

---

## Phase 3: Naprawa nieznanego pokoju przy wczytaniu i jeden resolver w `RoomScene`

Driver: tdd
Driver why: `repairCurrentRoom` nie istnieje, a testy danych pokoju widzą tylko `SALON` — failing testy czystej naprawy (inne pokoje nietknięte, wynik przechodzi `validateSave`) i pętli po `ROOMS` prowadzą zmianę.

### Overview

H-R3 na krawędzi (`main.ts`) i w scenie (obrona w głębi); M-R5 i L-R10 jako testy danych.

### Changes Required:

#### 1. Naprawa

**File**: `src/core/rooms.ts`

**Intent**: znany `currentRoom` → ten sam obiekt sesji, `repairedFrom: null`; nieznany → `currentRoom = firstRoom`,
`rooms[firstRoom]` tylko gdy brak → `emptyRoomState()`, każdy inny pokój (także nieznany) skopiowany bez zmian.

**Contract**: `repairCurrentRoom(session: SessionSave, knownIds: readonly string[], firstRoom: string): { session: SessionSave; repairedFrom: string | null }`
(import typu `SessionSave` z `./save`, tylko typ).

#### 2. Wpięcie

**File**: `src/main.ts`

**Intent**: w gałęzi `loaded` po `floorToCalendar`: `repairCurrentRoom(…, Object.keys(ROOMS), FIRST_ROOM)`; przy
`repairedFrom` → `console.warn(\`Save names an unknown room (${repairedFrom}); starting in ${FIRST_ROOM}\`)`.

#### 3. Scena

**File**: `src/scenes/RoomScene.ts`

**Intent**: jeden prywatny resolver `{ room, state }` (`room = ROOMS[roomId()] ?? ROOMS[FIRST_ROOM]`,
`state = rooms[room.id] ?? emptyRoomState()`); `room()`/`roomState()` zastąpione na każdym miejscu wywołania (w tym
`dispatch`, `redraw`, obsługa gestu). `TaskScene.nextRoomTaskCost` bez zmian.

#### 4. Testy

**File**: `tests/rooms.test.ts`, `tests/roomsData.test.ts`

**Intent**: naprawa: znany → `toBe` ten sam obiekt; `{ currentRoom: 'kuchnia', rooms: { kuchnia: X, salon: Y } }` →
`currentRoom 'salon'`, `rooms.kuchnia` i `rooms.salon` `toBe` wejściowe; `{ currentRoom: 'kuchnia', rooms: { kuchnia: X } }`
→ dochodzi `salon: emptyRoomState()`, `kuchnia` nietknięta; wynik naprawy → `validateSave(encodeSave(...))` prawdziwe;
wejście niezmutowane (`structuredClone` przed/po). Dane: inwarianty dziś na `SALON` (sloty = zadania, koszty, pierwszy
w jednej czystej rundzie) w pętli po `Object.values(ROOMS)`; każdy slot ma placeholder w `SALON_PLACEHOLDERS` (M-R5);
`roomText.slot(id)` i `roomText.task(label)` zwracają tekst dla każdego slotu i zadania (L-R10). Plan-review F5: obie
zamrożone fixtury v1 mają `currentRoom: "living"` (spoza `ROOMS`) — dodatkowy przypadek: fixtura → `decodeSave` →
`repairCurrentRoom(…, Object.keys(ROOMS), FIRST_ROOM)` → `currentRoom 'salon'`, `rooms.living` równe wejściu, a
`tests/fixtures/` bez zmian.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: naprawa zastępuje `rooms` przez `{ [firstRoom]: emptyRoomState() }` → test „inne pokoje nietknięte” czerwony; naprawa nadpisuje istniejący `rooms.salon` pustym → test czerwony; usunięty placeholder slotu w kopii danych testu → test M-R5 czerwony; przywrócone; meta-check: oczekiwania z kontraktu runu („must never touch other rooms' state”), nie z kodu
- `grep -n "this.roomState()\|this.room()" src/scenes/RoomScene.ts` pusty (jeden resolver)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Naprawa tylko w gałęzi `loaded`, przed `createGame`, bez zapisu; `RoomScene` liczy pokój i stan z jednego id na każdej ścieżce (gest, panel, `dispatch`, `redraw`, `celebrate`)

---

## Phase 4: Karta „zapis niedostępny” przed grą

Driver: impl
Driver why: sparametryzowanie istniejącego komponentu DOM i sklejka w `main.ts` — zachowanie widać tylko w renderowanej stronie, dowód w e2e fazy 6.

### Overview

Jeden komponent UI (zmiana istniejącego): karta nieczytelnego zapisu z grupą tekstów i opcjonalnym eksportem.

### Changes Required:

#### 1. Karta

**File**: `src/ui/dom/saveFailedCard.ts`

**Intent**: grupa tekstów jako parametr, przycisk „Zachowaj kopię” tylko przy `onExport`; wygląd, `role="alertdialog"`,
fokus na „Graj dalej” bez zmian. Komentarz `DESIGN-GAP 42, 45`.

**Contract**: `mountSaveFailedCard(parent, { copy: SaveCardCopy; onContinue; onExport? })`,
`SaveCardCopy = { title; body; continue; note; export? }`; wywołanie dla `unreadable` przekazuje `pl.saveFailed`.

#### 2. Teksty

**File**: `src/data/pl.ts`

**Intent**: `pl.saveUnavailable`: `title: 'Gra nie może teraz zapisywać postępów'`, `body: 'Przeglądarka nie udostępniła
zapisu gry. Można grać dalej. Jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron.'`,
`continue: 'Graj dalej'`, `note: 'Tym razem gra nie zapisze postępów.'` — bez liczb, bez nazw technicznych.

#### 3. Wpięcie

**File**: `src/main.ts`

**Intent**: dla `unavailable` ten sam blok `await new Promise(... onContinue ...)` z `pl.saveUnavailable` i bez
`onExport`; `booted.failed` po karcie jak dziś; gra startuje z `freshSession(0)`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (spec „#2 FR-021 an unreadable save…” dalej widzi eksport)
- Deliberate break: `main.ts` bez karty dla `unavailable` → unit zielone (zapis w handoff §3: dowód w e2e fazy 6); przywrócone; meta-check zapisany
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.saveUnavailable` (`title`, `body`, `continue`, `note`): spokojnie, dla dorosłego, bez winy, bez żargonu, krótko
- [human] Sprawdzenie na urządzeniu: iPad Safari w trybie prywatnym i z zablokowanymi danymi stron (oraz Android Chrome bez pamięci witryny) — czy karta pojawia się tylko przy faktycznie niedostępnym magazynie, a nie przy zwykłym trybie prywatnym (wniosek z research § 3 niezweryfikowany na urządzeniu; jeśli karta jest rutyną — zostaje tylko linia w panelu)
- [visual] Zrzuty karty „zapis niedostępny” (`?e2eSave=unavailable`) i karty nieczytelnego zapisu (`?e2eSave=unreadable`, regres) przy 1440×900 i 1024×768, z serwera z `E2E_HOOK=1` na porcie 4399

---

## Phase 5: Sekcja „Zapis gry” w panelu rodzica, luki projektu, follow-upy i seam sweep

Driver: impl
Driver why: nowy komponent DOM renderujący `saveHealthView` z fazy 1 i sklejka w `UIScene` plus dokumentacja i porządki — dowód linii w e2e fazy 6.

### Overview

C-2 widoczne dla rodzica; ostatnia faza `impl`/`tdd`: seam sweep całej zmiany.

### Changes Required:

#### 1. Sekcja panelu

**File**: `src/ui/dom/saveHealthView.ts` (nowy), `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`

**Intent**: `createSaveHealthView(view)` wzorem `createProgressView` (renderuje, nic nie liczy poza formatowaniem godziny
`toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })`): nagłówek i jedno zdanie wg stanu; dla `ok` z
`lastWriteAt` drugie zdanie „Ostatni zapis: HH:MM”. Panel wstawia sekcję między czytaniem a postępami.
`UIScene.openSettings` podaje `saveHealthView(saver.status())` z rejestru (`REGISTRY_KEYS.saver`); bez savera — sekcji brak.
Komentarz `DESIGN-GAP 43`.

**Contract**: `SettingsPanelOptions.saveHealth?: SaveHealthView` (opcjonalne); migawka przy otwarciu.

#### 2. Teksty

**File**: `src/data/pl.ts`

**Intent**: `pl.settings`: `saveHeading: 'Zapis gry'`, `saveOk: 'Postępy zapisują się na tym urządzeniu.'`,
`saveLast: (time: string) => \`Ostatni zapis: ${time}\``, `saveFailing: 'Ostatnie próby zapisu się nie udały. Postępy z tej
gry mogą nie zostać zachowane.'`, `saveOff: { unreadable: 'Zapis jest wyłączony: starego zapisu nie udało się wczytać.',
unavailable: 'Zapis jest wyłączony: przeglądarka nie udostępniła zapisu.', fatal: 'Zapis jest wyłączony do ponownego
uruchomienia gry.' }`.

#### 3. Luki projektu, follow-upy, dokumentacja

**File**: `docs/design-gaps.md`, `context/changes/save-observability-c1-c2/follow-ups/review-fixes.md` (nowy), `CLAUDE.md`

**Intent**: wiersz 43 przepisany (sekcja „Zapis gry” w panelu za bramką dorosłego, trzy stany, godzina ostatniego zapisu;
dziecko nie widzi wskaźnika; decyzja S-11 „nic nie pokazujemy” zrewidowana przez tę zmianę); nowy wiersz 45 (karta
„zapis niedostępny”: wygląd wiersza 42 bez eksportu, przy odrzuconym albo wiszącym odczycie). Follow-upy z `Trigger:`:
M-S1 (`Trigger: first save-format change (v2) or the next change to deploy/`), M-S2 (`Trigger: S-12 or a parent
reporting lost progress`), M-S3 + L-S1 (`Trigger: S-12 or the next change to saveFailedCard.ts`), M-R4 (`Trigger: the
first change to a room's task list order`), L-S2 (`Trigger: S-12`), L-S3 (`Trigger: the next change to the
visibilitychange handler in main.ts`), L-R8, L-R9, L-R11 (`Trigger: the next change to RoomScene / stars.ts`); F4 S-11
(`tests/e2eHookGuard.test.ts` jawne przypadki `e2eSave`) przeniesiony z tym samym `Trigger:`; plan-review F3: kierunki
audytu nierealizowane tu — C-2 „`validateSave` zwraca ścieżkę pierwszego złego pola do logu” (`Trigger: S-12 import
validator or the first InvalidSave seen in the parent panel`), M-R5 „rzucić (karta) przy otwartym panelu bez
placeholdera” (`Trigger: the second room in src/data/rooms.ts or the next change to RoomScene redraw/celebrate`), C-2
„delikatny sygnał po N porażkach” — odrzucony (kontrakt: nic dla dziecka), wpis jako zamknięty z uzasadnieniem; S-12 „show the save state
to the parent” oznaczone jako zamknięte tą zmianą. `CLAUDE.md` Current state: status runtime autosavera, `saveHealthView`,
sekcja w panelu, karta „zapis niedostępny”, `loadTimeoutMs`, `repairCurrentRoom`, szwy `?e2eSave=unavailable|hang|writefail`.

#### 4. Seam sweep

**File**: pliki faz 1–5

**Intent**: nieaktualne komentarze (`main.ts` „DESIGN-GAP 43 … nothing is shown”, nagłówek `loadSave` „a failed read is
`unavailable`”, `e2eHook.ts` o jednej wartości `e2eSave`), martwe pola (`AutosaverOptions.blocked`, `room()`/`roomState()`),
duplikaty tekstów karty.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (`parent-settings.spec.ts` widzi nową sekcję i nie pęka)
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/ui/dom/savehealthview.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł. `UIScene` bez `saveHealth` → unit zielone (dowód w e2e fazy 6, zapis w handoff §3)
- `grep -rn "nothing is shown" src/` pusty; `grep -n "blocked:" src/main.ts` bez opcji `blocked`
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.settings` (`saveHeading`, `saveOk`, `saveLast`, `saveFailing`, `saveOff.*`): zrozumiałe dla rodzica, bez żargonu, bez liczb wymagających odmiany
- [reviewer] Seam sweep: brak martwych pól i nieaktualnych komentarzy z faz 1–5; DESIGN-GAP 43 i 45 w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [visual] Zrzuty panelu ustawień ze stanem „działa” (z godziną), „nie udały się” (`?e2eSave=writefail`) i „wyłączony” (`?e2eSave=unavailable`) przy 1440×900 i 1024×768; „Zatwierdź”/„Anuluj” osiągalne
- [human] Forma sygnału dla rodzica (rewizja DESIGN-GAP 43): sekcja „Zapis gry” w panelu za bramką + karta przed grą przy niedostępnym zapisie (kartę może zobaczyć dziecko); dziecko nie widzi wskaźnika w grze
- [human] Akceptacja tekstów: `pl.saveUnavailable` i sekcja „Zapis gry” w `pl.settings`

---

## Phase 6: Zdrowie zapisu w przeglądarce — e2e (#2)

Driver: e2e
Driver why: ryzyko #2 (postęp znika po restarcie/aktualizacji) w wariancie „zapis po cichu nie działa”: karta przed grą, sekcja panelu i blokada zapisu istnieją tylko w renderowanej stronie z prawdziwym `start`; zbudowane w fazach 2–5, kontrakt `E2E=on`.

### Overview

Cztery testy w `tests/e2e/save-restart.spec.ts` (projekt `chromium-hook`, już w `ROUND_SPEC`). Nowy kontekst przeglądarki =
świeże urządzenie; żadnego dostępu do IndexedDB z testu; nigdy `page.clock`; panel przez istniejący `openSettings(page)`
(przytrzymanie 2 s).

### Changes Required:

#### 1. Typ migawki

**File**: `tests/e2e/support/hook.ts`

**Intent**: `Snapshot['save']` z nowymi polami statusu (`blockedBy`, `lastError`, `lastWriteAt`, `consecutiveFailures`).

#### 2. Spec

**File**: `tests/e2e/save-restart.spec.ts`

**Intent**: (a) „#2 C-1 a save the browser will not give shows the card, plays without writing and says so in the parent
panel”: `page.goto('/?e2eSave=unavailable')` jak spec „#2 FR-021” (plan-review F1: **nie** `openWelcome`/`passWelcome*` —
czekają na `__martynkaE2E`, a hak powstaje dopiero po zamknięciu karty, i same nawigują) →
`getByRole('alertdialog', { name: pl.saveUnavailable.title })`, przycisk `pl.saveFailed.export` `toHaveCount(0)`,
„Graj dalej” → `waitForFunction('__martynkaE2E' in window)` → `screenIs(page, 'welcome')` → tap wieku w miejscu
(`targets(page).ages[0]`, jak spec FR-021; wiek 6 = E1, bez rozgrzewki) → `expect.poll` ekran `task` →
`snapshot.save` `toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable', lastError: 'UnknownError', writes: 0 })`
i `skipped > 0` → `openSettings` → tekst `pl.settings.saveOff.unavailable` widoczny. (b) „#2 M-S4 a read that never
answers ends in the same card after the load timeout”: `page.goto('/?e2eSave=hang')` (nie `openWelcome`) → karta widoczna → „Graj dalej” → `snapshot.save`
`{ load: 'unavailable', blockedBy: 'unavailable', lastError: 'timeout' }`. (c) „#2 C-2 failed writes show in the parent
panel”: `e2eSave: 'writefail'` → `passWelcome` → `expect.poll` aż `consecutiveFailures >= 1` i `lastError
'QuotaExceededError'` → `openSettings` → tekst `pl.settings.saveFailing`. (d) „#2 C-2 the parent panel says the game
saves after a normal write”: bez szwu → `passWelcome` → `expect.poll` aż `writes >= 1` → `openSettings` → `pl.settings.saveOk`
i tekst zaczynający się od `pl.settings.saveLast('')`.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty z `pl` przez `getByRole`/`getByText`;
żadnej asercji na komunikacie błędu ani godzinie.

**Chromium niedostępny w sesji agenta**: protokół `context/runs/2026-10-13-fix-save-observability/prompt-phase.md` —
spec bez commita, `e2e-request-p6.md` z komendami i patchami przerw `e2e-break-p6.patch`, `e2e-break-p6b.patch`,
`e2e-break-p6c.patch` (tylko kod produkcyjny, REGUŁA), `STATUS: BLOCKED — e2e needs orchestrator run (request file written)`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-restart.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4` passed
- Deliberate break (patch `e2e-break-p6.patch`, REGUŁA): `main.ts` pokazuje kartę tylko dla `unreadable` → (a) i (b) czerwone na `alertdialog`; przywrócone
- Deliberate break (patch `e2e-break-p6b.patch`, REGUŁA): `main.ts` woła `loadSave(store)` bez limitu → (b) czerwony (karta nigdy), (a) zielony; meta-check: unit fazy 2 zielone przy tej przerwie — e2e dowodzi sklejki limitu w `start`, nie wyścigu
- Deliberate break (patch `e2e-break-p6c.patch`, REGUŁA): `UIScene.openSettings` nie podaje `saveHealth` → (a), (c), (d) czerwone na tekście sekcji; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; `grep -rl "e2eSave" dist/` pusty; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Status: pierwszy powód blokady, `lastError` (nazwa), `lastWriteAt`, `consecutiveFailures`, `InvalidSave`; `saveHealthView` (trzy stany); fixtury v1 w obie strony.
- Odczyt: nazwa błędu, limit na wstrzykniętych timerach, porzucony odczyt bez `unhandledRejection`, spóźniony sukces ignorowany; parser i magazyny szwów.
- Naprawa pokoju: inne pokoje nietknięte, brak salonu → pusty, wynik przechodzi `validateSave`; dane po wszystkich `ROOMS` (M-R5, L-R10).

### Integration Tests:

- `npm run sample -- E1..E6` (treść nietknięta); `npm run build` ze strażnikiem; e2e: istniejące 29 + #2 × 4 (faza 6).

### Manual Testing Steps:

1. Zrzuty: karta „zapis niedostępny”, karta nieczytelnego zapisu (regres), panel w trzech stanach — 1440×900 i 1024×768.
2. Odczyt nauczyciela: `pl.saveUnavailable`, `pl.settings` (sekcja zapisu).
3. iPad/Android: tryb prywatny i zablokowane dane stron — karta tylko przy faktycznie niedostępnym magazynie; panel po
   zwykłej grze pokazuje „działa” z godziną.

## Performance Considerations

Jeden dodatkowy timer przy starcie (czyszczony po odczycie); status to kilka pól w domknięciu; sekcja panelu liczona raz
przy otwarciu. Limit 5000 ms to górna granica pustej strony przy wiszącej bazie (dziś: bez końca).

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1; status runtime nie trafia do `SaveState` (dowód: fixtury w fazie 1). Naprawiony
`currentRoom` dociera na dysk tylko zwykłym autozapisem po udanym odczycie; nieznany pokój zostaje w `rooms` dla
przyszłego builda, który go zna.

## Known risks

- **Karta przy `unavailable` jako rutyna** — wniosek z research § 3 (prywatne okna dają IndexedDB), niezweryfikowany na
  urządzeniu → `[human]` 4.5; wariant awaryjny: tylko sekcja w panelu.
- **Limit 5000 ms na starym iPadzie** — zimne otwarcie bazy dłuższe niż limit dałoby kartę i sesję bez zapisu, choć zapis
  istnieje (następne uruchomienie go wczyta; nic nie jest nadpisywane, bo saver jest zablokowany). Wartość w
  `balance.save`, łatwa do zmiany.
- **Godzina w panelu** zależy od strefy i `toLocaleTimeString` przeglądarki — e2e nie asertuje godziny.
- **Spóźnione odrzucenie** — jeśli `.catch` zginie w refaktorze, karta awarii wróci nad działającą grą; test fazy 2 go pilnuje.
- **Chromium w sesji agenta**: faza 6 może wymagać protokołu pliku żądania (`prompt-phase.md`).
- **M-R6 dowiedziony pośrednio** (plan-review F6): e2e (c) pokazuje porażkę dowolnego zapisu, nie zakupu; zakup woła ten sam
  `flush('now')` → `attempt`, więc status jest ten sam. Gdyby scena kiedyś zapisywała inną ścieżką — test zakupu z `writefail`.

## References

- Research: `context/changes/save-observability-c1-c2/research.md`; change: `context/changes/save-observability-c1-c2/change.md`
- Audyt: `context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md` (C-1, C-2, H-R3, M-R5, M-R6, M-S4, M-S5, L-R10)
- Kontrakt runu: `context/runs/2026-10-13-fix-save-observability/agent-contract.md` („Slice-specific rules”)
- PRD: `context/foundation/prd.md` guardrail „Postęp nigdy nie ginie”, FR-020, FR-021, Ograniczenia (brak telemetrii)
- Test-plan: `context/foundation/test-plan.md` ryzyka #2, #10, #16; „Never `page.clock`”; `context/foundation/test-stack.md` § E2E
- Follow-upy: `context/archive/2026-10-13-autosave-versioned-save/follow-ups/review-fixes.md` (F3 — w zakresie, faza 6; F4 — przeniesiony)
- Format: `context/archive/2026-10-13-observability-c1-c2/plan.md`, `context/archive/2026-10-13-autosave-versioned-save/plan.md`

## Autonomous decisions

1. **Zakres: C-1, C-2, H-R3, M-R6, M-S5 + M-S4 + M-R5 + L-R10 (testy danych) + F3 S-11** (research Open Question 4).
   Odrzucone: M-S2 (wymaga asynchronicznego kanału z `requestPersistence`), M-S3/L-S1, M-R4, M-S1 (`deploy/` zakazane).
   Zmieniłoby: plan-review uzna fazę 3 za za dużą — M-R5/L-R10 wtedy do follow-upu.
2. **Pierwszy powód blokady wygrywa** (research OQ 1) — oryginalna przyczyna jest użyteczna; `fatal` po `unavailable`
   niczego nie dodaje. Odrzucone: ostatni wygrywa. Zmieniłoby: potrzeba pokazania obu (lista powodów).
3. **`AutosaverOptions.blocked` → `blockedBy`** (jedno źródło prawdy), `status().blocked` zostaje dla haka i spec S-11.
   Odrzucone: oba pola w opcjach (sprzeczne stany). Zmieniłoby: inny wywołujący `createAutosaver` niż `main.ts` i testy.
4. **`saveHealthView(status)` bez `now`** — panel pokazuje godzinę zegarową, nie „N minut temu” (bez odmiany liczebników).
   „Nie udały się” od pierwszej porażki z rzędu (`consecutiveFailures > 0`), bez progu w `balance`. Odrzucone: próg N
   (pojedyncza porażka i tak zostaje widoczna tylko do następnego udanego zapisu). Zmieniłoby: sygnał „nie udały się”
   pojawiający się w zwykłej grze (wtedy próg w `balance.save`).
5. **Migawka przy otwarciu panelu** (research § 2) — panel modalny; odrzucone: subskrypcja wzorem `watchVoice`
   (autosaver nie ma zdarzeń). Zmieniłoby: panel niemodalny.
6. **Karta „zapis niedostępny” = sparametryzowana karta nieczytelnego zapisu** (research § 3), bez eksportu (nie ma
   czego eksportować). Odrzucone: druga karta (duplikat), tylko linia w panelu (panel osiągalny dopiero po powitaniu,
   C-1 dalej cichy). → `[human]` 4.5, 5.9. Zmieniłoby: urządzenia pokażą kartę jako rutynę.
7. **Limit odczytu 5000 ms w `balance.save.loadTimeoutMs`, w `loadSave` (nie w `src/storage`)** (research § 4: `createStore`
   otwiera bazę leniwie w `read`). E2E: `?e2eSave=hang` z `E2E_LOAD_TIMEOUT_MS = 300` tylko w buildzie hook (bez
   `page.clock`, bez czekania 5 s). Zmieniłoby: urządzenie z zimnym otwarciem > 5 s.
8. **Naprawa pokoju w `start` z `Object.keys(ROOMS)` jako parametrem, nieznany pokój zostaje w `rooms`** (research § 5).
   Odrzucone: `validateSave` z `ROOMS` (nieznany pokój → `corrupt`, drzwi jednokierunkowe), naprawa w `decodeSave`
   (przyszły walidator importu S-12), usunięcie nieznanego pokoju (utrata stanu dla przyszłego builda).
   Zmieniłoby: `core` mógłby importować `src/data/rooms.ts`.
9. **Czwarty szew `writefail`** (poza listą z promptu: `unavailable`, `hang`) — bez niego C-2 (sedno: porażki zapisu) nie
   ma dowodu w przeglądarce ani zrzutu stanu „nie udały się”; mieści się w istniejącym znaczniku `e2eSave`.
   Zmieniłoby: plan-review uzna stan za wystarczająco pokryty unitem — wtedy (c) i zrzut wypadają.
10. **Teksty** (research § 7, poprawione: „na tym urządzeniu” zamiast „na tym tablecie”, jak `pl.settings.noVoice`; „nie
    udostępniła” zamiast „nie pozwoliła odczytać”). Teacher read w fazach 4 i 5, akceptacja `[human]` 5.10.
11. **Sześć faz, jedna faza e2e po seam sweep** (prompt kroku). Brak wiersza roadmapy — statusów nie edytujemy.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Status zdrowia zapisu w runtime autosavera

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — fb2e7bb
- [x] 1.2 Fixtury v1 w obie strony równe sobie; `SAVE_VERSION` = 1; `tests/fixtures/` bez zmian — fb2e7bb
- [x] 1.3 Deliberate break: ostatni powód wygrywa / brak zerowania `consecutiveFailures` / porażki przed blokadą w widoku → czerwone; przywrócone; meta-check — fb2e7bb
- [x] 1.4 Pełna bramka lokalna zielona — fb2e7bb (e2e: orchestrator run on a1dfa86, 29 passed)

#### Manual

- [ ] 1.5 [reviewer] `lastError` tylko nazwa; status poza `SaveState`; `core` bez globali

### Phase 2: Przyczyna nieudanego odczytu, limit czasu i szwy `?e2eSave=`

#### Automated

- [x] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 11b492c
- [x] 2.2 Build: `e2e hook: absent (`; `e2eSave` nieobecne w `dist/`; build e2e `e2e hook: present (` — 11b492c
- [x] 2.3 Deliberate break: bez `.catch` porzuconego odczytu / timer nieczyszczony / bez nazwy błędu → czerwone; przywrócone; meta-check — 11b492c
- [x] 2.4 Pełna bramka lokalna zielona — 11b492c (e2e: orchestrator run on 65dfce8, 29 passed)

### Phase 3: Naprawa nieznanego pokoju przy wczytaniu i jeden resolver w `RoomScene`

#### Automated

- [x] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 5b78176
- [x] 3.2 Deliberate break: naprawa gubi inne pokoje / nadpisuje salon / brak placeholdera → czerwone; przywrócone; meta-check — 5b78176
- [x] 3.3 `RoomScene` bez `this.room()`/`this.roomState()` (jeden resolver) — 5b78176
- [x] 3.4 Pełna bramka lokalna zielona — 5b78176 (e2e: orchestrator run on 2b964c2, 29 passed)

#### Manual

- [ ] 3.5 [reviewer] Naprawa tylko w gałęzi `loaded`, przed `createGame`, bez zapisu; scena na jednym id na każdej ścieżce

### Phase 4: Karta „zapis niedostępny” przed grą

#### Automated

- [x] 4.1 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` — cadda19 (e2e: orchestrator run on b337d4c, 29 passed)
- [x] 4.2 Deliberate break: bez karty dla `unavailable` → unit zielone; zapis w handoff §3; meta-check — cadda19 (unit green on the break, proof is e2e of phase 6)
- [x] 4.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — cadda19 (e2e: orchestrator run on b337d4c, 29 passed)

#### Manual

- [ ] 4.4 [reviewer] Odczyt nauczyciela `pl.saveUnavailable`
- [ ] 4.5 [human] Urządzenie: iPad Safari prywatnie / zablokowane dane stron, Android bez pamięci witryny — karta tylko przy faktycznie niedostępnym magazynie
- [ ] 4.6 [visual] Zrzuty karty „zapis niedostępny” i karty nieczytelnego zapisu — 1440×900 i 1024×768

### Phase 5: Sekcja „Zapis gry” w panelu rodzica, luki projektu, follow-upy i seam sweep

#### Automated

- [x] 5.1 `validate-rule-files.sh` PASS — 9204dd8
- [x] 5.2 `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` — 9204dd8 (e2e: orchestrator gate)
- [x] 5.3 Deliberate break: `CLAUDE.md` wskazuje nieistniejący plik → FAIL; przywrócone; `UIScene` bez `saveHealth` → unit zielone, zapis w handoff §3; meta-check — 9204dd8 (UIScene without saveHealth: unit green, proof in e2e of phase 6)
- [x] 5.4 „nothing is shown” nieobecne w `src/`; opcja `blocked` usunięta z `main.ts` — 9204dd8
- [x] 5.5 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — 9204dd8 (e2e: orchestrator gate)

#### Manual

- [ ] 5.6 [reviewer] Odczyt nauczyciela sekcji zapisu w `pl.settings`
- [ ] 5.7 [reviewer] Seam sweep: martwe pola, komentarze, duplikaty; DESIGN-GAP 43 i 45; follow-upy z `Trigger:`
- [ ] 5.8 [visual] Zrzuty panelu: „działa” (z godziną), „nie udały się”, „wyłączony” — 1440×900 i 1024×768
- [ ] 5.9 [human] Forma sygnału dla rodzica (rewizja DESIGN-GAP 43): sekcja w panelu za bramką + karta przed grą; brak wskaźnika dla dziecka
- [ ] 5.10 [human] Akceptacja tekstów `pl.saveUnavailable` i sekcji „Zapis gry”

### Phase 6: Zdrowie zapisu w przeglądarce — e2e (#2)

#### Automated

- [ ] 6.1 `save-restart.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`
- [ ] 6.2 Deliberate break (patch): karta tylko dla `unreadable` → (a), (b) czerwone; przywrócone
- [ ] 6.3 Deliberate break (patch): `loadSave` bez limitu w `start` → (b) czerwony, unit zielone; meta-check
- [ ] 6.4 Deliberate break (patch): `UIScene` bez `saveHealth` → (a), (c), (d) czerwone; przywrócone
- [ ] 6.5 `e2e hook: absent`; `e2eSave` nieobecne w `dist/`; pełna bramka lokalna zielona; serwery zabite
