# Handoff — `autosave-versioned-save` (slice S-11)

Written by the `new` step (`/10x-new autosave-versioned-save`) of run 2026-10-13-s09-s11. The change folder and
`change.md` exist; nothing else. The next agent must not treat plan §5's `SaveState` as the v1 format literally: the
game holds more (`warmupPending`, `pendingUnlock`, nullable learner) — see change.md `## Roadmap claims vs repo now`.

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | 1 on the branch (`docs(autosave-versioned-save): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/change.md` | Change identity: roadmap claims vs repo now (10 rows), design binding (no kit view; DESIGN-GAPs from row 42), migration statement, 15 triggered follow-ups with scope, 8 autonomous decisions |
| `context/changes/autosave-versioned-save/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/autosave-versioned-save` |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline on main f67b9f4 per contract: unit 1079 passed, e2e 26 passed; inherited, unverified) |
| Repo facts in change.md | observed this step: `package.json` has no `idb-keyval`; `src/storage/` empty; `SaveState` in `src/core/types.ts` unused; `SessionLearner` in `src/core/placement.ts`; registry writers in `TaskScene.syncStars`/`finishRound`, `RoomScene.dispatch`, `UIScene`, `WelcomeScene`; `QUIET_REJECTIONS` in `src/core/errorSignal.ts`; kit has no save view |

## 4. Next command

`/10x-research autosave-versioned-save`

## 5. Open

- Migration (profile §4 sense): **none** — no database. Save-format migrations are in-app code in `src/core/save.ts`
  (mechanism + v1 identity + future-version / corrupt rejection; no real data migration because no build ever saved).
- Scope correction vs roadmap: the failed-load path offers a raw export of the untouched save in S-11 (FR-021);
  validated import, summary and reset stay in S-12 (change.md decision 4).
- Dependency to add: `idb-keyval` (not in `package.json`); `npm install` may need the sandbox disabled (network).
- Research questions: v1 shape vs plan §5, `rngSeed`, profile slot (plan §1), async load before `BootScene` (font
  promise follow-up), save-error handling vs `QUIET_REJECTIONS`, Safari eviction / `navigator.storage.persist()`,
  e2e of restart and of risk #10 (two builds) without writing IndexedDB, `?e2eStars` vs a loaded save.
- DESIGN-GAPs expected (rows from 42 in `docs/design-gaps.md`): failed-load card for the parent; new copy in
  `src/data/pl.ts` and a possible `pl.errorCard.body` change — teacher read required.
- Carried follow-ups not in scope: observability F4 (`WelcomeScene.openParent` guard), parent-settings F7
  (`pl.settings.empty`) — keep their triggers.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (1–8). In short: v1 = the state the game actually holds (nullable learner
with `warmupPending` and `pendingUnlock: { stage, step }`), one IndexedDB key with room for profiles, `rngSeed`
probably dropped (no consumer), failed or future-version load keeps the old save and shows a parent card with a raw
export, save errors are non-fatal, e2e through the product plus reload, next step research rather than the skill's
default `/10x-plan` (the run's step prompt fixes research). Each decision names what would change it.
