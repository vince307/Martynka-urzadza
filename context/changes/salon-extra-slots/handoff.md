# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-research` step of autonomous run `2026-10-15-fix-s16bcd`: `research.md` answers every unknown of `change.md` with file + symbol anchors and measured art weights; nothing is implemented. The next agent must not get this wrong: two existing invariants in `tests/roomsData.test.ts` (non-decreasing costs, every piece inside the scene) contradict the author's data (costs 8–15 appended after 15; curtains at y −70) and must be changed deliberately, not worked around; `SALON_V3_TARGET` stays untouched and the save stays v3.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots`, cut from `main` at `a06795b` |
| Commits | 2 on top of main: `docs(salon-extra-slots): change identity (autonomous run)`, `docs(salon-extra-slots): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| Progress rows remaining | no `plan.md` yet |
| Working tree | clean after the commit (gitignored `designs/`, `.claude/`, `context/runs/` untouched; WebP measurements written only to `$TMPDIR/s16d-webp`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/research.md` | research: data model for the pre-purchase look, curtains above the scene, depth, art switch + measured sizes, live saves, `curtains` v2 key, miniature, minigame words, tests/specs to change, M-6 |
| `context/changes/salon-extra-slots/change.md` | frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-extra-slots` (observed) |
| `cwebp -q 85 -alpha_q 100 -m 6` on the 12 new PNGs + 2 architecture PNGs into `$TMPDIR` | new 12 files 261 428 B; architecture 170 408 → 165 426 B; room folder 1 233 242 → 1 489 688 B (observed) |
| `cmp` expansion-v1 vs salon-v2 | all 22 furniture PNGs, `furnishings-before.png`, `shadows.png` identical (observed) |
| re-encode `sofa-morska` from salon-v2 vs committed WebP | byte-identical: `cwebp` deterministic (observed) |
| Code gates (lint, typecheck, unit, build, e2e) | not run: research step, no product code changed. Baseline on main at a06795b (contract, inherited, unverified): unit 3063, e2e 117 |
| `metadata-guard.mjs mark-researched` | `changed: true` (observed) |

## 4. Next command

`/10x-plan salon-extra-slots`

## 5. Open

Choices for the plan (research.md "Open Questions"), with the research recommendation:
- Costs: (a) 8, 10, 12, 13, 15 (total 129, recommended) vs (b) all 15 (total 146); edit `tests/roomsData.test.ts` "has one furniture task per slot, whole costs of 5-15 stars that never fall" accordingly.
- Pre-purchase look: optional `SlotDef` field on `lamp-table`, `plant-left`, `pouf` + one pure helper in `src/core/rooms.ts` used by `RoomView.render` and `miniaturePieces`; `SALON.decor` keeps only `plant-right`; `pl.room.decor` loses the moved ids.
- Curtains y −70: clip `roomHit.holdPoint`'s scan to the scene (today it returns y ≈ −34 for curtains → off-canvas e2e target); relax "draws every piece inside the scene" in `tests/roomsData.test.ts` for a piece extending above the top.
- `ROOM_LAYOUT.depth.shadows` 4 → 2 so curtains (z 3) sit above the shadows (pack draw order).
- `balance.loader.totalMs` 45 000: boot queue grows to ≈ 2 329 739 B ≈ 46.6 s at 50 KB/s; raise (≤ 60 000 per `tests/loaderBalance.test.ts`) or accept, and rewrite the comment.
- `tests/roomArt.test.ts`: "has 26 entries" → 38; "weighs at most 1 400 000 bytes" → a budget ≥ 1 489 688.
- `scripts/make-task-art.mjs` `ROOM_JOBS`: source `SALON_V2`, add 12 ids; `EXPANSION` can go.
- E2E: `tests/e2e/salon-art.spec.ts` `health.total` 26 → 38; `room-change.spec.ts` FR-019 and `final-art-room-done.spec.ts` `finishSalon` grow to 12 purchases by data (120 s limits). Optional new seam `?e2eSave=done-salon` (new fixture, marker in `vite/e2eHookGuard.mjs`) and L-7 per-layer state in `RoomScene.snapshot`.
- Pins: `tests/legacySalonMigration.test.ts` explicit 7-of-12 prefix, M-R4 append-only task-id guard, `curtains` (v3 save keeps `chosen.curtains`; lifted v2 drops it).
- Visual-gate notes: an old done salon loses its shadows, mode button and teaser until task 12 (follows `roomDone`); "Wymień …" offers variant 0 = current look (S-17); pouf under the panel tray (VO1); curtains rectangle overlaps shelf/cabinet in the hold outline (VO3).
- Follow-ups to carry/re-trigger in the plan: texture atlas (boot load now ≈ 2.33 MB, past the "about 2.2 MB" trigger; out, needs a packer), F2, VO1–VO3, L-4, L-R8, L-R11, F1, M-6 second half (P-6), costs (S-17), `MINIGAME_WORDS` (unchanged; the `pl.room.slots` comment claiming they are the minigame words is stale).

No DESIGN-GAP added in this step.

## 6. Autonomous decisions

1. **Research done locally, no sub-agents** (skill default is 2–4 parallel workers): the scope was ~15 small files already named by `change.md`; reading them directly was cheaper and kept one source of truth. Would change: a wider unknown (e.g. a second room).
2. **Recommended cost ramp (a) 8, 10, 12, 13, 15** over flat 15: reads the author's "8–15" literally in the stated order; the non-decreasing rule is a S-09 agent choice, not an author rule. Would change: the author or the plan-review preferring the old invariant.
3. **Shelf label "Powieś półkę"** instead of the prompt's "Postaw półkę": the pack slot is a wall shelf ("Półka jest na ścianie okiennej"). Would change: the author's wording.
4. **Shadows depth 2 recommended** (pack README draw order) rather than leaving curtains under the shadows. Would change: the visual gate showing the shadows picture needs to cover the curtains.
5. **Atlas stays out** although the boot load passes ≈ 2.2 MB: it needs a packer and `ArtImage` changes; the loader degrades to stand-ins. Would change: a field report of slow first starts.
6. Clipboard/AskUserQuestion steps of the skill skipped (unattended run).
