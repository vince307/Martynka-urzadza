# Handoff — `salon-extra-slots` (slice S-16d)

Written by the phase 4 `/10x-tdd` step of autonomous run `2026-10-15-fix-s16bcd`: phases 1-4 are implemented (phase 4 = `roomArtCheck` in the deploy smoke). The next agent must not get this wrong: phase order is load-bearing (phase 1 `holdPoint` clip and phase 2 render wiring before phase 3 adds the curtains and moves the decor), and `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` |
| Commits | p1 4ac1460, p2 12202f6, p3 0bc3fec, p4 `test(salon-extra-slots): deploy smoke counts the room art (p4)` 57d34c6, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows | phases 1-2 e2e rows 1.4, 2.2 ticked (orchestrator note: 117 passed after 12202f6); 3.1-3.5 ticked (3.5 from the orchestrator note: 117 passed); 3.6 ([reviewer]), 3.7 ([visual]) open; phase 4: 4.1-4.3 ticked, 4.4 ([reviewer]) open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `scripts/deploy-check/parse.ts` | `roomArtCheck(precache, expectedUrls)`: ok when every URL is precached (leading `/` ignored) and the list is not empty; detail `N of M room pictures precached` + first missing |
| `scripts/check-deploy.ts` | passes `ROOM_ART` urls, GETs `/assets/rooms/salon/architecture-after.webp` (200, `image/webp`) |
| `tests/deployCheck.test.ts` | two new tests (missing named, leading slash, empty list) |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | clean |
| Unit | 3076 passed = branch baseline 3074 + 2 |
| RED | against a stub returning ok: `expected '' to contain '2 of 2'` and `expected true to be false` |
| Deliberate break | `ok: true` always -> 2 red (`expected true to be false`); restored. Meta-check: proves the comparison, not production (the Deploy job proves that) |
| deploy scripts, `sample` E1-E6, build | pass; `e2e hook: absent (2 chunks checked)` |
| Local run | `node --import tsx scripts/check-deploy.ts http://localhost:4399` on `vite preview`: room checks ok (38 of 38; architecture-after 200 image/webp); only the three immutable cache-control checks fail, as expected without Caddy. Server killed. Production never contacted |
| e2e | 117 passed (`--workers=4`, ran in this session, plain command), = branch baseline 117 + 0 |

## 4. Next command

`/10x-implement salon-extra-slots phase 5` (phase 5, `Driver: impl`)

## 5. Open

- Rows 3.6, 3.7, 4.4, 1.5, 2.4 ([reviewer]/[visual]) open. Human decisions and phase 5 follow-ups unchanged from the plan.

## 6. Autonomous decisions

1. `EXPANSION` constant removed from `scripts/make-task-art.mjs` (no job reads expansion-v1 any more; the existence check covers KIT and SALON_V2). Would change: a later job needing expansion-v1.
2. `plant-right` was the only decor, so its caption stays in `pl.room.decor`; the stale "minigame words" comment on `pl.room.slots` was replaced.
3. In the "inside the scene" test the curtains exception is by id `curtains` with the half-height rule. Would change: a second room with a piece above the scene.
4. Earlier decisions of p1/p2 unchanged.
5. Phase 4: the plan's `main` wiring is in `check-deploy.ts`; rooms URLs are relative (`assets/...`) in `ROOM_ART`, handled by stripping a leading slash on both sides. Empty expected list fails (guards a broken import).
