# Handoff — `autosave-versioned-save` (slice S-11)

Written by the `plan-review` step (`/10x-plan-review autosave-versioned-save`) of run 2026-10-13-s09-s11. Verdict
PROCEED; 1 critical + 2 warnings fixed in plan.md (no product code yet). The next agent must not let any write happen
when the load was not `fresh`/`loaded`, and must listen to registry `setdata` as well as `changedata` (filtered by
`SAVE_KEYS`): the welcome's first `learner` set is a `setdata`.

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | 4 on the branch after this step (`… change identity`, `… research`, `… plan`, `docs(autosave-versioned-save): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 39 (`grep -c '^- \[ \]' plan.md`), none done |
| Roadmap | S-11 `planning` (unchanged by this step) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/reviews/plan-review.md` | Review report: 1 critical, 2 warnings, 3 observations, all triaged; `VERDICT: PROCEED` |
| `context/changes/autosave-versioned-save/plan.md` | Fixes: F1 `setdata`+`changedata` listeners on `SAVE_KEYS` (Key Discoveries, Critical Implementation Details, phase 4 §1, phase 7 test 3); F2 `--save-exact` (phase 3, row 3.1); F3 flush after `finishWarmup` (phase 4 §2); F4/F5 Known risks; F5 follow-up in phase 6 |
| `context/changes/autosave-versioned-save/change.md` | Status `plan_reviewed` |
| `context/changes/autosave-versioned-save/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/autosave-versioned-save` |
| `node_modules/phaser/src/data/DataManager.js` `setValue` | new key emits only `setdata`; existing key emits `changedata` + `changedata-<key>` (basis of F1) |
| `grep registry.set src/scenes` | `WelcomeScene.start` is the first `set` of `learner`; `preBoot` (`src/main.ts`) never sets it |
| `npm view idb-keyval@6.3.0 version`, `npm view fake-indexeddb@6.2.5 version` | `6.3.0`, `6.2.5` (both exist) |
| `package.json` | existing deps use `^` (`phaser`), hence F2 |
| `grep -c '^- \[ \]' plan.md` | 39 (unchanged; Progress↔Phase consistent, every phase has `Driver:`) |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step; baseline on the branch = contract line (main f67b9f4: unit 1079, e2e 26) |

## 4. Next command

`/10x-tdd autosave-versioned-save` (phase 1, `Driver: tdd`)

## 5. Open

- Manual rows (human checklist): 4.6 [human] iPad/Android restart, kill, silent update keep state; 5.5 [reviewer] teacher
  read `pl.saveFailed`; 5.6 [visual] card, gate over card, welcome after „Graj dalej” at 1440×900 and 1024×768; 5.7 [human]
  export on iPad home-screen app and Android; 5.8 [human] `?e2eSave` seam; 6.5 [reviewer] seam sweep; 6.6 [human] v1
  deviates from plan §5; 6.7 [human] card gating (against research recommendation); 6.8 [human] two-build e2e (#10)
  deferred to v2; 6.9 [human] `pl.errorCard.body` unchanged, fatal error blocks autosave.
- DESIGN-GAPs planned: rows 42 (failed-load card), 43 (save invisible to the child), 44 (export as `.txt`, share first).
- E2E protocol: phase 4 writes `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch`; phase 7 writes
  `e2e-request-s11-p7.md` + `e2e-break-s11-p7a/c/d.patch`.
- Phase 3 needs network: `npm_config_cache="$TMPDIR/npm-cache" npm install --save-exact idb-keyval@6.3.0` and `… install
  --save-exact -D fake-indexeddb@6.2.5` with `allowed_domains: ["registry.npmjs.org"]`.
- Carried follow-ups (unchanged triggers): observability F3 (`installErrorBoundary` `signalOfRejection`), F4
  (`WelcomeScene.openParent`), parent-settings F7 (`pl.settings.empty`).
- New Known risks from the review (plan.md `## Known risks`): v1 validation never tightens without a migration (F4);
  two same-origin instances, last writer wins (F5, follow-up in phase 6 with the v2 trigger).


## 6. Autonomous decisions

- Triage done in place (no AskUserQuestion): F1 fixed with the single recommended fix (generic `changedata` + `setdata`
  filtered by `SAVE_KEYS`) — rejected alternative: `preBoot` always sets `learner: null`, because scenes cast it as
  `SessionLearner | undefined` and a `null` would reach them; would change if Phaser adds per-key `setdata-<key>` events.
- F1 test 3 assertion: poll `skipped + writes ≥ 1`, then `writes === 0` and `skipped ≥ 1`, so break C reds on `writes`
  rather than on a timeout; would change if the autosaver stops counting skipped attempts.
- F2 `--save-exact` against the repo's caret style: the storage library of a one-way format must not drift; would change
  if the maintainer prefers carets with lockfile-only pinning.
- F4/F5 recorded as Known risks instead of new phases (no change to v1 scope); F6 accepted (settings share the
  `SAVE_KEYS` path proven by tests 1–2).
- Product decisions in plan.md `## Autonomous decisions` 1–14 checked against PRD FR-020/FR-021/US-04: none clearly
  wrong; each PRD/plan deviation already has a `[human]` row (6.6–6.9, 5.7, 5.8). Verdict PROCEED, not RETHINK.
