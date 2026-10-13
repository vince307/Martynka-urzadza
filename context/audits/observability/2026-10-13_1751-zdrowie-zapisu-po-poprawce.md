---
type: observability-audit
date: 2026-10-13 17:51
mode: audit
commit: d13d9a3
branch: docs/observability-audit-2026-10-13-fix-save-observability
dirty_tree: false
areas: [save-load-timeout-unavailable-card, autosaver-status-parent-save-section, unknown-room-repair-at-load]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md
findings: { critical: 0, high: 0, medium: 6, low: 8 }
---

# Audyt obserwowalności: zdrowie zapisu po poprawce audytu (2026-10-13)

Ten raport zamyka run `2026-10-13-fix-save-observability`: jeden slice `fix:save-observability-c1-c2` (PR #36, merge `d13d9a3`, wdrożenie 38424548530). Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- wczytanie z limitem czasu i karta niedostępnego zapisu (`loadSave` z `limit`, `main.ts` `start`, `mountSaveFailedCard` z `pl.saveUnavailable`);
- status autosavera (`blockedBy`, `lastError`, `consecutiveFailures`, `lastWriteAt`) i sekcja „Zapis gry” w panelu rodzica (`saveHealthView`, `createSaveHealthView`, `UIScene.openSettings`);
- naprawa nieznanego pokoju przy wczytaniu (`repairCurrentRoom`, `RoomScene.resolve`).

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po tym, co widzą dziecko, karty DOM, panel rodzica (za bramką) i konsola (bez map źródeł). Punktem odniesienia jest raport 15:14.

## 1. TL;DR

- **0 CRITICAL.** Oba krytyczne ustalenia z 15:14 mają teraz sygnał na urządzeniu: `unavailable` niesie nazwę błędu, `console.warn` i kartę przed grą (C-1), a trwałe porażki zapisu widać w sekcji „Zapis gry” w panelu rodzica (C-2). Każdy przypadek ma e2e na prawdziwym bundlu hooka (`?e2eSave=unavailable|hang|writefail`).
- **Zamknięte:** C-1, M-S4, M-S5, M-R6, H-R3, L-R10. **Częściowo:** C-2 (zostaje: sygnał tylko po otwarciu panelu i brak ścieżki pola przy `InvalidSave`), M-R5 (test danych po wszystkich `ROOMS`, scena nadal cicha). **Otwarte bez zmian:** M-S1, M-S2, M-S3, M-R4, L-S1, L-S2, L-S3, L-R8, L-R9, L-R11.
- **Nowa przyczyna: jeden wynik `unavailable` dla dwóch różnych awarii.** Odczyt odrzucony i odczyt wolniejszy niż `balance.save.loadTimeoutMs` (5000 ms, wartość nie zmierzona na tablecie) dają tę samą kartę i tę samą linię dla rodzica: „przeglądarka nie udostępniła zapisu”. Wolny, ale zdrowy magazyn kosztuje całą sesję bez zapisu i fałszywą wskazówkę dla rodzica (N-7). Karta nie ma „Spróbuj ponownie”.
- **Panel pokazuje stan, nie historię.** „Działa” pojawia się także przed pierwszym udanym zapisem, porażki znikają po jednym sukcesie, a `lastError` nie dociera do rodzica (N-8). Akceptowalne dla dziecięcej gry, ale ogranicza diagnozę „zapomniało wszystko”.

## 2. Model przechwytywania (zmiany względem raportu 15:14)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci.
- **Start (`src/main.ts` `start`):**
  1. `createIdbSaveStore()` (lub magazyn e2e przy `?e2eSave=`, tylko build hooka, marker `e2eSave` w `vite/e2eHookGuard.mjs`);
  2. `await loadSave(store, { timers, timeoutMs: balance.save.loadTimeoutMs })`;
  3. `unavailable` → `console.warn("Save unavailable (<name>)…")`;
  4. `unreadable` lub `unavailable` → `mountSaveFailedCard` (dla `unavailable` z `pl.saveUnavailable`, bez eksportu) i czekanie na „Graj dalej”;
  5. `booted.failed` → koniec;
  6. `loaded` → `floorToCalendar`, potem `repairCurrentRoom(…, Object.keys(ROOMS), FIRST_ROOM)` i `console.warn` przy naprawie;
  7. `createAutosaver({ blockedBy, loadError, now, log: console.error, … })`.
- **`loadSave` (`src/core/autosave.ts`):** wyścig odczytu z timerem. Porzucony odczyt dostaje `.catch(() => undefined)`, późny sukces jest odrzucany i nigdy nie zapisany. Wyjątek → `{ kind: 'unavailable', error: errorName(e) }` (tylko `name`, nigdy treść ani stos). Timeout ma nazwę `timeout`.
- **`createAutosaver`:** `AutosaveStatus` ma `blockedBy` (pierwszy powód wygrywa: `blockedBy ??= reason`), `consecutiveFailures` (zerowane po udanym zapisie), `lastError` (nazwa, zostaje po sukcesie), `lastWriteAt`. `attempt` loguje cały obiekt błędu przez `console.error`. Niewalidujący stan rzuca `InvalidSave` bez wskazania pola.
- **Czytelnicy `status()`:** `UIScene.openSettings` (migawka przy otwarciu panelu, `saveHealthView`) oraz hook e2e. `saveHealthView`: `blockedBy` → `off`, `consecutiveFailures > 0` → `failing`, inaczej `ok` (z godziną `lastWriteAt`, jeśli jest).
- **Panel rodzica:** tylko z HUD `UIScene` (przytrzymanie zębatki 2 s + bramka), czyli gdy istnieje uczeń. Na ekranie powitalnym sekcji nie ma (tam jest tylko panel etapu).
- **Logowanie:** 19 bloków `catch` w `src/` (bez `src/testing`) i 10 wywołań `console.*` (było 18 i 8). Nowe: `console.warn` dla `unavailable` i dla naprawy pokoju, `catch` wokół `onFirstWrite`.
- **Tożsamość wdrożenia:** bez zmian (`__BUILD_ID__`, brak map źródeł). Karty zapisu nadal nie pokazują buildu ani powodu.

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Opiekun / konsola | Werdykt |
|---|---|---|---|---|
| Odczyt IDB rzuca | karta „Gra nie może teraz zapisywać postępów”, „Graj dalej” | ta sama karta; w panelu „Zapis jest wyłączony: przeglądarka nie udostępniła zapisu.” | `console.warn` z nazwą (np. `UnknownError`) | **caught** (e2e „#2 C-1”) |
| Odczyt IDB zawisa | karta po 5 s (zamiast pustej strony) | jak wyżej, ten sam tekst | `console.warn` z `timeout` | caught (e2e „#2 M-S4”), ale **mylący powód** (N-7) |
| Odczyt wolniejszy niż 5 s, zapis zdrowy | karta, sesja bez zapisu | „przeglądarka nie udostępniła” — nieprawda | `timeout` | **misattributed (N-7)** |
| Zapis rzuca trwale (limit, IDB, `InvalidSave`) | gra działa | „Ostatnie próby zapisu się nie udały…” — tylko gdy otworzy panel | `console.error` z obiektem; `InvalidSave` bez pola | caught dla rodzica (e2e „#2 C-2”), **brak sygnału proaktywnego** (C-2r) |
| Przejściowe porażki, potem sukces | nic | „Postępy zapisują się…” — historia porażek znika | `console.error` przy każdej | missed w panelu (N-8), akceptowalne |
| Nieznany `currentRoom` w zapisie | start w salonie z własnym stanem salonu | nic | `console.warn` „Save names an unknown room” | **caught + naprawione** (unit `repairCurrentRoom`) |
| Zapis nieczytelny | karta + eksport | eksport za bramką; powód nie na karcie | `console.warn` z `reason` | caught, M-S3 otwarte |
| Eksmisja WebKit | „pierwsze uruchomienie” | „Postępy zapisują się…” | nic | missed (M-S2) |
| Wyjątek w handlerze | karta „Ups!”, `block('fatal')` | panel niedostępny pod kartą | `console.error` | caught (granica) |

## 4. Systemowe przyczyny źródłowe

1. **Licznik bez wyświetlacza — w większości usunięta.** `AutosaveStatus` ma teraz czytelnika poza e2e (panel rodzica) i kartę dla `unavailable`. Zostaje: sygnał jest pasywny (rodzic musi wejść do panelu) i pokazuje tylko bieżący stan. Wyjaśnia C-2r, N-8, M-S2.
2. **Wyniki odczytu tracą przyczynę — częściowo usunięta.** `unavailable` niesie `name`, ale dla człowieka `timeout` i odrzucenie zlewają się w jeden tekst, a `unreadable` nadal nie pokazuje `reason` ani buildu. Wyjaśnia N-7, M-S3, L-S1.
3. **Walidacja zapisu strukturalna, nie semantyczna — częściowo usunięta.** `repairCurrentRoom` łata najgroźniejszy przypadek (nieznany pokój) bez dotykania innych pokojów i bez zapisu przed odczytem. Postęp jako indeks w `room.tasks` (M-R4) i `InvalidSave` bez ścieżki pola zostają.
4. **Fallbacki w scenie pokoju zamiast błędu — osłonięte testem, nie usunięte.** `RoomScene.resolve` nadal ma `ROOMS[id] ?? ROOMS[FIRST_ROOM]` (teraz spójne ze stanem), `redraw` nadal cicho pomija brak placeholdera. Testy danych iterują wszystkie `ROOMS`, więc dryf danych pada w CI, nie na tablecie.
5. **Rollback nie zna wersji zapisu — bez zmian** (M-S1; `deploy/` poza zakresem runu).

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### Wczytanie z limitem czasu i karta niedostępnego zapisu

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-7 | `src/core/autosave.ts` `loadSave` (timeout → `unavailable` z `error: 'timeout'`) + `src/main.ts` `start` (`copy: … pl.saveUnavailable`) + `src/data/pl.ts` `saveUnavailable.body`, `settings.saveOff.unavailable` + `src/data/balance.ts` `save.loadTimeoutMs` | missing-context | medium | Zimne otwarcie IDB na starszym iPadzie trwa dłużej niż 5 s (wartość z komentarza, nie z pomiaru). Dziecko dostaje kartę, gra całą sesję bez zapisu, choć stary zapis jest zdrowy; następne uruchomienie zwykle go wczyta, więc postęp tej sesji ginie „losowo”. Rodzic czyta „Przeglądarka nie udostępniła zapisu… sprawdź, czy przeglądarka nie blokuje danych stron” i szuka winy w ustawieniach. Rozróżnienie (`timeout` vs `UnknownError`) jest tylko w konsoli. Karta nie ma ponownej próby. | Osobny tekst dla `timeout` („zapis odpowiada zbyt wolno”) i przycisk „Spróbuj ponownie” (ponowny `loadSave`), albo dłuższy limit po pomiarze na urządzeniu. W konsoli czas odczytu. |

Sprawdzone jako dobre: porzucony odczyt jest łapany od razu (brak `unhandledrejection` → brak fałszywej karty „Ups!”), późny sukces nigdy nie jest zapisany, saver zablokowany od startu (`blockedBy: 'unavailable'`), więc nic nie nadpisuje istniejącego zapisu; `errorName` przenosi tylko nazwę; brak eksportu, gdy nie ma czego eksportować; `booted.failed` nadal zatrzymuje start pod kartą błędu.

### Status autosavera i sekcja „Zapis gry”

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| C-2r | `src/core/autosave.ts` `createAutosaver` → `attempt` (`InvalidSave` bez pola) + `src/scenes/UIScene.ts` `openSettings` (jedyny czytelnik poza e2e) | logged-not-captured | medium | Trwała porażka zapisu jest teraz widoczna, ale tylko gdy dorosły sam otworzy panel (przytrzymanie 2 s + bramka) w trakcie tej sesji. Po zamknięciu aplikacji informacja znika. Przy `InvalidSave` ani panel, ani konsola nie mówią, które pole zablokowało każdy zapis. | Delikatny sygnał dla dorosłego po N porażkach z rzędu (np. kropka na zębatce) — decyzja opiekuna (DESIGN-GAP 43). `validateSave` zwraca ścieżkę pierwszego złego pola do `log`. |
| N-8 | `src/core/saveHealth.ts` `saveHealthView` (`ok` gdy `writes === 0`; `failing` tylko przy `consecutiveFailures > 0`) + `src/ui/dom/saveHealthView.ts` `createSaveHealthView` (bez `lastError`, bez `failures`) | missing-context | low | Panel otwarty przed pierwszym zapisem mówi „Postępy zapisują się na tym urządzeniu.”, choć nic jeszcze nie zapisano. Seria porażek zakończona jednym sukcesem znika z panelu (`failures`, `lastError` są w statusie, ale niewyświetlane). Rodzic zgłaszający „zgubiło wczoraj” nie ma czego przekazać. | Stan „jeszcze nie zapisano” przy `writes === 0`; krótka notka „wcześniej N nieudanych prób (<name>)” przy `failures > 0`. |
| M-S2 | `src/storage/idb.ts` `requestPersistence` (`persist()` → `.catch(() => undefined)`, wynik odrzucony) | missing-context | medium | Bez zmian: eksmisja wygląda jak pierwsze uruchomienie, a panel mówi „działa”. Teraz jest gdzie pokazać wynik `persist()`, ale go nie zbieramy. | Zapamiętać wynik `persist()` w statusie i dodać zdanie w sekcji „Zapis gry”. |

Sprawdzone jako dobre: pola zdrowia żyją tylko w statusie runtime, format v1 bez zmian (test „the v1 format did not change” w `tests/save.test.ts`); `blockedBy ??=` zachowuje pierwszy powód; `consecutiveFailures` zerowane po sukcesie; wyjątek w `onFirstWrite` nie liczy się jako porażka zapisu; teksty w `pl.ts`, bez liczb (brak problemu odmiany), bez stosu i bez komunikatu błędu dla dziecka.

### Naprawa nieznanego pokoju przy wczytaniu

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| M-R5r | `src/scenes/RoomScene.ts` `redraw` (`if (placeholder)` bez `else`) i `celebrate` (`if (!at \|\| !size) return`) | missing-throw | low | Dryf danych jest teraz łapany w CI (`tests/roomsData.test.ts` „gives every slot a placeholder”), ale gdyby jednak trafił na tablet, dziecko nadal utknie w pokoju bez przycisków i bez karty. | Rzucić przy otwartym panelu bez placeholdera (karta zamiast pułapki). |
| M-R4 | `src/core/rooms.ts` `currentTask` (`room.tasks[state.tasksDone]`) | identity-lost | medium | Bez zmian: zmiana kolejności zadań w aktualizacji cicho przesuwa postęp. Brak testu zamrażającego kolejność id zadań. | Test zamrażający kolejność `SALON.tasks` (jak fixture zapisu) albo kontrola spójności `chosen` vs `tasksDone` przy wczytaniu, z `console.warn`. |

Sprawdzone jako dobre: `repairCurrentRoom` jest czysty, nie mutuje wejścia, zachowuje stan każdego innego pokoju, dodaje pusty `FIRST_ROOM` tylko gdy go brak, a wynik przechodzi `validateSave` (4 testy w `tests/rooms.test.ts`); naprawa działa tylko na wyniku `loaded`, więc nic nie jest zapisywane przed udanym odczytem; `RoomScene.resolve` bierze pokój i stan z jednego `room.id`; `TaskScene.nextRoomTaskCost` po naprawie widzi spójny `currentRoom`.

### Otwarte z 15:14 bez zmian w kodzie (poza obszarem poprawki)

M-S1 (`deploy/martynka-deploy` `rollback` × `decodeSave` `future`), M-S3 (`mountSaveFailedCard` bez powodu i buildu dla `unreadable`), L-S1 (`decodeSave` `catch` → `corrupt`), L-S2 (`exportRawSave` pobranie bez potwierdzenia), L-S3 (`visibilitychange`: `narrator.cancel()` przed `flush`), L-R8 (`stepPanel` cicha odmowa), L-R9 (`stars.earn`), L-R11 (`celebrate`/`onSleep`). Opisy i kierunki jak w raporcie 15:14; `git diff 4698110 d13d9a3` nie dotyka `deploy/`, `src/core/save.ts`, `src/ui/dom/saveExport.ts`, `src/core/variantPanel.ts`, `src/core/stars.ts`.

## 6. Zalecana kolejność poprawek

1. **N-7:** osobny tekst i „Spróbuj ponownie” dla `timeout`; pomiar czasu zimnego odczytu na docelowym iPadzie przed zmianą `loadTimeoutMs`. Mały koszt, usuwa fałszywą wskazówkę dla rodzica.
2. **N-8 + M-S2:** sekcja „Zapis gry” mówi „jeszcze nie zapisano”, pokazuje liczbę wcześniejszych porażek z nazwą i wynik `persist()`. Wszystko lokalne, bez zmiany formatu zapisu.
3. **C-2r:** ścieżka pola w `InvalidSave` (tani, czysto w `core/`); sygnał proaktywny dla dorosłego tylko po decyzji opiekuna (DESIGN-GAP 43).
4. **M-R4 + M-R5r:** test zamrażający kolejność zadań i rzut zamiast cichego `return` w `redraw` — przed drugim pokojem.
5. **M-S1 + M-S3:** zasada rollbacku w `deploy/README.md`; powód i build na karcie `unreadable` i w pliku eksportu.
6. Drobne: L-S1, L-S2, L-S3, L-R8, L-R9, L-R11.

## 7. Zmiany od ostatniego audytu

| Poprzednie id | Status | Dowód |
|---|---|---|
| C-1 | fixed | `loadSave` zwraca `{ kind: 'unavailable', error: errorName(e) }`; `start` loguje `console.warn` i montuje kartę `pl.saveUnavailable`; panel `saveOff.unavailable`. e2e „#2 C-1” (`?e2eSave=unavailable`, `lastError: 'UnknownError'`, `writes: 0`). Reszta: N-7. |
| C-2 | changed (częściowo zamknięte, critical → medium C-2r) | `AutosaveStatus.consecutiveFailures/lastError/lastWriteAt`, `saveHealthView` → `failing`, e2e „#2 C-2” (`?e2eSave=writefail`, `QuotaExceededError`). Zostaje pasywność sygnału i `InvalidSave` bez pola. |
| M-S4 | fixed | Wyścig z `limit.timeoutMs` (`balance.save.loadTimeoutMs` = 5000), e2e „#2 M-S4” (`?e2eSave=hang`, `lastError: 'timeout'`). Nowa reszta: N-7 (mylący tekst, wartość niezmierzona). |
| M-S5 | fixed | `blockedBy: BlockReason \| null` w statusie, `block` zachowuje pierwszy powód; panel rozróżnia `unreadable`/`unavailable`/`fatal`. |
| M-R6 | fixed | Ten sam mechanizm co C-2: porażka `flush('now')` po zakupie podbija `consecutiveFailures` i jest widoczna w panelu. |
| H-R3 | fixed | `repairCurrentRoom` przy wczytaniu + `console.warn`; `RoomScene.resolve` z jednego id. Testy jednostkowe; brak e2e (brak szwu z nieznanym pokojem — świadomie, unit wystarcza). `validateSave` nadal sprawdza tylko `currentRoom ∈ rooms`. |
| M-R5 | changed (częściowo) | `tests/roomsData.test.ts` „every room in ROOMS” (placeholdery, tekst, koszty). Scena nadal cicha → M-R5r (low). |
| L-R10 | fixed | Test „has child-facing text for every slot and task (L-R10)”; fallback `?? key` zostaje, ale dryf pada w CI. |
| M-R4 | still open | `currentTask` bez zmian, brak testu kolejności. |
| M-S1, M-S2, M-S3 | still open | Pliki bez zmian (`deploy/`, `idb.ts` `requestPersistence`, `saveFailedCard` dla `unreadable` bez powodu). |
| L-S1, L-S2, L-S3, L-R8, L-R9, L-R11 | still open | Pliki/symbole bez zmian w tym runie. |
| N-1, N-3, N-4, M-9, H-9 | still open | `main.ts`: kolejność `createNarrator` → `installErrorBoundary` bez zmian; `onFatal` nadal bez `narrator.cancel()`; karta błędu i karty zapisu bez powodu; brak map źródeł; smoke nie uruchamia JS. Wąski aspekt N-1 „zawieszony odczyt = pusta strona” zamknięty przez M-S4. |
| N-2, N-5, N-6, H-3, H-4, H-7r, L-12 | not re-checked | Poza obszarem; `src/ui/narrator.ts` bez zmian w runie. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** jeden (ten krok), bez subagentów: powierzchnia poprawki to 14 plików `src/` (`git diff --stat 4698110 d13d9a3`), czytanych w całości lub przez diff.
- **Przeczytane:** `src/core/autosave.ts`, `src/core/saveHealth.ts`, `src/main.ts`, `src/ui/dom/saveHealthView.ts`, `src/ui/dom/saveFailedCard.ts`, diffy `settingsPanel.ts`, `UIScene.ts`, `rooms.ts`, `RoomScene.ts`, `pl.ts`, `balance.ts`, `e2eHook.ts`, `docs/design-gaps.md` (wiersze 43, 45), `tests/roomsData.test.ts` (diff), `tests/e2e/save-restart.spec.ts` (testy C-1, M-S4, C-2), `TaskScene.nextRoomTaskCost`, `idb.ts` `requestPersistence`.
- **Sprawdzone ręcznie:** `loadSave` łapie porzucony odczyt (`read.catch`); `block` używa `??=`; `saveHealthView` zwraca `ok` niezależnie od `writes`; `createSaveHealthView` nie renderuje `lastError` ani `failures`; `repairCurrentRoom` wywołany tylko dla `loaded`; marker `e2eSave` w `E2E_HOOK_MARKERS`.
- **Uruchomione:** `npx vitest run tests/autosave.test.ts tests/saveHealth.test.ts tests/rooms.test.ts tests/roomsData.test.ts tests/save.test.ts tests/e2eSave.test.ts` → 6 plików, 105 testów zielonych. E2E i build nie były uruchamiane w tym kroku; dowody e2e z logu runu (baseline `e2e OK 33 passed` na `d13d9a3`).
- **Przegląd repo:** 19 bloków `catch` w `src/` bez `src/testing`, 10 wywołań `console.*`.
- **Nieudowodnione w czasie działania:** realny czas zimnego otwarcia IDB na docelowym iPadzie (czy 5000 ms wystarcza — sedno N-7); zachowanie prawdziwego WebKit w trybie prywatnym i po WebKit 197050 (e2e używa magazynu w pamięci rzucającego `DOMException`, nie IndexedDB); realne `QuotaExceededError`; czy rodzic faktycznie zagląda do panelu; wygląd sekcji „Zapis gry” i karty na tablecie (bramka wizualna runu: PASS, nie powtarzana); naprawa pokoju na prawdziwym zapisie (dziś jest jeden pokój, więc ścieżka jest latentna).
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania; `area_source: arguments`.
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`), `runtime_proof: not-run`. Zmieniłoby to: zgoda na `--runtime` albo dostęp do iPada.
- **Fan-out:** brak subagentów (domyślnie skill rozdziela audyt, ale powierzchnia to jeden slice o 14 plikach i bezpośrednie porównanie z 15:14). Ryzyko: węższe pokrycie infrastruktury poza obszarem, stąd „not re-checked” w § 7.
- **Wagi:**
  - C-2 obniżone do medium (C-2r): realistyczna trwała porażka jest teraz widoczna dla dorosłego w miejscu, gdzie zagląda po postęp; zostaje pasywność. Wróciłoby do high, gdyby opiekun uznał, że rodzice do panelu nie zaglądają.
  - N-7 medium, nie high: zapis nie jest nadpisywany, strata ogranicza się do jednej sesji, a powód jest w konsoli. Wzrósłby do high, gdyby pomiar na iPadzie pokazał zimne odczyty bliskie 5 s.
  - Ustalenia otwarte bez zmian w kodzie zachowują wagi z 15:14 i są liczone we frontmatterze tylko, gdy dotyczą obszarów zapisu i pokoju (M-S1, M-S2, M-S3, M-R4, L-S1, L-S2, L-S3, L-R8, L-R9, L-R11 i M-R5r); N-1, N-3, N-4, M-9, H-9 są tylko w § 7.
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy; wszystkie kierunki poprawek zostają na urządzeniu.
