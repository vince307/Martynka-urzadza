---
type: observability-audit
date: 2026-11-01 23:27
mode: audit
commit: 2578671
branch: docs/observability-audit-2026-11-01-bathroom-polish-lab
dirty_tree: false
areas: [bathroom-room-done-card-four-tiles, save-v7-kitchen-stages-backup-v6-salon-cream, lab-module-base-cell-frame]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-11-01_1501-pokoj-dzieciecy-etapy-tla-karta-przekroj.md  # PR #134, not on main
findings: { critical: 0, high: 0, medium: 0, low: 2 }
---

# Audyt obserwowalności: łazienka, zapis v7 z kuchnią, Laboratorium (2026-11-01)

Ten raport zamyka run `2026-11-01-bathroom-polish-lab`. Run wydał trzy slice'y:

| PR | Slice | Merge |
|---|---|---|
| #136 | S-31 `bathroom-room` (łazienka, karta z czterema kafelkami) | `964285b` |
| #137 | S-32 `house-1-polish` (zapis v7, kuchnia w trzech etapach, salon na kremowym tle) | `60472aa` |
| #138 | S-33 `lab-module` (Laboratorium, ramka komórki bazy) | `2578671` |

Audyt jest statyczny, bez `--runtime`. Obszary z argumentów kroku:

- **Łazienka i karta „Pokój gotowy!”:** dziecko po pokoju dziecięcym urządza łazienkę i widzi kartę z czterema kafelkami. Dotyczy `BATHROOM` w `src/data/rooms.ts`, wiersza `bathroom` w `HOUSES` i `ROOM_SCENE_FILES`, `roomDoneCardRect` (`src/core/roomDoneLayout.ts`) oraz `RoomDoneCard.render`.
- **Zapis v6 → v7 i kuchnia:** `MIGRATIONS[6]` = `LIFT_V6_KITCHEN_STAGES` (`src/core/migrations/kitchenStages.ts`), `SAVE_VERSION` 7 i kopia `backup-v6` (`src/storage/idb.ts`, `backup-v${from}`). Kuchnia ma trzy zadania etapowe ze `scene` (`kitchen/kitchen-stage-1`, `kitchen/kitchen-stage-2`), a salon tła z paczki `martynka-house-1-polish-v1` (`ROOM_PACKS` w `scripts/make-task-art.mjs`, `recolourBoard: false`).
- **Laboratorium:** dziecko z bazą po Hangarze remontuje Laboratorium. Dotyczy `LAB` w `src/data/rooms.ts`, wiersza `lab` w `HOUSES['base-1']`, `HOUSE_GEOMETRY['base-1'].cellFrame` = `house/base-1-cell-frame` (`HOUSE_ART`, `houseArtKeys`) oraz `HouseView.render` (ramka komórki w remoncie).

Zakres: diff runu `e451fa8..2578671` w `src/`, `scripts/`, `vite/` i `deploy/` (17 plików, +226/−34). Pliki `.github/`, `src/pwa/`, granica błędów, `UIScene`, `roomArtLoader`, `artFallbacks` i `WelcomeScene` się nie zmieniły. Poprzednie raporty tego wątku leżą w otwartych PR #134 (pokój dziecięcy), #122 i #119, nie na `main`. Raport z 2026-11-01_1043 (PR #130) jest na `main`. Lokalizacje podaję jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW (nowe).** Run nie dodał żadnego `catch`, logu ani nowej ścieżki ładowania. Liczniki przeglądu są identyczne na obu commitach. Nowa migracja nie rzuca, a jej kopia surowego v6 idzie ogólną ścieżką `backup-v${from}` z rekordem `backup-status`.
- **L-1:** przesunięcie kuchni v6 → v7 (`tasksDone` k ≥ 1 → k + 2) nie zostawia żadnej notatki w czasie działania. Konsola i „Zapis gry” mówią tylko „Save migrated from v6”, w przeciwieństwie do salonu z `MIGRATIONS[2]`, który zostawia `salonCarried`. Surowy v6 jest w `backup-v6`, więc dowód istnieje, ale trzeba go wyeksportować i porównać ręcznie.
- **L-2:** żaden test danych nie pilnuje, że karta „Pokój gotowy!” zmieści kafelki każdego domu. `roomDoneCardRect` przy sześciu kafelkach rysuje kartę szerszą niż 1920 px, po cichu i bez ostrzeżenia. Dziś dom 1 ma 4 kafelki, a baza 3, więc ustalenie jest uśpione.
- **Otwarte L-1 z PR #134** (tło etapu bez etykiety w „Obrazki”) obejmuje teraz także kuchnię (`kitchen-stage-1`, `kitchen-stage-2`). Otwarte M-1 z 2026-11-01_1043 (rekord „Obrazki” po „Wróć” i zmianie budowli) się nie zmieniło.
- Ramka bazy i Laboratorium idą istniejącymi kanałami. Brak pliku daje `loadErrorLine('house'|'room', …)`, a brak ramki rysuje zastępczą skorupę i ramkę oraz zapisuje `recordFallback('house')`. Smoke deployu po #138 to 167 z 167 obrazków pokoi, 6 z 6 obrazków domu i 261/261 plików w precache.

## 2. Model przechwytywania (bez zmian względem raportu 2026-11-01_1043)

- **Platforma, tracker, granica błędów:** bez zmian. Gra działa wyłącznie po stronie klienta jako offline PWA (`src/main.ts`), bez trackera i bez sieci w grze. Błąd trafia do człowieka przez ekran dziecka, karty DOM z `Kod:` (`installErrorBoundary`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsolę tabletu oraz CI i smoke deployu. Ten ostatni sprawdza precache każdego obrazka z `ROOM_ART`, `HOUSE_ART`, `TASK_ART` i `UI_ART`.
- **Migracje:** `decodeSave` przechodzi łańcuch `MIGRATIONS`. `start` w `src/main.ts` loguje `console.warn('Save migrated from v${from}')`, a dla salonu z v2 także `salonCarried`. `Autosaver` zapisuje surowy poprzedni format raz, do `profile:default:backup-v${from}` (`putBackupOnce`). `readBackups` czyta od v1 do `SAVE_VERSION - 1`, czyli teraz także `backup-v6`. Build sprzed v7 widzi zapis v7 jako `future` i go nie nadpisuje (`deploy/README.md`).
- **Grafika pokoju:** `roomArt(room)` (`src/data/roomArt.ts`) dodaje tła z zadań etapowych z `label: ''`. Nieudany plik daje `loadErrorLine('room', …)` i licznik w „Obrazki”.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep`):

  | | e451fa8 | 2578671 |
  |---|---|---|
  | linie z `catch` | 70 | 70 |
  | `console.error` | 9 | 9 |
  | `console.warn` | 62 | 62 |
  | `console.info` | 6 | 6 |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Plik łazienki lub Laboratorium 404 | pudełka zastępcze z polską etykietą | „Obrazki” z liczbą i etykietami mebli | `loadErrorLine('room', …)` | widoczne |
| Tło etapu kuchni 404 | ściana „po remoncie” na każdym etapie | „Obrazki”: tylko liczba, bez nazwy | `loadErrorLine('room', …)` | **częściowo** (L-1 z PR #134, teraz też kuchnia) |
| `base-1-cell-frame` 404 | skorupa i ramka rysowane w kodzie | — (FU-H 5) | `loadErrorLine('house', …)` | widoczne w konsoli |
| `base-1-cell-frame` 200, nie da się zdekodować | jw. | — | ogólna linia Phasera | tylko oko (L-1 z PR #122, teraz 3 pliki bazy) |
| Zapis v6 → v7 | nic (kuchnia na tym samym wyglądzie) | „Zapis gry”: migracja z v6, kopia `backup-v6` | `Save migrated from v6` | widoczne, ale bez opisu przesunięcia kuchni (L-1) |
| Kuchnia v6 z `tasksDone` ponad listą | jak dotąd | — | `roomStateProblems` → `tasks-overflow` | widoczne (bez zmian, +2 zachowuje flagę) |
| Zapis v7 otwarty przez build v6 (rollback) | karta „nowsza wersja” | karta | `future` | widoczne, nic nie jest nadpisywane |
| Dom z 6+ kafelkami na karcie | kafelki poza ekranem | — | nic | **niewidoczne**, dziś nieosiągalne (L-2) |

## 4. Systemowe przyczyny źródłowe

1. **Migracja zmieniająca znaczenie licznika nie ma własnego śladu.** `MIGRATIONS[2]` dostał `carryV2Salon` z notatką dopiero po audycie (health-lines-and-smoke). Nowe migracje dalej startują bez notatki, a jedynym śladem jest ogólna linia wersji. Wyjaśnia L-1.
2. **Reguły układu sprawdzane na liczbach, a nie na danych.** Testy `roomDoneCardRect` i `layout.test.ts` obejmują 1–5 kafelków, ale nic nie wiąże tej granicy z `HOUSES`. Wyjaśnia L-2. Ten sam wzór wcześniej zamknął gap 204, który powstał przy czwartym kafelku.
3. **Puste etykiety teł (przeniesione z PR #134).** Każde tło, także etapowe, ma `label: ''`, więc panel rodzica nie umie go nazwać. Przybyły dwa nowe tła etapowe kuchni.

## 5. Ustalenia według obszarów

### Łazienka i karta „Pokój gotowy!”

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-2 | `src/core/roomDoneLayout.ts` `roomDoneCardRect`, `src/ui/widgets/RoomDoneCard.ts` `render`, `src/data/houses.ts` `HOUSES` (brak testu danych w `tests/roomsData.test.ts`) | silent-fallback | LOW | Dom, który kiedyś dostanie szósty kafelek (pokoje plus „Wkrótce”), pokaże kartę szerszą niż ekran. Skrajne kafelki i ramka znikają poza krawędzią, nic nie trafia do konsoli, a CI przechodzi, bo testy układu kończą się na pięciu kafelkach. Dziś najwięcej, 4 kafelki, ma dom 1. | Test danych: dla każdego `HOUSES` `houseRoomList(...).length` (z kafelkiem „Wkrótce”) ≤ największej liczby, która się mieści (dziś 5), z komunikatem wskazującym gap 204. Opcjonalnie `console.warn` w `render`, gdy `rect.width > GAME_WIDTH`. |

Sprawdzone bez ustaleń:
- Łazienka to same dane (`BATHROOM`, wiersz w `HOUSES`, `ROOM_SCENE_FILES.bathroom`) i idzie kanałami kuchni.
- „Dalej” z pokoju dziecięcego woła `moveAfterDone` → `refreshHealth(bathroom)`.
- Łazienka jest ostatnim pokojem domu 1 (bez kafelka „Wkrótce”), tak samo jak wcześniej Hangar.
- `RoomDoneCard.render` bierze prostokąt i kafelki z jednej reguły (`tests/roomDoneCardWiring.test.ts`).

### Zapis v6 → v7, kuchnia w trzech etapach, salon na kremowym tle

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-1 | `src/core/migrations/kitchenStages.ts` `LIFT_V6_KITCHEN_STAGES`, `src/main.ts` `start` (tylko `Save migrated from v${outcome.migratedFrom}`) | missing-context | LOW | Rodzic zgłasza po aktualizacji, że „kuchnia wygląda inaczej” albo że brakuje mebla. Konsola i „Zapis gry” mówią tylko o migracji z v6. Nie wiadomo, czy kuchnia była przesunięta i z jakiej wartości na jaką. Ustalenie wymaga eksportu `backup-v6` („Zachowaj kopię starego zapisu”) i ręcznego porównania z bieżącym zapisem. | Wzorem `carryV2Salon` zwracać notatkę `{ from, to }` z kroku (bez zmiany bajtów wyjścia migracji), logować `console.info('Kitchen carried to the staged list: …')` i dodać jedną linię w „Zapis gry” (rejestr runtime, poza zapisem). |

Sprawdzone bez ustaleń:
- `LIFT_V6_KITCHEN_STAGES` nie rzuca, ma lokalne stałe (moduł zamrożony) i przepuszcza wszystko, co nie jest kuchnią z całkowitym `tasksDone ≥ 1`.
- Kuchnia z `tasksDone` ponad listą zostaje oznaczona `tasks-overflow` (`roomStateProblems`), tak jak przed migracją.
- `backup-v6` i jego odczyt w „Zapis gry” są ogólne po `from`.
- Szew `?e2eSave=v6-kitchen` jest w `E2E_HOOK_MARKERS`, więc `npm run build` nie przepuści go do `dist/`.
- Fixtures `save-v6-kitchen-mid.json`, `save-v6-kitchen-done.json`, `save-v7.json` i spec `tests/e2e/house-1-polish.spec.ts` pokrywają przejście.
- Salon na kremowym tle zmienia tylko pliki (`ROOM_PACKS`, `recolourBoard: false`), a nazwy kluczy zostały, więc ocena „Obrazki” i smoke działają bez zmian.
- Tła etapowe kuchni trafiają do `roomArt` przez `t.scene`, więc są w precache i w ocenie.

Przeniesione: L-1 z PR #134 dotyczy teraz także `kitchen-stage-1` i `kitchen-stage-2` (patrz § 7).

### Laboratorium i ramka bazy

Bez nowych ustaleń. Sprawdzone:
- `houseArtKeys` zbiera `cellFrame` z geometrii, więc `HouseScene.art()` ładuje i ocenia `base-1-cell-frame`. Plik 404 daje `loadErrorLine('house', …)` w `onFail`.
- `shellReady()` wymaga wszystkich trzech plików. Brak ramki daje zastępczą skorupę i ramkę rysowaną w `HouseView.render` oraz `recordFallback(this, 'house', 'drawn')` w `settle`.
- Dom 1 zachowuje swoją ramkę `cell-frame`. Geometrię bazy pilnuje `tests/houseArt.test.ts` (rozmiary 640×374).
- Hangar → Laboratorium idzie przez „Dalej” (`moveAfterDone`) albo przez start z zapisu (`nextRoom`, `console.info('Renovation moved from hangar to lab')`). Pokrywa to fixture `save-v7-hangar-done`.
- Smoke po #138: 167 z 167 obrazków pokoi, 6 z 6 obrazków domu.

## 6. Zalecana kolejność poprawek

1. **M-1 z 2026-11-01_1043** (nadal jedyne MEDIUM w wątku): warunek w `UIScene.create`.
2. **L-1 z PR #134 razem z rozszerzeniem na kuchnię:** etykieta tła etapu (np. `pl.room.stage…`) zamiast `''` w `roomArt`. Jedna zmiana obejmuje oba pokoje.
3. **L-1 (ten raport):** notatka migracji kuchni wzorem `salonCarried`. Najtaniej przy następnej migracji, która przesuwa licznik.
4. **L-2:** test danych w `tests/roomsData.test.ts`, najlepiej razem ze slice'em dodającym pokój do istniejącego domu.

## 7. Zmiany od ostatniego audytu

| Poprzedni id | Status | Dowód |
|---|---|---|
| PR #134 L-1 (tło etapu bez etykiety w „Obrazki”) | still open, rozszerzone | `roomArt` nadal daje tłom etapowym `label: ''`. Kuchnia dostała `kitchen/kitchen-stage-1` i `kitchen/kitchen-stage-2` (`src/data/rooms.ts`). |
| 2026-11-01_1043 M-1 („Obrazki” po „Wróć” i zmianie budowli) | still open | `UIScene.create` nadal woła `refreshHealth` tylko przy `roomArtHealth.total === 0`. `UIScene.ts` i `roomArtLoader.ts` bez zmian w runie. |
| 2026-11-01_1043 L-1 (karta wyboru nie dekoduje się) | not re-checked | `WelcomeScene`, `ChoiceCard`, `BootScene` bez zmian |
| 2026-11-01_1043 L-2 (`artFallbacks.house`: pierwszy zapis wygrywa) | still open | `artFallbacks.ts` bez zmian. Baza ma teraz trzy pliki, które mogą wywołać fallback. |
| PR #122 L-1 (skorupa nie dekoduje się → ogólna linia Phasera) | still open, rozszerzone | `HouseScene.loadArt` bez zmian. Dotyczy teraz także `base-1-cell-frame`. |
| PR #119 L-1/L-2/L-3 | still open / not re-checked | pliki bez zmian w runie |
| 2026-10-25 L-2 (przedział maski 5–30 % w `recolour-board.py`) | changed | Żaden wiersz `ROOM_PACKS` nie ma już `recolourBoard: true` (salon przeszedł na kremowe tła z paczki). Strażnik nie jest używany przez `npm run art`, więc ustalenie jest dziś nieosiągalne. |

## 8. Metoda i ograniczenia

- **Wykonanie:** w jednym wątku, bez subagentów (decyzja niżej). Przeczytałem pełny diff `e451fa8..2578671` bez `src/data/pl.ts` (same teksty) i ręcznie sprawdziłem:
  - `HouseView.render` (gałąź ramki) i `HouseScene` (`art`, `onFail`, `settle`);
  - `roomArt` z wpisami teł etapowych;
  - `roomGrowth` i `formerTaskCounts` (kuchnia ich nie ma, migracja przenosi pełną kuchnię 7 → 9 = ukończona, więc linia wzrostu nie powstaje);
  - `readBackups` (`for from < SAVE_VERSION`);
  - testy `roomDoneLayout`, `layout` i `roomsData` pod kątem granicy kafelków;
  - liczniki przeglądu na obu commitach.
- **Weryfikacja L-2:** `tests/roomDoneLayout.test.ts` kończy się na `n <= 5`, `tests/layout.test.ts` ma test „for two to five tiles”, a `grep` w `tests/` nie znalazł testu wiążącego długość `houseRoomList` z tą granicą.
- **Nieudowodnione (tylko statycznie):**
  - migracja v6 → v7 między dwoma prawdziwymi buildami na tablecie (dowód tylko na fixtures i szwie `?e2eSave=v6-kitchen`);
  - rollback do builda v6 na urządzeniu z zapisem v7 (karta `future` opisana w `deploy/README.md`, nie przećwiczona);
  - dekodowanie uszkodzonego WebP ramki bazy w Safari/iPadOS;
  - zawartość konsoli tabletu na produkcji (brak telemetrii z założenia).
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wziąłem je z argumentów kroku (`area_source: arguments`), bez pytania (kontrakt runu, reguła 1). Odrzuciłem rotację obszarów. Zmieniłoby to polecenie kroku bez obszarów.
- **Dowód w czasie działania:** nie uruchomiony (`runtime_proof: not-run`), bo krok zadał audyt statyczny. Zmieniłoby to `--runtime` w poleceniu albo ustalenie CRITICAL/HIGH wymagające dowodu.
- **Bez subagentów** zamiast domyślnego rozdzielenia na trzech audytorów obszarów i audytora infrastruktury. Powód: diff to 17 plików i około 260 linii, a tracker, granica błędów, `src/pwa/` i `.github/` są bez zmian. Tak samo postąpiły trzy poprzednie audyty tego wątku. Zmieniłoby to diff w granicy błędów, w ścieżce zapisu (poza jedną migracją) lub w deployu, albo diff ponad ~2 tys. linii.
- **`previous_report`:** raport z PR #134 (najnowszy w wątku, niescalony). Raport 2026-11-01_1043 jest na `main` i cytuję go w § 7. Zmieniłoby to zamknięcie #134 bez scalenia.
- **L-1 jako LOW, nie MEDIUM:** gra ma kopię `backup-v6` z rekordem w „Zapis gry”, a migrację pokrywają fixtures i e2e. Brakuje tylko opisu przesunięcia. Zmieniłoby to zgłoszenie z terenu o kuchni po aktualizacji.
- **L-2 jako LOW mimo kategorii „niewidoczne”:** dziś żadna dana go nie wyzwala. Zmieniłoby to roadmapa z piątym pokojem i kafelkiem „Wkrótce” w jednym domu.
