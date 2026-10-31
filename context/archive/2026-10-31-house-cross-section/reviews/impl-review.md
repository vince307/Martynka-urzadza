<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: House cross-section with floors; "Do pokoju" always to the room in renovation

- **Plan**: context/changes/house-cross-section/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-31
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (both fixed), 4 observations

Reviewed by the `/10x-impl-review` step of autonomous run 2026-10-31-house-cross-section, on `feat/house-cross-section` at
`e18e4f5` (diff `112f158...HEAD`, 45 files). The drift and quality reads were done in this session over the whole source diff
(about 700 lines of code; no subagents: the diff fits one read and the two-agent split would have duplicated it). No lessons file
exists in `context/foundation/`.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites re-run by this step

| suite | result | arithmetic |
|---|---|---|
| `npm run lint` | OK | |
| `npm run typecheck` | OK | |
| `npm test` | `Tests 4089 passed (4089)`, 222 files | baseline 4057 + 32: houseCells +21, houseArt +6, houseSceneWiring +6, layout +1 (32→33 cases), roomVisitWiring +3 (4→7), roomVisit −5 (deleted) = +32 |
| deploy + ops shell tests | OK, OK | |
| `npm run sample -- E1..E6` | exit 0 each | no content change (`src/data/` changed only in layout, pl `house`, houses geometry, houseArt) |
| `npm run build` (to a scratch outDir, so the e2e servers kept their dist) | `e2e hook: absent (2 chunks checked)`; `sw.js` precaches `assets/house/{house-1-shell,cell-closed,cell-frame}.webp`; no chunk mentions `e2eArt` | |
| full e2e `--workers=2` | 175 passed + 4 load failures, all 4 green with `--last-failed --workers=1` | 175 + 4 = 179 = `--list` (174 + 5) |

After the fix commit the unit count is unchanged (4089: the new asserts sit inside an existing case).

## Deliberate breaks re-executed

- Unit: `houseWakeVisit` made to return the current room → `tests/houseCells.test.ts` "gives null for {"visit":"kitchen"}" red (1 failed / 20 passed); restored (`git checkout`).
- Unit (new guard from F1): `const blocked = open || this.card` → `open` only → `tests/roomVisitWiring.test.ts` "the house button is hidden while blocked …" red; restored.
- E2E (handoff break A): `RoomScene` `refresh` set `visiting = houseWakeVisit(…) ?? this.visiting` AND the `visiting = null` of `onSleep` removed → `house-cross-section.spec.ts` "#2 #16 S-23 FR-039 …" alone red (`Expected: "kitchen"`, `Received: "salon"`, room after the notebook's "Do pokoju"); restored (`git checkout`). Meta-check: the handoff showed the wake line alone stays green because `onSleep` also resets; the spec protects the pair, which is the FR-039 contract.

## E2E

Full suite `npx playwright test --workers=2` (sandbox disabled, ports 4397/4398, load average ~30-34): **175 passed, 4 failed, 47.8 min**; 175 + 4 = 179 = `npx playwright test --list | tail -1` (baseline 174 + 5 new: house spec 4, Canvas case 1). The 4 failures are outside this slice's specs and are known load timeouts: `adaptive.spec.ts` "#13 … Nowa umiejętność!", `fox-guide.spec.ts` "#11 no fox on the unlock card, back after it", `stale-tab.spec.ts` "#2 B-1 a second window that saved later wins …" and "#2 B-1 without BroadcastChannel …". `--last-failed --workers=1`: **4 passed (4.4 min)**. Every house-cross-section and canvas-renderer test passed in the full run.

## Product checks

- **FR-039** — `TaskScene` `toRoom` calls `scene.switch(SCENE_KEYS.room)` with no data; `RoomScene` `refresh(_sys, data)` sets `visiting` only through `houseWakeVisit` (a done cell other than the current room), `onSleep` and `create` set `visiting = null`; "Dalej" (`moveAfterDone`) goes to the next room, never the house; the house is reached only by the "Dom" button and left in one tap ("Wróć do pokoju" or a cell). Proven in the browser by the phase-6 FR-039 test (handoff break A).
- **FR-038** — four cells from `HOUSE_GEOMETRY` (manifest), live miniatures for done/current rooms, the pack's roller blind + "Wkrótce" for the rest, the frame on the room in renovation.
- **FR-033** — `cellTap` returns `none` for a closed cell; a known room not yet reached is closed (decision P5, `[human]` row 5.7).
- **Scenes** — no player text (copy from `pl.house`, `pl.room.done.teaser`) and no balance numbers (`balance.loader.timeoutMs` read from data) in `HouseScene`/`RoomScene`.
- **Reduced motion** — no tween or delayed call in `HouseScene`, `HouseView`, `roomCapture` (wiring guard `never tweens`); the "Dom" `PageButton` uses the existing chunky press that already obeys `prefersReducedMotion()`.
- **Canvas** — capture into a `DynamicTexture` at (0,0); `HouseView.pixel` reads the DT's own 2D context under Canvas; the Canvas e2e case asserts alpha 255.
- **Runtime house art, missing or undecodable** — `HouseScene.loadArt` queues the three files once per scene lifetime (`artQueued` set before anything else); `complete` fires whether files fail or not, `settle()` records `house: 'drawn'` when a texture is missing and the stand-in shell stays. `render()` (wake, `roomLoad` change, `RESTORE_WEBGL`) never re-queues the house art. No refetch loop (the class of the previous slice's CRITICAL is absent). A decode failure is silent in the log (F4).
- **Save format** — `SAVE_VERSION` 5; `git diff 112f158 -- src/core/save.ts src/core/migrations tests/fixtures` empty.
- **Hooks** — `.claude/settings.json` and `.claude/hooks/*` unchanged since 2026-10-12; no `--no-verify` evidence; `.github`, `eslint.config.mjs`, `vitest.config.mts`, `package.json` untouched.

## Findings

### F1 — Follow-up 11 claimed a phase-6 hook test that does not exist

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: context/changes/house-cross-section/follow-ups/review-fixes.md (item 11); src/scenes/RoomScene.ts `redraw`
- **Detail**: Item 11 said the "Dom" button hidden under the celebration card was covered by a hook test in phase 6; the phase-6 spec checks the variant panel only. The behaviour is right in code: the last purchase sets `this.card = true` before `this.redraw()`, and `redraw` hides `houseButton` when `blocked = open || this.card`, so the button is gone from the reveal hold through "Dalej". Only the panel half of `blocked` was guarded.
- **Fix**: Source guard added to `tests/roomVisitWiring.test.ts` (`blocked` includes `this.card`; `this.card = true` in the last-purchase branch, broken and seen red), follow-up 11 text corrected, browser coverage recorded as follow-up 21.
- **Decision**: FIXED (6431dde)

### F2 — Dead `recreate` parameter in `captureRoomMiniature`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/widgets/roomCapture.ts `captureRoomMiniature`
- **Detail**: The plan said one texture per cell "created once, cleared and redrawn"; `HouseView.clear()` removes the cell textures before every render instead (which also covers a restored WebGL context), and the helper's `recreate` flag had no caller while its comment described it as the restore path.
- **Fix**: `recreate` removed and the comment names the real restore path (`HouseView` removes the textures before each render). Behaviour unchanged.
- **Decision**: FIXED (6431dde)

### F3 — Phase-6 third test uses the salon cell, not the kitchen cell

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/house-cross-section.spec.ts (third test)
- **Detail**: Recorded in the phase-6 handoff §6: on a fresh device the current cell is the salon; the kitchen-as-current path is covered by the FR-039 test. Same rule (`cellTap` current → `visit: null`).
- **Fix**: none needed.
- **Decision**: ACCEPTED

### F4 — An undecodable house picture leaves no console line

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/HouseScene.ts `loadArt`
- **Detail**: Phaser 4.2.1 `LoaderPlugin.nextFile` emits `loaderror` only for a failed request; a process (decode) error goes straight to `fileProcessComplete`. The stand-in shell and `artFallbacks.house` still follow; nothing loops.
- **Fix**: follow-up 19 (Trigger: a change to `HouseScene.loadArt` or a house "Obrazki" line).
- **Decision**: DEFERRED

### F5 — Stand-in shell numbers inline in the widget

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/HouseView.ts `standInShell`
- **Detail**: `margin = 24` and the roof apex `shellTop + 40` are inline rather than in `HOUSE_LAYOUT`; drawn only when a picture is missing.
- **Fix**: follow-up 20.
- **Decision**: DEFERRED

### F6 — `[reviewer]` rows

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: plan.md rows 2.7, 5.11
- **Detail**: Both are `(CI at ship)` rows and stay open for the ship step. 2.7 names Deploy workflow, job `deploy`, step `Smoke check (deploy)`, line `ok +precache covers house pictures — 3 of 3 house pictures precached` (the record is in `scripts/check-deploy.ts`; the local build precaches the three files). 5.11 names workflow `CI`, job `check`, lines `Tests +[0-9]+ passed` and `e2e hook: absent \(` (both seen locally). No `[reviewer]` row without a CI tag exists.
- **Fix**: none; the ship step ticks them.
- **Decision**: ACCEPTED

MERGE: CLEAR — no open CRITICAL, both WARNINGs fixed in 6431dde, every automated criterion met, unit 4057 + 32 and e2e 179 green (4 load timeouts green alone); the open rows are [visual], [human] and (CI at ship).
