# Handoff — `autosave-versioned-save` (slice S-11)

Written by the `research` step (`/10x-research autosave-versioned-save`) of run 2026-10-13-s09-s11. Research is done;
no product code exists. The next agent must not plan a save that reaches the global error boundary: any unhandled IDB
rejection other than `AbortError`/`NotAllowedError` raises the restart card (`isFatalSignal`), so the save module
catches everything itself.

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | 2 on the branch after this step (`… change identity`, `docs(autosave-versioned-save): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/research.md` | Research: v1 shape vs plan §5, profile key layout, load at start, idb-keyval 6.3.0 API/bundling, unit/e2e test approach, SW update + rollback, lifecycle events with WebKit/Chrome sources, eviction/`persist()`, failure surfacing, raw-export path on iPad, open questions |
| `context/changes/autosave-versioned-save/change.md` | Identity (status now `preparing`) |
| `context/changes/autosave-versioned-save/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/autosave-versioned-save` |
| `npm view idb-keyval` (sub-agent, own npm cache) | latest 6.3.0 (2026-07-08); fake-indexeddb 6.2.5 |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed |
| Repo facts | observed this step: no `SaveState` consumer; `rngSeed` has no reader (all RNGs seeded from clock/`Math.random`); `buildId` reads `GITHUB_SHA` first; `src/storage/**` absent from the ESLint browser-globals block; `@playwright/test` 1.64.0; `vitest.config.mts` sets no environment |

## 4. Next command

`/10x-plan autosave-versioned-save`

## 5. Open

- Plan decisions (research recommends): v1 = explicit keys of the registry state (`stars`, `rooms`, `currentRoom`,
  `learner` nullable with `warmupPending` and `pendingUnlock` saved as `{ stage, step }`, `settings`), no `rngSeed`;
  key `profile:default` in `createStore('martynka', 'saves')`; `SaveStore` port + pure `core/save.ts` + core autosave
  scheduler with injected timers; `storage/idb.ts` the only `idb-keyval` importer (ESLint rule + lint-boundaries case).
- Triggers: debounce (number in `balance`) on `changedata-<key>` of the five keys; immediate flush in
  `RoomScene.dispatch` `bought` and at the end of `TaskScene.finishRound`; flush on `visibilitychange` hidden and on
  `pagehide`; `navigator.storage.persist()` once after the first save (plan §8 — missing from change.md).
- Failed load (corrupt / future version): autosave blocked for the session, parent card with raw export via
  `navigator.share` (text/plain `.txt`) and blob-download fallback; whether the child may continue session-only is a
  product decision (recommendation: yes, behind the adult gate). IDB unavailable → session-only, no card.
- Risk #10 two-build e2e needs one port serving two builds (IDB is per origin); recommend deferring with a trigger
  (first v2 format or test-plan phase 4) unless the plan budgets a small static server.
- `[human]` device rows: export on iPad home-screen app and Android; restart after kill on iPad.
- DESIGN-GAPs from row 42 and teacher read: failed-load card copy, possible `pl.errorCard.body` change.
- Carried, not in scope: observability F4, parent-settings F7.

## 6. Autonomous decisions

- Question and scope taken from change.md (unknowns row, handoff §5) and the run prompt's extras; no interview.
- Two parallel web/registry sub-agents (lifecycle + eviction + export; idb-keyval + testing); code mapped locally.
- change.md decisions 1, 3, 5, 6, 7 confirmed by evidence; decision 2 refined (per-profile key, not an envelope of
  profiles — no device migration when profiles arrive); decision 4 refined (share-first export on iPad, blob download
  is broken in home-screen apps per WebKit 209407/231892/290847/275288). What would change them is listed in
  research.md (Open Questions).
