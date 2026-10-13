# Eksport, import i reset zapisu w panelu rodzica oraz domknięcie ustaleń audytu zapisu — Implementation Plan

## Overview

Slice roadmapy **S-12** (`save-export-import-reset`, etap M5, zamyka M5), autonomiczny run `2026-10-13-s12-s14`, gałąź
`feat/save-export-import-reset` z `main` @ `f3088d4`. Rodzic w panelu ustawień (za bramką dorosłego):

- **eksportuje** bieżący zapis do lokalnego pliku — dopiero po wyraźnym potwierdzeniu (audyt **L-S2**), plik niesie build
  i datę (audyt **M-S3**);
- **importuje** plik po walidacji (limit rozmiaru → `JSON.parse` → koperta → `decodeSave`) i po podsumowaniu „teraz /
  z pliku” (gwiazdki, etap, postęp pokoju) — plik, który nie przechodzi, nigdy nie dotyka bieżącego zapisu (ryzyko **#7**);
- **resetuje** grę z potwierdzeniem i podsumowaniem tego, co zniknie → ekran powitalny.

Do tego z kontraktu runu: karta nieczytelnego zapisu pokazuje kod powodu i build, a kopia surowa niesie je w pliku
(**M-S3**); sekcja „Zapis gry” ma stan „jeszcze nie zapisano” i notkę o wcześniejszych porażkach (**N-8**) oraz wynik
`persist()` (**M-S2**). N-7 poza zakresem. Format zapisu zostaje **v1**. Nic nie opuszcza urządzenia.

## Current State Analysis

Z `research.md` (commit `ca0c645`) i odczytu kodu w tym kroku (`feat/save-export-import-reset` @ `23d8dcc`):

- `src/core/autosave.ts` `createAutosaver`: `attempt` (snapshot → `encodeSave` → `validateSave` → `store.write`),
  `save` (pomija przy `blockedBy !== null`, czeka na `inflight`), `block(reason)` = `blockedBy ??= reason` — jednokierunkowe,
  brak odblokowania. `onFirstWrite?: () => void`. `AutosaveStatus` ma `writes`, `failures`, `consecutiveFailures`,
  `lastError`, `lastWriteAt`, `blockedBy`. Brak metody, która zapisuje podany stan.
- `src/main.ts` `start`: magazyn jest lokalną zmienną `start`; `freshSession(stars)` jest lokalną funkcją modułu;
  `pagehide` i `visibilitychange` hidden → `saver.flush('hidden')`; karta `mountSaveFailedCard` z
  `onExport → openParentGate → onPass: () => void exportRawSave(raw)` (pobranie od razu po bramce — L-S2);
  `console.warn(\`Save unreadable (${outcome.reason})…\`)` — powód tylko w konsoli (M-S3); `onFirstWrite: requestPersistence`.
- `src/storage/idb.ts` `requestPersistence(): void` — wynik `persist()` odrzucony (M-S2).
- `src/core/saveHealth.ts` `saveHealthView`: `off` > `failing` > `ok` (także przy `writes === 0` — N-8).
- `src/ui/dom/saveExport.ts` `exportRawSave(raw)`: `File` `pl.saveFailed.fileName` (`martynka-zapis.txt`, `text/plain`),
  share sheet gdy `canShare({ files })`, inaczej `a.download`; zwraca `void`.
- `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard` (`SaveCardCopy` `title/body/continue/note/export?`).
- `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (etap, czytanie, „Zapis gry”, postępy, sticky „Zatwierdź”/„Anuluj”);
  `src/ui/dom/saveHealthView.ts` `createSaveHealthView`; `src/ui/dom/dialog.ts` `openDialog`; `src/ui/dom/overlay.ts`
  `createButton`, `createText`. Brak jakiegokolwiek `<input type="file">` w `src/`.
- `src/scenes/UIScene.ts` `openSettings`: `openInputSession` → `openParentGate` → `openSettingsPanel`; każdy callback
  w `session.run`; `closeSettings` kończy sesję. `tests/dialogSessions.test.ts` `DIALOG_CALLBACKS =
  {onPass, onConfirm, onCancel}`, oczekiwane liczby `UIScene.ts` 4, `WelcomeScene.ts` 4.
- `src/core/save.ts`: `decodeSave` (nigdy nie rzuca; `corrupt`/`future`/`unknown-version`), `validateSave` (predykat),
  `encodeSave`, `rawExportText`, `SAVE_VERSION = 1`, `MIGRATIONS` puste; fixtury `tests/fixtures/save-v1.json`,
  `save-v1-fresh.json` zamrożone.
- `src/core/rooms.ts` `emptyRoomState`, `roomDone`; `src/data/rooms.ts` `ROOMS`, `FIRST_ROOM` (jeden pokój: salon,
  10 zadań); nazwa pokoju w `pl.room.name`. `src/core/text/plural.ts` `countNoun`, `inflect`; `src/data/nouns.ts` ma
  `gwiazdka`.
- `tests/e2e/save-restart.spec.ts` „#2 FR-021 an unreadable save shows the parent card, exports the raw copy…” —
  pobranie zaraz po bramce (`waitForEvent('download')`), asercje `suggestedFilename() === pl.saveFailed.fileName`,
  tekst zawiera `"version": 99` i `"stars": 7`. **Zmiana L-S2 (krok potwierdzenia) wymaga aktualizacji tego testu w tej
  samej fazie.** `playwright.config.ts` `ROUND_SPEC` — regex nazw spec projektu `chromium-hook`.
- `src/scenes/WelcomeScene.ts` `openParent` już sprawdza `!suspender || this.session` — follow-up F6 jest w praktyce
  zamknięty (wyrównanie do `active()` w seam sweep).
- Brak `context/foundation/lessons.md` — żadna lekcja nie ma zastosowania.
- Baseline (kontrakt): `main` @ `f3088d4`: unit `1176 passed`, e2e `33 passed`. Każda faza mierzy na gałęzi i raportuje
  baseline + delta.

## Desired End State

- Panel ustawień ma pod „Zapis gry” trzy przyciski: „Zapisz kopię”, „Wczytaj z pliku”, „Zacznij od nowa”. Każdy zamyka
  panel (niezatwierdzone wybory etapu/czytania przepadają) i otwiera krok w tej samej sesji wejścia.
- Eksport: dialog z notką prywatności → „Zapisz plik” (share sheet w tym stuknięciu, inaczej pobranie) → linia wyniku
  (udostępniono / pobrano / anulowano / nie udało się) → „Zamknij”. Plik `martynka-zapis-RRRR-MM-DD.txt`, treść JSON:
  `{ app: 'martynka-urzadza', kind: 'save', build, exportedAt, save: <SaveState v1> }`.
- Kopia surowa z karty nieczytelnego zapisu: bramka → ten sam dialog potwierdzenia → plik `martynka-zapis.txt` z kopertą
  `kind: 'raw'` (`reason`, `build`, `raw`). Karta pokazuje wyciszoną linię „Kod: corrupt · Wersja abc1234”.
- Import: wybór pliku → za duży / nie JSON / nie z tej gry / uszkodzony / z nowszej wersji → spokojny komunikat, zapis
  nietknięty; poprawny → podsumowanie „Teraz” i „Z pliku” (gwiazdki z odmianą, etap, „Salon: N z 10”) + notka prywatności →
  „Wczytaj” → `saver.replace` → przeładowanie strony → gra ze stanem z pliku. Nieudany zapis → komunikat, bez przeładowania,
  autozapis działa dalej.
- Reset: podsumowanie tego, co zniknie + „Zacznij od nowa” (drugie stuknięcie) → `saver.replace(świeży zapis)` →
  przeładowanie → ekran powitalny, 0 gwiazdek.
- „Zapis gry”: `notYet` przed pierwszym zapisem; po sukcesie z wcześniejszymi porażkami notka „Wcześniej: 2 nieudane próby
  (QuotaExceededError).”; zdanie o trwałości wg wyniku `persist()`.
- `encodeSave` bajt w bajt jak przed zmianą (fixtury v1 w obie strony); żadne pole runtime nie trafia do `SaveState`.
- E2E: import złego pliku nie zmienia stanu po przeładowaniu; import dobrego pliku daje stan z pliku po przeładowaniu;
  reset kończy się powitaniem; eksport z panelu pobiera kopertę z buildem.

### Key Discoveries:

- `block()` jest jednokierunkowe — nieudany import zostawiłby grę bez zapisu; stąd osobna flaga `replace`.
- Przeładowanie samo wyzwala `pagehide` → `flush('hidden')`; bez wyłączenia zapisów po udanym `replace` stary snapshot
  nadpisałby właśnie zapisany stan.
- `navigator.share` wymaga przejściowej aktywacji (5 s w WebKit) — `File` budowany synchronicznie, `share()` wołane
  w handlerze „Zapisz plik”, przed jakimkolwiek wolnym `await`.
- Chromium (Android) odrzuca `.json`/`application/json` w share sheet (`share_service_impl.cc`) — zostaje `.txt`.
- Specy importu/resetu muszą używać prawdziwego IndexedDB (magazyny `?e2eSave=` są w pamięci i giną przy przeładowaniu).

## What We're NOT Doing

- Zmiana formatu zapisu, `SAVE_VERSION`, `MIGRATIONS`, fixtur v1 (koperta to format PLIKU, nie zapisu).
- N-7 (`loadSave` timeout vs odrzucenie — czeka na pomiar na iPadzie); L-S1 (`decodeSave` `catch` → osobny
  `migration-failed`; ścieżka nieosiągalna bez kroku migracji); F7 (`pl.settings.empty`).
- Import z ekranu powitalnego („Rodzic”) — FR-022/US-03 mówią o ustawieniach.
- Automatyczna kopia poprzedniego zapisu w IndexedDB pod drugim kluczem; `delete` w `SaveStore`.
- Podmiana stanu w działającej grze bez przeładowania; ostrzeżenie drugiej karty tego samego originu (ryzyko zostaje).
- Pełna ścieżka pola w walidatorze (`saveProblem` zwraca tylko pierwszy zły klucz najwyższego poziomu).
- File System Access API; `.json` jako rozszerzenie eksportu.
- Zmiany w `deploy/`, `src/core/errorSignal.ts`, `src/ui/dom/errorBoundary.ts`; telemetria; `page.clock`; czyszczenie
  IndexedDB z testu; E2E w CI.

## Implementation Approach

Trzy fazy czystej logiki test-first: (1) `Autosaver.replace`/`current` + `freshSession` w `core`; (2) plik zapisu:
koperta, `parseImport`, podsumowanie, `saveProblem`; (3) N-8 + M-S2 w statusie i widoku zdrowia (plus zdania w istniejącej
sekcji). Potem trzy fazy UI, każda z jednym nowym komponentem DOM: (4) eksport + M-S3 na karcie, (5) import,
(6) reset + luki projektu + follow-upy + `CLAUDE.md` + seam sweep. Faza 7 (e2e, po seam sweep): ryzyka #7, #2, #10 w nowym
`tests/e2e/save-transfer.spec.ts`.

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build, e2e **bez zmian**. Faza 7 dopisuje
`save-transfer` do regexu `ROUND_SPEC` w `playwright.config.ts` — komenda bramki zostaje `npx playwright test`, nowy plik
biegnie w projekcie `chromium-hook`. Faza 4 zmienia istniejący test FR-021 (krok potwierdzenia); e2e po fazach 4–6 uruchamia
orkiestrator (subagent zwykle nie startuje Chromium, profil § 8).

## Critical Implementation Details

**Kontrakt `replace` (faza 1; zależą od niego fazy 5, 6, 7).** `src/core/autosave.ts`:
`Autosaver.replace(state: SaveState): Promise<ReplaceResult>`, `ReplaceResult = { ok: true } | { ok: false; error: string }`.
Kolejność: (0) `replacing || replaced` → `{ ok: false, error: 'Busy' }` bez zapisu (drugie wywołanie w toku albo po
sukcesie; plan-review F4); (1) `blockedBy === 'fatal'` → `{ ok: false, error: 'Blocked' }` bez zapisu; (2) `!validateSave(state)` →
`{ ok: false, error: 'InvalidSave' }` bez zapisu; (3) ustaw `replacing = true` (osobna flaga, **nie** `blockedBy`;
`save` i `markDirty` traktują ją jak blokadę: `skipped++`), `cancelTimer()`; (4) `await inflight` (jeśli jest);
(5) `await store.write(state)`; sukces → `replaced = true` (zapisy zostają wyłączone do przeładowania), `writes++`,
`lastWriteAt = now()`, `consecutiveFailures = 0`, `{ ok: true }`; porażka → `replacing = false`, `failures++`,
`consecutiveFailures++`, `lastError = errorName(e)`, `dirty` bez zmian i przy `dirty` ponownie uzbrojony timer debounce
(zmiany pominięte w trakcie `replace` nie czekają na następne `markDirty`), `{ ok: false, error }`. Jeden predykat
`writesOff() = blockedBy !== null || replacing || replaced` w `save`, `markDirty` **i** w warunku pętli `save`
(`next = ok && dirty && !writesOff() ? …`) — zamiast trzech osobnych sprawdzeń (plan-review F4). Dozwolone przy
`blockedBy` `unreadable`/`unavailable` (droga odzyskania). `AutosaveStatus += replace: 'idle' | 'writing' | 'done'`.
`Autosaver.current(): SaveState` = `encodeSave(snapshot())` (eksport z rejestru, synchronicznie).
`freshSession(firstRoom: string, stars = 0): SessionSave` w `src/core/save.ts` (używa `emptyRoomState`,
`initialSettings`; `core` nie importuje `data/rooms`); `main.ts` i reset używają tej samej funkcji.

**Kontrakt pliku (faza 2).** Nowy `src/core/saveFile.ts`:
- `exportFileText(input: { kind: 'save'; build: string; exportedAt: string; save: SaveState } | { kind: 'raw'; build:
  string; exportedAt: string; reason: string; raw: unknown }): string` — `JSON.stringify({ app: SAVE_FILE_APP, ...input },
  null, 2)`; `raw` nieserializowalny → `String(raw)` (jak `rawExportText`). `SAVE_FILE_APP = 'martynka-urzadza'`.
- `parseImport(text: string, maxBytes: number): ImportResult`, `ImportResult = { kind: 'ok'; session: SessionSave;
  file: { build: string | null; exportedAt: string | null } } | { kind: 'rejected'; reason: 'too-big' | 'not-json' |
  'not-ours' | 'corrupt' | 'future' | 'unknown-version'; problem: string | null }`. Kolejność: długość tekstu > `maxBytes` →
  `too-big`; `JSON.parse` rzuca → `not-json`; obiekt z `app === SAVE_FILE_APP` → wartość `save` (dla `kind: 'save'`) albo
  `raw` (dla `kind: 'raw'`); obiekt bez `app` z liczbowym `version` → sam zapis; cokolwiek innego → `not-ours`; potem
  **zawsze** `decodeSave` → jego powód odrzucenia; `problem` = `saveProblem(value)` dla `corrupt`.
- `saveProblem(value: unknown): string | null` w `src/core/save.ts` — pierwszy zły klucz najwyższego poziomu
  (`version`, `profileId`, `stars`, `rooms`, `currentRoom`, `settings`, `learner`) albo `null`; `validateSave` bez zmiany
  sygnatury (predykat).
- `saveSummary(session: SessionSave, rooms: Readonly<Record<string, RoomDef>>): SaveSummary`,
  `SaveSummary = { stars: number; stage: StageId | null; rooms: { id: string; done: number; total: number }[] }` —
  `done` przycięte do liczby zadań pokoju; pokoje nieznane pominięte; kolejność wg `rooms` (parametr).

**Kontrakt zdrowia (faza 3).** `Persistence = 'unknown' | 'granted' | 'denied' | 'unsupported' | 'error'` w
`src/core/autosave.ts`; `AutosaverOptions.onFirstWrite?: () => Promise<Persistence> | void`; rozstrzygnięta wartość →
`AutosaveStatus.persistence` (start `'unknown'`; odrzucenie → `'error'`). `src/storage/idb.ts`
`requestPersistence(nav?: Navigator): Promise<Persistence>` — brak `storage.persist` → `'unsupported'`; `true` →
`'granted'`; `false` → `'denied'`; wyjątek/odrzucenie → `'error'`; nigdy nie rzuca. `saveHealthView` →
`SaveHealthState & { persistence: Persistence }`, `SaveHealthState = { kind: 'off'; cause } | { kind: 'failing' } |
{ kind: 'notYet' } | { kind: 'ok'; lastWriteAt: number; earlierFailures: { count: number; error: string } | null }`;
kolejność: `off` > `failing` > `notYet` (`writes === 0`) > `ok`; `earlierFailures` gdy `failures > 0` (count = `failures`,
error = `lastError ?? 'Error'`). Atrybut `data-state` sekcji zostaje `kind` (istniejące e2e czytają `off`/`failing`/`ok`).

**Przepływ dialogów (fazy 4–6).** Kroki to osobne `openDialog` otwierane po zamknięciu panelu w **tej samej** sesji
`UIScene.session` (bez drugiego `suspend()` → follow-up F5 nie odpala). Callbacki przekazywane przez `UIScene`
(`onExport`, `onImport`, `onReset` panelu; `onConfirm`/`onCancel` kroków) to strzałki z ciałem `session.run(...)`;
`DIALOG_CALLBACKS` w `tests/dialogSessions.test.ts` rośnie o `onExport`, `onImport`, `onReset` **oraz `onClose`** (nazwa
callbacku kroków eksportu/importu/resetu — bez niej goły `onClose` zostawiłby test zielonym; plan-review F1), a oczekiwana
liczba `UIScene.ts` rośnie o liczbę nowych przypisań (`WelcomeScene.ts` bez zmian: nie ma `onClose`). `UIScene` nie woła
`Date` (konwencja z `main.ts`: „scenes never call Date”): data pliku i `exportedAt` powstają w `saveExportDialog.ts` z
wstrzykniętego `now = () => new Date()` (plan-review F6). Część asynchroniczna (`share`, `file.text()`, `replace`) żyje w module DOM z
własnym `try/catch` i kończy się wynikiem albo `reload()` (wstrzyknięte, domyślnie `() => window.location.reload()`);
`session.run` łapie tylko synchroniczne rzuty. „Anuluj”/„Zamknij”/Escape w kroku → `closeSettings` (powrót do gry, nie do
panelu).

## Phase 1: `replace` i `current` w autosaverze, `freshSession` w `core`

Driver: tdd
Driver why: `replace`, `current` i `freshSession` w `core` nie istnieją — failing testy kolejności (in-flight, zapisy wyłączone po sukcesie, wznowione po porażce, odmowa przy `fatal`) prowadzą czystą logikę.

### Overview

Bezpieczna ścieżka „zastąp zapis” w jednym module, zanim powstanie jakikolwiek przycisk.

### Changes Required:

#### 1. Autosaver

**File**: `src/core/autosave.ts`

**Intent**: dodać `replace` i `current` wg kontraktu `replace`; `save`/`markDirty` respektują flagę `replacing`/`replaced`
tak jak `blockedBy` (licznik `skipped`), bez nowego `BlockReason`.

**Contract**: `Autosaver.replace(state: SaveState): Promise<ReplaceResult>`, `Autosaver.current(): SaveState`,
`AutosaveStatus.replace: 'idle' | 'writing' | 'done'`, eksport `ReplaceResult`.

#### 2. Świeża sesja

**File**: `src/core/save.ts`, `src/main.ts`

**Intent**: `freshSession(firstRoom, stars = 0)` w `core`; `main.ts` usuwa lokalną kopię i woła
`freshSession(FIRST_ROOM, seeded ?? 0)`.

**Contract**: `freshSession(firstRoom: string, stars?: number): SessionSave`.

#### 3. Testy

**File**: `tests/autosave.test.ts`, `tests/save.test.ts`

**Intent**: `replace` przy trwającym zapisie czeka na niego i zapisuje po nim (kolejność wywołań `store.write`: snapshot,
potem podany stan); po sukcesie `markDirty` + `flush('hidden')` nie piszą (`writes` rośnie tylko o `replace`, `skipped`
rośnie); po porażce (`store.write` rzuca `{ name: 'QuotaExceededError' }`) wynik `{ ok: false, error: 'QuotaExceededError' }`,
następny `flush('now')` pisze snapshot; przy `blockedBy: 'fatal'` → `{ ok: false, error: 'Blocked' }`, 0 zapisów; przy
`blockedBy: 'unreadable'` → zapis przechodzi; stan niewalidny → `InvalidSave`, 0 zapisów; drugie `replace` w toku i po
sukcesie → `Busy`, jeden zapis; po porażce z `dirty` timer debounce pisze snapshot bez `flush`; `current()` równe
`encodeSave(snapshot())`. `freshSession('salon')` przechodzi `validateSave(encodeSave(...))`, `learner: null`, `stars 0`.
Fixtury v1 w obie strony bez zmian.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie brak eksportu — stub najpierw), zielone po; unit `<baseline gałęzi> + N`
- Fixtury v1 w obie strony równe sobie; `SAVE_VERSION` = 1; `git diff --stat tests/fixtures/` pusty
- Deliberate break: `replace` nie czeka na `inflight` → test kolejności czerwony; po sukcesie zapisy nie są wyłączone → test „pagehide nie nadpisuje” czerwony; po porażce `replacing` nie zdjęte → test „autozapis wraca” czerwony; przywrócone; meta-check: oczekiwania z research § 1 (opcja C), nie z implementacji
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] `replace` nie używa `block()`; status `replace` jest runtime (nie w `SaveState`); `core` bez globali

---

## Phase 2: Plik zapisu — koperta, `parseImport`, podsumowanie, `saveProblem`

Driver: tdd
Driver why: walidacja importu (ryzyko #7) to czysta logika bez implementacji — failing testy z plikami parsowalnymi, ale złymi (anty-wzorzec „JSON.parse = poprawny plik”) prowadzą kod.

### Overview

Cały łańcuch ryzyka #7 w `core`, testowalny bez przeglądarki.

### Changes Required:

#### 1. Plik

**File**: `src/core/saveFile.ts` (nowy), `src/core/save.ts`

**Intent**: `exportFileText`, `parseImport`, `saveSummary` wg kontraktu pliku; `saveProblem` obok `validateSave` (wspólne
sprawdzenia, `validateSave(v) === (saveProblem(v) === null)` dla każdego wejścia testu).

**Contract**: sygnatury z Critical Implementation Details; `SAVE_FILE_APP`; `rawExportText` zostaje do seam sweep (faza 6).

#### 2. Liczba

**File**: `src/data/balance.ts`

**Intent**: `balance.save.importMaxBytes = 1_000_000` z komentarzem (zapis v1 z 200 wpisami historii to dziesiątki KB).

#### 3. Testy

**File**: `tests/saveFile.test.ts` (nowy), `tests/save.test.ts`

**Intent**: koperta `save` z fixtury `save-v1.json` → `parseImport` → `ok`, `session` równe `decodeSave(fixtura).session`,
`file.build`/`exportedAt` z koperty; goła fixtura (bez koperty) → `ok`, `file` z `null`; koperta `raw` z wartością
v1 → `ok`; koperta `raw` z wersją 99 → `future`; `"{}"`, `"[]"`, `"42"`, `{"app":"inna-gra"}` → `not-ours`; tekst nie-JSON
→ `not-json`; tekst dłuższy niż `maxBytes` → `too-big` (bez parsowania); fixtura z `stars: -1` → `corrupt` z
`problem: 'stars'`; wersja 99 → `future`. `saveProblem`/`validateSave` zgodne na wszystkich wejściach. `saveSummary`:
`done` przycięte do 10, pokój nieznany pominięty, `learner: null` → `stage: null`. `exportFileText` → `parseImport` w obie
strony daje tę samą sesję.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `parseImport` zwraca `ok` po samym `JSON.parse` (bez `decodeSave`) → testy `corrupt`/`future` czerwone; brak limitu rozmiaru → `too-big` czerwony; `saveProblem` pomija `stars` → test zgodności czerwony; przywrócone; meta-check: oczekiwania z test-planu #7 i research § 2
- Pełna bramka lokalna zielona; `git diff --stat tests/fixtures/` pusty

#### Manual Verification:

- [reviewer] `src/core/saveFile.ts` bez globali i bez importu `src/data/`; build przekazywany parametrem

---

## Phase 3: Zdrowie zapisu — „jeszcze nie zapisano”, wcześniejsze porażki, wynik `persist()`

Driver: tdd
Driver why: `notYet`, `earlierFailures` i `persistence` nie istnieją w `saveHealthView`/`AutosaveStatus`, a `requestPersistence` gubi wynik — failing testy czystego widoku i statusu prowadzą zmianę (N-8, M-S2); zdania dochodzą do istniejącej sekcji.

### Overview

N-8 i M-S2 z audytu: rodzic widzi, czy cokolwiek już zapisano, czy wcześniej coś zawiodło i czy przeglądarka obiecała
nie usuwać zapisu.

### Changes Required:

#### 1. Status i widok

**File**: `src/core/autosave.ts`, `src/core/saveHealth.ts`

**Intent**: wg kontraktu zdrowia; `onFirstWrite` może zwrócić obietnicę wyniku, autosaver zapisuje rozstrzygnięcie w
`status().persistence` (odrzucenie → `'error'`, nigdy `unhandledrejection`).

**Contract**: `Persistence`, `AutosaveStatus.persistence`, `SaveHealthView`.

#### 2. Magazyn

**File**: `src/storage/idb.ts`, `src/main.ts`

**Intent**: `requestPersistence(nav = navigator): Promise<Persistence>`; `main.ts` bez zmian w wywołaniu
(`onFirstWrite: requestPersistence` — typ zgodny).

#### 3. Sekcja i teksty

**File**: `src/ui/dom/saveHealthView.ts`, `src/data/pl.ts`

**Intent**: `notYet` → `pl.settings.saveNotYet`; `ok` z `earlierFailures` → drugie zdanie
`pl.settings.saveEarlier(count, error)` (odmiana: „1 nieudana próba”, „2 nieudane próby”, „5 nieudanych prób” —
`countNoun` z formami `['nieudana próba', 'nieudane próby', 'nieudanych prób']`); zdanie trwałości
`pl.settings.savePersist[granted|denied|unsupported|error]`, brak zdania dla `unknown`. Proponowane teksty:
`saveNotYet: 'Gra jeszcze niczego nie zapisała. Zapis nastąpi po pierwszej zmianie.'`,
`saveEarlier: (count, error) => \`Wcześniej: ${countNoun(count, …)} (${error}).\``,
`savePersist.granted: 'Przeglądarka nie usunie zapisu sama.'`,
`denied`/`unsupported`/`error`: `'Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię.'`.
Komentarz `DESIGN-GAP 50` (rewizja 43).

#### 4. Testy

**File**: `tests/saveHealth.test.ts`, `tests/autosave.test.ts`, `tests/idbStore.test.ts`, `tests/plural.test.ts`

**Intent**: `writes 0` bez blokady i porażek → `notYet`; `writes 0` + `consecutiveFailures 1` → `failing` (nie `notYet`);
blokada → `off` mimo `writes 0`; `ok` z `failures 2` i `lastError` → `earlierFailures { 2, 'QuotaExceededError' }`;
`persistence` przechodzi z statusu. Autosaver: `onFirstWrite` zwraca `Promise.resolve('granted')` → po zapisie
`persistence 'granted'`; odrzucenie → `'error'`; brak `onFirstWrite` → `'unknown'`. `requestPersistence` z atrapą
`navigator` (`persist` → `true`/`false`/rzuca/brak). `pl.settings.saveEarlier(1|2|5, 'X')` — poprawna odmiana.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `notYet` sprawdzane przed `failing` → test „failing przy writes 0” czerwony; autosaver nie zapisuje wyniku `onFirstWrite` → test `granted` czerwony; przywrócone; meta-check: oczekiwania z audytu N-8/M-S2
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — istniejące testy „Zapis gry” zielone

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.settings.saveNotYet`, `saveEarlier` (odmiana 1/2/5), `savePersist.*`: zrozumiałe dla rodzica, bez żargonu poza nazwą błędu w nawiasie

---

## Phase 4: Eksport z potwierdzeniem i powód z buildem na karcie

Driver: impl
Driver why: nowy dialog DOM (jeden komponent), parametryzacja `exportRawSave` i karty oraz sklejka w `UIScene`/`main.ts` — zachowanie widać tylko w renderowanej stronie; dowód w zaktualizowanym teście FR-021 i e2e fazy 7.

### Overview

L-S2 i M-S3: żaden plik nie wychodzi bez wyraźnego „Zapisz plik”, plik niesie build i powód, karta pokazuje kod i wersję.
Panel dostaje pierwszy przycisk („Zapisz kopię”).

### Changes Required:

#### 1. Plik do urządzenia

**File**: `src/ui/dom/saveExport.ts`

**Intent**: `exportRawSave` → `saveFileToDevice(text: string, fileName: string, nav?, doc?): Promise<ExportOutcome>`,
`ExportOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed'`; `File` budowany synchronicznie na początku, `share`
pierwsze, potem pobranie; nigdy nie rzuca.

#### 2. Dialog potwierdzenia (nowy komponent)

**File**: `src/ui/dom/saveExportDialog.ts` (nowy)

**Intent**: `openSaveExportDialog({ file: (now: Date) => { text: string; fileName: string }, onClose, now?, parent? })`: tytuł, jedno zdanie, notka prywatności
(`overlay-muted`), „Zapisz plik” (woła `saveFileToDevice` w handlerze stuknięcia, potem linia wyniku i zmiana przycisków
na „Zamknij”), „Anuluj”/Escape → `onClose`. Komentarz `DESIGN-GAP 47`.

**Contract**: zwraca funkcję zamykającą (jak `openSettingsPanel`).

#### 3. Karta nieczytelnego zapisu

**File**: `src/ui/dom/saveFailedCard.ts`, `src/main.ts`

**Intent**: `SaveFailedHandlers.detail?: string` → wyciszona linia pod notką; `main.ts` podaje
`pl.saveFailed.detail(outcome.reason, __BUILD_ID__)` i po bramce otwiera `openSaveExportDialog` z
`exportFileText({ kind: 'raw', build: __BUILD_ID__, exportedAt: new Date().toISOString(), reason, raw })` i nazwą
`pl.saveFailed.fileName`. Komentarz `DESIGN-GAP 51` (rewizja 42).

#### 4. Panel i scena

**File**: `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`

**Intent**: `SettingsPanelOptions.onExport?: () => void` → przycisk `pl.saveTransfer.exportButton` w rzędzie akcji pod
„Zapis gry” (rząd tylko, gdy jest saver); `UIScene.onExport: () => session.run(() => this.openExport())` — zamyka panel,
otwiera dialog z `file: (now) => ({ text: exportFileText({ kind: 'save', build: __BUILD_ID__, exportedAt:
now.toISOString(), save: saver.current() }), fileName: pl.saveTransfer.fileName(<RRRR-MM-DD z now>) })`; `onClose` →
`closeSettings` (w `session.run`). Komentarz `DESIGN-GAP 46`.

#### 5. Teksty, luki, testy

**File**: `src/data/pl.ts`, `docs/design-gaps.md`, `tests/dialogSessions.test.ts`, `tests/e2e/save-restart.spec.ts`

**Intent**: nowa grupa `pl.saveTransfer` (`exportButton: 'Zapisz kopię'`, `exportTitle: 'Kopia zapisu'`,
`exportBody: 'Plik zostanie zapisany na tym urządzeniu albo udostępniony wybranej aplikacji.'`, `privacy: 'Plik zawiera
postępy dziecka i przykłady jego błędów. Nie wysyłaj go obcym osobom.'`, `saveFile: 'Zapisz plik'`, `close: 'Zamknij'`,
`exportOutcome: { shared, downloaded, cancelled, failed }`, `fileName: (date) => \`martynka-zapis-${date}.txt\``);
`pl.saveFailed.detail: (reason, build) => \`Kod: ${reason} · Wersja ${build}\``. Wiersze 46, 47, 51 w
`docs/design-gaps.md`; wiersz 44 przepisany (koperta JSON w `.txt`, nazwa z datą dla bieżącego zapisu). `DIALOG_CALLBACKS`
+ `onExport`, `onClose`, nowe liczby. Test FR-021: po bramce `getByRole('dialog', { name: pl.saveTransfer.exportTitle })` →
„Zapisz plik” → download; asercje pliku dalej (`"version": 99`, `"stars": 7`) plus `"build"` i `"reason": "future"`
(wartość z szwu `unreadable`); linia wyniku `pl.saveTransfer.exportOutcome.downloaded`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`dialogSessions` z nowymi liczbami)
- `npx playwright test tests/e2e/save-restart.spec.ts` zielony (orkiestrator, protokół request-file: `e2e-request-p4.md` w katalogu zmiany); pełne `npx playwright test`: `<baseline gałęzi e2e> + 0`
- Deliberate break: `onExport` w `UIScene` bez `session.run` → `tests/dialogSessions.test.ts` czerwony; to samo dla `onClose` kroku eksportu; przywrócone. Break (patch `e2e-break-p4.patch`, tylko kod produkcyjny): `main.ts` woła `saveFileToDevice` od razu po bramce (bez dialogu) → test FR-021 czerwony na `dialog`; meta-check: unit zielone przy tej przerwie — L-S2 dowodzi tylko e2e
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `pl.saveTransfer` (eksport) i `pl.saveFailed.detail`; notka prywatności (follow-up F6 z S-08)
- [visual] Zrzuty: panel z przyciskiem „Zapisz kopię”; dialog eksportu przed i po „Zapisz plik” (linia „pobrano”); karta nieczytelnego zapisu z linią kodu i wersji — 1440×900 i 1024×768
- [human] iPad (aplikacja z ekranu początkowego): „Zapisz kopię” → share sheet → „Zachowaj w Plikach” zapisuje `.txt`; Android (zainstalowana PWA): share/pobranie działa; linia wyniku zgadza się z tym, co się stało

---

## Phase 5: Import z podsumowaniem

Driver: impl
Driver why: wybór pliku, dialog podsumowania (jeden komponent) i sklejka `replace` + przeładowanie — logika jest w `core` z faz 1–2, zachowanie widać tylko w przeglądarce; dowód w e2e fazy 7.

### Overview

Rdzeń FR-022: import, który nigdy nie nadpisuje bez podsumowania i drugiego stuknięcia, a zły plik zostawia zapis nietknięty.

### Changes Required:

#### 1. Dialog importu (nowy komponent)

**File**: `src/ui/dom/saveImportDialog.ts` (nowy)

**Intent**: `openSaveImportDialog({ current: SaveSummary, rooms, maxBytes, apply, reload?, onClose, parent? })`:
krok 1 — tytuł, zdanie, notka prywatności, „Wybierz plik” (przyczepiony, wizualnie ukryty
`<input type="file" accept=".txt,.json,text/plain,application/json">`, `input.click()` synchronicznie w stuknięciu);
`change` → `file.size > maxBytes` → odrzucenie bez czytania; inaczej `await file.text()` → `parseImport`; odrzucenie →
komunikat `pl.saveTransfer.rejected[reason]` + „Wybierz inny plik”/„Zamknij”, `console.warn` z powodem i `problem`;
`ok` → krok 2: „Teraz” i „Z pliku” (gwiazdki `countNoun` gwiazdka, etap `pl.stages[stage]` albo
`pl.saveTransfer.noStage`, pokoje `pl.saveTransfer.room(name, done, total)`), „Wczytaj” → `await apply(encodeSave(session))`
→ `ok` → `reload()`; porażka → `pl.saveTransfer.applyFailed` + „Zamknij”, bez przeładowania. Przyciski wyłączone na czas
`apply` (podwójne stuknięcie). Komentarz `DESIGN-GAP 48`.

**Contract**: `apply: (state: SaveState) => Promise<ReplaceResult>`; zwraca funkcję zamykającą.

#### 2. Panel i scena

**File**: `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`

**Intent**: `onImport?: () => void` → przycisk `pl.saveTransfer.importButton` w rzędzie akcji; `UIScene.onImport:
() => session.run(() => this.openImport())` — `current = saveSummary(decode(saver.current()), ROOMS)` (przez
`decodeSave` → `session`), `apply: (s) => saver.replace(s)`, `onClose: () => session.run(() => this.closeSettings())`.

#### 3. Teksty, luki, testy

**File**: `src/data/pl.ts`, `docs/design-gaps.md`, `tests/dialogSessions.test.ts`, `tests/saveTransferCopy.test.ts` (nowy)

**Intent**: `pl.saveTransfer`: `importButton: 'Wczytaj z pliku'`, `importTitle: 'Wczytaj zapis z pliku'`, `importBody:
'Wczytanie zastąpi obecne postępy na tym urządzeniu.'`, `choose: 'Wybierz plik'`, `chooseOther: 'Wybierz inny plik'`,
`now: 'Teraz'`, `fromFile: 'Z pliku'`, `stars: (n) => countNoun(n, gwiazdka)`, `noStage: 'przed wyborem etapu'`,
`room: (name, done, total) => \`${name}: ${done} z ${total}\``, `load: 'Wczytaj'`, `rejected: { 'too-big': 'Ten plik jest za
duży, to nie jest zapis tej gry.', 'not-json' | 'not-ours': 'To nie jest plik zapisu tej gry.', corrupt: 'Plik zapisu jest
uszkodzony.', future: 'Ten zapis pochodzi z nowszej wersji gry. Zaktualizuj grę i spróbuj ponownie.', 'unknown-version':
… }`, każde z dopiskiem „Obecne postępy zostały bez zmian.”, `applyFailed: 'Nie udało się wczytać zapisu. Obecne postępy
zostały bez zmian.'`. Wiersz 48 w `docs/design-gaps.md`. `DIALOG_CALLBACKS` + `onImport`. Test tekstów: `stars(1|2|5|12|22)`
z poprawną odmianą, każdy powód `ImportResult` ma tekst.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: `onImport` bez `session.run` → `dialogSessions` czerwony; usunięty tekst dla `future` → test tekstów czerwony; przywrócone; meta-check: przepływ (podsumowanie przed nadpisaniem) dowodzi e2e fazy 7, zapis w handoff §3
- E2E (orkiestrator) `<baseline gałęzi e2e> + 0`; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Żadna ścieżka nie woła `apply` bez kroku 2 i stuknięcia „Wczytaj”; odrzucenie nie dotyka savera; odczyt nauczyciela tekstów importu (odmiana gwiazdek)
- [visual] Zrzuty: dialog importu (krok 1), odrzucony plik, podsumowanie „Teraz / Z pliku” — 1440×900 i 1024×768
- [human] iPad (ekran początkowy): „Wybierz plik” otwiera Pliki, `.txt` z eksportu jest wybieralny, import kończy się grą ze stanem z pliku; Android (PWA): to samo z wyborem pliku systemu

---

## Phase 6: Reset z potwierdzeniem, luki projektu, follow-upy, dokumentacja i seam sweep

Driver: impl
Driver why: jeden dialog DOM (reset) na `replace` + `freshSession` z fazy 1 oraz dokumentacja i porządki — dowód resetu w e2e fazy 7.

### Overview

Trzecia akcja FR-022 i ostatnia faza `impl`/`tdd`: seam sweep całej zmiany.

### Changes Required:

#### 1. Dialog resetu (nowy komponent)

**File**: `src/ui/dom/saveResetDialog.ts` (nowy)

**Intent**: `openSaveResetDialog({ current: SaveSummary, rooms, apply, reload?, onClose, parent? })`: tytuł, co zniknie
(gwiazdki, etap, pokój — te same linie co podsumowanie importu; wspólny helper DOM `createSummaryList` wyjęty z
`saveImportDialog.ts` do `src/ui/dom/saveSummaryView.ts`), rada „Najpierw zapisz kopię”, „Zacznij od nowa” (przycisk
`overlay-secondary`, nie domyślny fokus) → `apply` → `reload()`; porażka → `pl.saveTransfer.applyFailed`. Komentarz
`DESIGN-GAP 49`.

#### 2. Panel i scena

**File**: `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts`

**Intent**: `onReset?: () => void` → przycisk `pl.saveTransfer.resetButton`; `UIScene.onReset: () => session.run(() =>
this.openReset())` — `apply: () => saver.replace(encodeSave(freshSession(FIRST_ROOM)))`.

#### 3. Teksty, luki, follow-upy, dokumentacja

**File**: `src/data/pl.ts`, `docs/design-gaps.md`, `context/changes/save-export-import-reset/follow-ups/review-fixes.md`
(nowy), `CLAUDE.md`

**Intent**: `pl.saveTransfer.resetButton: 'Zacznij od nowa'`, `resetTitle: 'Zacząć grę od nowa?'`, `resetBody: 'Znikną
wszystkie postępy z tego urządzenia:'`, `resetHint: 'Jeśli chcesz je zachować, najpierw zapisz kopię.'`, `resetConfirm:
'Zacznij od nowa'`. Wiersze 49 i 50 w `docs/design-gaps.md` (50 = rewizja 43: `notYet`, wcześniejsze porażki, trwałość);
sprawdzenie, że wiersze 46–51 i komentarze `DESIGN-GAP` w kodzie się zgadzają. Follow-upy z `Trigger:`: L-S1
(`src/core/save.ts` `decodeSave`, `Trigger: first migration step (v2)`), N-7 (`src/core/autosave.ts` `loadSave`,
`Trigger: an iPad measurement of a cold IndexedDB open`), F7 (`src/data/pl.ts` `settings.empty`, `Trigger: a parent's
feedback on the preview or S-17`), dwie karty jednego originu (`Trigger: first save-format change (v2), or a parent
reporting lost progress`), pełna ścieżka pola w `saveProblem` (`Trigger: a parent reporting a rejected file that should
load`), import z ekranu powitalnego (`Trigger: a parent who cannot reach the panel after an unreadable save`). Zamknięte
tu: L-S2, M-S2, M-S3, N-8, F3 (ścieżka złego pola, wersja klucza), prywatność eksportu (S-08 F6), F6 WelcomeScene.
`CLAUDE.md` Current state: zdanie o S-12 (`saveFile.ts`, `replace`, dialogi eksportu/importu/resetu, koperta, `.txt`,
`notYet`/`persistence`), usunięte „export/import/reset of the save in the parent panel (S-12)” z „Not yet present”.

#### 4. Seam sweep

**File**: pliki faz 1–6

**Intent**: `rawExportText` usunięte, jeśli po fazie 4 nie ma wywołań (inaczej oznaczone jako używane); nieaktualne
komentarze (`saveExport.ts` „Hands the raw stored save…”, `saveHealth.ts` nagłówek trzech stanów, `REGISTRY_KEYS.saver`
„({ flush, status })”, `main.ts` przy `freshSession`); zduplikowane linie podsumowania (import vs reset) w jednym helperze;
`WelcomeScene.openParent` guard wyrównany do `this.session?.active()` jak `UIScene` (F6); brak dwóch źródeł nazwy pliku.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `onReset` bez `session.run` → `dialogSessions` czerwony; `CLAUDE.md` wskazuje nieistniejący `src/core/savefile.ts` → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł, a test sesji czyta składnię scen
- `grep -rn "rawExportText" src/` pusty albo uzasadniony w handoff; `grep -n "const freshSession" src/main.ts` pusty
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: martwy kod, nieaktualne komentarze, duplikaty z faz 1–6; DESIGN-GAP 46–51 w kodzie i w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [reviewer] Odczyt nauczyciela tekstów resetu
- [visual] Zrzuty: panel z trzema przyciskami; dialog resetu; sekcja „Zapis gry” w stanach `notYet` (świeży start, przed pierwszym zapisem) i `ok` ze zdaniem trwałości — 1440×900 i 1024×768
- [human] Decyzja wbrew literze FR-022: eksport to plik `.txt` z treścią JSON (nie `.json`), bo share sheet Androida odrzuca `.json`
- [human] Akceptacja tekstów `pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/`saveEarlier`/`savePersist`
- [human] Urządzenia: wynik `persist()` w „Zapis gry” na iPadzie (ekran początkowy) i na Androidzie (zainstalowana PWA)

---

## Phase 7: Eksport, import i reset w przeglądarce — e2e (#7, #2, #10)

Driver: e2e
Driver why: ryzyko #7 (zły plik nie zmienia zapisu) i #2/#10 (stan po przeładowaniu z importu/resetu) istnieją tylko w renderowanej stronie z prawdziwym `start`, IndexedDB i przeładowaniem; zbudowane w fazach 4–6, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/save-transfer.spec.ts` (projekt `chromium-hook`). Prawdziwy magazyn IndexedDB (bez `?e2eSave=`), nowy
kontekst = świeże urządzenie, nigdy dostęp do IndexedDB z testu, nigdy `page.clock`; panel przez `openSettings(page)`.

### Changes Required:

#### 1. Konfiguracja i typ migawki

**File**: `playwright.config.ts`, `tests/e2e/support/hook.ts`

**Intent**: `save-transfer` w regexie `ROUND_SPEC`; `Snapshot['save']` z `replace` i `persistence`. Komenda bramki bez
zmian: `npx playwright test`.

#### 2. Spec

**File**: `tests/e2e/save-transfer.spec.ts` (nowy)

**Intent**: (a) „#7 a file that is not a save of this game is rejected and the save is unchanged”: `passWelcome` → runda →
`expect.poll` `writes >= 1` → zapamiętane gwiazdki/etap → panel → „Wczytaj z pliku” → `setInputFiles({ name: 'zly.txt',
mimeType: 'text/plain', buffer: '{"hello":1}' })` → tekst `pl.saveTransfer.rejected['not-ours']`; drugi plik z kopertą i
`stars: -1` → `rejected.corrupt` → „Zamknij” → `page.reload()` → ekran `task`, gwiazdki i etap jak przed. (b) „#7 #2 a valid
file replaces the save only after the summary and survives the reload”: świeży kontekst, `passWelcome` → import gołej
wartości v1 zbudowanej **w specu** jako stan, który da się grać (plan-review F2: `tests/fixtures/save-v1.json` to fixtura
formatu — pokój `living` nieznany grze, identyfikatory umiejętności spoza programu, `pendingUnlock` — po przeładowaniu
`repairCurrentRoom` i karta odblokowania zmieniłyby przebieg): `version 1`, `stars 7`, `rooms: { salon: { tasksDone: 0,
chosen: {} } }`, `currentRoom: 'salon'`, `learner` z etapem innym niż ten z `passWelcome` (np. `E3`), pustymi `mastery`/
`streak`/`history`, bez `pendingUnlock`; wartość przechodzi `validateSave` w teście jednostkowym fazy 2 albo w specu przez
odczyt po imporcie → podsumowanie „Z pliku” z „7 gwiazdek”, etapem i „Salon: 0 z 10” → „Wczytaj” → `waitForEvent`
nawigacji / `fromHook` po przeładowaniu → `snapshot.save.load === 'loaded'`, gwiazdki 7, etap z pliku. Pliki we wszystkich
testach wybierane przez `page.waitForEvent('filechooser')` po stuknięciu „Wybierz plik” / „Wybierz inny plik” →
`chooser.setFiles(...)` (ćwiczy prawdziwe `input.click()` w stuknięciu), nie `setInputFiles` na ukrytym polu; pole po
każdym `change` ma `value = ''` (ponowny wybór tego samego pliku odpala `change`).
(c) „#2 #10 an export from the panel round-trips through import”: runda → „Zapisz kopię” → „Zapisz plik” → download
(`suggestedFilename` pasuje do `martynka-zapis-\d{4}-\d{2}-\d{2}\.txt`, treść ma `"app": "martynka-urzadza"`, `"build"`,
`"kind": "save"`) → nowy kontekst → import tego pliku → po przeładowaniu gwiazdki jak w kontekście źródłowym. (d) „#2 reset
asks first and ends on the welcome screen”: runda → „Zacznij od nowa” → „Anuluj” → stan bez zmian → ponownie →
„Zacznij od nowa” w dialogu → po przeładowaniu `screenIs(page, 'welcome')`, `snapshot.stars === 0`.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty z `pl` przez `getByRole`/`getByText`;
żadnej asercji na godzinie ani nazwie błędu.

**Chromium niedostępny w sesji agenta**: protokół request-file — spec bez commita, `e2e-request-p7.md` w katalogu zmiany
(komendy zielonych uruchomień i tabela przerw jak `context/runs/2026-10-13-fix-save-observability/e2e-request-p6.md`),
patche `e2e-break-p7a.patch` … `e2e-break-p7e.patch` (tylko kod produkcyjny), `STATUS: BLOCKED — e2e needs orchestrator run
(request file written)`; agent kończący commituje spec po wyniku orkiestratora.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-transfer.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4` passed
- Deliberate break (patch `e2e-break-p7a.patch`): `parseImport` zwraca `ok` po samym `JSON.parse` dla obiektu z liczbowym `version` (bez `decodeSave`) → (a) czerwony na `rejected.corrupt` (lub na stanie po przeładowaniu); przywrócone
- Deliberate break (patch `e2e-break-p7b.patch`): `UIScene.openImport` `apply` zwraca `{ ok: true }` bez `saver.replace` → (b), (c) czerwone na gwiazdkach po przeładowaniu; meta-check: unit zielone — e2e dowodzi sklejki, nie `replace`
- Deliberate break (patch `e2e-break-p7c.patch`): `replace` po sukcesie nie wyłącza zapisów → (b) lub (d) czerwony (`pagehide` nadpisuje); meta-check: czy przerwa jest widoczna w przeglądarce — jeśli zielona, zapis w handoff §3, dowód zostaje w unit fazy 1
- Deliberate break (patch `e2e-break-p7d.patch`): reset bez `reload()` → (d) czerwony na `welcome`; przywrócone
- Deliberate break (patch `e2e-break-p7e.patch`): `saveImportDialog` po `parseImport` `ok` woła `apply` od razu (bez kroku 2 i „Wczytaj”) → (b) czerwony na podsumowaniu „Z pliku”; przywrócone (reguła „podsumowanie przed nadpisaniem”, FR-022)
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `replace`: kolejność z `inflight`, zapisy wyłączone po sukcesie, wznowione po porażce, odmowa przy `fatal`, dozwolone przy `unreadable`; `current`; `freshSession`.
- Plik: koperta `save`/`raw`, goła wartość v1, `not-json`, `not-ours`, `too-big`, `corrupt` z `problem`, `future`; zgodność `saveProblem`/`validateSave`; `saveSummary`; eksport → import w obie strony.
- Zdrowie: `notYet`, `failing` przy `writes 0`, `earlierFailures`, `persistence`; `requestPersistence`.
- Sesje dialogów: `DIALOG_CALLBACKS` z `onExport`, `onImport`, `onReset`; teksty z odmianą.

### Integration Tests:

- `npm run sample -- E1..E6` (treść nietknięta); `npm run build` ze strażnikiem haka; e2e: istniejące 33 (FR-021 z krokiem potwierdzenia) + 4 nowe.

### Manual Testing Steps:

1. Zrzuty wszystkich nowych stanów (fazy 4–6) — 1440×900 i 1024×768.
2. Odczyt nauczyciela wszystkich nowych tekstów.
3. iPad (ekran początkowy) i Android (PWA): eksport przez share sheet, import przez wybór pliku, wynik `persist()`.

## Performance Considerations

Import czyta plik do 1 MB raz; parsowanie i walidacja synchroniczne, poniżej milisekund dla realnych zapisów. Eksport
serializuje stan raz w stuknięciu. Przeładowanie po imporcie/resecie to zwykły start (odczyt zapisu, ~1–2 s na tablecie).

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1; koperta pliku jest poza `SaveState`; import przechodzi przez `decodeSave` z łańcuchem
migracji, więc przyszły v2 przyjmie plik v1. Pola `replace`/`persistence` są runtime (dowód: fixtury w fazie 1).

## Known risks

- **Druga karta tego samego originu** nadpisze zaimportowany/zresetowany zapis przy swoim następnym zapisie — ryzyko
  przeniesione (follow-up).
- **Przeładowanie w PWA** może uruchomić nowszy build czekający w SW (`skipWaiting` + `clientsClaim`) — to samo co każdy
  następny start; FR-003/FR-021 wymagają, by czytał v1.
- **iPad: pobranie blob** w aplikacji z ekranu początkowego bywa podglądem — dlatego share sheet pierwszy; linia wyniku
  „pobrano” znaczy tylko „przeglądarka przyjęła plik” (`[human]` 4.x).
- **`accept` w wyborze pliku** filtruje częściowo na iOS/Android — treść jest walidowana i tak.
- **Chromium w sesji agenta**: fazy 4–7 mogą wymagać protokołu request-file.
- **`pagehide` po `replace` w przeglądarce** (plan-review F3): w chwili `replace` autosaver zwykle nie jest `dirty`
  (stan zapisany na końcu rundy), więc przerwa `e2e-break-p7c.patch` prawdopodobnie zostanie zielona — reguła „po
  udanym `replace` nic nie pisze do przeładowania” ma dowód tylko w unit fazy 1; e2e 7.4 wolno zamknąć zapisem w handoff §3.
- **Brak przeładowania po udanym `replace`** (plan-review F8): jeśli `reload()` nie zadziała, gra biegnie dalej z
  wyłączonymi zapisami do końca sesji, a następny start wczyta stan z pliku — postęp tej sesji ginie po cichu. Akceptowane
  (przeładowanie jest synchroniczne po sukcesie); „Zapis gry” tego nie pokazuje.

## References

- Research: `context/changes/save-export-import-reset/research.md`; change: `context/changes/save-export-import-reset/change.md`
- Audyt: `context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md` § 5 (M-S2, M-S3, L-S2, N-8; N-7 poza)
- Kontrakt runu: `context/runs/2026-10-13-s12-s14/agent-contract.md` („S-12 save-export-import-reset”)
- PRD: `context/foundation/prd.md` FR-022, US-03, FR-021, guardrail „Postęp nigdy nie ginie”
- Test-plan: `context/foundation/test-plan.md` ryzyka #7, #2, #10, #15; `context/foundation/test-stack.md` § E2E
- Format: `context/archive/2026-10-13-save-observability-c1-c2/plan.md`; protokół e2e:
  `context/runs/2026-10-13-fix-save-observability/e2e-request-p6.md`

## Autonomous decisions

1. **Zastosowanie importu/resetu = `Autosaver.replace` + przeładowanie** (research opcja C). Odrzucone: podmiana rejestru
   (pięć scen z własnym stanem), bezpośredni `store.write` (nadpisany przez `pagehide` przeładowania), `block()`
   (jednokierunkowe). Zmieniłoby: dowód, że przeładowanie w PWA na iPadzie gubi coś, co dziecko zauważy.
2. **Eksport `.txt` + `text/plain`, treść JSON w kopercie — wbrew literze FR-022 („plik JSON”)** → wiersz `[human]` 6.x.
   Odrzucone: `.json` (Chromium share allow-list go odrzuca, zweryfikowane w research). Zmieniłoby: Chrome dodający JSON do
   listy albo test na iPadzie, w którym `.txt` znika z „Zachowaj w Plikach”.
3. **Nazwa pliku**: bieżący zapis `martynka-zapis-RRRR-MM-DD.txt` (rodzic może mieć kilka kopii), kopia surowa zostaje
   `martynka-zapis.txt` (istniejący test i gap 44). Odrzucone: jedna stała nazwa (kopie nadpisują się w Plikach).
   Zmieniłoby: rodzic myli kopię surową z bieżącą — wtedy obie z datą.
4. **Akcje w panelu ustawień, krok zastępuje panel w tej samej sesji; „Anuluj” w kroku wraca do gry**, niezatwierdzone
   wybory panelu przepadają. Odrzucone: powrót do panelu (stan panelu do odtworzenia), druga sesja `suspend()` (F5).
   Zmieniłoby: rodzic zgłaszający utratę wyboru etapu.
5. **Import tylko z panelu**, nie z ekranu powitalnego; po nieczytelnym zapisie droga: „Graj dalej” → powitanie → panel
   → import (`replace` dozwolone przy `unreadable`). Odrzucone: przycisk importu na karcie (więcej powierzchni przed grą).
   Zmieniłoby: follow-up z triggerem „rodzic nie może dojść do panelu”.
6. **Podsumowanie „Teraz” obok „Z pliku”** (change.md decyzja 3); reset pokazuje „co zniknie” + radę „najpierw zapisz
   kopię” (bez wymuszonego eksportu, change.md decyzja 4). Postęp pokoju bez rzeczownika („Salon: 3 z 10”) — brak odmiany.
7. **`saveProblem` zwraca pierwszy zły klucz najwyższego poziomu** (research § 2, wersja tania), tylko do `console.warn`;
   rodzic dostaje prosty komunikat. Zmieniłoby: plik odrzucany, który powinien przejść — follow-up.
8. **Limit 1 MB w `balance.save.importMaxBytes`**, sprawdzany przed czytaniem (`File.size`) i w `parseImport` (długość
   tekstu). Zmieniłoby: realne zapisy zbliżające się do limitu.
9. **`replace` ma osobną flagę, nie `BlockReason`** — „Zapis gry” i `pl.settings.saveOff` bez nowego stanu; po sukcesie
   strona i tak się przeładowuje. Odmowa przy `fatal`. Zmieniłoby: potrzeba pokazania „trwa wczytywanie” w panelu.
10. **N-8: `notYet` po `failing`, przed `ok`; `earlierFailures` z licznika życia `failures`; M-S2: wynik `persist()` w
    statusie, zdanie tylko po rozstrzygnięciu** (`unknown` = brak zdania). `data-state` zostaje `kind` (istniejące e2e).
11. **Siedem faz: 3 × tdd (core), 3 × impl (po jednym nowym komponencie DOM: eksport, import, reset), 1 × e2e po seam
    sweep** (prompt kroku: ≤ ~2 komponenty na fazę). Test FR-021 aktualizowany w fazie 4, bo L-S2 zmienia jego przepływ.
12. **Roadmapa: S-12 → `planning`** (skill), commit razem z planem (kontrakt: czyste drzewo).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: `replace` i `current` w autosaverze, `freshSession` w `core`

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [x] 1.2 Fixtury v1 w obie strony równe sobie; `SAVE_VERSION` = 1; `tests/fixtures/` bez zmian
- [x] 1.3 Deliberate break: brak czekania na `inflight` / zapisy nie wyłączone po sukcesie / `replacing` nie zdjęte po porażce → czerwone; przywrócone; meta-check
- [ ] 1.4 Pełna bramka lokalna zielona

#### Manual

- [ ] 1.5 [reviewer] `replace` bez `block()`; status `replace` runtime; `core` bez globali

### Phase 2: Plik zapisu — koperta, `parseImport`, podsumowanie, `saveProblem`

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Deliberate break: `ok` po samym `JSON.parse` / brak limitu / `saveProblem` pomija `stars` → czerwone; przywrócone; meta-check
- [ ] 2.3 Pełna bramka lokalna zielona; `tests/fixtures/` bez zmian

#### Manual

- [ ] 2.4 [reviewer] `saveFile.ts` bez globali i bez importu `src/data/`; build parametrem

### Phase 3: Zdrowie zapisu — „jeszcze nie zapisano”, wcześniejsze porażki, wynik `persist()`

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Deliberate break: `notYet` przed `failing` / wynik `onFirstWrite` nie zapisany → czerwone; przywrócone; meta-check
- [ ] 3.3 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.4 [reviewer] Odczyt nauczyciela `saveNotYet`, `saveEarlier` (1/2/5), `savePersist.*`

### Phase 4: Eksport z potwierdzeniem i powód z buildem na karcie

#### Automated

- [ ] 4.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 4.2 `save-restart.spec.ts` zielony (orkiestrator, `e2e-request-p4.md`); pełne e2e `<baseline gałęzi e2e> + 0`
- [ ] 4.3 Deliberate break: `onExport` bez `session.run` → `dialogSessions` czerwony; patch `e2e-break-p4.patch` (pobranie bez dialogu) → FR-021 czerwony, unit zielone; meta-check
- [ ] 4.4 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 4.5 [reviewer] Odczyt nauczyciela tekstów eksportu i `saveFailed.detail`; notka prywatności
- [ ] 4.6 [visual] Zrzuty: panel z „Zapisz kopię”, dialog eksportu przed/po, karta z kodem i wersją — 1440×900 i 1024×768
- [ ] 4.7 [human] iPad (ekran początkowy) share sheet → Pliki; Android (PWA) share/pobranie; linia wyniku zgodna

### Phase 5: Import z podsumowaniem

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 5.2 Deliberate break: `onImport` bez `session.run` / brak tekstu `future` → czerwone; przywrócone; meta-check (przepływ w e2e fazy 7)
- [ ] 5.3 E2E (orkiestrator) `<baseline gałęzi e2e> + 0`; `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 5.4 [reviewer] `apply` tylko po kroku 2 i „Wczytaj”; odrzucenie nie dotyka savera; odczyt nauczyciela tekstów importu
- [ ] 5.5 [visual] Zrzuty: import krok 1, odrzucony plik, podsumowanie „Teraz / Z pliku” — 1440×900 i 1024×768
- [ ] 5.6 [human] iPad (ekran początkowy) i Android (PWA): wybór pliku, `.txt` wybieralny, import kończy się stanem z pliku

### Phase 6: Reset z potwierdzeniem, luki projektu, follow-upy, dokumentacja i seam sweep

#### Automated

- [ ] 6.1 `validate-rule-files.sh` PASS
- [ ] 6.2 Deliberate break: `onReset` bez `session.run` → `dialogSessions` czerwony; `CLAUDE.md` z nieistniejącą ścieżką → FAIL; przywrócone; meta-check
- [ ] 6.3 `rawExportText` usunięte lub uzasadnione; `freshSession` nie żyje w `main.ts`
- [ ] 6.4 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 6.5 [reviewer] Seam sweep: martwy kod, komentarze, duplikaty; DESIGN-GAP 46–51; follow-upy z `Trigger:`
- [ ] 6.6 [reviewer] Odczyt nauczyciela tekstów resetu
- [ ] 6.7 [visual] Zrzuty: panel z trzema przyciskami, dialog resetu, „Zapis gry” `notYet` i `ok` ze zdaniem trwałości — 1440×900 i 1024×768
- [ ] 6.8 [human] Decyzja wbrew literze FR-022: eksport `.txt` z treścią JSON zamiast `.json`
- [ ] 6.9 [human] Akceptacja tekstów `pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/`saveEarlier`/`savePersist`
- [ ] 6.10 [human] Urządzenia: wynik `persist()` w „Zapis gry” na iPadzie i na Androidzie

### Phase 7: Eksport, import i reset w przeglądarce — e2e (#7, #2, #10)

#### Automated

- [ ] 7.1 `save-transfer.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`
- [ ] 7.2 Deliberate break (patch `e2e-break-p7a.patch`): `parseImport` bez `decodeSave` → (a) czerwony; przywrócone
- [ ] 7.3 Deliberate break (patch `e2e-break-p7b.patch`): `apply` bez `saver.replace` → (b), (c) czerwone; meta-check
- [ ] 7.4 Deliberate break (patch `e2e-break-p7c.patch`): `replace` nie wyłącza zapisów → (b) lub (d) czerwony albo zapis w handoff §3; meta-check
- [ ] 7.5 Deliberate break (patch `e2e-break-p7d.patch`): reset bez `reload()` → (d) czerwony; przywrócone
- [ ] 7.6 Deliberate break (patch `e2e-break-p7e.patch`): import bez kroku podsumowania → (b) czerwony; przywrócone
- [ ] 7.7 `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
