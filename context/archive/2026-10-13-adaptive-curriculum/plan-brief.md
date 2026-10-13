# Adaptacja trudności: wagi kroków, opanowanie 0–5, „Nowa umiejętność!” i łagodzenie — Plan Brief

> Full plan: `context/changes/adaptive-curriculum/plan.md`
> Research: `context/changes/adaptive-curriculum/research.md`

## What & Why

S-07 (FR-013, FR-014, PRD Business Logic, M3): gra przestaje losować zadania jednostajnie z całego etapu. Losuje z
odblokowanych kroków wg wag, liczy opanowanie każdej umiejętności tylko z pierwszej próby, odblokowuje następny krok
kartą „Nowa umiejętność!” i po cichu łagodzi trudność po dwóch słabych rundach — tak, by zadania „same” rosły z dzieckiem.

## Starting Point

`pickSkills` (S-04) losuje z powtórzeniami ze wszystkich grywalnych kroków etapu; `LearnerState.unlockedStep/mastery`
istnieją tylko jako typy. Uczeń sesji (`SessionLearner`, S-06) żyje w rejestrze gry, zapisu nie ma do S-11. Kit ma widok
`unlock.png`.

## Desired End State

Runda: 5 różnych poleceń z kroków ≤ bieżący (60%), wcześniejszych (30%) i poprzedniego etapu (10%). Po rundzie
opanowanie 0–5 (3 dobre z rzędu +1, błąd −1, druga próba się nie liczy), odblokowanie przy ≥ połowie umiejętności kroku
na ≥ 4, karta po „Kolejna runda” (czeka przez „Do pokoju”), „Dalej” gra już nowy krok. Dwie rundy < 3/5 → dwie rundy z
wagami 20/50/30. Zimny start = podłoga kalendarza szkolnego. E2E #13 (proposed) gra do karty dotykiem.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Startowy krok bez zapisu | Podłoga kalendarza (reguła D): E3 w październiku = kroki 1, 2, 6; od stycznia cały etap; etap niższy niż kalendarzowy = cały | Jedyna kotwica PRD to „zgodne z tym, co w szkole”; pierwszy krok byłby regresją do S-11 (`[human]` 8.6) | Research / Orchestrator |
| „Większość” | `≥ ceil(0.5 · n)` | Przy `> 0.5` jedna trudna umiejętność z dwóch blokuje krok, wbrew ZADANIA §1 (`[human]` 8.7) | Research |
| Łagodzenie | Wagi 20/50/30 przez 2 rundy, ciche | Zakresy w `params` chronią parsery i teacher read; tryb z obrazkami to S-14 (`[human]` 8.9) | change.md / Research |
| Odblokowanie w łagodzeniu | Dozwolone | PRD milczy; opanowanie z prawdziwych prób, prostsza reguła (`[human]` 8.8) | Plan |
| Trwałość | Uczeń sesji w rejestrze w kształcie `LearnerState` (+`weakStreak`, `easedRounds`) | S-11 zapisze bez migracji (`[human]` 8.5) | change.md |
| Unikalność | Po `prompt`, ≤ 20 ponownych losowań tej samej umiejętności, potem duplikat | Nie zmienia rozkładu wag; najmniejsza pula 9 | Research |
| Karta | Widżet `UnlockCard` w `TaskScene`, po „Kolejna runda”, lektor przy `autoRead` | Kit rysuje kartę na tym samym notesie; E1 nie przeczyta nazwy (DESIGN-GAP) | change.md / Plan |
| Nazwy kroków | `StepDef.childName` dla 48 grywalnych kroków, ≤ 28 znaków | Nowa treść dla dziecka → teacher read | Research |
| Awans etapu | Brak automatycznego (`[human]` 8.10) | Etap = szkoła; zmienia rodzic (S-08) | change.md |
| E2E | Ścieżka rodzica E4 we wrześniu (`?e2eMonth=8`), krok 2 z jedną umiejętnością, ≤ 12 rund | Najkrótsza droga do karty przez produkt; nigdy `page.clock` | Research / Orchestrator |

## Scope

**In scope:** `core/mastery.ts`, `core/curriculum.ts`, `core/round/unique.ts`, `balance.curriculum/mastery/easing`,
F5 (`PlacementData` w core), uczeń sesji z adaptacją, `UnlockCard`, 48 nazw kroków, hak (głęboka kopia, `unlock`),
spec `adaptive.spec.ts`, luki projektu, follow-upy.

**Out of scope:** zapis (S-11), podgląd i zmiana etapu przez rodzica (S-08), tryb z obrazkami (S-14), sztuka książki i
` = ?` (S-16), edycja test-planu, migracja starych helperów e2e (F2, S-08).

## Architecture / Approach

Czyste funkcje `(adaptation, wejście, rules) → adaptation` w `core` (`recordRound`, `calendarStart`/`startLearning`,
`pickRoundSkills`/`distinctTasks`/`buildAdaptiveRound`, `endRound`/`roundWeights`), liczby w `balance`. `WelcomeScene`
dokłada stan adaptacji do ucznia, `TaskScene` woła `endRound` raz przy końcu rundy i pokazuje `UnlockCard` przy
`pendingUnlock`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Opanowanie (tdd) | Typy, F5, `recordRound`, `balance.mastery` | Druga próba podnosi opanowanie |
| 2. Podłoga kalendarza (tdd) | `calendarStart`, `startLearning` | Granice półrocza i `behind` |
| 3. Wagi i unikalność (tdd) | Koszyki, picker, `distinctTasks` w rundzie i rozgrzewce | Małe pule poleceń |
| 4. Koniec rundy (tdd) | Odblokowanie, łagodzenie | Próg „większości”, ostatni krok |
| 5. Sklejka (impl) | Uczeń sesji, runda adaptacyjna, `endRound` w scenie, hak | Podwójne liczenie przy „Do pokoju” |
| 6. Nazwy kroków (tdd) | 48 `childName` + test + sample | Język dla dziecka (teacher read) |
| 7. Karta (impl) | `UnlockCard`, `pl.unlock`, hak `unlock` | Karta blokuje kolejne rundy |
| 8. Seam sweep (impl) | Luki, follow-upy, docs, `[human]` | — |
| 9. E2E #13 (e2e) | Karta dotykiem, czeka przez pokój | Czas testu, Chromium w sesji agenta |

**Prerequisites:** S-06 done; baseline `main` @ `fd68216`: unit 767, e2e 14.
**Estimated effort:** 9 faz dla świeżych agentów; fazy 3, 5 i 7 największe.

## Open Risks & Assumptions

- Do S-11 zimny start zeruje opanowanie; karta może się powtórzyć dla kroku odblokowanego wczoraj.
- Reguła D nie ma tekstu źródłowego — decyzja autora (`[human]`).
- E2E zależy od losowania (60% bieżący koszyk); margines ≤ 12 rund.

## Success Criteria (Summary)

- Runda nigdy nie losuje spoza odblokowanych kroków i poprzedniego etapu; brak powtórzeń poleceń.
- Opanowanie rośnie tylko z pierwszej próby; krok odblokowuje się kartą, „Dalej” prowadzi dalej.
- Pełna bramka (lint, typecheck, unit, sample E1–E6, build bez haka, e2e) zielona po każdej fazie.
