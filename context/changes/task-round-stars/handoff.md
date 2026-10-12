# Handoff — `task-round-stars` (slice S-04)

Written by the `/10x-new` step of autonomous run 2026-10-12-s04-s08. The change folder exists with `change.md`
(identity, roadmap-claim corrections, design binding, triggered follow-ups, decisions); no research, plan or code yet.
The next agent must not show `hint[0]` blindly after a first mistake: it gives the answer away in 55–100% of tasks of
many types (measured, see `change.md` § Roadmap claims vs repo now).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 1 (`docs(task-round-stars): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/task-round-stars/change.md` | Change identity: notes and sources, roadmap claim / repo now / correction table (11 rows), design binding (kit views, copy keys, tokens, kit↔plan conflicts, DESIGN-GAP candidates), migration statement (none), triggered follow-ups with scope take, 6 autonomous decisions, open questions for research |
| `context/changes/task-round-stars/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/task-round-stars` |
| `node --import tsx $TMPDIR/s04/hints.ts` (throwaway script, not committed: 50 seeds × every skill E1–E6, counts one-line hints, `hint[0]` containing the answer, `choices` presence, answer modes) | e.g. MISSING 150/150, COMPLEMENT 150/150, DIV 350/350, ADD_SUB 576/1050 first hints contain the answer; ADD_SUB/MISSING/BONDS/CHAIN/WORD/COMPLEMENT return no `choices` |
| `grep "'select')" src/data/curriculum/*.ts` | `E1.6.even_odd_select_10`, `E3.7.select_even_30` |
| lint / typecheck / unit / build / e2e | not run: docs-only step (no code touched); baseline on main per contract `58244a5`: lint OK, typecheck OK, unit 441 passed, build OK, e2e 1 passed — inherited, unverified |

No deliberate break: nothing testable was written in this step.

## 4. Next command

`/10x-research task-round-stars`

## 5. Open

- Research questions are listed in `change.md` § Open questions for /10x-research (e2e build + hook + `webServer` ownership by `/10x-e2e-setup`, `choices` wiring for E1, `'select'` mode, answer comparison, Phaser 4 UI scene / tweens / touch, font).
- DESIGN-GAP candidates (not yet written; `docs/design-gaps.md` does not exist and is created by the implementing step with the first gap comment): `'select'` multi-tile mode, round end before S-05's summary, "type the result again" state, task/room switch before S-09. Kit↔plan conflict on hint/steps buttons vs automatic hints (plan wins).
- Follow-ups triggered by S-04: `context/archive/2026-10-12-generators-remaining-stages/follow-ups/review-fixes.md` (E1 tiles) and `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` F14 (`generateMissing` first hint) — both in scope. Wider "first hint leaks the answer" for COMPLEMENT, DIV, COMPARE_DIFF, HALF, ROUNDING, WORD, part of ADD_SUB/MULT → this slice's `follow-ups/review-fixes.md` with `Trigger: S-17`, unless research shows masking is enough.
- Manual (maintainer, iPad): touch reaction < 100 ms (NFR) — not measurable in headless Chromium.
- `context/foundation/test-plan.md` §3 phase 5 still says "not started" though the seed e2e exists (stale row; the test-plan owner updates it when phase 5 lands with this slice).
- No `lessons.md` in `context/foundation/`.

## 6. Autonomous decisions

1. **Task source until S-06/S-07: default stage E3 from `src/data/balance.ts`, uniform pick over the stage's skills, no unlocking.** Rejected: all stages; a URL stage parameter in production; waiting for S-07. Why: the daughter is in E3–E4, S-07 replaces one `core` function with weights. Would change: research finding US-01 needs unlocked steps now, or e2e needing a stage choice (then e2e build only).
2. **Task/room switch not drawn in S-04; star counter is.** Rejected: a "Do pokoju" button leading nowhere. Why: room arrives in S-09, summary in S-05. Would change: maintainer wanting a greyed-out switch now, or S-05 needing it earlier.
3. **Hint policy in `core`: first mistake shows `hint[0]` only when it does not contain the answer (≥ 2 lines), else "Spróbuj jeszcze raz" alone; second mistake shows all steps, then the child types the result without a star. F14 fixed in `generateMissing` (inverse with □, then with the result).** Rejected: always `hint[0]`; rewriting hints of ten generators now. Why: CLAUDE.md rule on hints, testable in TDD. Would change: masking a one-line hint (`… = ?`) proving good enough, or the maintainer asking for full school-method hints for E3–E4 now.
4. **Round end: +2 bonus to the counter and the next round starts; the summary stays in S-05.** Rejected: an own end screen with invented copy. Why: FR-010 belongs to S-05; the e2e hook exposes "round finished". Would change: the plan finding the bonus invisible without a minimal summary (then kit keys „Brawo!”, „Kolejna runda”).
5. **Next step is `/10x-research`, not the skill's default `/10x-plan`.** Why: fixed by the step prompt, and the e2e build/hook, `choices` wiring and Phaser 4 questions need exploration. Would change: nothing in this step.
6. **Clipboard copy skipped** (unattended run, no receiver); the command is in §4. Would change: an interactive session.
