# Inwentarz grafiki (stan 2026-10-13)

> **Decyzje autora (2026-10-13):** v1 zostaje przy jednym pokoju (salon); pozostałe lokacje (kuchnia, pracownia, ogród zimowy, pokój dziecięcy, biblioteka, taras) jako osobne slice'y po S-16. Autor zgadza się na publikację grafiki z paczek `designs/` w publicznym repozytorium (po konwersji do `public/assets/`).
> **Od czasu inwentarza:** S-14 (PR #41) zintegrował z paczki A v1 pieniądze, przyrządy pomiarowe i 12 ikon (38 plików WebP, ok. 0,5 MB, `public/assets/tasks/`, `npm run art`). Decyzje nadal otwarte: sloty salonu (10 czy 6), model kosztów (5–15 czy płasko), formy mebli.
> **Decyzje autora (2026-10-15, S-16):** salon v1 = 6 grup mebli × 3 z `martynka-expansion-v1` + jeden etap tła przed → po (sekcja 7: sloty b, remont b w wariancie jednego etapu, formy b); koszty 5–15 (sekcja 7: koszty a); dźwięki wydzielone do S-16b. Brakujące elementy: `docs/designer-brief-s16.md`.
> **Decyzja autora (2026-10-14):** minigry v1 (S-15) to Hasło z wyników i Zakrywanka; zagadka dnia ×2 gwiazdki; pulę zagadek LOGIC pisze agent.

Przegląd paczek w `designs/` pod kątem roadmapy (S-13…S-17) i decyzji, które musi podjąć autor.
Wszystkie liczby sprawdzone na plikach (rozmiary z nagłówków PNG, wagi z `du`, WebP z próbnej konwersji
Pillow). Pliki `.zip` pominięte. W repozytorium jest tylko `designs/martynka-maths-A-v1/`; pozostałe paczki są
lokalne (`designs/` w `.gitignore`), więc integracja oznacza skopiowanie przekonwertowanych plików do `public/assets/`.

## 1. Paczki

| Paczka | Data | Cel | Zastępuje / bazuje na | Do integracji |
|---|---|---|---|---|
| `martynka-maths-A-v1` | 9.10 | kit ekranów (notes A), ikony, pieniądze, pomiary | — (bazowa) | `assets/icons` (12×512 + 64/96), `assets/money` (15), `assets/measuring` (12), `assets/room.png` (płaski salon), `reference/*.svg` + `thermometer-face.js` (wzorce do rysowania kodem), font |
| `martynka-expansion-v1` | 12.10 | salon w warstwach, 3 warianty 6 grup, +12 ikon, 2 plansze minigier | rozszerza salon z kitu (`room.png` identyczny, ten sam md5) | `assets/room` (4), `assets/furniture` (22), `assets/icons` (24×512 + 64/96), `manifest.json` (`slots`, `layers`, `miniGames`) |
| `martynka-locations-v1` | 12.10 | kuchnia + pracownia, 6 grup × 3 | **zastąpiona przez v2** (README v2: „zastępują kierunek lokacji v1”) | nie integrować |
| `martynka-locations-v2` | 12.10 | kuchnia (rzut L z wykuszem) + pracownia (poddasze) | zastępuje v1 | `assets/room` (before/after), `assets/furniture` (36), `manifest.json` |
| `martynka-more-locations-v1` | 12.10 | ogród zimowy, pokój dziecięcy, biblioteka, taras | kontynuacja v2 | **zastąpiona w całości przez evolution** (wszystkie 89 PNG z `assets/` są w evolution bajt w bajt) |
| `martynka-evolution-v1` | 12.10 | różne formy mebli (3 grupy), remont etapami (pokój dziecięcy), notes z kontekstem lokacji, plan 6 lokacji | `basePackage: martynka-more-locations-v1` (zawiera jej assety) | `assets/room` (15), `assets/furniture` (78, z czego 72 aktywne w manifeście), `manifest.json` (`rooms`, `renovation`) |

We wszystkich paczkach: `source-art/`, `prompts*.json`, `source-metadata.json`, `previews/`, `screenshots/`,
`tools/`, `*-checks.json`, `qa-report.json`, `preview.*` to źródła, dokumentacja i kontrola — nie trafiają do gry.
Font `AtkinsonHyperlegibleNext.ttf` jest identyczny we wszystkich paczkach i w `public/fonts/`.
Paczka evolution trzyma w katalogu 6 wcześniejszych kolorystyk zastąpionych formami (`children-bed-{sunny,mint}`,
`library-reading-{sunny,mint}`, `terrace-dining-{sunny,mint}`); integrator bierze tylko pliki z manifestu.

## 2. Salon (`src/data/rooms.ts`) a dostępna grafika

Źródło: `martynka-expansion-v1` (manifest `scene`, `slots`, `layers`). Tła: `architecture-before.png` (zniszczone
ściany, przetarta podłoga, wyblakłe zasłony), `architecture-after.png` (pusta odnowiona architektura),
`furnishings-before.png` (wszystkie meble w wersji zniszczonej jako jedna warstwa, alfa), `shadows.png` (cienie,
alfa). Brak teł pośrednich. Pozycje w manifeście to lewy górny róg + `width/height` + `anchor` + `z`; `rooms.ts`
trzyma środek slotu i `depth`, więc współrzędne trzeba przeliczyć.

| Slot `rooms.ts` | Koszt | Grafika | Warianty | Rodzaj różnicy | Brakuje |
|---|---:|---|---:|---|---|
| floor | 5 | wpieczona w `architecture-before/after` | 0 (tylko przed/po) | — | 3 warianty podłogi albo decyzja „etap remontu” |
| walls | 6 | wpieczona w `architecture-before/after` | 0 (tylko przed/po) | — | 3 warianty ścian albo „etap remontu” |
| curtains | 7 | wpieczona w oba tła (miętowe) | 0 | — | osobna warstwa + 3 warianty, albo usunąć slot |
| sofa | 8 | `furniture/sofa-{morska,sloneczna,listkowa}.png` 835×566 | 3 | kolor (ta sama forma) | — |
| rug | 9 | `furniture/rug{,-arcs,-flowers}.png` 1111×640 | 3 | wzór + kolor | — |
| table | 10 | `furniture/coffee-table{,-cream,-turquoise}.png` 537×397 | 3 | kolor | — |
| lamp | 11 | `furniture/lamp-table.png` 239×415 (warstwa stała) | 1 | — | 2 warianty |
| shelf | 12 | brak półki ściennej; jest komoda `cabinet{,-mint,-cream}.png` 512×363 | 3 (komoda) | kolor | półka ścienna ×3 albo zamiana slotu na „komoda” |
| plant | 13 | `plant-left.png` 290×445, `plant-right.png` 244×539 (warstwy stałe) | 1+1 | dwie różne rośliny | 3 warianty jednej rośliny (albo 2 dodatkowe) |
| picture | 15 | `furniture/wall-frames{,-meadow,-sky}.png` 634×425 | 3 | motyw (botaniczne/łąka/niebo) | — |
| (poza danymi) | — | `armchair{,-mint,-sunny}.png` 399×361 | 3 | kolor | — |
| (poza danymi) | — | `pouf.png` 278×218 | 1 | — | — |

Wynik: z 10 slotów 4 są kompletne (sofa, rug, table, picture), 1 ma zamiennik (shelf → komoda), 2 mają po jednym
wyglądzie (lamp, plant), 3 (floor, walls, curtains) istnieją tylko jako stan przed/po architektury. Gotowe
3-wariantowe grupy: 6 (sofa, rug, coffee-table, cabinet, armchair, wall-frames) = 18 plików. Styl: salon to
ciasno skadrowany narożnik na zielonym tle; nowsze lokacje to „dioramy” z kremowym marginesem
(`composition.destination` w manifeście) — miniatury na liście pokoi będą wyglądały różnie.

## 3. Pozostałe lokacje

Wszystkie: scena 1920×1080, kamera „orthographic-like” 45°/45°, światło z lewej góry, rodziny wariantów
Naturalny / Słoneczny / Miętowy, 6 grup × 3 warianty (729 kombinacji), wspólne płótno i kotwica dla 3 wariantów
grupy, manifest z `x, y, width, height, z, anchor, visibleRect`. `backgroundBefore` to płaska pełna scena (meble
zniszczone wpieczone, nie nakładać na nią warstw); `backgroundAfter` to pusta architektura. Tła są nieprzezroczyste
(RGBA z alfą 255), warstwy `*-shadows.png` w nowszych paczkach są puste (pomijać). Tła są powiększone z ok.
1672×941, nie ma źródeł 2× (plan, sekcja 10, zakłada „źródło 2×”).

| Lokacja (`id`) | Paczka | Grupy (etykiety z manifestu) | Formy zamiast kolorów | Tła |
|---|---|---|---|---|
| Kuchnia `kitchen` | locations-v2 | Zabudowa L, Lodówka, Stół i krzesła, Kącik kawowy, Ławka w wykuszu, Naczynia | nie | before, after |
| Pracownia `studio` | locations-v2 | Stół roboczy, Sztaluga, Regał materiałów, Mycie pędzli, Kącik krawiecki, Tablica inspiracji | nie | before, after |
| Ogród zimowy `conservatory` | evolution | Sofa wiklinowa, Stolik herbaciany, Fotel i podnóżek, Regał roślin, Przesadzanie, Duże donice | nie | before, after |
| Pokój dziecięcy `children` | evolution | Łóżko, Biurko i krzesło, Regał na książki, Skrzynia na zabawki, Kącik czytelniczy, Szafa | łóżko: naturalne / domek / szuflady | before, **stage-0 (puste zaniedbane), stage-1 (posprzątane), stage-2 (ściany)**, after (podłoga) |
| Biblioteka `library` | evolution | Biblioteczka, Fotel i podnóżek, Stół i krzesła, Ławka pod oknem, Skrzynia na książki, Lampa i stolik | fotel: naturalny / wiklinowy / kokon | before, after |
| Taras `terrace` | evolution | Ławka ogrodowa, Stół i krzesła, Szafka ogrodowa, Parasol, Rabatka kwiatowa, Łuk z lampionami | stół: klasyczny / okrągły / piknikowy | before, after |

`evolution` `manifest.renovation` (tylko `children`): 3 etapy tła (Sprzątanie, Malujemy ściany, Odnawiamy podłogę)
+ 6 grup wyposażenia, każda czynność po 2 gwiazdki (9 czynności, 18 gwiazdek). Pozostałe lokacje mają etapy tylko
w `development-plan.md` (plan, bez grafiki). Każda lokacja ma w manifeście `maths` z jednym zadaniem liczenia
dopasowanym do miejsca (kwiaty / ołówki / książki / filiżanki / pędzle).

## 4. Pozostała grafika i przypisanie do wycinków

| Zasób | Gdzie | Szczegóły | Wycinek |
|---|---|---|---|
| Ikony do liczenia (24) | expansion `assets/icons` (512, + `64/`, `96/`); 12 pierwszych także w maths-A | cup, croissant, flower, cushion, book, lamp, apple, pear, teapot, pencil, key, yarn, strawberry, orange, banana, cookie, paintbrush, scissors, shoe, sock, watering-can, flowerpot, button, block | S-13 (COUNT, ORDINAL, COMPARE_QTY), S-14 (MULT_GROUPS), S-16 |
| Monety 1 gr–5 zł (9), banknoty 10–500 zł (6) | maths-A `assets/money` (monety 512², banknoty 768×512) | nominały w groszach w manifeście | S-14 (MONEY_*), S-15 (Sklepik, gdyby wybrany) |
| Waga + odważniki 10/20/50 dag, 1/2/5 kg | maths-A `assets/measuring` | waga jako jeden obraz, szalki puste i w poziomie | S-14 (MASS) |
| Dzbanek 1 l / ½ l / ¼ l | maths-A `assets/measuring` | wspólny `visibleRect`, ml w manifeście | S-14 (CAPACITY) |
| Termometr −30…+30 °C | maths-A `thermometer-frame.png` + `reference/thermometer-face.js` | podziałka i słupek rysowane kodem | S-14 (TEMPERATURE) |
| Wzorce pomocy | maths-A `reference/` | clock, ruler, number-line, base-ten, written-addition, square-grid, dice (SVG) + `helper-style.cjs` | S-13 (rysowane w kodzie; tylko wzór stylu) |
| Plansze minigier | expansion `preview.js`/`expansion.css`, `screenshots/dice-*`, `word-*` | „Kostki” = Zakrywanka (wyniki 0–12, + i −), „Ukryte słowo” = Hasło z wyników (SOFA, OKNO, LAMPA, FOTEL, PÓŁKA); rysowane kodem, PNG to tylko podglądy | S-15 |
| UI | żadna paczka nie ma PNG UI | przyciski, kafelki, notes, gwiazdka, panele są w CSS kitu; gra już rysuje je kodem | S-16 (zostaje kod) |
| Font | wszystkie paczki | identyczny z `public/fonts/` | — |

Wiersze `docs/design-gaps.md`, które grafika już pokrywa:

| # | Luka | Stan |
|---|---|---|
| 20 | słonecznik i poduszka na powitaniu | kit sam używa `assets/icons/flower.png` i `cushion.png` (maths-A) — grafika jest, brak tylko integracji |
| 22 | książka na karcie „Nowa umiejętność!” | `assets/icons/book.png` istnieje w maths-A — jak wyżej |
| 32 | brak mebli salonu | częściowo: 6 grup × 3 z expansion + tła przed/po (patrz sekcja 2) |
| 40 | miniatury na liście pokoi | do wygenerowania z teł/`previews` (np. pomniejszone `room-preset-*` dla salonu) |
| 35 | dźwięk zakupu | nadal brak (sekcja 5) |
| 21 | tryb z obrazkami dla 6-latków | nadal brak |

## 5. Lista do domówienia

**Dźwięki (sprawdzone: 0 plików audio w `designs/`; podglądy używają tylko syntezy mowy):** dobra odpowiedź,
podpowiedź / druga próba, gwiazdka do licznika, bonus rundy, otwarcie panelu i wybór wariantu, „Wybieram”
(zakup), „Pokój gotowy!” / „Nowa umiejętność!”, stuknięcie przycisku, opcjonalnie tło. Format OGG + M4A (plan,
sekcja 10). Blokuje S-16 (FR-017, FR-026).

**Salon (S-16), zależnie od decyzji z sekcji 7:** warianty podłogi, ścian i zasłon (albo tła pośrednie salonu jak
w pokoju dziecięcym: posprzątane, ściany, podłoga); zasłony jako osobna warstwa; lampa ×2; roślina ×2; półka
ścienna ×3 (jeśli slot zostaje).

**Zadania z grafiką (S-14), brakuje w każdej paczce:**
- MASS: odważniki gramowe (E5: g), tona i kwintal (E6), przedmioty do ważenia, waga przechylona albo rozbita na
  belkę i szalki (README maths-A: brak stanów niezrównoważonych).
- CAPACITY: naczynie puste i pełne innego kształtu, butelka 1,5 l („półtora litra”, E6), wiadro/kubek — albo
  poziom cieczy rysowany kodem z maską na jednym naczyniu.
- MONEY_PAY: portfel/skarbonka jako cel przeciągania; SPATIAL: scena z półkami (może to być salon); tryb z
  obrazkami (luka 21).
- Ikony dla rzeczowników z `src/data/nouns.ts` bez grafiki: talerz, pudełko, naklejka (MULT_GROUPS „talerze po
  ciastka”). Etykiety ikon nie pasują do słownika: `pencil` = „Ołówek” (słownik: kredka), `cookie` =
  „Ciasteczko” (słownik: ciastko); 15 ikon nie ma rzeczownika w słowniku (ołówek, klucz, kłębek, truskawka,
  pomarańcza, banan, pędzel, nożyczki, bucik, skarpetka, konewka, doniczka, guzik, lampa, czajniczek) — do
  dopisania w `nouns.ts` przed użyciem w poleceniach.

**Inne:** docelowa ikona aplikacji (`public/icons/` to placeholdery ze skryptu), grafika ekranu ładowania.

## 6. Waga

Próbna konwersja wszystkich PNG z `assets/` (Pillow 12: tła nieprzezroczyste → WebP q80 bez alfy; warstwy i ikony
→ WebP q85 z alfą q90). Wynik do weryfikacji wzrokowej: q80 na tłach może dać pasma na gładkich ścianach, przy
q85–90 tło waży raczej 100–200 KB niż 60 KB.

| Paczka | PNG `assets/` | WebP (szac.) | Uwagi |
|---|---:|---:|---|
| maths-A | 16,5 MB (64 pl.) | 1,24 MB | `room.png` 3,4 MB → 0,14 MB |
| expansion | 24,6 MB (99) | 1,97 MB | `furnishings-before` 2,4 MB → 0,30 MB, sofa 502 KB → 44 KB |
| locations-v2 | 14,3 MB (44) | 1,58 MB | |
| more-locations | 27,3 MB (89) | 3,18 MB | dubluje evolution |
| evolution | 36,1 MB (98) | 3,61 MB | `children-stage-1` 2,8 MB → 95 KB |

Zestawy do precache (bez duplikatów; dziś `dist/` ma 1,7 MB, Workbox ma limit 10 MB na plik):

| Zestaw | Pliki | PNG | WebP |
|---|---:|---:|---:|
| Salon (4 tła + 22 meble) | 26 | 15,3 MB | 1,2 MB |
| Ikony 24×512 | 24 | 5,3 MB | 0,5 MB (przy 256 px ok. 0,15 MB) |
| Pieniądze + pomiary | 27 | 10,3 MB | 0,8 MB |
| Kuchnia + pracownia (v2) | 42 | 13,9 MB | 1,5 MB |
| 4 lokacje (evolution) | 93 | 35,0 MB | 3,5 MB |
| **v1 (salon + ikony + S-14)** | 77 | 31 MB | **≈ 2,5 MB** |
| **Wszystkie 7 lokacji + reszta** | 212 | 80 MB | **≈ 7,5 MB** |

Wniosek: PNG wprost z paczek (31–80 MB) nie nadaje się do precache na tablecie; WebP mieści v1 w ok. 2,5 MB, a
całość w ok. 7–8 MB. Osobny problem to pamięć tekstur: tło 1920×1080 po dekodowaniu to ok. 8 MB RGBA, więc gra
powinna ładować do Phasera tylko tekstury bieżącego pokoju (z precache, offline), a nie wszystkie lokacje na starcie.

## 7. Konflikty z planem i PRD (decyzja autora)

| Temat | Plan / PRD | Grafika | Opcje | Rekomendacja |
|---|---|---|---|---|
| Liczba pokoi w v1 | 1 (salon), drugi w v1.1 (FR-019) | 7 lokacji gotowych | a) zostaje 1; b) 2. pokój w v1 | a) — v1 bez zmian, kolejne pokoje jako osobne wycinki tuż po S-16 (grafika już jest) |
| Sloty na pokój | 10 (`rooms.ts`, plan sekcja 10: 30 elementów) | 6 grup × 3 + architektura | a) dorysować 4 sloty salonu; b) salon = 6 grup + etapy architektury | b) — sofa, dywan, stolik, komoda, fotel, obrazki; podłoga/ściany jako etapy; lampa/rośliny/puf jako stałe dekoracje |
| Koszty | 5–15 za czynność, suma 96 (FR-016) | prototyp: płasko 2 gwiazdki, 9 czynności | a) dane 5–15; b) płasko 2 | a) — 2 × 9 = 18 gwiazdek to ok. 3 rundy, sprzeczne z „1–2 tygodnie”; koszty stroi S-17 |
| Remont tłem czy slotami | slot = element z 3 wariantami (sekcja 7) | etapy jako całe tła (`renovation.stages`) + sloty mebli | a) tylko sloty; b) hybryda: etapy tła bez wyboru + sloty | b) — model danych potrzebuje typu czynności „etap tła” (bez panelu wariantów); dla salonu domówić tła pośrednie albo jeden etap przed→po |
| Formy czy kolory | „3 warianty, ten sam kąt i światło” | evolution: różne formy w 3 grupach, wspólna kotwica | a) tylko kolory; b) dopuścić formy | b) — kod już traktuje wariant jako dowolny obraz; wymagać tylko wspólnego płótna i kotwicy |
| Liczenie związane z pokojem | ikony dowolne (ZADANIA, COUNT) | `maths` per lokacja: ikona miejsca | a) brak; b) preferowane ikony pokoju w danych | b) po v1 — lista rzeczowników na pokój w `rooms.ts`, generator COUNT bierze ją z większą wagą |
| Minigry v1 (plan sekcja 13) | 1–2 z ZADANIA sekcja 5, otwarte | expansion: Zakrywanka i Hasło z wyników | wybrać 1–2 | Hasło z wyników (od E1, słowo = nazwa mebla) + Zakrywanka; obie rysowane kodem, gotowy wzór ekranu |
| Styl salonu | salon = pokój v1 | salon starszy (zielone tło, ciasny kadr), nowsze to dioramy | a) zostaje; b) przerobić salon w stylu diorama | a) dla v1 — zatwierdzony kit; ujednolicenie przy liście pokoi po v1 |

## 8. Wpływ na roadmapę

- **S-16 częściowo odblokowany:** grafika salonu (6 grup × 3, tła przed/po, warstwa „przed”), ikony (w tym luki
  20 i 22) i pomiary są dostępne. Blokują nadal: dźwięki oraz decyzja o slotach salonu (sekcja 7). Propozycja:
  podzielić na S-16a „art salonu i ikon” (do zrobienia teraz) i S-16b „dźwięk i ekran ładowania” (blocked).
- **Nowy krok przed S-16: potok assetów** — skrypt w `scripts/` kopiujący wybrane pliki z `designs/<paczka>/assets`
  wg manifestu do `public/assets/rooms/<pokój>/…` (nazewnictwo z planu, sekcja 10), konwersja PNG → WebP, ikony
  512 → 256, atlas mebli per pokój, generacja danych slotów (pozycja, kotwica, z) z manifestu do `src/data/`.
  Wyniki commitować (CI nie ma `designs/`); bez natywnych zależności w CI. Ładowanie tekstur per pokój.
- **S-14:** monety, waga, dzbanki, termometr są; do domówienia albo do narysowania kodem: przechył wagi, gramy,
  tona, inne naczynia, talerz/pudełko (sekcja 5). Słownik `nouns.ts` musi dostać rzeczowniki ikon.
- **S-15:** odpowiedź na otwarte pytanie planu — Hasło z wyników + Zakrywanka (wzór w expansion).
- **Po v1 (kolejność propozycji):** jeden wycinek na pokój: pokój dziecięcy (jedyny z etapami remontu i formami),
  biblioteka, taras, ogród zimowy, kuchnia, pracownia. Każdy: dane pokoju z manifestu, assety, wpis w `ROOM_ORDER`,
  opcjonalnie liczenie z ikonami pokoju. Model danych pokoju musi przed tym dostać czynności typu „etap tła”.
- **Licencja i publiczne repo:** grafika to oryginalne wyniki ImageGen (prompty w paczkach); przed commitem do
  publicznego repo autor potwierdza, że może ją publikować.
