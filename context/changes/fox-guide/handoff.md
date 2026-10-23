# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-implement fox-guide phase 4` of run 2026-10-23-fox-guide: the CLAUDE.md fox sentences, the follow-ups file and the seam sweep are committed as 4d590fd. The next agent starts phase 5 (the e2e spec).

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phase 1 `e392442`, phase 2 `2d99dcf`, phase 3 `953ed88`, phase 4 `4d590fd`, plus the handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 11 (`grep -c '^- \[ \]' plan.md`); 4.4 waits for the orchestrator's e2e |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | "Current state" fox sentence group; S-16c UI pictures sentence names the fox poses; `npm run art` line of Commands names the three kits |
| `context/changes/fox-guide/follow-ups/review-fixes.md` | F1-F7, each with a `Trigger:` line (idle breathing, unlock card, 512 art, boot budget, anchor x 1802, "Obrazki" sentence, `modeWidgets`) |
| `context/changes/fox-guide/plan.md` | rows 1.4, 2.4, 3.4 ticked (orchestrator e2e 150/150 on 8cc3500), 4.1-4.3 ticked |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| `validate-rule-files.sh` | PASS (20 files, 0 missing) |
| deliberate break: a wrong path (`guideLayoutX.ts`) in CLAUDE.md | validator FAIL (missing: 1); restored, PASS |
| meta-check | the validator proves the paths named in the rule files exist, not that the prose is true; the prose was checked against the code by reading |
| `grep -c "Trigger:" follow-ups/review-fixes.md` | 8 (>= 6) |
| `grep -rn silhouette src` | only `src/core/guideLayout.ts` and `src/data/layout.ts` |
| lint / typecheck / `npm test` | OK / OK / 3891 passed (phase 3 count + 0) |
| deploy scripts, `sample` E1-E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| e2e | NOT run here (Chromium cannot start in the sandbox); orchestrator runs it, expect 150 + 0 |

## 4. Next command

`/10x-e2e fox-guide phase 5`

## 5. Open

- Row 4.4 stays unticked until the orchestrator's e2e run (150 + 0).
- Manual rows open: 3.5 [visual], 4.5 [visual], 4.6 [human], 4.7 [human], 4.8 [reviewer].
- Seam sweep found no duplicate silhouette or pose logic, and the headers of `uiArt.ts`, `make-task-art.mjs` and the `balance.loader` comment were already updated by phases 1-3; no unused tokens found by reading.
- `AGENTS.md` repeats none of the facts, not edited. Design-gaps rows 165-168 were read and are correct.

## 6. Autonomous decisions

- Phase 4 is `Driver: impl` (docs). Deliberate break chosen: a wrong path in CLAUDE.md against `validate-rule-files.sh`, as there is no code to break. Would change: none.
- 4.4 not ticked: its e2e half belongs to the orchestrator.
- Commit message `docs(fox-guide): ... (p4)` as only docs changed; stopped after this phase.
