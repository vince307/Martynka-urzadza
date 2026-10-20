# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

The `/10x-plan-review` step of run 2026-10-20-playtest-boot reviewed `plan.md` against the code (verdict PROCEED, 0 critical, 3 warnings fixed in the plan, 4 observations) and set `change.md` to `plan_reviewed`; no product code was touched. The next agent must not use "drop the clear-on-hide" as the H-1 deliberate break: the hidden-aware guard keeps that green by design; the valid break is the scene passing `hiddenMs` 0 to the rule.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | 4 (`… change identity (autonomous run)`, `… research`, `… plan`, `docs(audit-boot-hidden-tab): plan review`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 44 (`grep -c '^- \[ \]' plan.md`; titles of 2.3, 4.2, 4.3, 8.1, 8.2 edited in body and Progress alike) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-boot-hidden-tab/reviews/plan-review.md` | Plan review report F1–F7 with decisions, ends with `VERDICT: PROCEED — …` |
| `context/changes/audit-boot-hidden-tab/plan.md` | Triage edits: lifecycle (no arm when starting hidden, show acts only on a closed span, `clearTimers()` before re-arm); breaks 2.3/8.1 = remove the subtraction; 4.2/4.3 seed oracle = `tests/generateTask.test.ts` "does not consume rng differently"; 8.2 isolation run + fired follow-up; phase 7 follow-up list; phase 10 seam note; two `## Known risks` lines |
| `context/changes/audit-boot-hidden-tab/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/audit-boot-hidden-tab/handoff.md` | This file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-boot-hidden-tab` |
| Progress↔phase | one `## Progress`, 44 rows, 10 `Driver:` lines; edited criteria changed identically in body and Progress (python replace asserted 2 hits each) |
| code checks (grep/read) | `BootScene.preload` `arm`/`clearTimers`/cut guard (no phase check); `replace` catch `blockedBy ??= 'newer'` + `writesOff()` → silent block, no `onBlocked`; `failureText` forced → `siteDataAdvice`; `pl.saveFailed.detail` contains `Wersja <id>`; `ART_LIMITS` in `src/data/measures.ts`; `pictureLayout` drawPrompt call lacks `skillId`; e2e `newer` store stores `SAVE_VERSION + 1` on the first write |
| unit, lint, typecheck, build, e2e | Not run: docs-only step; the step prompt bans builds, e2e and servers, and no code changed |

## 4. Next command

`/10x-tdd audit-boot-hidden-tab` (phase 1, `Driver: tdd`)

## 5. Open

- Phases and drivers unchanged: 1 tdd, 2 impl, 3 tdd, 4 tdd, 5 impl, 6 tdd, 7 impl, 8–10 e2e (three different spec files, not merged).
- Manual-only rows (checklist):
  - [ ] 2.6 [human] real tablet: hide the game during loading over a minute, come back, no cut.
  - [ ] 3.5 [visual] "Obrazki" with and without a hidden span.
  - [ ] 5.4 [visual] "Ups!" card with `Kod:`.
  - [ ] 6.5 [visual] import/reset dialog after `NewerSave`, refusal card after closing.
  - [ ] 2.5, 3.4, 7.5 [reviewer].
- Fired follow-up now in the plan: stale-tab-and-health "Isolation-only red of `load-and-tab-guard`" (phase 8.2 runs the spec alone; phase 7 closes or restates it).
- DESIGN-GAP 153 planned in phase 3; no 154.
- Risk: the e2e fakes `document.hidden`; the real Phaser stall is inferred from source (phase-2 [human] row).
- Risk (`## Known risks`): `Autosaver.replace` → `refuseWrites` and unforced `NewerSave` → `deviceNewer` go slightly past scope Z-8's literal text; justified (silent write block today).

## 6. Autonomous decisions

- R-1 **PROCEED, not RETHINK.** The approach (pure visible-time rule + scene glue, code from the thrown error, Z-8 in the same catch) fits the code; the issues were proof and lifecycle details. Would change: a phase finding Phaser's loader does not stall while hidden (then H-1's premise shrinks, not the fix).
- R-2 **Kept the Z-8 extension (F4)** instead of narrowing to "forced only, text only". Why: verified in `autosave.ts` that without `refuseWrites` the page blocks writes silently (`writesOff`), never showing the card; the unforced text change is one line in the same function. Rejected: narrowing (leaves a silent progress loss). Would change: the maintainer reading scope § 2 as text-only.
- R-3 **No phase merge or split.** Each phase is one risk, sized for one agent; e2e phases use three different spec files and setups. Would change: phase 9 found trivially small by its agent (it may still commit on its own).
- R-4 **Phase 10 seam left conditional** with a note that the existing `newer` seam most likely suffices (F7). Would change: the phase-10 agent seeing a normal write refused before the reset.
- R-5 **Severity of F1 as WARNING, not CRITICAL**: the plan was still executable and the fix is a one-line criterion edit; fixed in place. Would change: nothing; it is fixed.
