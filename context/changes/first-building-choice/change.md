---
change_id: first-building-choice
title: Wybór „Co urządzamy najpierw?” (Dom albo Baza kosmiczna) i Mostek bazy
status: planned
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

Roadmap S-28 (M-03 „Ulica i domy”, Stream D „Baza kosmiczna”, north star of the milestone since PRD v5), PRD FR-042,
FR-043, FR-044, FR-049, FR-050, US-05, US-06, US-07, Guardrails of version 5, Open Question 17. Autonomous run
`2026-10-31-space-base`, branch `feat/first-building-choice` cut from `main` at `fc13e8c`. Outcome: a new child, after the
age (or after the parent set the stage), sees „Co urządzamy najpierw?” with two picture cards (Dom, Baza kosmiczna), read by
the speaker button, and picks one with a tap; until the end of the first round she can go back to the choice; with the base
she renovates the Mostek module like a room (walls and floor before → after, then 6 elements × 3 variants, about 100 stars
in all); a child with a save from before the change plays on in the house with no choice screen, and rounds with the same
seed give the same tasks in both themes.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Roadmap claims re-verified against the repo (branch `feat/first-building-choice` at `fc13e8c`)

| roadmap claim (S-28, plan time) | repo now | correction |
|---|---|---|
| Prerequisites F-04, S-22 | Both shipped (archived `2026-10-30-rooms-as-data`, `2026-10-31-kitchen-room`); S-23 (`2026-10-31-house-cross-section`) also shipped. `HOUSES` (`src/data/houses.ts`) = one `house-1` (salon, kitchen); `ROOMS` (`src/data/rooms.ts`) is one flat registry `{ salon, kitchen }`; `FIRST_ROOM` = first cell of `FIRST_HOUSE` | confirmed; S-23 being in means the room view already has the zoom-out button `pl.house.open` = 'Dom' and `HouseScene`, which this slice must not show to a base child (see D6) |
| Blockers: none, pack `bystrow-space-base-v1` ready (Mostek before/after/shadows, 6 × 3 elements, choice cards 720×480, base shell and "Wkrótce" airlock) | Pack present, read-only: `assets/room/bridge-{before,after,shadows}.png` 1920×1080, `assets/furniture/bridge-{console,chair,telescope,shelf,rug,plants}-{natural,sunny,mint}.png`, `assets/choice/choice-{house,space}.png`, `assets/base/{base-1-shell,cell-closed}.png`, `manifest.json` (`schemaVersion: 1`, locations-v2 schema, `rooms.bridge` with 6 slots and z order, `bases.base-1` with the same four cells as `house-1`, `choices`) | confirmed. Measured as WebP in the scratchpad with the art script's settings (`cwebp -q 85 -alpha_q 100 -m 6`): Mostek scene + 18 furniture = **699 124 B**, choice cards = **107 074 B**, base shell + airlock = 94 278 B (S-29) |
| "6 elementów × 3 warianty" | Manifest slots: `bridge-console` (z 20), `bridge-chair` (30), `bridge-telescope` (18), `bridge-shelf` (15), `bridge-rug` (5), `bridge-plants` (40), each 3 variants; families natural/sunny/mint = Naturalny/Słoneczny/Miętowy (the kitchen's labels) | confirmed; no decor, no worn pieces, no contact shadows (the before scene is one full picture, like the kitchen) |
| "łącznie ok. 100 gwiazdek", "ceny wyższe niż w salonie" (FR-044) | Kitchen: 7 tasks, 5-15, sum 71; salon: 12 tasks, 5-15, sum 129 (the PRD's "ok. 100" predates S-16d's five slots). No Mostek data | real gap: 7 tasks (stage + 6 slots) with costs above the salon's per task summing to about 100; numbers are new data only (no balance change elsewhere, scope.md) |
| Choice screen after the age, also on the parent path; speaker reads it; „Wróć” until the end of the first round (FR-042, FR-043, US-07) | `WelcomeScene.start` writes `REGISTRY_KEYS.learner` and starts `TaskScene` straight away; `ageBackOffered` (`src/core/placement.ts`) is false for a parent-placed learner (`stageOverriddenByParent`) and `TaskScene.backToAge` returns to the age. No theme screen, no copy | real gap: a theme step between the age/stage and the task scene, a theme "Wróć" offered on BOTH paths until `firstRoundDone` (unlike `ageBackOffered`); the narrator is today a HUD button of `UIScene`, so the speaker on the welcome flow needs a decision (research) |
| Old saves keep playing in the house without the choice (FR-049, US-06) | `needsPlacement(learner)` = learner null; a v5 save with a learner goes straight to `TaskScene`; `freshSession(FIRST_HOUSE)` always starts in the salon | confirmed as the base rule: a save with a learner never meets the choice. Proof on a frozen v5 fixture (`tests/fixtures/save-v5.json`) in a unit test and in the browser (`?e2eSave=` seam) |
| Same seed gives the same tasks in both themes (FR-050) | `buildAdaptiveRound` and the generators take no house/room input today | confirmed; the test pins it so a later theme-aware change cannot slip in |
| Unknown: does the choice fit save format v5 or need v6 (Open Question 17) | v5 `house` is `{ id, rooms[] }`, `validHouse` accepts any id, so a base could be stored as `house.id = 'base-1'` with no new field. BUT a pre-S-28 v5 build reading such a save: `houseLayout` maps the unknown id to `FIRST_HOUSE`, `repairCurrentRoom` sends the unknown `currentRoom` 'bridge' to the salon and `mergeHouse` appends the bridge as an extra room — the base child would silently land in a salon after a rollback and the next write would keep that | **v6 expected** (decision D5): the rollback guard (`future` card, nothing overwritten) is the reason, not a missing field; research decides whether v6 adds a field or is a version bump over the v5 shape |
| Unknown: boot loads only one building (NFR v5, ≥ 2 s headroom in `tests/bootBudget.test.ts`) | Boot loads `bootRoomArt(currentRoom)` (one room); `tests/bootBudget.test.ts` checks every room in `ROOMS` as the worst case; the salon is the heaviest room (about 1.2 MB). Mostek (699 KB) is lighter, so adding it to `ROOMS` keeps the worst case. A fresh install boots the salon art before the child has chosen | real question for research: where the choice cards (107 KB, about 2.1 s at 50 KB/s) load (boot only when `needsPlacement`, or at runtime in the welcome flow), and whether a fresh install should boot no room art until the choice (base child would otherwise pay for the salon) |
| (implicit) offline from the first install, smoke checks base art | `precacheCovers` in `scripts/deploy-check/parse.ts` compares `ROOM_ART` (all rooms) with the served precache; precache globs cover webp | confirmed: Mostek art in `ROOMS` → `ROOM_ART` → smoke covers it with no smoke code change; the choice cards need a table the smoke reads (`UI_ART` or a new one) |
| (implicit) art pipeline | `ROOM_PACKS` in `scripts/make-task-art.mjs` (kitchen row: `recolourBoard: false`), `ROOM_SCENE_FILES` in `src/data/roomArt.ts` | confirmed: one new row `bridge` from `designs/bystrow-space-base-v1`; the Mostek backgrounds have cream `#FFF5DF` edges, no green board → `recolourBoard: false` |
| Risk: an old save meets the choice screen or loses the salon | — | confirmed as the slice's main risk; FR-049 proof on frozen v5 fixtures (`save-v5.json`, `save-v4-salon.json` through the chain) |

## Design kit views and spec sections this change binds (profile § 6 + the space-base pack)

| source | what it binds |
|---|---|
| `designs/bystrow-space-base-v1/manifest.json` (`rooms.bridge`) | `backgroundBefore`, `backgroundAfter`, `shadows`, `shadowEllipses: []`, the six slots (id, label, x, y, width, height, z, `targetRect`, `visibleRect`, `anchor`, variants per family), `families` (natural/sunny/mint) |
| `designs/bystrow-space-base-v1/manifest.json` (`choices`) | `choice-house.png`, `choice-space.png`, 720×480 RGBA, labels NOT in the picture (the preview draws them) |
| `designs/bystrow-space-base-v1/README.md` § Pliki do gry, § Manifest i integracja | draw order (background, shadow layer, slot variants ascending by z), x/y = top-left of the PNG canvas, shared visibility rect per family; the cream edges of the Mostek backgrounds |
| `designs/bystrow-space-base-v1/screenshots/choice-cards.png`, `previews/bridge-before.png`, `previews/bridge-after-{natural,sunny,mint}.png`, `screenshots/bridge-*.png` | visual-gate references for the choice screen and the Mostek before/after |
| `designs/bystrow-space-base-v1/preview.html` (`?view=choices`) | how the two cards sit side by side and where the label goes (preview-only text) |
| `manifest.json` `bases.base-1`, `assets/base/*` | NOT bound here (S-29); converted only if research finds it cheap to ship with the pack row, never shown in S-28 |
| `Martynka-urzadza.md` (plan) | room flow and asset naming (§ 10) for `public/assets/rooms/bridge/` and the choice-card files |
| Copy keys | existing: `pl.room.tasks.renovate` ('Odnów ściany i podłogę'), the family labels ('Naturalny', 'Słoneczny', 'Miętowy'), `pl.welcome.question`, `pl.parent.*`; NEW (no kit copy): the choice question „Co urządzamy najpierw?” and card names „Dom”, „Baza kosmiczna” (both fixed by PRD FR-042, so not invented), `pl.room.names.bridge` = 'Mostek' (PRD), the six Mostek task labels (imperative + accusative, from the manifest slot labels: Pulpit sterowniczy, Fotel pilota, Teleskop, Regał z planetami, Mata orbitalna, Kapsuła roślinna), the theme "Wróć" (reuse of the existing `ageBack` 'Wróć' label of the task screen), the spoken text of the choice screen |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 190)

- The kit has no choice screen layout around the cards (title, card labels, a back button): the pack's `?view=choices` preview and `screenshots/choice-cards.png` are the reference; labels drawn by the game from `pl.ts`.
- The kit has no speaker on the welcome flow (it is a HUD button of the task screen): placement decided in research/plan.
- The task wording of the six Mostek tasks is ours (precedent: kitchen task labels).
- What a base child's room view shows in place of the zoom-out button until S-29 (decision D6: nothing).
- What the celebration card shows when Mostek is done and no next module exists (S-29 owns FR-046; S-28 must only not break).
- No kit picture when a choice card does not load: a code-drawn card with the label (stand-in like `ArtImage`).

## Migration

**Expected: save format v6** (maintainer accepted v6 in scope.md; Open Question 17). Evidence above: under v5 a base save
read by a pre-S-28 build is silently turned into a salon game. v6 = migration v5 → v6 giving building „dom” (`house-1`) to every
existing save, write-once `profile:default:backup-v5` under the policy of `backup-v1`…`backup-v4`, frozen fixtures
`tests/fixtures/save-v5*.json` untouched plus a new `save-v6.json`, a rollback below the v6 build meets the `future` card and
overwrites nothing, a `deploy/README.md` docs note (docs-only edit of `deploy/README.md` may ship, profile § 5). The frozen
migration copies its house on frozen tables (rooms-as-data follow-up 15). Research decides whether v6 adds an explicit field
(e.g. `building`) or only bumps the version over the v5 shape (`house.id` already names the building); either answer keeps
FR-049.

## Open follow-ups triggered by this slice

| follow-up (source) | trigger | take |
|---|---|---|
| rooms-as-data 8: GRD-09 / S13-06 (drawing beside a mistake example) | the next save-format change (v6) | **fires, not in scope**: a progress-preview feature unrelated to the building choice; re-record with `Trigger: the next save-format change after v6, or a parent asking` |
| rooms-as-data 9: SV2-13 one bad `variants` field rejects the whole save | v6 | **fires, research decides**: cheap only if v6 touches `validateSave`/`saveProblem` anyway; default re-record (a lenient `variants` is a save-truth change of its own) |
| rooms-as-data 10: e2e on two real builds (v5 build writes, v6 build reads) | v6 | **fires, partly**: prove with unit tests on the real load path plus an in-memory seam `?e2eSave=v5` (precedent `v4-salon`, decision P-6); two real builds re-recorded |
| rooms-as-data 15: keep the frozen `copyOfHouseV5`, never point a migration at `copyHouse` | the next change to `src/core/migrations/` or v6 | **fires, in scope as a rule**: the v5 → v6 step uses its own frozen copy |
| save-truth 15: e2e on two real builds | "the save format v5" (already passed) | stale trigger; same take as rooms-as-data 10 |
| kitchen-room 5 / rooms-as-data 5 / salon-style / final-art-p2: texture atlas | `tests/bootBudget.test.ts` fails, or a third room | **fires (Mostek is a third room)**: default not in scope (Mostek is lighter than the salon, worst case unchanged); re-record with `Trigger: tests/bootBudget.test.ts fails or headroom < 2 s` |
| kitchen-room 6 / house-cross-section 48 / F-04 6: service-worker install warning | the next change to the precache set / `registerServiceWorker.ts` | **fires** (Mostek + choice art join the precache); small; in scope if cheap (a `console.warn`), else re-record |
| salon-extra-slots 12, final-art-p2 12, salon-style 33: per-file timeout test | the next change to `balance.loader` or the boot queue | fires only if the choice cards enter the boot queue (research); then in scope if cheap |
| post-run-polish N-2: "Wróć" leaves no trace of the stage change | the next change to `TaskScene.backToAge` or `ageBackOffered` | **fires** (the theme back sits next to `backToAge`): research decides; default re-record unless the theme back reuses the same trace path |
| audit-backdrop-fox 14 / observability F4 / parent-settings 46: `WelcomeScene.openParent` guard style | the next change to `WelcomeScene` | **fires**: small alignment (`session?.active()`), in scope if the welcome flow is edited there |
| notebook-polish 66: bar layout / `WelcomeScene` | the next change to `WelcomeScene` | fires; checked by the visual gate only (no layout change planned to the age screen) |
| autosave-versioned-save 14: `errorBoundary` / `WelcomeScene` | the next change to `WelcomeScene` | fires; research reads it and decides (default re-record) |
| final-art-salon 62, load-and-tab-guard A-3/A-4/A-10, salon-load-health, stale-tab-and-health, audit-boot-hidden-tab: `BootScene.preload` items | the next change to `BootScene.preload` | fire only if the boot queue changes (choice cards or no-room-art boot); then research picks the cheap ones, rest re-recorded |
| first-launch-placement 3 (test-plan risk #12) | — (no trigger) | context: the first launch now has a third step; the e2e spec for risk #12 extends to the choice |
| rooms-as-data 11, house-cross-section 39 (kids' room) | S-25 | not this slice |
| house-cross-section 30 / kitchen-room 12 (house celebration) | S-24 | not this slice |

## Autonomous decisions

- **D1 — orchestrator starting decision (scope.md): art is IN scope.** Chosen: convert the Mostek scene, 18 furniture
  files and the two choice cards to WebP through `npm run art` (new `ROOM_PACKS` row `bridge`, `recolourBoard: false` because
  the backgrounds have cream edges, no board; the cards through the UI-art root or a new small table). Rejected:
  code-drawn placeholders (the pack exists, QA passed). Would change: the in-game visual gate failing the pack.
- **D2 — orchestrator starting decision (scope.md): the base is data like the house.** A second building `base-1` in
  `src/data/houses.ts` (Mostek in cell ground-left, the same `floor`/`place` grid), Mostek as a room `bridge` in `ROOMS`;
  no `if base` branch in scenes where data carries the difference. Rejected: a separate base registry. Would change:
  research finding that the flat `ROOMS` registry breaks a house-only rule (e.g. `repairCurrentRoom` knowing every room).
- **D3 — maintainer decision (scope.md): screen order age → theme → warm-up; on the parent path the child still chooses.**
  Default here: the choice is written together with the learner (one registry/save step), so a child who closes the app on the
  choice screen meets the age again, never a house she did not pick. Would change: research showing the learner must be
  written before the choice (then a pending flag, which makes v6 carry a field).
- **D4 — maintainer decision (scope.md): the theme can be changed until the end of the first round.** Default: a theme "Wróć"
  in the task screen while `firstRoundDone` is false, on BOTH paths (unlike `ageBackOffered`); from the theme screen the
  child-placed path can still go back to the age. Rejected: one combined back to the age (loses the parent path). Would
  change: the plan finding two "Wróć" meanings on one screen confusing — then one button back to the theme screen only.
- **D5 — this step: v6 expected** (scope.md accepts it; evidence in the claims table: a pre-S-28 build silently turns a v5
  base save into a salon game). Rejected: v5 with `house.id = 'base-1'` (no rollback guard). Would change: research proving
  a pre-S-28 build cannot meet a base save (it can: the deploy rollback is one click).
- **D6 — this step: no zoom-out button for a building without a cross-section.** A base child's room view hides the "Dom"
  button until S-29 gives the base its geometry (data: the button shows only when `HOUSE_GEOMETRY` has the building).
  Rejected: showing the house cross-section to a base child (wrong building, FR-048) or pulling S-29 forward. Would change:
  S-29 merged into this slice by the orchestrator.
- **D7 — this step: celebration after Mostek reuses the room celebration as is**; whatever "Dalej" does with no next module
  must not crash or move the child to the house. FR-046 (stay in the base, free changes) is S-29's outcome; S-28 proves
  only "no crash, stays on Mostek". Would change: research finding the current "all rooms done" path moves to the house.
- **D8 — this step: Mostek costs are new data only** (scope.md, FR-044): 7 tasks summing to about 100, each above the
  salon's cost at the same position; no change to star income, mastery, curriculum or variants. Would change: S-17 tuning.
- **D9 — this step: missing copy follows the PRD where it names the words** (FR-042: „Co urządzamy najpierw?”, „Dom”,
  „Baza kosmiczna”, „Mostek”); the six Mostek task labels and the speaker text are ours with a design-gap row (precedent:
  kitchen labels). Would change: the designer or author delivering wording.
- **D10 — this step: next step is `/10x-research`, not `/10x-plan`** (the skill's default). The slice touches the welcome
  flow, the save format, the boot queue and the art pipeline; the orchestrator prompt fixes it. Would change: nothing.
