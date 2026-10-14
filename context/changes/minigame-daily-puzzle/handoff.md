# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-plan` step (autonomous run 2026-10-14-save-s13b-s15-s14b). `plan.md` (13 phases, drivers tagged) and
`plan-brief.md` exist, `change.md` is `planned`, roadmap S-15 is `planning`; nothing is built. The next agent must not
reorder the save phases: save v2 (phases 1–2) lands before any feature writes `variants`, and `balance.variants.minigames`
stays empty until the phase that builds that minigame's screen (8: `word`, 9: `dice`).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 3 on the branch: `a0890f8` (identity), `adbb9a6` (research), `docs(minigame-daily-puzzle): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 68 (`grep -c '^- \[ \]' plan.md`), none done |
| Working tree | clean after the commit (five files staged by explicit path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/minigame-daily-puzzle/plan.md` | Plan: 13 phases with `Driver:` lines, Critical Implementation Details (v2 contract, schedule, scene ordering, star rules), Autonomous decisions, `## Progress` |
| `context/changes/minigame-daily-puzzle/plan-brief.md` | Two-page brief with the key decisions table |
| `context/changes/minigame-daily-puzzle/change.md` | Frontmatter only: `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-15 `proposed → planning` (at-a-glance row and item body) |
| `context/changes/minigame-daily-puzzle/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/minigame-daily-puzzle` (observed) |
| Success-criteria bullets per phase vs Progress rows (awk count, phases 1–13) | 1:1 for every phase (6/5/6/4/6/5/6/5/5/6/4/5/5) (observed) |
| `grep -c '^Driver: ' plan.md` | 13 (one per phase) (observed) |
| `metadata-guard.mjs mark-planned` | `changed: true`; frontmatter `status: planned` (observed) |
| Local gate (lint, typecheck, unit, build, e2e) | Not run: docs-only step, no product code changed. Baseline per contract (inherited, unverified): `lint OK; typecheck OK; unit OK Tests 2224 passed; build OK; e2e OK 63 passed`. |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan-review minigame-daily-puzzle`

## 5. Open

- Phase drivers: 1 tdd (save v2), 2 tdd (migration safety), 3 impl (save copy, `?e2eSave=v1`), 4 tdd (schedule + day),
  5 tdd (15 puzzles), 6 tdd (dice/word core), 7 impl (scene variant + daily puzzle + HUD title + seams), 8 impl (Hasło),
  9 impl (Zakrywanka), 10 impl (seam sweep, gaps 79+, follow-ups, `CLAUDE.md`), 11–13 e2e (request-file protocol).
- `[human]` rows (post-run checklist): 1.6 save-format one-way door (v1 build after rollback shows the `future` card);
  5.6 the author reads all 15 puzzles; 8.5 Hasło letter-per-answer instead of ZADANIA's ascending sort, salon words
  instead of the kit list; 9.5 board tiles under a child's finger on a 1024 tablet; 10.6 other decisions against
  PRD/ZADANIA/kit (every 4th round, puzzle without an opt-in card, puzzles E3–E4 only, dice 0–12 for all stages, no
  on-demand hint/"Pokaż", variants outside mastery).
- Existing e2e specs: phase 7 adds `e2eVariant=off` to every `chromium-hook` spec that can reach a 4th ordinary round in
  one browser context (candidates `adaptive`, `room-purchase`, `parent-settings`, `save-transfer`; the implementer counts
  and lists them in its handoff).
- New e2e seams: `?e2eDay=YYYY-MM-DD`, `?e2eVariant=off|word|dice|puzzle` (markers `e2eDay`, `e2eVariant` in
  `vite/e2eHookGuard.mjs`), `?e2eSave=v1` (covered by the existing `e2eSave` marker).
- DESIGN-GAP rows 79–86 (research § 6) are written in phase 10; phases 7–9 add the `DESIGN-GAP` comments.
- Follow-ups with triggers are written in phase 10 to `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md`
  (two-build e2e, S13-06, two instances / S12-15, M-S1 deploy part, S12-07/08/12/13, dice range/`everyRounds`/economy
  → S-17, on-demand hint).
- Roadmap Open Question 2 is answered (plan § 13 of `Martynka-urzadza.md`): mark it resolved at archive time.

## 6. Autonomous decisions

1. **No AskUserQuestion; complexity HIGH; 0 questions.** Why: contract rule 1 and every question has a research
   recommendation or an author decision. Would change: nothing in this run.
2. **13 phases, ≤ 2 new UI components each** (7: `HudTitle`; 8: `LetterTiles`, `MinigameDoneCard`; 9: `Dice`,
   `CoverBoard`). Rejected: one scene phase for all variants. Why: each phase is a fresh agent and must stay green.
   Would change: plan-review finds a phase too large → split it.
3. **Minigames switched on by `balance.variants.minigames` phase by phase.** Rejected: schedule live with stubs. Why: no
   phase may draw a variant whose screen does not exist. Would change: nothing.
4. **Hook build behaves like production; `e2eVariant=off` only in multi-round specs.** Rejected: default `off` in the hook
   build. Why: specs keep exercising the real schedule where it matters. Would change: more than 4 specs need the seam.
5. **`everyRounds` 3, puzzle replaces a round without an opt-in card, ×2 for first and second try, variants skip
   `endRound`, Hasło letter per finished task, dice board 0–12 for every stage** (plan § Autonomous decisions 2–17).
   Each decision against the literal PRD/ZADANIA/kit text has a `[human]` row (8.5, 10.6). Would change: the author's read.
6. **`backup-v1` failure blocks the first write; `migration-failed` behaves like `corrupt` (forceable, exportable).**
   Rejected: best-effort backup; treating it like `future`. Why: FR-021 and the backup is only useful if it exists.
   Would change: a device where the backup cannot be written repeatedly (then a follow-up on retry policy).
7. **`?e2eSave=v1` substitute for the two-build e2e; real two-build e2e is a follow-up.** Would change: the maintainer wants risk #10 fully closed now.
8. **Roadmap edit committed with the plan** (step prompt), not left in the tree as the skill's default says.
