# Słupek pisemny, grafy strzałkowe i oś liczbowa — Plan Brief

> Full plan: `context/changes/number-line-written-arrows/plan.md`
> Research: `context/changes/number-line-written-arrows/research.md`

## What & Why

Slice S-14b (M6, FR-023): dziecko liczy pisemnie w słupku z okienkami cyfr (WRITTEN, E5.2, E6.7), uzupełnia grafy i
tabelki strzałkowe (ARROW_TABLE, E2.6) i widzi oś liczbową jako rysunek (SEQUENCE E2.7, skoki MULT_GROUPS E3.9) oraz jako
podpowiedź po błędzie w ADD_SUB ≤ 30. Pierwszy nowy tryb odpowiedzi od S-13 („cyfra w okienku”) wymaga strażnika, żeby
nie wpadł po cichu w gałąź kafelków/klawiatury.

## Starting Point

Cztery tryby odpowiedzi, żaden konsument nie jest wyczerpujący; 12 rodzajów rysunków bez słupka, grafu i osi; podpowiedź to
tylko tekst. `playable` wpuszcza tryb i wymaga generatora; `canonicalInput` + `solvableInMode` sprawdzają każdą umiejętność
z generatorem. Format zapisu v2.

## Desired End State

Rundy E5/E6 mają słupki wypełniane cyframi od jedności, E2 grafy i tabelki, E2.7 ciąg na osi, E3.9 skoki na osi, a ADD_SUB
≤ 30 w E2–E3 pokazuje oś ze skokami dopiero po błędzie (lądowanie nigdy niepodpisane). Szósty tryb złamałby typecheck w
każdym konsumencie. Dwa nowe spece e2e (#11).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Tryb „cyfra w okienku” | nowy `AnswerMode` `digits`, odpowiedź liczbą | zapis zostaje v2, `captureFirstWrong`/`isCorrect` bez zmian | Research |
| Liczba okienek | kolumny szerszego składnika; wynik ograniczony do tylu cyfr | okienka nie zdradzają przeniesienia | Research |
| Strażnik | `ANSWER_MODES` + `switch` z `never` (core, UI, helpery e2e) + test listy `playable` | lekcja S-13b, polecenie kroku | Plan |
| Kolejność | `digits` w unii od fazy 1, `playable` dopiero w fazie 8 z helperami e2e | kontrakt runu | Plan |
| Przeniesienie/pożyczka | rysuje gra (podpowiedź: pierwsza kolumna, rozwiązanie: wszystkie), dziecko nie wpisuje | mniej dotknięć, odpowiedź liczbą; `[human]` 8.8/9.6 | Research/Plan |
| E5.2 / E6.7 | E5 z przeniesieniem dozwolonym, E6 z wymaganym | słupek uczy przeniesienia | Research |
| ARROW_TABLE | graf/tabelka, jedno puste pole, `+`/`−`, do 20, klawiatura | bez „·3” i łańcucha (wbrew ZADANIA, `[human]` 9.6) | Research |
| MULT_GROUPS skoki | nowa umiejętność, odpowiedź działaniem na kafelkach | brak nowej powierzchni przecieku | Research |
| Oś-podpowiedź | jedno pole `Task.hintVisual`, tylko klawiatura ADD_SUB ≤ 30 (bez E1) | ekran E1 nie ma miejsca; minigra słowna je odrzuca | Plan |
| Układ | prowizoryczne prostokąty `TASK_LAYOUT.picture.digits`/`.hint`, bramka wizualna | `keypadSolution` bez zmian | Plan |

## Scope

**In scope:** tryb `digits` i strażnik; rysunki `column`, `numberLine`, `arrows`; generatory WRITTEN, ARROW_TABLE; oś w
SEQUENCE, wariant MULT_GROUPS `jumps`; `hintVisual` w ADD_SUB; widżety `NumberLine`, `ArrowGraph`, `WrittenColumn`; dane E2.6,
E2.7, E3.9, E5.2, E6.7 i sześciu ADD_SUB; O5; DESIGN-GAP od 88; dwa spece e2e.

**Out of scope:** WRITTEN „brakujące cyfry”, okienko przeniesienia, ARROW_TABLE „·n”/łańcuch/kilka pól, oś-podpowiedź E1 i > 30,
nowe SEQUENCE, `place_read_12`, `capacity_half_l_e5`, `ArtPool`, zmiana formatu zapisu.

## Architecture / Approach

Wzorzec każdego trybu: czysty reduktor w `core` (`digitBoxes.ts`) + widżet + jedno `submit(liczba)`; rysunki to dane
`TaskVisual` walidowane w `core` (z regułą przecieku osi w `validateTask`), rysowane przez `TaskPicture`. Rysunek podpowiedzi
to osobne pole zadania, wystawiane przez `RoundView.hintPicture` w fazach po błędzie, w osobnym prostokącie pod wyrażeniem.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Strażnik i `digits` (tdd) | `ANSWER_MODES`, `never`, reduktor okienek, `canonicalInput` | ciche gałęzie w UI do fazy 7 (tryb niegrywalny) |
| 2. `column`/`numberLine`, WRITTEN (tdd) | słupek i oś jako dane, generator | arytmetyka linii kolumn poza inwariantem |
| 3. `arrows`, ARROW_TABLE, oś SEQUENCE, `jumps` (tdd) | trzy rysunki-dane | przeciek brakującego wyrazu |
| 4. `hintVisual` (tdd) | oś w ADD_SUB, widok, układ, filtr minigry | dziura w `drawTask` |
| 5. `NumberLine` + `ArrowGraph` (impl) | dane E2.6, E2.7, E3.9 | czytelność osi 0–100 |
| 6. Oś-podpowiedź w scenie (impl) | dane sześciu ADD_SUB | spece E3 z błędem |
| 7. `WrittenColumn` + klawiatura (impl) | scena obsługuje `digits` | stan `buffer` vs tryb klawiszy |
| 8. Helpery e2e + `playable` (impl) | WRITTEN grywalny, O5 | układ słupka i linii obok |
| 9. Seam sweep (impl) | docs, gaps 88+, follow-upy | — |
| 10–11. E2E #11 (e2e) | `written-column`, `number-line` | Chromium tylko u orkiestratora |

**Prerequisites:** S-14 done; gałąź z `main` @ `882cd93`; baseline unit 2326, e2e 71 (inherited).
**Estimated effort:** 11 faz, jedna sesja agenta na fazę.

## Open Risks & Assumptions

- Notacja pożyczki z wiedzy ogólnej (`[human]` 8.8).
- Linie kolumn w 320 px obok słupka mogą się zawijać — bramka wizualna fazy 8.
- Oś 0–30 przy 1024 px (~19 CSS px na kreskę) — podpisy co 5.
- Wyższe progi odblokowania E2.6, E3.9, E5.2, E6.7 na żywych zapisach (`[human]` 9.6).

## Success Criteria (Summary)

- Dziecko rozwiązuje słupek, graf i skoki dotykiem i dostaje gwiazdkę; po błędzie widzi podpowiedź z metodą, nigdy z wynikiem.
- Nowy tryb nie może już po cichu dostać cudzego widżetu (typecheck + `answerModes`).
- Pełna bramka lokalna zielona po każdej fazie; e2e baseline + 6.
