---
change_id: drawn-widget-tasks-e3-e4
title: Zadania z widżetami rysowanymi w kodzie dla E3–E4 (zegar, linijka, klocki, diagram) i tryby select/drag
status: implemented
created: 2026-10-13
updated: 2026-10-14
archived_at: null
---

## Notes

Slice roadmapy **S-13** (etap M6, pierwszy wycinek M6), autonomiczny run `2026-10-13-s12-s14`, gałąź
`feat/drawn-widget-tasks-e3-e4` cięta z `main` @ `b57433c` (po S-12, PR #39).

- **Outcome (roadmapa):** dziecko rozwiązuje w rundzie zadania typów grupy 2 dla E3–E4 z zegarem, linijką, osią liczbową,
  klockami dziesiątkowymi, słupkiem pisemnym, grafami i figurami rysowanymi w kodzie, z odpowiedzią dotykiem (w tym
  przeciąganiem i zaznaczaniem).
- **PRD:** FR-023 (typy grup 2–3, widżety rysowane w kodzie; wdrażanie w kolejności etapów córki, E3–E4 najpierw; „każdy
  etap ma pełny zestaw typów” to kryterium końca M6, nie tego slice'a).
- **Plan (`Martynka-urzadza.md`):** § 11 M6 (grupa 2: COUNT, ORDINAL, PLACE_VALUE, CLOCK, LENGTH, ARROW_TABLE,
  PUZZLE_GRID, SHAPES, PATTERN, WRITTEN; grupa 3 to S-14; minigry i LOGIC to S-15), § 14 zasady pracy.
- **Katalog (`docs/ZADANIA.md`):** § 3 kroki E3/E4, § 4 typy (CLOCK, LENGTH, PLACE_VALUE, DATA, PUZZLE_GRID, GRID,
  PERIMETER), § 7 kolejność wdrażania i model generatora (`answer: 'tiles' | 'keypad' | 'drag' | 'select'`).
- **Kontrakt runu** `context/runs/2026-10-13-s12-s14/agent-contract.md` § Slice-specific rules / S-13: generatory czyste
  z parserem i testem 1000 losowań, teacher read `npm run sample -- <etap> --count 6` każdego zmienionego kroku,
  widżety w Phaser Graphics, slice za duży → podział na małe fazy (≤ ~2 nowe komponenty UI na fazę), zawężenie zakresu
  decyzją + follow-up zamiast puchnięcia. `docs/zrodla/` nie jest czytane.
- **Wzorce:** `context/archive/2026-10-13-save-export-import-reset/` (struktura change.md, decyzje),
  `context/archive/2026-10-13-variant-change-room-done/` (gest przytrzymania jako czysty reducer w `core`, szwy e2e),
  `context/archive/2026-10-12-generators-e3-e4/` (generatory + parsery + teacher read).
- Plik `lessons.md` w `context/foundation/` nie istnieje (sprawdzone).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/drawn-widget-tasks-e3-e4` @ `b57433c` (roadmapa pisana przed S-02…S-12).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-12 | Done (PR #39, `b57433c`): eksport/import/reset, format zapisu nadal v1. | Bez korekty. |
| „zadania typów grupy 2 dla E3–E4” | Grupa 2 (ZADANIA § 7) obecna w krokach E3/E4 tylko jako: **CLOCK** (E3.3, E3.11, E4.3), **LENGTH** (E3.5, E4.7), **PUZZLE_GRID** (E3.5), **PLACE_VALUE** (E3.6, E4.1, E4.8). Kroki E3/E4 wymieniają też typy spoza listy § 7, rysowane w kodzie: **DATA** (E3.4, diagram), **GRID** (E3.7, siatka i kodowanie), **PERIMETER** (E4.7, figury). Kroki puste dziś (`skills: []`): E3.3, E3.4, E3.5, E4.3, E4.7. Rejestr `src/core/tasks/registry.ts` ma 21 generatorów grupy 1, żadnego z powyższych. | Zakres grupy 2 dla E3–E4 = CLOCK, LENGTH, PLACE_VALUE, PUZZLE_GRID (+ DATA, GRID, PERIMETER jako typy rysowane w kodzie). Podział — decyzja 1. |
| „… z zegarem, linijką, osią liczbową, klockami, słupkiem pisemnym, grafami i figurami” | `src/ui/widgets/` nie ma żadnego widżetu-rysunku zadania; `Task.visual` (`src/core/tasks/types.ts`) jest `unknown` i **żaden kod go nie czyta** (`TaskScene` rysuje tylko prompt, wyrażenie, kafelki/klawiaturkę). Kit ma referencje: `reference/clock.svg`, `ruler.svg`, `number-line.svg`, `base-ten.svg`, `written-addition.svg`, `square-grid.svg`, `helper-metadata.json`. | **Oś liczbowa**: żaden typ kroku E3–E4 jej nie wymaga (SEQUENCE jest tekstowy; „skoki na osi” to MULT_GROUPS, grupa 3 → S-14). **Słupek pisemny** (WRITTEN) jest od E5 → S-14 („pełny zestaw typów dla każdego etapu”). **Grafy** (ARROW_TABLE, „Od E2”) nie występują w żadnym kroku E3/E4 → S-14. Figury: SHAPES to E1–E2 (S-14); w E3–E4 figury to PERIMETER (E4.7) — odłożone (decyzja 1). |
| „odpowiedź dotykiem (w tym przeciąganiem i zaznaczaniem)”; Risk: „pierwsze tryby odpowiedzi drag i select” | `SkillDef.answer` zna `'drag' \| 'select'` (`src/core/types.ts`), ale `src/core/round/pick.ts` `playable` wpuszcza tylko `tiles`/`keypad`; DESIGN-GAP 7. Istnieją już dwie umiejętności `select`, wyłączone z losowania: `E1.6.even_odd_select_10` i `E3.7.select_even_30` (generator EVEN_ODD wariant `select` istnieje, `pl.tasks.selectEven`). Żadnej umiejętności `drag`. `RoundView.input` wywodzi tryb z `task.choices` (`src/core/round/view.ts` `roundView`), nie z `skill.answer`. | `select` w zakresie (odblokowuje 2 gotowe umiejętności, w tym E1). `drag` w zakresie z jednym typem (PLACE_VALUE „zbuduj liczbę z klocków”) — decyzja 2. Tryb wejścia niesiony na `Task` (follow-up S-04). |
| Etap M6, „największy etap planu” | Potwierdzone: 7 typów rysowanych + 2 tryby + infrastruktura rysunku w `TaskScene` przekracza ~8–9 małych faz. | Podział — decyzja 1. |
| PRD refs: FR-023 | Zgodne. | Bez korekty. |
| Parallel with S-15 | Run idzie szeregowo (kontrakt); S-15 nie jest w tym runie. | Bez wpływu. |

## Scope

### W S-13 (propozycja dla `/10x-plan`, ≤ 8 faz)

| Typ | Kroki | Widżet (Phaser Graphics) | Tryb odpowiedzi | Uwagi |
|---|---|---|---|---|
| CLOCK (odczyt) | E3.3 pełne godziny + obliczenia zegarowe („za 2 godziny”), E3.11 24-godz. („15.00 to która na tarczy?”), E4.3 minuty co 5, pół godziny, kwadrans | `ClockFace` (60 kresek, 2 wskazówki; ref. `clock.svg`) | `tiles` (3 godziny do wyboru) | Ustawianie wskazówek przeciąganiem → follow-up (decyzja 2). |
| LENGTH | E3.5 odcinki w cm (odczyt z linijki), E4.7 m i cm, mm | `Ruler` + odcinek nad nią (ref. `ruler.svg`, podziałka 0,5 cm / mm) | `keypad` / `tiles` | m ↔ cm może być tekstowe. |
| PLACE_VALUE (odczyt) | E3.6 do 30, E4.1 dziesiątki do 100, D i J, E4.8 setki do 1000 | `BaseTenBlocks` (1/10/100; ref. `base-ten.svg`) | `keypad` / `tiles` | „Ile dziesiątek i jedności?”, rozkład 23 = 20 + 3. |
| PLACE_VALUE (zbuduj) | E3.6, E4.1 | `BaseTenBlocks` + tacka | **`drag`** (klocek z zasobnika na tackę) | Pierwszy i jedyny typ `drag` w S-13. |
| DATA | E3.4 diagram słupkowy (najwięcej, najmniej, o ile więcej) | `BarChart` (brak referencji w kicie → DESIGN-GAP) | `tiles` / `keypad` | MASS z tego kroku → S-14. |
| EVEN_ODD `select` (istnieje) | E1.6, E3.7 | `SelectTiles` (zaznaczanie wielu + „OK”) | **`select`** | Zamyka DESIGN-GAP 7 dla `select`. |

Infrastruktura: typowany `Task.visual` (unia rysunków), tryb wejścia na `Task` zamiast z `choices`, obszar rysunku
w `TaskScene` (układ kitu: rysunek nad kafelkami jak `task-tiles.png` / obok klawiaturki jak `task-keypad.png`, „Keep
prompts and pictures visible while the keypad is used”), hook e2e (rodzaj rysunku, cele select/drag — punkty wewnętrzne).
Nowe kroki grywalne: E3.3, E3.4, E3.5, E4.3, E4.7 dostają `childName` (tekst dla dziecka, teacher read).

Szkic faz (plan je ustali): P1 core: `Task.visual`/`Task.input` + CLOCK (tdd) → P2 `ClockFace` + obszar rysunku +
dane E3.3/E3.11/E4.3 → P3 LENGTH + `Ruler` → P4 PLACE_VALUE odczyt + `BaseTenBlocks` → P5 DATA + `BarChart` →
P6 `select` (reducer w core + `SelectTiles`) → P7 `drag` (reducer w core + tacka, PLACE_VALUE „zbuduj”) → P8 e2e +
bramka wizualna.

### Poza S-13 (follow-up, propozycja nowej pozycji roadmapy „S-13b drawn-grid-tasks-e3-e4”)

- **PUZZLE_GRID** (E3.5 kwadrat magiczny), **GRID** (E3.7 siatka i kodowanie, pole A1), **PERIMETER** (E4.7 obwód
  figur na siatce) — wspólny widżet siatki (`square-grid.svg`), trzy generatory.
- **CLOCK „ustaw zegar”** przeciąganiem wskazówek (drugi typ `drag`, trudny gest kątowy).
- Z follow-upu S-03: BONDS „połącz pary dające 10” i CHOOSE_OP z obrazkiem (E1).
- Do S-14 (już w jego zakresie: „pełny zestaw typów dla każdego etapu”): oś liczbowa, WRITTEN (E5+), ARROW_TABLE,
  COUNT/ORDINAL/SHAPES/PATTERN (E1–E2), grupa 3 (MASS, CAPACITY, TEMPERATURE, MONEY_*, MULT_GROUPS).

## Design source and copy (profile § 6)

- **Kit, który slice wiąże:** `designs/martynka-maths-A-v1/style-guide.md` § „Code-drawn helpers” (ivory tarcze, teal
  linie 4 px kontur / 2 px siatka i drobne kreski, cień 4 px, aktywne pozycje rozróżnione geometrią i kolorem), §
  „Task states”, § „Font and spacing” (cele dotyku ≥ 96 px, prompt 64 px, liczebniki 700–750);
  `reference/clock.svg`, `ruler.svg`, `base-ten.svg`, `helper-metadata.json` (geometria i wartości), `helpers-reference.png`;
  ekrany `screenshots/task-tiles.png` (rysunek nad kafelkami — zadanie liczenia), `task-keypad.png`, `hint-tiles.png`,
  `solution-step-*.png` (podpowiedź przy rysunku: „Counted objects receive numbered markers”).
- **DESIGN-GAP (nowe wiersze w `docs/design-gaps.md`, od 52):** brak widoku zadania z rysunkiem obok klawiaturki
  (kit ma tylko liczenie nad kafelkami); brak referencji diagramu słupkowego (DATA); brak widoku trybu `select`
  (wiersz 7 — zamknięcie/rewizja), brak widoku trybu `drag` (zasobnik, tacka, upuszczenie poza celem); brak stanu
  „podpowiedź na rysunku” dla zegara/linijki/klocków. Nic nie jest wymyślane poza częściami kitu; kolory z
  `src/data/layout.ts` (`PLACEHOLDER_COLORS`) i palety kitu.
- **Klucze tekstów (`src/data/pl.ts`, `pl.tasks.*`):** istniejące `selectEven`, `selectEvenHint`, `round.*`; nowe
  (nazwy w planie) dla promptów, podpowiedzi i kroków rozwiązania CLOCK, LENGTH, PLACE_VALUE, DATA oraz przycisku
  zatwierdzenia w `select`/`drag` (kit ma tylko „OK” klawiaturki — użyć go, nie wymyślać nowego). Godziny słownie /
  „15.00” wg kitu (prawdziwe znaki, przecinki dziesiętne, `cm`, `mm`, `m`). `childName` nowych kroków w
  `src/data/curriculum/E3.ts`/`E4.ts`. Każdy rzeczownik w promptach (np. słupki diagramu) w `src/data/nouns.ts`.
  Teacher read `npm run sample -- E3 --count 6` i `E4` (oraz `E1` za `select`) dla każdego zmienionego kroku.

## Migration expected?

**Nie.** Format zapisu zostaje v1 (`src/core/save.ts` `SAVE_VERSION = 1`, fixtures `tests/fixtures/save-v1*.json`
nietknięte). `SavedLearner.mastery`/`streak` to `Record<skillId, number>` — nowe umiejętności po prostu nie mają wpisu
(= 0), a `validateSave` sprawdza tylko kształt (`hasOnly(..., isCount)`), nie listę ID. `unlockedStep` to numer kroku
z katalogu, niezależny od tego, które kroki są grywalne. **Skutek do zbadania w research (nie migracja):** pięć nowych
kroków grywalnych zmienia `playableSteps`, więc `calendarStart`/`floorToCalendar` (`src/core/curriculum.ts`), pulę
„earlier” w `skillBuckets`, `unlockReady` i `firstPlayableSteps` (rozgrzewka) — dziecko w środku E3 dostanie zegar
i diagram jako „wcześniejsze kroki”. Fixtures zapisu muszą się dalej ładować (test istnieje). Co zmieniłoby odpowiedź:
potrzeba zapisania w stanie czegoś per-zadanie (np. stanu przeciągania) — odrzucone, to stan sesji.

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| UI trybu `'select'` (E1.6, E3.7) i `'drag'`; wyłączone z losowania (design-gaps 7). `Trigger: S-13` | `2026-10-12-task-round-stars` | **W zakresie** (rdzeń: `select` dla obu umiejętności, `drag` dla PLACE_VALUE „zbuduj”). |
| `roundView`: tryb wejścia z `task.choices`, nie z `skill.answer`; nieść tryb na `Task` albo assert w `buildRound`. `Trigger: S-13 (select/drag) or any generator with a string answer on a 'tiles' skill` | `2026-10-12-task-round-stars` | **W zakresie** (warunek konieczny dla `select`/`drag`; P1). |
| `TaskScene.snapshot`: `answer` zwracany przez referencję; kopiować przed rysowaniem odpowiedzi tablicowych (select). `Trigger: S-13` | `2026-10-12-task-round-stars` | **W zakresie** (jedna linia + test hooka, faza `select`). |
| BONDS „połącz pary dające 10” i CHOOSE_OP z obrazkiem. `Trigger: S-13` | `2026-10-12-generators-remaining-stages` | **Poza zakresem** (E1, dwa nowe gesty); przenieść z triggerem „S-13b or S-14”. |

Przejrzane bez triggera dla S-13: `picture mode` dla 6-latków (design-gaps 21 → S-14), `monthDays` (S-17), hinty
z wynikiem (S-17).

## Autonomous decisions

1. **Podział slice'a: S-13 = infrastruktura rysunku + CLOCK (odczyt), LENGTH, PLACE_VALUE (odczyt i budowa), DATA +
   tryby `select` i `drag`; PUZZLE_GRID, GRID, PERIMETER i „ustaw zegar” → follow-up i propozycja nowej pozycji
   roadmapy S-13b.** Odrzucone: (a) cały zestaw w jednym slice'u (7 typów + 2 tryby + infrastruktura ≈ 12–14 faz,
   łamie regułę kontraktu „≤ ~2 nowe komponenty UI na fazę” i ~8–9 faz); (b) tylko CLOCK + `select` (córka widzi za
   mało nowego; roadmapa obiecuje kilka widżetów). Dlaczego ten wybór: obejmuje cztery z pięciu pustych kroków (E3.3,
   E3.4, E3.5 częściowo, E4.3, E4.7 częściowo) i wszystkie kroki z PLACE_VALUE, używa referencji, które kit ma (zegar,
   linijka, klocki), a trzy odłożone typy dzielą jeden widżet siatki, więc tworzą spójny osobny slice. Co zmieniłoby
   odpowiedź: research pokaże, że infrastruktura rysunku i widżety są mniejsze niż szacowane (np. jedna faza na typ z
   widżetem mieści się z zapasem) — plan może wciągnąć widżet siatki + PERIMETER w limit 9 faz; albo przeciwnie,
   `drag` okaże się za duży — wtedy `drag` idzie do S-13b, a S-13 kończy się na `select`.
2. **`drag` w S-13 tylko dla PLACE_VALUE „zbuduj liczbę z klocków”, nie dla zegara.** Odrzucone: przeciąganie
   wskazówek (gest kątowy, przyciąganie do 5 minut, większe ryzyko na iPadzie) i kafelki kalendarza (tekst). Dlaczego:
   upuszczenie klocka na tackę to najprostszy prostokątny cel, a model reduktora (jak `longPress`/`roomGesture`) da
   się przetestować w `core` przed sceną. Co zmieniłoby: plan-review uzna, że „zbuduj” bez cofania klocka jest
   frustrujące — wtedy tryb dostaje „zdejmij z tacki” albo `drag` przesuwa się do S-13b.
3. **DATA (diagram słupkowy) w S-13 mimo braku w liście § 7 grupy 2.** Odrzucone: odłożenie do S-14 jako „nie grupa 2”.
   Dlaczego: jest rysowany w kodzie (żadnej grafiki z kitu), krok E3.4 ma tylko DATA i MASS (MASS = grafika → S-14),
   więc bez DATA krok E3.4 zostaje pusty aż do S-14. Co zmieniłoby: brak referencji kitu okaże się blokujący w
   bramce wizualnej — wtedy DATA z DESIGN-GAP i prostymi słupkami, albo przeniesienie do S-13b.
4. **Oś liczbowa, słupek pisemny i grafy poza S-13 (korekta roadmapy).** Dlaczego: żaden krok E3–E4 ich nie wymaga
   (WRITTEN od E5, ARROW_TABLE poza krokami E3/E4, oś tylko w SEQUENCE/MULT_GROUPS); S-14 ma „pełny zestaw typów dla
   każdego etapu”. Co zmieniłoby: plan zdecyduje o osi liczbowej jako rysunku podpowiedzi dla ADD_SUB w E3 (ZADANIA § 1
   „delikatna podpowiedź (… oś liczbowa …)”) — wtedy to rozszerzenie podpowiedzi, nie nowy typ, i wchodzi tylko w ramach
   limitu faz.
5. **Brak migracji zapisu** (sekcja wyżej). Co zmieniłoby: stan przeciągania lub zaznaczenia w zapisie — odrzucone.
6. **Następny krok `/10x-research`, nie `/10x-plan`.** Dlaczego: obszar rysunku w `TaskScene` (671 linii), wpływ nowych
   kroków grywalnych na `curriculum.ts` i rozgrzewkę, wzorzec gestu dla `drag` oraz szwy hooka e2e wymagają
   rozpoznania kodu przed planem; krok narzucony też przez orkiestratora.
