# Handoff — `autosave-versioned-save` (slice S-11)

Written by the `plan` step (`/10x-plan autosave-versioned-save`) of run 2026-10-13-s09-s11. plan.md and plan-brief.md
exist (7 phases, 39 Progress rows, none done); no product code yet. The next agent must not let any write happen when
the load was not `fresh`/`loaded` (`unreadable`, `unavailable`, or after a fatal error): that rule protects the one-way
save on children's devices.

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | 3 on the branch after this step (`… change identity`, `… research`, `docs(autosave-versioned-save): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 39 (`grep -c '^- \[ \]' plan.md`) |
| Roadmap | S-11 `proposed` → `planning` (At a glance row + body `Status`), committed with the plan |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/plan.md` | Full plan: 7 phases with `Driver:` lines, Critical Implementation Details, 14 autonomous decisions, Progress |
| `context/changes/autosave-versioned-save/plan-brief.md` | Two-page brief |
| `context/changes/autosave-versioned-save/change.md` | Status `planned` |
| `context/foundation/roadmap.md` | S-11 status `planning` |
| `context/changes/autosave-versioned-save/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/autosave-versioned-save` |
| `grep -c '^- \[ \]' plan.md` | 39 = Success Criteria bullets of phases 1–7 (3+3+4+6+8+9+6) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}`; status `planned` |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed; baseline to measure on the branch is the contract line (main f67b9f4: unit 1079, e2e 26) |
| Repo facts observed this step | `tests/e2e/error-boundary.spec.ts` expects the welcome after "Zacznij od nowa" (kept green by the block-on-fatal rule); `eslint.config.mjs` blocks each set `no-restricted-imports` separately (flat config override risk); `vitest.config.mts` includes `tests/**/*.test.ts` (no gate change); `src/testing/e2eHook.ts` markers list; `tests/e2e/support/hook.ts` has `playRoundRight`, `welcome.ts` has `gateProblem`/`typeIntoGate` |

## 4. Next command

`/10x-plan-review autosave-versioned-save`

## 5. Open

- Manual rows (human checklist): 4.6 [human] iPad/Android restart, kill, silent update keep state; 5.5 [reviewer] teacher
  read `pl.saveFailed`; 5.6 [visual] card, gate over card, welcome after „Graj dalej” at 1440×900 and 1024×768; 5.7 [human]
  export on iPad home-screen app and Android; 5.8 [human] `?e2eSave` seam; 6.5 [reviewer] seam sweep; 6.6 [human] v1
  deviates from plan §5; 6.7 [human] card gating (against research recommendation); 6.8 [human] two-build e2e (#10)
  deferred to v2; 6.9 [human] `pl.errorCard.body` unchanged, fatal error blocks autosave.
- DESIGN-GAPs planned: rows 42 (failed-load card), 43 (save invisible to the child), 44 (export as `.txt`, share first).
- E2E protocol: phase 4 writes `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch`; phase 7 writes
  `e2e-request-s11-p7.md` + `e2e-break-s11-p7a/c/d.patch`.
- Phase 3 needs network: `npm_config_cache="$TMPDIR/npm-cache" npm install idb-keyval@6.3.0` and `… install -D
  fake-indexeddb@6.2.5` with `allowed_domains: ["registry.npmjs.org"]`.
- Carried follow-ups (unchanged triggers): observability F3 (`installErrorBoundary` `signalOfRejection`), F4
  (`WelcomeScene.openParent`), parent-settings F7 (`pl.settings.empty`).

## 6. Autonomous decisions

- No interview (run rule): complexity HIGH, 0 user questions — research + change.md settle every open choice; the
  remaining product choices are decided in plan.md `## Autonomous decisions` 1–14 with reversal conditions.
- Failed-load card: "Graj dalej" ungated, export gated — rejected research's "continue behind the adult gate" because a
  child alone would be stuck before the game; would change if the maintainer wants only an adult to decide (`[human]` 6.7).
- `unavailable` also blocks autosave (added beyond research): a transient iOS read failure must not overwrite a real save
  with an empty game; would change with device evidence of permanent `unavailable`.
- Fatal error blocks autosave and `pl.errorCard.body` stays: a bad state saved at a throw would show the card at every
  launch; would change once S-12 shows the save state.
- Two-build e2e (#10) deferred to the first format change (`[human]` 6.8): same code path as the restart spec with one
  format; would change if the maintainer wants test-plan phase 4 fully closed now.
- Phase drivers: 1–3 `tdd` (core and adapter absent, failing tests lead), 4–6 `impl` (glue, one UI component, docs), 7
  `e2e` after the seam sweep; phase 4 and 5 seam breaks deferred into phase 7 patches B and C.
- Roadmap status edit committed with the plan (run rule), although the skill says leave it for implement.
