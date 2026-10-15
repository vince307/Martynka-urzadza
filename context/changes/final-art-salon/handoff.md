# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-research` step: `research.md` answers the change's unknowns (stage task, v2 remap, import/export,
done card, art weight, Phaser 4 loading/hit-test, design sources). Nothing is implemented. The next agent must not get
wrong: `furnishings-before` and `shadows` are single whole-room layers that cannot be split per slot, and the import
preview (`parseImport` → `saveSummary`) sees the raw, unremapped save — the remap must run there too.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | 2 on the branch after this step's commit (`docs(final-art-salon): change identity (autonomous run)`, `docs(final-art-salon): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only files of this step staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-art-salon/research.md` | Research: summary (10 findings), detailed findings per area, measured WebP table, code references, 7 open choices with recommendations for `/10x-plan` |
| `context/changes/final-art-salon/change.md` | Frontmatter only: `status` new → preparing, `updated` 2026-10-15 |
| `context/changes/final-art-salon/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-art-salon` |
| WebP measurement (scratchpad script `measure.mjs`, `cwebp -q 85 -alpha_q 100 -m 6`, output only in the session scratchpad, nothing in `public/`) | 26 salon files: 1 233 242 B full size, 475 260 B half, 973 520 B at q 75 |
| Alpha analysis (python PIL, read-only on `designs/`) | `furnishings-before` bbox (0,22,1864,1080), alpha inside every slot/layer canvas; `shadows` bbox (144,433,1881,999), 129 493 of 157 536 pixels inside the rug canvas |
| `du` of `dist/` (stale build, not rebuilt) | 2 416 KB; `public/assets` 496 KB |
| Phaser 4.2.1 sources (`node_modules/phaser/src`) + context7 | preload renders, `progress` event, `getPixelAlpha`, `DynamicTexture.render()`, `__MISSING` confirmed |
| lint / typecheck / tests / build / e2e | not run: research step, no code changed (baseline on main `334ff69` per contract, inherited, unverified here) |

## 4. Next command

`/10x-plan final-art-salon`

## 5. Open

- Plan choices (research `## Open Questions`): remap rule A (refund) vs B (round up, no star change — recommended);
  empty-slot look / when `furnishings-before` and `shadows` show; full-bleed scene vs `ROOM_LAYOUT.area`; hit-test
  with injected alpha predicate; thumbnails and room-list miniature from scaled Images; new `MINIGAME_WORDS`
  (`src/data/minigames.ts`) — no new caption has Ó/Ł, `tests/wordRound.test.ts` asserts one; cost curve over 7 tasks.
- Tests to rewrite: `tests/roomsData.test.ts`, `tests/roomHit.test.ts`, `tests/wordRound.test.ts`; e2e
  `tests/e2e/room-purchase.spec.ts`, `tests/e2e/room-change.spec.ts`, `tests/e2e/save-restart.spec.ts` (`chosen.floor`).
- `TaskScene.shake` is not guarded by `prefersReducedMotion` (NFR "ogranicz ruch"); cheap fix, plan decides.
- `pl.settings.artOk`/`artMissing` speak of task pictures only; counting room art needs new copy.
- DESIGN-GAP candidates (rows from 105): loading screen (brief P2.2), empty-slot look and per-slot shadows, salon
  miniature (P2.3), before → after transition (P3.6); closures of rows 22, 32–35.
- Out-of-scope follow-ups get new triggers at archive (list in `change.md` `## Triggered follow-ups`).

## 6. Autonomous decisions

1. Scope derived from `change.md` and the step prompt (no question asked). Chosen: the research questions in the previous
   handoff §5 plus the step prompt's list. Would change: nothing — the step fixes the scope.
2. Three parallel workers (room logic/save, rendering/art pipeline, Phaser 4 docs) plus local measurements. Would
   change: nothing material; all three returned.
3. Recommended remap rule B (round up, no refund) over change.md decision 3 (A, refund). Why: `src/core/stars.ts`
   states the balance only grows by what a round earned, and B keeps that while losing no value. Would change: the
   maintainer preferring exact value with a refund, or a cost curve where rounding up gifts more than one cheap task.
4. Recommended full resolution WebP (1,23 MB) over half (0,48 MB). Why: the scene is drawn 1:1 in the 1920×1080 game
   space and a retina tablet shows ≈ 2048 device px; precache stays far under limits. Would change: a precache or
   memory budget set by the maintainer, or a visual gate showing no difference at half size.
5. Corrected the Phaser worker's GPU estimate (≈ 250 MB assumed 30 full-screen textures) to ≈ 59 MB from the manifest
   sizes. Would change: trimming shadows or loading only one background at a time.
