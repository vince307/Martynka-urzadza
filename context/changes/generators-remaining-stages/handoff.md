# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-plan` step of run `2026-10-12-s03-remaining-stages`. `plan.md` (10 phases, 30 Progress rows) and
`plan-brief.md` exist; nothing is implemented. The one thing not to get wrong: phases 6 and 9 CHANGE the local gate's
unit command (sample E1–E4, then E1–E6, exact text in `plan.md` § Implementation Approach); the profile, env and
`ci.yml` are only updated in phase 10, so until then the orchestrator must take the gate command from the plan, not the profile.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | 4 on the branch after this step: change identity, handoff state, research, `docs(generators-remaining-stages): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 30 (`grep -c '^- \[ \]' plan.md`): 24 automated, 6 manual (4 `[reviewer]` incl. 1 `(CI at ship)`, 2 `[human]`) |
| Roadmap | S-03 `proposed → planning` (At a glance + item body), committed with the plan |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's (contract: counts as clean, never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/generators-remaining-stages/plan.md` | Full plan: 10 phases with `Driver:` lines, gate-command changes, `## Autonomous decisions`, `## Progress` |
| `context/changes/generators-remaining-stages/plan-brief.md` | Two-page brief: decisions table, phases at a glance, risks |
| `context/changes/generators-remaining-stages/change.md` | Frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-03 status `planning` |
| `context/changes/generators-remaining-stages/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/generators-remaining-stages` |
| `gh run view 38278623270 --log` (CI job `check`, branch `docs/autonomous-run-profile`) | seen lines `##[group]Run npm run sample -- E4` and `Naruszenia: 0` — basis of the `[reviewer] (CI at ship)` regex in Progress 10.5 |
| `grep -c '^- \[ \]' plan.md` | 30; every Success Criteria bullet maps 1:1 to a Progress row (checked per phase) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched, status advanced |
| Local gate (lint, typecheck, test, build) | not run — docs-only step, no code changed; baseline per contract `Tests 236 passed` (inherited, unverified) |

No deliberate breaks (nothing testable changed).

## 4. Next command

`/10x-plan-review generators-remaining-stages`

## 5. Open

- Phase drivers: 1–5 `tdd`, 6 `impl`, 7–8 `tdd`, 9 `impl`, 10 `impl` (seam sweep in 10). E2E=off: no `e2e` phase.
- Gate command changes: phase 6 → unit gate with `npm run sample -- E1 && npm run sample -- E2` added; phase 9 → plus E5, E6; phase 10 writes it to `context/foundation/autonomous-run.md` § 2, `autonomous-run.env` `GATE_UNIT`, `.github/workflows/ci.yml`.
- Manual rows (human checklist): 6.4 / 9.4 / 10.4 `[reviewer]` teacher read `npm run sample -- <stage> --count 6` (E1, E2, E5, E6); 10.5 `[reviewer] (CI at ship)` job `check` lines matching `##\[group\]Run npm run sample -- E[1256]$` each ending with `Naruszenia: 0`; 10.6 `[human]` maintainer reads the same printout before merge; 10.7 `[human]` accept E1 `keypad` vs ZADANIA §4 tiles.
- Small-space exceptions (`SMALL_SPACES` in `tests/contentInvariants.test.ts`) take the values measured in phase 6 (research: 9 for `E1.7.complement_10`, ~11 for `E1.6.even_odd_single_10`).
- Risk: E5.4 MULT ·0/·1 measured 32.8 % vs 35 % threshold — fix data, not threshold, if it trips.
- Weekday case forms (`Weekday.after` / `before` in `src/data/calendar.ts`) are visible only to the teacher read.
- Follow-ups to write in phase 10 (`follow-ups/review-fixes.md`): E1 tiles (`Trigger: S-04`), February (`Trigger: S-17`), BONDS pairs-to-10 and CHOOSE_OP with a picture (`Trigger: S-13`), E1–E2/E5–E6 content polish (`Trigger: S-17`). F14 stays S-04, F10 S-07, F6 `deploy/`.
- No `context/foundation/lessons.md` (nothing to apply). DESIGN-GAPs: none.

## 6. Autonomous decisions

1. **10 phases instead of research's 7; slice not split.** Rejected: 7 phases (one with 2 generators + 2 ADD_SUB fixes, one with 4 large-number extensions); splitting S-03. Why: each phase is a fresh agent, ≤ 2 new generators or ≤ 3 small extensions per phase keeps every phase green alone. Would change: plan-review judging a phase too large or too small (merge 7+8).
2. **Profile/env/CI in a separate final phase 10** (step prompt). Phases 6 and 9 name the exact new command. Would change: an orchestrator rule requiring `ci.yml` parity per phase.
3. **February skipped in `monthDays`.** Rejected: "28 or 29" answer. Why: catalogue E5 says 30/31 days; multiple answers need a `check` the screen does not have. Would change: S-04 supporting several correct tiles.
4. **EVEN_ODD `min: 0` in E1.6, exception with measured value.** Rejected: `max: 12` (11–12 belong to E1.10). Would change: a measurement in phase 6 different from ~11 — the measured value is written.
5. **E1 numeric answers `keypad`, against ZADANIA §4 ADD_SUB literal "3–4 kafelki (E1)"** — `[human]` row 10.7 and follow-up `Trigger: S-04`. PRD FR-006 allows tiles or keypad. Would change: S-04 requiring tiles for E1 before M2.
6. **Per-id `MIN_DISTINCT` exceptions**, no global threshold change. Would change: a faithful step variant with ≥ 12 tasks.
7. **`formatNumber` from 10 000 with U+00A0, one shared number pattern.** Rejected: grouping from 1000, plain space. Would change: an S-04 typography decision (one function + one pattern).
8. **MULT hint for multiples of 10/100 in scope; COMPARE_NUM `step: 10` out.** Why: current halving hint is correct but not the school method; E2.7 is covered by COMPARE_NUM `{ max: 100 }`. Would change: impl-review judging the hint unnecessary.
9. **CHOOSE_OP kinds limited to `sum`, `left`, `moreBy`.** Why: one direct operation per text in E1. Would change: a step needing "choose the question" — a later variant.
10. **F12 only for `a ≥ 20`.** Why: `10 − 10 = 0, 0 + 3 = 3` is not a method for E1. Would change: teacher read preferring another method for E4.4.
11. **Roadmap `planning` committed with the plan** (contract clean tree beats the skill's "leave uncommitted").
12. No questions asked (contract rule 1); complexity HIGH, all open product questions from research answered with its recommendations (decisions 3–5).
