# Handoff — `final-sound` (slice S-16b)

Final pre-merge state written by the ship step of run 2026-10-15-fix-s16bcd (archive before push). Earlier: written by the visual-gate step. The visual gate passed (VISUAL: PASS, no code change), row 7.4 is ticked, only the two [human] iPad rows remain. The impl review's MERGE condition (full e2e on code sha `82860d2`, 109 = 104 + 5) was observed by the orchestrator on `ceff218`: 109 passed.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | docs + p1..p10 + handoffs, `a15adf7` + `82860d2` (review fixes), `ceff218` (impl review), then this `docs(final-sound): bramka wizualna` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-15-fix-s16bcd/run-log.md |
| `change.md` status | `archived` (ship step) |
| `## Progress` rows remaining | 2: [human] 9.7, 10.6 (`grep -c '^- \[ \]' plan.md` = 2) |
| Working tree | clean after the commit; `tests/e2e/visual.local/` deleted |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/reviews/visual-review.md` | visual review: states, teacher read of `soundMissing` at N = 1, 3, 12, hand-checked numbers, VISUAL line |
| `context/changes/final-sound/screenshots/README.md` | frame table (state · desktop · tablet · how reached) |
| `context/changes/final-sound/screenshots/{desktop,tablet}-v00…v05-*.png` | 12 frames: panel top, "Dźwięki" healthy, missing N = 1 / 3 / 12, toggled |
| `context/changes/final-sound/plan.md` | row 7.4 ticked |
| `context/changes/final-sound/follow-ups/review-fixes.md` | one follow-up: mixed h2 alignment in the panel (trigger: next settings-panel layout change or S-17) |
| `context/changes/final-sound/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK (`e2e hook: present`, as expected for the hook build) |
| throwaway Playwright spec (own config, 1440×900 + 1024×768, port 4399) | 8 passed (4 states × 2 widths); hook `sound.missing` = 0 / 1 / 3 / 12 before each panel |
| panel DOM dump | card scrollWidth = clientWidth = 712, document width = viewport; groups named via `aria-labelledby`; 12 group buttons 64 px |
| `validate-rule-files.sh` | PASS (412 paths) |
| lint, typecheck, unit, build | not re-run: no code changed (inherited from impl review on `a15adf7`/`82860d2`: 3034 = baseline 2970 + 64, unverified here) |
| e2e full `--workers=4` on `82860d2` | NOT observed (orchestrator's MERGE condition) |

Port 4399 not listening after the step; no other server started.

## 4. Next command

`none — shipped`

## 5. Open

- Impl-review MERGE condition met: the orchestrator observed full `npx playwright test --workers=4` on `ceff218` (code = `82860d2`): 109 passed.
- [human] 9.7: iPad listening (unlock on first touch, effects with speech, volume, music loop click, silent switch; `purchase` on a free change, one `answer-retry`, `tap` + `round-bonus`).
- [human] 10.6: iPad offline, sounds from the cache.
- Follow-up added: heading alignment in `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (see `follow-ups/review-fixes.md`). Earlier follow-ups unchanged.
- Impl-review observations F5-F8 stay recorded only (`QUIET_REJECTIONS` in `src/core/errorSignal.ts`, OGG vs M4A in Chromium, `purchase` + `room-done` overlap in `RoomScene`, precache +1.1 MB).

## 6. Autonomous decisions

- Playwright fallback instead of Claude in Chrome: the panel opens only after a 2 s touch hold on the canvas gear (Chrome's synthetic events are ignored by Phaser, profile § 8) and missing sounds need `page.route`. Would change: a DOM entry to the panel.
- Own throwaway config (no `webServer`, baseURL 4399) rather than the repo config with `E2E_HOOK_PORT=4399`: the repo config would also build and start the production server on 4398. The spec file was still named `final-sound.spec.ts` as asked. Would change: nothing.
- Extra state N = 3 captured (the 2–4 form) beside the asked N = 1 and N ≥ 5, so all three Polish forms are read. Would change: nothing.
- The plan's "≥ 96 px" is read as the scene buttons rule; the DOM panel's 64 px pills are the existing reading-group pattern, not a defect. Would change: a design rule that DOM panel buttons must also be ≥ 96 CSS px.
- Mixed h2 alignment recorded as a follow-up, not fixed: it predates this slice and changing it touches neighbouring sections (contract: no redesign of neighbouring views). Would change: the maintainer asking for one heading style.
