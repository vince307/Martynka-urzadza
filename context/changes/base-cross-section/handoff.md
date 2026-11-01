# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-impl-review` step of run `2026-10-31-space-base`. Phases 1-5 are committed, the review found one CRITICAL
(the e2e hook's `houseLabel` did not read the drawn label, so spec test 1 survived its named break) and fixed it in `c52c53c`;
`MERGE: CLEAR`. The next agent must not get this wrong: the visual gate must shoot frames (1)-(8) of plan row 4.6 on the
hook build after `c52c53c`; rows 2.7 and 4.10 stay open for the ship step.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | p1 `55c8c16`, p2 `7db029e`, p3 `0dbfcf9`, p4 `2bcc350`, p5 `f89cf1d`, review fix `c52c53c`, plus docs commits (this handoff included) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 6: 2.7 [reviewer CI at ship], 4.6 [visual], 4.7-4.9 [human], 4.10 [reviewer CI at ship] |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/base-cross-section/reviews/impl-review.md` | full-plan review (phases 1-5), 1 CRITICAL + 2 WARNING fixed, 3 OBSERVATION; ends `MERGE: CLEAR — …` |
| `src/ui/widgets/PageButton.ts` | new `text()`: the drawn label, null while hidden (as `target()`) |
| `src/scenes/RoomScene.ts` | `snapshot` reports `houseLabel: this.houseButton.text()` (was a second lookup by house id) |
| `tests/roomVisitWiring.test.ts` | guard pins `houseLabel: this.houseButton.text()` |
| `tests/e2e/base-cross-section.spec.ts` | test 2 asserts the star counter rises after Mostek (FR-046) |
| `context/changes/base-cross-section/follow-ups/review-fixes.md` | item 8 restores the `FIRST_ROOM` half of first-building-choice 18 and its trigger |
| `context/changes/base-cross-section/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (before and after the fixes) |
| `npm test` | `Tests  4185 passed (4185)` = baseline 4171 + 14 (before and after the fixes; one guard edited, none added) |
| deploy/ops shell tests, `sample` E1-E6 | OK, all rc 0 |
| `npm run build` + `check:build` | OK, `e2e hook: absent (2 chunks checked)` (before and after) |
| full e2e `--workers=3` (sandbox off) | `169 passed`, `12 failed`, `6 did not run` (41.9 m, timeouts / `cdpSession.detach` after timeout, none in this slice's specs) |
| `--last-failed --workers=1` | `18 passed (14.1m)` → 187 = 184 + 3 green |
| after fixes: base + house cross-section specs `--workers=2` | `7 passed (2.5m)` |
| save v6: `git diff 9a44799 -- src/core/save.ts src/core/migrations tests/fixtures` | empty |
| art: `git diff --stat 9a44799 -- public` | only `base-1-shell.webp` and `base-1-cell-closed.webp` added |
| hooks | `.claude/settings.json`, `.claude/hooks/*` untouched since 2026-10-12; no `--no-verify` |
| break (tdd p1): delete `'base-1'` label | `tests/houseCells.test.ts` red (`base-1: expected undefined to be truthy`), restored |
| break (tdd p3): drop `scene.stop(SCENE_KEYS.house)` in `TaskScene.backToChoice` | `tests/themeBackWiring.test.ts` red (`expected -1 to be greater than -1`), restored |
| break (e2e, handoff-named): `RoomScene.redraw` label fixed to `pl.house.open['house-1']` | BEFORE fix: test 1 stayed green (`1 passed`, hook build rebuilt) → CRITICAL F1. AFTER fix: red (`Expected: "Baza"`, `Received: "Dom"`), restored, green |
| meta-check | the old snapshot re-derived the label from the house id, so it proved the data, not the drawn button; now it reads `PageButton.text()`, the same text the child sees |

## 4. Next command

`visual gate`

## 5. Open

- [visual] 4.6: frames (1)-(8) on the hook build (port 4399), desktop 1440 and tablet 1024, into `reviews/visual-review.md`.
- [human] 4.7 Mostek celebration with no next module (D4); 4.8 shared house `cell-frame` in the base (gap 199) and "Wróć do pokoju" (D8); 4.9 real tablet, installed, offline: the base pictures draw.
- [reviewer] (CI at ship) 2.7: job `deploy`, step `Smoke check (deploy)`, expect `ok   precache covers house pictures — 5 of 5 house pictures precached` (seen as `3 of 3` in Deploy run 41261590741, job 124716473458). 4.10: job `build`, expect `Tests  4182 passed | 3 skipped (4185)` and `e2e hook: absent (` (seen as `4168 passed | 3 skipped (4171)` in job 124715797789).
- Design gaps 199, 200 new; 195 closed; 196 narrowed (`docs/design-gaps.md`). Follow-ups with triggers: `follow-ups/review-fixes.md`.
- Full e2e on this machine needs `--last-failed --workers=1` to re-judge load timeouts.

## 6. Autonomous decisions

- Read the ~200-line product diff in the main context instead of the skill's two subagents. Why: small diff, and the contract asks the step to verify itself. Would change: a diff too large to read whole.
- F1 fix at the source (`PageButton.text()` read by the snapshot) rather than strengthening only the spec. Rejected: a rendered-text pixel check (fragile). Why: the hook should report what is drawn, like `taskButton.text()` already does. Would change: none foreseen.
- F2 asserts "stars rise" after the reload (where a task is open) rather than before it (no unsettled task there, handoff p5 § 5). Would change: a spec helper that opens a fresh task without a reload.
- Change triage decided without asking (CRITICAL/WARNING fixed, OBSERVATIONs accepted); continuation option "Done". Would change: a maintainer asking for a separate triage.
- Roadmap row S-29 left at `planning` (ship/archive updates it).
