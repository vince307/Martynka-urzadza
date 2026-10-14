# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-plan-review` step of run `2026-10-14-fix-art-stand-in`. Verdict PROCEED; `plan.md` now has 9 phases
(old Phase 3 split into 3 signal/seam/filter and 4 "Obrazki" panel line; later phases renumbered 5–9). The next agent must
add `unlockThreshold(n, share)` in `src/core/curriculum.ts` and use it in both `unlockReady` (behaviour unchanged) and the
filter, and must not let the filter consume rng when nothing is missing.

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | 4 on the branch after this step (`a2baebb`, `d79fe64`, `e6fb56a` plan, + `docs(art-stand-in-and-load-signal): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 49 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (four change files staged by path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-stand-in-and-load-signal/reviews/plan-review.md` | Review report: 0 critical, 3 warnings, 6 observations, step-prompt judgments, `VERDICT: PROCEED` |
| `context/changes/art-stand-in-and-load-signal/plan.md` | Triage applied: Phase 3 split (F1), `unlockThreshold` helper (F2), `deviceUnreadable` copy + known risk (F3), E4.7 screenshot row (F4), `ROUND_SPEC` required + helpers named in Phase 9 (F5), triggered follow-ups and explicit `e2eArt` guard cases (F6) |
| `context/changes/art-stand-in-and-load-signal/plan-brief.md` | Phases table and effort updated to 9 phases |
| `context/changes/art-stand-in-and-load-signal/change.md` | `status: plan_reviewed` |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| python check: Success Criteria bullets per phase vs `## Progress` rows, row numbering, no checkboxes in phase bodies | one-to-one for all 9 phases; numbering 1..k per phase; 0 checkboxes outside Progress |
| `grep -c '^Driver: ' plan.md` | 9 (one per phase) |
| code checks (grep/read) | `unlockReady` formula, `skillBuckets`, `pickRoundSkills`, `writesOff`, `main.ts` card per launch, `forcedSkills`, `playwright.config.ts` `ROUND_SPEC`/`chromium-hook`, skill ids — all as the plan states (details in the review's Grounding) |
| lint / typecheck / unit / build / e2e | not run: review step, no product code changed; baseline per contract (`1812347`: unit 1865 incl. 1 flaky, e2e 46) inherited, unverified |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-tdd art-stand-in-and-load-signal phase 1`

## 5. Open

- Phases: 1 tdd (core `artHealth`, `artFilter`, `unlockThreshold`, round/warm-up wiring, spoken timeouts), 2 tdd (`replace` refuses `unavailable`, `deviceSaveView`), 3 impl (`TaskArtEntry.id`, `BootScene` record, `?e2eArt` seam + marker + explicit guard cases, `TaskScene.freshRound` filter), 4 impl ("Obrazki" `artHealthView` in the panel), 5 impl (`TASK_ART.label`, `ArtImage` fit), 6 impl (import/reset dialogs), 7 impl (seam sweep, follow-ups, `CLAUDE.md`), 8 e2e #11 (`art-stand-in.spec.ts`, +4), 9 e2e #2 (`save-transfer-blocked.spec.ts`, +2, must be added to `ROUND_SPEC`). E2E phases use the request-file protocol.
- Human checklist: `[human]` 6.7 decision against PRD FR-022 (no import/reset under `unavailable`); `[human]` 7.7 decision on FR-013 (round composition changes when art is missing, with the current-step threshold rule). `[visual]` 4.5, 5.6, 6.6; `[reviewer]` teacher reads 4.4, 5.5, 6.5.
- Known risk added (F3): under `unreadable`, the panel's "Zapisz kopię" exports the fresh session (S12-04 follow-up); mitigated only by the `deviceUnreadable` copy in `src/data/pl.ts` `pl.saveTransfer`.
- DESIGN-GAPs planned: revise 66 (phase 5), new 67 "Obrazki" (phase 4), new 68 device save not read (phase 6) with a pointer from 48/49.
- Follow-ups to write in phase 7 (`follow-ups/review-fixes.md`): as planned, plus re-recording audit M-1/M-2/M-13/H-3/H-4 (`Trigger: next change to TaskScene / narrator`) as still open with the justification that only `TaskScene.freshRound` arguments change.

## 6. Autonomous decisions

1. **Triage applied by the reviewer, no `AskUserQuestion`** (contract rule 1): every WARNING had an obvious in-plan fix, so all were FIXED; none went only to Known risks except the residual part of F3. Would change: a finding needing a product choice not covered by the PRD.
2. **Split Phase 3 rather than keep it** (step prompt: split if too big). Chosen: signal/seam/filter vs. panel line, because the panel line carries its own teacher read and visual gate while the rest has none. Rejected: splitting off the seam alone (the filter and record have no browser proof without it). Would change: an implementer finishing phases 3+4 in one session would not make the split wrong, only unnecessary.
3. **Filter scope kept (MONEY_COUNT, MASS, CAPACITY `toLitres`)**: MONEY_CHANGE and `howMany` carry their amounts in the prompt text, COUNT/MULT_GROUPS stay countable, the thermometer scale is drawn in code. Would change: the phase-5 teacher read finding labelled boxes misleading in MONEY_CHANGE.
4. **Unlock-threshold rule kept; formula unified in Phase 1 (`unlockThreshold`)** instead of the sweep. Would change: none (pure refactor guarded by existing `unlockReady` tests).
5. **S12-01 kept (refuse on `unavailable`, warn on `unreadable`)**: the start card's "Zachowaj kopię" is reachable because writes stay off under `unreadable`, so the card returns at each launch; the panel-export trap is mitigated in copy only (S12-04 out of scope by Step 0). Would change: the maintainer wanting the export dialog to warn too (then pull S12-04's warning part into phase 6).
6. **Next command `/10x-tdd … phase 1`** (Phase 1 driver unchanged: `tdd`).
