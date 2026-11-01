# Handoff — `house-1-polish` (slice S-32)

Written by the visual-gate step of run 2026-11-01-bathroom-polish-lab: all seventeen items of plan row 5.6 captured at 1440 and 1024 on the hook build, `VISUAL: PASS`, no code fix, no new gap row. The next agent must not tick 2.9 or 5.12 before the post-merge Deploy log shows them, and must leave the `[human]` rows 5.7-5.11 open.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | `8a667f5`..`1b6d4ed` (17) + this commit `docs(house-1-polish): bramka wizualna` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged) |
| Progress rows remaining | 7 (`grep -c '^- \[ \]' plan.md`): 2.9, 5.12 `[reviewer] (CI at ship)`; 5.7-5.11 `[human]` |
| working tree | clean after this commit (throwaway spec and `dist-visual.local/` moved to the session scratchpad `s32/`) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/reviews/visual-review.md` | visual review, items 1-17, D4/D5 descriptions for rows 5.9/5.10, hand-checked numbers, ends with `VISUAL: PASS — …` |
| `context/changes/house-1-polish/screenshots/README.md` | route, hook facts and frame table |
| `context/changes/house-1-polish/screenshots/{desktop,tablet}-*.png` | 44 game frames (22 shots × 2 widths) |
| `context/changes/house-1-polish/screenshots/kit-*.png` | 7 read-only copies of `designs/martynka-house-1-polish-v1/screenshots/` (kitchen-stage-0..3, salon before/after comparison, house-four-rooms) |
| `context/changes/house-1-polish/plan.md` | row 5.6 ticked |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-visual.local` | `e2e hook: present (2 chunks checked)` (hook build, gitignored folder) |
| throwaway Playwright config + 2 specs (`visual.local/`, reusing `tests/e2e/support/*`), sandbox off, own `webServer` on 4399 | 10 passed (5.0 m): 5 tests × desktop/tablet |
| drawn counter vs arithmetic | 213 → 99 → 84 → 79 → 73 → 66 → 0; 134 → 0; 147 → 18 → 13 → 7 → 0; 23 + 1 = 24 — identical at both widths |
| kitchen total | 5 + 6 + 7 + (7 + 9 + 10 + 12 + 13 + 15 = 66) = 84 |
| surround pixel on frames 01, 04, 07, 08, 11 | `(255, 245, 223)` everywhere |
| salon vs kitchen cell fill (frame `desktop-11`) | 98 % × 96 % vs 71 % × 72 % |
| `npm run lint`, `npm run typecheck` after moving the throwaway out | clean |
| unit, build, e2e suite | not re-run: no source change in this step (docs and PNG only); the impl-review step's 4254 unit tests stay inherited, unverified here |
| servers | 4399 free after the run (Playwright stopped its `webServer`); 4397/4398 untouched |

## 4. Next command

`/10x-archive house-1-polish` then ship (no hosted db push)

## 5. Open

- `[human]` 5.7 save v7; 5.8 kitchen costs 84; 5.9 salon cell fill (D4, gap 207: the salon fills 98 % × 96 % of its cell like `house-four-rooms.png`, not cut); 5.10 salon before look (D5, gap 206: furniture greyed by the code grade, walls and floor worn by the pack, no double wear; Canvas shows it ungraded, gap 173); 5.11 tablet offline update.
- `[reviewer] (CI at ship)` 2.9: Deploy job `deploy`, step `Smoke check (deploy)`, `146 of 146 room pictures precached`; 5.12: Deploy job `build`, `Run npm test` `Tests  4251 passed | 3 skipped (4254)`, `Run npm run build` `e2e hook: absent (`.
- Gap 182 (kitchen task backdrop plain) seen again on frame 15, unchanged: follow-up 7 in `follow-ups/review-fixes.md`.
- PR body „dla właściciela produktu”: `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS`), `src/core/types.ts` (`SaveV7`), `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs` (`ROOM_PACKS`), `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.
- Follow-ups 1-14 in `follow-ups/review-fixes.md` (none added by this step).

## 6. Autonomous decisions

- V1. Playwright fallback without a Chrome attempt: fresh device per state, 21 purchases per width, reduced-motion emulation, Chromium without WebGL and a hook seam are needed; profile § 8 says Claude in Chrome cannot drive Phaser gestures. Rejected: wiping Chrome site data, mixing capture routes. Would change: a defect visible only in the maintainer's Chrome profile.
- V2. Items 5 and 8 captured on house visits, item 14 "after" on the salon with all but the last task bought (the salon stops being current at "Dalej"). Would change: nothing.
- V3. D4 and D5 kept as decided (P7, P8): their reversal conditions (a clipped cell, a clash in frames 7/9) did not occur; the rows stay `[human]`. Would change: the maintainer rejecting row 5.9 or 5.10.
- V4. No fix commit and no gap row: every observation matches the pack or an existing gap (173, 182, 206, 207). Would change: a frame showing something the pack and the gap table do not cover.
