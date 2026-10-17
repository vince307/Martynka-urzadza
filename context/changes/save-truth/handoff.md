# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

The visual gate step wrote this handoff. All ten [visual] rows were captured at 1440×900 and 1024×768 and ticked, and the gate passed. No code changed. The next agent must not get two things wrong:
- The save format stays v4.
- Three of the served states came from local seams that were reverted before any commit: `vgmigfail`, `vgv1writehang` and `vgOlder`. They must not be re-added to the source.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-15 + handoffs, then the impl-review fix 209afe3 and `docs(save-truth): impl review` 7aa074c, then `docs(save-truth): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (the archive step sets the next one) |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): 13.7 (CI at ship), [human] 3.8, 4.6, 11.6, 14.4, 15.4 |
| Working tree | clean after the docs commit (`dist-e2e/` is gitignored) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/screenshots/*.jpg` | 52 frames: 26 states × desktop and tablet |
| `context/changes/save-truth/screenshots/README.md` | table of state, desktop, tablet and how each was reached, plus the three local seams |
| `context/changes/save-truth/reviews/visual-review.md` | verdict per row, hand-checked values, focus check, decisions; ends with `VISUAL: PASS — …` |
| `context/changes/save-truth/follow-ups/review-fixes.md` | entry 28 (VG-1: the "Zapis gry" `Kod:` is the bare reason, while the card shows step or field), with `Trigger:` |
| `context/changes/save-truth/plan.md` | [visual] rows 1.7, 2.6, 3.7, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5 ticked |

## 3. Verification

| command | result |
|---|---|
| Throwaway Playwright spec (`tests/e2e/visual.local/`, moved out afterwards) against `dist-e2e` on 4399 | 24 passed (12 flows × 2 viewports) |
| Hand-check: stars | 7 (v1 fixture) + 5 × 1 + clean-round bonus 2 = 14, matching the counter; the exported `backup-v1` copy holds `stars: 7` |
| Hand-check: over-count | `tasksDone` 99 capped at the 12 salon tasks gives "Salon: 12 z 12", with the mismatch line |
| Initial focus | never on a destructive action. After "Zastąp mimo to" in reset it is "Anuluj"; on the over-count preview it is "Anuluj"; on import of the first and second `unavailable` start it is "Zamknij" |
| Local gate | not re-run: no source changed. Last observed green by impl review on 209afe3/7aa074c (unit baseline 3416 + 129, e2e baseline 127 + 5) |
| Temporary patches | `git checkout -- src/main.ts src/testing/e2eHook.ts` right after the build; `git status` showed only `screenshots/` |
| Port 4399 | not listening after the step (background preview stopped) |

## 4. Next command

`/10x-archive save-truth then ship`

## 5. Open

- [human] checklist:
  - 3.8: force only from the second `unavailable` start, and the wording of gap 126. The frames are `*-unavailable-*`.
  - 4.6: the FIRST old copy is kept.
  - 11.6: the wording of gaps 127-136. The frames are `*-health`, `*-reset-*` and `*-export-*`.
  - 14.4: two tablet tabs.
  - 15.4: the Files app opens the kept copy.
  - Also decide follow-up 23.
- 13.7 `(CI at ship)`: workflow `CI`, job `check`.
- Follow-ups 23-28 in `follow-ups/review-fixes.md`. Entry 28 is new: `offState` in `src/core/saveHealth.ts` quotes `loadReason`, while the card quotes `unreadableCode`.
- Design gaps 126-138 are unchanged. The frames show their copy as written.

## 6. Autonomous decisions

1. **Playwright fallback, not Claude in Chrome.**
   - Why: every panel state needs the 2 s gear hold on the canvas and played rounds. This is the same route as the child-flow-guards gate.
   - Would change: a Chrome tool able to drive canvas touches.
2. **Three local seams in the served build only, reverted before any commit.**
   - What they reached:
     - `vgmigfail`: a v1 record whose `stars` getter throws, giving `migration-failed/1`.
     - `vgv1writehang`: v1 with hanging writes, for the `pending` line.
     - `vgOlder`: `saver.noteOlderWriter()` on real IndexedDB.
   - Rejected: writing IndexedDB by hand (forbidden), and committing new seams (a code change in a visual gate).
   - Why: plan row 2.6 names a locally patched step. The pending and older-writer states have no seam, and no pre-v4 build exists.
   - Would change: a maintainer asking for committed seams.
3. **VG-1 deferred** to follow-up 28, not fixed.
   - Why: it predates the slice, both codes are true, and a fix needs a new runtime status field and changes to the unit tests.
   - Would change: a [human] call at ship.
4. **`dist-e2e/` left with the patched build.**
   - Why: it is gitignored, and the e2e `webServer` always rebuilds it (`reuseExistingServer: false`). Deleting it was denied by the permission prompt.
   - Would change: any tool that serves `dist-e2e` without rebuilding.
