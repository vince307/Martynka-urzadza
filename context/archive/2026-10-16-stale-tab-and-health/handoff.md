# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the visual-gate step of run `2026-10-16-fix-stale-tab-health`, final pre-merge state written by the ship step. The change is archived (`context/archive/2026-10-16-stale-tab-and-health/`); 10.7 (CI at ship) is ticked by the ship step from the CI log; 11.4 [human] stays open as a post-run checklist item.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | phases 1–12 up to `10de24c`, `cc1621d` (impl-review fix), `3e0636b` (impl review), `de28c3d` (visual gate), then the ship step's handoff, archive and CI-evidence commits |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-16-fix-stale-tab-health/run-log.md |
| `change.md` status | `archived` |
| `## Progress` rows remaining | 11.4 [human] (post-run checklist); 10.7 ticked at ship from the CI log |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/reviews/visual-review.md` | visual review of row 12.4: states, copy, focus, input switch, hand-checked numbers; ends with `VISUAL: PASS — …` |
| `context/changes/stale-tab-and-health/screenshots/README.md` | table state · desktop · tablet · how reached |
| `context/changes/stale-tab-and-health/screenshots/*.jpg` | 32 frames (16 states × 1440×900 and 1024×768), JPEG q 80, about 2.7 MB |
| `context/changes/stale-tab-and-health/plan.md` | 12.4 [visual] ticked (otherTab panel line noted as code-reviewed only) |
| `context/changes/stale-tab-and-health/follow-ups/review-fixes.md` | new VG-1 (service-worker update discovery, with `Trigger:`); "Panel heading alignment" moved to "Closed by this change" |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present (2 chunks checked)` (hook build, expected) |
| throwaway Playwright spec (`tests/e2e/visual.local/`, own config, 4399, projects 1440×900 and 1024×768), sandbox disabled | 22 passed (all states but takenOver), then takenOver passed per project in its own run (server swapped to a second hook build with `GITHUB_SHA=feedface…`) |
| hook facts observed | panel focus on "Klasa 1, I półrocze"; `inputEnabled` false with panel/card up, true after "Zatwierdź" and after the card's restart; card focus on "Zacznij od nowa"; gear hold under the card opens 0 gate dialogs; stars after restart 14 = other window's 14 |
| copy | every visible new line string-compared with `src/data/pl.ts` (`uiArtMissing(1, 5)` exactly) |
| local gate | not re-run: no source change in this step (impl-review observed it green on `cc1621d`; e2e 125 on `10de24c`, inherited) |
| ports | 4399 not listening at the end; 4397/4398 not used |

## 4. Next command

`none — shipped`

## 5. Open

- 11.4 [human]: iPad, the card reads calmly to a 6–8-year-old and "Zacznij od nowa" brings back the newest stars.
- 10.7 (CI at ship): workflow `CI`, job `check`, log lines `e2e hook: absent \([0-9]+ chunks checked\)` (step `npm run build`) and `Tests +[0-9]+ passed` (step `npm test`).
- Not captured: the panel's "Zapis gry" `otherTab` line (`saveHealthView` → `pl.settings.saveOff.otherTab`) — unreachable by design while `mountSaveRefusedCard` holds the input; existing follow-up "refusal card hides the parent's reason" covers it.
- Follow-up VG-1 in `follow-ups/review-fixes.md` (`registerServiceWorker` never calls `update()`; trigger: a deployed build not arriving at the next launch).
- DESIGN-GAP rows 116–121 unchanged (the kit has no settings panel or refusal card).

## 6. Autonomous decisions

- **Playwright, not Claude in Chrome**: the gear needs a canvas long press and the card needs rounds played on the canvas (profile § 8). Would change: a Chrome tool able to drive canvas touches.
- **Browser conditions simulated in the browser only** (held/aborted worker request via `context.route` with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`, `serviceWorker` removed, a never-resuming `AudioContext`, a throwing `localStorage.setItem` for `martynka:sound`); the app runs unchanged and no seam was added. Would change: an app seam for these states.
- **`takenOver` via an explicit `registration.update()`** after the reload, because Chromium's navigation soft update did not fire within 16 s; recorded as VG-1. Would change: evidence that real devices also miss the update.
- **12.4 ticked with one state code-reviewed** (otherTab panel line, unreachable on purpose); verdict PASS rather than NOT-CAPTURED because every reachable state was captured and matched. Would change: a decision to let the panel open over the card.
- **"Panel heading alignment" follow-up closed**: its trigger was this visual pass; the new sections match "Zapis gry"/"Obrazki". Would change: an author request to centre section headings like "Dźwięki".
- **Archive despite 2 open rows (ship step)**: `/10x-archive` warned `2 Progress items still pending (0 automated, 2 manual): 10.7, 11.4` and 25 rows without a SHA suffix (evidence rows citing gates and reviews; every cited SHA is in the branch history); chosen "Continue archiving" (the skill's Recommended label for manual-only rows). 11.4 [human] is a post-run checklist item for the maintainer, 10.7 is ticked from the CI log in the archived plan. No roadmap row exists for this change (non-roadmap fix); the roadmap is left untouched. Would change: a pending automated row, or a roadmap row with this Change ID.
