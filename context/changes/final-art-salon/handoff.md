# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-plan` step: `plan.md` (10 phases, drivers tdd ×3, impl ×6, e2e ×1) and `plan-brief.md` exist;
nothing is implemented. The next agent must not get wrong: the remap rule is **B** (shortest new prefix whose cost is
≥ the stars spent in the old prefix, variants carried, stars untouched) — deliberately against `change.md` decision 3
(rule A, refund), with a `[human]` row 2.5 for the maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | 3 on the branch after this step's commit (`docs(final-art-salon): change identity (autonomous run)`, `docs(final-art-salon): research`, `docs(final-art-salon): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`), 0 done |
| Roadmap | S-16a `proposed` → `planning` (At a glance row + body `Status`), committed with the plan |
| Working tree | clean after the commit (only files of this step staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-art-salon/plan.md` | Full plan: 10 phases with `Driver:`/`Driver why:`, success criteria, `## Autonomous decisions` (11), `## Progress` |
| `context/changes/final-art-salon/plan-brief.md` | Two-page brief with the key-decisions table |
| `context/changes/final-art-salon/change.md` | Frontmatter `status` preparing → planned |
| `context/foundation/roadmap.md` | S-16a status → planning, `updated` 2026-10-15 |
| `context/changes/final-art-salon/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-art-salon` |
| Success Criteria ↔ Progress check (python over `plan.md`) | phases 1–10: criteria count = Progress row count (3, 5, 5, 7, 4, 4, 4, 3, 4, 4) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `{"changed":true}` |
| Remap rule B arithmetic (by hand, in plan decision 1) | old `tasksDone` 0…10 → new 0,1,2,3,4,5,6,6,7,7,7; every old furniture piece lands in the new prefix |
| lint / typecheck / tests / build / e2e | not run: planning step, no code changed (baseline on main `334ff69` per contract, inherited, unverified here) |

## 4. Next command

`/10x-plan-review final-art-salon`

## 5. Open

- Manual rows (human checklist): `[human]` 2.5 remap rule B vs A; `[human]` 10.4 iPad playthrough (≈ 59 MB textures,
  offline loading screen); `[visual]` 4.7, 5.3, 5.4, 6.4, 7.4, 8.3 (states: before stage, after stage, each of 6 slots
  empty/furnished, variant panel per slot, change mode, room done, stand-ins `?e2eArt=room`, animations, loading
  screen, unlock-card book; widths 1440 and 1024, canvas 1920×1080 in FIT).
- New e2e seams planned: `?e2eSave=legacy-salon` (phase 2, `src/testing/e2eHook.ts` `E2ESaveSeam`) and `?e2eArt=room`
  (phase 4), both under existing markers in `vite/e2eHookGuard.mjs`.
- Phase 3 is the largest (data switch + geometry + stand-ins + 3 unit tests + 3 e2e specs `room-purchase`,
  `room-change`, `save-restart`); plan-review may split it.
- Phase 5 deliberate break can only be proven visually (recorded as such in the plan).
- DESIGN-GAP rows 105+ and follow-up triggers are written in phase 9 (`follow-ups/review-fixes.md`).
- No lessons file in `context/foundation/` — none applied.

## 6. Autonomous decisions

1. **Remap rule B over A.** Chosen: round up, no refund, variants carried via `table→coffee-table`, `shelf→cabinet`,
   `picture→wall-frames`. Rejected: A (refund in stars). Why: maintainer rule "nothing bought lost silently; stars never
   taken away" holds without an exception to `src/core/stars.ts`; gift ≤ 1 task. Would change: maintainer prefers exact
   value with refund, or a cost curve where rounding up gifts more than one task.
2. **Costs 5, 7, 9, 10, 12, 13, 15 (sum 71), furniture order sofa, rug, coffee-table, cabinet, armchair, wall-frames.**
   Why: within 5–15, mirrors the old order so every old piece maps inside the new prefix. Would change: maintainer costs (S-17).
3. **Empty slots draw nothing after the stage; `furnishings-before` before it; `shadows` only when done.** Why: layers
   cannot be split per slot. Would change: per-slot art from the designer.
4. **Full-bleed scene, panel tray unchanged; full-resolution WebP; hit by `visibleRect` + `z` + injected alpha.**
   Would change: visual gate showing a hidden preview, a precache/memory budget, or alpha cost on the tablet.
5. **Word list = 6 new captions; the Ó/Ł assertion replaced by the existing `revealed('PÓŁKA')` test.** Would change: a
   P3 slot whose caption has Ó/Ł.
6. **Stage bought with one tap, no confirmation** (FR-016). Would change: playtest showing accidental stage purchases.
7. **10 small phases**, ≤ 2 UI components each (new: `RoomLayer` p5, `LoadingScreen` p8); stand-ins land with the data
   switch (p3) so every phase is green before art exists. Would change: plan-review asking to split p3.
8. **Follow-ups in scope:** furniture art, V1/V3 captions, hit/outline, salon miniature, F4, F6, V2, book (gap 22),
   `TaskScene.shake` reduced-motion guard. Out (re-triggered in p9): atlas, thermometer, hint highlight, narrator units
   and "minus", O3, ` = ?`, SPATIAL, wallet, zero glyph, `audio.noAudio` → S-16b. Would change: spare budget after p9.
9. **Roadmap status edit committed with the plan** (contract clean tree over the skill's "leave uncommitted").
