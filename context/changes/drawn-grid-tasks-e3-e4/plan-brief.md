# Zadania na siatce i „ustaw zegar” (S-13b) — Plan Brief

> Full plan: `context/changes/drawn-grid-tasks-e3-e4/plan.md`
> Research: `context/changes/drawn-grid-tasks-e3-e4/research.md`

## What & Why

Dziecko w E3–E6 dostaje zadania rysowane w kodzie, których dziś brakuje: kwadrat magiczny i piramida (E3.5), kratka z
kodowaniem pól A1… (E3.7), obwody figur (E4.7, E5.12, E6.3) oraz „ustaw zegar” przeciąganiem wskazówek (E3.3, E3.11, E4.3).
To ostatnie jest pierwszym `drag` z odpowiedzią nieliczbową — bez poprawek S13-01…04 dziecko mogłoby utknąć bez „Dalej”.

## Starting Point

`TaskVisual` ma 9 rodzajów, żaden dla pól liczb, kratki ani figury; CLOCK jest tylko do odczytu; tryb `drag` zna wyłącznie
klocki (`dragKinds` dostaje 0 dla odpowiedzi tekstowej). E5.12 i E6.3 są puste.

## Desired End State

Wszystkie nowe zadania grywalne dotykiem z podpowiedzią, drugą próbą i krokami rozwiązania; każda umiejętność E1–E6
udowodniona jako rozwiązywalna w swoim trybie; zapis nadal v1; dwa nowe spece e2e (#11).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Odpowiedź zegara | napis `formatTime(h, m)`, godzina 1–12 | pasuje do rundy, pomyłek i zapisu v1 bez zmian | Research |
| Gałąź `drag` | `dragMode(task)` po `visual.kind`, nieznany rodzaj rzuca | zamyka S13-04 na stałe | Research |
| Strażnik `retype` | test „rozwiązywalne w swoim trybie” przez `generateTask` dla E1–E6 | łapie każdą przyszłą pułapkę trybu | Research / Plan |
| Gest | czysty reduktor kąta, godzinowa osobno (rysowana sprzężona), E3 co godzinę, E4 co 5 min | szybszy dla dziecka niż przekładnia | Research |
| E4.3 „ustaw” | odpowiedzi tylko kwadranse, przyciąganie co 5 min | precyzja ≈ 45 px CSS na tablecie | Plan (`[human]` 10.6) |
| Zegar w modelu | `kind: 'clock'` + `set: true` | jeden widżet tarczy | Research |
| Kratka GRID | 5 × 4, przedmioty kształtami | duże pola dla 8-latka, bez grafiki | Plan (DESIGN-GAP 74) |
| Figura przy klawiaturze | skala do 768 × 190 (komórka ≥ 36 px) | nie zmienia innych rysunków | Plan |
| PERIMETER E5.12/E6.3 | w zakresie mimo 12 faz | tylko dane + wariant generatora | Plan |
| `adaptive.spec` | pomiar; limit 240 s tylko przy > 160 s | zegar wchodzi do jego rund | Plan |

## Scope

**In scope:** PUZZLE_GRID (magic, pyramid), GRID (where, what), PERIMETER (rect, triangle, sideSquare, sideRect, composite),
CLOCK `set`; S13-01…04, S13-07, S13-08; obszar rysunku `select`/`drag`; nowe kroki E5.12, E6.3; design-gaps 73–77.

**Out of scope:** GRID E1–E2/E5, trójkąty liczb, LENGTH/MASS tekstowe E5.12/E6.3 (S-14c), BONDS/CHOOSE_OP (S-14d), zegar
„ustaw” E5–E6, S13-09, zmiana formatu zapisu, zmiana reguły progu.

## Architecture / Approach

Czysty `core` test-first (rozwiązywalność → model + PUZZLE_GRID → GRID + PERIMETER → reduktor zegara i układ), potem widżety
z danymi w krokach już grywalnych, gałąź zegara w scenie z helperami e2e przed danymi, jedna faza nowych kroków, seam sweep,
dwie fazy e2e.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Rozwiązywalność (tdd) | `isCorrect` tablic, `dragMode`, `canonicalInput`, `skill.id` w błędach | test zbyt luźny dla `select` |
| 2. Model + PUZZLE_GRID (tdd) | `cells`/`grid`/`figure`, kwadrat i piramida | sumy ≤ 30 |
| 3. GRID + PERIMETER (tdd) | dwa generatory, 7 wariantów | dystraktor z drugą poprawną |
| 4. Zegar w core (tdd) | `stepClockSet`, wariant `set`, układ | chwyt przy bliskich wskazówkach |
| 5. `NumberCells` + `CoordGrid` (impl) | E3.5, E3.7 | progi 1→2, 2→3 |
| 6. `FigureGrid` (impl) | E4.7, rysunek w 768 × 190 | czytelność podpisów |
| 7. Tarcza + scena + hak (impl) | gałąź zegara, `setClock` | brak dowodu na płótnie do fazy 12 |
| 8. Dane zegara (impl) | E3.3, E3.11, E4.3 | czas `adaptive.spec` |
| 9. E5.12, E6.3 (impl) | nowe kroki grywalne | testy przypięte do kolejności |
| 10. Seam sweep (impl) | docs, gaps, follow-upy | — |
| 11. E2E siatki (e2e) | `grid-tasks.spec` +3 | Chromium w agencie |
| 12. E2E zegara (e2e) | `clock-set.spec` +3 | precyzja dotyku w FIT |

**Prerequisites:** S-13 i S-14 zrobione; gałąź z `main` @ `9554e96`; baseline unit 1927, e2e 57.
**Estimated effort:** ~12 sesji agentów fazowych + bramki orkiestratora.

## Open Risks & Assumptions

- Gest co 5 min na prawdziwym tablecie niesprawdzony (`[human]` 8.7).
- `adaptive.spec` może wymagać 240 s.
- Rysunek kratki (pozycje przedmiotów) dowodzą tylko zrzuty, nie hak.

## Success Criteria (Summary)

- Dziecko rozwiązuje kwadrat, kratkę, obwód i ustawia zegar palcem, z podpowiedzią i drugą próbą.
- Żadna umiejętność nie może zostawić dziecka w `retype` bez wyjścia (test przez E1–E6).
- Pełna bramka i e2e zielone; zapis v1 bez zmian.
