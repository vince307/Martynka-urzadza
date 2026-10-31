# Handoff — `kitchen-room` (slice S-22)

Final pre-merge state written by the archive + ship step of run 2026-10-30-rooms-kitchen (2026-10-31): row 8.2 ticked from the orchestrator's e2e evidence (`066dd70`, full e2e 174 = 170 + 4), change archived (`b5a4e4e`, `context/archive/2026-10-31-kitchen-room/`, roadmap S-22 `done`, S-23 and S-25 ready for `/10x-plan`), CLAUDE.md follow-ups path moved to the archive. Archived with 6 open rows: 4.5 [visual] (animations not capturable, left open as the visual gate recorded), 5.8, 7.7, 7.8, 7.9 [human] (post-run checklist, not a blocker: they are maintainer decisions or a real-tablet check, none a code defect) and 7.10 [reviewer] (CI at ship, ticked by this step from the PR `check` log). PR/CI/merge/deploy recorded in context/runs/2026-10-30-rooms-kitchen/run-log.md. Earlier (visual-gate step), on `7e1441f`. Verdict **VISUAL: GAPS**: 16 states / 28 frames captured, kitchen matches the pack, star arithmetic checked, no code fix. The next agent must not get this wrong: **gap 182 (the task-screen backdrop is invisible while the kitchen is current) is a design question for the maintainer, not a bug to patch in archive or ship**; and the orchestrator's room-spec re-run for loader fix 82b690c (previous handoff §5) is still owed.

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` |
| Commits | p1-p8 `3412b6e`..`779a306`, `8ab15e2`, review fix `82b690c`, review docs `7e1441f`, this step's `docs(kitchen-room): bramka wizualna` (no `fix` commit) |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-30-rooms-kitchen/run-log.md (pushed by the ship step after this commit) |
| `change.md` status | `archived` (`archived_at: 2026-10-31T02:38:22Z`, commit `b5a4e4e`) |
| `## Progress` rows open | 6: 4.5 [visual], 5.8, 7.7, 7.8, 7.9 [human] (post-run checklist), 7.10 [reviewer] (CI at ship, ticked by the ship step from the PR `check` log); 8.2 ticked `066dd70` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kitchen-room/screenshots/*.png` | 28 frames: 14 desktop 1440×900, 14 tablet 1024×768 (states 01-16; a dash in the README marks a width not taken) |
| `context/changes/kitchen-room/screenshots/README.md` | route, input method, frame table (state · desktop · tablet · hook facts), kit frames compared, not captured |
| `context/changes/kitchen-room/reviews/visual-review.md` | per-state verdicts, pack comparison (positions, layering, captions), star arithmetic, decisions; last line `VISUAL: GAPS — …` |
| `docs/design-gaps.md` | row 181 closed with the bench-join note; new row 182 (backdrop invisible with the kitchen) |
| `context/changes/kitchen-room/follow-ups/review-fixes.md` | follow-ups 19 (backdrop, gap 182) and 20 (stand-in captions under `?e2eArt=room`), each with `Trigger:` |
| `context/changes/kitchen-room/plan.md` | 7.6 ticked with captured/not-captured list; 4.5 annotated, left open |
| `context/changes/kitchen-room/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/kitchen-room` |
| Hook dev server `E2E_HOOK=1 npx vite --config vite/config.dev.mjs --port 4399 --strictPort --host ::` | served; killed at the end (`lsof -ti tcp:4399 -sTCP:LISTEN \| xargs kill`, exit 143 of the background job) |
| Fresh origin `http://127.0.0.1:4399` | `indexedDB.databases()` `[]`, `localStorage.length` 0 before the game started |
| Star arithmetic (hook + drawn counter) | 200 + 1 = 201; salon 129 → 72; kitchen 72 → 67 → 41 → 16, +1 → 17, → 2 (= 72 − 71 + 1); free changes 17 and 2 unchanged |
| Kitchen runtime load after "Dalej" | `roomLoad.settled ['kitchen']`, `roomArtHealth` 21 / 0 missing, `save.dirty false` |
| Backdrop with the kitchen | `backdrop {drawn, blurred, webgl}`, `backdropPixel` [221, 206, 183]; nothing visible around the notebook (gap 182) |
| `?e2eArt=room` | `roomArtHealth` 21 / 21 missing, stand-ins drawn, controls intact |
| lint / typecheck / unit / build | not run: no source file changed in this step (docs, plan, gap file, screenshots only; no test reads `docs/design-gaps.md`) |
| Playwright | not used (step rule); ports 4397/4398 not touched |
| Leftover processes | `ps -U $(id -u)` with the sandbox disabled: no vite of mine; the listed `playwright test --workers=3` and `sleep 10` belong to the orchestrator and were left alone |

## 4. Next command

none — shipped

## 5. Open

- **Orchestrator (inherited, still owed):** re-run `tests/e2e/kitchen-room.spec.ts`, `rooms-as-data`, `salon-art`, `health-lines`, `room-change` after loader fix 82b690c, then the full e2e for row 8.2 (`<branch baseline> + 4`, total = `npx playwright test --list | tail -1`). This step changed no code, so it adds no spec to re-run.
- **Gap 182 / follow-up 19** (`SalonBackdrop.render`, `BACKDROP` in `src/data/layout.ts`): with the kitchen current, the task, summary and welcome screens look plain. The texture holds the kitchen, but the diorama is under the notebook and the pack margin is the page colour. A human decision is needed, together with row 7.8 (green board vs. cream margin): accept it for now, or ask the designer for a crop or framing.
- **Row 4.5 [visual], open:** the salon's last-purchase pop, the burst in flight, the hold of a finished room and reduced motion. Claude in Chrome cannot emulate `prefers-reduced-motion` or drive a long press. If wanted, capture them with Playwright `reducedMotion: 'reduce'` and `holdTouch` (`tests/e2e/support/hook.ts`).
- **Manual rows** (human checklist): 5.8 S-17 kitchen costs; 7.7 accept the interim visit button; 7.8 green board vs. cream margin (now also gap 182); 7.9 offline tablet kitchen load; 7.10 [reviewer] CI `check` at ship.
- **Follow-up 20** (`RoomLayer` stand-ins, `captionAnchor`): kitchen stand-in captions are partly covered under `?e2eArt=room`. This is a fallback only.
- Follow-ups 14-18 are unchanged, in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **Archive with open rows (ship step).** `/10x-archive` warned about 6 open rows; chosen "Continue archiving" (step prompt). Rejected: "Resume implementation", because no open row is a code defect: 5.8 and 7.7-7.9 are maintainer decisions or a real-tablet check (post-run checklist), 4.5 is animation the visual tool cannot capture, 7.10 is ticked at ship from CI. This would change if a [human] row reported a defect before the merge.
- **Row 4.5 left open** (visual-review.md shows only the settled card captured, not the pop, burst, hold or reduced motion).

- **Fixed by the maintainer (scope.md):** unchanged: save v5, the kitchen from locations-v2, one celebration, one room in renovation, no balance change, boot budget measured. No art or slot was invented. `designs/` was only read.
- **Gap 182 recorded, not fixed.** Rejected: zooming or cropping the backdrop, or painting a board behind the kitchen, because each would invent design (scope.md, profile § 6). This would change if the maintainer or designer specified a backdrop framing.
- **Fresh device `127.0.0.1:4399`, game only in the iframe, parent tab on `favicon.png`.** Rejected: `localhost` or `[::1]` (earlier gates may have left saves there), and a parent game page (two writers would trip `otherTab`). This would change if the server could not be reached over IPv4.
- **Taps as synthetic pointer and mouse events at the hook's `targets`.** Rejected: clicking screen coordinates per tap (about 40 purchases, each needing a screenshot to map). A tap was occasionally not taken right after a scene change or panel close, and the same tap a second later worked. This is judged a synthetic-input artefact, because the touch path is proven by `kitchen-room.spec.ts`. This would change if a real-touch run showed a missed first tap on "Salon", "Wybieram" or the task button.
- **7.6 ticked with its exceptions and 4.5 left open** (the F-04 precedent: 6.6 was ticked with a "NOT captured" list). 7.6's eight states were all captured except reduced motion. 4.5 is mostly animation that this tool cannot capture. This would change if Playwright captures of the animations were made.
- **Gap 181 closed with a note.** The bench is always bought after the counter (task order in `KITCHEN.tasks`), so "bench without counter" never shows in play. This would change if the kitchen's task order were reordered.
