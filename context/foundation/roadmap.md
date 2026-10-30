---
project: "Martynka urządza"
version: 3
status: draft
created: 2026-10-11
updated: 2026-10-31
prd_version: 4
main_goal: quality
top_blocker: external
milestone_id: ulica-i-domy
milestone_seq: 3
milestone_status: open
---

# Roadmap: Martynka urządza

> Derived from `context/foundation/prd.md` (v4, sekcja „Po v1 — ulica i domy”: FR-032–FR-036, FR-038–FR-041, decyzje autora z 2026-10-30) + decyzje autora w `docs/human-checklist.md` (sekcja „Decyzje 2026-10-30: kształt etapu „ulica i domy””) + auto-researched codebase baseline (potwierdzony 2026-10-30).
> Edit-in-place; archive when superseded. Poprzednie kamienie (M-01 etapy M0–M8, M-02 wysyłki rodzica, odłożony) są w historii gita tego pliku i w `## Milestone History`.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-03: Ulica i domy** — Status: open

- **Intent:** Po salonie dziecko urządza kolejne pokoje pierwszego domu wybierane w przekroju z piętrami, a gdy dom jest gotowy, wprowadzają się mieszkańcy i zostawiają naklejkę do albumu; potem otwiera się ulica z działkami i drugi dom. Nic z salonu nie przepada, gwiazdki z rund pozostają jedyną walutą, nowy pokój lub dom to dane i grafika. Kamień niesie też przeniesiony z M-02 balans po testach z córką (S-17), bo od zmierzonego tempa zależy wielkość ulicy.
- **Source materials:** `context/foundation/prd.md` (v4): FR-032–FR-036 i FR-038–FR-041 z sekcji „Po v1 — ulica i domy”, Open Questions 5 i 11–14; FR-027 dla przeniesionego S-17; `docs/human-checklist.md`, decyzje z 2026-10-30.
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-027 (przeniesione z M-02), FR-032, FR-033, FR-034, FR-035, FR-036, FR-038, FR-039, FR-040, FR-041; US-02 (dziecko urządza za gwiazdki); Guardrails „nic urządzonego nie znika”, „bez fabuły i dialogów”; PRD Open Questions 5, 11, 12, 13, 14.

## Vision recap

Dziecko rozwiązuje rundy zadań matematycznych, zbiera gwiazdki i wydaje je na urządzanie pokoju, wybierając jeden z trzech wariantów każdego elementu. Wersja 4 PRD rozwija nagrodę po salonie: pokoje składają się w dom z piętrami, dom w ulicę, a gotowy dom zamieszkują mieszkańcy; gra nadal działa offline, bez kont, fabuły, sprzedaży i dochodu, a jedynym źródłem gwiazdek są rozwiązane zadania.

## North star

**S-24: Mieszkańcy wprowadzają się do gotowego domu i zostawiają naklejkę** — pierwszy przepływ, który domyka całą nową pętlę nagrody (pokoje → dom → mieszkańcy → pamiątka) i dowodzi, że nowy etap trzyma motywację po salonie (PRD Open Question 5); stoi tak wcześnie, jak pozwalają dwa nowe pokoje i przekrój domu.

> Gwiazda przewodnia (north star) to tutaj: najmniejszy wycinek od ekranu dziecka do zapisu, którego dostarczenie dowodzi, że ta część produktu działa. Cel `quality` ustawia przed nią kontrakt „pokój to dane” i bezstratny zapis domów (F-04), żeby nic z salonu nie przepadło, zanim pojawi się drugi pokój.

## At a glance

| ID    | Change ID            | Outcome (user can …)                                                                 | Prerequisites      | PRD refs                                   | Status   |
| ----- | -------------------- | ------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------ | -------- |
| F-04  | rooms-as-data        | (foundation) dom i pokoje są danymi gry, a zapis niesie dom bez straty salonu        | —                  | FR-032, FR-033, FR-038, PRD Open Question 14 | done |
| S-17  | playtest-balance     | autor dostraja balans w danych gry po obserwacji córki                               | S-16a (M-01, done) | FR-027, Success Criteria (Primary), PRD Open Question 5 | proposed |
| S-22  | kitchen-room         | dziecko po „Pokój gotowy!” urządza kuchnię jak salon, z celebracją pokoju            | F-04               | FR-033, FR-035, FR-040, US-02              | planning |
| S-23  | house-cross-section  | dziecko wybiera pokój w przekroju domu z piętrami; „Do pokoju” zawsze trafia do remontu | S-22            | FR-038, FR-039, FR-033                     | proposed |
| S-25  | kids-room            | dziecko urządza pokój dziecięcy dodany wyłącznie jako dane i grafika                 | S-22               | FR-033, FR-035                             | proposed |
| S-24  | residents-move-in    | gotowy dom zamieszkują mieszkańcy, dziecko dostaje naklejkę do albumu                | S-23, S-25         | FR-034, FR-040, FR-041, FR-035             | proposed |
| S-26  | street-plots         | dziecko widzi ulicę z działkami i urządza drugi dom z innymi pokojami                | S-24, S-17         | FR-032, FR-036, FR-039, FR-040             | blocked  |
| S-27  | district             | po kilku domach otwiera się dzielnica w innym otoczeniu                              | S-26               | FR-036                                     | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                    | Chain                                                    | Note                                                                                              |
| ------ | ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A      | Dom od środka            | `F-04` → `S-22` → `S-23` → `S-24` → `S-26` → `S-27`      | Cel `quality`: kontrakt danych i bezstratny zapis przed drugim pokojem; ulica dopiero po mieszkańcach. |
| B      | Trzeci pokój             | `S-25`                                                   | Joins Stream A at `S-24`; równolegle z `S-23`; dowód, że pokój to tylko dane i grafika.             |
| C      | Balans po testach        | `S-17`                                                   | Przeniesione z M-02; zależy od obserwacji córki, nie od kodu; jego pomiar odblokowuje `S-26`.       |

## Baseline

What's already in place in the codebase as of `2026-10-30` (auto-researched 2026-10-25 + user-confirmed 2026-10-30).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — gra Phaser 4.2.1; silnik pokoju: salon z danych (`src/data/rooms.ts`: zadania remontowe, sloty, 3 warianty), scena pokoju z panelem wariantów, karta „Pokój gotowy!” z kafelkiem „Wkrótce”, miniatura pokoju i tło zeszytu rysowane z żywych warstw; panel rodzica za bramką; wszystkie teksty w `src/data/pl.ts`. Założenia „tylko salon” (cienie kontaktowe, postarzenie wariantu 0, manifest slotów, tabele migracji) są do sprawdzenia (PRD Open Question 14).
- **Backend / API:** absent — serwer podaje tylko statyczne pliki gry; w tym kamieniu nic nie jest potrzebne.
- **Data:** present lokalnie — zapis gry w IndexedDB, format v4 z `rooms`/`currentRoom` i łańcuchem migracji; dom i ulica nie mają jeszcze miejsca w zapisie.
- **Auth:** n/a — bez kont; bramka dla dorosłych to element UI (PRD Access Control).
- **Deploy / infra:** present — GitHub Actions → VPS, gra pod `/graj/` od #115, smoke po wdrożeniu sprawdza grafiki pokoju; limit ładowania startu liczy każdą nową paczkę.
- **Observability:** partial — linie zdrowia w panelu rodzica („Obrazki”, „Zapis gry”); nic nie wychodzi z urządzenia; brak linii dla domu i ulicy.

## Foundations

### F-04: Dom i pokoje jako dane

- **Outcome:** (foundation) pokój da się dodać wyłącznie danymi i grafiką: wszystko, co dziś jest napisane pod salon (cienie, postarzenie, manifest slotów, tabele migracji, karta „Pokój gotowy!”), staje się danymi pokoju; zapis niesie dom z listą pokoi i miejscem każdego pokoju w siatce piętro × miejsce, a salon dziecka przechodzi do pierwszego domu bez straty, z zamrożoną próbką starego zapisu w testach.
- **Change ID:** rooms-as-data
- **PRD refs:** FR-032 (nic z salonu nie przepada), FR-033 (pokój jak salon, z danych), FR-038 (piętra jako dane), PRD Open Question 14
- **Unlocks:** S-22, S-25 (pokoje z danych), S-23 (siatka pięter w zapisie); zamyka PRD Open Question 14.
- **Prerequisites:** —
- **Parallel with:** S-17
- **Blockers:** —
- **Unknowns:**
  - Czy nowy format zapisu (v5) ma już nieść ulicę i dzielnicę, czy tylko dom; za wcześnie zapisana ulica to pole, którego nikt nie czyta, za późno to druga migracja. — Owner: zespół. Block: no (rozstrzyga `/10x-research`).
- **Risk:** stoi pierwszy przy celu `quality`, bo jedna migracja z salonem w środku jest bezpieczniejsza niż dwie; ryzyko: fundament rozrasta się w przepisanie sceny pokoju — jego miarą jest kuchnia w S-22, nie nowa architektura.
- **Status:** done

## Slices

### S-17: Balans po testach z graczem

- **Outcome:** autor po obserwacji gry córki i miarach z historii w zapisie (czas na pokój, odsetek drugich prób per umiejętność) dostraja wyłącznie w danych gry tempo gwiazdek, koszty mebli, progi opanowania i czytelność poleceń; przejście salonu zajmuje sensowny czas, zadania nie są ani za łatwe, ani frustrujące; zmierzony czas na pokój rozstrzyga, ile domów ma ulica (PRD Open Question 11).
- **Change ID:** playtest-balance
- **PRD refs:** FR-027, Success Criteria (Primary), PRD Open Question 5 (motywacja po salonie), PRD Open Question 11 (wielkość ulicy)
- **Prerequisites:** S-16a (M-01, done)
- **Parallel with:** F-04, S-22, S-23, S-25, S-24
- **Blockers:** —
- **Unknowns:**
  - Ile tygodni obserwacji wystarczy, by ocenić kryterium „gra 3 razy w tygodniu przez 4 tygodnie”? — Owner: autor. Block: no.
- **Risk:** przeniesiony z M-01 i M-02; jedyny wycinek, którego „gotowe” zależy od zachowania gracza, nie od kodu; bez jego pomiaru ulica (S-26) zostaje zablokowana.
- **Status:** proposed

### S-22: Kuchnia, drugi pokój z danych

- **Outcome:** dziecko po skończeniu salonu widzi celebrację pokoju (pełne odsłonięcie, wybuch gwiazdek, jedno zdanie lektora, jedno „Dalej”) i przechodzi do kuchni, którą urządza jak salon: ściany i podłoga, potem elementy z 3 wariantami za gwiazdki w kolejności z danych pokoju; w remoncie jest zawsze jeden pokój; dopóki paczka kuchni nie dotrze, kuchnia stoi na rysowanych zastępnikach i nie trafia do dziecka, a z paczką jej dodanie to dane i pliki.
- **Change ID:** kitchen-room
- **PRD refs:** FR-033, FR-035, FR-040 (celebracja pokoju), US-02
- **Prerequisites:** F-04
- **Parallel with:** S-17
- **Blockers:** — (kuchnia jest w `designs/martynka-locations-v2`: przed/po, 6 slotów z manifestem, 3 warianty).
- **Unknowns:**
  - Które elementy kuchni są slotami z wariantami, a które stałą dekoracją, i jakie koszty (suma kuchni względem salonu, by tempo z S-17 miało sens)? — Owner: autor z grafikiem. Block: no (rozstrzygnąć w `/10x-plan` z inwentarzem paczki).
  - Jak karta „Pokój gotowy!” zmienia się w celebrację o trzech natężeniach bez trzech scenek (FR-040)? — Owner: zespół. Block: no.
- **Risk:** pierwszy pokój po salonie i pierwszy pomiar motywacji po nim; ryzyko: nowa paczka przekracza limit ładowania startu (dziś blisko granicy), więc wycinek musi zmierzyć budżet, a nie tylko dodać pliki.
- **Status:** planning

### S-23: Przekrój domu z piętrami

- **Outcome:** dziecko ogląda dom z boku jak domek dla lalek: piętra z danych, każdy pokój jako miniatura rysowana z żywych warstw tak, jak go zostawiło, zamknięte pokoje jako sylwetki „Wkrótce”; dotknięcie pokoju otwiera go w pełnym widoku; „Do pokoju” z zeszytu zawsze trafia do pokoju w remoncie, a przekrój to osobny przycisk, nigdy obowiązkowy przystanek; z każdego poziomu da się wrócić jednym dotknięciem.
- **Change ID:** house-cross-section
- **PRD refs:** FR-038, FR-039, FR-033 (kolejność pokoi z danych)
- **Prerequisites:** S-22
- **Parallel with:** S-25, S-17
- **Blockers:** paczka skorupy domu 1 od grafika (brief `docs/designer-brief-m03.md`, P1) — do jej czasu skorupa rysowana w kodzie.
- **Unknowns:**
  - Czy dziecko wybiera, który z zamkniętych pokoi otworzy się następny, czy kolejność jest tylko danymi domu (PRD FR-033, decyzja 2026-10-30 zostawiła to planowi)? — Owner: autor. Block: no (rozstrzygnąć w `/10x-plan`).
  - Jak miniatury z żywych warstw zachowują się w trybie Canvas i przy „ogranicz ruch” (tło zeszytu ma już taką ścieżkę)? — Owner: zespół. Block: no.
- **Risk:** nowy ekran między zeszytem a pokojem; ryzyko „zmęczenia hubem” u 6-latka, dlatego reguła FR-039 jest w tym wycinku, nie później.
- **Status:** proposed

### S-25: Pokój dziecięcy, trzeci pokój wyłącznie z danych

- **Outcome:** dziecko po kuchni urządza pokój dziecięcy; jego dodanie dotyka wyłącznie danych pokoju i plików grafiki (dowód FR-033), celebracja i przekrój działają dla niego bez zmian w kodzie; pierwszy dom ma wtedy trzy pokoje (decyzja 2026-10-30).
- **Change ID:** kids-room
- **PRD refs:** FR-033, FR-035
- **Prerequisites:** S-22
- **Parallel with:** S-23, S-17
- **Blockers:** — (pokój dziecięcy jest w `designs/martynka-evolution-v1`, z trzema etapami tła i łóżkiem w 3 formach).
- **Unknowns:**
  - Jakie elementy i koszty ma pokój dziecięcy (jak w S-22)? — Owner: autor z grafikiem. Block: no.
- **Risk:** jeśli ten wycinek wymaga zmian w kodzie poza danymi, F-04 i S-22 nie dotrzymały kontraktu i to tu się to ujawnia.
- **Status:** proposed

### S-24: Mieszkańcy wprowadzają się, naklejka do albumu

- **Outcome:** gdy wszystkie pokoje domu są gotowe, dziecko widzi celebrację domu (mocniejsze natężenie tego samego mechanizmu co pokój): obrazek mieszkańców, jedno zdanie podziękowania czytane przez lektora, bez dialogów i wyborów, i dostaje naklejkę do albumu; dom zostaje zamieszkany (ożywa: np. kot w oknie, światło), dziecko może do niego wracać i zmieniać warianty za darmo; album jest dostępny z widoku domu, bez waluty, wymiany i pustych miejsc, które naciskają.
- **Change ID:** residents-move-in
- **PRD refs:** FR-034, FR-040 (celebracja domu), FR-041, FR-035
- **Prerequisites:** S-23, S-25
- **Parallel with:** S-17
- **Blockers:** paczka mieszkańców domu 1 i naklejki od grafika (brief, P1).
- **Unknowns:**
  - Czy album jest osobnym ekranem, czy kartą nad widokiem domu (PRD Open Question 12, reszta)? — Owner: autor. Block: no (rozstrzygnąć w `/10x-plan`).
  - Treść zdania podziękowania i nazwy mieszkańców: czytane przez nauczyciela jak treść zadań, bez imion dziecka. — Owner: autor. Block: no.
- **Risk:** gwiazda przewodnia; pierwsza „postać” w grze, więc guardrail „bez fabuły” jest tu najłatwiej złamać; ryzyko: scenka rośnie w dialog albo w wybory.
- **Status:** proposed

### S-26: Ulica z działkami i drugi dom

- **Outcome:** dziecko widzi ulicę z działkami: pierwszy dom (zamieszkany, z salonem i pokojami dziecka) stoi na pierwszej działce, pozostałe są zamknięte z „Wkrótce” i otwierają się po kolei po gotowym domu; drugi dom ma inne pokoje i dodatek (np. ogródek albo balkon) zdefiniowane w danych; celebracja ulicy to trzecie natężenie tego samego mechanizmu; ulica jest osobnym przyciskiem z widoku domu i nigdy obowiązkowym przystankiem.
- **Change ID:** street-plots
- **PRD refs:** FR-032, FR-036 (ulica jako dane), FR-039, FR-040 (celebracja ulicy)
- **Prerequisites:** S-24, S-17
- **Parallel with:** —
- **Blockers:** paczka ulicy, elewacji i skorupy domu 2 od grafika (brief, P2); pokoje domu 2 (pracownia, ogród zimowy, biblioteka) już są w `designs/`.
- **Unknowns:**
  - Ile domów ma ulica i jak duże są kolejne domy; zależy od czasu na pokój zmierzonego w S-17 (PRD Open Question 11). — Owner: autor. Block: yes.
  - Które pokoje i jaki dodatek ma drugi dom, żeby wnosił coś nowego (decyzja 2026-10-30)? — Owner: autor. Block: no.
- **Risk:** najdroższy wycinek w grafice i trzeci poziom zbliżenia; stoi po mieszkańcach, bo pusta ulica na miesiące to świat, który nic nie daje dziecku.
- **Status:** blocked

### S-27: Dzielnica w innym otoczeniu

- **Outcome:** po kilku domach dziecko widzi kolejną ulicę lub dzielnicę w innym otoczeniu (np. nad morzem, w górach); liczba domów na ulicy, pokoje domów i kolejność dzielnic są danymi, więc nowa dzielnica to dane i grafika.
- **Change ID:** district
- **PRD refs:** FR-036
- **Prerequisites:** S-26
- **Parallel with:** —
- **Blockers:** paczka dzielnicy od grafika.
- **Unknowns:**
  - Które otoczenie jako pierwsze i czy dzielnica zmienia coś poza tłem (np. inny zestaw pokoi)? — Owner: autor. Block: no.
- **Risk:** nice-to-have; stoi ostatnia, bo bez dwóch domów na ulicy nie ma czego otwierać.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID           | Suggested issue title                                              | Ready for `/10x-plan` | Notes |
| ---------- | ------------------- | ------------------------------------------------------------------ | --------------------- | ----- |
| F-04       | rooms-as-data       | Dom i pokoje jako dane, zapis v5 z domem bez straty salonu         | done                  | Zarchiwizowane 2026-10-30 → `context/archive/2026-10-30-rooms-as-data/`; zapis v5 z domem. |
| S-17       | playtest-balance    | Balans po testach z córką (czas na pokój rozstrzyga OQ 11)         | no                    | Czeka na obserwacje autora (przeniesione z M-02). |
| S-22       | kitchen-room        | Kuchnia jako drugi pokój z danych, celebracja pokoju               | yes                   | F-04 gotowe; run `/10x-new kitchen-room`, potem `/10x-research`, `/10x-plan kitchen-room`. Follow-upy F-04 z `Trigger: S-22` w `context/archive/2026-10-30-rooms-as-data/follow-ups/review-fixes.md`. |
| S-23       | house-cross-section | Przekrój domu z piętrami, „Do pokoju” zawsze do remontu            | no                    | Po S-22; paczka skorupy domu. |
| S-25       | kids-room           | Pokój dziecięcy wyłącznie z danych i grafiki                       | no                    | Po S-22; równolegle z S-23. |
| S-24       | residents-move-in   | Mieszkańcy wprowadzają się, naklejka do albumu                     | no                    | Po S-23 i S-25; gwiazda przewodnia. |
| S-26       | street-plots        | Ulica z działkami i drugi dom                                      | no                    | Blokuje PRD Open Question 11 (po S-17). |
| S-27       | district            | Dzielnica w innym otoczeniu                                        | no                    | Po S-26; nice-to-have. |

## Open Roadmap Questions

1. **Wielkość ulicy i kolejnych domów** (PRD Open Question 11): ile domów ma ulica i jak duże są kolejne domy; pierwszy dom to salon, kuchnia i pokój dziecięcy (decyzja 2026-10-30). — Owner: autor. Block: S-26 (po pomiarze z S-17).
2. **Forma albumu** (PRD Open Question 12, reszta): osobny ekran czy karta nad widokiem domu. — Owner: autor. Block: — (rozstrzygnąć w planie S-24).
3. **Grafika** (PRD Open Question 13): inwentaryzacja zrobiona 2026-10-30 (kuchnia, pracownia, pokój dziecięcy, biblioteka, taras i ogród zimowy są w `designs/`); brakuje skorupy domu, mieszkańców i ulicy, zamawiane briefem `docs/designer-brief-m03.md` w kolejności skorupa domu 1 → mieszkańcy domu 1 → ulica i dom 2; każda paczka obciąża limit ładowania startu. — Owner: autor. Block: — (każdy wycinek z grafiką kończy się na zastępnikach, dopóki paczka nie dotrze).
4. **Założenia „salonowe” w kodzie** (PRD Open Question 14): co z cieni, postarzenia, manifestu slotów i tabel migracji musi stać się danymi pokoju. — Owner: agent. Block: — (rozstrzyga badanie F-04).
5. **Ryzyko: motywacja po salonie** (PRD Open Question 5): mierzy S-17; odpowiedzią tego kamienia jest S-24. — Owner: autor. Block: —.
6. **Powrót wysyłek rodzica** (M-02, odłożony): kiedy S-18–S-21 wracają jako kolejny kamień; PRD Open Questions 8–10 są już rozstrzygnięte (2026-10-25). — Owner: autor. Block: — (następny kamień).

## Parked

- **Wysyłki rodzica i statystyki odwiedzin** (M-02, S-18–S-21, PRD FR-028–FR-031) — Why parked: odłożone 2026-10-30 decyzją autora na rzecz „ulicy i domów”; dekompozycja w historii gita tego pliku; wraca jako kolejny kamień.
- **Docelowe grafiki salonu „przed remontem”** (paczka zamówiona 2026-10-25) — Why parked: nie jest wymaganiem PRD, tylko podmianą obecnego postarzenia w kodzie; wejdzie jako osobna zmiana, gdy paczka dotrze (F-04 ma zostawić na nią miejsce w danych pokoju).
- **Scenki fabularne, dialogi i wybory przy mieszkańcach** — Why parked: PRD Non-Goals i decyzja 2026-10-30 (FR-040: jedna celebracja, jedno zdanie).
- **Równoległe remonty dwóch pokoi i swobodne ustawianie mebli** — Why parked: PRD Non-Goals (FR-033).
- **Statystyki nauki z gry** — Why parked: PRD Non-Goals; dane o dziecku, mało graczy; później najwyżej jako opcja domyślnie wyłączona.
- **Opinia przez `mailto:`, formularz zewnętrzny lub GitHub** — Why parked: odrzucone przez autora 2026-10-20/21 (`docs/human-checklist.md`): dane u obcej firmy albo rodzice bez kont.
- **Fabuła, energia, timery, reklamy, zakupy, wiele profili, chmura, merge board, układ pionowy** — Why parked: PRD Non-Goals, bez zmian od M-01.

## Milestone History

(Append-only. Carried forward verbatim into each successor milestone's roadmap.)

- **M-01: Wersja 1, pełna pętla gry (etapy M0–M8)** (`v1-pelna-petla-m0-m8`) — closed 2026-10-25. Etapy M0–M7 dostarczone i wdrożone (F-01–F-03, S-01–S-16d done, ostatnie scalenie 7770ae8); S-17 (M8, balans po testach z córką) zależy od obserwacji, nie od kodu, więc za zgodą autora przeniesione do M-02 zamiast blokować zamknięcie.
- **M-02: Wysyłki rodzica i statystyki odwiedzin** (`wysylki-rodzica-i-statystyki`) — abandoned (odłożony) 2026-10-30. Żaden wycinek nie ruszył; autor wybrał najpierw „ulicę i domy” (PRD v4). S-17 przeniesiony do M-03; S-18–S-21 (FR-028–FR-031, decyzje OQ 8–10 z 2026-10-25) wracają jako kolejny kamień, dekompozycja w historii gita tego pliku (stan z 1f6869d).

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Pełne listy M-01 i M-02 są w historii gita tego pliku.)

- **F-04: (foundation) pokój da się dodać wyłącznie danymi i grafiką: wszystko, co dziś jest napisane pod salon (cienie, postarzenie, manifest slotów, tabele migracji, karta „Pokój gotowy!”), staje się danymi pokoju; zapis niesie dom z listą pokoi i miejscem każdego pokoju w siatce piętro × miejsce, a salon dziecka przechodzi do pierwszego domu bez straty, z zamrożoną próbką starego zapisu w testach.** — Archived 2026-10-30 → `context/archive/2026-10-30-rooms-as-data/`. Lesson: —.
