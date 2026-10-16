<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Five new salon slots (S-16d `salon-extra-slots`)

- **Plan**: context/changes/salon-extra-slots/plan.md
- **Mode**: Deep (risky claims verified inline against the code; no sub-agent)
- **Date**: 2026-10-16
- **Verdict**: SOUND (after triage)
- **Findings**: 0 critical, 1 warning, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, fixed in plan) |
| Plan Completeness | PASS |

## Grounding

22/22 paths ✓ (`tests/roomShown.test.ts` new, as planned), symbols ✓ (`holdPoint`, `slotAt`, `stepPanel`, `roomDone`,
`roomsListView`, `miniaturePieces`, `drawRoomMiniature`, `RoomSnapshot`, `LIFT_V2_SALON`, `SALON_V3_TARGET`, `OLD_ONLY_KEYS`,
`precacheFromSw`, `contentTypeCheck`, `bootLoadPhase`, `checkBootLimits`, `ROOM_JOBS`/`SALON_V2`, `readHook`, `holdTouch`),
pack manifest geometry of the 5 slots = plan phase 3 ✓, brief↔plan ✓, Progress↔Phase ✓ (8 phases, 34 rows, 1:1 with the
success criteria, no checkboxes outside Progress).

## Claims checked against the code

| Claim | Evidence | Result |
|---|---|---|
| Live v3 saves (`tasksDone` 0..7, `chosen` of the 6 old slots) keep their meaning | `currentTask` = `room.tasks[tasksDone]`, `purchase` writes `chosen[task.slot]`; `validRoom` in `src/core/save.ts` checks values only; the five new tasks are appended after `hang-frames` | holds; a finished salon continues at `hang-curtains` |
| `curtains` reuse is safe | `MIGRATIONS` loop runs `for (v = from; v < SAVE_VERSION)`; `OLD_ONLY_KEYS`/`TARGET_SLOTS` derive from the frozen `LEGACY_SALON_V2`/`SALON_V3_TARGET`, never from `SALON`; `LIFT_V2_SALON` drops `curtains` of a v2 save and caps the prefix at 7 | holds; no v3 save is ever lifted |
| `SALON_V3_TARGET` stays frozen | L-1 pin compares it with `SALON.tasks.slice(0, 7)` | prefix, holds after append |
| Unbought decoration never changes for free | `slotAt`, `holdPoint`, `stepPanel` (`change` branch: `state.chosen[slot] === undefined` → no-op) and `RoomScene.alphaAt` read `chosen` only | holds |
| `roomDone`, room list, done card | `roomDone` = `tasksDone >= tasks.length`; `roomsListView` and `RoomScene` (`card` set only after a purchase that makes the room done) follow it | card shows again at 12, teaser relocks until then (decision 2 `[human]`) |
| Miniature with 11 slots | `miniaturePieces` / `drawRoomMiniature` (still used by `RoomDoneCard.drawRoomTile`, `thumbScale` 0.13, `thumbTop` 16) | works; curtains at y −70 draw ≈ 9 px above the miniature (F2) |
| Depth: curtains vs window, shadows, panel/HUD | window is in the architecture picture (depth 0); `depth.shadows` 4 → 2 below curtains z 3; controls ≥ 100; HUD is the separate UIScene, its "Do pokoju" hidden in the room | holds |
| Hook `RoomSnapshot.shown` | `RoomSnapshot` has no drawn-state field today; plan records it from `RoomView`'s drawn layers | sound (a render break changes what e2e reads) |
| Buy-everything e2e specs | `room-change.spec.ts` and `final-art-room-done.spec.ts` loop over `SALON.tasks` with `e2eStars` = sum (129 ≤ 500, `e2eStars` range); file-level 120 s raised to 180 s (= project timeout for `chromium-hook`); new spec inherits 180 s | holds; phase 7 stars exactly cover the five (58) |
| `check:deploy` room-art count | `precacheFromSw` yields `assets/...` URLs (no leading slash, seen in `dist/sw.js`); `ROOM_ART` urls same form; `contentTypeCheck` exists; `roomArt.ts` → `pl.ts` imports run under `node --import tsx` | holds |
| `totalMs` 50 s vs `slowAfterMs` 8 s | `checkBootLimits` needs slow < total; `loaderBalance.test.ts` 30–60 s and > 24 s; e2e uses `E2E_BOOT_LIMITS` (3 s), not `balance` | holds; slow line unchanged |
| Phase 1 import of `ROOM_LAYOUT` in core | `roomHit.ts` already imports `data/balance`; core ESLint block forbids only Phaser and `idb-keyval`; `layout.ts` has no imports | allowed (F5) |
| Each phase green alone | phase 1 clip is a no-op on today's data (top slot box y 31); phase 2 shadows 2 < min z 5; phase 3 carries the spec count edits | holds |
| Drivers | 1, 3, 4 `tdd`; 2, 5 `impl`; 6–8 `e2e` after phases 1–3 | correct |
| `[human]` rows | costs (1), reopened salons (2), `totalMs` (3), tests changed on purpose (4) | present |

## Findings

### F1 — Fired follow-ups missing or deferred without a reason

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 (follow-ups), Known risks
- **Detail**: VO2 (`2026-10-15-final-art-salon`, trigger: the next change to `RoomView.render`) is listed as firing in
  `change.md` but missing from the phase 5 carry list; the per-file timeout test (`2026-10-16-final-art-p2`, trigger: the next
  change to `balance.loader` or the boot queue) fires through `totalMs` and the 12 new files and is not mentioned; L-4 (room
  hit test), L-7 (`salon-art.spec.ts`), L-R8/L-R11 (RoomScene) fire but the plan defers them with no reason.
- **Fix**: carry VO2 and the per-file timeout test in phase 5; a Known-risks entry gives each deferral its reason.
- **Decision**: FIXED (phase 5 list + Known risks "Follow-ups fired by this slice and deferred")

### F2 — Done-card miniature draws the curtains above its top edge

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 (miniature), phase 3 visual
- **Detail**: `drawRoomMiniature` places pieces at `top + y · scale` without a clip; curtains y −70 × 0.13 ≈ −9 px, inside the
  16 px tile padding of `ROOM_DONE_LAYOUT.tiles`. The plan keeps `drawRoomMiniature` unedited (F2 of final-art-salon).
- **Fix**: visual 3.7 (and Progress 3.7) checks the done-card miniature at task 12; Known risks + follow-up.
- **Decision**: FIXED (recorded; visual check added)

### F3 — A hold on an unbought default-look piece passes through it

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Decision 9
- **Detail**: `slotAt` skips slots without `chosen`, so holding the old pouf (z 60) opens the change panel of the rug (z 10)
  or armchair under it. Same as holding the decoration pouf today, so not a regression.
- **Fix**: Known risks + follow-up (trigger: a report of the wrong panel, or S-17).
- **Decision**: FIXED (recorded)

### F4 — A same-version old tab can overwrite a purchase of the new tasks

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Migration Notes
- **Detail**: an open S-16c instance writes v3 too, so the P-5 version guard does not stop it; generic to any same-version
  change, not specific to this slice, and loses no data the old build did not already hold.
- **Fix**: Known risks; no action.
- **Decision**: ACCEPTED (recorded)

### F5 — Unneeded ESLint hedge in phase 1

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Hold point inside the scene
- **Detail**: the contract hedges "if an ESLint boundary forbids it"; `roomHit.ts` already imports `data/balance` and the core
  block forbids only Phaser and `idb-keyval`.
- **Fix**: a note in the contract that the import is allowed.
- **Decision**: FIXED

## Autonomous decisions (this step)

1. **No AskUserQuestion; triage decided in place** (contract rule 1): WARNING fixed in the plan, observations recorded under
   `## Known risks`. Would change: a human in the loop.
2. **No sub-agent for Step 3**: the risky claims (saves, migration, hit test, card, miniature, depth, hook, e2e limits,
   `check:deploy`, `totalMs`) were each checked against the code in this session (table above). Would change: a claim left
   unverified.
3. **No CRITICAL**: no path loses or corrupts a furnished salon (append-only tasks, frozen migration tables, values-only
   validation, rollback reads 8..12 as done). Would change: a code path deriving `OLD_ONLY_KEYS` from live data.

VERDICT: PROCEED — append-only data keeps every live save's meaning, migration tables stay frozen, phases are green alone with correct drivers; one warning fixed in the plan.
