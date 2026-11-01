---
change_id: house-1-polish
title: Kuchnia w etapach i salon na kremowym tle (dopracowanie domu 1)
status: archived
created: 2026-11-01
updated: 2026-11-01
archived_at: 2026-11-01T20:07:16Z
---

## Notes

Roadmap S-32 (M-03, path of house 1), PRD FR-033, FR-038. Autonomous run `2026-11-01-bathroom-polish-lab`, branch
`feat/house-1-polish` cut from `main` at `964285b` (S-31 bathroom merge #136). Art pack
`designs/martynka-house-1-polish-v1` (designer brief `docs/designer-brief-m03.md` § P3.1 and P3.2).
Outcome: the child renovates the kitchen in stages like the children's room („Posprzątaj kuchnię”, „Odnów ściany”,
„Odnów podłogę”, then the six pieces), and the salon stands on the cream `#FFF5DF` surround like every other room
(room view, house cross-section, task-screen backdrop); nothing the child already furnished in the kitchen or salon is lost.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

Scope (maintainer, `context/runs/2026-11-01-bathroom-polish-lab/scope.md`, binding): kitchen stages and the salon on
cream are DATA on the `sceneKey`/`stageFade` mechanism of S-25 (no new background mechanism); the pack's QA
`passed: false` is the order's own threshold, not a reason to refuse; the salon cell fill is decided at integration.

**For the product owner (expected, finalised by the plan):** code outside room data, the art script table and assets
that this slice is expected to change: (1) a save-format step v6 → v7 (`SAVE_VERSION`, a new `MIGRATIONS[6]` in
`src/core/save.ts` + a module in `src/core/migrations/`) that moves a saved kitchen onto the new task list (see
Migration); (2) the art script's room row needs the salon scene files from a different pack than its furniture
(`scripts/make-task-art.mjs` `ROOM_PACKS`, a per-row scene pack), and the salon board recolour (`recolourBoard`,
`scripts/recolour-board.py`) stops being used by any row. Named in the PR body „dla właściciela produktu”.

## Roadmap claims re-verified against the repo (branch `feat/house-1-polish` at `964285b`)

| roadmap claim (S-32, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-23 (house cross-section) | Shipped (#121); since then S-25 (children, #133) and S-31 (bathroom, #136) shipped; `HOUSES['house-1']` has salon (0,0), kitchen (0,1), children (1,0), bathroom (1,1) in `src/data/houses.ts` | confirmed; the house has four rooms, the kitchen is the 2nd |
| „remontuje kuchnię w etapach jak pokój dziecięcy (posprzątaj, odnów ściany, potem podłoga i meble)” | `KITCHEN.tasks` (`src/data/rooms.ts`) = one stage `renovate` („Odnów ściany i podłogę”, cost 5, `kitchen/before` → `kitchen/after`) + 6 slots (7/9/10/12/13/15 = 71). `CHILDREN.tasks` shows the staged shape: stage tasks with `scene` (`children/children-stage-1`, `-2`) then a last stage without `scene` (→ `scene.after`). The pack manifest `rooms.kitchen.stages` = neglected (`../martynka-locations-v2/.../kitchen-before.png`), clean „Posprzątaj kuchnię” (`assets/room/kitchen-stage-1.png`), walls „Odnów ściany” (`kitchen-stage-2.png`), floor „Odnów podłogę” (`../martynka-locations-v2/.../kitchen-after.png`) | confirmed as data: three stage tasks replace `renovate` at the FRONT of the list (`kitchen/kitchen-stage-1`, `kitchen/kitchen-stage-2`, then none → `kitchen/after`); kitchen goes from 7 to 9 tasks (brief P3.1 said „wyrównuje … (7) z salonem (12)”, it becomes 9) |
| „salon w przekroju domu i w zeszycie stoi na kremowym tle jak pozostałe pokoje” | Salon scene = `salon-v2` `architecture-before`/`architecture-after`/`shadows` with the green board recoloured to `#BCD799` by `scripts/recolour-board.py` (`ROOM_PACKS` row `salon`, `recolourBoard: true`; `ROOM_SCENE_FILES.salon`). The pack gives `salon-before-cream.png`, `salon-after-cream.png`, `salon-shadows-cream.png`, slots unchanged (`slotTransform` identity). Measured here: `salon-after-cream` differs from `salon-v2/architecture-after` only on the board (13.5 % of pixels); `salon-before-cream` is NOT the shipped before: it is `salon-worn-v2/architecture-before` (stronger wear; the brief P3.2 ordered exactly that) on cream | **corrected**: the before background changes look (worn-v2 wear), not only its surround; three scene files swap, `ROOM_SCENE_FILES.salon` and the `ROOM_PACKS` row change, slots and furniture stay from `salon-v2` |
| „wszystko, co dziecko już urządziło w kuchni i salonie, zostaje” | `RoomState` = `{ tasksDone, chosen }`; `tasksDone` counts POSITIONS in `RoomDef.tasks` (comment on `KITCHEN.tasks`: „New tasks go at the END of this list only”); `chosen` is keyed by slot id | **corrected**: inserting two stages at the front breaks the prefix meaning for any kitchen with `tasksDone ≥ 1` → a migration is required (see Migration); the salon keeps its task list (art only) |
| Unknown 1 „Kuchnia zyskuje dwa zadania na początku listy: jak zapis … zachowuje to, co kupione (wzór S-16d)?” (owner: agent in `/10x-plan`) | S-16d appended at the END (`formerTaskCounts`, `roomGrowth`); MIGRATIONS[2] rule B maps by cost (shortest prefix covering what was spent) | decided here in principle (D2), the plan writes it: map by MEANING, not cost — the old `renovate` = all three new stages |
| Unknown 2 „Salon na kremie zachowuje ciasny kadr … zostawić, czy zamówić nowy kadr?” (owner: autor, Block: no) | Pack README + QA limitation: margins stay original; walls and floor reach the canvas edge; house cells 608×342 at scale 19/60 (`HOUSE_GEOMETRY['house-1']` same rectangles) | decided at integration per scope.md: keep the tight crop (D4), `[human]` row |
| Unknown 3 „Czy kremowy salon zastępuje postarzenie (worn grade) i co z `salon-worn-v1/v2`?” (owner: autor, Block: no) | `SALON.worn` (10 pieces graded in code, `applyWornGrade`, gap 169) and `contactShadows` (gap 171) stand; the pack README says the before state uses the 10 worn layers of `salon-worn-v2` | decided (D5): keep the code worn grade on the furniture; take only the pack's before background; the worn-v2 furniture layers stay out; `[human]` row |
| Blockers „paczka gotowa 2026-11-01; QA 42/44, dwie niezaliczone kontrole to próg zlecenia” | `qa-report.json` `passed: false`, failed only `kitchen-outline:kitchen-stage-{1,2}:before` (XOR/union 2.93 % vs 1 %; before vs after themselves differ 2.93 %, stages vs after 0 %); `browser-checks.json` 41/41 | confirmed; not a refusal reason (scope.md) |
| Risk „zmienia dwa pokoje, w które dzieci już grają … zapis i migracja w centrum planu” | see Migration | confirmed |
| (implicit) boot budget | Boot loads only the room in renovation (`bootRoomArt`); kitchen gains two 1920×1080 backgrounds (PNG 1.6 MB each before WebP); `tests/bootBudget.test.ts` | research measures after `npm run art` |
| (implicit) kids-room `sceneKey`/`stageFade` serve any room | `sceneKey`, `stageFade`, `stagesDone` in `src/core/rooms.ts` are room-generic; `roomArt` (`src/data/roomArt.ts`) adds stage `scene` keys from the tasks | confirmed: no new mechanism needed for the kitchen |

## Design kit views and copy keys this change binds (profile § 6 + the pack)

| source | what it binds |
|---|---|
| `designs/martynka-house-1-polish-v1/manifest.json` `rooms.kitchen.stages` | stage order and backgrounds (0 before, 1 clean, 2 walls, 3 floor = after), stage labels; slots from `../martynka-locations-v2/manifest.json` (unchanged) |
| same manifest `rooms.salon` (`backgroundBefore`, `backgroundAfter`, `shadows`, `slotsUnchanged`, `slotTransform`) | the three cream scene files; slot geometry unchanged |
| same manifest `houses.house-1` (`cellFill` `#FFF5DF`, cells 608×342) | matches `HOUSE_GEOMETRY['house-1']` (`cellFill: 0xfff5df`); research re-checks |
| pack `README.md`, `registration.json`, `screenshots/kitchen-stage-{0..3}.png`, `salon-{after,before}-comparison.png`, `house-four-rooms.png` | draw order, visual-gate references |
| `docs/designer-brief-m03.md` § P3.1, P3.2 | the order: kitchen stage 0 = before, 3 = after; salon re-export of `architecture-after` and the worn-v2 `architecture-before` on cream |
| `Martynka-urzadza.md` § 10 | asset naming `public/assets/rooms/<room>/<file>.webp` |
| Copy keys (`src/data/pl.ts` `pl.room.tasks`) | NEW: a kitchen clean task „Posprzątaj kuchnię” and a walls task „Odnów ściany” (pack stage labels, imperative already); REUSED: `renewFloor` „Odnów podłogę” (children); `renovate` „Odnów ściany i podłogę” stays for salon, bathroom; no kit view for anything else (stage cross-fade is S-25's) |

DESIGN-GAPs: none expected beyond edits — row 109 (in-between backgrounds) narrows again (kitchen joins), row 203
(miniature/backdrop mid-renovation) gains the kitchen, row 182 (kitchen backdrop invisible behind the notebook)
and the salon backdrop on cream are re-judged by the visual gate; row 169/171 notes that the worn grade now sits
on the cream worn-v2 background. A new row only if the gate finds the salon cell fill or backdrop needs a design answer.

## Migration

**Expected: yes, save format v6 → v7** (overturns the orchestrator's starting decision „save stays v6” with
evidence; `[human]` row).

- Evidence: `tasksDone` is a position count (`currentTask`, `sceneKey`, `roomStateProblems` `chosen-not-bought`
  compares a slot's task index with `tasksDone`). Old kitchen `[renovate, counter, fridge, table, coffee, bench, rack]`,
  new `[clean, walls, floor, counter, …, rack]`. Unmigrated, a kitchen with `tasksDone 1` (walls and floor renewed)
  would show `kitchen-stage-1` (walls back to old: something visible disappears); a finished kitchen (7) would show the
  rack task again and `chosen['kitchen-rack']` would be flagged `chosen-not-bought`.
- Rule: kitchen `tasksDone 0` stays 0; `k ≥ 1` becomes `k + 2` (the old `renovate` produced exactly `kitchen/after`,
  which is the new third stage's result); `chosen` unchanged. Rule B (cost prefix, MIGRATIONS[2]) is rejected: 5 stars
  spent would map to the first stage only and regress the walls. The S-16d append rule does not apply (insertion at the
  front).
- Why a version step: a v6 state cannot tell the old from the new list (`tasksDone 1`, `chosen {}` is valid in both),
  so the remap must run once, behind a version (`MIGRATIONS[6]`, idempotence by version). Precedent: v5 → v6 in
  `src/core/migrations/building.ts`; `backup-v6` follows the write-once policy; frozen fixtures v6 stay inputs, a new
  `save-v7*.json` is frozen; a pre-v7 build meets v7 as `future` and never overwrites (rollback line in `deploy/README.md`).
- Salon: no state change (art only); every other room untouched. A finished kitchen stays done (no second „Pokój gotowy!”).
- What would change the answer: research finding a field that already distinguishes the lists (none seen), or the plan
  choosing to keep `renovate` as the kitchen's first task and append stages (rejected: stages after furniture contradict
  the brief and FR-033 „najpierw ściany i podłoga”).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| kids-room 2 (= bathroom-room 11) | `wornPieces` and `contactShadowPieces` mean „until the first stage” for a staged room; Trigger: S-32 | **fires, small**: the kitchen has `worn: []` and `contactShadows: []`, so neither function draws anything in any kitchen stage; the salon keeps one stage. Plan: pin it with a unit test on the staged kitchen (both empty at every `tasksDone`) and re-record the item with a narrower trigger (a staged room that has `worn` or `contactShadows`); no behaviour change |
| kitchen-room 19 / house-cross-section 12 (gap 182) | Task-screen backdrop invisible while the kitchen is current; Trigger: the designer's salon re-export on cream (brief P3.2) | **fires**: the same question now hits the salon (its board becomes cream like the page). Research measures `SalonBackdrop` with the cream salon (`backdropPixel`), the visual gate judges; a design fix (crop/frame behind the notebook) is out of this slice unless trivial in data; otherwise re-record with evidence |
| final-art-salon F (in-between backgrounds, gap 109) | Trigger: the author delivers in-between backgrounds | **fires (kitchen)**: closed for the kitchen by this slice; gap 109 narrowed |
| final-art-salon „future slots appended at the end” | Trigger: a new slot from the designer brief P3 | **fires (adjacent)**: P3 adds stages at the FRONT, not slots; the migration above is the answer; re-record the rule with the version-step exception |
| kitchen-room 4 / kids-room 12 / hangar 4 (pack thumbnails) | Trigger: a not-done room shown with a pack thumbnail, or the designer's thumbnails (brief P3) | not fired: the pack has no thumbnails; note that `UI_ART` `salonAfter` (fallback thumbnail, `miniatureMode`) still shows the green board — carry with that note |
| salon-style (recolour board) / audit-art-renderer L-2 | mask band 5–30 % of `recolour-board.py` | becomes moot if no row recolours; plan decides keep vs retire the script and `tests/recolourBoard.test.ts` |

## Autonomous decisions

- **D1. Kitchen stages as data: replace `renovate` with three stage tasks at the front — `clean-kitchen` („Posprzątaj
  kuchnię”, `scene: 'kitchen/kitchen-stage-1'`), `renew-walls` („Odnów ściany”, `scene: 'kitchen/kitchen-stage-2'`),
  `renew-floor` (`renewFloor`, no `scene` → `kitchen/after`); stage files from the polish pack in the kitchen
  `ROOM_PACKS` row.** Why: scope.md (data on S-25's mechanism), the pack's stage list, CHILDREN precedent. Rejected: a new
  background mechanism; appending stages after the furniture. What would change it: none foreseen.
- **D2. Save v6 → v7 with a meaning-based kitchen remap (`k ≥ 1 → k + 2`).** See Migration. Overturns the orchestrator
  starting decision „v6 stays” with evidence; `[human]` row in the plan. What would change it: see Migration.
- **D3. Kitchen costs: the children's stage split 5/6/7, slots unchanged 7/9/10/12/13/15 (= 84).** Why: scope.md leaves
  costs to the plan on the kids-room precedent, every task stays in 5–21. A migrated child gets the two extra stages for
  free (she paid 5 for the old one-step stage that already showed the finished walls and floor) — nothing is charged
  twice, nothing refunded. The plan may adjust, not the 5–21 rule. What would change it: the author or S-17.
- **D4. Salon keeps the pack's tight corner crop; the house cell shows it as the pack's preview does (fills its cell more
  than the other rooms).** Why: scope.md says decide at integration; a new crop would move every slot (forbidden by the
  order) and a code-side shrink would invent framing. Rejected: shrinking the salon miniature in code; ordering a new
  crop now. `[human]` row (checklist P2). What would change it: the visual gate showing the salon cell clipped or
  overlapping the shell, or the author ordering a recrop.
- **D5. Salon on cream: take the pack's three cream scene files (the before is the worn-v2 architecture, as brief P3.2
  ordered) and keep the code worn grade on the furniture (`SALON.worn`, `applyWornGrade`) and the contact shadows; do
  not import the `salon-worn-v2` furniture layers.** Why: the pack is the design source for the background; the
  furniture wear in code is the maintainer's salon-style choice; the worn-v2 furniture is the author's open question
  (roadmap Unknown 3, packs in Odłożone). Rejected: recolouring the shipped `salon-v2` before to cream ourselves (keeps
  today's before exactly, but ignores the ordered worn-v2 background); swapping in the worn-v2 furniture. `[human]` row.
  What would change it: the visual gate showing the code grade clashing with the worn-v2 background, or the author
  deciding Unknown 3.
- **D6. Next step is `/10x-research`**: migration seams (fixtures, e2e specs that read kitchen `tasksDone`,
  `roomGrowth`/`formerTaskCounts`, import preview), the salon backdrop on cream, the art script's per-row pack and the
  boot measurement need a sweep before planning (the run chain fixes research next). What would change it: none.
