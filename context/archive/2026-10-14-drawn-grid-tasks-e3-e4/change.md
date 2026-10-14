---
change_id: drawn-grid-tasks-e3-e4
title: Zadania na siatce (kwadrat magiczny, kodowanie pól, obwody) i „ustaw zegar” przeciąganiem wskazówek
status: archived
created: 2026-10-14
updated: 2026-10-14
archived_at: 2026-10-14T16:33:04Z
---

## Notes

Slice roadmapy **S-13b** (etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`, gałąź
`feat/drawn-grid-tasks-e3-e4` cięta z `main` @ `9554e96` (po poprawce save-reason-and-recovery, PR #48).

- **Outcome (roadmapa):** dziecko rozwiązuje kwadrat magiczny (E3.5), zadania na siatce z kodowaniem pól (E3.7) i
  obwody figur na siatce (E4.7) oraz ustawia zegar przeciąganiem wskazówek (CLOCK, E3–E4).
- **PRD:** FR-023 (typy grup 2–3 z widżetami rysowanymi w kodzie; E3–E4 najpierw; „pełny zestaw typów” to kryterium
  końca M6, nie tego slice'a).
- **Katalog (`docs/ZADANIA.md`):** § 3 kroki E3.5 (PUZZLE_GRID, LENGTH), E3.7 (GRID, EVEN_ODD, NUMBER_WORDS), E4.7
  (CAPACITY, LENGTH, PERIMETER), E5.12 (LENGTH, PERIMETER „bok z obwodu”), E6.3 (MASS, LENGTH, PERIMETER „figury
  złożone na kratkach”); § 4 typy **PUZZLE_GRID** (kwadraty magiczne, piramidy, trójkąty liczb, „uzupełnij pole, żeby
  sumy się zgadzały”, od E3), **GRID** (droga po kratkach wg strzałek E1–E2; pole A1… E3, E5), **PERIMETER** (kwadrat,
  prostokąt, trójkąt z podanymi bokami E4; bok z obwodu E5; figury złożone na kratkach E6), **CLOCK** („odczyt (wybór z
  3) lub przeciąganie wskazówek”; E1–E3 pełne godziny, E3 także 24-godz., E4 minuty co 5, kwadrans, pół; E5–E6 dowolne).
- **Kontrakt runu** § S-13b: blok roadmapy + follow-upy S-13 z `Trigger: S-13b`; siatka i „ustaw zegar” rysowane w
  kodzie; dołożenie umiejętności do E3.5/E4.7 (i E3.7) zmienia progi odblokowania — plan ma to powiedzieć. § All slices:
  `src/core` czyste, testy najpierw, teksty w `src/data/pl.ts`, liczby w `balance.ts`, teacher read, bez `docs/zrodla/`,
  szwy e2e tylko w buildzie z hookiem (znacznik w `vite/e2eHookGuard.mjs`), bez zmian w `deploy/`, `designs/`,
  `.gitignore`, `.claude/`.
- **Wzorce:** `context/archive/2026-10-14-art-tasks-all-stages/` (nowe rodzaje `TaskVisual` + generatory + widżety,
  tabela „Roadmap claims”), `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/` (S-13: `Task.input`, tryby `select`/
  `drag`, `blockDrag`, decyzja 1, która wydzieliła ten slice).
- Plik lekcji w `context/foundation/` nie istnieje (sprawdzone).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/drawn-grid-tasks-e3-e4` @ `9554e96` (blok S-13b pisany przy planie S-13, przed S-14,
poprawką art-stand-in i save-reason-and-recovery).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-13 | Done (PR #40), potem S-14 (PR #41), art-stand-in (#44), save-reason-and-recovery (#48). `TaskVisual` ma 9 rodzajów (`clock`, `ruler`, `blocks`, `bars`, `money`, `scale`, `jugs`, `thermometer`, `icons`; `src/core/tasks/visual.ts`), żadnego dla siatki ani kwadratu magicznego. Rejestr (`src/core/tasks/registry.ts`): 32 typy, brak PUZZLE_GRID, GRID, PERIMETER. | Bez korekty zależności; nowy rodzaj (lub rodzaje) `TaskVisual` dla siatki dochodzi tutaj. |
| „E3.5 kwadrat magiczny” | E3.5 ma 1 umiejętność (`E3.5.length_ruler_cm_15`), `childName` „Mierzenie odcinków”, próg `ceil(0.5·1)` = 1. | Każda dodana umiejętność PUZZLE_GRID podnosi próg (2 umiejętności → 1, 3 → 2); `childName` trzeba rozszerzyć o kwadrat magiczny (tekst w danych). |
| „E3.7 zadania na siatce z kodowaniem pól” | E3.7 ma 3 umiejętności (EVEN_ODD tiles, EVEN_ODD select, NUMBER_WORDS tiles), próg 2; `childName` „Parzyste i liczby słowami”. | Kontrakt mówi o E3.5/E4.7, ale E3.7 też zmienia próg (4 → 2, 5 → 3); `childName` do rozszerzenia. |
| „E4.7 obwody figur na siatce” | E4.7 ma 4 umiejętności (2 LENGTH, 2 CAPACITY z S-14), próg 2. | +1 PERIMETER → próg 3; +2 → 3. Plan podaje liczby. |
| Risk: „Plan S-14 dokłada PERIMETER w E5.12 i E6.3” | E5.12 i E6.3 mają `skills: []` (nie są grywalne, brak `childName`). Outcome w „At a glance” mówi tylko E3–E4. | PERIMETER w E5.12 („bok z obwodu”) i E6.3 („figury złożone na kratkach”) w zakresie (decyzja 2) — to dwa **nowe kroki grywalne**: `childName`, zmiana `playableSteps`/`calendarStart`/puli „earlier” w E5 i E6. Wariant tekstowy LENGTH tych kroków (skala, wyrażenia dwumianowe) i MASS E6.3 zostają w S-14c. |
| „ustaw zegar” to drugi typ `drag` | Tryb `drag` istnieje, ale całe okablowanie jest pod klocki: `TaskScene.render` woła `dragKinds(typeof task0.answer === 'number' ? task0.answer : 0)`, widżet `BlockMat`, reduktor `src/core/blockDrag.ts` (`BlockKind` = hundred/ten/one), hook e2e `mat`, helper `buildOnMat`. CLOCK (`src/core/tasks/generators/clock.ts`) jest tylko do odczytu (`tiles`) w E3.3, E3.11, E4.3; `clockHandAngles` jest w `src/core/round/pictureLayout.ts`. | „Drugi typ `drag`” wymaga rozgałęzienia trybu `drag` po rodzaju zadania (klocki vs wskazówki) — inaczej zadanie zegara po cichu dostaje tacę klocków (audyt S13-04, poniżej). Nowy czysty reduktor kąta w `core` (przyciąganie do pełnych godzin w E3, do 5 minut w E4). |
| Unknowns: „gest kątowy wskazówek na tablecie (przyciąganie do 5 minut)” | Brak jakiegokolwiek reduktora kątowego; istnieją wzorce `longPress`, `blockDrag` (próg `balance.blockDrag.startDistance`), `roomGesture`. | Bez korekty — to główna niewiadoma dla `/10x-research`: która wskazówka pod palcem, czy godzinowa porusza się z minutową, przyciąganie, pewność dotyku ≥ 96 px. |
| „PUZZLE_GRID, GRID i PERIMETER dzielą jeden widżet siatki (`square-grid.svg`)” | Kit `designs/martynka-maths-A-v1/reference/square-grid.svg` + `helper-metadata.json` `grid` (8 × 5, komórka 48, wielokąty na węzłach) pokazuje tylko kratkę z figurami. | Prawda dla GRID i PERIMETER. Kwadrat magiczny (3 × 3 pola z liczbami, jedno puste) nie ma widoku w kicie → DESIGN-GAP; może współdzielić rysunek kratki, ale pola z liczbami to inny układ (decyzja 3). |
| Status `proposed`, Parallel with S-15 | Run idzie szeregowo; S-15 następny w tym runie. | Status zmieni orkiestrator / archiwum. |

## Scope (propozycja dla `/10x-research` i `/10x-plan`)

| Typ | Kroki | Rysunek | Tryb odpowiedzi (do potwierdzenia w research) |
|---|---|---|---|
| PUZZLE_GRID | E3.5 (kwadrat magiczny 3 × 3 do 20–30, jedno lub dwa puste pola; ew. piramida) | pola liczb w kodzie (DESIGN-GAP) | keypad |
| GRID | E3.7 (pole A1…: „jaka litera i liczba?” / „co leży na polu B3?”) | `square-grid.svg`: kratka + oznaczenia kolumn (litery) i wierszy (cyfry) | tiles (napis „B3” albo nazwa przedmiotu) |
| PERIMETER | E4.7 (kwadrat, prostokąt, trójkąt z bokami), E5.12 (bok z obwodu), E6.3 (figury złożone na kratkach) | `square-grid.svg`: wielokąty na węzłach, długości boków przy krawędziach | keypad |
| CLOCK „ustaw” | E3.3 (pełne godziny), E3.11 (24-godz.: „15.00 — ustaw”), E4.3 (co 5 min, kwadrans, pół) | `ClockFace` + uchwyty wskazówek | `drag` (nowa gałąź: wskazówki) |

Poza zakresem: GRID „droga wg strzałek” (E1–E2, kroki E1/E2 nie mają typu GRID), GRID E5 (żaden krok E5 nie ma typu
GRID), LENGTH/MASS tekstowe E5.12/E6.3 (S-14c), BONDS z parami i CHOOSE_OP z obrazkiem (S-14d).

## Design source and copy (profile § 6)

- **Kit, który slice wiąże:** `designs/martynka-maths-A-v1/style-guide.md` § „Code-drawn helpers” (kontury 4 px,
  wewnętrzne kratki i drobne kreski 2 px, kość słoniowa / teal / dąb, „distinguish active positions with geometry as
  well as colour”; wartości z `reference/helper-metadata.json`) i § „Font and spacing” (cele dotyku ≥ 96 px, prawdziwe
  `−`, polecenia 64 px, obliczenia 112 px); `reference/square-grid.svg` + `helper-metadata.json` `grid` (siatka, figury
  na węzłach — GRID i PERIMETER); `reference/clock.svg` + `helper-metadata.json` `clock` (60 kresek, kąty wskazówek —
  ten sam `ClockFace` co w S-13); ekrany `screenshots/task-keypad.png`, `task-tiles.png` (układ zadania z rysunkiem).
- **DESIGN-GAP (nowe wiersze `docs/design-gaps.md`, od 73):** kwadrat magiczny / piramida (brak widoku pól z liczbami
  i pustym polem); oznaczenia pól siatki (litery kolumn, cyfry wierszy — `square-grid.svg` ich nie ma) i przedmioty na
  polach; długości boków przy krawędziach figury; uchwyty wskazówek, stan „trzymam wskazówkę” i przycisk „OK” dla
  zegara do ustawienia; rysunek siatki w fazie rozwiązania obok klawiatury (S-13 O2 / S-14 O1, 190 px).
- **Klucze tekstów (`src/data/pl.ts`, `pl.tasks.*`):** nowe dla poleceń, podpowiedzi i kroków rozwiązania PUZZLE_GRID,
  GRID, PERIMETER i „ustaw zegar” (np. `clockSetPrompt`; dziś istnieje tylko `clockHandsHint`); `childName` E3.5, E3.7
  (rozszerzone) i nowych kroków grywalnych E5.12, E6.3. Rzeczowniki w poleceniach (np. „bok”, „pole”, przedmioty na
  polach siatki) z biernikiem w `src/data/nouns.ts`. Teacher read `npm run sample -- E3|E4|E5|E6 --count 6`.

## Migration expected?

**Nie.** Format zapisu zostaje v1 (`src/core/save.ts` `SAVE_VERSION = 1`, fixtures `tests/fixtures/save-v1*.json`
nietknięte; v2 przyjdzie w S-15). Nowe umiejętności nie mają wpisów w `mastery`/`streak` (= 0), `validateSave`
sprawdza kształt, nie listę ID. Skutki bez migracji: wyższe progi odblokowania E3.5, E3.7, E4.7 dla dziecka zapisanego
na tych krokach (wolniej, nic nie ginie) i dwa nowe kroki grywalne w E5/E6 (`floorToCalendar`, pula „earlier”). Stan
przeciągania wskazówek jest stanem sesji. Co zmieniłoby odpowiedź: potrzeba zapisania przykładu pomyłki dla `drag`
(obiekt godzina/minuta) w widoku rodzica — wtedy czekamy na v2 (follow-up S-13 „first save-format change”).

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| PUZZLE_GRID, GRID, PERIMETER i „ustaw zegar” poza S-13; CLOCK tylko do odczytu. `Trigger: S-13b` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** — to ten slice. |
| BONDS z parami i CHOOSE_OP z obrazkiem. `Trigger: S-13b or S-14` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Poza** → S-14d (E1, nowe gesty; S-14 już przypisał je do S-14d). Przenieść trigger przy archiwum. |
| S13-01…S13-14 (audyt obserwowalności 2026-10-14: rozwiązywalność `select`/`drag`, S13-07 błędy generatora bez `skill.id`). `Trigger: the next select/drag skill or S-13b` | `2026-10-14-art-stand-in-and-load-signal` | **W zakresie: S13-01…S13-04** (nadal otwarte: `round.ts` `isCorrect` porównuje `===` bez `check`; `TaskScene.render` `dragKinds(… : 0)`; `validateTask` pomija tablice; `generateTask.test.ts` pomija `select`) — „ustaw zegar” to pierwszy `drag` z odpowiedzią nieliczbową, więc pułapka `retype` przestaje być latentna. Test „rozwiązywalne w swoim trybie” dla każdej umiejętności + rzut w `core` dla nieznanej gałęzi `drag`. **S13-07** (`skill.id` w błędzie generatora) — tanie, w zakresie przy nowych parserach. **S13-08** (`belowPrompt` zeruje wysokość obrazka) — w zakresie, jeśli siatka dostaje długie polecenia. **S13-09** (`blockDrag` `down` z tym samym `pointerId`) — wzór dla reduktora wskazówek; poprawka w `blockDrag` tylko gdy reduktory się łączą. Pozostałe (S13-05, S13-06, S13-11…14) poza; S13-06 czeka na v2. |
| `pictureLayout` wysyła `select`/`drag` do obszaru kafelków nachodzącego na `TASK_LAYOUT.select.top`. `Trigger: the first select or drag skill with a visual` | `2026-10-13-drawn-widget-tasks-e3-e4` (S-14 przewidział zamknięcie przez MONEY_PAY, które odłożono do S-14d) | **W zakresie** — „ustaw zegar” to pierwszy `drag` z rysunkiem. |
| `TaskScene.create` → `pointerupoutside` jako `cancel`, bez e2e. `Trigger: next change to the drag wiring in TaskScene` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** — gałąź wskazówek zmienia okablowanie; reguła `cancel` musi objąć nowy reduktor (test jednostkowy). |
| `adaptive.spec` blisko limitu 180 s przy `drag` w E4. `Trigger: … the next change adding drag skills to E4` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Wyzwolony**, jeśli „ustaw zegar” wejdzie do E4.3 (decyzja 4: tak) — e2e helper ustawiania zegara musi być szybki (jedna sesja CDP), pomiar czasu spec w bramce. |
| O2 / O1: rysunek w fazie rozwiązania przy klawiaturze 190 px (`TASK_LAYOUT.picture.keypadSolution`). `Trigger: next change to pictureLayout / the solution layout beside the keypad` | `2026-10-13-drawn-widget-tasks-e3-e4`, `2026-10-14-art-tasks-all-stages`, `2026-10-14-art-stand-in-and-load-signal` | **Wyzwolony warunkowo** — PERIMETER/PUZZLE_GRID na klawiaturze z siatką w fazie rozwiązania; plan rozstrzyga, czy siatka mieści się w 190 px (długości boków czytelne), inaczej zmiana `keypadSolution`. |
| M-1, M-2, M-13, H-3, H-4 (`TaskScene` cykl rundy / lektor). `Trigger: next change to TaskScene / narrator` | `2026-10-13-observability-c1-c2` i nast. | **Nie wyzwolony** co do treści — slice zmienia `TaskScene.render`/okablowanie przeciągania, nie `beginRound`/`finishRound`/`applyParentStage`; impl-review sprawdza diffem. |
| `ArtPool`/`fitRect`, S14-09/S14-10. `Trigger: S-14b or the next widget built on ArtImage` | `2026-10-14-art-tasks-all-stages`, `2026-10-14-art-stand-in-and-load-signal` | **Nie wyzwolony** — siatka i zegar rysowane w kodzie, bez `ArtImage`. |

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Odrzucone: `/10x-plan` (domyślne w skillu), `/10x-frame`.
   Dlaczego: kontrakt runu i polecenie kroku ustalają `/10x-research drawn-grid-tasks-e3-e4`; są realne niewiadome
   (gest kątowy, rozgałęzienie trybu `drag`, solvability S13-01…04, układ kwadratu magicznego). Co zmieniłoby
   odpowiedź: nic w tym runie (polecenie kroku nadpisuje rekomendację skilla).
2. **PERIMETER w E5.12 i E6.3 w zakresie.** Odrzucone: tylko E4.7 (dosłowny outcome w „At a glance”). Dlaczego: blok
   S-13b (Risk) i decyzja 1 S-14 już przypisały te kroki do tego slice'a, widżet i generator są te same, a S-14c ich
   nie obejmuje — bez tego E5.12 i E6.3 zostałyby puste. Co zmieniłoby odpowiedź: research pokazuje, że „figury złożone
   na kratkach” (E6.3) potrzebują innego modelu figur niż wielokąty E4 albo plan przekracza ~10 faz — wtedy E6.3
   PERIMETER idzie do follow-upu z `Trigger: S-14c`.
3. **Kwadrat magiczny jako osobny układ pól (nie kratka `square-grid.svg`), DESIGN-GAP.** Odrzucone: wymuszenie
   wspólnego widżetu dla wszystkich trzech typów (roadmapa). Dlaczego: kit pokazuje tylko kratkę z figurami; pola z
   liczbami i pustym okienkiem to inny rysunek, wspólne mogą być tokeny i rysowanie linii. Co zmieniłoby odpowiedź:
   research znajdzie w paczkach (`designs/`) widok pól liczbowych albo wspólny widżet okaże się prostszy w kodzie.
4. **„Ustaw zegar” w E3.3, E3.11 i E4.3 (wszystkie kroki z CLOCK w E3–E4).** Odrzucone: tylko E3 (pełne godziny,
   łatwiejszy gest) i wyłącznie nowe kroki. Dlaczego: ZADANIA § 4 opisuje przeciąganie dla całego typu CLOCK, a
   przyciąganie do 5 minut to wprost niewiadoma z roadmapy (E4). Konsekwencja: E3.3 (2 → 3 umiejętności, próg 1 → 2),
   E3.11, E4.3 zmieniają progi; `adaptive.spec` wyzwolony. Co zmieniłoby odpowiedź: research/test na tablecie pokaże,
   że gest co 5 minut jest zbyt precyzyjny dla 8-latka (cel < 96 px między pozycjami) — wtedy E4.3 dostaje tylko
   kwadranse/pół godziny albo „ustaw” zostaje w E3, a E4 w follow-upie.
5. **S13-01…S13-04 w zakresie (rozwiązywalność w trybie).** Odrzucone: zostawić je jako follow-up. Dlaczego: trigger
   wprost nazywa S-13b, a pierwszy `drag` z odpowiedzią nieliczbową zamienia latentną pułapkę `retype` w realną
   (dziecko bez „Dalej”). Co zmieniłoby odpowiedź: research pokaże, że odpowiedź zegara da się wyrazić liczbą
   (np. minuty od 12.00) z `check` i rozgałęzieniem po `visual.kind` — wtedy S13-01/S13-03 nadal w zakresie (tani
   test), a S13-04 zamknięty samym rozgałęzieniem.
6. **Format zapisu zostaje v1.** Odrzucone: zapisywanie przykładu pomyłki `drag`/`select` (wymaga v2). Dlaczego:
   kontrakt (v2 dopiero w S-15), nic w zakresie nie wymaga trwałego stanu. Co zmieniłoby odpowiedź: plan uzna widok
   pomyłek rodzica za konieczny dla zegara — wtedy follow-up z `Trigger: S-15 save format v2`.
