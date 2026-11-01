# "Co urządzamy najpierw?" and the Mostek module — Plan Brief

> Full plan: `context/changes/first-building-choice/plan.md`
> Research: `context/changes/first-building-choice/research.md`

## What & Why

A new child picks what to furnish first: Dom (the salon, as today) or Baza kosmiczna, whose first module Mostek is
renovated like a room (before → after, 6 elements × 3 variants, 100 stars). This is the north star of milestone M-03 since
PRD v5 (FR-042, FR-043, FR-044, FR-049, FR-050). Old players must not notice anything except a safer save format.

## Starting Point

The building already lives in the save as `house.id` (save v5), but there is one building (`house-1`), the welcome goes
from the age (or the parent's stage) straight to the task screen, a fresh install boots the salon pictures, and the
task-screen "Wróć" returns to the age on the child path only.

## Desired End State

After the age or the parent's stage, the child sees two picture cards, can have them read aloud, and taps one. With Baza
she lands in Mostek; with Dom in the salon. Until her first round ends (and nothing was bought) "Wróć" brings her back
to the choice. A v5 save resumes in the house with no choice screen; the same seed gives the same tasks in both buildings.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Save format | v6 as a version bump only, `MIGRATIONS[5]` frozen identity | `house.id` already names the building; the bump is the rollback guard (an old build would turn a base save into a salon game) | Research R1 |
| FR-049 proof | frozen `save-v5-salon.json` written by the v5 code in phase 1, before the bump | the oracle must not come from the migration under test | Plan P1 |
| Where the choice lives | a second view of `WelcomeScene`, written with the learner on the card tap | one choke point for both paths; closing early asks the age again | Research R3, Plan P2 |
| Task-screen "Wróć" | one back to the choice on both paths, hidden after the first round or a purchase | no refund, no two buildings; narrows FR-043 → human row | Research R4, Plan P3 |
| Mostek costs | 6/10/13/14/17/19/21 = 100, test cap widened to 21 | FR-044 "higher than the salon" cannot fit the 5-15 cap | Research R6, Plan P4 |
| Fresh-install boot | no room art, two choice cards only; room loads during the first round | one building per boot; the base child never pays for the salon | Research R5, Plan P5 |
| Base as data | `base-1` in `HOUSES`, `bridge` in `ROOMS`, `BUILDING_CHOICES`; "Dom" button hidden without geometry | no "if base" branch in scenes | Change D2, D6 |
| FR-050 | `MINIGAME_WORDS` shared; seed deep-equal test + wiring guard | rounds take no building input | Research R7 |

## Scope

**In scope:** save v6 + `backup-v5` + README rollback note; Mostek art, data, copy; `base-1`; fresh-install boot with
choice cards; choice view with speaker; task-screen back; `?e2eSave=v5-salon`, `?e2eArt=choice`; docs, gaps, follow-ups;
e2e spec.

**Out of scope:** base cross-section and "Baza" button (S-29), Hangar (S-30), switching building later, a `building`
field, balance/curriculum/variants changes, texture atlas, animations on the choice view.

## Architecture / Approach

Pure rules and frozen fixtures first, then the version bump, then content (Mostek art/data, building row), then the
building choice as data with the load-path rule and FR-049/FR-050 proofs, then boot, then the welcome view (e2e helpers
move with it), then the task-screen back, then docs and the visual pass, finally the browser spec.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Frozen v5 save + pure rules (tdd) | `save-v5-salon.json`, `themeBackOffered`, `houseRoomIds` | fixture not a genuine v5 write |
| 2. Save v6 (tdd) | `SAVE_VERSION` 6, `MIGRATIONS[5]`, pins, README note | a missed version pin |
| 3. Mostek art and data (impl) | 21 WebP, `BRIDGE`, `base-1`, copy | Polish agreement in labels |
| 4. Choice table, load path, FR-049/050 (impl) | `BUILDING_CHOICES`, `buildingStart`, repair inside the building, "Dom" hidden, seam | load path sends a base child to the salon |
| 5. Fresh-install boot (impl) | `CHOICE_ART`, `bootGroups`, smoke line | "Obrazki" claims a room missing |
| 6. Choice view (impl) | `ChoiceCard`, choice view, speaker, helpers | 43 e2e files depend on the helpers |
| 7. Task-screen back (impl) | `backToChoice`, renames, first-launch spec | back offered after a purchase |
| 8. Docs, sweep, visual (impl) | CLAUDE.md, gaps 191+, follow-ups, 9 visual states | — |
| 9. e2e (e2e) | 5 browser tests (#12, #2, #16) | load flakes under machine load |

**Prerequisites:** F-04, S-22, S-23 shipped; pack `designs/bystrow-space-base-v1` present; cwebp + Pillow for `npm run art`.
**Estimated effort:** ~9 phase sessions plus gates; e2e 179 → 184.

## Open Risks & Assumptions

- The plain backdrop on a fresh install (until the chosen room loads) may look bare; the visual gate judges it (P5).
- Narrowing FR-043 (no back after a purchase) needs the maintainer's acceptance (human row 8.7).
- Choice-card WebP sizes (about 107 KB) come from a scratchpad measurement; phase 5 caps them at 130 KB.

## Success Criteria (Summary)

- A new child chooses Dom or Baza by touch on both paths and can go back until her first round ends.
- A child with an old save opens straight into her house with the same stars, rooms and stage.
- Mostek can be renovated to the end for 100 stars and stays in Mostek after the celebration.
