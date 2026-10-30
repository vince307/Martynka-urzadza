# Martynka-urzadza.md — „Martynka urządza" (zadania matematyczne + urządzanie pokoi)

## 1. Cel

Gra dla dziecka w wieku szkolnym (klasy 1–3), wzorowana na pętli „zdobywaj gwiazdki → remontuj i mebluj pokoje” z Gossip Harbor. Gwiazdki zdobywa się, rozwiązując zadania matematyczne dopasowane do wieku i etapu nauki (program klas 1–3, wg podręczników Nowej Ery). Najważniejsza nagroda to budowanie i meblowanie; matematyka jest drogą do niej.

Założenia:

- Całość po polsku, duże i czytelne elementy, lektor (automatyczne czytanie poleceń to ustawienie rodzica, domyślnie wyłączone dla każdego etapu).
- Bez energii, reklam, zakupów i kont. Nie da się przegrać, gwiazdek się nie traci.
- Tablet w orientacji poziomej, sterowanie wyłącznie dotykiem. Działa też w przeglądarce na komputerze.
- PWA: instalowana na ekranie początkowym, działa offline.
- Bez backendu dla rozgrywki. Postęp zapisywany lokalnie na urządzeniu. Gra nie wysyła niczego automatycznie (brak telemetrii, analityki, czcionek z sieci). Wyjątki: pobranie i aktualizacja gry oraz wysyłki uruchomione świadomie przez rodzica za bramką dla dorosłych (opinia, raport o błędzie; po v1, PRD FR-028–FR-029), zawsze bez danych dziecka.
- Jeden profil dziecka na urządzeniu (format zapisu zostawia miejsce na profile, UI ich nie pokazuje). Urządzenia docelowe: tablet z Androidem (Chrome), iPad (Safari), komputer (Chrome/Safari, myszka).
- Grafiki generowane osobno przez autora. Kod do końca etapu M5 działa na placeholderach.

Szczegóły zadań matematycznych: **`docs/ZADANIA.md`** (etapy, kroki, typy zadań, zakresy liczb, model danych generatora).

## 2. Pętla rozgrywki

1. Przy pierwszym uruchomieniu dziecko podaje wiek. Gra proponuje etap programu (E1–E6), a rodzic (po bramce dla dorosłego) potwierdza go lub zmienia przed startem; wiek jest tylko podpowiedzią. Krótka rozgrzewka koryguje start w dół. Dopóki dziecko nie skończy pierwszej rundy, przycisk „Wróć” na rozgrzewce i w pierwszej rundzie cofa je do wyboru wieku; potem etap zmienia już tylko rodzic.
2. Na ekranie zadań dziecko rozwiązuje rundę zadań (domyślnie 5, liczba w `balance.ts`). Każde poprawne daje gwiazdkę (także w drugiej próbie), runda bez błędu daje bonus.
3. Trudność dostosowuje się sama: opanowane umiejętności odblokowują kolejne kroki etapu.
4. W pokoju dziecko wydaje gwiazdki na kolejne zadanie remontowe (np. „Napraw podłogę”).
5. Wybiera jeden z 3 wariantów wyglądu elementu; gwiazdki są odejmowane dopiero przy zatwierdzeniu „Wybieram”.
6. Po ukończeniu wszystkich zadań pokój jest gotowy. W v1 jest jeden pokój (salon); po jego ukończeniu gra oferuje „poprawki” (zmiana wariantów) i dalsze rundy, a mechanika odblokowania kolejnego pokoju istnieje w danych. Kolejny pokój to v1.1.
7. Wariant każdego urządzonego elementu można później zmienić za darmo (przytrzymanie elementu albo tryb „zmień”, nie zwykłe stuknięcie).

## 3. Stack

- Phaser 4 (aktualnie 4.2.x) + TypeScript + Vite. Start: `npm create @phaserjs/game@latest`, szablon Vite + TypeScript. Po wygenerowaniu sprawdzić, że w `package.json` jest `phaser` w wersji `^4`.
- `vite-plugin-pwa` (manifest + service worker, precache wszystkich assetów).
- `idb-keyval` do zapisu w IndexedDB.
- `vitest` do testów logiki.
- Web Speech API (`speechSynthesis`, głos `pl-PL`) dla lektora; bez głosu — przycisk lektora ukryty.
- Hosting statyczny z HTTPS (GitHub Pages / Cloudflare Pages / Netlify).

Uwaga dla agenta: API Phaser 4 jest prawie identyczne z Phaser 3, ale renderer i filtry są nowe. Przed użyciem mniej oczywistych funkcji sprawdzić dokumentację v4 i zainstalować oficjalne pliki skills Phasera, zamiast polegać na pamięci o v3.

## 4. Architektura

Zasada: logika gry to czysty TypeScript bez importów z Phasera. Sceny tylko rysują stan i przekazują akcje gracza. Dzięki temu logikę da się testować w vitest.

```
src/
  core/                # czysta logika, bez Phasera
    types.ts
    tasks/
      generators/      # jeden plik na typ zadania z ZADANIA.md (addSub.ts, missing.ts, mult.ts, word.ts, ...)
      curriculum.ts    # wybór umiejętności do rundy, wagi, odblokowywanie kroków
      mastery.ts       # liczniki opanowania, adaptacja trudności
      round.ts         # runda 5 zadań, podpowiedzi, druga próba, nagrody
      placement.ts     # wiek + miesiąc -> etap, rozgrzewka
    rooms.ts           # zadania remontowe, warianty, odblokowywanie
    save.ts            # serializacja, wersjonowanie, migracje
    rng.ts             # generator losowy z seedem (testowalność)
  data/                # cała treść gry jako dane
    curriculum/        # E1.ts ... E6.ts — kroki i umiejętności z parametrami (wg ZADANIA.md, sekcja 3)
    wordTemplates.ts   # szablony zadań tekstowych, konteksty, imiona
    logicPuzzles.ts    # ręczna pula zagadek
    rooms.ts           # pokoje, sloty, zadania remontowe
    balance.ts         # nagrody, koszty, progi opanowania
    pl.ts              # teksty interfejsu
  scenes/
    BootScene.ts       # ładowanie assetów, pasek postępu
    WelcomeScene.ts    # pierwsze uruchomienie: wiek, rozgrzewka
    TaskScene.ts       # runda zadań
    RoomScene.ts       # pokój, zadania remontowe, wybór wariantu
    UIScene.ts         # licznik gwiazdek, przełącznik zadania/pokój
  ui/
    widgets/           # klawiaturka, kafelki odpowiedzi, zegar, linijka, monety, oś liczbowa, słupek pisemny
  storage/
    idb.ts             # zapis/odczyt IndexedDB, eksport/import pliku
  main.ts
docs/
  ZADANIA.md
  zrodla/              # notatki z analizy podręczników (tylko do wglądu)
public/assets/         # atlasy, tła, dźwięki
tests/
```

Dodanie nowego pokoju, kroku programu lub szablonu zadania = zmiana wyłącznie w `data/` (i ewentualnie grafiki).

## 5. Model danych

```ts
// --- treść (statyczna) ---
type StageId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

interface SkillDef {
  id: string;               // np. "E2.3.add_bridge_9"
  stage: StageId;
  step: number;             // krok etapu (ZADANIA.md, sekcja 3)
  type: string;             // typ zadania (ZADANIA.md, sekcja 4), np. "ADD_SUB"
  params: Record<string, unknown>;
  answer: 'tiles' | 'keypad' | 'drag' | 'select';
}

interface SlotDef {
  id: string;               // np. "sofa"
  x: number; y: number;     // pozycja w scenie 1920x1080
  depth: number;            // kolejność rysowania
  emptyFrame?: string;      // wygląd przed remontem (opcjonalny)
  variants: [string, string, string]; // ramki atlasu
}

interface RoomTaskDef {
  id: string;
  slot: string;             // którego slotu dotyczy
  label: string;            // klucz tekstu, np. "Wstaw kanapę"
  cost: number;             // gwiazdki
}

interface RoomDef {
  id: string;               // np. "salon"
  name: string;
  background: string;       // tło w wersji zaniedbanej
  slots: SlotDef[];
  tasks: RoomTaskDef[];     // wykonywane po kolei
}

// --- stan (zapisywany) ---
interface LearnerState {
  age: number;
  stage: StageId;
  stageOverriddenByParent: boolean;
  unlockedStep: Record<StageId, number>;  // najwyższy odblokowany krok w etapie
  mastery: Record<string, number>;        // skillId -> 0..5
  streak: Record<string, number>;         // poprawne z rzędu
  history: { skillId: string; ok: boolean; firstTry: boolean; at: number }[]; // ostatnie ~200
}

interface RoomState {
  tasksDone: number;                      // ile zadań remontowych ukończono
  chosen: Record<string, 0 | 1 | 2>;      // slot -> wybrany wariant
}

interface Settings {
  autoRead: boolean;                      // automatyczne czytanie poleceń (ustawienie rodzica)
}

interface SaveState {
  version: number;
  stars: number;
  learner: LearnerState;
  rooms: Record<string, RoomState>;
  currentRoom: string;
  settings: Settings;
  rngSeed: number;
}
```

Typy `Task` i `TaskParams` generatorów: `ZADANIA.md`, sekcja 7.

## 6. Ekran zadań

- Układ: po lewej duże polecenie (tekst + ewentualny rysunek: zegar, monety, obiekty), po prawej obszar odpowiedzi (kafelki lub klawiaturka 0–9 z „kasuj” i „OK”). Na górze kropki postępu rundy (tyle, ile wynosi długość rundy z `balance.ts`).
- Przycisk głośnika przy poleceniu; automatyczne czytanie to ustawienie rodzica (`settings.autoRead`, domyślnie wyłączone dla każdego etapu, rodzic włącza je w ustawieniach). Bez polskiego głosu przycisk ukryty.
- Licznik gwiazdek jest zawsze widoczny; przełącznik zadania/pokój jest ukryty w trakcie rozwiązywania zadania, widoczny między zadaniami i w pokoju.
- Poprawna odpowiedź: gwiazdka leci do licznika, krótki dźwięk, następne zadanie.
- Błędna: delikatne potrząśnięcie, podpowiedź (pierwszy krok z `hint`), druga próba. Druga pomyłka: pokazanie rozwiązania krok po kroku, potem dziecko jeszcze raz wpisuje wynik (bez gwiazdki) i przechodzi dalej.
- Koniec rundy: podsumowanie (ile gwiazdek), przyciski „Kolejna runda” i „Do pokoju”. Gdy gwiazdek wystarcza na bieżące zadanie remontowe, „Do pokoju” jest wyróżnione.
- Co kilka rund zamiast zwykłej rundy minigra (ZADANIA.md, sekcja 5) lub „zagadka dnia” za podwójne gwiazdki (mnożnik ×2 w `balance.ts`). W v1: Hasło z wyników i Zakrywanka oraz pula 10–15 zagadek dla E3–E4; reszta później.
- Brak limitu czasu. Brak czerwonych krzyżyków i komunikatów „źle”.

Wartości startowe (`balance.ts`): długość rundy 5; 1 gwiazdka za zadanie, +2 za rundę bez błędu, druga próba też daje 1 gwiazdkę (ale nie liczy się do opanowania umiejętności); koszt zadania remontowego 5–15 gwiazdek (czyli ok. 1–3 rundy na jeden mebel). Wagi losowania (60/30/10), reguła różnorodności rundy (najwyżej 2 zadania tego samego typu, nigdy dwa takie same z rzędu; rozgrzewka też), długość serii i progi opanowania też są liczbami w `balance.ts`, nie stałymi w kodzie.

## 7. Pokój i meblowanie

- Scena pokoju: tło + sprite'y slotów ułożone według `depth`.
- Slot bez ukończonego zadania pokazuje `emptyFrame` albo nic.
- Na dole przycisk bieżącego zadania remontowego z kosztem (koszty i kolejność to dane pokoju w `data/rooms.ts`). Za mało gwiazdek = przycisk wyszarzony z „masz X/Y”, stuknięcie przenosi do zadań.
- Stuknięcie przycisku otwiera panel z 3 miniaturami wariantów. Stuknięcie miniatury od razu pokazuje podgląd w pokoju, przycisk „Wybieram” zatwierdza i dopiero wtedy odejmuje gwiazdki.
- Zatwierdzenie: krótka animacja (tween skali + cząsteczki), dźwięk.
- Przytrzymanie urządzonego slotu (albo tryb „zmień”) otwiera ten sam panel, zmiana jest darmowa. Zwykłe stuknięcie nie otwiera panelu, żeby przypadkowe dotknięcia nie przesłaniały pokoju.
- Po ostatnim zadaniu: ekran „Pokój gotowy!”. Lista pokoi (miniatury) ma w v1 jedną pozycję (salon) i zapowiedź; mechanika odblokowania kolejnego pokoju istnieje w danych. Po ukończeniu salonu dziecko może robić „poprawki” i dalsze rundy.

## 8. Zapis postępu

- Autozapis do IndexedDB po każdej akcji zmieniającej stan (z debounce ok. 500 ms) oraz przy `visibilitychange`. Po zdarzeniach nieodwracalnych (zapłata za mebel, koniec rundy) zapis natychmiastowy, bez debounce.
- Pole `version` i funkcja migracji w `core/save.ts`, żeby stare zapisy przetrwały aktualizacje gry. Nieudana migracja zostawia stary zapis nietknięty i pokazuje rodzicowi możliwość eksportu zamiast pustej gry.
- W ustawieniach rodzica (ukrytych za długim przytrzymaniem ikony plus bramką dla dorosłego, np. prostym działaniem do rozwiązania, żeby dziecko nie weszło ani przypadkiem, ani celowo): zmiana etapu, automatyczne czytanie poleceń, zwięzły podgląd postępów (bieżący krok etapu i 3 najsłabsze umiejętności z przykładami błędów, nie pełna tabela), eksport zapisu do pliku JSON, import (plik walidowany, przed nadpisaniem podsumowanie: gwiazdki, etap, postęp pokoju), reset gry z potwierdzeniem.
- Po starcie wywołać `navigator.storage.persist()`.
- iPad: Safari może usuwać dane stron nieużywanych przez dłuższy czas, dlatego grę trzeba dodać do ekranu początkowego.

## 9. PWA i ekran

- Manifest: `name: "Martynka urządza"`, `short_name: "Martynka"`, `display: fullscreen`, `orientation: landscape`, ikony 192 i 512 px, kolor tła zgodny z ekranem ładowania.
- Service worker: precache całego buildu razem z assetami, cicha aktualizacja przy następnym uruchomieniu (bez pytania; dziecko nie decyduje o aktualizacji, zapis chronią migracje).
- Przy pierwszym uruchomieniu w przeglądarce (nie z ikony) krótka instrukcja „Dodaj do ekranu początkowego” dopasowana do iPada i Androida; gra działa też bez instalacji.
- Skalowanie: `Phaser.Scale.FIT` + `CENTER_BOTH`, rozdzielczość bazowa 1920 × 1080.
- CSS: `touch-action: none`, wyłączone zaznaczanie tekstu, przewijanie i zoom strony.
- Jeśli urządzenie jest w pionie: nakładka „Obróć tablet”.
- Czcionka z polskimi znakami dołączona lokalnie (bez pobierania z sieci), cyfry wyraźne i duże.
- Dźwięk startuje po pierwszym dotknięciu ekranu. Gra jest w pełni grywalna bez dźwięku; żadna informacja nie jest przekazywana wyłącznie dźwiękiem lub wyłącznie kolorem.
- Gra szanuje systemowe „ogranicz ruch” (animacja lotu gwiazdki wyłączona).
- Wymagania mierzalne: start offline z ikony do ekranu gry < 3 s na tablecie sprzed 3–4 lat; reakcja na dotyk < 100 ms; cele dotykowe ≥ 96 px w scenie 1920×1080 (≥ 48 px CSS na 1024×768), tekst poleceń ≥ 64 px w scenie.

## 10. Assety

| Rodzaj | Format | Uwagi |
|---|---|---|
| Tło pokoju | 1920 × 1080 (źródło 2×), WebP | wersja zaniedbana |
| Meble / elementy | PNG z przezroczystością, przycięte | 3 warianty na slot, ten sam kąt i światło |
| Ikony do zadań | 128–256 px, przezroczyste tło | przedmioty do liczenia (ciastka, kwiaty, filiżanki…), czytelne w małym rozmiarze |
| Monety i banknoty | PNG | polskie nominały w stylu gry (rysowane, nie zdjęcia) |
| Pomoce | PNG lub rysowane w kodzie | waga szalkowa z odważnikami, naczynia z poziomem, termometr |
| UI | przyciski, kafelki, klawiaturka, panel, gwiazdka | 9-slice dla paneli |
| Dźwięki | OGG + M4A | dobra odpowiedź, podpowiedź, nagroda, wybór, tło |

Zegar, linijka, oś liczbowa, klocki dziesiątkowe, słupek pisemny i figury rysujemy w kodzie (Phaser Graphics), bez grafik.

Nazewnictwo: `rooms/<pokoj>/bg.webp`, `rooms/<pokoj>/<slot>_v1.png`, `tasks/icons/<nazwa>.png`, `tasks/money/<nominal>.png`, `ui/<nazwa>.png`. Elementy pakowane w atlasy (np. free-tex-packer), klucze ramek = ścieżki bez rozszerzenia.

Do etapu M5 placeholdery generowane w kodzie: kolorowe kształty z podpisem.

Zakres grafik na v1: 1 tło, 30 elementów (10 slotów × 3 warianty), ok. 12 ikon do liczenia, zestaw UI. Monety i pomoce w M6.

## 11. Etapy

**M0 — szkielet.** Projekt z szablonu, Phaser 4, skalowanie, pusta scena, PWA (cicha aktualizacja, instrukcja instalacji), usunięcie telemetrii szablonu (`log.js`), deploy na hosting.
Gotowe, gdy: gra otwiera się na tablecie z adresu URL, da się ją dodać do ekranu początkowego i uruchomić offline.

**M1 — generatory zadań (bez grafiki).** `core/tasks/generators` dla typów z grupy 1 w ZADANIA.md, sekcja 7 (ADD_SUB, MISSING, BONDS, COMPLEMENT, CHAIN, MISSING_OP, COMPARE_NUM, COMPARE_EXPR, SEQUENCE, EVEN_ODD, MULT, DIV, FACT_FAMILY, WORD, CHOOSE_OP, NUMBER_WORDS, ROMAN, CALENDAR). Dane `data/curriculum/E1–E6`. Testy: dla każdej umiejętności 1000 losowań (zakres, brak ujemnych, przekroczenie progu zgodne z parametrami, rozpraszacze różne od odpowiedzi, poprawne polskie odmiany w treściach).
Pełna jakość treści (polecenia, podpowiedzi) jest wymagana dla E3–E4; E1–E2 i E5–E6 działają na wspólnych generatorach z danymi etapu, a dopracowanie ich treści przesuwa się do M8/v1.1. Testy mechaniczne obejmują wszystkie etapy.
Gotowe, gdy: testy przechodzą, a skrypt `npm run sample -- E3` wypisuje po 3 przykładowe zadania z każdego kroku etapu i raportuje naruszenia (wynik poza zakresem, liczby ujemne, zła odmiana).

**M2 — ekran zadań i gwiazdki.** `round.ts`, `TaskScene`, kafelki, klawiaturka, podpowiedzi (z przepisaniem wyniku po pokazaniu rozwiązania), lektor, licznik gwiazdek w `UIScene` (przełącznik ukryty w trakcie zadania), podsumowanie wyróżniające „Do pokoju”, gdy stać na mebel.
Gotowe, gdy: na tablecie da się wygodnie rozwiązać rundę palcem i dostać gwiazdki.

**M3 — wiek, etapy, adaptacja.** `placement.ts`, `WelcomeScene` (wiek jako podpowiedź, rodzic potwierdza etap po bramce), `mastery.ts` (druga próba nie liczy się do opanowania), `curriculum.ts` (wagi, odblokowywanie kroku przy opanowaniu ≥ 4 w większości umiejętności kroku; udział w `balance.ts`), ustawienia rodzica (bramka dla dorosłego, zmiana etapu, automatyczne czytanie, zwięzły podgląd postępów).
Gotowe, gdy: po podaniu wieku gra trafia w sensowny etap, a kolejne kroki odblokowują się po opanowaniu poprzednich.

**M4 — pokój.** `core/rooms.ts`, `RoomScene`, zadania remontowe (koszty i kolejność w danych, przycisk „masz X/Y”), panel wyboru wariantu (płatność przy „Wybieram”), zmiana wariantu po przytrzymaniu, ekran ukończenia pokoju i „poprawki” po ukończeniu. Jeden pokój: salon.
Gotowe, gdy: da się przejść cały pokój od zaniedbanego do urządzonego za gwiazdki z zadań.

**M5 — zapis.** IndexedDB, autozapis (natychmiastowy po zdarzeniach nieodwracalnych), migracje (nieudana zostawia stary zapis), eksport, import z walidacją i podsumowaniem, reset.
Gotowe, gdy: po zamknięciu i ponownym otwarciu gra jest dokładnie w tym samym stanie (gwiazdki, pokoje, postęp nauki).

**M6 — zadania z rysunkami, minigry, zagadki.** Widżety rysowane w kodzie i typy z grup 2–3 w ZADANIA.md, sekcja 7 (COUNT, ORDINAL, PLACE_VALUE, CLOCK, LENGTH, ARROW_TABLE, PUZZLE_GRID, SHAPES, PATTERN, WRITTEN, MONEY_*, MASS, CAPACITY, TEMPERATURE), wdrażane w kolejności etapów córki (E3–E4 najpierw). Na końcu 1–2 minigry z ZADANIA.md, sekcja 5 i pula 10–15 zagadek LOGIC dla E3–E4.
Gotowe, gdy: każdy etap ma pełny zestaw typów z ZADANIA.md, a minigra i zagadka dnia pojawiają się co kilka rund.

**M7 — grafika i dźwięk.** Podmiana placeholderów na docelowe assety, atlasy, animacje (tweeny, cząsteczki), dźwięki, ekran ładowania.
Gotowe, gdy: na ekranach, które dziecko widzi w E3–E4 i w salonie, nie ma żadnego placeholdera; brakujące grafiki pozostałych etapów są spisane jako lista do domówienia.

**M8 — testy z graczem.** Obserwacja gry córki oraz miary z historii w zapisie (czas na pokój, odsetek drugich prób per umiejętność), poprawki balansu (tempo zdobywania gwiazdek, koszt mebli, progi opanowania) i czytelności poleceń wyłącznie w `data/`.
Gotowe, gdy: przejście pokoju zajmuje sensowny czas, zadania nie są ani za łatwe, ani frustrujące.

**Po v1 — opinia rodzica i statystyki** (PRD FR-028–FR-031, decyzje autora 2026-10-20/21): formularz opinii w ustawieniach rodzica (tekst, opcjonalny e-mail, wersja gry i urządzenie, kolejka bez sieci) i „Wyślij raport” na karcie „Ups!” i w „Zapis gry”, wysyłane na własny serwer gry (mały punkt odbioru za tym samym serwerem, który podaje grę); statystyki odwiedzin wyłącznie z logów serwera (zamaskowane adresy, retencja 30–90 dni, raport zbiorczy), bez kodu w grze; strona „Prywatność”. Zmiana w `deploy/` — wykonywana z autorem (synchronizacja i bootstrap serwera), nie w autonomicznym biegu.

**Po v1 — ulica i domy** (PRD FR-032–FR-036, decyzja autora 2026-10-22): po salonie gra rośnie w ulicę z działkami. Pierwszy dom zawiera salon (postęp przechodzi bez straty) i kolejne pokoje (np. kuchnia, pokój dziecięcy), każdy urządzany jak salon: ściany i podłoga, potem elementy z 3 wariantami na stałych miejscach (także okna, obrazy, rośliny, dywany, drobiazgi). Gotowy dom dostaje mieszkańców (obrazek i jedno zdanie podziękowania, pamiątka do albumu, bez dialogów), zostaje na ulicy i można do niego wracać; potem otwiera się kolejna działka, a po kilku domach kolejna dzielnica. Bez sprzedaży, wynajmu i dochodu pasywnego: gwiazdki z rund pozostają jedyną walutą, nic urządzonego nie znika. Inspiracja: przegląd gier „My Cozy Home” (katalog kategorii wystroju) i „My Dream House Makeover” (działka przy ulicy, rozbudowa domu) z 2026-10-22; z obu odrzucone: swobodne ustawianie mebli, reklamy, dochód pasywny. Decyzje 2026-10-30 (PRD v4, FR-038–FR-041): pokoje wybiera się w przekroju domu z piętrami (piętra to dane), jeden pokój w remoncie naraz, „Do pokoju” zawsze trafia do niego, najwyżej trzy poziomy zbliżenia; jedna celebracja o trzech natężeniach zamiast scenek; naklejka do albumu jako pamiątka; budowa „od środka”: kuchnia → przekrój domu → mieszkańcy i album → ulica → dzielnica; pierwszy dom to salon, kuchnia i pokój dziecięcy.

**Później:** pozostałe minigry z ZADANIA.md, sekcja 5 i większa pula zagadek dla wszystkich etapów; dopracowanie treści E1–E2 i E5–E6; kolejne pokoje i domy na ulicy (drugi pokój to pierwsza rzecz po v1, zob. „ulica i domy” wyżej); wiele profili dzieci (np. dla rodzeństwa); układ pionowy; statystyki nauki z gry (tylko przy dużej liczbie graczy, jako opcja domyślnie wyłączona, włączana przez rodzica).

## 12. Poza zakresem v1

Fabuła i dialogi (po v1 wyjątki: mieszkańcy gotowego domu, jedno zdanie podziękowania, i niemy przewodnik w rogu zeszytu, PRD FR-037), kupno, sprzedaż i wynajem domów, energia i timery, konta i synchronizacja w chmurze, wydarzenia czasowe, sklep, ranking.

## 13. Do ustalenia

Rozstrzygnięte w sesji shape (2026-10-10, `context/foundation/shape-notes.md`): pierwszy pokój to salon; urządzenia: tablet z Androidem (Chrome), iPad (Safari), komputer; jeden profil w v1; bez osobnego raportu dla rodzica (podgląd w ustawieniach + eksport zapisu).

Rozstrzygnięte przez autora 2026-10-14 (M6, S-15): minigry v1 to Hasło z wyników i Zakrywanka (wzór ekranów w paczce expansion, obie rysowane kodem); zagadka dnia daje ×2 gwiazdki (mnożnik w `balance.ts`); pulę 10–15 zagadek LOGIC dla E3–E4 pisze agent (oryginalne zagadki, bez przepisywania z podręczników), a autor czyta je jak nauczyciel przed wydaniem.

Nadal otwarte:

- Czy rozgrzewka koryguje etap w dół także wtedy, gdy rodzic ustawił go świadomie, czy jest wtedy pomijana (M3).
- Dokładne kryterium „gotowe” dla M1 przy zawężeniu pełnej jakości treści do E3–E4 (roadmapa).

## 14. Zasady pracy dla agenta

- Realizować etapy po kolei, jeden etap = osobny commit lub PR.
- Najpierw logika w `core/` z testami, potem scena.
- Żadnych liczb balansu ani tekstów w scenach: wszystko z `data/`.
- Treści zadań generować samodzielnie; nie kopiować zadań z podręczników (notatki w `docs/zrodla/` służą tylko do wglądu).
- Identyfikatory i komentarze w kodzie po angielsku, teksty w grze po polsku (z poprawną odmianą liczebników: 1 jabłko, 2 jabłka, 5 jabłek).
- Po każdym etapie sprawdzić build produkcyjny i działanie offline.
