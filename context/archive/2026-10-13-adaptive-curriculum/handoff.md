# Handoff — `adaptive-curriculum` (slice S-07)

UPDATE (ship step): archived by `3864267` (`chore(archive): close adaptive-curriculum`); the open [human] rows 8.5–8.10 stay as the maintainer's post-run checklist (archive decision: Continue archiving — 0 automated, 6 manual rows pending; no SHA repoint, every cited sha is an ancestor of the branch head).

Written by the visual gate (autonomous run 2026-10-12-s04-s08). `VISUAL: PASS`, no code changed in this step (docs and
screenshots only), so the e2e re-run on `88e898c` the impl-review asked for still applies unchanged — this session
could not launch Chromium either.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phases `8fd7bd0` … `7d03dc7` (p9), review fix `88e898c`, impl-review `94ae4de`; this step adds one docs commit `docs(adaptive-curriculum): bramka wizualna` (no `fix` commit) |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-12-s04-s08/run-log.md |
| `change.md` status | `archived` (folder moved to `context/archive/2026-10-13-adaptive-curriculum/` by `3864267`; roadmap S-07 `done`, Backlog Handoff refreshed: S-08 ready for `/10x-plan`, S-07 triggers restated on S-08, S-11, S-16, S-17) |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): 8.5–8.10 [human] |
| Working tree | clean after the commit (capture scratch lives outside the repo) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/screenshots/*.png` | 12 frames: 6 states × desktop 1440×773 / tablet 1024×768 (summary pending, card long/short, round after „Dalej”, for E4 and E1) |
| `context/changes/adaptive-curriculum/screenshots/README.md` | capture method (one iframe resized in place), table state · desktop · tablet · how reached |
| `context/changes/adaptive-curriculum/reviews/visual-review.md` | verdict per state vs `unlock.png`, hand-checked step (E4 2→4, E1 4→5), touch target, ends with the VISUAL line |
| `context/changes/adaptive-curriculum/plan.md` | row 7.6 [visual] ticked with evidence |
| `context/changes/adaptive-curriculum/follow-ups/review-fixes.md` | + section „Bramka wizualna”: first tap after a resize sometimes lost in the extension tab (Trigger: first device playtest S-17 or a `Scale` config change) |
| `context/changes/adaptive-curriculum/handoff.md` | this file |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| Visual capture (Claude in Chrome, dev server 4399) | 6 states at 1440×773 and 1024×768, build id `94ae4de` in every frame; own tab closed; server stopped (4399 free) |
| Hand check | E4 age 8 October: position 1, progress 0, k = max(2, 0) = 2 of [1,2,4,5,6,8] → start 2; 1 skill, ceil(0.5·1) = 1 at mastery 4 → card after round 5 (ADD_SUB first tries 10 after round 4, 15 after round 5); next playable step 4 „Dopełnianie do dziesiątki” ✓. E1 age 6: progress 0.3, k = max(2, ceil(2.4)) = 3 of [2,3,4,5,6,7,9,11] → start 4 → card names 5 „Działania do 9” ✓ |
| Touch target | „Dalej” at 1024×768 = 240×57.6 CSS px (≥ 48) |
| Local gate | not re-run: no source file changed in this step (inherited from `94ae4de`: lint, typecheck, unit 881 = baseline 767 + 114, deploy/ops scripts, sample E1–E6 0 violations, build `e2e hook: absent` — inherited, unverified here) |
| `npx playwright test` | tried once as one plain command: Chromium did not launch (`SIGTRAP`, sandbox) — 5 failed at launch, 10 did not run; ports 4397/4398/4399 free afterwards. Still needed from the orchestrator on `88e898c`+ (expect 15 = baseline 14 + 1) |
| Deliberate break | none: no test or code written in this step |

## 4. Next command

none — shipped

## 5. Open

- E2E re-run (orchestrator) on the branch head: `npx playwright test`, expect 15 passed (main baseline 14 + 1).
- Rows 8.5–8.10 [human] (maintainer checklist): cold start resets mastery until S-11; calendar floor (rule D);
  „większość” = `≥ ceil(0.5 · n)`; unlock during easing; easing = weights 20/50/30; no automatic stage advance.
- Visual observation (follow-up „Bramka wizualna”): first tap after an iframe resize/reload sometimes ignored in the
  extension tab, with flight stars frozen — likely the throttled frame loop; check a rotate-and-back on a tablet
  (`TaskScene`, `Scale.FIT` in `src/main.ts` `createGame`).
- DESIGN-GAP rows 22–24 in `docs/design-gaps.md` (book art, narration of the card, card only after „Kolejna runda”) —
  frames show the documented behaviour; no new gap row.
- Earlier follow-ups in `follow-ups/review-fixes.md` unchanged (`SessionLearner.pendingUnlock` without stage — S-08/S-11;
  `Adaptation` keys — S-11; `playableSteps`/`firstPlayableSteps` — next change; calibration — S-17).

## 6. Autonomous decisions

1. Capture method: one game per run in a same-origin iframe, captured at 1024×768 and then resized in place to the
   1440×773 viewport, instead of two separate playthroughs per size. Why: the states need 5–7 rounds of play each and the
   game keeps no save before S-11; `Scale.FIT` re-fits on resize, so both frames show the same state. Rejected: replaying
   in the main tab at 1440 (doubles ~60 taps per name). Would change: a layout bug that appears only on a fresh load at
   one size (then capture that size from a fresh load).
2. Stages: E4 (parent override, age 8; current step 2 has 1 playable skill) for the long name and E1 (child path, age 6;
   no warm-up for E1) for the short name. Rejected: E5 step 3→4 („Mnożenie przez 0, 1, 5, 10”, 26 characters) — 2 skills
   with no faster path, only 1 character longer. The 28-character names are not a next step of any October start.
   Would change: a name longer than about 40 characters being added (then wrap is worth seeing).
3. Answers came from reading the task on the screen (no scene read), DOM parent dialog clicked through `click()` on its
   buttons after reading the problem text. Would change: nothing — the profile allows reading the dialog like an adult.
4. Kit frames not copied into the repo (`designs/` is read-only and gitignored; the repo is public); the review names
   the kit paths instead, as the S-06 gate did. Would change: the maintainer asking for `kit-*` copies in the change dir.
5. Card fill gradient flattened to `#fff7de`, plain notebook background and HUD star counter on the card accepted as
   placeholder choices already recorded in code (`PLACEHOLDER_COLORS.unlockCard`) and in earlier gates; no new gap row.
   Would change: S-16 art landing without a gradient-capable card.
6. The lost first tap after a resize logged as a follow-up rather than fixed: it was not reproducible on demand (2 of 5
   resizes worked first time) and matches the known throttled-loop artefact. Would change: a device repro.
7. E2E tried once (one plain command, sandboxed); no `dangerouslyDisableSandbox`. Since no code changed, the gate stays
   with the orchestrator's re-run. Would change: a fix commit in this step (none was needed).
