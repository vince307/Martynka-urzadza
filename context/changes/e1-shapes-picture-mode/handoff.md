# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by the `/10x-new` step of run `2026-10-15-fix-s14c-s14d`. The change folder and `change.md` exist (identity,
roadmap-claim corrections, proposed scope, design sources, triggered follow-ups, 8 autonomous decisions); no code yet.
The next agent must not treat the roadmap block as the scope: `change.md` § Autonomous decisions 3 narrows it (SPATIAL,
SYMMETRY and BONDS pairs are out), and MONEY_PAY must make the e2e helpers exhaustive on a `dragMode`, not add a third
`else` branch.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | 1 on top of `10d6fe7`: `docs(e1-shapes-picture-mode): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files of this step were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/e1-shapes-picture-mode/change.md` | change identity: notes, "roadmap claim / repo now / correction" table, proposed scope, design-kit views and art, DESIGN-GAP candidates (rows from 100), save-format expectation (v2, no new field), e2e helper risk, triggered follow-ups with scope takes, 8 autonomous decisions |
| `context/changes/e1-shapes-picture-mode/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/e1-shapes-picture-mode` (observed) |
| registry count (`awk` over `generators` in `src/core/tasks/registry.ts`) | 44 types, none of SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, ORDINAL, MONEY_PAY (observed) |
| `grep -rn "S-14d" context/archive/*/follow-ups/review-fixes.md` | 4 hits in 3 archives (S-13b, S-14, S-14b), all listed in `change.md` |
| `ls context/foundation/lessons.md` | absent (no lessons to apply) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed. Baseline on main at 10d6fe7 (contract, inherited, unverified): unit 2672 passed, e2e 86 passed |

No deliberate break in this step (no tests written).

## 4. Next command

`/10x-research e1-shapes-picture-mode`

## 5. Open

- Research questions carried from `change.md`: which E1 steps `buildWarmup` (`src/core/placement.ts`) draws for an E2
  warm-up (a 7-year-old should not get a pattern task by accident); whether `Task.check` works for the `drag` answer mode
  (decision 6); how much gesture code `src/core/blockDrag.ts` and a coin reducer would share (decision 5); whether
  `AnswerTiles`/`SelectTiles` can draw a figure inside a tile (SHAPES/PATTERN); content-invariant variety for ORDINAL in
  E1.2 (range 5) and whether +12 icons from `designs/martynka-expansion-v1/assets/icons/` are needed.
- E2E risk: `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` default `state.input === 'drag'` to `buildOnMat`;
  MONEY_PAY needs a `dragMode` in the hook snapshot (`src/testing/e2eHook.ts`) and an exhaustive switch.
- DESIGN-GAP candidates (not yet written to `docs/design-gaps.md`): wallet, figures inside tiles, ORDINAL highlight and
  CHOOSE_OP arrow, picture mode (row 21 update).
- Unlock thresholds rise for saved learners on E1.2 (1 to 2) and possibly E1.3 (2 to 3): slower, nothing lost; goes on
  the [human] checklist at plan time.
- Follow-ups to re-trigger at archive time (out of scope): SPATIAL, SYMMETRY, BONDS pairs, hint number line for E1,
  E1.10 `place_read_12` (see `change.md` § Triggered follow-ups).

## 6. Autonomous decisions

All eight are recorded in `change.md` § Autonomous decisions with chosen / rejected / why / what would change the answer.
Summary:
1. Next step research, not plan (orchestrator fixed it). Would change: nothing.
2. Picture mode = pure core preference for skills with a drawing (age 6 or easing in E1), no screen, no setting.
   Rejected: a text-free screen (no kit view), a parent toggle (v3). Would change: the author or a teacher read wants
   text-free prompts, or v3 is allowed.
3. Scope: SHAPES, PATTERN, COMPARE_QTY, ORDINAL, CHOOSE_OP with a picture, MONEY_PAY, picture mode, O4 in; SPATIAL,
   SYMMETRY, BONDS pairs, E1 hint number line, E1.10 `place_read_12` out with triggers; MONEY_PAY last, split rather
   than cut. Would change: SYMMETRY fits `select`, or a SPATIAL scene arrives.
4. ORDINAL on tiles, not "tap the fourth". Would change: a teacher read says tiles do not work for 6-year-olds.
5. MONEY_PAY as a `DragMode` `'coins'` with its own pure reducer (S-13b `clockSet` pattern), not a generalised
   `blockDrag`. Would change: research finds most gesture code shared.
6. MONEY_PAY answer = wallet value in grosze; "fewest coins" via `Task.check`. Would change: `check` does not reach the
   drag path.
7. Save format stays v2 (no field). Would change: a stored picture-mode toggle or wallet state → v3 → stop at open PR.
8. Art: coins and 12 icons already shipped; +12 expansion icons only if variety needs them; wallet drawn in code with a
   DESIGN-GAP. Would change: the author supplies wallet art.
