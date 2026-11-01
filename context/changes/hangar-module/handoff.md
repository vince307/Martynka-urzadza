# Handoff — `hangar-module` (slice S-30)

Written by the `/10x-research hangar-module` step of run 2026-10-31-space-base. Research is complete: the Hangar is data
(`src/data/{rooms,houses,roomArt,pl}.ts`) plus art (`scripts/make-task-art.mjs` pack root + `ROOM_PACKS` row, 21 WebP in
`public/assets/rooms/hangar/`); no scene, core or UI code changes. The next agent must not miss the three tests that pin
`base-1` as a one-room base (they are expected edits, not regressions) and must add a v6 "Mostek done" fixture proof.

## 1. State

| | |
|---|---|
| Branch | `feat/hangar-module`, cut from `main` at `a4a0aee` (S-29 merge) |
| Commits | 2 on top of `a4a0aee`: `docs(hangar-module): change identity (autonomous run)`, `docs(hangar-module): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/hangar-module/research.md` | answers (a)–(f) with symbols: touch list, measured WebP sizes and boot payloads, cell/miniature path, "Dalej" + v6 back-compat + rollback path, smoke/"Obrazki" derivation, Polish copy table |
| `context/changes/hangar-module/change.md` | frontmatter only: `status: new → preparing`, `updated` 2026-11-01 |
| `context/changes/hangar-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/hangar-module` |
| cwebp `-q 85 -alpha_q 100 -m 6` (the flags of `convert` in `scripts/make-task-art.mjs`) on the 21 PNGs of `designs/bystrow-space-base-v2/assets/{room,furniture}` into the session scratchpad | 606 452 B total (before 136 412, after 96 556, shadows 4 056; furniture 10 670–31 550 each); nothing written to `public/` |
| `cat public/assets/rooms/<room>/*.webp \| wc -c` | salon 1 203 384, kitchen 797 758, bridge 699 124 B |
| throwaway vitest summing `bootPayloadBytes` parts (file created and deleted in the same command, `git status` clean after) | non-room boot 889 112 B; salon 41.8 s, kitchen 33.7 s, bridge 31.8 s; Hangar computed 1 495 564 B = 29.9 s vs limit 48 s |
| `npx vitest run tests/bootBudget.test.ts` | 4 passed (current tree, without the Hangar) |
| throwaway vitest `unreachableSlots` on the manifest Hangar slots, all bought (created and deleted) | `[]` |
| lint / typecheck / full unit / build / e2e | not run: research step, no product code changed (baseline in the agent contract: unit 4185, e2e 187, inherited, unverified) |

## 4. Next command

`/10x-plan hangar-module`

## 5. Open

- Plan must touch (from `research.md` § (a)): `src/data/rooms.ts` (`HANGAR`, `ROOMS`), `src/data/houses.ts` (`HOUSES['base-1']` + `{ room: 'hangar', floor: 0, place: 1 }`), `src/data/roomArt.ts` (`ROOM_SCENE_FILES.hangar`), `src/data/pl.ts` (`pl.room.names/tasks/slots/variants`), `scripts/make-task-art.mjs` (`SPACE_BASE_V2`-style root, `ROOM_PACKS` row `hangar`, `recolourBoard: false`), 21 WebP under `public/assets/rooms/hangar/`.
- Tests to edit: `tests/roomsData.test.ts` ("… and the only room of the base", "keeps the child in Mostek after the last task: Dalej stays"), `tests/roomArt.test.ts` (snapshot equality of `ROOM_ART`, the per-room entry counts), `tests/e2e/base-cross-section.spec.ts` "#16 #2 S-29 FR-046" ("Dalej" now moves to the Hangar). New: Hangar data test (costs 100, manifest geometry), a frozen `tests/fixtures/save-v6-bridge-done.json` through the load path (`repairCurrentRoom` → `mergeHouse` → `nextRoom` lands in `hangar`), optional Hangar case in `tests/roomHit.test.ts` `unreachableSlots`.
- DESIGN-GAPs for the plan: new row 201 (the kit has no Hangar wording; task labels and agreed variant forms are ours); row 196 edited (last module is now the Hangar, D3).
- Follow-ups: base-cross-section 5 (gap 196) fires → narrowed, re-record in `follow-ups/review-fixes.md` at archive with trigger "a third base module or a designer answer". Atlas follow-up (kitchen-room 5 / first-building-choice 5) NOT fired (29.9 s vs 48 s). `FIRST_ROOM` follow-up not fired; `roomArtCheck` (`scripts/deploy-check/parse.ts`) is unused by `scripts/check-deploy.ts` — noted, out of scope.
- Docs to update in the plan: CLAUDE.md "Current state" sentence for S-30; optionally a Hangar clause in the `balance.loader` comment (`src/data/balance.ts`).

## 6. Autonomous decisions

- R1 Scope derived from `change.md` and the step prompt (no question asked). Rejected: re-opening D1–D6 of `/10x-new`; none was contradicted by evidence. Changes if the plan finds a contradiction.
- R2 No workers spawned: one data path already mapped by `change.md` and S-22/S-29 precedents; the skill's delegation default overridden for cost. Changes if a gap needed a broad sweep (none remained).
- R3 Task labels recommended "Postaw rakietę / Postaw łazik / Postaw stół warsztatowy / Ustaw skrzynie z częściami / Postaw lampę / Połóż matę startową"; "Postaw lampę" over "Powieś lampę" because the sprite `hangar-lamp-natural.png` is a standing desk lamp. Changes after the plan's teacher read or a designer's wording.
- R4 No e2e save seam for a finished-Mostek v6 save (it would add code in `src/testing/e2eHook.ts` and a marker in `vite/e2eHookGuard.mjs`); a frozen fixture unit test plus the in-session e2e path is the proof. Changes if the plan wants a browser-level FR-049-style proof for the base.
- R5 Measured with cwebp into the scratchpad instead of `npm run art` (the script writes `public/`). Changes never for research.
