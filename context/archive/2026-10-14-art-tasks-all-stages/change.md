---
change_id: art-tasks-all-stages
title: Zadania z grafiką paczki A (monety, waga, dzbanki, termometr, ikony) i widżety S-13 w E1–E2, E5–E6
status: archived
created: 2026-10-14
updated: 2026-10-14
archived_at: 2026-10-14T02:33:01Z
---

## Notes

Slice roadmapy **S-14** (etap M6), autonomiczny run `2026-10-13-s12-s14`, gałąź `feat/art-tasks-all-stages`
cięta z `main` @ `bb00d7f` (po S-13, PR #40).

- **Outcome (roadmapa):** dziecko rozwiązuje zadania z monetami i banknotami, wagą, naczyniami i termometrem (grafika
  z paczki A v1) oraz typy grup 2–3 dla E1–E2 i E5–E6; każdy etap ma pełny zestaw typów z ZADANIA.md.
- **PRD:** FR-023 („każdy etap ma pełny zestaw typów” to kryterium końca M6, nie jednego slice'a).
- **Plan (`Martynka-urzadza.md`):** § 10 Assety (monety i banknoty PNG, pomoce PNG lub w kodzie; nazewnictwo
  `tasks/icons/<nazwa>.png`, `tasks/money/<nominal>.png`), § 11 M6 (grupa 3: MONEY_*, MASS, CAPACITY, TEMPERATURE),
  § 14 zasady pracy.
- **Katalog (`docs/ZADANIA.md`):** § 3 kroki E1–E6, § 4 typy (Pieniądze, Miary, COUNT, MULT_GROUPS), § 7 grupa 3
  (MONEY_*, MASS, CAPACITY, TEMPERATURE, SPATIAL, MULT_GROUPS).
- **Kontrakt runu** § Slice-specific rules / S-13 i S-14: grafika tylko z `designs/martynka-maths-A-v1/` (money,
  measuring; ikony z tej samej paczki), zintegrowane assety w `public/assets/` z nazwami z § 10 planu, w precache (bez
  leniwych chunków); inne paczki (`expansion`, `locations`, `evolution`) poza runem; brakujące elementy (odważniki
  gramowe, tona/kwintal, waga przechylona, inne naczynia, talerze/pudełka) → rysunek w kodzie albo DESIGN-GAP +
  follow-up, nigdy generowana grafika; etykiety kitu „Ołówek”/„Ciasteczko” ustępują słownikowi (`kredka`, `ciastko`).
- **Wzorce:** `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/` (model `TaskVisual`, `Task.input`, widżety,
  `select`/`drag`, podział slice'a), `context/archive/2026-10-13-save-export-import-reset/` (struktura decyzji).
- Plik `lessons.md` w `context/foundation/` nie istnieje (sprawdzone).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/art-tasks-all-stages` @ `bb00d7f` (wpis roadmapy S-14 pisany przed S-02…S-13).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-13 | Done (PR #40, `bb00d7f`): `Task.visual` (`src/core/tasks/visual.ts`: `clock`, `ruler`, `blocks`, `bars`), `Task.input`, widżety `ClockFace`, `Ruler`, `BaseTenBlocks`, `BlockMat`, `BarChart`, `SelectTiles`, `TaskPicture`; tryby `select` i `drag` grywalne (`src/core/round/pick.ts` `playable`). | Bez korekty. |
| „monety, waga, naczynia i termometr są już w paczce A v1, więc nie zależy od nowej grafiki” | Paczka ma: 9 monet (1 gr–5 zł), 6 banknotów (10–500 zł), wagę szalkową **tylko w równowadze, z pustymi szalkami**, 6 odważników (1, 2, 5 kg; 10, 20, 50 dag), 3 dzbanki (1 l, ½ l, ¼ l na wspólnym obrysie), termometr −30…+30 °C (obudowa + twarz rysowana kodem wg `reference/thermometer-face.js`), 12 ikon. **Brak:** odważników gramowych, tony/kwintala, wagi przechylonej, innych naczyń (np. butelka 1,5 l), talerzy/pudełek, portfela. | Prawda dla rdzenia (MONEY_COUNT, MONEY_CHANGE, MASS „w równowadze”, CAPACITY litrowe, TEMPERATURE). „cięższe / lżejsze”, gramy, brutto/netto/tara i tona nie mają grafiki → tekst albo rysunek w kodzie + DESIGN-GAP (decyzja 4). |
| „Unknowns: —” | `Keypad` nie ma znaku minus ani przecinka (`src/core/round/keypad.ts`); `blockDrag.ts` zna tylko `BlockKind` (`hundred`/`ten`/`one`); w grze nie ma jeszcze żadnej grafiki rastrowej (`grep load.image src` = 0, `public/` ma tylko font i ikony PWA). | Trzy niewiadome dla research: ujemne temperatury i kwoty „2,50 zł” (kafelki zamiast klawiatury?), uogólnienie reduktora przeciągania na nominały (MONEY_PAY), pierwsze ładowanie obrazów w `BootScene` + precache. |
| „typy grup 2–3 dla E1–E2 i E5–E6; każdy etap ma pełny zestaw typów” | 63 kroki w E1–E6; po S-13 **10 kroków bez żadnej umiejętności** (E1.1, E1.8, E1.10, E2.2, E2.8, E5.5, E5.12, E6.2, E6.3, E6.11) i **37 kroków z co najmniej jednym brakującym typem** (tabela niżej; 32 różne typy, w tym 4 z gotowym generatorem i widżetem S-13 — CLOCK, DATA, LENGTH, PLACE_VALUE — którym w części kroków brakuje tylko danych). | Za duże na jeden slice (≈ 25–30 faz). S-14 = grafika paczki A + tanie użycie widżetów S-13; reszta jako nowe pozycje roadmapy S-14b/S-14c/S-14d (decyzja 1). |
| S-13 w „At a glance”: „z zegarem, linijką, osią, klockami i słupkiem dla E3–E4” | S-13 przeniósł oś liczbową, słupek pisemny i grafy (ARROW_TABLE) do S-14 (archiwum S-13, decyzja 4). | Te trzy idą do proponowanego **S-14b** (decyzja 1), nie do tego slice'a. |
| S-13b obejmuje PERIMETER tylko w E4.7 | PERIMETER jest też w E5.12 (bok z obwodu) i E6.3 (figury złożone na kratkach) — ten sam widżet siatki. | Propozycja: S-13b bierze PERIMETER we wszystkich trzech krokach (zapisze to `/10x-roadmap` lub plan). |
| PRD refs FR-023; Parallel with S-15 | Zgodne; run idzie szeregowo, S-15 poza runem. | Bez korekty. |
| Profil runu § 10: `public/assets` „absent on purpose (art lands in M7, S-16)” | S-14 tworzy `public/assets/tasks/…` (pierwsza grafika w M6). | Wiersz profilu stanie się nieaktualny po fazie assetów — do poprawki przez orkiestratora (agent nie edytuje profilu). |

## Co zostało: kroki × typy × widżet/grafika × tryb odpowiedzi

Zmierzone skryptem (typy z `types` kroku minus typy jego umiejętności, `src/data/curriculum/E1.ts`–`E6.ts`).
Kolumna „Slice” to propozycja przydziału.

| Krok | Brakujące typy | Widżet / grafika | Tryb | Slice |
|---|---|---|---|---|
| E1.1 (pusty) | SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY | figury w kodzie, ikony paczki A, scena pokoju, siatka | tiles / select | S-14d |
| E1.2 | COUNT, ORDINAL | ikony paczki A (`assets/icons/96/*`) | tiles / select | COUNT **S-14**, ORDINAL S-14d |
| E1.4 | COUNT | ikony | tiles | **S-14** |
| E1.8 (pusty) | LENGTH (linijka do 10 cm) | `Ruler` (S-13) | tiles | **S-14** (dane) |
| E1.9 | INEQUALITY | tekst, `check` | tiles | S-14c |
| E1.10 (pusty) | COUNT, PLACE_VALUE (11–12) | ikony; `BaseTenBlocks` (S-13) | tiles | **S-14** |
| E1.11 | CLOCK, MASS (kg), MONEY_COUNT, MONEY_PAY, MONEY_CHANGE (≤ 10 zł) | `ClockFace`; waga + odważniki kg; monety | tiles / drag | **S-14** |
| E2.1 | PLACE_VALUE (10 + n) | `BaseTenBlocks` | keypad | **S-14** (dane) |
| E2.2 (pusty) | MONEY_COUNT, MONEY_PAY, MONEY_CHANGE (≤ 20 zł), CAPACITY (litr) | monety, banknoty; dzbanek 1 l | keypad / drag | **S-14** |
| E2.6 | ARROW_TABLE | grafy w kodzie | keypad | S-14b |
| E2.8 (pusty) | MONEY_COUNT (grosze), MASS (dag), LENGTH (metr) | monety gr; waga + odważniki dag; `Ruler`/tekst | keypad / tiles | **S-14** |
| E2.9 | PLACE_VALUE (D i J do 99) | `BaseTenBlocks` | keypad | **S-14** (dane) |
| E2.10 | DATA, CLOCK (± 1 h) | `BarChart`, `ClockFace` | tiles / keypad | **S-14** (dane) |
| E3.4 | MASS (kg, dag) | waga + odważniki | keypad | **S-14** |
| E3.5 | PUZZLE_GRID | siatka | keypad | S-13b |
| E3.7 | GRID | siatka | tiles | S-13b |
| E3.9 | MULT_GROUPS | ikony w grupach (talerzy brak → ramki w kodzie, DESIGN-GAP) | tiles / keypad | **S-14** |
| E3.11 | TEMPERATURE (−30…+30) | `thermometer-frame.png` + twarz w kodzie | tiles | **S-14** |
| E4.1 | MONEY_COUNT, MONEY_CHANGE (zł + gr), MASS (pół kg) | monety, banknoty do 500 zł; waga + 50 dag | tiles / keypad | **S-14** |
| E4.7 | CAPACITY (½ l), PERIMETER | dzbanki 1 l / ½ l; siatka | keypad | CAPACITY **S-14**, PERIMETER S-13b |
| E5.2 | WRITTEN | słupek w kodzie, wejście cyfra po cyfrze | nowy (cyfry w okienkach) | S-14b |
| E5.3 | CLOCK_ELAPSED | tekst (opcjonalnie `ClockFace`) | keypad | S-14c |
| E5.4 | TEMPERATURE (0–30) | termometr | keypad | **S-14** |
| E5.5 (pusty) | CAPACITY (½, ¼ l), MASS (½, ¼ kg, dag) | dzbanki; waga (¼ kg = 25 dag: brak odważnika 5 dag → tekst) | keypad / tiles | **S-14** |
| E5.7 | MASS (g, brutto/netto/tara), LENGTH (mm, cm), UNIT_CHOICE | tekst (brak gramów); `Ruler` mm | keypad / tiles | LENGTH **S-14** (dane), reszta S-14c |
| E5.8 | CLOCK_ELAPSED | tekst | keypad | S-14c |
| E5.10 | PRICE, TIMES_MORE | tekst | keypad | S-14c |
| E5.11 | ORDER_OPS | tekst | keypad | S-14c |
| E5.12 (pusty) | LENGTH (skala), PERIMETER (bok z obwodu) | tekst / `Ruler`; siatka | keypad | LENGTH S-14c, PERIMETER S-13b |
| E6.1 | TEMPERATURE (ujemne, różnice), TIME_UNITS | termometr; tekst | tiles / keypad | TEMPERATURE **S-14**, TIME_UNITS S-14c |
| E6.2 (pusty) | CLOCK_ELAPSED | tekst | keypad | S-14c |
| E6.3 (pusty) | MASS (brutto/netto/tara), LENGTH (wyrażenia dwumianowe), PERIMETER | tekst; siatka | keypad | S-14c, PERIMETER S-13b |
| E6.5 | PLACE_VALUE (trzycyfrowe), MASS (tona) | `BaseTenBlocks`; tekst | keypad | PLACE_VALUE **S-14** (dane), tona S-14c |
| E6.7 | WRITTEN | słupek | cyfry | S-14b |
| E6.9, E6.10 | PLACE_VALUE (do 10 000 / 1 000 000) | tekst (klocki kończą się na setkach) | keypad / tiles | S-14c |
| E6.11 (pusty) | MIX, LOGIC | MIX = runda z całego roku (funkcja programu, nie generator); LOGIC = pula zagadek | — | MIX S-14c; LOGIC S-15 (w v1 pula tylko E3–E4, FR-025) |

## Scope

### W S-14 (propozycja dla `/10x-plan`, ≤ 10 faz, ≤ ~2 nowe komponenty UI na fazę)

| Typ | Kroki | Widżet | Grafika (kit → `public/assets/`) | Tryb |
|---|---|---|---|---|
| MONEY_COUNT | E1.11 (≤ 10 zł), E2.2 (≤ 20 zł), E2.8 (grosze), E4.1 (zł + gr, banknoty do 500 zł) | `MoneyTable` (monety i banknoty na stole) | `assets/money/coin-01gr…coin-5zl.png` (9), `note-10zl…note-500zl.png` (6) → `tasks/money/<id>.webp` | tiles (E1, kwoty z groszami) / keypad (pełne złote) |
| MONEY_CHANGE | E1.11, E2.2, E4.1 | `MoneyTable` (portmonetka „miał”) + tekst | jw. | tiles / keypad |
| MONEY_PAY | E1.11, E2.2 | zasobnik nominałów + `Wallet` (portfel w kodzie, DESIGN-GAP) | jw. | drag (uogólniony `blockDrag`) |
| MASS (równowaga) | E1.11 (kg), E2.8 (dag), E3.4 (kg, dag), E4.1 (pół kg), E5.5 (½ kg, dag) | `BalanceScale` (waga w równowadze, przedmiot na lewej szalce, odważniki na prawej) | `assets/measuring/balance-scale.png`, `weight-1kg/2kg/5kg/10dag/20dag/50dag.png`; przedmiot = ikona paczki A | keypad / tiles |
| CAPACITY | E2.2 (litr), E4.7 (½ l), E5.5 (½, ¼ l) | `Jugs` (rząd dzbanków) | `assets/measuring/container-1l.png`, `container-half-l.png`, `container-quarter-l.png` | keypad / tiles |
| TEMPERATURE | E3.11 (−30…+30), E5.4 (0–30), E6.1 (ujemne, różnice) | `Thermometer` (obudowa + słupek i podziałka w kodzie wg `reference/thermometer-face.js`) | `assets/measuring/thermometer-frame.png` (nie `thermometer.png` — to gotowe +10 °C) | tiles (ujemne) / keypad |
| COUNT | E1.2 (1–5), E1.4 (6–7), E1.10 (11–12) | `IconGroups` (n ikon, od E2 w dziesiątkach) | `assets/icons/<id>.png` (12) → `tasks/icons/<id>.webp` | tiles |
| MULT_GROUPS | E3.9 | `IconGroups` (grupy w ramkach rysowanych w kodzie; talerzy brak) | ikony | tiles / keypad |
| Widżety S-13, tylko dane | CLOCK E1.11, E2.10; DATA E2.10; LENGTH E1.8, E2.8, E5.7 (mm); PLACE_VALUE E1.10, E2.1, E2.9, E6.5 | istniejące | — | tiles (E1) / keypad |

Nowe kroki grywalne: **E1.8, E1.10, E2.2, E2.8, E5.5** (dostają `childName`). Kroki z dodanymi umiejętnościami: E1.2,
E1.4, E1.11, E2.1, E2.9, E2.10, E3.4, E3.9, E3.11, E4.1, E4.7, E5.4, E5.7, E6.1, E6.5 (próg odblokowania
`ceil(0.5·n)` rośnie — wzmianka w PR, jak w S-13).

Szkic faz (plan je ustali): P1 core: nowe rodzaje `TaskVisual` (`money`, `scale`, `jugs`, `thermometer`, `icons`) +
`formatMoney` (grosze → „2,50 zł”) (tdd) → P2 assety: skrypt konwersji z `designs/` do `public/assets/tasks/…` (WebP,
½ rozdzielczości), ładowanie w `BootScene`, precache sprawdzony w buildzie → P3 MONEY_COUNT + MONEY_CHANGE + `MoneyTable`
→ P4 MONEY_PAY: uogólniony reduktor przeciągania + `Wallet` → P5 MASS + `BalanceScale` → P6 CAPACITY + `Jugs` →
P7 TEMPERATURE + `Thermometer` → P8 COUNT + MULT_GROUPS + `IconGroups` → P9 dane dla widżetów S-13 w E1/E2/E5/E6 →
P10 e2e + bramka wizualna.

### Poza S-14 → nowe pozycje roadmapy (propozycja; dopisze je krok planu / `/10x-roadmap`)

- **S-14b `number-line-written-arrows`** (M6, po S-14): WRITTEN — słupek pisemny z okienkami cyfr i przeniesieniem
  (E5.2, E6.7; nowy tryb wejścia „cyfra w okienku”, ref. `reference/written-addition.svg`), ARROW_TABLE — grafy i
  tabelki (E2.6), oś liczbowa (ref. `reference/number-line.svg`) jako podpowiedź ADD_SUB i rysunek SEQUENCE /
  skoków MULT_GROUPS (follow-up S-13 `Trigger: S-14`).
- **S-14c `text-measure-time-types`** (M6, niezależne od S-14b): typy tekstowe bez widżetu — CLOCK_ELAPSED (E5.3, E5.8,
  E6.2), TIME_UNITS (E6.1), UNIT_CHOICE (E5.7), PRICE + TIMES_MORE (E5.10), ORDER_OPS (E5.11), INEQUALITY (E1.9),
  warianty tekstowe MASS (gramy, brutto/netto/tara, tona: E5.7, E6.3, E6.5) i LENGTH (skala E5.12, wyrażenia
  dwumianowe E6.3), PLACE_VALUE ≥ 1000 (E6.9, E6.10), MIX (E6.11, runda powtórkowa z całego roku).
- **S-14d `e1-shapes-picture-mode`** (M6): E1.1 (SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY), ORDINAL (E1.2),
  BONDS z parami i CHOOSE_OP z obrazkiem (follow-up S-13 `Trigger: S-13b or S-14`), „tryb z obrazkami” dla 6-latków
  (design-gaps wiersz 21, follow-up S-06 `Trigger: S-14`).
- **S-13b** (istnieje): rozszerzyć o PERIMETER w E5.12 i E6.3 (ten sam widżet siatki).
- **LOGIC E6.11**: S-15 (pula zagadek; w v1 tylko E3–E4 wg FR-025) — kryterium M6 dla E6.11 LOGIC zostaje po v1.

Kryterium końca M6 („każdy etap ma pełny zestaw typów”) wymaga więc S-13b, S-14, S-14b, S-14c, S-14d (+ S-15).

## Design source and copy (profile § 6)

- **Kit, który slice wiąże:** `designs/martynka-maths-A-v1/style-guide.md` § „Money and measuring objects” (wartości z
  `manifest.json` w groszach / gramach / mililitrach, nie z pikseli; banknoty z widocznym nominałem; „reserve a larger
  display than tiny counting icons for money, scales and thermometers”; termometr: obudowa + twarz z
  `thermometer-face.js`, „do not stretch the finished illustration”), § „Font and spacing” (cele ≥ 96 px, prawdziwe
  `−`, `zł`, `gr`, `kg`, `dag`, `l`, przecinki dziesiętne), § „Code-drawn helpers”; `README.md` § Integration (waga
  tylko w równowadze, odważniki to osobne sprite'y; dzbanki dobierane po metadanych ml); `manifest.json` (`money`,
  `measuring`, `icons`, `moneyUnits`); `reference/thermometer-face.js`; ekran `screenshots/task-tiles.png` (ikony
  liczenia nad kafelkami).
- **Pliki kitu wiązane (dokładnie):** `assets/money/coin-01gr.png`, `coin-02gr.png`, `coin-05gr.png`, `coin-10gr.png`,
  `coin-20gr.png`, `coin-50gr.png`, `coin-1zl.png`, `coin-2zl.png`, `coin-5zl.png`, `note-10zl.png`, `note-20zl.png`,
  `note-50zl.png`, `note-100zl.png`, `note-200zl.png`, `note-500zl.png`; `assets/measuring/balance-scale.png`,
  `weight-1kg.png`, `weight-2kg.png`, `weight-5kg.png`, `weight-10dag.png`, `weight-20dag.png`, `weight-50dag.png`,
  `container-1l.png`, `container-half-l.png`, `container-quarter-l.png`, `thermometer-frame.png`; `assets/icons/<id>.png`
  (apple, book, croissant, cup, cushion, flower, key, lamp, pear, pencil, teapot, yarn). Nie: `assets/room.png`,
  `assets/measuring/thermometer.png` (gotowe +10 °C), inne paczki z `designs/`.
- **Nazwy w `public/assets/` (plan § 10):** `tasks/money/<nominał>.webp` (np. `coin-2zl`, `note-50zl`),
  `tasks/icons/<nazwa>.webp`, `tasks/measuring/<id>.webp` (plan nie nazywa pomocy — rozszerzenie wzoru); klucze
  tekstur = ścieżki bez rozszerzenia (plan § 10). Atlas (free-tex-packer) nie teraz: 31 plików, M7/S-16.
- **DESIGN-GAP (nowe wiersze w `docs/design-gaps.md`, od 59):** portfel / cel upuszczenia MONEY_PAY; układ monet na
  stole i ich skala względem siebie (kit: „nie w skali fizycznej”); przedmiot na szalce (ikona na lewej szalce, waga
  tylko w równowadze — brak „cięższe/lżejsze”); brak odważników gramowych, 5 dag, tony/kwintala; brak innych naczyń
  (butelka 1,5 l); brak talerzy/pudełek dla MULT_GROUPS; wejście ujemnej temperatury (klawiatura bez minusa → kafelki);
  rysunek obok klawiatury w fazie rozwiązania (O2, wiersz 52/57 do rewizji).
- **Klucze tekstów (`src/data/pl.ts`, `pl.tasks.*`):** nowe dla promptów, podpowiedzi i kroków rozwiązania MONEY_*,
  MASS, CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS (nazwy w planie); `childName` pięciu nowych kroków grywalnych.
  Rzeczowniki: `złoty`, `grosz`, `jabłko`, `gruszka`, `rogalik`, `książka`, `kredka` (ikona `pencil`), `filiżanka`,
  `kwiatek`, `poduszka`, `talerz` są w `src/data/nouns.ts`; **brak** `lampa`, `klucz`, `kłębek`, `czajniczek`/`imbryk`,
  `dzbanek`, `odważnik`, `kilogram`/`dekagram`, `litr`, `stopień` — dopisać z biernikiem, jeśli wejdą do poleceń.
  Teacher read `npm run sample -- <etap> --count 6` dla E1, E2, E3, E4, E5, E6 (każdy zmieniony krok).

## Assets: waga i format

- Paczka w PNG: `assets/money` 5,7 MB (monety 512², banknoty 768 × 512), `assets/measuring` 4,2 MB (waga 1024 × 768,
  termometr 512 × 1536), `assets/icons` 2,7 MB (512² + gotowe 64/96 px). Wiązane 31 plików ≈ 10 MB PNG — więcej niż
  cały dzisiejszy `dist/` (1,7 MB) i na granicy `maximumFileSizeToCacheInBytes` precache tylko per plik (10 MB).
- Pomiar w tym kroku (`cwebp -q 85 -alpha_q 90`, połowa rozdzielczości): **31 plików money + measuring = 331 KB
  WebP** (największe: waga 28 KB, termometr 20 KB, banknot ≈ 15 KB). Wyświetlane rozmiary w scenie 1920 × 1080 są
  ≤ ½ źródła (moneta ~160 px, waga ~500 px), więc połowa rozdzielczości nie traci ostrości na tablecie.
- **Konwersja jest potrzebna teraz** (decyzja 3): WebP, ½ rozdzielczości, skrypt w `scripts/` (jak `make-icons.mjs`,
  deterministyczny wynik zatwierdzany w repo; `cwebp` jest lokalnym narzędziem, CI go nie potrzebuje, bo pliki są
  commitowane). Glob precache już obejmuje `webp`. Wszystko ładowane w `BootScene` na starcie (bez leniwych chunków).
- Zgoda opiekuna na publikację grafiki z `designs/` w publicznym repo: 2026-10-13 (kontrakt runu). `designs/` nadal
  gitignored — do repo trafiają tylko pliki wynikowe w `public/assets/`.

## Migration expected?

**Nie.** Format zapisu zostaje v1 (`src/core/save.ts` `SAVE_VERSION = 1`, fixtures `tests/fixtures/save-v1*.json`
nietknięte). Nowe umiejętności nie mają wpisu w `SavedLearner.mastery`/`streak` (= 0); `validateSave` sprawdza kształt,
nie listę ID; `unlockedStep` to numer kroku katalogu. Skutki (nie migracja) do research: pięć nowych kroków grywalnych
zmienia `playableSteps`, `calendarStart`/`floorToCalendar`, pulę „earlier” i rozgrzewkę (`firstPlayableSteps`) —
szczególnie E1/E2, gdzie przybywa kroków na początku etapu (E1.8, E1.10, E2.2). Co zmieniłoby odpowiedź: potrzeba
zapisania stanu przeciągania monet albo kwot w groszach w stanie gry — odrzucone (stan sesji).

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| O2: rysunek w fazie rozwiązania obok klawiatury dostaje 190 px (`TASK_LAYOUT.picture.keypadSolution.picture`). `Trigger: … or S-14 adding more keypad pictures` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** — S-14 dodaje rysunki przy klawiaturze (waga, dzbanki, termometr, monety); plan musi rozwiązać prostokąt fazy rozwiązania. |
| `pictureLayout` wysyła `select`/`drag` do obszaru rysunku kafelków, który nachodzi na `TASK_LAYOUT.select.top`. `Trigger: the first select or drag skill with a visual` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** — MONEY_PAY to pierwszy `drag` z rysunkiem. |
| Trzy identyczne typy prostokąta (`dragLayout` `Rect`, `pictureLayout` `PictureRect`, `ui/widgets/geometry` `Rect`). `Trigger: next change to dragLayout or pictureLayout` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** (faza MONEY_PAY zmienia `dragLayout`). |
| `TaskScene.create` → `pointerupoutside` jako `cancel`, bez e2e. `Trigger: next change to the drag wiring in TaskScene` | `2026-10-13-drawn-widget-tasks-e3-e4` | **W zakresie** tylko jeśli faza MONEY_PAY zmienia okablowanie przeciągania (test reduktora wystarczy). |
| Oś liczbowa jako podpowiedź ADD_SUB. `Trigger: S-14` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Poza** → S-14b (przeniesienie triggera przy archiwum). |
| Podświetlenie rysunku przy podpowiedzi. `Trigger: S-14 or a teacher read asking for it` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Poza**, chyba że teacher read zadań z grafiką o to poprosi (np. MONEY_COUNT „policz najpierw banknoty”) → wtedy jedna linia w planie; inaczej trigger „S-16 or a teacher read”. |
| BONDS z parami i CHOOSE_OP z obrazkiem. `Trigger: S-13b or S-14` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Poza** → S-14d. |
| Wymiana 10 jedności na dziesiątkę i setki na macie. `Trigger: S-14 or a child stuck on E4.8` | `2026-10-13-drawn-widget-tasks-e3-e4` | **Poza** (P4 uogólnia reduktor, ale bez wymiany); trigger zostaje „a child stuck on E4.8”. |
| „Tryb z obrazkami” dla 6-latków (design-gaps 21). `Trigger: S-14` | `2026-10-13-first-launch-placement` | **Poza** → S-14d (COUNT z ikonami w E1 to krok w tę stronę, nie tryb). |
| `adaptive.spec` blisko limitu 180 s. `Trigger: … the next change adding drag skills to E4` | `2026-10-13-drawn-widget-tasks-e3-e4` | Nie wyzwolony (MONEY_PAY tylko E1/E2); jeśli plan doda `drag` w E4 — wyzwolony. |

Przejrzane bez triggera dla S-14: `BlockMat.render`, `SelectTiles` pointerdown, tekst `Ruler`/`BarChart` (warunki
tabletowe), `clock_read_half` (wiersz [human] 10.7), audyt M-1/M-2/M-13 (cykl rundy w `TaskScene`).

## Autonomous decisions

1. **Podział: S-14 = grafika paczki A (MONEY_COUNT, MONEY_CHANGE, MONEY_PAY, MASS w równowadze, CAPACITY,
   TEMPERATURE, COUNT i MULT_GROUPS z ikonami) + tanie dane dla widżetów S-13 w E1/E2/E5/E6; reszta → proponowane
   S-14b (słupek, grafy, oś), S-14c (typy tekstowe, MIX), S-14d (E1.1, ORDINAL, pary, tryb z obrazkami), PERIMETER
   E5.12/E6.3 → S-13b.** Odrzucone: (a) cały „pełny zestaw” w jednym slice'u (~25 typów ≈ 25–30 faz, łamie limit
   ~10 faz i ≤ 2 komponenty na fazę); (b) tylko pieniądze (córka w E3–E4 zobaczyłaby tylko E4.1; waga i termometr są
   w jej krokach E3.4, E3.11, E4.7). Dlaczego: jeden spójny temat (pierwsza grafika rastrowa: pipeline assetów +
   5 widżetów na sprite'ach), krokom E3–E4 córki daje MASS, TEMPERATURE, MULT_GROUPS, CAPACITY, MONEY; pięć pustych
   kroków staje się grywalnych. Co zmieniłoby odpowiedź: research pokaże, że pipeline assetów i widżety są mniejsze
   (np. `MoneyTable` i `Jugs` jedną fazą) — wtedy plan może wciągnąć typy tekstowe S-14c o najwyższej wartości
   (CLOCK_ELAPSED, TIME_UNITS); albo przeciwnie — MONEY_PAY (uogólnienie przeciągania) wypada pierwszy do S-14d.
2. **MONEY_PAY w zakresie, ale jako pierwszy kandydat do wycięcia.** Odrzucone: odłożenie od razu (E1.11/E2.2 i tak
   grywalne dzięki COUNT/CHANGE). Dlaczego: „przeciągnij monety do portfela” to rdzeń ZADANIA dla pieniędzy, a reduktor
   `blockDrag` już istnieje. Co zmieniłoby: research uzna uogólnienie `BlockKind` → nominały za ryzykowne dla E4.8
   (`place_build_100`, e2e `adaptive.spec`) — wtedy osobny reduktor albo przeniesienie do S-14d.
3. **Assety jako WebP w ½ rozdzielczości, generowane skryptem i commitowane; bez atlasu.** Odrzucone: PNG 1:1 z kitu
   (≈ 10 MB precache na tablecie dziecka, 6× cały build); atlas (narzędzie spoza stacku, M7). Dlaczego: 331 KB zmierzone,
   plan § 10 dopuszcza WebP dla tła, glob precache zna `webp`. Odstępstwo od litery § 10 („Monety i banknoty | PNG”)
   — do wiersza [human]. Co zmieniłoby: bramka wizualna pokaże rozmycie banknotów/termometru na iPadzie (DPR 2) —
   wtedy pełna rozdzielczość dla tych plików (nadal WebP).
4. **MASS tylko „w równowadze” na grafice; „cięższe/lżejsze”, gramy, 5 dag, tona i brutto/netto/tara jako tekst
   (S-14c), nie rysowane.** Odrzucone: rysowanie przechylonej wagi w kodzie (kit: „Future live weighing must move the
   beam and pans consistently… No unbalanced states are claimed”), wymyślanie odważników. Co zmieniłoby: opiekun
   dostarczy belkę i szalki osobno albo odważniki gramowe (inwentarz grafiki po runie).
5. **Ujemne temperatury i kwoty z groszami odpowiadane kafelkami** (klawiatura bez minusa i przecinka). Odrzucone:
   dodanie `−`/`,` do `Keypad` (zmiana komponentu wspólnego dla wszystkich etapów, brak w kicie). Co zmieniłoby:
   research znajdzie, że kafelki dla E5/E6 dają za łatwe zgadywanie — wtedy pytanie „ile stopni poniżej zera?” albo
   dwie kratki zł/gr.
6. **Brak migracji zapisu** (sekcja wyżej). Co zmieniłoby: stan gestu albo kwoty w zapisie — odrzucone.
7. **Następny krok `/10x-research`** (ustalony przez orkiestratora; uzasadniony: pierwsze ładowanie obrazów i
   precache, uogólnienie `blockDrag`, prostokąt rysunku przy klawiaturze O2, wpływ pięciu nowych kroków na
   `curriculum.ts`, odwzorowanie `thermometer-face.js` w Phaser Graphics).
