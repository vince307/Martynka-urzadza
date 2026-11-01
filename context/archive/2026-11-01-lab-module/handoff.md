# Handoff — `lab-module` (slice S-33)

Written by the ship step of run 2026-11-01-bathroom-polish-lab (final pre-merge state): the change is archived to `context/archive/2026-11-01-lab-module/`, roadmap S-33 is `done` and S-34 is ready for `/10x-plan`. The one thing not to get wrong: the remaining open rows are [reviewer] (CI at ship), proved by the post-merge Deploy log, and [human] only (post-run checklist, not a blocker).

## 1. State

| | |
|---|---|
| branch | `feat/lab-module`, cut from `main` at `60472aa` |
| commits | `b255848`..this handoff commit; phases `947e665` (p1), `e9e6ae2` (p2), `48e67df` (p3), `88004b6` (p4), `be81f83` (p5), epilogue `0f4d052`, review fix `7c8b9a5`, impl review `b35554b`, then `docs(lab-module): bramka wizualna` |
| pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-11-01-bathroom-polish-lab/run-log.md |
| `change.md` status | `archived` (commit `chore(archive): close lab-module`) |
| Progress rows remaining | 7 of 35: 1.8, 3.7, 4.12 [reviewer] (CI at ship); 4.8-4.11 [human] |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/archive/2026-11-01-lab-module/reviews/visual-review.md` | visual gate, items (1)-(11), hand-checked stars, ends `VISUAL: PASS — …` |
| `context/archive/2026-11-01-lab-module/screenshots/README.md` | route, hook facts, frame table |
| `context/archive/2026-11-01-lab-module/screenshots/{desktop,tablet}-*.png` | 24 game frames (12 shots × 2 widths) |
| `context/archive/2026-11-01-lab-module/screenshots/kit-*.png` | 4 pack frames copied read-only from `designs/bystrow-space-base-v3/screenshots/` and `designs/bystrow-space-base-v5/screenshots/` |
| `context/archive/2026-11-01-lab-module/plan.md` | row 4.6 ticked |
| `context/archive/2026-11-01-lab-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-visual.local` | OK, `e2e hook: present (2 chunks checked)` (hook build, as intended) |
| throwaway `npx playwright test --config=<abs>/visual.local/playwright.visual.config.ts` (sandbox disabled, port 4399) | 6 passed (4.0 m); route C re-run `-g "C lab stand-ins"` 2 passed (1.4 m) |
| `npm run lint` (after moving `visual.local/` and `dist-visual.local/` to the scratchpad) | OK |
| typecheck / unit / build / single spec | not run: no source change in this step (last observed green in the impl-review handoff, `Tests 4263 passed`) |
| hand check | `LAB.tasks` 6 + 10 + 13 + 14 + 17 + 19 + 21 = 100; drawn counter 300 → 200 → 100 → 94 → 0 and 216 → 16 → 10 → 0, as expected |
| servers | none left (`lsof -ti tcp:4399 -sTCP:LISTEN` empty; no `vite`/`playwright` in `ps -U $(id -u)`) |

No deliberate break in this step (no code or spec changed).

## 4. Next command

`none — shipped`

## 5. Open

- [reviewer] (CI at ship) 1.8 (`deploy` / `Smoke check (deploy)`: `167 of 167 room pictures`), 3.7 (`6 of 6 house pictures`, `precache served: 261/261`), 4.12 (`build` / `Run npm test`: `Tests  4260 passed | 3 skipped`; `Run npm run build`: `e2e hook: absent (`).
- [human] 4.8 costs 6-21 = 100 (`LAB.tasks`), 4.9 wording (gap 208, `pl.room.tasks`), 4.10 no teaser on the last module (`houseRoomList`), 4.11 real tablet offline (also: does the mint frame read on a real screen).
- No new `DESIGN-GAP`. Existing gap 174 kind seen on the stand-in path (microscope box touching the task button, `RoomLayer` stand-in) — no new row.
- Follow-ups: `context/archive/2026-11-01-lab-module/follow-ups/review-fixes.md` (12 `Trigger:` lines), unchanged. No `ARTIFACT GAP`.

## 6. Autonomous decisions

- Playwright fallback instead of Claude in Chrome: fresh device per route, 21 purchases per width, `?e2eArt=room` seam, and profile § 8 says Chrome cannot drive Phaser gestures. Rejected: wiping Chrome site data. Would change: a defect visible only in the maintainer's Chrome profile.
- Items (5) and (7) captured as one frame (`*-05-07`): the furnished look is reached only through the card and "Dalej" keeps the same room. Would change: nothing.
- Route C extended by one slot purchase to show a labelled stand-in box. Would change: nothing.
- The first run's relative output path wrote the frames to `/Users/kamilp/Dev/context/…` outside the repo; I moved them into the change dir (sandbox disabled for that move only) and removed the stray folder; the re-run used an absolute path. Would change: nothing.
- No fix, no gap row: every finding matches the pack or an existing gap. Would change: the maintainer rejecting 4.8 or 4.9.
- Ship step: archived with 7 open Progress rows (1.8, 3.7, 4.12 [reviewer] (CI at ship); 4.8-4.11 [human]). Chosen: archive (skill's "Continue archiving"). Rejected: "Resume implementation". Why: the [reviewer] rows can only be proved by the post-merge Deploy log and the [human] rows are the post-run checklist; no automated row is open. Would change: an open automated row without the (CI at ship) tag.
