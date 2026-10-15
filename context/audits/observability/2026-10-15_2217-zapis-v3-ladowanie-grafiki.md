---
type: observability-audit
date: 2026-10-15 22:17
mode: audit
commit: e369b19
branch: docs/observability-audit-2026-10-15-fix-salon-load-health
dirty_tree: false
areas: [save-v3-migration-backup-import-export, art-loading-timeout-bootscene-loading-screen]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md
findings: { critical: 0, high: 1, medium: 12, low: 14 }
---

# Audyt obserwowalności: zapis v3 i ładowanie grafiki z limitem czasu (2026-10-15)

Ten raport zamyka run `2026-10-15-fix-salon-load-health`. Run miał jeden slice spoza roadmapy, `salon-load-health` (PR #65, merge `e369b19`, wdrożenie 38800281299). Slice zamykał ustalenia H-1, H-2, M-2 i M-3 z audytu 2026-10-15 20:10 (PR #63, niezmergowany, więc jego plik nie jest na `main`). Ten audyt jest statyczny, bez `--runtime`.

Obszary pochodzą z argumentów kroku:

- **Zapis gry v3:**
  - migracja v2 → v3 (stary salon, `MIGRATIONS[2]` = `LIFT_V2_SALON` w `src/core/migrations/legacySalon.ts`);
  - kopia `backup-v2` i zapis przy starcie po migracji;
  - karta `future` na starszych buildach;
  - import i eksport plików v1–v3.
- **Ładowanie grafiki:**
  - limit czasu na każdym pliku w `BootScene` (loader Phasera, `balance.loader`);
  - zawieszony plik kończy się zastępnikiem i linią „Obrazki”;
  - ekran ładowania (`LoadingScreen`).

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po czterech kanałach: co widzi dziecko, karty DOM, panel rodzica (za bramką) i konsola tabletu (bez map źródeł).

## 1. TL;DR

- **0 CRITICAL, 1 HIGH.**
  - Zapis v3 jest solidny. `MIGRATIONS[2]` nie może rzucić (testy). H-1, M-2 i M-3 z audytu 20:10 są zamknięte.
  - Starsze buildy odczytują v3 jako `future` i nie nadpisują go. Sprawdzono to w kodzie `826150c^` i `b0ad4ba^`.
  - Kopie mają osobne klucze (`backup-v1` i `backup-v2`).
- **Przyczyna 1: limit jest na plik, nie na cały ekran ładowania (A-1, HIGH).**
  - Phaser na Androidzie pobiera najwyżej 6 plików naraz (`Config.js` `loaderMaxParallelDownloads`). Kolejka ma ok. 65 plików, a każdy może trwać do 24 s (12 s × (1 ponowienie + 1)).
  - Gdy serwer przyjmuje połączenia, ale nie odpowiada (pierwsze uruchomienie przed precache, przeciążony VPS, portal Wi-Fi), pasek stoi kilka minut. Dziecko i rodzic nie dostają wtedy żadnego sygnału (A-2).
  - H-2 jest więc **częściowo** zamknięte. Żaden pojedynczy obrazek już nie wisi bez końca, ale suma czasu nie ma granicy, a czcionka (`FontFile`, bez XHR) nadal nie ma limitu.
- **Przyczyna 2: wynik bez powodu.**
  - Każda awaria grafiki (timeout, 4xx/5xx, dekodowanie) kończy się jako `textures.exists = false`. W konsoli zostaje jedna linia „Task art failed to load: key” (A-3), a dekodowanie nie zostawia nawet jej (A-4).
  - Rodzic widzi tylko licznik (A-5). Porażka czcionki jest martwą gałęzią logu (A-7).
  - To samo dzieje się w zapisie. `LoadOutcome` gubi pole, które nie przeszło walidacji (V-1), oraz krok i nazwę błędu migracji (V-2). `ImportResult` gubi `migratedFrom` (V-3).
- **Przyczyna 3: wersja zapisu sprawdzana tylko przy odczycie.**
  - Stara karta lub instancja PWA po aktualizacji service workera może nadpisać zapis v3 zapisem v2 bez słowa (P-5, rozszerza znany follow-up „dwie karty”).
  - Rollback poniżej v3 chroni tylko notka w `deploy/README.md` (P-4).
- **Przyczyna 4: fixture'y nie mają kształtu prawdziwego urządzenia.** Zapisy v1 z lat S-11..S-14 mają `salon` z 10 starymi slotami. Żaden test nie przeprowadza takiego zapisu przez oba kroki v1 → v2 → v3, bo fixture'y v1 używają pokoju `living` (V-4).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-13 17:51 i audytu 20:10)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i sieci. Granica `installErrorBoundary` jest w `src/main.ts` (L107) przed `void start()` (L306), więc wyjątek z asynchronicznego `start` trafia do karty „Ups!” z buildem.
- **Start (`src/main.ts` `start`):**
  1. `loadSave` (`src/core/autosave.ts`) → `decodeSave` (`src/core/save.ts`).
     - `SAVE_VERSION` = 3.
     - `MIGRATIONS[1]` (v1 → v2) i **nowe** `MIGRATIONS[2]` = `LIFT_V2_SALON`, z zamrożonymi tabelami starego salonu i znacznikiem `OLD_ONLY_KEYS`.
     - `from > SAVE_VERSION` daje `future`.
     - Wyjątek kroku daje `migration-failed`, a pusty `catch` gubi nazwę błędu.
  2. Karty DOM `saveFuture`, `saveMigrationFailed`, `saveFailed`, `saveUnavailable` i `saveSlow`. Każda ma `Kod:` i `Wersja <sha>`.
  3. `console.warn("Save migrated from v<N>")` (L218), ta sama linia dla każdego zapisu v2, niezależnie od tego, czy salon został przebudowany.
  4. `createGame` z `loader: { timeout: balance.loader.timeoutMs (12000), maxRetries: 1 }`. W buildzie hooka `?e2eArt=stall` daje 2000 ms.
  5. `createAutosaver({ migrated: { from, raw }, log: console.error })`.
     - **Nowe:** zapis przy starcie z powodem `migration` (`arm` w konstruktorze, `void save(...)` L303).
     - Kopia `profile:default:backup-v<from>` (`src/storage/idb.ts`) jest robiona przed pierwszym zapisem v3, w najwyżej 3 próbach z `withTimeLimit`.
     - Status runtime: `migratedFrom`, `backup`, `backupError`, `lastFailure`, **nowe** `migrationWrittenAt` (czytane tylko przez testy).
- **`BootScene.preload`:**
  - **Nowy** listener `Loader.Events.ADD` kopiuje `this.load.xhr.timeout` na każdy plik. Phaser daje każdemu plikowi własne `timeout: 0`, które nadpisuje globalne.
  - XHR `ontimeout` → `File.onError` → jedno ponowienie → `loaderror` → `console.warn("Task art failed to load: <key>")`. Ta sama etykieta jest też dla plików pokoju.
  - Dekodowanie idzie przez `File.onProcessError` Phasera i jego `console.error`, bez `loaderror`.
  - Czcionka jest `FILE_POPULATED`, więc nie przechodzi przez XHR.
- **`BootScene.create`:** `artHealth` i `roomArtHealth` z `textures.exists` trafiają do rejestru (runtime). Panel rodzica, sekcja „Obrazki”, pokazuje licznik.
- **Import i eksport (`src/core/saveFile.ts`):** `parseImport` idzie przez `decodeSave`, `validateSave` i `importProblem`, więc pliki v1 i v2 są migrowane do v3. Odmowa ma powód, sukces nie ma informacji o migracji. Zapis przechodzi przez `Autosaver.replace` z `replaceGate`.
- **Logowanie:** w `src/` (bez `src/testing`) jest 23 bloki `catch` (było 19) i 18 wywołań `console.error/warn` (było 10). Pustych `catch` nie ma. Są dwa domyślne `.catch(() => undefined)`, oba starsze: `registerServiceWorker.ts`, `installHint.ts`. PR #65 nie dodał nowych połknięć.
- **Tożsamość wdrożenia:** `__BUILD_ID__` jest na kartach zapisu, w „Zapis gry” i w pliku eksportu. Map źródeł nie ma. Karta `future` nie podaje wersji zapisu ani najwyższej wersji, którą build czyta.
- **Seamy e2e:** `?e2eArt=stall`, fixture `legacy-salon` i `?e2eSave=*` są objęte markerami w `vite/e2eHookGuard.mjs`, więc dowiedzione nieobecne w `dist/`.

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola | Werdykt |
|---|---|---|---|---|
| Zapis v2 ze starym salonem | salon przebudowany, gra działa | „przeniesiono z wersji 2 · stara kopia została” (tylko w tej sesji) | `Save migrated from v2` | **caught** (e2e `salon-load-health` #2) |
| Zapis v1 (z `living`) | gra działa | linia migracji | `Save migrated from v1` | caught (e2e), ale **kształt salonu v1 nie testowany** (V-4) |
| Kopia `backup-v2` zawodzi | nic | „failing · kopia starego zapisu · Kod: X”, bez linii migracji, dopóki zapis nie wejdzie | `autosave: backup failed` ×2 | caught dla rodzica; zapis v3 czeka na następną zmianę (P-1 = znane F8) |
| Zapis v3 otwarty w buildzie sprzed v3 | karta `future`, eksport surowego zapisu | „Kod: future · Wersja <sha>”, bez numeru wersji | warn | **caught** (statycznie z `826150c^`; e2e na dwóch buildach to follow-up) |
| Zapis po migracji nie przechodzi walidacji | karta „nieczytelny” | „Kod: corrupt” bez pola | `Save unreadable (corrupt)` | caught, **pole nieznane** (V-1) |
| Import pliku v2 ze starym salonem | podsumowanie z przebudowanym salonem | inne liczby niż pamięta, bez „przeniesiono z v2” | nic | flattened (V-3) |
| Stara karta/PWA pisze v2 po v3 | postęp z nowej karty znika | nic | nic | **missed** (P-5) |
| Jeden plik grafiki zawiesza się | pasek stoi do 24 s, potem zastępnik | „Obrazki”: licznik | `Task art failed to load: key` | **caught** (e2e #15 H-2, 2 s, bez ponowienia) |
| Wiele plików wisi (serwer milczy) | pasek stoi minuty (Android: fale po 6) | nic do startu gry, potem licznik | jedna linia na plik, na końcu | **missed w trakcie** (A-1, A-2) |
| 404 vs timeout vs dekodowanie | zastępnik | ten sam licznik | 2 formaty, bez URL/statusu | flattened (A-3, A-4, A-5) |
| Czcionka nie wczyta się / wisi | font zastępczy / wieczny pasek | nic | Phaser `Font failed to load`; app-linia martwa | missed (A-7; limit czasu = znany follow-up) |

## 4. Systemowe przyczyny źródłowe

1. **Ograniczenie lokalne bez budżetu całości.**
   - Mechanizm: limit H-2 jest na plik, bo tak działa XHR w Phaserze. Budżetu dla całego `preload` nie ma, nie ma też widoku „wolno” (zapis ma `saveSlow` i „Poczekaj dłużej”, ładowanie nic).
   - Czas całkowity rośnie z liczbą plików i limitem równoległości. Limit obejmuje cały transfer, a nie bezczynność, więc na wolnym, ale działającym łączu duży plik pada za każdym razem.
   - Wyjaśnia: A-1, A-2, A-6, A-7, A-11.
2. **Werdykt bez przyczyny.**
   - Mechanizm: czysty `core` i sceny zwracają tylko werdykt (`exists`, `corrupt`, `migration-failed`, `ok`), a przyczyna, którą wywołujący ma pod ręką, przepada. Przykłady: `file.xhrLoader.status`, `importProblem(raw)`, `step` i `errorName(e)` w `decodeSave`, `migratedFrom` w imporcie.
   - Rozsądne lokalnie (prosty typ), ale dla rodzica każdy przypadek wygląda tak samo.
   - Wyjaśnia: A-3, A-4, A-5, A-8, V-1, V-2, V-3, V-8, P-7.
3. **Wersja zapisu znana tylko przy odczycie.**
   - Mechanizm: autosaver nie porównuje wersji w magazynie przed zapisem. Wdrożenie nie zna `SAVE_VERSION`, a SW (`skipWaiting` + `clientsClaim`) może zostawić starą instancję obok nowej.
   - Wyjaśnia: P-4, P-5, P-8.
4. **Status zdrowia tylko „na żądanie”.**
   - Mechanizm: `status()` czyta tylko panel rodzica przy otwarciu. Zapis `migration` jest typu „wystrzel i zapomnij”: bez ponowienia i bez linii, dopóki się nie uda.
   - Nowe pole `migrationWrittenAt` nie trafia do żadnego widoku.
   - Wyjaśnia: P-1, P-2, V-6, V-7.
5. **Fixture'y i seamy nie mają kształtu produkcji.**
   - Mechanizm: fixture'y v1 i v2 mają pokój `living`, którego nigdy nie było. Seam `stall` ma 0 ponowień i dotyczy tylko pokoju. E2E nie biegnie w CI ani na WebKit.
   - Wyjaśnia: V-4, V-5, A-9.

## 5. Ustalenia według obszaru

Lokalizacje są podane jako plik + SYMBOL.

### Zapis gry v3 (migracja, kopia, future, import/eksport)

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| V-1 | `src/core/autosave.ts` `loadSave` + `src/main.ts` `start` (karta nieczytelna) | missing-context | medium | Zapis, który po migracji nie przechodzi `validateSave` (np. wariant spoza 0–2 w zachowanym slocie), daje tylko „Kod: corrupt” i `Save unreadable (corrupt)`. `importProblem` liczy pole, ale używa go tylko import. Diagnoza wymaga surowego eksportu od rodzica. | Dodać `problem: importProblem(raw)` do `LoadOutcome` `unreadable`, pokazać w `Kod:` i w warn. |
| V-2 | `src/core/save.ts` `decodeSave` (`catch {}` przy kroku i przy `toSession`) | identity-lost | low | Krok, który rzuca, daje `migration-failed` bez nazwy błędu. `step` ginie w `LoadOutcome`. Wyjątek z `toSession` staje się `corrupt` bez śladu. Dziś martwe, bo kroki 1 i 2 nie rzucają (testy). | Przenieść `step` + `errorName(e)` do `LoadOutcome` i `Kod:` (trigger jak F7: krok, który może rzucić). |
| V-3 | `src/core/saveFile.ts` `parseImport` / `ImportResult` | flattened-response | low | Import pliku v2 sprzed S-16a pokazuje przebudowany salon (np. 7/10 → 6/7) bez „przeniesiono z wersji 2”. Rodzic widzi inne liczby i nie wie dlaczego. | `migratedFrom` w `ImportResult`, jedna linia w kroku podsumowania. |
| V-4 | `tests/fixtures/save-v1*.json` (pokój `living`), `tests/e2e/save-migration.spec.ts` | coverage-gap | medium | Prawdziwe urządzenia v1 (S-11..S-14) mają `salon` z 10 starymi slotami. Żaden test nie przeprowadza tego kształtu przez v1 → v2 → v3. E2E „prawdziwy v1” testuje `repairCurrentRoom`, nie przebudowę salonu. Kod czyta się poprawnie, ale nic go nie przypina. | Zamrożony `save-v1-legacy-salon.json` i test `decodeSave` z oczekiwanym wierszem. |
| V-5 | `tests/saveFile.test.ts` | coverage-gap | low | Import testowany tylko na `save-v2.json` (`living`). Brak importu pliku ze starym salonem i `saveSummary` po przebudowie. | Przypadek `parseImport` z `save-v2-legacy-salon.json`. |
| V-6 | `src/core/autosave.ts` `attempt` (porzucona kopia + nieudany zapis) | noise | low | Jedna próba liczy się jako dwie porażki („wcześniejsze porażki” w „Zapis gry”). `autosave: backup failed` jest logowane dwa razy. | Jedna porażka na próbę, osobna linia „kopia porzucona”. |
| V-7 | `src/core/autosave.ts` `attempt` (`backupOwed` po porzuceniu) | config | low | Po wyczerpaniu 3 prób kopii i nieudanym zapisie każda następna próba znów robi kopię. Przy wiszącym magazynie każdy zapis czeka 2 × 5 s. | Po porzuceniu `skipped` niezależnie od wyniku zapisu. |
| V-8 | `src/core/saveHealth.ts` `migrationOf`; `src/main.ts` `start` (`Save migrated from v2`) | missing-context | low | Linia „Stara kopia została” jest tylko w sesji, która zapisała v3, i nie mówi, czy salon był przebudowany. `Migration` zwraca samą wartość, więc tego faktu nie da się wynieść z `decodeSave`. To warunek wstępny znanego M-4. | Kanał boczny (np. `notes` w wyniku `decodeSave`) przy realizacji M-4. |
| P-1 | `src/core/autosave.ts` `arm`/`attempt` (zapis `migration` przy starcie) | logged-not-captured | medium | Nieudany pierwszy zapis v3 to tylko `console.error`, bez ponowienia aż do zmiany lub ukrycia strony. Dziecko gra na niezapisanym v3. **Znane F8** (zaakceptowane), potwierdzone. | Ponowić po nieudanym `migration`; linia „przenoszenie w toku” w `migrationOf`. |
| P-2 | `src/core/saveHealth.ts` `migrationOf`; `AutosaveStatus.migrationWrittenAt` | missing-context | low | Rodzic nie widzi migracji w toku ani nieudanej. Nowe pole jest martwe poza testami. | Linia v{from}→v3 w toku/nieudana. |
| P-5 | `src/core/autosave.ts` (brak ponownego odczytu wersji przed zapisem); `vite/config.shared.mjs` (`skipWaiting`, `clientsClaim`) | identity-lost | medium | Karta lub PWA ze starym JS v2 dalej zapisuje v2 na zapis v3 z nowej karty. Postęp z nowej karty znika. Przy następnym starcie migracja powtarza się i `backup-v2` dostaje cofnięte bajty (P-8). Nikt nic nie widzi. **Rozszerza znany follow-up „dwie karty”** o ścieżkę aktualizacji SW. | Przed zapisem porównać wersję w magazynie i zablokować zapis przy nowszej (`blockedBy: 'future'`) albo `BroadcastChannel`. |
| P-7 | `src/main.ts` `start` (karta `future`), `src/data/pl.ts` `saveFuture` | missing-context | low | „Kod: future” nie mówi, jaką wersję ma zapis i jaką czyta build. | `detail`: „zapis v3, ten build czyta do v2”. |
| P-8 | `src/storage/idb.ts` (klucz `backup-v<from>` nadpisywany) | identity-lost | low | Powtórna migracja (po P-5) nadpisuje pierwszą kopię. | Kopia „zapisz raz” na klucz albo z datą. |

### Ładowanie grafiki (limit czasu, zastępnik, „Obrazki”, ekran ładowania)

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| A-1 | `src/data/balance.ts` `loader`; `node_modules/phaser/src/core/Config.js` `loaderMaxParallelDownloads` (6 na Androidzie); `src/scenes/BootScene.ts` `preload` (ok. 65 plików) | coverage-gap | **high** | Limit jest na plik, nie na całość. Serwer, który przyjmuje połączenia i milczy (pierwszy start przed precache, przeciążony VPS, portal Wi-Fi), daje na Androidzie ok. 11 fal × 24 s ≈ 4,4 min zamrożonego paska. Na iPadzie to ok. 72 s. Bez sygnału dla nikogo. `loaderBalance` test ogranicza tylko jeden plik. | Budżet całego `preload` (timer, który przechodzi do `create()` z tym, co jest) albo wyższe `maxParallelDownloads`; test czasu całkowitego. |
| A-2 | `src/ui/widgets/LoadingScreen.ts` (tylko `progress`) | coverage-gap | medium | Postęp rośnie tylko przy zakończeniu pliku. Przy zawieszeniu pasek stoi (ok. 98% przy jednym pliku, skokami przy falach) bez „jeszcze chwilę”. Rodzic nie odróżni wolnego ładowania od zawieszenia i może zabić aplikację, co powtarza problem. | Czysta reguła „wolno” po X s z tekstem w `pl.ts`, jak `saveSlow`. |
| A-3 | `src/scenes/BootScene.ts` `preload` (listener `loaderror`) | flattened-response | medium | Timeout (po cichym ponowieniu) i HTTP 4xx/5xx (bez ponowienia) dają tę samą linię „Task art failed to load: key”, bez `file.src` i `xhrLoader.status`. | Logować URL, status, rodzaj (timeout/http/sieć) i użyte ponowienie (razem z L-3). |
| A-4 | Phaser `ImageFile.onProcess` / `File.onProcessError` (brak `loaderror` przy dekodowaniu) | identity-lost | medium | Uszkodzony lub ucięty WebP (albo 200 z innym ciałem) zostawia tylko `console.error` Phasera „Failed to process file: image "key"” bez URL. Konsola ma dwa formaty zależnie od przyczyny. | Porównać klucze po `COMPLETE` i wypisać jedną linię aplikacji z przyczyną `decode`. |
| A-5 | `src/core/artHealth.ts` `artHealth`, `src/ui/dom/artHealthView.ts` `createArtHealthView` | flattened-response | medium | „Obrazki” liczy tylko braki. Rodzic nie odróżni „wolna sieć przy pierwszym starcie” (samo się naprawi po precache) od „wdrożenie zgubiło pliki” (trwałe) i od uszkodzenia. | Przyczyna na klucz w rekordzie runtime, główna przyczyna + `Kod:` jak w „Zapis gry”. |
| A-6 | Phaser `XHRLoader` (`xhr.timeout` = cały transfer) + `balance.loader.timeoutMs` | config | medium | Plik 289 KB pada przy łączu < ok. 24 KB/s. Ponowienie zaczyna od zera, więc na wolnym, ale działającym łączu pada dwa razy i obrazek jest „brakujący” całą sesję mimo zdrowego serwera. | Limit skalowany rozmiarem pliku albo limit bezczynności (na `progress`). |
| A-7 | `src/scenes/BootScene.ts` `preload` (gałąź `Task font failed to load`); Phaser `FontFile` (`FILE_POPULATED`, `.catch` → `console.warn('Font failed to load')` → `onProcessComplete`) | missing-throw | medium | Odrzucony `FontFace.load()` kończy plik jako COMPLETE, więc app-linia o czcionce jest martwa. Font zastępczy widać tylko w konsoli Phasera. Brak limitu czasu to **znany follow-up**; martwa gałąź i brak linii dla rodzica są nowe. | `document.fonts.check(...)` w `create()`, wynik do rekordu zdrowia i „Obrazki”; usunąć martwą gałąź. |
| A-8 | Phaser `File.onError` (ciche ponowienie) | logged-not-captured | low | Pierwsza próba z timeoutem i udane ponowienie nie zostawiają śladu. Niestabilna sieć wygląda zdrowo. | Licznik ponowień w rekordzie runtime. |
| A-9 | `tests/e2e/salon-load-health.spec.ts` „#15 H-2” (`maxRetries: 0`, tylko pokój) | coverage-gap | medium | Bez testu: ponowienie ze skopiowanym limitem, zawieszony plik zadania (ścieżka `artFilter`), linia konsoli, ekran ładowania w trakcie, ścieżka SW. Wartości produkcyjne sprawdzane tylko jako liczby. Listener `ADD` ma tylko ten jeden strażnik (znane). | Seam z 1 ponowieniem i asercją liczby prób; przypadek pliku zadania; asercja `artHealth` i tekstu konsoli. |
| A-10 | `src/scenes/BootScene.ts` `preload` (`try/catch` w `progress`) | noise | low | Pasek, który nie umie się narysować, loguje przy każdym zdarzeniu postępu. | Ostrzeżenie raz na scenę. |
| A-11 | `src/scenes/BootScene.ts` `create` | missing-context | low | Podsumowanie braków nie ma czasu ładowania ani `totalFailed`. Czterominutowy start nie zostawia śladu po starcie gry. | Delta `performance.now()` od `preload` do `create()` w rekordzie zdrowia. |

### Platforma / instalacja

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| P-3 | `src/scenes/BootScene.ts` `preload` (listener `Loader.Events.ADD` bez `try/catch`) | coverage-gap | low | Wyjątek w listenerze (np. inny kształt `xhrSettings` po aktualizacji Phasera) idzie do granicy: karta „Ups!” i `block('fatal')` za problem z grafiką, który nie powinien być fatalny. Sąsiedni `progress` ma osłonę. | Owinąć jak `progress`, `console.warn` raz. |
| P-4 | `deploy/martynka-deploy` `do_rollback`; `scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts` | config | medium | Rollback poniżej v3 nie ma strażnika, a urządzenia z v3 dostają kartę `future` (notka w `deploy/README.md`, M-S1 rozszerzone). Smoke nie sprawdza `assets/**/*.webp` w precache, więc build bez grafiki pokoju przejdzie (znane M-6). | `SAVE_VERSION` w manifeście buildu, ostrzeżenie przy rollbacku na niższą; liczba wpisów grafiki w precache. |
| P-6 | `src/pwa/registerServiceWorker.ts` (`.catch(() => undefined)`) | swallowed | low | Nieudana rejestracja SW jest niewidoczna: gra zostaje tylko online, bez offline. Znane w M-6. | `console.warn` z nazwą błędu. |

## 6. Rekomendowana kolejność poprawek

1. **Budżet całego ładowania + linia „wolno” na ekranie ładowania** (A-1, A-2, A-11; częściowo A-7). Jeden timer w `BootScene` z liczbą w `balance.ts` i tekstem w `pl.ts`, plus czysta reguła w `core` (test najpierw). Największa ślepota usunięta najmniejszym kosztem; wzór już istnieje w `saveSlow`.
2. **Przyczyna na klucz w zdrowiu grafiki** (A-3, A-4, A-5, A-8, L-3 z follow-upów). Rekord runtime `{key, kind, status, url, retries}`, jedna linia konsoli aplikacji na klucz, główna przyczyna i `Kod:` w „Obrazki”. Bez wysyłania czegokolwiek z urządzenia.
3. **Strażnik wersji przy zapisie** (P-5, P-8; follow-up „dwie karty”). Przed zapisem odczyt `version` z magazynu (tani `get` w tej samej transakcji albo `BroadcastChannel`) i `blockedBy: 'future'` zamiast nadpisania. Ograniczenie: nie wolno zablokować zapisu przy zwykłym zapisie tej samej wersji.
4. **Pole i krok w `unreadable`** (V-1, V-2, P-7). `importProblem(raw)` i `step`/`errorName` do `LoadOutcome`, na kartę i do warn; wersje w `future`.
5. **Fixture v1 ze starym salonem + import legacy** (V-4, V-5). Tylko testy; zamrożone fixture'y v1/v2 zostają bajt w bajt.
6. **Ponowienie zapisu `migration` i linia „w toku”** (P-1, P-2, V-6, V-7). Zgodnie z triggerem F8.
7. **Strażnik rollbacku i precache grafiki w smoke** (P-4, M-6). Dotyka `deploy/` i `scripts/` (osobna decyzja opiekuna).
8. Drobne: P-3, P-6, A-10, V-3, V-8 (razem z M-4).

## 7. Zmiany od ostatniego audytu

Porównanie z audytem 2026-10-15 20:10 (PR #63, niezmergowany; obszary pokrywają się) oraz z raportem 2026-10-13 17:51 (ostatni na `main`).

| Poprzednie id | Status | Dowód |
|---|---|---|
| H-1 (remap poza łańcuchem migracji) | **fixed** | `src/core/save.ts` `MIGRATIONS[2]` = `LIFT_V2_SALON`, `SAVE_VERSION` 3; `remapLegacySalon` usunięty ze `src/`; tabele zamrożone w `src/core/migrations/legacySalon.ts` i przypięte testami; starsze buildy odczytują v3 jako `future` (`826150c^`, `b0ad4ba^`). |
| H-2 (brak limitu ładowania) | **changed (częściowo)** | Per plik: `balance.loader` + listener `ADD` w `BootScene.preload` (f4415a5), e2e #15. Otwarte: brak budżetu całości (A-1), czcionka bez limitu (follow-up), brak sygnału „wolno” (A-2). |
| M-1 (brak kopii starego salonu) | **fixed** | `backup-v2` przed pierwszym zapisem v3 (`createAutosaver`, `src/storage/idb.ts`). Odczyt kopii z gry to follow-up SV2-04. |
| M-2 (znacznik „dowolny nieznany klucz”) | **fixed** | `OLD_ONLY_KEYS` w `legacySalon.ts`; nieznane klucze zachowane (poprawka 4fb1a5b). |
| M-3 (stan przeliczony nieoznaczony do zapisu) | **fixed, resztka F8** | Zapis `migration` przy starcie (`createAutosaver` `arm`); po nieudanej kopii brak ponowienia (P-1). |
| M-4 (warn tylko ze starą liczbą) | still open (follow-up) | `Save migrated from v<N>`; V-8 pokazuje, że wymaga poszerzenia `DecodeResult`. |
| M-5, M-6, L-3..L-8, L-5r | still open (follow-upy z triggerami) | Bez zmian w kodzie; M-6 i L-3 potwierdzone przez P-4/P-6 i A-3. |
| L-1, L-2 (fixture'y bez kształtu salonu) | changed | Dodano `save-v2-legacy-salon.json` (L-1/L-2 dla v2 zamknięte); dla v1 dalej otwarte (V-4). |
| M-S1 (rollback nie zna wersji) | still open, złagodzone | Notka w `deploy/README.md`; automatycznego strażnika brak (P-4). |
| N-7, N-8, M-S2, M-S3, C-2r | not re-checked | Poza obszarem. |

## 8. Metoda i ograniczenia

- **Agenci:** trzech audytorów tylko do odczytu, uruchomionych równolegle: zapis v3, ładowanie grafiki oraz wspólna infrastruktura (zmiany `7f831c5..e369b19`).
- **Sprawdzone ręcznie:**
  - Phaser 4.2.1 `Config.js` L534 (`maxParallelDownloads`: 6 na Androidzie, 32 gdzie indziej).
  - `FontFile.js` L84 (`FILE_POPULATED`) i L127 (`.catch` → `console.warn` → `onProcessComplete`), czyli app-linia o czcionce jest martwa.
  - `src/core/save.ts` `decodeSave` (`catch {}` bez nazwy błędu).
  - `tests/fixtures/` (wszystkie v1 mają `currentRoom: "living"`, tylko `save-v2-legacy-salon.json` ma `salon`).
  - Listener `ADD` w `BootScene.preload` bez `try/catch`.
- **Dowód w czasie działania:** nie uruchomiony (krok statyczny, profil § 11). E2E runu (101 passed, `salon-load-health.spec` 3/3, łamania p5a–c czerwone) jest cytowany z dziennika runu, nie powtarzany.
- **Czego nie da się udowodnić statycznie:**
  - Rzeczywisty czas A-1 na Androidzie. Zależy od limitu połączeń przeglądarki i multipleksowania HTTP/2 przez Caddy.
  - Czy dekodowanie obrazka z blob URL może zawisnąć bez `onload`/`onerror` (WebKit/iPadOS).
  - Wpływ wiszącego `fetch` SW na `xhr.timeout`.
  - Czy wisząca kopia IDB blokuje następny zapis w tej samej bazie (seam e2e jest w pamięci).
  - Kolejność `preBoot` i pierwszego zapisu `migration` w Phaserze 4. Odczyt kodu sugeruje, że rejestr jest gotowy, bo `start` czeka na DOM przed `createGame`.
  - Karta `future` na prawdziwym starszym buildzie. To rozumowanie z kodu `826150c^`; e2e na dwóch buildach to follow-up.
  - Eksmisja i limit miejsca WebKit dla dodatkowego klucza `backup-v*`.
- **Przegląd repo** (`src/` bez `src/testing`):
  - 23 bloki `catch` (było 19), 0 pustych;
  - 18 wywołań `console.error/warn` (było 10);
  - 2 domyślne `.catch(() => undefined)` (`registerServiceWorker.ts`, `installHint.ts`).
  - PR #65 nie zmienił tych liczb.
