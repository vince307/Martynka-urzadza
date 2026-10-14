# Polski stand-in obrazka, sygnał nieudanego wczytania dla rodzica i import/reset po nieudanym odczycie — Implementation Plan

## Overview

Poprawka spoza roadmapy po audycie obserwowalności 2026-10-14 (ustalenia S14-01 CRITICAL, S14-02, S14-03, S14-04, S14-11,
S12-01) plus niestabilny limit czasu w `tests/spoken.test.ts`. Trzy skutki dla użytkownika:

1. Zadanie, którego obrazka (moneta, banknot, odważnik, dzbanek, ikona) nie udało się wczytać lub zdekodować, pokazuje
   pudełko z **polską wartością z danych** („2 zł”, „10 dag”, „½ l”, „jabłko”) dopasowaną do pudełka — nigdy angielskie
   id pliku. Dodatkowo runda (i rozgrzewka) **pomija** umiejętności, których wynik jest tylko na obrazku, gdy ich obrazki
   nie są wczytane — z regułą, która nigdy nie blokuje odblokowania kroku.
2. Rodzic widzi w panelu ustawień linię „Obrazki” (wszystkie wczytane / ile z ilu się nie wczytało). Jedno źródło prawdy:
   `textures.exists` po wczytaniu w `BootScene`, więc łapie i 404 (`loaderror`), i plik niedekodowalny (bez zdarzenia).
3. Import i reset po nieudanym odczycie zapisu nie pokazują świeżej sesji w pamięci jako „Teraz”. Przy `unavailable`
   (także `timeout`) nadpisanie jest odmawiane w `core` i w dialogu; przy `unreadable` dialog ostrzega i odsyła do
   „Zachowaj kopię” z karty startowej, a import/reset zostają dozwolone (to zamierzona naprawa).

## Current State Analysis

- `src/ui/widgets/ArtImage.ts` `show`: przy braku tekstury rysuje pudełko `ART_STAND_IN` z etykietą
  `key.split('/').pop()` w stałym `textStyle('artLabel')` (24 px), bez dopasowania; `state()` zwraca `{ key, loaded }`.
  Nagłówek klasy twierdzi „a failed load leaves the task playable” (fałsz dla pieniędzy, dzbanków, wagi — S14-11).
- `src/data/taskArt.ts` `TASK_ART`: 38 wpisów `{ key, url, width, height }`; brak `id` i `label`. Źródła etykiet są w
  danych: `MONEY[].grosze` + `formatMoney` (`src/core/text/measure.ts`), `WEIGHTS[].label`, `JUGS[].label`,
  `ICONS[].noun` (`src/data/measures.ts`).
- `src/scenes/BootScene.ts` `preload`: jeden słuchacz `loaderror` → `console.warn("Task art failed to load: <key>")`
  (także dla fontu); `create` nie sprawdza tekstur. Research (a): na ścieżce XHR plik niedekodowalny z 200 nie emituje
  `loaderror` ani nie zwiększa `totalFailed`; w obu awariach `textures.exists(key) === false`.
- Wybór rundy: `src/core/curriculum.ts` `skillBuckets` → `buildAdaptiveRound` → `src/core/round/pick.ts`
  `pickRoundSkills`; rozgrzewka `src/core/round/warmup.ts` `buildWarmup` → `pickSkills`. Oba rzucają `RangeError` na
  pustej puli. `playable` jest statyczny i używany przez numerację kroków i `unlockReady` — nie wolno go zmieniać.
- Umiejętności z wynikiem tylko na obrazku (research (b)): MONEY_COUNT (`params.ids`), MASS (`params.weights`), CAPACITY
  `variant: 'toLitres'` (`params.jugs`). Kroki z nimi m.in. E1.11, E2.2 (`money_count_20`, `money_change_20`,
  `capacity_litres` — 2 z 3), E2.8, E3.4, E4.1, E4.7, E5.5 (`capacity_quarter_l`, `mass_half_kg_e5` — 2 z 2).
- Zapis: `src/core/autosave.ts` `createAutosaver` `replace` odmawia tylko przy `blockedBy === 'fatal'`.
  `src/scenes/UIScene.ts` `openImport`/`openReset` budują „Teraz” z `decodeSave(saver.current())` (przy
  `unavailable`/`unreadable` to świeża sesja „0 gwiazdek, przed wyborem etapu”); dialogi
  `src/ui/dom/saveImportDialog.ts`/`saveResetDialog.ts` dostają tylko `current: SaveSummary`.
- Panel rodzica: wzór `src/core/saveHealth.ts` `saveHealthView` + `src/ui/dom/saveHealthView.ts` `createSaveHealthView`,
  opcja `saveHealth?` w `openSettingsPanel` (`src/ui/dom/settingsPanel.ts`), migawka czytana raz w `UIScene.openSettings`.
- Szwy e2e: czytniki w `src/testing/e2eHook.ts` (`e2eSkills`, `e2eSave`…) wołane w `src/main.ts` pod `__E2E_HOOK__`,
  wartości w rejestrze (`REGISTRY_KEYS.forcedSkills`, `forcedFailure`), markery w `vite/e2eHookGuard.mjs`
  `E2E_HOOK_MARKERS`. `?e2eSkills` omija kubełki (`forcedSkills`), więc e2e zobaczy stand-in mimo filtra.
- `tests/spoken.test.ts`: trzy testy `forEachTask` bez trzeciego argumentu (domyślne 5 s); jeden miał 5,3 s pod pełnym
  obciążeniem w baseline runu.

## Desired End State

- Każdy wpis `TASK_ART` ma polską, niepustą etykietę z danych (lub świadomie pustą dla `balance-scale` i
  `thermometer-frame`); `ArtImage` pokazuje ją dopasowaną do pudełka; `state()` zwraca też `label`. Test pilnuje, że
  żadna etykieta nie jest id pliku ani nie zawiera `-`.
- `BootScene.create` zapisuje w rejestrze `REGISTRY_KEYS.artHealth` rekord `{ total, missing }` (klucze bez tekstury);
  `loaderror` zostaje tylko logiem, rozróżnionym po typie pliku. Rekord nigdy nie wchodzi do `SaveState` (format v1).
- Panel rodzica ma sekcję „Obrazki” z czystego `artHealthView`; dziecko nie widzi nic nowego poza czytelnym stand-inem.
- Runda adaptacyjna i rozgrzewka pomijają umiejętności MONEY_COUNT / MASS / CAPACITY `toLitres`, których obrazki są
  brakujące, z regułą „krok bieżący filtrowany tylko wtedy, gdy zostaje co najmniej `ceil(unlockShare · n)` grywalnych
  umiejętności” i powrotem do niefiltrowanych pul, gdy filtr opróżniłby rundę. Bez brakujących obrazków wynik (i zużycie
  rng) jest identyczny jak dziś.
- `replace` odmawia (`'Blocked'`) także przy `unavailable`; dialogi importu i resetu dostają stan zapisu na urządzeniu z
  czystego `deviceSaveView` i przy `unavailable` pokazują linię bez akcji nadpisania, przy `unreadable` linię ostrzeżenia
  zamiast „Teraz” z akcją dozwoloną.
- Szew `?e2eArt=missing|corrupt` (tylko build hook, marker `e2eArt`) i dwa nowe spec'e e2e (#11, #2) z przerwami.
- `tests/spoken.test.ts` bez flaky timeoutu. DESIGN-GAP 66 poprawiony, nowe wiersze 67 i 68, `CLAUDE.md` z jednym
  zdaniem o tej zmianie, follow-upy z `Trigger:`.

### Key Discoveries:

- `TextureManager.exists` = `list.hasOwnProperty(key)`; `get` zwraca po cichu `__MISSING` — dlatego zdrowie i stand-in
  opierają się na `exists` (research (a), `node_modules/phaser/src/textures/TextureManager.js`).
- `src/data/` może importować `src/core/text/*` (ESLint), więc `formatMoney` w `taskArt.ts` jest dozwolony.
- `pickRoundSkills` już rozdziela wagę pustego kubełka na pozostałe — filtr nie musi nic przeważać, tylko nie oddać
  wszystkich trzech pustych.
- `?e2eSave=unavailable` (`e2eSaveStore`): odczyt odrzuca, zapisy się udają — dokładnie scenariusz S12-01, więc e2e udowodni odmowę.
- Wzorzec dopasowania etykiety: `src/ui/widgets/BarChart.ts` `render` (`setScale(room / displayWidth)`).
- `src/core/text/plural.ts` `inflect(n, forms)` daje formę czasownika zależną od liczby (1 / 2–4 / 5+).

## What We're NOT Doing

- S14-05 (wyniki zadań ze stand-inem poza opanowaniem), S14-06 (`check:deploy` dla obrazków), S14-07 (`loader.timeout`),
  S14-08 w całości (URL/status/build w logu — bierzemy tylko rozgałęzienie po typie pliku, bo i tak przepisujemy handler),
  S14-09, S14-10, S14-12 — follow-upy z `Trigger:` (faza 7).
- S12-02..S12-15 (m.in. limit czasu `replace`, stany `replacing`/`replaced` w `saveHealthView`, walidacja eksportu
  S12-04 — także eksport świeżej sesji przy `unreadable` z panelu), wszystkie S13-* — follow-upy.
- Przycisk kopii surowej w dialogach importu/resetu (trzymanie `raw` w runtime) — odsyłamy do „Zachowaj kopię” na karcie
  startowej, która wraca przy każdym uruchomieniu, dopóki zapis jest nieczytelny (decyzja 4).
- Ponowny odczyt magazynu w dialogu (nowe asynchroniczne I/O bez limitu, S12-02).
- Zmiana `playable`, numeracji kroków, zachowania `unlockReady` (tylko wyciągnięcie `unlockThreshold`), `SAVE_VERSION`, fixtur zapisu, `deploy/`, `designs/`.
- Liczba brakujących obrazków na karcie błędu (karta jest tylko dla awarii fatalnej; gra działa dalej).
- Import z ekranu powitalnego (follow-up S-12, trigger nie wystrzelił).

## Implementation Approach

Najpierw czysta logika w `core` test-first (fazy 1–2), potem sklejka w scenach i DOM po jednym obszarze na fazę (3–6),
seam sweep i dokumentacja (7), na końcu e2e w protokole request-file (8–9). Każda faza jest samodzielnie zielona: nowe
parametry są opcjonalne z wartościami domyślnymi „nic nie brakuje” / „zapis odczytany”, więc fazy 1–2 nie zmieniają
zachowania gry, a fazy 3–6 włączają je po kolei.

Kolejność ma znaczenie dla bramki wizualnej: szew `?e2eArt` powstaje w fazie 3, więc zrzuty stand-inu (faza 5) i linii
„Obrazki” (faza 4) da się zrobić bez dotykania plików.

## Critical Implementation Details

- **Zużycie rng bez braków**: filtr z pustym zbiorem brakujących id musi zwrócić te same tablice (ta sama referencja albo
  ta sama zawartość) i nie wołać rng — inaczej przesunie seedy w `tests/curriculum*.test.ts`, `adaptive.spec` i całym
  zestawie przypiętym do seedów.
- **Reguła kroku bieżącego**: kubełek `current` jest filtrowany tylko, gdy po filtrze zostaje ≥ `ceil(unlockShare · n)`
  umiejętności (n = grywalne umiejętności kroku, ta sama formuła co `unlockReady`). Inaczej zostaje niefiltrowany — to
  gwarantuje, że brak obrazków nigdy nie zablokuje odblokowania kroku (E2.2: 1 z 3 grywalnych < 2 → niefiltrowany;
  E5.5: 0 z 2 → niefiltrowany; E4.1 i E1.11 — wylicza test, nie plan).
- **Kolejność w `BootScene`**: rekord zdrowia liczony w `create` (po zakończeniu loadera, przed `delayedCall`), żeby
  `TaskScene` i `UIScene` miały go w rejestrze przy pierwszej rundzie.
- **Szew `corrupt`**: URL istniejącego pliku, który nie jest obrazem (np. font `.ttf`), dla kilku kluczy — daje 200 i
  `File.onProcessError` bez `loaderror`. Nie używać „złego URL” (fallback `vite preview` nie jest sprawdzony, research Open 4).

## Phase 1: Zdrowie obrazków i filtr umiejętności zależnych od obrazka w `core`; limit czasu testów spoken

Driver: tdd
Driver why: `artHealth`/`artHealthView`, `artBlocked` i filtr kubełków to nowe czyste funkcje w `core` — failing testy (brak, dekodowanie, pusty krok, reguła odblokowania, identyczny seed) prowadzą implementację.

### Overview

Czysta logika bez sceny: rekord zdrowia obrazków i jego widok dla rodzica, predykat „umiejętność zablokowana brakiem
obrazka” i filtr pul wpięty opcjonalnie w `buildAdaptiveRound` i `buildWarmup`. Do tego limit czasu w
`tests/spoken.test.ts` (zmiana tylko testu, bez prowadzenia testem — stabilizuje bramkę każdej kolejnej fazy).

### Changes Required:

#### 1. Rekord i widok zdrowia obrazków

**File**: `src/core/artHealth.ts` (nowy), `tests/artHealth.test.ts` (nowy)

**Intent**: Jedno miejsce, które z listy oczekiwanych wpisów i predykatu „tekstura istnieje” robi rekord, oraz widok dla
panelu rodzica (wzór `saveHealthView`; słowa w `pl.ts`, nie tutaj).

**Contract**: `artHealth(entries: readonly { key: string; id: string }[], exists: (key: string) => boolean): ArtHealth`,
`ArtHealth = { total: number; missing: readonly string[] /* keys */; missingIds: ReadonlySet<string> }`;
`artHealthView(health: ArtHealth | undefined): { kind: 'ok'; total } | { kind: 'missing'; count; total } | { kind: 'unknown' }`
(`unknown`, gdy rekordu brak — np. scena testowa). Testy: wszystko jest → `ok`; 3 z 38 → `missing` 3/38; puste wejście;
`missingIds` z `id`, nie z klucza.

#### 2. Predykat i filtr umiejętności

**File**: `src/core/round/artFilter.ts` (nowy), `tests/artFilter.test.ts` (nowy)

**Intent**: Umiejętność jest zablokowana, gdy jej wynik jest tylko na obrazku i brakuje któregoś z obrazków, które może
narysować; filtr pul pomija takie umiejętności, nie blokując odblokowania kroku i nie opróżniając rundy.

**Contract**: `artBlocked(skill: SkillDef, missingIds: ReadonlySet<string>): boolean` — MONEY_COUNT: dowolne z
`parseMoneyCountParams(params).ids`; MASS: dowolne z `weights`; CAPACITY tylko `variant === 'toLitres'`: dowolne z
`jugs`; każdy inny typ `false` (parsery przez `getParser` z `src/core/tasks/registry.ts`).
`withoutArtBlocked(buckets: SkillBuckets, blocked: (s: SkillDef) => boolean, minCurrent: number): SkillBuckets` —
`earlier`/`previous` filtrowane; `current` filtrowany tylko, gdy zostaje ≥ `minCurrent` (i > 0); gdy wszystkie trzy
wyszłyby puste → oryginalne `buckets`. Pusty zbiór brakujących → wejście bez zmian.
Testy (min.): E2.2 przy brakujących monetach i dzbankach → `current` niefiltrowany; E5.5 przy brakującym ½ l → niefiltrowany;
krok z 5 umiejętnościami, 1 zablokowaną, próg 3 → filtrowany; wszystkie pule zablokowane → oryginał; MONEY_CHANGE i
CAPACITY `howMany` nigdy zablokowane.

#### 3. Wpięcie w budowę rundy i rozgrzewki

**File**: `src/core/curriculum.ts` `buildAdaptiveRound`; `src/core/round/pick.ts` `pickSkills`; `src/core/round/warmup.ts`
`buildWarmup`; testy w `tests/curriculum.test.ts` / `tests/warmup.test.ts` (lub plikach, w których dziś są)

**Intent**: Opcjonalny parametr „brakujące obrazki” — bez niego (albo z pustym zbiorem) zachowanie i zużycie rng
identyczne jak dziś.

**Contract**: `buildAdaptiveRound(…, tileCount, art?: { missingIds: ReadonlySet<string>; unlockShare: number })` —
`minCurrent = unlockThreshold(|grywalne umiejętności kroku bieżącego|, unlockShare)` — nowa eksportowana funkcja w
`src/core/curriculum.ts` (`Math.ceil(share · n)`), której od tej fazy używa też `unlockReady` (refaktor bez zmiany
zachowania, chroniony istniejącymi testami `unlockReady`; plan-review F2).
`pickSkills(stage, rng, count, blocked?)` — pula filtrowana, a gdy pusta po filtrze → pula niefiltrowana (wyjątek
`RangeError` tylko jak dziś, przy pustej puli bez filtra). `buildWarmup(…, retries, blocked?)` przekazuje dalej.
Test seeda: ten sam seed bez `art` i z pustym `missingIds` daje identyczne zadania; z brakującymi monetami na E4 nie ma
MONEY_COUNT w 200 rundach poza krokiem bieżącym chronionym regułą.

#### 4. Limit czasu testów spoken

**File**: `tests/spoken.test.ts` (`describe('speech over every skill of every stage')`)

**Intent**: Trzy testy `forEachTask` bez limitu dostają `30_000` z tym samym komentarzem co w `cd42b4a`; asercje bez zmian.

**Contract**: trzeci argument `it(…, …, 30_000)` dla „has no operator glyph, blank, no-break space or digit-colon left”,
„never speaks a standalone Roman numeral token”, „speech does not give away the answer: …”; bez globalnego `testTimeout`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `withoutArtBlocked` filtruje `current` bez progu → test E2.2/E5.5 czerwony; `artBlocked` liczy CAPACITY `howMany` → czerwony; filtr woła rng przy pustym zbiorze → test seeda czerwony; przywrócone; meta-check: break w regule, nie w danych testu
- `npm run sample -- E1` … `E6` bez zmian w wyjściu (seed domyślny); `tests/fixtures/` bez zmian
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] `artHealth.ts` i `artFilter.ts` bez Phasera, bez globali, bez importu `src/data/taskArt.ts` (dane przez argumenty); `playable` nietknięty, `unlockReady` bez zmiany zachowania (tylko `unlockThreshold`)

---

## Phase 2: Stan zapisu na urządzeniu dla importu i resetu, odmowa `replace` przy `unavailable`

Driver: tdd
Driver why: odmowa w `createAutosaver.replace` i czysty `deviceSaveView` to logika `core` z jasnymi przypadkami (`null`/`unreadable`/`unavailable`/`timeout`/`fatal`) — failing testy prowadzą implementację.

### Overview

`core` decyduje, co dialogi pokażą jako „Teraz” i czy nadpisanie jest dozwolone; UI (faza 6) tylko to renderuje.

### Changes Required:

#### 1. Odmowa nadpisania niewidzianego zapisu

**File**: `src/core/autosave.ts` `createAutosaver` `replace`; `tests/autosave.test.ts`

**Intent**: `replace` odmawia także przy `blockedBy === 'unavailable'` (w tym `timeout`), bo zapis na urządzeniu może być
zdrowy i nikt go nie widział; `unreadable` zostaje dozwolony (import kopii to zamierzona naprawa).

**Contract**: `ReplaceResult` bez nowych wariantów: `{ ok: false, error: 'Blocked' }` dla `fatal` i `unavailable`; magazyn
nietknięty (test: zero `write` po odmowie, `status.replace` bez zmian); `unreadable` → zapis jak dziś.

#### 2. Widok zapisu na urządzeniu

**File**: `src/core/saveFile.ts` (obok `saveSummary`) albo `src/core/deviceSave.ts` (nowy); `tests/saveFile.test.ts`

**Intent**: Jedna czysta funkcja, która z `AutosaveStatus.blockedBy` i bieżącego stanu robi to, co dialog pokazuje w miejscu „Teraz”.

**Contract**: `deviceSaveView(blockedBy: BlockReason | null, current: SaveState, rooms): DeviceSaveView`,
`DeviceSaveView = { kind: 'summary'; summary: SaveSummary } | { kind: 'unreadable' } | { kind: 'blocked'; cause: 'unavailable' | 'fatal' } | { kind: 'broken' }`
— `null` → `summary` (albo `broken`, gdy `decodeSave(current)` nie `ok` — dzisiejsza gałąź `closeSettings`);
`unreadable` → `unreadable` (nadpisanie dozwolone); `unavailable` i `fatal` → `blocked` (nadpisanie niedozwolone, zgodnie
z `replace`). Przy `blockedBy !== null` podsumowanie świeżej sesji **nigdy** nie jest zwracane. Test na każdą wartość `blockedBy`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: warunek `replace` z powrotem tylko `fatal` → test `unavailable` czerwony; `deviceSaveView` zwraca `summary` przy `unreadable` → czerwony; przywrócone; meta-check: test liczy zapisy magazynu, nie tylko `ok`
- `tests/fixtures/save-v1*.json` bez zmian; `SAVE_VERSION` 1
- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (istniejący `save-transfer.spec.ts` na zdrowym IDB bez zmian)

#### Manual Verification:

- [reviewer] Żaden nowy stan nie trafia do `SaveState`/`encodeSave`; `unreadable` nadal pozwala na import i reset

---

## Phase 3: Sygnał wczytania w `BootScene`, szew `?e2eArt` i filtr w `TaskScene`

Driver: impl
Driver why: sklejka scen i rejestru wokół czystej logiki z fazy 1 (bez nowego komponentu) — zachowanie widać tylko w przeglądarce; dowód w bramce, strażniku haka i e2e fazy 8.

### Overview

`BootScene` liczy rekord zdrowia z `textures.exists`, `TaskScene` przekazuje brakujące id do budowy rundy i rozgrzewki.
Szew e2e wymusza brak lub uszkodzenie tekstur. (Plan-review F1: linia „Obrazki” w panelu wydzielona do fazy 4, żeby
każda faza mieściła się w jednej świeżej sesji agenta.)

### Changes Required:

#### 1. Tabela tekstur z `id`

**File**: `src/data/taskArt.ts` `TaskArtEntry`, `entry`; `tests/taskArt.test.ts`

**Intent**: Każdy wpis niesie `id` z `measures.ts` (wejście `artHealth` i `artBlocked`), żeby nikt nie wyprowadzał id z klucza.

**Contract**: `TaskArtEntry.id: string`; test: `id` każdego wpisu to id z `COIN_IDS`/`NOTE_IDS`/`WEIGHTS`/`JUGS`/`ICONS`
albo `balance-scale`/`thermometer-frame`, unikalne.

#### 2. Rekord w `BootScene` i log po typie

**File**: `src/scenes/BootScene.ts` `preload`, `create`; `src/data/layout.ts` `REGISTRY_KEYS`

**Intent**: Po wczytaniu `create` zapisuje `artHealth(TASK_ART, (k) => this.textures.exists(k))` pod nowym
`REGISTRY_KEYS.artHealth` (nie w `SAVE_KEYS`); gdy coś brakuje — jedno `console.warn` z liczbą i kluczami. Handler
`loaderror` pisze „Task art failed to load” tylko dla obrazów, a dla fontu osobny komunikat (część S14-08); komentarz
„A missing drawing is not fatal: ArtImage draws a stand-in” poprawiony (stand-in z polską wartością + linia w panelu).

**Contract**: `REGISTRY_KEYS.artHealth: 'artHealth'` (nazwa nie jest markerem e2e); `SAVE_KEYS` bez zmian.

#### 3. Szew e2e `?e2eArt`

**File**: `src/testing/e2eHook.ts` (czytnik `e2eArt(search): 'missing' | 'corrupt' | null`, pole `artHealth` w migawce
haka), `src/main.ts` (odczyt pod `__E2E_HOOK__`, przekazanie do `createGame` → rejestr, wzór `forcedSkills`),
`src/scenes/BootScene.ts` `preload` (pod `__E2E_HOOK__`), `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` (+ `'e2eArt'`),
`tests/e2eHookGuard.test.ts` (dwa jawne przypadki `e2eArt` — chunk produkcyjny z markerem → `ok: false`, build hook bez
markera → `ok: false` — wzór przypadków `e2eSave` zamkniętych w `2026-10-13-save-observability-c1-c2`)

**Intent**: `missing` — żaden obraz `TASK_ART` nie jest kolejkowany (ścieżka `textures.exists`); `corrupt` — kilka
kluczy (np. wszystkie monety) dostaje URL istniejącego pliku nie-obrazu (font) → 200 + `onProcessError` bez
`loaderror` (dowód S14-04). Tylko build hook; `npm run build` dowodzi nieobecności w `dist/`.

**Contract**: wartość w rejestrze pod kluczem, którego nazwa nie jest markerem (np. `REGISTRY_KEYS.forcedArt`); hak
`snapshot.artHealth = { total, missing: number }`.

#### 4. Filtr w `TaskScene`

**File**: `src/scenes/TaskScene.ts` (miejsca wywołań `buildWarmup` i `buildAdaptiveRound`)

**Intent**: Brakujące id z rekordu w rejestrze trafiają do budowy rundy (`art: { missingIds, unlockShare: balance.curriculum.unlockShare }`)
i rozgrzewki (`blocked`); `forcedSkills` (e2e) bez zmian, czyli omija filtr. Brak rekordu = nic nie brakuje.

**Contract**: bez nowych liczb w scenie (`unlockShare` z `balance.ts`).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (test `id` w `taskArt.test.ts`, jawne przypadki `e2eArt` w `tests/e2eHookGuard.test.ts`)
- `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `e2eArt`
- Deliberate break: odczyt `e2eArt(window.location.search)` w `main.ts` przeniesiony poza `__E2E_HOOK__` → `npm run build` pada „leaked”; przywrócone; meta-check: strażnik widzi marker w chunku produkcyjnym, nie tylko w źródle
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`art-tasks.spec.ts` nadal `loaded === true` bez szwu)

#### Manual Verification:

- [reviewer] `REGISTRY_KEYS.artHealth` i klucz szwu poza `SAVE_KEYS`; `forcedSkills` omija filtr; brak rekordu w rejestrze = nic nie brakuje; zmiana w `TaskScene` ograniczona do argumentów wywołań w `freshRound`

---

## Phase 4: Linia „Obrazki” w panelu rodzica

Driver: impl
Driver why: nowy komponent DOM `artHealthView` i sklejka `UIScene.openSettings` → `openSettingsPanel` wokół czystego `artHealthView` z fazy 1 i rekordu z fazy 3 — wygląd widać tylko w DOM; dowód w teście tekstu, zrzutach i e2e fazy 8.

### Overview

`UIScene` przekazuje migawkę widoku zdrowia obrazków do panelu, który pokazuje sekcję „Obrazki” pod „Zapis gry”.

### Changes Required:

#### 1. Sekcja „Obrazki”

**File**: `src/ui/dom/artHealthView.ts` (nowy, `createArtHealthView`), `src/ui/dom/settingsPanel.ts` (opcja
`artHealth?: ArtHealthView`, element obok sekcji „Zapis gry”), `src/scenes/UIScene.ts` `openSettings` (migawka
`artHealthView(registry.get(REGISTRY_KEYS.artHealth))`), `src/data/pl.ts` `pl.settings`, `docs/design-gaps.md` (wiersz 67)

**Intent**: Sekcja z nagłówkiem i jednym zdaniem; `unknown` → sekcja ukryta. Komentarz `DESIGN-GAP 67` w `artHealthView.ts`
i przy kluczach `pl.ts`.

**Contract**: `pl.settings.artHeading: 'Obrazki'`, `artOk: 'Wszystkie obrazki zadań są wczytane.'`,
`artMissing: (n, total) => \`${n} z ${total} obrazków ${inflect(n, ['nie wczytał się', 'nie wczytały się', 'nie wczytało się'])}. W tych zadaniach zamiast obrazka jest napis. Uruchom grę ponownie.\``
(ostateczne brzmienie po teacher read; liczebnik przez `inflect` z `src/core/text/plural.ts`). Wiersz 67: „The kit has no
parent line for task pictures that failed to load” → sekcja „Obrazki” pod „Zapis gry”, plik(i).

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (test tekstu `artMissing` dla 1, 2, 5, 22, 38)
- Deliberate break: `artMissing` z rzeczownikiem w złej formie dla 2 → test tekstu czerwony; przywrócone
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`parent-settings.spec.ts`, `save-restart.spec.ts` zielone)

#### Manual Verification:

- [reviewer] Teacher read tekstów `pl.settings.art*` (1 → „nie wczytał się”, 2–4/22–24 → „nie wczytały się”, 5–21, 25+ → „nie wczytało się”; „z 38 obrazków” w dopełniaczu), wiersz 67 i komentarz `DESIGN-GAP 67`
- [visual] Zrzuty panelu rodzica: „Obrazki” OK (bez szwu) i „Obrazki” z brakami (`?e2eArt=missing`, `?e2eArt=corrupt`) — 1920×1080 i ~400 px szerokości (iframe 400×300, poziomo)

---

## Phase 5: Polski stand-in z danych i dopasowanie tekstu w `ArtImage`

Driver: impl
Driver why: zmiana jednego istniejącego widżetu (`ArtImage`) i pola danych — tekst dopasowany do pudełka widać tylko na płótnie; dowód w teście tabeli etykiet, zrzutach z `?e2eArt=missing` i e2e fazy 8.

### Overview

Etykieta stand-inu pochodzi z danych pomiarowych i jest dopasowana do najmniejszych pudełek (odważnik 84 px, obszar
rysunku 190 px w fazie rozwiązania).

### Changes Required:

#### 1. Etykiety w tabeli tekstur

**File**: `src/data/taskArt.ts` `TaskArtEntry`, `TASK_ART`; `tests/taskArt.test.ts`

**Intent**: Każdy wpis niesie polską etykietę: monety i banknoty `formatMoney(grosze)` z `MONEY` („5 zł”, „20 gr”),
odważniki `WEIGHTS[].label`, dzbanki `JUGS[].label`, ikony `ICONS[].noun`; `balance-scale` i `thermometer-frame` —
pusta etykieta (reszta wagi i termometru jest rysowana w kodzie lub w odważnikach).

**Contract**: `TaskArtEntry.label: string`; test (S14-11): każda etykieta poza dwiema świadomie pustymi jest niepusta,
różna od `id`, bez `-`, bez łacińskich liter id (`/coin|note|weight|container/` nie występuje); monety/banknoty
równe `formatMoney` ich `grosze`.

#### 2. `ArtImage`

**File**: `src/ui/widgets/ArtImage.ts` `show`, `state`, nagłówek klasy; `src/data/layout.ts` (ewentualny `ART_STAND_IN.padding`)

**Intent**: Gałąź `!loaded` bierze `label` z mapy `SIZES` (wpis `TASK_ART`), nigdy z klucza; tekst skalowany w dół, gdy
nie mieści się w szerokości/wysokości pudełka minus margines (wzorzec `BarChart.render`), i przywracany do skali 1 przy
następnym `show`. `state()` zwraca `{ key, loaded, label }` (`label` tylko dla stand-inu, `null` dla tekstury). Nagłówek
klasy: „stand-in shows the Polish value from data, so money, weights and jugs stay solvable” zamiast „leaves the task playable”.

**Contract**: geometria marginesu w `layout.ts`, kolory z `ART_STAND_IN`; bez tekstów gracza w widżecie.

#### 3. DESIGN-GAP 66

**File**: `docs/design-gaps.md` wiersz 66

**Intent**: Rewizja: pudełko z polską wartością z danych („2 zł”, „10 dag”, „½ l”, nazwa ikony), tekst dopasowany do
pudełka; zadanie z wynikiem tylko na obrazku jest pomijane przy wyborze rundy, chyba że to zablokowałoby krok.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- Deliberate break: etykieta monety z klucza zamiast z `formatMoney` → `taskArt.test.ts` czerwony; przywrócone; meta-check: test sprawdza wartość z `MONEY`, nie tylko „niepusta”
- `npm run sample -- E1 … E6 --count 6` bez naruszeń (etykiety nie są w treści zadań — wyjście bez zmian)
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual Verification:

- [reviewer] Teacher read etykiet: wszystkie 38 (`formatMoney` dla 1, 2, 5, 10, 20, 50 gr i 1–500 zł; „½ l”, „¼ l”; nazwy ikon w mianowniku)
- [visual] Zrzuty stand-inów z `?e2eArt=missing` i `?e2eSkills=…`: pieniądze (monety E1.11/E2.2, banknoty E4.1), dzbanki (`toLitres`: E2.2 `capacity_litres`, E5.5 `capacity_quarter_l`; `howMany`: E4.7), waga z odważnikami dag (E3.4) i z ≥ 3 odważnikami, ikony COUNT i MULT_GROUPS, termometr; oraz każdy z nich w fazie rozwiązania przy klawiaturze (obszar 190 px) — 1920×1080 i 1024×768

---

## Phase 6: Import i reset po nieudanym odczycie zapisu

Driver: impl
Driver why: dwa istniejące dialogi DOM i sklejka w `UIScene` renderują `deviceSaveView` z fazy 2 — zachowanie widać w DOM; dowód w testach dialogów (jsdom, jeśli są), zrzutach i e2e fazy 9.

### Overview

Dialogi dostają `DeviceSaveView` zamiast `current: SaveSummary` i nie pokazują świeżej sesji jako „Teraz”.

### Changes Required:

#### 1. Sklejka w `UIScene`

**File**: `src/scenes/UIScene.ts` `openImport`, `openReset`

**Intent**: Oba liczą `deviceSaveView(saver.status().blockedBy, saver.current(), ROOMS)`; `broken` zachowuje dzisiejsze
zamknięcie panelu; pozostałe idą do dialogu. Komentarze metod poprawione („Teraz” nie zawsze z savera).

#### 2. Dialogi

**File**: `src/ui/dom/saveImportDialog.ts` `openSaveImportDialog`, `src/ui/dom/saveResetDialog.ts` `openSaveResetDialog`,
`src/data/pl.ts` `pl.saveTransfer`, `docs/design-gaps.md` (wiersz 68 + odnośnik w 48/49)

**Intent**: `blocked` (`unavailable`; `fatal` nie dociera do panelu, ale dostaje ten sam widok) — import: krok pierwszy pokazuje linię i tylko „Zamknij” (bez wyboru pliku); reset: linia i tylko
„Zamknij”. `unreadable` — w miejscu listy „Teraz” linia ostrzeżenia i odesłanie do „Zachowaj kopię” przy następnym
uruchomieniu; „Wczytaj” i „Zacznij od nowa” dostępne jak dziś (fokus nadal na „Anuluj”). `summary` — bez zmian.
Komentarz `DESIGN-GAP 68` przy kluczach i w dialogach.

**Contract**: opcja `device: DeviceSaveView` zastępuje `current` w obu dialogach. Nowe klucze (brzmienie po teacher read):
`pl.saveTransfer.deviceUnavailable: 'Gra nie mogła odczytać zapisu na tym urządzeniu, więc nie może go teraz zastąpić. Uruchom grę ponownie i spróbuj jeszcze raz.'`,
`pl.saveTransfer.deviceUnreadable: 'Zapisu na tym urządzeniu nie da się odczytać. Jeśli chcesz go zachować, uruchom grę ponownie i na pierwszej karcie wybierz „Zachowaj kopię”. „Zapisz kopię” w tym panelu zapisuje tylko obecną grę.'`
(plan-review F3: rozróżnia przycisk karty startowej od eksportu z panelu, który przy `unreadable` zapisuje świeżą sesję).
Wiersz 68: „The kit has no line for a device save that was not read” → linia zamiast „Teraz”, brak akcji przy `unavailable`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (testy dialogów, jeśli istnieje harness DOM; inaczej `deviceSaveView` z fazy 2 i e2e fazy 9)
- `tests/dialogSessions.test.ts` zielony bez zmiany liczby callbacków (albo z uzasadnioną zmianą liczby, jeśli dialog zyskał callback)
- `npm run build` drukuje `e2e hook: absent (`
- E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`save-transfer.spec.ts`, `save-restart.spec.ts` zielone)

#### Manual Verification:

- [reviewer] Teacher read `pl.saveTransfer.deviceUnavailable`/`deviceUnreadable` (ton spokojny, dla dorosłego, bez kodów), wiersz 68
- [visual] Zrzuty dialogów: import i reset przy `?e2eSave=unavailable` (linia, tylko „Zamknij”) i przy `?e2eSave=unreadable` (ostrzeżenie zamiast „Teraz”, „Wczytaj”/„Zacznij od nowa” widoczne); import krok 2 i reset na zdrowym zapisie bez zmian — 1920×1080 i ~400 px szerokości (iframe 400×300)
- [human] Decyzja wbrew literze PRD FR-022: przy `unavailable` (także `timeout`) import i reset są niedostępne do ponownego uruchomienia gry

---

## Phase 7: Seam sweep, follow-upy i dokumentacja

Driver: impl
Driver why: ostatnia faza `impl`/`tdd` — seam sweep całej zmiany, wiersze design-gaps, follow-upy z `Trigger:` i zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Zamknięcie zmiany przed e2e.

### Changes Required:

#### 1. Seam sweep

**File**: pliki faz 1–6

**Intent**: brak drugiego źródła etykiet (żadnego `split('/').pop()` dla tekstu gracza); brak duplikatu formuły
`ceil(unlockShare · n)` (`unlockThreshold` z fazy 1 używana przez `unlockReady` i filtr); komentarze `ArtImage`,
`BootScene`, `UIScene.openImport/openReset`, `pick.ts` (nagłówek o filtrze) aktualne; `REGISTRY_KEYS.artHealth` poza
`SAVE_KEYS`; nieaktualne wiersze design-gaps (66, 48/49) spójne z 67/68.

#### 2. Follow-upy

**File**: `context/changes/art-stand-in-and-load-signal/follow-ups/review-fixes.md` (nowy)

**Intent**: Każdy z `Trigger:`: S14-05 (`Trigger: a parent report of money/mass/capacity among the weakest skills while
„Obrazki” shows missing`), S14-06 i S14-07 (`Trigger: a production report of a missing task image`), reszta S14-08
(`Trigger: the next change to BootScene.preload`), S14-09/S14-10 (`Trigger: S-14b or the next widget built on ArtImage`),
S12-02..S12-15 (S12-04 z dopiskiem o eksporcie świeżej sesji przy `unreadable`; `Trigger: the next change to the save
panel or autosave.replace`), S13-* (`Trigger: the next select/drag skill or S-13b`), kopia surowa w dialogu
(`Trigger: a parent who cannot reach the start card's copy`). Ponowione z uzasadnieniem (plan-review F6): audyt M-1, M-2, M-13, H-3, H-4
(`Trigger: next change to TaskScene / narrator`) — ta zmiana dotyka w `TaskScene` tylko argumentów w `freshRound`, nie
`beginRound`/`finishRound`/`applyParentStage` ani narratora (wzór `2026-10-13-drawn-widget-tasks-e3-e4`); odnotować jako
nadal otwarte z tym samym triggerem. Zamknięte w tej zmianie (z odnośnikiem do archiwum,
archiwum nieedytowane): „BootScene.preload loaderror” (`2026-10-14-art-tasks-all-stages`) i „Import or reset over an
unreadable save (impl-review F1)” (`2026-10-13-save-export-import-reset`).

#### 3. `CLAUDE.md`

**File**: `CLAUDE.md` „Current state”

**Intent**: Jedno zdanie: polski stand-in z `TASK_ART.label`, `REGISTRY_KEYS.artHealth` z `textures.exists` i sekcja
„Obrazki” (`src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`), filtr `src/core/round/artFilter.ts` z regułą
odblokowania, `deviceSaveView` i odmowa `replace` przy `unavailable`, szew `?e2eArt` (marker `e2eArt`), gaps 66–68.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/artHealthh.ts` → walidator FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł
- `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Seam sweep: jedno źródło etykiet, jedna formuła progu, komentarze, gaps 66–68 i 48/49 spójne, follow-upy z `Trigger:`
- [reviewer] `CLAUDE.md` „Current state” ma zdanie o tej zmianie
- [human] Decyzja: pomijanie umiejętności z wynikiem tylko na obrazku przy brakujących obrazkach zmienia skład rundy (FR-013) — z regułą, że krok bieżący nie traci odblokowania

---

## Phase 8: Brakujący obrazek dotykiem — e2e (#11)

Driver: e2e
Driver why: ryzyko #11 (runda grana prawdziwą ścieżką dotyku) przy brakującej lub niedekodowalnej teksturze istnieje tylko w renderowanej stronie: polska etykieta na płótnie, rekord z `textures.exists`, linia w DOM panelu; zbudowane w fazach 3–5, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/art-stand-in.spec.ts` (projekt `chromium-hook`, dopisany do `ROUND_SPEC` w `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/art-stand-in.spec.ts` (nowy), `playwright.config.ts` (`ROUND_SPEC`)

**Intent**: (a) „#11 a money task with missing art shows Polish values and plays to a star”: `?e2eArt=missing&e2eSkills=E4.1.money_count_100`
(etap przez `passWelcome`/wariant z etapem) → każde `snapshot.art` `loaded === false`, `label` pasuje do
`/^\d+ (zł|gr)$/`, żadne nie zawiera `-` → `answerRight` → gwiazdka. (b) „#11 a weight task with missing art labels every weight”:
`E3.4.mass_dag_100` → etykiety `/^\d+ dag$/`. (c) „#11 the parent panel counts missing pictures”: `?e2eArt=missing` →
`snapshot.artHealth.missing === snapshot.artHealth.total` → przytrzymanie + bramka rodzica → tekst sekcji „Obrazki” w DOM
zawiera liczbę brakujących. (d) „#11 a picture that does not decode counts as missing (S14-04)”: `?e2eArt=corrupt` →
`artHealth.missing > 0`, gra w rundzie bez karty błędu.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na migawce, bez `page.clock`; tekst
asertowany tylko w DOM; nowy kontekst = świeże urządzenie.

**Chromium niedostępny w sesji agenta**: protokół request-file — spec bez commita, `e2e-request-p7.md` (komendy
zielonych uruchomień i tabela przerw), patche `e2e-break-p7a.patch` … `e2e-break-p7c.patch` (tylko kod produkcyjny),
`STATUS: BLOCKED — e2e needs orchestrator run (request file written)`; agent kończący commituje spec po wyniku orkiestratora.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/art-stand-in.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`
- Deliberate break (patch `e2e-break-p7a.patch`): `ArtImage` bierze etykietę z klucza → (a)/(b) czerwone na `label`; meta-check: dowodzi źródła etykiety, nie widoczności pudełka
- Deliberate break (patch `e2e-break-p7b.patch`): rekord zdrowia liczony tylko z `loaderror` (bez `textures.exists`) → (d) czerwony; meta-check: dowodzi S14-04, bo `corrupt` nie emituje `loaderror`
- Deliberate break (patch `e2e-break-p7c.patch`): `UIScene.openSettings` nie przekazuje `artHealth` → (c) czerwony na tekście DOM; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Phase 9: Import i reset przy nieodczytanym zapisie — e2e (#2)

Driver: e2e
Driver why: ryzyko #2 (postęp nigdy nie ginie) przy imporcie/resecie po `unavailable`/`unreadable` istnieje tylko w przeglądarce z prawdziwym IDB i dialogami DOM; zbudowane w fazach 2 i 6, kontrakt `E2E=on`.

### Overview

Nowy `tests/e2e/save-transfer-blocked.spec.ts` (projekt `chromium-hook`), wzór `save-restart.spec.ts` (szwy `?e2eSave`)
i `save-transfer.spec.ts` (dialogi).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/save-transfer-blocked.spec.ts` (nowy), `playwright.config.ts` (`ROUND_SPEC` — wymagane: projekt
`chromium-hook` ma `testMatch: ROUND_SPEC`, a `chromium` go ignoruje; nazwa `save-transfer-blocked` nie pasuje do
obecnego wzorca `save-transfer\.spec`). Pomocnicy: `openSettings` w `tests/e2e/support/welcome.ts`, przejście karty
`unavailable` jak w `save-restart.spec.ts` (`page.goto('/?e2eSave=unavailable')`)

**Intent**: (a) „#2 an unavailable save cannot be overwritten by import or reset”: `?e2eSave=unavailable` → karta → „Graj
dalej” → panel rodzica → „Wczytaj z pliku”: linia `deviceUnavailable`, brak „Wybierz plik”, brak listy „Teraz”; „Zacznij od
nowa”: linia, brak przycisku potwierdzenia; hak `save` — `replace` nie zmienił stanu, liczba zapisów magazynu bez zmian.
(b) „#2 an unreadable save warns instead of showing the fresh session”: `?e2eSave=unreadable` → reset: linia
`deviceUnreadable`, brak „0 gwiazdek” w dialogu, przycisk „Zacznij od nowa” obecny; import krok 1 dostępny.

**Contract**: jak faza 8; teksty z dialogu DOM, stan z haka tylko do odczytu; nigdy nie otwierać IDB z testu.
Request-file: `e2e-request-p8.md`, patche `e2e-break-p8a.patch`, `e2e-break-p8b.patch`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-transfer-blocked.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e po fazie 8> + 2`
- Deliberate break (patch `e2e-break-p8a.patch`): `UIScene.openImport/openReset` przekazują `deviceSaveView(null, …)` (ignorują `blockedBy`) → (a) i (b) czerwone na linii/„Teraz”; meta-check: dowodzi sklejki, nie tekstu
- Deliberate break (patch `e2e-break-p8b.patch`): dialog resetu pokazuje potwierdzenie przy `unavailable` i `replace` odmawia tylko `fatal` → (a) czerwony na przycisku i na liczbie zapisów; przywrócone
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `artHealth`/`artHealthView` (wszystko, braki, puste, `unknown`); `artBlocked` per typ i wariant; `withoutArtBlocked`
  (próg kroku bieżącego, E2.2, E5.5, wszystko zablokowane, pusty zbiór = ta sama tablica); `buildAdaptiveRound`/
  `buildWarmup` z i bez brakujących id (seed identyczny bez braków, brak MONEY_COUNT poza chronionym krokiem).
- `replace` przy `unavailable`/`unreadable`/`fatal` (liczba zapisów magazynu); `deviceSaveView` dla każdego `blockedBy`.
- `taskArt.test.ts`: `id`, `label` z danych (S14-11); `pl.settings.artMissing` dla 1, 2, 5, 22, 38.
- `tests/spoken.test.ts`: limity `30_000`.

### Integration Tests:

- `npm run sample -- E1..E6` (wyjście bez zmian), `npm run build` (strażnik `e2eArt`), e2e: `art-stand-in.spec.ts` (+4),
  `save-transfer-blocked.spec.ts` (+2), istniejące `art-tasks`, `save-transfer`, `save-restart` bez zmian.

### Manual Testing Steps:

1. Zrzuty stanów z faz 4–6 (bramka wizualna).
2. Teacher read tekstów `pl.settings.art*`, `pl.saveTransfer.device*` i 38 etykiet.
3. Tablet: stand-in czytelny na iPadzie przy DPR 2 (opcjonalnie przez `?e2eArt` na buildzie hook).

## Performance Considerations

`textures.exists` × 38 raz w `BootScene.create`; filtr pul liniowy w liczbie umiejętności etapu, raz na rundę. Skalowanie
etykiety jak w `BarChart` (jedno `setScale` na `show`).

## Migration Notes

Brak. `SAVE_VERSION` zostaje 1, fixtury nietknięte; `artHealth` tylko w rejestrze runtime. Bez brakujących obrazków
rundy są identyczne jak przed zmianą (ten sam seed).

## Known risks

- **Rzadki stan, trudny do zobaczenia**: realny brak obrazka na produkcji jest nieudowodniony (audyt § 8); szew `?e2eArt`
  dowodzi ścieżek, a nie częstości.
- **Uczeń na kroku z samymi obrazkami (E5.5) przy trwałym braku**: dostaje zadania ze stand-inem (reguła progu), nie
  pomija kroku — świadomie (decyzja 2).
- **Chromium w sesji agenta**: fazy 8–9 w protokole request-file; zrzuty faz 4–6 mogą wymagać fallbacku Playwright z
  `visual-gate.md` (długie przytrzymanie dla panelu rodzica).
- **Eksport przy `unreadable` (plan-review F3)**: „Zapisz kopię” w panelu eksportuje świeżą sesję (S12-04, follow-up);
  rodzic może ją wziąć za kopię nieczytelnego zapisu i potem zresetować. Łagodzi to tekst `deviceUnreadable` (rozróżnia
  oba przyciski) i to, że karta z „Zachowaj kopię” wraca przy każdym uruchomieniu (`writesOff` przy `unreadable`), ale
  sam dialog eksportu nie ostrzega.
- **Teksty**: `artMissing` brzmi formalnie; teacher read może skrócić — zmiana tylko w `pl.ts`.

## References

- Research: `context/changes/art-stand-in-and-load-signal/research.md`; change: `context/changes/art-stand-in-and-load-signal/change.md`
- Audyt obserwowalności 2026-10-14_0445 (PR #42): S14-01, S14-02, S14-03, S14-04, S14-11, S12-01
- Kontrakt runu `context/runs/2026-10-14-fix-art-stand-in/agent-contract.md` („Slice-specific rules”); profil `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test-plan: `context/foundation/test-plan.md` ryzyka #2, #11, #15; `context/foundation/test-stack.md` § E2E
- Wzorce: `context/archive/2026-10-13-save-observability-c1-c2/` (`saveHealthView`), `context/archive/2026-10-14-art-tasks-all-stages/` (`ArtImage`, gap 66, `e2e-request-p10.md`), `src/ui/widgets/BarChart.ts` `render`
- PRD `context/foundation/prd.md` FR-013, FR-014, FR-022, FR-023

## Autonomous decisions

1. **S14-01 obiema warstwami: polska etykieta zawsze + pomijanie umiejętności z wynikiem tylko na obrazku (MONEY_COUNT,
   MASS, CAPACITY `toLitres`).** Odrzucone: tylko etykieta (kontrakt woli niepokazywanie); filtr wszystkich rodzajów z
   obrazkiem (COUNT, MULT_GROUPS, termometr, MONEY_CHANGE, CAPACITY `howMany` są rozwiązywalne pudełkami lub tekstem —
   research (b)); filtr w `playable` (przesuwa numerację i odblokowanie). Zmieniłoby: teacher read uznający, że pudełko
   „5 zł” jest mylące także w MONEY_CHANGE → dołożenie typu do `artBlocked` (jedna linia + test).
2. **Zastój odblokowania E2.2/E5.5 przy brakujących obrazkach: rozwiązany regułą progu, nie zaakceptowany.** Kubełek
   bieżącego kroku jest filtrowany tylko, gdy zostaje ≥ `ceil(unlockShare · n)` grywalnych umiejętności — inaczej dziecko
   dostaje zadania ze stand-inem (rozwiązywalne dzięki etykiecie) i może odblokować krok. Odrzucone: rekomendacja researchu
   „filtr z fallbackiem tylko przy pustej rundzie, `unlockReady` bez zmian, akceptacja zastoju” (przy trwałym braku obrazka
   dziecko utknęłoby na E2.2/E5.5 — sprzeczne z FR-014 „jedna trudna umiejętność nie blokuje kroku” i „bez stanów porażki”);
   `unlockReady` liczony tylko po niezablokowanych (zależność odblokowania od stanu runtime, kroki odblokowane bez ćwiczenia).
   Zmieniłoby: decyzja opiekuna, że stand-in w kroku bieżącym jest gorszy niż zastój → filtr bez progu (zmiana `minCurrent` na 1).
   Skład rundy przy brakach zmienia się wbrew literze FR-013 → `[human]` 7.7.
3. **Jedno źródło zdrowia: `textures.exists` dla każdego wpisu `TASK_ART` w `BootScene.create`; `loaderror` tylko log
   rozróżniony po typie (część S14-08).** Odrzucone: `totalFailed`/zdarzenia (ślepe na błąd dekodowania); liczba na karcie
   błędu (gra działa). Zmieniłoby: `loader.imageLoadType: 'HTMLImageElement'` (wtedy `loaderror` też łapie dekodowanie, ale `exists` dalej poprawne).
4. **S12-01: `unavailable` (w tym `timeout`) → odmowa w `core` (`replace` `'Blocked'`) i w dialogu (tylko „Zamknij”);
   `unreadable` → linia ostrzeżenia zamiast „Teraz” z odesłaniem do „Zachowaj kopię” na karcie startowej, import/reset
   dozwolone; bez przycisku kopii surowej w dialogu i bez ponownego odczytu magazynu.** Odrzucone: kopia surowa w dialogu
   (trzymanie `raw`/`reason` w runtime, nowa ścieżka eksportu — follow-up); ponowny odczyt (S12-02, bez limitu czasu);
   ostrzeżenie + zgoda przy `unavailable` (nadpisanie niewidzianego, być może zdrowego zapisu). Wbrew literze FR-022
   (rodzic importuje/resetuje) → `[human]` 6.7. Zmieniłoby: pomiar N-7 z częstym `timeout` na zdrowym IDB → ponowny odczyt
   z limitem czasu przed „Teraz”.
5. **Etykiety stand-inu jako pole `label` w `TASK_ART` z danych pomiarowych, bez nowych kluczy `pl.ts`; pusta dla wagi i
   ramy termometru.** Odrzucone: pole `label` dopisane ręcznie w `MONEY` (duplikat `formatMoney`); tabela w `pl.ts`. Zmieniłoby:
   teacher read chcący napisu „waga”/„termometr” na pustych pudełkach → dwa klucze `pl.ts`.
6. **Rekord `artHealth` i `id` w `TaskArtEntry` w fazie 3 (linia panelu w fazie 4), etykiety w fazie 5**: szew i rekord muszą istnieć przed zrzutami
   stand-inu. Odrzucone: jedna faza „art” (≥ 2 obszary UI naraz + szew).
7. **Limit czasu `30_000` na trzech testach `forEachTask` w fazie 1** (zmiana tylko testu, bez czerwonej fazy — stabilizuje
   bramkę każdej kolejnej fazy). Odrzucone: globalny `testTimeout`. Zmieniłoby: pomiar pokazujący inny wolny test.
8. **Szew `?e2eArt=missing|corrupt` w buildzie hook, nie `page.route`** (SW precache przejmuje żądania). `corrupt` przez URL
   pliku nie-obrazu (200 + `onProcessError`), nie przez zły URL (fallback `vite preview` niesprawdzony).
9. **Zrzuty: stany na płótnie 1920×1080 i 1024×768 (profil § 9), dialogi DOM 1920×1080 i ~400 px (iframe 400×300
   poziomo, bo pion pokazuje „Obróć tablet”).** Krok runu prosi o ~400 px; profil nie zna telefonu. Zmieniłoby: profil § 9 z inną szerokością wąską.
10. **Dziewięć faz: 2 × tdd (1, 2), 5 × impl (3–7; nowy komponent tylko `artHealthView` w fazie 4; `ArtImage` i dwa dialogi
    zmieniane), 2 × e2e po seam sweep (8: #11, 9: #2).** (Plan-review F1: dawna faza 3 rozdzielona na sygnał/szew/filtr i linię panelu.) Bez `AskUserQuestion` (kontrakt reguła 1): złożoność MEDIUM,
    pytania rozstrzygnięte z research i change.md; brak wpisu w roadmapie (zmiana spoza roadmapy, roadmapa nietknięta).
11. **`deviceSaveView` jako czysta funkcja w `core`, dialogi dostają gotowy widok** (wzór `saveHealthView`), zamiast
    przekazywania `blockedBy` do DOM i decydowania tam. Zmieniłoby: brak.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Zdrowie obrazków i filtr umiejętności zależnych od obrazka w `core`; limit czasu testów spoken

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — 3be41c7
- [x] 1.2 Deliberate break: filtr `current` bez progu / CAPACITY `howMany` zablokowane / rng przy pustym zbiorze → czerwone; przywrócone; meta-check — 3be41c7
- [x] 1.3 `npm run sample -- E1` … `E6` bez zmian w wyjściu; `tests/fixtures/` bez zmian — 3be41c7
- [ ] 1.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 1.5 [reviewer] `artHealth.ts` i `artFilter.ts` bez Phasera, globali i importu `taskArt.ts`; `playable` nietknięty, `unlockReady` bez zmiany zachowania

### Phase 2: Stan zapisu na urządzeniu dla importu i resetu, odmowa `replace` przy `unavailable`

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Deliberate break: `replace` tylko `fatal` / `deviceSaveView` z `summary` przy `unreadable` → czerwone; przywrócone; meta-check
- [ ] 2.3 `tests/fixtures/save-v1*.json` bez zmian; `SAVE_VERSION` 1
- [ ] 2.4 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 2.5 [reviewer] Żaden nowy stan w `SaveState`/`encodeSave`; `unreadable` nadal pozwala na import i reset

### Phase 3: Sygnał wczytania w `BootScene`, szew `?e2eArt` i filtr w `TaskScene`

#### Automated

- [ ] 3.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (test `id`, jawne przypadki `e2eArt` w strażniku)
- [ ] 3.2 `npm run build` drukuje `e2e hook: absent (`; build hook zawiera `e2eArt`
- [ ] 3.3 Deliberate break: odczyt `e2eArt` poza `__E2E_HOOK__` → `npm run build` pada „leaked”; przywrócone; meta-check
- [ ] 3.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 3.5 [reviewer] `REGISTRY_KEYS.artHealth` poza `SAVE_KEYS`; `forcedSkills` omija filtr; brak rekordu = nic nie brakuje; `TaskScene` tylko argumenty w `freshRound`

### Phase 4: Linia „Obrazki” w panelu rodzica

#### Automated

- [ ] 4.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (test `artMissing` dla 1, 2, 5, 22, 38)
- [ ] 4.2 Deliberate break: `artMissing` w złej formie dla 2 → test tekstu czerwony; przywrócone
- [ ] 4.3 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 4.4 [reviewer] Teacher read `pl.settings.art*` (1 / 2–4 / 5+ i 22–24), wiersz 67 i komentarz `DESIGN-GAP 67`
- [ ] 4.5 [visual] Zrzuty panelu rodzica: „Obrazki” OK, z brakami (`?e2eArt=missing`, `?e2eArt=corrupt`) — 1920×1080 i ~400 px

### Phase 5: Polski stand-in z danych i dopasowanie tekstu w `ArtImage`

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 5.2 Deliberate break: etykieta monety z klucza → `taskArt.test.ts` czerwony; przywrócone; meta-check
- [ ] 5.3 `npm run sample -- E1 … E6 --count 6` bez naruszeń, wyjście bez zmian
- [ ] 5.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0`

#### Manual

- [ ] 5.5 [reviewer] Teacher read 38 etykiet (kwoty `formatMoney`, „½ l”, „¼ l”, nazwy ikon w mianowniku)
- [ ] 5.6 [visual] Zrzuty stand-inów (`?e2eArt=missing`): monety, banknoty, dzbanki, waga z odważnikami, ikony COUNT i MULT_GROUPS, termometr; każdy także w fazie rozwiązania przy klawiaturze — 1920×1080 i 1024×768

### Phase 6: Import i reset po nieudanym odczycie zapisu

#### Automated

- [ ] 6.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`
- [ ] 6.2 `tests/dialogSessions.test.ts` zielony (liczba callbacków bez zmian albo uzasadniona)
- [ ] 6.3 `npm run build` drukuje `e2e hook: absent (`
- [ ] 6.4 E2E (orkiestrator): pełne `<baseline gałęzi e2e> + 0` (`save-transfer`, `save-restart` zielone)

#### Manual

- [ ] 6.5 [reviewer] Teacher read `pl.saveTransfer.deviceUnavailable`/`deviceUnreadable`, wiersz 68
- [ ] 6.6 [visual] Zrzuty dialogów importu i resetu przy `?e2eSave=unavailable` i `?e2eSave=unreadable` oraz na zdrowym zapisie — 1920×1080 i ~400 px
- [ ] 6.7 [human] Decyzja wbrew literze PRD FR-022: przy `unavailable` import i reset niedostępne do ponownego uruchomienia

### Phase 7: Seam sweep, follow-upy i dokumentacja

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`, jeśli sweep zmienił kod
- [ ] 7.2 `validate-rule-files.sh` PASS
- [ ] 7.3 Deliberate break: `CLAUDE.md` z nieistniejącą ścieżką → FAIL; przywrócone; meta-check
- [ ] 7.4 `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 7.5 [reviewer] Seam sweep: jedno źródło etykiet, jedna formuła progu, komentarze, gaps 66–68 i 48/49, follow-upy z `Trigger:`
- [ ] 7.6 [reviewer] `CLAUDE.md` „Current state” ma zdanie o tej zmianie
- [ ] 7.7 [human] Decyzja: pomijanie umiejętności z wynikiem tylko na obrazku zmienia skład rundy (FR-013), z regułą progu kroku bieżącego

### Phase 8: Brakujący obrazek dotykiem — e2e (#11)

#### Automated

- [ ] 8.1 `art-stand-in.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 4`
- [ ] 8.2 Deliberate break (patch `e2e-break-p7a.patch`): etykieta z klucza → (a)/(b) czerwone; meta-check
- [ ] 8.3 Deliberate break (patch `e2e-break-p7b.patch`): zdrowie tylko z `loaderror` → (d) czerwony; meta-check
- [ ] 8.4 Deliberate break (patch `e2e-break-p7c.patch`): panel bez `artHealth` → (c) czerwony; przywrócone
- [ ] 8.5 `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 9: Import i reset przy nieodczytanym zapisie — e2e (#2)

#### Automated

- [ ] 9.1 `save-transfer-blocked.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e po fazie 8> + 2`
- [ ] 9.2 Deliberate break (patch `e2e-break-p8a.patch`): sklejka ignoruje `blockedBy` → (a)/(b) czerwone; meta-check
- [ ] 9.3 Deliberate break (patch `e2e-break-p8b.patch`): potwierdzenie resetu przy `unavailable` i `replace` tylko `fatal` → (a) czerwony; przywrócone
- [ ] 9.4 `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite
