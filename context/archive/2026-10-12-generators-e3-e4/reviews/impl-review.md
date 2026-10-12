<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Generatory zadań grupy 1 dla E3–E4

- **Plan**: context/changes/generators-e3-e4/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-10-12
- **Verdict**: APPROVED
- **Findings**: 2 critical, 8 warnings, 6 observations (krytyczne i ostrzeżenia naprawione przed zamknięciem; 3 obserwacje odłożone)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Zakres git: `main..m1/generators-e3-e4` (4 commity faz + commit poprawek). Wszystkie pozycje „Changes Required” faz 1–4 obecne; odchylenia kosmetyczne (`toNextTen` jako domyślne zachowanie COMPLEMENT, `slots` zamiast `slot`, `compareTemplates` jako obiekt, konteksty ROMAN bez miesiąca, bo ten jest w CALENDAR). Dane E3/E4 zweryfikowane z `docs/ZADANIA.md` §2–§3 (zakresy, kształty, czynniki). Kryteria automatyczne 1.1–1.3, 2.1–2.3, 3.1–3.2, 4.1–4.3 powtórzone po poprawkach: 197 testów, `sample` E3/E4 bez naruszeń, „brak generatora” tylko dla grup 2–3, AGENTS.md 398 słów. Ręczne 1.4, 2.4, 3.3 wykonane przez agenta z odczytem `sample`; 4.4 (właściciel) po wysłaniu wydruku.

## Findings

### F1 — Biernik liczby pojedynczej rzeczowników żeńskich

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/data/wordTemplates.ts (pozycje dopełnienia)
- **Detail**: `countNoun(1, …)` daje mianownik („ma 1 naklejka”, „oddała 1 kredka”); walidator tego nie widzi, bo forma jest w słowniku. Dotyczyło ok. 15 % zadań E3.1.
- **Fix**: `Context.accusative` i pomocnik `obj(n, ctx)` dla dopełnień („ma 1 naklejkę”); test szablonów sprawdza regexem, że po czasownikach nie ma „1 …a”.
- **Decision**: FIXED (2026-10-12)

### F2 — Podpowiedź rzymska sumowała IX jako 11

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/text/roman.ts, src/core/tasks/generators/roman.ts
- **Fix**: `romanBreakdown` z parami odejmowanymi („IX = 10 − 1 = 9”) i sumą; test liczy sumę dla 1–100.
- **Decision**: FIXED (2026-10-12)

### F3 — Podpowiedź porównania z „0 dziesiątek / 0 jedności”

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/compareNum.ts
- **Fix**: Pomijanie zerowych części, losowanie od 1.
- **Decision**: FIXED (2026-10-12)

### F4 — Polszczyzna poleceń (piętro, zegar, połowa, parzystość)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/data/pl.ts
- **Fix**: „na II piętrze”, „Zegar z cyframi rzymskimi”, „Ile to jest połowa liczby 14?”, „Liczba 16 jest parzysta czy nieparzysta?”, „kończy się cyfrą 6, więc jest parzysta”.
- **Decision**: FIXED (2026-10-12)

### F5 — „oddał 3 rogaliki dla Oli”

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/data/wordTemplates.ts
- **Fix**: Celownik imion (`dative`: Oli, Kubie, Frankowi, Stasiowi, Tomkowi…): „oddała Oli 3 rogaliki”.
- **Decision**: FIXED (2026-10-12)

### F6 — „rok/lata/lat” poza słownikiem

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: src/data/pl.ts, src/data/nouns.ts
- **Fix**: `nouns.rok` i `countNoun`; walidator sprawdza wiek.
- **Decision**: FIXED (2026-10-12)

### F7 — Tautologiczne asercje w testach

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: tests/calendar.test.ts, tests/word.test.ts, tests/addSub.test.ts
- **Fix**: `romanMonth` porównany z `fromRoman`; test WORD sprawdza kontekst dla pudełek/talerzy; `addSubHint` testowany bezpośrednio; EVEN_ODD `check` z nadzbiorem.
- **Decision**: FIXED (2026-10-12)

### F8 — WORD w E4.5 „bez przekroczenia”

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Plan Adherence
- **Location**: src/data/curriculum/E4.ts
- **Fix**: Usunięto `E4.5.word_100` (katalog nie wymienia WORD w E4; zadania tekstowe do 100 wrócą z danymi S-03/E5).
- **Decision**: FIXED (2026-10-12)

### F9 — `bridge: 'none'` w MISSING a w ADD_SUB

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: src/core/tasks/generators/missing.ts
- **Fix**: Wspólna semantyka (`hasCarry`); E3.2 MISSING `bridge: 'ten'` jak w planie.
- **Decision**: FIXED (2026-10-12)

### F10 — Podpowiedź MULT powielała linię i rozbijała ·5

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/mult.ts
- **Fix**: Podwajanie dla parzystego czynnika, „o jedną grupę więcej” dla nieparzystego, ·5 i ·10 wprost.
- **Decision**: FIXED (2026-10-12)

### F11 — Nieosiągalne kombinacje parametrów nie są odrzucane

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts (parseAddSubParams)
- **Detail**: `DU+DU` z `bridge: 'ten'` i `max 30` wyczerpałoby 1000 prób; test programu (`curriculum.test.ts`) wykrywa to dla danych w repo, więc błąd wyjdzie przy dodawaniu danych w S-03.
- **Fix**: — (zapisane w follow-ups; rozważyć szacowanie wykonalności przy S-03).
- **Decision**: DEFERRED

### F12 — Skośność i podpowiedzi „powtarzające wynik” dla DT−U

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/addSub.ts (addSubHint)
- **Detail**: „70 − 9 = 61” jako jedyny krok; rozbicie „70 − 10 = 60, 60 + 1 = 61” byłoby lepsze. E3.6 dostało kształty, więc „8 + 1” zniknęło.
- **Fix**: — (follow-up; dopracowanie podpowiedzi po testach z graczem, S-17).
- **Decision**: DEFERRED

### F13 — Kwartały zawsze 4 kafelki; kontekst „na talerzu” dla poduszek

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/calendar.ts, src/data/wordTemplates.ts
- **Fix**: Konteksty dla grup/podziału ograniczone do `portable` (naklejki, klocki, ciastka…); kwartały zostają jako 4 przyciski (jak na kartce kalendarza).
- **Decision**: FIXED (konteksty) / ACCEPTED (kwartały)

### F14 — Podpowiedź MISSING zawiera odpowiedź

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/missing.ts
- **Detail**: Pierwsza podpowiedź to działanie odwrotne z wynikiem; plan §6 gry przewiduje „pierwszy krok z hint” po błędzie, więc dla okienka to w praktyce rozwiązanie.
- **Fix**: — (zostawić do decyzji przy S-04: pokazać działanie odwrotne bez wyniku jako pierwszy krok).
- **Decision**: DEFERRED

### F15 — `sample` bez `max` dla MULT/DIV; Polskie słowa w `core/text/numberWords.ts`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Pattern Consistency
- **Location**: scripts/sample.ts, src/core/text/numberWords.ts
- **Fix**: `sample` używa `maxProduct`/`maxDividend`; liczebniki słowne zostają w `core/text` jako reguła językowa (jak `plural.ts`), nie tekst interfejsu.
- **Decision**: FIXED (sample) / ACCEPTED (numberWords)

### F16 — Nieaktualne komentarze, brak kontekstu „złote”

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Plan Adherence
- **Location**: src/core/tasks/generators/addSub.ts, src/data/curriculum/E3.ts, src/data/wordTemplates.ts
- **Fix**: Komentarze odświeżone; kontekst „w skarbonce” ze złotymi dodany; operatory w `core/tasks/symbols.ts`.
- **Decision**: FIXED (2026-10-12)
