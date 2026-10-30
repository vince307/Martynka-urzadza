# Handoff — `rooms-as-data` (slice F-04)

Final pre-merge state written by the archive + ship step of run 2026-10-30-rooms-kitchen (2026-10-30): row 7.2 ticked (`a69828f`), change archived (`9a7f7e4`, `context/archive/2026-10-30-rooms-as-data/`, roadmap F-04 `done`, S-22 ready for `/10x-plan`), CLAUDE.md follow-ups path moved to the archive. PR/CI/merge/deploy recorded in context/runs/2026-10-30-rooms-kitchen/run-log.md. Earlier (visual-gate step): the slice is reviewed (`MERGE: CLEAR`) and visually gated: `VISUAL: GAPS`. Every child-facing room state matches `main`. The welcome backdrop and the parent-only settings states were not captured. The next agent must not read GAPS as a blocker: per `visual-gate.md`, GAPS does not block shipping. The e2e re-run owed by the previous step (§5) is the orchestrator's, not this step's.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phases `dd6db69` (p1) … `9bfa475` (p7), review fix `4b1c37e`, docs commits up to `17d3756`; this step adds `docs(rooms-as-data): bramka wizualna` (screenshots, README, visual review, plan row 6.6, this handoff); no `fix` commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-30-rooms-kitchen/run-log.md (pushed by the ship step after this commit) |
| `change.md` status | `archived` (`archived_at: 2026-10-30T23:02:04Z`, commit `9a7f7e4`) |
| `## Progress` rows remaining | 3: 6.7 [human], 6.8 [human] (post-run checklist), 6.9 [reviewer] (CI at ship, ticked by the ship step from the PR `check` log) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/archive/2026-10-30-rooms-as-data/screenshots/{desktop,tablet}-0{1..7}-*.png` | 14 frames: room before, after the stage with sofa and rug, done card, finished room, change mode, change panel, task backdrop (1440×900 and 1024×768) |
| `context/archive/2026-10-30-rooms-as-data/screenshots/README.md` | route (Claude in Chrome, fresh origin `[::1]:4399`, iframe sizes), table of state · desktop · tablet · how reached, not-captured list |
| `context/archive/2026-10-30-rooms-as-data/reviews/visual-review.md` | verdict per state vs `main`'s salon-style frames, hand-checked star arithmetic, decisions; ends `VISUAL: GAPS — …` |
| `context/archive/2026-10-30-rooms-as-data/plan.md` | row 6.6 ticked with what was captured and what was not |
| `context/archive/2026-10-30-rooms-as-data/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `E2E_HOOK=1 npx vite --config vite/config.dev.mjs --port 4399 --strictPort` | served the hook build; killed at the end (`lsof -ti tcp:4399 -sTCP:LISTEN \| xargs kill`, exit 143 seen) |
| hook `snapshot` along the path | stars 130 → 109 after stage + sofa + rug (5 + 7 + 9) → 1 after all 12 tasks (sum 129); `card.items` = salon (done) + teaser; `house` = house-1, salon (0,0), kitchen (0,1); change-mode "Wybieram" kept stars 1 and set `chosen.sofa` 2; `backdrop {salon, drawn, blurred, webgl}` |
| frame comparison vs `context/archive/2026-10-24-salon-style/screenshots/desktop-room-{before,done-card}.jpg` | same layout, positions and copy; differences only in chosen looks, star count and the HUD speaker (silenced in the old capture) |
| lint / typecheck / unit / build | NOT run: this step changed no code (docs and PNGs only) |
| e2e | NOT run: ports 4397/4398 held by the orchestrator; Playwright excluded by the step prompt |
| leftovers | own server killed; the remaining `vite preview` on 4397/4398 belong to the orchestrator and were left alone |

## 4. Next command

none — shipped

## 5. Open

- Carried from the previous step (orchestrator): E2E re-run of `#10 rooms-as-data a finished salon reopens in the salon, never in the kitchen cell`. Its deliberate break: in `roomInRenovation` (`src/core/house.ts`), make an unknown room `return cell.room` instead of `continue`. Then 7.2, full e2e = `<branch e2e baseline> + 3`.
- Visual not captured (VISUAL: GAPS): the welcome backdrop; settings "Zapis gry" after `?e2eSave=v4-salon` (the migration and `backup-v4` lines); the "Salon" room name in the export/import/reset summaries (`roomText.name` in `UIScene.openImport`/`openReset`). All of them need the gear long press, which needs Playwright (profile § 8). Covered by e2e/unit only.
- Human checklist: 6.7 [human] accept the rollback risk (`pl.saveFuture`, `deploy/README.md` v5 note). 6.8 [human] accept the unit and in-memory-seam proof instead of two real builds. 6.9 [reviewer] at ship: CI `check` log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- DESIGN-GAP: none added. Follow-ups: `context/archive/2026-10-30-rooms-as-data/follow-ups/review-fixes.md` (1–15), none added here.

## 6. Autonomous decisions

- **Archive despite 3 open Progress rows (archive + ship step).** Chosen: "Continue archiving" (fixed by the step prompt). Open: 6.7 and 6.8 are [human] acceptances, a post-run checklist for the maintainer, not a blocker; 6.9 is the CI-at-ship row ticked from the PR `check` log. The 8 rows without a SHA suffix are gate/evidence rows (no code diff). Would change: a [human] row that must hold before merge (none: the maintainer authorised full ship, scope.md).
- **Handoff written inside the archived folder.** The archive is read-only by convention, but the step prompt asks for the final pre-merge state here; one docs edit before the push.

- **Claude in Chrome only, no Playwright fallback.** The step prompt forbids Playwright now. Why: the orchestrator's e2e run holds the machine's Playwright ports. Would change: free ports and a need for the long-press states. Then a throwaway Playwright spec on 4399 could capture "Zapis gry" and the summaries.
- **Fresh device = origin `http://[::1]:4399`.** `localhost:4399` already held a `martynka` database. Rejected: "Zacznij od nowa", which is behind the long press. Rejected: clearing storage by hand, which the profile forbids. Would change: Vite listening on IPv4 too, so that `127.0.0.1` could serve the same purpose.
- **One playthrough, iframe resized per state.** Both widths of a state show the same game state. Rejected: two playthroughs. Would change: a scene whose layout is fixed at creation time.
- **Row 6.6 ticked with an explicit not-captured list, instead of left open.** The step's four required states plus the task backdrop are verified. The rest is recorded as GAPS. Would change: the orchestrator requiring every listed sub-state before a tick. Then untick the row and run a Playwright pass for the long-press states.
- **PNG kept although the earlier gates used JPEG.** The step prompt asks for `*.png` (about 11 MB in all). Would change: a repository size concern. Then re-encode as JPEG quality 80, as in the salon-style gate.
