# Handoff — `narrator-round-summary` (slice S-05)

Written by the `/10x-research` step of autonomous run 2026-10-12-s04-s08. `research.md` answers the six research questions (Web Speech API, spoken text, summary state, room scene and return, e2e hook, headless testing); `change.md` is now `preparing`; there is no product code yet. The planner must get the gesture rule right: Phaser fires `pointerdown` inside DOM `touchstart`, which the HTML spec does not count as user activation, so the speaker has to speak on `pointerup`. Every e2e narrator test must also stub `speechSynthesis`, because headless Chromium on this Mac has a real Polish voice ("Zosia").

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | 2 after this commit (`ad5535b` change identity, plus this research commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan yet) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/narrator-round-summary/research.md` | the research write-up: §1 Web Speech API table with cited sources, §2 spoken-text rules and the inventory of `□`/symbols, §3 summary in core, §4 room scene and Phaser sleep/switch, §5 hook and spec changes, §6 what can be tested headless, §7 tokens and copy, plus open questions |
| `context/changes/narrator-round-summary/change.md` | frontmatter only: status `new` → `preparing` |
| `context/changes/narrator-round-summary/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/narrator-round-summary` |
| `npm run sample -- E1..E6 --count 4` | 336 prompt lines. Symbol counts: `−` 71, `+` 61, `□` 56, `:` 50, `=` 44, `·` 34, NBSP 8 (counted from the output, which was not saved) |
| Playwright probe (`chromium.launch()`, `speechSynthesis.getVoices()`), run once outside the sandbox and deleted afterwards | HeadlessChrome 156.0.8078.4 lists 180 voices, including `Zosia` `pl-PL` with `localService: true` |
| Reading `node_modules/phaser` 4.2.1 | `InputManager.onTouchStart` → `updateInputPlugins` runs synchronously in DOM `touchstart`. `ScenePlugin.switch` is queued and puts the current scene to sleep. `InputPlugin.update` returns false for an inactive scene |
| Gates (lint, typecheck, unit, build, e2e) | not run: docs-only step, no code changed |

## 4. Next command

/10x-plan narrator-round-summary

## 5. Open

- `[human]` checks to put in the plan:
  - Polish voice quality on an iPad (Safari PWA) and an Android tablet (PRD Open Question 7);
  - whether one gesture unlocks speech for the whole iOS session, so auto-read after "Dalej" works;
  - how numerals in sentences are read aloud ("dwie książki").
- Product choices for the plan (research.md Open Questions):
  - leaving the room returns to the summary (kit `preview.js`: `roomReturn`) or starts a new round (change.md decision 3);
  - the bonus as its own line, or counted in "+N";
  - what the row of 5 stars means;
  - the `speak` wording for COMPARE_NUM, COMPARE_EXPR, MISSING_OP, ROMAN (read direction) and CALENDAR `romanMonth`. This changes generators, so it needs a teacher read;
  - numbers above 1000 in speech.
- New DESIGN-GAP candidates:
  - the kit summary has no HUD, but FR-011 keeps the counter visible;
  - the kit HUD shows "Do pokoju" during a task, which FR-011 forbids;
  - all the candidates listed in change.md (a)–(f).
- Follow-up candidates:
  - the "Oblicz" heading is drawn over compare prompts (`src/core/round/prompt.ts` `isExpression`);
  - a narrator risk for `/10x-test-plan refresh`;
  - `scripts/sample.ts` should print `speak`;
  - extend `numberToWords` beyond 1000 if the device listening check needs it;
  - `Trigger: S-09` for the room-task cost (from change.md).
- Triggered S-04 follow-ups (see `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md`): HUD switch and drawn counter in the hook are in scope; `pl.title` and the solution-step dots stay deferred, as change.md says.

## 6. Autonomous decisions

1. **Research question taken from change.md "Open questions" and the step prompt, without asking anyone.**
   - Rejected: interviewing the maintainer.
   - Why: contract rule 1.
   - Would change: nothing in this step.
2. **Web Speech facts gathered by one helper agent doing web research. Phaser, repo and kit facts checked here in the code.**
   - Rejected: context7 for the Web Speech API. It is a browser API, not a library, so primary specs and bug trackers are better sources.
   - Why: the facts come from different places.
   - Would change: a context7 entry for MDN Web Speech, which would be used to re-check §1.
3. **Ran a headless voice probe outside the sandbox.**
   - Why: it answers question 6 directly. test-stack.md records that headless Chromium cannot start inside the sandbox.
   - The probe script was temporary and was deleted. Nothing is committed.
   - Would change: nothing.
4. **Recommended the kit's room return (back to the screen the child left) over change.md decision 3, which starts a new round.** Recorded as a recommendation only; the plan decides.
   - Why: one wake path for both the summary and the HUD switch, and it matches the kit.
   - Would change: the maintainer wants the room to be a "break" that always resets the round.
5. **Next step is `/10x-plan`,** as the step prompt fixes.
