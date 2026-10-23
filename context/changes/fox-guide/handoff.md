# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-implement fox-guide phase 1` of run 2026-10-23-fox-guide: three 384 x 384 WebP fox poses are in
`public/assets/ui/`, `UI_ART` has 8 rows, and a new `tests/bootBudget.test.ts` pins the boot payload (47.6 s at 50 KB/s,
limit 48 s). Phase 1 is committed as `e392442`. The next agent starts phase 2 (pose rule and geometry, test-first).

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | 5 on the branch after this step: identity, research, plan, plan review, `feat(fox-guide): grafiki liska, wiersze UI_ART i budzet startu (p1)` (`e392442`), plus the handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`); 1.1-1.3 ticked, 1.4 left open for the orchestrator's e2e |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `public/assets/ui/fox-{idle,cheer,think}.webp` | 384 x 384 WebP, 13 700 / 15 086 / 13 598 B (42 384 B), made by `npm run art` |
| `scripts/make-task-art.mjs` | `FOX` root + `FOX_POSES` jobs, existence check, count line |
| `src/data/uiArt.ts` | ids `guideIdle`, `guideCheer`, `guideThink`, `label: ''`; keys `ui/fox-*` |
| `tests/bootBudget.test.ts` | new: sums TASK_ART, ROOM_ART, UI_ART, font, boot sounds (larger format) from disk; `HEADROOM_MS` 2000 |
| `tests/uiArt.test.ts` | `toHaveLength(8)` |
| `src/data/balance.ts` | `loader` comment only (2 378 800 B, 47.6 s, names the budget test); values unchanged |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| `npm run art` | only the three new files appeared in `git status public/`; other files byte-identical |
| `npx vitest run tests/bootBudget.test.ts tests/uiArt.test.ts` | green |
| deliberate break `HEADROOM_MS` 2000 -> 3000 | red: "boot payload 2378800 B = 47.6 s at 50 KB/s, limit 47 s"; restored, green. Meta-check: the sum comes from `statSync` of real files through the boot tables, so the break proves the sum is real and near the limit |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | baseline 3781 + 1 = 3782 passed (200 files) |
| deploy scripts, `sample` E1-E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `git diff main -- src/data/balance.ts` | one line, the `loader` comment; `save.ts` and `tests/fixtures` untouched |
| e2e (`npx playwright test`) | NOT run by this step (Chromium cannot start in the sandbox); orchestrator runs it, expect baseline 150 + 0 |

## 4. Next command

`/10x-tdd fox-guide phase 2`

## 5. Open

- Row 1.4 stays unticked until the orchestrator's e2e run (150 + 0).
- Measured payload is 2 378 800 B (47.6 s), 0.4 s under the 48 s limit; the plan estimated 47.4 s (the test counts the
  larger sound format, M4A). Any further boot art needs smaller art or a decision, never a change of `totalMs`/`HEADROOM_MS`.
- Manual rows from the plan review still open: 3.5 [visual], 4.5 [visual], 4.6 [human], 4.7 [human], 4.8 [reviewer].
- DESIGN-GAP rows 165-168 planned for phase 3; follow-ups planned for phase 4 (see plan).

## 6. Autonomous decisions

- Row 1.4 not ticked: the e2e part is the orchestrator's; I did not run it. Would change: none.
- `bootBudget` counts the larger of each boot sound's two formats (as the plan says), giving 47.6 s instead of the
  plan's 47.4 s estimate; still within the 48 s limit. Would change: the budget exceeding 48 s.
- Code commit first, Progress ticks and handoff in a second docs commit so the ticks can cite the real sha.
