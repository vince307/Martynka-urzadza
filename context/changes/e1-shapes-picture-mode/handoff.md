# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by the `/10x-plan` step of run `2026-10-15-fix-s14c-s14d`. `plan.md` (11 phases, 63 Progress rows) and
`plan-brief.md` are written; no product code yet. The next agent must not accept a phase that makes a MONEY_PAY skill
reachable (curriculum data) without the snapshot `dragMode`, the exhaustive `answerRight`/`answerWrong` switch and
`payCoins` in the same phase (plan Phase 8), and must keep the save at v2.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | 3 on top of `10d6fe7`: change identity (`f3aa504`), research (`5cab986`), `docs(e1-shapes-picture-mode): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 63 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (plan.md, plan-brief.md, change.md, handoff.md, roadmap.md staged by path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/e1-shapes-picture-mode/plan.md` | full plan: 11 phases with `Driver:` lines, Critical Implementation Details (face codes, MONEY_PAY answer contract, `trayDrag`, scene `dragKind`, e2e helper switch, picture mode, E1 calendar start, threshold table), Autonomous decisions 1–12, Progress |
| `context/changes/e1-shapes-picture-mode/plan-brief.md` | two-page brief with the key-decisions table |
| `context/changes/e1-shapes-picture-mode/change.md` | frontmatter `status: planned`, `updated: 2026-10-15` |
| `context/foundation/roadmap.md` | S-14d status `proposed` → `planning` (at-a-glance row and item body) |
| `context/changes/e1-shapes-picture-mode/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/e1-shapes-picture-mode` (observed) |
| `ls context/foundation/lessons.md` | absent (no lesson applies) |
| `metadata-guard.mjs inspect` then `mark-planned` | `{"changed":true}`; status `preparing` → `planned` |
| Success Criteria ↔ Progress mapping (python count per phase) | 1:1 in all 11 phases (5, 8, 5, 7, 5, 5, 5, 7, 7, 4, 5 rows) |
| `Driver:` + `Driver why:` first lines under every `## Phase N:` | observed for all 11 (tdd 1, 3, 5, 6, 7; impl 2, 4, 8, 9; e2e 10, 11) |
| Anchors re-read this step | `dragMode` (full file), `blockDrag.ts` (full file), `Task` type, `TaskVisual` union, `TaskScene` `clockTask`/`feedDrag`/`okTarget`, `AnswerTiles`/`SelectTiles` `setChoices`, `tests/curriculum.test.ts` `GROUP_1`/`LATER`, `tests/curriculumStart.test.ts` E1 `ORACLE` row, `REGISTRY_KEYS.month`, `buildAdaptiveRound` signature, `placementData.months.autumn`, design-gaps max row 99, `ROUND_SPEC` |
| lint / typecheck / unit / build / e2e | not run: plan-only step, no code changed. Baseline on main at 10d6fe7 (contract, inherited, unverified): unit 2672 passed, e2e 86 passed |

No deliberate break in this step (no tests written).

## 4. Next command

`/10x-plan-review e1-shapes-picture-mode`

## 5. Open

- `[human]` rows in `plan.md` Progress: 9.6 tablet test with a real 6-year-old finger (coin drag, picture tiles); 9.7
  decisions against ZADANIA/PRD/roadmap (SPATIAL, SYMMETRY, BONDS pairs out; ORDINAL numbers only, range 5; E1.11 without the
  10 zł note; picture mode as an E1-only filter; thresholds E1.2 1 → 2, E1.3 2 → 3 on live saves; E1 September start on E1.1;
  E1.1 in the E2 warm-up).
- Contract changes vs `change.md`: decision 5 reversed (generic `trayDrag` in `src/core/trayDrag.ts`, blocks as instance,
  S13-09 fixed); decision 6 reversed (MONEY_PAY answer `number[]` + `check`).
- DESIGN-GAP rows planned: 100 (faces in tiles), 101 (pattern row), 102 (icon row + arrow), 103 (coin wallet), 104 (picture
  mode; row 21 updated).
- Follow-ups planned in Phase 9 (`follow-ups/review-fixes.md`, each with `Trigger:`): SPATIAL, SYMMETRY, BONDS pairs, ORDINAL
  tap/words/to 10, E1 hint number line, E1.10 `place_read_12`, wrong wallet in the parent view, wallet art, 10 zł in E1.11.
- Plan-review attention: size of Phase 8 (fallback `p8a`/`p8b` commits written in the plan); the shared-reducer regression
  risk in Phase 6 (full e2e incl. `drawn-tasks.spec` required in that phase); `hasPicture` table kept honest by a sampling test.

## 6. Autonomous decisions

1. **Complexity HIGH, zero `AskUserQuestion`** (contract rule 1). Every open question from research § Open Questions was
   decided from research recommendations: coins only in E1.11 (Q1), ORDINAL number tiles (Q2), picture-mode band Sept–Jan +
   easing, E1 only (Q3), wallet drawn in code + DESIGN-GAP (Q4), exhaustive helper makes Q5 irrelevant. Would change: a
   maintainer answer or plan-review finding against any of them.
2. **Eleven small phases** (tdd core → impl widget + data per content group; picture mode; MONEY_PAY as reducer → generator →
   scene/hook/helpers/data; seam sweep; two e2e). Rejected: S-14c-style combined generator+data tdd phases (the widgets here are
   new UI and need an `impl` phase each). Would change: plan-review asking for fewer, larger phases.
3. **CHOOSE_OP picture as a new skill** (E1.3 threshold 2 → 3) — research recommendation. Would change: playtest showing E1.3
   unlocks too slowly.
4. **Generic `trayDrag` over a separate coin reducer** — research measured ≥ 70 % shared code (change.md decision 5 reversal
   condition met). Would change: plan-review judging block-drag regression risk higher than duplication.
5. **Picture mode E1 only**, against ZADANIA's easing text naming it for every stage → `[human]` 9.7. Would change: a kit view
   or a request to bias E2+ rounds.
6. **Roadmap status edit committed with the plan** (step prompt), not left for `/10x-implement`. Would change: nothing.
