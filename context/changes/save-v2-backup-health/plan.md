# Nieudana kopia `backup-v1` nie wyłącza zapisu, limity czasu zapisu i uczciwy panel „Zapis gry” — Implementation Plan

## Overview

Poprawka spoza roadmapy po audycie obserwowalności 2026-10-15_0253 (PR #52): SV2-01 (CRITICAL), SV2-02, SV2-03,
SRR-02, plus tanie dodatki na tych samych symbolach: SRR-04 (`replace` bierze zaległą kopię), SRR-12 (osobna karta dla
`timeout`), O2 (Escape w trakcie `replace`), S12-12 (log porażki `persist()`). Skutki:

1. Urządzenie, na którym kopia `profile:default:backup-v1` się nie udaje, **zapisuje postęp dziecka**: kopia jest
   ponawiana najwyżej 3 razy w sesji (`balance.save.backupAttempts`), potem — albo od razu przy `flush('hidden')` po
   pierwszej porażce — v2 jest zapisywane bez kopii. Porażka kopii jest osobnym, nazwanym stanem z kodem.
2. Kopia, zapis i `replace` mają limit czasu (`balance.save.writeTimeoutMs = 5000`); zawieszenie jest porażką `timeout`
   z etapem, nie „jeszcze nic nie zapisano”; `replace` zawsze się rozstrzyga, więc dialogi importu i resetu zawsze
   odzyskują „Zamknij”, a Escape w trakcie zapisu nie zamyka dialogu.
3. „Zapis gry” mówi o skutku: „przeniesiono z wersji 1” dopiero po udanym zapisie v2 w tej sesji i z informacją, czy
   stara kopia została zachowana (z kodem, gdy nie); stan `failing` pokazuje liczbę prób, etap i kod.
4. Odczyt, który przekroczył limit, dostaje własną kartę z „Poczekaj dłużej” (czeka na **ten sam** odczyt do
   `balance.save.slowLoadTimeoutMs = 20000`); gdy i to minie — rada „usuń dane tej strony” (warunkowa, z ostrzeżeniem)
   zamiast pętli „Uruchom grę ponownie”. Teksty `saveOff.timeout` i `deviceTimeout` dostają tę samą warunkową radę.

## Current State Analysis

(Za `research.md`; kod potwierdzony w tym kroku na `3f8d190`.)

- `src/core/autosave.ts` `createAutosaver` → `attempt`: `encodeSave` → `validateSave` → `dirty = false` → `if (!backedUp
  && options.migrated) { await store.backup(…); backedUp = true; }` → `await store.write`. Jeden `catch` loguje
  `autosave: write failed`; `backedUp` zostaje `false`, więc każda próba zaczyna od kopii i znowu pada — na urządzeniu z
  trwale padającą kopią nic się nie zapisuje (SV2-01). Główny klucz zostaje v1, więc każdy start znowu migruje.
- Żadne `await` na magazynie nie ma limitu (poza `loadSave` `limit`). `save` oddaje to samo `inflight` każdemu `flush`;
  `replace` robi `await inflight; await store.write(state)` — martwe `inflight` blokuje dialog na zawsze (SV2-02).
  Wzorzec wyścigu z zegarem istnieje raz: `loadSave` (`read.catch(() => undefined)`, `Promise.race`, błąd `timeout`).
- `status().migratedFrom = options.migrated?.from` (zamiar ze startu); `src/ui/dom/saveHealthView.ts` rysuje
  `pl.settings.saveMigrated` zawsze, gdy niepuste; `src/core/saveHealth.ts` `stateOf` → `{ kind: 'failing' }` bez kodu;
  komentarz przy `pl.settings.saveMigrated` obiecuje „the old copy is kept” (SV2-03).
- `src/main.ts` `start`: `loadSave(store, { timers, timeoutMs })` porzuca odczyt po limicie; karta `unavailable`
  (`pl.saveUnavailable`) dla `timeout` i dla odrzuconego odczytu, różni się tylko `Kod: timeout` (SRR-12);
  `pl.settings.saveOff.timeout` i `pl.saveTransfer.deviceTimeout` każą „Uruchom grę ponownie” (SRR-02).
- `src/ui/dom/saveImportDialog.ts` `stepTwo` i `saveResetDialog.ts`: `busy` wyłącza akcję i „Anuluj” do rozstrzygnięcia
  `apply`; Escape (`src/ui/dom/dialog.ts` `openDialog` → `onEscape`) nie patrzy na `busy` (O2).
- Szwy e2e: `src/testing/e2eHook.ts` `E2ESaveSeam` = `unreadable | corrupt | unavailable | hang | writefail | v1`;
  `e2eSaveStore.backup` zawsze się udaje; `E2E_LOAD_TIMEOUT_MS = 300` pod `hang`; marker `e2eSave` w
  `vite/e2eHookGuard.mjs`; `tests/e2eHookGuard.test.ts` `it.each` szwów.
- Brak `localStorage`/`sessionStorage` w `src/` i `tests/`. `context/foundation/lessons.md` nie istnieje.
- Vitest bez środowiska DOM: widoki `src/ui/dom/` dowodzi e2e (faza 6) i bramka wizualna.

## Desired End State

- `AutosaveStatus` (runtime, nigdy w `SaveState`): `backup: 'none' | 'pending' | 'failed' | 'done' | 'skipped'`,
  `backupError: string | null`, `lastFailure: { stage: 'encode' | 'backup' | 'write' | 'replace'; error: string } | null`;
  `migratedFrom` bez zmian (fakt odczytu). `SAVE_VERSION` 2, `tests/fixtures/` bajt w bajt, `SAVE_KEYS` nietknięte.
- Każde `await` na magazynie w `core` idzie przez jeden helper limitu czasu; porzucona obietnica ma własny `.catch`.
- Kopia: do 3 porażek w sesji porażka kopii kończy próbę (retry jak dziś); trzecia porażka albo porażka przy `hidden`
  (lub `hidden` po ≥ 1 porażce) → v2 zapisywane bez kopii, `backup: 'skipped'`, log `autosave: writing v2 without the
  v1 copy`. `replace` przy zaległej kopii próbuje jej raz (z limitem), porażka nie blokuje działania rodzica.
- `saveHealthView`: `failing` = `{ count, stage, error }`; `migration: { from, copy: 'kept' | 'lost', code } | null`
  (tylko po `writes > 0`); pole `migratedFrom` w widoku znika.
- Karta `timeout` (`pl.saveSlow`) z „Poczekaj dłużej” i radą po drugim limicie; `loadSave` daje `waitLonger`.
- Nowe szwy: `writehang`, `backupfail`, `backuphang`, `slow`; e2e #2 dla SV2-01, SV2-02 (+ Escape) i SRR-02.
- DESIGN-GAP 94–97, follow-upy z `Trigger:`, jedno zdanie w `CLAUDE.md`.

### Key Discoveries:

- `MIGRATIONS[1]` to spread + `variants`, a wynik przechodzi `validateSave` przed startem — v2 zawiera całe v1; kopia
  chroni tylko przed przyszłym błędem migracji (research, „does v2 carry everything v1 had?”).
- idb-keyval 6.3.0 `set` rozstrzyga się na `complete` i nie daje `abort`; transakcje readwrite jednego magazynu idą w
  kolejności utworzenia — porzucony zapis, który kończy się późno, ląduje **przed** każdym późniejszym zapisem.
- `tests/e2e/save-restart.spec.ts` „#2 M-S4” i `tests/e2e/save-transfer-blocked.spec.ts` (test `hang`) szukają karty po
  `pl.saveUnavailable.title` — nowa karta `timeout` zmienia oba w fazie 4. Asercje tekstów idą przez klucze `pl`, więc
  nowa treść `saveOff.timeout`/`deviceTimeout` ich nie łamie.
- `tests/e2e/save-migration.spec.ts` „#2 … with a v1 backup first” (`ops.slice(0, 2)` = `['backup', 'write']`) zostaje
  zielony: zdrowa kopia działa jak dziś.

## What We're NOT Doing

- Zmiana formatu zapisu (zostaje v2), fixtur, `SAVE_KEYS`, układu kluczy magazynu (opcja C odrzucona).
- Licznik startów w `localStorage` (SRR-08: wymuszenie od drugiego `unavailable`) — follow-up; brak przerywania
  transakcji (`abort`) w `src/storage/idb.ts`.
- Przycisk „Zachowaj kopię v1” w panelu (opcja B, SV2-04) — follow-up; odczyt kopii z powrotem — follow-up.
- S12-07 (`saveExport.ts` nietknięty), S12-08 (`file.text()`), S12-13 (`apply` poza `session.run`), S12-03, S12-11,
  SRR-01, SRR-07..SRR-11, SRR-13, SV2-04..SV2-15 (SV2-08 dotyka `deploy/` — zakaz runu), GRD-*, WNA-* — follow-upy (faza 5).
- Zmiana `balance.save.loadTimeoutMs` i pomiar N-7 — `[human]`.
- Zmiana `failureText` (`saveSummaryView.ts`): wymuszony `replace`, który przekroczy limit, dostaje `siteDataAdvice`
  jak każdy błąd magazynu — przy wymuszeniu odczyt był już odrzucony, więc magazyn jest zepsuty (decyzja 7).

## Implementation Approach

Najpierw czysta logika w `core` test-first (fazy 1–3: limit czasu, polityka kopii, widok zdrowia — każda faza z
własnym szwem e2e i widoczną zmianą najwyżej w jednej sekcji panelu), potem karta wolnego odczytu (4), dialogi i
domknięcie (5), na końcu e2e (6) w protokole request-file. Każda faza zostawia pełne e2e zielone: istniejące spec'e,
których zachowanie faza zmienia, są aktualizowane w tej samej fazie (tylko faza 4: karta `timeout`).

## Critical Implementation Details

- **Jeden helper limitu**: `withTimeLimit(work, timers, ms)` w `src/core/autosave.ts` — wyścig z zegarem, `work.catch(()
  => undefined)` od razu (późne odrzucenie nie trafia do `unhandledrejection` i karty fatalnej), błąd `{ name: 'timeout' }`,
  `clearTimeout` w `finally`. `loadSave` przechodzi na niego bez zmiany zachowania.
- **Kolejność po limicie `replace`**: porzucony zapis importu/resetu może skończyć się później i wylądować po cichu.
  Po porażce `replace` z `timeout` autosaver ustawia `dirty = true` i `arm()` — zapis bieżącej sesji kolejkuje się za
  zawieszoną transakcją i przywraca to, co mówi dialog („Obecne postępy zostały bez zmian”).
- **`replace` nie potrzebuje osobnego limitu na `inflight`**: każda próba ma ograniczony czas (kopia + zapis ≤ 2 ×
  limit), a pętla `save` kończy się po pierwszej porażce — więc `await inflight` jest ograniczone. Test to przypina.
- **`hidden` po porażce kopii**: strona może zostać zabita zaraz po `flush('hidden')`; wtedy ponowna kopia (do 5 s) to
  zła wymiana. Wyjątek dotyczy tylko sesji, w której kopia już raz padła; pierwsza próba przy `hidden` dalej kopiuje.

## Phase 1: Limit czasu kopii, zapisu i `replace` w autosaverze

Driver: tdd
Driver why: limit czasu i etap porażki to zachowanie czystego autosavera z wstrzykiwanym zegarem (`makeClock().advance`) — implementacji nie ma, failing testy ją prowadzą.

### Overview

SV2-02 w `core`: zawieszony magazyn jest nazwaną porażką `timeout` z etapem, `flush` i `replace` zawsze się
rozstrzygają. Widocznie: „Zapis gry” przy zawieszonym zapisie pokazuje `failing` zamiast `notYet` (bez nowych tekstów).

### Changes Required:

#### 1. Helper limitu i `loadSave`

**File**: `src/core/autosave.ts` (`withTimeLimit`, `loadSave`); `tests/autosave.test.ts`

**Intent**: Jedna funkcja wyścigu z zegarem dla odczytu, kopii, zapisu i `replace`; `loadSave` używa jej bez zmiany zachowania.

**Contract**: `export function withTimeLimit<T>(work: Promise<T>, timers: AutosaverOptions['timers'], ms: number): Promise<T>`
— odrzuca `Object.assign(new Error('store timed out'), { name: 'timeout' })`; `work` złapane od razu; zegar czyszczony.
Istniejące testy `loadSave` bez zmian.

#### 2. Limit i etap w autosaverze

**File**: `src/core/autosave.ts` (`AutosaverOptions`, `AutosaveStatus`, `createAutosaver` → `attempt`, `replace`); `tests/autosave.test.ts`

**Intent**: `store.backup` i `store.write` w `attempt` oraz `store.write` w `replace` idą przez `withTimeLimit`. Każda
porażka zapisuje etap; log mówi, co padło (`autosave: backup failed` dla kopii — koniec mylącego `write failed`). Po
porażce `replace` z `timeout`: `dirty = true` i `arm()`.

**Contract**: `AutosaverOptions.writeTimeoutMs: number` (wymagane); `AutosaveStatus.lastFailure: { stage: 'encode' |
'backup' | 'write' | 'replace'; error: string } | null` (zostaje po późniejszym sukcesie, jak `lastError`); logi:
`autosave: encode failed`, `autosave: backup failed`, `autosave: write failed`, `autosave: replace failed`. Nowe testy:
zawieszony zapis → po `advance(writeTimeoutMs)` `flush` się rozstrzyga, `consecutiveFailures 1`, `lastFailure { stage:
'write', error: 'timeout' }`, `dirty` true, następny `markDirty` próbuje znowu; zawieszona kopia → `stage: 'backup'`;
zawieszony zapis w locie + `replace` → `replace` rozstrzyga się po ≤ 2 × limit z `{ ok: false, error: 'timeout' }`;
zawieszony zapis `replace` → po limicie `dirty` i uzbrojony timer (zapis sesji po `delayMs`); późne odrzucenie
porzuconej obietnicy nie daje nieobsłużonego odrzucenia (vitest kończy bieg błędem przy `unhandledRejection`).
**Testy zmieniane świadomie**: „waits for a write in flight, then writes the given state after it” — zostaje (wolny,
ale mieszczący się w limicie zapis dalej poprzedza `replace`); jeśli fake clock przechodzi w nim `writeTimeoutMs`, test
ustawia limit powyżej czasu `hold` i komentarz mówi dlaczego. „a failing copy writes nothing…” w tej fazie tylko
dostaje asercję `lastFailure.stage === 'backup'` (polityka zmienia się w fazie 2).

#### 3. Sklejka i szew `writehang`

**File**: `src/data/balance.ts` (`save.writeTimeoutMs: 5000` + komentarz: ten sam rząd co `loadTimeoutMs`, zapis to
dziesiątki KB na otwartym połączeniu); `src/main.ts` `start`; `src/testing/e2eHook.ts` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`,
`e2eSaveStore`, `E2E_WRITE_TIMEOUT_MS = 300`); `tests/e2eSave.test.ts`; `tests/e2eHookGuard.test.ts` (`it.each`)

**Intent**: `writehang` = świeży start (odczyt `undefined`), każdy `write` nigdy się nie rozstrzyga (operacja logowana
w `ops`). `main.ts` przekazuje `writeTimeoutMs: __E2E_HOOK__ && (seam === 'writehang' || seam === 'backuphang') ?
E2E_WRITE_TIMEOUT_MS : balance.save.writeTimeoutMs` (`backuphang` dochodzi w fazie 2 — tu tylko `writehang`). Marker
`e2eSave` już pokrywa nową wartość.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `attempt` woła `store.write` bez `withTimeLimit` → test „hung write is a timeout failure” czerwony (`flush` nie rozstrzyga się, test kończy się na limicie vitest); `withTimeLimit` bez `work.catch` → test późnego odrzucenia czerwony; przywrócone; meta-check: testy używają magazynu, który naprawdę nigdy nie odpowiada, a nie odrzuca z nazwą `timeout`
- `tests/fixtures/` bez zmian (`git diff --stat tests/fixtures` pusty); `SAVE_VERSION` 2; `tests/saveKeys.test.ts` zielony
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `lastFailure` tylko w statusie runtime (nie w `encodeSave`/`SaveState`); jeden helper limitu (bez drugiej kopii wyścigu w `replace` lub `loadSave`); `src/storage/idb.ts` nietknięty
- [visual] „Zapis gry” przy `?e2eSave=writehang` po pierwszej zmianie: stan `failing` (nie `notYet`) — 1440 i 1024 szerokości

---

## Phase 2: Polityka kopii v1: trzy próby, potem v2 bez kopii

Driver: tdd
Driver why: polityka prób kopii, wyjątek `hidden` i zaległa kopia w `replace` to czysta logika autosavera z liczalnymi przypadkami (liczba `backup`/`write` w fałszywym magazynie) — failing testy prowadzą.

### Overview

SV2-01 (opcja A z researchu) i SRR-04: postęp dziecka przestaje znikać przy każdym starcie, a zdrowe urządzenie dalej
robi kopię przed pierwszym zapisem v2 — także przy imporcie/resecie przed pierwszym zwykłym zapisem.

### Changes Required:

#### 1. Polityka i status kopii

**File**: `src/core/autosave.ts` (`AutosaverOptions`, `AutosaveStatus`, `createAutosaver` → `attempt`, `replace`, `status`); `tests/autosave.test.ts`

**Intent**: Porażka kopii (odrzucenie lub `timeout`) liczy się jako porażka próby (`failures`, `consecutiveFailures`,
`lastError`, `lastFailure.stage 'backup'`) i zapisuje `backupError`. Gdy to była porażka nr `backupAttempts` w tej sesji,
albo próba ma powód `hidden`, albo kopia padła już wcześniej, a powód to `hidden` (wtedy kopii się nie próbuje) —
ta sama próba zapisuje v2 bez kopii: `backup: 'skipped'` i jedna linia `autosave: writing v2 without the v1 copy`
z `{ from, backupError, attempts }`. Wcześniej porażka kończy próbę (retry przy następnej zmianie, jak dziś).
`replace` przy `backup` `pending`/`failed` próbuje kopii raz przez `withTimeLimit`; sukces → `done`, porażka → log,
`backupError`, `backup: 'skipped'`, a zapis `replace` idzie dalej.

**Contract**: `AutosaverOptions.backupAttempts: number` (wymagane); `AutosaveStatus.backup: 'none' | 'pending' |
'failed' | 'done' | 'skipped'` (`none` bez migracji; `failed` = ≥ 1 porażka, kopia dalej zaległa),
`AutosaveStatus.backupError: string | null`; zmienna `backedUp` zastąpiona stanem `backup` i licznikiem porażek kopii
(jedna prawda). Nowe testy: kopia pada zawsze → próby 1–2 bez `write`, próba 3: `backup ×3`, `write ×1`, `backup:
'skipped'`, `writes 1`, `consecutiveFailures 0`, log „without the v1 copy” raz; kopia pada raz, potem działa → `backup
×2`, `write`, `done`; kopia pada, potem `flush('hidden')` → bez kolejnej kopii, `write`, `skipped`; pierwsza próba to
`hidden` i kopia pada → zapis i tak (`skipped`); zawieszona kopia liczy się jak odrzucona (`backupError 'timeout'`);
`replace` w zmigrowanej sesji przed pierwszym zapisem → `backup` potem `write`; `replace` przy padającej kopii → `{ ok:
true }`, `skipped`. **Testy zmieniane świadomie**: „a failing copy writes nothing, counts as a failure with the copy error,
and stays retryable” → staje się przypadkiem „do `backupAttempts - 1`” (zachowanie przed limitem zostaje); „replace never
copies (it is not a migration)” → „replace takes the pending copy once and never waits on it” (SRR-04 odwraca decyzję
„bypass by design” z minigame-daily-puzzle, decyzja 3); „copies the raw v1 once, BEFORE the first write, and never again”
— bez zmian (zdrowa kopia).

#### 2. Liczba i sklejka

**File**: `src/data/balance.ts` (`save.backupAttempts: 3` + komentarz: pierwsza runda to ~7–12 prób zapisu, więc 3 mieści
się w pierwszej minucie gry); `src/main.ts` `start` (opcja `backupAttempts`, `backuphang` w wyborze limitu zapisu)

#### 3. Szwy `backupfail`, `backuphang`

**File**: `src/testing/e2eHook.ts` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`, `e2eSaveStore`, komentarz szwów); `tests/e2eSave.test.ts`; `tests/e2eHookGuard.test.ts`

**Intent**: Oba startują z fixture v1 (jak `v1`); `backupfail`: `backup` loguje `'backup'` w `ops` i odrzuca
`DOMException('e2e', 'QuotaExceededError')`; `backuphang`: loguje i nigdy się nie rozstrzyga. Zapisy działają.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: warunek „porażka nr `backupAttempts`” nigdy prawdziwy → test „trzecia próba zapisuje v2” czerwony; wyjątek `hidden` usunięty → test `hidden` czerwony; `replace` bez zaległej kopii → test SRR-04 czerwony; przywrócone; meta-check: testy liczą operacje `backup`/`write` magazynu i ich kolejność, nie tylko `status().backup`
- `tests/fixtures/` bez zmian; `SAVE_VERSION` 2
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (`save-migration.spec.ts` „#2 … with a v1 backup first” zielony)

#### Manual Verification:

- [human] Decyzja ponad dosłowny tekst PRD (FR-021 mówi o nieudanej migracji, milczy o nieudanej kopii): po 3 nieudanych kopiach w sesji (albo przy zamknięciu strony po pierwszej) gra zapisuje v2 bez kopii surowego v1 — treść v1 jest w v2, ale surowe bajty v1 znikają z głównego klucza; siatka na przyszły błąd migracji znika tylko na urządzeniach, gdzie kopia i tak nie działa
- [human] Decyzja: import i reset w zmigrowanej sesji próbują zaległej kopii raz i nie czekają na nią (SRR-04; odwraca „bypass by design” z minigame-daily-puzzle)
- [reviewer] Jedna prawda o kopii (`backup` + licznik, bez `backedUp` obok); kopia zawsze przed pierwszym zapisem v2 na zdrowym urządzeniu; v2 bez kopii tylko po polityce; log mówi `backup failed`, nie `write failed`

---

## Phase 3: „Zapis gry” mówi o skutku: etap i kod porażki, przeniesienie po zapisie

Driver: tdd
Driver why: `stateOf` z liczbą, etapem i kodem oraz fakt przeniesienia to czysta funkcja `core` (`saveHealthView`) — failing testy prowadzą; DOM to dwie linie w istniejącym widoku.

### Overview

SV2-03 (+ SV2-09, SRR-06): panel nie obiecuje więcej, niż autosaver widział w tej sesji.

### Changes Required:

#### 1. Widok zdrowia zapisu

**File**: `src/core/saveHealth.ts` (`SaveHealthState`, `SaveHealthView`, `stateOf`, `saveHealthView`); `tests/saveHealth.test.ts`; `tests/autosave.test.ts`

**Intent**: `failing` niesie to, co rodzic może podać; przeniesienie z v1 jest faktem dopiero po udanym zapisie.

**Contract**: `SaveHealthState.failing = { kind: 'failing'; count: number; stage: 'encode' | 'backup' | 'write' |
'replace'; error: string }` (`count = consecutiveFailures`, `stage`/`error` z `lastFailure`, awaryjnie `'write'`/
`lastError ?? 'Error'`); `SaveHealthView = SaveHealthState & { persistence; migration: { from: number; copy: 'kept' |
'lost'; code: string | null } | null }` — `migration` ≠ null tylko gdy `migratedFrom !== null && writes > 0`; `copy:
'kept'` dla `backup === 'done'`, `'lost'` dla `'skipped'` z `code = backupError`. Pole `migratedFrom` znika z widoku
(zostaje w `AutosaveStatus`). **Testy zmieniane świadomie**: `tests/saveHealth.test.ts` „keeps migratedFrom from the
status…” → przypadki `migration` (brak zapisu → null; `done` → kept; `skipped` → lost z kodem); „no write yet but a
failed attempt is failing, not notYet” → z `count`/`stage`/`error`; `tests/autosave.test.ts` „the status says which version
the save was moved from” → dodatkowo `backup: 'pending'` przed zapisem i `'done'` po (fakt, nie zamiar).

#### 2. Linie w „Zapis gry”

**File**: `src/ui/dom/saveHealthView.ts` `createSaveHealthView`; `src/data/pl.ts` (`pl.settings`); `docs/design-gaps.md` (wiersze 94, 95)

**Intent**: Pod zdaniem `saveFailing` wyciszona linia z liczbą prób, etapem i kodem; linia przeniesienia według
`migration`, przy `lost` dodatkowo `pl.saveFailed.detail(code, __BUILD_ID__)`. Poprawiony komentarz przy kluczu
przeniesienia (bez obietnicy „the old copy is kept”). Komentarze `DESIGN-GAP 94`/`95`.

**Contract**: (brzmienie do teacher read) `saveFailingDetail: (count, stage, error) => \`${countNoun(count, ['nieudana
próba', 'nieudane próby', 'nieudanych prób'])} · ${saveStage[stage]} · Kod: ${error}\``; `saveStage: { encode:
'przygotowanie zapisu', backup: 'kopia starego zapisu', write: 'zapis', replace: 'zastąpienie zapisu' }`;
`saveMigrated: { kept: (from) => \`Zapis przeniesiono z wersji ${from}. Stara kopia została na tym urządzeniu.\`, lost:
(from) => \`Zapis przeniesiono z wersji ${from}, ale starej kopii nie udało się zachować.\` }` (klucz-funkcja zastąpiony
obiektem; żaden spec go nie używa). Wiersz 94: „The kit has no line for why saving fails” → liczba, etap, kod pod
`saveFailing` (rev. 43, 50). Wiersz 95: „The kit has no line for a save moved from an older version” → linia po
pierwszym zapisie v2, z informacją o kopii i kodem (rev. 69).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `migration` liczone bez warunku `writes > 0` → test „brak zapisu → null” czerwony; `failing` bierze `stage` z `lastError` zamiast `lastFailure` → czerwony; przywrócone; meta-check: testy podają status z `migratedFrom` i `writes 0` oraz `lastFailure.stage ≠ 'write'`
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (`save-restart.spec.ts` C-2 zielony)

#### Manual Verification:

- [reviewer] Teacher read `saveFailingDetail`, `saveStage`, `saveMigrated.kept/lost` (spokojnie, dla dorosłego, liczebnik „1 nieudana próba / 2 nieudane próby / 5 nieudanych prób”), wiersze 94–95
- [visual] Zrzuty „Zapis gry” po pierwszej rundzie przy `?e2eSave=v1` (przeniesiono, kopia zachowana), `?e2eSave=backupfail` (przeniesiono, kopii nie zachowano, `Kod: QuotaExceededError`), `?e2eSave=writefail` i `?e2eSave=writehang` (`failing` z liczbą, etapem i kodem) — 1440 i 1024 szerokości

---

## Phase 4: Wolny odczyt: karta „Poczekaj dłużej” i rada zamiast pętli

Driver: impl
Driver why: przeważa nowa karta DOM i sklejka `main.ts` (pętla kart startowych); część `core` (`waitLonger` w `loadSave`) jest mała i dostaje test-first wewnątrz fazy, a skutek w przeglądarce dowodzi e2e fazy 6.

### Overview

SRR-02 i SRR-12: rodzic przy `timeout` może poczekać na ten sam odczyt dłużej; gdy i to nie pomoże, dostaje nazwaną,
warunkową radę zamiast „Uruchom grę ponownie” w pętli.

### Changes Required:

#### 1. Dłuższe czekanie na ten sam odczyt

**File**: `src/core/autosave.ts` (`LoadOutcome`, `loadSave`); `tests/autosave.test.ts`

**Intent**: Po limicie `loadSave` nie porzuca odczytu na dobre: wynik `timeout` niesie funkcję, która czeka na **tę
samą** obietnicę odczytu z dłuższym limitem i dekoduje wynik jak zwykły odczyt. Nowy odczyt kolejkowałby się za
zawieszonym, więc nie powstaje.

**Contract**: wariant `{ kind: 'unavailable'; error: string; waitLonger?: (timeoutMs: number) => Promise<LoadOutcome> }`
— obecny tylko przy `error === 'timeout'`; nigdy nie odrzuca; drugi limit → `{ kind: 'unavailable', error: 'timeout' }`
bez `waitLonger` (jedno dłuższe czekanie na start). Testy (najpierw czerwone): późny sukces → `loaded`/`fresh`/
`unreadable` jak przy zwykłym odczycie; `store.read` wołane dokładnie raz; drugi limit → brak `waitLonger`.

#### 2. Karta wolnego odczytu

**File**: `src/ui/dom/saveFailedCard.ts` (`SaveFailedHandlers`, `SaveCardCopy`, `mountSaveFailedCard`); `src/data/pl.ts`
(`pl.saveSlow`, `pl.settings.saveOff.timeout`, `pl.saveTransfer.deviceTimeout`); `src/core/saveHealth.ts`
(`SaveCardKey`, `cardCopyFor`); `tests/saveHealth.test.ts`; `docs/design-gaps.md` (wiersze 96, 97)

**Intent**: Karta dostaje opcjonalną akcję czekania: przycisk „Poczekaj dłużej” (zwykły styl; fokus zostaje na „Graj
dalej”), w trakcie wyłączony z tekstem `waiting`; po drugim limicie przycisk znika, a treść zmienia się na `stillSlow`.
`cardCopyFor('unavailable', null, 'timeout')` → `'slow'`. Teksty `saveOff.timeout` i `deviceTimeout` zamieniają „Uruchom
grę ponownie” w pętli na warunkową radę (bez stanu: zdanie mówi „jeśli to się powtarza przy każdym uruchomieniu”).

**Contract**: `SaveFailedHandlers.onWait?: () => Promise<'loaded' | 'still-slow'>`; `cardCopyFor(kind, reason, error?:
string | null): SaveCardKey` z `'slow'` dla `isTimeoutError(error)`. Brzmienie (do teacher read): `saveSlow: { title:
'Zapis wczytuje się bardzo wolno', body: 'Przeglądarka długo nie oddaje zapisu gry. Możesz poczekać dłużej albo grać
dalej bez zapisywania tej gry.', wait: 'Poczekaj dłużej', waiting: 'Czekam na zapis…', continue: 'Graj dalej', note:
'Postępy zapisane wcześniej na tym urządzeniu zostają nietknięte.', stillSlow: 'Zapis nadal się nie wczytał. Jeśli to
się powtarza przy każdym uruchomieniu, usuń dane tej strony w ustawieniach przeglądarki albo usuń ikonę gry z ekranu i
dodaj ją ponownie. To usuwa też zapis gry.' }`; `saveOff.timeout: 'Zapis jest wyłączony: odczyt zapisu trwał za długo.
Uruchom grę ponownie. Jeśli to się powtarza, pomoże usunięcie danych tej strony (to usuwa też zapis gry).'`;
`deviceTimeout`: analogicznie (zdanie o braku zastąpienia + ta sama rada). Wiersz 96: „The kit has no card for a save
that reads too slowly” → osobna karta z „Poczekaj dłużej” (rev. 45, 70). Wiersz 97: „The kit has no way out of a read
that times out at every start” → warunkowa rada w karcie, `saveOff.timeout`, `deviceTimeout` (rev. 71).

#### 3. Sklejka startu i szew `slow`

**File**: `src/main.ts` `start`; `src/data/balance.ts` (`save.slowLoadTimeoutMs: 20000` + komentarz: drugi odczyt z
dłuższym limitem zamiast licznika startów — decyzja 4); `src/testing/e2eHook.ts` (`slow`, `E2E_SLOW_READ_MS = 800`,
`E2E_SLOW_LOAD_TIMEOUT_MS = 1500`); `tests/e2eSave.test.ts`; `tests/e2eHookGuard.test.ts`

**Intent**: Gdy wynik ma `waitLonger`, `start` pokazuje kartę `slow` z `onWait`; późny wynik **zastępuje** `outcome`
w dalszej części `start` (autosaver `load`/`blockedBy`/`migrated` z nowego wyniku), a wynik, który sam wymaga karty
(`unreadable`), pokazuje swoją kartę. `slow` = odczyt rozstrzyga się po `E2E_SLOW_READ_MS` zakodowanym zapisem v2
(`freshSession` z 7 gwiazdkami); limity e2e pod `hang`/`slow`: 300 ms i 1500 ms.

#### 4. Spec'e, które ta faza zmienia

**File**: `tests/e2e/save-restart.spec.ts` („#2 M-S4 a read that never answers…”); `tests/e2e/save-transfer-blocked.spec.ts` (test `hang`)

**Intent**: Karta szukana po `pl.saveSlow.title`, przycisk `pl.saveSlow.continue`; reszta asercji bez zmian (klucze
`saveOff.timeout`/`deviceTimeout` zostają). Chromium w sesji agenta zwykle niedostępny: plik żądania
`e2e-request-p4.md` dla orkiestratora (pełny bieg + te dwa spec'e).

### Success Criteria:

#### Automated Verification:

- Testy `waitLonger` czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` (`loadSave`, `cardCopyFor`, szew `slow`)
- Deliberate break: `waitLonger` woła `store.read()` ponownie zamiast czekać na tę samą obietnicę → test „read called once” czerwony; przywrócone; meta-check: fałszywy magazyn liczy wywołania `read`, a późny sukces przychodzi z pierwszej obietnicy
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `slow` tylko pod `e2eSave`
- E2E (orkiestrator, `--workers=4`): `<baseline gałęzi e2e> + 0`, w tym zmienione M-S4 i test `hang` zielone

#### Manual Verification:

- [reviewer] Teacher read `saveSlow.*`, nowej treści `saveOff.timeout`/`deviceTimeout` (warunkowa, z ostrzeżeniem, że rada usuwa zapis); wiersze 96–97; fokus nigdy na „Poczekaj dłużej”
- [visual] Zrzuty karty: `?e2eSave=hang` przed czekaniem, w trakcie („Czekam na zapis…”), po drugim limicie (`stillSlow`); `?e2eSave=unavailable` (karta `saveUnavailable` bez zmian); „Zapis gry” i dialog resetu przy `?e2eSave=hang` (nowa treść) — 1440 i 1024 szerokości
- [human] Decyzja: bez licznika startów w `localStorage`; wyjście z trwałego `timeout` to dłuższe czekanie na ten sam odczyt + warunkowa rada o danych strony
- [human] Pomiar N-7 na iPadzie: zimny odczyt IndexedDB po długiej przerwie — czy 20 s `slowLoadTimeoutMs` rozstrzyga trwały `timeout` (decyduje o liczniku startów)

---

## Phase 5: Dialogi po limicie, log `persist()`, seam sweep i dokumentacja

Driver: impl
Driver why: ostatnia faza `impl` — strażnik Escape w dwóch istniejących dialogach DOM (bez środowiska DOM w vitest; dowód w e2e fazy 6), jedna linia logu w adapterze, seam sweep, follow-upy i `CLAUDE.md`.

### Overview

O2 i S12-12, potem domknięcie zmiany przed e2e.

### Changes Required:

#### 1. Escape w trakcie zapisu

**File**: `src/ui/dom/saveImportDialog.ts` (`stepTwo`); `src/ui/dom/saveResetDialog.ts`

**Intent**: Dopóki `busy`, Escape nic nie robi (zamknięcie zostawiało oczekujące `reload()`, które wystrzeliwało w
środku gry). Po rozstrzygnięciu `apply` — sukces przeładowuje, porażka przywraca „Zamknij” i Escape — jak dziś; limit z
fazy 1 gwarantuje, że rozstrzygnięcie nastąpi.

**Contract**: `onEscape` dialogu sprawdza tę samą flagę `busy`, co przyciski; `src/ui/dom/dialog.ts` bez zmian.

#### 2. Log porażki `persist()` (S12-12)

**File**: `src/storage/idb.ts` `requestPersistence`; test w istniejącym pliku testów `requestPersistence` (albo nowy `tests/requestPersistence.test.ts`)

**Intent**: `catch (e)` loguje `console.warn('save: persist() failed', errorName(e))` (tylko nazwa) i zwraca `'error'`.

#### 3. Seam sweep

**File**: pliki faz 1–5

**Intent**: jeden helper limitu (`withTimeLimit`) bez drugiej kopii wyścigu; jedna prawda o kopii (`backup` + licznik);
żadnego martwego klucza `pl.ts` (stary `saveMigrated` jako funkcja, nieużyte teksty); komentarze aktualne (nagłówek
`SaveStore.backup`, komentarz w `attempt` „a failed copy fails this attempt…”, komentarz szwów w `main.ts` i
`e2eHook.ts`, nagłówki dialogów o `busy`, komentarz `pl.ts` przy przeniesieniu, `balance.save`); wiersze
`docs/design-gaps.md` 43, 45, 50, 69–71 spójne z 94–97; `REGISTRY_KEYS`/`SAVE_KEYS`/fixtury nietknięte; typ `save` w
`tests/e2e/support/hook.ts` zaktualizowany w fazie 6 (tu tylko odnotowany).

#### 4. Follow-upy

**File**: `context/changes/save-v2-backup-health/follow-ups/review-fixes.md` (nowy)

**Intent**: Każdy z konkretnym `Trigger:` (ta zmiana sama dotyka `replace`, dialogów i `stateOf`, więc stare triggery
„next change to …” są spełnione i nie mogą zostać): SV2-04 i opcja B (`Trigger: a parent report of lost progress after
an update, or the v3 save format`); SRR-08 + licznik startów `unavailable` (`Trigger: the [human] N-7 measurement showing
permanent timeouts or a report that "Poczekaj dłużej" was not enough`); S12-07 (`Trigger: the next change to
saveExport.ts`); S12-08, S12-13 (`Trigger: a parent report of a refused readable file, or the next change that adds a
step to saveImportDialog/saveResetDialog`); S12-03, S12-11 (`Trigger: any replace path that does not reload the page right
after apply`); F7 / SRR-09 / SRR-01 (`Trigger: a migration step that can throw (v3)`); SRR-07, SRR-10, SRR-11, SRR-13,
SV2-05..SV2-15 bez SV2-08 (`Trigger: the next change to autosave.ts attempt or main.ts start`), SV2-08 (`Trigger: a human
deploy/ change`); L-S3 `visibilitychange` (`Trigger: the next change to the visibilitychange handler in main.ts`);
abort transakcji w `idb.ts` (`Trigger: evidence that hangs happen inside a live transaction on iPadOS`). Zamknięte
(odnośniki do archiwum, archiwum nieedytowane): „A permanently failing backup write blocks every save…” (F5), S12-02,
„`Autosaver.replace` never takes the v1 backup” (SRR-04), osobna karta `timeout` (SRR-12), O2, F3 (szew
`unavailable`, formalnie).

#### 5. `CLAUDE.md`

**File**: `CLAUDE.md` „Current state”

**Intent**: Jedno zdanie: `withTimeLimit` i `balance.save.writeTimeoutMs` dla kopii, zapisu i `replace`; polityka kopii
(`backupAttempts` 3, wyjątek `hidden`, `backup`/`backupError`/`lastFailure` w statusie runtime, `replace` bierze zaległą
kopię raz); „Zapis gry” z etapem i kodem i przeniesieniem po zapisie; karta `slow` z „Poczekaj dłużej”
(`slowLoadTimeoutMs`, `waitLonger`); szwy `writehang|backupfail|backuphang|slow`; gaps 94–97.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (log `persist()`)
- Deliberate break: `requestPersistence` bez `console.warn` → nowy test czerwony; przywrócone; meta-check: test rzuca z `persist()` błąd z nazwą i sprawdza, że log niesie nazwę, nie wiadomość
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/autosavee.ts` → FAIL; przywrócone
- `grep -c '^Trigger:\|Trigger:' context/changes/save-v2-backup-health/follow-ups/review-fixes.md` ≥ liczba follow-upów
- `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: jeden helper limitu, jedna prawda o kopii, brak martwych kluczy, komentarze, gaps 43/45/50/69–71 spójne z 94–97, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`
- [visual] Zrzut dialogu resetu przy `?e2eSave=writehang`: w trakcie (przyciski wyłączone) i po limicie (`resetFailed`, „Zamknij” aktywne) — 1440 i 1024 szerokości

---

## Phase 6: Zapis przetrwa padającą kopię i zawieszony magazyn — e2e (#2)

Driver: e2e
Driver why: ryzyko #2 (postęp nigdy nie ginie) przy padającej kopii, zawieszonym zapisie i wolnym odczycie istnieje tylko w przeglądarce z prawdziwym autosaverem, dialogami i kartą; zbudowane w fazach 1–5, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/save-backup-health.spec.ts` (projekt `chromium-hook`: nazwa `save-backup-health` dopisana do
wyrażenia `ROUND_SPEC` w `playwright.config.ts` — inaczej spec trafi do projektu produkcyjnego bez haka) i aktualizacja typu `save` w `tests/e2e/support/hook.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/save-backup-health.spec.ts` (nowy); `tests/e2e/support/hook.ts` (typ `save`: `backup`,
`backupError`, `lastFailure`, `loadReason`, `loadError`, `replace`, `persistence`)

**Intent**: (a) „#2 SV2-01 a v1 save whose copy always fails is written as v2 after three tries”: `?e2eSave=backupfail`
(+ `e2eVariant=off`) → zagraj zadania aż `store.ops` ma trzy `backup` i `write`; `writtenVersion 2`; `save.backup
'skipped'`, `backupError 'QuotaExceededError'`; „Zapis gry”: `pl.settings.saveMigrated.lost(1)` i `Kod:
QuotaExceededError`. (b) „#2 SV2-02 a write that never answers is a named failure and the reset dialog comes back”:
`?e2eSave=writehang` → `passWelcome` → `save.lastFailure` `{ stage: 'write', error: 'timeout' }`; sekcja `data-state
failing`; reset → potwierdzenie → Escape w trakcie nie zamyka dialogu → `resetFailed` widoczne, „Zamknij” aktywne, brak
przeładowania. (c) „#2 SRR-02 a slow read can be waited for”: `?e2eSave=slow` → karta `pl.saveSlow.title` → „Poczekaj
dłużej” → karta znika, licznik gwiazdek 7, `save.blockedBy null`. (d) „#2 SRR-02 a read that never answers ends in the
advice, not a loop”: `?e2eSave=hang` → „Poczekaj dłużej” → `pl.saveSlow.stillSlow` widoczne, brak przycisku czekania →
„Graj dalej” → gra.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty z DOM po kluczach `pl` (dokładne napisy
przycisków per stan dialogu), stan z haka tylko do odczytu; nowy kontekst = świeże urządzenie; nigdy IDB z testu;
`?e2eSkills=` i `e2eVariant=off` przy graniu rund. **Chromium niedostępny w sesji agenta**: protokół request-file —
`e2e-request-p6.md`, patche `e2e-break-p6a.patch` … `e2e-break-p6d.patch` (tylko kod produkcyjny), `STATUS: BLOCKED —
e2e needs orchestrator run (request file written)`; agent kończący commituje spec po wyniku orkiestratora. Spec w trybie
serial → każdy oczekiwany czerwony test osobno (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-backup-health.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + 4`
- Deliberate break (patch `e2e-break-p6a.patch`): polityka kopii nigdy nie rezygnuje (`backupAttempts` ignorowane) → (a) czerwony na braku `write`; meta-check: dowodzi SV2-01 w przeglądarce, nie tylko w `core`
- Deliberate break (patch `e2e-break-p6b.patch`): `replace` woła `store.write` bez `withTimeLimit` → (b) czerwony (dialog zostaje z wyłączonymi przyciskami)
- Deliberate break (patch `e2e-break-p6c.patch`): `start` pomija `waitLonger` (karta bez akcji czekania) → (c) i (d) czerwone
- Deliberate break (patch `e2e-break-p6d.patch`): `onEscape` dialogu resetu bez strażnika `busy` → (b) czerwony na zniknięciu dialogu; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `withTimeLimit` (wyścig, późne odrzucenie złapane, zegar czyszczony); autosaver: zawieszony zapis/kopia/`replace` →
  `timeout` z etapem, `flush` i `replace` zawsze się rozstrzygają, `dirty` + `arm()` po limicie `replace`; polityka kopii
  (1–2 porażki → retry, 3. → v2 bez kopii, `hidden`, zawieszona kopia, `replace` z zaległą kopią) liczona operacjami
  fałszywego magazynu; `saveHealthView` (`failing` z liczbą/etapem/kodem, `migration` po zapisie); `loadSave`
  `waitLonger` (ten sam odczyt, drugi limit); `cardCopyFor` `slow`; szwy `writehang|backupfail|backuphang|slow` i strażnik;
  log `persist()`.

### Integration Tests:

- `npm run build` (strażnik szwów); e2e: zmienione M-S4 i test `hang` (faza 4), cztery nowe testy (faza 6).

### Manual Testing Steps:

1. Zrzuty stanów z faz 1–5 (bramka wizualna; Playwright fallback dla stanów za bramką dorosłego — profil § 8).
2. Teacher read wszystkich nowych tekstów `pl.settings.*`, `pl.saveSlow.*`, `pl.saveTransfer.deviceTimeout`.
3. `[human]`: decyzje 2.5, 2.6, 4.7; pomiar N-7 4.8; rada o danych strony z poprzedniej zmiany (`[human]` 4.8 tam) dalej otwarta.

## Performance Considerations

Jeden zegar na operację magazynu; brak nowego I/O poza zaległą kopią w `replace` (jedna operacja, raz).

## Migration Notes

Brak zmiany formatu. Urządzenie z v1, na którym kopia działa: jak dziś (kopia, potem v2). Urządzenie z trwale padającą
kopią (dziś: v1 na zawsze, postęp ginie przy każdym starcie): po wdrożeniu pierwsza sesja zapisuje v2 po 3 porażkach;
kolejne starty czytają v2, bez migracji.

## Known risks

- **Utrata siatki na błąd migracji** na urządzeniach z padającą kopią: surowe v1 znika z głównego klucza po zapisie v2.
  Łagodzi: v2 ⊇ v1 (zwalidowane), linia w panelu z kodem, log. `[human]` 2.5.
- **Późne lądowanie porzuconego zapisu**: zapis `replace`, który przekroczył limit, może się kiedyś zakończyć;
  zapis bieżącej sesji (dirty + arm) kolejkuje się za nim. Jeśli strona zostanie zamknięta przed tym zapisem, import
  może wylądować mimo komunikatu „bez zmian”. Rzadkie (zawieszony magazyn, który potem ożywa); odnotowane.
- **Trwały `timeout`** dalej bez wyjścia w aplikacji poza radą — zależy od N-7. `[human]` 4.8.
- **Chromium w sesji agenta**: fazy 4 i 6 w protokole request-file; zrzuty przez fallback Playwright.

## References

- Research: `context/changes/save-v2-backup-health/research.md`; change: `context/changes/save-v2-backup-health/change.md`
- Audyt obserwowalności 2026-10-15_0253 (PR #52): SV2-01..15, SRR-01..13; audyt 2026-10-14 04:45 (PR #42): S12-02..15
- Kontrakt runu `context/runs/2026-10-15-fix-s14c-s14d/agent-contract.md` („Slice-specific rules”); profil `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test-plan `context/foundation/test-plan.md` ryzyko #2; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-14-save-reason-and-recovery/plan.md` (`replaceGate`, request-file, DESIGN-GAP 69–71), `context/archive/2026-10-14-minigame-daily-puzzle/plan.md` (faza 2 „Kopia przed pierwszym zapisem”, plan-review F5/F7), `context/archive/2026-10-13-save-observability-c1-c2/` (`.catch` porzuconego odczytu)
- PRD `context/foundation/prd.md`: guardrail „Postęp nigdy nie ginie”, FR-020, FR-021, US-04

## Autonomous decisions

1. **SV2-01: opcja A, `backupAttempts = 3`, wyjątek `hidden` po ≥ 1 porażce, zawieszona kopia liczy się jak odrzucona.**
   Odrzucone: B (przycisk „Zachowaj kopię v1” — „Zapisz kopię” już eksportuje pełny stan v2 ⊇ v1), C (osobny klucz v2 —
   zmienia ścieżkę odczytu, przy braku miejsca też padnie), D (blokada z nazwą — postęp dalej ginie). Dlaczego: guardrail
   „Postęp nigdy nie ginie” i FR-020; FR-021 dotyczy nieudanej migracji, nie kopii (PRD milczy → `[human]` 2.5). Co
   zmieniłoby: pole v1, którego `MIGRATIONS[1]`/`encodeSave` nie przenosi, albo migracja, która może rzucić (v3) → B lub
   blokada do eksportu.
2. **Licznik porażek kopii w sesji, nie między startami.** Dlaczego: ~7–12 prób w pierwszej rundzie; wyjątek `hidden`
   pokrywa krótkie sesje. Co zmieniłoby: pomiar, że typowa sesja kończy się przed 2 próbami bez `hidden`.
3. **SRR-04 włączone: `replace` próbuje zaległej kopii raz, z limitem, i nie blokuje.** Odrzucone: „bypass by design”
   (minigame-daily-puzzle). Dlaczego: reset w zmigrowanej sesji przed pierwszym zapisem na zdrowym urządzeniu niszczył
   surowe v1 bez kopii, a SV2-02 i tak zmienia `replace`. `[human]` 2.6. Co zmieniłoby: opiekun uznaje import/reset za
   świadome porzucenie starego zapisu.
4. **SRR-02: bez licznika w `localStorage`; „Poczekaj dłużej” na ten sam odczyt (`slowLoadTimeoutMs = 20000`, raz na
   start) + warunkowa rada w karcie i w tekstach `saveOff.timeout`/`deviceTimeout`.** Odrzucone: licznik startów
   (session-only w trybie prywatnym Safari, pierwsza ścieżka storage w grze), wymuszony zapis przy `timeout` (kolejkuje
   się za zawieszonym odczytem; zdrowy wolny zapis nie może być nadpisany). Rada w tekstach panelu jest statyczna i
   warunkowa — panel nie wie, czy rodzic czekał. Co zmieniłoby: N-7 pokazujące trwały `timeout`, którego 20 s nie
   rozstrzyga → licznik (follow-up SRR-08).
5. **`writeTimeoutMs = 5000`, jeden limit dla kopii, zapisu i `replace`; brak `abort` w `idb.ts`.** Dlaczego: ten sam
   rząd co `loadTimeoutMs`, zapis to dziesiątki KB; idb-keyval nie daje `abort`, a zawieszenie w `open` nie ma transakcji.
   Co zmieniłoby: dowód, że zawieszenia dzieją się w żywej transakcji na iPadOS.
6. **Po limicie `replace` tylko `timeout` oznacza grę jako brudną i uzbraja zapis.** Odrzucone: zawsze po porażce.
   Dlaczego: odrzucona transakcja nie zapisała nic; tylko porzucona może wylądować później. Co zmieniłoby: dowód, że
   odrzucona transakcja IDB bywa zatwierdzona.
7. **`failureText` bez zmian** (wymuszony `replace` po limicie → `siteDataAdvice`). Dlaczego: wymuszenie istnieje tylko
   przy odrzuconym (nie `timeout`) odczycie, więc magazyn jest zepsuty i rada pasuje. Co zmieniłoby: wymuszenie dostępne
   przy innym stanie odczytu.
8. **Kandydaci poza zakresem: S12-08, S12-13, S12-03, SRR-08 → follow-upy; włączone tanio: O2, S12-12, SRR-12.**
   Dlaczego: O2 i SRR-12 dotyczą dokładnie zmienianych ścieżek (`busy` + limit, karta `timeout`), S12-12 to jedna linia;
   pozostałe dodają kroki dialogów lub stan między startami. Co zmieniłoby: plan-review wskazujący, że S12-13 (`apply`
   poza `session.run`) psuje odblokowanie wejścia przy nowym błędzie `timeout`.
9. **Fazy 1–3 `tdd`, 4–5 `impl`, 6 `e2e`; każdy nowy szew w fazie, która go potrzebuje do zrzutu.** Dlaczego: kontrakt
   (małe fazy, ≤ 2 komponenty UI na fazę: faza 3 = jedna sekcja, faza 4 = karta, faza 5 = dwa dialogi).
10. **Nowe pola stanu tylko w `AutosaveStatus` (runtime), format v2.** Dlaczego: kontrakt runu; stan kopii opisuje sesję
    urządzenia, nie postęp. Co zmieniłoby: potrzeba wiedzy o kopii przy kolejnym starcie (SV2-04) → v3, poza tym runem.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Limit czasu kopii, zapisu i `replace` w autosaverze

#### Automated

- [ ] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- [ ] 1.2 Deliberate break: `attempt` bez `withTimeLimit` → test „hung write is a timeout failure” czerwony; `withTimeLimit` bez `work.catch` → test późnego odrzucenia czerwony; przywrócone; meta-check
- [ ] 1.3 `tests/fixtures/` bez zmian; `SAVE_VERSION` 2; `tests/saveKeys.test.ts` zielony
- [ ] 1.4 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 1.5 [reviewer] `lastFailure` tylko w statusie runtime; jeden helper limitu; `src/storage/idb.ts` nietknięty
- [ ] 1.6 [visual] „Zapis gry” przy `?e2eSave=writehang`: `failing`, nie `notYet` — 1440 i 1024

### Phase 2: Polityka kopii v1: trzy próby, potem v2 bez kopii

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Deliberate break: limit prób nigdy nie osiągany / wyjątek `hidden` usunięty / `replace` bez zaległej kopii → odpowiednie testy czerwone; przywrócone; meta-check (liczone operacje magazynu)
- [ ] 2.3 `tests/fixtures/` bez zmian; `SAVE_VERSION` 2
- [ ] 2.4 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 2.5 [human] Decyzja ponad PRD: po 3 nieudanych kopiach w sesji (albo przy zamknięciu strony po pierwszej) v2 zapisywane bez kopii surowego v1
- [ ] 2.6 [human] Decyzja: import i reset w zmigrowanej sesji próbują zaległej kopii raz i nie czekają na nią (SRR-04)
- [ ] 2.7 [reviewer] Jedna prawda o kopii; kopia przed pierwszym zapisem v2 na zdrowym urządzeniu; log `backup failed`

### Phase 3: „Zapis gry” mówi o skutku: etap i kod porażki, przeniesienie po zapisie

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Deliberate break: `migration` bez warunku `writes > 0` / `stage` z `lastError` → testy czerwone; przywrócone; meta-check
- [ ] 3.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.4 [reviewer] Teacher read `saveFailingDetail`, `saveStage`, `saveMigrated.kept/lost`; wiersze 94–95
- [ ] 3.5 [visual] „Zapis gry” przy `?e2eSave=v1`, `backupfail`, `writefail`, `writehang` po pierwszej rundzie — 1440 i 1024

### Phase 4: Wolny odczyt: karta „Poczekaj dłużej” i rada zamiast pętli

#### Automated

- [ ] 4.1 Testy `waitLonger` czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- [ ] 4.2 Deliberate break: `waitLonger` woła `store.read()` ponownie → test „read called once” czerwony; przywrócone; meta-check
- [ ] 4.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `slow` tylko pod `e2eSave`
- [ ] 4.4 E2E (orkiestrator, `--workers=4`): `<baseline gałęzi e2e> + 0`, zmienione M-S4 i test `hang` zielone

#### Manual

- [ ] 4.5 [reviewer] Teacher read `saveSlow.*`, `saveOff.timeout`, `deviceTimeout`; wiersze 96–97; fokus nigdy na „Poczekaj dłużej”
- [ ] 4.6 [visual] Karta przy `?e2eSave=hang` (przed, w trakcie, po drugim limicie), `?e2eSave=unavailable`; „Zapis gry” i dialog resetu przy `hang` — 1440 i 1024
- [ ] 4.7 [human] Decyzja: bez licznika startów; wyjście z trwałego `timeout` = dłuższe czekanie na ten sam odczyt + warunkowa rada
- [ ] 4.8 [human] Pomiar N-7 na iPadzie: czy 20 s rozstrzyga trwały `timeout`

### Phase 5: Dialogi po limicie, log `persist()`, seam sweep i dokumentacja

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (log `persist()`)
- [ ] 5.2 Deliberate break: `requestPersistence` bez `console.warn` → nowy test czerwony; przywrócone; meta-check
- [ ] 5.3 `validate-rule-files.sh` PASS; deliberate break w `CLAUDE.md` → FAIL; przywrócone
- [ ] 5.4 Każdy follow-up w `follow-ups/review-fixes.md` ma `Trigger:`
- [ ] 5.5 `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.6 [reviewer] Seam sweep: jeden helper limitu, jedna prawda o kopii, brak martwych kluczy, komentarze, gaps 43/45/50/69–71 spójne z 94–97, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`
- [ ] 5.7 [visual] Dialog resetu przy `?e2eSave=writehang`: w trakcie i po limicie (`resetFailed`, „Zamknij”) — 1440 i 1024

### Phase 6: Zapis przetrwa padającą kopię i zawieszony magazyn — e2e (#2)

#### Automated

- [ ] 6.1 `npx playwright test tests/e2e/save-backup-health.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + 4`
- [ ] 6.2 Deliberate break p6a: polityka kopii nigdy nie rezygnuje → (a) czerwony; meta-check
- [ ] 6.3 Deliberate break p6b: `replace` bez `withTimeLimit` → (b) czerwony
- [ ] 6.4 Deliberate break p6c: `start` pomija `waitLonger` → (c) i (d) czerwone
- [ ] 6.5 Deliberate break p6d: `onEscape` resetu bez strażnika `busy` → (b) czerwony; przywrócone
- [ ] 6.6 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
