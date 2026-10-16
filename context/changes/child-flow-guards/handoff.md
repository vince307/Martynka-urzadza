# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-plan` step of run 2026-10-16-audit-sweep (slice 1 of 3). `plan.md` (14 phases, `## Progress`
72 rows, all pending) and `plan-brief.md` are written; nothing is implemented. The next agent must not let any phase
change the save format (v4) or the rng consumption of a successful generator draw. The only seeded-round changes
allowed are those the plan lists under Critical Implementation Details.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 3 on the branch: change identity, research, `docs(child-flow-guards): plan` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 72 (`grep -c '^- \[ \]' plan.md`): 50 automated, 14 `[reviewer]`, 5 `[visual]`, 3 `[human]` |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/plan.md` | the plan: 14 phases with Driver lines, Critical Implementation Details, Known risks, `## Autonomous decisions` (15), `## Progress` |
| `context/changes/child-flow-guards/plan-brief.md` | two-page brief with the key decisions table |
| `context/changes/child-flow-guards/change.md` | status `preparing` → `planned` (frontmatter only) |
| `context/changes/child-flow-guards/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/child-flow-guards` |
| plan structure: `grep -c '^## Phase'` / `'^### Phase'` / `Driver:` after each phase heading / `Driver why:` | 14 / 14 / 14 / 14 |
| oracle probe (scratch `probe.ts`, `node --import tsx`, every generator skill, 20 seeds × 50 draws) | tiles 64 999 tasks, keypad 108 000: **0** skills where no tile passes or the keypad answer is not a non-negative integer of at most 7 digits or is refused by `check` (TXT-03 is safe to tighten) |
| `ls tests/` for every test file the plan names as existing | all present; `tests/retry.test.ts`, `tests/dragEvents.test.ts`, `tests/numberLine.test.ts`, `tests/drawingFit.test.ts`, `tests/variantCountWiring.test.ts` are marked new |
| `metadata-guard.mjs inspect` then `mark-planned` | `changed: true` |
| lint / typecheck / tests / build / e2e | not run: planning step, no code changed (baseline main 9b7fe37: unit 3139, e2e 125; inherited, unverified) |

## 4. Next command

`/10x-plan-review child-flow-guards`

## 5. Open

- Manual rows (human checklist): 5.7 `[human]` accept the wallet line wording (gap 124); 9.5 `[human]` tablet check that
  "OK" is inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768.
- DESIGN-GAP rows to add during implementation: 122 (`src/core/progress.ts` `progressView` previous stage), 123
  (`src/core/round.ts` `exampleValue`), 124 (`src/data/pl.ts` wallet line), 125 (`compareQty.ts` `generateCompareQty` order).
- Teacher read rows: 5.3 (E1.11, E2.2), 6.3 (COMPARE_QTY, E3.10 HALF), 7.3 (every stage with a changed generator type).
- Follow-ups to write in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrites the S-14c "about 14 % E5" test in `tests/review.test.ts` on purpose.

## 6. Autonomous decisions

- **TXT-01 90/10 (easing 70/30)**: chosen per `docs/ZADANIA.md`; rejected: keep 14 %. Would change: maintainer says 14 % was intended.
- **WNA-04 measured overflow signal** (existing `SolutionSteps.fits`), not a heuristic `linesFit`. Would change: a need
  for unit-level text-fit proof per skill.
- **GRD-04 checks each task's real layout rect**; failures go to `KNOWN_SMALL` + follow-up, never a lower `minCell`.
  Would change: the visual gate showing a listed skill unreadable.
- **TXT-03 strict oracle kept in scope**: the probe found no offender. Would change: an offender at implementation time.
- **GRD-02 clock and tray stay different** (clock ignores a second pointer's `down`; tray keeps its pinned cancel).
  Would change: a device report of a lost coin carry.
- **Progress preview shows previous-stage skills on every step**, not only on review. Would change: the visual gate
  finding it confusing.
- **Design gaps numbered by phase order** (122-125), not research's 122-for-wallet. Would change: nothing material.
- **Phase drivers**: 1-10 and 12 `tdd`, 11 and 13 `impl`, 14 `e2e` (risks #2, #11); phase 13 holds the seam sweep and
  `CLAUDE.md`. Would change: plan review splitting or merging phases.
- **No `[human]` row for TXT-01, PIC-06 or HALF**: none decides against the design docs' literal text (ZADANIA backs
  90/10; the kit is silent on tile order; HALF is a reorder). Would change: the reviewer reading ZADANIA differently.
- **Skill's roadmap sync**: `roadmap.md` has no item `child-flow-guards` (non-roadmap), so it was not touched.
