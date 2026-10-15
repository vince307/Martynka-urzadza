# Łączny limit ładowania, linia „jeszcze chwilka” i strażnik zapisu przed starszą kartą — Implementation Plan

## Overview

Poprawka spoza roadmapy po audycie obserwowalności 2026-10-15_2217 (PR #66, nie mergowany): **A-1** (HIGH), **A-2**,
**P-5**, plus limit czasu fontu (follow-up `salon-load-health`, „the next change to `BootScene.preload`”). Skutki:

1. Ładowanie w `BootScene` ma **łączny** limit (`balance.loader.totalMs`): gdy minie, każdy niedokończony plik (pobieranie,
   dekodowanie obrazka, obietnica `FontFace`) zostaje zakończony błędem przez własne ścieżki loadera Phasera, `create()`
   biegnie **dokładnie raz** z tym, co się wczytało, a zastępstwa (`ArtImage`, `artFilter`, „Obrazki”) pokrywają resztę.
   Obejmuje też ~13 plików dźwięku, które doda S-16b (ta sama kolejka).
2. Po `balance.loader.slowAfterMs` ekran ładowania pokazuje spokojną linię `pl.loading.slow` pod paskiem (A-2).
3. Zapis na urządzeniu nie jest nadpisywany przez kartę/instancję, która ma starszy format niż zapis już leżący w
   IndexedDB: zapis w `src/storage/idb.ts` idzie przez `guardedPut` (odczyt + zapis w jednej transakcji `readwrite`; nieczytelny rekord nie blokuje zapisu) i odmawia,
   gdy zapisana `version` jest większa; autosaver blokuje się z runtime'owym powodem `'newer'`, rodzic widzi przyczynę w
   „Zapis gry” (P-5). Format zostaje **v3**, fixtury bajt w bajt.

## Current State Analysis

(Za `research.md`; symbole potwierdzone w tym kroku na `a6def4c`.)

- `src/scenes/BootScene.ts` `preload`: `LoadingScreen`, `progress`, kopiowanie `this.load.xhr.timeout` na każdy plik
  (`Loader.Events.ADD`), `this.load.font(FONT_KEY, …)`, `loaderror` → `console.warn`, wszystkie `TASK_ART` i `ROOM_ART`.
  Brak limitu łącznego; `create()` tylko na `COMPLETE` loadera; `create()` liczy `artHealth` z `textures.exists` i oddaje
  scenę przez `this.time.delayedCall(0, …)`.
- `src/main.ts` `createGame`: `loader: { timeout: balance.loader.timeoutMs (12000), maxRetries: 1 }`, pod
  `?e2eArt=stall` `{ timeout: E2E_LOADER_TIMEOUT_MS (2000), maxRetries: 0 }`. Brak `maxParallelDownloads` → 6 na
  Androidzie, 32 gdzie indziej.
- Phaser 4.2.1 (`package.json` `^4.2.1`): brak publicznego abortu; `reset()` zostawia once-listener `COMPLETE → create`
  (późny plik uruchomiłby `create()` drugi raz); `nextFile(file, false)` liczy `totalFailed`, emituje `loaderror`,
  woła `fileProcessComplete`; `fileProcessComplete` z `FILE_ERRORED` pomija cache i kończy ładowanie, gdy wszystkie Sety
  puste; `FontFile` jest `FILE_POPULATED` od konstruktora i czeka w `queue` na `FontFace.load()` bez limitu; późne
  `onProcessComplete` po zniszczeniu pliku rzuca w obietnicy → nieobsłużone odrzucenie → karta błędu (research §2).
- `src/ui/widgets/LoadingScreen.ts`: `progress(value)`, `destroy()`; `pl.loading = { title }`; `LOADING_LAYOUT =
  { title, bar }`.
- `src/core/autosave.ts`: `BlockReason = 'unreadable' | 'unavailable' | 'fatal'`; `attempt` i `replace` piszą
  `limited(store.write(…))` bez odczytu; `replaceGate`; `block(reason)` zachowuje pierwszy powód.
- `src/storage/idb.ts` `createIdbSaveStore.write` = `set(key, value, s)` przez `run` (jedno ponowienie po utracie
  połączenia iOS, chyba że zapis został zastąpiony).
- `src/core/saveHealth.ts` `offState` (przyczyny `BlockReason | 'future' | 'timeout' | 'migration-failed'`),
  `src/ui/dom/saveHealthView.ts` czyta `pl.settings.saveOff[view.cause]`; `src/core/saveFile.ts` `deviceSaveView`
  (`blocked.cause: 'future' | 'timeout' | 'unavailable' | 'fatal'`).
- Szwy e2e (`src/testing/e2eHook.ts`): `E2EArtSeam` (`missing | corrupt | room | stall`), `E2ESaveSeam` (11 wartości),
  `e2eSaveStore` w pamięci; getter `snapshot` poza powitaniem woła `task().snapshot()` — podczas `BootScene` nie ma
  odczytu ekranu ładowania. Markery `e2eArt`, `e2eSave` w `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` pokrywają nowe
  wartości. Spec `tests/e2e/salon-load-health.spec.ts` („#15 H-2 …”) przypina limit na plik — zostaje zielony.
- `vite/config.shared.mjs`: `skipWaiting: true`, `clientsClaim: true` (decyzja `installable-offline-pwa`, PRD FR-003).
- `context/foundation/lessons.md` nie istnieje. Ostatni wiersz `docs/design-gaps.md`: 111.

## Desired End State

- `src/core/bootLoad.ts`: czysta reguła `bootLoadPhase(elapsedMs, limits) → 'loading' | 'slow' | 'over'` i
  `checkBootLimits(limits)`; `balance.loader = { timeoutMs: 12000, maxRetries: 1, slowAfterMs: 8000, totalMs: 45000 }`.
- `BootScene` tnie ładowanie po `totalMs` na zegarze pętli gry (`this.time`), przez moduł `src/scenes/loaderCut.ts`
  (jedyne miejsce dotykające wnętrza loadera, komentarz z wersją Phasera); `create()` raz; rejestr runtime
  `REGISTRY_KEYS.bootLoad = { cut: string[]; creates: number }` (poza `SAVE_KEYS`); jedna linia logu z liczbą i kluczami
  uciętych plików.
- `LoadingScreen.slow()` rysuje `pl.loading.slow` w `LOADING_LAYOUT.slow`; DESIGN-GAP 112.
- Szew `?e2eArt=stallall` (tylko build haka): limit na plik wyłączony, krótkie e2e `slowAfterMs`/`totalMs`; hak ma
  `screen: 'loading'` z `loading: { phase }` i `bootLoad` w migawce.
- `storedVersionNewer(stored, version)` w `src/core/save.ts`; `createIdbSaveStore.write` przez `guardedPut` rzuca błąd o
  nazwie `NewerSave`; `BlockReason` zyskuje `'newer'` (runtime); `replaceGate` → `Blocked`; `offState`/`deviceSaveView`
  znają `'newer'`; `pl.settings.saveOff.newer`; DESIGN-GAP 113; szew `?e2eSave=newer`.
- Spec `tests/e2e/load-and-tab-guard.spec.ts`: #15 (wiele zawieszonych plików + font → linia, start, zastępstwa, jeden
  `create`) i #2 (nowszy zapis → brak nadpisania, linia w „Zapis gry”).
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty; `vite/config.shared.mjs` bez zmian.

### Key Discoveries:

- Wymuszone niepowodzenie przez `nextFile(f, false)` / `fileProcessComplete` to jedyna droga, która kończy loader
  naturalnie i uruchamia `create()` raz (research §2: `reset()` → podwójne `create`, `scene.stop` → brak `create`).
- `xhr.abort()` sam nie kończy pliku (Phaser nie ustawia `onabort`), a `File.onError` ponawia przy `retryAttempts > 0` —
  ścieżka cięcia zeruje `retryAttempts`, woła `resetXHR()`, zeruje `ontimeout` i dopiero wtedy `nextFile`.
- `this.time.delayedCall` ustawione w `preload` tyka podczas ładowania (scena w stanie LOADING jest krokowana); zatrzymuje
  się z ramką animacji w ukrytej karcie, jak sam loader.
- idb-keyval 6.3.0 `update` = `get` + `put` w jednej transakcji `readwrite`; wyjątek w updaterze odrzuca przed `put`, ale błąd `get` też odrzuca całość — dlatego `guardedPut` na surowym magazynie (plan-review F1).
- Getter `snapshot` haka podczas Boot sięga do `TaskScene`, której jeszcze nie ma — e2e potrzebuje gałęzi `loading`.
- **Lekcja poprzedniego runu**: konfiguracja `loader.timeout` w `createGame` była no-opem i wyłapało to dopiero e2e
  (`salon-load-health` faza 3 → f4415a5). Każdy mechanizm na wnętrzu loadera ma tu nazwany dowód w przeglądarce
  (faza 7); testy jednostkowe na liczbach `balance.loader` **nie są** tym dowodem.

## What We're NOT Doing

- Karta dla dziecka przy `'newer'` (tylko linia rodzica w „Zapis gry” + log) — decyzja autonomiczna 4; follow-up.
- Zmiana `skipWaiting`/`clientsClaim` w `vite/config.shared.mjs`, nasłuch `controllerchange` — decyzja 6.
- Strażnik kolejności dwóch kart **tej samej** wersji (licznik zapisów = v4, `BroadcastChannel`) — follow-up.
- Ochrona przed kartą z buildu sprzed tej zmiany (nie da się kodem) — zapisane w ryzykach.
- Audyt A-3..A-11 (m.in. przyczyna per klucz, czas ładowania i `totalFailed` w rekordzie — poza jedną linią logu),
  V-*, P-1..P-4, P-6..P-8 — follow-upy z triggerem (faza 6).
- `loaderror` dla plików z kolejki (dekodowanie, font) — decyzja 7; zmiana `maxParallelDownloads`; grafika ekranu
  ładowania (S-16c); dźwięki (S-16b).
- Nic w `deploy/`, `designs/`, `.gitignore`, `.claude/`; `package.json` bez zmian (Phaser nadal `^4.2.1`).

## Implementation Approach

Najpierw czysta reguła i liczby (faza 1, tdd), potem cięcie loadera ze szwem i odczytem w haku (faza 2, impl), potem
linia „jeszcze chwilka” (faza 3, impl). Część P-5: reguła i reakcja `core` (faza 4, tdd), magazyn IndexedDB na
fake-indexeddb i szew `newer` (faza 5, tdd), dokumentacja i follow-upy (faza 6, impl), na końcu e2e obu ryzyk (faza 7,
e2e, protokół request-file). Każda faza zostawia pełną bramkę i istniejące e2e zielone.

## Critical Implementation Details

- **Kolejność w ścieżce cięcia** (`loaderCut.ts`): najpierw przenieść pliki z `list` do `inflight`; dla `inflight`:
  `retryAttempts = 0`, zachować `xhrLoader`, `resetXHR()`, `ontimeout = null`, `abort()`, `nextFile(f, false)`; dla
  `queue`: odpiąć `data.onload/onerror` obrazka, **najpierw** podmienić `onProcessComplete` na no-op (późne rozstrzygnięcie
  `FontFace` nie może rzucić → karta błędu), potem `state = FILE_ERRORED`, `fileProcessComplete(f)`. Iterować po kopiach
  Setów. `create()` może pobiec synchronicznie w środku ostatniego wywołania — oddanie sceny jest już odroczone
  `delayedCall(0)`. Pliki przeniesione z `list` nie mają `xhrLoader` (`File.load` nigdy nie ruszył): `abort()` tylko
  przy istniejącym `xhrLoader`; każdemu ucinanemu plikowi ustawić `state = FILE_ERRORED` przed `nextFile`/
  `fileProcessComplete` (inaczej plik z `list` zostaje `FILE_PENDING`). (plan-review F3)
- **Dlaczego podmiana `onProcessComplete` (plan-review F2)**: pliki z `queue` NIE trafiają do `_deleteQueue`, więc nie są
  niszczone (`File.destroy` nie zeruje im `loader`). Późne rozstrzygnięcie `FontFace` bez podmiany NIE rzuca: woła
  `fileProcessComplete` → drugi `loadComplete` (drugi `COMPLETE`, stan loadera nadpisany z `SHUTDOWN` na `COMPLETE`,
  tekstura/font dodane do cache po policzeniu `artHealth`). Drugiego `create()` nie ma, bo `SceneManager` podpina
  `loader.once(COMPLETE, loadComplete)` (`SceneManager.js` `bootScene`). Podmiana (i odpięcie `onload/onerror` obrazka)
  zostaje jako pas bezpieczeństwa przeciw drugiemu `COMPLETE` i późnemu wpisowi do cache — nie przeciw karcie błędu.
- **Timery czyszczone na `COMPLETE`**: oba `delayedCall` (linia, cięcie) usuwane przy zwykłym końcu; linia nie może być
  rysowana po `LoadingScreen.destroy()`.
- **Strażnik `create()`**: licznik `creates` w `bootLoad`; drugi `create()` (nie powinien wystąpić) loguje ostrzeżenie i
  wraca bez drugiego oddania sceny — to pas bezpieczeństwa, dowód „raz” daje e2e (faza 7, późny plik).
- **Odmowa `NewerSave` nie jest porażką do ponowienia**: w `attempt` i `replace` błąd o tej nazwie ustawia
  `blockedBy ??= 'newer'`, zatrzymuje timer i nie uzbraja ponownie; `lastFailure = { stage, error: 'NewerSave' }`.
- **Brak zapisu / zły kształt nie odmawia**: `storedVersionNewer` zwraca `true` tylko dla liczbowej `version` większej od
  zapisywanej; `undefined`, obiekt bez `version`, `version` nieliczbowa, ta sama wersja → `false`.

## Phase 1: Reguła ładowania i liczby

Driver: tdd
Driver why: `bootLoadPhase`/`checkBootLimits` i budżet `balance.loader` to czysta logika bez implementacji — failing testy na granicach ją prowadzą.

### Overview

Rdzeń A-1/A-2 w `src/core`: kiedy linia, kiedy cięcie. Bez zmian widocznych.

### Changes Required:

#### 1. Reguła

**File**: `src/core/bootLoad.ts` (nowy); `tests/bootLoad.test.ts` (nowy)

**Intent**: Czysta decyzja fazy ładowania od upływu czasu i walidacja limitów, żeby scena tylko renderowała.

**Contract**: `export interface BootLimits { slowAfterMs: number; totalMs: number }`;
`export type BootLoadPhase = 'loading' | 'slow' | 'over'`; `bootLoadPhase(elapsedMs, limits)`: `< slowAfterMs` →
`loading`, `[slowAfterMs, totalMs)` → `slow`, `≥ totalMs` → `over`; `checkBootLimits(limits)` rzuca, gdy którakolwiek
liczba nie jest skończoną dodatnią albo `slowAfterMs ≥ totalMs`. Testy: granice (0, slow−1, slow, total−1, total),
ujemny/NaN elapsed → `loading`, złe limity → wyjątek.

#### 2. Liczby

**File**: `src/data/balance.ts` (`loader`); `tests/loaderBalance.test.ts`

**Intent**: `slowAfterMs: 8000`, `totalMs: 45000` z komentarzem z arytmetyką (64 WebP + font ≈ 1,9 MB, przy 50 KB/s
≈ 40 s zimnego pierwszego startu, więcej gdy instalacja SW pobiera równolegle (Known risks, F4); S-16b +13 dźwięków; limit łączny > najgorszy przypadek jednego pliku 24 s, więc jeden
zawieszony plik nadal kończy się po swoim limicie; następny start z cache SW).

**Contract**: nowe przypadki: `checkBootLimits(balance.loader)` nie rzuca; `totalMs` w 30000..60000;
`totalMs > (maxRetries + 1) × timeoutMs`; `slowAfterMs` w 3000..15000.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: granica `slow` z `<` na `<=` → test granicy czerwony; `totalMs: 20000` → test „total > per-file worst case” czerwony; przywrócone; meta-check: testy chronią regułę i relację liczb, a NIE dowodzą, że loader się kończy (to faza 7)
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] `src/core/bootLoad.ts` bez Phasera i globali przeglądarki; liczby tylko w `balance.ts` z komentarzem z arytmetyką

---

## Phase 2: Łączny limit ładowania w `BootScene` (cięcie przez ścieżki loadera)

Driver: impl
Driver why: cięcie to operacja na wnętrzu `LoaderPlugin` Phasera bez czystej logiki do prowadzenia testem; dowód zachowania tylko w przeglądarce (faza 7).

### Overview

A-1 i limit fontu. Widocznie: przy zawieszonych plikach gra startuje po `totalMs` na zastępstwach, „Obrazki” liczą
ucięte pliki jako brakujące.

### Changes Required:

#### 1. Moduł cięcia

**File**: `src/scenes/loaderCut.ts` (nowy)

**Intent**: Jedna funkcja kończąca niedokończone pliki błędem przez ścieżki loadera (sekcja Critical Implementation
Details), z komentarzem nagłówkowym: „relies on Phaser 4.2.1 LoaderPlugin internals (`list`, `inflight`, `queue`,
`nextFile`, `fileProcessComplete`, `File.resetXHR`); re-run e2e #15 `stallall` on any Phaser upgrade”.

**Contract**: `export function cutLoad(load: Loader.LoaderPlugin): string[]` — zwraca klucze uciętych plików; no-op
(`[]`), gdy `!load.isLoading()`. Kod bez rzutowań tam, gdzie typy Phasera są publiczne.

#### 2. `BootScene`

**File**: `src/scenes/BootScene.ts` (`preload`, `create`); `src/data/layout.ts` (`REGISTRY_KEYS.bootLoad`, komentarz
„runtime only, not in SAVE_KEYS”)

**Intent**: W `preload` limity z `checkBootLimits` (z `balance.loader`, albo z rejestru pod szwem `stallall`), timer
cięcia `this.time.delayedCall(totalMs, …)` usuwany na `COMPLETE`; po cięciu jedno `console.warn` z liczbą i kluczami
(`Boot load cut after ${totalMs} ms: N files: …`). W `create()` zapis `bootLoad = { cut, creates }` i strażnik
drugiego `create`.

**Contract**: rejestr `bootLoad: { cut: readonly string[]; creates: number }`; martwa gałąź fontu w `loaderror`
zostaje (A-7 poza zakresem), komentarz bez zmian.

#### 3. Szew `stallall` i odczyt w haku

**File**: `src/testing/e2eHook.ts` (`E2EArtSeam` + `'stallall'`, `e2eArt`, `E2E_BOOT_LIMITS = { slowAfterMs: 500,
totalMs: 3000 }`, gałąź `loading` w getterze `snapshot`, `bootLoad` w migawce powitania i gry); `src/main.ts`
`createGame` (pod `__E2E_HOOK__ && forcedArt === 'stallall'`: `loader: { timeout: 0, maxRetries: 0 }` i
`E2E_BOOT_LIMITS` w rejestrze); `tests/e2e/support/hook.ts` (typ `Snapshot.screen` + `'loading'`, `loading`,
`bootLoad`); `tests/e2eSave.test.ts` (parsowanie `e2eArt`), `tests/e2eHookGuard.test.ts`

**Intent**: Pod szwem tylko limit łączny może zakończyć ładowanie (spec sam wiesza pliki). Hak czyta ekran ładowania,
gdy `BootScene` jest aktywna: `{ screen: 'loading', loading: { phase }, save }` — bez sięgania do `TaskScene`.

**Contract**: `e2eArt('?e2eArt=stallall') === 'stallall'`; `BootScene` traktuje `stallall` jak brak szwu przy
kolejkowaniu; marker `e2eArt` pokrywa wartość (nazwa klucza rejestru nie jest markerem, jak `forcedArt`);
`BootScene.loadPhase(): BootLoadPhase` jako jedyny odczyt dla haka.

#### 4. Tripwire wersji Phasera

**File**: `tests/phaserLoaderPin.test.ts` (nowy)

**Intent**: Test czyta `node_modules/phaser/package.json` i oczekuje `4.2.1` z komunikatem „`src/scenes/loaderCut.ts`
relies on loader internals: re-verify e2e #15 stallall, then update this pin”. To sygnał, nie dowód działania.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (szew, tripwire); `npm run build` drukuje `e2e hook: absent (`; `grep -c E2E_BOOT_LIMITS dist/_app/*.js` = 0
- Deliberate break: tripwire z `4.2.2` → test czerwony; przywrócone; meta-check: chroni tylko wersję — zachowanie cięcia udowadnia e2e fazy 7 (patche `e2e-break-p7a/b`), nie ta faza
- e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`; `salon-load-health.spec.ts` „#15 H-2 …” zielony (limit na plik nienaruszony)

#### Manual Verification:

- [reviewer] Wnętrze loadera dotykane tylko w `src/scenes/loaderCut.ts`; `onProcessComplete` podmieniane przed `fileProcessComplete`; oba timery usuwane na `COMPLETE`; szew tylko pod `__E2E_HOOK__`
- [human] Android (6 równoległych pobrań) z ograniczoną siecią w DevTools: start kończy się najpóźniej po ~45 s na zastępstwach, bez karty błędu

---

## Phase 3: Linia „jeszcze chwilka” na ekranie ładowania

Driver: impl
Driver why: render jednej linii w widgecie Phasera sterowany regułą z fazy 1 — brak nowej logiki do testu; widoczność potwierdza e2e i bramka wizualna.

### Overview

A-2. Widocznie: po 8 s ładowania pod paskiem pojawia się „Jeszcze chwilka, wczytuję obrazki.”

### Changes Required:

#### 1. Tekst, pozycja, luka

**File**: `src/data/pl.ts` (`loading.slow`, komentarz DESIGN-GAP 112); `src/data/layout.ts` (`LOADING_LAYOUT.slow:
{ x: 960, y: 680 }`); `docs/design-gaps.md` (wiersz 112)

**Intent**: Jedna spokojna linia dla dziecka i rodzica bez znaków spoza fontu awaryjnego; pozycja tokenem, żeby S-16c
mógł przestylować ekran.

**Contract**: `pl.loading.slow = 'Jeszcze chwilka, wczytuję obrazki.'`; wiersz 112: „The kit has no line for a slow
start” → „After `slowAfterMs` a line under the bar in the title style …”.

#### 2. Widget i scena

**File**: `src/ui/widgets/LoadingScreen.ts` (`slow()`, `destroy`); `src/scenes/BootScene.ts` (`preload`)

**Intent**: `slow()` rysuje linię raz (idempotentnie); `BootScene` ustawia `delayedCall(slowAfterMs)`, pyta
`bootLoadPhase` i woła `slow()` tylko przy `'slow'`; timer usuwany na `COMPLETE`; błąd rysowania łapany jak przy pasku.

**Contract**: `LoadingScreen.slow(): void`; `BootScene.loadPhase()` zwraca `'slow'` od chwili narysowania linii.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- Deliberate break: `slow` przy `'loading'` zamiast `'slow'` → test `bootLoad` fazy 1 nie zmienia się (oczekiwane: reguła osobno), dowód linii w e2e fazy 7 (patch `e2e-break-p7c`); meta-check zapisany w handoffie

#### Manual Verification:

- [visual] Ekran ładowania pod `?e2eArt=stallall` z wiszącym plikiem (Playwright fallback, 1440 i 1024): linia pod paskiem, czytelna, nie nachodzi na pasek
- [reviewer] Brak tekstu i liczb w scenie/widgecie; DESIGN-GAP 112 w `pl.ts`, `design-gaps.md` i komentarzu widgetu

---

## Phase 4: Powód `'newer'` w autosaverze i widokach

Driver: tdd
Driver why: `storedVersionNewer`, mapowanie `NewerSave` → blokada, `replaceGate`, `offState` i `deviceSaveView` to czysta logika `core` z fałszywym magazynem — failing testy prowadzą.

### Overview

Rdzeń P-5 bez IndexedDB. Widocznie (po fazie 5): „Zapis gry” pokazuje przyczynę `newer`.

### Changes Required:

#### 1. Reguła wersji

**File**: `src/core/save.ts` (`storedVersionNewer`); `tests/save.test.ts`

**Intent**: Jedna czysta funkcja używana przez magazyn IndexedDB i szew e2e.

**Contract**: `export function storedVersionNewer(stored: unknown, version: number): boolean`; `export const
NEWER_SAVE = 'NewerSave'` (nazwa błędu). Testy: `undefined`, `null`, `{}`, `{ version: '4' }`, `{ version: 3 }` przy 3 →
`false`; `{ version: 4 }` przy 3 → `true`; `{ version: 2 }` przy 3 → `false`.

#### 2. Autosaver

**File**: `src/core/autosave.ts` (`BlockReason`, `attempt`, `replace`, `replaceGate`); `tests/autosave.test.ts`

**Intent**: Błąd o nazwie `NewerSave` z `store.write` blokuje dalsze zapisy (`blockedBy ??= 'newer'`), bez ponowienia,
z jednym logiem; `replace` zwraca `{ ok: false, error: 'NewerSave' }` i blokuje tak samo; `replaceGate` dla `'newer'` →
`Blocked` (także z `force`).

**Contract**: `BlockReason = 'unreadable' | 'unavailable' | 'fatal' | 'newer'` (runtime). Testy: fałszywy magazyn
odrzuca `NewerSave` → `status().blockedBy === 'newer'`, `lastFailure { stage: 'write', error: 'NewerSave' }`, kolejne
`markDirty` + `advance` nie wołają `write` (liczone operacje), `skipped` rośnie; `replace` → `NewerSave` i blokada;
`replaceGate({ blockedBy: 'newer' }, true) === 'Blocked'`; inny błąd zapisu nadal ponawiany jak dziś.

#### 3. Widoki i tekst

**File**: `src/core/saveHealth.ts` (`offState`, typ przyczyny); `src/core/saveFile.ts` (`DeviceSaveView`,
`deviceSaveView`); `src/data/pl.ts` (`settings.saveOff.newer`, DESIGN-GAP 113, oraz każdy `Record` po przyczynie, który
typ wymusi w dialogach importu/resetu); `docs/design-gaps.md` (wiersz 113); `tests/saveHealth.test.ts`,
`tests/saveFile.test.ts`

**Intent**: Rodzic czyta przyczynę i kod; dialogi importu/resetu pokazują `blocked` bez wymuszenia.

**Contract**: `offState` dla `'newer'` → `{ kind: 'off', cause: 'newer', code: 'NewerSave' }`; `deviceSaveView` →
`{ kind: 'blocked', cause: 'newer', forceable: false }`; `pl.settings.saveOff.newer = 'Zapis jest wyłączony: nowsza
wersja gry zapisała już postępy na tym urządzeniu. Uruchom grę ponownie.'`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `attempt` bez gałęzi `NewerSave` → test „no further write after NewerSave” czerwony (liczy operacje magazynu); `replaceGate` bez `'newer'` → test z `force` czerwony; przywrócone; meta-check: testy liczą wywołania `write`, nie samo pole statusu
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty; pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] `'newer'` tylko w runtime (`AutosaveStatus`), nigdy w `SaveState`; każdy wyczerpujący `switch`/`Record` po przyczynie zna `'newer'`

---

## Phase 5: Strażnik w magazynie IndexedDB i szew `newer`

Driver: tdd
Driver why: odmowa zapisu przy nowszej wersji w prawdziwym `createIdbSaveStore` jest testowalna na fake-indexeddb (dwa magazyny, jedna baza) — failing test prowadzi.

### Overview

P-5 na prawdziwej ścieżce zapisu. Widocznie: karta/instancja ze starszym formatem nie nadpisuje nowszego zapisu.

### Changes Required:

#### 1. `write` przez `guardedPut` (jedna transakcja)

**File**: `src/storage/idb.ts` (`createIdbSaveStore.write`); `tests/idbStore.test.ts`

**Intent**: `write` = `run(s => s('readwrite', (os) => guardedPut(os, key, value)), () => mine === writeSeq)`; eksportowana
`guardedPut(store: IDBObjectStore, key, value): Promise<void>` działa na surowym magazynie (`UseStore`, `promisifyRequest`
z idb-keyval) w JEDNEJ transakcji: `get(key)`;
przy sukcesie `storedVersionNewer(old, value.version)` → odrzucenie błędem o nazwie `NEWER_SAVE` bez `put`, inaczej
`put(value, key)`; przy **błędzie samego `get`** (rekord nieczytelny: `event.preventDefault()`, żeby transakcja nie
przerwała się) → `put(value, key)` mimo to (wersji nie da się poznać, więc nie ma czego chronić). Nie używać gołego
idb-keyval `update`: jego `req.onerror` odrzuca całość, więc wymuszone „Zastąp mimo to” przy `unavailable` z błędem
odczytu (`replaceGate`: `unavailable` + `force` → `ok`) nigdy by się nie zapisało — ścieżka naprawy z S-12/S-15 by
zginęła (plan-review F1). `NewerSave` nie jest „lost connection”, więc bez ponowienia.

**Contract**: Testy na fake-indexeddb: magazyn B zapisuje `{ version: 4 }`, magazyn A (ta sama baza) zapisuje v3 →
odrzucenie o nazwie `NewerSave`, odczyt zwraca `version 4`; brak zapisu → zapis przechodzi; ta sama wersja → przechodzi;
zapis surowego obiektu bez `version` (uszkodzony) → zapis przechodzi; `backup` bez zmian (osobny klucz). Plus test
`guardedPut` na atrapie `IDBObjectStore`, której `get` kończy się `onerror`: `put` wołany, obietnica spełniona (break:
bez gałęzi błędu `get` → czerwony).

#### 2. Szew `?e2eSave=newer`

**File**: `src/testing/e2eHook.ts` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`, `e2eSaveStore`); `tests/e2eSave.test.ts`

**Intent**: Magazyn w pamięci startuje pusty; po pierwszym udanym zapisie wartość staje się `{ ...next, version:
SAVE_VERSION + 1 }` (symulacja innej karty), a każdy `write` stosuje `storedVersionNewer` i odrzuca `NewerSave`.

**Contract**: `e2eSave('?e2eSave=newer') === 'newer'`; test jednostkowy szwu: write 1 ok, write 2 odrzucony z nazwą
`NewerSave`, `writtenVersion` zostaje `SAVE_VERSION + 1`. Log szwu: po udanym zapisie 1 `writtenVersion` = wersja
podbita (`SAVE_VERSION + 1`, stan „innej karty”), nie `next.version`; odrzucona próba dopisuje op `'write'` (tak jak
`writehang`), więc spec (c) oczekuje dokładnie jednego dodatkowego `'write'` po blokadzie i żadnego dalej.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `write` z powrotem na `set` → test „B v4, A v3 refused” czerwony; przywrócone; meta-check: test używa dwóch niezależnych magazynów na jednej bazie fake-indexeddb, więc dowodzi odczytu w transakcji, a nie pamięci jednego obiektu
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `idb.ts` nadal jedynym importerem idb-keyval; `NewerSave` bez ponowienia w `run`; odczyt w tej samej transakcji co zapis

---

## Phase 6: Dokumentacja i follow-upy

Driver: impl
Driver why: zmiany tylko w tekstach (`CLAUDE.md`, follow-upy) — brak logiki do testu.

### Overview

Zdanie w `CLAUDE.md`, follow-upy z triggerami, zapis decyzji o service workerze.

### Changes Required:

#### 1. `CLAUDE.md`

**File**: `CLAUDE.md` („Current state”)

**Intent**: Jedno zdanie: łączny limit `balance.loader.totalMs` (cięcie w `src/scenes/loaderCut.ts`, Phaser 4.2.1,
tripwire `tests/phaserLoaderPin.test.ts`), linia `pl.loading.slow` po `slowAfterMs`, `REGISTRY_KEYS.bootLoad`, strażnik
`NewerSave` w `src/storage/idb.ts` (`guardedPut`), runtime `blockedBy 'newer'`, szwy `?e2eArt=stallall` i `?e2eSave=newer`,
luki 112-113.

#### 2. Follow-upy

**File**: `context/changes/load-and-tab-guard/follow-ups/review-fixes.md` (nowy)

**Intent**: Każdy wpis z `Trigger:`: A-3..A-11, V-*, P-1..P-4, P-6, P-7 (audyt 2026-10-15_2217, opis jednym zdaniem,
trigger wg audytu); P-8 (`backup-v2` nadpisane przy ponownej migracji, trigger „a parent report of lost progress, or
v4”); karta dla dziecka przy `'newer'` (trigger „a parent report of lost progress with two tabs or an old home-screen
instance”); kolejność dwóch kart tej samej wersji (trigger „the same report, or v4”); `loaderror` dla plików z kolejki
(trigger „A-7 taken up”); WebKit dla cięcia (trigger „a WebKit project in playwright.config.ts”); Phaser upgrade
(trigger „any change of node_modules/phaser version”); „font promise hand-over in `BootScene.create`” zapisane jako
zamknięte.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break: ścieżka w `CLAUDE.md` na nieistniejący plik → FAIL; przywrócone
- Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:` (`grep -c` wpisów = `grep -c 'Trigger:'`); pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Seam sweep: nazwy w `CLAUDE.md` istnieją w kodzie; brak zmian w `vite/config.shared.mjs` i `deploy/`

---

## Phase 7: Zawieszone pliki i font nie blokują startu, nowszy zapis nie jest nadpisany — e2e (#15, #2)

Driver: e2e
Driver why: ryzyko #15 (zamrożony ekran bez słowa: ładowanie bez końca) i #2 (postęp ginie: starsza instancja nadpisuje nowszy zapis) istnieją tylko w przeglądarce, a cięcie opiera się na wnętrzu loadera Phasera, którego żaden test jednostkowy nie dowodzi; zbudowane w fazach 2–5.

### Overview

Nowy spec `tests/e2e/load-and-tab-guard.spec.ts` w projekcie `chromium-hook` (`load-and-tab-guard` dopisane do
`ROUND_SPEC` w `playwright.config.ts`). To jest **dowód przeglądarkowy** każdego mechanizmu z faz 2–3 (cięcie
`list`/`inflight`, cięcie `queue` z fontem, jeden `create`, linia) i fazy 5 (szew w pamięci; prawdziwa ścieżka
IndexedDB jest dowodzona testem fake-indexeddb, bo kontrakt zabrania otwierania IDB z testu).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/load-and-tab-guard.spec.ts` (nowy); `playwright.config.ts` (`ROUND_SPEC`);
`tests/e2e/support/hook.ts` (jeśli faza 2 nie dodała wszystkich pól)

**Intent**:
(a) „#15 A-1/A-2 many hanging pictures and the font end the loading at the total limit, with the slow line”:
`test.use({ serviceWorkers: 'block' })`; trzymane bez odpowiedzi: `**/assets/tasks/money/*.webp` (pobieranie),
`**/fonts/*.ttf` (kolejka `FontFace`), jeden plik pokoju trzymany w zmiennej do późniejszego zwolnienia; `?e2eArt=stallall
&e2eVariant=off`; przed powitaniem `snapshot.screen === 'loading'` i `loading.phase === 'slow'`; potem `screen 'welcome'`
w limicie testu (cięcie 3 s); `artHealth.missing ≥` liczba plików pieniędzy; `bootLoad.cut` zawiera klucz fontu i plik
pokoju; brak karty błędu (`page.getByRole` karty błędu niewidoczna) przez kolejne ~1 s.
(b) „#15 A-1 a file that answers after the cut does not start the game twice”: w tym samym teście albo osobnym — po
powitaniu zwolnić trzymany **font** (`route.continue()` → późne rozstrzygnięcie `FontFace`, jedyne zdarzenie, które po
cięciu naprawdę dociera do loadera) oraz trzymany plik pokoju (`route.continue().catch(() => undefined)` — jego XHR
został przerwany, więc to tylko dowód, że późna odpowiedź niczego nie rusza), odczekać, `bootLoad.creates === 1`,
`screen` nadal `'welcome'`, brak karty błędu. (plan-review F2)
(c) „#2 P-5 a newer save written by another tab is not overwritten”: `?e2eSave=newer&e2eVariant=off`, `passWelcome`, jedno
zadanie z odpowiedzią (zmiana stanu) → `save.blockedBy === 'newer'`, `save.store.writtenVersion === SAVE_VERSION + 1`,
operacji `write` przybywa najwyżej o odrzuconą próbę; `openSettings` → sekcja „Zapis gry” zawiera dokładny tekst
`pl.settings.saveOff.newer`.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty po kluczach `pl` (dokładne napisy);
stan z haka tylko do odczytu; nowy kontekst = świeże urządzenie; nigdy IDB z testu; obraz ładowany przez `blob:` —
klasyfikacja odpowiedzi najpierw po schemacie URL. **Chromium niedostępny w sesji agenta**: protokół request-file —
`e2e-request-p7.md`, patche (tylko kod produkcyjny): `e2e-break-p7a.patch` (`cutLoad` zwraca `[]` bez cięcia → (a)
czerwony: brak powitania), `e2e-break-p7b.patch` (bez podmiany `onProcessComplete` w `queue`; **oczekiwany wynik: zielony** — wg
Critical Implementation Details późny font nie rzuca, a drugi `create` blokuje `once` Phasera; zapisać meta-check, że p7b
nie jest dowodem i że (b) zielone przy patchu potwierdza nieszkodliwość; czerwony wynik = analiza błędna, zatrzymać się), `e2e-break-p7c.patch` (`BootScene` bez `delayedCall` linii → (a) czerwony na
`phase 'slow'`), `e2e-break-p7d.patch` (`write` szwu bez `storedVersionNewer` → (c) czerwony na `writtenVersion`);
`STATUS: BLOCKED — e2e needs orchestrator run (request file written)`; agent kończący commituje spec po wyniku
orkiestratora. Każdy oczekiwany czerwony test osobno (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + N` (N = liczba testów specu)
- Deliberate break p7a (`cutLoad` bez cięcia) → (a) czerwony; przywrócone; meta-check: pliki naprawdę wiszą (SW zablokowany, limit na plik wyłączony), więc tylko limit łączny kończy ładowanie
- Deliberate break p7b (bez no-op `onProcessComplete`) → oczekiwany zielony z udokumentowanym meta-checkiem (plan-review F2)
- Deliberate break p7c (bez linii) → (a) czerwony na `phase 'slow'`
- Deliberate break p7d (szew bez strażnika) → (c) czerwony; meta-check: szew dzieli `storedVersionNewer` z `idb.ts`, prawdziwą transakcję dowodzi faza 5
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual Verification:

- [human] iPad (WebKit) z zawieszonym plikiem/fontem (Web Inspector): start po ~45 s na zastępstwach, linia po ~8 s, bez karty błędu

---

## Testing Strategy

### Unit Tests:

- `bootLoadPhase`/`checkBootLimits` granice; `balance.loader` relacje (total > najgorszy przypadek pliku, slow < total).
- `storedVersionNewer`; autosaver: `NewerSave` → blokada bez ponowienia (liczone operacje), `replace`, `replaceGate`;
  `offState`, `deviceSaveView` z `'newer'`.
- `createIdbSaveStore` na fake-indexeddb: dwa magazyny jednej bazy; szwy `stallall`, `newer`; strażnik haka; tripwire
  wersji Phasera.

### Integration Tests:

- `npm run build` (strażnik szwów); e2e fazy 7 (trzy scenariusze, cztery patche łamiące); istniejący
  `salon-load-health.spec.ts` zielony w każdej fazie.

### Manual Testing Steps:

1. [visual] Linia „Jeszcze chwilka, wczytuję obrazki.” pod paskiem (faza 3).
2. [human] Android z ograniczoną siecią: start ≤ ~45 s (faza 2).
3. [human] iPad (WebKit): cięcie i linia (faza 7).

## Performance Considerations

Jeden `get` zapisu (dziesiątki KB) w tej samej transakcji przy każdym zapisie (debounce 500 ms + `flush`), w limicie
`writeTimeoutMs`. Limit łączny nie dotyka zdrowego startu (z cache SW kończy się w sekundach); na wolnej sieci pierwszy
start trwa najwyżej ~45 s zamiast minut, kosztem zastępstw do następnego startu.

## Migration Notes

Brak zmiany formatu (v3). Strażnik chroni zapis od tego buildu: build v3 bez strażnika (S-16a..main) nadal może
nadpisać nowszy zapis, a karta z buildu v2 (S-15..) może nadpisać v3 — tego okna kod nie zamknie.

## Known risks

- **Wnętrze loadera Phasera**: `cutLoad` opiera się na polach 4.2.1; `package.json` ma `^4.2.1`, więc `npm install` może
  podnieść wersję — tripwire w unit + e2e #15 jako dowód.
- **Font ucięty**: teksty narysowane przed późnym `document.fonts.add` zostają w foncie awaryjnym do ponownego narysowania.
- **Ukryta karta przy starcie**: zegar pętli stoi z ramką animacji, więc start w tle nie jest cięty (świadomie: żadne nowe
  pobranie nie rusza w tle).
- **Strażnik tylko od tego buildu** (wyżej); ta sama wersja w dwóch kartach — follow-up.
- **`guardedPut` a utracone połączenie iOS**: ścieżka `run` ponawia `guardedPut` jak `set`; nie sprawdzone na iPadzie — `[human]`
  przez istniejącą listę kontrolną (follow-up WebKit).
- **Chromium w sesji agenta**: faza 7 w protokole request-file; zrzut fazy 3 przez fallback Playwright.
- **Pierwszy start konkuruje z precache (plan-review F4)**: `registerServiceWorker` rejestruje SW na `window` `load`,
  który nie czeka na XHR Phasera, więc instalacja SW pobiera cały build (JS + WebP + font) równolegle z ładowaniem
  `BootScene` — przy 50 KB/s pasmo dzieli się na dwa i zimny start może przekroczyć 45 s, choć sieć działa. Skutek
  ograniczony do tej sesji: cięcie przerywa tylko XHR strony; precache biegnie w kontekście SW niezależnie i następny
  start czyta z cache. Gdy serwer milczy, instalacja SW też wisi (Workbox bez limitu) i następny start znowu pobiera z
  sieci — zachowanie sprzed tej zmiany. Komentarz `balance.loader` (faza 1) ma wspomnieć tę konkurencję.
- **Ścieżka cięcia nie ma czerwonego e2e dla podmiany `onProcessComplete`** (F2): to pas bezpieczeństwa, p7b oczekiwany
  zielony.

## References

- Research: `context/changes/load-and-tab-guard/research.md`; change: `context/changes/load-and-tab-guard/change.md`
- Audyt obserwowalności 2026-10-15_2217 (PR #66): A-1, A-2, P-5 (A-7 częściowo: limit fontu)
- Kontrakt runu `context/runs/2026-10-15-fix-s16bcd/agent-contract.md` („fix load-and-tab-guard”); profil `context/foundation/autonomous-run.md` § 2, § 8, § 9
- Test-plan `context/foundation/test-plan.md` ryzyka #2, #15; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-15-salon-load-health/plan.md` (per-file limit, `?e2eArt=stall`, lekcja no-op konfiguracji), `context/archive/2026-10-15-save-v2-backup-health/` (runtime status, `withTimeLimit`), `pl.saveSlow` / `cardCopyFor`
- Phaser 4.2.1: `node_modules/phaser/src/loader/LoaderPlugin.js` (`nextFile`, `fileProcessComplete`, `reset`), `loader/File.js` (`resetXHR`, `onError`), `loader/filetypes/FontFile.js` (`onProcess`), `loader/filetypes/ImageFile.js` (`onProcess`); idb-keyval 6.3.0 `update`

## Autonomous decisions

1. **Cięcie przez wymuszone niepowodzenie (`nextFile(f,false)` / `fileProcessComplete`)**, nie `reset()` ani zatrzymanie
   sceny. Dlaczego: jedyna droga z jednym `create()` i liczeniem `artHealth` (research §2). Co zmieniłoby: publiczny abort
   w wydaniu Phasera.
2. **`totalMs` 45 000, `slowAfterMs` 8 000.** Odrzucone: 30 s (zimny pierwszy start na 50 KB/s ≈ 40 s byłby cięty bez
   potrzeby), 60 s (dziecko czeka minutę). Linia po 8 s: pasek, który nie drgnął przez kilka sekund, wygląda na zawieszony;
   na zdrowym starcie z cache linia się nie pojawia. Co zmieniłoby: pomiar na tablecie albo dźwięki S-16b większe niż
   ~0,9 MB.
3. **Zegar pętli gry (`this.time`)**, nie `window.setTimeout`. Dlaczego: w ukrytej karcie loader i tak nie rusza nowych
   pobrań; ciąć ich nie ma sensu. Co zmieniłoby: wymóg, by start w tle kończył się w czasie ściennym.
4. **Bez karty dla dziecka przy `'newer'`** — tylko linia rodzica w „Zapis gry” i log. Odrzucone: karta „Uruchom ponownie”
   w środku rundy (nowy UI bez wzoru w kicie, przerywa dziecko w rzadkiej sytuacji dwóch instancji naraz). Zgodne z PRD
   „Zero frustracji”; zapis nowszej instancji jest bezpieczny. Co zmieniłoby: raport rodzica o utraconym postępie przy dwóch
   kartach (follow-up z tym triggerem).
5. **Osobny runtime `BlockReason 'newer'`**, nie `'future'` (sugestia audytu). Dlaczego: `future` to powód odczytu ze
   startową kartą i `loadReason`; `'newer'` pojawia się w trakcie gry. Co zmieniłoby: plan-review wykazujący, że ponowne
   użycie upraszcza bez błędu w konsumentach.
6. **`skipWaiting`/`clientsClaim` bez zmian.** Dlaczego: usunięcie opóźnia aktualizacje wznowionego PWA (PRD FR-003) i nie
   zamyka okna dla już wydanych buildów; dane chroni strażnik. Co zmieniłoby: opiekun wolący „bez mieszanych buildów”.
7. **Pliki z kolejki (dekodowanie, font) ucięte bez `loaderror`**; zamiast tego jedna linia logu z kluczami wszystkich
   uciętych. Dlaczego: sztuczne zdarzenie pomyliłoby A-7 (przyczyna per plik). Co zmieniłoby: podjęcie A-7.
8. **Kopie tekstów**: `pl.loading.slow = 'Jeszcze chwilka, wczytuję obrazki.'` (bez wielokropka — font awaryjny przed
   wczytaniem fontu zadań, por. luka 99), `saveOff.newer` jak w fazie 4; luki 112 i 113. Co zmieniłoby: tekst od autorki.
9. **Strażnik w jednej transakcji w magazynie (`guardedPut`, plan-review F1 zamiast gołego `update`)**, nie osobny `read()` przed `write()`. Co zmieniłoby: transakcja źle
   zachowująca się po utracie połączenia iOS.
10. **Tripwire wersji Phasera w unit + e2e jako dowód**, bez przypinania wersji w `package.json`. Dlaczego: zmiana
    zależności jest poza zakresem; tripwire wymusza świadome przejście. Co zmieniłoby: decyzja opiekuna o dokładnym pinie.
11. **Fazy 1, 4, 5 `tdd`; 2, 3, 6 `impl`; 7 `e2e`.** Dlaczego: kontrakt (małe fazy, czysta logika test-first, e2e po
    zbudowaniu, ryzyka #2 i #15). Brak decyzji `[human]` sprzecznych z PRD; `[human]` tylko jako ręczne sprawdzenia
    urządzeń (2.5, 7.7).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Reguła ładowania i liczby

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — 0c31db4
- [x] 1.2 Deliberate break: granica `slow` / `totalMs: 20000` → odpowiednie testy czerwone; przywrócone; meta-check (reguła, nie dowód loadera) — 0c31db4
- [x] 1.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (` — 79023af (e2e per orchestrator note: 101 passed)

#### Manual

- [ ] 1.4 [reviewer] `src/core/bootLoad.ts` bez Phasera i globali; liczby tylko w `balance.ts` z arytmetyką

### Phase 2: Łączny limit ładowania w `BootScene` (cięcie przez ścieżki loadera)

#### Automated

- [x] 2.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `npm run build` drukuje `e2e hook: absent (`; `E2E_BOOT_LIMITS` nieobecne w `dist/` — 79023af
- [x] 2.2 Deliberate break: tripwire z `4.2.2` → czerwony; przywrócone; meta-check (dowód zachowania w fazie 7) — 79023af
- [x] 2.3 e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`; `salon-load-health.spec.ts` „#15 H-2 …” zielony — orchestrator note: 101 passed after 79023af

#### Manual

- [ ] 2.4 [reviewer] Wnętrze loadera tylko w `loaderCut.ts`; `onProcessComplete` przed `fileProcessComplete`; timery usuwane na `COMPLETE`; szew pod `__E2E_HOOK__`
- [ ] 2.5 [human] Android z ograniczoną siecią: start ≤ ~45 s na zastępstwach, bez karty błędu

### Phase 3: Linia „jeszcze chwilka” na ekranie ładowania

#### Automated

- [x] 3.1 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — orchestrator e2e 101 passed after p4 (note), p3 1347887
- [x] 3.2 Deliberate break: linia przy `'loading'` — meta-check w handoffie (dowód linii: patch `e2e-break-p7c`) — 06b20bb

#### Manual

- [ ] 3.3 [visual] Ekran ładowania pod `?e2eArt=stallall`: linia pod paskiem, 1440 i 1024
- [ ] 3.4 [reviewer] Brak tekstu i liczb w scenie/widgecie; DESIGN-GAP 112 w trzech miejscach

### Phase 4: Powód `'newer'` w autosaverze i widokach

#### Automated

- [x] 4.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 1347887
- [x] 4.2 Deliberate break: `attempt` bez `NewerSave` / `replaceGate` bez `'newer'` → czerwone; przywrócone; meta-check (liczone operacje) — 1347887
- [x] 4.3 `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty; pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (` — orchestrator e2e 101 passed (note)

#### Manual

- [ ] 4.4 [reviewer] `'newer'` tylko w runtime; każdy wyczerpujący `switch`/`Record` po przyczynie zna `'newer'`

### Phase 5: Strażnik w magazynie IndexedDB i szew `newer`

#### Automated

- [x] 5.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 731bcb0
- [x] 5.2 Deliberate break: `write` na `set` → test „B v4, A v3 refused” czerwony; przywrócone; meta-check (dwa magazyny, jedna baza) — 731bcb0
- [ ] 5.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.4 [reviewer] `idb.ts` jedynym importerem idb-keyval; `NewerSave` bez ponowienia; odczyt w transakcji zapisu

### Phase 6: Dokumentacja i follow-upy

#### Automated

- [ ] 6.1 `validate-rule-files.sh` PASS; deliberate break w `CLAUDE.md` → FAIL; przywrócone
- [ ] 6.2 Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:`; pełna bramka lokalna zielona

#### Manual

- [ ] 6.3 [reviewer] Seam sweep: nazwy w `CLAUDE.md` istnieją; brak zmian w `vite/config.shared.mjs` i `deploy/`

### Phase 7: Zawieszone pliki i font nie blokują startu, nowszy zapis nie jest nadpisany — e2e (#15, #2)

#### Automated

- [ ] 7.1 `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` zielone; pełne `--workers=4`: `<baseline gałęzi e2e> + N`
- [ ] 7.2 Deliberate break p7a (`cutLoad` bez cięcia) → (a) czerwony; przywrócone; meta-check
- [ ] 7.3 Deliberate break p7b (bez no-op `onProcessComplete`) → oczekiwany zielony z udokumentowanym meta-checkiem
- [ ] 7.4 Deliberate break p7c (bez linii) → (a) czerwony na `phase 'slow'`
- [ ] 7.5 Deliberate break p7d (szew bez strażnika) → (c) czerwony; meta-check
- [ ] 7.6 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual

- [ ] 7.7 [human] iPad (WebKit): cięcie po ~45 s, linia po ~8 s, bez karty błędu
