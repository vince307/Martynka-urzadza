# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the orchestrator of run `2026-10-14-fix-art-stand-in` after e2e phase 8: the phase agent wrote the spec and break patches (request-file protocol, Chromium could not launch in its session); the orchestrator ran them, committed the spec (`0f1a43b`) and ticked rows 8.1-8.5. Next is e2e phase 9 (risk #2, import/reset with an unread save).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + p1 `3be41c7` + p2 `b459bc8` + p3 `d3fa403` + p4 `00e90b6` + p5 `d36b952` + p6 `4b7b9dd` + p7 `33f0771` + p8 `0f1a43b` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 7.6 `[reviewer]`; 4.5, 5.6, 6.6 `[visual]`; 6.7, 7.7 `[human]`; phase 9 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `CLAUDE.md` | one sentence in "Current state" about the stand-in, art health, filter, `deviceSaveView`, `?e2eArt`, gaps 66-68 |
| `context/changes/art-stand-in-and-load-signal/follow-ups/review-fixes.md` | S14-05..S14-10, S12-02..S12-15, S13-*, raw copy in dialog, M-1/M-2/M-13/H-3/H-4 each with `Trigger:`; closed items listed |
| `context/changes/art-stand-in-and-load-signal/plan.md` | threshold-rule text for E5.5 reconciled with the code (line in Critical Implementation Details, the `artFilter` test line, Known risks); rows 6.4, 7.1-7.4 ticked |
| `src/core/round/pick.ts` | header comment on the optional `blocked` argument (comment only) |
| `tests/e2e/art-stand-in.spec.ts` | p8: 4 tests for risk #11 (money labels, weight labels, "Obrazki" panel line, `?e2eArt=corrupt` counts as missing) |
| `context/changes/art-stand-in-and-load-signal/e2e-request-p8.md`, `e2e-break-p8a/b/c.patch` | p8 request file and break patches |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| `npm test` | 1899 passed (branch baseline 1899, delta +0); deploy and ops shell tests OK; `sample` E1-E6 exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS (9 files, 271 paths) |
| Deliberate break | `CLAUDE.md` path `src/core/artHealthh.ts`: validator `FAIL ... missing: 1`; restored, PASS. Meta-check: the validator reads paths from the rule files, so it proves the doc points at real files |
| e2e (p7) | not run: the sweep changed one comment only (`pick.ts`) |
| e2e (p8, orchestrator) | `art-stand-in` 4 passed; full suite 50 passed = 46 + 4; build `e2e hook: absent (2 chunks checked)` |
| p8 breaks (orchestrator) | p8a label from key: (a) ✘, (b) ✘ (each run alone; serial mode stops at the first failure); p8b health from `loaderror` only: (d) ✘ `Expected: > 0, Received: 0` — decode failure emits no `loaderror`, S14-04 proven in a browser; (c) ✘; p8c no `artHealth` to the panel: (c) ✘ `toBeVisible`; all restored, `git status src` clean |

Seam sweep result: no `split('/').pop()` for player text; the label comes only from `TASK_ART.label`; the threshold formula exists once (`unlockThreshold`, used by `unlockReady` and the filter call in `buildAdaptiveRound`); `REGISTRY_KEYS.artHealth` is outside `SAVE_KEYS`; gaps 48/49/66/67/68 consistent.

## 4. Next command

`/10x-e2e art-stand-in-and-load-signal phase 9`

## 5. Open

- Reviewer rows listed in §1; visual rows 4.5, 5.6, 6.6 (stand-in, "Obrazki" line and import/reset dialogs unseen); human rows 6.7 (FR-022) and 7.7 (FR-013 round composition).
- Follow-ups in `follow-ups/review-fixes.md` (file, no symbols changed).

## 6. Autonomous decisions

0. **p8 committed by the orchestrator** from the agent's request file (same content, no edits), after the green run and the three breaks. Plan rows 8.2-8.4 named `p7a-c` patches; renamed to the real `p8a-c` files.

1. **E5.5 plan text vs rule**: the implemented rule keeps `current` filtered when at least `ceil(share*n)` skills remain; with only the half-litre jug missing E5.5 drops the jug skill (1 of 2 >= 1) and the weight skill still unlocks the step. Plan text said E5.5 stays unfiltered; changed the text, not the behaviour (the test `artFilter.test.ts` already states the rule). Would change: the maintainer wanting E5.5 never filtered, then `minCurrent` becomes n.
2. **No e2e re-run** after the comment-only code change. Would change: any behavioural diff.
3. **Follow-up descriptions** taken from the audit's table, not from the plan's shorthand, because the plan's grouping text did not match the finding titles.
