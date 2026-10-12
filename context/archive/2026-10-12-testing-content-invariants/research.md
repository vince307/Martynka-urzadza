---
date: 2026-10-12T21:30:00+02:00
researcher: Claude (orkiestrator, sesja 2026-10-12)
git_commit: 3048319
branch: m1/testing-content-invariants
repository: Martynka-urzadza
topic: "Etap 3 planu testów (niezmienniki treści): co mierzalnie odróżnia dobre dane etapu od złych, jakie progi wynikają z pomiaru na E3–E4, gdzie wykrywać niewykonalne parametry, jak wygląda lista odczytu nauczyciela"
tags: [research, content, generators, property-tests, curriculum, test-plan]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (orkiestrator)
---

# Research: testing-content-invariants

**Date**: 2026-10-12T21:30:00+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-12)
**Git Commit**: 3048319
**Branch**: m1/testing-content-invariants
**Repository**: Martynka-urzadza

## Research Question

Ground rollout Phase 3 of `context/foundation/test-plan.md` („Content invariants”). Ryzyka #1 (błędna treść niewidoczna dla walidatora) i #5 (dane etapu bez rozwiązań, pusty krok, zdegenerowane zadania). Pytania: (1) które własności zadań da się sprawdzić generycznie dla każdej umiejętności bez wiedzy o typie; (2) jakie progi (różnorodność, udział zadań trywialnych) wynikają z pomiaru na obecnych 29 umiejętnościach E3–E4; (3) jak odrzucać niewykonalne parametry przy parsowaniu zamiast po 1000 nieudanych losowaniach; (4) jak zapisać listę odczytu nauczyciela, żeby była stosowana przy każdym PR z treścią.

## Summary

- Pomiar (1000 losowań, seedy 5000+i, stan `3048319`) dla 29 umiejętności: generowanie trwa 1–6 ms na 1000 zadań; liczba różnych poleceń od 1 (`E3.7.select_even_30`: stałe polecenie, zmienne kafelki) i 15 (`E3.10.half_30`) do 1000 (`compare_diff_20`); najczęstsze polecenie ma udział ≤ 8,4 % (`half_30` 84/1000, `mult_5_10` 73, `div_5_10` 68) poza stałym poleceniem select_even (100 %). Wniosek: różnorodność trzeba liczyć po parze polecenie + kafelki; próg ≥ 12 różnych zadań i udział najczęstszego ≤ 15 % trzyma wszystkie obecne umiejętności z zapasem.
- „Trywialna podpowiedź” (jedna linia równa poleceniu z wynikiem) to norma dla działań bez przekroczenia: 100 % w `E4.2.add_sub_100_units`, `E4.4.sub_from_full_ten`, `E4.6.mult_5_10`, `E4.8.add_sub_1000_hundreds`; 45–63 % w E3.6/E3.8/E3.9/E4.5/E4.6. To nie jest błąd (jednokrokowe działanie ma jednokrokową podpowiedź), więc niezmiennik dotyczy poprawności arytmetyki każdej linii `a op b = c` i tego, że ostatnia linia kończy się odpowiedzią, nie liczby kroków. Rozbicie dla `DT−U` (70 − 9) zostaje follow-upem treściowym (F12 z S-02), nie testem.
- Zadania z równymi składnikami: `n : n = 1` stanowi 17 % w `E3.10.div_30` i 12 % w `E4.6.div_50` (iloraz 1 losowany jednostajnie z 1…10), `E4.6.div_5_10` 9 %; `a − a = 0` / `a + a` w ADD_SUB 4–6 %; kwadraty w MULT 8–11 %. Wniosek: niezmiennik „zdegenerowane ≤ 10 %” dla ilorazu 1 wymaga zmiany DIV (iloraz 1 rzadko, np. 1 na 10), reszta mieści się bez zmian.
- Wykonalność: `parseAddSubParams` nie wykrywa kombinacji kształt + `bridge` + `max` bez rozwiązań (F11 z S-02); przestrzenie kształtów są małe (`DU×DU` 8100 par, `HTU×DT` 8100, `HT+H` 801), więc enumeracja istnienia pary spełniającej `bridge` i `max` przy parsowaniu kosztuje mikrosekundy i daje `TypeError` z nazwą kształtu. Dla trybu bez kształtów wystarczają obecne reguły (`'ten'` → `max ≥ 11`). MISSING dziedziczy po ADD_SUB (operandy od 1/2) i zawsze ma rozwiązania dla `max ≥ 11` przy `'ten'`, `max ≥ 4` dla `·`/`:`; MULT z `factors` i `maxProduct` może nie mieć rozwiązań (np. `factors [10]`, `maxProduct 9`, `allowZeroOne false`) — sprawdzenie: `min(factors) · 2 ≤ maxProduct` lub zero/jeden dozwolone; DIV: `min(divisors) ≤ maxDividend`; WORD: `kinds` wymagają `max ≥` minimum na rodzaj (np. `twoSteps` ≥ 3, `groups/share/each` ≥ 4, `age` ≥ 6).
- Zakres liczb: walidator sprawdza tylko odpowiedź; liczby w poleceniu i podpowiedziach mogą przekroczyć zakres etapu bez naruszenia (np. w podpowiedzi `22 − 10 = 12` liczby są w zakresie, ale generyczny test powinien pilnować, że każda liczba w poleceniu i podpowiedziach ≤ granica umiejętności, z wyjątkiem typów bez granicy liczbowej: CALENDAR, ROMAN (daty, godziny), NUMBER_WORDS `kind: hundreds`). Granica z parametrów: `max`, `maxProduct`, `maxDividend` (jak w `sample`).
- Parsery parametrów istnieją per typ (`parse<Type>Params`), ale nie ma rejestru; test „każda umiejętność w danych parsuje się” wymaga mapy `type → parser` obok `generators` (lub eksportu `parseParams` z każdego generatora i rejestracji w `registry.ts`).
- Lista odczytu nauczyciela: dziś w `test-plan.md` §6.2 (tymczasowo) i w pamięci sesji; PR z treścią nie ma listy kontrolnej. `.github/pull_request_template.md` jest czytany przez GitHub przy każdym PR (także tworzonym przez `gh pr create --body-file`? nie: `--body-file` nadpisuje szablon; szablon działa dla PR tworzonych w UI i dla `gh pr create` bez `--body`). Dla agenta lista musi więc być też w CLAUDE.md/AGENTS.md (reguła pracy), a szablon PR zostaje dla właściciela.

## Detailed Findings

### 1. Pomiar różnorodności i trywialności (1000 losowań per umiejętność)

| Umiejętność | różnych poleceń | najczęstsze | podpowiedź 1-liniowa | równe składniki |
|---|---|---|---|---|
| E3.1.word_20 / compare_diff_20 | 979 / 1000 | 3 / 1 | 0 | 0 |
| E3.2.add_sub_20_bridge / missing_20 | 72 / 213 | 31 / 12 | 0 | 64 / 0 |
| E3.6.add_sub_30_nobridge | 408 | 7 | 601 | 46 |
| E3.7.even_odd_30 / select_even_30 / number_words_30 | 30 / 1 / 60 | 44 / 1000 / 29 | 0 | 0 |
| E3.8.add_sub_30_bridge | 481 | 7 | 453 | 43 |
| E3.9.mult_30 / word_groups_30 | 81 / 120 | 25 / 18 | 631 / 0 | 83 / 0 |
| E3.10.div_30 / half_30 / word_share_30 | 51 / 15 / 237 | 34 / 84 / 10 | 0 | 174 / 0 / 0 |
| E3.11.roman_12 / calendar | 48 / 216 | 55 / 29 | 0 | 0 |
| E4.1.compare_num_100 | 897 | 5 | 0 | 0 |
| E4.2.add_sub_100_units | 515 | 13 | 1000 | 0 |
| E4.4.complement_next_ten / sub_from_full_ten / add_sub_100_bridge / rounding_ten | 90 / 81 / 479 / 72 | 18 / 20 / 7 / 23 | 0 / 1000 / 0 / 0 | 0 |
| E4.5.add_sub_100_tens | 818 | 5 | 592 | 13 |
| E4.6.mult_50 / mult_5_10 / div_50 / div_5_10 / missing_mult_div_50 | 62 / 18 / 71 / 20 / 341 | 26 / 73 / 23 / 68 / 11 | 457 / 1000 / 0 / 0 / 0 | 102 / 113 / 120 / 94 / 0 |
| E4.8.add_sub_1000_hundreds | 856 | 4 | 1000 | 3 |

`E3.2.add_sub_20_bridge`: 72 różnych poleceń przy 1000 losowań (przestrzeń działań z przekroczeniem do 20 jest mała); najczęstsze 3,1 %.

### 2. Co da się sprawdzić generycznie

1. `validateTask(task, { max, nouns })` bez naruszeń (już w `curriculum.test.ts`, 200 losowań).
2. Arytmetyka podpowiedzi: każda linia pasująca do `^(\d+) ([+−·:]) (\d+) = (\d+)$` jest prawdziwa; gdy odpowiedź jest liczbą, a ostatnia linia podpowiedzi to taka równość, kończy się odpowiedzią. Typy tekstowe (CALENDAR, NUMBER_WORDS, ROMAN z sumą) mają linie innego kształtu — pomijane przez regex; ROMAN „razem 5 + 1 + 1 = 7” sprawdza osobny test.
3. Granica liczb w poleceniu i podpowiedziach (bez typów wyłączonych).
4. Różnorodność: ≥ 12 różnych par (polecenie, kafelki) na 1000 losowań i udział najczęstszej ≤ 15 %.
5. Zdegenerowane: udział `n op n` dla `:` ≤ 10 %, dla `−` ≤ 10 %; brak składnika 0 w `+`/`−`; dla `·` zero/jeden tylko gdy `allowZeroOne`.
6. Parsowanie: każda umiejętność przechodzi parser swojego typu (rejestr parserów), a parsery odrzucają niewykonalne kombinacje (ADD_SUB enumeracja, MULT/DIV/WORD minima).

### 3. Lista odczytu nauczyciela (treść)

Dla każdego nowego szablonu lub typu: (a) `npm run sample -- <etap> --count 6` i odczyt wszystkich zadań kroku; (b) liczba i rzeczownik: 1/2–4/5+ i biernik po czasowniku („ma 1 naklejkę”); (c) rodzaj czasownika zgodny z imieniem; (d) sens kontekstu (ciastka na talerzu, nie poduszki); (e) podpowiedź uczy metody ze szkoły (do dziesiątki, podwajanie), nie powtarza wyniku, nie zdradza go w pierwszym kroku, gdy to okienko; (f) rozpraszacze bliskie, ale jednoznaczne; (g) każdy nowy rzeczownik w `data/nouns.ts` z trzema formami i biernikiem w kontekście; (h) polecenie mieści się w 1–3 zdaniach dla E3+.

## Code References

- `src/core/tasks/generators/addSub.ts` (`parseAddSubParams`, `drawShaped`, `bridgeMatches`), `div.ts:31-33` (iloraz 1…maxQuotient), `mult.ts:35-46`
- `src/core/tasks/registry.ts` (tylko generatory), `tests/curriculum.test.ts` (200 losowań, typy grupy 1 i późniejsze)
- `scripts/sample.ts:63-66` (granica z `max`/`maxProduct`/`maxDividend`)
- `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` (F11 wykonalność, F12 podpowiedź DT−U, F14 pierwsza podpowiedź okienka)

## Architecture Insights

- Jeden generyczny test własności nad `stages` (jak `curriculum.test.ts`) plus rejestr parserów trzyma reguły w jednym miejscu; typy spoza grupy 1 (M6) dołączą automatycznie, gdy dostaną generator.
- Wyłączenia (typy bez granicy liczbowej, typy ze stałym poleceniem) jako jawna lista w teście, żeby nowy typ musiał świadomie się wpisać.

## Historical Context (from prior changes)

- S-02: przegląd treści wykrył biernik i podpowiedź IX; `curriculum.test.ts` jako zalążek testu programu; follow-upy F11/F12/F14.

## Related Research

- `context/archive/2026-10-12-generators-e3-e4/research.md`.

## Open Questions

1. Udział ilorazu 1 w DIV: zmienić generator (iloraz 1 rzadko), czy tylko mierzyć? Propozycja: zmienić (1 na 10) i mierzyć (próg 10 %).
2. Czy rozbicie podpowiedzi dla `DT−U` (F12) wchodzi tu jako treść? Propozycja: nie (etap testów), zostaje w follow-upach S-03.
