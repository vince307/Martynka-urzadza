# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-research` step of run `2026-10-12-s03-remaining-stages`. `research.md` is done; nothing is implemented. The one
thing not to get wrong: stage data files (`src/data/curriculum/E1.ts` …) can only land after every group-1 type of their steps has a
generator (`tests/curriculum.test.ts` rejects a step type that is in neither `GROUP_1` nor `LATER`), and the free-mode ADD_SUB draw
(`drawFree` in `src/core/tasks/generators/addSub.ts`) breaks `MAX_DEGENERATE_SHARE` on every E1 range — fix the generator, not the threshold.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | 3 on the branch after this step: change identity, handoff state, `docs(generators-remaining-stages): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's (contract: counts as clean, never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/generators-remaining-stages/research.md` | Step-by-step table E1/E2/E5/E6 (44 steps → type → G / G+ / N / L), design of 7 new generators, 6 required + 3 optional extensions, E1 task-space measurement, recommended 7-phase split with drivers |
| `context/changes/generators-remaining-stages/change.md` | Frontmatter only: `status: new → preparing` |
| `context/changes/generators-remaining-stages/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/generators-remaining-stages` |
| Throwaway measurement `node --import tsx $TMPDIR/s03m/measure.mts` (not committed) | 1000 draws per candidate skill, seeds `910_000 + i`: E1.7 COMPLEMENT `[10]` 9 distinct (top 12.8 %); E1.6 EVEN_ODD single max 10 → 10 distinct (11.0 %); ADD_SUB free mode `n − n` 21.2 % (max 5), 14.6 % (max 9), 13.4 % (max 10); `DT-DT` 10.1 %; E5.4 MULT ·0/·1 32.8 %; ROUNDING `to: 100` → parse `TypeError` |
| `$TMPDIR/s03m/inv.mts` (hint arithmetic, last-hint, bound — same rules as `tests/contentInvariants.test.ts`) | 0 failures on 9 E5/E6 candidate skills (MULT 6·12, 4·70; DIV 96:6; COMPLEMENT 100/1000; ADD_SUB HTU shapes; COMPARE_NUM 1e6 — passes mechanically, hint nonsensical) |
| `$TMPDIR/s03m/newtypes.mjs` (enumeration of prototype spaces) | BONDS 20/22/18 prompts; CHAIN ≤9 729; MISSING_OP ≤10 110; COMPARE_EXPR 10 000 pairs, natural '=' 9.1 %; 12 ambiguous MISSING_OP pairs with · and : |
| Local gate (lint, typecheck, test, build) | not run — docs-only step, no code changed; baseline on main per contract `lint OK; typecheck OK; unit OK Tests 236 passed; build OK` (inherited, unverified) |

No deliberate breaks (nothing testable changed).

## 4. Next command

`/10x-plan generators-remaining-stages`

## 5. Open

- Phase split to adopt or adjust (research.md § 6): P1 ADD_SUB `n − n` + F12 + BONDS + CHAIN (tdd); P2 MISSING_OP + COMPARE_EXPR (tdd); P3 SEQUENCE + CHOOSE_OP (tdd); P4 FACT_FAMILY + CALENDAR variants (tdd); P5 E1+E2 data, `GROUP_1` +7, `LATER` +19, small-space exceptions, `sample -- E1/E2` in `.github/workflows/ci.yml` + profile § 2 + `autonomous-run.env` `GATE_UNIT` (impl); P6 large numbers: `formatNumber`, ROUNDING `to`, DIV `quotients`, COMPARE_NUM ≥ 1000 (tdd); P7 E5+E6 data + `sample -- E5/E6` (impl).
- Small spaces: E1.7 COMPLEMENT to 10 (9) and E1.6 EVEN_ODD single (10, or 11 with zero) need a named per-skill `MIN_DISTINCT` exception with the measured value in `tests/contentInvariants.test.ts`.
- Product choices left to the plan: February in CALENDAR month-days (recommend: skip); EVEN_ODD with zero (recommend: yes); E1 tiles vs keypad (recommend: keypad now, follow-up `Trigger: S-04`).
- Number formatting ≥ 10 000 makes `ARITHMETIC_LINE` / `BINARY_PROMPT` and the `\d+` bound scan in `tests/contentInvariants.test.ts`, and `NUMBER_WORD` in `src/core/tasks/validate.ts`, blind to grouped numbers — P6 must update them together.
- Follow-ups: F12 in scope (P1); F14 stays S-04; F10 S-07; F6 `deploy/` — unchanged from `change.md`.
- No `context/foundation/lessons.md` (contract rule 8: nothing to apply). DESIGN-GAPs: none. Manual-only rows: none yet.

## 6. Autonomous decisions

1. **Per-skill `MIN_DISTINCT` exception instead of a global lower threshold or wider data.** Rejected: lowering `MIN_DISTINCT` for all skills (weakens 50+ skills), widening COMPLEMENT targets / EVEN_ODD to 12 (unfaithful to E1.7 / E1.6). Why: the two spaces are genuinely 9 and 10 tasks; contract S-03 allows lowering with the measured value. Would change: a plan that finds a faithful step variant with ≥ 12 tasks.
2. **ADD_SUB `n − n` fixed in the generator (pattern `ONE_SHARE` from `div.ts`), not by threshold.** Rejected: raising `MAX_DEGENERATE_SHARE`. Why: same defect class already fixed for DIV; measured 13–21 % in E1. Would change: none foreseen.
3. **NUMBER_WORDS above 1000 not needed.** Why: no E6 step in `docs/ZADANIA.md` § 3 lists NUMBER_WORDS (only E3.7, E5.3). Would change: a catalogue edit adding it to an E6 step.
4. **7 phases, slice not split** (change.md decision 2 named "> ~6 phases → split"). Why: each phase ≤ 2 new generators and green alone; S-03 closes M1 and splitting would not reduce work. Would change: plan-review finding a phase too large, or the plan merging to ≤ 6.
5. **E1 numeric answers as `keypad` in M1.** Rejected: generic tile choices now. Why: no task screen yet (S-04); tiles would also inflate the prompt+choices diversity metric. Would change: S-04 requiring tiles for E1 before M2.
6. Commit message took the prescribed `docs(generators-remaining-stages): research`.
