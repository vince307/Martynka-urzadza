# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-research kitchen-room` step of run 2026-10-30-rooms-kitchen (2026-10-31). Research is done
(`research.md`, `change.md` status `preparing`); no code yet. The next agent must not get this wrong: **the boot
budget is solved by loading at boot only the room in renovation and loading the next room's art at runtime when the
current room is done — not by raising `balance.loader.totalMs`**; `roomArtHealth` must then cover only the loaded
room(s), or "Obrazki" will report the kitchen as missing.

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` (merge of #117, F-04 shipped) |
| Commits | 2 on top of `942e237`: `docs(kitchen-room): change identity (autonomous run)`, `docs(kitchen-room): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | none yet (no `plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kitchen-room/research.md` | research: (a) boot budget options with measurements and the recommendation, (b) celebration + move after "Dalej", (c) kitchen `RoomDef`/art/script/tests, (d) kitchen copy table and room-neutral mismatch lines |
| `context/changes/kitchen-room/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/kitchen-room/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/kitchen-room` |
| `cwebp -q 85 -alpha_q 100 -m 6` on the 21 kitchen PNGs (scratchpad only) | 797 758 B (matches the `/10x-new` step) |
| `cwebp -q 70 -alpha_q 80 -m 6` on the same (downscale probe, scratchpad only) | 543 840 B → whole payload 2 636 336 B = 52.7 s, still over 48 s |
| arithmetic over `tests/bootBudget.test.ts` `bootPayloadBytes` figures | shared 889 112 B; + salon = 41.8 s; + kitchen only = 33.7 s; + both = 57.8 s (limit 48 s) |
| `metadata-guard.mjs mark-researched` | `changed: true` |
| lint / typecheck / unit / build / e2e | NOT run: docs-only step |
| deliberate break | none (no test written) |

## 4. Next command

`/10x-plan kitchen-room`

## 5. Open

- Plan must cover (from `research.md`): `BootScene.preload` `queuers.room` → `roomArt(ROOMS[currentRoom])`; a runtime room
  loader in `RoomScene` modelled on `startMusic` (`src/ui/sound.ts`: per-file `xhrSettings.timeout`, keyed `loaderror`,
  cache check), started when the current room becomes done (`RoomScene.dispatch`), with `roomArtHealth` recomputed;
  `tests/bootBudget.test.ts` shared + max per room; `tests/roomArt.test.ts` length 37 / snapshot / 1 550 000 B cap made
  per room; `tests/e2e/salon-art.spec.ts` #16 `total === ROOM_ART.length` → the salon's own count; `?e2eArt=room` also
  stops the runtime load.
- Celebration: pure `celebrationView(intensity)` in `src/core/`, `starBurst` on the card guarded by `prefersReducedMotion()`,
  one narrator line `pl.room.done.spoken`, "Dalej" → `nextRoom` → registry `rooms`+`currentRoom` → `saver.flush('now')` →
  `redraw()`; new tweens stopped in `RoomScene` `onSleep` (follow-up L-R11). E2E specs expecting the "Wkrótce" teaser after
  the salon (`room-change`, `salon-extra-slots`, `rooms-as-data`, `final-art-room-done`, `health-lines`) change.
- `RoomDoneCard` `recordFallback('miniature')` must not fire for the next room's tile while it is still loading (F-04
  follow-up 14).
- CLAUDE.md sentence "every asset must be loaded at start (no lazy chunks)" should be reworded in the implement step
  (it means precache; the Phaser loader may load a room later).
- DESIGN-GAP rows to add (next number 175, `docs/design-gaps.md`): kitchen captions/tasks (copy table in research (d)),
  celebration view, kitchen tile without a pack thumbnail, salon green board vs kitchen ivory margin, room-neutral
  mismatch lines.
- Follow-up audit-art-renderer § 2 (`python3 -I` in `scripts/make-task-art.mjs` `execFileSync`) fires with the
  `ROOM_PACKS` row.
- Human checklist: none (no `totalMs` raise recommended).

## 6. Autonomous decisions

- **Boot budget: option (2), the room in renovation at boot + runtime load of the next room.** Rejected: (1) every room
  at open time (the task backdrop and first room view regress), (2b) done rooms at boot (57.8 s, nothing draws them
  before S-23), (3) raising `totalMs` (postpones; needs `[human]`), downscale (measured 52.7 s, still fails), atlas
  (heavy, re-recorded). Why: measured payloads, `ROOM_ART` consumers draw only the current room except the done card,
  and the music loop is a precedent for runtime Phaser loads of precached files. Would change: S-23 needing done rooms at
  boot, or a runtime load proving unreliable offline in the e2e gate — then a `[human]` raise.
- **Celebration keeps the room list on the card; the "reveal" is a hold of the finished room before the card, static
  under reduced motion; no keepsake at room intensity.** Why: FR-040 + FR-041 (keepsakes are residents' stickers for a
  house). Would change: the visual gate showing the card hides the reveal.
- **Narrator line stays room-neutral "Pokój gotowy!"**. Why: no gender agreement per room name. Would change: maintainer
  asking for the room's name.
- **Copy proposal "szafki" for "Zabudowa L", "Ustaw naczynia" for the rack.** Why: child-facing words; teacher read
  pending in plan/implement. Would change: the teacher read.
- **Mismatch lines room-neutral ("Stan pokoju …").** Would change: a per-room requirement.
- **No save-format change** (stays v5; inherits change.md D3). Would change: a persisted "celebration shown" flag.
- Delegation: two read-only Explore workers (celebration/move; data/copy); their anchors were spot-checked
  (`tests/roomArt.test.ts` cap, `scripts/make-task-art.mjs` `python3`, `pl.room` block). Lessons file absent; none applied.
