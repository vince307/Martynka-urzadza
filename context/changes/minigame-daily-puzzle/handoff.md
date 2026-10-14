# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-implement` phase 7 step. The daily puzzle is live in `TaskScene` (E3-E4 only; minigames still off, `balance.variants.minigames: []`). The e2e run of phase 7 is NOT done (Chromium dies at launch in this session): the orchestrator must run the full suite (expected 63, +0).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-7 (`b0ad4ba`, `8ee3d18`, `cd5b705`, `5a18b39`, `9f87fea`, `15fde6b`, `b3d448f`) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 7: 7.1-7.3 ticked, 7.4 open (e2e), 7.5 [reviewer], 7.6 [visual] open; 6.4 ticked from the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/TaskScene.ts` | `freshRound()` -> `{kind, state, puzzleId?}` (no side effects), `applyRound` (the only place a built round becomes the open one), `nextKind` (calls `nextRoundKind`), `finishVariant`/`countRound` (one `registry.set(variants)` via `afterRound`, then `flush('now')`; no `endRound`); snapshot gains `variant`, `today` |
| `src/core/variants.ts` | `variantTitle(kind, words)` -> `HudTitleView {text, badge}` |
| `src/ui/widgets/HudTitle.ts`, `UIScene.titleText()`, `HUD_LAYOUT.title` | HUD title: name + star drawn in code + badge `×2` (the font has no ★ glyph), between the progress dots and the speaker; registry `REGISTRY_KEYS.hudTitle` (runtime, not saved); hook snapshot `hudTitle` |
| `src/main.ts` | `REGISTRY_KEYS.today` = `() => pinnedDay ?? localDay(new Date())`; `REGISTRY_KEYS.forcedVariant` (hook build only) |
| `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs` | `e2eDay(search)` (`YYYY-MM-DD`, real dates only), `e2eVariant(search)` (`off|word|dice|puzzle`); markers `e2eDay`, `e2eVariant` |
| `tests/e2eVariant.test.ts`, `tests/variants.test.ts` (`variantTitle`), `tests/e2eHookGuard.test.ts` | +8 unit tests |
| `tests/e2e/{adaptive,room-purchase,parent-settings,save-transfer}.spec.ts` | `e2eVariant=off` added (see §3) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent (2 chunks checked)`; `e2eDay`/`e2eVariant` count in `dist/_app/*.js` = 0) |
| unit + deploy scripts + sample E1-E6 | 2312 passed (branch baseline 2304, +8); deploy scripts OK; every sample exit 0 |
| Breaks | `'e2eDay'` removed from `E2E_HOOK_MARKERS` -> `lists every marker…` red (`expected [ …(7) ] to deeply equal [ …(8) ]`); `puzzleMultiplier` dropped in `variantRules` -> `the daily puzzle: one task, double stars, no bonus` red (`starPerTask: 1` vs 2); both restored, green again. Meta-check: the first break is caught by the list test only (the `it.each` per-marker test reads the list, so it follows it) — it proves the list, the leak guard itself was already covered; the scene wiring is not unit-covered, it is the orchestrator's e2e + visual gate |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium MachPortRendezvous Permission denied, 3 plain tries incl. seed spec). Expected 63 (+0) |
| Teacher read | no change to `src/data/` content or generators (one `pl.minigames.puzzleBadge` string `×2`) |

**Specs the orchestrator must watch** (the hook build now runs the real schedule: E3/E4 learner, 4th ordinary round = the daily puzzle, once per day):
- Got `e2eVariant=off`: `adaptive.spec` (E4, up to `MAX_ROUNDS`), `room-purchase.spec` (up to `MAX_ROUNDS`), `parent-settings.spec` test "#14 the progress view shows the empty state…" (up to 3 rounds + reload-free), `save-transfer.spec` (all five `passWelcome` calls: rounds + reload/import share one counter).
- Counted and left WITHOUT the seam (at most 1-2 ordinary rounds per context, counter never reaches 3): `task-round`, `first-launch` (warm-up is not counted), `narrator`, `save-restart` (1 round, reload), `room-change` (stars seeded), `save-transfer-blocked`, `error-boundary`, `parent-settings` other tests (`passWelcome` + at most a few tasks), and every `?e2eSkills` spec (`clock-set`, `art-tasks`, `art-stand-in`, `grid-tasks`, `drawn-tasks`: a forced-skills round never asks the schedule). If any of these goes red with a puzzle on screen, add `e2eVariant=off` there.
- `save-restart` "#2 #10 a reload comes back…" plays 1 round then reloads; the counter is saved, so it is the one to re-check if a 4th round ever appears.

## 4. Next command

`/10x-implement minigame-daily-puzzle phase 8` (Phase 8: Hasło z wyników na ekranie).

## 5. Open

- 7.4 e2e (orchestrator), 7.5 [reviewer], 7.6 [visual: puzzle with tiles, with keypad, hint after a miss, solution steps, summary with 2 stars, HUD title — `?e2eVariant=puzzle`, E4, 1440x900 and 1024x768; ready to capture on the hook build]; 6.4 closed, 6.5 [reviewer]; 5.5 [reviewer], 5.6 [human]; 4.4 [reviewer]; 3.4 e2e, 3.5 [reviewer], 3.6 [visual]; earlier 1.5, 1.6, 2.5.
- DESIGN-GAP rows 79-82 (puzzle screen/badge/title) are named in code comments only; the rows in `docs/design-gaps.md` are still due in phase 10.
- `wordAvailable: true` in `TaskScene.nextKind` is a placeholder until phase 8 narrows it per stage; harmless while `minigames` is empty.

## 6. Autonomous decisions

1. HUD title position: right of the progress dots (x 1118-1470, y 96) with a star drawn in code, because the dots occupy the centre and "Do pokoju" the left; long names shrink to fit. Would change: the visual gate wants it elsewhere -> `HUD_LAYOUT.title`.
2. The title is a registry value (`hudTitle`) set from `TaskScene.render()` and cleared when going to the room, so the HUD scene stays display-only. Would change: a second scene needs titles -> move to a core view.
3. Warm-up and `?e2eSkills` rounds bypass the schedule entirely; the warm-up does not count as an ordinary round (`roundsSince` unchanged), as the plan says.
4. `e2eVariant=off` added to the multi-round tests only; the per-spec count is in §3.
5. Mixed phase: none (impl).
