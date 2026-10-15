# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-plan` step of run `2026-10-15-fix-s16bcd` wrote this handoff. `plan.md` (7 phases, each with a driver) and `plan-brief.md` exist, and `change.md` is now `planned`. No product code was touched. The next agent must not treat the unit tests on `balance.loader` numbers or the Phaser version tripwire as proof that the loader cut works. Only the e2e of phase 7 (#15 `stallall`, break patches p7a to p7c) proves the loader-internals mechanism.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | 3 on the branch: change identity, research, and `docs(load-and-tab-guard): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 31 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit. Only the four files below were staged. |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/plan.md` | the full plan: 7 phases (each phase has a `Driver:` and a `Driver why:` line), Critical Implementation Details (cut order, timers, the `NewerSave` block), `## Autonomous decisions` (11), and `## Progress` |
| `context/changes/load-and-tab-guard/plan-brief.md` | a two-page brief with the key decisions table |
| `context/changes/load-and-tab-guard/change.md` | status `planned` |
| `context/changes/load-and-tab-guard/handoff.md` | this handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| Success Criteria vs Progress (awk count per phase and section) | 1:1 in all 7 phases (A/M: 3/1, 3/2, 2/2, 3/1, 3/1, 2/1, 6/1) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md went from `preparing` to `planned`. The roadmap has no `load-and-tab-guard` entry (`grep -c` gave 0), so it was not edited, as the step prompt says. |
| source reads (this step) | `BootScene`, `LoadingScreen`, `src/storage/idb.ts`, `src/core/autosave.ts` (`attempt`, `replace`, `replaceGate`), `saveHealth.ts` `offState`, `saveFile.ts` `deviceSaveView`, `pl.ts` `saveOff`/`loading`, `e2eHook.ts` seams and the `snapshot` getter, `vite/e2eHookGuard.mjs`, `tests/loaderBalance.test.ts`, `tests/e2e/salon-load-health.spec.ts`, `tests/e2e/support/welcome.ts` `openSettings`, `docs/design-gaps.md` (last row 111), test-plan risks #2 and #15 |
| lint / typecheck / unit / build / e2e | not run, because this is a docs-only step. The baseline on main 6f5644c is the contract's (`unit 2925`, `e2e 101`). It is inherited and was not verified here. |

No deliberate break was made, because no test or code changed. Each phase in the plan names its own deliberate break.

## 4. Next command

`/10x-plan-review load-and-tab-guard`

## 5. Open

- **Driver per phase:**
  - 1 `tdd`: `src/core/bootLoad.ts`, `balance.loader.slowAfterMs`/`totalMs`
  - 2 `impl`: `src/scenes/loaderCut.ts` `cutLoad`, `REGISTRY_KEYS.bootLoad`, the `?e2eArt=stallall` seam, the hook's `screen: 'loading'`, `tests/phaserLoaderPin.test.ts`
  - 3 `impl`: `LoadingScreen.slow`, `pl.loading.slow`, DESIGN-GAP 112
  - 4 `tdd`: `storedVersionNewer`, `BlockReason 'newer'`, `replaceGate`, `offState`, `deviceSaveView`, `pl.settings.saveOff.newer`, DESIGN-GAP 113
  - 5 `tdd`: `createIdbSaveStore.write` through idb-keyval `update` on fake-indexeddb, the `?e2eSave=newer` seam
  - 6 `impl`: the `CLAUDE.md` sentence and `follow-ups/review-fixes.md`
  - 7 `e2e`: `tests/e2e/load-and-tab-guard.spec.ts` for #15 and #2. It uses the request-file protocol with break patches p7a to p7d.
- **DESIGN-GAPs planned:**
  - 112: the slow line on the loading screen.
  - 113: the `saveOff.newer` line.
  - The rows are added in phases 3 and 4.
- **Risks carried:**
  - The Phaser internals in `cutLoad`. `package.json` has `^4.2.1`, so `npm install` can move the version. The tripwire and e2e #15 cover this.
  - The guard protects only from this build onwards.
  - Two tabs of the same version stay unguarded.
  - The retry of `update` on iOS after a lost connection is unverified.
  - The p7b break may stay green if the font promise does not settle after the cut in Chromium. The plan then requires a meta-check note instead of a red result.
- **Manual-only rows (human checklist):**
  - 2.5: Android on a throttled network starts in about 45 s or less.
  - 7.7: iPad/WebKit: the cut, the slow line, and no error card.
  - 3.3 [visual]: the slow line.
- **Follow-ups:** none written yet. Phase 6 writes them into `follow-ups/review-fixes.md` (A-3..A-11, V-*, P-1..P-4, P-6..P-8, child card for `'newer'`, same-version tabs, queue `loaderror`, WebKit, Phaser upgrade).

## 6. Autonomous decisions

- **No AskUserQuestion was asked.**
  - The complexity confirmation, the question rounds and the phase approval of `/10x-plan` were decided in place. The upstream research plus the contract settled the solution space.
  - Would change: none (contract rule 1).
- **Numbers: `totalMs` 45 000 and `slowAfterMs` 8 000, on the game-loop clock.** These are the research recommendations.
  - Rejected 30 s: it would cut a ~40 s cold first start.
  - Rejected 60 s: it is too long for a child to wait.
  - Rejected wall clock: a hidden tab starts no new downloads anyway.
  - Would change: a tablet measurement, or S-16b sounds that are larger than about 0.9 MB.
- **No child card for `'newer'`.** Only the parent line in "Zapis gry" and a log.
  - Rejected: a reload card in the middle of a round. It is new UI with no kit pattern, for a rare case where two instances run at once.
  - Would change: a parent report of lost progress with two tabs open. This is recorded as a follow-up.
- **Copy:**
  - `pl.loading.slow = 'Jeszcze chwilka, wczytuję obrazki.'`. It has no ellipsis, because the fallback font is showing before the task font loads (compare gap 99).
  - `saveOff.newer = 'Zapis jest wyłączony: nowsza wersja gry zapisała już postępy na tym urządzeniu. Uruchom grę ponownie.'`.
  - Would change: copy from the author.
- **Queued files (decode, font) that the limit cuts emit no `loaderror`.** One log line names every cut key instead.
  - Why: a synthetic event would mislead A-7.
  - Would change: A-7 being taken up.
- **A distinct runtime `'newer'` instead of `'future'`.** This follows research.
  - Would change: plan-review showing that reuse is simpler and still correct.
- **`skipWaiting`/`clientsClaim` stay as they are.**
  - Why: PRD FR-003.
  - Would change: the maintainer preferring "no mixed builds".
- **A Phaser version tripwire in unit tests, with e2e as the real proof.** `package.json` is not pinned.
  - Why: changing the dependency is out of scope.
  - Would change: a maintainer decision to pin the exact version.
- **No `[human]` decision rows against the PRD.** The `[human]` rows are device checks only (2.5, 7.7).
- **Roadmap not edited.** This is a non-roadmap change, per the step prompt.
- **Plan prose in Polish, following the archived format example.** Identifiers and code paths are in English.
