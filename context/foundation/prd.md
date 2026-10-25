---
project: "Martynka urządza"
version: 3
status: draft
created: 2026-10-11
updated: 2026-10-25
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: none
  data_volume: small
timeline_budget:
  mvp_weeks: 16
  hard_deadline: null
  after_hours_only: false
---

# PRD — Martynka urządza

Gra dla dziecka w wieku 6–10 lat (klasy 1–3): runda zadań matematycznych daje gwiazdki, gwiazdki opłacają zadania remontowe w pokoju, dziecko wybiera jeden z 3 wariantów każdego elementu. Tablet w poziomie, tylko dotyk, instalowalna aplikacja webowa działająca offline, cały tekst w grze po polsku. Źródło: `context/foundation/shape-notes.md` (sesja 2026-10-10/11). Kolejność etapów M0–M8 z planu `Martynka-urzadza.md` jest wiążąca. Wersja 2 (2026-10-21): wyjątek prywatności dla wysyłek uruchamianych przez rodzica, nowe wymagania po v1 (FR-028–FR-031) i FR-009 bez automatycznego czytania; decyzje autora z 2026-10-20/21 zapisane w `docs/human-checklist.md`. Wersja 3 (2026-10-22): kierunek po v1 „ulica i domy” (FR-032–FR-036) i niemy przewodnik w zeszycie (FR-037): dom z kilkoma pokojami, mieszkańcy zamiast sprzedaży i wynajmu, gwiazdki z rund pozostają jedyną walutą.

## Vision & Problem Statement

Dziecko w klasach 1–3 unika ćwiczenia matematyki poza szkołą. Ból odczuwa dziecko (nuda, zniechęcenie przy kartach pracy) i rodzic (musi pilnować i motywować). Moment: codzienne ćwiczenie w domu po szkole. Koszt dziś: ćwiczenia z zeszytu lub kart pracy pod nadzorem rodzica, co kosztuje czas i nerwy obu stron. Bóle wtórne: istniejące apki nie pasują (po angielsku, z reklamami lub zakupami, albo nie idą za polskim programem klas 1–3 Nowej Ery); gry, które dziecko lubi (typ Gossip Harbor), nic nie uczą, więc czas przy tablecie jest czystą rozrywką; rodzic nie ma wglądu w to, co dziecko umie, dopóki nie pojawi się ocena w szkole.

Wgląd, dlaczego to zadziała tam, gdzie zeszyt i apki nie: (1) nagrodą musi być budowanie, bo urządzanie pokoju motywuje mocniej niż punkty, odznaki czy ranking; (2) zadania muszą iść za podręcznikiem, krok po kroku z programu Nowej Ery (`docs/ZADANIA.md`), więc gra wzmacnia to, co jest aktualnie w szkole; (3) zero presji: bez czasu, bez „źle”, bez utraty gwiazdek, druga próba też nagradzana, więc dziecko nie rezygnuje; (4) kontrola rodzica bez kont: wszystko lokalnie i offline, rodzic ustawia etap i widzi postępy bez rejestracji i chmury. Skala produktu to jedno dziecko na jednym urządzeniu; przy 100× skali reguła domenowa nie zmienia się (wszystko liczy się lokalnie per urządzenie), zmieniłaby się tylko potrzeba profili i synchronizacji, które są poza v1.

## User & Persona

**Persona główna: dziecko.** Córka autora, 7 lat, w roku szkolnym 2026/27 w klasie 2 (etap startowy E3, od lutego 2027 E4). Sięga po grę w domu, na tablecie, po szkole, sama. Lubi gry z pętlą „zbieraj → urządzaj”. Potrzebuje dużych elementów dotykowych, krótkich poleceń i braku kar. Zakres wiekowy produktu to 6–10 lat (klasy 1–3, etapy E1–E6), ale v1 jest dopracowywane na tej jednej osobie (etap M8 = obserwacja jej gry).

### Secondary persona

**Rodzic.** Instaluje grę na tablecie, ustawia (lub koryguje) etap w ukrytych ustawieniach, od czasu do czasu sprawdza postępy (opanowanie umiejętności, najczęstsze błędy). Nie gra razem z dzieckiem na co dzień.

## Success Criteria

Przepływ MVP (pierwsza sesja dziecka, klik po kliku): (1) dziecko otwiera grę z ikony na ekranie początkowym tabletu, bez sieci; (2) podaje wiek, rozwiązuje rozgrzewkę, gra ustawia etap (rodzic może go zmienić); (3) rozwiązuje rundę zadań kafelkami lub klawiaturką, za każde poprawne gwiazdka, po błędzie podpowiedź i druga próba; (4) widzi podsumowanie rundy, wybiera „Do pokoju”; (5) płaci gwiazdkami za zadanie remontowe, wybiera 1 z 3 wariantów, widzi animację; (6) zamyka grę, po ponownym otwarciu wszystko jest tak, jak zostawiła; (7) po ostatnim zadaniu widzi „Pokój gotowy!”. Linia „wydane” dla v1: M0–M8 w całości (łącznie z testami z graczem i poprawkami balansu). Koszt 16-tygodniowego MVP został pokazany i zaakceptowany 2026-10-10.

### Primary
- Córka sama prosi o grę: gra z własnej inicjatywy co najmniej 3 razy w tygodniu przez 4 kolejne tygodnie, bez nagabywania.
- Przechodzi cały pierwszy pokój od zaniedbanego do urządzonego w rozsądnym czasie (ok. 1–2 tygodnie grania; dokładną wartość ustala M8).
- W ustawieniach rodzica widać odblokowane kolejne kroki etapu i rosnące opanowanie umiejętności, zgodne z tym, co jest aktualnie w szkole.

### Secondary
- Gra zastępuje karty pracy: rodzic przestaje siedzieć nad zeszytem, ćwiczenie w domu = gra.
- Gra działa także myszką w przeglądarce na komputerze, choć celem jest tablet.
- Inne dziecko w wieku 6–10 lat też trafia w sensowny etap (dobór etapu nie jest dopasowany tylko do córki).
- Rodzic faktycznie zagląda w podgląd postępów co najmniej raz w tygodniu.

### Guardrails
- Zero frustracji i kar: nigdy utrata gwiazdek, czerwone krzyżyki ani limit czasu; błędna odpowiedź zawsze prowadzi do podpowiedzi i drugiej próby.
- Postęp nigdy nie ginie: zamknięcie, restart tabletu i aktualizacja gry zostawiają stan dokładnie taki sam.
- Zadania są matematycznie poprawne i zgodne z programem: żadnej błędnej odpowiedzi wzorcowej, ujemnych wyników ani zadań spoza zakresu etapu.
- Działa offline i bez sieci zewnętrznej: gra nie wysyła niczego automatycznie (brak telemetrii, reklam i zakupów); jedyne wysyłki uruchamia świadomie rodzic za bramką dla dorosłych (opinia, raport o błędzie, FR-028–FR-029), zawsze bez danych dziecka.

## User Stories

### US-01: Dziecko zdobywa gwiazdki w rundzie zadań

- **Given** dziecko z ustawionym etapem (np. E3) otwiera grę offline na tablecie
- **When** stuka „Zadania” i rozwiązuje 5 zadań kafelkami lub klawiaturką
- **Then** po każdej poprawnej odpowiedzi gwiazdka leci do licznika, a po rundzie widzi podsumowanie z „Kolejna runda” i „Do pokoju”

#### Acceptance Criteria
- Każde zadanie jest w zakresie liczb bieżącego etapu i odblokowanych kroków
- Błędna odpowiedź pokazuje podpowiedź i drugą próbę; nigdy czerwonego krzyżyka, licznika czasu ani ujemnej zmiany gwiazdek
- Runda bez błędu daje 5 + 2 gwiazdki; runda z drugimi próbami daje 1 gwiazdkę za każde zadanie rozwiązane w drugiej próbie
- Cały przepływ da się przejść palcem; każdy cel dotykowy ma co najmniej 96 px w scenie 1920×1080

### US-02: Dziecko urządza salon za gwiazdki

- **Given** dziecko ma co najmniej tyle gwiazdek, ile kosztuje bieżące zadanie remontowe
- **When** stuka przycisk zadania remontowego, a potem jedną z 3 miniatur wariantu i „Wybieram”
- **Then** gwiazdki są odjęte, element pojawia się w pokoju w wybranym wariancie z animacją, a kolejne zadanie remontowe staje się bieżące

#### Acceptance Criteria
- Za mało gwiazdek: przycisk wyszarzony, stuknięcie przenosi do zadań, nic nie jest odejmowane
- Stuknięcie miniatury pokazuje podgląd w pokoju przed zatwierdzeniem
- Przytrzymanie urządzonego elementu (lub tryb „zmień”) otwiera ten sam panel; zmiana wariantu jest darmowa
- Po ostatnim zadaniu pokazuje się „Pokój gotowy!”

### US-03: Rodzic koryguje etap i sprawdza postępy

- **Given** rodzic przytrzymuje ikonę ustawień i przechodzi bramkę dla dorosłego
- **When** zmienia etap z E3 na E4 albo otwiera podgląd postępów
- **Then** kolejna runda losuje zadania z E4, a podgląd pokazuje opanowanie umiejętności i najczęstsze błędy

#### Acceptance Criteria
- Dziecko nie trafia do ustawień przypadkowym stuknięciem ani zwykłym przytrzymaniem
- Zmiana etapu przez rodzica ma pierwszeństwo nad propozycją z wieku i jest zapamiętana
- Reset gry wymaga potwierdzenia; eksport i import zapisu działają bez sieci

### US-04: Postęp przeżywa zamknięcie gry

- **Given** dziecko ma gwiazdki, częściowo urządzony salon i odblokowane kroki etapu
- **When** zamyka grę (lub tablet się rozładuje) i otwiera ją ponownie, także po aktualizacji gry
- **Then** gwiazdki, pokój i postęp nauki są dokładnie takie same

#### Acceptance Criteria
- Zapis następuje bez działania użytkownika po każdej zmianie stanu i przy ukryciu karty
- Zapis ze starszej wersji gry jest przenoszony do nowej wersji, nie kasowany

## Functional Requirements

Grupowanie według etapów planu (M0–M8); kolejność etapów jest wiążąca i nie zmienia się. Wszystkie FR są must-have (decyzja z sesji shape). Bloki `> Socrates:` pochodzą z rundy sokratejskiej i są zachowane dosłownie.

### M0 — szkielet
- FR-001: Dziecko może otworzyć grę z adresu URL na tablecie, dodać ją do ekranu początkowego i uruchomić offline; przy pierwszym uruchomieniu w przeglądarce (nie z ikony) gra pokazuje krótką instrukcję „Dodaj do ekranu początkowego” dopasowaną do iPada/Androida. Priority: must-have
  > Socrates: Kontrargument: „instalacja PWA jest zbyt trudna dla rodzica (Udostępnij → Do ekranu początkowego)”. Rozstrzygnięcie: FR rozszerzony o instrukcję instalacji; gra działa też bez instalacji.
- FR-002: Dziecko widzi grę w poziomie (scena 1920×1080 dopasowana do ekranu), a w pionie nakładkę „Obróć tablet”. Priority: must-have
  > Socrates: Kontrargument: „na telefonie lub pionowym tablecie gra jest bezużyteczna; nakładka blokuje zamiast adaptować”. Rozstrzygnięcie: FR bez zmian; układ pionowy i telefon trafiają do Non-Goals v1.
- FR-003: Gra instaluje nową wersję sama przy następnym uruchomieniu, bez pytania; zapis ze starszej wersji nadal działa (FR-021). Priority: must-have
  > Socrates: Kontrargument: „komunikat widzi dziecko, nie rodzic; kliknie „nie” i utknie na starej wersji”. Rozstrzygnięcie: FR zmieniony z „prompt” (plan, sekcja 9) na cichą aktualizację przy starcie.

### M1 — generatory zadań
- FR-004: Gra generuje oryginalne zadania typów grupy 1 (ZADANIA.md, sekcja 7) dla etapów E1–E6, każde z podpowiedzią krok po kroku i poprawną odmianą liczebników; w M1 etapy E3–E4 są dopracowane w pełni (treść poleceń, podpowiedzi), a E1–E2 i E5–E6 działają na wspólnych generatorach z danymi etapu, ich dopracowanie treści przesuwa się do M8/v1.1. Testy mechaniczne (zakres, brak ujemnych, rozpraszacze) obejmują wszystkie etapy. Priority: must-have
  > Socrates: Kontrargument: „sześć etapów naraz w M1 to za dużo; córka gra w E3–E4, a 18 generatorów × 6 etapów pochłonie tygodnie bez efektu na ekranie”. Rozstrzygnięcie: FR zawężony: pełna jakość treści dla E3–E4 w M1, reszta etapów działa, ale dopracowanie później; kryterium M1 (sample dla każdego etapu) zostaje.
- FR-005: Autor może wypisać po 3 przykładowe zadania z każdego kroku etapu skryptem próbkującym (np. dla E3); skrypt dodatkowo raportuje naruszenia (wynik poza zakresem, liczby ujemne, zła odmiana liczebników). Priority: must-have
  > Socrates: Kontrargument: „samo wypisanie nic nie dowodzi, jeśli nikt nie czyta”. Rozstrzygnięcie: FR rozszerzony o raport naruszeń.

### M2 — ekran zadań i gwiazdki
- FR-006: Dziecko rozwiązuje rundę zadań dotykiem (kafelki 3–4 lub klawiaturka 0–9 z „kasuj” i „OK”) z kropkami postępu; długość rundy (domyślnie 5) jest liczbą w danych balansu, nie stałą w kodzie. Priority: must-have
  > Socrates: Kontrargument: „dla E1 pięć zadań z obrazkami może być za długie, dla E6 za krótkie”. Rozstrzygnięcie: długość rundy parametryzowana w balansie, żeby M8 mógł ją zmienić bez kodu.
- FR-007: Dziecko dostaje 1 gwiazdkę za poprawne zadanie (także w drugiej próbie) i +2 za rundę bez błędu; gwiazdek nigdy nie traci. Odpowiedź w drugiej próbie daje gwiazdkę, ale nie liczy się jako sukces do opanowania umiejętności (historia rozróżnia pierwszą i drugą próbę). Priority: must-have
  > Socrates: Kontrargument: „jeśli druga próba daje tyle samo, dziecko może zgadywać pierwszą odpowiedź”. Rozstrzygnięcie: nagroda zostaje (brak frustracji), opanowanie liczy tylko pierwszą próbę.
- FR-008: Po błędzie dziecko widzi delikatne potrząśnięcie i pierwszą podpowiedź, ma drugą próbę; po drugiej pomyłce widzi rozwiązanie krok po kroku, a potem jeszcze raz wpisuje wynik (bez gwiazdki) i przechodzi dalej. Priority: must-have
  > Socrates: Kontrargument: „bierne obejrzenie rozwiązania nic nie uczy” (paczka A: „Pokaż kroki” wraca do próby). Rozstrzygnięcie: po rozwiązaniu dziecko przepisuje wynik, bez gwiazdki.
- FR-009: Dziecko może odsłuchać polecenie polskim lektorem; automatyczne czytanie poleceń jest ustawieniem rodzica, domyślnie wyłączonym dla każdego etapu (zmiana 2026-10-21, wcześniej domyślnie włączone dla E1–E2: w testach z graczem czytanie każdego zadania bez naciśnięcia głośnika przeszkadzało); bez polskiego głosu przycisk jest ukryty. Priority: must-have
  > Socrates: Kontrargument: „dziecko w E3, które słabo czyta, też potrzebuje lektora; dziecko w E2, które czyta, może być nim zirytowane”. Rozstrzygnięcie: automatyczne czytanie jako ustawienie rodzica z domyślną wartością zależną od etapu.
- FR-010: Po rundzie dziecko widzi podsumowanie z liczbą gwiazdek i wybiera „Kolejna runda” lub „Do pokoju”; gdy gwiazdek wystarcza na bieżące zadanie remontowe, podsumowanie wyróżnia „Do pokoju”. Priority: must-have
  > Socrates: Kontrargument: „dziecko może grindować rundy i zapomnieć o nagrodzie”. Rozstrzygnięcie: podsumowanie podpowiada „Do pokoju”, gdy stać na mebel, żeby domknąć pętlę.
- FR-011: Dziecko zawsze widzi licznik gwiazdek; przełącznik zadania/pokój jest widoczny między zadaniami i w pokoju, a ukryty w trakcie rozwiązywania zadania. Priority: must-have
  > Socrates: Kontrargument: „przycisk „Do pokoju” w trakcie zadania kusi do ucieczki przy trudnym zadaniu”. Rozstrzygnięcie: przełącznik ukryty w trakcie zadania, licznik zawsze widoczny.

### M3 — wiek, etapy, adaptacja
- FR-012: Przy pierwszym uruchomieniu dziecko podaje wiek (6–10), gra proponuje etap wg wieku i miesiąca, a rodzic (po bramce dla dorosłego) potwierdza lub zmienia etap przed startem; rozgrzewka 6 zadań koryguje start w dół. Priority: must-have
  > Socrates: Kontrargument: „wiek myli (rocznik vs klasa), a rozgrzewka 6 zadań to za mało, by odróżnić E3 od E4; pierwszy start i tak robi rodzic”. Rozstrzygnięcie: rodzic ustawia etap przy pierwszym uruchomieniu, wiek tylko jako podpowiedź.
- FR-013: Gra losuje zadania z odblokowanych kroków według wag (bieżący krok / wcześniejsze kroki / poprzedni etap) i prowadzi licznik opanowania 0–5 każdej umiejętności (seria poprawnych podnosi, błąd zeruje serię); wagi, długość serii i wartości zmian są liczbami w danych balansu (start: 60/30/10, 3 z rzędu +1, błąd zeruje serię bez odejmowania). Priority: must-have
  > Socrates: Kontrargument: „konkretne liczby to hipoteza do M8; PRD nie powinien ich utrwalać”. Rozstrzygnięcie: FR opisuje mechanizm, wartości startowe żyją w balansie.
- FR-014: Opanowanie ≥4 w większości umiejętności kroku (próg udziału w danych balansu) odblokowuje następny krok ze scenką „Nowa umiejętność!”; dwie rundy z rzędu poniżej 3/5 łagodzą trudność. Priority: must-have
  > Socrates: Kontrargument: „jedna trudna umiejętność (np. CALENDAR) blokuje cały krok; dziecko utyka na tygodnie”. Rozstrzygnięcie: odblokowanie wymaga ≥4 w większości umiejętności kroku, nie we wszystkich.
- FR-015: Rodzic w ukrytych ustawieniach (długie przytrzymanie + bramka dla dorosłego) zmienia etap i ogląda zwięzły podgląd postępów: bieżący krok etapu i 3 najsłabsze umiejętności z przykładami błędów, nie pełną tabelę. Priority: must-have
  > Socrates: Kontrargument: „pełna tabela opanowania × umiejętności jest nieczytelna; rodzic chce wiedzieć „nad czym poćwiczyć””. Rozstrzygnięcie: podgląd ograniczony do tego, co rodzic może wykorzystać.

### M4 — pokój
- FR-016: Dziecko widzi pokój (salon) i wydaje gwiazdki na kolejne zadanie remontowe; koszty i kolejność zadań są danymi pokoju (start 5–15 gwiazdek); przy braku gwiazdek przycisk jest wyszarzony, pokazuje „masz X/Y”, a stuknięcie prowadzi do zadań. Priority: must-have
  > Socrates: Kontrargument: „konkretne koszty to hipoteza; widoczny cel X/Y motywuje”. Rozstrzygnięcie: koszty i kolejność w danych pokoju, przycisk pokazuje postęp do celu.
- FR-017: Dziecko otwiera panel 3 wariantów z podglądem w pokoju i zatwierdza „Wybieram” z krótką animacją i dźwiękiem; gwiazdki są odejmowane dopiero przy zatwierdzeniu, nie przy otwarciu panelu. Priority: must-have
  > Socrates: Kontrargument: „jeśli gwiazdki schodzą przed wyborem, zamknięcie panelu lub tabletu zostawia opłacony pusty slot”. Rozstrzygnięcie: płatność przy „Wybieram”.
- FR-018: Dziecko może za darmo zmienić wariant już urządzonego elementu; panel otwiera się po krótkim przytrzymaniu mebla (albo w trybie „zmień” w pokoju), nie po zwykłym stuknięciu. Priority: must-have
  > Socrates: Kontrargument: „przypadkowe stuknięcia w pokój będą ciągle otwierać panel i przesłaniać nagrodę”. Rozstrzygnięcie: otwarcie panelu po przytrzymaniu lub w trybie „zmień”.
- FR-019: Po ostatnim zadaniu dziecko widzi „Pokój gotowy!”; lista pokoi (miniatury) ma w v1 jedną pozycję i zapowiedź, a mechanika odblokowania kolejnego pokoju istnieje w danych; po ukończeniu salonu gra oferuje „poprawki” (zmiana wariantów) i dalsze rundy. Priority: must-have
  > Socrates: Kontrargument: „z jednym pokojem pętla kończy się po ok. 10 zadaniach remontowych; potem gwiazdki nie mają na co iść”. Rozstrzygnięcie: FR zostaje z „poprawkami” po ukończeniu; ryzyko utraty motywacji po salonie zapisane (zob. Open Questions); drugi pokój to pierwsza rzecz po v1.

### M5 — zapis
- FR-020: Gra zapisuje stan automatycznie po każdej zmianie (z krótkim opóźnieniem) i przy ukryciu karty, a natychmiast (bez opóźnienia) po zdarzeniach nieodwracalnych: zapłata za mebel, koniec rundy; po ponownym otwarciu stan jest identyczny. Priority: must-have
  > Socrates: Kontrargument: „opóźnienie plus nagłe zamknięcie PWA na iPadzie może zgubić właśnie opłacony mebel”. Rozstrzygnięcie: zapis natychmiastowy po zdarzeniach nieodwracalnych.
- FR-021: Stare zapisy przeżywają aktualizacje gry (zapis jest wersjonowany i automatycznie przenoszony do nowego formatu); nieudane przeniesienie zostawia stary zapis nietknięty i pokazuje rodzicowi możliwość eksportu zamiast pustej gry. Priority: must-have
  > Socrates: Kontrargument: „migracja, która rzuca wyjątek, nie może zostawić gry w stanie „pusty zapis””. Rozstrzygnięcie: nieudana migracja zachowuje stare dane i oferuje eksport.
- FR-022: Rodzic eksportuje zapis do pliku JSON, importuje go (plik jest walidowany, a przed nadpisaniem rodzic widzi podsumowanie: gwiazdki, etap, postęp pokoju) i resetuje grę z potwierdzeniem. Priority: must-have
  > Socrates: Kontrargument: „import złego lub obcego pliku bez potwierdzenia nadpisuje tygodnie postępu”. Rozstrzygnięcie: walidacja i podsumowanie przed importem.

### M6 — zadania z rysunkami, minigry, zagadki
- FR-023: Gra generuje zadania typów grup 2–3 (ZADANIA.md, sekcja 7) z widżetami rysowanymi w kodzie (zegar, linijka, oś, klocki, słupek) i grafiką (monety, waga, naczynia, termometr); w M6 typy wdrażane są w kolejności etapów córki (E3–E4 najpierw), a „każdy etap ma pełny zestaw typów z ZADANIA.md” jest kryterium końca M6. Priority: must-have
  > Socrates: Kontrargument: „M6 to największy etap (ok. 20 typów); jeśli idzie typ po typie, córka długo nie widzi nic nowego”. Rozstrzygnięcie: kolejność wdrażania wg etapów córki, pełny zestaw jako kryterium końca.
- FR-024: Co kilka rund dziecko zamiast zwykłej rundy dostaje minigrę; v1 zawiera jedną lub dwie minigry z ZADANIA.md, sekcja 5 (np. hasło z wyników, sklepik), pozostałe wchodzą po v1. Priority: must-have
  > Socrates: Kontrargument: „siedem minigier to siedem osobnych ekranów i reguł; jedna sprawdzi, czy wariant rundy w ogóle bawi”. Rozstrzygnięcie: 1–2 minigry w v1, reszta później.
- FR-025: Co kilka rund dziecko może rozwiązać „zagadkę dnia” z ręcznej puli LOGIC za podwójne gwiazdki; pula startowa w v1 jest mała (ok. 10–15 zagadek dla E3–E4), reszta etapów i większa pula po v1. Priority: must-have
  > Socrates: Kontrargument: „30–50 zagadek na etap × 6 etapów to ręczna praca autorska poza kodem”. Rozstrzygnięcie: mała pula startowa sprawdza format.

### M7 — grafika i dźwięk
- FR-026: Dziecko widzi docelową grafikę (paczka A v1, meble salonu), animacje, słyszy dźwięki (po pierwszym dotknięciu) i widzi ekran ładowania; „zero placeholderów” obowiązuje na ekranach, które córka widzi w E3–E4 i w salonie, a brakujące grafiki pozostałych etapów M7 spisuje jako listę do domówienia. Priority: must-have
  > Socrates: Kontrargument: „paczka A v1 nie ma mebli salonu w 30 wariantach ani ikon do wszystkich typów; „żaden placeholder” może blokować M7 na grafikę, której jeszcze nie ma”. Rozstrzygnięcie: kryterium zawężone do ekranów E3–E4 i salonu, reszta jako lista braków.

### M8 — testy z graczem
- FR-027: Autor dostraja balans (tempo gwiazdek, koszty mebli, progi opanowania) i czytelność poleceń wyłącznie w danych gry na podstawie obserwacji córki oraz miar odczytanych z historii w zapisie (np. czas na pokój, odsetek drugich prób per umiejętność). Priority: must-have
  > Socrates: Kontrargument: „bez danych obserwacja jest wrażeniem”. Rozstrzygnięcie: M8 ma kryteria pomiaru z historii zadań w zapisie.

### Po v1 — opinia rodzica, raport o błędzie, statystyki odwiedzin

Wymagania dodane 2026-10-21 (decyzje autora z 2026-10-20/21). Wchodzą po zamknięciu M0–M8, jako osobny etap; nie zmieniają kolejności M0–M8.

- FR-028: Rodzic w ustawieniach (za bramką dla dorosłych) może napisać opinię lub komentarz o grze (tekst, opcjonalnie adres e-mail do odpowiedzi) i wysłać ją autorowi gry; do opinii dołączana jest wersja gry i typ urządzenia, nigdy dane dziecka (postęp, etap, imię, historia). Bez sieci opinia czeka i wysyła się przy następnym połączeniu, a rodzic wie, że jeszcze nie wyszła; nieudana wysyłka kończy się spokojnym komunikatem, nie utratą tekstu. Priority: must-have (po v1)
- FR-029: Rodzic może wysłać autorowi raport o błędzie z karty awarii („Ups!”) i z sekcji „Zapis gry”: raport zawiera kod błędu, wersję gry, typ urządzenia i kilka linii technicznych, bez danych dziecka; każdy raport wysyła rodzic jednym stuknięciem, gra nigdy nie wysyła go sama. Priority: must-have (po v1)
- FR-030: Autor widzi zbiorcze statystyki odwiedzin strony gry: unikalni odwiedzający (dzień, tydzień, miesiąc), nowi i powracający, uruchomienia gry z siecią, typ urządzenia, źródła wejść, odsetek urządzeń z najnowszą wersją, błędy pobierania. Statystyki powstają wyłącznie z obsługi pobierania i aktualizacji gry, bez żadnego kodu w grze; adresy odwiedzających są skracane, a surowe zapisy usuwane po 30–90 dniach. Priority: must-have (po v1)
- FR-031: Rodzic może przeczytać krótką stronę „Prywatność” (link dostępny dla rodzica): co gra zbiera przy pobieraniu i aktualizacji, co zawiera opinia i raport o błędzie, po co, jak długo jest przechowywane i jak poprosić o usunięcie; dane dziecka nie opuszczają urządzenia poza świadomym eksportem i wysyłkami z FR-028–FR-029. Priority: must-have (po v1)

### Po v1 — ulica i domy

Kierunek dodany 2026-10-22 (decyzja autora po przeglądzie dwóch gier o urządzaniu domu): po salonie gra rośnie w ulicę z domami, które dziecko urządza po kolei. Wchodzi po zamknięciu M0–M8, jako osobny etap; nie zmienia kolejności M0–M8 ani reguły zdobywania gwiazdek. Odpowiada na ryzyko motywacji po salonie (Open Questions, punkt 5).

- FR-032: Dziecko widzi ulicę z działkami. Pierwszy dom stoi na pierwszej działce i zawiera salon; wszystko, co dziecko urządziło w salonie przed tą zmianą, zostaje bez straty. Pozostałe działki są zamknięte z zapowiedzią „Wkrótce” i otwierają się kolejno, gdy poprzedni dom jest gotowy. Priority: must-have (po v1)
- FR-033: Dom składa się z kilku pokoi (np. salon, kuchnia, pokój dziecięcy); każdy pokój działa jak salon: najpierw ściany i podłoga, potem elementy z 3 wariantami opłacane gwiazdkami w kolejności z danych pokoju. Kolejny pokój domu otwiera się po ukończeniu poprzedniego. Ściany i podłoga mogą być dwoma osobnymi wyborami z wariantami, a wśród elementów pokoju mogą być, poza meblami, okna, obrazy, rośliny, dywany i drobiazgi. Elementy stoją na stałych miejscach (bez swobodnego przesuwania i obracania). Priority: must-have (po v1)
- FR-034: Gdy wszystkie pokoje domu są gotowe, wprowadzają się mieszkańcy (np. rodzina albo zwierzaki): krótka scenka z obrazkiem i jednym zdaniem podziękowania, bez dialogów i wyborów. Dom zostaje na ulicy jako zamieszkany; dziecko może do niego wejść, oglądać go i zmieniać warianty za darmo. Mieszkańcy dają pamiątkę, która nie jest walutą (np. naklejkę do albumu albo list). Priority: must-have (po v1)
- FR-035: Gwiazdki z rund zadań pozostają jedyną walutą gry. Domy nie przynoszą dochodu, nie są sprzedawane ani wynajmowane za gwiazdki i nic, co dziecko urządziło, nie znika ani nie jest oddawane. Priority: must-have (po v1)
- FR-036: Po kilku domach otwiera się kolejna ulica lub dzielnica w innym otoczeniu (np. nad morzem, w górach); liczba domów na ulicy, pokoje domów i kolejność dzielnic są danymi gry, więc nowy dom lub ulica to dane i grafika. Priority: nice-to-have (po v1)

### Po v1 — przewodnik w zeszycie

Dodane 2026-10-22 (decyzja autora po przeglądzie aplikacji matematycznych dla dzieci).

- FR-037: W rogu zeszytu z zadaniami siedzi mały przewodnik (zwierzątko w stylu grafik gry) w trzech pozach: spokój, radość po dobrej odpowiedzi, zamyślenie po pomyłce. Nie mówi, nie ma dialogów ani historii, nie zasłania zadania i nigdy nie okazuje zawodu; przy systemowym „ogranicz ruch” zmienia pozę bez animacji. Priority: nice-to-have (po v1)


- Gra uruchamia się offline z ikony na ekranie początkowym do ekranu gry w < 3 s na tablecie sprzed 3–4 lat.
- Reakcja na dotyk (podświetlenie kafelka, wpisanie cyfry) jest widoczna w < 100 ms; animacja lotu gwiazdki nie blokuje przejścia do następnego zadania.
- Każdy cel dotykowy dla dziecka ma ≥ 96 px w scenie 1920×1080 (≥ 48 px CSS na ekranie 1024×768), a tekst poleceń ≥ 64 px w scenie; polskie znaki pochodzą z czcionki dołączonej lokalnie.
- Gra działa w pełni na tablecie z Androidem (Chrome), na iPadzie (Safari) oraz w przeglądarce na komputerze (Chrome, Safari) myszką.
- Lektor działa tam, gdzie urządzenie ma polski głos; brak głosu nie blokuje żadnego przepływu.
- Prywatność: gra nie wysyła niczego automatycznie. Wyjątki: pobranie i aktualizacja gry oraz wysyłki uruchomione świadomie przez rodzica za bramką dla dorosłych (opinia, raport o błędzie), zawsze bez danych dziecka. Brak telemetrii, analityki w grze i czcionek z sieci; statystyki odwiedzin (FR-030) nie wymagają kodu w grze. Dane dziecka nigdy nie opuszczają urządzenia poza świadomym eksportem przez rodzica.
- Dostępność: gra szanuje systemowe ustawienie „ogranicz ruch” (animacja lotu gwiazdki wyłączona) i jest w pełni grywalna bez dźwięku; żadna informacja nie jest przekazywana wyłącznie dźwiękiem lub wyłącznie kolorem.

## Business Logic

Gra dobiera każde kolejne zadanie z kroków, które dziecko ma odblokowane w swoim etapie programu, ważąc bieżący krok, powtórki i poprzedni etap, a opanowanie umiejętności odblokowuje kolejne kroki i łagodzi trudność po słabych rundach.

Wejścia reguły (widoczne dla użytkownika): etap ustawiony przy pierwszym uruchomieniu (wiek jako podpowiedź, rodzic potwierdza), wynik rozgrzewki, historia odpowiedzi dziecka (poprawna / błędna, pierwsza czy druga próba) per umiejętność, wynik ostatnich rund. Wyjście: następne zadanie (typ, krok, zakres liczb, forma odpowiedzi), moment odblokowania kolejnego kroku („Nowa umiejętność!”) oraz chwilowe złagodzenie trudności (mniejszy zakres, tryb z obrazkami) po dwóch słabych rundach z rzędu. Wartości wag, długości serii i progów są danymi balansu, nie częścią reguły.

Dziecko spotyka regułę pośrednio: zadania „same” stają się trochę trudniejsze, gdy idzie dobrze, i łatwiejsze, gdy się myli; jedynym jawnym sygnałem jest scenka odblokowania. Rodzic widzi jej skutek w podglądzie postępów (bieżący krok, najsłabsze umiejętności).

Reguły wspierające (opisane w FR): (1) generowanie: każde zadanie jest oryginalne, w zakresie liczb etapu, z poprawną odpowiedzią, rozpraszaczami i podpowiedzią krok po kroku (FR-004, FR-023); (2) wymiana: każda poprawna odpowiedź daje gwiazdkę, a gwiazdki opłacają kolejne zadania remontowe pokoju w kolejności z danych pokoju (FR-007, FR-016, FR-017); po v1 pokoje składają się w domy, a domy w ulicę, bez innego źródła gwiazdek (FR-032–FR-035).

## Access Control

Brak logowania i kont. Jeden profil dziecka na urządzeniu; dane (gwiazdki, pokoje, postęp nauki) żyją wyłącznie lokalnie. Nie ma przełączania profili w v1; rodzeństwo to temat „Później” (plan, sekcja 11), więc format zapisu ma zostawić miejsce na profile, ale UI ich nie pokazuje.

Dwie role na tym samym urządzeniu, rozdzielone wyłącznie bramką UI:

- **Dziecko**: rozwiązuje zadania, wydaje gwiazdki, urządza pokoje, zmienia warianty. Nie widzi ustawień.
- **Rodzic**: wchodzi do ukrytych ustawień przez długie przytrzymanie ikony **plus bramkę dla dorosłego** (np. proste działanie do rozwiązania); tam zmienia etap, ogląda postępy, eksportuje/importuje zapis, resetuje grę z potwierdzeniem, a po v1 wysyła opinię lub raport o błędzie (FR-028–FR-029). Dziecko nie może niczego wysłać. Bramka chroni reset i zmianę etapu przed celowym wejściem dziecka, nie tylko przed przypadkowym.

## Non-Goals

Funkcjonalne:
- Brak fabuły, dialogów, postaci i wydarzeń czasowych: Martynka to nazwa gry, nie bohaterka; pętla nagrody nie potrzebuje narracji (plan, sekcja 12). Wyjątki po v1: mieszkańcy gotowego domu (obrazek i jedno zdanie podziękowania, FR-034) oraz niemy przewodnik w rogu zeszytu (FR-037), bez dialogów, wyborów i historii.
- Brak kupna, sprzedaży i wynajmu domów oraz dochodu pasywnego: dom urządzony przez dziecko nie znika, a jedynym źródłem gwiazdek są rozwiązane zadania (FR-035).
- Brak swobodnego ustawiania i obracania mebli: elementy stoją na stałych miejscach pokoju, co jest prostsze dotykiem dla 6–8-latka (FR-033).
- Brak energii, timerów, reklam, zakupów, sklepu i rankingu: gra ma zero presji i zero monetyzacji; nie da się przegrać ani niczego stracić.
- Brak wielu profili, kont, chmury i synchronizacji: jeden profil lokalny; rodzeństwo to temat po v1, format zapisu ma tylko zostawić na to miejsce.
- Brak merge boardu: zadania matematyczne zastępują go całkowicie.
- Brak drugiego pokoju z grafiką, pełnej puli minigier (1–2 w v1) i pełnej puli zagadek (10–15 dla E3–E4 w v1): v1 skupia się na etapach E3–E4 i salonie.
- Brak pełnego dopracowania treści E1–E2 i E5–E6: generatory działają dla wszystkich etapów, ale jakość poleceń i podpowiedzi jest gwarantowana w v1 dla E3–E4 (FR-004); reszta po M8.
- Brak osobnego raportu postępów poza grą: podgląd w ustawieniach i eksport zapisu wystarczą.
- Brak automatycznych statystyk nauki (ile rund, jakie etapy, które umiejętności sprawiają trudność), nawet zbiorczych: to dane o dziecku, a przy kilku rodzinach statystyka nic nie mówi. Później, przy dużej liczbie graczy: najwyżej opcja domyślnie wyłączona, włączana przez rodzica.

Niefunkcjonalne:
- Brak układu pionowego i wsparcia telefonu: tablet w poziomie; w pionie nakładka „Obróć tablet” (FR-002).
- Brak gwarancji dla przeglądarek innych niż Chrome na Androidzie, Safari na iPadzie oraz Chrome/Safari na komputerze.

## Open Questions

1. **Rozgrzewka po ustawieniu etapu przez rodzica** (FR-012): czy rozgrzewka 6 zadań nadal koryguje etap w dół, gdy rodzic ustawił go świadomie, czy jest pomijana? Właściciel: autor. Rozstrzygnąć w M3.
2. **Które 1–2 minigry wchodzą do v1** (FR-024) i jaki mnożnik gwiazdek za zagadkę dnia (FR-025, liczba w balansie). Właściciel: autor. Rozstrzygnąć na początku M6.
3. **Zgodność M1 z planem**: plan (sekcja 11) wymaga testów 1000 losowań dla każdej umiejętności wszystkich etapów; FR-004 zawęża pełną jakość treści do E3–E4, zachowując testy mechaniczne dla wszystkich. Doprecyzować kryterium „gotowe” M1 w roadmapie. Właściciel: autor. Stan: plan zaktualizowany 2026-10-11, do potwierdzenia w `/10x-roadmap`.
4. **Cicha aktualizacja (FR-003) zamiast strategii „prompt” z planu (sekcja 9)**: plan do zaktualizowania przy M0. Właściciel: autor. Stan: plan zaktualizowany 2026-10-11.
5. **Ryzyko: motywacja po salonie**: jeden pokój to ok. 10 zadań remontowych; salon może skończyć się szybciej niż zainteresowanie (albo odwrotnie). Mierzy M8; drugi pokój jest pierwszą rzeczą po v1 i zależy od grafiki. Kierunek po v1 (2026-10-22): ulica i domy (FR-032–FR-036). Właściciel: autor.
6. **Ryzyko: grafika mebli**: paczka A v1 nie zawiera 10 slotów × 3 wariantów mebli salonu ani ikon do wszystkich typów zadań; M7 zależy od osobnej pracy graficznej autora poza kodem. Opóźnienie grafiki = opóźnienie M7 (FR-026 zawężone do ekranów E3–E4 i salonu). Właściciel: autor. Rozstrzygnąć (termin dostarczenia grafiki) przed M7.
7. **Ryzyko: lektor**: polski głos systemowy na tablecie może być słaby lub go brak (na Androidzie zależy od zainstalowanej syntezy mowy). Łagodzenie: przycisk ukryty bez głosu, automatyczne czytanie jako ustawienie rodzica (FR-009), córka w E3 czyta sama. Właściciel: autor. Sprawdzić na docelowym tablecie w M2.
8. **Przechowywanie opinii i raportów** (FR-028–FR-029): jak długo autor trzyma opinie i raporty (propozycja: 12 miesięcy) i czy adres e-mail jest usuwany wcześniej, po odpowiedzi. Właściciel: autor. Rozstrzygnąć przed etapem po v1. **Rozstrzygnięte 2026-10-25 (autor):** opinie i raporty są przechowywane 12 miesięcy od wysłania, potem usuwane; adres e-mail jest usuwany zaraz po odpowiedzi autora, najpóźniej razem z opinią po 12 miesiącach.
9. **Ochrona przed nadużyciem wysyłek** (FR-028–FR-029): ile opinii i raportów z jednego urządzenia w danym czasie jest w porządku, zanim kolejne zostaną odrzucone; jak autor dowiaduje się o nowej opinii. Właściciel: autor. Rozstrzygnąć w planie etapu po v1. **Rozstrzygnięte 2026-10-25 (autor):** z jednego adresu sieciowego najwyżej 5 wysyłek na godzinę i 20 na dobę; kolejne są odrzucane, a rodzic widzi spokojny komunikat „spróbuj później” bez utraty tekstu. Autor dostaje raz dziennie e-mail z samą liczbą nowych opinii i raportów (bez treści); treść czyta na serwerze komendą dostępną tylko dla niego.
10. **Gdzie rodzic znajduje stronę „Prywatność”** (FR-031): ekran powitalny dla rodzica, ustawienia, czy oba. Właściciel: autor. Rozstrzygnąć w planie etapu po v1. **Rozstrzygnięte 2026-10-25 (autor):** w obu miejscach — na ekranie powitalnym przy ścieżce „Rodzic” (żeby rodzic przeczytał ją przed bramką) i w ustawieniach rodzica.
11. **Wielkość domu i ulicy** (FR-032–FR-036): ile pokoi ma dom (propozycja: 3), ile domów ma ulica i czy pierwszy dom to salon plus dwa nowe pokoje. Zależy od tempa z M8 (czas na pokój). Właściciel: autor. Rozstrzygnąć po M8, przed planem etapu.
12. **Pamiątka od mieszkańców** (FR-034): naklejka do albumu, list czy nowy wzór do następnego domu; czy album jest osobnym ekranem. Właściciel: autor. Rozstrzygnąć w planie etapu.
13. **Grafika ulicy i nowych pokoi** (FR-032–FR-033): widok ulicy z działkami, dom z zewnątrz (pusty i zamieszkany), mieszkańcy i pokoje drugiego domu; co z istniejących paczek grafik da się użyć, a co trzeba wygenerować w tym samym stylu. Właściciel: autor. Rozstrzygnąć przed etapem (inwentaryzacja grafik).
