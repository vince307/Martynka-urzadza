---
date: 2026-10-12T14:20:00+02:00
researcher: Claude (orkiestrator, sesja 2026-10-12)
git_commit: 2c00a2f
branch: main
repository: Martynka-urzadza
topic: "S-02 generators-e3-e4: które typy zadań i parametry wynikają z kroków E3–E4 w ZADANIA.md, jak wyglądają polecenia, podpowiedzi, rozpraszacze i odmiana, co daje harness F-03"
tags: [research, generators, curriculum, E3, E4, word-problems, M1]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (orkiestrator)
---

# Research: S-02 generators-e3-e4

**Date**: 2026-10-12T14:20:00+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-12)
**Git Commit**: 2c00a2f
**Branch**: main
**Repository**: Martynka-urzadza

## Research Question

Roadmapa S-02 (etap M1): autor wypisuje z każdego kroku E3 i E4 oryginalne zadania typów grupy 1 (ZADANIA §7) z poprawną odpowiedzią, rozpraszaczami, podpowiedzią krok po kroku i poprawną odmianą; testy 1000 losowań przechodzą. Pytania: (1) które typy i z jakimi parametrami wynikają z kroków E3–E4; (2) jak zapisać polecenia słowne, konteksty i imiona (dane w `data/`); (3) jak harness F-03 obsługuje typy z kafelkami (`choices`), `check` i teksty; (4) co z `shape` i skośnością losowania (follow-up F-03).

## Summary

- Kroki E3 (11) i E4 (8) wymieniają typy: E3 — WORD, COMPARE_DIFF, ADD_SUB, MISSING, CLOCK, MASS, DATA, PUZZLE_GRID, LENGTH, PLACE_VALUE, GRID, EVEN_ODD, NUMBER_WORDS, MULT_GROUPS, MULT, DIV, HALF, ROMAN, CALENDAR, TEMPERATURE; E4 — PLACE_VALUE, COMPARE_NUM, MONEY_COUNT, MONEY_CHANGE, MASS, ADD_SUB, CLOCK, COMPLEMENT, ROUNDING, MULT, DIV, MISSING, CAPACITY, LENGTH, PERIMETER (`docs/ZADANIA.md:104-126`). Z grupy 1 (§7, tylko tekst i kafelki) występują tu: ADD_SUB, MISSING, COMPLEMENT, COMPARE_NUM, EVEN_ODD, MULT, DIV, WORD, NUMBER_WORDS, ROMAN, CALENDAR (11). Dodatkowo kroki wymieniają trzy typy tekstowe spoza listy §7: COMPARE_DIFF (§4 „Zadania tekstowe”, od E3), HALF (§4, E3), ROUNDING (§4, od E4). Siedem typów grupy 1 nie ma kroku w E3–E4 (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP): ich kroki leżą w E1–E2 (BONDS do 20, CHAIN, CHOOSE_OP) lub E5+ (COMPARE_EXPR z iloczynami), więc naturalnie należą do S-03.
- Zakresy (§2): E3 liczby do 30, + i − ≤ 30 z przekroczeniem, · i : ≤ 30 z ·0/·1 i połową, rzymskie I–XII, kwartały, daty z rzymskim miesiącem; E4 do 100 (+ i − z przekroczeniem przy jedności, dwie dwucyfrowe bez przekroczenia, setki 530 + 400), · ≤ 50 oraz ·5/·10 do 100, dopełnianie do pełnej dziesiątki, zaokrąglanie do dziesiątki.
- Zasady prezentacji (§1): E3–E6 więcej tekstu, zadania tekstowe 1–3 zdania; konteksty ze świata gry (pokoje, meble, ciastka w kawiarni, kwiaty, pieniądze na remont); imiona z puli neutralnych imion; odpowiedź dotykiem: 3–4 kafelki lub klawiaturka. WORD (§4): szablony razem/zostało/ile było/porównanie/dwa kroki/wiek/mnożenie/podział/„po ile”; E3+ bez obrazka. Fabuła i postacie są poza zakresem (PRD Non-Goals), więc imiona to tylko podmioty zdań.
- Harness F-03: `Task` ma `choices?` (kafelki), `check?` (wiele poprawnych), `speak?`; `validateTask` sprawdza zakres liczbowej odpowiedzi, ujemne, rozpraszacze (duplikaty i obecność odpowiedzi), puste `hint`, odmianę dla rzeczowników ze słownika `data/nouns.ts`. Walidator nie sprawdza odpowiedzi tekstowych (NUMBER_WORDS, ROMAN, COMPARE_NUM ze znakami) poza regułą `choices`; `sample` podaje `max` z `params.max`. Rejestr `type → Generator`; testy 1000 losowań według wzorca `tests/addSub.test.ts` (20 seedów × 50, `validateTask` w pętli).
- Follow-up F-03 (F10): `shape` dla ADD_SUB (`DU+U`, `DT+DT`, `DU+DU`, `H+H`, `HTU+U` z §4) i losowanie z kształtu zamiast `a` potem `b ∈ [1, max−a]`; krok E3.8 „dwie dwucyfrowe” i E4.2/4/5/8 (36 + 2, 47 − 5, 38 + 7, 52 + 20, 35 + 34, 530 + 400) są wprost listami kształtów.
- Plan sekcja 4: `data/wordTemplates.ts` (szablony, konteksty, imiona) i `data/curriculum/E1–E6.ts`; sekcja 14: żadnych tekstów poza `data/`. Odmiana: `inflect` i `countNoun` z F-03; walidator wykrywa błędy tylko dla rzeczowników ze słownika, więc każdy rzeczownik użyty w szablonie musi trafić do `data/nouns.ts` (roadmap Unknown S-02: „jak liczyć i testować odmianę” → słownik + walidator + test szablonów na wszystkich wartościach 0–100).

## Detailed Findings

### 1. Typy i parametry per krok (ZADANIA §2–§4)

| Krok | Typy grupy 1 (+ tekstowe spoza §7) | Parametry z katalogu |
|---|---|---|
| E3.1 | WORD, COMPARE_DIFF | liczby do 20; „o ile więcej/mniej” |
| E3.2 | ADD_SUB, MISSING | do 20 z przekroczeniem; okienko w dowolnym miejscu |
| E3.6 | ADD_SUB (PLACE_VALUE grupa 2) | 21–30 bez przekroczenia |
| E3.7 | EVEN_ODD, NUMBER_WORDS (GRID grupa 2) | parzyste do 30; słowa do 30 (wybór z 3) |
| E3.8 | ADD_SUB | do 30 z przekroczeniem (19 + 8, 22 − 6), dwie dwucyfrowe (14 + 13) |
| E3.9 | MULT (MULT_GROUPS grupa 3) | iloczyny ≤ 30, ·0, ·1; „n razy po m” |
| E3.10 | DIV, HALF | dzielenie ≤ 30 „po równo” i „po ile”; połowa |
| E3.11 | ROMAN, CALENDAR (CLOCK, TEMPERATURE grupa 2/3) | I–XII (piętro, godzina, miesiąc); kwartały, daty z rzymskim miesiącem |
| E4.1 | COMPARE_NUM (PLACE_VALUE, MONEY_*, MASS inne grupy) | do 100 |
| E4.2 | ADD_SUB | 36 + 2, 47 − 5, 47 + 3, 50 − 3 (bez i do pełnej dziesiątki) |
| E4.4 | COMPLEMENT, ADD_SUB, ROUNDING | dopełnianie do pełnej dziesiątki; 80 − 7, 38 + 7, 45 − 7; najbliższa dziesiątka |
| E4.5 | ADD_SUB | 52 + 20, 72 − 50; 35 + 34, 37 − 12 bez przekroczenia |
| E4.6 | MULT, DIV, MISSING | ≤ 50; ·5, ·10 do 100; nazwy (czynnik, iloczyn, dzielna); okienko w · i : |
| E4.8 | ADD_SUB (PLACE_VALUE grupa 2) | setki 530 + 400, 224 + 60, 553 − 50 |

Kroki E3.3–E3.5, E4.3, E4.7 mają wyłącznie typy grup 2–3 (zegar, waga, odcinki, pojemność, obwód) → S-13/S-14; w `sample` pozostają jako „brak generatora”.

### 2. Tryby odpowiedzi i rozpraszacze

- Klawiaturka (`answer: 'keypad'`): ADD_SUB, MISSING, COMPLEMENT, MULT, DIV, HALF, ROUNDING, WORD, COMPARE_DIFF (wynik liczbowy).
- Kafelki (`answer: 'tiles'`, 3–4 `choices`): COMPARE_NUM (`<`, `>`, `=`), NUMBER_WORDS (3 zapisy słowne), ROMAN (3 kafelki), CALENDAR (dni, miesiące, kwartały), EVEN_ODD (wariant „zaznacz parzyste” = `answer: number[]` + `check`, albo prostszy wariant z 3 kafelkami „parzysta/nieparzysta”). Rozpraszacze muszą być bliskie (±1, ±10, zamiana cyfr) i różne od odpowiedzi; `validateTask` sprawdza duplikaty i obecność odpowiedzi.
- Podpowiedzi: ADD_SUB/MISSING/COMPLEMENT rozbicie (F-03); MULT: rozbicie na mniejsze grupy (7 · 4 = 7 · 2 + 7 · 2) lub dodawanie po kolei; DIV: „ile razy po m mieści się w n” przez mnożenie; WORD: pierwszy krok = działanie wyłuskane z treści („9 − 4 = 5, potem 5 − 3”); NUMBER_WORDS/ROMAN: tabela wartości (I=1, V=5, X=10); CALENDAR: lista miesięcy/kwartałów.

### 3. Teksty w `data/`

- `data/wordTemplates.ts`: szablony jako funkcje `(ctx) => string` z polami liczbowymi i rzeczownikami (`countNoun`), konteksty (kawiarnia: rogaliki, ciastka, filiżanki; pokój: poduszki, książki, klocki; ogród: kwiaty; remont: złote), pula imion neutralnych (do decyzji właściciela), odmiana imion w mianowniku tylko (zdania „Ola ma…”, „Kuba kupił…” wymagają rodzaju czasownika → albo formy bezosobowe „W kawiarni było…”, albo imiona z rodzajem w danych).
- `data/pl.ts`: krótkie polecenia typów („Wstaw znak”, „Która liczba to…”, „Jaka to liczba rzymska?”).
- `data/nouns.ts`: każdy rzeczownik z szablonów; test szablonów przechodzi `validateTask` z pełnym słownikiem dla n = 0…100.

### 4. Harness: co trzeba rozszerzyć

- `Task.answer` dla COMPARE_NUM to znak (`'<'`), dla NUMBER_WORDS i ROMAN tekst; `validateTask.range` dotyczy tylko liczb — OK. Dla `number[]` (EVEN_ODD „zaznacz wszystkie”) rozpraszacze = zbiór kafelków, `check` sprawdza zbiór; `validateTask` pomija `includes(answer)` dla tablic — już tak jest.
- `sample` przekazuje `max` tylko z `params.max`; generatory z innymi granicami (ROMAN I–XII, CALENDAR) nie mają `max` → brak reguły `range` (poprawne).
- `shape` dla ADD_SUB: parser kształtów `D`/`U`/`T`/`H` i losowanie składników z kształtu; `bridge` dalej filtruje.
- Wydajność testów: 14 typów × ~2–4 umiejętności × 1000 losowań ≈ 50 000 zadań; przy generatorach O(1) z odrzucaniem < 1 s.

## Code References

- `src/core/tasks/generators/addSub.ts` - wzorzec generatora (parse params, rejection sampling, hint)
- `src/core/tasks/validate.ts:32-92` - reguły walidatora; `src/core/text/plural.ts` - odmiana
- `src/data/curriculum/E3.ts` - 11 kroków, pole `types`; `src/data/nouns.ts`
- `scripts/sample.ts:44-66` - iteracja po krokach, `max` z `params.max`
- `docs/ZADANIA.md:9-60` (prezentacja), `:61-75` (zakresy), `:104-126` (E3, E4), `:156-240` (typy), `:318-350` (§7)
- `context/archive/2026-10-12-generator-test-harness/follow-ups/review-fixes.md` - `shape`

## Architecture Insights

- Generatory zostają czystymi funkcjami `(skill, rng) => Task`; teksty poleceń i szablony w `data/` jako funkcje czyste (bez stanu), importowane przez generatory z `core/` (kierunek zależności `core → data` jest już używany przez `sample` i testy; sceny importują oba).
- Rozpraszacze jako osobny pomocnik `core/tasks/distractors.ts` (bliskie liczby, zamiana cyfr) wspólny dla kafelków.
- Odmiana w szablonach: zawsze `countNoun(n, nouns.x)` zamiast literałów; test generyczny przechodzi wszystkie szablony dla n = 0…100 przez `validateTask`.

## Historical Context (from prior changes)

- F-03: harness, ADD_SUB, E3 kroki; przegląd F10 (`shape`), F3 (składniki ≥ 1).
- Roadmap Open Question 3: S-02 = pełna jakość treści E3–E4, S-03 = testy mechaniczne reszty.

## Related Research

- `context/archive/2026-10-12-generator-test-harness/research.md`

## Open Questions

1. Zakres typów S-02: 11 typów grupy 1 obecnych w krokach E3–E4 plus COMPARE_DIFF, HALF, ROUNDING (14), czy wszystkie 18 typów §7 z parametrami E3–E4 (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP nie mają kroku w E3–E4)? Propozycja: 14; pozostałe 7 w S-03 ze swoimi etapami.
2. Imiona w zadaniach tekstowych: pula neutralnych imion z rodzajem (żeby „kupił/kupiła” się zgadzało) czy zdania bezosobowe? Propozycja: mała pula imion z rodzajem w `data/wordTemplates.ts`.
3. EVEN_ODD: wariant „zaznacz wszystkie parzyste” (`number[]`, tryb `select`, UI w S-04) czy tylko „parzysta/nieparzysta” z kafelkami w S-02? Propozycja: oba w generatorze, UI `select` dojdzie w S-04/S-13.
