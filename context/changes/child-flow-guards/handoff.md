# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-plan-review` step of run 2026-10-16-audit-sweep (slice 1 of 3). The plan is reviewed (verdict
PROCEED, 1 critical + 1 warning fixed in `plan.md`); nothing is implemented. The next agent must not let any phase change
the save format (v4) or the rng consumption of a successful generator draw, and in phase 4 the `variantCounted` reset
belongs in `TaskScene.applyRound`, not `beginRound` (review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 4 on the branch: change identity, research, plan, `docs(child-flow-guards): plan review` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 74 (`grep -c '^- \[ \]' plan.md`): 50 automated, 14 `[reviewer]`, 5 `[visual]`, 5 `[human]` |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/reviews/plan-review.md` | the review: 6 findings (F1 critical, F2 warning, F3-F6 observations), all FIXED, `VERDICT: PROCEED` |
| `context/changes/child-flow-guards/plan.md` | edited by triage: SV2-10 reset in `applyRound` (CID + phase 4), `[human]` rows 2.7 and 6.7, phase 3 legacy `number[]` answer test, phase 1 frames excluded from `visualArtIds`, phase 7 break by assertion, Known risks entry for the `CLAUDE.md` spec name |
| `context/changes/child-flow-guards/change.md` | status `planned` → `plan_reviewed` (frontmatter only) |
| `context/changes/child-flow-guards/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/child-flow-guards` |
| path grounding (`ls` of every `src/` and test path the plan calls existing) | 37/37 present |
| code checks (read, not inherited) | `buildAdaptiveRound` picture threshold from `afterArt`; review branch `earlier: []`; `unlockReady`; `captureFirstWrong` number/string only; `validExample` accepts string `given`/`answer`; `Task.check` boolean; `canonicalInput` used by tests only; four pointer listeners with id-less `cancel`; `applyRound` called from `create`, `beginRound`, `applyParentStage`; `nextRoundKind` keeps the day rule under `forced: 'puzzle'` |
| Progress↔Phase | 14 `## Phase` / 14 `### Phase`; every success-criteria bullet has a row; `Driver:` on every phase |
| lint / typecheck / tests / build / e2e | not run: review step, no code changed (baseline main 9b7fe37: unit 3139, e2e 125; inherited, unverified) |

## 4. Next command

`/10x-tdd child-flow-guards phase 1`

## 5. Open

- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768.
- DESIGN-GAP rows to add during implementation: 122 (progress preview previous stage), 123 (list answers as text),
  124 (wallet line), 125 (COMPARE_QTY order).
- Teacher read rows: 5.3 (E1.11, E2.2), 6.3 (COMPARE_QTY, E3.10 HALF), 7.3 (every stage with a changed generator type).
- Follow-ups to write in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrites the S-14c "about 14 % E5" test in `tests/review.test.ts` on purpose.

## 6. Autonomous decisions

- **Triage without asking** (contract rule 1): every finding fixed in place, none skipped. Would change: nothing.
- **F1 as CRITICAL**: the plan's reset point would reintroduce SV2-10 after a parent stage change; fixed to `applyRound`.
  Would change: `applyParentStage` no longer opening a round.
- **TXT-01 90/10 kept, not overturned**: ZADANIA l.37 backs ~10 % for steps but does not name the review step; added
  `[human]` 2.7 instead. Would change: the maintainer confirming 14 %.
- **PIC-06 order kept, `[human]` 6.7 added**: kit silent. Would change: a kit view.
- **Wallet line**: existing `[human]` 5.7 suffices.
- **No phase split/merge**: each phase is one rule cluster plus one call site. Would change: an implementing agent running
  out of context in phase 1, 9 or 10.
- **Drivers unchanged**: all 14 verified right (tdd where a failing test leads new or changed rules; impl for 11, 13;
  e2e 14 after the seam sweep). Next command follows phase 1's `tdd`.
- **Shared frames excluded from `visualArtIds`** (F4): a redraw cannot avoid them. Would change: a per-task frame choice.
