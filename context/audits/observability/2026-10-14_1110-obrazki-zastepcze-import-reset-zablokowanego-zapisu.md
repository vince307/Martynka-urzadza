---
type: observability-audit
date: 2026-10-14 11:10
mode: audit
commit: 8dc174a
branch: docs/observability-audit-2026-10-14-fix-art-stand-in
dirty_tree: false
areas: [task-art-stand-ins-and-load-signal, save-import-reset-when-device-save-unread]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-14_0445-eksport-import-reset-widzety-obrazki.md
findings: { critical: 0, high: 5, medium: 8, low: 15 }
---

# Audyt obserwowalności: obrazki zastępcze i sygnał wczytania obrazków, import i reset przy nieodczytanym zapisie (2026-10-14)

Ten raport zamyka run `2026-10-14-fix-art-stand-in`: poprawka `art-stand-in-and-load-signal` (PR #44, scalenie `8dc174a`). Run naprawiał ustalenia S14-01 (CRITICAL), S14-02, S14-03, S14-04, S14-11 i S12-01 z audytu 2026-10-14 04:45 (PR #42, raport nie jest jeszcze w `main`, dlatego `previous_report` wskazuje ścieżkę, pod którą trafi po scaleniu PR #42; ostatni raport obecny w `main` to `2026-10-13_1751-zdrowie-zapisu-po-poprawce.md`). Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

1. **Obrazki zastępcze i sygnał wczytania:** `BootScene` (wczytanie i rekord zdrowia), `ArtImage` (polska etykieta zastępcza), filtr rundy (`artBlocked`/`withoutArtBlocked`, rozgrzewka), linia „Obrazki” w panelu rodzica.
2. **Import i reset przy nieodczytanym zapisie na urządzeniu:** stany `unavailable` (w tym `timeout`) i `unreadable` przechodzące przez `deviceSaveView`, dialogi importu i resetu oraz `Autosaver.replace`.

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po tym, co widzą dziecko, karty DOM, panel rodzica (za bramką) i konsola (bez map źródeł).

## 1. TL;DR

- **CRITICAL zamknięty, nowych CRITICAL brak.** S14-01, S14-02, S14-03, S14-04, S14-11 są naprawione. S12-01 jest naprawione dla `unavailable` (odmowa w `core` i w UI). Dla `unreadable` nadpisanie jest dozwolone z ostrzeżeniem, co jest udokumentowaną decyzją (FR-022).
- **Powody ładowania są spłaszczane (SIR-01, SIR-03).** `LoadOutcome` zna `future`/`corrupt`/`timeout`/nazwę błędu, ale `BlockReason` i jedno zdanie po polsku już nie. Najgroźniejszy przypadek, zdrowy zapis z nowszej wersji (`future`, np. po `rollback`), dostaje najbardziej liberalne traktowanie: import i reset mogą go trwale nadpisać. To ryzyko jest latentne do pierwszego formatu v2.
- **Odmowa bez wyjścia (SIR-02).** Przy trwałym `unavailable` (odczyt zawsze odrzucany albo zimne IDB zawsze > 5 s) import i reset odmawiają przy każdym uruchomieniu, a tekst „Uruchom grę ponownie” zapętla się. Nikt nie liczy kolejnych takich startów.
- **Warstwy fallbacku ukrywają regresję filtra (ASL-01).** Żaden test nie sprawdza, że `TaskScene.freshRound` przekazuje `missingIds` do budowy rundy i rozgrzewki. Spec e2e wymusza umiejętności przez `?e2eSkills`, co omija filtr. Usunięcie argumentu zostawi wszystkie testy zielone (etykiety zastępcze to zamaskują).
- **Panel rodzica wie mniej niż konsola (ASL-02, SIR-03).** Linia „Obrazki” daje liczbę i radę „Uruchom grę ponownie”, która przy złym pliku w wydaniu zapętla się. Brak kluczy, folderu i buildu. Sekcja „Zapis gry” nadal nie pokazuje `lastError` w `off`.

## 2. Model przechwytywania (zmiany względem raportu 04:45)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci. Obserwatorzy: dziecko (kanwa, karty DOM), rodzic (panel ustawień za przytrzymaniem 2 s i bramką), opiekun przez konsolę (bez map źródeł, `__BUILD_ID__` na karcie błędu i karcie `unreadable`).
- **Granica błędów:** bez zmian (`installErrorBoundary`, `isFatalSignal`, `saver.block('fatal')`).
- **Obrazki (nowe):** `BootScene.preload` loguje każdy `loaderror` i odróżnia czcionkę od obrazka (`src/scenes/BootScene.ts:22-24`). `BootScene.create` (`:37-41`) liczy `artHealth(TASK_ART, key => this.textures.exists(key))` raz, po zakończeniu loadera i przed przekazaniem sceny. To łapie i błąd pobrania, i błąd dekodowania (tekstura nie powstaje). Rekord trafia do `REGISTRY_KEYS.artHealth`, a do konsoli idzie jedna linia `Task art missing: N of M: <keys>`. `artHealthView` (`src/core/artHealth.ts`) daje `ok`/`missing`/`unknown`, a `createArtHealthView` rysuje sekcję „Obrazki” w panelu (`src/ui/dom/settingsPanel.ts:122`, czytane przy otwarciu przez `UIScene.openSettings`). Etykieta zastępcza pochodzi z `TASK_ART[].label` (`formatMoney`, `WEIGHTS/JUGS[].label`, rzeczownik ikony; `src/data/taskArt.ts:29-36`) i jest dopasowywana przez `standInLabelFit` (`src/ui/widgets/artLayout.ts`).
- **Filtr rundy (nowy):** `artBlocked` (`src/core/round/artFilter.ts:14-29`) blokuje MONEY_COUNT, MASS i CAPACITY `toLitres`, gdy brakuje któregokolwiek z ich obrazków. `withoutArtBlocked` nigdy nie opróżnia rundy: bieżący krok traci zablokowane umiejętności tylko wtedy, gdy zostaje co najmniej `ceil(unlockShare·n)`, a gdy wszystko byłoby puste, wracają oryginalne kubełki. `pickSkills` w rozgrzewce gra całą pulą, gdy filtr by ją opróżnił (`src/core/round/pick.ts:18-23`). Ścieżka `?e2eSkills` (tylko build e2e) omija filtr.
- **Zapis (zmiany):** `deviceSaveView(blockedBy, current, rooms)` (`src/core/saveFile.ts:80-89`) zwraca `unreadable`, `blocked` (z `cause`), `summary` albo `broken`. Dialogi importu i resetu przy `blocked` pokazują tylko tekst i „Zamknij”, przy `unreadable` ostrzeżenie `deviceUnreadable` zamiast „Teraz”. `Autosaver.replace` odmawia `Blocked` przy `fatal` i `unavailable` (`src/core/autosave.ts:209`), przed jakimkolwiek zapisem. Odmowy `Busy`/`Blocked` nic nie logują.
- **Logowanie:** 19 bloków `catch` w `src/` (bez `src/testing`), bez zmian, i 14 wywołań `console.*` (wcześniej 12). Nowe: `BootScene` `create` (podsumowanie brakujących obrazków) i rozgałęziony `loaderror`.
- **Tożsamość wdrożenia:** bez zmian. Brak map źródeł, `check:deploy` nie patrzy na `assets/`.

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Opiekun / konsola | Werdykt |
|---|---|---|---|---|
| Obrazek monety lub dzbanka nie wczytany (404) | zadania zależne od obrazka pominięte; gdy filtr wraca do pełnej listy, pudełko z „2 zł” / „½ l”, zadanie rozwiązywalne | „Obrazki: N z M nie wczytało się…” | linia na plik + podsumowanie z kluczami | **caught (S14-01, S14-03 zamknięte)** |
| WebP nie dekoduje się | jak wyżej | jak wyżej | podsumowanie z kluczami (plus `console.error` Phasera) | **caught (S14-04 zamknięte)** |
| Plik dekoduje się, ale jest pusty lub zły | zadanie z pieniędzmi znowu nierozwiązywalne | „Wszystkie obrazki zadań są wczytane” | nic | **missed (ASL-07)** |
| Zły plik w wydaniu lub w precache (powtarza się przy każdym starcie) | stale pominięte zadania | rada „Uruchom grę ponownie” zapętla się | klucze bez buildu | misattributed (ASL-02) |
| Regresja: scena przestaje przekazywać `missingIds` | stand-iny wracają do rund (rozwiązywalne) | linia „Obrazki” nadal prawdziwa | nic; testy zielone | **latent missed (ASL-01)** |
| Zawieszone żądanie przy pierwszej wizycie online | pusta kanwa | nic | nic | missed (S14-07, otwarte) |
| Import lub reset przy `unavailable`/`timeout` | — | „Gra nie mogła odczytać zapisu… Uruchom grę ponownie”, tylko „Zamknij” | linia z czasu ładowania `Save unavailable (<name>)`; odmowa bez logu | **caught (S12-01 zamknięte)** |
| Trwałe `unavailable` przy każdym starcie | każda sesja bez zapisu | ta sama rada w pętli, bez wyjścia | nazwa błędu tylko w konsoli | **missed (SIR-02, SIR-03)** |
| Import lub reset przy `unreadable` (`corrupt`) | — | ostrzeżenie, potem dozwolone nadpisanie | nic po udanym nadpisaniu | caught, bez śladu (SIR-05) |
| Import lub reset przy `unreadable` (`future`, zdrowy nowszy zapis) | — | „nie da się odczytać”, dozwolone nadpisanie | nic | **latent misattributed (SIR-01)** |
| „Zapisz kopię” przy `unreadable`/`unavailable` | — | „Plik został pobrany” ze świeżą sesją | nic | misattributed (SIR-04 = S12-04) |

## 4. Systemowe przyczyny źródłowe

1. **Powody spłaszczane po drodze.** `LoadOutcome` (`future`/`corrupt`/`timeout`/nazwa błędu) → `BlockReason` → jedno zdanie po polsku. Bramka, tekst i ścieżka odzyskania decydują na podstawie mniejszej wiedzy niż krok ładowania. Wyjaśnia SIR-01, SIR-03, SIR-06, ASL-02.
2. **„Odmów i uruchom ponownie” zakłada awarię przejściową.** Ani zapis, ani obrazki nie liczą powtórzeń między startami, więc trwała awaria zamienia się w cichy, stały tryb degradacji z radą, która nie pomaga (SIR-02, ASL-02).
3. **Warstwowe fallbacki bez własnego sygnału i testu krawędzi sceny.** Filtr → pełny bieżący krok → pełna pula → etykieta zastępcza. Każda warstwa jest poprawna, ale zewnętrzna maskuje regresję wewnętrznej, a testowany jest tylko czysty `core` (ASL-01, ASL-03, ASL-04). Ten sam wzorzec ma `?e2eSkills`, który omija budowę rundy.
4. **„Wczytany” znaczy „istnieje”.** Rekord zdrowia, test tabeli i `check:deploy` potwierdzają obecność, nigdy rozmiaru ani treści (ASL-07, S14-06).
5. **Działania rodzica nie zostawiają śladu w konsoli.** `replace`, jego odmowy i nadpisanie nieczytelnego zapisu są ciche. Opiekun widzi tylko linie z czasu ładowania (SIR-05, S12-06).

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### Obrazki zastępcze i sygnał wczytania

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| ASL-01 | `src/scenes/TaskScene.ts` `freshRound` (przekazanie `missingIds` do `buildAdaptiveRound` i `blocked` do `buildWarmup`) | coverage-gap | medium | Żaden test nie sprawdza okablowania. Spec e2e obrazków wymusza umiejętności `?e2eSkills`, co wraca przed `buildAdaptiveRound`. Usunięcie argumentu zostawia testy zielone, a pomijanie zadań zależnych od obrazka (część poprawki S14-01) znika niezauważone, bo etykiety zastępcze to maskują. | Test okablowania w stylu `deviceSaveWiring.test.ts` albo spec e2e z `?e2eArt=missing` bez `e2eSkills`, który sprawdza brak MONEY_COUNT w rundzie. |
| ASL-02 | `src/data/pl.ts` `pl.settings.artMissing` + `src/core/artHealth.ts` `artHealthView` | missing-context | medium | Rada zawsze brzmi „Uruchom grę ponownie”. Zły plik w wydaniu albo uszkodzony plik w precache psuje się tak samo przy każdym starcie, więc rada się zapętla. Linia ma tylko liczbę: bez folderu, bez buildu. Mówi też „zamiast obrazka jest napis”, choć większość takich zadań jest pomijana. | Liczby per folder (pieniądze, odważniki, dzbanki, ikony), `__BUILD_ID__`, zdanie o pominiętych zadaniach. |
| ASL-03 | `src/core/round/artFilter.ts` `withoutArtBlocked` (próg `minCurrent`) | coverage-gap | low | Gdy zostaje dokładnie `ceil(share·n)` umiejętności, dziecko musi opanować wszystkie pozostałe, by odblokować krok. Postęp zwalnia bez widocznej przyczyny. | Odnotować w design-gaps (wiersz 66) albo obniżyć próg w `unlockReady` przy brakujących obrazkach. |
| ASL-04 | `withoutArtBlocked` (powrót do pełnej listy) + `src/core/round/pick.ts` `pickSkills` | swallowed | low | Fallback gra zablokowane umiejętności z etykietami, a wyniki trafiają do opanowania (`recordRound`) bez znacznika. Akceptowalne, odkąd etykiety czynią je rozwiązywalnymi, ale nikt nie wie, że fallback zadziałał (resztka S14-05). | Licznik rund z fallbackiem w rekordzie sesji, w podsumowaniu konsoli. |
| ASL-05 | `src/ui/widgets/ArtImage.ts` `show` + `src/ui/widgets/artLayout.ts` `standInLabelFit` | flattened-response | low | Etykieta nie ma minimalnego rozmiaru. W COUNT/MULT_GROUPS z 30 ikonami rzeczowniki maleją poniżej czytelności (pudełka nadal da się policzyć). `fit.scale > 0 ? fit.scale : 1` wraca do pełnego rozmiaru przy zerowym pudełku (dziś nieosiągalne). | Minimalny rozmiar; poniżej niego bez etykiety. Skala 0 = ukryte. |
| ASL-06 | `src/scenes/BootScene.ts` `preload` (handler `loaderror`) | logged-not-captured | low | Awaria czcionki jest nazwana w konsoli, ale nie ma jej w rekordzie, panelu ani na karcie. Obrazki logują się dwa razy (linia na plik + podsumowanie). | Czcionka w rekordzie zdrowia obok obrazków albo usunąć linię na plik. |
| ASL-07 | `src/core/artHealth.ts` `artHealth` (predykat `textures.exists`) + `scripts/check-deploy.ts` | coverage-gap | low | Plik, który się dekoduje, ale jest pusty lub zły (błąd `npm run art`, zły plik pod dobrą nazwą), liczy się jako wczytany. Pieniądze znów są nierozwiązywalne bez sygnału. | W `create` porównać `texture.source[0].width/height` z `TASK_ART`; `check:deploy` sprawdza `assets/` (zamyka S14-06). |
| ASL-08 | `UnlockCard` (`pendingUnlock`, `childName`, np. `src/data/curriculum/E2.ts` „Pieniądze do 20 zł i litr”) | missing-context | low | „Nowa umiejętność!” może ogłosić krok, którego zadania z pieniędzmi lub dzbankami są pomijane przez całą sesję. | Akceptować albo pominąć słowo o obrazku, gdy umiejętności kroku są zablokowane. |
| ASL-09 | `src/core/round/artFilter.ts` `artBlocked` (MONEY_COUNT: dowolne id z params) | noise | low | Brak jednej rzadkiej monety (`coin-01gr`) blokuje całą umiejętność, co popycha filtr w stronę fallbacku (ASL-03/04). | Akceptować (ostrożne) albo filtrować id per zadanie w generatorze. |

Sprawdzone jako dobre: rekord powstaje raz po zakończeniu loadera, przed przekazaniem sceny, i obejmuje błąd pobrania i dekodowania (`?e2eArt=corrupt` w `tests/e2e/art-stand-in.spec.ts`). `artBlocked` blokuje dokładnie te typy, w których odpowiedź jest tylko na obrazku; MONEY_CHANGE, CAPACITY `howMany`, COUNT, MULT_GROUPS, ikony wagi i termometr zostają, bo są rozwiązywalne z etykietą. Runda nigdy nie jest pusta i nie rzuca. Próg zgodny z `unlockReady`, więc krok nadal da się odblokować. Etykiety zastępcze są polskie i pochodzą z danych; tylne odważniki i dzbanki mają własne prostokąty bez nakładania. Rekord zdrowia jest stanem w pamięci, nie w zapisie (format v1 bez zmian). Seam `?e2eArt` ma marker w `vite/e2eHookGuard.mjs`.

### Import i reset przy nieodczytanym zapisie

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| SIR-01 | `src/core/saveFile.ts` `deviceSaveView` + `src/core/autosave.ts` `BlockReason` (gubi `LoadOutcome.reason`) | missing-context | high (latent) | Zapis `future` (nowszy format, np. po `rollback` wdrożenia) jest zdrowy. Dialog mówi, że „nie da się go odczytać”, i nadal pozwala na import lub reset, które go trwale niszczą. Seam e2e `e2eSaveStore` (wersja 99) to właśnie ten przypadek. Nieosiągalne na produkcji do pierwszego formatu v2. | Przenieść powód do statusu i `deviceSaveView`. Przy `future` odmówić w `replace` jak przy `unavailable` albo pokazać „zapis z nowszej wersji gry”. |
| SIR-02 | `src/core/autosave.ts` `replace` (odmowa `Blocked`) + `src/ui/dom/saveImportDialog.ts` `blockedStep` | coverage-gap | high | Gdy odczyt zawodzi przy każdym starcie (uszkodzony wpis IDB, który odrzuca odczyt przy działającym zapisie; zimne IDB zawsze > `balance.save.loadTimeoutMs`), import i reset odmawiają zawsze, a „Uruchom grę ponownie” zapętla się. Każda sesja przepada; rodzic nie ma wyjścia w aplikacji. | Po drugim kolejnym starcie `unavailable` albo po wyraźnym drugim potwierdzeniu pozwolić na import lub reset; inaczej podać „wyczyść dane strony”. |
| SIR-03 | `src/core/saveHealth.ts` `stateOf` + `src/ui/dom/saveHealthView.ts` `createSaveHealthView` + `src/main.ts` `start` (brak `detail` dla `unavailable`) | flattened-response | high | `lastError` jest już ustawione z `loadError`, ale nie jest rysowane. Wolny, zdrowy `timeout` i zepsuty magazyn (`UnknownError`) dają ten sam tekst „przeglądarka nie udostępniła zapisu”, który przy `timeout` obwinia przeglądarkę. Rodzic nie odróżni dwóch przyczyn SIR-02. To jest N-7 i S12-10. | Rysować `off.cause` i `lastError`; osobny tekst dla `timeout`; `detail` (kod + build) na karcie `unavailable`. |
| SIR-04 | `src/scenes/UIScene.ts` `openExport` (`exportFileText({kind:'save', save: saver.current()})`) | missing-context | medium | Przy `unreadable` i `unavailable` „Zapisz kopię” eksportuje świeżą sesję w pamięci. Plik wygląda jak kopia postępów dziecka. Ostrzeżenie jest tylko w dialogach importu i resetu, nie w eksporcie. Rodzic, który „zachowuje kopię” przed resetem, dostaje zły plik. To jest S12-04. | Przekazać `deviceSaveView` do dialogu eksportu; ostrzec albo oznaczyć kopertę (`device: 'unread'`). |
| SIR-05 | `src/core/autosave.ts` `replace` (`Busy`/`Blocked` bez `log`; udany `replace` przy `unreadable` bez śladu) | swallowed | medium | Opiekun nie ustali z konsoli, czy nieczytelny zapis został nadpisany działaniem rodzica. Jedyną wskazówką jest brak karty przy następnym starcie. | Jedna linia `log` przy każdej odmowie i przy `replace` wykonanym przy `blockedBy === 'unreadable'`. |
| SIR-06 | `src/core/saveFile.ts` `deviceSaveView` (`fatal` → `blocked`) | missing-context | low | Przy `fatal` rodzic przeczytałby „Gra nie mogła odczytać zapisu”, co jest nieprawdą. Praktycznie nieosiągalne, bo karta błędu wstrzymuje wejście. | Osobny tekst dla `cause: 'fatal'`. |
| SIR-07 | `context/archive/2026-10-14-art-stand-in-and-load-signal/follow-ups/review-fixes.md` (wyzwalacz S12-02..S12-15) | config | low | Wyzwalacz „następna zmiana panelu zapisu lub `autosave.replace`” spełniła ta sama zmiana, a pozycje odłożono ponownie bez nowego wyzwalacza. Lista odłożonych przestaje cokolwiek wymuszać. | Przepisać wyzwalacz na konkretne warunki. |

Sprawdzone jako dobre: bramka w UI i w `core` się zgadza (`unavailable` i `fatal` odmawiane w obu, `unreadable` dozwolone w obu). Odmowa `Blocked` następuje przed jakimkolwiek zapisem (test w `tests/autosave.test.ts`), a `tests/deviceSaveWiring.test.ts` i `tests/e2e/save-transfer-blocked.spec.ts` pokrywają oba stany. `blockedBy` ustawia tylko ładowanie albo `fatal`; nieudane zapisy nie blokują, więc nie ma przestarzałej bramki. Brak ponownego odczytu w dialogu jest świadomą decyzją (bez nowego asynchronicznego I/O). Przy działającym już IDB niewidziany zapis nie zostanie nadpisany; restart go odczyta.

## 6. Zalecana kolejność poprawek

1. **ASL-01:** test okablowania `freshRound` (mały, chroni zamknięty CRITICAL przed cichą regresją).
2. **SIR-03 + ASL-02 (N-7, S12-10):** powód i `lastError` w sekcji „Zapis gry” i na karcie `unavailable`; liczby per folder i build w linii „Obrazki”. Ten sam wzorzec widoku.
3. **SIR-02:** licznik kolejnych startów `unavailable` (w `localStorage` jako wygoda, nie w zapisie) i ścieżka wyjścia po drugim.
4. **SIR-01:** powód `future` w statusie i odmowa w `replace`. Trzeba to zrobić przed pierwszym formatem v2.
5. **SIR-04 (S12-04) + SIR-05 + S12-06:** ostrzeżenie w eksporcie, log każdego wyniku `replace` innego niż `ok`, osobny tekst porażki resetu.
6. **ASL-07 + S14-06:** sprawdzenie wymiarów tekstur w `create` i `assets/` w `check:deploy`.
7. **S12-02 + S14-07:** limity czasu dla `replace` i loadera.
8. Drobne: ASL-03…06, ASL-08, ASL-09, SIR-06, SIR-07, S12-05, S12-11, S12-13, S14-09, S14-10, S14-12, S13-11.

Ograniczenie wspólne: nic nie opuszcza urządzenia; wszystkie kierunki zostają w panelu rodzica, na kartach i w konsoli.

## 7. Zmiany od ostatniego audytu

Porównanie z raportem 2026-10-14 04:45 (PR #42).

| Poprzednie id | Status | Dowód |
|---|---|---|
| S14-01 (critical) | **fixed** | Polskie etykiety z danych (`src/data/taskArt.ts` `TASK_ART[].label`, `ArtImage.show`); umiejętności z odpowiedzią tylko na obrazku pomijane w rundzie i rozgrzewce (`artBlocked`, `buildAdaptiveRound`, `buildWarmup`). e2e sprawdza etykietę `^\d+ (zł\|gr)$` i przejście zadania. Resztka: ASL-01. |
| S14-02 | **fixed** | `WEIGHTS[].label`, `standInLabelFit` z podziałem na dwie linie, tylne odważniki w prostokącie `uncovered` (`artLayout.ts`, `BalanceScale.render`). Resztka: ASL-05 i follow-up O1 (etykieta ok. 7,5–9,5 px w fazie rozwiązania z klawiaturą). |
| S14-03 | **fixed** | `REGISTRY_KEYS.artHealth` w `BootScene.create`, podsumowanie w konsoli, linia „Obrazki” w panelu. Resztka: ASL-02. |
| S14-04 | **fixed** | Przegląd `textures.exists` po wczytaniu łapie błąd dekodowania; e2e `?e2eArt=corrupt`. |
| S14-11 | **fixed** | Komentarz `ArtImage.ts`, `layout.ts` i wiersz 66 w `docs/design-gaps.md` opisują etykiety i pomijanie; twierdzenie o rozwiązywalności jest teraz prawdziwe. |
| S12-01 | **fixed** (`unavailable`); `unreadable`: dozwolone z ostrzeżeniem (decyzja FR-022) | `replace` `Blocked` przy `unavailable` (`autosave.ts:209`), `deviceSaveView` → `blockedStep`/tylko „Zamknij”; `deviceUnreadable` zamiast „Teraz”. Resztki: SIR-01 (`future`), SIR-02 (brak wyjścia), SIR-05 (brak logu). |
| S14-05 | changed (w większości złagodzone) | Zablokowane umiejętności zwykle nie są losowane; w fallbacku są rozwiązywalne. `recordRound` nadal bez znacznika (ASL-04). |
| S14-06 | still open | `scripts/check-deploy.ts` nie sprawdza `assets/tasks`. |
| S14-07 | still open | Brak `loader.timeout` w `main.ts` i `load.setTimeout` w `BootScene`. |
| S14-08 | changed (częściowo) | Czcionka nazwana osobno; nadal poza rekordem (ASL-06). |
| S14-09 | still open (nieosiągalne) | `size ? … : 1` w `ArtImage.show`, `coinMm[id] ?? 20` w `artLayout.ts`. |
| S14-10 | still open | `images[i]?.show` w `MoneyTable`, `Jugs`, `BalanceScale`. |
| S14-12 | still open (akceptowane) | `skipWaiting`/`clientsClaim` i niehashowane URL-e bez zmian; 404 w trakcie aktualizacji widać teraz w `artHealth`. |
| S13-11 | still open | `this.images[i]?.show` w `IconGroups.render`. |
| S12-02 | still open | `replace` czeka na `inflight` i `store.write` bez limitu; przyciski dialogów wyłączone na zawsze przy zawieszeniu. |
| S12-03 | still open | `stateOf` nie czyta `status.replace`. |
| S12-04 | changed (częściowo, tekstem) | Ostrzeżenie tylko w imporcie i resecie; eksport bez zmian (SIR-04). |
| S12-05 | still open | `UIScene.openImport`/`openReset` przy `broken` zamykają panel bez tekstu i logu. |
| S12-06 | still open | `result.error` odrzucany; reset pokazuje `applyFailed` „Nie udało się wczytać zapisu”. |
| S12-10 | still open | `off`/`failing` bez `lastError` (scalone w SIR-03). |
| S12-11 | still open | Porażki `replace` liczą się do `failures`/`consecutiveFailures`. |
| S12-13 | still open | Handlery przycisków i `apply(...).then` poza `session.run`. |
| N-7 | still open | Karta `unavailable` bez `detail`; `timeout` i odrzucenie z tym samym tekstem (scalone w SIR-03). |
| S12-07…09, S12-12, S12-14, S12-15, S13-01…S13-10, S13-12…14, M-S1, L-S1, C-2r i starsze | not re-checked | Poza obszarami tego runu. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** dwóch audytorów obszarów (subagenci tylko do odczytu, równolegle), po jednym na obszar, plus ten krok jako syntezator. Audytor infrastruktury nie był uruchamiany (patrz decyzje).
- **Powierzchnia:** `git diff --stat 1812347 8dc174a -- src vite` = 25 plików, +354/−80 (z testami i dokumentacją 39 plików, +889/−91).
- **Sprawdzone ręcznie:** `BootScene.create` liczy `artHealth` z `textures.exists` po wczytaniu i loguje podsumowanie; `artBlocked` obejmuje tylko MONEY_COUNT, MASS, CAPACITY `toLitres`, a `withoutArtBlocked` wraca do oryginalnych kubełków przy pustym wyniku; `TaskScene.freshRound` przekazuje `missingIds`, a ścieżka `?e2eSkills` wraca przed `buildAdaptiveRound` (ASL-01), a `missingIds` występuje w testach tylko w `tests/artHealth.test.ts` i `tests/artFilter.test.ts` (sam `core`); `replace` odmawia `Blocked` przy `fatal`/`unavailable` bez logu (SIR-05); `deviceSaveView` mapuje każde `unreadable` na jeden widok, a `decodeSave` zwraca `unreadable` z `reason: 'future'` dla wersji > `SAVE_VERSION` (SIR-01 potwierdzone); `pl.settings.artMissing` kończy się „Uruchom grę ponownie.” (ASL-02).
- **Wagi po weryfikacji:** ASL-01 medium, nie critical: regresja nie byłaby niewidoczna dla dziecka (etykiety czynią zadanie rozwiązywalnym), a linia „Obrazki” zostaje. SIR-01 high (latent): dzisiejszy format jest jedyny.
- **Przegląd repo:** 19 bloków `catch` w `src/` (bez `src/testing`), 14 wywołań `console.*`.
- **Nieudowodnione w czasie działania:** jak wygląda linia „Obrazki” i etykiety zastępcze na prawdziwym iPadzie; czy WebKit kiedykolwiek nie zdekoduje WebP z pakietu; czy trwałe `unavailable` (SIR-02) i zawieszony `replace` (S12-02) występują na prawdziwym IDB w iPadOS; zachowanie loadera przy zawieszonym żądaniu (S14-07). E2E, testy i build nie były uruchamiane w tym kroku; baseline runu (`unit 1905 passed`, `e2e 52 passed` na `8dc174a`) pochodzi z kontraktu runu, nie z obserwacji tutaj.
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania; `area_source: arguments`. Obszary pokrywają ponownie te same miejsca co poprzedni raport, bo krok zamyka run naprawczy, który miał je zamknąć (rotacja nie miała zastosowania).
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`); `runtime_proof: not-run`. Zmieniłoby to: zgoda na `--runtime` albo dostęp do iPada.
- **Fan-out:** dwóch audytorów obszarów. Audytor infrastruktury pominięty: run nie zmienił `errorBoundary.ts`, `errorSignal.ts` ani `vite/config.shared.mjs` (zmiana w `vite/` to tylko marker w `e2eHookGuard.mjs`), a tracker nie istnieje. Przegląd `catch`/`console.*` wykonał syntezator. Zmieniłoby to: zmiana granicy błędów lub konfiguracji PWA w runie.
- **`previous_report`:** wskazuje raport 04:45 z PR #42 (jeszcze nie w `main`), bo to on jest źródłem sześciu naprawianych ustaleń; jego treść czytana z kopii runu. Zmieniłoby to: odrzucenie PR #42 (wtedy punktem odniesienia jest raport 2026-10-13 17:51).
- **Wagi:** brak CRITICAL. ASL-01 nie podniesione do critical mimo reguły „luka wyłączająca sygnał regresji poprzedniej poprawki”, bo sygnał dla rodzica (linia „Obrazki”) i rozwiązywalność zostają; ginie tylko pomijanie zadań. Podniosłoby to: usunięcie etykiet albo rekordu zdrowia bez testu. SIR-02 high, nie critical: rodzic widzi „Zapis jest wyłączony”, choć bez wyjścia.
- **Liczby we frontmatterze:** nowe ustalenia (3 high, 4 medium, 9 low) plus otwarte z poprzedniego raportu w obszarach tego runu, nie scalone w nowe: S12-02, S12-03 (high); S12-05, S12-06, S14-06, S14-07 (medium); S12-11, S12-13, S14-09, S14-10, S14-12, S13-11 (low). S12-04, S12-10, N-7 i S14-05 liczone raz, w SIR-04, SIR-03 i ASL-04. Ustalenia „not re-checked” nie są liczone.
- **Numeracja:** prefiksy ASL- (obrazki) i SIR- (import/reset przy zablokowanym zapisie).
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy; wszystkie kierunki poprawek zostają na urządzeniu.
