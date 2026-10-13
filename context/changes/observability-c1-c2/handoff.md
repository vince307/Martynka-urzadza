# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by the `plan-review` step (`/10x-plan-review observability-c1-c2`, autonomous run 2026-10-13-fix-observability).
Verdict PROCEED; plan.md now has **7 phases** (3 tdd, 2 impl, 2 e2e) and 37 Progress rows. The next agent must not name
the e2e registry key after a guard marker (`REGISTRY_KEYS.forcedFailure`, never `e2eFail`) and must keep the phase-3
guard's e2e-presence check at `__martynkaE2E` only (full list from phase 4).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2`, cut from `main` at `a34aeee` |
| Commits | 4 on the branch after this commit: change identity, research, plan, plan review |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/observability-c1-c2/reviews/plan-review.md` | Plan review: 2 critical, 4 warnings, 3 observations, all triaged; `VERDICT: PROCEED` |
| `context/changes/observability-c1-c2/plan.md` | Fixed: registry key `forcedFailure` (F1), phase-3/4 guard split `E2E_REQUIRED_MARKERS` (F2), non-recursive failure handler (F3), boot-carrier Known risk corrected (F4), `welcome` site dropped (F5), AbortError/IDB risk + follow-ups (F6), phase 6 split into 6 (boundary) and 7 (H-6) (F7), `openWelcome` query param (F8) |
| `context/changes/observability-c1-c2/plan-brief.md` | Phase table (7 phases), trigger decision updated |
| `context/changes/observability-c1-c2/change.md` | `status: plan_reviewed` |
| `context/changes/observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| Progress↔Phase consistency | 7 `## Phase N` ↔ 7 `### Phase N`; 37 rows = criterion bullets (3+6+4+8+9+4+3) |
| `grep -n "^Driver:" plan.md` | 7 lines: tdd, tdd, tdd, impl, impl, e2e, e2e; e2e after seam sweep (5.7) |
| Phaser source reads | `FontFile.onProcess` `.then/.catch`, `File.destroy`, `LoaderPlugin.loadComplete`, `SceneManager` `loader.once`, `TimeStep.sleep/pause/resume` — boot carrier = `unhandledrejection` with secondary `TypeError`; `sleep` survives visibility changes |
| `grep -rlE "e2eMonth\|e2eFail\|__martynkaE2E" dist/` | empty on the current build |
| `grep` for promises in `src/` | none (`registerServiceWorker`, install `prompt()` already `.catch`) |
| gate suites | not run: docs-only step, no product code |

## 4. Next command

/10x-tdd observability-c1-c2 phase 1

## 5. Open

- `[human]` rows: 2.6 (H-7 maintainer decision, unlock at 60–70 % accuracy), 4.8 (restart loses the session before S-11), 5.9 (reading switch stays active without a voice).
- `[visual]` rows: 4.7 (card after `?e2eFail=step` and `?e2eFail=boot`), 5.8 (panel with/without a Polish voice), 1440×900 and 1024×768.
- Teacher reads: 2.5, 4.5 (`pl.errorCard`), 5.6 (`pl.settings.noVoice`).
- New follow-ups phase 5 must write (plan § Phase 5 § 2): benign-name list vs IndexedDB `AbortError` (`Trigger: S-11 …`); `BootScene` hand-over out of the font promise so the original boot error reaches the boundary (`Trigger: S-11 or the next change to BootScene`).
- Risk: boot carrier confirmed by code reading only; break 6.2 confirms at runtime.

## 6. Autonomous decisions

1. F4 Fix A (keep design, follow-up) over Fix B (defer `BootScene` hand-over now). Why: the card — the C-1 goal — works on the boot path; S-11 rewrites boot anyway. Would change: break 6.2 shows no card on `?e2eFail=boot`.
2. Dropped the `welcome` trigger. Why: the card overlay is opaque, the screenshot adds nothing; the welcome release is proven in vitest + review 4.6. Would change: the card becomes translucent.
3. Split phase 6 into 6 (boundary, 4 tests) and 7 (H-6, 1 test). Why: two risks, two specs, three break patches and a likely orchestrator round-trip are too much for one fresh agent. Would change: nothing in this run.
4. `AbortError`/`NotAllowedError` stay benign now. Why: no app promise exists; only IndexedDB (S-11) would turn `AbortError` into a real failure → follow-up. Would change: any app code that awaits a promise before S-11.
5. Phase 4 not split (~10 files, one new UI component, cohesive glue). Would change: the phase-4 agent hitting the context limit.
