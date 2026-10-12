# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-new` step of run `2026-10-12-s03-remaining-stages`. The change folder exists with `change.md`
(identity, roadmap-vs-repo corrections, follow-up triage, autonomous decisions); nothing is implemented. The one
thing not to get wrong: the roadmap's "same generators" is false — 7 group-1 types (BONDS, CHAIN, MISSING_OP,
COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP) have no generator in `src/core/tasks/registry.ts`, and
`GROUP_1` in `tests/curriculum.test.ts` lists only the 14 implemented types.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | 1 on the branch: `docs(generators-remaining-stages): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a — no `plan.md` yet |
| Working tree | clean after the commit (checked with `git status --porcelain`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/generators-remaining-stages/change.md` | Change identity; "Roadmap claims vs repo now" table; design binding (no kit view; ZADANIA §2/§3/§4/§7; copy keys `pl.tasks`, `pl.words`, `wordTemplates.ts`, `calendar.ts`, `nouns.ts`); migration: none; triggered follow-ups; autonomous decisions |
| `context/changes/generators-remaining-stages/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/generators-remaining-stages` |
| Repo inspection (`registry.ts`, `tests/curriculum.test.ts`, `tests/contentInvariants.test.ts`, `src/data/curriculum/index.ts`, generator param interfaces, `.github/workflows/ci.yml`, `autonomous-run.env`) | evidence for the corrections table in `change.md` |
| Local gate (lint, typecheck, test, build) | not run — docs-only step, no code changed; baseline on main per contract: `lint OK; typecheck OK; unit OK Tests 236 passed; build OK` (inherited, unverified) |

No deliberate breaks (nothing testable changed).

## 4. Next command

`/10x-research generators-remaining-stages`

## 5. Open

Questions for research (details in `change.md` → "Roadmap claims vs repo now"):
- Design of 7 new generators + parsers (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP), each rejecting infeasible params at parse time like existing parsers in `src/core/tasks/registry.ts` `parsers`.
- Extensions of existing generators for E5–E6: `RoundingParams.to` (hundreds, thousands), `CalendarVariant` (weekdays, 30/31 days, decade/365), `MultParams`/`DivParams` for 4 · 70, 3 · 200, 800 : 4, 96 : 6; `NUMBER_WORDS` above `MAX_NUMBER_WORD`; formatting of numbers ≥ 1000 vs `ARITHMETIC_LINE`/`BINARY_PROMPT` in `tests/contentInvariants.test.ts`.
- Small E1 task spaces vs `MIN_DISTINCT`, `MAX_TOP_SHARE` in `tests/contentInvariants.test.ts` — measure; lowering needs a comment with the measured value.
- `tests/curriculum.test.ts` `GROUP_1` / `LATER` lists must grow; `.github/workflows/ci.yml`, profile §2 and `autonomous-run.env` `GATE_UNIT` must gain `sample -- E1/E2/E5/E6`.
- Follow-up F12 (`DT−U` hint in `src/core/tasks/generators/addSub.ts`) is in scope; F10 (S-07), F14 (S-04), F6 (`deploy/`) out — see `change.md` → "Triggered follow-ups".
- No `context/foundation/lessons.md` exists (contract rule 8: nothing to apply).
- DESIGN-GAPs: none. Manual-only rows: none yet.

## 6. Autonomous decisions

Recorded in full in `change.md` → `## Autonomous decisions`. Summary:
1. Next step `/10x-research` (not `/10x-plan`) — the slice needs new generators and parameter extensions measured first; would change if every new step mapped onto existing generators.
2. One slice including 7 new generators (no split) — FR-004 + `tests/curriculum.test.ts` require group-1 coverage; would change if research shows > ~6 phases, then split via `/10x-roadmap`.
3. Group 1 = ZADANIA §7 (18 types) + already-built ROUNDING/HALF/COMPARE_DIFF; other text types (INEQUALITY, TIMES_MORE, ORDER_OPS, PRICE, UNIT_CHOICE, TIME_UNITS) go to `LATER` — would change only on a PRD/FR change.
4. F12 in scope; F10, F14, F6 out — would change if F12 needs a wider hint rewrite (then S-17).
5. No migration, no DESIGN-GAP — no view, no saved format before S-11.
6. Follow-up files have no `Trigger:` lines (pre-rule format); triage done by reading their text for "S-03".
