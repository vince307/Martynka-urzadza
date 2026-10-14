# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-implement` phase 3 step of run `2026-10-14-fix-art-stand-in`. Phase 3 is committed (see §1); its e2e row 3.4 and phase 2's gate were e2e-checked by the orchestrator (2.4 ticked from the orchestrator note, 46 passed on 279989d).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + `3be41c7` (p1) + `b459bc8` (p2) + p3 `d3fa403` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 1.5, 2.5, 3.5 `[reviewer]`, 3.4 e2e (orchestrator), phases 4-9 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/taskArt.ts` | `TaskArtEntry.id` (measures.ts id) |
| `src/data/layout.ts` | `REGISTRY_KEYS.artHealth`, `REGISTRY_KEYS.forcedArt` (neither in `SAVE_KEYS`) |
| `src/scenes/BootScene.ts` | `create` stores `artHealth(TASK_ART, textures.exists)` and warns once; `loaderror` log distinguishes font from art; `?e2eArt` seam in `preload` under `__E2E_HOOK__` (`missing` queues nothing, `corrupt` points `tasks/money/*` at the font file) |
| `src/scenes/TaskScene.ts` | `freshRound` passes `missingIds` to `buildAdaptiveRound` (`art`) and `buildWarmup` (`blocked`); the e2e `forcedSkills` branch is untouched, so it bypasses the filter |
| `src/testing/e2eHook.ts`, `src/main.ts` | `e2eArt(search)` reader, registry hand-off, `snapshot.artHealth = { total, missing }` |
| `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts` | marker `e2eArt`; explicit cases (production chunk with `e2eArt=missing|corrupt` fails; e2e build without the marker fails) |
| `tests/taskArt.test.ts` | `id` test |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK |
| `npm test` | 1891 passed (branch baseline 1886, delta +5: 1 `id` test, 2 `e2eArt` leak cases, 1 dropped-marker case, 1 from the marker `it.each`) |
| deploy and ops shell tests, `sample` E1-E6 | OK (no content change) |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `E2E_HOOK=1` build: `present`, `e2eArt` in the chunk |
| Deliberate break | `e2eArt(window.location.search)` in `main.ts` outside `__E2E_HOOK__`: build failed `e2e hook leaked ... (e2eArt in _app/index-....js)`; restored. Meta-check: the guard names the production chunk, not the source |
| `npx playwright test ... art-tasks` | e2e: not runnable in this session - orchestrator gate (Chromium MachPortRendezvous Permission denied); row 3.4 left unticked |

## 4. Next command

`/10x-implement art-stand-in-and-load-signal phase 4`

## 5. Open

- Row 3.4: full e2e `baseline + 0` (46) for the orchestrator; 3.5 `[reviewer]`.
- `artHealth` snapshot field and `?e2eArt` are used by the e2e phases 8-9; the panel line is phase 4.
- Not verified in a browser: the `corrupt` seam (decode failure) really leaves the coin textures absent; `artHealth` uses `textures.exists`, so the record is right either way, but phase 8 should confirm `missing > 0`.

## 6. Autonomous decisions

1. **Seam value stored under `REGISTRY_KEYS.forcedArt`** (`'forcedArt'`, not an e2e marker), like `forcedSkills`. Would change: the name becoming a marker.
2. **`corrupt` affects only `tasks/money/*`** (15 keys) with the font file as URL. Would change: a phase 8 need for other kinds.
3. **Warm-up passes `blocked` only when something is missing**, so the rng use stays identical to before when nothing is missing.
4. **Phase driver unchanged** (`impl`).
