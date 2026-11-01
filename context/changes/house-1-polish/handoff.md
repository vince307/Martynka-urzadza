# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-implement` step, phase 5, of run 2026-11-01-bathroom-polish-lab: docs, gap rows, follow-ups and the seam sweep are committed as `e46d7f2` `docs(house-1-polish): docs, gap rows, follow-ups and seam sweep (p5)` and green. Phase 6 (the e2e spec) is next.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | p1 `13cb528`, p2 `d2b8c24`, p3 `b1d6f31`, p4 `7a76b76`, p5 `e46d7f2` (+ this handoff commit) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| Progress rows remaining | 12 (`grep -c '^- \[ \]' plan.md`); rows 5.1-5.5 ticked |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | S-32 sentence after the S-31 one (save format v7, `MIGRATIONS[6]`, kitchen stages, cream salon, seam, gaps 206-207, follow-ups path); S-11 sentence now "v6 from S-28, v7 now (`SAVE_VERSION` 7, S-32)"; salon-style sentence says the `#BCD799` board was so until S-32 |
| `docs/design-gaps.md` | rows 109, 169, 171, 182, 203 re-judged; new rows 206 (code worn grade kept, D5) and 207 (salon cell fill, D4) |
| `context/changes/house-1-polish/follow-ups/review-fixes.md` | 13 items, 14 `Trigger:` lines (new 1-5, re-recorded 6-13) |
| `scripts/make-task-art.mjs`, `src/data/balance.ts` | comment-only edits (see below) |
| `tests/save.test.ts`, `tests/legacySalonMigration.test.ts`, `tests/fixtureLoadPath.test.ts` | stale test titles / comment ("v6" as current, "S-32 phase 1") fixed |

Comment-only lines fixed in `src`/`scripts` (row 5.4): `scripts/make-task-art.mjs` salon row of `ROOM_PACKS`: added a `// DESIGN-GAP 206 / 207 ...` comment line. `src/data/balance.ts` `loader` line: the trailing comment's room-size clause "...salon-style dropped the 288 634 B worn-furniture picture, 37 files, 1 203 284 B, the two backgrounds recoloured by scripts/recolour-board.py; ... about 41.8 s" became "...37 files; S-32 put the salon on cream, 37 files, 1 182 246 B; ... measured per room after S-32: salon 2 071 358 B (41.4 s), kitchen 23 files 1 861 066 B (37.2 s), children 35.0 s, bridge 31.8 s, hangar 29.9 s, bathroom 29.1 s". The plan's second filter in 5.4 shows this one line (a trailing comment on a code line); the code part is byte-identical.

## 3. Verification

| command | result |
|---|---|
| `validate-rule-files.sh` | PASS (28 files, 0 missing); the CLAUDE.md grep finds 5 matches |
| meta-check of 5.1 | the same grep on a copy of CLAUDE.md without the S-32 sentence and the v7 wording finds 0 |
| `Trigger:` count / `^\| 20[67] ` rows | 14 / 2 |
| seam sweep | `S-32 phase 1` in tests: was 1 (a comment), reworded, now empty; `SAVE_VERSION).toBe(6)` empty; `renovate` for the kitchen empty; `BCD799` only in script, its test, `make-task-art.mjs`, docs; "END of this list" exception present in `src/data/rooms.ts`; no second +2 rule outside `kitchenStages.ts` |
| `npm run art` | exit 0, `git status --short public/assets` empty |
| local gate | lint, typecheck clean; unit 4254 passed (phase 4 4254, +0); deploy and ops tests OK; `sample` E1-E6 OK; build prints `e2e hook: absent (2 chunks checked)` |
| e2e | none run (no spec touched) |

## 4. Next command

`/10x-e2e house-1-polish phase 6` (Driver: e2e)

## 5. Open

- `[visual]` row 5.6 (frames 1-17, desktop 1440 and tablet 1024) is the visual gate's; not taken by this phase.
- `[human]` rows 5.7-5.11; `[reviewer]` 2.8, 2.9, 5.12 (CI/ship).
- Full e2e: orchestrator, once after phase 6 (expected 193 + 3).
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs`, `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.

## 6. Autonomous decisions

- No `AskUserQuestion`; the screenshot matrix (5.6) is tagged `[visual]` and left to the visual gate, so no Playwright run here.
- Deliberate break: the phase has no code criterion; the testable one (the CLAUDE.md grep of 5.1) was proven on a stripped copy (0 matches vs 5).
- The follow-ups file cites earlier items by name and number as the plan listed them; the "exported v6 file after v7" claim (item 1) rests on `tests/saveV7.test.ts` and `tests/saveFile.test.ts` from phase 1.
- `scripts/recolour-board.py` and its test left in place (retirement is follow-up 2, trigger-gated by the plan).
