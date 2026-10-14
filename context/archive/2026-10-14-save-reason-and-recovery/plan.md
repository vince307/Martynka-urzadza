# Powód nieudanego odczytu zapisu do końca ścieżki, wyjście z trwałego „unavailable” i uczciwa kopia — Implementation Plan

## Overview

Poprawka spoza roadmapy po audycie obserwowalności 2026-10-14_1110 (PR #45): SIR-01, SIR-02, SIR-03 (= N-7, S12-10),
SIR-04 (= S12-04), ASL-01, plus tanie dodatki dotykające tych samych symboli: SIR-05 (log odmowy `replace`), SIR-06
(tekst dla `fatal`) i S12-06 (osobny tekst porażki resetu). Skutki dla rodzica:

1. Zapis z **nowszej wersji gry** (`future`) jest zdrowy i nigdy nie zostaje nadpisany importem ani resetem: `core`
   odmawia, dialogi mówią „zapis z nowszej wersji gry — zaktualizuj grę”. Warunek to `reason === 'future'`, nie numer
   wersji, więc build v2 (S-15) czytający zapis v3 zachowa się tak samo.
2. Trwałe `unavailable` (odczyt odrzucony, nie `timeout`) ma wyjście w aplikacji: drugie potwierdzenie „Zastąp mimo to”
   w imporcie i resecie, a gdy wymuszony zapis też się nie uda — nazwana rada „usuń dane tej strony”. `timeout` (może
   być zdrowy, powolny zapis) i `future` zostają odmówione.
3. Sekcja „Zapis gry” pokazuje kod (`Kod: … · Wersja …`) przy `off`, osobne zdania dla `future` i `timeout`; karta
   `unavailable` dostaje linię `detail` jak karta `unreadable`.
4. „Zapisz kopię” w panelu, gdy zapisu z urządzenia nie wczytano, ostrzega, że kopia zawiera tylko obecną grę.
5. Test źródła (AST) pilnuje, że `TaskScene.freshRound` przekazuje brakujące obrazki do `buildAdaptiveRound` i `buildWarmup`.

## Current State Analysis

(Za `research.md`; kod potwierdzony w tym kroku na `8009d73`.)

- `src/core/autosave.ts`: `LoadOutcome.unreadable.reason: 'corrupt' | 'future' | 'unknown-version'`; `BlockReason =
  'unreadable' | 'unavailable' | 'fatal'`; `AutosaverOptions` ma `loadError?`, bez powodu; `AutosaveStatus.load` to
  tylko `kind`; `lastError` startuje z `loadError` i zmienia się po porażce zapisu. `replace` odmawia `'Blocked'` przy
  `fatal`/`unavailable` bez logu (SIR-05); `unreadable` (w tym `future`) nadpisuje.
- `src/core/saveFile.ts` `deviceSaveView(blockedBy, current, rooms)`: `unreadable` → `{ kind: 'unreadable' }`, inne →
  `{ kind: 'blocked', cause: 'unavailable' | 'fatal' }`. Dialogi (`saveImportDialog.ts` `blockedStep`,
  `saveResetDialog.ts` gałąź `blocked`) dla każdej przyczyny rysują jedno zdanie `pl.saveTransfer.deviceUnavailable`
  („…Uruchom grę ponownie i spróbuj jeszcze raz.”) i tylko „Zamknij”.
- `src/main.ts` `start`: `createAutosaver({ blockedBy: outcome.kind, loadError })` — bez powodu; karta dostaje
  `detail` tylko, gdy `reason !== null` (czyli bez `unavailable`).
- `src/core/saveHealth.ts` `stateOf` → `{ kind: 'off', cause }` bez błędu; `src/ui/dom/saveHealthView.ts` rysuje tylko
  `pl.settings.saveOff[cause]` (to samo zdanie dla `timeout` i odrzuconego odczytu).
- `src/scenes/UIScene.ts` `openExport` eksportuje `saver.current()` bez spojrzenia na `blockedBy`; `openImport`/
  `openReset` wołają `deviceSaveView(saver.status().blockedBy, …)` (sprawdza to `tests/deviceSaveWiring.test.ts`
  literalnie: `toContain('saver.status().blockedBy')`).
- Szwy e2e (`src/testing/e2eHook.ts` `E2ESaveSeam`, `e2eSaveStore`): `unreadable` = `{ version: 99, … }` (czyli
  **`future`**); `unavailable` odrzuca odczyt, a zapisy przyjmuje; `hang` nigdy nie odpowiada (→ `timeout`).
  `tests/e2e/save-transfer-blocked.spec.ts` „#2 an unreadable save warns instead of showing the fresh session” oczekuje
  dozwolonego resetu/importu pod `?e2eSave=unreadable` — SIR-01 to odwraca.
- `TaskScene.freshRound`: `missingIds` z `REGISTRY_KEYS.artHealth` do `buildAdaptiveRound(…, { missingIds, unlockShare })`
  i `blocked` do `buildWarmup(…)`; parametry są opcjonalne, więc ich zgubienie przechodzi typecheck; ścieżka
  `forcedSkills` (e2e) wraca wcześniej, więc e2e tego nie złapie (ASL-01).
- `context/foundation/lessons.md` nie istnieje.

## Desired End State

- `AutosaveStatus` ma pola runtime `loadReason: 'corrupt' | 'future' | 'unknown-version' | null` i `loadError: string |
  null` (niezmienne od startu; `lastError` dalej śledzi ostatni błąd). Nic z tego nie trafia do `SaveState`/`SAVE_KEYS`;
  `SAVE_VERSION` 1, fixtury v1 nietknięte.
- `replace(state, { force? })`: `fatal` → `Blocked`; `future` → `Blocked` zawsze; `unavailable` z `loadError ===
  'timeout'` → `Blocked` zawsze; `unavailable` bez `force` → `Blocked`; `unavailable` z `force` → zapis; każda odmowa i
  każdy udany `replace` przy zablokowanym zapisie zostawia jedną linię `log` (SIR-05).
- `deviceSaveView(status, current, rooms)` → `blocked` z `cause: 'future' | 'timeout' | 'unavailable' | 'fatal'` i
  `forceable` (prawda tylko dla `unavailable`); test lockstep: `forceable` ⇔ `replace(…, { force: true })` pisze.
- Dialogi importu i resetu: tekst per przyczyna; przy `forceable` przycisk „Zastąp mimo to”, który otwiera zwykły krok
  (wybór pliku / potwierdzenie resetu) z ostrzeżeniem, a `apply` idzie z `force`; porażka wymuszonego zapisu → rada o
  danych strony. Reset ma własny tekst porażki (S12-06).
- „Zapis gry”: zdanie per przyczyna (`unreadable`, `future`, `unavailable`, `timeout`, `fatal`) i linia kodu; karta
  `unavailable` z `detail`.
- Eksport z panelu przy niewczytanym zapisie urządzenia pokazuje linię ostrzeżenia.
- Szew `?e2eSave=corrupt` (bez nowego markera); istniejący test „warns” przeniesiony na `corrupt`; nowe e2e #2 dla
  `future`, drugiego potwierdzenia, `timeout`, eksportu i linii kodu.
- `tests/freshRoundWiring.test.ts` (AST) czerwony, gdy `freshRound` zgubi `missingIds` lub `blocked`.
- DESIGN-GAP 69–72, follow-upy z konkretnymi `Trigger:`, jedno zdanie w `CLAUDE.md`.

### Key Discoveries:

- `decodeSave` daje `future` dla każdej `version > SAVE_VERSION` — warunek `reason === 'future'` przenosi się na v2 bez zmian kodu.
- Szew `unavailable` = przypadek audytu „odczyt odrzuca, zapis działa”: wymuszony `replace` się uda, więc e2e udowodni wyjście SIR-02.
- `tests/deviceSaveWiring.test.ts` sprawdza tekst `saver.status().blockedBy` — zmiana sygnatury `deviceSaveView` musi zmienić ten test w tej samej fazie.
- `save-restart.spec.ts` „#2 C-1” używa `section.getByText(pl.settings.saveOff.unavailable)` (podciąg) — dodatkowa linia kodu jest bezpieczna, zdanie `unavailable` musi zostać.
- `parseImport` ignoruje nieznane klucze koperty — oznaczanie koperty byłoby zgodne wstecz, ale niewidoczne dla rodzica (odrzucone, decyzja 5).

## What We're NOT Doing

- Zmiana formatu zapisu (v2 należy do S-15), fixtur, `SAVE_KEYS`; licznik startów `unavailable` w `localStorage`
  (decyzja 2); przycisk `deleteDatabase` w aplikacji.
- Wyjście z `future` inne niż aktualizacja gry i „Zachowaj kopię” na karcie startowej (zapis jest zdrowy).
- Pomiar zimnego IDB na iPadzie i zmiana `balance.save.loadTimeoutMs` (N-7) — `[human]` 5.8.
- Osobny tekst ciała karty dla `timeout` (karta dostaje kod `timeout`; zdanie „przeglądarka nie udostępniła” zostaje na
  karcie) — follow-up.
- SIR-07 jako zmiana archiwum (archiwum nieedytowane; nowe triggery w follow-upach tej zmiany), S12-02, S12-03, S12-05,
  S12-07..09, S12-11..15, ASL-02..09 — follow-upy z `Trigger:` (faza 5).
- Import z ekranu powitalnego (trigger nie wystrzelił), oznaczanie koperty eksportu.

## Implementation Approach

Najpierw czysta logika w `core` test-first (fazy 1–2), potem widoczne zmiany po jednym obszarze na fazę (3: SIR-01 i
szew `corrupt`, 4: SIR-02, 5: SIR-04 + ASL-01 + seam sweep), na końcu e2e (6) w protokole request-file. Fazy 1–2 nie
zmieniają tego, co widzi przeglądarka w istniejących e2e: `main.ts` zaczyna przekazywać `loadReason` dopiero w fazie 3,
która jednocześnie przenosi test „warns” na szew `corrupt` — każda faza zostaje zielona w pełnym e2e.

## Critical Implementation Details

- **Jedna reguła dla UI i `core`**: `deviceSaveView(…).forceable` i warunek w `replace` muszą być tym samym predykatem
  (np. eksportowana czysta funkcja `replaceGate(status, force)` → `'ok' | 'Blocked'` użyta przez obie). Test lockstep
  iteruje po każdej kombinacji `blockedBy × loadReason × loadError × force`.
- **`loadError` niezmienny**: decyzje `timeout` czytają `loadError` (stan startu), nigdy `lastError` (zmienia się po
  porażce wymuszonego zapisu; inaczej druga próba po `timeout` mogłaby przejść).
- **Wymuszony zapis**: po udanym `replace` dialog wywołuje `reload()` jak dziś; szew `unavailable` w e2e znów odrzuci
  odczyt po przeładowaniu, więc e2e dowodzi przejścia przez brak `applyFailed` i ponowną kartę, nie przez stan po reloadzie.
- **Klucze tekstów**: `pl.saveTransfer.deviceUnavailable` zostaje kluczem przyczyny `unavailable` (zmienia się jego treść
  w fazie 4), nowe klucze obok — istniejące spec'e odwołują się do klucza, nie do treści.

## Phase 1: Powód odczytu w statusie autosavera, bramka `replace` i `deviceSaveView` per przyczyna

Driver: tdd
Driver why: nowa bramka `replace` (`future`, `timeout`, `force`) i przyczyny w `deviceSaveView` to czysta logika `core` z wyliczalnymi przypadkami — failing testy prowadzą implementację.

### Overview

`core` zna powód odczytu i decyduje, kiedy nadpisanie jest dozwolone; nic nie zmienia się w przeglądarce, bo `main.ts`
jeszcze nie przekazuje `loadReason`, a dialogi renderują `blocked` jak dziś.

### Changes Required:

#### 1. Status i opcje autosavera

**File**: `src/core/autosave.ts` (`AutosaverOptions`, `AutosaveStatus`, `createAutosaver`, `replace`); `tests/autosave.test.ts`

**Intent**: Powód odczytu i błąd startu jako stan runtime; `replace` odmawia nadpisania zapisu `future` i odczytu, który
przekroczył limit, a zwykłe `unavailable` przepuszcza tylko z jawnym `force`. Każda odmowa i każdy udany `replace` przy
zablokowanym zapisie zostawia jedną linię `log` (SIR-05).

**Contract**: `AutosaverOptions.loadReason?: 'corrupt' | 'future' | 'unknown-version'`; `AutosaveStatus.loadReason:
… | null`, `AutosaveStatus.loadError: string | null` (z `options.loadError`, nigdy nie zmieniany);
`replace(state: SaveState, options?: { force?: boolean }): Promise<ReplaceResult>`; nowa eksportowana czysta
`replaceGate(status: Pick<AutosaveStatus, 'blockedBy' | 'loadReason' | 'loadError'>, force: boolean): 'ok' | 'Blocked'`
— `fatal` → Blocked; `unreadable` + `future` → Blocked; `unreadable` inne → ok; `unavailable` + `loadError === 'timeout'`
→ Blocked; `unavailable` → `force ? 'ok' : 'Blocked'`; `null` → ok. Kolejność w `replace`: `Busy` przed bramką (jak dziś).
Testy: każda gałąź liczy zapisy magazynu (zero po odmowie), `status.replace` bez zmian po odmowie, `log` wołany z
przyczyną; `loadError` nie zmienia się po porażce zapisu.

#### 2. Widok zapisu na urządzeniu per przyczyna

**File**: `src/core/saveFile.ts` (`DeviceSaveView`, `deviceSaveView`); `tests/saveFile.test.ts`; `src/scenes/UIScene.ts`
(`openImport`, `openReset` — tylko argument wywołania); `tests/deviceSaveWiring.test.ts`

**Intent**: Dialog dostaje przyczynę i informację, czy wolno zaproponować drugie potwierdzenie — z tej samej reguły co `replace`.

**Contract**: `deviceSaveView(status: Pick<AutosaveStatus, 'blockedBy' | 'loadReason' | 'loadError'>, current, rooms)`;
`DeviceSaveView.blocked = { kind: 'blocked'; cause: 'future' | 'timeout' | 'unavailable' | 'fatal'; forceable: boolean }`
(`forceable` = `replaceGate(status, true) === 'ok'`); `unreadable` (corrupt, unknown-version) bez zmian; `future` →
`blocked`/`future`; `unavailable` + `timeout` → `blocked`/`timeout`. Wywołania w `UIScene`: `deviceSaveView(saver.status(), …)`;
test okablowania zmieniony na `saver.status()` (meta: nadal dowodzi, że widok pochodzi z savera, nie z `decodeSave`).
Test lockstep (w `tests/saveFile.test.ts`): dla każdej kombinacji `forceable` ⇔ `replace(…, { force: true })` zapisuje.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `replaceGate` przepuszcza `future` → testy `replace` i lockstep czerwone; `timeout` czytany z `lastError` zamiast `loadError` → test „porażka zapisu nie odblokowuje timeout” czerwony; przywrócone; meta-check: testy liczą zapisy magazynu, nie tylko `ok`
- `tests/fixtures/save-v1*.json` bez zmian; `SAVE_VERSION` 1; `tests/saveKeys.test.ts` zielony
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `loadReason`/`loadError` tylko w statusie runtime (nie w `SaveState`/`encodeSave`); `UIScene` zmienione tylko w argumentach `deviceSaveView`; jedna reguła (`replaceGate`) dla widoku i `replace`

---

## Phase 2: „Zapis gry” z przyczyną i kodem, `detail` na karcie `unavailable`

Driver: tdd
Driver why: `stateOf` z przyczynami `future`/`timeout` i kodem to czysta funkcja `core` — failing testy prowadzą; zmiana DOM to jedna linia w istniejącym widoku.

### Overview

Rodzic widzi, dlaczego zapis jest wyłączony, i kod, który może podać (SIR-03 = N-7, S12-10).

### Changes Required:

#### 1. Stan zdrowia zapisu

**File**: `src/core/saveHealth.ts` (`SaveHealthState`, `stateOf`); `tests/saveHealth.test.ts`

**Intent**: `off` niesie przyczynę widzianą przez rodzica i kod; przyczyny `future` i `timeout` są wyodrębnione z `unreadable`/`unavailable`.

**Contract**: `SaveHealthState.off = { kind: 'off'; cause: 'unreadable' | 'future' | 'unavailable' | 'timeout' | 'fatal'; code: string | null }`;
`cause`: `unreadable` + `loadReason === 'future'` → `future`; `unavailable` + `loadError === 'timeout'` → `timeout`;
`code` = `loadReason` dla `unreadable`/`future`, `loadError` dla `unavailable`/`timeout`, `lastError` dla `fatal`
(może być `null`). Istniejący test „every block reason is off with that cause…” rozszerzony o `code`.

#### 2. Linia w sekcji i karta

**File**: `src/ui/dom/saveHealthView.ts` `createSaveHealthView`; `src/data/pl.ts` (`pl.settings.saveOff.future`,
`pl.settings.saveOff.timeout`); `src/main.ts` `start` (opcja `detail` karty); `docs/design-gaps.md` (wiersz 69)

**Intent**: Pod zdaniem `off` wyciszona linia `pl.saveFailed.detail(code, __BUILD_ID__)` (ten sam format co na karcie,
bez nowego klucza), gdy `code !== null`. Karta `unavailable` dostaje `detail: pl.saveFailed.detail(outcome.error, __BUILD_ID__)`
(`Kod: timeout` / `Kod: UnknownError`). Komentarz `DESIGN-GAP 69` przy kluczach i w widoku.

**Contract**: brzmienie (do teacher read): `saveOff.future: 'Zapis jest wyłączony: zapis na tym urządzeniu pochodzi z nowszej wersji gry. Zaktualizuj grę, a postępy wrócą.'`,
`saveOff.timeout: 'Zapis jest wyłączony: odczyt zapisu trwał za długo. Uruchom grę ponownie.'`; `saveOff.unavailable`
bez zmian (spec C-1). Wiersz 69: „The kit has no line for the reason and code of a switched-off save” → zdanie per
przyczyna + `Kod: … · Wersja …` w „Zapis gry”, `detail` na karcie `unavailable` (rev. 43, 45, 51).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `stateOf` zwraca `cause: 'unavailable'` dla `timeout` → test czerwony; `code` z `lastError` dla `unavailable` → czerwony (test z `lastError` różnym od `loadError`); przywrócone; meta-check: testy podają `loadError ≠ lastError`
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (`save-restart.spec.ts` C-1 i M-S4 zielone)

#### Manual Verification:

- [reviewer] Teacher read `saveOff.future`/`saveOff.timeout` (spokojnie, dla dorosłego, bez obwiniania przeglądarki przy `timeout`), wiersz 69
- [visual] Zrzuty: „Zapis gry” przy `?e2eSave=unavailable` (zdanie + `Kod: UnknownError`) i `?e2eSave=hang` (zdanie `timeout` + `Kod: timeout`); karta startowa przy `?e2eSave=unavailable` i `?e2eSave=hang` z linią `detail` — 1440 i 1024 szerokości

---

## Phase 3: Zapis z nowszej wersji nienadpisywalny w aplikacji; szew `?e2eSave=corrupt`

Driver: impl
Driver why: sklejka `main.ts` → autosaver i tekst per przyczyna w dwóch istniejących dialogach wokół logiki z fazy 1 — zachowanie widać w DOM; dowód w e2e (przeniesiony test) i fazie 6.

### Overview

`main.ts` przekazuje powód odczytu; dialogi pokazują zdanie per przyczyna (SIR-01 widoczne, SIR-06). Szew `corrupt`
zastępuje `unreadable` (v99 = `future`) tam, gdzie spec sprawdza „ostrzeżenie i dozwolony reset”.

### Changes Required:

#### 1. Powód do autosavera

**File**: `src/main.ts` `start`

**Intent**: `createAutosaver({ …, loadReason: outcome.kind === 'unreadable' ? outcome.reason : undefined })`; komentarz
szwu wymienia `corrupt`. Karta `future` bez zmian (tytuł, `Kod: future`, „Zachowaj kopię” — spec FR-021).

#### 2. Teksty per przyczyna w dialogach

**File**: `src/ui/dom/saveImportDialog.ts` `blockedStep`; `src/ui/dom/saveResetDialog.ts` (gałąź `blocked`);
`src/data/pl.ts` `pl.saveTransfer`; `docs/design-gaps.md` (wiersz 70, odnośnik w 68)

**Intent**: Gałąź `blocked` wybiera zdanie po `device.cause`; reszta bez zmian (tylko „Zamknij”). `fatal` dostaje
prawdziwe zdanie (SIR-06).

**Contract**: nowe klucze obok `deviceUnavailable` (brzmienie do teacher read):
`deviceFuture: 'Zapis na tym urządzeniu pochodzi z nowszej wersji gry, więc ta wersja go nie zastąpi. Zaktualizuj grę: zapis wczyta się bez zmian.'`,
`deviceTimeout: 'Odczyt zapisu na tym urządzeniu trwał za długo, więc gra nie może go teraz zastąpić. Uruchom grę ponownie i spróbuj jeszcze raz.'`,
`deviceFatal: 'Gra się zatrzymała, więc nie może teraz zastąpić zapisu. Uruchom grę ponownie.'`. Wybór w jednym miejscu
(mała mapa `cause → tekst` współdzielona przez oba dialogi, np. w `saveSummaryView.ts` albo nowej funkcji w `pl.ts`).
Wiersz 70: „The kit has no line per reason a device save cannot be replaced (newer version, slow read)”.

#### 3. Szew `corrupt` i przeniesienie testu

**File**: `src/testing/e2eHook.ts` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`, `e2eSaveStore`); `tests/e2eSave.test.ts`;
`tests/e2eHookGuard.test.ts` (`it.each` szwów `e2eSave`); `tests/e2e/save-transfer-blocked.spec.ts`

**Intent**: `corrupt` = magazyn w pamięci z wartością, dla której `decodeSave` zwraca `corrupt` (np. `{ version: 1, … }`
nieprzechodzące `validateSave`), zapisy przyjmowane. Test „#2 an unreadable save warns instead of showing the fresh
session” przechodzi na `?e2eSave=corrupt` (tytuł i asercje bez zmian, typ `mode` rozszerzony); marker `'e2eSave'` już
pokrywa nową wartość.

**Contract**: test jednostkowy: `decodeSave(initial)` z `corrupt` → `{ kind: 'unreadable', reason: 'corrupt' }`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (szew `corrupt` w `e2eSave.test.ts`, przypadek w strażniku)
- `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `corrupt` tylko pod `e2eSave`
- Deliberate break: wartość startowa szwu `corrupt` z `version: 99` → test `e2eSave.test.ts` „corrupt decodes as corrupt” czerwony; przywrócone; meta-check: dowodzi, że szew daje `corrupt`, a nie drugi `future` (skutek w dialogach dowodzi e2e: przeniesiony test w 3.4 i (a) w fazie 6)
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (przeniesiony test zielony na `corrupt`, `save-restart.spec.ts` FR-021 zielony)

#### Manual Verification:

- [reviewer] Teacher read `deviceFuture`/`deviceTimeout`/`deviceFatal`, wiersz 70; jedna mapa przyczyna → tekst
- [visual] Zrzuty dialogów importu i resetu: `?e2eSave=unreadable` (`future`: zdanie, tylko „Zamknij”), `?e2eSave=corrupt` (ostrzeżenie, akcje dostępne), `?e2eSave=hang` (`timeout`); „Zapis gry” przy `?e2eSave=unreadable` (zdanie `future`, `Kod: future`) — 1440 i 1024 szerokości
- [human] Decyzja tam, gdzie PRD milczy (FR-022 vs FR-021/US-04): zapis z nowszej wersji gry na urządzeniu nie może zostać nadpisany importem ani resetem; jedyne wyjście to aktualizacja gry lub kopia z karty startowej

---

## Phase 4: Drugie potwierdzenie przy trwałym `unavailable` i rada o danych strony

Driver: impl
Driver why: nowy krok w dwóch istniejących dialogach DOM i sklejka `apply` z `force` wokół bramki z fazy 1 — zachowanie widać w DOM; dowód w e2e fazy 6.

### Overview

SIR-02 (opcja A z researchu): rodzic, którego przeglądarka trwale odrzuca odczyt, może świadomie zastąpić zapis z
pierwszego uruchomienia; gdy i to się nie uda, dostaje nazwaną ostatnią deskę ratunku. Reset dostaje własny tekst porażki (S12-06).

### Changes Required:

#### 1. Dialogi

**File**: `src/ui/dom/saveImportDialog.ts` (`blockedStep`, `stepOne`, `stepTwo`); `src/ui/dom/saveResetDialog.ts`;
`src/data/pl.ts` `pl.saveTransfer`; `docs/design-gaps.md` (wiersz 71)

**Intent**: Przy `blocked` z `forceable` krok zablokowany pokazuje zdanie `deviceUnavailable` (nowa treść), przycisk
„Zastąp mimo to” (zwykły styl, nigdy fokus) i „Zamknij” (fokus). Tap otwiera zwykły krok (import: wybór pliku i
porównanie; reset: lista „co zniknie”) z ostrzeżeniem zamiast „Teraz”; „Wczytaj”/„Zacznij od nowa” wołają `apply(state, true)`.
Porażka wymuszonego zapisu pokazuje `siteDataAdvice` zamiast `applyFailed`. Porażka zwykłego resetu pokazuje
`resetFailed` (S12-06). `forceable === false` — jak w fazie 3.

**Contract**: `apply: (state: SaveState, force: boolean) => Promise<ReplaceResult>` w obu dialogach. `siteDataAdvice`
tylko wtedy, gdy wymuszony `replace` zwrócił błąd zapisu magazynu (`error` spoza `'Busy' | 'Blocked' | 'InvalidSave'`) albo
odrzucił obietnicę; `Busy`/`Blocked`/`InvalidSave` na ścieżce wymuszonej → zwykłe `applyFailed` (import) / `resetFailed`
(reset), bo rada „usuń dane strony” niszczy zapis i nie może paść przy błędzie, który nie pochodzi z magazynu (plan-review F2). Nowe klucze (brzmienie do teacher read):
`deviceUnavailable: 'Gra nie mogła odczytać zapisu na tym urządzeniu. Jeśli to się powtarza przy każdym uruchomieniu, możesz go zastąpić. Postępy zapisane wcześniej na tym urządzeniu wtedy znikną.'`,
`force: 'Zastąp mimo to'`, `forcedWarning: 'Zapisu z tego urządzenia nie udało się odczytać. Zostanie zastąpiony.'`,
`siteDataAdvice: 'Nie udało się zapisać na tym urządzeniu. Ostatnie wyjście: usuń dane tej strony w ustawieniach przeglądarki albo usuń ikonę gry z ekranu i dodaj ją ponownie. To usuwa też zapis gry.'`,
`resetFailed: 'Nie udało się zacząć od nowa. Obecne postępy zostały bez zmian.'`. Wiersz 71: „The kit has no way out of
a save the browser never gives” → drugie potwierdzenie + rada; komentarz `DESIGN-GAP 71`.

#### 2. Sklejka

**File**: `src/scenes/UIScene.ts` (`openImport`, `openReset`); `tests/deviceSaveWiring.test.ts`

**Intent**: `apply: (state, force) => saver.replace(state, { force })`; test okablowania sprawdza, że oba `apply`
przekazują `force` do `saver.replace`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (okablowanie `force`)
- `tests/dialogSessions.test.ts` zielony (liczba callbacków bez zmian albo uzasadniona w handoff)
- Deliberate break: `UIScene` przekazuje `saver.replace(state)` bez `force` → test okablowania czerwony; przywrócone; meta-check: dowodzi sklejki, a skutek (odmowa) dowodzi e2e fazy 6
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` („#2 an unavailable save cannot be overwritten…” zielony: pierwszy krok nadal bez `choose`/`resetConfirm`)

#### Manual Verification:

- [reviewer] Teacher read `deviceUnavailable` (nowa treść), `force`, `forcedWarning`, `siteDataAdvice`, `resetFailed`; wiersz 71; fokus nigdy na „Zastąp mimo to” ani na akcji nadpisania
- [visual] Zrzuty przy `?e2eSave=unavailable`: import krok zablokowany (zdanie, „Zastąp mimo to”, „Zamknij”), import po „Zastąp mimo to” (wybór pliku + `forcedWarning`), reset krok zablokowany, reset po „Zastąp mimo to” (lista + przycisk potwierdzenia) — 1440 i 1024 szerokości
- [human] Decyzja: przy trwałym `unavailable` (nie `timeout`) rodzic może po drugim potwierdzeniu nadpisać zapis, którego gra nie odczytała — odwraca część decyzji 6.7 z `art-stand-in-and-load-signal` (wtedy: odmowa do ponownego uruchomienia)
- [human] Rada `siteDataAdvice` sprawdzona na iPadzie (Safari i ikona na ekranie) i Androidzie (Chrome): czy usunięcie danych strony / ikony rzeczywiście czyści zapis gry

---

## Phase 5: Ostrzeżenie w eksporcie, test okablowania `freshRound`, seam sweep i dokumentacja

Driver: impl
Driver why: ostatnia faza `impl` — jedna linia w istniejącym dialogu eksportu (SIR-04), test źródła dla istniejącej sklejki (ASL-01; implementacja już jest, więc nie `tdd`), seam sweep, follow-upy i `CLAUDE.md`.

### Overview

Zamknięcie zmiany przed e2e.

### Changes Required:

#### 1. Ostrzeżenie w eksporcie

**File**: `src/ui/dom/saveExportDialog.ts` (`SaveExportDialogOptions.warning?`); `src/scenes/UIScene.ts` `openExport`;
`src/data/pl.ts` `pl.saveTransfer.exportNotDevice`; `tests/deviceSaveWiring.test.ts`; `docs/design-gaps.md` (wiersz 72, odnośnik w 47)

**Intent**: Gdy `deviceSaveView(saver.status(), …)` nie jest `summary`, dialog eksportu pokazuje linię ostrzeżenia nad
„Zapisz plik”; eksport surowy z karty startowej (`main.ts`) bez zmian (bez `warning`). Koperta bez nowego pola.

**Contract**: `exportNotDevice: 'Gra nie wczytała zapisu z tego urządzenia, więc ta kopia zawiera tylko obecną grę, bez wcześniejszych postępów.'`
(do teacher read). Test okablowania: `openExport` woła `deviceSaveView` z `saver.status()`.

#### 2. Test okablowania `freshRound` (ASL-01)

**File**: `tests/freshRoundWiring.test.ts` (nowy; wzór `tests/deviceSaveWiring.test.ts`)

**Intent**: Parsuje `src/scenes/TaskScene.ts` API kompilatora TypeScript i w metodzie `freshRound` sprawdza: wywołanie
`buildAdaptiveRound` ma argument-obiekt z właściwością `missingIds`; wywołanie `buildWarmup` ma argument `blocked`; tekst
metody zawiera `REGISTRY_KEYS.artHealth`. Komentarz nagłówka: dowodzi składni sklejki, filtr dowodzi `tests/artFilter.test.ts`.

#### 3. Seam sweep

**File**: pliki faz 1–5

**Intent**: jedna reguła (`replaceGate`) dla `deviceSaveView` i `replace` (bez drugiej kopii warunku w dialogach lub
`UIScene`); jedna mapa przyczyna → tekst; komentarze aktualne (`Autosaver.replace` „Unavailable: …”, nagłówki dialogów
„offers no file at all”, `main.ts` komentarz szwów, `tests/deviceSaveWiring.test.ts` nagłówek „S12-01”,
`save-transfer-blocked.spec.ts` nagłówek); żadnego martwego klucza `pl.ts`; wiersze 42, 45, 47, 48, 49, 51, 68 spójne
z 69–72; `REGISTRY_KEYS`/`SAVE_KEYS` nietknięte.

#### 4. Follow-upy

**File**: `context/changes/save-reason-and-recovery/follow-ups/review-fixes.md` (nowy)

**Intent**: Każdy z konkretnym `Trigger:` (zamyka SIR-07 dla tej listy; archiwum nieedytowane): S12-02 (`replace` bez
limitu czasu; `Trigger: a parent report of an import/reset dialog stuck with disabled buttons, or S-15's v2 migration touching replace`),
S12-03 (`stateOf` nie czyta `status.replace`; dziś niewidoczne, bo każdy udany `replace` kończy się `reload()` w tym samym dialogu — `Trigger: any replace path that does not reload the page right after apply (saveImportDialog/saveResetDialog), or S-15 moving the import out of the dialog`),
S12-11 (porażki `replace` w `failures`; przy zablokowanym zapisie sekcja i tak pokazuje `off` — `Trigger: S-15 save format v2 writing a migrated save through replace, or a parent report of "failing" right after a failed import`),
S12-05 (`broken` zamyka panel bez tekstu; osiągalne tylko, gdy `validateSave` odrzuca `saver.current()` w pamięci — `Trigger: a deviceSaveView 'broken' seen in any test, e2e run or parent report`). Uwaga (plan-review F1): ta zmiana sama zmienia `stateOf`, `replace` i `openImport`/`openReset`, więc stare triggery „the next change to …” są już spełnione i nie mogą zostać — stąd nowe warunki powyżej,
S12-07..09, S12-12..15 (`Trigger: S-15 save format v2`), osobne ciało karty dla `timeout` i pomiar N-7 (`Trigger: the [human] iPad measurement of a cold IndexedDB open`),
licznik startów `unavailable` (`Trigger: a report that the second confirmation was not enough, or N-7 showing permanent timeouts`),
ASL-02..09 (`Trigger: the next change to artHealth.ts, artFilter.ts or ArtImage`), import z ekranu powitalnego (trigger
bez zmian). Zamknięte (odnośniki do archiwum): S12-04, S12-06, S12-10, „Import or reset over an unreadable save (impl-review F1)” — część `future`.

#### 5. `CLAUDE.md`

**File**: `CLAUDE.md` „Current state”

**Intent**: Jedno zdanie: `loadReason`/`loadError` w statusie autosavera, `replaceGate` (`future` i `timeout` nigdy,
`unavailable` po drugim potwierdzeniu „Zastąp mimo to”), przyczyny w `deviceSaveView` i „Zapis gry” z kodem, ostrzeżenie
w eksporcie, szew `?e2eSave=corrupt`, `tests/freshRoundWiring.test.ts`, gaps 69–72.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`freshRoundWiring` + okablowanie `openExport`)
- Deliberate break: `freshRound` bez `{ missingIds, … }` w `buildAdaptiveRound` → `freshRoundWiring` czerwony; `buildWarmup` bez `blocked` → czerwony; przywrócone; meta-check: dowodzi składni sklejki, nie filtrowania (to `artFilter.test.ts`)
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break: `CLAUDE.md` wskazuje nieistniejący `tests/freshRoundWiringg.test.ts` → FAIL; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Teacher read `exportNotDevice`, wiersz 72
- [reviewer] Seam sweep: jedna reguła `replaceGate`, jedna mapa tekstów, komentarze, gaps 42–51 i 68–72 spójne, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`
- [visual] Zrzuty dialogu eksportu z panelu: z ostrzeżeniem (`?e2eSave=unavailable`, `?e2eSave=corrupt`) i bez (zdrowy zapis) — 1440 i 1024 szerokości
- [human] Pomiar N-7 na iPadzie: zimny odczyt IndexedDB po długiej przerwie — czy `timeout` (`balance.save.loadTimeoutMs`) zdarza się przy zdrowym zapisie (decyduje o liczniku startów i tekście karty)

---

## Phase 6: Przyczyny odczytu w przeglądarce — e2e (#2)

Driver: e2e
Driver why: ryzyko #2 (postęp nigdy nie ginie) przy `future`, trwałym `unavailable`, `timeout` i eksporcie istnieje tylko w przeglądarce z dialogami DOM i prawdziwym autosaverem; zbudowane w fazach 1–5, kontrakt `E2E=on`.

### Overview

Nowe testy w `tests/e2e/save-transfer-blocked.spec.ts` (projekt `chromium-hook`, już w `ROUND_SPEC`) i dodatkowe
asercje w `tests/e2e/save-restart.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/save-transfer-blocked.spec.ts`, `tests/e2e/save-restart.spec.ts`

**Intent**: (a) „#2 SIR-01 a save from a newer version is never offered for overwrite”: `?e2eSave=unreadable` → import i
reset: `deviceFuture`, brak `choose`, `resetConfirm`, `force`; „Zapis gry”: `saveOff.future` i `Kod: future`; `writes` 0.
(b) „#2 SIR-02 a save the browser never gives can be replaced after a second confirmation”: `?e2eSave=unavailable` → reset
→ „Zastąp mimo to” → `forcedWarning` → „Zacznij od nowa” → brak `applyFailed`/`siteDataAdvice`, strona przeładowana
(karta `saveUnavailable` znów widoczna). (c) „#2 SIR-02 a read that timed out offers no overwrite”: `?e2eSave=hang` →
import i reset: `deviceTimeout`, brak `force`. (d) „#2 SIR-04 a copy from the panel says it is not the device save”:
`?e2eSave=unavailable` → „Zapisz kopię” → `exportNotDevice` widoczne; na zdrowym zapisie (nowy kontekst) — brak.
W `save-restart.spec.ts`: C-1 dodatkowo `Kod: UnknownError` w sekcji i `detail` na karcie; M-S4 dodatkowo
`saveOff.timeout` w sekcji (rozszerzone asercje, liczba testów bez zmian).

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty z DOM, stan z haka tylko do odczytu;
nowy kontekst = świeże urządzenie; nigdy IDB z testu. Spec w trybie serial → każdy oczekiwany czerwony test osobno (`-g`).
**Chromium niedostępny w sesji agenta**: protokół request-file — `e2e-request-p6.md`, patche
`e2e-break-p6a.patch` … `e2e-break-p6c.patch` (tylko kod produkcyjny), `STATUS: BLOCKED — e2e needs orchestrator run
(request file written)`; agent kończący commituje spec po wyniku orkiestratora.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-transfer-blocked.spec.ts tests/e2e/save-restart.spec.ts` zielone; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`
- Deliberate break (patch `e2e-break-p6a.patch`): `replaceGate` przepuszcza `future` (bez zmiany testów jednostkowych w patchu) → (a) czerwony na `deviceFuture`/`resetConfirm`; meta-check: dowodzi powodu w przeglądarce, nie tylko w `core`
- Deliberate break (patch `e2e-break-p6b.patch`): `UIScene` przekazuje `saver.replace(state)` bez `force` → (b) czerwony na `resetFailed` i braku przeładowania (po F2 `Blocked` nie daje `siteDataAdvice`); meta-check: dowodzi wyjścia SIR-02 na szwie „odczyt odrzuca, zapis działa”
- Deliberate break (patch `e2e-break-p6c.patch`): `openExport` bez `warning` → (d) czerwony; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `replaceGate`/`replace` dla każdej kombinacji `blockedBy × loadReason × loadError × force` (liczba zapisów magazynu,
  `log`), `loadError` niezmienny; `deviceSaveView` per przyczyna + lockstep z `replace`; `stateOf` (`future`, `timeout`,
  `code`); szew `corrupt` (`decodeSave` → `corrupt`) i strażnik; okablowanie `UIScene` (`saver.status()`, `force`,
  `openExport`); `tests/freshRoundWiring.test.ts`.

### Integration Tests:

- `npm run build` (strażnik szwów), e2e: przeniesiony test na `corrupt` (faza 3), cztery nowe testy i rozszerzone C-1/M-S4 (faza 6).

### Manual Testing Steps:

1. Zrzuty stanów z faz 2–5 (bramka wizualna, Playwright fallback dla długiego przytrzymania — profil § 8).
2. Teacher read wszystkich nowych tekstów `pl.settings.saveOff.*` i `pl.saveTransfer.*`.
3. `[human]`: decyzje 3.7 i 4.7, rada 4.8, pomiar N-7 5.8.

## Performance Considerations

Brak: kilka porównań przy otwarciu dialogu; brak nowego I/O.

## Migration Notes

Brak. `SAVE_VERSION` 1, fixtury nietknięte; `loadReason`/`loadError` tylko w statusie runtime. S-15 (v2): warunek
`reason === 'future'` działa bez zmian dla zapisu v3; jego e2e dwóch buildów należy do S-15.

## Known risks

- **Wymuszone nadpisanie zdrowego zapisu**: jeśli przeglądarka odrzuca odczyt chwilowo przy zdrowym zapisie, rodzic po
  drugim potwierdzeniu go nadpisze. Łagodzi: tekst mówi „jeśli to się powtarza przy każdym uruchomieniu” i „postępy
  znikną”, `timeout` jest wyłączony z wyjścia. `[human]` 4.7.
- **Rada o danych strony niesprawdzona**: zachowanie ikony na ekranie iPadOS i Safari „Dane witryn” dla PWA nie jest
  udokumentowane (research, Open Questions). `[human]` 4.8.
- **`timeout` trwały na iPadzie**: wtedy rodzic nie ma wyjścia w aplikacji poza radą z karty; zależy od N-7. `[human]` 5.8.
- **Chromium w sesji agenta**: faza 6 w protokole request-file; zrzuty faz 2–5 przez fallback Playwright.
- **Trwały `timeout` bez nazwanej rady o danych strony** (plan-review F3): `deviceTimeout` każe uruchomić grę ponownie, a
  rada „usuń dane tej strony” pada tylko po porażce wymuszonego zapisu przy `unavailable`. Świadome: przy `timeout` zapis
  może być zdrowy, a rada go niszczy. Wraca z pomiarem N-7 (`[human]` 5.8) i follow-upem „licznik startów `unavailable`”.
- **Test lockstep częściowo tautologiczny** (plan-review F4): `forceable` liczony z `replaceGate`, więc wartość testu leży
  w tym, że `replace` naprawdę woła `replaceGate` (liczba zapisów magazynu), a nie w porównaniu dwóch reguł.

## References

- Research: `context/changes/save-reason-and-recovery/research.md`; change: `context/changes/save-reason-and-recovery/change.md`
- Audyt obserwowalności 2026-10-14_1110 (PR #45): SIR-01..07, ASL-01..09, S12-02..15 (status)
- Kontrakt runu `context/runs/2026-10-14-save-s13b-s15-s14b/agent-contract.md` („Slice-specific rules”); profil `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test-plan `context/foundation/test-plan.md` ryzyko #2; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-14-art-stand-in-and-load-signal/plan.md` (decyzja 4, `[human]` 6.7, `deviceSaveView`, request-file), `context/archive/2026-10-13-save-observability-c1-c2/` (`saveHealthView`), `tests/deviceSaveWiring.test.ts`
- PRD `context/foundation/prd.md`: guardrail „Postęp nigdy nie ginie”, US-04, FR-021, FR-022

## Autonomous decisions

1. **SIR-01: odmowa (`core` + dialog) dla `future`, bez ścieżki `force`.** Odrzucone: tekst z dozwolonym nadpisaniem.
   Dlaczego: zapis jest zdrowy i odzyskiwalny aktualizacją; guardrail „Postęp nigdy nie ginie” i FR-021; FR-022 milczy →
   `[human]` 3.7. Zmieniłoby: decyzja opiekuna, że rodzic może świadomie porzucić nowszy zapis → `replaceGate` daje
   `force` także dla `future`.
2. **SIR-02: opcja A (drugie potwierdzenie „Zastąp mimo to” → `replace` z `force`), `timeout` wyłączony, plus rada o
   danych strony przy porażce.** Odrzucone: licznik startów w `localStorage` (Safari prywatny trzyma go tylko na sesję,
   brak dowodu, że przeżywa zepsute IDB; druga ścieżka magazynu), `deleteDatabase` w aplikacji (sam może rzucić
   `UnknownError`), sam tekst (brak wyjścia w aplikacji). Częściowo odwraca decyzję 6.7 poprzedniej zmiany → `[human]` 4.7.
   Zmieniłoby: N-7 pokazujący częsty trwały `timeout` → licznik albo drugi odczyt z dłuższym limitem.
3. **Jedna czysta reguła `replaceGate` dla `replace` i `deviceSaveView.forceable` + test lockstep.** Odrzucone: dwa
   warunki (UI i `core`) trzymane zgodnie ręcznie, jak dotąd. Zmieniłoby: nic.
4. **`loadError` jako osobne, niezmienne pole statusu** (decyzje o `timeout` z niego, nie z `lastError`). Odrzucone:
   `lastError` (zmienia się po porażce wymuszonego zapisu). Zmieniłoby: nic.
5. **SIR-04: linia w dialogu eksportu, bez oznaczania koperty.** Odrzucone: pole w kopercie (niewidoczne dla rodzica,
   `parseImport` i tak je ignoruje). Zmieniłoby: import pokazujący „kopia bez zapisu urządzenia” w podsumowaniu.
6. **SIR-03: kod przez istniejący `pl.saveFailed.detail(code, __BUILD_ID__)`** (jeden format kodu na karcie i w
   panelu), zdania `future`/`timeout` w `saveOff`; ciało karty `timeout` bez zmian (follow-up). Zmieniłoby: N-7.
7. **Tanie dodatki wzięte: SIR-05 (log), SIR-06 (tekst `fatal`), S12-06 (tekst porażki resetu)**, bo dotykają tych
   samych symboli; S12-03, S12-11, S12-02 i reszta — follow-upy z nowymi triggerami. Zmieniłoby: plan-review uznający fazę za zbyt dużą.
8. **ASL-01 testem źródła (AST), `impl` w fazie 5** — implementacja istnieje, więc nie `tdd`; e2e odrzucone (probabilistyczne, `?e2eSkills` omija ścieżkę). Zmieniłoby: przeniesienie logiki `freshRound` do `core`.
9. **Szew `corrupt` i przeniesienie testu „warns” w fazie 3** — tej, która zmienia zachowanie `unreadable` (v99); nowe
   e2e w fazie 6 po seam sweep. Zmieniłoby: nic.
10. **Sześć faz: 2 × tdd (1, 2), 3 × impl (3–5; komponenty zmieniane: dialogi importu/resetu w 3 i 4, eksport w 5,
    sekcja zdrowia w 2; żaden nowy komponent), 1 × e2e (6, ryzyko #2).** Bez `AskUserQuestion` (kontrakt reguła 1):
    złożoność MEDIUM, wszystkie decyzje z research i change.md; brak wpisu w roadmapie (zmiana spoza roadmapy, roadmapa nietknięta).
11. **Zrzuty 1440 i 1024 szerokości** (profil § 9, krok runu). Zmieniłoby: profil § 9 z innymi szerokościami.

## Addendum (impl-review, 2026-10-14)

- `isTimeoutError` (`src/core/autosave.ts`) treats IndexedDB's own `TimeoutError` like the read limit's `timeout`: never
  forceable, cause `timeout` in `deviceSaveView` and in "Zapis gry" (impl-review F1). The rule stays one function used by
  `replaceGate`, `deviceSaveView` and `saveHealth` `offState`.
- Phase 4 Contract changed: a rejected `apply` promise no longer shows `siteDataAdvice`; `Autosaver.replace` catches every
  store error and returns it, so a rejection is never the store (`failureText` in `saveSummaryView.ts`, impl-review F2).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Powód odczytu w statusie autosavera, bramka `replace` i `deviceSaveView` per przyczyna

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — 974cd90
- [x] 1.2 Deliberate break: `replaceGate` przepuszcza `future` / `timeout` z `lastError` → czerwone; przywrócone; meta-check — 974cd90
- [x] 1.3 `tests/fixtures/save-v1*.json` bez zmian; `SAVE_VERSION` 1; `tests/saveKeys.test.ts` zielony — 974cd90
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — orchestrator note: full e2e on 974cd90, 52 passed (4.0 min)

#### Manual

- [x] 1.5 [reviewer] `loadReason`/`loadError` tylko w statusie runtime; `UIScene` tylko argumenty `deviceSaveView`; jedna reguła `replaceGate` — impl-review 02b8f42 (reviews/impl-review.md)

### Phase 2: „Zapis gry” z przyczyną i kodem, `detail` na karcie `unavailable`

#### Automated

- [x] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N` — 815af40
- [x] 2.2 Deliberate break: `timeout` jako `unavailable` / `code` z `lastError` → czerwone; przywrócone; meta-check — 815af40
- [x] 2.3 Pełna bramka lokalna zielona; `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (e2e: orchestrator note, 815af40: 52 passed)

#### Manual

- [x] 2.4 [reviewer] Teacher read `saveOff.future`/`saveOff.timeout`, wiersz 69 — impl-review 02b8f42 (reviews/impl-review.md)
- [x] 2.5 [visual] Zrzuty „Zapis gry” i karty przy `?e2eSave=unavailable` i `?e2eSave=hang` — 1440 i 1024

### Phase 3: Zapis z nowszej wersji nienadpisywalny w aplikacji; szew `?e2eSave=corrupt`

#### Automated

- [x] 3.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (szew `corrupt`, strażnik) — 5de4d76
- [x] 3.2 `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `corrupt` tylko pod `e2eSave` — 5de4d76
- [x] 3.3 Deliberate break: szew `corrupt` z `version: 99` → test „corrupt decodes as corrupt” czerwony; przywrócone; meta-check — 5de4d76
- [x] 3.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (test „warns” na `corrupt`, FR-021 zielony) — orchestrator note: 51 passed + adaptive.spec #13 load flake (passed alone); save-transfer-blocked and save-restart green on 5de4d76 — 5de4d76

#### Manual

- [x] 3.5 [reviewer] Teacher read `deviceFuture`/`deviceTimeout`/`deviceFatal`, wiersz 70; jedna mapa przyczyna → tekst — impl-review 02b8f42 (reviews/impl-review.md)
- [x] 3.6 [visual] Zrzuty dialogów importu i resetu przy `unreadable` (`future`), `corrupt`, `hang`; „Zapis gry” przy `unreadable` — 1440 i 1024
- [ ] 3.7 [human] Decyzja tam, gdzie PRD milczy: zapis z nowszej wersji gry nie może zostać nadpisany importem ani resetem

### Phase 4: Drugie potwierdzenie przy trwałym `unavailable` i rada o danych strony

#### Automated

- [x] 4.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (okablowanie `force`) — 5884958
- [x] 4.2 `tests/dialogSessions.test.ts` zielony (liczba callbacków bez zmian albo uzasadniona) — 5884958
- [x] 4.3 Deliberate break: `UIScene` bez `force` → test okablowania czerwony; przywrócone; meta-check — 5884958
- [x] 4.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (test `unavailable` zielony) — orchestrator note: 52 passed on 5884958

#### Manual

- [x] 4.5 [reviewer] Teacher read `deviceUnavailable`, `force`, `forcedWarning`, `siteDataAdvice`, `resetFailed`; wiersz 71; fokus nigdy na nadpisaniu — impl-review 02b8f42 (reviews/impl-review.md)
- [x] 4.6 [visual] Zrzuty przy `?e2eSave=unavailable`: import i reset w kroku zablokowanym i po „Zastąp mimo to” — 1440 i 1024
- [ ] 4.7 [human] Decyzja: po drugim potwierdzeniu rodzic może nadpisać nieodczytany zapis przy trwałym `unavailable` (odwraca część 6.7 poprzedniej zmiany)
- [ ] 4.8 [human] Rada `siteDataAdvice` sprawdzona na iPadzie (Safari i ikona) i Androidzie (Chrome)

### Phase 5: Ostrzeżenie w eksporcie, test okablowania `freshRound`, seam sweep i dokumentacja

#### Automated

- [x] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`freshRoundWiring`, okablowanie `openExport`) — a544e07
- [x] 5.2 Deliberate break: `freshRound` bez `missingIds` / bez `blocked` → `freshRoundWiring` czerwony; przywrócone; meta-check — a544e07
- [x] 5.3 `validate-rule-files.sh` PASS; deliberate break: `CLAUDE.md` z nieistniejącą ścieżką → FAIL; przywrócone — a544e07
- [x] 5.4 `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — build verified in p5; e2e 52 passed on a544e07 (orchestrator note)

#### Manual

- [x] 5.5 [reviewer] Teacher read `exportNotDevice`, wiersz 72 — impl-review 02b8f42 (reviews/impl-review.md)
- [x] 5.6 [reviewer] Seam sweep: jedna reguła `replaceGate`, jedna mapa tekstów, komentarze, gaps 42–51 i 68–72, follow-upy z `Trigger:`, zdanie w `CLAUDE.md` — impl-review 02b8f42 (reviews/impl-review.md)
- [x] 5.7 [visual] Zrzuty dialogu eksportu z ostrzeżeniem (`unavailable`, `corrupt`) i bez (zdrowy zapis) — 1440 i 1024
- [ ] 5.8 [human] Pomiar N-7 na iPadzie: czy `timeout` zdarza się przy zdrowym zapisie po długiej przerwie

### Phase 6: Przyczyny odczytu w przeglądarce — e2e (#2)

#### Automated

- [x] 6.1 `save-transfer-blocked.spec.ts` i `save-restart.spec.ts` zielone; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4` — orchestrator: save-transfer-blocked + save-restart 14 passed; full suite 57 passed (baseline 52, +5 as the orchestrator measured; plan expected +4) @@ — b23bc53
- [x] 6.2 Deliberate break (patch `e2e-break-p6a.patch`): `replaceGate` przepuszcza `future` → (a) czerwony; meta-check — orchestrator: only "#2 SIR-01 a save from a newer version is never offered for overwrite" red (`Zastąp mimo to` count 1, expected 0), other 6 green, restored; proves the reason in the browser dialog @@ — b23bc53
- [x] 6.3 Deliberate break (patch `e2e-break-p6b.patch`): `replace` bez `force` → (b) czerwony; meta-check — orchestrator: only "#2 SIR-02 a save the browser never gives can be replaced after a second confirmation" red (card never reappears), other 6 green, restored @@ — b23bc53
- [x] 6.4 Deliberate break (patch `e2e-break-p6c.patch`): `openExport` bez `warning` → (d) czerwony; przywrócone — orchestrator: only "#2 SIR-04 a copy from the panel says it is not the device save" red (`exportNotDevice` not found), other 6 green, restored @@ — b23bc53
- [x] 6.5 `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite — build `e2e hook: absent (2 chunks checked)`; lint, typecheck, unit 1927 (unchanged) green; servers gone @@ — b23bc53
