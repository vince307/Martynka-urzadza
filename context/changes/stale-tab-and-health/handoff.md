# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-new` step of run `2026-10-16-fix-stale-tab-health`. The change folder exists with `change.md` (status `new`): source, audit-claim corrections, bound views/copy keys, migration take, triggered follow-ups and ride-along decisions. The next agent must not get wrong: B-1 has two layers (same-build tabs vs an already-running OLDER build of the same format); only a format bump reaches the second, so research must settle v3-runtime-guard vs v4 before the plan, and a v4 bump is a maintainer-level decision (audit § 6).

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | 1 on this branch: `docs(stale-tab-and-health): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/change.md` | change identity: source (audit 2026-10-16_0915, PR #73: B-1, G-1, S-1, P-1), audit claim / repo now / correction table, bound views and `pl.settings.*` keys, save-format take, triggered follow-ups, ride-along decisions, `## Autonomous decisions` |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/stale-tab-and-health` |
| `git show origin/docs/observability-audit-2026-10-15-fix-s16bcd:context/audits/observability/2026-10-16_0915-start-dzwieki-grafika-salon.md` | read (301 lines) |
| Claim checks (grep/read of `src/core/save.ts` `storedVersionNewer`, `src/storage/idb.ts` `guardedPut`, `src/scenes/BootScene.ts` `create`/`preload`, `src/scenes/UIScene.ts` `openSettings`, `src/ui/sound.ts` `playMusic`/`startMusic`, `src/pwa/registerServiceWorker.ts`, `src/pwa/installHint.ts` `mountInstallHint`, `vite/config.shared.mjs`) | all four HIGH findings confirmed; corrections recorded in change.md |
| Precache size (node script over local `dist/sw.js`, built after 9a64fd6, not rebuilt here) | 121 entries, 5.33 MiB |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main 9a64fd6 per contract: unit 3076, e2e 121) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-research stale-tab-and-health`

## 5. Open

- **Save format (B-1)**: take = probably v4 (a version bump is the only thing an already-running build from #69 on checks; a write generation counter in the record would also cover same-build tabs). Alternative without format change: `BroadcastChannel`/`navigator.locks` single-writer + `controllerchange` stale signal (covers this build on only). Research compares; plan decides; if v4, the ship step should stop at an open PR (profile § 5 does not cover a format bump explicitly). If v4: `MIGRATIONS[3]`, `backup-v3` policy (mind P-8), frozen v3 fixtures, `deploy/README.md` rollback note.
- **P-1 precision**: a failed precache does not reject `register()`; research must find the install-failure signal (`updatefound` → `statechange` `redundant`, or workbox-window) and where the parent sees it (new DESIGN-GAP).
- **G-1 constraint**: the new `UI_ART` record must not feed `src/core/round/artFilter.ts`.
- **DESIGN-GAPs expected** (none added yet; next free row 116 in `docs/design-gaps.md`): UI-art line in "Obrazki", music status lines in "Dźwięki", same-format/stale-tab line in "Zapis gry" (and a child card if B-2 joins), offline/install status line.
- **Candidates for research**: B-2 (child card on refusal), S-8 (`soundHealth` unknown after the `catch` in `BootScene.create`), S-6 (`UIScene.applySettings` drops the pref write result).
- **Follow-ups fired** (listed with takes in `change.md` § "Open follow-ups"): two tabs `BroadcastChannel` (in), P-6 SW registration (in, = P-1), UI art set decision 8 (in, = G-1), music `loading` while locked (in, via S-3), L-6/L-8 art section (light), F4 `beforeinstallprompt` in `mountInstallHint` (light), installHint tap-through (already done, close it), B-2 card / `future` vs `newer` order / P-8 / two-build e2e (only if v4 or B-2 joins). This change's own `follow-ups/review-fixes.md` does not exist yet; the plan/impl-review creates it and re-triggers everything left out.

## 6. Autonomous decisions

- **Next step `/10x-research`** instead of the skill's default `/10x-plan`: fixed by the step prompt; the change crosses IndexedDB transactions, the SW lifecycle, the Phaser sound unlock and maybe a format bump. Would change: nothing in this run.
- **Scope = B-1, G-1, S-1, P-1 + B-8, S-3, S-11, light F4 and L-6/L-8**; B-2, S-8, S-6 candidates; P-2..P-6, G-2..G-7, S-2/S-4/S-5/S-7/S-9/S-10, B-3..B-7 out. Why: neighbours ride only where the HIGH fix edits the same symbol or cannot be honest without them. Rejected: audit § 6 items 1-4 in full (smoke work is `scripts/`, too wide). Would change: research proving a candidate necessary, or phase budget pressure (drop the light items).
- **No v3/v4 decision taken**, only a recorded take. Rejected: committing to v3 now (the old-build case would stay open by construction) or to v4 now (maintainer-level, audit § 6). Would change: an explicit maintainer statement for this run.
- **Title in English, commit in Polish** (profile § 1, worked examples). Would change: a maintainer rule for Polish titles.
- **Roadmap untouched**: non-roadmap change, no matching row. Would change: the maintainer adding a roadmap row for audit fixes.
