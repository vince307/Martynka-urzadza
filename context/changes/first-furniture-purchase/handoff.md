# Handoff — `first-furniture-purchase` (slice S-09)

Written by the visual-gate step (autonomous run 2026-10-13-s09-s11). All [visual] rows are captured and ticked; F1
("Wybieram" over the task button) and the thin floor/walls thumbnails are fixed in `9096a52` (layout data + one line in
`VariantPanel.show`), so production code changed after impl-review — the e2e suite was re-run green on it. Only the
five [human] rows remain; the next agent must not tick them.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | 26 before this step's docs commit (`77c94d4`..`9096a52`), then `docs(first-furniture-purchase): bramka wizualna` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged) |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): [human] 7.6–7.10 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | `ROOM_LAYOUT.choose` y 792–892, `close` y 908–1004, `taskButton` top 892 (aligned with `resume`), `thumbs.minAspect` 0.5 (`9096a52`) |
| `src/ui/widgets/VariantPanel.ts` | `show`: thumbnail height at least `w * thumbs.minAspect` (`9096a52`) |
| `tests/layout.test.ts` | two new cases: "Wybieram" clear of the task button and "Wróć do notesu"; readable thumbnail height (`9096a52`) |
| `context/changes/first-furniture-purchase/reviews/visual-review.md` | visual review, hand-checked 7 − 5 = 2, ends with the `VISUAL:` line |
| `context/changes/first-furniture-purchase/screenshots/` | 26 PNG frames (13 states × desktop 1440×900 / tablet 1024×768) + `README.md` |
| `context/changes/first-furniture-purchase/plan.md` | rows 4.6, 5.5, 6.5, 6.6 ticked |
| `context/changes/first-furniture-purchase/follow-ups/review-fixes.md` | F1 marked resolved; S-16 thumbnail item updated; V1 (caption collision), V2 (rug pop not captured) added with `Trigger:` |
| `docs/design-gaps.md` | row 33: wide-slot thumbnails at least half as high as wide |

## 3. Verification

| Command | Result (observed in this step, on `9096a52` working tree) |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` + deploy tests + ops tests + `sample` E1–E6 | vitest 1035 = baseline 974 + 61 (S-09's 59 + 2 new layout cases); deploy/ops OK; `Naruszenia: 0` ×6 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (one plain command) | 24 passed = baseline 23 + 1; 4397/4398 killed after |
| Red-before-green | the two new `layout.test.ts` cases failed on the old data (overlap `true`; `minAspect` undefined → NaN), green after the data change; meta-check: the overlap case would also go red if `taskButton.top` moved back under 892 or `choose` grew downwards, which is exactly F1 |
| Visual capture | Playwright throwaway spec (moved out of the repo before the gate) against the hook build on 4399: 8 tests passed, frames at `9096a52`; server on 4399 killed |

## 4. Next command

`/10x-archive first-furniture-purchase then ship`

## 5. Open

- [human] 7.6 slot list, labels and cost curve (5…15, 96 stars); 7.7 no sound vs FR-017; 7.8 balance and salon session-only until S-11; 7.9 panel UX decisions without a kit source; 7.10 iPad/Android: purchase by finger, double "Wybieram", system "reduce motion".
- Follow-ups (`follow-ups/review-fixes.md`): V1 slot captions "podłoga"/"dywan" overlap and "ściany" on the "obraz" outline (`RoomView.render`, `src/data/rooms.ts`; Trigger S-16 or S-10); V2 rug pop over the sofa not captured (`RoomScene.celebrate`; Trigger S-10 visual gate); F4, F5 (S-10); earlier S-10/S-11/S-16/M8 items.
- "Zamknij" still shares the task button's place on purpose (a double tap there re-opens the same panel); the 7.10 device check should confirm it does not confuse a child.
- No new DESIGN-GAP rows; row 33 updated.

## 6. Autonomous decisions

- **Playwright instead of Claude in Chrome for the matrix**: Chrome answered, but its tab was `visibilityState: hidden`, so the Phaser loop ran only during screenshots, and reduced motion cannot be emulated from the extension. Rejected: driving ~30 timed steps through a paused loop. Would change: a foreground extension tab with a running loop.
- **F1 fixed by moving "Wybieram" up and the task button down (data only), not strict disjointness of every tray target**: "Wybieram" is the only target whose tap shows a *different* panel on a double tap; "Zamknij" re-opens the same one and thumbnails close nothing. Strict disjointness needs a re-layout of the room's bottom band (resume left, task button right, no room for two 480 px buttons above y 880). Would change: the device check (7.10) showing children re-opening the panel with "Zamknij".
- **Thumbnail minimum aspect fixed now (cheap, one line + data)** instead of leaving it to S-16. Would change: art in S-16 replaces swatches anyway.
- **Caption collision left as a follow-up (V1)**: it is placeholder text; a proper fix needs a caption anchor in room data or art. Would change: S-10 touching `RoomView`.
- **Kit room frame compared but not committed**: the repo is public and `designs/` is gitignored; earlier gates did the same.
- **Worked example missing**: `context/archive/2026-10-13-parent-settings-progress/` has no visual review or screenshots (ARTIFACT GAP, minor); used `context/archive/2026-10-13-adaptive-curriculum/` as the model.
