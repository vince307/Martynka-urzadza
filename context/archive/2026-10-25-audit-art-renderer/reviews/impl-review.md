<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Board recolour refuses a wrong image, the Canvas renderer named in "Obrazki", the pouf under the return button

- **Plan**: context/changes/audit-art-renderer/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-25
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning (fixed), 4 observations

Reviewer: `/10x-impl-review` step of autonomous run 2026-10-25-audit-art-renderer (no human; triage decided in place, see
handoff §6). Every suite re-run in this step on `feat/audit-art-renderer` (see §Verification).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING (F1, fixed) |

## Verification (observed in this step)

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 208 files, 3948 passed = baseline 3936 + 12 (recolourBoard 3, artHealthLines 5, artHealthText 1, salonStyleWiring 3) |
| deploy + ops shell tests, `sample` E1-E6 | all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npm run art` | `recolour-board: …/architecture-before.png: board mask 13.47%`, `recolour-board: …/architecture-after.png: board mask 13.45%`; afterwards `git status --porcelain public/ scripts/` empty (byte-identical) |
| break p1 (tdd): share check replaced by `if False:` | `refuses an all-green image and states the share` red (1 failed, 2 passed); restored |
| break p2 (tdd): `'worn'` dropped from the drawn-list filter in `artHealthLines` | 2 cases red (`gives one worn line…`, `puts the worn line before…`); restored |
| skip path `RECOLOUR_BOARD_PYTHON=/nonexistent/python3` | 3 skipped; reason line hidden by the default reporter before F1, shown after F1 |
| full e2e `--workers=3` | 152 passed, 15 failed (load timeouts, 1-3 min each, none in canvas-renderer or salon-style); `--last-failed --workers=1` 15 passed; total 167 = baseline 164 + 3 |
| break p5 (e2e): both `recordFallback(scene, 'worn', 'ungraded')` lines deleted from `applyWornGrade` | `#12 canvas-renderer` red (`Expected: "ungraded"`, `Received: undefined`); restored; canvas-renderer + salon-style re-run 7 passed on the restored build |
| hook bypass | none: `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (10-12 Oct) unmodified in this run; no `--no-verify` in the log |

No migration (save format stays v4; `src/core/save.ts`, `tests/fixtures` untouched). No write endpoints (no backend). No
external identifiers (no new hosts, ids or keys).

## Findings

### F1 — Python test's skip reason never reaches a default-reporter log (CI)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/recolourBoard.test.ts (module-level skip notice)
- **Detail**: The plan's "Skip must be loud" and rows 1.3 / 4.10 rely on a module-level `console.warn`. Re-run here:
  vitest 5's default reporter prints nothing from a file whose tests all skip (`grep -c recolourBoard` = 0; only
  `--reporter=verbose` or `--silent=false` shows it — phase 1's handoff said so, but row 1.3 was ticked as "the output
  shows" and row 4.10 expects the line in the CI `check` log). Scope item 2 ("skip cleanly with a stated reason") was met
  in the describe title only, which CI's default reporter also hides.
- **Fix**: write the notice with `process.stderr.write(...)`, which the default reporter passes through (observed: the line
  `recolourBoard: skipped: python3 cannot import PIL and numpy; needs Pillow 12.1.0 / numpy 2.4.3` now prints; the ready
  path still 3 passed). Plan text P-2 / Critical Implementation Details naming `console.warn` is superseded by this note.
- **Decision**: FIXED (`fix(audit-art-renderer)` commit of this step)

### F2 — BootScene renderer guard reads `create` to the end of the file

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/salonStyleWiring.test.ts (`BootScene.create logs the renderer once, after the second-run return`)
- **Detail**: `boot.slice(boot.indexOf('    create(): void {'))` takes every method after `create`, so a later
  `console.info` elsewhere in `BootScene` would fail the guard. Stricter than needed, never looser; the e2e `#12` proves
  the single line at runtime.
- **Fix**: none now; recorded.
- **Decision**: ACCEPTED

### F3 — "once per scene" is once per game

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/wornGrade.ts (`applyWornGrade`), src/ui/artFallbacks.ts (`recordFallback`)
- **Detail**: Every ungraded call reaches `recordFallback`, whose `noteFallback` keeps the first mode per key in the
  game-wide registry: one write per game, later calls are a registry read. Matches research R4 and plan "no per-scene
  guard"; the scope's "once per scene" is met in effect (no repeated write, no event storm).
- **Decision**: ACCEPTED

### F4 — Welcome snapshot of the e2e hook gained `artFallbacks`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/testing/e2eHook.ts (welcome branch of the snapshot)
- **Detail**: Not in the plan's file list; recorded by phase 5 as D-1. Hook build only (`e2e hook: absent` in `dist/`),
  read-only, same field the task snapshot already carries. Harmless EXTRA.
- **Decision**: ACCEPTED

### F5 — `drawRoomMiniature` still drops the boolean

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/widgets/RoomView.ts (`drawRoomMiniature`)
- **Detail**: Deliberate (plan P-3, research R4): the record lives in the callee, so the done-card miniature and the
  backdrop are covered (e2e `#12` proves the backdrop path under Canvas). The literal scope wording awaits the human row
  4.8; follow-up 7 carries it.
- **Decision**: ACCEPTED (human row 4.8 open)

## Plan vs diff

Every planned file is in the diff and matches its contract: `scripts/recolour-board.py` (`BoardError`, `MIN_SHARE`,
`MAX_SHARE`, finiteness before share, print before save), `src/core/artPick.ts`, `src/core/artHealth.ts`,
`src/data/pl.ts` (`wornPlain` only), `src/ui/dom/artHealthView.ts`, `src/ui/wornGrade.ts`, `src/scenes/BootScene.ts`
(after the `creates > 1` return, wrapped), `src/data/layout.ts` (comment only), `docs/design-gaps.md` rows 173/174,
`CLAUDE.md`, follow-ups (8 `Trigger:` lines), `playwright.config.ts`, both specs. "Not doing" held: `git diff --stat
main -- src/ui/widgets src/scenes/RoomScene.ts src/ui/artFallbacks.ts src/main.ts vite/e2eHookGuard.mjs public
src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/rooms.ts` empty.

## Rows owned by this step

- 4.10 `[reviewer] (CI at ship)` stays open for the ship step: it names workflow `CI`, job `check`, and the log lines
  `Tests +[0-9]+ passed`, `e2e hook: absent \(` and (after F1) `recolourBoard: skipped: …` with `| 3 skipped`.
- No other `[reviewer]` row in the plan. 4.6-4.8 `[human]`, 4.9 `[visual]` stay open.

MERGE: CLEAR — no open CRITICAL, every automated criterion met and re-observed (unit 3948 = 3936 + 12, e2e 167 = 164 + 3, art byte-identical), the one WARNING (F1) fixed in 54ed721; open rows are [human]/[visual] and the CI-at-ship row 4.10.
