# Handoff — `first-building-choice` (slice S-28)

Written by the visual-gate step of run 2026-10-31-space-base: row 8.6 is captured (34 frames at 1440 and 1024) and ticked, `VISUAL: PASS` after one fix (`1fef8ed`, the welcome sunflower drawn only on the age view). The next step archives the change and ships; do not tick the `[human]` or `(CI at ship)` rows. `SAVE_VERSION` stays 6.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 27 in `fc13e8c..HEAD`: phases p1-p9, review fix `f6e9b17`, visual fix `1fef8ed`, visual docs `86d4831`, this handoff on top |
| pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged by this step) |
| `## Progress` rows remaining | 8 (`grep -c '^- \[ \]' plan.md`): 2.6, 3.8, 5.7, 8.7, 8.8, 8.9, 8.10, 8.11 (8.6 ticked by this step) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/WelcomeScene.ts` | `create`: `const choice = …`; the sunflower is drawn only when `!choice` (fix `1fef8ed`) |
| `src/data/layout.ts` | `WELCOME_LAYOUT.flower` comment: age view only |
| `tests/welcomeChoiceWiring.test.ts` | new case "draws the sunflower on the age view only …" |
| `docs/design-gaps.md` | row 20 text: sunflower on the age view only |
| `context/changes/first-building-choice/screenshots/` | 34 game frames (`desktop-NN-*`, `tablet-NN-*`), 5 pack frames (`kit-*`), `README.md` (route, hook facts, frame table) |
| `context/changes/first-building-choice/reviews/visual-review.md` | the gate: discrepancy and fix, verdict per item, hand-checked stars, ends with the VISUAL line |
| `context/changes/first-building-choice/follow-ups/review-fixes.md` | new section "From the visual gate", entry 19 (three-digit star counter) |
| `context/changes/first-building-choice/plan.md` | row 8.6 ticked with evidence |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` at `1fef8ed` | `e2e hook: present (2 chunks checked)`; served by `vite preview` on 4399, stopped after the run (4399 free) |
| throwaway Playwright spec (removed), projects desktop 1440×900 / tablet 1024×768 | 12 tests passed (A-F × 2), 34 frames; first capture on `e03531b` showed the fault |
| `npm run lint`, `npm run typecheck` | OK (after the throwaway spec was removed) |
| `npm test` | 4171 passed (baseline 4092, +79; previous step 4170, +1 new case) |
| deploy / ops shell tests, `sample` E1-E6 | OK, all six exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| break: drop `!choice &&` in `WelcomeScene.create` | `welcomeChoiceWiring.test.ts` 1 failed / 7 passed; restored, 8 passed. Meta: pins the source guard; pixels proven by frames 01/01b/02/03 on `1fef8ed` |
| hand-checked number | `BRIDGE.tasks` 6+10+13+14+17+19+21 = 100; counter 100 → 94 → 84 → 71 → 57 → 0 across frames 04-07 |
| `npx playwright test` (full suite) | not run in this step (change is a one-line draw guard; the orchestrator re-runs e2e at gates) |

## 4. Next command

`/10x-archive first-building-choice` then ship

## 5. Open

- **Human checklist:** 2.6 v6 rollback note (`deploy/README.md` § 6); 8.7 "Wróć" hidden after a purchase (P3); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100, cap 21; 8.9 choice layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline.
- **(CI at ship):** 3.8 Deploy `deploy` step `Smoke check (deploy)`: `ok   precache covers room pictures — 79 of 79 room pictures precached`; 5.7 same step: `ok   precache covers choice pictures — 2 of 2 choice pictures precached`; 8.11 Deploy `build`: `Tests +[0-9]+ passed` and `e2e hook: absent (`.
- **Follow-ups** (`follow-ups/review-fixes.md`): 14-18 as before; new 19: `StarCounter` / `TASK_LAYOUT.starCounter` — at 100+ stars the "1" touches the star (Trigger: next change to `src/ui/widgets/StarCounter.ts`).
- **DESIGN-GAP rows added:** none (row 20 text updated).
- **Known risks:** fresh-install room art not judged by "Obrazki" until loaded (F8); a learner-less save with a purchase skips the choice (`WelcomeScene.place`, `hasPurchase`).

## 6. Autonomous decisions

- **Playwright fallback after a Claude-in-Chrome attempt.** Chrome opened its own tab on 4399 and reached the game (Polish voices present), but the maintainer's profile already held a save for that origin, so a fresh device would have meant clearing the maintainer's site data; the tab was closed. Rejected: wiping site data; mixing Chrome and Playwright frames. Would change: a defect only visible in the maintainer's Chrome.
- **Fixed the sunflower instead of a gap.** The pack's choice frame has no decoration and the sunflower is our own placement (gap 20). Rejected: moving the flower (no free place in the choice layout). Would change: the maintainer wanting the flower on the choice view, which needs a new place.
- **Three-digit star counter left as follow-up 19.** A neighbouring view (`StarCounter`), the number stays inside the pill. Would change: a playtest note or the maintainer asking for it in this slice.
- **Item (6) read as panel open on each family plus one placed slot per family** (frames 06a-06d). Would change: a plan author meaning the whole room in one family.
- Earlier steps' decisions stand as recorded in `plan.md` and the previous handoffs.
