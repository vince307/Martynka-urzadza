# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-plan-review` step of run 2026-10-24-audit-backdrop-fox: verdict PROCEED (SOUND), four small gaps fixed in `plan.md`, `change.md` is `plan_reviewed`. The next agent must count and log a `restore` render at the top of `SalonBackdrop.render`, before the `plain` early return (review F1), and must keep `'guide'` out of `pl.settings.artFallbackNames` (the `fallback` line is typed `DrawnFallbackWhere`).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 4 on top of `e020886`: change identity, research, plan, `docs(audit-backdrop-fox): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 30 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/reviews/plan-review.md` | plan review: grounding, driver check, follow-up check, F1-F4, `VERDICT: PROCEED` |
| `context/changes/audit-backdrop-fox/plan.md` | in-plan fixes: phase 3 § 1 (`restore` counted and logged before the `plain` return, F1), phase 3 § 2 (absent-backdrop record reads `renderer` from the game, F3), phase 4 § 4 (ASL-02..09 and stale-tab G-2/G-3/B-4/B-5 named in the re-record list, F2), `## Known risks` (phase-6 abort adds cause/advice/code lines, F4). Progress rows unchanged (30) |
| `context/changes/audit-backdrop-fox/change.md` | status `plan_reviewed` |
| `context/changes/audit-backdrop-fox/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-backdrop-fox` |
| python check of each phase's Success Criteria vs Progress rows | 30 = 30, identical text; drivers `tdd, impl, impl, impl, e2e, e2e` |
| Phaser 4.2.1 source read | `dispatchContextRestored`: framebuffer wrappers recreated, `contextLost = false`, then `emit(Events.RESTORE_WEBGL)`; `snapshotArea` with `drawingContext` → `snapshotFramebuffer` → synchronous `WebGLSnapshot`; `GameObject.destroy` destroys `filterCamera` |
| `grep` of `FallbackWhere`/`uiArtMissing`/`artFallbackNames` users | every caller is in the plan's phase 1 list |
| `ArtHealth.missing` vs `UI_ART_KEYS` | missing holds texture keys (`ui/fox-*`), so `noStandIn` matches |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no product code; baseline per the agent contract (`main` `e020886`, unit 3891, e2e 155), inherited, unverified here |

No deliberate break (nothing to protect yet).

## 4. Next command

`/10x-tdd audit-backdrop-fox phase 1`

## 5. Open

- Phases: 1 tdd (`guideAvailable` in `src/core/guide.ts`, `guide` line + `standIn` in `artHealthLines`, `pl.settings.guideMissing`), 2 impl (`GuideFox` constructor rule, `recordFallback('guide')`, `requested`, `UIScene.openSettings` `noStandIn`), 3 impl (`SalonBackdrop` `BackdropSnapshot`/`pixel()`, `RESTORE_WEBGL` listeners in `TaskScene`/`WelcomeScene`, hook getter `backdropPixel`, Phaser pin, `tests/backdropRestoreWiring.test.ts`), 4 impl (C-1, gap 168, CLAUDE.md, follow-ups, sweep, visual), 5 e2e (`tests/e2e/backdrop-restore.spec.ts`, +3), 6 e2e (`tests/e2e/fox-guide.spec.ts` describe "one pose missing", +2).
- Manual rows (human checklist): 4.7 `[human]` accept the parent wording (`pl.settings.guideMissing`, `uiArtMissing` `standIn`); 4.8 `[human]` accept the G-2 proof form (`page.route`, not a new `e2eArt` seam value); 4.9 `[visual]` desktop 1440 + tablet 1024 matrix; 4.10 `[reviewer] (CI at ship)` job `check` log.
- DESIGN-GAP: row 168 amended in phase 4; no new row.
- Follow-ups go to `context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` in phase 4 (list in plan phase 4 § 4, now including save-reason-and-recovery ASL-02..09 and stale-tab-and-health G-2/G-3/B-4/B-5).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **R-1 Verdict PROCEED, no RETHINK.** Why: the restore approach is confirmed by the Phaser 4.2.1 source and every phase is independently green. Would change: a phase finding `restorewebgl` emitted before framebuffers exist, or the redraw needing a deferred frame.
- **R-2 Risky claims verified directly instead of through a sub-agent** (skill step 3). Why: the claims sit in a handful of files read in full; a sub-agent would re-read the same. Would change: a plan touching many modules.
- **R-3 Scope item 6 departure (`page.route` instead of an `e2eArt` seam or unit-only) kept**, not overturned. Why: precedent `#14 G-1`, no test-only product code, unit table backs it; `[human]` row 4.8 names it. Would change: the maintainer asking for the seam.
- **R-4 Drivers unchanged**: phase 1 tdd (no `guideAvailable` in `src/`), 2-4 impl, 5-6 e2e after the phase-4 sweep (`E2E=on`). Would change: the implementation found present (then tdd → impl per contract rule 6).
- **R-5 F1-F4 fixed in plan, none to Known risks except F4 by nature.** Would change: nothing.
