# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-plan-review` step of run `2026-10-16-audit-sweep` (slice 3 of 3). The plan is reviewed (PROCEED,
3 warnings fixed in plan.md) and no code has changed yet. Do not get wrong: `src/core` never imports `src/data/pl.ts`
(builders return line keys), `registration.update()` runs once per launch only, and an `xhrLoader.status` 0 is the
`network` cause, never "not on the server".

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | 4 (`af4ddec` identity, `58b6ea7` research, `edebf8e` plan, + this plan-review commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 71 (`grep -c '^- \[ \]' plan.md`), unchanged by the review |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/health-lines-and-smoke/reviews/plan-review.md` | review report: 0 critical, 3 warnings (fixed), 4 observations; the four production risks (a)–(d) checked with evidence |
| `context/changes/health-lines-and-smoke/plan.md` | F1: per-HEAD `AbortSignal.timeout(HEAD_TIMEOUT_MS)` in Critical Implementation Details + Phase 1; F2: `ArtCause` `network` (status 0) with its own copy in Phases 3, 5, 6, 13; F3: decode-seam guards in Critical Implementation Details + Phase 9 tests; F4/F5 in `## Known risks` |
| `context/changes/health-lines-and-smoke/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/health-lines-and-smoke/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/health-lines-and-smoke` |
| script over `TASK_ART`, `UI_ART`, `ROOM_ART`, `SOUNDS` urls vs `public/` | `110 missing []` — `precacheCovers` cannot go red on today's build |
| `grep -n timeout-minutes .github/workflows/deploy.yml` | none — basis of F1 |
| `node_modules/phaser/src/loader/filetypes/AudioFile.js` `onProcess`; `LoaderPlugin.js` `addFile` / `nextFile`; `File.js` `onProcessError`; `FontFile.js` | seam real; decode failure has no `loaderror`; font 404 → `onProcessComplete`, face not added to `document.fonts` |
| `grep` in `src/` for `url(`, `new Image`, `.src =`, `fetch(` | empty — no lazy fetch of a hashed file after a takeover |
| `tests/phaserLoaderPin.test.ts` | pins `version` 4.2.1 + source text (read, not run) |
| Progress rows | 71, unchanged; Progress↔Phase 1:1 |
| Gate (lint, typecheck, tests, build, e2e) | not run: docs only, no code changed |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 1`

## 5. Open

- [human] rows: 2.6 (launch-only `update()`), 4.6 (optional throttled Android cold start), 8.6 (real iPad,
  `soundBlocked` after 3 touches), 11.8 (wording of gaps 139–150, now including the `network` cause line in gap 141).
- [reviewer] (CI at ship) rows 1.7 and 11.7.
- DESIGN-GAP rows 139–150 added in phases 2, 5, 6, 7, 8, 10; notes on gaps 66, 67, 114, 119, 120.
- Follow-ups written in phase 11 (`follow-ups/review-fixes.md`): list in plan § What We're NOT Doing.
- Known risks added by review: wall-clock boot limits run while hidden (`BootScene` timers, F4); offline launch warns
  `Service worker update check failed` (`registerServiceWorker`, F5).
- Phase 1 local proof: against `vite preview`, `isLocalHost` skips the immutable check; a missing file there is 200
  `text/html`, caught by the type assertion.
- Known e2e load flakes: `money-pay` #11, `final-art-loading` #15, `child-flow-guards` #2.

## 6. Autonomous decisions

1. **Triage done in place** (contract rule 1): all three warnings fixed in plan.md, observations recorded. Would
   change: nothing.
2. **F1 timeout 15 s per HEAD, not a workflow `timeout-minutes`.** Rejected: editing `.github/workflows/deploy.yml`
   (out of scope by the plan). Would change: a maintainer change to the workflow.
3. **F2 new `network` cause rather than rewording `fetch`.** Why: restart advice and copy differ for 404 vs timeout.
   Would change: Phaser exposing a distinct timeout event.
4. **(b) no change to plan decision 2.** Evidence: no lazy hashed fetches, unhashed sound/font URLs in both precaches.
   Would change: a lazy chunk or a CSS `url()` to an `_app/` file appearing in `src/`.
5. **No phase split/merge**; drivers kept as written. Would change: a phase agent hitting the context limit.
