# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by the visual gate step: `[visual]` 2.6 captured and verified at 1440 and 1024 (v2 legacy salon, v1 save, stalled salon picture), `VISUAL: PASS`, no code change. Only the two `[human]` rows remain; the next step archives. Do not tick the `[human]` rows: they need the maintainer (rollback note, iPad).

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 3062de6..b4c8565 (phases p1–p5, f4415a5, 4fb1a5b, review docs) + this docs commit `docs(salon-load-health): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; archive sets the next one) |
| `## Progress` rows remaining | 2 (`[human]` 1.6, 3.5) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/reviews/visual-review.md` | visual review: states, hand-checked numbers, `VISUAL: PASS` line |
| `context/changes/salon-load-health/screenshots/README.md` | frame table, route, how each state was reached |
| `context/changes/salon-load-health/screenshots/{desktop,tablet}-v01-*.png`, `-v02-*.png`, `-v03-*.png` | 10 frames (PNG, ≈ 1.2 MB) |
| `context/changes/salon-load-health/plan.md` | row 2.6 ticked |
| `context/changes/salon-load-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| throwaway Playwright spec (`tests/e2e/visual.local/`, hook build on 4399, projects 1440×900 and 1024×768) | 6/6 passed; texts asserted against `pl.settings.saveMigrated.kept(2)`, `.kept(1)`, `pl.settings.roomArtMissing(1, 26)` |
| runtime status read in the legacy-salon test | `migratedFrom: 2`, `backup: 'done'`, `migrationWrittenAt` set, store ops `backup, write, write`, `writtenVersion: 3` |
| hand-check | stars 3 / 7 / 0 = fixtures `save-v2-legacy-salon.json` / `save-v1.json` / fresh; room art total 26, missing 1 |
| local gate | not re-run: no code changed in this step (impl-review step observed it green; inherited, unverified here) |
| cleanup | `tests/e2e/visual.local/` deleted; preview on 4399 stopped, port not listening |

## 4. Next command

`/10x-archive salon-load-health`

## 5. Open

- [ ] `[human]` 1.6 — one-way door: after a rollback to a v2 build a v3 device shows the `future` card and plays without saving (`deploy/README.md` note).
- [ ] `[human]` 3.5 — iPad (WebKit): a stalled picture ends loading in ≤ 24 s and the game starts on stand-ins (`balance.loader`, `BootScene.preload`).
- Font load unlimited (`BootScene.preload`, `this.load.font`) and other review observations: `follow-ups/review-fixes.md` (20 entries, each with `Trigger:`).
- No new DESIGN-GAP (lines covered by gaps 43, 50, 67, 95).

## 6. Autonomous decisions

1. **Playwright fallback instead of Claude in Chrome.** Chosen: Playwright on the hook build. Rejected: Chrome extension. Why: the settings panel opens only after a 2 s touch hold on the gear drawn on the Phaser canvas plus the e2e seams of the hook build; the S-16a gate made the same call for canvas touches. Would change: a DOM entry to the parent settings.
2. **PNG kept, not JPEG.** Why: `sips` cannot write its temp file in the sandbox; the set is only ≈ 1.2 MB. Would change: a size limit on the folder.
3. **Extra states captured (v1, stall) beyond row 2.6.** Why: the step prompt asked for them; row 2.6 is ticked for the legacy-salon frames, the extras are recorded in the review. Would change: nothing.
