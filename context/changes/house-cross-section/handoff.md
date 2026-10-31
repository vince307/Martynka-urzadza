# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-research` step of run 2026-10-31-house-cross-section. Research is complete and committed; no product
code changed. The next agent must not let a house visit survive the way back to the notebook: FR-039 holds today only
because `RoomScene` nulls `visiting` on every sleep and wake, and the new path may set it only from an explicit cell tap.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | 2 on the branch after this step: `docs(house-cross-section): change identity (autonomous run)`, `docs(house-cross-section): research` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-cross-section/research.md` | research: miniatures (capture vs live), scene hosting (new `HouseScene` vs `RoomScene` layer), cell geometry, house art + runtime loader, e2e hook, boot budget, open questions for the plan |
| `context/changes/house-cross-section/change.md` | frontmatter only: `status: new` → `preparing`, `updated` 2026-10-31 |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| `npx vitest run tests/bootBudget.test.ts` | 2 passed (salon and kitchen boot under 48 s) |
| source re-checks (grep) | scene list in `src/main.ts`; `visiting` reset in `RoomScene` `refresh`/`onSleep`; hardcoded `REGISTRY_KEYS.roomLoad`/`roomArtHealth` and two `once('complete')` sites in `src/ui/roomArtLoader.ts`; `SalonBackdrop.render` DynamicTexture at (0,0); `RESTORE_WEBGL` listeners in `TaskScene`/`WelcomeScene`; `inRoom()`/`screen` in `src/testing/e2eHook.ts` |
| lint / typecheck / full unit / build / e2e | not run: docs-only step (baseline on main 112f158 inherited, unverified) |

## 4. Next command

`/10x-plan house-cross-section`

## 5. Open

- Plan decisions (research.md "Open Questions"): hosting (new `HouseScene` + `scene.switch(SCENE_KEYS.room, { visit })`,
  recommended, vs a layer of `RoomScene`); miniature per cell as a 608×342 `DynamicTexture` capture like
  `SalonBackdrop.render` with the stand-in Graphics in the holder (recommended) vs live objects + `setCrop` (fires kitchen
  follow-up 10); parameterise `createRoomArtLoader` (`src/ui/roomArtLoader.ts`) vs a sibling — either fires kitchen
  follow-ups 3, 14, 15; house art health as an `artFallbacks` record (recommended) vs an `ArtTable` `'house'`; house
  narration (default none).
- Cell geometry: new data keyed by house id (manifest cells, `col` = `place`); closed cell = geometry cell with no
  `HouseRoomPlace`; no save field (stays v5).
- Tests that move: `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts` (wake/sleep reset → "a wake without data ends
  a visit"), `tests/layout.test.ts` (`ROOM_TOUCH_TARGETS.visitButton`), `tests/e2e/kitchen-room.spec.ts` visit test; hook
  `targets.visitButton` and `RoomScene.visitTarget` removed, `screen: 'house'` + house targets added.
- DESIGN-GAPs (rows after 182 in `docs/design-gaps.md`): those listed in `change.md` plus: the manifest's button band
  (y 1010-1080, 70 px) is below `MIN_TOUCH_TARGET` 96, so the house back button goes in a side margin outside the shell;
  house background (preview CSS gradient `#e7f4f4`→`#eef4e1`) needs tokens.
- Follow-ups firing: kitchen 1 (in scope), 6 (one `console.warn` on `redundant` in `trackStates`,
  `src/pwa/registerServiceWorker.ts`), 16 (guarded: house button under `blocked`); audit-art-renderer 2 is stale (close).

## 6. Autonomous decisions

- R1 — scope of the research taken from `change.md` § Open and the step prompt; no `AskUserQuestion`. Would change: nothing.
- R2 — recommend a new `HouseScene` over a `RoomScene` layer: the room's hold zone, panel and buttons sleep for free,
  `RoomScene` does not grow, and the existing sleep/wake resets keep FR-039. Rejected: the layer (more `blocked` branches,
  full-screen cover over a live room). Cost accepted: first scene-data hand-off in the repo. Would change: the plan finding
  Phaser's wake data unreliable in a test, or the house needing room state that only `RoomScene` holds.
- R3 — recommend per-cell DynamicTexture capture: the only renderer-neutral clip in the repo (Phaser 4 masks are WebGL
  filters; Canvas is supported). Rejected: live objects + `setCrop`. Would change: a Canvas run showing `dt.draw` of the
  Graphics/filtered images misbehaving.
- R4 — recommend no "Obrazki" line for runtime house art (artFallbacks record), consistent with kitchen follow-up 2.
  Would change: the maintainer wanting runtime art judged in "Obrazki".
- No scope.md decision overturned; no `[human]` row.
