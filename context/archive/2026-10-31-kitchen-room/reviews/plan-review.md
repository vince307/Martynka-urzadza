<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Kitchen, the second room from data, with the parameterised room celebration

- **Plan**: context/changes/kitchen-room/plan.md
- **Mode**: Deep (claims checked against the code by the reviewer directly; no sub-agent)
- **Date**: 2026-10-31
- **Verdict**: REVISE → SOUND after the fixes applied below
- **Findings**: 1 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict (before fixes) |
|-----------|---------|
| End-State Alignment | WARNING (F2) |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL (F1), WARNING (F3) |
| Plan Completeness | WARNING (F4) |

## Grounding

Paths 12/12 ✓ (`src/data/roomArt.ts`, `src/scenes/BootScene.ts`, `src/scenes/RoomScene.ts`, `src/ui/widgets/RoomDoneCard.ts`,
`src/ui/widgets/starBurst.ts`, `src/ui/sound.ts`, `scripts/make-task-art.mjs`, `tests/bootBudget.test.ts`, `tests/roomArt.test.ts`,
`tests/soundMusic.test.ts`, `tests/houseWiring.test.ts`, `designs/martynka-locations-v2/manifest.json`); symbols ✓:
`BootScene.preload` `queuers.room` iterates `ROOM_ART`, `tables().room` and `create` `roomArtHealth` over `ROOM_ART`;
`preBoot` in `src/main.ts` sets `REGISTRY_KEYS.currentRoom` before the boot scene (so `bootRoomArt(currentRoom)` can read
it); `startMusic` uses the HUD loader with `once('addfile')` (synchronous, own file), keyed `loaderror`, cache check after
`complete`; `RoomScene.resolve()` is the single source of the shown room; the card's "Dalej" callback only clears
`card`/`cardDrawn`; `dispatch` card delay `max(purchasePopMs, stageFadeMs)` / 0 under reduced motion; `RoomDoneCard`
`recordFallback` for every non-live tile; `starBurst` returns `void`; `nextRoom(session, house, known)` and
`houseRoomList` as described; `backdropMode` → `plain` when the scene picture is not loaded; `TaskScene` re-captures the
backdrop on wake only when the `rooms` object changed; `UIScene` `missingRoomLabels` filters `ROOM_ART` by the health
record (only the current room's record, so a scoped record is safe). brief↔plan ✓ (brief updated for F2).

Follow-ups whose `Trigger:` names this slice (`context/archive/2026-10-30-rooms-as-data/follow-ups/review-fixes.md`):
1 in (phase 5 copy); 2 in (phase 4); 3 in (visual gate frame 1); 4 was NOT listed → F4, now re-recorded with its reason;
5 fired, answered by K-1 (per-room boot) and re-recorded; 6 and 7 re-recorded with reason (K-11); 14 in (phase 4 card
contract, `mode` from the current tile). Others with a matching trigger: salon-load-health M-6 = F-04 #6 (re-recorded);
M-5 (purchase-flow e2e under `writefail`) fires weakly because phase 4 edits the `dispatch` `roomDone` branch → added to
the re-record list (F4); salon-extra-slots "texture atlas … or a second room" = F-04 #5.

Phase drivers: 1 tdd (pure, absent) ✓; 2 impl (boot wiring) ✓; 3 tdd (service absent, fake-loader precedent
`tests/soundMusic.test.ts`) ✓; 4 impl (widget/scene wiring) ✓; 5 impl (data/art) ✓; new 6 impl ✓; 7 impl (docs + seam
sweep, last impl) ✓; 8 e2e after the seam sweep, E2E=on, features built in 3–6 ✓. Progress↔Phase mechanical check after
the edits: 8 phases, every Success-Criteria bullet has its row (4/4/4/5/8/4/10/3), no checkbox outside Progress.

## Findings

### F1 — "Dalej" refreshes "Obrazki" for a room still in flight

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 (`refreshHealth`), Phase 4 ("Dalej" contract)
- **Detail**: Phase 4's "Dalej" calls `roomArtLoader.ensure([currentRoom])` and then `refreshHealth(currentRoom)` at
  once. `refreshHealth` judges `roomArt(kitchen)` by `textures.exists`; while the runtime load is still in flight (a cold
  link, the documented case in Performance Considerations) every kitchen key is absent, so `REGISTRY_KEYS.roomArtHealth`
  lists 21 missing pictures and "Obrazki" (`UIScene` `missingRoomLabels`) reports them — exactly what the run's
  requirement forbids ("Obrazki" must not report a not-yet-loaded room as missing). The settle path would correct it
  later, but a parent opening settings in that window sees a false failure.
- **Fix**: `refreshHealth(room)` is a no-op while `room` is pending; the settle of that room writes the record. Added to
  Critical Implementation Details, the phase-3 contract, a phase-3 test case and a phase-3 deliberate break (row 3.2).
- **Decision**: FIXED

### F2 — The salon's "poprawki" (FR-019) and the finished salon itself disappear after "Dalej" until S-23

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: End-State Alignment
- **Location**: K-6, What We're NOT Doing, row 6.7 (old numbering)
- **Detail**: Today a child with a finished salon has "Zmień wygląd" (FR-019 must-have, live). The plan moves her to the
  kitchen on "Dalej" and leaves no way back: `RoomScene.resolve()` reads only `currentRoom`, the HUD switch and "Do
  pokoju" open the current room, `SalonBackdrop` draws the current room. The salon can then neither be changed nor even
  seen (FR-035 "nic, co dziecko urządziło, nie znika" in spirit) for as long as S-23's art takes. K-6 rejected only a
  second card button and staying in the salon; it did not consider an entry outside the card. The code makes one cheap:
  `resolve()` is the one source of the shown room, a done room has no task (so no purchase path), the change path
  (`dispatch` `step.changed`) writes `rooms[room.id]` through `resolve()`, and the phase-3 loader can bring the art at
  runtime. FR-039 ("Do pokoju" always to the room in renovation) holds if the visit is runtime-only and reset on every
  wake/sleep; FR-040 (one "Dalej") holds because nothing is added to the card.
- **Fix (applied)**: new **Phase 6 "Visit a done room in its change mode (FR-019)"** (Driver impl): pure
  `visitTarget(items, current, visiting)` in `src/core/roomVisit.ts`; runtime `visiting` in `RoomScene` (`resolve()` reads
  it first, reset in `create`/wake `refresh`/`onSleep`), one visit button labelled with the existing room name
  (`roomText.name`, no new copy), prefetch via `roomArtLoader.ensure` when the button is shown; layout token + layout
  test; wiring guards; a fourth e2e test in phase 8 (salon change from the kitchen, back to the kitchen, reload keeps
  the kitchen and the change); visual frame (8); `[human]` row 7.7 now accepts the interim button (not the loss); K-6
  rewritten; load-moment table row added; brief updated. Old phases 6/7 renumbered 7/8.
  - Strength: keeps a live must-have; one field + one button + one pure rule over code the plan already builds.
  - Tradeoff: an interim UI element (DESIGN-GAP) that S-23's cross-section removes; +1 phase.
  - Confidence: HIGH — `resolve()`, the change path and the wake/sleep resets were read in `RoomScene`.
  - Blind spot: exact button placement at 1920×1080 (bottom bar is full: `resume` 240–720, `taskButton` 900–1620,
    `modeButton` 1010–1580); the phase-6 layout test and visual frame (8) decide it.
- **Decision**: FIXED

### F3 — The task-screen backdrop can stay plain after the move

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Room-art load moments table; Phase 4
- **Detail**: The table had no row for the backdrop after "Dalej". `TaskScene` re-captures the `SalonBackdrop` on wake
  only when the `rooms` object changed. If the child goes to the notebook while the kitchen is still loading, the capture
  is `plain` (`backdropMode`) and stays plain until the next purchase changes `rooms`, even after the kitchen loaded.
  Not broken (plain is the documented fallback) but a stale screen with no load moment defined.
- **Fix**: phase 4 adds a `TaskScene` wake condition on `REGISTRY_KEYS.roomLoad` (value stored beside `backdropRooms`),
  `SalonBackdrop` unchanged; table row added; wiring guard listed.
- **Decision**: FIXED

### F4 — Follow-up 4 and M-5 missing from the re-record list

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 7 (old 6) Docs contract
- **Detail**: F-04 follow-up 4 (`salon-before` thumbnail; Trigger "S-22 kitchen tile shown not done") fires (the kitchen
  tile shows not done on the salon's card) but was neither handled nor listed for re-recording; change.md had decided
  "re-record". salon-load-health M-5 (Trigger "a change to the purchase flow in `RoomScene`") fires weakly through the
  phase-4 edit of `dispatch`.
- **Fix**: both added to the phase-7 re-record list; the `Trigger:` count threshold raised from 8 to 10 (row 7.2).
- **Decision**: FIXED

### F5 — The runtime loader skips the boot's size check

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3
- **Detail**: `BootScene` runs `wrongSizes` over loaded files; `roomArtLoader` does not, so a wrongly sized kitchen file
  loaded at runtime draws stretched without a log line. Sizes are pinned by the per-room snapshot test, and a launch in
  the kitchen runs the boot check.
- **Fix**: recorded under `## Known risks`; re-recorded as a follow-up in phase 7.
- **Decision**: ACCEPTED

### F6 — Shared HUD loader: keyed `addfile` needed

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 3
- **Detail**: `startMusic` uses `loader.once('addfile')` right before its own synchronous `loader.audio`, so it cannot
  catch a room file; the room loader queues many files and must use keyed `on('addfile')` listeners removed on settle
  (the plan says "for its own keys"). Recorded so the implementer does not copy the `once` form.
- **Fix**: `## Known risks` entry.
- **Decision**: ACCEPTED

## Checks requested by the step prompt

1. **FR-019** — a small in-scope way exists and fits one phase → added (F2, Phase 6). The `[human]` row now accepts
   the interim button instead of the loss.
2. **Lazy room art** — every place a room is seen has a load moment and a non-broken placeholder (table, plus the two
   rows added for the backdrop after the move and the done-room visit); offline: the files stay in the precache
   (`globPatterns` incl. `webp`, `precacheCovers` over the full `ROOM_ART`), proof by the `[human]` tablet row 7.9 (K-12);
   boot worst case = shared + the heaviest single room (salon 41.8 s < 48 s), `totalMs` unchanged, proven per room by
   `tests/bootBudget.test.ts`; "Obrazki" judges only the current room and, after F1, never a pending one.
3. **Celebration** — one `celebrationView(intensity, reducedMotion, table)` over the existing card, only `'room'` passed
   (source guard), reduced motion → `revealMs` 0 and `burstCount` 0 (unit test, wiring guard, e2e). ✓

## Triage summary

Fixed: F1, F2, F3, F4 (4) · Accepted (Known risks): F5, F6 (2) · Verdict after fixes: SOUND.

VERDICT: PROCEED — the per-room boot plus runtime loader and the single celebration view are sound and grounded in the code; one critical health-line gap and the FR-019 regression were fixed in the plan (new phase 6), the rest recorded.
