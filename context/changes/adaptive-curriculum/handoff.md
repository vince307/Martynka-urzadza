# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-tdd adaptive-curriculum phase 6`. Phase 6 committed (`58bf417`); rows 5.1, 5.2 ticked from the orchestrator's run-log line "S-07 p5 impl". Row 6.5 is [reviewer]; the e2e of phase 6 is the orchestrator's gate.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, 2 `1c384c5`, 3 `ee93ff9`, 4 `dba1791`, 5 `0aedeff`, 6 `58bf417`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.5 [reviewer], 6.5 [reviewer], phases 7-9 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `StepDef.childName?: string` |
| `src/data/curriculum/E1.ts` … `E6.ts` | 48 `childName` values on the playable steps (those with a `playable` skill) |
| `tests/curriculum.test.ts` | block "child-facing step names": per playable step non-empty, ≤ 28 chars, capital first letter, no trailing dot; per stage distinct and absent on non-playable steps (+54 tests) |
| `scripts/sample.ts` | step header prints `[dziecko: <childName>]` |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (`npm test`) | baseline 827 + 54 = 881 passed; `sample` E1-E6 `Naruszenia: 0` x6 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| RED | first run after adding `childName?` to the type: `AssertionError: E1.2 childName: expected undefined to be truthy` (54 failures) |
| Break | removed E3.6 name -> `AssertionError: E3.6 childName: expected undefined to be truthy`; 44-char name -> `expected 44 to be less than or equal to 28`; both restored (green again) |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate; phase 6 changes data only |

Names for the [reviewer] row 6.5 (stage.step: name; ≤ 28 chars, nominative, derived from the step title and the actual skills):
- E1: .2 Porównywanie liczb do 5; .3 Działania do 5; .4 Rozkłady liczb 6 i 7; .5 Działania do 9; .6 Parzyste i nieparzyste; .7 Rozkład i dopełnianie do 10; .9 Działania do 10; .11 Miesiące roku
- E2: .1 Działania do 20; .3 Dodawanie z przekroczeniem; .4 Przemienność dodawania; .5 Odejmowanie z przekroczeniem; .6 Sprawdzanie odejmowania; .7 Dziesiątki do 100; .9 Działania na liczbach do 99; .10 Dni tygodnia i miesiące
- E3: .1 Zadania tekstowe do 20; .2 Działania do 20 z okienkiem; .6 Działania do 30; .7 Parzyste i liczby słowami; .8 Przekraczanie dziesiątki; .9 Mnożenie do 30; .10 Dzielenie do 30; .11 Cyfry rzymskie i kwartały
- E4: .1 Porównywanie liczb do 100; .2 Działania z małą liczbą; .4 Dopełnianie do dziesiątki; .5 Działania dwucyfrowe; .6 Mnożenie i dzielenie do 50; .8 Liczby trzycyfrowe
- E5: .1 Powtórka do 100; .2 Dwucyfrowe i cyfry rzymskie; .3 Liczby słowami i kalendarz; .4 Mnożenie przez 0, 1, 5, 10; .6 Liczenie różnymi sposobami; .7 O ile więcej, o ile mniej; .8 Mnożenie przez 6, 7, 8, 9; .9 Dzielenie do 100; .10 Zadania tekstowe do 100; .11 Miesiące i kwartały
- E6: .1 Kalendarz i czas; .4 Mnożenie i dzielenie do 100; .5 Dopełnianie do 100 i 1000; .6 Działania do 1000; .7 Sprawdzanie działań; .8 Mnożenie i dzielenie do 1000; .9 Zaokrąglanie liczb; .10 Duże liczby i rzymskie

## 4. Next command

`/10x-implement adaptive-curriculum phase 7`

## 5. Open

- Row 6.5 [reviewer]: teacher read of the 48 names above (write `reviews/teacher-read.md`). Row 5.5 [reviewer].
- Orchestrator: run `npx playwright test` on `58bf417` (expect 14 passed; data-only phase).
- Phase 7 must read `learner.pendingUnlock` (set in phase 5, not yet cleared) and show `childName` of the unlocked step; the card width limit is 28 chars.
- Teacher-read notes: E1.11 and E2.10 names cover only the generated calendar skills (the step title also lists clock/money/bar chart). E4.2 "Działania z małą liczbą" and E3.8 "Przekraczanie dziesiątki" are the least obvious; reviewer may reword (data-only, same ≤ 28 limit).

## 6. Autonomous decisions

1. Skill questions decided in place: TDD in this context, proposed commit message, stop after phase 6.
2. The orchestrator's example „Dodawanie do 20 z przekroczeniem” (32 chars) exceeds the plan's 28-char limit (one 48 px line in 1144 px); used „Dodawanie z przekroczeniem” (26) and „Odejmowanie z przekroczeniem” (28) instead. Would change if the card allowed two lines.
3. Names describe the skills the step really plays (not the whole `title`, which lists unbuilt drawing types), e.g. E1.11 „Miesiące roku”.
4. `childName` only on steps with a `playable` skill (the test enforces absence elsewhere).
5. Rows 5.1/5.2 ticked citing the run-log line "S-07 p5 impl" (orchestrator e2e 14/14 on 0aedeff, break red, restored).
6. Plan SHA placeholders in rows 6.1-6.4 filled with the phase commit `58bf417` in the handoff commit.
