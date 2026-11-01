---
type: observability-audit
date: 2026-11-01 10:43
mode: audit
commit: aa95f72
branch: docs/observability-audit-2026-10-31-space-base
dirty_tree: false
areas: [first-building-choice-welcome-choiceart-buildingstart-save-v6-backup-v5-themeback, base-cross-section-housescene-houseview-base-1-houseartkeys-baza-button, hangar-module-dalej-roomartloader-celebration-load]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-31_1405-dom-przekroj-grafika-skorupy.md  # PR #122, not on main
findings: { critical: 0, high: 0, medium: 1, low: 2 }
---

# Audyt obserwowalności: wybór budowli, przekrój bazy, Hangar (2026-11-01)

Ten raport zamyka run `2026-10-31-space-base`. Run wydał trzy slice'y:

| PR | Slice | Merge |
|---|---|---|
| #127 | S-28 `first-building-choice` (wybór Dom / Baza, zapis v6) | `9a44799` |
| #128 | S-29 `base-cross-section` (przekrój bazy, przycisk „Baza”) | `a4a0aee` |
| #129 | S-30 `hangar-module` (drugi moduł bazy) | `aa95f72` |

Audyt jest statyczny, bez `--runtime`. Obszary z argumentów kroku:

- **Wybór pierwszej budowli:** `WelcomeScene` (`createChoice`, `place`, `pick`, `backToAge`), `ChoiceCard`, `CHOICE_ART` (`src/data/choiceArt.ts`), `buildingStart` (`src/core/house.ts`), `bootGroups` (`src/core/artHealth.ts`), zapis v6 (`MIGRATIONS[5]` = `LIFT_V5_BUILDING`, `src/core/migrations/building.ts`), kopia `backup-v5`, „Wróć” do wyboru (`themeBackOffered`, `TaskScene.backToChoice`).
- **Przekrój bazy:** `HouseScene` (`create`, `art`, `loadArt`, `settle`, `geometry`), `HouseView` dla `base-1`, `houseArtKeys` (`src/core/houseCells.ts`), przycisk „Baza” (`RoomScene` `houseButton`, `pl.house.open`), obrazki `base-1-shell` i `base-1-cell-closed`.
- **Hangar:** „Dalej” z Mostka (`RoomScene.moveAfterDone`, `nextRoom`), ładowanie grafiki pokoju w trakcie gry (`createRoomArtLoader`, nowy reset w `attachLoader`), celebracja, stan po wczytaniu zapisu (`start` w `src/main.ts`: `houseLayout`, `houseRoomIds`, `repairCurrentRoom`, `nextRoom`).

Zakres: diff runu `fc13e8c..aa95f72` w `src/`, `scripts/`, `vite/`, `deploy/` (32 pliki, +643/−99; `.github/`, `src/pwa/`, granica błędów bez zmian). Poprzednie raporty tego wątku leżą w otwartych PR #119 (kuchnia, ładowanie pokoju) i #122 (przekrój domu), nie na `main`; cytuję je jako „PR #119” i „PR #122”. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 1 MEDIUM, 2 LOW (nowe).** Run nie dodał cichej ścieżki w zapisie: `LIFT_V5_BUILDING` nie rzuca, `backup-v5` idzie ogólną ścieżką `backup-v${from}`, a `readBackups` liczy do `SAVE_VERSION-1`.
- **M-1 (MEDIUM): „Obrazki” zostaje przy pokoju pierwszego wyboru.** Dziecko wybiera Dom, salon się wczytuje, dziecko wraca „Wróć” i wybiera Bazę. `UIScene.create` woła `refreshHealth` tylko przy `roomArtHealth.total === 0`, a `current` w loaderze dalej wskazuje salon. Mostek się wczytuje, ale jego rekord nie jest zapisywany. Rodzic aż do „Dalej” albo do ponownego startu widzi stan salonu, a brakujące obrazki Mostka widać tylko w konsoli.
- **L-1:** karta wyboru, której plik się nie zdekoduje (200, nie obraz), zostawia tylko ogólną linię Phasera. `artFallbacks.choice` czyta tylko hook e2e (gap 197). To ta sama klasa co L-1 z PR #122, tu na pierwszym ekranie nowej instalacji.
- **L-2:** rekord `artFallbacks.house` ma zasadę „pierwszy zapis wygrywa” i obejmuje całą sesję. Po „Wróć” i zmianie budowli zostaje werdykt skorupy poprzedniej budowli. Dziś czyta go tylko hook e2e.
- Przejście Mostek → Hangar dziedziczy kanały kuchni: każdy nieudany plik daje `loadErrorLine('room', …)`, a `moveAfterDone` od razu woła `refreshHealth`. Nowy reset w `attachLoader` naprawia zawieszony `pending` po zatrzymaniu `UIScene`.

## 2. Model przechwytywania (zmiany względem PR #122)

- **Platforma, tracker, granica błędów:** bez zmian. Gra działa wyłącznie po stronie klienta jako offline PWA (`src/main.ts`, `type: AUTO`), bez trackera i bez sieci w grze. Błąd trafia do człowieka przez ekran dziecka, karty DOM z `Kod:` (`installErrorBoundary`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsolę tabletu oraz CI i smoke deployu (24/24 przy #128 i #129).
- **Nowe sygnały:**
  - `console.info('Back to the building choice (stage …, placed by …)')` w `TaskScene.backToChoice`.
  - `console.warn('Save names an unknown room (…); starting in <pierwszy pokój zapisanej budowli>')` w `start`. Naprawa bierze listę z `houseRoomIds(houseLayout(saved…))`, a nie z globalnego `FIRST_ROOM`.
  - `recordFallback(this, 'choice', 'drawn')` w `WelcomeScene.createChoice`.
  - Pliki kart wyboru są logowane pod tabelą `ui` (`BootScene.tables`), więc 404 lub przekroczony limit daje `loadErrorLine`.
- **Boot nowej instalacji:** `bootGroups(true)` ładuje karty wyboru i żadnego pokoju. Ocena pokoju przy starcie ma `total 0`, a wybrany pokój ocenia `UIScene.create` przez `roomArtLoader.refreshHealth`, gdy jego wczytywanie się rozliczy.
- **Przekrój:** `HouseScene.art()` ładuje i ocenia tylko klucze z `houseArtKeys(geometry)`. `create` zeruje flagi przy każdym starcie sceny. `geometry()` dla id bez geometrii nadal po cichu wraca do `house-1` (L-2 z PR #119). `RoomScene` ukrywa przycisk dla budowli bez geometrii.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | fc13e8c | aa95f72 |
  |---|---|---|
  | linie z `catch` | 70 | 70 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 |
  | `console.error` | 9 | 9 |
  | `console.warn` | 62 | 62 |
  | `console.info` | 5 | 6 (`backToChoice`) |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| `buildingStart` rzuca (zła tabela `BUILDING_CHOICES`) | karta błędu z `Kod:` | — | stack `RangeError` z id wyboru | widoczne; dane pilnowane testami |
| Karta wyboru 404 / limit | ramka zastępcza | — (panel niedostępny na powitaniu) | `loadErrorLine` (tabela `ui`) | widoczne w konsoli |
| Karta wyboru 200, nie da się zdekodować | ramka zastępcza | — | tylko ogólne `Failed to process file` Phasera | **tylko oko** (L-1, gap 197) |
| Zapis v5 → v6 | nic | „Zapis gry”: migracja z v5, kopia `backup-v5` | `Save migrated from v5` | widoczne |
| Plik Mostka/Hangara 404 po „Wróć” i zmianie budowli | pudełka zastępcze | „Obrazki” pokazuje rekord poprzedniego pokoju | `loadErrorLine('room', …)` | **mylące** (M-1) |
| Plik Hangara 404 po „Dalej” | pudełka zastępcze | „Obrazki” z przyczyną po rozliczeniu | `loadErrorLine('room', …)` | widoczne |
| Skorupa bazy 404 | skorupa rysowana w kodzie (`standInRoof`) | — (FU-H 5) | `loadErrorLine('house', …)` | widoczne w konsoli |
| Skorupa bazy nie dekoduje się | skorupa rysowana | — | ogólna linia Phasera | tylko oko (L-1 z PR #122, teraz też baza) |
| Nieznany pokój w zapisie bazy | start w pierwszym module bazy | — | `Save names an unknown room` | widoczne w konsoli |

## 4. Systemowe przyczyny źródłowe

1. **Rekordy zdrowia są globalne dla sesji, a wybór budowli nie jest już jednorazowy.** `roomArtHealth`, `current` w `roomArtLoader` i `artFallbacks` powstały przy założeniu, że sesja ma jedną ścieżkę naprzód (boot → pokój → „Dalej”). „Wróć” do wyboru zmienia budowlę w środku sesji, a żaden z tych rekordów nie wraca wtedy do punktu wyjścia. Wyjaśnia M-1 i L-2.
2. **Fallback bez rozróżnienia przyczyny „nie zdekodowano”.** Phaser 4.2.1 nie emituje `loaderror` dla pliku 200, którego nie da się zdekodować. Boot nadrabia to przez `artCauses`, scena domu i karty wyboru nie. Wyjaśnia L-1 (oraz L-1 z PR #122).

## 5. Ustalenia według obszarów

### Wybór pierwszej budowli

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| M-1 | `src/scenes/UIScene.ts` `create` (warunek `roomArtHealth.total === 0` przed `refreshHealth`), `src/ui/roomArtLoader.ts` `onComplete` (`room === current`), `src/scenes/TaskScene.ts` `backToChoice` | missing-context | MEDIUM | Nowa instalacja: Dom → salon się wczytuje i dostaje rekord → „Wróć” → Baza. Mostek ładuje się na nowym loaderze, ale `current` w loaderze to nadal salon, więc `writeHealth` nie zapisuje rekordu Mostka. Rodzic, który podczas gry w bazie otworzy „Obrazki”, widzi stan salonu („w porządku” albo braki salonu). Brakujące pliki Mostka są tylko w konsoli. Stan trwa do „Dalej” (`moveAfterDone`) albo do ponownego startu. | W `UIScene.create` wołać `refreshHealth(chosenRoom)`, gdy rekord dotyczy innego pokoju (rekord niesie id pokoju) albo zawsze dla `currentRoom`, a nie tylko przy `total === 0`. Albo zerować `roomArtHealth` w `backToChoice`. Test wiringu: „Wróć” → inna budowla → rekord Mostka. |
| L-1 | `src/ui/widgets/ChoiceCard.ts` (`drawn`), `src/scenes/WelcomeScene.ts` `createChoice`, `src/scenes/BootScene.ts` (ocena `UI_ART` bez `CHOICE_ART`) | logged-not-captured | LOW | Wdrożenie z uszkodzoną kartą wyboru (200 z precache, smoke HEAD przechodzi): dziecko widzi ramkę zastępczą zamiast obrazka budowli. W konsoli jest tylko ogólne `Failed to process file: image "…"` bez URL i słowa „choice”. `artFallbacks.choice` czyta tylko hook. Rodzic nic nie widzi (gap 197). | Przy ocenie po bootcie liczyć też `CHOICE_ART` przez `artCauses` (przyczyna `decode`) i pisać jedną linię `console.warn`. Linia w „Obrazki” pozostaje decyzją gapu 197. |

`buildingStart` rzuca nazwanym `RangeError`, który trafia do granicy błędów. `LIFT_V5_BUILDING` tylko podnosi wersję. `backup-v5` i linia migracji w „Zapis gry” są ogólne po `from`. `place` z zakupem bez learnera zachowuje budowlę bez logu, ale to świadoma reguła, a nie awaria. Bez dalszych ustaleń.

### Przekrój bazy

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-2 | `src/scenes/HouseScene.ts` `settle` → `recordFallback(this, 'house', 'drawn')`, `src/ui/artFallbacks.ts` (pierwszy zapis wygrywa) | missing-context | LOW | Skorupa domu nie dotarła, potem „Wróć” → Baza, a skorupa bazy jest w porządku: rekord sesji dalej mówi `house: 'drawn'`. Dziś jedyny czytelnik to hook e2e, więc szkody nie ma. Gdyby rekord trafił do „Obrazki” (FU-H 5), opisywałby budowlę, której dziecko już nie ogląda. | Kluczować rekord id budowli (`house:base-1`) albo czyścić go w `HouseScene.create`, zanim pojawi się linia w panelu. |

Sprawdzone bez ustaleń:
- `create` zeruje `artQueued`/`artSettled`, więc nowa budowla dostaje własne ładowanie.
- `art()` filtruje `onFail`/`onAdd` do kluczy budowli.
- Przycisk „Baza” jest ukryty dla budowli bez geometrii. `pl.house.open` ma oba id, sprawdzane w `tests/houseCells.test.ts`.

### Hangar

Bez nowych ustaleń. Sprawdzone:
- `moveAfterDone` woła `ensure([hangar])` i `refreshHealth(hangar)`, więc rekord przechodzi na Hangar natychmiast i zostaje zapisany po rozliczeniu ładowania.
- Każdy nieudany plik daje `loadErrorLine('room', …)`.
- Plik, który nie przeszedł w tej sesji, nie jest pobierany ponownie (brak pętli).
- Reset `pending` w `attachLoader` usuwa zawieszony stan po zatrzymaniu `UIScene` przez „Wróć”.
- Zapis z ukończonym Mostkiem przy starcie przenosi remont do Hangara z `console.info('Renovation moved from bridge to hangar')`. Pokrywa to fixture `save-v6-bridge-done.json`.
- Smoke deployu po #129: `precache covers room pictures — 100 of 100`.

## 6. Zalecana kolejność poprawek

1. **M-1:** jedna zmiana warunku w `UIScene.create` (albo zerowanie rekordu w `backToChoice`) plus test wiringu. Usuwa jedyny przypadek, w którym panel rodzica mówi nieprawdę o bieżącym pokoju przez całą sesję.
2. **L-1 razem z L-1 z PR #122:** wspólna linia „nie zdekodowano” dla obrazków ładowanych poza oceną bootu (karty wyboru, skorupa domu i bazy). Jeden helper obok `artCauses`.
3. **L-2:** przy następnej zmianie, która pokaże rekord domu w „Obrazki” (FU-H 5).

## 7. Zmiany od ostatniego audytu

| Poprzedni id | Status | Dowód |
|---|---|---|
| PR #122 L-1 (skorupa nie dekoduje się → tylko linia Phasera) | still open, rozszerzone | `HouseScene.loadArt` bez zmian w `onFail`; dotyczy teraz też `base-1-shell`/`base-1-cell-closed` |
| PR #122 L-2 (utrata kontekstu WebGL bez śladu, `captured === false` jako `live`) | not re-checked | `HouseView.render` zmienił tylko rysowanie zaślepki i dachu; `roomCapture.ts` bez zmian |
| PR #122 L-3 (`houseWakeVisit` → `null` bez logu) | still open | `houseCells.ts` dodał tylko `houseArtKeys` |
| PR #119 L-1 („Obrazki” z rekordem poprzedniego pokoju w oknie ładowania) | still open, zaostrzone | to samo okno przy „Dalej” do Hangara. M-1 to nowy, dłuższy wariant tej samej przyczyny |
| PR #119 L-2 (nieznany dom / pokoje spoza danych tylko w konsoli) | still open | `start` zmienił tylko naprawę `currentRoom`; `HouseScene.geometry` nadal po cichu wraca do `house-1` |
| PR #119 L-3 (`ensure` bez loadera cicho) | still open | `ensure` bez zmian; `UIScene.create` woła `ensure` po `attachLoader`, więc dziś nieosiągalne |
| 2026-10-25 L-2 (przedział maski 5–30 %) | not re-checked | `recolour-board.py` bez zmian; `make-task-art.mjs` dostał wiersz Hangara |

## 8. Metoda i ograniczenia

- **Wykonanie:** w jednym wątku, bez subagentów (decyzja niżej). Przeczytany pełny diff `fc13e8c..aa95f72` w `src/`. Ręcznie sprawdzone: `roomArtLoader` w całości, `HouseScene` (`create`, `render`, `geometry`, `loadArt`, `settle`), wywołania `refreshHealth`/`ensure` w scenach, zakres `backup-v${from}` i `readBackups` (`src/storage/idb.ts`), `pl.house.open`, fixtures v5/v6, liczniki przeglądu na obu commitach.
- **Weryfikacja M-1:** prześledzone ręcznie, krok po kroku, na kodzie `aa95f72`:
  1. Boot nowej instalacji ma `total 0`, więc `UIScene.create` woła `refreshHealth(salon)` i salon dostaje rekord.
  2. `backToChoice` zatrzymuje UI.
  3. Nowe `UIScene.create` widzi `total ≠ 0` i pomija `refreshHealth`.
  4. W `onComplete` warunek `room === current` jest fałszywy dla Mostka, więc jego rekord nie powstaje.

  Brak testu jednostkowego ani e2e tego przejścia (`grep refreshHealth tests/` → tylko `roomArtLoader.test.ts`, `celebrationWiring.test.ts`).
- **Nieudowodnione (tylko statycznie):** rzeczywiste okno M-1 na tablecie; zachowanie loadera `UIScene` po restarcie sceny w przeglądarce (opis z kodu Phaser 4.2.1 i komentarza w `attachLoader`); dekodowanie uszkodzonego WebP karty wyboru w Safari/iPadOS; migracja v5 → v6 między dwoma prawdziwymi buildami (dowód tylko na fixtures i szwie `?e2eSave=v5-salon`); zawartość konsoli tabletu na produkcji (brak telemetrii z założenia).
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (`area_source: arguments`), bez pytania (kontrakt runu, reguła 1). Odrzucona rotacja obszarów. Zmieniłoby to: polecenie kroku bez obszarów.
- **Dowód w czasie działania:** nie uruchomiony (`runtime_proof: not-run`), bo krok zadał audyt statyczny. Zmieniłoby to: `--runtime` w poleceniu albo ustalenie CRITICAL/HIGH wymagające dowodu.
- **Bez subagentów:** zamiast domyślnego rozdzielenia na 3 audytorów obszarów i audytora infrastruktury. Powód: diff to 32 pliki / ~640 linii, a tracker, granica błędów, `src/pwa/` i `.github/` są bez zmian od PR #119. Tak samo postąpiły dwa poprzednie audyty tego wątku. Zmieniłoby to: diff w granicy błędów, zapisie (poza jedną migracją) lub deployu, albo ponad ~2 tys. linii.
- **`previous_report`:** raport z PR #122 (najnowszy commit tego wątku, niescalony); raport PR #119 cytowany w § 7. Zmieniłoby to: zamknięcie #122 bez scalenia.
- **Waga M-1 jako MEDIUM, nie LOW:** w odróżnieniu od L-1 z PR #119 stan nie poprawia się sam po rozliczeniu ładowania, tylko trwa do „Dalej” albo ponownego startu. Konsola ma linie per plik, więc nie jest to HIGH. Zmieniłoby to: obserwacja, że ścieżka „Wróć” → inna budowla jest w praktyce nieużywana (wtedy LOW).
- **Gap 197 nie jest nowym ustaleniem samym w sobie:** L-1 dotyczy tylko przyczyny „nie zdekodowano” w konsoli. Brak linii w „Obrazki” to świadoma decyzja opiekuna.
