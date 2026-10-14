# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Written by the `/10x-plan` step of run `2026-10-14-save-s13b-s15-s14b`. `plan.md` (12 phases, `## Progress` 67 rows) and
`plan-brief.md` exist; no product code changed. The next agent must not miss: phase 1 (`dragMode` + `canonicalInput` +
the "solvable in its own mode" test) must land before any clock-set code, and the e2e helpers for the clock (phase 7) come
before the clock-set data (phase 8) — otherwise `adaptive.spec` and `first-launch.spec` meet a task they cannot answer.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4`, cut from `main` at `9554e96` |
| Commits | 3 on top of `9554e96` (change identity, research, this plan commit `docs(drawn-grid-tasks-e3-e4): plan`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| Progress rows remaining | 67 of 67 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the files below staged, by explicit path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/drawn-grid-tasks-e3-e4/plan.md` | full plan: 12 phases with `Driver:` lines, unlock-threshold table, model/reducer contracts, `## Autonomous decisions`, `## Progress` |
| `context/changes/drawn-grid-tasks-e3-e4/plan-brief.md` | two-page brief |
| `context/changes/drawn-grid-tasks-e3-e4/change.md` | frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-13b `proposed → planning` (At a glance row + body `Status`) |
| `context/changes/drawn-grid-tasks-e3-e4/handoff.md` | this file |

Phases and drivers: 1 tdd (solvability S13-01..04/07), 2 tdd (`cells`/`grid`/`figure` + PUZZLE_GRID), 3 tdd (GRID +
PERIMETER), 4 tdd (`stepClockSet`, CLOCK `set`, layout), 5 impl (`NumberCells` + `CoordGrid`, E3.5/E3.7), 6 impl
(`FigureGrid`, E4.7), 7 impl (clock dial + scene branch + hook + e2e helpers, no data), 8 impl (clock-set data E3.3/E3.11/E4.3,
`adaptive.spec` timing), 9 impl (new playable E5.12/E6.3, pinned tests), 10 impl (seam sweep, docs, gaps 73–77, follow-ups),
11 e2e (`grid-tasks.spec`, #11), 12 e2e (`clock-set.spec`, #11).

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/drawn-grid-tasks-e3-e4` (observed) |
| Docs-only step | no lint/typecheck/test/build run: no source file changed (baseline on main `9554e96` from the contract: unit 1927, e2e 57 — inherited, unverified) |
| Plan structure | 12 `## Phase N:` headings each with `Driver:` + `Driver why:` as first lines; Success Criteria bullets map 1:1 to 67 Progress rows (counted per phase) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched, `changed: true` |
| Anchor check | symbols cited in the plan grepped in this step (`UNBOUNDED_TYPES`, `FIRST_HINT_EXEMPT_TYPES`, `parseClockParams` variants, `TASK_LAYOUT.drag.mat/ok/solutionLines`, `keypadSolution`, E3/E4/E5/E6 step skill lists, `adaptive.spec` `setTimeout(180_000)`, design-gaps last row 72) |
| Deliberate break | n/a (docs step) |

## 4. Next command

`/10x-plan-review drawn-grid-tasks-e3-e4`

## 5. Open

- `[human]` rows: 8.7 (tablet gesture: 5-minute snap and hand grab by a child's finger), 10.6 (decisions against the literal
  ZADANIA/kit text: E4.3 "set" only quarters, hour hand picked separately, GRID 5 × 4 instead of the kit's 8 × 5, ranges where
  ZADANIA is silent).
- `[visual]` rows 5.7, 6.7, 8.6, 9.6 (1440×900 and 1024×768); `[reviewer]` teacher reads 2.5, 3.5, 4.4, 5.6, 6.6, 8.5, 9.5.
- DESIGN-GAP rows planned 73–77 in `docs/design-gaps.md` (number cells; grid labels + items, 5 × 4; side labels; figure in
  the 768 × 190 keypad solution rect; clock-set handles/held state/"OK").
- Unlock thresholds change (plan table): E3.3 1→2, E3.5 1→2, E3.7 2→3, E3.11 2→3, E4.3 2→2, E4.7 2→3; E5.12 and E6.3 become
  playable (phase 9 only). PR body must list them.
- Risk: `tests/e2e/adaptive.spec.ts` near its 180 s limit once clock-set tasks enter (phase 8 measures; 240 s only with a
  measured > 160 s). Phase 7's break proves only the hook ↔ helper contract; canvas behaviour is proven in phase 12.
- Follow-ups to write in phase 10 (`follow-ups/review-fixes.md`): BONDS/CHOOSE_OP → `Trigger: S-14d`; clock "set" E5–E6 and
  5-minute answers → `Trigger: S-14c or a tablet test`; S13-09 → `Trigger: next change to blockDrag`; S13-05/06/11..14 carried.

## 6. Autonomous decisions

1. **No `AskUserQuestion`; complexity HIGH, every question settled from research/change.md** (contract rule 1). Would
   change: nothing in this run.
2. **12 phases, not ≤ 10** — the ≤ 2 UI components rule and tdd/impl/e2e split drive the count; PERIMETER E5.12/E6.3 kept
   (only data + a generator variant). Rejected: moving E6.3 to a follow-up (research decision 5). Would change: phase 9
   overrunning → E6.3 to `Trigger: S-14c`.
3. **E3.5 magic + pyramid; E3.7 two GRID skills; E4.7 two PERIMETER skills** (research recommendations). Would change:
   simulation #17 showing E3/E4 over the pace budget.
4. **Clock-set = `kind: 'clock'` + `set: true`; answer `formatTime`; `dragMode` by `visual.kind`** (research). Would change:
   a separate dial drawing for setting.
5. **E4.3 "set" answers only quarters with a 5-minute snap** — against ZADANIA's literal "minuty co 5" → `[human]` 10.6.
   Would change: a tablet test with reliable 5-minute grabs → add `E4.3.clock_set_5`.
6. **Figure in the keypad solution scaled into 768 × 190 (cell ≥ 36 px)**, not a bigger `keypadSolution` or "beside".
   Would change: unreadable side labels in screenshots 6.7 → `visualShape('figure') = 'tall'`.
7. **`adaptive.spec` limit may go to 240 s only with a measured > 160 s** (like the `drawn-tasks.spec` round). Rejected:
   excluding clock tasks from its rounds, fewer rounds. Would change: > 240 s → faster CDP helper.
8. **Phase 7 deliberate break = removing `clock` from the hook snapshot (typecheck of `setClock`)**, since no clock-set task
   is playable before phase 8. Would change: a forced-skill path available in phase 7.
9. **Plan written in Polish prose with English identifiers**, like the archived S-14 plan (format example). Would change:
   nothing.
