# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 2 (commit `d4f4470`): 38 WebP drawings in `public/assets/tasks/`, the texture table, loading in `BootScene`, `ArtImage` with a stand-in. The seed's offline assertion and its break are written but not proven (no Chromium); the orchestrator runs them from `e2e-request-p2.md`. Phase 3 is next.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (phase 1), `d4f4470` (phase 2 code), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5 reviewer; 2.5, 2.6, 2.7 orchestrator e2e; 2.8 reviewer; 2.9 human) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `scripts/make-task-art.mjs`, `package.json` `art` | kit PNG to WebP with `cwebp -resize W H -q 85 -alpha_q 100 -m 6`; fails clearly without `designs/` or `cwebp` |
| `public/assets/tasks/{money,measuring,icons}/*.webp` | 15 + 11 + 12 files, 442 KB |
| `src/data/taskArt.ts` | `TASK_ART` (key, url, size) built from `measures.ts` ids, `ART_KEYS` key helpers |
| `src/scenes/BootScene.ts` | loads `TASK_ART`; `loaderror` is a `console.warn` |
| `src/ui/widgets/ArtImage.ts`, `layout.ts` (`ART_STAND_IN`, font role `artLabel`) | one reusable image fitted into a rect, stand-in box with the id when the texture is missing, `state()` for the phase 5 hook `art` |
| `tests/taskArt.test.ts` | table vs files (WebP header size), no stray files, ids covered, under 1 MB |
| `e2e-request-p2.md`, `e2e-seed-p2.patch`, `e2e-break-p2.patch` | seed assertion (`requestfailed` and every `TASK_ART` url in `servedBySw`) and the one-file `globIgnores` break |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1515 passed (branch baseline 1510, +5) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` … `E6` | exit 0 each (observed) |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` has 38 `assets/tasks/` entries (observed) |
| `npm run art` twice | `shasum` of all 38 files identical (observed) |
| Deliberate breaks | `balance-scale` width 512 to 500 in `TASK_ART` -> `AssertionError: ... expected { width: 512, height: 384 } to deeply equal { width: 500, height: 384 }`; `icons/key.webp` moved away -> `ENOENT` plus the stray/missing list test red; restored, 5 green. Meta-check: the test reads WebP headers and the directory from disk, not the table against itself |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`, 1 plain try). Orchestrator: `e2e-request-p2.md` (green run, expect 42 + 0; break patch expects seed red on `note-500zl.webp`) |

## 4. Next command

`/10x-tdd art-tasks-all-stages phase 3` (phase 3, Driver: tdd)

## 5. Open

- Rows 2.5, 2.6, 2.7: e2e by the orchestrator per `e2e-request-p2.md`; if green, commit the seed change as described there.
- `[reviewer]` 1.5, 2.8; `[human]` 2.9.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. The seed.spec.ts change is NOT committed (plan: no commit without the orchestrator's result); it lives as `e2e-seed-p2.patch`. Would change: a Chromium-capable session.
2. `cwebp` could read `designs/` and write `public/assets/` inside the sandbox; no unsandboxed command was used.
3. `ArtImage` has no unit test (Phaser object); its table-size logic is covered indirectly by `taskArt.test.ts`, its behaviour by the phase 5 hook `art` and the e2e of phase 10.
4. `ART_KEYS` helpers added next to `TASK_ART` so widgets never concatenate keys by hand.
5. Stand-in label is the id tail (technical, not player text); font role `artLabel` 24 px added with a comment.
