---
date: 2026-10-12T19:05:00+02:00
researcher: Claude (krok /10x-research, run 2026-10-12-s03-remaining-stages)
git_commit: 4db8238
branch: feat/generators-remaining-stages
repository: Martynka-urzadza
topic: "S-03 generators-remaining-stages: które kroki E1, E2, E5, E6 da się pokryć istniejącymi generatorami, które wymagają nowych generatorów lub rozszerzeń parametrów, jak duże są przestrzenie zadań E1 wobec progów niezmienników i jak podzielić pracę na fazy"
tags: [research, generators, curriculum, E1, E2, E5, E6, content-invariants, M1]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (krok /10x-research)
---

# Research: S-03 generators-remaining-stages

**Date**: 2026-10-12T19:05:00+02:00
**Researcher**: Claude (krok /10x-research, run 2026-10-12-s03-remaining-stages)
**Git Commit**: 4db8238
**Branch**: feat/generators-remaining-stages
**Repository**: Martynka-urzadza

## Research Question

Pytania z `change.md` („Roadmap claims vs repo now”, „Triggered follow-ups”) i z promptu kroku:

1. Dla każdego kroku E1, E2, E5, E6 (`docs/ZADANIA.md` §3): typy kroku; które mają generator, które potrzebują nowego generatora (7 typów grupy 1 bez generatora), które rozszerzenia parametrów istniejącego, a które są grupą 2–3 (rysunki/grafika, M6).
2. Wielkość przestrzeni zadań najmniejszych umiejętności E1 wobec progów `MIN_DISTINCT = 12` i `MAX_TOP_SHARE = 0.15` (`tests/contentInvariants.test.ts`), zmierzona; co zrobić z rzeczywiście małymi przestrzeniami.
3. Rozszerzenia dla E5–E6 (ROUNDING `to`, CALENDAR, MULT/DIV, NUMBER_WORDS powyżej 1000, format liczb ≥ 1000 wobec `ARITHMETIC_LINE`/`BINARY_PROMPT`).
4. Zakres F12 (`addSubHint` dla `DT−U`, skośność trybu bez kształtów).
5. Podział na fazy (małe, niezależnie zielone, ≤ ~2 nowe generatory na fazę) z driverem.

## Summary

- **Kroki**: 44 kroki w czterech etapach (E1 11, E2 10, E5 12, E6 11; `docs/ZADANIA.md` §3). 34 z nich mają co najmniej jeden typ grupy 1 i muszą dostać umiejętność (`tests/curriculum.test.ts`, test „covers its group-1 types”); 10 kroków ma wyłącznie typy grup 2–4 i zostaje pustych jak E3.3 (E1.1, E1.8, E1.10, E2.2, E2.8, E5.5, E5.12, E6.2, E6.3, E6.11). Pary krok × typ grupy 1 do pokrycia: 53 (E1 17, E2 10, E5 14, E6 12), więc dane etapów to co najmniej 53 umiejętności.
- **Nowe generatory: 7** (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP), żaden nie jest w `generators` w `src/core/tasks/registry.ts`. Używają ich kroki: BONDS E1.3, E1.4, E1.7; CHOOSE_OP E1.3; CHAIN E1.5; COMPARE_EXPR E1.7; MISSING_OP E1.9; FACT_FAMILY E2.4, E2.6, E5.9, E6.7; SEQUENCE E2.7. Poza tymi krokami §3 nie wymienia tych typów w żadnym kroku E1–E6 (sprawdzone wszystkie 63 kroki §3).
- **Rozszerzenia istniejących generatorów: 6 koniecznych + 3 opcjonalne.** Konieczne: (1) ADD_SUB tryb bez kształtów — udział `n − n` mierzony 21,2 % (max 5), 14,6 % (max 9), 13,4 % (max 10) łamie `MAX_DEGENERATE_SHARE = 0.1`, a `DT−DT` (E2.7) daje 10,1 %; (2) CALENDAR — nowe warianty: dni tygodnia (E1.4), dni w miesiącu 30/31 (E5.11), dekada/rok (E6.1); (3) ROUNDING `to: 100 | 1000` i `max` do 10 000 (E6.9; parser dziś rzuca `TypeError` dla `to: 100`); (4) DIV — lista ilorazów (800 : 4, 360 : 4 w E6.8 nie da się wyrazić `maxQuotient`); (5) COMPARE_NUM dla liczb do 1 000 000 (E6.10) — podpowiedź `describe` daje „636884 to 63688 dziesiątek i 4 jedności”; (6) format liczb ≥ 10 000 (spacja tysięcy) w `src/core/text/` i w regexach niezmienników. Opcjonalne: COMPARE_NUM `step: 10` (E2.7 „porównywanie dziesiątek”), EVEN_ODD z zerem (E1.6 „Zero, parzyste…”), `multHint` dla wielokrotności 10/100 (4 · 70 → 4 · 7 = 28, 28 · 10). F12 (`addSubHint` dla `DT−U`) — w zakresie, mała zmiana.
- **Bez rozszerzeń** (same dane): MULT 4 · 70, 3 · 200, 6 · 12 wyrażają się listą `factors` (zmierzone: 0 naruszeń niezmienników), DIV 96 : 6 przez `maxQuotient: 19`, COMPLEMENT do 100 i 1000 przez `targets: [100, 1000]`, ADD_SUB E6 przez kształty `HTU+U`, `HT+DT`, `HTU-U`, `HT-DT`, `H-HTU`, ROMAN do MM (`max: 2000`), NUMBER_WORDS do 100 (E5.3). **NUMBER_WORDS powyżej 1000 nie jest potrzebne**: żaden krok E6 w §3 nie wymienia NUMBER_WORDS (pytanie z `change.md` rozstrzygnięte przeciw rozszerzeniu).
- **E1 — werdykt przestrzeni** (1000 losowań, seedy 910 000 + i jak w `tests/contentInvariants.test.ts`): rzeczywiście za małe są dwie umiejętności — COMPLEMENT do 10 (9 różnych zadań, najczęstsze 12,8 %) i EVEN_ODD „pojedyncza” do 10 (10 różnych, 11,0 %); obie spełniają `MAX_TOP_SHARE`, łamią tylko `MIN_DISTINCT`. Pozostałe kandydatki mieszczą się: COMPARE_NUM ≤ 5 (25), MISSING ≤ 5 (60), BONDS do 5 / 6–7 / 10 (20 / 22 / 18 wg enumeracji), CHAIN ≤ 9 (729), MISSING_OP ≤ 10 (110), COMPARE_EXPR ≤ 10 (10 000 par). Rekomendacja: nie obniżać progów globalnie; dla dwóch umiejętności — jawny wyjątek per id umiejętności w `tests/contentInvariants.test.ts` z komentarzem i zmierzoną wartością (wymóg agent-contract, reguły S-03). ADD_SUB E1 nie jest „małą przestrzenią”, tylko skośnym losowaniem — naprawić generator, nie próg.
- **Podział**: 7 faz (5 × tdd, 2 × impl), ≤ 2 nowe generatory na fazę; dane etapów wchodzą dopiero po generatorach, bo `tests/curriculum.test.ts` odrzuca krok z typem, który nie jest ani w `GROUP_1`, ani w `LATER`. 7 > „~6” z decyzji 2 w `change.md` — rekomendacja: nie dzielić slice'u (uzasadnienie w „Phase split”).

## Detailed Findings

### 1. Kroki E1, E2, E5, E6 → typy → stan generatora

Legenda: **G** — generator istnieje, wystarczą dane; **G+** — generator istnieje, potrzebne rozszerzenie parametrów; **N** — nowy generator; **L** — grupa 2–4 lub typ tekstowy spoza §7 → `LATER` (bez umiejętności w S-03). Źródło typów: `docs/ZADANIA.md` §3; grupy: §7; stan generatorów: `src/core/tasks/registry.ts` (`generators`, `parsers`).

#### E1 — klasa 1, I półrocze (liczby 0–12, + i − wynik ≤ 10; §2)

| Krok | Typy | Stan | Kandydat parametrów (zmierzony, gdy G) |
|---|---|---|---|
| E1.1 | SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY | L ×5 | krok pusty |
| E1.2 | COUNT, ORDINAL, COMPARE_NUM | L, L, G | COMPARE_NUM `{ max: 5 }`: 25 różnych, top 7,2 % |
| E1.3 | ADD_SUB, MISSING, BONDS, CHOOSE_OP | G+ (n − n), G, N, N | ADD_SUB `{ max: 5, ops: ['+','-'], bridge: 'any' }`: 25 różnych, top 13,2 %, n − n 21,2 % ✗; MISSING `{ max: 5, ops: ['+','-'] }`: 60, 5,5 % |
| E1.4 | COUNT, BONDS, CALENDAR | L, N, G+ (dni tygodnia) | CALENDAR: dziś tylko `nextMonth/prevMonth/quarter/romanMonth` (`CalendarVariant`), `weekdays` jest w `src/data/calendar.ts`, ale żaden generator go nie czyta |
| E1.5 | ADD_SUB, CHAIN, WORD | G+ (n − n), N, G | ADD_SUB `{ max: 9 }`: 81, 5,7 %, n − n 14,6 % ✗; WORD `{ max: 9, kinds: ['sum','left','twoSteps'] }`: 803, 0,5 % |
| E1.6 | EVEN_ODD | G (mała przestrzeń) | `{ max: 10, variant: 'single' }`: 10 różnych ✗ `MIN_DISTINCT`, top 11,0 %; `{ max: 12 }`: 12 (dokładnie próg); `variant: 'select'`: 996 par polecenie + kafelki, ale 1 polecenie |
| E1.7 | BONDS, COMPLEMENT, COMPARE_EXPR | N, G (mała przestrzeń), N | COMPLEMENT `{ max: 10, targets: [10] }`: 9 różnych ✗, top 12,8 % |
| E1.8 | LENGTH | L | krok pusty |
| E1.9 | ADD_SUB, MISSING_OP, INEQUALITY | G+ (n − n), N, L | ADD_SUB `{ max: 10 }`: 100, 5,3 %, n − n 13,4 % ✗ |
| E1.10 | COUNT, PLACE_VALUE | L, L | krok pusty |
| E1.11 | CLOCK, CALENDAR, MASS, MONEY_COUNT, MONEY_PAY, MONEY_CHANGE | L, G, L, L, L, L | CALENDAR `{ variants: ['nextMonth','prevMonth'] }`: 24 polecenia, 944 pary z kafelkami |

#### E2 — klasa 1, II półrocze (0–20 z przekroczeniem, dziesiątki do 100, dwucyfrowe do 99)

| Krok | Typy | Stan | Kandydat parametrów |
|---|---|---|---|
| E2.1 | PLACE_VALUE, ADD_SUB | L, G | `{ max: 20, shapes: ['DU+U','DU-U'], bridge: 'none' }`: 117, 1,6 % |
| E2.2 | MONEY_COUNT, MONEY_PAY, MONEY_CHANGE, CAPACITY | L ×4 | krok pusty |
| E2.3 | ADD_SUB (z rozbiciem „do 10”) | G | `{ max: 20, ops: ['+'], bridge: 'ten' }`: 36, 4,3 %; `addSubHint` już rozbija do dziesiątki (7 + 6 → 7 + 3, 10 + 3). Kolejność 9 + n → 6 + n z §3 to progresja w kroku, nie wymóg M1 (opcjonalny parametr lewego składnika — nie rekomendowany teraz) |
| E2.4 | FACT_FAMILY (przemienność) | N | 180 par a + b ≤ 20, a ≠ b (enumeracja) |
| E2.5 | ADD_SUB | G | `{ max: 20, ops: ['-'], bridge: 'ten' }`: 36, 4,5 % |
| E2.6 | FACT_FAMILY (sprawdzanie odejmowania), ARROW_TABLE | N, L | 190 par a − b ≤ 20 |
| E2.7 | SEQUENCE, COMPARE_NUM, ADD_SUB | N, G (opcjonalnie G+ `step: 10`), G+ (n − n) | ADD_SUB `{ max: 100, shapes: ['DT+DT','DT-DT'], bridge: 'none' }`: 90, 2,2 %, n − n 10,1 % ✗; COMPARE_NUM `{ max: 100 }` porównuje dowolne liczby (to treść E4.1/E2.9), „dziesiątki” wymagałyby `step` |
| E2.8 | MONEY_COUNT, MASS, LENGTH | L ×3 | krok pusty |
| E2.9 | PLACE_VALUE, ADD_SUB | L, G | `{ max: 99, shapes: ['DT+U','DU-U'], bridge: 'none' }` (30 + 4, 76 − 6): 374, 1,3 % |
| E2.10 | DATA, CALENDAR, CLOCK | L, G, L | CALENDAR miesiące jak E1.11 (wariant „kartka kalendarza, za tydzień” — opcjonalny, nie rekomendowany teraz) |

#### E5 — klasa 3, I półrocze (do 100 pełne; pełna tabliczka ≤ 100)

| Krok | Typy | Stan | Kandydat parametrów |
|---|---|---|---|
| E5.1 | ADD_SUB | G | `{ max: 100, shapes: ['DU+U','DU-U'], bridge: 'any' }` (53 + 7, 84 + 8, 53 − 7): 732, 0,5 % |
| E5.2 | ROMAN, ADD_SUB, WRITTEN | G, G, L | ROMAN `{ max: 12 }`: 48 poleceń; ADD_SUB `{ shapes: ['DU+DT','DU+DU','DU-DU'], bridge: 'none' }`: 819 |
| E5.3 | NUMBER_WORDS, CALENDAR, CLOCK_ELAPSED | G, G, L | NUMBER_WORDS `{ max: 100 }`: 198 poleceń |
| E5.4 | TEMPERATURE, MULT, DIV | L, G, G | MULT `{ maxProduct: 100, factors: [0,1,5,10], allowZeroOne: true }`: 43, udział ·0/·1 32,8 % (próg 35 % — blisko); DIV `{ maxDividend: 50 }`: 71 |
| E5.5 | CAPACITY, MASS | L, L | krok pusty |
| E5.6 | ADD_SUB (różnymi sposobami) | G | `{ max: 100, shapes: ['DU+DU','DU-DU'], bridge: 'ten' }`: 803; podpowiedź 47 + 28 → 47 + 20, 67 + 3, 70 + 5 |
| E5.7 | MASS, LENGTH, COMPARE_DIFF, UNIT_CHOICE | L, L, G, L | COMPARE_DIFF `{ max: 100 }`: 1000 |
| E5.8 | CLOCK_ELAPSED, MULT | L, G | MULT `{ maxProduct: 100, factors: [6,7,8,9] }`: 36 |
| E5.9 | DIV, FACT_FAMILY | G, N | DIV `{ maxDividend: 100 }`: 90; FACT_FAMILY z · i : („sprawdź dzielenie mnożeniem”) |
| E5.10 | WORD, PRICE, TIMES_MORE | G, L, L | WORD `{ max: 100, kinds: ['groups','share','each','sum','left'] }`: 871 |
| E5.11 | ORDER_OPS, CALENDAR | L, G+ (30/31 dni) | luty (28/29) wymaga decyzji: pominąć luty albo odpowiedź „28 albo 29” |
| E5.12 | LENGTH, PERIMETER | L, L | krok pusty |

#### E6 — klasa 3, II półrocze (do 1000 pełne; odczyt i porównanie do 1 000 000)

| Krok | Typy | Stan | Kandydat parametrów |
|---|---|---|---|
| E6.1 | TEMPERATURE, CALENDAR, TIME_UNITS | L, G+ (dekada, 365 dni), L | pula faktów jest mała — w jednej umiejętności łączyć z innymi wariantami (np. `quarter`, `monthDays`) |
| E6.2 | CLOCK_ELAPSED | L | krok pusty |
| E6.3 | MASS, LENGTH, PERIMETER | L ×3 | krok pusty |
| E6.4 | MULT, DIV | G, G | MULT `{ maxProduct: 100, maxFactor: 9, factors: [11..19] }` (6 · 12): 49, 0 naruszeń; DIV `{ maxDividend: 100, maxQuotient: 19, divisors: [2..9] }` (96 : 6): 128, 0 naruszeń (zawiera też ilorazy z tabliczki) |
| E6.5 | PLACE_VALUE, COMPLEMENT, MASS | L, G, L | `{ max: 1000, targets: [100, 1000] }`: 469, 0 naruszeń |
| E6.6 | ADD_SUB | G | `{ max: 1000, shapes: ['HTU+U','HT+DT','HTU-U','HT-DT'], bridge: 'any' }`: 935, 0 naruszeń; 450 − 70 dostaje jednolinijkową podpowiedź (przejście przez setkę nie jest rozbijane) |
| E6.7 | WRITTEN, FACT_FAMILY | L, N | FACT_FAMILY + / − do 1000 („sprawdzanie”) |
| E6.8 | ADD_SUB, MULT, DIV | G, G, G+ | ADD_SUB `{ shapes: ['H-HTU'] }` (500 − 284): 902; MULT `{ maxProduct: 1000, maxFactor: 9, factors: [10,…,90,100,…,500] }` (4 · 70, 3 · 200): 88, 0 naruszeń; DIV 800 : 4 — z `maxQuotient: 300` generator daje dowolne ilorazy (np. 548 : 4), więc potrzebna lista `quotients` |
| E6.9 | PLACE_VALUE, ROUNDING | L, G+ | `parseRoundingParams` rzuca dla `to: 100`; polecenie `pl.tasks.rounding` mówi tylko o „dziesiątce” |
| E6.10 | ROMAN, PLACE_VALUE, COMPARE_NUM | G, L, G+ | ROMAN `{ max: 2000 }`: 891 poleceń; COMPARE_NUM `{ max: 1000000 }` przechodzi niezmienniki mechanicznie, ale podpowiedź jest bezsensowna i liczby bez spacji tysięcy |
| E6.11 | MIX, LOGIC | L, L | krok pusty (MIX to wariant rundy, LOGIC to grupa 4) |

**Nowe wpisy `LATER`** w `tests/curriculum.test.ts` (typy z kroków nowych etapów, których nie ma ani w `GROUP_1`, ani w `LATER`): SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, COUNT, ORDINAL, INEQUALITY, MONEY_PAY, ARROW_TABLE, WRITTEN, CLOCK_ELAPSED, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, TIME_UNITS, MIX, LOGIC — 19 typów, zgodnie z listą w `change.md`. `GROUP_1` rośnie o 7 nowych typów. Nazwa bloku `describe('curriculum E3–E4')` przestaje być prawdziwa.

### 2. Projekt 7 nowych generatorów (wzorce z istniejących)

Wspólne wymagania (z `src/core/tasks/registry.ts` i archiwum `testing-content-invariants`): para `generateX` + `parseXParams` w `generators` i `parsers` (test „has a parser for every generator”); parser odrzuca parametry bez rozwiązań `TypeError`-em przy parsowaniu (wzorzec `shapeFeasible` w `parseAddSubParams`, `multFeasible` w `parseMultParams`, `MIN_MAX` w `parseWordParams`); teksty tylko w `src/data/pl.ts` (`pl.tasks`) lub `src/data/wordTemplates.ts`; operatory z `src/core/tasks/symbols.ts` (`MINUS` U+2212, `TIMES`, `DIVIDE`, `BOX`); każda linia podpowiedzi postaci `a op b = c` jest sprawdzana arytmetycznie, a ostatnia taka linia musi zawierać odpowiedź liczbową (`ARITHMETIC_LINE` w `tests/contentInvariants.test.ts`).

| Typ | Polecenie / odpowiedź | Parametry (propozycja) | Uwagi z pomiaru i kodu |
|---|---|---|---|
| BONDS | „Domek liczby 7: 7 = 3 + □” → 4 (klawiaturka); okienko lewe lub prawe | `totals: number[]` (np. `[2,3,4,5]`, `[6,7]`, `[10]`), `zero?: boolean` | Enumeracja: 10/11/9 par → 20/22/18 różnych poleceń; losować jednostajnie po parach (top 5 %), nie „n, potem a” (top 12,5 % dla totals 2–5). Podpowiedź `3 + 4 = 7` zawiera odpowiedź. Wariant „połącz pary dające 10” wymaga UI wyboru — poza M1 |
| CHAIN | „2 + 3 + 4” → 9 | `max`, `ops`, `terms: 3` | 729 zadań dla max 9 z + i −; każdy wynik pośredni w 0..max, składniki ≥ 1 — generator musi to pilnować sam, bo `BINARY_PROMPT` nie łapie trzech składników, więc niezmienniki „zero operand” i „degenerate” go nie obejmą. Podpowiedź: dwie linie `a op b = r1`, `r1 op c = r2` |
| MISSING_OP | „8 □ 2 = 6” → „−”, kafelki `[+, −]` | `max`, `ops` | 110 zadań dla max 10, b ≥ 1. Z · i : (od E3 wg §4; w S-03 żaden krok tego nie wymaga) 12 par do 10 jest niejednoznacznych (2 □ 2 = 4: + i ·; 4 □ 2 = 2: − i :) — parser/generator musi odrzucać, jeśli kiedyś dojdą · i : |
| COMPARE_EXPR | „3 + 4 □ 9 − 1” → „<”, kafelki `SIGNS` (z `compareNum.ts`) | `max`, `ops` | 100 wyrażeń ≤ 10, 10 000 par; naturalny udział „=” 9,1 % — wymusić ~1/6 jak `generateCompareNum`. Podpowiedź: `3 + 4 = 7`, `9 − 1 = 8`, `7 < 8` |
| SEQUENCE | „10, 20, □, 40” → 30 | `max`, `step` (lista), `length`, `from` (pełne wielokrotności kroku czy dowolny start), kierunek | Dziesiątki 0–100, długość 4, jedna luka, w górę/w dół: 64 zadania (start na pełnej dziesiątce) albo 560 (dowolny start). Przecinek przed liczbą ujemną byłby wykryty przez `NEGATIVE_NUMBER` w `validate.ts` — przy krokach malejących sprawdzać dolną granicę |
| FACT_FAMILY | warianty: przemienność („4 + 7 = 7 + □”), sprawdzanie („12 − 5 = 7. Sprawdź: 7 + 5 = □”), dzielenie mnożeniem | `max` (lub `maxProduct`), `ops`, `variants` | E2.4 180, E2.6 190 zadań; dla E5.9 granica z `maxDividend`/`maxProduct` — `boundOf` w `src/core/tasks/bounds.ts` czyta `max ?? maxProduct ?? maxDividend`. Unikać wzorca F14 (podpowiedź zdradzająca wynik w pierwszym kroku) tam, gdzie tanio |
| CHOOSE_OP | treść zadania z `templates` (`sum`, `left`, `start`, `moreBy`) + „Które działanie pasuje?” → kafelek „5 + 3” spośród 3 działań | `max`, `kinds` | Odpowiedź = lewa strona pierwszej linii podpowiedzi szablonu (`${a} + ${b}`), rozpraszacze: druga operacja i działanie z inną liczbą; bez rozpraszaczy ujemnych typu „3 − 5”. Odpowiedź tekstowa, więc `validateTask` sprawdza tylko obecność w `choices` i duplikaty. „Z obrazkiem” (§3 E1.3) — obrazek to M6 |

### 3. Rozszerzenia istniejących generatorów

1. **ADD_SUB — `n − n` w trybie bez kształtów (konieczne).** `drawFree` w `src/core/tasks/generators/addSub.ts` losuje `a = int(1, max)`, potem `b = int(1, a)`, więc P(b = a) = średnia 1/a; zmierzone: max 5 → 21,2 %, max 9 → 14,6 %, max 10 → 13,4 % udziału `a − a` wśród działań (`MAX_DEGENERATE_SHARE = 0.1`). Z kształtami: `DT-DT` do 100 → 10,1 %. To ten sam problem, który DIV rozwiązał stałą `ONE_SHARE` w `drawQuotient` (`src/core/tasks/generators/div.ts`). Rekomendacja: `a − a` z małym udziałem (np. jak `ONE_SHARE`), poza tym `b` z 1..a−1; dla trybu bez kształtów rozważyć losowanie jednostajne po parach dopuszczalnych (druga część F12: skośność — przy max 5 i samym „+” najczęstsze zadanie ma 25,5 %, `4 + 1`). Zmiana wpływa na losowania istniejącego `E3.2.add_sub_20_bridge` (bridge `'ten'` i tak wyklucza `a − a`), więc niezmienniki E3 zostają, ale wydruk `sample` E3 może się zmienić.
2. **F12 — `addSubHint` dla `DT−U` (w zakresie).** Dla `70 − 9`: `crossesTen(70, 9, '-')` jest fałszem (jedności odjemnej = 0), więc podpowiedź to jedna linia `70 − 9 = 61` (zmierzone na `E4.4.sub_from_full_ten`: „50 − 9 = 41”). Follow-up proponuje `70 − 10 = 60`, `60 + 1 = 61` — ostatnia linia zawiera odpowiedź, więc niezmiennik „last hint” przejdzie. Dotyczy E4.4 i nowych `20 − 7` w E1/E2 przy losowaniu bez kształtów. Przejście przez setkę (450 − 70 w E6.6) to inny przypadek — nie jest w F12; zostaje jednolinijkowe (poprawne).
3. **CALENDAR — nowe warianty (konieczne).** `CalendarVariant` w `src/core/tasks/generators/calendar.ts` ma 4 warianty miesięcy. Potrzebne: dzień tygodnia po/przed (E1.4; 14 poleceń, `weekdays` w `src/data/calendar.ts` nie ma przypadków dla „po środzie”, „przed niedzielą” — dane muszą dostać miejscownik/narzędnik jak `Month`), dni w miesiącu (E5.11; `Month` nie ma liczby dni), dekada/rok/365 dni (E6.1; mała pula faktów). CALENDAR jest w `UNBOUNDED_TYPES`, więc 365 nie złamie granicy liczb.
4. **ROUNDING `to: 100 | 1000` (konieczne).** `parseRoundingParams` przyjmuje tylko `to: 10`; `generateRounding` losuje z `11..max−1` i pomija końcówki 5. Dla setek/tysięcy: pomijać `n % to === to/2` i pełne wielokrotności, nowe polecenia w `pl.tasks` („Która pełna setka…”, „Który pełny tysiąc…” — rodzaj męski), `max` do 10 000.
5. **DIV — lista ilorazów (konieczne dla E6.8).** `DivParams` ma `maxDividend`, `maxQuotient`, `divisors`; 800 : 4 i 360 : 4 wymagają ilorazów będących pełnymi dziesiątkami/setkami. Propozycja `quotients?: number[]` z kontrolą wykonalności w `parseDivParams` (istnieje d · q ≤ maxDividend). To samo pozwala zawęzić E6.4 do 96 : 6 (`quotients: [11..19]`).
6. **COMPARE_NUM dla liczb ≥ 1000 (konieczne dla E6.10).** `describe` w `src/core/tasks/generators/compareNum.ts` liczy tylko dziesiątki i jedności. Dla dużych liczb podpowiedź według liczby cyfr / najwyższego różniącego się rzędu (§4: „więcej cyfr = większa”), a losowanie powinno czasem dawać różną liczbę cyfr (dziś przy `max: 1000000` obie liczby są prawie zawsze sześciocyfrowe).
7. **Format liczb ≥ 10 000 (konieczne dla E6.9 i E6.10).** Dziś generatory piszą `${n}`. Polska norma: liczby czterocyfrowe bez spacji, od pięciu cyfr grupy po trzy ze spacją (tak pisze sam katalog: „1000”, „10 000”, „1 000 000”). Skutki dla testów: `ARITHMETIC_LINE` i `BINARY_PROMPT` (`\d+`) nie dopasują „10 000”, więc arytmetyka takiej podpowiedzi przestaje być sprawdzana po cichu; skan granicy `text.match(/\d+/g)` rozbije „10 000” na 10 i 000 (przejdzie, ale bez sensu); `NUMBER_WORD` w `validate.ts` (`(\d+)\s+(\p{L}+)`) przy rzeczowniku po „10 001” sprawdzi „001”. Rekomendacja: `formatNumber` w `src/core/text/` (twarda spacja U+00A0 od 10 000) i jeden wspólny wzorzec liczby (`\d{1,3}(?: \d{3})+|\d+`) w niezmiennikach. Format nie dotyka E1–E5 (liczby ≤ 1000).
8. **Opcjonalne:** COMPARE_NUM `step: 10` (E2.7 „porównywanie dziesiątek”); EVEN_ODD `min: 0` (E1.6 „Zero…”; 0..10 daje 11 różnych — nadal < 12); `multHint` dla czynnika będącego wielokrotnością 10/100 (dziś „5 · 90” → „5 · 45 = 225, 225 + 225 = 450” — poprawne, ale nieszkolne).

### 4. Przestrzenie E1 wobec niezmienników — pomiar i rekomendacja

Metoda (jak `context/archive/2026-10-12-testing-content-invariants/research.md`): 1000 losowań na umiejętność, seedy `910_000 + i`, klucz różnorodności = polecenie + kafelki (`seen` w `tests/contentInvariants.test.ts`), dodatkowo policzone samo polecenie. Skrypt tymczasowy w `$TMPDIR/s03m/` (nie w repo); typy bez generatora — enumeracja przestrzeni prototypowego projektu.

| Umiejętność (kandydat) | różnych (pol.+kaf.) | top | tylko polecenie | werdykt |
|---|---|---|---|---|
| E1.7 COMPLEMENT `targets [10]` | 9 | 12,8 % | 9 | ✗ `MIN_DISTINCT` — przestrzeń ma dokładnie 9 zadań (n = 1..9) |
| E1.6 EVEN_ODD `single`, max 10 | 10 | 11,0 % | 10 | ✗ `MIN_DISTINCT` (z zerem: 11) |
| E1.6 EVEN_ODD `single`, max 12 | 12 | 9,7 % | 12 | ✓ na progu, ale 11–12 są dopiero w E1.10 |
| E1.6 EVEN_ODD `select`, max 10 | 996 | 0,2 % | 1 | ✓ (różnorodność z kafelków) |
| E1.3 ADD_SUB max 5 (+, −) | 25 | 13,2 % | 25 | ✓ różnorodność, ✗ n − n 21,2 % |
| E1.2 COMPARE_NUM max 5 | 25 | 7,2 % | 25 | ✓ |
| E1.3 MISSING max 5 | 60 | 5,5 % | 60 | ✓ |
| E1.4 / E1.11 CALENDAR miesiące | 944 | 0,3 % | 24 | ✓ |
| E1.4 CALENDAR dni tygodnia (enum.) | — | — | 14 | ✓ tylko dzięki kafelkom; polecenia 14 |
| BONDS 2–5 / 6–7 / 10 (enum.) | — | 5,0 / 4,5 / 5,6 % | 20 / 22 / 18 | ✓ przy losowaniu po parach |

Rekomendacja dla rzeczywiście małych przestrzeni:
1. Nie obniżać `MIN_DISTINCT`/`MAX_TOP_SHARE` globalnie — chronią pozostałe 50+ umiejętności.
2. Najpierw dane wierne krokowi: nie poszerzać COMPLEMENT na cele 5–10 ani EVEN_ODD na 11–12 tylko po to, żeby przejść próg (E1.7 to „dopełnianie do 10”, liczby 11–12 wchodzą w E1.10).
3. Wyjątek per id umiejętności w `tests/contentInvariants.test.ts` (mapa `id → { minDistinct, measured }`), z komentarzem podającym zmierzoną wartość („9 różnych / 1000 losowań, top 12,8 %: dopełnienie do 10 ma dokładnie 9 zadań”). Test dalej sprawdza `MAX_TOP_SHARE` i wszystkie pozostałe reguły; wyjątek obejmuje tylko `MIN_DISTINCT` i tylko nazwane id. To spełnia regułę S-03 („obniżenie … z komentarzem i zmierzoną wartością, nigdy ciche pominięcie”).
4. Uwaga do metryki: klucz „polecenie + kafelki” zawyża różnorodność zadań z kafelkami (EVEN_ODD `select`: 1 polecenie, 996 kluczy; CALENDAR dni tygodnia: 14 poleceń). Planu to nie blokuje, ale wyjątek z pkt 3 powinien zapisywać też liczbę samych poleceń.

### 5. Testy, sample, bramka

- `stages` w `src/data/curriculum/index.ts` ma E3, E4; dopisanie E1, E2, E5, E6 automatycznie włącza je do `tests/contentInvariants.test.ts` i `tests/curriculum.test.ts` (obie iterują po `Object.values(stages)`).
- `tests/curriculum.test.ts` liczy granicę jako `params.max`, a `tests/contentInvariants.test.ts` przez `boundOf` — nowe generatory z `maxProduct`/`maxDividend` (FACT_FAMILY z mnożeniem) są sprawdzane pełniej w niezmiennikach.
- `npm run sample -- <etap>` jest w `.github/workflows/ci.yml` (job `check`, tylko E3 i E4) i w `GATE_UNIT` w `context/foundation/autonomous-run.env` oraz profilu §2; `.github/workflows/deploy.yml` nie uruchamia `sample` (grep). Faza danych musi dopisać E1, E2, E5, E6 w tych trzech miejscach (agent-contract, reguły S-03).
- Odpowiedź E1 „3–4 kafelki” (§4 ADD_SUB: „klawiaturka (od E2) lub 3–4 kafelki (E1)”): ADD_SUB, BONDS, CHAIN itd. dziś nie zwracają `choices`. Ekran (S-04) jeszcze nie istnieje; w M1 wystarczy `answer: 'keypad'` (odpowiedzi ≤ 12 mieszczą się na klawiaturce 0–9 z „OK”), a kafelki dla E1 jako follow-up z `Trigger: S-04`. Dodanie kafelków teraz dodatkowo zawyżyłoby metrykę różnorodności (pkt 4.4).

### 6. Phase split (rekomendacja dla `/10x-plan`)

Ograniczenie kolejności: `tests/curriculum.test.ts` odrzuca krok, którego typ nie jest ani w `GROUP_1`, ani w `LATER`, a typ z `GROUP_1` bez umiejętności — więc plik etapu można dodać dopiero, gdy wszystkie jego typy grupy 1 mają generator. Fazy generatorów testują się własnymi plikami `tests/<typ>.test.ts` (wzorzec `forEachDraw` w `tests/helpers.ts`, umiejętności zdefiniowane w teście), bez danych etapu.

| Faza | Zakres | Nowe generatory | Driver | Pierwszy czerwony test |
|---|---|---|---|---|
| 1 | ADD_SUB: rzadkie `n − n` w trybie bez kształtów i dla `DT-DT`; F12 (`addSubHint` dla `DT−U`); BONDS; CHAIN | 2 | tdd | udział `a − a` ≤ 10 % dla `{ max: 5 }`; `addSubHint(70, 9, '-')` = `['70 − 10 = 60', '60 + 1 = 61']`; parser BONDS odrzuca `totals` bez par |
| 2 | MISSING_OP, COMPARE_EXPR (kafelki ze znakami) | 2 | tdd | jednoznaczność znaku, udział „=” |
| 3 | SEQUENCE, CHOOSE_OP (na `templates` z `wordTemplates.ts`) | 2 | tdd | brak ujemnych w ciągu malejącym; odpowiedź CHOOSE_OP wśród `choices` i zgodna z treścią |
| 4 | FACT_FAMILY; CALENDAR (dni tygodnia, 30/31, dekada/rok) + dane `calendar.ts` | 1 (+ rozszerzenie) | tdd | podpowiedź FACT_FAMILY nie zdradza wyniku w 1. kroku; „po niedzieli” → poniedziałek |
| 5 | E1 + E2: `src/data/curriculum/E1.ts`, `E2.ts`, `index.ts`; `GROUP_1` + 7, `LATER` + 19; wyjątki małych przestrzeni (E1.7 COMPLEMENT, E1.6 EVEN_ODD) z pomiarem; `sample -- E1/E2` w `ci.yml`, profilu §2 i `GATE_UNIT` | 0 | impl | — (dane; zielone `npm test` + `sample`) |
| 6 | Duże liczby: `formatNumber` + wzorzec liczby w niezmiennikach; ROUNDING `to: 100/1000`; DIV `quotients`; COMPARE_NUM ≥ 1000 | 0 (4 rozszerzenia) | tdd | `parseRoundingParams({ max: 10000, to: 100 })` nie rzuca; podpowiedź COMPARE_NUM dla 1 000 000 bez „dziesiątek” |
| 7 | E5 + E6: `E5.ts`, `E6.ts`, `index.ts`; `sample -- E5/E6` w `ci.yml`, profilu §2 i `GATE_UNIT` | 0 | impl | — |

Uzasadnienie braku podziału slice'u mimo 7 faz (decyzja 2 w `change.md` mówiła o splicie powyżej ~6): każda faza ma ≤ 2 nowe generatory i jest zielona sama; podział na dwa slice'y nie zmniejszyłby pracy, a S-03 zamyka M1 („sample dla każdego etapu”, PRD FR-004, roadmapa S-03). Alternatywa, jeśli plan chce 6 faz: scalić fazy 6 i 7 (rozszerzenia E5–E6 + dane) — większa faza, mniej punktów kontrolnych.

## Code References

- `src/core/tasks/registry.ts` — `generators`, `parsers` (14 typów), `getGenerator`, `getParser`
- `src/core/tasks/generators/addSub.ts` — `drawFree` (źródło `n − n`), `addSubHint`, `crossesTen` (F12), `shapeFeasible` (wzorzec wykonalności)
- `src/core/tasks/generators/div.ts` — `ONE_SHARE`, `drawQuotient` (wzorzec rzadkiego przypadku zdegenerowanego), `DivParams`
- `src/core/tasks/generators/mult.ts` — `MultParams.factors`, `multFeasible`, `multHint`
- `src/core/tasks/generators/rounding.ts` — `parseRoundingParams` (`to` tylko 10)
- `src/core/tasks/generators/calendar.ts` — `CalendarVariant`, `generateCalendar`
- `src/core/tasks/generators/compareNum.ts` — `describe`, `SIGNS`
- `src/core/tasks/generators/complement.ts` — `parseComplementParams` (`targets`)
- `src/core/tasks/generators/evenOdd.ts` — `generateEvenOdd` (losuje 1..max)
- `src/core/tasks/generators/word.ts` — `drawNumbers`, `MIN_MAX`, `pickTwoPeople`; `src/data/wordTemplates.ts` — `templates`, `contexts`, `compareTemplates`
- `src/core/tasks/bounds.ts` — `boundOf`, `UNBOUNDED_TYPES`
- `src/core/tasks/validate.ts` — `NEGATIVE_NUMBER`, `NUMBER_WORD`, `validateTask`
- `src/core/tasks/shapes.ts` — `ShapeToken` (U, DU, DT, H, HT, HTU)
- `src/data/calendar.ts` — `months`, `quarters`, `weekdays` (bez przypadków)
- `src/data/curriculum/index.ts` — `stages` (E3, E4)
- `tests/contentInvariants.test.ts` — `MIN_DISTINCT`, `MAX_TOP_SHARE`, `MAX_DEGENERATE_SHARE`, `MAX_ZERO_ONE_SHARE`, `ARITHMETIC_LINE`, `BINARY_PROMPT`
- `tests/curriculum.test.ts` — `GROUP_1`, `LATER`
- `tests/helpers.ts` — `forEachDraw`, `skillsOfType`
- `scripts/sample.ts` — wydruk i raport naruszeń
- `.github/workflows/ci.yml` — job `check`, `npm run sample -- E3/E4`; `context/foundation/autonomous-run.env` — `GATE_UNIT`

## Architecture Insights

- „Wspólne generatory” (PRD FR-004) = jeden generator na typ, parametryzowany danymi etapu; wszystkie E5–E6 mieszczą się w istniejących generatorach plus 6 rozszerzeń parametrów, bez nowych typów poza 7 z grupy 1.
- Przypadki zdegenerowane rozwiązuje generator (wzorzec `ONE_SHARE`), nie próg; małą przestrzeń — jawny, nazwany wyjątek z pomiarem.
- Typy tekstowe z odpowiedzią-napisem (MISSING_OP, COMPARE_EXPR, CHOOSE_OP) mają w walidatorze tylko kontrolę kafelków; ich poprawność musi pilnować test typu (jednoznaczność znaku, zgodność działania z treścią).
- Kierunek zależności `core → data` (generatory importują `pl`, `nouns`, `wordTemplates`, `calendar`) obowiązuje także nowe generatory; teksty nie trafiają do `core/`.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-generators-e3-e4/research.md` — Open Question 1 odsunęła 7 typów do S-03 („ich kroki leżą w E1–E2 … lub E5+”): potwierdzone dla 6 z 7; COMPARE_EXPR ma krok tylko w E1.7 (§4 wspomina E5, ale żaden krok E5 go nie wymienia) — częściowo.
- `context/archive/2026-10-12-testing-content-invariants/research.md` — progi (≥ 12, ≤ 15 %, ≤ 10 % zdegenerowanych) zmierzone na E3–E4 i wprost przewidziane do korekty „z komentarzem, gdy nowy etap ma mniejszą przestrzeń” (komentarz w `tests/contentInvariants.test.ts`); wzorzec `ONE_SHARE` dla DIV — przenosi się na ADD_SUB.
- `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` — F12 (DT−U, skośność) wskazany na S-17 „albo razem z danymi E5–E6 (S-03)”: pomiar pokazuje, że skośność trybu bez kształtów łamie niezmiennik w E1 — wchodzi do S-03; F14 (podpowiedź MISSING zdradza wynik) zostaje na S-04.

## Related Research

- `context/archive/2026-10-12-generators-e3-e4/research.md`
- `context/archive/2026-10-12-testing-content-invariants/research.md`

## Open Questions

1. Luty w wariancie „ile dni ma miesiąc” (E5.11): pominąć luty czy przyjąć odpowiedź „28 albo 29”? Rekomendacja: pominąć w M1 (bez `check` dla wielu odpowiedzi), zapis w follow-upach.
2. EVEN_ODD E1.6 z zerem (`min: 0`)? Rekomendacja: tak, jeśli tanie (krok uczy zera), wyjątek `MIN_DISTINCT` z pomiarem 11 zamiast 10.
3. Kafelki dla E1 (§4 ADD_SUB) — rekomendacja: `keypad` w M1, follow-up `Trigger: S-04`.
4. Brak rozstrzygnięcia w katalogu dla zaokrąglania liczby kończącej się na 5/50/500 (`generateRounding` je pomija) — bez zmian.
