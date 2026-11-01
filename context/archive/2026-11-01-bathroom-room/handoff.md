# Handoff — `bathroom-room` (slice S-31)

Final pre-merge state, written by the archive + ship step: the change is archived to `context/archive/2026-11-01-bathroom-room/` (commit `chore(archive): close bathroom-room`), the CLAUDE.md follow-ups path points at the archive folder, and the branch is pushed for the PR. The earlier visual-gate step captured all fourteen items of plan row 5.6 (`VISUAL: PASS`).

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity … p1 `7c742b8`, p2 `32c2a5b`, p3 `69694ce`, p4 `8eab432`, p5 `a9a4ee5`, p6 `883a68b`, review fix `b1989b9`, impl review `beed03f`, then this commit `docs(bathroom-room): bramka wizualna` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-11-01-bathroom-polish-lab/run-log.md |
| `change.md` status | `archived` (2026-11-01) |
| `## Progress` rows remaining | 7: 3.8 and 5.12 `[reviewer] (CI at ship)`, 5.7-5.11 `[human]` |
| Working tree | clean after this commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/bathroom-room/reviews/visual-review.md` | visual review: 14 items judged, base cards vs `main`, hand-checked card width and stars, decisions, `VISUAL: PASS` line |
| `context/changes/bathroom-room/screenshots/README.md` | route, method and frame table with hook facts |
| `context/changes/bathroom-room/screenshots/{desktop,tablet}-*.png` | 32 game frames (16 shots × 2 widths) |
| `context/changes/bathroom-room/screenshots/kit-*.png` | 4 pack frames copied from `designs/martynka-bathroom-v1/screenshots/` (read only) |
| `context/changes/bathroom-room/plan.md` | row 5.6 `[visual]` ticked with the evidence |
| `context/changes/bathroom-room/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-visual.local` | `e2e hook: present (2 chunks checked)` (gitignored folder, moved to the scratchpad afterwards) |
| `npx playwright test --config=<abs>/visual.local/playwright.visual.config.ts` (sandbox off, port 4399, throwaway spec reusing `tests/e2e/support/*`) | 6 passed (5.9 min): routes A (house, four rooms), B (`?e2eArt=room`), C (base) × desktop, tablet |
| Hand check: card width | `roomDoneCardRect(4)`: 4·340 + 3·32 + 2·30 = 1516, left 202; drawn border at x ≈ 151 / 1289 on the 1440 frame (202·0.75, 1718·0.75) and ≈ 108 / 916 on the 1024 frame |
| Hand check: stars | 355 → 226 → 155 → 71 → 66 → 0 (bathroom 5+7+9+10+12+13+15 = 71); route B 40; base 200 → 100 → 0; `counterText` matched at both widths |
| `npm run lint` / `npm run typecheck` (after moving `visual.local/` out) | OK / OK |
| `npm test`, `npm run build`, e2e | not re-run: no source change in this step; last observed by impl-review (4233 = baseline 4215 + 18) |
| Port 4399 after the run | nothing listening (`lsof -ti tcp:4399 -sTCP:LISTEN` empty) |

No deliberate break in this step (no code or spec changed).

## 4. Next command

none — shipped

## 5. Open

- `[human]` checklist: 5.7 accept `roomDoneCardRect` / `RoomDoneCard.show` (card 1516 for four tiles); 5.8 costs 5 + 7/9/10/12/13/15 = 71; 5.9 wording (gap 205); 5.10 room (not house) celebration at the end of house 1; 5.11 real tablet offline.
- `[reviewer] (CI at ship)`: 3.8 Deploy job `deploy` step `Smoke check (deploy)` prints `144 of 144 room pictures precached`; 5.12 Deploy job `build` steps `Run npm test` (expected `Tests  4230 passed | 3 skipped (4233)`) and `Run npm run build` (`e2e hook: absent (`).
- Visual observation: the three-digit balance in the HUD pill (`StarCounter`) touches the star; already follow-up 12 in `follow-ups/review-fixes.md`, not changed here.
- Visual observation: the salon miniature fills its house cell and card tile more than the other rooms; S-32's scope (`[human]` P2 row on `martynka-house-1-polish-v1` in `docs/human-checklist.md`).
- No new `DESIGN-GAP`. Follow-ups: `follow-ups/review-fixes.md` (items 1-3, 7-12 open with `Trigger:`).
- Archive: done; CLAUDE.md follow-ups path rewritten to `context/archive/2026-11-01-bathroom-room/`. Open `[human]` rows 5.7-5.11 are a post-run checklist (the PR body lists them), not an archive blocker.

## 6. Autonomous decisions

- Playwright fallback without a Chrome attempt: every frame needs a fresh device and 35 purchases per width plus change-mode taps; profile § 8 says Chrome cannot drive Phaser gestures. Rejected: wiping Chrome site data, mixing sources. Would change: a defect visible only in the maintainer's Chrome profile.
- Base cards judged against `main`, not against the hangar-module frames (wider tiles there): the 340 tile came with S-25, already shipped, and `roomDoneCardRect(2)` gives the same 1144 card as `main`. Would change: a maintainer wish for wider tiles on two-tile cards.
- Item (8) captured in the mint family through change mode (the path the plan names); sunny not captured. Would change: a defect specific to the sunny pictures.
- No fix: no discrepancy introduced by the slice was found. Would change: nothing.
