# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-plan` step of run 2026-10-31-space-base: `plan.md` (9 phases, 54 Progress rows) and `plan-brief.md` are committed and the slice waits for plan review. The next agent must not get this wrong: the frozen `save-v5-salon.json` is produced in **phase 1 by the unchanged v5 code** (decode + re-encode round-trip, `git diff` guard on `src/core/save.ts`), and the v6 bump comes only in phase 2. Never write that fixture from v6 code.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 3: `docs(first-building-choice): change identity (autonomous run)` (4e6b8d9), `docs(first-building-choice): research` (c5c2a21), and this step's `docs(first-building-choice): plan` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 54 (`grep -c '^- \[ \]' plan.md`) |
| roadmap | S-28 row and body `Status:` set to `planning` (committed with the plan) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/first-building-choice/plan.md` | the implementation plan: 9 phases with drivers, Intent/Contract per file, deliberate breaks and meta-checks, `## Autonomous decisions` P1-P12, canonical `## Progress` |
| `context/changes/first-building-choice/plan-brief.md` | two-page brief: key decisions, phases at a glance, risks |
| `context/changes/first-building-choice/change.md` | frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-28 status `ready` → `planning` (at-a-glance row and item body) |
| `context/changes/first-building-choice/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/first-building-choice` |
| success criteria ↔ Progress mapping (awk extract + `diff`) | 54 criteria = 54 Progress rows, texts identical |
| `grep -n "^Driver" plan.md` | every phase has `Driver:` and `Driver why:` as its first lines (2 tdd, 6 impl, 1 e2e) |
| `npx playwright test --list \| tail -1` | `Total: 179 tests in 47 files` (e2e baseline 179 used in the plan) |
| `gh run view 41232755289 --log --job 124630959484` (Deploy `deploy`, main fc13e8c) | seen: `ok   precache covers room pictures — 58 of 58 room pictures precached`, `ok   precache covers house pictures — 3 of 3 house pictures precached` |
| `gh run view 41232755289 --log --job 124630170144` (Deploy `build`) | seen (ANSI stripped): `Tests  4089 passed \| 3 skipped (4092)`, `e2e hook: absent (2 chunks checked)` |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash 1373ba4e… → 630b993c…, `changed: true` |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code touched |

## 4. Next command

`/10x-plan-review first-building-choice`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording in `deploy/README.md` § 6; 8.7 the task-screen "Wróć" hidden after a purchase narrows FR-043 (decision P3); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and the test cap widened to 21 (P4); 8.9 choice-screen layout, labels, speaker place, plain backdrop on a fresh install (P5, P6); 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy; (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024 (choice child/parent, card stand-ins under `?e2eArt=choice`, Mostek before/after, a family, Mostek done card, task "Wróć", `?e2eSave=v5-salon` resume).
- **DESIGN-GAP rows planned (phase 8, from 191):** choice layout, welcome speaker, Mostek task wording, no zoom-out for the base, Mostek celebration with no next module, card stand-in, plain backdrop on a fresh install, Hasło words from the house in the base.
- **Follow-ups (phase 8, `follow-ups/review-fixes.md`):** rooms-as-data 8/9/10 re-recorded, 15 applied; texture atlas re-recorded; kitchen 6 closed as stale; post-run-polish N-2 closed by phase 7 (`backToChoice` `console.info`); audit-backdrop-fox F4 and notebook-polish #16 closed in phase 6 (`WelcomeScene`); manifest `bases.base-1.label` nit → S-29.
- **Risk:** phase 6 changes `tests/e2e/support/welcome.ts`, used by 43 e2e files; the helpers default to "Dom" so no spec should change, but any spec tapping an age by hand needs `passChoice`.

## 6. Autonomous decisions

- `AskUserQuestion` never called. The skill's complexity check (HIGH), question rounds (0 open product questions after research) and structure approval were decided from `research.md`, `change.md`, `scope.md`; recorded in plan § Autonomous decisions.
- **P1: freeze `save-v5-salon.json` in phase 1 from v5 code, proven by a decode + re-encode round-trip.** Rejected: freezing it in the bump phase. Would change: nothing.
- **P3: hide the task-screen "Wróć" after any purchase (narrows FR-043's literal text, `[human]` row 8.7).** Rejected: a refund, which would be a second star source; and keeping a purchase across buildings. Would change: the maintainer choosing the literal rule with a refund.
- **P4: Mostek 6/10/13/14/17/19/21 = 100, cap 21 as a test constant, not `balance.ts`.** Rejected: 94 within the cap. Would change: S-17 tuning, or the maintainer keeping the cap.
- **P5: a fresh install boots no room; `UIScene` calls `ensure` on the current room; the backdrop stays plain until then (gap row).** Rejected: booting the salon for every fresh install. Would change: the visual gate finding the plain backdrop jarring.
- **P6: the choice is a view of `WelcomeScene` with a new `ChoiceCard`, the reused `SpeakerButton`, "Rodzic" hidden, and "Wróć" to the age only on the child path.** Would change: the visual gate finding the parent path without a back confusing.
- **P7: the theme back restarts the welcome with the placement as scene data and re-runs `startLearning`.** Rejected: keeping the abandoned building's warm-up answers. Would change: a playtest.
- **P8: `ageBack*` is renamed to `themeBack*` / `backToChoice` everywhere.** The meaning changed.
- **P9: no "Obrazki" line for the cards; a stand-in is recorded as `artFallbacks.choice`; `?e2eArt=choice` seam.** Would change: the maintainer wanting runtime art in "Obrazki".
- **P10: the load path repairs inside the current building (`houseRoomIds`).**
- **P11: FR-049 is proven in the browser through the in-memory seam `v5-salon`; two real builds stay re-recorded.**
- **P12: nine phases (2 tdd, 6 impl, 1 e2e).** At most 2 new UI components per phase. The e2e helpers move with the choice view so the suite stays at 179 until phase 9 (+5).
- **Plan change vs research:** `base-1` joins `HOUSES` in phase 3 together with `bridge`, not in phase 4. That way the "exactly one house" data test never needs a temporary exception.
