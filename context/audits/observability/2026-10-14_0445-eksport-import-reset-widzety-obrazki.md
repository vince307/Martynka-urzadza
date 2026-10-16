---
type: observability-audit
date: 2026-10-14 04:45
mode: audit
commit: 1812347
branch: docs/observability-audit-2026-10-13-s12-s14
dirty_tree: false
areas: [save-export-import-reset-and-save-health, drawn-widget-tasks, task-art-loading-and-stand-ins]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md
findings: { critical: 1, high: 11, medium: 16, low: 16 }
---

# Audyt obserwowalności: eksport/import/reset zapisu, zadania z rysowanymi widżetami, obrazki zadań (2026-10-14)

Ten raport zamyka run `2026-10-13-s12-s14`: S-12 `save-export-import-reset` (PR #39, `b57433c`), S-13 `drawn-widget-tasks-e3-e4` (PR #40, `bb00d7f`), S-14 `art-tasks-all-stages` (PR #41, `1812347`). Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

1. **S-12:** rodzic eksportuje zapis do pliku (udostępnienie lub pobranie), importuje go po walidacji i podsumowaniu (zastąpienie, potem przeładowanie), resetuje z potwierdzeniem; sekcja „Zapis gry” (jeszcze nie zapisano, wcześniejsze porażki, wynik `persist()`).
2. **S-13:** dziecko rozwiązuje zadania z rysowanymi widżetami (zegar, linijka, klocki dziesiątkowe, wykres słupkowy) kafelkami, klawiaturą, zaznaczaniem i przeciąganiem na kanwie Phasera.
3. **S-14:** pierwsze obrazki zadań (38 WebP, w precache) wczytują się przy starcie i rysują w zadaniach z pieniędzmi, wagą, dzbankami, termometrem i ikonami; przy braku tekstury rysowane jest pudełko zastępcze.

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po tym, co widzą dziecko, karty DOM, panel rodzica (za bramką) i konsola (bez map źródeł). Punktem odniesienia jest raport z 2026-10-13 17:51.

## 1. TL;DR

- **1 CRITICAL (S14-01): pudełko zastępcze uznane za sukces.** Gdy obrazek monety, banknotu lub dzbanka się nie wczyta albo nie zdekoduje, `ArtImage.show` rysuje pudełko z angielskim id pliku (`coin-05gr`, `container-half-l`). Kwota albo pojemność jest tylko na obrazku, więc zadanie dla dziecka z klasy 1–2 staje się nierozwiązywalne. Nikt się o tym nie dowiaduje: jest jedna linia w konsoli przy `loaderror`, a przy błędzie dekodowania (S14-04) nie ma nawet jej. Pomyłki trafiają do opanowania i do „najsłabszych umiejętności” w panelu rodzica (S14-05), więc awaria zasobu wygląda jak słabość dziecka.
- **Operacje nieodwracalne nie pytają o stan zapisu (S12-01, S12-04).** `replace` odmawia tylko przy `blockedBy === 'fatal'`. Po `unavailable` (w tym `timeout`) „Teraz” w dialogu importu i resetu pokazuje świeżą sesję w pamięci („0 gwiazdek”), a nie zapis na urządzeniu. Eksport zapisuje stan bez `validateSave`, a dialog mówi „Plik został pobrany”, nawet jeśli plik później zostanie odrzucony.
- **Kody wyników giną na krawędzi UI.** `ReplaceResult.error`, `build`/`exportedAt` z pliku, `status.replace`, `lastError` w stanie `failing`, `persist()` = `error`: wszystko jest w `core`, ale nie dociera ani do rodzica, ani do konsoli (S12-03, S12-06, S12-09, S12-10, S12-12).
- **Rozwiązywalność zadania nie jest sprawdzana end to end dla trybów `select` i `drag` (S13-01…S13-04).** Odpowiedź tablicowa bez `check` nigdy nie jest poprawna (`===`), a faza `retype` nie ma wyjścia. Z dzisiejszymi danymi to nie występuje, ale jedna edycja danych dzieli od zablokowanego dziecka bez karty i bez linii w konsoli.
- **Zamknięte z poprzedniego raportu:** M-S3, L-S2, M-S2 (z zastrzeżeniem S12-12). Częściowo: N-8, C-2r. Otwarte: N-7, M-S1, L-S1.

## 2. Model przechwytywania (zmiany względem raportu 17:51)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci. Obserwatorzy: dziecko (kanwa i karty DOM), rodzic (panel ustawień za przytrzymaniem 2 s i bramką), opiekun przez konsolę (bez map źródeł, `__BUILD_ID__` na karcie błędu i teraz na karcie nieczytelnego zapisu).
- **Granica błędów:** `installErrorBoundary` (`src/ui/dom/errorBoundary.ts`, `isFatalSignal`) łapie `error`/`unhandledrejection` z okna, pokazuje kartę „Zacznij od nowa”, usypia pętlę i woła `saver.block('fatal')`. Generatory rzucają przy budowie rundy (handler Phasera lub DOM), więc błędy strukturalne S-13 kończą się kartą.
- **Zapis (S-12):** `createAutosaver` ma nowe `replace(state)` (anuluje debounce, czeka na trwający zapis, pisze bezpośrednio do magazynu, ustawia `replacing`/`replaced`, a `writesOff()` blokuje dalsze autozapisy do przeładowania) i `current()` (`encodeSave(snapshot())`). `src/core/saveFile.ts` ma `exportFileText` (koperta z `build`, `exportedAt`, a przy `raw` także `reason`) i `parseImport` (rozmiar, `JSON.parse`, app/version, `decodeSave`). Dialogi DOM: `saveExportDialog` (eksport dopiero po „Zapisz plik”), `saveImportDialog`, `saveResetDialog`; ich podsumowania buduje `saveSummaryView`. `requestPersistence` zwraca `granted|denied|unsupported|error`, a `onFirstWrite` zapisuje wynik w statusie. `saveHealthView` ma stany `notYet`, `ok` (z `earlierFailures` i `lastError`), `failing` i `off`.
- **Widżety (S-13):** `TaskPicture.render` ma wyczerpujący `switch` z `never`, który rzuca. Odpowiedź sprawdza `isCorrect` w `src/core/round.ts` (`task.check` albo `===`). Przeciąganie obsługuje czysty reduktor `stepBlockDrag` (`src/core/blockDrag.ts`).
- **Obrazki (S-14):** `BootScene.preload` wczytuje 38 wpisów `TASK_ART` (`src/data/taskArt.ts`); `loaderror` daje tylko `console.warn("Task art failed to load: <key>")`. Błąd dekodowania przechodzi przez `File.onProcessError` Phasera (`console.error('Failed to process file…')`) i **nie** emituje `loaderror`. `ArtImage.show` rysuje pudełko zastępcze z etykietą `key.split('/').pop()`. `ArtImage.state()` zgłasza `loaded:false`, ale czyta to tylko hook e2e.
- **Logowanie:** 19 bloków `catch` w `src/` (bez `src/testing`) i 12 wywołań `console.*` (wcześniej 10). Nowe: `saveExport.ts` (2× `console.error`), `saveImportDialog.ts` (`console.warn('import refused')`) i `BootScene.ts` (`console.warn` dla obrazków).
- **Tożsamość wdrożenia:** `__BUILD_ID__` jest teraz także w szczegółach karty `unreadable` i w kopercie eksportu. Nadal nie ma map źródeł. `check:deploy` porównuje precache tylko z bundlami z `index.html` i nie sprawdza `assets/tasks/*.webp` (S14-07).

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Opiekun / konsola | Werdykt |
|---|---|---|---|---|
| Obrazek monety lub dzbanka nie wczytany (404) | pudełko z `coin-05gr`, zadanie praktycznie nierozwiązywalne | pomyłka liczona jako słabość dziecka | `console.warn` z kluczem | **missed (S14-01, S14-03)** |
| WebP nie dekoduje się (uszkodzony plik, brak obsługi WebP) | jak wyżej, wszystkie obrazki | jak wyżej | tylko `console.error` Phasera, handler gry milczy | **missed (S14-04)** |
| Zawieszone żądanie przy pierwszej wizycie online | pusta kanwa na zawsze | nic | nic (`loader.timeout` = 0) | **missed (S14-07)** |
| Generator lub parser rzuca przy budowie rundy | karta „Zacznij od nowa” | panel niedostępny | `console.error` z typem, bez `skill.id` | caught, słaba identyfikacja (S13-07) |
| Zadanie nierozwiązywalne w trybie `select`/`drag` | utknięcie w `retype`, bez „Dalej” | brak przykładu pomyłki dla `select` | nic | **latent missed (S13-01, S13-06)** |
| Import lub reset przy `unavailable` | — | „Teraz: 0 gwiazdek”, zapis na urządzeniu nadpisany bez wiedzy | nic | **misattributed (S12-01)** |
| `replace` zawisa (IDB) | gra zamrożona pod dialogiem | przyciski wyłączone na zawsze | nic | **missed (S12-02)** |
| Eksport niewalidującego stanu | — | „Plik został pobrany”, plik później odrzucony | nic | **false success (S12-04)** |
| Zapis `replace` rzuca | — | „Nie udało się wczytać zapisu” (także po resecie) | `autosave: replace failed` z błędem | caught, błędna etykieta (S12-06, S12-11) |
| Import pliku: `file.text()` odrzuca | — | „To nie jest plik zapisu tej gry” | `import refused: not-json` | misattributed (S12-08) |
| Zapis `unreadable` przy starcie | karta z `detail` (powód + build) i eksportem | jak wyżej | `console.warn` z powodem | **caught (M-S3 zamknięte)** |

## 4. Systemowe przyczyny źródłowe

1. **Fallback, który utrzymuje ekran, liczy się jako obsłużony, bez sprawdzenia, czy zadanie da się nadal rozwiązać.** Pudełko zastępcze (S14-01, S14-02, S14-11), domyślne `: 0` w `dragKinds` (S13-04), `: []` dla `choices` (S13-05), `Math.max(0, …)` w `belowPrompt` (S13-08), `?.` w pulach obrazków (S13-11, S14-11). Każdy z nich zamienia błąd w dziwny lub pusty rysunek zamiast w kartę. Wyjaśnia CRITICAL.
2. **Brak powierzchni zdrowia poza zapisem.** Sekcja „Zapis gry” jest jedynym miejscem, gdzie rodzic widzi stan systemu. Brakujące obrazki, odmowy importu i błędy `replace` istnieją tylko w konsoli, której na tablecie nikt nie ma (S14-03, S12-06, S12-12, S13-10). Wyniki z zadań ze stand-inami lub nierozwiązywalnych trafiają do opanowania i do widoku rodzica jako ocena dziecka (S14-05, S13-06).
3. **Kody wyników liczone w `core` i odrzucane na krawędzi UI.** `ReplaceResult.error`, metadane pliku, `status.replace`, `lastError` w `failing`, `persist()` = `error` (S12-03, S12-06, S12-09, S12-10, S12-12).
4. **Operacje nieodwracalne ignorują `blockedBy`.** `blockedBy` zaprojektowano, by zatrzymać autozapis, ale `replace`, „Teraz” i eksport go nie czytają (S12-01, S12-04).
5. **Asynchroniczne I/O bez limitu czasu poza `loadSave`.** `replace`, `file.text()` i loader Phasera (`loader.timeout` 0) mogą wisieć bez wyjścia na tablecie (S12-02, S12-08, S14-07).
6. **Weryfikacja kończy się na buildzie.** Dowody rozwiązywalności `select`/`drag` i obecności obrazków w precache są tylko w Playwright (lokalnie, nie w CI), a `check:deploy` nie patrzy na `assets/` (S13-02, S14-06).

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### S-12: eksport, import, reset i sekcja „Zapis gry”

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| S12-01 | `src/core/autosave.ts` `replace` (odmawia tylko `fatal`) + `src/scenes/UIScene.ts` `openImport`/`openReset` (`saver.current()`) | missing-throw | high | Po `unavailable` (także `timeout` przy zimnym IDB) albo `unreadable` dialog pokazuje „Teraz: 0 gwiazdek, przed wyborem etapu”, czyli świeżą sesję w pamięci. Jeśli IDB już działa, „Wczytaj” albo „Zacznij od nowa” nadpisuje zapis, którego nikt nie widział. W konsoli nic. Ta sama sekcja panelu mówi wprawdzie „Zapis jest wyłączony”, ale podsumowanie jej przeczy. | Przekazać `blockedBy` do dialogów. Przy `unavailable` odmówić albo najpierw ponownie odczytać magazyn. Przy `unreadable` pokazać „zapis na urządzeniu jest nieczytelny” i eksport surowej kopii. |
| S12-02 | `src/core/autosave.ts` `replace` (`await inflight`, `await store.write` bez limitu) + `saveImportDialog`/`saveResetDialog` | coverage-gap | high | Gdy IDB wisi, przyciski zostają wyłączone na zawsze. Jedyne wyjście to Escape, którego tablet nie ma, więc gra jest zamrożona pod przełącznikiem wejścia. `replacing` po cichu pomija każdy autozapis. Późne rozwiązanie po Escape przeładowuje stronę w trakcie gry. | Limit czasu jak w `loadSave`. Anulować przeładowanie po zamknięciu dialogu. |
| S12-03 | `src/core/saveHealth.ts` `saveHealthView`/`stateOf` (ignoruje `status.replace`, `skipped`) | flattened-response | high | Podczas `replace` albo po udanym `replace` bez przeładowania panel mówi „Postępy zapisują się na tym urządzeniu”, choć wszystkie zapisy są wyłączone. `status.replace` czyta tylko hook e2e. | Stan `replacing`/`replaced` w `saveHealthView`. `skipped > 0 && dirty` to nie `ok`. |
| S12-04 | `src/scenes/UIScene.ts` `openExport` + `src/core/autosave.ts` `current` + `src/core/saveFile.ts` `exportFileText` | missing-throw | high | Eksport koduje stan bez `validateSave`. Przy `InvalidSave`, czyli dokładnie wtedy, gdy rodzic najbardziej potrzebuje kopii, dialog mówi „Plik został pobrany”, a plik zostanie później odrzucony jako `corrupt`. Przy `unreadable` eksport zapisuje świeżą sesję pod datowaną nazwą jako „postęp dziecka”. | Walidacja przed eksportem i osobny wynik przy porażce. Podsumowanie zawartości w dialogu eksportu. |
| S12-05 | `src/scenes/UIScene.ts` `openImport`/`openReset` (gałąź `decoded.kind !== 'ok'` → `closeSettings()`) | swallowed | medium | Gdy stanu w pamięci nie da się zdekodować, dotknięcie „Wczytaj z pliku” albo „Zacznij od nowa” po prostu zamyka panel, bez tekstu i bez konsoli. To akurat ten zepsuty stan, który rodzic próbuje naprawić. | Zalogować `saveProblem`, pokazać linię w panelu. Reset powinien działać bez podsumowania. |
| S12-06 | `src/ui/dom/saveImportDialog.ts`/`saveResetDialog.ts` `failed()` + `replace` wczesne `return` (`Busy`, `Blocked`, `InvalidSave`) | flattened-response | medium | `ReplaceResult.error` jest odrzucany. Rodzic zawsze czyta `pl.saveTransfer.applyFailed` „Nie udało się wczytać zapisu”, także po nieudanym resecie. `Busy`, `Blocked` i `InvalidSave` nie zostawiają linii w konsoli. | Osobny tekst dla resetu, kod błędu jako wyciszona linia (jak `saveFailed.detail`), log każdego wyniku innego niż `ok`. |
| S12-07 | `src/ui/dom/saveExport.ts` `saveFileToDevice` (`link.click()` → `downloaded`) | flattened-response | medium | W iOS standalone bez udostępniania albo po odrzuceniu udostępnienia innym błędem niż `AbortError` (gest już wygasł) rodzic czyta „Plik został pobrany na to urządzenie”, choć nic nie powstało. | Wynik `downloadStarted` z łagodniejszym tekstem („sprawdź Pobrane”). Porażka udostępnienia raportowana osobno. |
| S12-08 | `src/ui/dom/saveImportDialog.ts` `stepOne` (odrzucenie `file.text()` → `refuse('not-json')`) | identity-lost | medium | `NotReadableError` (plik iCloud/Drive niepobrany, cofnięte uprawnienie) daje „To nie jest plik zapisu tej gry”. Obiekt błędu ginie, w konsoli jest tylko `not-json`. | Osobne odrzucenie `unreadable-file` z tekstem „pobierz plik i spróbuj ponownie”, log `errorName(e)`. |
| S12-09 | `src/core/saveFile.ts` `parseImport` (`file: {build, exportedAt}`) → `saveImportDialog` `stepTwo` | identity-lost | medium | Build i data pliku są parsowane, a potem odrzucane. Rodzic nie odróżni dwóch kopii po dacie. Po imporcie nic, nawet konsola, nie mówi, że zapis pochodzi z pliku i z którego buildu. | Data w „Z pliku”. Jedna linia `console.info` przed `reload()` (źródło, build pliku, data). |
| S12-10 | `src/core/saveHealth.ts` `stateOf` `failing`/`off` | missing-context | medium | W stanie `failing` panel mówi „Ostatnie próby zapisu się nie udały” bez nazwy błędu. `lastError` pojawia się dopiero w `ok` (`earlierFailures`), czyli gdy wszystko już działa. | `lastError` i licznik także w `failing` i w `off` (`unavailable`). |
| S12-11 | `src/core/autosave.ts` `replace` (gałąź `catch`: `failures++`, `consecutiveFailures++`) | noise | low | Nieudany import lub reset liczy się jako porażka autozapisu: panel mówi „Ostatnie próby zapisu się nie udały”, a potem „Wcześniej: 1 nieudana próba”. | Osobny licznik i linia dla `replace`. |
| S12-12 | `src/storage/idb.ts` `requestPersistence` (`catch { return 'error' }`) + `pl.settings.savePersist` | swallowed | low | `denied`, `unsupported` i `error` dają ten sam tekst, a `error` gubi wyjątek bez logu. | `console.warn` z nazwą błędu dla `error`. Opcjonalnie wyciszony kod w panelu. |
| S12-13 | `src/scenes/UIScene.ts` `openImport`/`openReset`/`openExport` (`apply` i handlery przycisków poza `session.run`) | coverage-gap | low | Wyjątek w „Wczytaj”, „Zapisz plik” albo w łańcuchu `file.text().then` → `stepTwo` dochodzi do granicy jako karta „Zacznij od nowa”, bez kontekstu importu. Ta karta ma tę samą etykietę co przycisk resetu. | Owinąć handlery w `session.run` albo łapać do linii porażki dialogu. Zmienić jedną z dwóch etykiet „Zacznij od nowa”. |
| S12-14 | `src/main.ts` `start` (eksport surowy) + `src/ui/dom/saveExport.ts` `RAW_FILE_NAME` | identity-lost | low | Surowa kopia ma zawsze tę samą nazwę. Druga kopia nadpisuje pierwszą albo dostaje „(1)”. | Data i build w nazwie pliku. |
| S12-15 | Dwie instancje na jednym originie (karta Chrome i zainstalowane PWA na Androidzie lub desktopie) | coverage-gap | low | `replaced` zatrzymuje zapisy tylko w karcie, która importowała. Druga instancja po cichu zapisze stary stan. Na iPadzie nie występuje (osobny magazyn ekranu głównego). | `BroadcastChannel`, który po `replace` blokuje drugą instancję. |

Sprawdzone jako dobre: import idzie przez `saver.replace`, nie bezpośrednio do magazynu. `writesOff()` obejmuje `replacing` i `replaced`, więc żaden debounce, `now` ani `hidden` nie nadpisze zaimportowanego zapisu przed przeładowaniem. `reload()` następuje dopiero po `ok`. Nieudany zapis zostawia stary zapis i loguje `autosave: replace failed`. `parseImport` sprawdza rozmiar, `JSON.parse` jest w `try`, potem app/version i ścisły `decodeSave`, a każda odmowa ma konkretny tekst „obecny zapis bez zmian”. Fokus startowy jest na „Anuluj”. `saveFileToDevice` buduje plik synchronicznie w geście i nigdy nie rzuca. Format v1 jest bez zmian.

### S-13: zadania z rysowanymi widżetami

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| S13-01 | `src/core/round.ts` `isCorrect` (`task.check ? … : input === task.answer`) + `answer` `case 'retype'` | missing-throw | high (latent) | Odpowiedź `number[]` bez `check` nigdy nie jest poprawna. Dziecko przechodzi pierwszą próbę, drugą i rozwiązanie, potem zostaje w `retype` na zawsze, bez „Dalej” i „Do pokoju”, bez karty i bez linii w konsoli. Dziś jedyny `select` (`EVEN_ODD`) ma `check`, więc to ryzyko na następną edycję danych. | Domyślne porównanie zbioru dla tablic albo rzut w `generateTask`. Asercja w `core`: `isCorrect(task, canonicalInput(task))`. |
| S13-02 | `tests/generateTask.test.ts` (`continue` dla `select`) + `tests/contentInvariants.test.ts` (surowe `generate!`, nie `generateTask`) | coverage-gap | high | CI nie sprawdza, że odpowiedź `select`/`drag` jest osiągalna przez widżet (odpowiedź ⊆ choices, `check(answer)`, cyfry ≤ `maxPerKind`). Dowód jest tylko w `tests/e2e/drawn-tasks.spec.ts`, który nie działa w CI. | Test „rozwiązywalne” dla każdego trybu i każdej umiejętności, 1000 losowań: zbudować wejście widżetu i sprawdzić, że `answer()` kończy w `done`. |
| S13-03 | `src/core/tasks/validate.ts` `validateTask` (blok `choices` pomija tablice) | missing-throw | high | Zadanie `select`, którego poprawne liczby nie wszystkie są na ekranie, przechodzi `npm run sample` i niezmienniki treści. | `validateTask` zna tryb: `select` wymaga answer ⊆ choices i działającego `check`, `drag` liczby 0..999, `keypad` liczby. |
| S13-04 | `src/scenes/TaskScene.ts` `render` (`dragKinds(typeof task0.answer === 'number' ? task0.answer : 0)`) | missing-throw | high (latent) | Umiejętność `drag` z odpowiedzią nieliczbową po cichu dostaje tacę dziesiątki+jedności. Wartości nie da się zbudować, czyli ta sama pułapka `retype`. Odpowiedź ≥ 1000 też jest niezbudowalna i cicha. | Rzut w `core` (`dragKinds` przyjmuje `unknown`), żeby awaria wyszła przy starcie rundy i dała kartę. |
| S13-05 | `src/ui/widgets/SelectTiles.ts` `applyVisibility` + `src/core/round/view.ts` `roundView` (`choices: … : []`) | flattened-response | medium | Zadanie `select` bez wyborów nie rysuje kafelków i ukrywa „OK”. Dziecko widzi polecenie i nic do dotknięcia. | Rzut w `generateTask`, gdy tryb `select`/`tiles` nie ma wyborów. |
| S13-06 | `src/core/round.ts` `captureFirstWrong` (tylko `number`/`string`) | missing-context | medium | Błędny zbiór `select` nie jest zapisywany. Podgląd postępów liczy pomyłkę, ale bez przykładu, czyli jest ślepy właśnie tam, gdzie pojawiłoby się S13-01. | Zapisywać tablicę jako `given` (np. złączoną „, ”). |
| S13-07 | `src/core/tasks/generateTask.ts` `generateTask` + parsery (`parsePlaceValueParams`, `multGroups.ts` `fail`) | identity-lost | medium | Rzut parsera lub generatora daje kartę, ale komunikat podaje tylko typ, bez `skill.id` i etapu. Bez map źródeł to jedyna wskazówka. Po „Zacznij od nowa” ten sam krok może wylosować tę samą umiejętność, co wygląda na losową pętlę awarii. | Owinąć `generate(skill, rng)` i rzucić ponownie z `cause`, `skill.id`, `skill.type` i trybem. |
| S13-08 | `src/core/round/pictureLayout.ts` `belowPrompt` (`height: Math.max(0, …)`) | flattened-response | medium | Polecenie za długie nawet przy minimalnej czcionce zeruje wysokość obrazka. Zegar, linijka lub wykres rysują się w skali 0, a dziecko odpowiada o niewidocznym rysunku. `TaskPicture.bounds()` nadal zwraca prostokąt, więc hook e2e tego nie zauważa. | Minimalna wysokość obrazka (rzut). Test jednostkowy z najdłuższym poleceniem każdej umiejętności z obrazkiem. |
| S13-09 | `src/core/blockDrag.ts` `stepBlockDrag` (`down` z tym samym `pointerId` zwraca `state`) | swallowed | low | Utracone przeniesienie bez `touchcancel` (ukrycie aplikacji w trakcie) zostawia klocek w powietrzu. Następny dotyk w tym samym slocie jest brany za stare przeniesienie. | Reset na `visibilitychange` hidden i `blur`. `down` podczas przenoszenia to reset i nowe przeniesienie. |
| S13-11 | `src/ui/widgets/IconGroups.ts` `render` (`this.images[i]?.show`) | swallowed | low | Więcej miejsc niż 30 obrazków w puli: nadmiar po cichu nie jest rysowany, więc zadanie COUNT pokazuje mniej obiektów niż odpowiedź. Dziś chroni `validateVisual` w CI. | Rzut, gdy `layout.icons.length > images.length`. |
| S13-12 | Nieograniczone pętle `while`: `placeValue.ts` (rozkład), `evenOdd.ts` (select), `rounding.ts`, `compareDiff.ts` | coverage-gap | low | Każda pętla kończy się tylko dlatego, że parser dowiódł istnienia rozwiązania. Luka w parserze zamraża kartę przy budowie rundy: bez błędu i bez karty. | Strażnik iteracji z rzutem, jak w `numberChoices`. |
| S13-13 | `src/core/round/unique.ts` `distinctTasks` | noise | low | Po 20 próbach duplikat zostaje po cichu. To udokumentowane (prawdopodobieństwo ok. 1e-7) i akceptowalne. | Opcjonalnie: licznik duplikatów w hooku e2e. |
| S13-14 | `src/core/round/pick.ts` `playable` + `src/core/e2eSkills.ts` `forcedSkills` | noise | low | `?e2eSkills` z błędnym id po cichu daje zwykłą rundę, więc spec e2e może przejść na złej umiejętności (tylko build e2e). | `forcedSkills` rzuca na nieznane id. |

(S13-10, brakujące obrazki widoczne tylko w konsoli, scalone z S14-04.)

Sprawdzone jako dobre: nieznany rodzaj obrazka, nieznany typ zadania, pusty `rng.pick` i niewykonalne parametry rzucają przy budowie rundy i kończą się kartą, a zapis jest blokowany jako `fatal`. Generowanie nigdy nie jest leniwe w trakcie rundy. `contentInvariants` sprawdza każdą umiejętność (1000 losowań przez `validateTask` z `validateVisual`), `dragLayout.test.ts` wiąże `maxPerKind` z `balance`, a parser PLACE_VALUE odrzuca budowę > 99. Przeciąganie obsługuje `pointerupoutside` i `wasCanceled` jako `cancel` oraz reset przy wstrzymaniu wejścia, uśpieniu i przejściu do pokoju.

### S-14: obrazki zadań

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| S14-01 | `src/ui/widgets/ArtImage.ts` `show` (etykieta `key.split('/').pop()`) + `src/core/tasks/generators/money.ts` `generateMoneyCount` (`pl.tasks.moneyCountPrompt`) + `capacity.ts` `generateCapacity` (`capacityLitresPrompt`) | coverage-gap | **critical** | Kwoty i pojemności są tylko na obrazku („Ile złotych leży na stole?”, lektor mówi „Popatrz na pieniądze…”). Bez tekstury każda moneta to turkusowe pudełko z napisem `coin-05gr`/`note-20zl`, a dzbanek to `container-half-l`. Dziecko z klasy 1–2 zgaduje, a nikt się nie dowiaduje: nie ma karty ani linii w panelu, jest najwyżej jeden `console.warn`. | Stand-in z polską wartością (`formatMoney(grosze)` → „2 zł”, `JUGS[].label` → „½ l”). Gdy brak obrazka, którego zadanie wymaga, losować inny typ (zbiór wczytanych tekstur przekazany do wyboru rundy). |
| S14-02 | `src/core/tasks/generators/mass.ts` `generateMass` + `src/ui/widgets/BalanceScale.ts` `render` + `ArtImage` (`TEXT_SIZES.artLabel` 24 px, bez dopasowania) | coverage-gap | high | Odważniki są tylko na obrazku. Stand-in pokazuje `weight-10dag` w stałych 24 px, a etykiety sąsiednich odważników (pole 84, odstęp 2) nachodzą na siebie i są nieczytelne. | `WEIGHTS[].label` („10 dag”) i dopasowanie tekstu do pudełka. |
| S14-03 | `src/scenes/BootScene.ts` `preload` (handler `loaderror` → `console.warn`) | logged-not-captured | high | Jedyny sygnał to `console.warn("Task art failed to load: <key>")`. Nie jest liczony, nie trafia do rejestru, nie ma go w panelu rodzica (w przeciwieństwie do „Zapis gry”) ani na karcie błędu. Na tablecie zepsuty zasób po wdrożeniu jest niewidoczny dla rodzica i opiekuna. | Zbierać nieudane klucze w rejestrze (`REGISTRY_KEYS.artHealth`). Czysty `artHealthView` jako linia w panelu („Obrazki: 3 z 38 nie wczytały się”) i liczba na karcie błędu. |
| S14-04 | Phaser `File.onProcessError` (`node_modules/phaser/src/loader/File.js`) vs `BootScene` `loaderror` | coverage-gap | high | Plik pobrany, ale niedekodowalny (ucięty WebP, przeglądarka bez WebP, zły plik z 200) nie emituje `loaderror`. Phaser woła tylko `console.error('Failed to process file: image "<key>"')`, a handler gry milczy. Wszystkie obrazki stają się stand-inami bez słowa. Zweryfikowane w źródle Phasera. | Po `create` sprawdzić `this.load.totalFailed` i/lub `textures.exists` dla każdego klucza `TASK_ART` i z tego zasilić S14-03. |
| S14-05 | `src/core/progress.ts`/`recordRound` (mistrzostwo i przykłady pomyłek) | identity-lost | medium | Pomyłki w zadaniach, których nie dało się rozwiązać przez brak obrazka, są zapisywane jako prawdziwe. Panel pokazuje pieniądze, pojemność i masę wśród najsłabszych umiejętności, a dwie słabe rundy łagodzą program. Awaria zasobu wygląda jak słabość dziecka. | Oznaczać zadanie „ze stand-inem” (scena wie z `TaskPicture.art()`), wykluczać je z opanowania i przykładów. |
| S14-06 | `scripts/check-deploy.ts` `main` + `scripts/deploy-check/parse.ts` `compareBundles` | coverage-gap | medium | Smoke po wdrożeniu sprawdza tylko bundle z `index.html`. Nie pyta o `/assets/tasks/*.webp` ani nie sprawdza, że precache zawiera 38 plików, typ `image/webp` i nagłówek RIFF/WEBP. Precache obrazków sprawdza tylko `tests/e2e/seed.spec.ts` (lokalnie). | Rozszerzyć `check:deploy`: każdy URL z `TASK_ART` w precache `sw.js`, GET (lub próbka) zwraca 200, `image/webp`, niezerowy rozmiar. |
| S14-07 | `src/main.ts` `createGame` (brak `loader.timeout`; domyślnie 0) + `BootScene.preload` | missing-throw | medium | Przy pierwszej wizycie online, zanim SW cokolwiek zapisze, jedno zawieszone żądanie (38 obrazków + czcionka) zostawia loader czekający w nieskończoność: pusta kanwa, bez karty, bez logu. | `loader.timeout` (np. 15 s, timeout XHR liczy się jako `loaderror`). Opcjonalnie strażnik startu z kartą i buildem. |
| S14-08 | `src/scenes/BootScene.ts` `preload` (handler na całym loaderze) | identity-lost | low | Handler działa także dla czcionki i pisze „Task art failed to load: <fontKey>”. Loguje tylko `key`, bez URL, statusu HTTP i buildu, więc 404, offline i blokada wyglądają tak samo. | Rozgałęzić po `file.type`. Logować `{key, url, status, buildId}`. |
| S14-09 | `src/ui/widgets/ArtImage.ts` `show` (`size ? … : 1`) + `src/ui/widgets/artLayout.ts` `moneyLayout` (`spec.coinMm[id] ?? 20`) | swallowed | low | Klucz spoza `TASK_ART` po cichu dostaje proporcje 1:1. Moneta spoza `coinMm` po cichu dostaje 20 mm, co psuje względne rozmiary, które dziecko może porównywać. | `coinMm: Record<CoinId, number>`. Rzut albo jednorazowy `console.error` przy braku. |
| S14-10 | `MoneyTable`/`Jugs`/`BalanceScale` `render` (`this.images[i]?.show`) | swallowed | low | Więcej elementów niż pula: moneta jest w odpowiedzi, ale nie jest narysowana. Dziś chronią parsery i `validateVisual` w CI, ale limit parsera pieniędzy (10) to literał, nie `ART_LIMITS.moneyItems`. | Związać limity parserów z `ART_LIMITS`. Rzut zamiast `?.`. |
| S14-11 | `docs/design-gaps.md` wiersz 66 + komentarz nagłówka `ArtImage.ts` („the task stays playable”) | config | low | Twierdzenie jest prawdziwe dla termometru (tarcza rysowana w kodzie) i ikon (pudełka da się policzyć), fałszywe dla pieniędzy, dzbanków i wagi. Recenzent ufający komentarzowi nie widzi ryzyka. | Poprawić notkę. Test jednostkowy: każdy typ zależny od obrazka ma czytelną etykietę zastępczą. |
| S14-12 | `vite/config.shared.mjs` (workbox `skipWaiting`, `clientsClaim`) + niehashowane URL-e w `src/data/taskArt.ts` `entry` | config | low | Aktualizacja SW w trakcie sesji nie psuje gry (tekstury są w pamięci od startu). Jedyna luka: wdrożenie w pierwszych sekundach `BootScene` i zmiana nazwy pliku daje 404 i stand-in na tę sesję. | Akceptowalne. Przy zmianie nazw zostawić starą na jedno wydanie albo hashować URL. |

Sprawdzone jako dobre: każdy obrazek wczytuje się przy starcie i jest w precache (glob `webp`), bez leniwych chunków. `ArtImage.state()` czyta to, co faktycznie jest na ekranie, a `tests/e2e/art-tasks.spec.ts` wymaga `loaded:true`. `tests/taskArt.test.ts` wiąże tabelę z plikami w obie strony (wymiary z nagłówka WebP, < 1 MB). Porażka żądania nie blokuje startu. Caddy nie ma `try_files`, więc brak pliku to prawdziwe 404, nie HTML jako WebP. Termometr i ikony da się rozwiązać bez obrazka.

## 6. Zalecana kolejność poprawek

1. **S14-01 + S14-02 + S14-11:** czytelny stand-in z polską wartością (`MONEY`, `JUGS[].label`, `WEIGHTS[].label`) i test, że każdy typ zależny od obrazka ma etykietę zastępczą. Małe, czysto w `data/` i jednym widżecie, zamyka jedyny CRITICAL.
2. **S14-03 + S14-04 + S14-08 (i S13-10):** jeden rekord zdrowia obrazków (`loaderror` + `totalFailed`/`textures.exists` po `create`) i linia w panelu rodzica obok „Zapis gry”. Ten sam wzorzec co `saveHealthView`.
3. **S13-01 + S13-02 + S13-03 + S13-04:** test „rozwiązywalne w swoim trybie” dla każdej umiejętności w CI i domyślne porównanie zbioru dla tablic. Zamyka pułapkę `retype`, zanim pojawi się druga umiejętność `select`/`drag`.
4. **S12-01 + S12-04:** `replace`, „Teraz” i eksport czytają `blockedBy`. Walidacja przed eksportem.
5. **S12-02 + S14-07:** limity czasu dla `replace` i loadera Phasera.
6. **S12-03 + S12-06 + S12-10 + S12-11 + S12-12:** sekcja „Zapis gry” pokazuje `replace`, kody błędów i nazwę błędu w `failing`. Osobny licznik `replace`.
7. **S14-05 + S13-06:** wyniki ze stand-inami poza opanowaniem; przykład pomyłki `select`.
8. **S14-06:** `check:deploy` sprawdza obrazki (zmiana w `scripts/`, nie w `deploy/`).
9. **S13-07:** `skill.id` i `cause` w błędach generatorów.
10. Drobne: S12-05, S12-07, S12-08, S12-09, S12-13…15, S13-05, S13-08, S13-09, S13-11…14, S14-09, S14-10, S14-12; otwarte N-7, L-S1.

Ograniczenie wspólne: nic nie opuszcza urządzenia; wszystkie kierunki zostają w panelu rodzica, na kartach i w konsoli.

## 7. Zmiany od ostatniego audytu

| Poprzednie id | Status | Dowód |
|---|---|---|
| M-S3 | fixed | `main.ts` `start`: `detail: pl.saveFailed.detail(reason, __BUILD_ID__)` na karcie `unreadable`. Koperta surowego eksportu (`exportFileText` `kind: 'raw'`) ma `build`, `exportedAt`, `reason`. |
| L-S2 | fixed | Oba eksporty otwierają `openSaveExportDialog`. Nic nie jest pobierane przed „Zapisz plik”. Reszta: S12-07 (tekst wyniku przesadza). |
| N-8 | changed (częściowo) | `saveHealthView` ma `notYet` i `earlierFailures` z `lastError` w `ok`. Brakuje nazwy błędu w `failing`/`off` (S12-10), stanu `replace` (S12-03), a porażki `replace` liczą się jako autozapis (S12-11). |
| M-S2 | fixed (z zastrzeżeniem) | `requestPersistence` zwraca `Persistence`, `onFirstWrite` zapisuje wynik, panel pokazuje `savePersist`. `error` bez logu i z tym samym tekstem co `denied` (S12-12). |
| C-2r | changed (częściowo) | `saveProblem` podaje pierwszy zły klucz, ale tylko w `console.warn` importu. `InvalidSave` w autozapisie i `unreadable` przy starcie nadal bez ścieżki pola. `saveProblem` działa na wartości przed migracją (po v2 zgłosi `version`). Sygnał nadal pasywny. |
| N-7 | still open | Karta `unavailable` bez `detail`; `timeout` i odrzucenie mają ten sam tekst. Poza zakresem S-12 (czeka na pomiar na iPadzie). |
| L-S1 | still open | `decodeSave` `catch` → `corrupt` bez logu; import to dziedziczy. |
| M-S1 | still open | Rollback nie zna wersji zapisu (`deploy/` poza zakresem). Import pliku z nowszego buildu daje teraz jasny tekst `future`. |
| M-R4, M-R5r, L-S3, L-R8, L-R9, L-R11 | not re-checked | Poza obszarami tego runu. |
| N-1…N-6, M-9, H-3, H-4, H-7r, H-9, L-12 | not re-checked | Poza obszarami tego runu; H-9 (smoke nie uruchamia JS) pokrewne z S14-06. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** trzech audytorów obszarów (subagenci tylko do odczytu, równolegle) po jednym na S-12, S-13, S-14, plus ten krok jako syntezator. Audytor infrastruktury nie był uruchamiany (patrz decyzje).
- **Powierzchnia:** `git diff --stat f3088d4 1812347 -- src vite` = 80 plików, +4697/−171.
- **Sprawdzone ręcznie:** `File.onProcessError` w `node_modules/phaser/src/loader/File.js` loguje i woła `fileProcessComplete` bez `FILE_LOAD_ERROR` (S14-04 potwierdzone); `pl.tasks.moneyCountPrompt`/`moneyCountSpeak` nie zawierają kwot (S14-01); `ArtImage.show` etykieta `key.split('/').pop()`; `WEIGHTS`/`JUGS` w `src/data/measures.ts` mają polskie `label` (kierunek poprawki wykonalny); `autosave.ts` `replace` odmawia tylko przy `fatal` (S12-01); `UIScene.openImport`/`openReset` budują „Teraz” z `saver.current()` i zamykają panel bez sygnału przy błędzie dekodowania (S12-05); `round.ts` `isCorrect` używa `===` bez `check`, a `retype` przy złej odpowiedzi zwraca ten sam stan (S13-01); jedyne umiejętności `select` (`E1.6.even_odd_select_10`, `E3.7.select_even_30`) mają `check` przez `sameSet` (stąd „latent”); `scripts/deploy-check/parse.ts` `compareBundles` porównuje tylko bundle z `index.html` (S14-06); `requestPersistence` `catch { return 'error' }` (S12-12).
- **Obniżone po weryfikacji:** S12-01 z critical na high (ta sama sekcja panelu mówi „Zapis jest wyłączony”). S13-01 z critical na high (latentne: dzisiejsze dane nie wyzwalają). S14-02 audytora (dzbanki) scalone z S14-01. S13-10 scalone z S14-03.
- **Przegląd repo:** 19 bloków `catch` w `src/` (bez `src/testing`), 12 wywołań `console.*`.
- **Nieudowodnione w czasie działania:** czy prawdziwy iPad (WebKit) kiedykolwiek nie zdekoduje WebP z pakietu; jak wygląda stand-in na tablecie (rozmiar, nakładanie etykiet `weight-*`); czy `link.click()` w iOS standalone faktycznie nic nie zapisuje (S12-07); zachowanie `navigator.share` z plikiem na docelowym iPadzie; zawieszenie `store.write` przy `replace` (S12-02) na prawdziwym IDB; zachowanie dwóch instancji na Androidzie (S12-15); czy loader Phasera faktycznie wisi przy zawieszonym żądaniu przy pierwszej wizycie (S14-07, wniosek z `loaderTimeout` 0). E2E i build nie były uruchamiane w tym kroku; baseline runu: `e2e OK 46 passed`, `unit 1865 passed` na `1812347` (z kontraktu runu, nie zaobserwowane tutaj).
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania; `area_source: arguments`.
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`); `runtime_proof: not-run`. Zmieniłoby to: zgoda na `--runtime` albo dostęp do iPada.
- **Fan-out:** trzech audytorów obszarów zgodnie z domyślnym przepływem skilla. Audytor infrastruktury pominięty: tracker nie istnieje, granica błędów i logowanie nie zmieniły się w runie poza punktami, które pokrywają obszary (`BootScene` loader, `check:deploy`). Ryzyko: ustalenia spoza obszarów są tylko „not re-checked” w § 7. Zmieniłoby to: zmiana w `errorBoundary.ts`, `errorSignal.ts` lub `vite/config.shared.mjs` w runie.
- **Wagi:**
  - S14-01 critical: realistyczna awaria (brak lub błąd dekodowania pliku) jest niewidoczna dla każdego obserwatora z tabletem i zostawia dziecko z zadaniem nie do rozwiązania, sprzecznie z zasadą „bez stanów porażki”. Spadłoby do high, gdyby stand-in pokazywał polską wartość albo gdyby brak obrazka był widoczny w panelu rodzica.
  - S12-01 high, nie critical: rodzic widzi w tej samej sekcji „Zapis jest wyłączony”, a import pliku przy `unavailable` jest często zamierzonym odtworzeniem kopii. Wzrósłby do critical, gdyby pomiar na iPadzie pokazał częste `timeout` przy zdrowym magazynie (to samo co N-7).
  - S13-01 i S13-04 high (latent): żadna dzisiejsza umiejętność ich nie wyzwala; CI tego nie pilnuje (S13-02). Wzrosłyby do critical przy pierwszej umiejętności `select` bez `check` albo `drag` z odpowiedzią nieliczbową.
- **Liczby we frontmatterze:** nowe ustalenia tego raportu (1 critical, 11 high, 13 medium, 15 low) plus otwarte z poprzedniego w obszarze zapisu (N-7, C-2r, M-S1 jako medium; L-S1 jako low). Ustalenia „not re-checked” nie są liczone.
- **Numeracja:** prefiksy S12-/S13-/S14- według slice'u; numery S-14 przenumerowane po scaleniu (raport audytora miał 13 pozycji).
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy; wszystkie kierunki poprawek zostają na urządzeniu.
