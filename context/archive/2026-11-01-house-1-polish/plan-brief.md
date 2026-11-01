# Kitchen in stages and the salon on cream — Plan Brief

> Full plan: `context/changes/house-1-polish/plan.md`
> Research: `context/changes/house-1-polish/research.md`

## What & Why

Roadmap S-32 (PRD FR-033, FR-038): the child renovates the kitchen in stages like the children's room ("Posprzątaj
kuchnię", "Odnów ściany", "Odnów podłogę", then six pieces), and the salon stands on the cream surround like every other
room. Nothing a child already furnished in the kitchen or the salon may be lost (FR-021, FR-035).

## Starting Point

The kitchen has one stage task "Odnów ściany i podłogę" then six slots; saved progress is a position count (`tasksDone`) in
that list. The salon's background has a green board recoloured by the art script. S-25 built one background rule
(`sceneKey`/`stageFade`) for room, miniature, house cell and backdrop; the pack `martynka-house-1-polish-v1` delivers the
two kitchen in-between backgrounds and three cream salon files.

## Desired End State

The kitchen shows four looks (before, clean, walls, after) as the child buys three stages, then is furnished; the salon,
its house cell, its card miniature and the task-screen backdrop sit on cream. A child who was mid-kitchen on the old build
opens the new one and sees exactly what she had (walls renewed, pieces in place); her save is now format v7 with a v6 backup.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Save format | v7, `MIGRATIONS[6]`: kitchen `tasksDone` 0→0, k≥1→k+2 | Front-inserted stages change what a saved position means; only a version step can tell old from new. Overturns "save stays v6" (scope.md) → `[human]` | Research / change.md D2 |
| Phase order | Migration (tdd) before the kitchen data | The data must never land unprotected; one temporary `tasks-overflow` expectation bridges p1→p2 on the branch only | Plan |
| Fixtures | New frozen `save-v6-kitchen-mid.json` (written by v6 code), existing `save-v6-kitchen-done.json`, hand-written `save-v7.json` oracle | Oracles never computed by the step under test | Plan |
| Kitchen tasks | `clean-kitchen` 5, `renew-walls` 6, `renew-floor` 7, slots unchanged (84) | Children's stage split; migrated child pays nothing extra | change.md D3 |
| Art pipeline | Per-file `{ pack, id, as? }` source in `ROOM_PACKS` | Kitchen mixes two packs; salon keeps its output names | Research R3 / Plan |
| Salon look | Pack's worn-v2 cream before + code worn grade on furniture; tight crop kept | Pack is the background source; furniture wear stays the maintainer's code choice → `[human]` ×2 | change.md D4, D5 |
| Browser proof of the old save | New `?e2eSave=v6-kitchen` seam (hook build only) | `v5-salon` precedent | Plan |
| recolour-board.py | Kept, unused, follow-up | Retiring is cleanup outside the outcome | Research R4 |

## Scope

**In scope:** save v7 + migration + backups + pins + rollback note; kitchen stage data, copy, two WebP; salon three cream
WebP; e2e seam; docs, gaps 206/207, follow-ups; one e2e spec.

**Out of scope:** any new background mechanism; salon task list; salon-worn-v2 furniture layers; cream thumbnail; script
retirement; star/curriculum/loader changes; S-33.

## Architecture / Approach

Data on S-25's mechanism: three stage tasks with `scene` keys at the front of `KITCHEN.tasks`; `roomArt` picks up the new
pictures. A frozen, data-free migration module keeps old saves meaning the same. The art script gains a per-file source so
one room can draw from two packs.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Save v7 (tdd) | `MIGRATIONS[6]`, frozen v6 mid input, v7 oracle, backup-v6, pins, README note | Oracle accidentally computed by the step |
| 2. Kitchen stages (impl) | Three stage tasks, two copy keys, two WebP, per-file art source | `npm run art` tooling; spec drift |
| 3. Salon on cream (impl) | Three salon WebP from the pack, no recolour | Renaming would disarm `salon-load-health` route |
| 4. e2e seam (impl) | `?e2eSave=v6-kitchen` | Seam leaking into `dist/` (guarded) |
| 5. Docs and sweep (impl) | CLAUDE.md v7 sentence, gaps, follow-ups, visual pass | Stale "v6 current" wording |
| 6. Browser (e2e) | 3 tests: stages + balance, moved v6 kitchen, cream salon | Load-sensitive purchase run |

**Prerequisites:** branch `feat/house-1-polish` at `98775f8`; local `cwebp`, Pillow 12.1.0 + numpy 2.4.3; packs in `designs/`.
**Estimated effort:** 6 phase sessions plus the orchestrator's full e2e run.

## Open Risks & Assumptions

- The worn-v2 before under the code grade may look doubly worn (visual frames judge; `[human]`).
- The salon fills its house cell more than other rooms (`[human]`, gap 207).
- A rollback below v7 shows players the "nowszy zapis" card until roll-forward (`[human]`).

## Success Criteria (Summary)

- A mid-kitchen child on the old build keeps walls and pieces after the update (unit + browser).
- The kitchen visibly changes at each of three stages; the balance is exact.
- The salon sits on cream in the room and in the house; deploy smoke counts 146 room pictures.
