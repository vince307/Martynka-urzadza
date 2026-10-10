# Martynka-urzadza.md — „Martynka urządza" (zadania matematyczne + urządzanie pokoi)

## 1. Cel

Gra dla dziecka w wieku szkolnym (klasy 1–3), wzorowana na pętli „zdobywaj gwiazdki → remontuj i mebluj pokoje” z Gossip Harbor. Gwiazdki zdobywa się, rozwiązując zadania matematyczne dopasowane do wieku i etapu nauki (program klas 1–3, wg podręczników Nowej Ery). Najważniejsza nagroda to budowanie i meblowanie; matematyka jest drogą do niej.

Założenia:

- Całość po polsku, duże i czytelne elementy, lektor dla najmłodszych.
- Bez energii, reklam, zakupów i kont. Nie da się przegrać, gwiazdek się nie traci.
- Tablet w orientacji poziomej, sterowanie wyłącznie dotykiem. Działa też w przeglądarce na komputerze.
- PWA: instalowana na ekranie początkowym, działa offline.
- Bez backendu. Postęp zapisywany lokalnie na urządzeniu.
- Grafiki generowane osobno przez autora. Kod do końca etapu M5 działa na placeholderach.

Szczegóły zadań matematycznych: **`docs/ZADANIA.md`** (etapy, kroki, typy zadań, zakresy liczb, model danych generatora).

## 2. Pętla rozgrywki

1. Przy pierwszym uruchomieniu dziecko podaje wiek. Gra proponuje etap programu (E1–E6), rodzic może go zmienić. Krótka rozgrzewka koryguje start.
2. Na ekranie zadań dziecko rozwiązuje rundę 5 zadań. Każde poprawne daje gwiazdkę, runda bez błędu daje bonus.
3. Trudność dostosowuje się sama: opanowane umiejętności odblokowują kolejne kroki etapu.
4. W pokoju dziecko wydaje gwiazdki na kolejne zadanie remontowe (np. „Napraw podłogę”).
5. Po opłaceniu zadania wybiera jeden z 3 wariantów wyglądu elementu.
6. Po ukończeniu wszystkich zadań pokój jest gotowy i odblokowuje się następny.
7. Wariant każdego urządzonego elementu można później zmienić za darmo.

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

interface SaveState {
  version: number;
  stars: number;
  learner: LearnerState;
  rooms: Record<string, RoomState>;
  currentRoom: string;
  rngSeed: number;
}
```

Typy `Task` i `TaskParams` generatorów: `ZADANIA.md`, sekcja 7.

## 6. Ekran zadań

- Układ: po lewej duże polecenie (tekst + ewentualny rysunek: zegar, monety, obiekty), po prawej obszar odpowiedzi (kafelki lub klawiaturka 0–9 z „kasuj” i „OK”). Na górze 5 kropek postępu rundy.
- Przycisk głośnika przy poleceniu (E1–E2 domyślnie czyta automatycznie).
- Poprawna odpowiedź: gwiazdka leci do licznika, krótki dźwięk, następne zadanie.
- Błędna: delikatne potrząśnięcie, podpowiedź (pierwszy krok z `hint`), druga próba. Druga pomyłka: pokazanie rozwiązania krok po kroku, przejście dalej.
- Koniec rundy: podsumowanie (ile gwiazdek), przyciski „Kolejna runda” i „Do pokoju”.
- Co kilka rund zamiast zwykłej rundy minigra (ZADANIA.md, sekcja 5) lub „zagadka dnia” za podwójne gwiazdki.
- Brak limitu czasu. Brak czerwonych krzyżyków i komunikatów „źle”.

Wartości startowe (`balance.ts`): 1 gwiazdka za zadanie, +2 za rundę bez błędu, druga próba też daje 1 gwiazdkę; koszt zadania remontowego 5–15 gwiazdek (czyli ok. 1–3 rundy na jeden mebel).

## 7. Pokój i meblowanie

- Scena pokoju: tło + sprite'y slotów ułożone według `depth`.
- Slot bez ukończonego zadania pokazuje `emptyFrame` albo nic.
- Na dole przycisk bieżącego zadania remontowego z kosztem. Za mało gwiazdek = przycisk wyszarzony, stuknięcie przenosi do zadań.
- Po opłaceniu: panel z 3 miniaturami wariantów. Stuknięcie miniatury od razu pokazuje podgląd w pokoju, przycisk „Wybieram” zatwierdza.
- Zatwierdzenie: krótka animacja (tween skali + cząsteczki), dźwięk.
- Stuknięcie urządzonego slotu otwiera ten sam panel, zmiana jest darmowa.
- Po ostatnim zadaniu: ekran „Pokój gotowy!” i odblokowanie kolejnego pokoju. Wybór pokoju z prostej listy miniatur.

## 8. Zapis postępu

- Autozapis do IndexedDB po każdej akcji zmieniającej stan (z debounce ok. 500 ms) oraz przy `visibilitychange`.
- Pole `version` i funkcja migracji w `core/save.ts`, żeby stare zapisy przetrwały aktualizacje gry.
- W ustawieniach rodzica (ukrytych za długim przytrzymaniem ikony, żeby dziecko nie weszło przypadkiem): zmiana etapu, podgląd postępów (opanowanie umiejętności, najczęstsze błędy), eksport zapisu do pliku JSON, import, reset gry z potwierdzeniem.
- Po starcie wywołać `navigator.storage.persist()`.
- iPad: Safari może usuwać dane stron nieużywanych przez dłuższy czas, dlatego grę trzeba dodać do ekranu początkowego.

## 9. PWA i ekran

- Manifest: `name: "Martynka urządza"`, `short_name: "Martynka"`, `display: fullscreen`, `orientation: landscape`, ikony 192 i 512 px, kolor tła zgodny z ekranem ładowania.
- Service worker: precache całego buildu razem z assetami, strategia aktualizacji „prompt” z prostym komunikatem „Jest nowa wersja”.
- Skalowanie: `Phaser.Scale.FIT` + `CENTER_BOTH`, rozdzielczość bazowa 1920 × 1080.
- CSS: `touch-action: none`, wyłączone zaznaczanie tekstu, przewijanie i zoom strony.
- Jeśli urządzenie jest w pionie: nakładka „Obróć tablet”.
- Czcionka z polskimi znakami dołączona lokalnie (bez pobierania z sieci), cyfry wyraźne i duże.
- Dźwięk startuje po pierwszym dotknięciu ekranu.

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

**M0 — szkielet.** Projekt z szablonu, Phaser 4, skalowanie, pusta scena, PWA, deploy na hosting.
Gotowe, gdy: gra otwiera się na tablecie z adresu URL, da się ją dodać do ekranu początkowego i uruchomić offline.

**M1 — generatory zadań (bez grafiki).** `core/tasks/generators` dla typów z grupy 1 w ZADANIA.md, sekcja 7 (ADD_SUB, MISSING, BONDS, COMPLEMENT, CHAIN, MISSING_OP, COMPARE_NUM, COMPARE_EXPR, SEQUENCE, EVEN_ODD, MULT, DIV, FACT_FAMILY, WORD, CHOOSE_OP, NUMBER_WORDS, ROMAN, CALENDAR). Dane `data/curriculum/E1–E6`. Testy: dla każdej umiejętności 1000 losowań (zakres, brak ujemnych, przekroczenie progu zgodne z parametrami, rozpraszacze różne od odpowiedzi, poprawne polskie odmiany w treściach).
Gotowe, gdy: testy przechodzą, a skrypt `npm run sample -- E3` wypisuje po 3 przykładowe zadania z każdego kroku etapu.

**M2 — ekran zadań i gwiazdki.** `round.ts`, `TaskScene`, kafelki, klawiaturka, podpowiedzi, lektor, licznik gwiazdek w `UIScene`.
Gotowe, gdy: na tablecie da się wygodnie rozwiązać rundę palcem i dostać gwiazdki.

**M3 — wiek, etapy, adaptacja.** `placement.ts`, `WelcomeScene`, `mastery.ts`, `curriculum.ts` (wagi, odblokowywanie kroków), ustawienia rodzica (zmiana etapu, podgląd postępów).
Gotowe, gdy: po podaniu wieku gra trafia w sensowny etap, a kolejne kroki odblokowują się po opanowaniu poprzednich.

**M4 — pokój.** `core/rooms.ts`, `RoomScene`, zadania remontowe, panel wyboru wariantu, zmiana wariantu, ekran ukończenia pokoju.
Gotowe, gdy: da się przejść cały pokój od zaniedbanego do urządzonego za gwiazdki z zadań.

**M5 — zapis.** IndexedDB, autozapis, migracje, eksport/import, reset.
Gotowe, gdy: po zamknięciu i ponownym otwarciu gra jest dokładnie w tym samym stanie (gwiazdki, pokoje, postęp nauki).

**M6 — zadania z rysunkami.** Widżety rysowane w kodzie i typy z grup 2–3 w ZADANIA.md, sekcja 7 (COUNT, ORDINAL, PLACE_VALUE, CLOCK, LENGTH, ARROW_TABLE, PUZZLE_GRID, SHAPES, PATTERN, WRITTEN, MONEY_*, MASS, CAPACITY, TEMPERATURE).
Gotowe, gdy: każdy etap ma pełny zestaw typów z ZADANIA.md.

**M7 — grafika i dźwięk.** Podmiana placeholderów na docelowe assety, atlasy, animacje (tweeny, cząsteczki), dźwięki, ekran ładowania.
Gotowe, gdy: w grze nie ma żadnego placeholdera.

**M8 — testy z graczem.** Obserwacja gry córki, poprawki balansu (tempo zdobywania gwiazdek, koszt mebli, progi opanowania), poprawki czytelności poleceń.
Gotowe, gdy: przejście pokoju zajmuje sensowny czas, zadania nie są ani za łatwe, ani frustrujące.

**Później:** minigry z ZADANIA.md, sekcja 5; pula zagadek; kolejne pokoje; wiele profili dzieci (np. dla rodzeństwa).

## 12. Poza zakresem v1

Fabuła i dialogi, energia i timery, konta i synchronizacja w chmurze, wydarzenia czasowe, sklep, ranking.

## 13. Do ustalenia

- Motyw pierwszego pokoju.
- Model tabletu (iPad czy Android), do testów PWA i lektora (dostępność polskiego głosu).
- Czy wiele profili dzieci (rodzeństwo) jest potrzebne już w v1.
- Czy rodzic chce widzieć raport postępów poza grą (np. eksport do pliku).

## 14. Zasady pracy dla agenta

- Realizować etapy po kolei, jeden etap = osobny commit lub PR.
- Najpierw logika w `core/` z testami, potem scena.
- Żadnych liczb balansu ani tekstów w scenach: wszystko z `data/`.
- Treści zadań generować samodzielnie; nie kopiować zadań z podręczników (notatki w `docs/zrodla/` służą tylko do wglądu).
- Identyfikatory i komentarze w kodzie po angielsku, teksty w grze po polsku (z poprawną odmianą liczebników: 1 jabłko, 2 jabłka, 5 jabłek).
- Po każdym etapie sprawdzić build produkcyjny i działanie offline.
