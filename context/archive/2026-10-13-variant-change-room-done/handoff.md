# Handoff — `variant-change-room-done` (slice S-10)

Final pre-merge state written by the ship step: archived to `context/archive/2026-10-13-variant-change-room-done/`,
roadmap S-10 done, Backlog Handoff refreshed (S-10 done, S-11 ready for `/10x-plan`, S-11 triggers restated). Open
[human] rows 3.5, 6.6–6.9 are a post-run checklist (listed in the PR under „Dla właściciela produktu”), not a blocker.

Written by the visual-gate step. All [visual] rows are captured and ticked; one real discrepancy (the rug caption drawn on the sofa) is fixed in `a3dade4` with a data guard. Only [human] rows remain; the slice is ready to archive and ship. Do not "fix" V2–V5 in the archive/ship steps: they are follow-ups with triggers.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | `a8deb20`..HEAD (phases 1–7, fix `96f7514`, review docs, this step's `a3dade4` fix + `docs(variant-change-room-done): bramka wizualna`) |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-s09-s11/run-log.md (ship step pushes after this archive commit) |
| `change.md` status | `archived` (ship step, `/10x-archive`) |
| `## Progress` rows remaining | 5, all [human]: 3.5, 6.6, 6.7, 6.8, 6.9 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/rooms.ts` | `SALON_PLACEHOLDERS.rug.caption` = (960, 740): the rug caption sits in the rug strip under the sofa (`a3dade4`) |
| `tests/roomsData.test.ts` | new test "keeps every salon caption off the slots drawn above its slot" (uses `slotBox` from `src/core/roomHit.ts`) (`a3dade4`) |
| `context/changes/variant-change-room-done/screenshots/` | 30 PNGs (15 states × desktop 1440×900 / tablet 1024×768) + `README.md` (state · desktop · tablet · how reached) |
| `context/changes/variant-change-room-done/reviews/visual-review.md` | verdicts per [visual] row, hand-checked balance, readability, findings; ends with the `VISUAL:` line |
| `context/changes/variant-change-room-done/follow-ups/review-fixes.md` | V2, V3 (`Trigger: S-16`), V4, V5 (`Trigger: human checklist row 6.7`) |
| `context/changes/variant-change-room-done/plan.md` | rows 4.6, 4.7, 5.6, 5.7 ticked |

## 3. Verification

Observed in this step (baseline on main `36ead3c`: 1035 unit, 24 e2e):

| Command | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| unit command (contract) | `npm test` 1079 passed (baseline 1035, +44: S-10 +43, this step +1); deploy and ops scripts OK; `sample` E1–E6 `Naruszenia: 0` |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (one plain command, this session) | 26 passed (baseline 24, +2); 4397/4398 not listening afterwards |
| visual capture (throwaway spec, hook build on 4399) | 8 tests (4 flows × 2 sizes) green; 4399 stopped; spec moved to the session scratchpad before the lint gate |

Deliberate break: the new caption test was run against the old data first and went red ("rug caption under sofa: expected false to be true"), then green after the anchor. Meta-check: it compares each caption box with the slot boxes of higher depth from the same data the scene draws (`captionAnchor`, `slotBox`), so it proves the drawn overlap is gone, not the pixels; the character width is the existing conservative `captionCharWidth` estimate.

Hand-checked: 40 − 35 = 5 before the change, 5 − 0 = 5 after it; 96 − 81 = 15 before the last purchase, 15 − 15 = 0 after (HUD, "masz 5/10" and hook `stars` at both sizes).

## 4. Next command

none — shipped

## 5. Open

Human checklist (manual-only Progress rows):
- [human] 3.5 `?e2eStars=N` seam (e2e build only) as the route to a finished salon.
- [human] 6.6 child hold 600 ms / 40 px (`balance.roomHold`), tune on a device.
- [human] 6.7 UX decisions of mode, card and list — now also V4 (change mode has no visible hint; `pl.room.change.hint` is narration only, not auto-read) and V5 (the change panel does not mark the current look), both in `follow-ups/review-fixes.md`.
- [human] 6.8 copy „Zmień wygląd”, „Wkrótce”, F5 hint wording („mebel”).
- [human] 6.9 iPad/Android: finger hold, tap in the mode, card, reduce motion.

Follow-ups (`follow-ups/review-fixes.md`): V2 `RoomScene.celebrate` pop draws the rug over the sofa (S-16); V3 placeholder captions vanish on matching fills, e.g. „stolik” on the deep-teal table (S-16); earlier S-11, S-16 (F4, F6), v1.1, M8 items unchanged. No new DESIGN-GAP rows (the card's missing background dim is within row 39's placeholder).

## 6. Autonomous decisions

Visual-gate step:

V1. Capture by the Playwright fallback only, Claude in Chrome not tried. Rejected: Chrome first (profile § 8: it cannot drive the Phaser long press, its tab may run hidden, and it cannot emulate reduced motion; 6 of 15 states need one of these). Would change: a Chrome extension that delivers trusted touch events.
V2. Fixed the rug caption in data (`SALON_PLACEHOLDERS.rug.caption`) with the guard in `tests/roomsData.test.ts` next to the existing caption test, not in `layout.test.ts` (the anchors live in `src/data/rooms.ts`). Would change: anchors moving into `ROOM_LAYOUT`.
V3. V2 (rug pop over the sofa) captured but not fixed: `RoomView` draws the room in one `Graphics`, so a depth-correct pop needs per-slot objects, which the art slice S-16 introduces; a fix now would be thrown away. Would change: S-16 slipping past v1 release.
V4. Change-mode hint left as narration (plan and gap 38 say so); judged a weak cue for a 7-year-old and sent to the maintainer's row 6.7 instead of inventing a visible hint line (not in the kit). Would change: the maintainer asks for a visible or auto-read hint.
V5. VISUAL verdict GAPS (not PASS) because V2–V5 remain visible in the frames, though none blocks shipping.

Ship step:

S1. Archived despite 5 open [human] rows (3.5, 6.6–6.9; 0 automated): `/10x-archive` labels "Continue archiving" (Recommended) for manual-only rows, and the step prompt makes them a post-run checklist. Would change: an automated row left open.

Earlier steps (kept): impl-review R1–R4 (reviewed in place; F1/F2 fixed, F3 accepted, F4/F6 to S-16, F5 to row 6.8; `holdPoint` hook-only); plan triage and phases 1–7 decisions 1–17 as recorded in `reviews/impl-review.md` and the plan (gesture reducer in core, `e2eStars` seam with cap 500, `modeButton` 1010,892 570×128, card 220..780 with "Dalej" at y 624, `holdPoint` margin step/2).
