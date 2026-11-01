<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Laboratorium, the third module of the base, with the base's own cell frame

- **Plan**: `context/changes/lab-module/plan.md`
- **Mode**: Deep (claims checked inline against code and packs; no sub-agent — each risky claim was one or two greps)
- **Date**: 2026-11-01
- **Verdict**: SOUND (after the in-place fixes below)
- **Findings**: 0 critical, 2 warnings (both fixed in `plan.md`), 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2 — fixed) |
| Plan Completeness | PASS |

## Grounding

Paths 14/14 present: `tests/{roomArt,roomsData,roomHit,rooms,bootBudget,deployCheck,houseCells,houseArt,fixtureLoadPath}.test.ts`,
`tests/fixtures/{save-v7,save-v6-bridge-done,room-art-hangar}.json`, `designs/bystrow-space-base-v3/manifest.json`,
`designs/bystrow-space-base-v5/assets/base/base-1-cell-frame.png`. Symbols present as described: `HOUSES['base-1']` (2 rows),
`HOUSE_GEOMETRY['base-1'].cellFrame = 'house/cell-frame'` with the gap-199 DESIGN-GAP comment, `houseCells`, `houseArtKeys`,
`houseRoomList` (teaser only for an unknown room), `nextRoom`, `repairCurrentRoom`/`mergeHouse`/`nextRoom` order in `src/main.ts`
mirrored by `tests/fixtureLoadPath.test.ts`, `ROUND_SPEC` in `playwright.config.ts`, `renderedPixel`/`openHouse` in
`tests/e2e/support/hook.ts`, `buyAllTasks` in `tests/e2e/support/salon.ts`, `e2eStars` range 0..500 (`src/testing/e2eHook.ts`).
Brief ↔ plan ✓. Progress ↔ Success criteria: 8/5/7/12/3 = 35 rows, identical text after the edits.

### Claims verified against code

| claim | evidence | result |
|---|---|---|
| The lab cell stays `closed` until reached, so `hangar-module.spec.ts` #2 (`['done','current','closed','closed']`) and `base-cross-section.spec.ts` (upper-left tap inert) stay green | `houseCells` (`src/core/houseCells.ts`): a known room not current and not done → `closed`; `HouseView.render` draws `cellClosed` for `closed` | confirmed |
| Every base card shows three tiles | `houseRoomList` lists every known room in house order; only `hangar-module.spec.ts` #16 pins base card items (`grep "'bridge', true]"`) | confirmed; scope.md "third tile" delivered |
| Only house-1 keeps `cell-frame`; the base flip is one key | `tests/houseCells.test.ts` "names its own pictures, shares the frame" pins base `'house/cell-frame'`; `describe('houseArtKeys')` pins house 1's three keys | confirmed; phase 3 flips the first, the second stays as the break oracle |
| Phase-1 placement exemption removed red-first in phase 2 | `tests/roomsData.test.ts` "placed in exactly one house of HOUSES" uses `toHaveLength(1)`; phase 2 contract removes the exemption, criterion 2.1 red-first, phase-4 seam grep `id === 'lab' \? 0` | confirmed |
| Copy break (drop `'lab-rocks'` variants) turns a case red | `tests/roomsData.test.ts` "has child-facing text for every slot, variant…" iterates `roomText.variant` | confirmed |
| `fixtureLoadPath` widening | "save-v6-bridge-done meets the Hangar" asserts `['bridge','hangar']` merged rooms | confirmed, phase 2 widens it |
| Frame pixel (244,407) | cell `upper-left` (252,236), `frameInset` 16, frame-local (8,187) → (236+8, 220+187) | arithmetic confirmed |

### Follow-ups whose trigger names this slice or a file it changes

| follow-up | trigger | plan |
|---|---|---|
| hangar-module 1 (last module, no teaser) | a third base module | included (phase 2 #16 edit, phase 4 closes it) |
| base-cross-section 6 (shared frame, stand-in) | a designer answer (a base frame) | included (frame half closed by phase 3, stand-in half carried) |
| base-cross-section 13 (`HouseScene`/`HouseView` items) | the next change to `HouseScene` | **fires** on the phase-3 doc comment in `HouseScene.art`; plan said "not fired" → F2, fixed |
| audit-art-renderer 2 (Python without `-I`) | the next change to `scripts/make-task-art.mjs` | fires; already done in code (`execFileSync('python3', ['-I', …])`) → added to phase 4 as closed with evidence (F2) |
| house-1-polish 2 (recolour retirement) | next change to `make-task-art.mjs` | fires; deferral justified (unrelated pipeline cleanup touching a tested script), carried with trigger — accepted |
| bathroom 10 / house-1-polish 9 (SW install warning) | precache set | fires; re-recorded, no work — accepted |
| atlas (bathroom 7 / house-1-polish 13) | headroom < 2 s or room heavier than salon | not fired (lab ≈ 30.9 s, measured in research) |
| hangar-module 2-5, 4/bathroom 9/house-1-polish 11, kids/bathroom/kitchen wording | named rows/files not changed | not fired, carried |

### Drivers

Phase 1 `impl` (art + data glue, proven by existing invariants) ✓; phase 2 `tdd` (red-first data contracts: exemption removal,
flow flips, fixture) ✓; phase 3 `impl` (art + one key, existing size/orphan/key cases) ✓; phase 4 `impl` (docs, sweep, visual) ✓;
phase 5 `e2e` after the phase-4 seam sweep, feature built by phases 1-3 ✓. Every phase runs single specs only; full suite by the
orchestrator after phase 5 ✓ (scope.md).

### Product decisions vs PRD

D1 costs 100 (FR-044 "ok. 100" per module) — `[human]` 4.8. D3 no teaser on the last module — FR-046 "kolejny moduł otwiera się,
gdy zostanie dodany" does not require a card teaser; FR-045's "śluza z Wkrótce" is the closed `upper-right` cell, which stays —
`[human]` 4.10. Wording (gap 208) — `[human]` 4.9. None overturned.

## Findings

### F1 — Phase-5 spec has no timeout for 21 purchases

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — Spec contract
- **Detail**: Test 2 buys all three modules (21 purchases) in one test; the project timeout is 180 s, `hangar-module.spec.ts` sets
  240 s for 14 purchases, `bathroom-room.spec.ts` 300 s. Under the documented machine load the new spec would time out.
- **Fix**: file-level `test.setTimeout(300_000)` written into the phase-5 contract.
- **Decision**: FIXED (plan.md phase 5 contract)

### F2 — base-cross-section 13 trigger fires but is called "not fired"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 — Docs (follow-ups list); change.md follow-up table
- **Detail**: Its trigger is "the next change to `HouseScene`, `HouseView` or `RoomScene.redraw`"; phase 3 edits the `HouseScene.art`
  doc comment. Comment-only, so no behaviour work is owed, but the follow-up must be re-recorded, not silently dropped. Also
  audit-art-renderer 2 fires on the art-script change and is already satisfied in code.
- **Fix**: phase 4 follow-ups list names base-cross-section 13 (re-recorded unchanged) and audit-art-renderer 2 (closed with
  evidence).
- **Decision**: FIXED (plan.md phase 4 § Docs)

### F3 — "place: 1 collides with the Hangar" is wrong

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 break (2.2), phase 5 break (5.1)
- **Detail**: `{ floor: 1, place: 1 }` is `upper-right`, not the Hangar's `ground-right`; the break still turns the named cases red
  (lab lands in the wrong cell), only the wording misled.
- **Fix**: wording corrected in both phase blocks and Progress rows 2.2 / 5.1.
- **Decision**: FIXED

### F4 — Phase 3 has no rendered proof of the frame until phase 5

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3
- **Detail**: Phase 3 proves keys and files only; the rendered mint frame is proven by the phase-4 visual frames (8)-(9) and the
  phase-5 pixel at (244,407). Accepted: the plan states this in its meta-check and the order (visual, then e2e) covers it.
- **Decision**: ACCEPTED (recorded)

VERDICT: PROCEED — 0 critical; the plan delivers the third base tile, the base frame as data, the red-first exemption removal and correct drivers; two warnings fixed in plan.md.
