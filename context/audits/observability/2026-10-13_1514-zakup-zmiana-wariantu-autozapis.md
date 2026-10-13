---
type: observability-audit
date: 2026-10-13 15:14
mode: audit
commit: 6617da3
branch: docs/observability-audit-2026-10-13-s09-s11
dirty_tree: false
areas: [s09-furniture-purchase, s10-variant-change-room-done, s11-autosave-versioned-save]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_0924-granica-bledow-sesje-wejscia-brak-glosu.md
findings: { critical: 2, high: 1, medium: 7, low: 8 }
---

# Audyt obserwowalności: zakup mebla, zmiana wariantu, autozapis (2026-10-13)

Ten raport zamyka run `2026-10-13-s09-s11`: S-09 (PR #31, `36ead3c`), S-10 (PR #32, `f67b9f4`) i S-11 (PR #33, `6617da3`). Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- S-09: zakup mebla za gwiazdki (saldo w rejestrze, `RoomScene`/`VariantPanel`, `stepPanel`, zakup i animacja).
- S-10: zmiana wariantu przytrzymaniem i „Pokój gotowy!” (`roomGesture`/strefa przytrzymania, tryb zmiany, `RoomDoneCard`).
- S-11: autozapis i wersjonowany zapis (start z wczytaniem, autosave z debounce, zapis przy `hidden`/`pagehide` i `now`, `idb.ts`, karta nieczytelnego zapisu i eksport, granica błędów a zapis).

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy więc po tym, co widzą dziecko, karta błędu, konsola (bez map źródeł), stan zapisu oraz co rodzic mógłby przekazać opiekunowi.

## 1. TL;DR

- **Kod pokoju (S-09, S-10) jest szczelny dla stanu.** Każdy zapis pokoju i salda idzie przez `registry.set` z nowym obiektem, a Phaser `DataManager.setValue` emituje `changedata` przy każdym `set`. Zakup ma kolejność: pokój, saldo, `flush('now')`. Po wyjątku `saver.block('fatal')` nie zapisze połowy zakupu. W ścieżce pokoju nie ma żadnego `try/catch`, więc każdy wyjątek trafia do granicy błędów i dziecko widzi kartę.
- **Przyczyna 1: zdrowie zapisu nie ma powierzchni na urządzeniu.** `createAutosaver` liczy `writes`, `failures`, `skipped`, `blocked` i `load`, ale `status()` czyta tylko hook e2e, którego nie ma w `dist/`. Sesja grana bez zapisu w ogóle (C-1) albo z trwale nieudanymi zapisami (C-2) wygląda dla dziecka, rodzica i opiekuna jak zwykła gra. Utrata postępu wychodzi na jaw dopiero przy następnym zimnym starcie i nie da się wtedy ustalić przyczyny. DESIGN-GAP 43 („nic nie pokazujemy”) świadomie zostawia tę lukę.
- **Przyczyna 2: start z zapisem połyka przyczynę.** `loadSave` zamienia każdy wyjątek odczytu w `{ kind: 'unavailable' }` bez nazwy błędu i bez logu. `main.ts` loguje tylko `unreadable`. Odczyt, który zawisa, daje pusty ekran bez karty (M-S4).
- **Przyczyna 3: wyszukiwania z fallbackiem zamiast błędu.** Dotyczy to `ROOMS[id] ?? ROOMS[FIRST_ROOM]`, `SALON_PLACEHOLDERS[slot]` z cichym `return` oraz `roomText.* ?? key`. Każde jest lokalnie bezpieczne, ale razem zamieniają dryf danych lub zapisu w zły ekran bez śladu (H-R3, M-R5).
- 2 ustalenia CRITICAL (C-1, C-2), oba w S-11. Ustalenia N-1…N-6, H-3 i H-4 z raportu 09:24 nie były w obszarze tego audytu (§ 7).

## 2. Model przechwytywania (zmiany względem raportu 09:24)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci (PRD).
- **Kolejność startu (`src/main.ts`):**
  1. importy;
  2. `createNarrator`;
  3. `installErrorBoundary` (`onFatal`);
  4. `void start()`.
- **Co robi `start`:**
  1. `createIdbSaveStore()`;
  2. `await loadSave(store)`;
  3. przy `unreadable`: `mountSaveFailedCard` i czekanie na „Graj dalej”;
  4. sprawdzenie `booted.failed`;
  5. `createGame`;
  6. `createAutosaver` i `registry.set(saver)`;
  7. słuchacze `changedata`/`setdata` → `markDirty`;
  8. `visibilitychange` (`hidden`) i `pagehide` → `flush('hidden')`.

  Odrzucenie `start` trafia do granicy jako `unhandledrejection`, więc pojawia się karta.
- **`onFatal` (nowy krok):** `attempt(() => booted.saver?.block('fatal'))`. Stan z chwili wyjątku nie jest zapisywany, a debounce jest anulowany. `block` ignoruje argument `reason`.
- **Zapis (`src/core/autosave.ts` `createAutosaver`):**
  - debounce `balance.save.debounceMs`;
  - `flush('now')` po zakupie (`RoomScene.dispatch`) i po końcu rundy (`TaskScene.finishRound`);
  - `attempt`: `encodeSave` → `validateSave` → `store.write`; błąd daje `failures++`, `dirty = true` i `log('autosave: write failed', e)`, czyli `console.error`;
  - ponowna próba dopiero przy kolejnym `markDirty` lub `flush`.
- **Odczyt (`loadSave`):** cztery wyniki:
  - `fresh`: `undefined` w IDB;
  - `loaded`;
  - `unreadable` (`corrupt`/`future`/`unknown-version`): karta, surowa kopia do eksportu, saver zablokowany;
  - `unavailable`: wyjątek odczytu bez szczegółów, saver zablokowany, **bez karty i bez logu**.
- **IndexedDB (`src/storage/idb.ts`):** jeden klucz `profile:default`, jedno ponowne połączenie przy `InvalidStateError`/`UnknownError` (WebKit 197050). `requestPersistence` ignoruje wynik `persist()`.
- **Karta nieczytelnego zapisu (`src/ui/dom/saveFailedCard.ts`):** DOM przed grą. Eksport idzie za bramką rodzica (`exportRawSave`: najpierw arkusz udostępniania, potem pobranie; błędy trafiają do `console.error`). Powód (`reason`) jest tylko w `console.warn`, nie na karcie.
- **Logowanie:** 18 bloków `catch` w `src/` (bez `src/testing`) i 8 wywołań `console.*`. Nowe od 09:24: `main.ts` warn `Save unreadable`, `log` autosave i dwa `console.error` w `saveExport.ts`.
- **Tożsamość wdrożenia:** bez zmian (`__BUILD_ID__`, brak map źródeł, M-9 otwarte). Zapis nie przechowuje identyfikatora builda, który go napisał.

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Opiekun | Werdykt |
|---|---|---|---|---|
| Wyjątek w handlerze pokoju (zakup, gest, karta) | karta „Ups!”, zapis zablokowany | karta z `Wersja <sha>` | `console.error` | caught (granica) |
| Zapis nieczytelny (`corrupt`/`future`) | karta „Nie udało się wczytać zapisu”, gra bez zapisu | „Zachowaj kopię” (surowy JSON) | `console.warn` z `reason` | caught, e2e `save-restart.spec.ts` „#2 FR-021” |
| Odczyt IDB rzuca (`unavailable`) | ekran powitalny jak przy pierwszym uruchomieniu, cała sesja bez zapisu | nic | nic (błąd odrzucony) | **missed (C-1)** |
| Odczyt IDB zawisa | pusta strona | nic | nic | **missed (M-S4)** |
| Zapis rzuca (limit, utrata połączenia, `validateSave` = false) | gra działa, zakup widoczny | nic | `console.error` na tablecie | **missed w praktyce (C-2)** |
| Eksmisja magazynu przez WebKit (7 dni poza ekranem głównym) | „pierwsze uruchomienie” | nic | nic; wynik `persist()` odrzucony | missed (M-S2) |
| `currentRoom` nieznany w danych (rollback po dodaniu pokoju) | widać salon z cudzym stanem, salon nadpisany | nic | nic | **missed (H-R3)** |
| Slot bez placeholdera w danych pokoju | pokój bez przycisków, wyjście tylko przez przeładowanie | nic | nic | missed (M-R5) |
| Odmowa zakupu (`short`, `bad-variant`, `no-task`) | „Wybieram” nic nie robi | nic | nic | missed, dziś nieosiągalne (L-R8) |

## 4. Systemowe przyczyny źródłowe

1. **Licznik bez wyświetlacza.** `AutosaveStatus` istnieje i jest dobrze zaprojektowany, ale poza buildem e2e nikt go nie czyta. DESIGN-GAP 43 przenosi to na kit, ale wybór „nic nie pokazujemy” obejmuje też awarię. Wyjaśnia C-1, C-2, M-S2 i M-S5.
2. **Wyniki odczytu tracą przyczynę.** `loadSave` ma `catch {}` bez wiązania, a `decodeSave` ma `catch` → `corrupt`. `unreadable` i `unavailable` nie niosą nazwy błędu ani ścieżki pola, które nie przeszło walidacji. Wyjaśnia C-1, M-S3 i L-S1.
3. **Walidacja zapisu jest strukturalna, nie semantyczna.** `validateSave` sprawdza kształt i to, że `currentRoom ∈ rooms`. Nie sprawdza, czy pokój i zadania istnieją w wysłanych danych. `tasksDone` to indeks w uporządkowanej liście `room.tasks`. Wyjaśnia H-R3 i M-R4.
4. **Fallbacki w scenie pokoju zamiast błędu.** Wyjaśnia H-R3, M-R5 i L-R10.
5. **Rollback wdrożenia nie zna wersji zapisu.** `deploy/martynka-deploy rollback` może cofnąć build pod zapis napisany przez nowszy kod. Przy v2 skutkiem jest `future`: karta przy każdym starcie i gra bez zapisu aż do kolejnego wdrożenia. Przy v1 skutkiem jest nieznany pokój (H-R3). Wyjaśnia M-S1.

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### S-11 autozapis i wersjonowany zapis

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| C-1 | `src/core/autosave.ts` `loadSave` (`catch { return { kind: 'unavailable' } }`) + `src/main.ts` `start` (`blocked: … 'unavailable'`, log tylko dla `unreadable`) | swallowed | **critical** | Odczyt IndexedDB rzuca (tryb prywatny, wyłączony magazyn, utrata połączenia, której jedno ponowne połączenie nie leczy). Dziecko dostaje ekran powitalny i puste 0 gwiazdek, jakby stracono postęp. Cała sesja (gwiazdki, meble, opanowanie) jest grana z zablokowanym saverem i nic nie zostanie zapisane. Nie ma karty, linii w panelu rodzica ani linii w konsoli, a obiekt błędu (`name`) jest odrzucony. Stary zapis zostaje nietknięty (dobrze), ale nikt nie wie, że ta sesja przepadnie. | `unavailable` niesie `name` błędu i ma `console.warn`. Rodzic dostaje widoczny sygnał „postęp nie jest zapisywany” (linia w panelu ustawień albo karta jak przy `unreadable`). Do tego e2e z magazynem rzucającym przy odczycie (w buildzie e2e, jak `?e2eSave=unreadable`). |
| C-2 | `src/core/autosave.ts` `createAutosaver` → `attempt` (`failures++`, `dirty = true`, `log(...)`) + `src/main.ts` `log: console.error` + `src/testing/e2eHook.ts` `save` (jedyny czytelnik `status()`) | logged-not-captured | **critical** | Zapis rzuca trwale z powodu limitu, IDB bez połączenia albo stanu, którego `validateSave` nie przyjmuje (jedno złe pole w rejestrze blokuje każdy zapis do końca sesji). Dziecko widzi kupiony mebel i wydane gwiazdki. Ponowna próba następuje dopiero przy kolejnej zmianie. Przy zimnym starcie wraca stan sprzed pierwszej porażki. Jedyny ślad to `console.error` na tablecie, którego nikt nie otwiera. Komunikat `autosave: encoded state does not validate` nie mówi, które pole. | Pokazać zdrowie zapisu w panelu rodzica (ostatni udany zapis, liczba porażek). Po N porażkach z rzędu delikatny sygnał. `validateSave` zwraca ścieżkę pierwszego złego pola do logu. |
| M-S1 | `deploy/martynka-deploy` `rollback` × `src/core/save.ts` `decodeSave` (`future`) | config | medium | Po v2 rollback builda daje `future` na urządzeniach, które już zapisały v2: karta przy każdym starcie i gra bez zapisu do kolejnego wdrożenia. Smoke po rollbacku nie uruchamia JS (H-9), więc nikt tego nie zobaczy. Dziś nieosiągalne (tylko v1). | Zasada w runbooku: rollback przez zmianę wersji zapisu wymaga buildu z migracją w dół albo jej odczytu. Ewentualnie zapis przechowuje `buildId`. |
| M-S2 | `src/storage/idb.ts` `requestPersistence` (wynik `persist()` odrzucony) + `src/core/autosave.ts` `loadSave` (`undefined` → `fresh`) | missing-context | medium | Eksmisja przez WebKit (Safari poza ekranem głównym, ok. 7 dni) wygląda jak pierwsze uruchomienie. Raport rodzica „zapomniało wszystko” jest nie do odróżnienia od C-1, C-2 i błędu. | Zapamiętać wynik `persist()` i pokazać go rodzicowi obok zdrowia zapisu (C-2). |
| M-S3 | `src/main.ts` `start` (`console.warn(... outcome.reason ...)`) + `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard` | missing-context | medium | Karta nie pokazuje powodu (`corrupt`/`future`/`unknown-version`) ani buildu. Rodzic przekazuje plik `martynka-zapis.txt` (dobrze), ale bez informacji, co odrzuciło zapis. `corrupt` łączy też „zły kształt” z „migracja rzuciła” (L-S1). | Krótki kod powodu i `__BUILD_ID__` w notce karty albo w pliku eksportu (nagłówek obok surowego JSON). |
| M-S4 | `src/main.ts` `start` (`await loadSave(store)` bez limitu czasu) | coverage-gap | medium | Otwarcie IDB, które nigdy się nie kończy (znany tryb awarii WebKit), daje pustą stronę na zawsze: bez gry, bez karty, bez konsoli. Granica reaguje tylko na błędy, nie na zawieszenie. Rozszerza N-1. | Wyścig z limitem czasu kończącym się `unavailable` (z sygnałem z C-1). |
| M-S5 | `src/core/autosave.ts` `createAutosaver` `block` (argument `reason` ignorowany) | missing-context | low | `status()` mówi `blocked: true`, ale nie mówi, czy powodem był wyjątek (`fatal`), `unreadable` czy `unavailable`. To utrudnia każdą przyszłą diagnostykę zdrowia zapisu. | Zachować `blockedBy` w `AutosaveStatus`. |
| L-S1 | `src/core/save.ts` `decodeSave` (`catch` → `corrupt`) | identity-lost | low | Wyjątek w kroku migracji (od v2) jest raportowany jako `corrupt`, a stos i komunikat znikają. Dziś `MIGRATIONS` jest puste. | Osobny powód `migration-failed` z nazwą kroku. |
| L-S2 | `src/ui/dom/saveExport.ts` `exportRawSave` (pobranie przez `a.download`) | swallowed | low | W aplikacji z ekranu głównego iPada, bez `canShare` dla plików, pobranie może nic nie zrobić. Rodzic myśli, że kopia jest. Ślad: brak. | Po pobraniu krótki komunikat albo kopia do schowka jako trzecia droga. |
| L-S3 | `src/main.ts` `visibilitychange` (najpierw `narrator.cancel()`, potem `flush`) + `pagehide` | coverage-gap | low | Wyjątek w `narrator.cancel()` pomija `flush('hidden')`. Ostatnie zmiany giną, a granica pokaże kartę na ukrytej stronie. Zapis IDB w `pagehide` może się nie dokończyć (nieudowodnione). | `flush` przed `cancel`, każde w osobnym `try`. |

### S-09 zakup mebla i S-10 zmiana wariantu, „Pokój gotowy!”

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-R3 | `src/scenes/RoomScene.ts` `room` (`ROOMS[id] ?? ROOMS[FIRST_ROOM]`) vs `roomState` (`rooms[this.roomId()]`) + `dispatch`; `src/core/save.ts` `validateSave` (`currentRoom ∈ rooms`, nie `ROOMS`) | identity-lost | high | Zapis z `currentRoom` nieznanym w danych (np. rollback po dodaniu drugiego pokoju; wersja zapisu się nie zmienia) działa tak:<br>1. Scena rysuje salon ze stanem obcego pokoju.<br>2. Pierwszy zakup zapisuje `rooms.salon` stanem wyliczonym z obcego pokoju i nadpisuje salon.<br>3. `TaskScene.nextRoomTaskCost` cicho zwraca `null`.<br>Nie zostaje żaden ślad. Latentne: dziś jest jeden pokój. | Pokój i jego stan z jednego id. Przy wczytaniu nieznany `currentRoom` → `console.warn` i naprawa do `FIRST_ROOM` bez dotykania innych pokojów. |
| M-R4 | `src/core/rooms.ts` `currentTask` (`room.tasks[state.tasksDone]`) + `src/core/save.ts` `validRoom` | identity-lost | medium | Postęp to indeks w uporządkowanej liście zadań. Zmiana kolejności, wstawienie lub usunięcie zadania w aktualizacji cicho przesuwa postęp: slot kupiony wraca jako zadanie albo pusty slot jest pominięty, a `roomDone` mówi „gotowe” nad konturami. | Test zamrażający kolejność id zadań (drzwi jednokierunkowe jak fixture zapisu) albo kontrola spójności `chosen` vs pierwsze `tasksDone` zadań przy wczytaniu. |
| M-R5 | `src/scenes/RoomScene.ts` `redraw`/`celebrate` (`SALON_PLACEHOLDERS[slot]`, brak → cichy `return`), `src/ui/widgets/RoomView.ts` `render`, `src/core/roomHit.ts` `slotAt`; `tests/roomsData.test.ts` (tylko `SALON`) | missing-throw | medium | Slot bez placeholdera daje panel w stanie `open` bez `variantPanel.show`. `blocked` chowa wszystkie przyciski i dziecko zostaje w pokoju bez wyjścia (jedyne wyjście to przeładowanie), bez karty i bez śladu. Testy danych pilnują tylko salonu, mimo zasady „pokój dodaje się przez `data/`”. | Rzucić (karta) przy otwartym panelu bez placeholdera. Testy danych iterują `ROOMS`/`ROOM_ORDER`. |
| M-R6 | `src/scenes/RoomScene.ts` `dispatch` → `flush('now')` | logged-not-captured | medium | Zakup jest „zapisany natychmiast” tylko gdy zapis się uda. Przy porażce obowiązuje C-2: dziecko widzi mebel, a po zimnym starcie mebla nie ma. Ślad pokojowy C-2, zamyka go ta sama poprawka. | Jak C-2. |
| L-R8 | `src/core/variantPanel.ts` `stepPanel` (`if (!result.ok) return same(panel)`) | missing-throw | low | Odmowa zakupu (`short`, `bad-variant`, `no-task`) to cichy brak reakcji „Wybieram”. Dziś nieosiągalna, bo saldo zmienia się tylko, gdy pokój śpi. | Zwracać powód odmowy w `PanelStep`, `console.warn` w scenie. |
| L-R9 | `src/core/stars.ts` `earn` (ujemna, ułamkowa lub NaN delta → cicho ignorowana) | swallowed | low | Błąd w liczeniu gwiazdek rundy wygląda jak „gwiazdki nie przyszły”, bez śladu. | Zostawić klamrę, dodać `console.warn` przy odrzuconej niezerowej delcie. |
| L-R10 | `src/ui/widgets/RoomTaskButton.ts` `show`, `src/ui/widgets/RoomView.ts` `render` (`roomText.* ?? key`) | missing-context | low | Brakujący polski tekst pokazuje dziecku surowy klucz (np. `fixFloor`). Salon jest pokryty testem, inne pokoje nie. | Jak M-R5 (testy po `ROOMS`). |
| L-R11 | `src/scenes/RoomScene.ts` `celebrate` + `onSleep` | noise | low | Tween „pop” i emiter cząstek nie są zatrzymywane przy uśpieniu. Szybkie „Wróć do notesu” zostawia pół-przeskalowany mebel do następnego wybudzenia. Bez wpływu na stan. | Zabić tweeny i emiter w `onSleep`. |

Sprawdzone jako dobre:
- brak mutacji w miejscu (`dispatch` zapisuje `{ ...rooms, [room.id]: step.state }`, a `setValue` Phasera emituje `changedata` przy każdym `set`);
- kolejność zakupu i `block('fatal')`;
- gwiazdki wydawane tylko w `purchase`, a zmiana wariantu ich nie zmienia;
- stary panel zamyka się sam;
- `onSleep` i `refresh` czyszczą panel, gest i kartę;
- gest anulowany, gdy przełącznik wejścia jest trzymany;
- brak `try/catch` w ścieżce pokoju;
- `decodeSave` nigdy nie rzuca, a nieczytelny zapis nie jest nadpisywany (e2e „#2 FR-021”).

## 6. Zalecana kolejność poprawek

1. **C-1 + C-2 + M-R6 + M-S5: jeden „wskaźnik zdrowia zapisu” dla rodzica.** Linia w panelu ustawień (za bramką), np. „Zapis: działa / nie działa od …, porażek: N”. Źródłem jest `saver.status()` rozszerzony o `blockedBy`, nazwę ostatniego błędu i czas ostatniego udanego zapisu. Dla `unavailable` także sygnał od razu, jak karta przy `unreadable`. Do tego `console.warn` z nazwą błędu w `loadSave`. To wymaga decyzji opiekuna co do formy (DESIGN-GAP 43), ale nic nie opuszcza urządzenia. Bez tego każda utrata postępu jest niediagnozowalna.
2. **M-S4:** limit czasu odczytu (wynik `unavailable`), jeden test jednostkowy z wiszącym magazynem.
3. **H-R3 + M-R4 + M-R5 + L-R10:** semantyczna kontrola zapisu przy wczytaniu (nieznany pokój lub zadanie → log i naprawa) oraz testy danych po wszystkich `ROOMS`, zanim pojawi się drugi pokój (M3/M4 w roadmapie).
4. **M-S1 + M-S3:** zasada rollbacku względem `SAVE_VERSION` w `deploy/README.md`; powód i build na karcie i w pliku eksportu.
5. Drobne: L-S1, L-S2, L-S3, L-R8, L-R9, L-R11.

## 7. Zmiany od ostatniego audytu

| Poprzednie id | Status | Dowód |
|---|---|---|
| N-1 | still open, rozszerzone | `src/main.ts`: kolejność bez zmian (importy → `createNarrator` → `installErrorBoundary`). Nowa sąsiednia ścieżka bez karty to zawieszony odczyt zapisu (M-S4). |
| N-3 | still open | `onFatal` dostał `saver.block('fatal')`, ale nadal nie ma `narrator.cancel()`. |
| N-4 | still open | `mountErrorCard(document.body, __BUILD_ID__, …)` bez zmian. Karta nieczytelnego zapisu powiela ten wzorzec (M-S3). |
| M-9 | still open | Brak map źródeł. Dotyczy też `autosave: write failed`. |
| H-9 | still open | Smoke po wdrożeniu nie uruchamia JS. Teraz także rollback względem wersji zapisu (M-S1). |
| N-2, N-5, N-6, H-3, H-4, H-7r, L-12 | not re-checked | Poza obszarem tego audytu. `src/ui/narrator.ts` nie zmienił się w tym runie (`git diff bb969f7 6617da3 -- src/ui/narrator.ts` puste). |
| „brak trwałości” (CLAUDE.md, raporty 06:59/09:24: postęp resetowany przy każdym zimnym starcie) | fixed (S-11) | `createAutosaver`, `loadSave`, `createIdbSaveStore`, e2e `save-restart.spec.ts` (#2 #10 przeładowanie, #16 zakup zapisany natychmiast, #2 FR-021 nieczytelny zapis nienadpisany). Nowe luki obserwowalności tej trwałości są w C-1, C-2 i M-S*. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** dwóch.
  - Ten krok przeczytał S-11 w całości: `autosave.ts`, `save.ts`, `idb.ts`, `saveExport.ts`, `saveFailedCard.ts`, `main.ts`, `e2eHook.ts` `save`, miejsca `flush('now')` w `TaskScene` i `RoomScene` oraz DESIGN-GAP 42–44.
  - Jeden subagent tylko do odczytu objął S-09 i S-10: `RoomScene`, widżety pokoju, `rooms`, `roomHit`, `roomGesture`, `variantPanel`, `stars`, `data/rooms.ts` oraz źródło `DataManager.setValue` w Phaserze.
  - Osobny audytor infrastruktury nie był uruchamiany. Przegląd repo wykonano ręcznie: 18 bloków `catch` i 8 `console.*` w `src/` bez `src/testing`.
- **Sprawdzone ręcznie** (wierszami i symbolami):
  - C-1: `loadSave` `catch` bez wiązania; `main.ts` loguje tylko `unreadable`.
  - C-2: `status()` czyta wyłącznie `src/testing/e2eHook.ts`.
  - H-R3: `RoomScene.room` vs `roomState`.
  - M-R5: `tests/roomsData.test.ts` asercje tylko na `SALON`.
- **Uruchomione:** `npx vitest run tests/autosave.test.ts tests/save.test.ts` → 2 pliki, 46 testów zielonych. E2E i build nie były uruchamiane w tym kroku. Dowody e2e pochodzą z logu runu (`context/runs/2026-10-13-s09-s11/run-log.md`, baseline `e2e OK 29 passed`).
- **Nieudowodnione w czasie działania:**
  - zachowanie `loadSave`/`createIdbSaveStore` na prawdziwym iPadzie (tryb prywatny, WebKit 197050 po dwóch próbach, zawieszone otwarcie IDB, eksmisja po 7 dniach);
  - czy zapis w `pagehide` kończy się przed zamknięciem;
  - realne wyjątki `QuotaExceededError`;
  - pobranie `a.download` w aplikacji z ekranu głównego;
  - skutki H-R3/M-R4 (wymagają drugiego pokoju lub zmiany kolejności zadań, których dziś nie ma).
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania (trzy klucze w `areas`).
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`), `runtime_proof: not-run`.
- **Fan-out:** jeden subagent na S-09 i S-10 łącznie (wspólny kod sceny pokoju). S-11 i przegląd infrastruktury czytane w tym kroku, bo powierzchnia jest mała (5 plików) i wiąże się z granicą błędów z raportu 09:24. Ryzyko: węższe pokrycie infrastruktury poza obszarami (stąd „not re-checked” w § 7).
- **Wagi:**
  - C-1 i C-2 są critical według rubryki „realistyczna awaria w krytycznym przepływie byłaby niewidoczna” plus nieodwracalna utrata postępu dziecka. C-2 ma linię w konsoli, ale na tablecie jest ona dla nikogo niewidoczna, więc nie obniżono go do high.
  - Subagent oznaczył R-1 (= M-R6) jako critical. Scalono go z C-2 jako ten sam mechanizm i ślad pokojowy oznaczono medium, aby nie liczyć jednej przyczyny dwa razy.
  - H-R3 zostaje high, choć jest latentny: nadpisuje postęp bez śladu, a rollback jest zwykłą operacją runbooka.
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy. Wszystkie kierunki poprawek zostają na urządzeniu (panel rodzica, karta, konsola). Forma wskaźnika zdrowia zapisu to decyzja opiekuna (DESIGN-GAP 43).
- **Co zmieniłoby odpowiedzi:**
  - Sonda pokazująca, że na docelowych tabletach (iPadOS w trybie standalone) odczyt IDB praktycznie nigdy nie rzuca. Wtedy C-1 spada do high.
  - Decyzja opiekuna, że sesja bez zapisu jest akceptowalna bez sygnału. Wtedy C-1 i C-2 stają się udokumentowanym ryzykiem produktu, nie luką.
