---
project: "Bystrow"
context_type: brownfield
created: 2026-10-31
updated: 2026-10-31
change: "Wybór „Co urządzamy najpierw?”: Dom (salon) albo Baza kosmiczna"
timeline_budget:
  delivery_weeks: 1
  hard_deadline: null
product_type: web-app
target_scale:
  users: small
previous_session: context/foundation/archive/shape-notes-2026-10-11.md
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "context type"
      decision: "brownfield (git, package-lock.json, działająca gra); poprzednia sesja greenfield zarchiwizowana"
    - topic: "obecni gracze"
      decision: "dziecko z zapisem gra dalej w domu, bez ekranu wyboru"
    - topic: "persona bazy"
      decision: "każde dziecko 6–10, równorzędny temat, bez etykiety płci"
    - topic: "zmiana tematu"
      decision: "dziecko do końca pierwszej rundy (jak „Wróć” do wieku), potem na stałe; bez przełącznika rodzica"
    - topic: "kolejność ekranów"
      decision: "wiek → temat → rozgrzewka"
    - topic: "po Mostku"
      decision: "ścieżki osobne; dziecko z bazą czeka w bazie; Hangar zamawiany od razu jako drugi moduł"
    - topic: "z domu do bazy"
      decision: "nie, ścieżki są osobne"
    - topic: "zapis"
      decision: "wybór budowli w zapisie, najpewniej v6; rollback pokazuje kartę nowszego zapisu, jak przy v3–v5"
  frs_drafted: 9
  quality_check_status: accepted
---

# Shape notes: wybór „Co urządzamy najpierw?”

Zalążek (2026-10-31, słowa autora): „Podoba mi się opcja z wyborem, że co urządzamy najpierw i tutaj właśnie opcja dom i salon a druga niech będzie właśnie baza kosmiczna.”

## Current System

Bystrow (do 2026-10-31 „Martynka urządza”): instalowalna gra webowa offline na tablet w poziomie, dla dziecka 6–10 lat. Runda 5 zadań matematycznych (etapy E1–E6 z adaptacją) daje gwiazdki, a gwiazdki opłacają zadania remontowe pokoju: najpierw ściany i podłoga, potem meble w 3 wariantach. Pierwsze uruchomienie: wybór wieku → rozgrzewka → zeszyt; rodzic wchodzi przez bramkę dla dorosłego. Pokoje są danymi domu (`src/data/houses.ts`): dom 1 = salon, potem kuchnia; przekrój domu (S-23) pokazuje 4 komórki 608×342, jeden pokój w remoncie naraz. Zapis lokalny w IndexedDB, format v5 z polem `house`, łańcuch migracji v1→v5 i kopie `backup-v<N>`. Stack: Phaser 4.2.1, Vite, TypeScript, vite-plugin-pwa. Grafika bazy kosmicznej jest gotowa lokalnie (`designs/bystrow-space-base-v1/`: moduł „Mostek” przed/po i cienie, 6 grup × 3 warianty, przekrój bazy z tymi samymi 4 komórkami co dom 1, zamknięta komórka ze śluzą, dwie karty wyboru 720×480).

Musi przetrwać (autor, 2026-10-31):
- zapisy i gwiazdki obecnych dzieci, bez straty, jak przy każdej dotychczasowej migracji;
- krótki pierwszy start: wybór nie wydłuża go ponad jedno dotknięcie;
- zadania matematyczne: rundy, etapy i adaptacja działają tak samo bez względu na temat;
- gra offline i rozmiar startu: start nie ładuje grafik obu ścieżek naraz.

## Vision & Problem Statement

Zmiana: przy pierwszym uruchomieniu dziecko wybiera, co urządza najpierw: Dom (salon) albo Bazę kosmiczną. Powód: salon jako jedyny pierwszy temat może nie wciągnąć każdego dziecka (pierwsza myśl autora: opcja dla chłopców, np. warsztat samochodowy; wybrana baza kosmiczna jako temat dla każdego, bez etykiety płci). Wybór ma dać (1) temat, na który dziecko chce zbierać gwiazdki od pierwszej rundy, (2) poczucie, że to „moja gra”, bo dziecko decyduje samo od pierwszego ekranu, (3) rodzeństwu na dwóch urządzeniach różne tematy (jeden profil na urządzenie zostaje). Dlaczego dopiero teraz: grafika była blokadą; paczka bazy powstała 2026-10-31, a przekrój domu (S-23) i pokoje jako dane (F-04) dają strukturę, w którą baza wchodzi jako druga „budowla”.

## User & Persona

Persona główna bez zmian: córka autora, 7 lat, gra sama na tablecie. Baza kosmiczna jest dla każdego dziecka 6–10 lat jako równorzędny temat, także dla dzieci, których salon nie wciąga. Dziecko, które już gra (ma zapis), gra dalej w domu bez pytania o wybór; ekran wyboru widzi tylko nowe dziecko.

## Access Control

Obecny model (bez zmian): bez kont i logowania, jeden lokalny profil na urządzeniu; ustawienia rodzica (etap, czytanie, zapis, dźwięki) za bramką dla dorosłego (przytrzymanie zębatki 2 s + działanie 13–19 × 13–19). Zmiana: brak nowych ról i bramek. Temat (Dom albo Baza) wybiera dziecko na pierwszym starcie i może go zmienić tylko do końca pierwszej rundy (tak jak dzisiejsze „Wróć” do wyboru wieku); potem temat zostaje, a jedyną drogą do innego tematu jest „Zacznij od nowa” rodzica.

## Success Criteria

Przepływ zmiany (delta, autor 2026-10-31):
1. Nowe dziecko otwiera grę i wybiera wiek (bez zmian).
2. Ekran „Co urządzamy najpierw?”: dwie karty z ilustracją (Dom, Baza kosmiczna), wybór jednym dotknięciem.
3. Rozgrzewka i rundy jak dziś.
4. „Do pokoju” prowadzi do pokoju w remoncie wybranego tematu: salon albo moduł „Mostek” (przed → po, potem 6 elementów × 3 warianty).
5. Oddalenie pokazuje przekrój wybranej budowli: domu albo bazy.

Ścieżki są osobne: dziecko z bazą zostaje w bazie (po Mostku czeka na kolejny moduł, oglądając i zmieniając warianty za darmo), dziecko z domem nie trafia do bazy. Żeby luka po Mostku trwała dni, nie tygodnie, drugi moduł (Hangar z rakietą) jest zamawiany u grafika od razu i wchodzi osobnym slice'em zaraz po pierwszym.

Promień rażenia: pierwsze uruchomienie (`WelcomeScene`, rozgrzewka), dane domu i zapis (`house` w formacie v5, `nextRoom`, celebracja), przekrój (`HouseScene`), ładowanie grafik przy starcie (`bootRoomArt`), smoke wdrożenia (precache nowych grafik).

### Primary

Nowe dziecko przechodzi całą ścieżkę bazy: wiek → Baza → rozgrzewka → rundy → remont Mostka → przekrój bazy (test e2e i gra na tablecie).

### Secondary

- Dziecko spoza domu, którego salon nie wciągnął, wybiera bazę i wraca do gry (obserwacja autora, bez telemetrii).
- Córka na świeżej instalacji sama rozumie wybór, bez czytania i bez pomocy dorosłego.

### Guardrails

- Obecny zapis bez zmian: po aktualizacji córka jest w swoim domu, z tymi samymi gwiazdkami i bez ekranu wyboru.
- Pierwszy start dłuższy najwyżej o jedno dotknięcie; zadania matematyczne niezależne od tematu; gra offline i start nie ładuje grafik obu ścieżek naraz.

## Functional Requirements

Numeracja ciągnie się od PRD v4 (ostatni FR-041), żeby `/10x-prd` dopisał zmianę jako wersję 5.

### Pierwsze uruchomienie

- FR-042: Nowe dziecko po wyborze wieku (albo po ustawieniu etapu przez rodzica przyciskiem „Rodzic”) widzi ekran „Co urządzamy najpierw?” z dwiema kartami z ilustracją (Dom, Baza kosmiczna) i wybiera jedną jednym dotknięciem; przycisk głośnika czyta pytanie i nazwy kart jak przy zadaniach (automatyczne czytanie domyślnie wyłączone). Priority: must-have. Change: new
  > Socrates: Zarzut: dodatkowy ekran w pierwszej minucie, sześciolatek może wybrać losowo. Rozstrzygnięcie: zostaje; losowy wybór też jest dobry, oba tematy są pełnowartościowe, a FR-043 pozwala się cofnąć.
- FR-043: Dziecko może wrócić do wyboru tematu do końca pierwszej rundy; potem temat zostaje, a inny temat daje tylko „Zacznij od nowa” w ustawieniach rodzica. Priority: must-have. Change: new
  > Socrates: Zarzut: znudzone dziecko zmieni temat tylko kosztem postępu. Rozstrzygnięcie: zostaje; temat to decyzja, gwiazdki i pokoje nie znikają bez wyraźnej decyzji rodzica.

### Baza kosmiczna

- FR-044: Dziecko z bazą remontuje moduł „Mostek” jak pokój: najpierw ściany i podłoga (przed → po), potem 6 elementów × 3 warianty opłacane gwiazdkami w kolejności z danych modułu; ceny są wyższe niż w salonie, tak że suma gwiazdek Mostka jest podobna do salonu (ok. 100), więc baza zajmuje tyle samo rund. Priority: must-have. Change: new
  > Socrates: Zarzut: 7 zadań remontowych wobec 12 w salonie, baza kończy się szybciej i wygląda na „gorszą”. Rozstrzygnięcie: zmienione; wyższe koszty elementów, suma ok. 100 gwiazdek jak salon.
- FR-045: Dziecko z bazą widzi przekrój bazy (te same komórki co przekrój domu; zamknięte moduły jako śluza z „Wkrótce”) i wraca z niego do modułu jednym dotknięciem. Priority: must-have. Change: new
  > Socrates: Zarzut: przekrój z jednym modułem i trzema śluzami może rozczarowywać. Rozstrzygnięcie: zostaje bez zmian.
- FR-046: Po ukończeniu Mostka dziecko dostaje celebrację (FR-040) i zostaje w bazie: ogląda i zmienia warianty za darmo, gwiazdki się zbierają, a kolejny moduł otwiera się, gdy zostanie dodany do gry. Priority: must-have. Change: new
  > Socrates: Zarzut: gwiazdki bez celu przed Hangarem mogą obniżyć motywację. Rozstrzygnięcie: zostaje bez zmian (Hangar zamówiony od razu, FR-047).
- FR-047: Hangar z rakietą jest drugim modułem bazy, dodanym osobnym slice'em zaraz po pierwszym (zamówienie grafiki: `designs/_runner/orders/2026-10-31-space-base-2-hangar.md`). Priority: should-have. Change: new
  > Socrates: Zarzut: bez Hangara baza to ślepa uliczka, więc może must-have. Rozstrzygnięcie: zostaje should-have, osobny slice.

### Nawigacja

- FR-048: „Do pokoju” (FR-039) prowadzi do pokoju w remoncie wybranej budowli: domu albo bazy; oddalenie pokazuje przekrój tej budowli, a przycisk oddalenia nosi nazwę budowli z jej danych („Dom” albo „Baza”). Priority: must-have. Change: modified
  > Socrates: Zarzut: przycisk „Dom” w bazie mówiłby nieprawdę. Rozstrzygnięcie: zmienione; napis przycisku zależy od budowli.

### Zachowane

- FR-049: Dziecko z zapisem sprzed zmiany gra dalej w domu, bez ekranu wyboru, z tymi samymi gwiazdkami, pokojami i etapem; dowodem jest zamrożony zapis v5 z salonem w teście jednostkowym i e2e. Priority: must-have. Change: preserved
  > Socrates: Zarzut: „zachowane” bywa tylko deklaracją. Rozstrzygnięcie: zmienione; wymagany dowód w teście (zamrożony zapis v5).
- FR-050: Rundy, etapy, adaptacja i gwiazdki jako jedyna waluta (FR-035) działają tak samo w obu tematach; dowodem jest test, że przy tym samym ziarnie rundy w obu tematach dają te same zadania. Priority: must-have. Change: preserved
  > Socrates: Zarzut jak przy FR-049. Rozstrzygnięcie: zmienione; dowód w teście (to samo ziarno, te same zadania).

## User Stories

### US-01: Nowe dziecko wybiera bazę kosmiczną i remontuje Mostek

- Given: świeża instalacja, brak zapisu
- When: dziecko wybiera wiek, na ekranie „Co urządzamy najpierw?” dotyka karty „Baza kosmiczna”, robi rozgrzewkę i rundę, potem „Do pokoju”
- Then: widzi Mostek w stanie „przed” z pierwszym zadaniem remontowym; po zapłaceniu gwiazdkami ściany i podłoga przechodzą w „po”, a oddalenie pokazuje przekrój bazy z Mostkiem w pierwszej komórce i śluzami „Wkrótce” w pozostałych

### US-02: Dziecko z zapisem po aktualizacji

- Given: zapis v5 z salonem w remoncie i gwiazdkami
- When: gra uruchamia się po aktualizacji z wyborem tematu
- Then: dziecko trafia do zeszytu bez ekranu wyboru, ma te same gwiazdki, a „Do pokoju” prowadzi do jego salonu (albo kuchni)

### US-03: Pomyłka przy wyborze

- Given: dziecko wybrało Dom i nie skończyło pierwszej rundy
- When: dotyka „Wróć”
- Then: wraca do wyboru tematu i może wybrać Bazę; po skończonej pierwszej rundzie „Wróć” już nie ma

## Business Logic

Dziecko raz wybiera budowlę (dom albo bazę), a gra prowadzi je tylko przez pokoje tej budowli, w kolejności z jej danych.

Dziś system otwiera kolejny pokój domu w stałej kolejności z danych domu (salon, kuchnia), z jednym pokojem w remoncie naraz (FR-033). Zmiana modyfikuje tę regułę: wejściem jest wybór dziecka na ekranie „Co urządzamy najpierw?” (do końca pierwszej rundy można go cofnąć), wynikiem jest budowla, której pokoje (moduły) dziecko remontuje do końca gry na tym urządzeniu. Dziecko spotyka regułę przy „Do pokoju” i w przekroju budowli. Dziecko z zapisem sprzed zmiany ma budowlę „dom” bez pytania. Ceny modułów bazy są dobrane tak, by Mostek kosztował razem ok. 100 gwiazdek, jak salon. Gwiazdki z rund pozostają jedyną walutą, a zadania nie zależą od budowli.

## Constraints & Preserved Behavior

- Zapis: wybór budowli jest zapisany; najpewniej nowy format v6 z migracją v5 → v6 (dziecko z zapisem dostaje budowlę „dom”), kopią `backup-v5` (polityka write-once jak `backup-v1`–`backup-v4`) i zamrożonymi fixture'ami; rollback wdrożenia poniżej wersji z v6 pokazuje kartę „nowszy zapis” i niczego nie nadpisuje (autor akceptuje, jak przy v3–v5; opis w `deploy/README.md`).
- Nazwy techniczne zostają (`martynka` w IndexedDB, `profile:default`, `martynka:*`, `SAVE_FILE_APP`), żeby zapisy przetrwały.
- Import kopii zapisu ze starszej wersji (v1–v5) daje budowlę „dom”.
- Pierwsze uruchomienie: wiek → temat → rozgrzewka; ścieżka rodzica „Rodzic” → etap → temat; „Wróć” do tematu do końca pierwszej rundy, jak dzisiejsze `ageBackOffered`.
- Przekrój bazy używa tej samej geometrii komórek co dom 1 (`HOUSE_GEOMETRY`), więc ta sama struktura danych, inna grafika (FR-038).
- Smoke wdrożenia sprawdza precache grafik bazy (jak `roomArtCheck` i obrazki domu).

## Non-Functional Requirements

- Start ładuje grafiki tylko wybranej budowli; budżet startu zostaje (co najmniej 2 s zapasu pod `balance.loader.totalMs`, sprawdzane przez test budżetu startu).
- Obie ścieżki działają offline od pierwszej instalacji: wszystkie grafiki bazy są w precache, a smoke wdrożenia to potwierdza.
- Ekran wyboru: tylko dotyk, duże karty, przy systemowym „ogranicz ruch” bez animacji.

## Product framing

- `product_type`: bez zmian (web-app: instalowalna gra webowa offline na tablet).
- `target_scale.users`: bez zmian (small: jedno dziecko na urządzeniu; rodzeństwo na osobnych urządzeniach).
- `timeline_budget`: `delivery_weeks: 1`, `hard_deadline: null`, praca nie tylko po godzinach (jak dotąd).

## Non-Goals

- Bez etykiet płci: na ekranie wyboru nie ma „dla chłopców” ani „dla dziewczynek” ani kolorów przypisanych płci; oba tematy są dla każdego dziecka.
- Bez dwóch budowli naraz: dziecko nie remontuje domu i bazy równolegle i nie przełącza się między nimi (jeden pokój w remoncie, FR-033).
- Bez wielu profili: rodzeństwo gra na osobnych urządzeniach; przełączanie dzieci na jednym tablecie zostaje poza zakresem.
- Bez nowych tematów: warsztat samochodowy i inne tematy to osobne zmiany; ta wprowadza tylko wybór między domem a bazą.

## Open Questions

1. Mieszkańcy, album i ulica (FR-032, FR-034, FR-041) dla bazy: czy baza ma swoich „mieszkańców” (np. załogę) i miejsce na ulicy, czy stoi osobno? Właściciel: autor. Rozstrzygnąć przed slice'em mieszkańców.
2. Grafika Hangara: zamówienie `designs/_runner/orders/2026-10-31-space-base-2-hangar.md`; pierwsza próba Codexa 2026-10-31 przerwana limitem użycia (do 18:02), wznawiana. Właściciel: agent. Rozstrzygnąć przed slice'em FR-047.
3. Czy wybór mieści się w formacie v5, czy wymaga v6 (autor akceptuje v6 z rollbackiem jak przy v3–v5). Właściciel: agent. Rozstrzygnąć w badaniu pierwszego slice'a.

## Quality cross-check

Wszystkie pozycje obecne (brownfield, 7/7): Access Control, Business Logic (jedno zdanie), artefakty, termin 1 tydzień (≤ 3), Non-Goals, Constraints & Preserved Behavior. Brak ostrzeżeń.
