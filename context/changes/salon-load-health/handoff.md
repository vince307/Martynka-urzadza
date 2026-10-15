# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by the `/10x-new` step. The change folder and `change.md` exist; nothing is researched, planned or built yet.
The one thing not to get wrong: this change bumps the save format to v3 (`MIGRATIONS[2]`, approved by the maintainer
2026-10-15), and the frozen fixtures `tests/fixtures/save-v1*.json` / `save-v2*.json` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 1 on the branch after this step (`docs(salon-load-health): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below changed) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/change.md` | Change identity: source (audit 2026-10-15_2010, PR #63: H-1, H-2, M-3 + M-2), the v2 → v3 migration stated explicitly, scope table, audit-claim verification table, v3-triggered follow-up table with scope takes, `## Autonomous decisions` |
| `context/changes/salon-load-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-load-health` |
| Audit claims vs repo (`grep` in `src/core/save.ts` `SAVE_VERSION`/`MIGRATIONS`, `src/core/rooms.ts` `remapLegacySalon`, `src/main.ts` `start`/`createGame`, `src/scenes/UIScene.ts` `summarize`, `src/scenes/BootScene.ts` `preload`, `node_modules/phaser/src/core/Config.js` `loaderTimeout`, `src/storage/idb.ts` `backup`, `vite/e2eHookGuard.mjs`) | every claim confirmed; two precisions recorded in `change.md` (import preview; M-3 also covers today's v1 → v2) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `7f831c5`: unit 2939, e2e 98 — inherited, unverified) |

## 4. Next command

`/10x-research salon-load-health`

## 5. Open

- `[human]` One-way door: a device that loaded the v3 build shows the `future` card after a rollback to a v2 build (accepted by the maintainer at Step 0). `deploy/README.md` § 6 gets a note; no other `deploy/` change.
- Research questions for the next step: where `MIGRATIONS[2]` reads `LEGACY_SALON`/`SALON` (import vs injected `migrations`); how `createAutosaver` copy logs (`'autosave: writing v2 without the v1 copy'`) and `pl.settings.saveMigrated` generalise from "v1" to `from`; how a stalled loader request can be forced in the hook build only (H-2 seam) and how Phaser reports `loader.timeout` (`loaderror` vs `onProcessError`) so `artHealth`/`roomArtHealth` count it; whether `markDirty` at start interacts with `slow`/`unavailable` and `replaceGate`; whether `MIGRATIONS[2]` can throw on raw data (`migration-failed` gate, follow-up F7/SRR-09/SRR-01).
- v3-triggered follow-ups and their scope takes: `change.md` table "Otwarte follow-upy z triggerem …" (re-triggered ones get new triggers in this change's `follow-ups/review-fixes.md` at review/archive).
- Audit findings out of scope (M-5, M-6, L-3..L-8, L-5r) → follow-ups with triggers, written by a later step.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (1–6): research before plan; `backup-v2` for every v2 → v3 migration; M-3 covers every `migratedFrom !== null`; migration's access to salon data left to the plan; L-1/L-2 ride along, M-1 closed by the copy, M-4 plan's call; the rest re-triggered. Each lists what would change the answer. Also: `/10x-new` would suggest `/10x-plan` by default — overridden by the step prompt (`/10x-research`); clipboard copy skipped (unattended).
