# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-plan-review fox-guide` of run 2026-10-23-fox-guide: the plan was checked against the code, five
warnings were fixed in `plan.md` (none critical), verdict PROCEED, `change.md` is `plan_reviewed`. The next agent must
not let the guide update sit at the end of `TaskScene.render` (two branches return early), must re-apply
`setDisplaySize` after every `setTexture` in `GuideFox` (review F2), and must keep `balance.loader` values and the
budget test's `HEADROOM_MS` unchanged (review F5).

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | 4 on the branch after this step: identity, research, plan, `docs(fox-guide): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/reviews/plan-review.md` | plan review report: verified claims, follow-up triggers, findings F1–F9, `VERDICT: PROCEED` |
| `context/changes/fox-guide/plan.md` | fixes F1 (`pictureLayout(spec, input, solution, shape)` order, tall only over `TALL_MODES`), F2 (`GuideFox` sizing after `setTexture`), F3 (popped-rect ≥ 8 px assertion), F4 (`tests/e2e/support/hook.ts` `Snapshot.guide?`), F5/F6 (Known risks), F7 (CLAUDE.md `npm run art` line), F6 follow-up item; Progress rows unchanged (24) |
| `context/changes/fox-guide/change.md` | frontmatter `status: plan_reviewed` |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| boot payload re-measured (`stat` over `public/assets/{tasks,rooms,ui}` WebP, `public/fonts/MartynkaNext.ttf`, boot M4A) | 473 968 + 1 489 688 + 119 288 + 114 640 + 132 243 = 2 329 827 B → 46.6 s; + 42 384 B fox estimate → 47.4 s ≤ 48 s (matches the plan) |
| `git ls-files public/assets` | tasks 41, rooms 38, sounds 26, ui 5 committed → the budget test reads only committed files, never `designs/` (deterministic in CI) |
| layout clearance (read from `TASK_LAYOUT`, `HUD_LAYOUT`, `MINIGAME_LAYOUT`, `SUMMARY_LAYOUT`, `UNLOCK_LAYOUT`, `SettingsHint`) | nearest at rest: tall solution lines 14.5 px, counter grown 22.6 px, right edge 17.4 px; popped (1.06): 9.85 / 9.4 / 10.7 px — details in the review |
| `SalonBackdrop.render`, `TaskScene.create` input listeners, `render()` returns, `RoundPhase` | backdrop capture excludes scene objects; only scene-level listeners take taps; two early-return branches; five phases mapped |
| Progress ↔ Success Criteria | 24 rows, one per bullet; every phase has `Driver:`; drivers right |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-implement fox-guide phase 1`

## 5. Open

- Manual rows (human checklist): 3.5 `[visual]` idle/cheer/think on a tiles task; 4.5 `[visual]` full state matrix
  desktop 1440 + tablet 1024 + 420 × 760 rotate overlay; 4.6 `[human]` accept the fox's place and size (P-1, P-2,
  departs from FR-037's literal "w rogu zeszytu"); 4.7 `[human]` real tablet sharpness / pop / 0-star cheer; 4.8
  `[reviewer] (CI at ship)` PR job `check` log.
- DESIGN-GAP rows 165–168 planned for phase 3 (`docs/design-gaps.md`); 168 also names the "Obrazki" sentence
  (`pl.settings.uiArtMissing`) being inexact for a missing fox (review F6).
- Follow-ups planned for phase 4 in `context/changes/fox-guide/follow-ups/review-fixes.md` (breathing, unlock card, 512²
  art, boot budget headroom, fallback anchor x 1802, `modeWidgets` left open, `uiArtMissing` wording).
- Follow-up trigger to watch: an edit of `src/testing/e2eHook.ts` fires the narrator-round-summary follow-up (null
  targets while the room is open) — the plan expects no edit there.
- Risk: real fox WebP bytes may break `tests/bootBudget.test.ts` in phase 1 → step down to 352²/320², never touch
  `totalMs`/`HEADROOM_MS` (plan Known risks).
- Risk: the unlock-card e2e road (`health-lines.spec.ts` `#14 U-1`) is slow and flaked under load before.

## 6. Autonomous decisions

- Verdict PROCEED (not RETHINK): every risky claim (placement, input, backdrop, pose map, budget, CI determinism)
  held against the code. Would change: a layout element right of x 1700 above y 400, or Phaser hit-testing
  non-interactive images.
- F2 fixed in the plan rather than left to the implementer: a 10× fox over the task on a partial cut load is a visible
  child-facing defect. Would change: none.
- F3 fixed with an 8 px popped floor (not 12): the 12 px rest gap cannot hold at 1.06 without moving the fox, and the pop
  lasts 120 ms. Would change: the visual gate seeing contact during the pop.
- F5: fallback is smaller art (352², 320²), never a larger `totalMs` — follows P-3. Would change: the maintainer
  accepting a longer cold-start limit.
- F6 recorded, not fixed: scope item 8 forbids player/parent text changes. Would change: the maintainer asking for a
  fox-specific line.
- Product decisions P-1/P-2/P-5 not overturned: defensible and already in `[human]` rows 4.6/4.7.
- `/10x-plan-review`'s "how to proceed" and per-finding triage questions were not asked (no human): warnings with an
  obvious fix were applied, observations recorded, per the step prompt.
