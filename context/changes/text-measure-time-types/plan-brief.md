# Typy tekstowe, nierówności i runda powtórkowa (S-14c) — Plan Brief

> Full plan: `context/changes/text-measure-time-types/plan.md`
> Research: `context/changes/text-measure-time-types/research.md`

## What & Why

Slice S-14c zamyka typy zadań E5–E6 bez widżetów i INEQUALITY w E1 (PRD FR-023: „każdy etap ma pełny zestaw typów z
ZADANIA.md”). Dziecko dostaje zadania tekstowe o czasie, jednostkach, cenach, kolejności działań, nierównościach i dużych
liczbach oraz rundę powtórkową całego roku (E6.11).

## Starting Point

Rejestr ma 37 typów, żadnego z siedmiu nowych; MASS/LENGTH/PLACE_VALUE/CAPACITY istnieją tylko z rysunkiem (PLACE_VALUE ≤ 999).
E6.2 i E6.11 są puste, więc niewidoczne dla programu. `Task.check` (kilka dobrych odpowiedzi) działa w ocenie rundy, ale scena,
walidator, przeciek podpowiedzi i helper e2e zakładają jedną dobrą odpowiedź.

## Desired End State

`sample` E1/E5/E6 drukuje ~15 nowych umiejętności bez naruszeń; dziecko E1 stuka dowolny dobry kafelek nierówności i ten
kafelek świeci; uczeń po E6.10 odblokowuje „Powtórkę roku”, której rundy losują krok E6, potem umiejętność. Zapis zostaje v2.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| INEQUALITY | 2 dobre + 2 złe kafelki, `check`, rozwiązanie z jednym przykładem | ZADANIA „wiele poprawnych odpowiedzi”, `isCorrect` już to obsługuje | Research |
| Kolejność INEQUALITY | core (faza 1), scena + hak + `answerWrong` + dane w jednym commicie (faza 2) | dziecko nigdy nie zobaczy dobrego kafelka jako złego | Plan |
| MIX | `StepDef.review` + `stepPlayable` + `currentGroups`; zwykła `kind: 'round'` | zero stanu w zapisie, S-15 nietknięty | Research |
| Skład rundy MIX | krok, potem umiejętność; `previous` (E5) zostaje | kroki z wieloma umiejętnościami nie dominują | Research |
| Start kalendarza | krok powtórkowy wyłączony ze startu i rozgrzewki | „finałowe wyzwanie”, `floorToCalendar` nie podnosi na powtórkę | Research |
| Fazy treści | generator + dane w jednej fazie tdd, ≤ 3 generatory/warianty | odczyt nauczyciela czyta prawdziwe `sample` tej fazy | Plan |
| Mowa | `spokenTime` („8 15”), liczby bez spacji grupującej w `speak` | narrator czytałby „8.15” i „250 000” po znaku | Plan |
| E2E | 2 spece: nierówność (#11), powtórka przez import zapisu + 6 cyfr (#13, #11) | import to ścieżka produktu, bez nowego szwu | Plan |
| Zakres | bez widżetów, rozkład jazdy tekstem, PRICE w złotych, bez LOGIC, bez „ustaw zegar” | roadmapa „tekstowy”, follow-upy z triggerami | Research |

## Scope

**In scope:** INEQUALITY (E1.9), ORDER_OPS (E5.11), TIMES_MORE + PRICE (E5.10), CLOCK_ELAPSED (E5.3, E5.8, E6.2), TIME_UNITS
(E6.1), UNIT_CHOICE (E5.7), MASS tekst (E5.7, E6.3, E6.5), LENGTH tekst (E5.12, E6.3), CAPACITY tekst (E5.5), PLACE_VALUE ≥ 1000
(E6.9, E6.10), krok powtórkowy E6.11; testy przypięte do E6; DESIGN-GAP 98; follow-upy.

**Out of scope:** „ustaw zegar” E5–E6, banknoty 200/500, WRITTEN „brakujące cyfry” i F9, ARROW_TABLE wieloliczbowy, LOGIC w
E6.11, tabelka rozkładu jazdy, tytuł powtórki w HUD, stan „zdany test” (v3).

## Architecture / Approach

Nowe generatory to czyste `(skill, rng) => Task` w `src/core/tasks/generators/` z parserami w rejestrze; warianty tekstowe to
członkowie unii parametrów bez `visual` (wzorzec `length.ts convert`), `artBlocked` je zwalnia. Krok powtórkowy żyje w danych
(`review: true`); `curriculum.ts` ma jeden predykat grywalności i osobny przepis kubłów; `pickRoundSkills` losuje grupę (krok),
potem umiejętność. Scena zmienia tylko podświetlenie przy `check`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. `check` + INEQUALITY core (tdd) | walidator/przeciek/kafelki dla wielu dobrych odpowiedzi | reguła walidatora łamie EVEN_ODD `select` |
| 2. INEQUALITY grywalne (impl) | scena, hak, `answerWrong`, E1.9 | stare spece z `answerWrong` |
| 3. ORDER_OPS, TIMES_MORE, PRICE (tdd) | E5.10, E5.11 | odmiana towarów, dopełniacz po „więcej” |
| 4. CLOCK_ELAPSED, TIME_UNITS (tdd) | E5.3, E5.8, E6.1, E6.2 + testy E6 | start kalendarza E6 się przesuwa |
| 5. UNIT_CHOICE, MASS tekst (tdd) | E5.7, E6.3, E6.5 | jednoznaczność jednostek |
| 6. LENGTH, CAPACITY tekst (tdd) | E5.12, E6.3, E5.5 | różnorodność `capacity_half_l_e5` |
| 7. PLACE_VALUE ≥ 1000 (tdd) | E6.9, E6.10 | reguła 999 per wariant, mowa dużych liczb |
| 8. Krok powtórkowy (tdd) | E6.11 grywalny | wyłączenie ze startu i rozgrzewki |
| 9. Seam sweep (impl) | docs, gaps, follow-upy, CLAUDE.md | — |
| 10. E2E nierówność (e2e) | +2 testy #11 | Chromium tylko w orkiestratorze |
| 11. E2E powtórka + 6 cyfr (e2e) | +2 testy #13/#11 | import zapisu w specu |

**Prerequisites:** S-14 done; gałąź `feat/text-measure-time-types` z `main` @ `e2f7caa`.
**Estimated effort:** ~11 sesji agentów (jedna na fazę) + review.

## Open Risks & Assumptions

- Dwa dobre kafelki mogą mylić 6-latka (odczyt nauczyciela → opcja B).
- Długie polecenia przy 1024 px; głos tabletu dla „8 15” (`[human]` 4.8).
- Wyższe progi odblokowania na 10 krokach — `[human]` 9.6 w PR (wolniej, nic nie ginie).

## Success Criteria (Summary)

- Każdy z siedmiu typów pokryty umiejętnością w swoich krokach; `sample` E1–E6 bez naruszeń; odczyt nauczyciela zapisany.
- Dobry kafelek nierówności zawsze daje gwiazdkę i świeci; runda powtórkowa losuje z wielu kroków E6 (e2e).
- Zapis v2, fixture'y bez zmian, pełna bramka zielona po każdej fazie.
