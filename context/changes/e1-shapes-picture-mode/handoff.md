# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by the `/10x-research` step of run `2026-10-15-fix-s14c-s14d`. `research.md` answers the scope of `change.md`;
no product code yet. The next agent must not plan MONEY_PAY as a grosze number answer (the fewest-coins variant needs
the coins: `number[]` + `Task.check`, research § Summary 4) and must not keep the e2e helpers' bare `drag` → blocks
fallback (an exhaustive `switch` on a new snapshot `dragMode` is mandatory, research § 5).

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | 2 on top of `10d6fe7`: change identity (`f3aa504`), `docs(e1-shapes-picture-mode): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only `research.md`, `change.md`, `handoff.md` staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/e1-shapes-picture-mode/research.md` | research: catalogue/PRD facts, per-type shapes/modes/drawings/hints table, MONEY_PAY drag mechanics and touch sizes, picture-mode design, e2e helper risk with spec list, calendar start and thresholds, O4 and złoty bug, open questions |
| `context/changes/e1-shapes-picture-mode/change.md` | frontmatter only: `status: new` → `preparing`, `updated` |
| `context/changes/e1-shapes-picture-mode/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/e1-shapes-picture-mode` (observed) |
| `ls context/foundation/lessons.md` | absent (no lesson applies) |
| decisive anchors re-read in main context | `dragMode` (throws for non-blocks/clock), E1 `skill` default `'tiles'`, `balance.easing` comment, `Context.price` / `złoty` without price, `captureFirstWrong`, `nouns` (no gender), `CoordGrid.drawItem` |
| calendar start values | computed by a research worker with node (Sep 3 → 2, other months unchanged); not re-run here |
| lint / typecheck / unit / build / e2e | not run: research-only step, no code changed. Baseline on main at 10d6fe7 (contract, inherited, unverified): unit 2672 passed, e2e 86 passed |

No deliberate break in this step (no tests written).

## 4. Next command

`/10x-plan e1-shapes-picture-mode`

## 5. Open

- Plan decisions carried from `research.md` § Open Questions: 10 zł note on the E1.11 tray (recommend coins only);
  ORDINAL number tiles vs ordinal words (recommend numbers; `src/data/nouns.ts` has no gender); picture-mode month
  band (recommend Sept–Jan band from `placementData` + `easedRounds > 0`, stage E1 only); wallet look (DESIGN-GAP).
- Contract changes vs `change.md`: decision 5 reversal condition met (generic tray→mat reducer in `src/core/blockDrag.ts`
  with S13-09 fixed in the shared core); decision 6 contradicted for the fewest-coins variant (`number[]` + `check`).
- Figures in tiles (`AnswerTiles.setChoices`, `SelectTiles.setChoices`) are required for SHAPES and PATTERN (the
  narrator never reads tile faces) — DESIGN-GAP row 100 onward.
- Tests that pin today's E1 values and must change: `tests/curriculumStart.test.ts` `ORACLE` E1 row and `playableSteps`
  list; `tests/curriculumEnd.test.ts` title "E1 step 1 is the only gap left at the start"; `tests/curriculum.test.ts`
  `LATER`.
- [human] at plan time: E1.2 unlock threshold 1 → 2, E1.3 2 → 3 if the picture CHOOSE_OP is a new skill.
- MONEY_PAY coin art: needs an `artBlocked` branch in `src/core/round/artFilter.ts` or a draggable stand-in.
- Tray touch size: 4 kinds in one 440 px row = 98 px, 5 kinds = 75 px (< 96): 2 × 2 tray, ≤ 4 kinds per task.
- Follow-ups to re-trigger at archive (out of scope): SPATIAL, SYMMETRY, BONDS pairs, E1 hint number line, E1.10
  `place_read_12`. The złoty fix (`Context.price` as the buyable flag) also touches WORD and COMPARE_DIFF.

## 6. Autonomous decisions

1. **Scope of the question taken from `change.md`** (no AskUserQuestion). Chosen: the step prompt's list. Would change:
   nothing (fixed by the orchestrator).
2. **Recommend a generic tray→mat reducer instead of a separate coin reducer.** Chosen: generic over kind `K`, blocks
   and coins as instances, S13-09 fixed in the core. Rejected: `coinDrag.ts` copy. Why: ~57 of 79 lines of
   `blockDrag.ts` are kind-agnostic (≥ 70 % threshold of change.md decision 5). Would change: plan-review judges the
   S-13 block-drag regression risk higher than the duplication, or the wallet must be an ordered list.
3. **Recommend `number[]` (grosze per coin) + `check` as the MONEY_PAY answer.** Rejected: a grosze number (cannot
   express "najmniej monet"); relying on `isCorrect` set equality (wrong for duplicate coins). Would change: the
   fewest-coins variant is cut.
4. **Recommend figure faces in tiles over text names.** Rejected: text tiles ("koło") read by nobody. Why: `spoken.ts`
   narrates prompt and hints only. Would change: the narrator learns to read tiles, or a teacher read accepts text.
5. **Recommend picture mode as a pure bucket filter with a static `hasPicture` table checked by a sampling test.**
   Rejected: retrying generation, replacing easing weights. Would change: a kit screen for picture mode appears, or v3
   is allowed for a stored toggle.
6. **Keep E1.1 in the E2 warm-up pool** (recommendation, plan may override). Why: harmless easy content. Would change:
   the teacher read finds shapes odd in a 7-year-old's warm-up.
