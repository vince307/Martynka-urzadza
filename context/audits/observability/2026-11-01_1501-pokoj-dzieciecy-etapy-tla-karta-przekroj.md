---
type: observability-audit
date: 2026-11-01 15:01
mode: audit
commit: e451fa8
branch: docs/observability-audit-2026-11-01-kids-room
dirty_tree: false
areas: [kids-room-stages-scenekey-stagefade-purchase, room-done-card-three-tiles-house-cross-section-upper-left, room-art-stand-in-roomartloader-save-v6-kitchen-done]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-11-01_1043-wybor-budowli-przekroj-bazy-hangar.md
findings: { critical: 0, high: 0, medium: 0, low: 1 }
---

# Audyt obserwowalności: pokój dziecięcy, etapy tła, karta i przekrój (2026-11-01)

Ten raport zamyka run `2026-11-01-kids-room`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #133 | S-25 `kids-room` (pokój dziecięcy, trzy etapy tła) | `e451fa8` |

Audyt jest statyczny, bez `--runtime`. Obszary z argumentów kroku:

- **Etapy tła i zakupy:** `sceneKey` i `stageFade` (`src/core/rooms.ts`), `RoomView.render` (`backgroundKey`, `drawBackdrop`), `miniaturePieces`, `RoomScene.fadeStage` (duchy, `ghostTweens`), `backdropMode` (`src/core/backdrop.ts`), dane `CHILDREN` (`src/data/rooms.ts`, zadania `stage` z polem `scene`).
- **Karta „Pokój gotowy!” i przekrój:** `ROOM_DONE_LAYOUT.tiles` (trzy kafelki 340 + 32), `RoomDoneCard`, `roomsListView`, wiersz `{ room: 'children', floor: 1, place: 0 }` w `HOUSES['house-1']`, `houseCells`.
- **Grafika i zapis:** `roomArt` (nowe wpisy etapów z `label: ''`), `bootRoomArt`, `createRoomArtLoader`, `RoomLayer.show` (nowy `labelScale` podpisu zastępczego), „Obrazki” (`artHealthLines`, `missingRoomLabels` w `UIScene`), start z zapisem v6 z ukończoną kuchnią (`start` w `src/main.ts`: `mergeHouse`, `nextRoom`).

Zakres: diff runu `bfdf193..e451fa8` w `src/`, `scripts/`, `vite/`, `deploy/`, `.github/`: 12 plików, +130/−21. `vite/`, `deploy/`, `.github/`, `src/pwa/`, `src/storage/`, granica błędów i zapis są bez zmian. Lokalizacje podaję jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (nowe).** Run nie dodał żadnego `catch`, logu ani nowej ścieżki ładowania. Pokój dziecięcy idzie tymi samymi kanałami co kuchnia: `loadErrorLine('room', …)` dla każdego nieudanego pliku, `Room art missing: …` z kluczami, licznik w „Obrazki” i pudełka zastępcze.
- **L-1:** brakujące tło etapu (`children-stage-1`, `children-stage-2`) rodzic widzi w „Obrazki” tylko jako liczbę. Wpisy tła mają `label: ''`, a `missingRoomLabels` pomija puste etykiety. Dziecko widzi wtedy gładką ścianę w kolorach „po remoncie”, ta sama na etapie 1, 2 i 3. Nazwę pliku zna tylko konsola.
- Otwarte M-1 z poprzedniego audytu (rekord „Obrazki” po „Wróć” i zmianie budowli) się nie zmieniło. Pokój dziecięcy go nie dotyka: kuchnia → pokój dziecięcy idzie przez „Dalej” (`moveAfterDone` → `refreshHealth`) albo przez start z zapisu (`nextRoom` z `console.info('Renovation moved from kitchen to children')`).

## 2. Model przechwytywania (bez zmian względem raportu 2026-11-01_1043)

- **Platforma, tracker, granica błędów:** bez zmian. Gra działa wyłącznie po stronie klienta jako offline PWA (`src/main.ts`), bez trackera i bez sieci w grze. Błąd trafia do człowieka przez ekran dziecka, karty DOM z `Kod:` (`installErrorBoundary`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsolę tabletu oraz CI i smoke deployu (24/24 przy #133, „123 of 123 room pictures precached”).
- **Grafika pokoju:** przy starcie `bootRoomArt(currentRoom)` ładuje tylko pokój w remoncie. Kolejny pokój doładowuje `roomArtLoader` w trakcie gry. Nieudany plik daje `loadErrorLine('room', key, src, status)`, a rozliczenie daje `Room art missing: n of m: <klucze>`. Rekord `REGISTRY_KEYS.roomArtHealth` zasila licznik i listę etykiet w „Obrazki” (limit `balance.artHealth.labelCap`).
- **Nowe w runie:** brak nowych sygnałów. `fadeStage` cicho pomija ducha, gdy tekstura `fade.from` nie istnieje. To zgodne z resztą warstw, bo brak tekstury jest już policzony przy ładowaniu.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | bfdf193 | e451fa8 |
  |---|---|---|
  | linie z `catch` | 70 | 70 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 |
  | `console.error` | 9 | 9 |
  | `console.warn` | 62 | 62 |
  | `console.info` | 6 | 6 |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Mebel pokoju dziecięcego 404 / limit | pudełko z podpisem (np. „regał na książki Naturalny”, zmniejszonym przez `labelScale`) | „Obrazki”: licznik + „Brakuje: …” | `loadErrorLine('room', …)`, `Room art missing` | widoczne |
| Tło etapu 1 lub 2 404 | gładka ściana „po remoncie”, bez różnicy między etapami | „Obrazki”: tylko licznik, bez nazwy | `loadErrorLine('room', …)` z kluczem `children/children-stage-1` | **tylko liczba** (L-1) |
| `children-stage-0` (`before`) 404 | gładka ściana „przed remontem” | licznik | jak wyżej | jak przed runem (tło salonu i kuchni też bez etykiety) |
| Plik 200, nie dekoduje się | pudełko lub ściana | licznik po `textures.exists` | `artCauses` / ogólna linia Phasera | jak przed runem |
| Brak tekstury przy przenikaniu etapów | brak przenikania, od razu nowy obraz | — | — | benign, policzone przy ładowaniu |
| Pokój z danych bez komórki w geometrii przekroju | komórka nie pokazuje pokoju | — | — | nieosiągalne dziś (`children` → `upper-left`, test `houseCells`); ta sama klasa co L-2 z PR #119 |
| Czwarty pokój na karcie „Pokój gotowy!” | kafelki wyszłyby poza kartę | — | **CI**: `tests/layout.test.ts` (`n` liczone z `HOUSES`, `expect(n).toBe(3)`) | złapane przed wydaniem (gap 204, follow-up z wyzwalaczem S-31) |
| Zapis v6 z ukończoną kuchnią | start w pokoju dziecięcym | — | `Renovation moved from kitchen to children` | widoczne; fixture `save-v6-kitchen-done.json` |

## 4. Systemowe przyczyny źródłowe

1. **Etykieta zastępcza jest jednocześnie nazwą dla rodzica.** `RoomArtEntry.label` służy podpisowi pudełka i liście „Brakuje: …”. Obrazy całej sceny mają `label: ''`, bo zastępuje je ściana bez podpisu, więc wypadają też z listy dla rodzica. Przed runem dotyczyło to trzech obrazów na pokój. W pokoju dziecięcym to pięć z 23 plików, a dwa z nich istnieją tylko po to, żeby etapy różniły się wyglądem. Wyjaśnia L-1.
2. **(Odziedziczone, otwarte)** rekordy zdrowia są globalne dla sesji (M-1 i L-2 z raportu 2026-11-01_1043). Run ich nie zmienił.

## 5. Ustalenia według obszarów

### Etapy tła i grafika pokoju

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-1 | `src/data/roomArt.ts` `roomArt` (wpisy etapów z `label: ''`), `src/scenes/UIScene.ts` `missingRoomLabels` (filtr `entry.label !== ''`), `src/ui/widgets/RoomView.ts` `drawBackdrop` (kolor tylko z `stagesDone > 0`) | missing-context | LOW | Wdrożenie bez pliku `children-stage-1.webp` (smoke HEAD by to złapał, więc realnie: plik obcięty limitem ładowania albo nie zdekodowany). Dziecko kupuje „Posprzątaj pokój” i widzi gładką ścianę. Po „Pomaluj ściany” i „Odnów podłogę” zmienia się to dopiero przy trzecim etapie, gdy przyjdzie `children-after`. Rodzic w „Obrazki” widzi „brakuje 1 z 23” bez nazwy. Plik nazywa tylko konsola tabletu. | Dać obrazom sceny etykietę tylko do listy rodzica (np. `pl.room.sceneLabel` „tło: Posprzątaj pokój” z zadania etapu) i rozdzielić ją od podpisu pudełka. Test: brak `children/children-stage-1` daje wpis w `missingRoomLabels`. |

Sprawdzone bez ustaleń:
- `sceneKey` i `stageFade` są czyste i nie rzucają. Zadanie `stage` bez `scene` wraca do `scene.after`.
- `roomArt` dodaje klucze etapów raz i nigdy nie dubluje kluczy ról, więc precache, `roomArtCheck` deployu i ocena „Obrazki” widzą wszystkie pięć obrazów sceny (smoke: 123 z 123).
- `fadeStage` sprząta `ghostTweens` przy zakończeniu (follow-up salon-style F4 zamknięty), a `clearGhosts` przy wyjściu.
- `backdropMode` czyta ten sam `sceneKey`, więc tło za notesem przechodzi w `plain` dokładnie wtedy, gdy brakuje obrazu bieżącego etapu.
- `RoomLayer.show` tylko skaluje podpis i nie zmienia oceny brakującej tekstury.

### Karta „Pokój gotowy!” i przekrój domu

Bez ustaleń. Szerokość kafelków to dane (`ROOM_DONE_LAYOUT.tiles`). Test `tests/layout.test.ts` liczy największą listę pokoi z `HOUSES` i padnie w CI, zanim czwarty pokój (S-31) wyjdzie poza kartę. `children` ma komórkę `upper-left` w obu geometriach. Przekrój po ukończeniu kuchni otwiera ją przez `houseCells`, a ładowanie skorupy nie zmieniło się w runie.

### Zapis v6 z ukończoną kuchnią i ładowanie w trakcie gry

Bez ustaleń:
- `mergeHouse` dokłada `children` z danych do zapisanego domu.
- `nextRoom` przenosi remont z wpisem `console.info`.
- Format zapisu się nie zmienił (`SAVE_VERSION` 6, brak migracji).
- „Dalej” z kuchni woła `ensure([children])` i `refreshHealth(children)` przez niezmieniony `moveAfterDone`.
- Pokój dziecięcy (862 KB) nie przekracza budżetu bootu (`tests/bootBudget.test.ts`).

## 6. Zalecana kolejność poprawek

1. **M-1 z raportu 2026-11-01_1043** (nadal otwarte): jedyny przypadek, w którym „Obrazki” mówi nieprawdę o bieżącym pokoju przez całą sesję.
2. **L-1:** etykieta obrazów sceny dla rodzica. Warto ją zrobić przed S-32 (kuchnia w etapach), bo wtedy kolejne pokoje dostaną obrazy etapów.
3. Reszta otwartych LOW bez zmian (§ 7).

## 7. Zmiany od ostatniego audytu

| Poprzedni id | Status | Dowód |
|---|---|---|
| 2026-11-01_1043 M-1 („Obrazki” po „Wróć” i zmianie budowli) | still open | `UIScene.create` nadal woła `refreshHealth` tylko przy `roomArtHealth.total === 0`; `UIScene.ts` i `roomArtLoader.ts` bez zmian w runie |
| 2026-11-01_1043 L-1 (karta wyboru nie dekoduje się → ogólna linia Phasera) | not re-checked | `WelcomeScene`, `ChoiceCard`, `BootScene` bez zmian w runie |
| 2026-11-01_1043 L-2 (`artFallbacks.house` pierwszy zapis wygrywa) | still open | `HouseScene` i `artFallbacks.ts` bez zmian |
| PR #122 L-1 (skorupa nie dekoduje się) | still open | `HouseScene.loadArt` bez zmian |
| PR #119 L-1/L-2/L-3 | still open / not re-checked | pliki bez zmian w runie |

## 8. Metoda i ograniczenia

- **Wykonanie:** w jednym wątku, bez subagentów (decyzja niżej). Przeczytany pełny diff `bfdf193..e451fa8` w `src/` i `scripts/`. Ręcznie sprawdzone: `RoomScene.fadeStage`/`clearGhosts`, `RoomView.render`/`drawBackdrop`, `roomArt`, `missingRoomLabels`, `artHealthLines`, `mergeHouse`/`houseLayout`, geometria `HOUSE_GEOMETRY`, test kafelków w `tests/layout.test.ts`, follow-upy w `context/archive/2026-11-01-kids-room/follow-ups/review-fixes.md`, liczniki przeglądu na obu commitach.
- **Weryfikacja L-1:** prześledzone na kodzie `e451fa8`:
  1. `roomArt(CHILDREN)` daje `children/children-stage-1` i `-2` z `label: ''`.
  2. `missingRoomLabels` odfiltrowuje puste etykiety.
  3. `artHealthLines` dostaje dla nich tylko licznik.
  4. `drawBackdrop(renovated, missing)` wybiera kolory tylko z `stagesDone > 0`.
- **Nieudowodnione (tylko statycznie):** wygląd pokoju bez obrazu etapu na tablecie (bramka wizualna runu pokazała pudełka mebli przez `?e2eArt=room`, nie brak samego tła etapu); przenikanie etapów na prawdziwym urządzeniu w trybie Canvas; ładowanie grafiki pokoju dziecięcego w trakcie gry na wolnym łączu (e2e tylko lokalnie); przejście z prawdziwego zapisu v6 z ukończoną kuchnią z buildu sprzed #133 (dowód tylko na fixture); zawartość konsoli tabletu na produkcji (brak telemetrii z założenia).
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (`area_source: arguments`), bez pytania (kontrakt runu, reguła 1). Odrzucona rotacja obszarów. Zmieniłoby to: polecenie kroku bez obszarów.
- **Dowód w czasie działania:** nie uruchomiony (`runtime_proof: not-run`), bo krok zadał audyt statyczny i nie ma ustaleń CRITICAL ani HIGH. Zmieniłoby to: `--runtime` w poleceniu.
- **Bez subagentów:** zamiast domyślnego rozdzielenia na 3 audytorów obszarów i audytora infrastruktury. Powód: diff ma 12 plików i ~150 linii, a tracker, granica błędów, zapis, `src/pwa/`, `vite/`, `deploy/` i `.github/` się nie zmieniły. Tak samo postąpiły trzy poprzednie audyty tego wątku. Zmieniłoby to: diff w granicy błędów, zapisie lub deployu, albo ponad ~2 tys. linii.
- **`previous_report`:** `2026-11-01_1043-wybor-budowli-przekroj-bazy-hangar.md` (najnowszy raport na `main`).
- **L-1 jako LOW, nie MEDIUM:** konsola nazywa plik, licznik w „Obrazki” jest prawdziwy, a smoke deployu sprawdza każdy obraz pokoju w precache. Brakuje tylko nazwy dla rodzica. Zmieniłoby to: tło etapu, które psuje się bez śladu w konsoli albo w liczniku.
- **Czwarty kafelek nie jest ustaleniem:** przepełnienie łapie test w CI, zanim trafi na produkcję, a follow-up 1 ma wyzwalacz S-31.
