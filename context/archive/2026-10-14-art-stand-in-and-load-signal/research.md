---
date: 2026-10-14T09:00:13+0200
researcher: Claude (autonomous run 2026-10-14-fix-art-stand-in, krok research)
git_commit: a2baebb
branch: feat/art-stand-in-and-load-signal
repository: Martynka-urzadza
topic: "Polski stand-in obrazka, sygnał nieudanego wczytania dla rodzica, import/reset po nieudanym odczycie (S14-01..04, S14-11, S12-01) + limit czasu testów spoken"
tags: [research, ArtImage, BootScene, taskArt, curriculum, autosave, saveImportDialog, saveResetDialog, e2e]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (autonomous run)
---

# Research: stand-in obrazka, sygnał wczytania, import/reset po nieudanym odczycie

**Date**: 2026-10-14T09:00:13+0200 · **Git Commit**: `a2baebb` · **Branch**: `feat/art-stand-in-and-load-signal`

## Research Question

Pytania (a)–(g) z kroku runu, wyprowadzone z `change.md` (Notes, „Audit claims vs repo now”, decyzje 1–8):
(a) jak w Phaserze 4.2.1 objawia się błąd dekodowania i jaki test po wczytaniu jest najpewniejszy (S14-04);
(b) jak wybór rundy może pominąć umiejętności zależne od obrazka (S14-01 warstwa 2);
(c) polskie etykiety stand-inu z danych i dopasowanie tekstu (S14-01/02/11);
(d) gdzie rodzic widzi linię zdrowia obrazków (S14-03);
(e) S12-01: wartości `blockedBy` przy imporcie/resecie, co dziś pokazuje „Teraz”, bezpieczne zachowanie per powód;
(f) szew e2e `?e2eArt=…` i pokrycie ryzyk;
(g) wzorzec limitu czasu z `cd42b4a`.

`lessons.md` w `context/foundation/` nie istnieje (sprawdzone `ls`), więc nie stosowano żadnej lekcji.

## Summary

- **(a)** W tym projekcie obrazy idą ścieżką XHR (gra nie ustawia `loader` w configu, `Config.loaderImageLoadType` domyślnie `'XHR'`). Plik niedekodowalny z HTTP 200 **nie** emituje `loaderror` i **nie** zwiększa `totalFailed` (liczony do `totalComplete`); jedynym sygnałem jest `console.error('Failed to process file: image "<key>"')` z `File.onProcessError`. 404 emituje `loaderror` i zwiększa `totalFailed`. W żadnym z tych dwóch przypadków tekstura nie jest rejestrowana, więc `textures.exists(key)` zwraca `false`. **Jedyny test łapiący oba: `this.textures.exists(key)` dla każdego klucza `TASK_ART` w `BootScene.create`.** Hipoteza z decyzji 4 („Phaser rejestruje `__MISSING` pod kluczem”) obalona — decyzja 4 stoi.
- **(b)** Umiejętności zależne od obrazka są w 14 krokach; **trzy kroki są w całości zależne od obrazka: E1.10, E2.2, E5.5**. Filtr w `playable` przesunąłby numerację kroków i odblokowanie — odradzany. Bezpieczne miejsce: osobny czysty filtr na poziomie rundy (kubełki po `skillBuckets` w `buildAdaptiveRound`, pule w `buildWarmup`/`pickSkills`) z wejściem „brakujące klucze”, plus **powrót do niefiltrowanej puli, gdy filtr opróżniłby rundę** (dziś `pickRoundSkills` rzuca `RangeError('No playable skills in any bucket')`, a `pickSkills` rzuca `RangeError('Stage X has no playable skills')`). Koszt: przy brakujących obrazkach `unlockReady` nie przejdzie kroków E2.2/E5.5 (dziecko ćwiczy kroki wcześniejsze, bez stanu porażki). Rekomendacja: warstwa 1 (polska etykieta) obowiązkowa; warstwa 2 tylko dla rodzajów, gdzie wynik jest wyłącznie na obrazku, z fallbackiem.
- **(c)** Etykieta z danych jako pole `label` w `TaskArtEntry` (`src/data/taskArt.ts`): monety/banknoty `formatMoney(grosze)` (dane mogą importować `core/text/*`), odważniki `WEIGHTS[].label`, dzbanki `JUGS[].label`, ikony `ICONS[].noun`, `balance-scale` i `thermometer-frame` — pusta etykieta (waga i termometr mają resztę rysowaną w kodzie) albo krótki tekst z `pl.ts`. `ArtImage` już importuje `TASK_ART` (mapa `SIZES`), więc bierze etykietę stamtąd; scena nie trzyma tekstu. Dopasowanie: wzorzec z `BarChart.render` (`setScale(room / displayWidth)`).
- **(d)** Linia „Obrazki” w panelu `openSettingsPanel` obok `createSaveHealthView`, czysty widok w `src/core/` na wzór `saveHealthView`, rekord w nowym `REGISTRY_KEYS.artHealth` (poza `SAVE_KEYS`). Karta błędu (`errorCard.ts`) jest tylko dla awarii fatalnej — nie dokładać (decyzja 4).
- **(e)** W chwili importu/resetu `blockedBy ∈ {null, 'unreadable', 'unavailable', 'fatal'}`; `unavailable` obejmuje odrzucony odczyt i `timeout` (`loadSave`, `error.name === 'timeout'`). „Teraz” to dziś `saveSummary(decodeSave(saver.current()).session)` — przy `unreadable`/`unavailable` świeża sesja („0 gwiazdek”). Rekomendacja: `unavailable` → odmowa w `replace` (core) i w dialogu jedna linia zamiast podsumowania; `unreadable` → zamiast „Teraz” linia „zapis na urządzeniu jest nieczytelny” + kopia surowa (wymaga zachowania `raw` w runtime), import/reset dozwolone po ostrzeżeniu; `fatal` → bez zmian (już odmawia, panel zakryty kartą). Bez ponownego odczytu magazynu.
- **(f)** Szew `?e2eArt=missing|corrupt` czytany w `main.ts` (wzorzec `e2eSkills` → `REGISTRY_KEYS.forced*`), stosowany w `BootScene.preload` tylko pod `__E2E_HOOK__`, marker `'e2eArt'` w `E2E_HOOK_MARKERS`. `page.route` odradzany (brak `serviceWorkers: 'block'`, SW precache przejmuje żądania). Ryzyka: test-plan #11 (runda dotykiem, spec `art-tasks.spec.ts`), #2 (postęp nie ginie, `save-restart.spec.ts`, `save-transfer.spec.ts`).
- **(g)** `cd42b4a` dał `}, 30_000);` z komentarzem tylko testowi „every phase of every task is free of operator glyphs”. Pomiar w izolacji (ten krok): 461 ms / 285 ms / 416 ms / 1436 ms dla czterech testów `forEachTask`; w baseline pod obciążeniem pierwszy miał 5,3 s (≈ ×11). Przy tym współczynniku wszystkie trzy testy bez limitu są w zasięgu 5 s → limit `30_000` na wszystkich trzech.

## Detailed Findings

### (a) Phaser 4.2.1: 404 vs błąd dekodowania (S14-04)

Źródło: `node_modules/phaser/src/`. Wynik subagenta zweryfikowany w głównym kontekście dla `File.onProcessError` i `Config.loaderImageLoadType`.

| Ścieżka | `loaderror` (`FILE_LOAD_ERROR`) | `totalFailed` | Tekstura pod kluczem | Konsola |
|---|---|---|---|---|
| 404 / błąd sieci (`File.onLoad` → `success=false`, `File.onError`) | tak, z plikiem | +1 (`LoaderPlugin.nextFile`) | brak | tylko błąd sieci przeglądarki |
| 200, niedekodowalny (XHR: `nextFile(file, true)` → `ImageFile.onProcess` → `img.onerror` → `File.onProcessError`) | **nie** | **nie** (liczony do `totalComplete`) | brak (`fileProcessComplete` pomija `addToCache` przy `FILE_ERRORED`) | `console.error('Failed to process file: %s "%s"', type, key)` |
| ścieżka `HTMLImageElement` (`ImageFile.loadImage`) | tak | +1 | brak | — |

- `core/Config.js`: `loaderImageLoadType = GetValue(config, 'loader.imageLoadType', 'XHR')`; `src/main.ts` `createGame` nie ustawia `loader` (grep `loader|imageLoadType` w `src/main.ts`: brak trafień) → ścieżka XHR.
- W `loader/events/` nie ma zdarzenia błędu przetwarzania (są: ADD, COMPLETE, FILE_COMPLETE, FILE_KEY_COMPLETE, FILE_LOAD, FILE_LOAD_ERROR, FILE_PROGRESS, POST_PROCESS, PROGRESS, START).
- `TextureManager.exists(key)` = `this.list.hasOwnProperty(key)` → `false` po obu awariach; `TextureManager.get` po cichu zwraca `__MISSING` (dlatego `ArtImage` sprawdza `exists`, a nie `get`).
- `LoaderPlugin.start` zeruje `totalFailed`/`totalComplete`; `COMPLETE(loader, totalComplete, totalFailed)` ma te same liczniki — oba ślepe na błąd dekodowania.
- **Wniosek:** rekord zdrowia = `TASK_ART.filter(e => !this.textures.exists(e.key))` w `BootScene.create`. `loaderror` zostaje tylko do logu (może dodać `file.url`/`file.type`, to S14-08 — kilka linii, plan może wziąć). Dziś słuchacz `loaderror` w `BootScene.preload` obejmuje też font (`this.load.font`), a komunikat mówi „Task art failed” — follow-up z S-14 do zamknięcia.

### (b) Umiejętności zależne od obrazka i wybór rundy (S14-01 warstwa 2)

Rodzaje rysunku z obrazkiem (`src/core/tasks/visual.ts` `TaskVisual`): `money` (`items: MoneyId[]`), `scale` (`item: IconId`, `weights: WeightId[]` + obraz wagi), `jugs` (`jugs: JugId[]`), `thermometer` (tylko obraz ramy; skala, słupek, opisy rysowane w kodzie w `Thermometer.render`), `icons` (`icon`, `groups`, `framed`). `clock`, `ruler`, `blocks`, `bars` — w całości w kodzie.

| Generator | Rodzaj | Klucze | Wynik tylko na obrazku? |
|---|---|---|---|
| MONEY_COUNT `generateMoneyCount` | money | `params.ids` | **tak** (`pl.tasks.moneyCountPrompt` bez kwoty) |
| MONEY_CHANGE `generateMoneyChange` | money | `params.ids` | nie (`pl.tasks.moneyChange` podaje kwotę i cenę) |
| MASS `generateMass` | scale | `params.weights`, `SCALE_ITEMS[].icon`, waga | **tak** (`massPrompt` bez masy) |
| CAPACITY (toLitres) `generateCapacity` | jugs | `params.jugs` | **tak** (`capacityLitresPrompt`) |
| CAPACITY (howMany) | jugs | `params.jugs[0]` | nie |
| TEMPERATURE | thermometer | rama | nie (skala w kodzie) |
| COUNT `generateCount` | icons | dowolna z `ICONS` (`rng.pick`) | pudełka da się policzyć |
| MULT_GROUPS `generateMultGroups` | icons framed | `PLATE_ICONS` | grupy widoczne (ramki w kodzie) |

Kroki z umiejętnościami zależnymi od obrazka (skrypt subagenta po `src/data/curriculum/E1.ts`–`E6.ts`; liczba = obrazkowe / wszystkie w kroku):
E1.2 1/2, E1.4 1/3, **E1.10 1/1**, E1.11 3/5, **E2.2 3/3**, E2.8 3/4, E3.4 2/6, E3.9 2/4, E3.11 1/4, E4.1 4/8, E4.7 2/4, E5.4 1/3, **E5.5 2/2**, E6.1 2/3.
Jeśli filtr obejmuje tylko rodzaje „wynik tylko na obrazku” (MONEY_COUNT, MASS, CAPACITY toLitres), E1.10 (COUNT) przestaje być w całości zależny; E2.2 (money_count_20, money_change_20, capacity_litres) i E5.5 (capacity_quarter_l, mass_half_kg_e5) — do sprawdzenia przez plan na parametrach konkretnych umiejętności (wariant CAPACITY zależy od `params`).

Budowa rundy:
- `src/core/round/pick.ts` `playable(skill)` — statyczny predykat (tryb odpowiedzi + `getGenerator`); używany przez `playableSteps`, `currentStep`, `calendarStart`, `skillBuckets`, `unlockReady` (`src/core/curriculum.ts`), `firstPlayableSteps`/`pickSkills` (`pick.ts`) i `forcedSkills` (`src/testing/e2eHook.ts`). **Zmiana `playable` przesunęłaby numerację i odblokowanie — odradzane.**
- `buildAdaptiveRound` (`curriculum.ts`): `skillBuckets` → `pickRoundSkills` (`pick.ts`) → `distinctTasks`. Pusty kubełek oddaje wagę pozostałym; wszystkie puste → `RangeError('No playable skills in any bucket')`.
- `buildWarmup` jest w `src/core/round/warmup.ts` (nie `placement.ts`, jak zakładał krok runu) → `pickSkills`, który rzuca przy pustej puli.
- `?e2eSkills`: `TaskScene.freshRound` → `forcedSkills` przed `buildAdaptiveRound`, z pominięciem kubełków — wymuszone umiejętności ominą filtr (dobrze: e2e może zobaczyć stand-in).
- **Wejście czystej funkcji:** `SkillDef.type` + `SkillDef.params` (`src/core/types.ts`) i parsery `getParser(type)` (`src/core/tasks/registry.ts`: `parseMoneyCountParams` → `ids`, `parseMassParams` → `weights`, `parseCapacityParams` → `jugs`). Core może wyliczyć potrzebne id z `src/data/measures.ts` (core już importuje `src/data/measures.ts`, m.in. `src/core/tasks/visual.ts`; `eslint.config.mjs` blok `src/core/**` zabrania tylko `phaser` i `idb-keyval`, więc import `src/data/taskArt.ts` z core też przeszedłby lint, ale konwencja to podawać dane argumentem). Prostsze wejście: scena tłumaczy brakujące klucze na brakujące **id** (`MoneyId | WeightId | JugId | IconId | 'scale' | 'thermometer'`) i podaje zbiór do czystej funkcji `artBlocked(skill, missingIds)`.
- Rekomendacja: `withoutArtBlocked(buckets, missing)` w `buildAdaptiveRound` i odpowiednik w `buildWarmup`; jeśli wynik pusty → pula niefiltrowana (polska etykieta i tak czyni zadanie rozwiązywalnym). `unlockReady` bez zmian (świadomy koszt: przy trwałym braku obrazków dziecko nie przejdzie E2.2/E5.5; rodzic widzi linię „Obrazki”).

### (c) Polskie etykiety stand-inu i dopasowanie (S14-01, S14-02, S14-11)

- Dziś: `ArtImage.show` → `this.label.setText(key.split('/').pop() ?? key)`, styl `textStyle('artLabel')` = `FONT_SIZES.artLabel: 24` (`src/data/layout.ts`), brak dopasowania; pudełko `ART_STAND_IN` (kolory z `PLACEHOLDER_COLORS`).
- Źródła etykiet (wszystkie w danych): `MONEY[].grosze` + `formatMoney` (`src/core/text/measure.ts`: „5 zł”, „20 gr”; `MONEY` nie ma `label`); `WEIGHTS[].label` („10 dag”, „1 kg”); `JUGS[].label` („1 l”, „½ l”, „¼ l”); `ICONS[].noun` („filiżanka”, „jabłko”…, mianownik ze słownika `nouns.ts`).
- Miejsce: pole `label` w `TaskArtEntry` budowane w `TASK_ART` (`src/data/taskArt.ts`), bo `TASK_ART` to jedyna lista kluczy i `ArtImage` już ma mapę `SIZES` z niej. `src/data/` może importować `core/text/*` (CLAUDE.md, reguła ESLint). Test: każdy wpis `TASK_ART` ma polską etykietę bez `-` i różną od id pliku (S14-11), poza świadomie pustymi (`balance-scale`, `thermometer-frame`).
- Dopasowanie: wzorzec `BarChart.render` (`if (label.displayWidth > room) label.setScale(s * room / label.displayWidth)`); dla stand-inu `room = width − 2·padding`, ewentualnie także wysokość. Najmniejsze pudełka: odważnik w `BalanceScale` (pole 84 px wg audytu S14-02) i obszar rysunku 190 px w fazie rozwiązania (follow-up O1 z S-14) — bramka wizualna z szwem `?e2eArt`.
- `ArtImage.state()` może zwracać `label` (dla hooka e2e: asercja polskiego tekstu bez czytania layoutu).
- Komentarze do poprawienia (S14-11): nagłówek klasy `ArtImage` („so a failed load leaves the task playable”), komentarz w `BootScene.preload` („A missing drawing is not fatal: ArtImage draws a stand-in”), wiersz 66 `docs/design-gaps.md`.
- Teacher read: zmiana w `src/data/` uruchamia regułę z CLAUDE.md (`npm run sample -- <stage> --count 6`); etykiety nie występują w treści zadań, więc odczyt dotyczy brzmienia etykiet (np. „5 gr” na pudełku).

### (d) Linia zdrowia obrazków dla rodzica (S14-03)

- Wzór: `src/core/saveHealth.ts` `saveHealthView(status)` (czysty, słowa w `pl.ts`), render `src/ui/dom/saveHealthView.ts` `createSaveHealthView`, wpięty w `openSettingsPanel` (`src/ui/dom/settingsPanel.ts`, opcja `saveHealth?`, element w tablicy `openDialog` między `noVoice` a `saveActions`), migawka czytana raz w `UIScene.openSettings` (`saveHealth: saver ? saveHealthView(saver.status()) : undefined`).
- Propozycja: `src/core/artHealth.ts` (`artHealth(expectedKeys, exists)` → `{ total, missing: string[] }`, `artHealthView` → `ok | missing{count,total}`), rekord ustawiany w `BootScene.create` pod nowym `REGISTRY_KEYS.artHealth` (nie w `SAVE_KEYS` → nie wchodzi do zapisu, format v1 bez zmian), opcja `artHealth?` w `openSettingsPanel`, nowy `src/ui/dom/artHealthView.ts`, teksty w `pl.settings` (nagłówek „Obrazki”, „wszystkie wczytane” / liczba z `countNoun`). Kit nie ma tej linii → nowy wiersz DESIGN-GAP (gap 26 opisuje panel, 43/50 sekcję zapisu).
- Karta błędu (`src/ui/dom/errorCard.ts`, `isFatalSignal`) — tylko awaria fatalna; brak obrazków nie zatrzymuje gry → bez liczby na karcie (zgodnie z decyzją 4; audyt sugerował inaczej — odrzucone, gra działa).

### (e) S12-01: import/reset przy zablokowanym zapisie

- `BlockReason = 'unreadable' | 'unavailable' | 'fatal'` (`src/core/autosave.ts`). `main.ts` ustawia `blockedBy: outcome.kind` dla `unreadable`/`unavailable` przy `createAutosaver`; `fatal` przez `block('fatal')` z granicy błędu. `unavailable` = odrzucony odczyt albo przekroczenie `balance.save.loadTimeoutMs` (`loadSave`: `Error` z `name: 'timeout'`), nazwa trafia do `loadError`.
- Dziś: `UIScene.openImport`/`openReset` → `decodeSave(saver.current())` → `saveSummary(decoded.session, ROOMS)` jako `current` → `createSummaryList(pl.saveTransfer.now /* 'Teraz' */, current, …)` w `saveImportDialog.ts`/`saveResetDialog.ts`. Przy zablokowanym zapisie `saver.current()` to świeża sesja z `freshSession(FIRST_ROOM, …)` w `main.ts` → „0 gwiazdek, przed wyborem etapu”. `replace` odmawia tylko `blockedBy === 'fatal'` (`'Blocked'`) i przy `replacing || replaced` (`'Busy'`).
- Sekcja „Zapis gry” w tym samym panelu mówi już `pl.settings.saveOff.unreadable/unavailable` — podsumowanie jej przeczy (audyt).
- Surowa kopia przy `unreadable` żyje tylko w domknięciu karty `mountSaveFailedCard` w `main.ts` (`raw`); po „Graj dalej” nie ma jej w rejestrze ani w saverze. Eksport z panelu (`UIScene.openExport`) eksportuje `saver.current()` — przy `unreadable` świeżą sesję (sąsiedztwo S12-04, poza zakresem; plan może dopisać follow-up).
- Rekomendacja per powód:

| `blockedBy` | Dialog („Teraz”) | `replace` | Dlaczego |
|---|---|---|---|
| `null` | jak dziś | jak dziś | — |
| `unavailable` (w tym `timeout`) | linia „zapis na urządzeniu nie został odczytany; uruchom grę ponownie” zamiast podsumowania; brak „Wczytaj”/„Zacznij od nowa” | **odmowa** (`'Blocked'`), w `core` | `timeout` może ukrywać zdrowy zapis (N-7); nadpisanie niewidzianego zapisu łamie „postęp nigdy nie ginie”; ponowny odczyt = nowe I/O bez limitu (S12-02) |
| `unreadable` | linia „zapis na urządzeniu jest nieczytelny (kod)”, zalecenie zachowania kopii + przycisk kopii surowej; import/reset po tym ostrzeżeniu | dozwolony | import kopii to zamierzona naprawa (gap 48, audyt § decyzje); follow-up F1 S-12 chce linii i wskazania „Zachowaj kopię” |
| `fatal` | panel niedostępny (karta błędu zatrzymuje pętlę) | odmowa (jest) | bez zmian |

  Kopia surowa w dialogu wymaga trzymania `raw`+`reason` w runtime (np. w `Autosaver` jako pole tylko-do-odczytu albo w rejestrze; nigdy w `SaveState`). Wariant minimalny (plan wybiera): sama linia ostrzeżenia bez przycisku. Nowe teksty w `pl.saveTransfer` + rewizja wierszy 48/49 albo nowy wiersz DESIGN-GAP.
- `?e2eSave=unavailable` (`e2eSaveStore`): odczyt odrzuca, **zapisy się udają** — dokładnie scenariusz audytu („IDB już działa”), więc e2e udowodni odmowę.

### (f) Szew e2e i pokrycie

- Wzorzec: czytniki w `src/testing/e2eHook.ts` (`e2eSkills`, `e2eSave`, `e2eStars`…), wywołane w `main.ts` pod `__E2E_HOOK__`, przekazane do `createGame` i do rejestru (`REGISTRY_KEYS.forcedSkills`, `forcedFailure` — nazwy kluczy celowo nie są markerami); markery w `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` (i `E2E_REQUIRED_MARKERS`), `npm run build` pada, gdy marker trafi do `dist/`.
- Propozycja: `e2eArt(search): 'missing' | 'corrupt' | null`, marker `'e2eArt'`; w `BootScene.preload` pod `__E2E_HOOK__`: `missing` → nie kolejkować `load.image` (tekstury brak, ścieżka `textures.exists`), `corrupt` → URL na istniejący plik nie-obraz (np. font `.ttf`), 200 + `onProcessError` — dowód S14-04 w przeglądarce. Unikać „404 przez zły URL”: `vite preview` może odpowiedzieć fallbackiem HTML 200 (nie sprawdzane w tym kroku), co zmienia ścieżkę.
- `page.route` odradzany: `playwright.config.ts` nie ma `serviceWorkers: 'block'`, a SW (prekesz wszystkich `webp`, `clientsClaim`) obsługuje żądania mimo trasy; brak użyć `page.route` w `tests/e2e/`.
- Hook: `TaskScene.snapshot` ma już `art: { key, loaded }[]` z `TaskPicture.art()`/`ArtImage.state()`; dołożyć `label` i `artHealth` w migawce hooka.
- Ryzyka test-plan: **#11** (runda dotykiem; `tests/e2e/art-tasks.spec.ts` dziś asertuje `loaded === true`), **#2** (postęp nie ginie; `save-restart.spec.ts` `?e2eSave=unreadable|unavailable|hang`, `save-transfer.spec.ts` import/reset na prawdziwym IDB), **#15** pośrednio (brak obrazka ≠ karta błędu). Subagenci nie uruchamiają Chromium → protokół request-file.

### (g) Limit czasu w `tests/spoken.test.ts`

- `cd42b4a`: jedyna zmiana to `}, 30_000);` + komentarz „Walks every phase of every skill of every stage: ~6 s on the CI runner since S-14 added the art skills.” na teście „every phase of every task is free of operator glyphs”.
- Testy `forEachTask` bez trzeciego argumentu w `describe('speech over every skill of every stage')`: „has no operator glyph, blank, no-break space or digit-colon left”, „never speaks a standalone Roman numeral token”, „speech does not give away the answer: …”. Zmierzone w izolacji (`npx vitest run tests/spoken.test.ts --reporter=verbose`, ten krok): 461 ms, 285 ms, 416 ms (i 1436 ms dla testu z `30_000`). Baseline: 5,3 s pod pełnym obciążeniem dla pierwszego → przy podobnym spowolnieniu drugi i trzeci są w zasięgu 5 s. Rekomendacja: `30_000` + ten sam komentarz na wszystkich trzech; bez globalnego `testTimeout`.

## Code References

- `src/ui/widgets/ArtImage.ts` `ArtImage.show`, `ArtImage.state`, mapa `SIZES` — stand-in i etykieta z id pliku
- `src/data/taskArt.ts` `TASK_ART`, `TaskArtEntry`, `ART_KEYS` — jedyna lista kluczy tekstur
- `src/data/measures.ts` `MONEY`, `WEIGHTS`, `JUGS`, `ICONS`, `PLATE_ICONS`, `SCALE_ITEMS`, `THERMOMETER`
- `src/core/text/measure.ts` `formatMoney`
- `src/data/layout.ts` `FONT_SIZES.artLabel`, `ART_STAND_IN`, `REGISTRY_KEYS`, `SAVE_KEYS`
- `src/ui/widgets/BarChart.ts` `render` — wzorzec zmniejszania etykiety
- `src/scenes/BootScene.ts` `preload` (`loaderror`), `create`
- `node_modules/phaser/src/loader/File.js` `onProcessError`, `onLoad`, `onError`; `loader/LoaderPlugin.js` `nextFile`, `fileProcessComplete`, `start`, `loadComplete`; `loader/filetypes/ImageFile.js` `onProcess`, `loadImage`, `addToCache`; `textures/TextureManager.js` `exists`, `get`; `core/Config.js` `loaderImageLoadType`
- `src/core/round/pick.ts` `playable`, `pickRoundSkills`, `pickSkills`, `firstPlayableSteps`; `src/core/curriculum.ts` `skillBuckets`, `buildAdaptiveRound`, `unlockReady`; `src/core/round/warmup.ts` `buildWarmup`; `src/core/tasks/registry.ts` `getParser`
- `src/core/saveHealth.ts` `saveHealthView`; `src/ui/dom/saveHealthView.ts` `createSaveHealthView`; `src/ui/dom/settingsPanel.ts` `openSettingsPanel`
- `src/core/autosave.ts` `BlockReason`, `AutosaveStatus`, `loadSave`, `createAutosaver` `replace`
- `src/scenes/UIScene.ts` `openSettings`, `openImport`, `openReset`, `openExport`
- `src/ui/dom/saveImportDialog.ts` `openSaveImportDialog`; `src/ui/dom/saveResetDialog.ts` `openSaveResetDialog`; `src/data/pl.ts` `saveTransfer.now`, `settings.saveOff`
- `src/main.ts` load flow (`loadSave`, `mountSaveFailedCard`, `createAutosaver` `blockedBy`), `createGame`
- `src/testing/e2eHook.ts` `e2eSkills`, `e2eSave`, `e2eSaveStore`, `forcedSkills`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`
- `tests/spoken.test.ts` `forEachTask` and the `describe('speech over every skill of every stage')` tests

## Architecture Insights

- Jeden sygnał prawdy dla obrazków: `textures.exists` po wczytaniu (to samo, czego używa `ArtImage`), a nie zdarzenia loadera.
- Status runtime wzorem autosavera: rekord w rejestrze, czysty widok w `core`, render DOM w `ui/dom`, czytany raz przy otwarciu panelu; nigdy w `SaveState`.
- Granice: `src/core` bez Phasera (filtr umiejętności dostaje zbiór brakujących id/kluczy jako argument); teksty tylko w `pl.ts`, etykiety stand-inu z danych pomiarowych.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-art-tasks-all-stages/` — wprowadził `ArtImage`, DESIGN-GAP 66; follow-upy: `BootScene.preload` `loaderror` (w zakresie), O1 (190 px), `ArtPool`/`fitRect` (poza zakresem).
- `context/archive/2026-10-13-save-export-import-reset/follow-ups/review-fixes.md` — „Import or reset over an unreadable save (impl-review F1)”: trigger „next change to saveImportDialog.ts / saveResetDialog.ts” wystrzeli → zamknąć; „Import from the welcome screen” — poza zakresem.
- `context/archive/2026-10-13-save-observability-c1-c2/` — wzór `saveHealthView` i `loadSave` z limitem czasu.

## Related Research

Nie dotyczy (brak wcześniejszego `research.md` dla stand-inu obrazków).

## Open Questions

1. Warstwa 2 (pominięcie umiejętności): zakres rodzajów (tylko „wynik tylko na obrazku” vs wszystkie zależne) i akceptacja kosztu odblokowania E2.2/E5.5 — decyzja planu.
2. `unreadable`: przycisk kopii surowej w dialogu (wymaga trzymania `raw` w runtime) czy sama linia — decyzja planu.
3. Wejście filtra: klucze tekstur czy id (lint pozwala na oba; sprawdzone w `eslint.config.mjs`) — rekomendowane id/klucze podane argumentem, bez importu `taskArt` w core.
4. Czy `vite preview` odpowiada 200 HTML na brakujący `.webp` (wpływa tylko na wybór wariantu szwu; rekomendowany wariant go omija).
5. Rozmiar czcionki/skalowanie etykiety w pudełku 84 px i obszarze 190 px — bramka wizualna.
