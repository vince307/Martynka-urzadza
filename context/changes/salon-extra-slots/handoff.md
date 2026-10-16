# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-impl-review` step of autonomous run `2026-10-15-fix-s16bcd`: full-plan review (phases 1–8) is APPROVED with 0 critical, 0 warnings, 5 observations, and `change.md` is `impl_reviewed`. The next agent must not get this wrong: only the [visual] row 3.7 (and [human] 6.4, 8.4 for later) remain; `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay untouched.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` (cut from main `a06795b`) |
| Commits | p1 4ac1460 … p8 9c41760, handoffs, plus this `docs(salon-extra-slots): impl review` commit; no fix commits (nothing CRITICAL or WARNING) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): 3.7 [visual], 6.4 [human], 8.4 [human] |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/reviews/impl-review.md` | impl-review report (verdicts, live-save probe, seams, teacher read, F1–F5 observations, `MERGE:` line) |
| `context/changes/salon-extra-slots/plan.md` | reviewer rows 1.5, 2.4, 3.6, 4.4, 5.3 ticked |
| `context/changes/salon-extra-slots/change.md` | status `impl_reviewed` |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

All observed in this step on `063e7fd` (+ docs only).

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 3076 passed, 170 files (main baseline 3063 + 13) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | 0 violations each |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` lists 38 distinct salon WebP files |
| `npx playwright test --config=<abs> --workers=4` | 121 passed (10.0 m) = main 117 + 4; no flake; ports 4397/4398 free afterwards |
| `validate-rule-files.sh` | PASS (417 paths) |
| `git diff --name-status main -- tests/fixtures src/core/migrations docs/human-checklist.md deploy designs .gitignore .claude` | empty |
| Live-save probe (temporary vitest file, deleted, not committed) | 10/10: v3 salons `tasksDone` 0..7 with mixed `chosen` decode unchanged, `currentTask` = `SALON.tasks[n]`, bought pieces keep their variant, lamp/plant/pouf shown 0 only after the stage, no free change / hold / hit of an unbought default piece, 7→12 purchases spend 58 and end done; v1/v2/v2-legacy/v3 fixtures decode ok |
| Deliberate break 1: `shownVariant` without the `stagesDone` check | `tests/roomShown.test.ts` 1 failed ("shows nothing unbought before the stage task is done"); restored |
| Deliberate break 2: `holdPoint` scan top = `slotBox(slot).top` | `tests/roomHit.test.ts` 2 failed ("lands at least half a step inside the scene …", "a slot fully above the scene has no hold point"); restored |
| `npm run check:deploy` (no URL, usage only) | imports resolve under `node --import tsx`; nothing fetched, never run against production |

Meta-check: break 1 proves the rule on synthetic data (the render path is proven by e2e break p6a); break 2 proves the scan-box clip, the real touch path is proven by e2e break p8. Both breaks were made after the e2e servers had built, and reverted before the final `npm run build`.

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- [visual] 3.7: salon at 1440 and 1024 — renovated room with the old lamp/plant/pouf, bare window before curtains, curtains above the shadows (`ROOM_LAYOUT.depth.shadows` 2), shelf partly behind the cabinet, the five variant panels (curtain thumbnails fit), pouf under the tray (VO1), done card at task 12 (`drawRoomMiniature` curtains ≈ 9 px above the tile only in miniature fallback mode, F5), a done S-16c salon without shadows/mode button until task 12 (F1); stand-ins with `?e2eArt=room` (F3, VO2).
- [human] 6.4 and 8.4 (iPad: "Wymień lampę" wording, hold on curtains near the top edge).
- Observations F1–F5 in `reviews/impl-review.md`; all already carried in `follow-ups/review-fixes.md` with `Trigger:` lines (F3 under VO2, F4 = L-R8/L-R11).

## 6. Autonomous decisions

1. **Review read the diff in the main context instead of the skill's two subagents**: the source diff is ≈150 lines in 12 files; fan-out would have added cost without coverage. Would change: a diff over ~20 source files.
2. **Triage decided in place** (no AskUserQuestion, contract rule 1): nothing CRITICAL or WARNING, so no fix commit; the five observations are recorded (`Decision: RECORDED`), each already in follow-ups. Would change: the visual gate finding F1/F5 visible as a defect.
3. **Live saves proven by a temporary probe test, not a committed one**: the existing pins (L-1 prefix, M-R4 order, `chosen.curtains` decode, roomShown) already cover the invariants; the probe confirmed them on realistic states. Would change: a later slice touching `chosen` semantics (then commit such a test).
4. **MERGE: CLEAR**: no hook bypass, no protected-path change, all suites green against the baseline arithmetic (unit 3063+13, e2e 117+4). Would change: a red visual gate.
