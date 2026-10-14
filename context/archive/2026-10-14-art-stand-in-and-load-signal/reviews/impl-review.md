<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Polski stand-in obrazka, sygnał nieudanego wczytania dla rodzica i import/reset po nieudanym odczycie

- **Plan**: context/changes/art-stand-in-and-load-signal/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-10-14
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Evidence (observed in this review, on 92f1a76)

| Check | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 1899 passed in 105 files; contract baseline on main 1865, delta +34 (the new and extended tests of this change: artFilter, artHealth, artHealthText, deviceSaveWiring, autosave, saveFile, taskArt, e2eHookGuard); the baseline flaky `spoken.test.ts` timeout did not recur (whole suite 6.1 s) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1..E6` | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `dist/_app/*.js` holds no `e2eArt` or `forcedArt`, and `corrupt` only as the save-decode reason and its Polish line (the `?e2eArt` seam is folded away with `__E2E_HOOK__`) |
| `npx playwright test` (full, Chromium launched in this session) | 52 passed (3.9 m) = baseline 46 + 4 (`art-stand-in.spec.ts`) + 2 (`save-transfer-blocked.spec.ts`) |
| Deliberate break 1 | `withoutArtBlocked`: `current` kept on `current.length > 0` only (threshold dropped) → `tests/artFilter.test.ts` 2 failed ("keeps the current step whole … (E2.2)", "does not filter the current step below the threshold", `AssertionError` on the bucket contents); restored, 12 passed. Meta-check: the break is in the rule, the test data is real E2.2 curriculum, so it proves the unlock guarantee |
| Deliberate break 2 | `UIScene.openImport`: `deviceSaveView(null, …)` → `tests/deviceSaveWiring.test.ts` "openImport reads the blocked reason…" failed; restored. Meta-check: proves the source tripwire works for the direct regression (see F2 for its limit) |
| Hook bypass | none: `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (12 Oct) predate the run; no `--no-verify` in the branch log |

Audit findings in scope, each checked closed: S14-01 (label from `TASK_ART.label`, `artBlocked`/`withoutArtBlocked` skip answer-only-in-picture skills; e2e p8 (a)), S14-02 (`WEIGHTS[].label`, text scaled into the box in `ArtImage.show`; legibility at the smallest size: F1), S14-03 (`REGISTRY_KEYS.artHealth`, "Obrazki" section; e2e p8 (c)), S14-04 (`textures.exists` in `BootScene.create`; e2e p8 (d) and break p8b `Expected: > 0, Received: 0`), S14-11 (class header of `ArtImage`, gap 66, `taskArt.test.ts` label test), S12-01 (`replace` refuses `unavailable`, `deviceSaveView`, dialogs; unit + e2e p9).

Reviewer rows performed: 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 7.6 — all pass (ticked in plan Progress).

Teacher read (rows 4.4, 5.5, 6.5): `pl.settings.artMissing` printed for 1, 2, 3, 5, 12, 22, 25, 38: "1 z 38 obrazków nie wczytał się", "2/3/22 … nie wczytały się", "5/12/25/38 … nie wczytało się" — agreement correct incl. teens and 22; "W tych zadaniach zamiast obrazka jest napis. Uruchom grę ponownie." calm and plain. `artOk` fine. `deviceUnavailable` / `deviceUnreadable`: adult tone, no codes, the two button names match `pl.saveFailed.export` ("Zachowaj kopię") and `pl.saveTransfer.exportButton` ("Zapisz kopię"). All 38 labels: money "1 gr" … "500 zł" equal `formatMoney`, weights "10 dag" … "5 kg", jugs "1 l", "½ l", "¼ l", icons nominative singular dictionary nouns (filiżanka, rogalik, kwiatek, poduszka, książka, lampa, jabłko, gruszka, czajniczek, kredka, klucz, kłębek); scale and thermometer frame deliberately empty. No content generator or prompt changed, so `sample` output is unaffected.

## Findings

### F1 — Stand-in text has no minimum size in the smallest boxes

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/ArtImage.ts `show`; src/data/layout.ts `ART_STAND_IN.padding`, `TASK_LAYOUT.scale.weightSize`, `TASK_LAYOUT.picture.keypadSolution`
- **Detail**: The fit is correct (scale = min of width/height room minus a fixed 8 px padding, reset to 1 on every `show`, never overflows, so S14-02's overlapping labels are gone). But it only shrinks: a weight on the scale in the keypad solution rectangle (768×190) is about 0.495 × 84 ≈ 42 scene px; "10 dag" at 24 px needs ~70 px, room ≈ 26 px → scale ≈ 0.37 → ~9 scene px ≈ 5 CSS px on a 1024 px tablet. In the main keypad rectangle (768×378) the same label is ~12 CSS px, readable. Coins (≥ 74 units, "1 gr") fit at near full size. Arithmetic only; not measured in a browser. In the solution phase the solution lines carry the values, so solvability is not lost, only the picture's labels.
- **Fix A ⭐ Recommended**: Let the visual gate (next step) measure the weight and coin labels at 1024×768 in both the main and the solution phase; if a label is under ~10 CSS px, then reduce `ART_STAND_IN.padding` proportionally for small boxes or allow the label to overflow the box by a set share.
  - Strength: decides on a measurement, which the plan's [visual] row 5.6 already requires.
  - Tradeoff: one more fix round if the gate finds it.
  - Confidence: MED — arithmetic from layout constants, font advance estimated.
  - Blind spot: real glyph widths of Atkinson Hyperlegible Next at 24 px.
- **Fix B**: Change the fit now (proportional padding + a minimum scale).
  - Strength: no dependency on the gate.
  - Tradeoff: tuning a constant blind; a minimum scale reintroduces overlap between neighbouring weights (gap 2).
  - Confidence: LOW — no measurement.
  - Blind spot: overlap of adjacent weights.
- **Decision**: FOLLOW-UP via Fix A (recorded in follow-ups/review-fixes.md with `Trigger: visual gate of this change`)

### F2 — `deviceSaveWiring.test.ts` asserts on UIScene source text

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/deviceSaveWiring.test.ts
- **Detail**: Parses `UIScene.ts` with the TypeScript AST (not regex, so formatting does not matter) and checks that `openImport`/`openReset` call `deviceSaveView`, contain `saver.status().blockedBy` and do not call `decodeSave`. It went red on the direct regression (break 2). It is bypassable (an unused `saver.status().blockedBy` elsewhere in the method plus `deviceSaveView(null, …)` would pass), so it is a tripwire, not the proof; the proof is e2e p9 (break p9a red on both tests). Acceptable as a cheap unit-level guard because UIScene needs Phaser and a DOM; the repo already uses AST-reading tests (`tests/lint-boundaries.test.ts`).
- **Fix**: Keep; delete it if a DOM/scene harness for `UIScene` ever exists.
- **Decision**: ACCEPTED

### F3 — E5.5 threshold rule versus the FR-013 [human] row

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/round/artFilter.ts `withoutArtBlocked`; src/core/curriculum.ts `buildAdaptiveRound`, `unlockThreshold`
- **Detail**: Code, test (`tests/artFilter.test.ts`) and the reconciled plan text agree: with only `container-half-l` missing, E5.5 (n = 2, threshold 1) drops `capacity_quarter_l` and the step unlocks through `mass_half_kg_e5`; with both missing it stays unfiltered. `unlockThreshold` is the single formula used by `unlockReady` and the filter, and `current` is exactly the playable skills `unlockReady` counts. The change of round composition is the maintainer's call (row 7.7 [human], open), not a defect.
- **Fix**: None in code; maintainer answers 7.7 (if E5.5 must never be filtered, `minCurrent` becomes n).
- **Decision**: ACCEPTED

### F4 — `?e2eArt=corrupt` serves the font as money images

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts `preload`; src/main.ts `createGame`; vite/e2eHookGuard.mjs `E2E_HOOK_MARKERS`
- **Detail**: The seam is read only as `__E2E_HOOK__ ? e2eArt(...) : null` and `seam` in `preload` is `null` when `__E2E_HOOK__` is false; `npm run build` passes the guard with marker `e2eArt`, and a grep of `dist/_app/*.js` finds no `e2eArt`/`forcedArt`. S14-04 is proven in a browser by break p8b (health from `loaderror` only → (d) `Received: 0`), i.e. the decode failure really emits no `loaderror`. Cannot reach production.
- **Fix**: None.
- **Decision**: ACCEPTED

### F5 — Panel export under `unreadable` still writes the fresh session

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/data/pl.ts `pl.saveTransfer.deviceUnreadable`; src/scenes/UIScene.ts export path
- **Detail**: Out of scope by the run contract (S12-04). The residual risk is narrow: the export dialog shows the summary of what it saves (the fresh session, so "0 gwiazdek, przed wyborem etapu"), the import and reset dialogs now name the difference between "Zachowaj kopię" and "Zapisz kopię", and the start card with the raw copy returns at every launch while the save is unreadable. A parent who exports from the panel and ignores the summary could still be misled. Follow-up S12-04 in follow-ups/review-fixes.md carries it with a trigger.
- **Fix**: None now (S12-04 follow-up).
- **Decision**: ACCEPTED

### F6 — Progress row 8.3 had no commit sha

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: context/changes/art-stand-in-and-load-signal/plan.md `## Progress` row 8.3
- **Detail**: Ticked but without ` — <sha>`; the handoff p8 cites the orchestrator run on `0f1a43b` (p8b red on (d) and (c)).
- **Fix**: Append ` — 0f1a43b` to row 8.3.
- **Decision**: FIXED

MERGE: CLEAR — no critical finding, every automated criterion re-run green (unit 1899 = 1865 + 34, e2e 52 = 46 + 6), all [reviewer] rows pass; the open rows are [visual] (next step) and [human] (maintainer), and F1 is a warning for the visual gate.
