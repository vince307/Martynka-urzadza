# Handoff — `autosave-versioned-save` (slice S-11)

Written by `/10x-tdd autosave-versioned-save phase 1` of run 2026-10-13-s09-s11. Phase 1 (format v1, decoder, fixtures) is
committed at 7cf32a4; nothing writes to IndexedDB yet. The next agent must keep `src/core/save.ts` pure and must not edit
`tests/fixtures/save-v1*.json` (frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | docs x4, `7cf32a4` test p1, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the status flip is left to the orchestrator or a later phase) |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`); 1.1-1.3 done |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/save.ts` | `SAVE_VERSION`, `DEFAULT_PROFILE`, `SessionSave`, `DecodeResult`, `encodeSave`, `decodeSave` (migration chain, injectable), `validateSave`, `rawExportText` |
| `src/core/types.ts` | `SaveState` replaced by `SaveV1` (+ alias `SaveState`), `SavedLearner`; `rngSeed` gone |
| `src/core/rng.ts` | header comment no longer promises `rngSeed` in the save |
| `tests/save.test.ts` | 34 tests |
| `tests/fixtures/save-v1.json`, `save-v1-fresh.json` | frozen hand-written v1 saves |
| `context/changes/autosave-versioned-save/plan.md` | Progress 1.1-1.3 ticked with 7cf32a4 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs returning constants) `npx vitest run tests/save.test.ts` | 16 of 34 failed; first: `AssertionError: expected { kind: 'unreadable', …(1) } to deeply equal { Object (kind, migratedFrom, ...) }` (fixture decode) |
| GREEN | 34/34 |
| Deliberate break 1: `encodeSave` spreads the learner (`{...session.learner}`) | red: 4 tests (round trip, fresh round trip, session-only field, pending unlock stage); restored |
| Deliberate break 2: `from > SAVE_VERSION` -> `from > 99` | red: "a save from a future version is left alone"; restored |
| Deliberate break 3: no `currentRoom in rooms` check | red: "a v1 save with current room outside the rooms is corrupt"; restored |
| Meta-check | expectations are hand-written fixtures and literals, not encoder output (the fixture test compares to a literal); break 1 reds on round-trip too because the saved stage-bound `pendingUnlock` shape differs, which is the intended protection |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 1113 passed (baseline 1079, +34) |
| deploy tests, `npm run sample -- E1..E6` | run, no violations printed |
| `npm run build` | OK, e2e hook absent |
| `npx playwright test` | not runnable in this session (MachPort Permission denied) — orchestrator gate |

## 4. Next command

`/10x-tdd autosave-versioned-save phase 2` (`Driver: tdd`)

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
- Phase 1: `unlockedStep` validation requires whole numbers per present key but does not require all six stages (chosen so a
  save is never unreadable only for a missing stage key); reversal: require `STAGE_ORDER` keys if the game starts reading a
  missing stage as a crash.
- Phase 1: `pendingUnlock` is encoded as `{ stage: learner.stage, step }` and decoded to `null` when the stage differs, per plan.
- Phase 1: fresh fixture has `rooms: { living: … }` because `currentRoom` must be a key of `rooms`; reversal: if the game ever
  saves with empty `rooms`, relax that rule via a migration, not silently.
- Phase 1 test builds the session with `endRound(...)` (real core), `Outcome` 'second' stands for a hint-assisted answer.
- E2E: not run (Chromium MachPort denied); orchestrator gate for 7cf32a4, no e2e-relevant code changed.
