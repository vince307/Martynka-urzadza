# Minigry (Hasło z wyników, Zakrywanka) i zagadka dnia za podwójne gwiazdki — Implementation Plan

## Overview

Slice roadmapy **S-15** (`minigame-daily-puzzle`, etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`, gałąź
`feat/minigame-daily-puzzle` z `main` @ `1441161`. Co kilka rund dziecko zamiast zwykłej rundy dostaje wariant:

- **Hasło z wyników** („Ukryte słowo” z kitu expansion) — 5–6 działań z własnej puli ucznia, 3 kafelki odpowiedzi,
  każde rozwiązane działanie odsłania kolejną literę nazwy mebla salonu;
- **Zakrywanka** („Kostki · 0–12”) — 13 rzutów dwiema kostkami (`+`/`−`, wynik 0–12), dziecko stuka wynik na planszy
  13 pól, każdy rzut trafia w jeszcze odkryte pole;
- **Zagadka dnia** — jedna oryginalna zagadka LOGIC z puli 15 (E3–E4), raz na dzień kalendarzowy, gwiazdki ×2.

Stan harmonogramu (licznik rund, ostatnia minigra, dzień i rotacja zagadek) jest trwały, więc format zapisu przechodzi
na **v2** (zatwierdzony przez opiekuna) — jako pierwsza, bezpieczna faza. Przy okazji zamykamy wyzwolone follow-upy
zapisu: L-S1 (`migration-failed`), kopia `backup-v1`, O1 (karta zapisu `future`), S12-09, S12-14 oraz kolejność
M-1/M-2/M-13 w `TaskScene` dla nowej gałęzi.

## Current State Analysis

Z `research.md` (commit `adbb9a6`) i `change.md`, potwierdzone odczytem w tym kroku:

- **Zapis**: `SAVE_VERSION = 1`, `MIGRATIONS` pusty (`src/core/save.ts`); `decodeSave` → `corrupt` / `future` (`from >
  SAVE_VERSION`) / `unknown-version`, wyjątek kroku migracji łapany jako `corrupt` bez przyczyny (L-S1);
  `saveProblem`/`validateSave`/`encodeSave` mają wpisane `version: 1`; `LoadOutcome.loaded` niesie `migratedFrom`, którego
  `main.ts` nie używa; `SaveStore` (`src/core/autosave.ts`) ma tylko `read`/`write`; `replaceGate` i `deviceSaveView`
  (`src/core/saveFile.ts`) kluczują na `loadReason === 'future'` (SIR-01, fix #48), nie na numerze wersji.
  Fixtures: `tests/fixtures/save-v1.json`, `save-v1-fresh.json` (zamrożone).
- **Runda**: `TaskScene.freshRound` ma gałęzie rozgrzewka / `?e2eSkills` / adaptacyjna → `startRound(tasks, rules)`;
  `finishRound` → `endRound(…, 'warmup' | 'round', …)` + `flush('now')`; gwiazdki płyną po każdej odpowiedzi przez
  `syncStars` → `earn(delta)`. `RoundRules` (`length`, `starPerTask`, `cleanRoundBonus`) to argument — ×2 = reguły rundy.
- **Brak** czegokolwiek o minigrach, zagadkach, dniu i liczniku rund (`src/`); `LOGIC` jest tylko typem kroku E6.11 bez
  umiejętności. `main.ts` liczy `month` raz (`?e2eMonth`); „sceny nie wołają `Date`” (ale `TaskScene` woła `Date.now()`
  dla ziarna i historii).
- **HUD** (`UIScene`, `HUD_LAYOUT`) nie ma tytułu; kit expansion ma tytuły „Kostki · 0–12”, „Ukryte słowo”.
- **Kit** (`designs/martynka-expansion-v1/`, tylko do odczytu): ekrany obu minigier, kostka 150 px, plansza 7 kolumn ×
  160 (drugi rząd od kolumny 2), kafle liter 132 × 138, 3 kafelki odpowiedzi 312 × 138, karta ukończenia; brak ekranu
  zagadki dnia, oznaczenia ×2 i zapowiedzi wariantu.
- **E2E**: hak `src/testing/e2eHook.ts` (`e2eMonth`, `e2eStars`, `e2eSave` z `unreadable|corrupt|unavailable|hang|writefail`,
  `e2eSkills`, `e2eArt`), znaczniki w `vite/e2eHookGuard.mjs` (`E2E_HOOK_MARKERS`, test w `tests/e2eHookGuard.test.ts`).
  Specy grające wiele zwykłych rund w jednym kontekście: `adaptive.spec` (do 12), `room-purchase.spec` (do 4),
  `parent-settings.spec` (3+), `save-transfer.spec` (rundy z przeładowaniem w tym samym kontekście).
- `docs/design-gaps.md`: ostatni wiersz **78** — ten slice zaczyna od **79**. Plik lekcji w `context/foundation/` nie
  istnieje (sprawdzone) — żadna lekcja nie obowiązuje; stosujemy lekcje z archiwów S-13/S-13b (hak czyta stan widżetu,
  nie prostokąt układu; czas e2e mierzony; w specu `serial` każdy oczekiwany czerwony uruchamiany osobno `-g`).
- Baseline (kontrakt): `main` @ `1441161`: unit `2224 passed`, e2e `63 passed`. Każda faza mierzy na gałęzi i raportuje
  `<baseline gałęzi> + N`.

## Desired End State

- Build v2 wczytuje każdy zapis v1 (oba zamrożone fixtures i prawdziwy zapis w przeglądarce przez `?e2eSave=v1`) z
  identycznymi gwiazdkami, pokojem, etapem i opanowaniem, dopisuje blok `variants` z wartościami startowymi i przed
  pierwszym nadpisaniem odkłada kopię `profile:default:backup-v1`. Zapis v3 jest `future` i nigdy nie jest nadpisywany;
  wyjątek kroku migracji to `migration-failed` (stary zapis nietknięty, eksport dostępny). Plik eksportu v1 importuje się.
- Po 3 ukończonych zwykłych rundach (rozgrzewka się nie liczy) 4. runda jest wariantem: zagadka dnia, jeśli etap ma
  pulę (E3–E4) i dziś jej jeszcze nie było, inaczej minigra na zmianę z poprzednią. Wariant nie zmienia opanowania,
  odblokowań ani łagodzenia; licznik i dzień zapisują się na końcu wariantu (`flush('now')`). Przerwany wariant
  (przeładowanie, zmiana etapu przez rodzica) wraca w następnej rundzie.
- Zagadka dnia płaci 2 gwiazdki za pierwszą i drugą próbę (0 za przepisanie po rozwiązaniu); minigry 1 gwiazdkę za
  zadanie, bez premii. Nigdy nie odejmujemy gwiazdek, nie ma czasu ani stanu porażki.
- Weryfikacja: pełna bramka lokalna zielona, unit `2224 + N`, e2e `63 + 8` (nowe specy faz 11–13), `e2e hook: absent (`
  w `dist/` (nowe znaczniki `e2eDay`, `e2eVariant`).

### Key Discoveries:

- `src/core/save.ts` `decodeSave`: jedyne porównanie wersji to `from > SAVE_VERSION` → podbicie do 2 automatycznie czyni v3
  `future`; SIR-01 trzyma się, bo strażnicy kluczują na powodzie.
- `src/core/autosave.ts` `createAutosaver` `attempt` / `onFirstWrite`: miejsce na kopię przed pierwszym zapisem.
- `src/scenes/TaskScene.ts` `freshRound`/`finishRound`/`advance`/`applyParentStage`: trzecia gałąź rodzaju rundy;
  `round.ts` jest niezależny od długości (13 rzutów to `length: 13`).
- `src/core/round/hints.ts` `firstHint`/`solutionSteps`/`leaksAnswer` obsłużą zagadki i rzuty bez zmian.
- `tests/save.test.ts` buduje przypadek `future` z `version: 2` i ma blok „the v1 format did not change” — zmieniają się
  celowo (`SAVE_VERSION + 1`; „każdy fixture v1 dekoduje się do oczekiwanej sesji v2”).

## What We're NOT Doing

- Pozostałe minigry z ZADANIA § 5 (Ścieżka, Łańcuch na czas, Ślimak, Kolorowanie, Sklepik), zagadki dla E1–E2/E5–E6,
  pula 30–50 na etap (PRD Non-goals „po v1”), przyciski minigier w pokoju (`room-chooser` kitu, gap 86).
- Przycisk „Podpowiedź”/„Pokaż”/„Spróbuj” na żądanie z kitu (gap 83) i gwiazdka za „Pokaż” (gap 84) — jedna maszyna
  stanów `round.ts`.
- Rysunki do zagadek (szalki z dwoma ładunkami, przelewanie) — zagadki tylko tekstowe.
- Liczenie wyników wariantów do opanowania; karta zapowiedzi wariantu i odmowa wariantu.
- Prawdziwy e2e dwóch buildów (trzeci serwer jednego originu) — zamiennik `?e2eSave=v1`; follow-up z triggerem.
- S13-06 (podgląd pomyłek rodzica), dwie instancje / S12-15, S12-02/03/11 (migracja nie idzie przez `replace`),
  S12-07/08/12/13, część M-S1 w `deploy/` (kontrakt: bez zmian w `deploy/`), lektor H-3/H-4, drag F4/F5.
- Zmiany w `deploy/`, nowe pokoje, timery w jakiejkolwiek formie.

## Implementation Approach

Kolejność: **zapis najpierw** (fazy 1–3: format i migracja, bezpieczeństwo migracji, teksty zapisu i szew e2e), potem
czysta logika (4: harmonogram i dzień, 5: pula zagadek, 6: rundy minigier), potem scena (7: rodzaj rundy + zagadka
dnia, 8: Hasło, 9: Zakrywanka), seam sweep (10) i trzy fazy e2e (11–13). Minigry włącza lista
`balance.variants.minigames` — pusta w fazie 7, `['word']` w fazie 8, `['word', 'dice']` w fazie 9 — więc każda faza jest
zielona i nigdy nie losuje wariantu, którego ekranu jeszcze nie ma. Każdy wariant to „lista `Task` + `RoundRules`” —
jedna maszyna stanów, jedna reguła podpowiedzi i gwiazdek; nowe są tylko plansze (≤ 2 nowe komponenty UI na fazę).

Istniejące specy: hook build domyślnie działa jak produkcja (prawdziwy harmonogram). Faza 7 dodaje szew
`?e2eVariant=off|word|dice|puzzle` i dopisuje `e2eVariant=off` do każdego specu `chromium-hook`, który w jednym
kontekście przeglądarki może dojść do 4. zwykłej rundy (kandydaci: `adaptive`, `room-purchase`, `parent-settings`,
`save-transfer`; implementujący liczy tapnięcia `nextRound` + przeładowania w każdym specu i zapisuje listę w
handoffie). Licznik żyje w zapisie, więc liczą się też rundy przed przeładowaniem w tym samym kontekście.

## Critical Implementation Details

**Kontrakt zapisu v2 (faza 1; zależą od niego 2–4, 7).**

```ts
interface VariantState {
  roundsSince: number;                  // completed ordinary rounds since the last FINISHED variant (int >= 0)
  lastMinigame: 'word' | 'dice' | null; // alternation
  puzzleDay: string | null;             // local 'YYYY-MM-DD' of the last FINISHED daily puzzle
  puzzlesDone: string[];                // puzzle ids finished in the current rotation cycle
}
interface SaveV2 extends Omit<SaveV1, 'version'> { version: 2; variants: VariantState }
type SaveState = SaveV2;
// MIGRATIONS[1] = (v1) => ({ ...v1, version: 2, variants: { roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] } })
```

`SaveV1` zostaje jako typ wejścia migracji. Nieznane id w `puzzlesDone` są zachowane i ignorowane przy użyciu.
`REGISTRY_KEYS.variants` dołącza do `SAVE_KEYS`.

**Harmonogram (faza 4).** `nextRoundKind(state, ctx) → 'round' | 'word' | 'dice' | 'puzzle'`, `ctx = { stageId, today,
hasPool(stageId), minigames: readonly ('word'|'dice')[], wordAvailable: boolean, rules: { everyRounds } , forced?: VariantKind | 'off' }`:
`forced === 'off'` → `'round'`; `roundsSince < everyRounds` i brak `forced` → `'round'`; inaczej `'puzzle'`, gdy `hasPool`
i `puzzleDay !== today`; inaczej minigra z listy różna od `lastMinigame` (pominięta, gdy niedostępna, np. `word` bez
zadań); brak kandydata → `'round'`. `forced` = rodzaj z szwu (tylko build haka) traktowany jak „licznik osiągnięty” w
każdej zwykłej rundzie, dopóki szew jest w adresie; reguła dnia dla zagadki nadal obowiązuje (zagadka już dziś → minigra),
a niedostępny rodzaj spada na kolejnego kandydata. `afterRound(state, kind, today, puzzleId?)`: `'round'` → `roundsSince + 1`; wariant →
`roundsSince = 0`, minigra → `lastMinigame`, zagadka → `puzzleDay = today`, `puzzlesDone + id` (pełny cykl → `[id]`).
`pickPuzzle(pool, done, rng)` — pierwsza nierozwiązana w cyklu (losowo ziarnem). `localDay(d: Date)` z
`getFullYear/getMonth/getDate` (nigdy `toISOString` — UTC).

**Kolejność w scenie (faza 7, M-1/M-2/M-13).** `freshRound` zwraca `{ kind, state, puzzleId? }` i niczego nie zatwierdza;
`beginRound` przypisuje pola dopiero po udanym zbudowaniu. `finishRound` dla wariantu: najpierw czyste `afterRound`, potem
jeden `registry.set(variants)`, potem `flush('now')`; **nie** woła `endRound`. Dla `'round'`: `endRound` jak dziś +
`afterRound('round')`. Zmiana etapu przez rodzica w trakcie wariantu buduje nową rundę bez dotykania `variants` (wariant
wraca, jeśli nowy etap go dopuszcza).
**Pierwszeństwo (plan-review F6).** Wariant zastępuje wyłącznie rundę adaptacyjną: `warmupPending` (rozgrzewka) i
`?e2eSkills` mają pierwszeństwo i `nextRoundKind` nie jest dla nich wołany (szew `e2eVariant` nie wyprzedza rozgrzewki);
karta „Nowa umiejętność!” (`pendingUnlock`) pokazuje się jak dziś po „Kolejna runda”, a jej „Dalej” startuje to, co
zwróci `freshRound` (także wariant).

**Reguły gwiazdek (faza 7).** Zagadka: `{ ...balance.round, length: 1, starPerTask: balance.round.starPerTask *
balance.variants.puzzleMultiplier, cleanRoundBonus: 0 }`; minigry: `{ ...balance.round, length: n, cleanRoundBonus: 0 }`.
Pure helper `variantRules(kind, n, balance)` w `src/core/variants.ts` — jedyne miejsce tej arytmetyki.

## Phase 1: Zapis v2 — format, migracja 1 → 2, fixtures

Driver: tdd
Driver why: `MIGRATIONS[1]`, walidacja v2 i zapis v2 nie istnieją, a failing testy na zamrożonych fixtures v1/v2, przypadku v3 i imporcie pliku v1 prowadzą czystą logikę `core/save.ts`.

### Overview

Format v2 z blokiem `variants` (wartości startowe), zanim jakakolwiek funkcja go zapisze. Gra zachowuje się jak dziś.

### Changes Required:

#### 1. Typy i format

**File**: `src/core/types.ts`, `src/core/save.ts`

**Intent**: `VariantState`, `SaveV2`, `SaveState = SaveV2`; `SAVE_VERSION = 2`, `MIGRATIONS[1]`, `saveProblem`/`validateSave`
dla v2 (blok `variants`: liczba całkowita ≥ 0, enum albo null, `/^\d{4}-\d{2}-\d{2}$/` albo null, tablica napisów),
`encodeSave` pisze v2, `SessionSave`/`toSession`/`freshSession` niosą `variants`.

**Contract**: kontrakt v2 w Critical Implementation Details; `decodeSave` bez zmian w kolejności kontroli.

#### 2. Rejestr i zapis sesji

**File**: `src/data/layout.ts` (`REGISTRY_KEYS.variants`, `SAVE_KEYS`), `src/main.ts` (sesja → rejestr), miejsce składania
sesji z rejestru dla autosave

**Intent**: blok `variants` przechodzi ładowanie → rejestr → autosave bez zmiany (nikt go jeszcze nie modyfikuje).

**Contract**: zapis po pierwszej rundzie ma `version: 2` i `variants` równe wczytanym.

#### 3. Fixtures i testy

**File**: `tests/fixtures/save-v2.json`, `tests/fixtures/save-v2-fresh.json` (nowe, zamrożone), `tests/save.test.ts`,
`tests/saveFile.test.ts`, `tests/idbStore.test.ts`, `tests/autosave.test.ts`

**Intent**: oba fixtures v1 (bajt w bajt nietknięte) dekodują się do oczekiwanej sesji v2 (`migratedFrom: 1`, gwiazdki,
pokoje, etap, opanowanie identyczne, `variants` startowe); fixtures v2 round-trip; `version: SAVE_VERSION + 1` → `future`
i `replaceGate`/`deviceSaveView` blokują nadpisanie; wstrzyknięta rzucająca migracja → `unreadable` i autosaver z
wyłączonymi zapisami (stare bajty nietknięte); `parseImport(exportFileText(v1 fixture))` → ok z `variants` startowymi;
plik v2 importuje się; testy z „v1 jako bieżący zapis” dostają pomocnika v2.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- `git diff --exit-code tests/fixtures/save-v1.json tests/fixtures/save-v1-fresh.json` (fixtures v1 nietknięte); `save-v2*.json` w commicie fazy
- Deliberate break: `MIGRATIONS[1]` bez `variants` / `encodeSave` z `version: 1` / `saveProblem` przyjmuje brak `variants` → odpowiednie testy czerwone; przywrócone; meta-check: test v1 → v2 czyta zamrożony plik, nie literał z kodu
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (`save-restart`, `save-transfer*` zielone)

#### Manual Verification:

- [reviewer] `core/save.ts` bez Phasera i globali przeglądarki; strażnicy SIR-01 nadal kluczują na `reason`, nie na numerze
- [human] Drzwi jednokierunkowe formatu zapisu: po scaleniu build v2 przepisuje zapis dziecka na v2; wycofanie do buildu v1 pokazuje kartę „zapis z nowszej wersji” (nic nie ginie, ale gra z postępem wymaga ponownej aktualizacji) — akceptacja przed scaleniem

---

## Phase 2: Bezpieczeństwo migracji — `migration-failed`, kopia `backup-v1`, `migratedFrom` w statusie

Driver: tdd
Driver why: nowy powód dekodowania, kolejność „kopia przed pierwszym zapisem” i blokada zapisu po nieudanej kopii to czysta logika `core/save.ts`/`core/autosave.ts` z wstrzykiwanym magazynem — failing testy prowadzą każdą z nich.

### Overview

Zamyka L-S1 i follow-up „backup-v1”: błąd migracji jest nazwany, a pierwszy zapis po migracji nie może zniszczyć v1 bez kopii.

### Changes Required:

#### 1. Powód `migration-failed`

**File**: `src/core/save.ts`, `src/core/autosave.ts`, `src/core/saveFile.ts`, `src/core/saveHealth.ts`

**Intent**: rzucający krok migracji → `{ kind: 'unreadable', reason: 'migration-failed', step }` (nazwa błędu zachowana jak
`lastError`); w `deviceSaveView`/`replaceGate` zachowuje się jak `corrupt` (eksport i wymuszony import/reset dozwolone — to
nie jest nowszy zapis); `parseImport` mapuje go na odrzucenie z własnym powodem.

**Contract**: unia powodów rozszerzona o `'migration-failed'`; `switch` wyczerpujące (`never`) w konsumentach.

#### 2. Kopia przed pierwszym zapisem

**File**: `src/core/autosave.ts` (`SaveStore.backup` — **wymagane**, `LoadOutcome.loaded.raw`, `createAutosaver` `attempt`),
`src/storage/idb.ts` (`profile:<profileId>:backup-v<migratedFrom>` przez istniejące `run`), `src/testing/e2eHook.ts` (magazyn
w pamięci), fałszywe magazyny w `tests/autosave.test.ts`, `tests/saveFile.test.ts`, `tests/e2eSave.test.ts`

**Intent**: gdy `migratedFrom !== null`, autosaver przed pierwszym zapisem woła `backup(raw)` raz; nieudana kopia blokuje ten
zapis (status `blockedBy` nie zmienia się na stałe — kolejna próba ponawia kopię), kopia udana → zapis v2. `backup` jest
polem wymaganym `SaveStore` (plan-review F3): opcjonalne pole pozwoliłoby magazynowi bez kopii po cichu nadpisać v1.
Testy: (1) `tests/idbStore.test.ts` (fake-indexeddb) — po kopii klucz kopii czyta się głęboko równy surowemu v1, a klucz
główny jest nietknięty, dopóki zapis v2 nie przejdzie; (2) `tests/autosave.test.ts` — rzucająca kopia: zero wywołań
`write`, `consecutiveFailures` rośnie, `lastError` = nazwa błędu kopii, kolejna `flush` ponawia kopię przed zapisem.
Kopia nie jest częścią ładowania: `loadSave` jej nie woła, więc nie może zepsuć startu.

**Contract**: `backup(raw: unknown): Promise<void>`; klucz `${SAVE_KEY_PREFIX}${profileId}:backup-v${migratedFrom}` (dziś
`profile:default:backup-v1`); `idb.ts` zostaje jedynym importerem `idb-keyval`.

#### 3. `migratedFrom` w statusie

**File**: `src/core/autosave.ts` (`status`), `src/core/saveHealth.ts`

**Intent**: status runtime (poza zapisem) niesie `migratedFrom`, żeby „Zapis gry” i hak e2e mogły pokazać „przeniesiono z wersji 1”.

**Contract**: pole `migratedFrom: number | null` w `AutosaveStatus`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: kopia po zapisie zamiast przed / zignorowana porażka kopii / `migration-failed` zmapowany na `future` → odpowiednie testy czerwone; przywrócone; meta-check: test kolejności rejestruje wywołania magazynu w kolejności, nie tylko ich liczbę
- `npm run lint` — `idb-keyval` importowany tylko w `src/storage/idb.ts`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Brak drogi, na której zapis v1 jest nadpisany bez kopii; `replace` nie bierze udziału w migracji (S12-02/03/11 nie wyzwolone)

---

## Phase 3: Teksty zapisu i szew `?e2eSave=v1`

Driver: impl
Driver why: teksty i dobór karty w istniejących oknach DOM oraz nowy literał szwu e2e — logika już zbudowana w fazach 1–2, dowód w testach doboru tekstu, bramce buildu i zrzutach.

### Overview

O1 (karta `future`), teksty `migration-failed`, S12-09 (data i build pliku w imporcie), S12-14 (data w nazwie surowej
kopii), zamiennik e2e dwóch buildów.

### Changes Required:

#### 1. Karta i „Zapis gry”

**File**: `src/data/pl.ts` (`saveFuture`, `saveMigrationFailed`, linia „przeniesiono z wersji N”), `src/ui/dom/saveFailedCard.ts`,
`src/ui/dom/saveHealthView.ts`, czysty dobór tekstu w `src/core/saveHealth.ts`

**Intent**: zapis `future` → karta „Ten zapis pochodzi z nowszej wersji gry” z prośbą o aktualizację (bez „zrób kopię” jako
głównej rady); `migration-failed` → „Nie udało się przenieść zapisu” z eksportem; „Zapis gry” pokazuje `migratedFrom`.

**Contract**: `cardCopyFor(reason)` (czysty, testowany) → klucz tekstu; scena/DOM tylko rysuje.

#### 2. Import i surowa kopia

**File**: `src/ui/dom/saveImportDialog.ts` (`stepTwo`), `src/ui/dom/saveExport.ts` (`RAW_FILE_NAME`), `src/data/pl.ts`

**Intent**: krok podsumowania importu pokazuje datę eksportu i build pliku (S12-09); nazwa surowej kopii ma datę jak
`pl.saveTransfer.fileName` (S12-14).

**Contract**: `ImportResult.file { build, exportedAt }` wyświetlane, nie odrzucane.

#### 3. Szew `?e2eSave=v1`

**File**: `src/testing/e2eHook.ts` (`E2E_SAVE_SEAMS`, `e2eSaveStore`), hak `save` (pole `migratedFrom`, `store`)

**Intent**: magazyn w pamięci wypełniony **zaimportowanym** `tests/fixtures/save-v1.json` (nie skopiowanym literałem), z
`backup`; istniejący znacznik `e2eSave` pokrywa go. Magazyn szwu prowadzi dziennik operacji i wersję ostatnio zapisanej
wartości, a hak wystawia je jako `save.store` (plan-review F2): status autosavera i `saver.current()` (zawsze v2) nie
mówią, co naprawdę leży w magazynie ani w jakiej kolejności poszły kopia i zapis.

**Contract**: `E2ESaveSeam` + `'v1'`; `save.store: { ops: readonly ('backup' | 'write')[]; writtenVersion: number | null } | null`
(tylko magazyn szwu; `null` przy IndexedDB).

#### 4. Istniejące specy karty zapisu

**File**: `tests/e2e/save-restart.spec.ts` (`#2 FR-021 an unreadable save shows the parent card…`: tytuł karty i nazwa pliku
surowej kopii), `tests/e2e/save-transfer-blocked.spec.ts` (`playOnWithBlockedSave(page, 'unreadable', pl.saveFailed)`)

**Intent**: `?e2eSave=unreadable` to zapis `future` — po O1 jego karta ma teksty `pl.saveFuture`, a surowa kopia nazwę z datą
(S12-14); oba specy dostają nowe klucze (plan-review F1), karta `corrupt` zostaje na `pl.saveFailed`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (dobór tekstu karty, parser szwu `v1`)
- Deliberate break: `cardCopyFor('future')` zwraca ogólny tekst → test czerwony; przywrócone; meta-check
- `npm run build` drukuje `e2e hook: absent (`; `grep -c "1760000001000" dist/_app/*.js` = 0 (wartość z treści fixture, nie nazwa pliku — JSON jest wklejany bez nazwy)
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`, w tym `save-restart.spec` i `save-transfer-blocked.spec` na tekstach karty `future`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela/rodzica nowych tekstów zapisu (krótkie, bez straszenia, bez żargonu)
- [visual] Zrzuty: karta zapisu `future`, karta `migration-failed`, krok importu z datą i buildem pliku, „Zapis gry” z „przeniesiono z wersji 1” — 1440×900 i 1024×768

---

## Phase 4: Harmonogram wariantów i dzień kalendarzowy

Driver: tdd
Driver why: `nextRoundKind`, `afterRound`, `pickPuzzle`, `variantRules` i `localDay` to czyste funkcje bez implementacji — failing testy (licznik, naprzemienność, reguła dnia, rotacja, ×2) je prowadzą.

### Overview

Cała reguła „co kilka rund” w `core`, bez sceny.

### Changes Required:

#### 1. Moduły

**File**: `src/core/variants.ts` (nowy), `src/core/day.ts` (nowy), `src/data/balance.ts`

**Intent**: kontrakt z Critical Implementation Details; `balance.variants = { everyRounds: 3, puzzleMultiplier: 2,
puzzleStages: ['E3', 'E4'], minigames: [], dice: { throws: 13, max: 12 }, word: { tiles: 3 } }` (`minigames` puste do faz 8–9).

**Contract**: `nextRoundKind`, `afterRound`, `pickPuzzle`, `variantRules`, `localDay` — eksporty czyste.

#### 2. Testy

**File**: `tests/variants.test.ts`, `tests/day.test.ts`

**Intent**: 3 rundy → wariant; rozgrzewka nie liczy się (scena nie woła `afterRound` dla niej — test kontraktu `afterRound`
tylko dla `round`); zagadka raz na `today` (ten sam dzień → minigra; inny dzień, także wcześniejszy → zagadka);
naprzemienność; etap bez puli → minigra; brak kandydata → `'round'`; `forced` i `off`; rotacja bez powtórek i reset cyklu;
`variantRules('puzzle')` = 2 gwiazdki, 0 premii; `localDay` przy 23:30 i 00:30 strefy lokalnej.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `puzzleDay !== today` → `>` / licznik zerowany przy starcie zamiast końca / `starPerTask` × 1 → odpowiednie testy czerwone; przywrócone; meta-check: test dnia używa dwóch dat w kolejności malejącej, więc odróżnia `!==` od `>`
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `src/core/variants.ts` i `day.ts` bez Phasera i globali przeglądarki; liczby tylko z `balance.ts`

---

## Phase 5: Pula 15 zagadek LOGIC (E3–E4)

Driver: tdd
Driver why: `puzzleTask` i test treści puli (walidator, podpowiedzi, odmiana, zakresy) nie istnieją — failing test treści prowadzi dane i konwersję.

### Overview

Oryginalne zagadki z `research.md` § 5 (napisane w tym slice'ie; `docs/zrodla/` nieczytane, żadna z podręcznika) jako dane.

### Changes Required:

#### 1. Dane

**File**: `src/data/puzzles.ts` (nowy), `src/data/nouns.ts` (`piętro`, `wagon`, `osoba`, `paczka`, `śliwka`)

**Intent**: 15 wpisów `PuzzleDef { id, kind, stage, prompt, answer, choices?, hint: [string, string] }` dokładnie jak w tabeli
research § 5 (9 E3, 6 E4; rodzaje floors 3, train 2, number 4, scale 3, water 3); minus jako U+2212.

**Contract**: `PUZZLES: readonly PuzzleDef[]`; pula ucznia = `stage <= stage ucznia` w obrębie `puzzleStages`.

#### 2. Konwersja

**File**: `src/core/puzzles.ts` (nowy)

**Intent**: `puzzleTask(def)` → `Task` (`skillId: 'PUZZLE.<id>'`, `input: choices ? 'tiles' : 'keypad'`, `hint` z danych),
`puzzlePool(stageId, puzzles, stages)`.

**Contract**: czyste; bez zależności `data` → `core` poza typami (granice ESLint).

#### 3. Test treści i sample

**File**: `tests/puzzles.test.ts`, `scripts/sample.ts` (flaga `--variants`: zagadki etapu, 1 runda Hasła, 1 plansza Zakrywanki — dwie ostatnie od fazy 6)

**Intent**: 10–15 wpisów, unikalne id, każdy rodzaj ≥ 2, `validateTask(task, { max: 100, nouns })` puste, `firstHint !== null`,
`solutionSteps` zamyka się odpowiedzią bez dopisanej linii, 1–3 zdania, `choices` zawierają odpowiedź raz; odpowiedzi E3 ≤ 30.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run sample -- E3 --variants` i `E4 --variants` bez naruszeń; `npm run sample -- E1` … `E6` (bez flagi) bez zmian w wyjściu
- Deliberate break: podpowiedź 1 kończąca się odpowiedzią / rzeczownik spoza słownika / `choices` bez odpowiedzi → test treści czerwony; przywrócone; meta-check
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela wszystkich 15 zagadek (`sample -- E4 --variants`): jednoznaczna odpowiedź, zakres etapu, odmiana liczebników, rodzaj czasowników, podpowiedź 1 uczy metody bez wyniku
- [human] Autor czyta wszystkie 15 zagadek przed wydaniem (oryginalne, nie z podręcznika; poprawić lub wymienić dowolną)

---

## Phase 6: Rundy minigier w `core` — rzuty Zakrywanki i zadania Hasła

Driver: tdd
Driver why: generator rzutów (pokrycie 0–12 bez martwego rzutu, odejmowanie większa − mniejsza) i budowa rundy Hasła (słowo, filtr umiejętności, 3 kafelki, odsłanianie liter) to czyste funkcje — failing testy je prowadzą.

### Overview

Obie minigry jako „lista `Task` + stan planszy” bez sceny.

### Changes Required:

#### 1. Zakrywanka

**File**: `src/core/minigames/dice.ts` (nowy), `src/data/pl.ts` (podpowiedzi kitu: „Policz razem oczka obu kostek.”,
„Odejmij oczka drugiej kostki.”, „Zacznij od {a} i dodaj {b}.”, „Zacznij od {a} i odejmij {b}.”)

**Intent**: `diceBoard(rng, rules)` → 13 `Task` (cel = losowe jeszcze odkryte pole; t ≥ 2 dodawanie a ∈ [max(1, t−6),
min(6, t−1)], t ≤ 5 albo 0/1 odejmowanie 1 ≤ b ≤ a ≤ 6); `visual` kostek jako opis danych (dwie liczby oczek i znak);
`coveredAfter(state)` — pola zakryte z wyników ukończonych zadań.

**Contract**: każda plansza pokrywa 0–12 dokładnie raz; `validateTask(max 12)` czyste.

#### 2. Hasło z wyników

**File**: `src/core/minigames/word.ts` (nowy), `src/data/minigames.ts` (nowy: słowa KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA,
OBRAZ z podpisów `pl.room.slots`), `src/data/pl.ts` (tytuły HUD „Kostki · 0–12”, „Ukryte słowo”, „Zagadka dnia”, „Zakryj
wynik”, „Wszystkie pola zakryte!”, „Brawo! Jeszcze jedna gwiazdka.”)

**Intent**: `buildWordRound(stage, previous, learner, rng, opts)` → `{ word, tasks }`: słowo losowane z danych, liczba zadań =
liczba liter; umiejętności odblokowanych kroków typu ADD_SUB/MULT/DIV bez rysunku, z odpowiedzią liczbową, 3 kafelki
(`balance.variants.word.tiles`); fallback: pierwszy grywalny krok etapu z takim typem, potem poprzedni etap; brak → `null`
(harmonogram wybiera wtedy kostki). `revealed(word, state)` — litery odsłonięte przez ukończone zadania (każde zakończone
zadanie, także po rozwiązaniu).

**Contract**: zadania w zakresie etapu (te same generatory), bez powtórzeń polecenia (`round/unique.ts`).

#### 3. Testy

**File**: `tests/dice.test.ts`, `tests/wordRound.test.ts` (20 ziaren × 50, `tests/helpers.ts`)

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją, zielone po; 1000 losowań bez naruszeń; unit `<baseline gałęzi> + N`
- `npm run sample -- E1 --variants` … `E6 --variants` bez naruszeń
- Deliberate break: rzut w zakryte pole / odejmowanie z ujemnym wynikiem / zadanie Hasła z rysunkiem → odpowiednie testy czerwone; przywrócone; meta-check: test pokrycia przechodzi całą planszę przez `round.ts`, nie tylko listę celów
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `sample -- E1 --variants`, `E3 --variants`, `E5 --variants` (podpowiedzi kostek, zadania Hasła w zakresie etapu, słowa z Ó/Ł)

---

## Phase 7: Wariant rundy w `TaskScene`, zagadka dnia ×2, tytuł HUD i szwy e2e

Driver: impl
Driver why: okablowanie sceny wokół logiki z faz 4–5 (rodzaj rundy, koniec wariantu, dzień z `main.ts`, szwy haka) — dowód w testach czystych helperów, bramce buildu, zielonych istniejących specach i zrzutach.

### Overview

Pierwszy widoczny wariant: zagadka dnia (E3–E4). Minigry jeszcze wyłączone (`balance.variants.minigames: []`). Nowy
komponent UI: tytuł w HUD (1).

### Changes Required:

#### 1. Dzień i szwy

**File**: `src/main.ts` (`today = () => localDay(new Date())` w rejestrze `REGISTRY_KEYS.today`), `src/testing/e2eHook.ts`
(`e2eDay` `YYYY-MM-DD`, `e2eVariant` `off|word|dice|puzzle`), `vite/e2eHookGuard.mjs` (znaczniki `e2eDay`, `e2eVariant`),
`tests/e2eHookGuard.test.ts`

**Intent**: tablet otwarty po północy widzi nowy dzień; szwy tylko w buildzie haka, nieobecne w `dist/`.

**Contract**: `REGISTRY_KEYS.today: () => string`, `REGISTRY_KEYS.forcedVariant` (runtime, poza `SAVE_KEYS`).

#### 2. Scena

**File**: `src/scenes/TaskScene.ts` (`freshRound`, `beginRound`, `finishRound`, `applyParentStage`, `render`), `src/scenes/UIScene.ts`,
`src/ui/widgets/HudTitle.ts` (nowy), `src/data/layout.ts` (`HUD_LAYOUT.title`), `src/data/pl.ts` („Zagadka dnia · ★ ×2”)

**Intent**: kolejność z Critical Implementation Details (M-1, M-2, M-13); zagadka = istniejące `AnswerTiles`/`Keypad`,
`SolutionSteps`, `SummaryPanel` z jednym zadaniem; tytuł HUD pokazuje rodzaj wariantu (zwykła runda — brak tytułu);
`DESIGN-GAP` 79–82 w komentarzach.

**Contract**: `freshRound(): { kind, state, puzzleId? }` bez efektów ubocznych; `variants` zapisywane jednym `registry.set`
w `finishRound`, potem `flush('now')`.

#### 3. Hak i istniejące specy

**File**: `src/testing/e2eHook.ts` (`variant: { kind, puzzleId } | null`, `today`), `tests/e2e/adaptive.spec.ts`,
`tests/e2e/room-purchase.spec.ts`, `tests/e2e/parent-settings.spec.ts`, `tests/e2e/save-transfer.spec.ts` (+ każdy inny
spec zmierzony jako dochodzący do 4. zwykłej rundy w jednym kontekście)

**Intent**: `e2eVariant=off` w adresie tych speców, z komentarzem dlaczego; reszta speców bez zmian.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (parsery `e2eDay`/`e2eVariant`, `variantRules`, lista znaczników)
- Deliberate break: usunięty znacznik `e2eDay` z `E2E_HOOK_MARKERS` → `tests/e2eHookGuard.test.ts` czerwony / zagadka z `starPerTask` 1 → test `variantRules` czerwony; przywrócone; meta-check
- `npm run build` drukuje `e2e hook: absent (`; `grep -c "e2eDay\|e2eVariant" dist/_app/*.js` = 0
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`; lista speców z `e2eVariant=off` w handoffie

#### Manual Verification:

- [reviewer] `finishRound` nie woła `endRound` dla wariantu; `freshRound` niczego nie zatwierdza; brak liczb balansu i tekstów gracza w scenie
- [visual] Zrzuty (E4, `?e2eVariant=puzzle`): zagadka z kafelkami, zagadka z klawiaturą, podpowiedź po pomyłce, kroki rozwiązania, podsumowanie z 2 gwiazdkami, tytuł HUD — 1440×900 i 1024×768

---

## Phase 8: Hasło z wyników na ekranie

Driver: impl
Driver why: dwa nowe widżety i gałąź sceny wokół `buildWordRound`/`revealed` z fazy 6 — dowód w testach układu, zielonych specach i zrzutach.

### Overview

Włącza `balance.variants.minigames: ['word']`. Nowe komponenty: `LetterTiles`, `MinigameDoneCard` (2).

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/LetterTiles.ts`, `src/ui/widgets/MinigameDoneCard.ts` (nowe), `src/data/layout.ts` (`MINIGAME_LAYOUT`:
litery 132 × 138, przerwa 24, 88 px, „·” dla ukrytej; karta 1040 szer., przyciski 108), czysty `letterRow(n)` w `src/core/minigames/word.ts`

**Intent**: rząd liter wg kitu (odsłonięta na zielono), 3 kafelki odpowiedzi 312 × 138; karta ukończenia: „Brawo!”, słowo,
„★ +N”, „Kolejna runda”, „Do pokoju” (istniejące klucze `pl.summary.*`).

**Contract**: `MinigameDoneCard.show({ title, line, earned })` wspólna dla obu minigier.

#### 2. Scena i hak

**File**: `src/scenes/TaskScene.ts` (gałąź `word`), `src/data/balance.ts`, `src/testing/e2eHook.ts` (`variant.letters`,
`targets.doneNext`/`doneRoom`)

**Intent**: litera po każdym zakończonym zadaniu; karta zamiast `SummaryPanel`; `DESIGN-GAP` 85.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`letterRow` dla 5 i 6 liter mieści się w notesie 1560)
- Deliberate break: `letterRow` bez przerwy → test układu czerwony; przywrócone; meta-check
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (specy z `e2eVariant=off` nie widzą Hasła)

#### Manual Verification:

- [visual] Zrzuty (`?e2eVariant=word`): Hasło na starcie, pierwsza litera odsłonięta, podpowiedź po pomyłce, druga próba, kroki rozwiązania, karta ukończenia; słowo 6-literowe (KANAPA) i PÓŁKA (Ó/Ł w kaflu) — 1440×900 i 1024×768
- [human] Decyzja wbrew dosłownemu ZADANIA § 5: Hasło odsłania literę po każdym poprawnym działaniu (kit), zamiast „ułożenia wyników rosnąco”; słowa z podpisów salonu (KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA, OBRAZ) zamiast listy kitu (SOFA, OKNO, FOTEL)

---

## Phase 9: Zakrywanka na ekranie

Driver: impl
Driver why: dwa nowe widżety i gałąź sceny wokół `diceBoard` z fazy 6, odpowiedź stuknięciem w planszę — dowód w testach układu, helperze e2e i zrzutach.

### Overview

Włącza `balance.variants.minigames: ['word', 'dice']`. Nowe komponenty: `Dice`, `CoverBoard` (2).

### Changes Required:

#### 1. Widżety

**File**: `src/ui/widgets/Dice.ts`, `src/ui/widgets/CoverBoard.ts` (nowe), `src/data/layout.ts` (`MINIGAME_LAYOUT.dice`, `.board`:
7 kolumn × 160, przerwa 20, wysokość 136, drugi rząd od kolumny 2), czysty `coverBoardCells()` w `src/core/minigames/dice.ts`

**Intent**: kostka 150 px z sześcioma układami oczek; plansza 13 pól, zakryte zielone z ✓ i wyłączone; stuknięcie odkrytego
pola = `answer(n)` w tym samym reduktorze.

**Contract**: `CoverBoard.onPick(n)`; zakryte pole ignoruje stuknięcie.

#### 2. Scena, hak, helpery e2e

**File**: `src/scenes/TaskScene.ts` (gałąź `dice`, karta ukończenia „Wszystkie pola zakryte!”), `src/data/balance.ts`,
`src/testing/e2eHook.ts` (`variant.covered`, `targets.board` — punkty wewnętrzne pól), `tests/e2e/support/hook.ts`
(`answerRight`/`answerWrong` znają planszę)

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (`coverBoardCells`: 13 pól, drugi rząd przesunięty, wnętrza rozłączne)
- Deliberate break: drugi rząd od kolumny 1 → test układu czerwony; przywrócone; meta-check
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [visual] Zrzuty (`?e2eVariant=dice`): kostki na starcie, druga próba, kroki rozwiązania, poprawne pole zakryte, karta „Wszystkie pola zakryte!” — 1440×900 i 1024×768
- [human] Stukanie palcem dziecka w pola 160 × 136 na tablecie 1024 (iPad/Android)

---

## Phase 10: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps 79+, follow-upy z `Trigger:`, zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Porządek przed fazami e2e.

### Changes Required:

#### 1. Seam sweep

**File**: cała zmiana

**Intent**: zduplikowane helpery (reguły gwiazdek tylko w `variantRules`, układ kafli liter/planszy w `layout.ts`), nieaktualne
komentarze („two branches” w `freshRound`, `version: 1` w nagłówku `save.ts`, „v1 fixtures only”), komentarze
`DESIGN-GAP` ↔ wiersze 79–86 (+ ewentualne nowe z faz 7–9).

#### 2. Dokumenty

**File**: `CLAUDE.md` („Current state”: zdanie o S-15 — zapis v2, `variants`, minigry, zagadka dnia, szwy `e2eDay`/`e2eVariant`,
`?e2eSave=v1`), `docs/design-gaps.md` (wiersze 79–86 z research § 6), `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md`

**Intent**: follow-upy z `Trigger:` — prawdziwy e2e dwóch buildów → „the next format change (v3) or a parent report of lost
progress after an update”; S13-06 → „the next save-format change or S-17”; dwie instancje / S12-15 → „a parent reporting
lost progress or a second format change”; M-S1 część `deploy/` → „next change to deploy/”; S12-07/08/12/13 z triggerami;
zakres kostek dla E3–E4, `everyRounds`, ekonomia gwiazdek → „S-17 playtest”; przycisk „Podpowiedź” na żądanie → „author asks
for it”; kopia `backup-v1` bez drogi odczytu w aplikacji (eksport kopii za bramką rodzica) → „a parent report of lost
progress after an update or the next format change (v3)”; trwale nieudana kopia blokuje każdy zapis po migracji (polityka
ponowień / komunikat w „Zapis gry”) → „a parent report of progress not saved after an update” (plan-review F5).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- Komentarze `DESIGN-GAP (docs/design-gaps.md row 79…)` w `src/` ↔ wiersze w `docs/design-gaps.md`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Każdy follow-up ma `Trigger:`; brak martwych komentarzy o „dwóch rodzajach rundy” i „v1 only”
- [human] Decyzje wbrew dosłownemu PRD/ZADANIA/kitowi: wariant co 4. rundę (`everyRounds` 3); zagadka zastępuje rundę bez karty wyboru (FR-025 „może rozwiązać”); zagadki tylko E3–E4 (inne etapy dostają minigrę); Zakrywanka 0–12 dla każdego etapu; brak „Podpowiedź”/„Pokaż” na żądanie i brak gwiazdki za „Pokaż” (podgląd kitu); warianty nie liczą się do opanowania; ×2 także za drugą próbę zagadki (2 gwiazdki), bez premii za bezbłędność; `migration-failed` wymuszalny jak `corrupt`

---

## Phase 11: Zapis v1 wczytany przez build v2 — e2e (#2, #10)

Driver: e2e
Driver why: ryzyka #2 i #10 (postęp przeżywa aktualizację) mają część istniejącą tylko w przeglądarce — prawdziwe IndexedDB, autosave po rundzie, karta przy rzucającej migracji; zbudowane w fazach 1–3, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/save-migration.spec.ts` (projekt `chromium-hook`, `ROUND_SPEC` w `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `playwright.config.ts`, `tests/e2e/save-migration.spec.ts` (nowy)

**Intent**: (a) „#10 a v1 save loads in the v2 build with the same stars, stage and mastery”: `?e2eSave=v1` → hak `save.migratedFrom
=== 1`, licznik gwiazdek = fixture, etap i opanowanie = fixture (pokój fixture `living` jest nieznany — `repairCurrentRoom`
przenosi `currentRoom` do salonu, więc spec nie porównuje bieżącego pokoju; plan-review F9); (b) „#2 after a round the
migrated save is written as v2 with a v1 backup first”: runda → hak `save.store.writtenVersion === 2` i `save.store.ops`
zaczyna się od `['backup', 'write']` (dziennik magazynu szwu z fazy 3, nie `saver.current()`). Nowy kontekst =
nowe urządzenie; nigdy nie otwieramy IndexedDB z testu.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; Chromium niedostępny → protokół request-file
(`e2e-request-p11.md`, patche `e2e-break-p11a…b.patch`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-migration.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`
- Deliberate break (patch `e2e-break-p11a.patch`): `MIGRATIONS[1]` zeruje gwiazdki → (a) czerwony; meta-check: dowodzi ścieżki magazyn → dekoder → rejestr → licznik
- Deliberate break (patch `e2e-break-p11b.patch`): autosaver pomija `backup` → (b) czerwony; każdy oczekiwany czerwony uruchomiony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 12: Minigry dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (wariant grany prawdziwym dotykiem: kafel litery, pole planszy pod skalą FIT, podpowiedź i druga próba, gwiazdki) istnieje tylko na płótnie; zbudowane w fazach 7–9, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/minigames.spec.ts` (`chromium-hook`); cel < 90 s.

### Changes Required:

#### 1. Spec

**File**: `playwright.config.ts`, `tests/e2e/minigames.spec.ts` (nowy)

**Intent**: (a) „#11 after three ordinary rounds the fourth is a minigame” (E1, bez szwu wariantu, prawdziwy licznik):
3 × `playRoundRight` → hak `variant.kind === 'word'`; (b) „#11 Hasło reveals a letter per solved task and a wrong tile gets a
hint and a second try”: `?e2eVariant=word` → `answerWrong` → podpowiedź → `answerRight` → `letters` +1, gwiazdka +1 → koniec →
karta ukończenia z „★ +N”; (c) „#11 Zakrywanka covers the tapped field and ends with every field covered”: `?e2eVariant=dice` →
13 stuknięć w `targets.board` → `covered.length === 13`, karta, „Kolejna runda” startuje zwykłą rundę.

**Contract**: jak faza 11; request-file `e2e-request-p12.md`, patche `e2e-break-p12a…c.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/minigames.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas zapisany
- Deliberate break (patch `e2e-break-p12a.patch`): `afterRound` nie liczy zwykłych rund → (a) czerwony
- Deliberate break (patch `e2e-break-p12b.patch`): litera odsłaniana tylko przy pierwszej próbie → (b) czerwony; meta-check
- Deliberate break (patch `e2e-break-p12c.patch`): `CoverBoard` przesunięty o pole względem celów haka → (c) czerwony; meta-check: hak czyta pola z widżetu, nie z układu (lekcja S-13 F1); każdy czerwony osobno (`-g`)
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 13: Zagadka dnia ×2 raz dziennie, przeżywa restart — e2e (#11, #2)

Driver: e2e
Driver why: reguła dnia, zapis `variants` po końcu wariantu i podwójne gwiazdki na liczniku przechodzą przez `main.ts`, IndexedDB i przeładowanie — tylko w przeglądarce; zbudowane w fazach 4–7, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/daily-puzzle.spec.ts` (`chromium-hook`, `serial`).

### Changes Required:

#### 1. Spec

**File**: `playwright.config.ts`, `tests/e2e/daily-puzzle.spec.ts` (nowy)

**Intent**: (a) „#11 the daily puzzle pays two stars for a second try”: E4, `?e2eVariant=puzzle&e2eDay=2026-10-14` →
`answerWrong` → `answerRight` → licznik +2; (b) „#2 the same day after a reload gives a minigame, not the puzzle again”:
przeładowanie z tym samym adresem → `variant.kind` ≠ `puzzle`; (c) „#11 the next day brings the puzzle back”:
`e2eDay=2026-10-15` → `puzzle` z innym `puzzleId`.

**Contract**: jak faza 11; request-file `e2e-request-p13.md`, patche `e2e-break-p13a…c.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/daily-puzzle.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas pełnego zestawu zapisany
- Deliberate break (patch `e2e-break-p13a.patch`): zagadka z `puzzleMultiplier` 1 → (a) czerwony
- Deliberate break (patch `e2e-break-p13b.patch`): `snapshot` autosavera w `main.ts` zapisuje startowe `variants` zamiast tych z rejestru → (b) czerwony; meta-check: dowodzi zapisu, nie pamięci sesji (przeładowanie). Nie `variants` poza `SAVE_KEYS`: gwiazdki z ostatniej odpowiedzi i tak brudzą zapis, a `flush('now')` zapisuje cały `snapshot`, więc taki break mógłby zostać zielony (plan-review F4)
- Deliberate break (patch `e2e-break-p13c.patch`): `pickPuzzle` ignoruje `puzzlesDone` → (c) czerwony; każdy czerwony osobno (`-g`); przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- Zapis: fixtures v1 → v2, fixtures v2 round-trip, v3 `future` nie do nadpisania, `migration-failed`, kopia przed zapisem,
  import pliku v1 i v2.
- Harmonogram: licznik, rozgrzewka poza licznikiem, dzień (`!==`), naprzemienność, rotacja, `forced`/`off`, ×2.
- Treść: 15 zagadek przez `validateTask`/`firstHint`/`solutionSteps`; 1000 plansz kostek (pokrycie 0–12); rundy Hasła
  20 × 50 na etap (zakres, 3 kafelki, bez rysunku).
- Układ: `letterRow`, `coverBoardCells`.

### Integration Tests:

- E2E fazy 11–13 (protokół request-file, orkiestrator uruchamia Chromium); istniejące specy z `e2eVariant=off` zielone od fazy 7.

### Manual Testing Steps:

1. Tablet: 3 rundy → Hasło; kolejne 3 → Zakrywanka (E1–E2) albo zagadka dnia (E3–E4, pierwsza w dniu).
2. Zamknięcie gry w trakcie wariantu → wariant wraca, gwiazdki z odpowiedzi zostają.
3. Aktualizacja z buildu v1 na v2 na prawdziwym zapisie dziecka: gwiazdki, pokój, etap bez zmian.

## Performance Considerations

Brak gorących ścieżek: plansza 13 pól i rząd 6 liter rysowane raz na zadanie. Czas e2e: pełny zestaw ~4,2 min + ~3 min
nowych speców; `adaptive.spec` z `e2eVariant=off` nie wydłuża się.

## Migration Notes

- v1 → v2 przy odczycie (`decodeSave`), zapis przez zwykły autosave, kopia `profile:default:backup-v1` przed pierwszym
  zapisem. Brak UI przywracania kopii w v1 (ręcznie przez wsparcie; follow-up, jeśli rodzic zgłosi utratę).
- Rollback do buildu v1 po zapisie v2: build v1 widzi `future`, nie nadpisuje (SIR-01, fix #48); treść PR wymienia regułę
  (M-S1 bez zmian w `deploy/`).

## Known risks

- **Specy wielorundowe**: przeoczony spec dochodzący do 4. rundy padnie na wariancie — faza 7 liczy rundy w każdym specu, pełny
  e2e w każdej fazie od 7 to wykrywa. Zmieniłoby: > 4 speców do zmiany → domyślne `off` w buildzie haka i jawne włączanie.
- **Ekonomia gwiazdek**: plansza kostek płaci do 13 (≈ +15 % tempa) — do S-17 playtest.
- **Chromium w sesji agenta**: fazy 1–10 e2e uruchamia orkiestrator; 11–13 protokół request-file.
- **Faza 7 najcięższa w scenie** (`TaskScene` 865 linii): przy zbliżaniu się do limitu kontekstu agent kończy po gałęzi
  zagadki i szwach (`NEEDS_CONTINUATION`), tytuł HUD i specy dokańcza następna sesja w tej samej fazie.
- **Litery Ó/Ł w kaflu 132 px** czcionką zadania — sprawdzane w zrzutach fazy 8 (gap 85).
- **Kopia `backup-v1` bez drogi odczytu w aplikacji** (plan-review F5): chroni przed błędem migracji wykrytym po zapisie, ale
  odzyskanie wymaga narzędzi przeglądarki albo wsparcia; trwale nieudana kopia (np. brak miejsca) blokuje każdy zapis po
  migracji — postęp z tej sesji przepada, v1 zostaje. Oba jako follow-upy z triggerem (faza 10). Zmieniłoby: zgłoszenie rodzica.
- **`migration-failed` wymuszalny jak `corrupt`** (plan-review F7): rodzic może po karcie z eksportem zaimportować/zresetować
  nad zapisem v1, który poprawiony build umiałby przenieść. Dziś praktycznie nieosiągalne (`MIGRATIONS[1]` to rozszerzenie
  rekordu, nie rzuca), więc zostaje decyzja 6 + wiersz `[human]` 10.6. Zmieniłoby: krok migracji, który może rzucić (v3).
- **Kolejność faz zapisu**: faza 1 (format v2) bez fazy 2 (kopia) nadpisałaby v1 bez kopii — obie trafiają na `main` jednym
  PR-em na końcu slice'a; gałąź nigdy nie jest wdrażana po fazie 1 samej.

## References

- Research: `context/changes/minigame-daily-puzzle/research.md`; change: `context/changes/minigame-daily-puzzle/change.md`
- Kontrakt runu: `context/runs/2026-10-14-save-s13b-s15-s14b/agent-contract.md` (§ S-15); profil `context/foundation/autonomous-run.md` § 6, § 8, § 9
- PRD FR-020, FR-021, FR-024, FR-025; `docs/ZADANIA.md` § 1, § 4 (LOGIC), § 5; `Martynka-urzadza.md` § 6, § 8, § 13
- Test-plan: `context/foundation/test-plan.md` ryzyka #2, #10, #11; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-expansion-v1/` (`style-guide.md` „Plansze kodowe”, `manifest.json` `miniGames`, `screenshots/dice-*`, `word-*`)
- Wzorce: `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/plan.md`, `context/archive/2026-10-14-save-reason-and-recovery/`,
  `context/archive/2026-10-13-autosave-versioned-save/follow-ups/review-fixes.md`, `src/core/longPress.ts` (czysty reduktor z wstrzykniętym czasem)

## Autonomous decisions

1. **Złożoność HIGH, zero pytań (kontrakt reguła 1).** Każda decyzja z research Open Questions i decyzje autora z `change.md`;
   roadmapa S-15 → `planning` w commicie planu.
2. **`everyRounds` 3 (wariant co 4. rundę).** Odrzucone: 2 (za często, ekonomia), 4–5 (dziecko grające 1–2 rundy na sesję
   rzadko zobaczy wariant). Dlaczego: brak liczby w źródłach; licznik trwały. Zmieniłoby: S-17 playtest → zmiana w `balance.ts`.
3. **Zapis v2 w fazie 1, migracja przy odczycie, zapis przez zwykły autosave (nie `replace`).** Odrzucone: stan tylko w sesji
   (FR-024/025 nie działa przy krótkich sesjach), migracja przez `replace` (wyzwala S12-02/11). Zmieniłoby: nic w tym slice'ie.
4. **L-S1 i `backup-v1` w zakresie, osobna faza 2.** Kopia blokuje pierwszy zapis, gdy się nie uda. Odrzucone: kopia
   „best effort” (dekoracyjna). Zmieniłoby: magazyn bez miejsca → porażka kopii rośnie w statusie; follow-up.
5. **Zamiennik e2e dwóch buildów: `?e2eSave=v1`.** Odrzucone: trzeci serwer jednego originu. Zmieniłoby: opiekun chce #10 zamknąć w pełni.
6. **Hasło: litera po każdym zakończonym zadaniu (kit), słowa z podpisów salonu.** Wbrew ZADANIA § 5 („ułożenie wyników
   rosnąco”) → `[human]` 8.5. Zmieniłoby: autor prosi o wariant „rosnąco” (reguła w `core/minigames/word.ts`, ten sam ekran).
7. **Zadania Hasła z puli ucznia (ADD_SUB/MULT/DIV bez rysunku), 3 kafelki; brak takich → kostki.** Odrzucone: stałe zadania
   kitu (nie w zakresie etapu E3–E6). Zmieniłoby: teacher read uzna zadania E5–E6 za za trudne na kafelki.
8. **Zakrywanka: stuknięcie w planszę 13 pól, 13 rzutów, każdy w odkryte pole, 0–12 dla wszystkich etapów.** Odrzucone: 3 kafelki
   (kit pokazuje planszę jako wejście), większy zakres E3–E4 (brak widoku). → `[human]` 10.6. Zmieniłoby: test tabletu (pola za
   małe) albo playtest (za łatwe dla E3–E4).
9. **Zagadka zastępuje rundę bez karty zapowiedzi ani odmowy; tytuł HUD „Zagadka dnia · ★ ×2”.** FR-025 „może rozwiązać” — dziecko
   może wyjść „Do pokoju”, zagadka wraca. → `[human]` 10.6, gap 79–81. Zmieniłoby: autor chce kartę wyboru (nowy widżet jak `UnlockCard`).
10. **Zagadki tylko E3–E4; uczeń E4 dostaje też zagadki E3.** Inne etapy dostają minigrę. Zmieniłoby: pula dla innych etapów (po v1).
11. **×2 za pierwszą i drugą próbę, 0 za przepisanie, bez premii za bezbłędność.** Odrzucone: ×2 tylko za pierwszą próbę (kara
    względem zwykłej rundy). Zmieniłoby: autor chce premii.
12. **Warianty poza `endRound` (bez opanowania, odblokowań, łagodzenia).** Odrzucone: `'warmup'` (nadal zapisuje opanowanie).
    → `[human]` 10.6. Zmieniłoby: autor chce, by Hasło liczyło się do opanowania (wtedy tylko `recordRound`).
13. **Stan wariantu aktualizowany na końcu wariantu, dzień `!==`, `today()` z `main.ts`.** (research decyzje 2–3). Zmieniłoby:
    dzieci przeładowujące, by ominąć wariant (brak kary — nie ma czego omijać).
14. **Minigry włączane listą `balance.variants.minigames` faza po fazie** — każda faza zielona bez nieukończonego ekranu.
    Zmieniłoby: nic.
15. **Hook build domyślnie jak produkcja; `e2eVariant=off` tylko w specach wielorundowych.** Odrzucone: domyślne `off` w buildzie
    haka (specy nie widziałyby wariantu, którego produkcja używa). Zmieniłoby: > 4 speców do zmiany (Known risks).
16. **Brak „Podpowiedź”/„Pokaż” na żądanie i gwiazdki za „Pokaż”** (gap 83–84) → `[human]` 10.6. Zmieniłoby: autor prosi o przycisk.
17. **Teksty kitu dosłownie** („Kostki · 0–12”, „Ukryte słowo”, „Zakryj wynik”, „Wszystkie pola zakryte!”, „Brawo! Jeszcze jedna
    gwiazdka.”); własne tylko tam, gdzie kit milczy (zagadka dnia, ×2, karta `future`) z wierszem DESIGN-GAP.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Zapis v2 — format, migracja 1 → 2, fixtures

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — b0ad4ba
- [x] 1.2 `git diff --exit-code tests/fixtures/save-v1.json tests/fixtures/save-v1-fresh.json` (fixtures v1 nietknięte); `save-v2*.json` w commicie fazy — b0ad4ba
- [x] 1.3 Deliberate break: `MIGRATIONS[1]` bez `variants` / `encodeSave` z `version: 1` / `saveProblem` przyjmuje brak `variants` → czerwone; przywrócone; meta-check — b0ad4ba
- [x] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — b0ad4ba

#### Manual

- [ ] 1.5 [reviewer] `core/save.ts` bez Phasera i globali przeglądarki; strażnicy SIR-01 nadal kluczują na `reason`
- [ ] 1.6 [human] Drzwi jednokierunkowe formatu zapisu v2: wycofanie do buildu v1 pokazuje kartę „zapis z nowszej wersji” — akceptacja przed scaleniem

### Phase 2: Bezpieczeństwo migracji — `migration-failed`, kopia `backup-v1`, `migratedFrom` w statusie

#### Automated

- [x] 2.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 8ee3d18
- [x] 2.2 Deliberate break: kopia po zapisie / zignorowana porażka kopii / `migration-failed` jako `future` → czerwone; przywrócone; meta-check — 8ee3d18
- [x] 2.3 `npm run lint` — `idb-keyval` importowany tylko w `src/storage/idb.ts` — 8ee3d18
- [x] 2.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — 8ee3d18 (e2e: orchestrator note, 63 passed on 8ee3d18)

#### Manual

- [ ] 2.5 [reviewer] Brak drogi nadpisania zapisu v1 bez kopii; `replace` poza migracją

### Phase 3: Teksty zapisu i szew `?e2eSave=v1`

#### Automated

- [x] 3.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` — cd5b705
- [x] 3.2 Deliberate break: `cardCopyFor('future')` zwraca ogólny tekst → test czerwony; przywrócone; meta-check — cd5b705
- [x] 3.3 `npm run build` drukuje `e2e hook: absent (`; `grep -c "1760000001000" dist/_app/*.js` = 0 — cd5b705
- [x] 3.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`, w tym `save-restart.spec` i `save-transfer-blocked.spec` na tekstach karty `future` — orchestrator run on cd5b705: 63 passed (4.7 min)

#### Manual

- [ ] 3.5 [reviewer] Odczyt nowych tekstów zapisu (krótkie, bez straszenia, bez żargonu)
- [ ] 3.6 [visual] Zrzuty: karta `future`, karta `migration-failed`, krok importu z datą i buildem, „Zapis gry” z „przeniesiono z wersji 1” — 1440×900 i 1024×768

### Phase 4: Harmonogram wariantów i dzień kalendarzowy

#### Automated

- [x] 4.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 5a18b39
- [x] 4.2 Deliberate break: `!==` → `>` / licznik zerowany przy starcie / `starPerTask` × 1 → czerwone; przywrócone; meta-check — 5a18b39
- [x] 4.3 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` — e2e 63 passed on 5a18b39 (orchestrator note, --workers=4)

#### Manual

- [ ] 4.4 [reviewer] `variants.ts` i `day.ts` bez Phasera i globali przeglądarki; liczby tylko z `balance.ts`

### Phase 5: Pula 15 zagadek LOGIC (E3–E4)

#### Automated

- [x] 5.1 Nowe testy czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N` — 9f87fea
- [x] 5.2 `npm run sample -- E3 --variants` i `E4 --variants` bez naruszeń; `sample` E1–E6 bez flagi bez zmian w wyjściu — 9f87fea
- [x] 5.3 Deliberate break: podpowiedź 1 z wynikiem / rzeczownik spoza słownika / `choices` bez odpowiedzi → czerwone; przywrócone; meta-check — 9f87fea
- [ ] 5.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.5 [reviewer] Odczyt nauczyciela wszystkich 15 zagadek
- [ ] 5.6 [human] Autor czyta wszystkie 15 zagadek przed wydaniem

### Phase 6: Rundy minigier w `core` — rzuty Zakrywanki i zadania Hasła

#### Automated

- [ ] 6.1 Nowe testy czerwone przed implementacją, zielone po; 1000 losowań bez naruszeń; unit `<baseline gałęzi> + N`
- [ ] 6.2 `npm run sample -- E1 --variants` … `E6 --variants` bez naruszeń
- [ ] 6.3 Deliberate break: rzut w zakryte pole / ujemne odejmowanie / zadanie Hasła z rysunkiem → czerwone; przywrócone; meta-check
- [ ] 6.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 6.5 [reviewer] Odczyt nauczyciela `sample -- E1/E3/E5 --variants`

### Phase 7: Wariant rundy w `TaskScene`, zagadka dnia ×2, tytuł HUD i szwy e2e

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 7.2 Deliberate break: znacznik `e2eDay` usunięty z listy / zagadka z `starPerTask` 1 → czerwone; przywrócone; meta-check
- [ ] 7.3 `npm run build` drukuje `e2e hook: absent (`; `e2eDay`/`e2eVariant` nieobecne w `dist/`
- [ ] 7.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`; lista speców z `e2eVariant=off` w handoffie

#### Manual

- [ ] 7.5 [reviewer] `finishRound` bez `endRound` dla wariantu; `freshRound` bez zatwierdzeń; brak liczb i tekstów w scenie
- [ ] 7.6 [visual] Zrzuty: zagadka z kafelkami, z klawiaturą, podpowiedź, kroki rozwiązania, podsumowanie z 2 gwiazdkami, tytuł HUD — 1440×900 i 1024×768

### Phase 8: Hasło z wyników na ekranie

#### Automated

- [ ] 8.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 8.2 Deliberate break: `letterRow` bez przerwy → test układu czerwony; przywrócone; meta-check
- [ ] 8.3 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 8.4 [visual] Zrzuty: Hasło na starcie, pierwsza litera, podpowiedź, druga próba, kroki rozwiązania, karta ukończenia, KANAPA i PÓŁKA — 1440×900 i 1024×768
- [ ] 8.5 [human] Hasło odsłania literę po każdym działaniu (kit) zamiast „ułożenia wyników rosnąco” (ZADANIA § 5); słowa z podpisów salonu zamiast listy kitu

### Phase 9: Zakrywanka na ekranie

#### Automated

- [ ] 9.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 9.2 Deliberate break: drugi rząd od kolumny 1 → test układu czerwony; przywrócone; meta-check
- [ ] 9.3 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 9.4 [visual] Zrzuty: kostki na starcie, druga próba, kroki rozwiązania, pole zakryte, karta „Wszystkie pola zakryte!” — 1440×900 i 1024×768
- [ ] 9.5 [human] Stukanie palcem dziecka w pola 160 × 136 na tablecie 1024

### Phase 10: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [ ] 10.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 10.2 Deliberate break: ścieżka w `CLAUDE.md` do nieistniejącego pliku → walidator czerwony; przywrócone
- [ ] 10.3 Komentarze `DESIGN-GAP` ↔ wiersze 79+ w `docs/design-gaps.md`
- [ ] 10.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 10.5 [reviewer] Każdy follow-up ma `Trigger:`; brak martwych komentarzy o dwóch rodzajach rundy i „v1 only”
- [ ] 10.6 [human] Decyzje wbrew dosłownemu PRD/ZADANIA/kitowi: wariant co 4. rundę, zagadka bez karty wyboru, zagadki tylko E3–E4, Zakrywanka 0–12 dla każdego etapu, brak „Podpowiedź”/„Pokaż” na żądanie i gwiazdki za „Pokaż”, warianty poza opanowaniem, ×2 także za drugą próbę, `migration-failed` wymuszalny

### Phase 11: Zapis v1 wczytany przez build v2 — e2e (#2, #10)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/save-migration.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 2`
- [ ] 11.2 Deliberate break (patch `e2e-break-p11a.patch`): `MIGRATIONS[1]` zeruje gwiazdki → (a) czerwony; meta-check
- [ ] 11.3 Deliberate break (patch `e2e-break-p11b.patch`): autosaver pomija `backup` → (b) czerwony; każdy czerwony osobno (`-g`)
- [ ] 11.4 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 12: Minigry dotykiem — e2e (#11)

#### Automated

- [ ] 12.1 `npx playwright test tests/e2e/minigames.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas zapisany
- [ ] 12.2 Deliberate break (patch `e2e-break-p12a.patch`): `afterRound` nie liczy zwykłych rund → (a) czerwony
- [ ] 12.3 Deliberate break (patch `e2e-break-p12b.patch`): litera tylko przy pierwszej próbie → (b) czerwony; meta-check
- [ ] 12.4 Deliberate break (patch `e2e-break-p12c.patch`): `CoverBoard` przesunięty względem celów haka → (c) czerwony; każdy czerwony osobno (`-g`)
- [ ] 12.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 13: Zagadka dnia ×2 raz dziennie, przeżywa restart — e2e (#11, #2)

#### Automated

- [ ] 13.1 `npx playwright test tests/e2e/daily-puzzle.spec.ts` zielony; pełne `<baseline gałęzi e2e> + 3`; czas zapisany
- [ ] 13.2 Deliberate break (patch `e2e-break-p13a.patch`): `puzzleMultiplier` 1 → (a) czerwony
- [ ] 13.3 Deliberate break (patch `e2e-break-p13b.patch`): `snapshot` w `main.ts` zapisuje startowe `variants` → (b) czerwony; meta-check
- [ ] 13.4 Deliberate break (patch `e2e-break-p13c.patch`): `pickPuzzle` ignoruje `puzzlesDone` → (c) czerwony; każdy czerwony osobno (`-g`)
- [ ] 13.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
