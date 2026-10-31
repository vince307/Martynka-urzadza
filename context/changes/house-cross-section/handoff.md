# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-new` step of run 2026-10-31-house-cross-section. The change identity exists with roadmap claims
re-verified, the house pack inventoried and follow-ups triaged; no code changed. The next agent must not treat the
roadmap's "house pack blocker" as live: the pack `designs/martynka-house-street-v1/` is in scope and ships as WebP.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | 1 on the branch after this step: `docs(house-cross-section): change identity (autonomous run)` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-cross-section/change.md` | identity; roadmap claim table (S-23 vs repo now); design sources bound (house pack manifest, README § Integracja, preview CSS, brief layout); expected DESIGN-GAPs; migration (none); follow-ups triggered with takes; decisions D1–D11 |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| `cwebp -q 85 -alpha_q 100 -m 6` on the three pack PNGs (scratchpad only, nothing committed) | `house-1-shell` 44 964 B, `cell-closed` 5 554 B, `cell-frame` 8 600 B = 59 118 B |
| `grep Trigger: … S-23` over `context/archive/*/follow-ups/review-fixes.md` | kitchen-room 1, 12, 16, 19; rooms-as-data 11 (plus conditional "next change to X" triggers listed in change.md) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main 112f158 inherited, unverified) |

## 4. Next command

`/10x-research house-cross-section`

## 5. Open

- Research questions for `/10x-research`:
  - house view as a new scene (`SCENE_KEYS`, `src/main.ts`) or a layer of `RoomScene`; how `visiting` (runtime, `RoomScene`) is set from a house tap and cleared on the way back to the notebook (FR-039: `GAME_EVENTS.toRoom` must always open `currentRoom`);
  - house art loading at runtime (extend `createRoomArtLoader` in `src/ui/roomArtLoader.ts` or a sibling) and preloading the non-boot room for its miniature; if `roomArtLoader` is edited, kitchen follow-ups 14 and 15 fire;
  - whether `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`) needs a cell clip at 19/60 (curtains reach above the room; kitchen follow-up 10);
  - cell geometry as data keyed by house id (manifest) vs `HouseRoomPlace` `floor`/`place`; closed cells = manifest cells without a known room;
  - e2e hook: remove `visitTarget()` (`src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`), add house targets/snapshot; rewrite `tests/e2e/kitchen-room.spec.ts` visit steps; `tests/roomVisit.test.ts`, `tests/layout.test.ts` (`visitButton`);
  - house art health: a fallback record in `REGISTRY_KEYS.artFallbacks` vs an "Obrazki" line.
- DESIGN-GAPs to add (rows after 182 in `docs/design-gaps.md`): house button in the room view, way back from the house, frame on touch (marks the room in renovation), salon green board inside a cream cell (extends 178), tap on a closed cell (inert), code-drawn shell fallback; close gap 180.
- Follow-ups to re-record in this slice's `follow-ups/review-fixes.md`: kitchen 12 (→ S-24), 16 (fix itself), 19 (backdrop), rooms-as-data 11 (kids id → S-25), L-R8; close audit-art-renderer 2 (`python3 -I` already present in `scripts/make-task-art.mjs`).

## 6. Autonomous decisions

- D1–D7 carried from `context/runs/2026-10-31-house-cross-section/scope.md` as "orchestrator starting decision (scope.md)" — none overturned; details and reversal conditions in `change.md` § Autonomous decisions.
- D8 replace the interim visit button with the house button (not both) — would change: playtest showing the direct jump is missed.
- D9 celebration stays room intensity (no house-done moment before S-25) — would change: S-25 shipping first.
- D10 missing copy (house button, way back) written in the existing style with gap rows — would change: designer wording delivered.
- D11 next step `/10x-research` rather than the skill's default `/10x-plan` (fixed by the step prompt; the slice spans scenes, loader and hook) — would change: nothing.
- No `AskUserQuestion`; no `[human]` row needed (no scope.md decision overturned).
