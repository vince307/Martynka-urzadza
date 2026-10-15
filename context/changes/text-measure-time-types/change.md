---
change_id: text-measure-time-types
title: Typy tekstowe — czas, jednostki, ceny, kolejność działań, nierówności i runda powtórkowa (E1, E5–E6)
status: new
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Slice roadmapy **S-14c** (etap M6), autonomiczny run `2026-10-15-fix-s14c-s14d`, gałąź `feat/text-measure-time-types`
cięta z `main` @ `e2f7caa` (po fixie save-v2-backup-health, PR #54).

- **Outcome (roadmapa):** dziecko rozwiązuje zadania tekstowe CLOCK_ELAPSED (E5.3, E5.8, E6.2), TIME_UNITS (E6.1),
  UNIT_CHOICE (E5.7), PRICE i TIMES_MORE (E5.10), ORDER_OPS (E5.11), INEQUALITY (E1.9), tekstowe warianty MASS (gramy,
  brutto/netto/tara, tona: E5.7, E6.3, E6.5) i LENGTH (skala E5.12, wyrażenia dwumianowe E6.3), PLACE_VALUE ≥ 1000
  (E6.9, E6.10) oraz rundę powtórkową z całego roku (MIX, E6.11).
- **PRD:** FR-023 („każdy etap ma pełny zestaw typów z ZADANIA.md” to kryterium końca M6; ten slice zamyka typy E5–E6
  bez widżetów i INEQUALITY w E1).
- **Katalog (`docs/ZADANIA.md`):** § 3 kroki E1.9, E5.3, E5.7, E5.8, E5.10, E5.11, E5.12, E6.1, E6.2, E6.3, E6.5, E6.9,
  E6.10, E6.11; § 4 **INEQUALITY** („5 + _ < 8”, wiele poprawnych odpowiedzi, od E1), **TIMES_MORE**, **ORDER_OPS** (bez
  nawiasów), **PRICE** (ilość · cena, cena jednostkowa), **CLOCK_ELAPSED** (E5: przez północ, lekcja 45 min; E6: ile minut
  do pełnej godziny, czas trwania z rozkładu), **TIME_UNITS** (h/min/s, doba, kwadrans), **UNIT_CHOICE** („Długopis ma
  14 …” → cm/m/km), **MASS** (E5 g, brutto/netto/tara; E6 tona, kwintal), **LENGTH** (skala E5, wyrażenia dwumianowe E6),
  **PLACE_VALUE** (E6 do 10 000, odczyt do 1 000 000), § 3 E6.11 (**MIX** — „runda losująca ze wszystkich typów etapu;
  LOGIC jako zadania z gwiazdką”).
- **Kontrakt runu** § S-14c: blok roadmapy + follow-upy z `Trigger: S-14c` (także przeniesione przez S-13b i S-14b);
  „dużo treści: każdy nowy generator ma teacher read; MIX to funkcja programu — plan decyduje o kształcie i nie może
  zepsuć harmonogramu wariantów S-15”. § All slices: `src/core` czyste, testy najpierw, teksty w `src/data/`, liczby w
  `balance.ts`, teacher read `npm run sample -- <etap> --count 6`, bez `docs/zrodla/`, **zapis zostaje v2**, fixture'y
  zamrożone, bez `deploy/`, `designs/`, `.gitignore`, `.claude/`.
- **Wzorce:** `context/archive/2026-10-14-art-tasks-all-stages/` (S-14: nowe generatory + umiejętności w wielu etapach,
  wartości w `src/data/measures.ts`, `src/core/text/measure.ts`), `context/archive/2026-10-14-number-line-written-arrows/`
  (S-14b: tabela roszczeń, progi odblokowania przy dokładaniu umiejętności, follow-upy z triggerami).
- Plik lekcji w `context/foundation/` nie istnieje (sprawdzone 2026-10-15).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/text-measure-time-types` @ `e2f7caa`. Blok S-14c pisano przy planie S-14 — od tego czasu weszły
S-13b (#49), S-15 (#50), S-14b (#51), save-reason-and-recovery, save-v2-backup-health (#54).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-14 | Done. Rejestr (`src/core/tasks/registry.ts` `generators`/`parsers`): 37 typów (do `WRITTEN`, `ARROW_TABLE`), **żadnego** z CLOCK_ELAPSED, TIME_UNITS, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, INEQUALITY, MIX — wszystkie tylko w `types:` kroków i w liście `LATER` w `tests/curriculum.test.ts`. | Bez korekty zależności. 7 nowych generatorów + MIX jako funkcja programu (nie generator). Każdy nowy typ wypada z listy `LATER`. |
| „Parallel with S-14b, S-15” | Oba done. | Nic równoległego. Kolizje z S-15: harmonogram `nextRoundKind`/`afterRound` (`src/core/variants.ts`) liczy tylko `roundsSince` dla `kind: 'round'`; minigra „Hasło z wyników” bierze tylko `WORD_TYPES` = ADD_SUB/MULT/DIV (`src/core/minigames/word.ts`), więc nowe typy do niej nie wchodzą. MIX musi być zwykłą `'round'` (decyzja 3). |
| INEQUALITY w E1.9 | E1.9 ma 2 umiejętności (`E1.9.add_sub_10` keypad, `E1.9.missing_op_10` tiles), próg `ceil(0.5·2)` = 1. `Task.check` (`src/core/tasks/types.ts`, „tasks with several correct answers”) istnieje i `round.ts` go używa przy ocenie; dziś ma go tylko EVEN_ODD (`select`). | +1 → 3 umiejętności, próg **2** (wolniej dla zapisanych na E1.9, nic nie ginie). INEQUALITY to pierwszy `check` dla odpowiedzi liczbowej (kafelki E1): research sprawdza `canonicalInput`, `solvableInMode`, rozwiązanie/podpowiedź pokazujące jedną odpowiedź i helpery e2e `answerRight`/`answerWrong`. |
| CLOCK_ELAPSED w E5.3, E5.8, E6.2 | E5.3: 2 umiejętności (number_words, calendar), E5.8: 1 (`mult_6_9`), **E6.2: `skills: []` (krok niegrywalny)**. `src/core/text/time.ts` istnieje (format godzin). | E6.2 staje się grywalny → `playableSteps(E6)` rośnie (patrz wiersz „skutek uboczny”). E5.3 +1 → próg 2 (dziś 1); E5.8 +1 → próg 1. |
| TIME_UNITS w E6.1 | E6.1: 3 umiejętności (calendar_time, temperature_negative, temperature_diff), próg 2. | +1 → 4, próg 2 (bez zmiany). |
| UNIT_CHOICE i MASS (gramy, brutto/netto/tara) w E5.7 | E5.7: 2 (compare_diff_100, length_ruler_mm), próg 1. **Brak MASS w E5.7.** | +UNIT_CHOICE +MASS tekst → 4, próg **2**. |
| PRICE, TIMES_MORE w E5.10 | E5.10: 1 (`word_100`, WORD), próg 1. | +2 → 3, próg **2**. |
| ORDER_OPS w E5.11 | E5.11: 1 (`calendar_days`), próg 1. | +1 → 2, próg 1. |
| LENGTH skala w E5.12 | E5.12: 2 (PERIMETER sideSquare/sideRect), **brak LENGTH**, próg 1. | +1 → 3, próg **2**. |
| MASS i LENGTH (dwumianowe) w E6.3 | E6.3: 1 (`perimeter_composite`), **brak MASS i LENGTH**, próg 1. | +2 → 3, próg **2**. |
| MASS tona w E6.5 | E6.5: 2 (complement_100_1000, place_read_1000 100–999), **brak MASS**. | +1 → 3, próg 2 (dziś 1). |
| PLACE_VALUE ≥ 1000 w E6.9, E6.10 | E6.9: rounding_100/1000 (2); E6.10: roman_2000, compare_num_1000000 (2). **Brak PLACE_VALUE w obu**; generator `placeValue.ts` ma warianty read/tens/decompose/build (klocki 1/10/100, tryb `drag` dla build). | Warianty **tekstowe** (keypad) dla tysięcy i rzędów do 1 000 000; klocki i `build` nie skalują się powyżej 999 (research potwierdza). Formatowanie: `formatNumber.ts` (grupowanie od 10 000). |
| MIX w E6.11 | **E6.11: `types: ['MIX','LOGIC'], skills: []`** (niegrywalny). LOGIC to pula zagadek S-15 (`src/data/puzzles.ts`, `balance.variants.puzzleStages: ['E3','E4']`). | MIX = krok, którego runda losuje ze wszystkich grywalnych umiejętności etapu (decyzja 3). LOGIC poza zakresem (S-15 / follow-up F1 S-15). |
| „Tekstowe”, „bez widżetów, tani w e2e” | Prawda dla CLOCK_ELAPSED, TIME_UNITS, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, MASS/LENGTH tekst, PLACE_VALUE tekst. „Rozkład jazdy” (E5.8, E6.2) można podać tekstem. | Bez nowych widżetów (decyzja 2). E2E: jeden spec na nowy tryb oceny (INEQUALITY `check` w kafelkach) i jeden na rundę MIX; reszta to unit + `contentInvariants` + teacher read. |
| (nie w roadmapie) skutek uboczny dla startu | `calendarStart` (`src/core/curriculum.ts`) wybiera k-ty z `playableSteps`, `k = ceil(progress · n)`; `floorToCalendar` podnosi zapisany krok do startu kalendarza przy wczytaniu. E6 ma dziś 9 grywalnych kroków (1,3–10); po slice 11 (1–11). Lipiec–sierpień (progress 1) i etap „za kalendarzem” → start na **E6.11 (MIX)**; zapisany uczeń E6 w wakacje zostałby podniesiony do MIX. | Plan decyduje: wyłączyć krok powtórkowy z `calendarStart` (start na ostatnim kroku z typami), albo uznać „powtórka w wakacje” za zamierzoną. Rekomendacja: wyłączyć (decyzja 4). |

## Scope (propozycja dla `/10x-research` i `/10x-plan`)

| Typ (nowy generator) | Kroki | Tryb | Treść i odmiana (nouns / teacher read) |
|---|---|---|---|
| INEQUALITY | E1.9 („5 + _ < 8”, do 10) | tiles (E1), `check` | Bez rzeczowników; „<”/„>” jak COMPARE_*; podpowiedź „ile to 5 + 3? Weź mniej” bez wyniku. Mowa narratora: „mniejsze niż” (`pl.speech`). |
| CLOCK_ELAPSED | E5.3 (lekcja 45 min, przez północ), E5.8 (doba, rozkład jazdy), E6.2 (minuty do pełnej godziny, czas trwania programu) | keypad (minuty / godziny) albo tiles (godzina wyniku) | Nouns: `godzina`, `minuta` są; nowe: `lekcja`, `przerwa`, `film`/`program`, `pociąg`/`autobus` w bierniku („trwa 45 minut”, „odjeżdża o …”); czasownik wg płci imienia (`wordTemplates.ts`). |
| TIME_UNITS | E6.1 | keypad | Nowe: `sekunda`, `doba`, `kwadrans` (1/2–4/5+: kwadranse, kwadransów), `dzień` (dni/dni). |
| UNIT_CHOICE | E5.7 | tiles (mm/cm/m/km, g/dag/kg) | Przedmioty z wymiarem (długopis, pokój, droga, mrówka…) — nowe rzeczowniki tylko w mianowniku podmiotu; liczba + skrót jednostki bez odmiany; dystraktory „bliskie, ale jednoznaczne”. |
| PRICE | E5.10 (ilość · cena, cena jednostkowa) | keypad (zł) | `złoty`/`grosz` są; nowe towary (zeszyt, długopis, bułka…) w bierniku po „kupiła 3 zeszyty”; kwoty przez `formatMoney`. Banknoty 200/500 — nie (decyzja 6). |
| TIMES_MORE | E5.10 („ile razy więcej”, „n razy więcej/mniej”) | keypad | Rzeczowniki z `nouns.ts` + nowe; „3 razy więcej naklejek” (dopełniacz l.mn. po „więcej” — validator zna tylko formy 1/2–4/5+, teacher read pilnuje). |
| ORDER_OPS | E5.11 („6 + 6 · 8”, „20 − 12 : 4”, bez nawiasów) | keypad | Bez rzeczowników; podpowiedź „najpierw mnożenie”. Zakres do 100. |
| MASS (tekst) | E5.7 (g, brutto/netto/tara), E6.3, E6.5 (tona, kwintal) | keypad | Nowy wariant generatora `mass.ts` bez rysunku wagi; nowe: `gram`, `dekagram`, `kilogram`, `tona`, `kwintal` (jeśli w polu tekstu, nie jako skrót); towary w słoiku/skrzynce (tara). |
| LENGTH (tekst) | E5.12 (skala: „1 cm na planie to 2 m”), E6.3 (wyrażenia dwumianowe: „2 m 35 cm = … cm”) | keypad | Nowy wariant `length.ts` bez linijki; `metr`, `centymetr`, `milimetr`, `kilometr` gdy pisane słownie. |
| PLACE_VALUE (tekst) | E6.9 (tysiące, rozkład, do 10 000), E6.10 (odczyt rzędów do 1 000 000) | keypad / tiles | `setka`, `dziesiątka`, `jedność` są; nowy `tysiąc` (tysiące/tysięcy); formatowanie z `formatNumber.ts`. |
| MIX (funkcja programu) | E6.11 | — | `childName` E6.11 w danych; bez nowych tekstów rundy, chyba że plan doda tytuł HUD (DESIGN-GAP). |
| CAPACITY (follow-up) | E5.5 `capacity_half_l_e5` | keypad | Tekstowo („ile szklanek ¼ l w 3 l”) — jeśli inwarianty różnorodności przejdą; inaczej trigger dalej (tabela follow-upów). |

Szacunek: ~20 nowych umiejętności w 14 krokach, 7 generatorów + 3 nowe warianty istniejących (MASS, LENGTH, PLACE_VALUE).
Każdy nowy rzeczownik w `src/data/nouns.ts` z biernikiem w kontekście; teacher read E1, E5, E6 (`--count 6`) zapisany w
artefakcie fazy.

## Design source and copy (profile § 6)

- **Widoki kitu, które slice wiąże** (`designs/martynka-maths-A-v1/screenshots/`): `task-keypad.png`, `task-tiles.png`
  (polecenie tekstowe + odpowiedź), `hint-keypad.png`, `hint-tiles.png`, `second-try.png`, `solution-step-1.png`,
  `solution-step-2.png`, `correct.png`, `summary.png`, `unlock.png` („Nowa umiejętność!” z `childName` kroku). Żadnego
  nowego ekranu.
- **Klucze tekstów:** polecenia i podpowiedzi nowych typów jako nowe klucze w `pl.tasks` / mowa w `pl.speech`
  (`src/data/pl.ts`); konteksty i imiona w `src/data/wordTemplates.ts`; rzeczowniki w `src/data/nouns.ts`; czas w
  `src/data/calendar.ts` / `src/core/text/time.ts`; jednostki w `src/data/measures.ts` i `src/core/text/measure.ts`;
  `childName`/`title` kroków E1.9, E5.3, E5.7, E5.8, E5.10, E5.11, E5.12, E6.1, E6.2, E6.3, E6.5, E6.9, E6.10, E6.11.
- **DESIGN-GAP (kandydaci, wiersze w `docs/design-gaps.md` od 98):**
  1. INEQUALITY — kit nie ma widoku dla zadania z **kilkoma poprawnymi** odpowiedziami w kafelkach (co pokazuje
     rozwiązanie: jedną przykładową? wszystkie poprawne kafelki?).
  2. MIX — kit nie ma tytułu/oznaczenia „rundy powtórkowej” („Test przed klasą 4”); jeśli plan nic nie pokazuje poza
     `childName` na karcie odblokowania, gap nie powstaje.
  3. „Rozkład jazdy” jako tabelka (E5.8, E6.2) — kit jej nie ma; decyzja 2 podaje go tekstem (bez gapa).

## Migration expected?

**Nie.** Zapis zostaje **v2** (kontrakt runu). Nowe umiejętności to nowe klucze w otwartej mapie `mastery` (walidacja
`hasOnly(v.mastery, isCount)` w `src/core/save.ts` przyjmuje każdy id), numery kroków się nie zmieniają (E6.2 i E6.11
już istnieją w danych), `unlockedStep` to liczba. MIX jako krok **nie** zapisuje stanu („zdany test”, certyfikat, licznik
rund powtórkowych) — gdyby plan tego chciał, **slice zatrzymuje się na otwartym PR** (v3, domyślna decyzja
maintainera 2026-10-15). Fixture'y `tests/fixtures/save-v1*.json` i v2 bez zmian.

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Źródło | Ocena zakresu |
|---|---|---|
| **Warianty tekstowe MASS i LENGTH** (porównania, gramy, tona, kwintal) oraz **PLACE_VALUE od 1000**. `Trigger: S-14c` | `2026-10-14-art-tasks-all-stages` | **W zakresie** — to część outcome'u roadmapy (tabela Scope). |
| **E5.5 `capacity_half_l_e5`** (przestrzeń zadań „ile ½ l” za mała). `Trigger: S-14c` (przeniesione z S-14b) | `2026-10-14-number-line-written-arrows` | **W zakresie, warunkowo** — wariant tekstowy CAPACITY z większą przestrzenią (½ i ¼ l, do 5 l, „ile szklanek”). Jeśli inwarianty różnorodności (`tests/contentInvariants.test.ts`) nie przejdą → trigger przenieść na `S-17`. |
| **„Ustaw zegar” w E5–E6 i odpowiedzi co minutę.** `Trigger: S-14c or a tablet test` | `2026-10-14-drawn-grid-tasks-e3-e4` | **Poza zakresem** — żaden krok E5–E6 nie ma CLOCK w `types:` (ZADANIA § 3), a slice jest tekstowy. CLOCK_ELAPSED dostaje odpowiedzi co minutę (tekst). Trigger przy archiwum: `a CLOCK step in E5–E6 or a tablet test`. |
| **Banknoty 200 i 500 zł bez umiejętności.** `Trigger: S-14c or a money skill above 100 zł` | `2026-10-14-art-tasks-all-stages` | **Poza zakresem** — PRICE jest tekstowy, kwoty E5 do 100 zł. Trigger zostaje (`a money skill above 100 zł`). |
| **WRITTEN „brakujące cyfry w słupku” (E6).** `Trigger: S-14c or the next change to WRITTEN` | `2026-10-14-number-line-written-arrows` | **Poza zakresem** — nowy układ okienek i oceny, nie typ tekstowy. Trigger: `the next change to WRITTEN`. |
| **ARROW_TABLE „·n”, łańcuch, kilka pustych pól.** `Trigger: S-14c or a multi-number reducer` | `2026-10-14-number-line-written-arrows` | **Poza zakresem** — wymaga odpowiedzi wieloliczbowej. Trigger: `a multi-number reducer`. |
| **F9: limit prób w `draw` (`src/core/tasks/generators/written.ts`).** `Trigger: S-14c or the next change to WRITTEN` | `2026-10-14-number-line-written-arrows` | **W zakresie (tanie, opcjonalne)** — `MAX_ATTEMPTS` + test; nowe generatory i tak dostają ten wzorzec (każdy generator z pętlą odrzucania ma limit). Plan może dołączyć do fazy z generatorem z pętlą. |
| S-15 F1 (E5–E6 dostają pulę zagadek E3–E4); LOGIC w E6.11 | `2026-10-14-minigame-daily-puzzle` (trigger: odczyt autora 10.6) | **Poza zakresem** — trigger nie wskazuje S-14c; LOGIC to pula S-15, nie MIX. |

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Wybrane: research. Odrzucone: plan od razu. Dlaczego: 7 nowych
   generatorów + 3 warianty + MIX jako nowa funkcja programu + pierwszy `check` w kafelkach + skutek uboczny dla
   `calendarStart` — dużo punktów styku w `core/curriculum.ts`, `round/*`, e2e. Zmieniłoby: nic (krok narzucony przez
   orkiestratora).
2. **Bez nowych widżetów; „rozkład jazdy” tekstem.** Wybrane: wszystkie typy w trybie keypad/tiles z poleceniem tekstowym.
   Odrzucone: tabelka rozkładu jako `TaskVisual`. Dlaczego: roadmapa nazywa slice „tekstowy, bez widżetów”, kontrakt nie
   przewiduje widżetów, kit nie ma tabelki. Zmieniłoby: teacher read uzna polecenie z rozkładem za nieczytelne → follow-up
   na widżet tabeli.
3. **MIX = krok programu, nie generator; runda MIX to zwykła `kind: 'round'`.** Wybrane (rekomendacja dla planu): krok
   E6.11 oznaczony w danych jako powtórkowy (np. flaga na `StepDef`), `skillBuckets`/`buildAdaptiveRound` losują jego
   „bieżącą” pulę ze wszystkich grywalnych umiejętności etapu (E6) — `roundsSince` rośnie jak przy każdej rundzie, więc
   harmonogram S-15 się nie zmienia. Odrzucone: generator `MIX` delegujący do innych (łamie `(skill, rng) => Task` i
   mieszałby `mastery` pod jednym id); osobny `RoundKind 'review'` (rusza `variants.ts` i stan v2). Dlaczego: zero stanu
   w zapisie, minimalny styk z S-15. Zmieniłoby: research pokaże, że `playableSteps` / odblokowanie potrzebują realnych
   umiejętności w kroku (wtedy syntetyczne umiejętności z `review`) albo autor chce zaliczenia „testu” (v3 → stop na PR).
4. **Krok powtórkowy nie jest startem kalendarza.** Wybrane (rekomendacja): `calendarStart`/`floorToCalendar` pomijają
   krok MIX, więc dziecko w wakacje startuje na E6.10 jak dziś. Odrzucone: zostawić (wakacyjny start i podniesienie
   zapisanych uczniów na MIX). Dlaczego: podniesienie przy wczytaniu przeskakuje nieopanowane kroki bez wiedzy rodzica.
   Zmieniłoby: autor chce, by powtórka była domyślnym startem po roku szkolnym.
5. **LOGIC w E6.11 poza zakresem.** Wybrane: nie ruszać puli zagadek. Dlaczego: LOGIC to dane S-15
   (`balance.variants.puzzleStages`), osobna decyzja autora (S-15 F1). Zmieniłoby: autor rozszerzy pulę na E5–E6.
6. **Follow-upy:** w zakresie MASS/LENGTH tekst, PLACE_VALUE ≥ 1000, `capacity_half_l_e5` (warunkowo), F9 (opcjonalnie);
   poza: zegar „ustaw” E5–E6, banknoty 200/500, WRITTEN „brakujące cyfry”, ARROW_TABLE wieloliczbowy — z nowymi triggerami
   przy archiwum. Dlaczego: slice jest tekstowy, a te pozycje wymagają widżetu, nowego trybu albo kwot > 100 zł.
   Zmieniłoby: research znajdzie krok E5–E6 z CLOCK w `types:` albo PRICE z kwotami > 100 zł w ZADANIA.
7. **Zapis zostaje v2.** Wybrane: żadnego pola w zapisie. Dlaczego: kontrakt; MIX bez stanu (decyzja 3). Zmieniłoby:
   wymóg „zaliczonego testu” → v3 → slice kończy na otwartym PR.
