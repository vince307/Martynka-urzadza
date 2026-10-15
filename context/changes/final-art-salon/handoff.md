# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-plan-review` step: plan reviewed (deep, verdict PROCEED), fixes applied to `plan.md`, nothing
implemented. The next agent must not get wrong: the remap (rule B, phase 2) must give **every** furniture task in the
new prefix a `chosen` entry (carried variant or 0), otherwise gifted furniture is invisible (`chosen[slot.id] ===
undefined` = empty in `src/core/roomHit.ts`); and room layers use depth `z` (0–99) with controls above from
`ROOM_LAYOUT.depth`.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | 5 on the branch after this step's commit (change identity, research, plan, plan fix, `docs(final-art-salon): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`), 0 done |
| Working tree | clean after the commit (only this step's files staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-art-salon/reviews/plan-review.md` | Review report: 2 critical, 4 warnings, 4 observations, each with Decision; ends `VERDICT: PROCEED` |
| `context/changes/final-art-salon/plan.md` | Fixes F1–F7, F9 applied; new `## Known risks` (F8, F10, F6 fallback); `[human]` 2.5 and 4.3 rewritten in phase and Progress |
| `context/changes/final-art-salon/change.md` | `status: planned` → `plan_reviewed` |
| `context/changes/final-art-salon/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-art-salon` |
| Progress ↔ criteria (python over `plan.md`) | phases 1–10: criteria = rows (3, 5, 5, 7, 4, 4, 4, 3, 4, 4); one `## Progress`; no checkboxes in phase bodies |
| Remap arithmetic re-done | old cumulative 5…96 vs new 5, 12, 21, 31, 43, 56, 71 → 0,1,2,3,4,5,6,6,7,7,7 (matches plan); old 9/10 exceed 71 (F2) |
| `du -cb /etc/hosts` | `du: invalid option -- b` (F5 evidence) |
| Code greps | `repairCurrentRoom` in `src/main.ts` `start`; `summarize` in `UIScene.openImport`; `saver.current()` = registry snapshot; `TaskScene.shake` unguarded; `getPixelAlpha` in Phaser 4 types; depths `RoomView.outline` 1, `RoomDoneCard` 5 |
| lint / typecheck / tests / build / e2e | not run: review step, no code changed (baseline on main `334ff69` inherited, unverified here) |

## 4. Next command

`/10x-tdd final-art-salon phase 1`

## 5. Open

- Human checklist: `[human]` 2.5 remap rule B (gifted furniture variant 0; old `tasksDone` 9–10 surplus not refunded)
  vs rule A; `[human]` 10.4 iPad playthrough (≈ 59 MB textures, offline loading screen).
- Visual rows: 4.7, 5.3, 5.4, 6.4, 7.4, 8.3 — 5.3 and 7.4 are the only proof of the phase 5/7 breaks (plan Known risks).
- Phase 3 stays one phase (largest): on context pressure return `NEEDS_CONTINUATION`, never commit without green e2e.
- `MINIGAME_WORDS` gets OBRAZKI (7 letters → 7-task word round); phase 3 adds a fit test, fallback in Known risks.
- New e2e seams planned: `?e2eSave=legacy-salon` (phase 2), `?e2eArt=room` (phase 4) under existing markers.
- No lessons file in `context/foundation/` — none applied.

## 6. Autonomous decisions

1. **Rule B kept** (not overturned). Why: matches "stars never taken away" and "nothing bought lost silently"; the
   `[human]` 2.5 row now names its two costs. Would change: maintainer picks rule A (refund) at the checklist.
2. **Phase 3 not split.** Rejected: geometry-on-old-data phase + data-switch phase (throwaway conversion of the 10 old
   slots). Why: type, data, copy, words and the 3 salon specs must land together for a green typecheck and e2e. Would
   change: the phase-3 agent returning `NEEDS_CONTINUATION` twice.
3. **Depth band over a Container sort** for F3. Why: keeps the V2 pop at the slot's own depth with plain `setDepth`.
   Would change: the visual gate showing particles or the outline under a piece of furniture.
4. **Triage without a human**: every CRITICAL/WARNING fixed in plan.md (single obvious fix each); F8, F10 accepted into
   `## Known risks`. Would change: nothing in this run; a maintainer reading the review.
5. **No driver changed**: tdd 1–3, impl 4–9 (9 = seam sweep), e2e 10 (E2E=on, feature built earlier).
