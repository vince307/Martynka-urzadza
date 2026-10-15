# Handoff — `text-measure-time-types` (slice S-14c)

Written by the `/10x-new` step of run `2026-10-15-fix-s14c-s14d`. The change identity exists with a roadmap-claims table,
scope per type/step, design and copy binding, save-format verdict (v2 stays) and triggered follow-ups. The next agent must
not get wrong: MIX is a curriculum step whose round draws from the whole stage as an ordinary `'round'` (S-15 schedule
untouched, no saved state), and a playable review step must not become the calendar start (`calendarStart`/`floorToCalendar`).

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | 1 on top of `e2f7caa`: `docs(text-measure-time-types): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | no `plan.md` yet |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/change.md` | change identity: Notes, roadmap claim vs repo now (14 rows incl. the calendar-start side effect), scope table per type, design source and copy, migration verdict, triggered follow-ups, 7 autonomous decisions |
| `context/changes/text-measure-time-types/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/text-measure-time-types` |
| repo checks for the claims table | `src/core/tasks/registry.ts` `generators` has 37 types, none of the 8 new ones; `src/data/curriculum/E6.ts` E6.2 and E6.11 have `skills: []`; E1.9/E5.x/E6.x skill counts read from the data files; `Task.check` exists (`src/core/tasks/types.ts`) and `src/core/round.ts` uses it; `src/core/save.ts` validates `mastery` as an open map |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code touched (baseline on main e2f7caa: lint OK, typecheck OK, 2479 tests, build OK, e2e 82 — inherited, unverified) |

## 4. Next command

`/10x-research text-measure-time-types`

## 5. Open

- Research questions (from `change.md`): MIX shape in `src/core/curriculum.ts` `playableSteps`/`skillBuckets`/`unlockReady` (a review flag on `StepDef` vs synthetic skills); `calendarStart`/`floorToCalendar` excluding the review step; INEQUALITY as the first `check` on tiles: `src/core/round/canonicalInput.ts`, `tests/solvableInMode.test.ts`, solution lines, e2e helpers `answerRight`/`answerWrong` in `tests/e2e/support/hook.ts`; PLACE_VALUE text variants above 999 in `src/core/tasks/generators/placeValue.ts`; text variants in `mass.ts`/`length.ts` without a drawing; `capacity_half_l_e5` feasibility against `tests/contentInvariants.test.ts`.
- Unlock thresholds rise for E1.9, E5.3, E5.7, E5.10, E5.12, E6.3, E6.5 (slower for saved learners, nothing lost) — the plan states it.
- DESIGN-GAP candidates (rows from 98 in `docs/design-gaps.md`, not written yet): several right answers on tiles (INEQUALITY), a review-round title (MIX) only if the plan shows one.
- Follow-ups out of scope get new triggers at archive time (see `change.md` § Triggered follow-ups): set-the-clock E5–E6, 200/500 zł notes, WRITTEN missing digits, ARROW_TABLE multi-number.
- Heavy teacher read: every new generator, `npm run sample -- E1|E5|E6 --count 6`, new nouns (`lekcja`, `sekunda`, `doba`, `kwadrans`, `tysiąc`, goods for PRICE) in `src/data/nouns.ts`.

## 6. Autonomous decisions

1. Next step `/10x-research` (not `/10x-plan`) — many contact points (curriculum, round evaluation, e2e). Would change: nothing; the orchestrator fixed it.
2. No new widgets; timetables as text. Rejected: a timetable `TaskVisual`. Would change: a teacher read finding the text unreadable.
3. MIX = a curriculum step with a whole-stage pool, played as `kind: 'round'`. Rejected: a `MIX` generator; a new `RoundKind`. Why: no saved state, S-15 `nextRoundKind`/`afterRound` untouched. Would change: research showing step unlock needs real skills, or the author wanting a passed-test record (v3 → stop at open PR).
4. The review step is excluded from the calendar start (recommendation). Rejected: summer start on E6.11. Would change: the author wanting review as the default start after the school year.
5. LOGIC in E6.11 out of scope (S-15 pool, S-15 F1 is the author's decision). Would change: the author extending the puzzle pool to E5–E6.
6. Follow-ups: in — MASS/LENGTH text, PLACE_VALUE ≥ 1000, `capacity_half_l_e5` (conditional), F9 `written.ts` attempt cap (optional); out — set-the-clock E5–E6, 200/500 zł, WRITTEN missing digits, ARROW_TABLE multi-number. Would change: a CLOCK step in E5–E6 `types:` or PRICE amounts above 100 zł in ZADANIA.
7. Save format stays v2. Would change: any persisted MIX state → v3 → open PR stop.
