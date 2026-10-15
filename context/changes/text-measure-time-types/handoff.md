# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-implement` phase 2 of run `2026-10-15-fix-s14c-s14d`. Phase 2 is done and committed (INEQUALITY playable in E1.9, scene lights the tapped tile, hook fields, `answerWrong` fixed, design gap 98). The next agent must not get wrong: do not add the new snapshot field names (`correctChoices`, `markedTile`) to `vite/e2eHookGuard.mjs` (the snapshot ships in production, plan-review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 (`9507da3`), p2 `ab3d603` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | phase 2 rows 2.6 `[reviewer]` and 2.7 `[visual]` open, 1.5 `[reviewer]` open; phases 3-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/curriculum/E1.ts` | `E1.9.inequality_10` (tiles, max 10, four shapes); E1.9 now 3 skills, threshold 1 -> 2 |
| `tests/curriculum.test.ts` | `INEQUALITY` moved from `LATER` to `GROUP_1` |
| `src/scenes/TaskScene.ts` | field `reported` (right value tapped for the open task); `markCorrect` uses it when the task has `check`; snapshot `correctChoices`, `markedTile`; DESIGN-GAP 98 comment |
| `src/ui/widgets/AnswerTiles.ts` | `markedValue()` getter (what the widget paints as correct) |
| `tests/e2e/support/hook.ts` | `Snapshot.correctChoices/markedTile`; `answerWrong` takes a tile outside `correctChoices` |
| `docs/design-gaps.md` | row 98 |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2495 passed = baseline 2491 + 4 (E1.9 inequality skill in solvableInMode / contentInvariants per-skill tests) |
| `sample` E1-E6 | exit 0 each; E1.9 shows 6 inequality tasks |
| `npm run build` | OK, `e2e hook: absent`; `tests/fixtures/` untouched |
| e2e `npx playwright test --config=... --workers=4` | 82 passed = baseline 82 + 0, run in this session (5.3 min) |
| Deliberate break | removing `E1.9.inequality_10` -> `tests/curriculum.test.ts` red: `AssertionError: E1.9 INEQUALITY: expected false to be true`; restored. Meta-check: it proves type coverage, not the scene (phase 10 does) |
| Teacher read E1.9 `--count 6` | prompts "Jaka liczba pasuje do okienka? 1 + □ > 4", tiles near the boundary (e.g. 2/3/6/8, two fit), hints "więcej niż 3" / "mniej niż 4" correct, last line "Na przykład 1 + 8 = 9, a 9 > 4. Pasuje 8."; speech "jeden plus okienko większe niż cztery" / "mniejsze niż" good |
| Specs that may now draw INEQUALITY | E1 rounds (E1.9 is a current-step skill from stage start 9+ or in earlier-step buckets): `first-launch.spec` (age 6 round), `task-round.spec` if on E1, `minigames.spec`, `save-restart.spec`, `save-backup-health.spec`, `save-transfer-blocked.spec`, `adaptive.spec` (mastering E1 steps); all use `answerWrong`/`answerRight`, which now skip every right tile |

## 4. Next command

`/10x-tdd text-measure-time-types phase 3` (phase 3, `Driver: tdd`)

## 5. Open

- `[reviewer]` 1.5, 2.6 teacher reads (done informally above); `[visual]` 2.7 screenshots (tapped non-canonical green tile, wrong tile with hint, steps, retype; 1440x900 and 1024x768).
- `[human]` rows 4.8 and 9.6 as before.
- Retype keeps highlighting `task.answer` (one example); `check` accepts any right tile.

## 6. Autonomous decisions

1. **`reported` is a scene field keyed by task index**, set in `submit` only when `check` accepts the value, so a re-render paints the same tile and a new task never inherits it. Rejected: storing in core state (more churn). Would change: a second multi-right type needing state in core.
2. **`correctChoices` only for `tiles` input with `check`** (null otherwise), so EVEN_ODD select stays `null`. Would change: a select task wanting it.
3. **`markedTile` reads `AnswerTiles.markedValue()`**, the widget's own painted value (plan requirement), not a scene field.
4. **E1.9 skill uses all four shapes with `max: 10`.**
