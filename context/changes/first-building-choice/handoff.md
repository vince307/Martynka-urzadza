# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-new` step of run 2026-10-31-space-base: the change identity exists, nothing is researched or planned yet. The next agent must not get wrong that **v6 is expected because of the rollback guard, not because a field is missing** (a pre-S-28 v5 build silently turns a base save into a salon game: `houseLayout` → `FIRST_HOUSE`, `repairCurrentRoom` → salon), and that a save with a learner must NEVER meet the choice screen (FR-049).

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 1: `docs(first-building-choice): change identity (autonomous run)` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/first-building-choice/change.md` | identity, roadmap-claim table (repo now vs plan time), kit views and copy keys bound, expected design gaps, migration expectation (v6), triggered follow-ups with takes, decisions D1-D10 |
| `context/changes/first-building-choice/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/first-building-choice` |
| uniqueness of the change id in `context/changes/` and `context/archive/` | no collision |
| WebP sizes of `designs/bystrow-space-base-v1/assets/**` (`cwebp -q 85 -alpha_q 100 -m 6`, into the session scratchpad, nothing committed) | Mostek scene + 18 furniture 699 124 B; choice cards 107 074 B; base shell + airlock 94 278 B; total 900 476 B |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code touched |

## 4. Next command

`/10x-research first-building-choice`

## 5. Open

Research questions (from `change.md`):
- v6 shape: an explicit `building` field or a version bump over the v5 shape (`house.id` names the building); frozen copy in the migration (rooms-as-data follow-up 15); `backup-v5`; `?e2eSave=v5` seam for FR-049 in the browser; `deploy/README.md` note.
- Where the choice is written: together with the learner in `WelcomeScene.start` (default D3) vs a pending flag.
- Boot: where the choice cards load (boot only when `needsPlacement`, or runtime in the welcome flow); whether a fresh install boots no room art until the choice; `tests/bootBudget.test.ts` worst case (salon) unchanged by Mostek.
- Speaker on the choice screen: the narrator lives in the registry, its button is in `UIScene` (HUD of the task screen).
- Theme "Wróć": offered on both paths while `firstRoundDone` is false (`src/core/placement.ts`), next to `TaskScene.backToAge`.
- The "Dom" zoom-out button hidden for a building without `HOUSE_GEOMETRY` (D6); the "all modules done" path after Mostek must not move to the house (D7).
- `tests/e2e/support/welcome.ts` `passWelcome`/`passWelcomeAsChild` gain the theme tap (every spec goes through them).
- Choice cards need a table the deploy smoke reads (`precacheCovers`), Mostek art is covered through `ROOM_ART`.
- Expected DESIGN-GAPs (rows after 190): choice-screen layout, speaker on the welcome flow, Mostek task wording, no zoom-out for the base until S-29, Mostek celebration without a next module, choice-card stand-in.
- Triggered follow-ups: see the table in `change.md` (v6: rooms-as-data 8, 9, 10, 15; precache: SW install warning; WelcomeScene: openParent guard; `backToAge`: N-2; atlas re-recorded).

## 6. Autonomous decisions

- `AskUserQuestion` never called; the skill's STOP points decided in place (contract rule 1).
- Next step `/10x-research` instead of the skill's default `/10x-plan`: the step prompt fixes it, and the slice touches the welcome flow, save format, boot queue and art pipeline. Would change: nothing.
- Clipboard copy of the next command skipped (unattended run). Would change: nothing.
- D1-D10 recorded in `change.md` § Autonomous decisions (art in scope, base as data, choice written with the learner, theme back on both paths, v6 expected, no zoom-out for the base until S-29, room celebration reused, Mostek costs new data only, PRD wording used where it names the words) — each with its reversal condition.
