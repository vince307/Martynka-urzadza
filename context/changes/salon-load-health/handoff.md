# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by the `/10x-research` step. Research is complete (`research.md`); nothing is planned or built yet.
The one thing not to get wrong: `MIGRATIONS[2]` must be a pure function of the v2 bytes, so it uses FROZEN salon tables
(old list + a snapshot of today's v3 target list), not the live `SALON` (which may grow at its end) — and the
`?e2eSave=legacy-salon` seam must become a frozen v2 JSON fixture, because `encodeSave` will write v3.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 2 on the branch after this step (`docs(salon-load-health): change identity (autonomous run)`, `docs(salon-load-health): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below changed) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/research.md` | Source-backed answers: migration data placement, import/export/gates on v3, backup key generalisation, M-3 at start, Phaser 4.2.1 loader timeout semantics, e2e seams |
| `context/changes/salon-load-health/change.md` | Frontmatter only: status `new` → `preparing`, `updated` 2026-10-15 |
| `context/changes/salon-load-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-load-health` |
| Source reads (`src/core/save.ts`, `autosave.ts`, `saveFile.ts`, `saveHealth.ts`, `rooms.ts`, `src/data/rooms.ts`, `src/main.ts`, `src/scenes/UIScene.ts` `openImport`, `src/storage/idb.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `playwright.config.ts`) | findings in `research.md` |
| Phaser source check (`node_modules/phaser/src/core/Config.js` `loaderTimeout`/`loaderMaxRetries`/`loaderImageLoadType`, `loader/XHRLoader.js` `ontimeout`, `loader/File.js` `onError`) | confirmed: timeout default 0, maxRetries default 2, XHR image path, timeout → retry → `loaderror` → loader completes |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `7f831c5`: unit 2939, e2e 98 — inherited, unverified) |

## 4. Next command

`/10x-plan salon-load-health`

## 5. Open

- `[human]` One-way door: a device that loaded the v3 build shows the `future` card after a rollback to a v2 build (accepted by the maintainer at Step 0). `deploy/README.md` § 6 gets a note; no other `deploy/` change.
- Plan choices (research `## Open Questions`): loader `timeout`/`maxRetries` values in `src/data/balance.ts` (worst case (maxRetries+1) × timeout per file; largest file 289 KB); whether `WriteReason` gains a start/migration value; whether `repairCurrentRoom` `repairedFrom` also marks dirty; whether `LEGACY_SALON` moves into core or stays in `src/data/rooms.ts` with an equality test.
- `MIGRATIONS[2]` must be total on raw data (malformed `rooms`/`chosen` pass through to `corrupt`); a test proves it, else follow-up F7/SRR-09/SRR-01 (`replaceGate` and `migration-failed`) fires.
- Tests that change with v3 (fixtures stay byte-identical): `tests/save.test.ts` "the current version is 2" and the v2 fixtures' "encode back to themselves"; e2e `writtenVersion` 2 in `tests/e2e/save-backup-health.spec.ts` and `tests/e2e/salon-art.spec.ts`; `tests/e2e/save-migration.spec.ts` titles.
- H-2 e2e needs `serviceWorkers: 'block'` + a never-fulfilled `page.route` on one file + a hook-only seam shortening the loader limit (the SW runs in the hook build and precaches WebP); add the spec to `playwright.config.ts` `ROUND_SPEC`. WebKit behaviour unproven (Chromium only).
- Strings to generalise from "v1"/"v2": `createAutosaver` `skipBackup` log, `AutosaveStatus.backup` comment, `balance.save` comment, `pl.ts` DESIGN-GAP 95 comment.
- v3-triggered follow-ups and audit findings out of scope: unchanged from `change.md` (tables and `## Autonomous decisions` 1–6).

## 6. Autonomous decisions

1. **Recommended migration data: frozen tables in `src/core`, complete by default.** Chosen over (B) `save.ts` importing `src/data/rooms.ts` (breaks the "no data imports" header and drifts as `SALON.tasks` grows; old total cost 96 > new 71, so a fully-done old salon would gain tasks) and (C) injection through `decodeSave(raw, migrations)` (four call sites: `loadSave`, `parseImport`, `deviceSaveView`, `importProblem`; a missed one reads v2 as `unknown-version`). What would change it: a lint rule or maintainer rule against content-like tables in core, or a decision that the remap target should follow future salon tasks.
2. **Backup: no new key logic.** `backup(raw, from)` with `from` = original version gives `backup-v2` for v2 and a single `backup-v1` (raw v1) for a v1 save chained v1 → v2 → v3. What would change it: a requirement to also keep the intermediate v2 shape.
3. **M-3 confirmed with no conflict** with the slow/unavailable cards or `replaceGate` (blocked saver only counts `skipped`; `replace` awaits `inflight`). What would change it: a plan that writes synchronously at start instead of `markDirty` (then the slow-card ordering must be re-checked).
4. **H-2 e2e approach:** Playwright route + SW block for the stall, hook-only seam for a short limit, rather than a server middleware (none exists; adding one is new infra). What would change it: the orchestrator's request-file protocol forbidding `page.route`, or a WebKit project being added.
5. Research ran locally plus one read-only subagent (Phaser loader + e2e seam); its key claims were re-checked in `node_modules/phaser/src` and `src/testing/e2eHook.ts`.
