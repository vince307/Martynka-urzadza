# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by the `/10x-plan` step: `plan.md` (9 phases, Progress 57 rows) and `plan-brief.md` are written, `change.md` is
`planned`, the roadmap has S-13 → `planning` and a new S-13b (proposed). No product code yet. The reviewer must hold the
ordering rule: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts`
`answerRight`/`answerWrong` can answer it (phase 6 `select`, phase 8 `drag`), and the step order changes only in phase 5.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | 3 on top of `b57433c`: change identity, research, `docs(drawn-widget-tasks-e3-e4): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 57 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/drawn-widget-tasks-e3-e4/plan.md` | Plan: 9 phases with `Driver:` lines, Critical Implementation Details (model contract, `?e2eSkills` seam, `blockDrag` reducer, `pictureLayout`), Autonomous decisions 1–14, Progress |
| `context/changes/drawn-widget-tasks-e3-e4/plan-brief.md` | Two-page brief (decisions table, phases at a glance) |
| `context/changes/drawn-widget-tasks-e3-e4/change.md` | Frontmatter only: `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-13 `proposed → planning` (table, body, next-steps row); new S-13b `drawn-grid-tasks-e3-e4` (table row, body section, next-steps row, stream E chain) |
| `context/changes/drawn-widget-tasks-e3-e4/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/drawn-widget-tasks-e3-e4` (observed) |
| Mapping check (python over `plan.md`): Success Criteria bullets vs Progress rows per phase | 1:4/1, 2:4/1, 3:3/1, 4:3/3, 5:6/3, 6:4/2, 7:3/1, 8:6/6, 9:6/0 — one-to-one (observed) |
| `grep -A2 '^## Phase' plan.md` | every phase has `Driver:` + `Driver why:` as its first lines (tdd 1,2,3,7; impl 4,5,6,8; e2e 9) |
| `metadata-guard.mjs inspect` → `mark-planned` | `{"changed":true}`; status `planned` |
| File anchors named in the plan (`tests/generateTask.test.ts`, `hints`, `validate`, `pick`, `roundView`, `warmup`, `placement`, `e2eHookGuard`, `curriculumPick` for `distinctTasks`; `pl.round.okKey`; `REGISTRY_KEYS`; `E2E_HOOK_MARKERS`) | exist (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main `b57433c` per contract: unit 1247, e2e 37 — inherited, unverified) |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan-review drawn-widget-tasks-e3-e4`

## 5. Open

- `[human]` Progress rows (post-run checklist): 4.6 clock notation "15.00" vs kit "3:30"; 5.9 scope vs roadmap literal
  (no number line / written column / graphs / shapes; grid → S-13b; DATA in); 8.10 real-tablet drag and select feel;
  8.11 decisions vs ZADANIA (no hand drag, tap-to-add, parent preview without picture); 8.12 text and `childName` acceptance.
- DESIGN-GAP rows planned 52–58 in `docs/design-gaps.md` (52 picture beside keypad, 53 bar chart, 54 select view revising 7,
  55 drag tray/mat, 56 measured segment, 57 solution lines beside picture, 58 parent preview without picture).
- New e2e seam `?e2eSkills` (phase 6): marker `e2eSkills` in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`; registry key must be
  `REGISTRY_KEYS.forcedSkills` (a key named like the marker would ship in `dist/`).
- Phase 4 screenshots may need to move to phase 5 (no seam to force CLOCK/LENGTH before phase 6 and no data before phase 5)
  — plan Known risks.
- Follow-ups to write in phase 8 (`follow-ups/review-fixes.md`): S-13b items, BONDS/CHOOSE_OP re-trigger, on-picture hint,
  visual in parent preview (v2), number-line hint (S-14), regrouping/hundreds on the mat.
- Plan-review attention points: phase 5 size (2 widgets + data + pinned tests + 2 e2e specs); `TaskScene` temporary
  `throw` for `select`/`drag` (phases 1→6/8); calendar-start oracle from research § 3 (a) hand-derived only for October.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Split kept with `drag`: 9 phases fit (research reversal "> 9 phases" did not fire); S-13b added to the roadmap in this
   commit. Rejected: grid in S-13 (12+ phases), `drag` to S-13b. Reverses if phase 8 overruns an agent's context → phases
   7–8 move to S-13b.
2. DATA: bar chart, 3–4 bars, values 1–10, no ties, labels from new `src/data/charts.ts`. Rejected: up to 20, pictogram,
   table. Reverses on a teacher read or a `[visual]` finding the axis unreadable.
3. Solution lines beside the picture (`pictureLayout`), picture stays visible. Rejected: hiding the picture. Reverses if
   the right column is too narrow for > 3 lines.
4. No on-picture hint highlight (follow-up). Reverses on a teacher read asking for it.
5. Own `blockDrag` reducer; tap on tray adds, tap on mat removes. Rejected: Phaser drag, drag-only, "clear mat" button.
   Reverses on a tablet test with accidental adds.
6. Build without hundreds (max 99, 9 per kind, no regrouping). Reverses if a child is stuck on E4.8.
7. CLOCK as 3 string tiles ("15.00"); 24-h as afternoon face → 13–23. Rejected: keypad, word forms, clock-face tiles.
   Reverses on a teacher read preferring words.
8. LENGTH integers only (cm E3, mm E4), m↔cm as text. Reverses for a step needing decimals (E5+).
9. New `?e2eSkills` seam (research assumed none): deterministic select/drag specs need it. Reverses if an existing way to
   force a task in the hook build is found.
10. Step order changes once (phase 5); teacher read of phases 2–3 from test-printed draws, full `sample` read in 5 and 8.
11. Helpers learn a mode in the phase that admits it (6, 8); research decision 5 (correctness, not preference).
12. No save change; parent preview without picture (gap 58, follow-up `Trigger: first save-format change (v2)`).
13. Phase drivers: tdd 1, 2, 3, 7; impl 4, 5, 6, 8 (≤ 2 new UI components each; `TaskPicture` is a dispatcher); e2e 9.
14. Ran the skill without `AskUserQuestion` (contract rule 1): complexity HIGH, 0 questions — research + step prompt settled
    every open choice; the plan's own choices are 2–9 above. Reverses: none — process rule.
