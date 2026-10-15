# Zapis v3 z migracją starego salonu, limit czasu ładowania grafiki i zapis po migracji przy starcie — Implementation Plan

## Overview

Poprawka spoza roadmapy po audycie obserwowalności 2026-10-15_2010 (PR #63): **H-1**, **M-2**, **H-2**, **M-3**, plus
tanie dodatki na tych samych symbolach: L-1/L-2 (testy na prawdziwych tabelach salonu, zamrożony fixture starego salonu),
M-1 (kopia surowego v2), impl-review F3/F4 z `save-v2-backup-health` (trigger „next change to `replace` … or the v3 save
format” odpalił). Skutki:

1. Przeliczenie starego 10-slotowego salonu przestaje być ukrytą przeróbką przy wczytaniu: jest krokiem `MIGRATIONS[2]`
   (v2 → v3) w `src/core/save.ts`. Format zapisu: **v3** (zgoda opiekuna 2026-10-15). Przed pierwszym zapisem v3 surowy
   zapis v2 trafia pod `profile:default:backup-v2` (ta sama polityka co `backup-v1`). Build sprzed tej zmiany widzi v3
   jako `future` i nigdy go nie nadpisuje — rollback nie czyta po cichu przeliczonego `tasksDone` (H-1).
2. Stary salon rozpoznawany jest po **znanych starych** kluczach `chosen` (`floor`, `walls`, …), nie po „dowolnym
   nieznanym kluczu”; zapis z przyszłym slotem zostaje nietknięty (M-2).
3. Zmigrowany stan (v1 → v3 albo v2 → v3) jest zapisywany ~0,5 s po starcie bez akcji dziecka, więc migracja i jej log
   nie powtarzają się przy każdym uruchomieniu; status runtime mówi, kiedy nowy format został zapisany (M-3).
4. Plik grafiki, na który serwer nigdy nie odpowiada, kończy ładowanie po limicie (`loader.timeout` w konfiguracji gry,
   liczby w `src/data/balance.ts`): zamiast wiecznego paska ładowania gra startuje na zastępstwach, a „Obrazki” liczą
   plik jako brakujący (H-2).

## Current State Analysis

(Za `research.md`; kod potwierdzony w tym kroku na `bc8a61c`.)

- `src/core/save.ts`: `SAVE_VERSION = 2`, `MIGRATIONS = { 1 }`, `saveProblem` sprawdza `version !== 2`, `encodeSave`
  pisze `version: 2`; nagłówek: „Pure: no Phaser, no browser, no data imports”. `decodeSave(raw, migrations = MIGRATIONS)`
  — domyślny argument używany przez `loadSave`, `parseImport`, `deviceSaveView`, `importProblem`.
- `src/core/rooms.ts` `remapLegacySalon(session, legacy, room)`: znacznik = dowolny klucz `chosen`, który nie jest slotem
  nowego pokoju (M-2); reguła B (najkrótszy nowy prefiks, którego koszt pokrywa stary, z limitem całej listy); `chosen`
  odbudowane tylko z nowego prefiksu. Wołany wyłącznie w `src/main.ts` `start` (po `repairCurrentRoom`) i w
  `src/scenes/UIScene.ts` `openImport` (`summarize`).
- `src/data/rooms.ts`: `SALON.tasks` (7 zadań: `renovate` stage 5, sofa 7, rug 9, coffee-table 10, cabinet 12,
  armchair 13, wall-frames 15 = 71; komentarz „New tasks go at the END”) i `LEGACY_SALON` (10 zadań, 96, `renames`
  table → coffee-table, shelf → cabinet, picture → wall-frames). Typ `LegacyRoomLayout` w `src/core/types.ts`.
- `src/core/autosave.ts` `createAutosaver`: `backup` startuje `pending` iff `options.migrated`; `skipBackup` loguje
  `'autosave: writing v2 without the v1 copy'`; `WriteReason = 'change' | 'now' | 'hidden'`; `status().migratedFrom`;
  `replace` przy zaległej kopii próbuje jej raz i oznacza `skipped` także gdy własny zapis potem padnie (F3), log
  `attempts: 0` (F4). `src/storage/idb.ts` `backup(raw, from)` pisze pod `${key}:backup-v${from}` — kopia v2 nie
  wymaga zmiany magazynu.
- `src/main.ts` `start`: sesja ustawiana w rejestrze w `preBoot` (`createGame`) **przed** `createAutosaver` i nasłuchem
  `changedata`/`setdata`, więc nic nie oznacza zmigrowanego stanu do zapisu (M-3; dotyczy też dzisiejszego v1 → v2).
  `createGame` nie ustawia klucza `loader` → Phaser 4.2.1 `loaderTimeout` = 0 (brak limitu), `loaderMaxRetries` = 2 (H-2).
- `src/scenes/BootScene.ts` `preload`: `loaderror` loguje i nic więcej; `create` liczy `artHealth` i zdrowie grafiki
  pokoju z `textures.exists` — plik, który padł, nie trafia do cache, więc jest liczony bez innych zmian.
- Szwy e2e (`src/testing/e2eHook.ts`): `E2ESaveSeam` z `legacy-salon` (sesja budowana `encodeSave(legacySalonSession())`
  — po podbiciu wersji byłaby v3, więc przestałaby testować migrację); `E2EArtSeam = 'missing' | 'corrupt' | 'room'`;
  markery `e2eSave`, `e2eArt`, `legacy-salon` w `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`. `playwright.config.ts`
  `ROUND_SPEC` wybiera spec'e projektu `chromium-hook`.
- Asercje zmieniane przez v3: `tests/save.test.ts` („the current version is 2”, fixtury v2 „encode back to themselves”);
  e2e `writtenVersion` 2 w `tests/e2e/salon-art.spec.ts` („#2 a salon saved under the old task list…”) i
  `tests/e2e/save-backup-health.spec.ts`; tytuły `tests/e2e/save-migration.spec.ts` („… v2 build …”).
- `context/foundation/lessons.md` nie istnieje.

## Desired End State

- `SAVE_VERSION = 3`; `MIGRATIONS[2]` = przeliczenie starego salonu na zamrożonych tabelach w `src/core`
  (`src/core/migrations/legacySalon.ts`), totalne (zły kształt przechodzi do `validateSave` → `corrupt`, nigdy
  `migration-failed`), idempotentne na już przeliczonym salonie; v3 ma kształt v2 z `version: 3` (bez nowych pól).
- Zamrożone `tests/fixtures/save-v1*.json`, `save-v2*.json` bajt w bajt; nowe `tests/fixtures/save-v2-legacy-salon.json`
  (v2 sprzed S-16a: stary salon, 4 zadania) i `tests/fixtures/save-v3.json`.
- `remapLegacySalon`, `LEGACY_SALON`, `LegacyRoomLayout` usunięte z runtime (`main.ts`, `UIScene`, `src/data`,
  `src/core/rooms.ts`); import pliku v2 migruje w `decodeSave`, więc podgląd i zapis widzą to samo.
- `createAutosaver` przy `options.migrated` sam uzbraja zapis przy starcie (`WriteReason` `'migration'`); status runtime
  `migrationWrittenAt: number | null`; logi kopii mówią o wersji (`v${from}`), nie o „v1”; F3/F4 domknięte.
- `balance.loader = { timeoutMs: 12000, maxRetries: 1 }` w konfiguracji gry; szew `?e2eArt=stall` (tylko build haka)
  skraca limit; spec e2e dowodzi startu po zawieszonym pliku i licznika „Obrazki”.
- `deploy/README.md`: jedna notatka (rollback poniżej buildu v3 = karta `future`); `CLAUDE.md` jedno zdanie;
  follow-upy z `Trigger:` w `context/changes/salon-load-health/follow-ups/review-fixes.md`.

### Key Discoveries:

- Stary koszt całej listy (96) > nowy (71), a `SALON.tasks` może rosnąć na końcu: migracja czytająca żywe `SALON` dałaby
  różne v3 dla tych samych bajtów v2 — stąd zamrożony snapshot celu (research, Summary 1).
- Kopia jest kluczowana pierwotną wersją: łańcuch v1 → v2 → v3 daje jedną kopię `backup-v1` (surowe v1), v2 daje
  `backup-v2` (`src/storage/idb.ts` `backup`, `createAutosaver` `options.migrated.from`).
- Stare `chosen` zapełnia się w kolejności zadań, a `floor` jest zadaniem 1: każdy stary salon z `tasksDone ≥ 1` ma klucz
  ze zbioru „tylko stare” {floor, walls, curtains, table, lamp, shelf, plant, picture}; `tasksDone 0` mapuje się na 0
  w obu odczytaniach.
- Phaser 4.2.1 (`node_modules/phaser/src`): `xhr.ontimeout` → `File.onError` → ponowienie do `maxRetries` → `loaderror`
  → loader kończy, `create` biegnie. Najgorszy przypadek na plik ≈ (maxRetries + 1) × timeout; pliki ładują się
  równolegle (32 na desktopie, 6 na Androidzie).
- Service worker działa w buildzie haka i ma WebP w precache — `page.route` sam nie zatrzyma pliku: spec potrzebuje
  `serviceWorkers: 'block'`.

## What We're NOT Doing

- Nowe pola zapisu (v3 = v2 + `version: 3`); zmiana kształtu `example` w historii (S13-06/S-14b/S-14c/S-14d follow-upy
  → trigger przesunięty na „zapis, który zmienia kształt przykładu błędu, albo S-17”).
- Odczyt kopii `backup-v1`/`backup-v2` z aplikacji (SV2-04/opcja B) — follow-up; e2e dwóch prawdziwych buildów (nowa
  infrastruktura serwera) — follow-up; dwie karty jednego originu (`BroadcastChannel`) — follow-up.
- Zmiana `replaceGate` dla `migration-failed` (F7/SRR-09/SRR-01): `MIGRATIONS[2]` nie może rzucić (dowód testem), więc
  trigger „a migration step that can throw” nie odpala — przechodzi dalej.
- Audyt M-4 (pełna treść `console.warn`, zdanie w „Zapis gry” poza istniejącą linią „przeniesiono z wersji N”), M-5,
  M-6, L-3 (`Task art failed to load` dla plików pokoju), L-4..L-8, L-5r — follow-upy z triggerem.
- Limit czasu drugiego pobrania fontu (`FontFace`) — follow-up; WebKit (brak projektu Playwright) — `[human]` na iPadzie.
- Jakakolwiek zmiana w `deploy/` poza jedną notatką w `deploy/README.md`; nic pod `designs/`, `.gitignore`, `.claude/`.

## Implementation Approach

Najpierw format (faza 1, test-first: v3, krok migracji, fixtury, szew starego salonu jako zamrożony v2), potem
domknięcie startu w `core` (faza 2, test-first: zapis przy starcie, usunięcie podwójnego przeliczenia, F3/F4), potem
limit loadera (faza 3, sklejka konfiguracji + szew), dokumentacja i follow-upy (faza 4), na końcu e2e (faza 5) w
protokole request-file. Każda faza zostawia pełne e2e zielone: istniejące spec'e, których zachowanie faza zmienia, są
aktualizowane w tej samej fazie (faza 1: wersja 3 w asercjach i tytułach).

## Critical Implementation Details

- **Kolejność w fazie 1**: fixture `save-v2-legacy-salon.json` powstaje z `encodeSave(legacySalonSession())` **przed**
  podbiciem `SAVE_VERSION` (bajty v2, potem zamrożone; komentarz w teście: skąd pochodzi). Po podbiciu szew
  `legacy-salon` importuje ten JSON jak `save-v1.json`.
- **Krok jest totalny**: `MIGRATIONS[2]` dostaje surowe, niezwalidowane dane. Gdy `rooms`, `rooms.salon` lub `chosen`
  nie są zwykłym obiektem albo `tasksDone` nie jest liczbą całkowitą ≥ 0, krok zwraca wejście z samym `version: 3`
  (wtedy `validateSave` → `corrupt`). Żadne `Object.keys(null)`.
- **M-3 bez wyścigu z kartami**: zapis przy starcie uzbraja sam `createAutosaver` (timer `delayMs`), więc działa tylko
  dla `outcome.kind === 'loaded'` (jedynego, które ustawia `migrated`); zablokowany autosaver i `replace` zachowują się
  jak dziś (research, Summary 4).

## Phase 1: Format v3 i migracja starego salonu w `MIGRATIONS[2]`

Driver: tdd
Driver why: krok migracji, totalność, znacznik M-2 i fixtury to czysta logika `core` bez implementacji — failing testy na zamrożonych bajtach v2 ją prowadzą.

### Overview

H-1 (rdzeń) i M-2 w `core`: v2 → v3 z przeliczeniem salonu; build tej fazy czyta v2 i pisze v3. `remapLegacySalon` w
`main.ts`/`UIScene` zostaje do fazy 2 (na v3 jest no-opem — brak starych kluczy). Widocznie: „Zapis gry” pokazuje
„przeniesiono z wersji 2” po pierwszym zapisie zmigrowanego v2 (istniejący tekst `pl.settings.saveMigrated`).

### Changes Required:

#### 1. Zamrożone tabele i krok

**File**: `src/core/migrations/legacySalon.ts` (nowy); `tests/legacySalonMigration.test.ts` (nowy)

**Intent**: Czysta funkcja kroku na surowych danych, z dwiema zamrożonymi tabelami: stara lista (10 zadań, koszty,
`renames`) i snapshot celu v3 (7 zadań jako `{ slot: string | null; cost }`, `null` dla etapu `renovate`). Reguła B
jak w `remapLegacySalon`; znacznik M-2 = klucz `chosen` ze zbioru „tylko stare” (stara lista minus sloty celu);
nieznane klucze, które nie są stare, zostają w `chosen` bez zmian.

**Contract**: `export const LIFT_V2_SALON: (raw: unknown) => unknown` (czyta, nigdy nie mutuje; ustawia `version: 3`);
eksport tabel `LEGACY_SALON_V2`, `SALON_V3_TARGET` (dla testów). Testy: przypadki z `tests/salonRemap.test.ts`
przeniesione na surowe v2 (0..10 starych zadań → oczekiwane prefiksy i `chosen`, literały); v2 już przeliczone
(tylko nowe klucze) → to samo + `version: 3`; v2 z kluczem `armchair-2` (przyszły slot, nie stary) → nietknięte (M-2);
stary salon + nieznany nie-stary klucz → klucz przeniesiony; brak `salon` → nietknięte; zły kształt (`rooms: null`,
`salon: []`, `chosen: null`, `tasksDone: -1`, `'3'`) → nie rzuca, `decodeSave` daje `corrupt`; idempotencja
(krok na wyniku = wynik). Testy przypinające (L-1): `LEGACY_SALON_V2` = `LEGACY_SALON` z `src/data/rooms.ts` (do fazy
2), `SALON_V3_TARGET` = pierwsze 7 zadań `SALON.tasks` (slot/koszt) — `SALON` może rosnąć na końcu, snapshot nie.

#### 2. Wersja 3

**File**: `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS[2]`, `saveProblem`, `encodeSave`, komentarze „v2 save”);
`src/core/types.ts` (`SaveV3`, alias bieżącego kształtu); `tests/save.test.ts`; `tests/saveFile.test.ts` (przypadki
`saveProblem`/`validateSave` na `save-v2*.json` — „names %s”, „a valid save has no problem” — przechodzą na `save-v3.json`,
bo `saveProblem` na v2 zwraca teraz `'version'`; plan-review F2); `tests/fixtures/save-v3.json` (nowy);
`tests/fixtures/save-v2-legacy-salon.json` (nowy)

**Intent**: Podbicie wersji wzorem v1 → v2. Fixtury v1/v2 dekodują się do v3 (`migratedFrom` 1/2); `save-v3.json`
dekoduje się z `migratedFrom null` i koduje do siebie; `future` od 4.

**Contract**: `SAVE_VERSION = 3`; `MIGRATIONS = { 1, 2 }`; `saveProblem` `version !== 3`. **Testy zmieniane
świadomie**: „the current version is 2” → 3; „v2 fixtures encode back to themselves” → „v2 fixtures decode to v3
(`migratedFrom 2`) and encode as v3”, nowy „v3 fixture encodes back to itself”. `git diff --stat tests/fixtures` pokazuje
wyłącznie dwa nowe pliki.

#### 3. Szew `legacy-salon` na zamrożonym v2 i spec'e e2e

**File**: `src/testing/e2eHook.ts` (`legacySalonSession` → import `tests/fixtures/save-v2-legacy-salon.json`);
`tests/e2eSave.test.ts`; `tests/e2e/salon-art.spec.ts` (`writtenVersion` 3), `tests/e2e/save-backup-health.spec.ts`
(`writtenVersion` 3), `tests/e2e/save-migration.spec.ts` (tytuły „v3 build”, `writtenVersion` 3)

**Intent**: Szew zwraca prawdziwe bajty v2 sprzed S-16a, więc build v3 przechodzi przez `MIGRATIONS[2]` (i kopię
`backup-v2`). E2E zmieniane tylko o wersję — zachowanie (przeliczenie 4 → 4 zadania, 3 gwiazdki) bez zmian.

**Contract**: marker `legacy-salon` bez zmian; test jednostkowy szwu: odczyt to obiekt z `version: 2`, a `decodeSave` daje
salon `{ tasksDone: 4, chosen: { sofa: 2, rug: 0, 'coffee-table': 0 } }` i `migratedFrom 2`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: znacznik wraca do „dowolny nieznany klucz” → test M-2 (`armchair-2`) czerwony; krok bez strażnika kształtu → test `rooms: null` czerwony (`migration-failed` zamiast `corrupt`); `SALON_V3_TARGET` liczony z żywego `SALON` z dopisanym zadaniem w teście → test snapshotu czerwony; przywrócone; meta-check: testy jadą na surowych bajtach v2 przez `decodeSave`, nie na wywołaniu funkcji z już zwalidowaną sesją
- `tests/fixtures/save-v1*.json`, `save-v2.json`, `save-v2-fresh.json` bajt w bajt (`git diff --stat tests/fixtures` = tylko dwa nowe pliki); `SAVE_VERSION` 3
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0` (zmienione asercje wersji zielone)

#### Manual Verification:

- [reviewer] `src/core/save.ts` nadal bez importu `src/data`; tabele kroku zamrożone (literały, komentarz „never edited”); v3 bez nowych pól
- [human] Drzwi jednokierunkowe v3 (zaakceptowane w kroku 0 runu): urządzenie, które wczytało build v3, po rollbacku do buildu v2 widzi kartę `future` i gra bez zapisu do powrotu nowego buildu

---

## Phase 2: Zapis przy starcie, jedno przeliczenie i polityka kopii dla v2

Driver: tdd
Driver why: decyzja autosavera o zapisie przy starcie, pole statusu i F3/F4 to czysta logika `core` z liczalnymi operacjami fałszywego magazynu — failing testy prowadzą; sklejka `main.ts`/`UIScene` to usunięcie wywołań.

### Overview

M-3, reszta H-1 (brak podwójnego przeliczenia), M-1 (kopia v2 tą samą ścieżką) i F3/F4. Widocznie: przy
`?e2eSave=legacy-salon` lub `v1` „Zapis gry” pokazuje „przeniesiono z wersji N” bez żadnej akcji dziecka.

### Changes Required:

#### 1. Zapis przy starcie po migracji

**File**: `src/core/autosave.ts` (`WriteReason`, `AutosaveStatus`, `createAutosaver`); `tests/autosave.test.ts` (także
istniejące przypadki z `migrated` — po `advance` widzą teraz zapis startowy; plan-review F1);
`tests/e2e/save-backup-health.spec.ts` („#2 SV2-01”: zaraz po starcie `backup` to `'pending'` albo `'failed'` — zapis
startowy mógł już zużyć pierwszą próbę kopii; asercja `ops.slice(0, 4)` = trzy `backup` i `write` bez zmian; plan-review F1)

**Intent**: Gdy `options.migrated` jest ustawione, autosaver przy utworzeniu oznacza stan jako brudny i uzbraja zapis
z powodem `'migration'` (kopia najpierw, jak dziś). Pierwszy udany zapis po migracji ustawia `migrationWrittenAt`.

**Contract**: `WriteReason = 'change' | 'now' | 'hidden' | 'migration'`; `AutosaveStatus.migrationWrittenAt: number |
null` (runtime, nigdy w `SaveState`). Testy: zmigrowany start → po `advance(delayMs)` operacje `['backup', 'write']`
bez `markDirty`, `lastReason 'migration'`, `migrationWrittenAt` = `now()`; niezmigrowany start → zero operacji;
zapis padł → `migrationWrittenAt null`, kolejne próby jak dziś; `flush('hidden')` przed timerem pisze od razu.

#### 2. Kopia v2 i F3/F4

**File**: `src/core/autosave.ts` (`skipBackup`, `replace`); `tests/autosave.test.ts`

**Intent**: Logi i komentarze bez „v1/v2” na sztywno: `autosave: writing v${SAVE_VERSION} without the v${from} copy`.
F3: `replace`, którego własny zapis padł, zostawia kopię `failed` (należną) i liczy próbę w `backupFails`; `skipped`
tylko gdy zapis `replace` się udał. F4: log podaje faktyczną liczbę prób i pada dopiero po wyniku zapisu.

**Contract**: Testy: v2 zmigrowany → `store.backup` wołane z `from = 2`; `replace` z zaległą kopią, kopia pada, zapis
pada → `backup 'failed'`, następny zwykły zapis znowu próbuje kopii; kopia pada, zapis się udaje → `skipped`, log
`attempts: 1`. Test klucza: `createIdbSaveStore` `backup(raw, 2)` pisze pod `profile:default:backup-v2`
(`tests/idbStore.test.ts`).

#### 3. Jedno przeliczenie: sklejka i usunięcie

**File**: `src/main.ts` `start`; `src/scenes/UIScene.ts` `openImport`; `src/core/rooms.ts` (`remapLegacySalon` usunięte);
`src/data/rooms.ts` (`LEGACY_SALON` usunięte); `src/core/types.ts` (`LegacyRoomLayout` usunięte);
`tests/salonRemap.test.ts` (usunięty — przypadki żyją w `tests/legacySalonMigration.test.ts`); `tests/roomsData.test.ts`;
`tests/legacySalonMigration.test.ts` (test przypinający starą listę do danych → literały)

**Intent**: `start` nie przelicza (sesja z `decodeSave` jest już v3); log `Save migrated from v${from}` raz, gdy
`migratedFrom !== null`; `repairCurrentRoom` z `repairedFrom !== null` woła `saver.markDirty()` po utworzeniu autosavera
(naprawiony pokój też trafia do zapisu). Podgląd importu: `saveSummary(s, ROOMS)` bez przeliczenia.

**Contract**: grep `remapLegacySalon|LEGACY_SALON|LegacyRoomLayout` w `src/` = 0 trafień. `tests/deviceSaveWiring.test.ts`
(czyta `openImport` źródłowo) zielony bez zmian albo zaktualizowany o brak przeliczenia.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `createAutosaver` bez uzbrojenia przy `migrated` → test „migrated start writes without a change” czerwony; F3 przywrócone (`skipped` przed wynikiem zapisu) → test należnej kopii czerwony; przywrócone; meta-check: testy liczą operacje fałszywego magazynu, nie samo pole statusu
- `tests/fixtures/` v1/v2 bajt w bajt; grep `remapLegacySalon|LEGACY_SALON|LegacyRoomLayout` w `src/` pusty
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `migrationWrittenAt` i `'migration'` tylko w runtime; jeden punkt decyzji o zapisie przy starcie (autosaver), brak drugiego `markDirty` w `main.ts` dla migracji; logi kopii bez „v1” na sztywno
- [visual] „Zapis gry” przy `?e2eSave=legacy-salon` zaraz po wejściu do gry (bez rundy): linia „przeniesiono z wersji 2” — 1440 i 1024 szerokości

---

## Phase 3: Limit czasu ładowania plików w konfiguracji gry

Driver: impl
Driver why: klucz `loader` w `createGame` i szew w `BootScene`/haku to sklejka konfiguracji Phasera bez czystej logiki do prowadzenia testem; skutek widać tylko w przeglądarce (e2e fazy 5).

### Overview

H-2: zawieszony plik w `BootScene.preload` kończy się błędem ładowania po limicie → istniejąca ścieżka zastępstwa i
licznik „Obrazki”. Bez nowego UI.

### Changes Required:

#### 1. Liczby i konfiguracja

**File**: `src/data/balance.ts` (`loader: { timeoutMs: 12000, maxRetries: 1 }` + komentarz); `src/main.ts` `createGame`

**Intent**: `GameConfig.loader = { timeout, maxRetries }` z `balance.loader`; najgorszy przypadek na plik (1 + 1) × 12 s
= 24 s, pliki równolegle. Komentarz: największy plik 289 KB, ~6 s przy 50 KB/s na zimnym pierwszym starcie; po
pierwszym starcie pliki z cache service workera.

**Contract**: `balance.loader.timeoutMs`, `balance.loader.maxRetries`; nowy `tests/loaderBalance.test.ts` przypina: `timeoutMs` w 5000..20000, `maxRetries` w 0..2, `(maxRetries + 1) × timeoutMs ≤ 30000`.

#### 2. Szew `stall`

**File**: `src/testing/e2eHook.ts` (`E2EArtSeam` + `'stall'`, `E2E_LOADER_TIMEOUT_MS = 2000`); `src/main.ts`
`createGame` (pod `__E2E_HOOK__ && art === 'stall'`: `{ timeout: E2E_LOADER_TIMEOUT_MS, maxRetries: 0 }`);
`tests/e2eSave.test.ts` (parsowanie `e2eArt`, dziś bez testu — nowy przypadek), `tests/e2eHookGuard.test.ts`

**Intent**: `?e2eArt=stall` tylko skraca limit; samo zawieszenie robi spec (`page.route`, który nie odpowiada). Kolejka
plików bez zmian (inaczej niż `missing`). Marker `e2eArt` już pokrywa wartość.

**Contract**: `e2eArt('?e2eArt=stall') === 'stall'`; `BootScene` traktuje `stall` jak brak szwu przy kolejkowaniu.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (test liczb loadera, parsowanie szwu)
- Deliberate break: `maxRetries: 3` w `balance.loader` → test budżetu czerwony; przywrócone; meta-check: test chroni budżet czasu, nie samo istnienie klucza (dowód zachowania w fazie 5)
- `npm run build` drukuje `e2e hook: absent (`; `grep -c E2E_LOADER_TIMEOUT dist/_app/*.js` = 0; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] liczby tylko w `balance.ts`; szew tylko pod `__E2E_HOOK__`; komentarz z budżetem czasu
- [human] Na iPadzie (WebKit) plik zawieszony (np. ograniczenie sieci w Web Inspectorze) kończy ładowanie po ≤ 24 s i gra startuje na zastępstwach

---

## Phase 4: Notatka wdrożeniowa, dokumentacja i follow-upy

Driver: impl
Driver why: zmiany tylko w tekstach (`deploy/README.md`, `CLAUDE.md`, komentarze `pl.ts`/`balance.ts`, follow-upy) — brak logiki do prowadzenia testem.

### Overview

Domknięcie: zasada rollbacku, zdanie o v3 w `CLAUDE.md`, komentarze bez „v1/v2” na sztywno, follow-upy z triggerem.

### Changes Required:

#### 1. `deploy/README.md`

**File**: `deploy/README.md` (sekcja rollbacku)

**Intent**: Jedna notatka: rollback poniżej buildu v3 pokazuje urządzeniom, które wczytały v3, kartę `future` (postęp
bezpieczny, gra bez zapisu do powrotu nowego buildu). Domyka M-S1 (`save-observability-c1-c2`). Nic innego w `deploy/`.

#### 2. `CLAUDE.md` i komentarze

**File**: `CLAUDE.md` („Current state”); `src/data/pl.ts` (komentarz DESIGN-GAP 95); `src/data/balance.ts` (komentarz
`backupAttempts`: „raw save of the previous version”); `src/core/saveHealth.ts` (komentarz)

**Intent**: Jedno zdanie: format v3, `MIGRATIONS[2]` przelicza stary salon na zamrożonych tabelach
(`src/core/migrations/legacySalon.ts`), kopia `backup-v2`, zapis przy starcie po migracji (`migrationWrittenAt`),
`balance.loader`, szew `?e2eArt=stall`; zdania o `remapLegacySalon`/`LEGACY_SALON` usunięte lub poprawione.

#### 3. Follow-upy

**File**: `context/changes/salon-load-health/follow-ups/review-fixes.md` (nowy)

**Intent**: Każdy wpis z `Trigger:`: M-4, M-5, M-6, L-3..L-8, L-5r (audyt 2026-10-15_2010); odczyt kopii z aplikacji
(SV2-04/opcja B, trigger „a parent report of lost progress after an update”); e2e dwóch buildów (trigger „the next
save-format change (v4)”); F7/SRR-09/SRR-01 (trigger „a migration step that can throw”); przykład błędu w historii
(trigger „a save that changes the shape of a mistake example, or S-17”); limit `FontFace` (trigger „a parent report of a
blank start”); WebKit e2e (trigger „a WebKit project in playwright.config.ts”); dwie karty jednego originu
(`BroadcastChannel`, trigger przeniesiony z „first save-format change” na „a parent report of lost progress with two
tabs open, or the next save-format change (v4)”; plan-review F6).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break: ścieżka w `CLAUDE.md` na nieistniejący plik → FAIL; przywrócone
- Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:` (`grep -c` wpisów = `grep -c 'Trigger:'`)
- `git diff --stat main -- deploy/` = tylko `deploy/README.md`; pełna bramka lokalna zielona (`bash deploy/test-martynka-deploy.sh` zielony)

#### Manual Verification:

- [reviewer] Seam sweep: brak martwych odwołań do `remapLegacySalon`/`LEGACY_SALON` w kodzie, komentarzach i `CLAUDE.md`; notatka rollbacku zgodna z `pl.saveFuture`

---

## Phase 5: Stary salon zapisany jako v3 przy starcie i zawieszony plik nie blokuje startu — e2e (#2, #15)

Driver: e2e
Driver why: ryzyko #2 (postęp przeżywa aktualizację: migracja w prawdziwym autosaverze z kopią i zapisem przy starcie) i #15 (zamrożony ekran bez słowa: zawieszony loader) istnieją tylko w przeglądarce; zbudowane w fazach 1–3, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/salon-load-health.spec.ts` w projekcie `chromium-hook` (`salon-load-health` dopisane do
`ROUND_SPEC` w `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-load-health.spec.ts` (nowy); `tests/e2e/support/hook.ts` (typ `save`: `migrationWrittenAt`,
`lastReason`); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**: (a) „#2 H-1/M-3 a salon saved under the old list as v2 is written as v3 at start, copy first, with no
child action”: `?e2eSave=legacy-salon&e2eVariant=off` (zapis bez ucznia, `learner: null`) → przed jakimkolwiek tapnięciem
`store.ops.slice(0, 2)` = `['backup', 'write']`, `writtenVersion 3`, `save.migratedFrom 2`, `save.migrationWrittenAt`
nie `null`, `lastReason 'migration'`; pokój: `tasksDone 4`, `chosen { sofa: 2, rug: 0, 'coffee-table': 0 }`, gwiazdki 3;
„Zapis gry” (za bramką dorosłego): tekst `pl.settings.saveMigrated` z `from 2`. (b) „#2 M-3 a v1 save is written as v3
at start”: `?e2eSave=v1` → bez rundy `writtenVersion 3`, jedna operacja `backup`. (c) „#15 H-2 a picture that never
answers ends the loading after the limit and is counted as missing”: `test.use({ serviceWorkers: 'block' })`,
`page.route('**/assets/rooms/salon/furnishings-before.webp', () => {})` (nigdy nie odpowiada), `?e2eArt=stall` → ekran
powitania osiągnięty (`screen 'welcome'`); po `passWelcome` `roomArtHealth.missing ≥ 1` i po przejściu do pokoju pokój
grywalny na zastępstwach.

**Kolejność asercji (plan-review F3)**: migawka haka na ekranie powitania ma tylko `screen`, `learner`, `settings`,
`inputEnabled`, `save`, `artHealth` — bez `room` i `roomArtHealth`, a „Zapis gry” otwiera się kołem zębatym HUD-u, którego
na powitaniu nie ma. Dlatego w (a) na powitaniu sprawdzane są tylko `save` i `save.store` (zapis startowy), a pokój i
„Zapis gry” dopiero po `passWelcome` (pokój przez drogę `toRoom` z `tests/e2e/salon-art.spec.ts` albo pominięty, bo
przeliczenie pokoju już sprawdza „#2 a salon saved under the old task list…”); w (c) `roomArtHealth` po `passWelcome`.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty z DOM po kluczach `pl` (dokładne napisy
przycisków per stan); stan z haka tylko do odczytu; nowy kontekst = świeże urządzenie; nigdy IDB z testu;
`e2eVariant=off` przy graniu. **Chromium niedostępny w sesji agenta**: protokół request-file —
`e2e-request-p5.md`, patche `e2e-break-p5a.patch` … `e2e-break-p5c.patch` (tylko kod produkcyjny), `STATUS: BLOCKED —
e2e needs orchestrator run (request file written)`; agent kończący commituje spec po wyniku orkiestratora. Każdy
oczekiwany czerwony test osobno (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/salon-load-health.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + 3`
- Deliberate break (patch `e2e-break-p5a.patch`): `createAutosaver` bez uzbrojenia przy `migrated` → (a) czerwony na braku `write` przed jakimkolwiek tapnięciem; (b) może zostać zielony, bo fixture v1 ma `currentRoom` „living”, a naprawa pokoju (`repairedFrom`) sama woła `markDirty()` (plan-review F4) — tylko (a) jest dowodem; meta-check: dowodzi M-3 w prawdziwym starcie, nie tylko w `core`
- Deliberate break (patch `e2e-break-p5b.patch`): `MIGRATIONS[2]` zwraca wejście z samym `version: 3` → (a) czerwony na `tasksDone`/`chosen`
- Deliberate break (patch `e2e-break-p5c.patch`): `createGame` bez klucza `loader` → (c) czerwony (powitanie nie pojawia się w limicie testu); przywrócone; meta-check: plik naprawdę wisi (SW zablokowany), a nie odrzuca
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `MIGRATIONS[2]`: 0..10 starych zadań → prefiksy i `chosen` (literały), idempotencja, M-2 (przyszły slot nietknięty,
  nieznany nie-stary klucz przeniesiony), totalność na złym kształcie (`corrupt`, nie `migration-failed`), snapshot
  celu = prefiks `SALON.tasks`; fixtury v1/v2/v2-legacy → v3, v3 → siebie, `future` od 4.
- Autosaver: zapis przy starcie po migracji (operacje, powód, `migrationWrittenAt`), brak przy niezmigrowanym, kopia
  z `from = 2`, F3/F4; `createIdbSaveStore` klucz `backup-v2`.
- `balance.loader` budżet; parsowanie szwu `stall`; strażnik haka.

### Integration Tests:

- `npm run build` (strażnik szwów); e2e: zmienione wersje w trzech spec'ach (faza 1), trzy nowe testy (faza 5).

### Manual Testing Steps:

1. Zrzut „Zapis gry” przy `?e2eSave=legacy-salon` bez rundy (faza 2, bramka wizualna; fallback Playwright za bramką dorosłego).
2. `[human]` iPad: zawieszony plik grafiki kończy ładowanie (faza 3).
3. `[human]` drzwi jednokierunkowe v3 (faza 1).

## Performance Considerations

Jeden zapis więcej na starcie zmigrowanej sesji (raz w życiu urządzenia na wersję). Limit loadera nie dotyka zdrowych
plików; przy zawieszeniu start trwa ≤ 24 s zamiast nieskończenie.

## Migration Notes

Format v2 → v3. Urządzenie z v2 (salon już przeliczony przez S-16a): krok zmienia tylko `version`, kopia `backup-v2`,
zapis v3 przy starcie. Urządzenie z v2 sprzed S-16a (stary salon): przeliczenie w kroku, kopia surowego v2, zapis v3.
Urządzenie z v1: łańcuch v1 → v2 → v3, jedna kopia `backup-v1`. Rollback do buildu v2: karta `future`, brak zapisu —
`[human]` 1.6, notatka w `deploy/README.md`.

## Known risks

- **Drzwi jednokierunkowe**: rollback poniżej v3 zatrzymuje zapis na urządzeniach, które już wczytały v3, do ponownego
  wdrożenia. Zaakceptowane przez opiekuna (krok 0); `[human]` 1.6.
- **WebKit**: zachowanie `xhr.timeout` przy zawieszeniu nieudowodnione lokalnie (tylko Chromium); `[human]` 3.5.
- **Wolna sieć przy pierwszym starcie**: plik > 12 s pobierania pada (po jednym ponowieniu) i jest zastępstwem do
  następnego startu (wtedy z cache SW). Świadomie — lepsze niż wieczny pasek.
- **Chromium w sesji agenta**: faza 5 w protokole request-file; zrzut fazy 2 przez fallback Playwright.
- **Kopia przed zapisem startowym (plan-review F8)**: gdy pierwsza próba kopii przy starcie padnie, `attempt` rzuca przed
  `store.write`, a pętla `save` nie uzbraja timera ponownie — zapis v2 na urządzeniu zostaje nietknięty do następnej zmiany
  dziecka albo `flush` (polityka `backupAttempts` bez zmian). M-3 („bez powtórki przy każdym starcie”) obowiązuje więc od
  udanej kopii albo trzeciej porażki; świadomie — kopia ma pierwszeństwo przed szybkim zapisem v3.
- **Powód zapisu startowego (plan-review F4)**: `markDirty()` z naprawy pokoju przezbraja timer z powodem `'change'`, więc
  `lastReason 'migration'` jest gwarantowany tylko bez naprawy; `migrationWrittenAt` ustawia pierwszy udany zapis po
  migracji niezależnie od powodu.
- **Limit loadera a odczyt zapisu (plan-review F7)**: odczyt IndexedDB (`balance.save.loadTimeoutMs` 5 s, karta `slow`)
  kończy się przed `createGame`; limit loadera biegnie dopiero potem, przy widocznym pasku `LoadingScreen` — limity się nie
  sumują w pustym ekranie. Start offline z cache service workera odpowiada od razu i limitu nie dotyka.

## References

- Research: `context/changes/salon-load-health/research.md`; change: `context/changes/salon-load-health/change.md`
- Audyt obserwowalności 2026-10-15_2010 (PR #63): H-1, H-2, M-2, M-3 (M-1, L-1, L-2 przy okazji)
- Kontrakt runu `context/runs/2026-10-15-fix-salon-load-health/agent-contract.md` („Slice-specific rules”); profil `context/foundation/autonomous-run.md` § 2, § 8, § 9
- Test-plan `context/foundation/test-plan.md` ryzyka #2, #10, #15; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-14-minigame-daily-puzzle/` (v1 → v2, `backup-v1`, `future`), `context/archive/2026-10-15-save-v2-backup-health/plan.md` (polityka kopii, request-file, F3/F4), `context/archive/2026-10-15-final-art-salon/` (S-16a: `remapLegacySalon`, szew `legacy-salon`)
- Phaser 4.2.1: `node_modules/phaser/src/core/Config.js` (`loaderTimeout`, `loaderMaxRetries`), `loader/XHRLoader.js`, `loader/File.js` `onError`

## Autonomous decisions

1. **Tabele migracji zamrożone w `src/core/migrations/legacySalon.ts`, krok kompletny w domyślnym `MIGRATIONS`.**
   Odrzucone: `save.ts` importuje `src/data/rooms.ts` (łamie nagłówek „no data imports”, wynik dryfuje z rosnącym
   `SALON`), wstrzykiwanie przez `decodeSave(raw, migrations)` (cztery miejsca wywołania, pominięte czyta v2 jako
   `unknown-version`). Dlaczego: migracja musi być czystą funkcją bajtów (research). Co zmieniłoby: reguła zakazująca
   tablic treści w `core` albo decyzja, że cel przeliczenia ma podążać za przyszłymi zadaniami salonu.
2. **`LEGACY_SALON` i `LegacyRoomLayout` usunięte z `src/data`/`types` w fazie 2; stara lista żyje tylko w kroku.**
   Odrzucone: kopia w danych + test równości (dwie prawdy o czymś, co z definicji się nie zmienia). Co zmieniłoby:
   drugi czytelnik starej listy w runtime.
3. **M-2: nieznane nie-stare klucze w starym salonie przenoszone do `chosen`.** Odrzucone: odrzucanie ich jak
   `remapLegacySalon`. Dlaczego: audyt M-2 „keep unknown non-legacy keys”; `validateSave` je przyjmuje. Co zmieniłoby:
   slot, który dziś ma kolidujący klucz w nowym pokoju.
4. **M-3: autosaver sam uzbraja zapis przy `options.migrated` (`WriteReason 'migration'`, `migrationWrittenAt`).**
   Odrzucone: `saver.markDirty()` w `main.ts` (logika poza testami `core`), synchroniczny zapis przed grą (kolejność z
   kartami `slow`/`unavailable`). Naprawiony pokój (`repairedFrom`) → zwykłe `markDirty()` w `main.ts`. Co zmieniłoby:
   potrzeba zapisu przy starcie z innego powodu niż migracja (wtedy jedna opcja `dirtyAtStart`).
5. **F3/F4 jadą z tą zmianą (faza 2).** Dlaczego: trigger „the v3 save format” odpalił, ten sam symbol (`replace`),
   kopia v2 dziedziczy tę samą politykę. Co zmieniłoby: plan-review wskazujący, że F3 zmienia zachowanie dialogów
   importu/resetu ponad testy.
6. **`balance.loader = { timeoutMs: 12000, maxRetries: 1 }`.** Odrzucone: domyślne `maxRetries 2` (36 s), 5 s (289 KB
   na wolnej sieci przy pierwszym starcie). Dlaczego: ≤ 24 s najgorszego przypadku; po pierwszym starcie pliki z cache
   SW. `maxRetries` zmienia też liczbę ponowień dla zwykłych błędów (2 → 1) — świadomie. Co zmieniłoby: pomiar na
   iPadzie (`[human]` 3.5) albo raport pustego startu na wolnej sieci.
7. **Dowód H-2 w e2e: `serviceWorkers: 'block'` + niekończący się `page.route` + szew `?e2eArt=stall` skracający limit.**
   Odrzucone: middleware serwera (nowa infrastruktura), szew, który sam „zawiesza” plik w kodzie (testowałby szew, nie
   loader). Co zmieniłoby: protokół orkiestratora zakazujący `page.route` albo projekt WebKit.
8. **E2E cytuje #2 i #15.** #2: postęp po aktualizacji formatu; #15: zamrożony ekran bez słowa (zawieszony pasek
   ładowania). Co zmieniłoby: nowe ryzyko w test-planie dla grafiki.
9. **Notatka w `deploy/README.md` mimo zasady „No changes under deploy/”.** Dlaczego: kontrakt runu wprost pozwala na tę
   jedną notatkę (slice rules); README nie jest wykonywany ani synchronizowany jako skrypt. Co zmieniłoby: opiekun
   uznający każdą zmianę w `deploy/` za wymagającą `sync`.
10. **Fazy 1–2 `tdd`, 3–4 `impl`, 5 `e2e`.** Dlaczego: kontrakt (małe fazy, każda zielona); v3 i szew `legacy-salon` w
    jednej fazie, bo po podbiciu wersji szew zbudowany `encodeSave` przestałby testować migrację.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Format v3 i migracja starego salonu w `MIGRATIONS[2]`

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — 826150c
- [x] 1.2 Deliberate break: znacznik „dowolny nieznany klucz” / krok bez strażnika kształtu / snapshot z żywego `SALON` → odpowiednie testy czerwone; przywrócone; meta-check — 826150c
- [x] 1.3 Fixtury v1/v2 bajt w bajt (`git diff --stat tests/fixtures` = tylko dwa nowe pliki); `SAVE_VERSION` 3 — 826150c
- [x] 1.4 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0` — 826150c

#### Manual

- [ ] 1.5 [reviewer] `src/core/save.ts` bez importu `src/data`; tabele kroku zamrożone; v3 bez nowych pól
- [ ] 1.6 [human] Drzwi jednokierunkowe v3: po rollbacku do buildu v2 urządzenie z v3 widzi kartę `future` i gra bez zapisu

### Phase 2: Zapis przy starcie, jedno przeliczenie i polityka kopii dla v2

#### Automated

- [x] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [x] 2.2 Deliberate break: brak uzbrojenia przy `migrated` / F3 przywrócone → odpowiednie testy czerwone; przywrócone; meta-check
- [x] 2.3 Fixtury v1/v2 bajt w bajt; grep `remapLegacySalon|LEGACY_SALON|LegacyRoomLayout` w `src/` pusty
- [x] 2.4 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0` — orchestrator note: 98 passed --workers=4 on 5009efd, SV2-01 green with the edited assertion — 5009efd

#### Manual

- [ ] 2.5 [reviewer] `migrationWrittenAt` i `'migration'` tylko w runtime; jeden punkt decyzji o zapisie przy starcie; logi kopii bez „v1” na sztywno
- [ ] 2.6 [visual] „Zapis gry” przy `?e2eSave=legacy-salon` bez rundy: linia „przeniesiono z wersji 2” — 1440 i 1024

### Phase 3: Limit czasu ładowania plików w konfiguracji gry

#### Automated

- [x] 3.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (liczby loadera, parsowanie szwu) — orchestrator note: 98 passed --workers=4 on 903c70a; unit 2925 (p2 baseline 2919 + 6)
- [x] 3.2 Deliberate break: `maxRetries: 3` → test budżetu czerwony; przywrócone; meta-check — 903c70a
- [x] 3.3 `npm run build` drukuje `e2e hook: absent (`; `E2E_LOADER_TIMEOUT` nieobecne w `dist/`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — orchestrator note: 98 passed --workers=4 on 903c70a (+0); dist/ has no E2E_LOADER_TIMEOUT (p3 build check)

#### Manual

- [ ] 3.4 [reviewer] Liczby tylko w `balance.ts`; szew tylko pod `__E2E_HOOK__`; komentarz z budżetem czasu
- [ ] 3.5 [human] iPad (WebKit): zawieszony plik kończy ładowanie po ≤ 24 s i gra startuje na zastępstwach

### Phase 4: Notatka wdrożeniowa, dokumentacja i follow-upy

#### Automated

- [x] 4.1 `validate-rule-files.sh` PASS; deliberate break w `CLAUDE.md` → FAIL; przywrócone — 27406ab
- [x] 4.2 Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:` — 27406ab
- [x] 4.3 `git diff --stat main -- deploy/` = tylko `deploy/README.md`; pełna bramka lokalna zielona — 27406ab (e2e not needed: docs/comments only)

#### Manual

- [ ] 4.4 [reviewer] Seam sweep: brak martwych odwołań do `remapLegacySalon`/`LEGACY_SALON`; notatka rollbacku zgodna z `pl.saveFuture`

### Phase 5: Stary salon zapisany jako v3 przy starcie i zawieszony plik nie blokuje startu — e2e (#2, #15)

#### Automated

- [ ] 5.1 `npx playwright test tests/e2e/salon-load-health.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + 3`
- [ ] 5.2 Deliberate break p5a: brak uzbrojenia przy `migrated` → (a) czerwony ((b) może zostać zielony przez naprawę pokoju); meta-check
- [ ] 5.3 Deliberate break p5b: `MIGRATIONS[2]` bez przeliczenia → (a) czerwony
- [ ] 5.4 Deliberate break p5c: `createGame` bez `loader` → (c) czerwony; przywrócone; meta-check (plik naprawdę wisi)
- [ ] 5.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
