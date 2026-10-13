# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-10-13 (refresh: risks #12–#17; phase 5 complete; phases 6–7 added)

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the
   risk wins. Do not promote to e2e because e2e "feels safer." Do not put a
   vision model on top of a deterministic visual diff that already catches
   the regression.
2. **User concerns are first-class evidence.** Risks anchored in "<the
   team is worried about X, and the failure would surface somewhere in
   <area>>" carry the same weight as PRD lines or hot-spot data.
3. **Risks are scenarios, not code locations.** This plan documents *what
   could fail* and *why we believe it's likely* — drawn from documents,
   interview, and codebase *signal* (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the
   ground truth.

Hot-spot scope used for likelihood weighting: `src`, `tests`, `scripts`, `deploy`, `vite`, `.github` (2026-10-13: 312 non-merge commits in the last 30 days, which is the whole history; file changes `src/data` 112, `src/core/tasks` 88, `src/ui` 67, `src/core` outside tasks 59, `src/scenes` 57, `tests` 139, `tests/e2e` 35, `deploy` 26). Test base: 63 unit test files with 974 tests, 7 local e2e specs with 23 tests.

Interview 2026-10-13 (refresh): the three fears weigh the same — the child loses stars or furniture after closing the game, a task has wrong content or a hint that gives the result away, a round freezes with no trace. Nothing has failed in production yet. Least confidence: curriculum data and Phaser scenes. Under-tested: the difficulty curve in practice and the real tablet.

Project-specific rules every phase obeys (AGENTS.md): logic in `src/core/` is pure TypeScript with no Phaser or DOM, player-facing Polish text and balance numbers live only in `src/data/`, every skill gets a 1000-draw property test on a seeded rng, and the validator only checks nouns listed in the dictionary, so a teacher-style read of `npm run sample` is part of every content change.

## 2. Risk Map

The top failure scenarios this project must protect against, ordered by
risk = impact × likelihood. Risks are failure scenarios in user / business
terms, not test names. The Source column cites the *evidence that surfaced
this risk* — never a specific file as "where the failure lives" (that is
research's job, see §1 principle #3).

| # | Risk (failure scenario) | Impact | Likelihood | Source (evidence — not anchor) |
|---|---|---|---|---|
| 1 | A child gets a task with a wrong model answer, a wrong hint, or a Polish grammar error the validator cannot see | High | High | interview Q1; PRD FR-004/FR-005 guardrail "tasks are mathematically correct"; `archive/2026-10-12-generators-e3-e4/reviews/impl-review.md` (2 critical content findings missed by automated checks); hot-spot dirs `src/core` (44 changes/30d), `src/data` (28/30d) |
| 2 | After an update or a restart the progress is gone: stars, furnished room, stage, mastery | High | Medium | interview Q1; PRD FR-020, FR-021, US-04; roadmap S-11/S-12 (save and migrations not built yet) |
| 3 | The installed game does not start offline, serves a stale build, or ships wrong cache headers after a deploy | High | Medium | interview Q1, Q4 ("PWA and deploy checked only by hand"); PRD NFR offline start < 3 s; `archive/2026-10-11-installable-offline-pwa/plan.md` (manual tablet criteria); hot-spot dir `deploy` (21/30d) |
| 4 | A deploy or a bootstrap breaks the VPS shared with CoiledSpring or changes something outside its own scope | High | Low | interview Q3 ("deploy and the shared server"); `archive/2026-10-11-agent-ops-access/plan.md`; `deploy/README.md` section 9 scope promise |
| 5 | A curriculum data change (new stage, new parameters) yields a generator with no solutions, an empty step, or degenerate tasks | Medium | High | `archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` F11; roadmap S-03 next; hot-spot dir `src/data` |
| 6 | A scene contains player text or balance numbers, or `core/` imports Phaser: logic stops being testable and content stops being reviewable | Medium | Medium | AGENTS.md hard rules without lint enforcement; roadmap S-04+ (first scenes with text) |
| 7 | An imported save file (S-12) with malformed or malicious content crashes the game or corrupts the state | Medium | Low | PRD FR-022 (the only input from outside the game); PRD Access Control (no accounts, so no other abuse surface) |
| 8 | The server side is right, but the browser does not boot the game from the service worker cache once the network is gone (worker never takes control, a bundle is missing from the cache) | High | Medium | interview 2026-10-12 refresh ("offline start is checked only by hand"); PRD FR-001 and NFR offline start < 3 s; `archive/2026-10-11-installable-offline-pwa/plan.md` (offline start verified manually in a browser) |
| 9 | The "Obróć tablet" overlay does not appear in portrait, or stays over the game in landscape | Medium | Low | interview 2026-10-12 refresh; PRD FR-002; `archive/2026-10-11-installable-offline-pwa/plan.md` (overlay checked manually) |
| 10 | An update reloads the game mid-round or never takes over at the next launch, or (after S-11) the child's progress is gone after the new build takes over | High | Medium | interview 2026-10-12 refresh; PRD US-04 and FR-020; roadmap S-11 (save not built yet, so the state part waits for it) |
| 11 | The task round cannot be played to the end by touch: a tap misses its tile, a wrong answer gives no hint or second try, stars are not awarded (from S-04) | High | Medium | interview 2026-10-12 refresh; PRD US-01, FR-006, FR-007, FR-008; roadmap S-04 (first scene with player input) |
| 12 | The first launch cannot be finished by touch or ends on the wrong stage: an age tap misses, a tap on the adult gate reaches the game underneath, a wrong gate answer locks the parent out, the parent's choice is not the stage played, or the warm-up raises the stage, lowers it by more than one or below E1 | High | Medium | PRD FR-012, US-03 AC, success flow step 2; roadmap S-06; `archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` (proposed as #12); hot-spot dir `src/scenes` (57 changes/30d) |
| 13 | The adaptation does not lead the child: a round draws from outside the unlocked steps, a second try raises mastery, a step does not unlock once most of its skills are mastered, or the "Nowa umiejętność!" card blocks the next round | Medium | Medium | PRD FR-013, FR-014, US-01 AC (tasks within unlocked steps), FR-007; roadmap S-07; `archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` (proposed as #13) |
| 14 | A child enters parent settings by a tap or an ordinary hold, a tap under the parent dialog reaches the game, a parent's stage change does not take effect at once (next round still on the old stage, stars gone), or the panel claims automatic reading works when no Polish voice exists | High | Medium | PRD FR-015, FR-009, US-03 AC, Access Control; roadmap S-08; `archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md` (proposed as #14); observability audit 2026-10-13 H-6 |
| 15 | A thrown exception leaves a frozen screen without a word or dead touch, instead of the calm restart card | High | Medium | interview 2026-10-13 ("a round freezes with no trace"); PRD guardrails "Zero frustracji" and "Postęp nigdy nie ginie"; observability audit 2026-10-13 C-1/C-2 (closed) and its follow-up (PR #28: an early failure before the boundary is installed, no error code on the card) |
| 16 | Buying a renovation task takes stars twice on a repeated tap, takes them before "Wybieram" or when the panel only opens, or drives the balance below zero (from S-09) | High | Medium | interview 2026-10-13 (fear of losing stars or furniture); PRD FR-016, FR-017, US-02 AC (short of stars nothing is deducted), guardrail "nigdy utrata gwiazdek"; roadmap S-09 |
| 17 | In practice a child at ordinary accuracy waits too long for the next step, or one hard skill blocks a step, so the game feels stuck and drifts behind what school is doing | High | High | interview 2026-10-13 ("difficulty curve under-tested"); PRD success criterion "unlocked steps match school", FR-013, FR-014 (one hard skill must not block a step), FR-027; `archive/2026-10-13-observability-c1-c2/research.md` (model: a 3-skill step needs about 24 rounds at 70 % first-try accuracy); observability audit 2026-10-13 H-7/M-12; hot-spot dir `src/data` (112 changes/30d) |

High-impact × low-likelihood scenarios such as the VPS provider going down belong to observability, not tests; the deploy workflow's health check and `ssh martynka-ops status` already cover them.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|------|-----------------------------|----------------|--------------------------------------|-----------------------|-----------------------|
| #1 | Every task shipped to a stage has an answer that recomputes from its own prompt, hints whose arithmetic is right at every step, and nouns that agree with the number in every case | "The validator returned no violations, so the content is right" (it only knows dictionary nouns and nominative forms) | Which text positions are objects vs subjects, which noun forms exist in the dictionary, how `sample` is read and by whom | unit/property per generator + a written teacher-read checklist | asserting the answer the generator produced (oracle from the implementation) |
| #2 | A save written by version N loads identically in version N+1, and a failed migration leaves the old save untouched with an export offered | "The schema has not changed, so no migration test is needed" | Save format, version field, migration entry point, where autosave triggers, IndexedDB wrapper | unit round-trip + fixture saves per version | mocking the storage adapter so deeply that serialization is never exercised |
| #3 | After `switch`, the live site serves the new build id, the manifest and `sw.js` with no-cache, hashed bundles with immutable, and the precache lists exactly the current bundles | "Health check returned the title, so the deploy is fine" | Workflow steps after `switch`, Caddy header matchers, which files the service worker precaches | integration smoke in the deploy job (curl) for the server side; the browser side is #8 (local e2e); manual tablet check after PWA changes | running the browser e2e in CI (excluded by §7); local browser e2e is allowed and covers the browser side as #8 |
| #4 | Bootstrap and deploy touch only `/srv/martynka`, `martynka*` users, Caddy and UFW 80/443; CoiledSpring answers before and after | "`[ok]` lines mean nothing else changed" | What bootstrap writes, what `martynka-ops` can run, how CoiledSpring health is observed | integration smoke (status checks before/after) + local dispatcher tests already present | asserting on log lines instead of observable server state |
| #5 | Every skill in every stage produces 200 tasks without violations, parameters that cannot be satisfied are rejected at parse time, and no step with a group-1 type is empty | "The generator worked for E3, so new parameters are fine" | Rejection-sampling limits, shape/bridge/max feasibility, step → type lists | unit/property over curriculum data | a test that only checks the parser accepts the data |
| #6 | Lint fails when `src/core` imports Phaser or touches `window`/`document`, or when `src/data` imports anything from `core` except `core/text/*` and types | "Convention in AGENTS.md is enough" | Current import graph, which globals scenes legitimately use | lint rule (gate) | a custom script that re-implements what ESLint already does |
| #7 | Importing a malformed, oversized, or wrong-version file is rejected with a clear message and the current save is unchanged | "JSON.parse succeeding means the file is valid" | Import entry point, schema validation, summary shown before overwrite | unit (validation) + integration (import flow) | fuzzing without asserting the state stayed intact |
| #8 | After a first visit the worker controls the page; with the network cut, a reload answers the navigation and every bundle from the service worker, the game canvas is there and no page error is raised | "The deploy smoke checks the precache list, so the browser boots offline" | When the worker registers and takes control, what is precached, how the navigation fallback answers, how the production build is served locally | local e2e (Chromium); the deploy smoke stays for the server side | a green reload without checking fromServiceWorker proves nothing; going offline before the worker controls the page |
| #9 | A portrait viewport shows the overlay over a still-running canvas; a landscape viewport hides it | "The CSS rule exists, so the overlay works" | Where the overlay mounts, which media query drives it, which other overlays can cover the canvas | local e2e (same server as #8, about a second) | grepping the CSS text in a unit test; an Android device profile whose install hint covers the screen |
| #10 | The open page keeps the old build until the next launch, the next launch runs the new build and still boots offline; after S-11, stars, room and stage written under the old build are identical under the new one | "The build id changed, so the update worked" / "migration unit tests cover the update" | Update registration mode, old-cache cleanup, how two local builds get different ids, where autosave writes (after S-11) | unit for the save format (phase 4) + local e2e for the browser path | seeding state by writing IndexedDB directly instead of through the game; hard-coding the number of reloads before the new build appears |
| #11 | A round of 5 tasks tapped through the real touch path gives a star per task, a wrong tap gives a hint and a second try that still earns the star, a clean round gives the bonus | "The round logic is unit-tested, so the scene works" / "tapping fixed coordinates is enough" | How the test learns the correct answer without a DOM (read-only hook in an e2e-only build), coordinate mapping under scale FIT, touch detection | unit for round logic in `core` (TDD) + local e2e for the touch path | a DOM mirror of the round in the shipped build; asserting state the hook itself set; an Android device profile |
| #12 | Every age × month gives the stage from the placement table; the warm-up only lowers, by one, never below E1; a wrong gate answer gives a new problem without lockout; a tap under the gate dialog changes nothing in the game; the stage the parent confirms is the stage of the first round | "Placement logic has tests, so the screen works" / "a DOM overlay covers the canvas, so the canvas gets no touch" | Where the month comes from, how the warm-up is graded, how touch is forwarded from the window to Phaser, which input switch a dialog holds | unit (stage table × 12 months × 5 ages, warm-up grading, gate) + local e2e for the touch path with a fixed month | reading the gate answer from the hook instead of the dialog text; asserting on the month without fixing it |
| #13 | Over many seeds a round draws only from unlocked steps and the previous stage; only first tries move mastery; a step unlocks exactly when the required share of its skills reaches the threshold; after the unlock card "Dalej" starts a playable round | "The weights add up to 100, so the draw is right" / "the unlock card is a dialog like any other" | Bucket rules, mastery update per round, unlock rule, easing counters, how the card hands back to the round | unit/property in `core` over many seeds + one local e2e played to the unlock card | setting mastery from the test; one fixed seed; asserting task content |
| #14 | Only a hold of the full duration within the move tolerance opens the gate; taps under any parent dialog never reach the round; a stage change replaces the current round on the new stage and keeps the stars; auto-read survives the panel; the panel says when no Polish voice exists | "The hold is a timer, so a short hold cannot open it" / "the stage changed in the learner, so the next round uses it" | The hold reducer and its clock, the one input switch, how the round is rebuilt after a stage change, voice availability signal | unit in `core` (hold reducer, stage change, weakest-skill ranking, auto-read) + local e2e with touch through CDP | setting the stage through the hook; waiting a fixed time instead of for the dialog |
| #15 | A throw in a frame, during boot, or inside a dialog callback shows the restart card and stops the loop; touch is released even when the callback throws; browser noise does not show the card | "Phaser catches its own errors" / "the dialog closes first, so a throw cannot leave input held" | Where the boundary is installed relative to imports and narrator creation, which signals count as fatal, how a dialog callback runs inside an input session | local e2e with forced failures (e2e build only) + unit for the fatal-signal rule and input sessions + a source test that every dialog callback runs inside a session | forcing failures through a switch that ships in production; asserting the card text without asserting the loop stopped |
| #16 | Over every order of taps a confirmed choice deducts its cost exactly once; opening, cancelling or a tap while short deducts nothing; the balance never goes below zero; a repeated tap on "Wybieram" does not buy twice | "The button is greyed when short, so the balance cannot go negative" | Purchase state machine, where the cost lives, when the panel takes input, when the save is written (FR-020, after S-11) | unit/property on the pure purchase logic in `core` + one local e2e on the touch path after S-09 | asserting only the happy path; checking the counter label instead of the balance |
| #17 | A simulation drives the real round, mastery and curriculum functions with synthetic children of fixed first-try accuracy over many seeds and meets a range written from requirements (R = 2 rounds a session, maintainer 2026-10-13): a stage has about 120 rounds (20 school weeks × 3 sessions × 2 rounds); a 70 % child unlocks a step at a median of at most 120 ÷ (steps in the stage) rounds; a 60 % child unlocks every step within the stage budget at p90; a 90 % child needs at most half the 70 % budget; no single skill keeps a step locked | "Mastery rules are unit-tested, so the pace is fine" / "the range can follow whatever the balance numbers give" | Which functions a round runs between tasks, how easing interacts with unlock, step and skill counts per stage, where the balance numbers live | unit/property simulation (Vitest, seeded) | expected values read from the balance data (implementation mirror); widening the range when the simulation fails — a failure is the S-17 calibration signal |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the values below; the
orchestrator updates Status as artifacts appear on disk.

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|---|---|---|---|---|---|
| 1 | Quality gates and module boundaries | Lint (ESLint, boundary rules), typecheck and tests gate every edit, every turn and every PR; `sample` E1–E6 runs in CI as a content smoke | #6, #5 | lint, gates, content smoke | complete | `context/archive/2026-10-12-testing-quality-gates/` |
| 2 | Deploy and PWA smoke | The deploy job proves the new build is live with the right headers and precache, and that CoiledSpring still answers; rollback is exercised on a schedule | #3, #4 | integration (post-deploy smoke), manual tablet | complete | `context/archive/2026-10-12-testing-deploy-smoke/` |
| 3 | Content invariants | Property tests over all curriculum data (feasibility, no degenerate tasks, distribution sanity) and a teacher-read checklist for every new template | #1, #5 | unit/property, checklist | complete | `context/archive/2026-10-12-testing-content-invariants/` |
| 4 | Save, migrations, import, update keeps state | Round-trip and migration tests with fixture saves per version; import validation never loses the current save; a local e2e on two builds proves the new build takes over at the next launch with stars, room and stage intact (starts with roadmap S-11) | #2, #7, #10 | unit + integration + e2e (local only) | implementing | `context/archive/2026-10-13-autosave-versioned-save/` (S-11: format v1, migration chain, restart e2e; import validation waits for S-12, the two-build e2e for the first format change v2) |
| 5 | Local browser e2e | Playwright (Chromium) as a local gate: offline start (seed), touch round, first launch, adaptation, parent settings, error card, narrator; e2e-only read-only hook guarded out of the production build | #8, #11, #12, #13, #14, #15 (#9 never got a spec, see Phase 7) | e2e (local only) | complete | `context/archive/` S-04..S-08 and `2026-10-13-observability-c1-c2/` (delivered inside the slices) |
| 6 | Difficulty-curve simulation | A seeded simulation of synthetic children (60/70/80/90 % first-try accuracy) through the real round, mastery and curriculum logic, asserting the requirement-derived pace range of #17 | #17, #13 | unit/property | not started | — |
| 7 | Manual device checklist | A short iPad and Android checklist run by the maintainer for every change to touch handling or scenes: touch response, gate and hold by finger, error card, voice, the "Obróć tablet" overlay on rotation, offline start from the home screen | #9, #11, #12, #14, #15, #16 | manual | not started | — |

## 4. Stack

| Layer | Tool | Version | Notes |
|---|---|---|---|
| unit + property | Vitest | 5.0.4 | standalone `vitest.config.mts`, tests in `tests/`, seeded rng helpers in `tests/helpers.ts` |
| lint | ESLint + typescript-eslint | 10.12 | flat config `eslint.config.mjs`; boundary rules via `no-restricted-imports` / `no-restricted-globals` |
| typecheck | tsc | 5.7 | `npm run typecheck` covers `src`, `tests`, `scripts` |
| content smoke | `scripts/sample.ts` | repo | `npm run sample -- E1` … `E6` exit 1 on violations |
| deploy smoke | `scripts/check-deploy.ts` (Node fetch) in GitHub Actions | repo | `npm run check:deploy` after `switch` |
| e2e | Playwright (`@playwright/test`) | 1.64.0 | Chromium only, local gate only (never CI, §7). Two projects and two web servers in `playwright.config.ts`: `chromium` runs the seed against the production build on port 4398 (the service worker registers only there); `chromium-hook` runs the round specs against an `E2E_HOOK=1` build in `dist-e2e/` on port 4397, never reused (a stale server carries the same build id). Never port 4173. Desktop Chrome with `hasTouch`, no Android profile. Playwright cannot automate service workers in WebKit, so the iPad stays manual (Phase 7) |
| e2e build guard | `vite/e2eHookGuard.mjs` (Vite plugin) | repo | `npm run build` fails if any e2e marker (`__martynkaE2E`, `e2eMonth`, `e2eFail`, `e2e-forced-failure`) reaches `dist/`; the hook build fails if any is missing |
| difficulty-curve simulation | Vitest | none yet — see Phase 6 | seeded synthetic children over the real `core` round, mastery and curriculum functions |
| device checklist | manual (maintainer, iPad + Android) | none yet — see Phase 7 | replaces WebKit automation and performance timing (§7) |
| browser checks by the agent | Claude in Chrome | session tool | `npm run preview` + manual assertions; cannot drive the 2 s long press, so gestures use a throwaway Playwright spec in a gitignored `*.local` folder; not a gate |

**Stack grounding tools (current session):**
- Docs: Context7 — used for vitest 5 and vite-plugin-pwa facts in archived research, and for Playwright service-worker, offline and touch facts in the 2026-10-12 refresh; the Playwright 1.64 clock vs Phaser 4.2.1 tweens conflict comes from the S-06 plan review, not from docs; checked: 2026-10-12
- Search: Exa.ai / web fetch — used for Chrome/WebKit PWA behaviour; not needed in the 2026-10-13 refresh; checked: 2026-10-12
- Runtime/browser: Claude in Chrome — used for preview checks of PWA and overlays; not a gate; checked: 2026-10-13
- Provider/platform: `gh` (GitHub API, workflow runs) and `ssh martynka-ops` (VPS status) — quality-gate relevant for Phase 2; checked: 2026-10-13

## 5. Quality Gates

| Gate | Where | Required? | Catches |
|---|---|---|---|
| lint + typecheck | local (agent loop) + CI | required | boundary violations, type drift, unused code |
| unit + property | local (agent loop) + CI | required | generator and logic regressions |
| content smoke (`sample` E1–E6) | CI on PR | required | data changes that break generation or violate the validator |
| post-edit hook | local (agent loop) | required | lint and related-test failures at edit time |
| deploy smoke | GitHub Actions after `switch` | required | stale build, wrong headers, broken precache, CoiledSpring regression |
| local browser e2e (Playwright, Chromium) | local (agent loop gate, orchestrator runs it outside the sandbox), never CI | required (§3 Phase 5 complete) | offline start from cache, touch round, first launch, adaptation, parent settings, error card, narrator; update path after Phase 4 |
| e2e build guard | `npm run build` (local + CI) | required | an e2e hook, query parameter or forced failure leaking into the production bundle |
| difficulty-curve simulation | local + CI (part of the unit suite) | planned — required after §3 Phase 6 | a balance or curriculum change that makes steps unlock too slowly, too fast, or never |
| manual device check (iPad + Android) | maintainer, every change to touch handling or scenes; after PWA changes | required (manual) — checklist after §3 Phase 7 | install, iPad/WebKit offline start, real-device orientation and touch, gestures, voice, error card |
| pre-commit lint | local git hook | optional (not configured) | edits made outside the agent |

## 6. Cookbook Patterns

### 6.1 Adding a unit / property test for a generator

- **Location**: `tests/<generator>.test.ts`.
- **Reference test**: `tests/addSub.test.ts` with `tests/helpers.ts` (`forEachDraw`: 20 seeds × 50 draws, `validateTask` on every task, failures replay by seed).
- **Run locally**: `npx vitest run tests/<generator>.test.ts`.

### 6.2 Adding a content template or curriculum data

- **Invariants run automatically**: `tests/contentInvariants.test.ts` draws 1000 tasks per skill of every stage and checks the parser, the validator, the arithmetic of every hint line, that the answer appears in the last hint, number bounds (except CALENDAR, ROMAN, NUMBER_WORDS), no zero operands, degenerate shares (n − n, n : n ≤ 10 %), ·0/·1 only when allowed, variety (≥ 12 distinct tasks, most frequent ≤ 15 %). Thresholds are constants at the top of the file; a genuinely small task space (E1) is listed with its measured size in the `SMALL_SPACES` map in `tests/contentInvariants.test.ts`, never by lowering the global threshold. Number patterns in prompts follow `formatNumber.ts` (grouping with a non-breaking space from 5 digits).
- **Parsers reject infeasible data**: `parseAddSubParams` enumerates the shape values (`DU+DU` with `bridge: 'ten'` and `max: 30` throws), MULT/DIV/WORD check their minima; add the same to every new generator and register it in `parsers` next to `generators`.
- **Teacher read (manual, every PR touching `src/data/` or generators)**: `npm run sample -- <stage> --count 6`, read every task of the changed steps; numeral agreement and the accusative after verbs ("ma 1 naklejkę"), verb gender matching the name, sensible context, hints that teach the school method without giving the result away first, close but unambiguous distractors, every new noun in `src/data/nouns.ts` with its accusative in the context, prompts of 1–3 sentences. The checklist lives in `.github/pull_request_template.md` and in CLAUDE.md for the agent.
- **Reference**: `src/data/wordTemplates.ts` (`obj`, `verb`, `isAre`), `tests/wordTemplates.test.ts` (0–100 agreement sweep).

### 6.3 Adding a lint boundary rule

- **Location**: `eslint.config.mjs`, one config object per directory scope (`files: ['src/<dir>/**']`) with `no-restricted-imports` (paths, `patterns` with `regex` and `allowTypeImports`) or `no-restricted-globals`.
- **Reference test**: `tests/lint-boundaries.test.ts` — lints synthetic sources through the ESLint API with typed rules disabled and asserts the `ruleId`; add a positive and a negative case for every new rule.
- **Run locally**: `npm run lint` (whole repo, `--max-warnings 0`), `npx vitest run tests/lint-boundaries.test.ts`.
- **Do not**: write a custom import-graph script; scope rules by directory instead.

### 6.4 Adding a deploy smoke check

- **Location**: `scripts/deploy-check/parse.ts` (pure parsers and comparisons, unit-tested) and `scripts/check-deploy.ts` (fetch + report, exit 0/1/2).
- **Reference test**: `tests/deployCheck.test.ts` — sample `index.html` and `sw.js` fragments as constants, positive and negative cases per parser.
- **Run locally**: `npm run check:deploy -- https://martynka-urzadza.pl <sha7>` (`NODE_USE_ENV_PROXY=1` inside the agent sandbox); the deploy workflow runs it after `switch`.
- **Pattern**: assert observable server facts (status, headers, body literals), never log lines; keep the network layer thin so a new check is a parser plus a `record(...)` line.

### 6.5 Adding a save migration test

- TBD — see §3 Phase 4.

### 6.6 Adding a local browser e2e test

- **Location**: `tests/e2e/<flow>.spec.ts`; helpers in `tests/e2e/support/hook.ts` (read the hook, map scene coordinates, tap, answer) and `tests/e2e/support/welcome.ts` (reach a state through the product). A spec that needs the hook must match the `ROUND_SPEC` pattern in `playwright.config.ts` so it runs in `chromium-hook`; offline/PWA specs run in `chromium` against the production build.
- **Reference tests**: `tests/e2e/seed.spec.ts` (offline start: wait until the worker controls the page, go offline, reload, assert `fromServiceWorker()` on the navigation and the bundles), `tests/e2e/task-round.spec.ts` (touch round), `tests/e2e/parent-settings.spec.ts` (long press), `tests/e2e/error-boundary.spec.ts` (forced failures).
- **Reaching a state**: through the product only — `passWelcome` (parent path, stage E3, no warm-up) or `passWelcomeAsChild` (age tap, pinned month); never by writing storage or setting state through the hook. Fix the month with `?e2eMonth=0..11`; force a failure with `?e2eFail=step|boot|settings`. Both exist only in the e2e build.
- **Never `page.clock`**: a fixed clock freezes `Date.now()`, Phaser tweens read it for their delta, so tweens stop (camera shake stays offset, the star flight hangs). Pin dates through `?e2eMonth` instead. Wait for state through the hook, never for time.
- **Touch**: `tapScene` maps 1920×1080 scene coordinates through the canvas box and taps with the real touchscreen; `holdTouch` sends touch start/move/end over CDP (`Input.dispatchTouchEvent`) — its hold is the only fixed wait a spec may have, because the hold is the gesture. Desktop Chromium with `hasTouch`, never an Android device profile (its install hint covers the canvas).
- **Reading state**: only from the read-only hook (`window.__martynkaE2E`); a gate answer comes from the dialog text, never from the hook. A new hook field or query parameter must be added to the marker list in `vite/e2eHookGuard.mjs`, so the production build fails if it leaks and the hook build fails if it is dropped.
- **Proof of a new spec**: a deliberate break of the production rule (not a label or selector) as a `git apply` patch must turn the spec red. Chromium cannot start inside the agent sandbox, so an implementing subagent writes the spec and the patch, and the orchestrator runs green, applies the break, sees red and reverts (`context/foundation/autonomous-run.md`).
- **Below the browser**: a dialog callback that can throw is covered by a source test, `tests/dialogSessions.test.ts`, which parses `UIScene` and `WelcomeScene` with the TypeScript compiler API and requires every `onPass`/`onConfirm`/`onCancel` to run inside an input session (fixed count per file); add new callbacks there, not as another e2e.
- **Run locally**: `npx playwright test` (builds and serves both servers itself, about 15 s warm); one spec: `npx playwright test tests/e2e/<flow>.spec.ts`.

### 6.7 Adding a difficulty-curve simulation case

- TBD — see §3 Phase 6. Expected values come from the #17 range in §2, never from the balance data.

### 6.8 Running the device checklist

- TBD — see §3 Phase 7.

### 6.9 Per-rollout-phase notes

- Phase 5 (2026-10-12/13, delivered inside S-04..S-08 and `observability-c1-c2`): a fixed Playwright clock froze Phaser tweens, hence `?e2eMonth`; Chromium launches only sometimes from subagent sessions, hence the orchestrator-run break patches; Claude in Chrome cannot drive the long press, hence CDP touch. The rotate overlay (#9) never got a spec and moved to the device checklist.

- Phase 3 (2026-10-12): "last hint ends with the answer" was wrong for inverse-check hints (6 · 7 = 42 for 42 : 6), so the invariant is "the answer appears among the numbers of the last hint". Rejection sampling skews distributions: DIV drew quotient 1 uniformly and then rejected large products, inflating n : n to 17 %; drawing inside the feasible range fixed it. Measured baselines are in the archived research of this phase.
- Phase 2 (2026-10-12): Node's `fetch` ignores proxy environment variables; inside the agent sandbox the smoke needs `NODE_USE_ENV_PROXY=1` (CI has direct egress). `index.html` also preloads the Phaser chunk, so three bundles are checked. CoiledSpring cannot be observed from CI (tailnet ACL and the restricted key); the bootstrap checklist in `deploy/README.md` section 10 covers it.
- Phase 1 (2026-10-12): ESLint 10 needs `eslint.config.mjs` because `package.json` has no `"type": "module"`; the core `no-restricted-imports` rule already understands type-only imports (`allowTypeImports`), so the typescript-eslint variant is not needed. Programmatic linting in tests must spread `tseslint.configs.disableTypeChecked` into `overrideConfig` (flat objects, no `extends`). The baseline needed type predicates instead of `as` casts after `Array.isArray` checks.

## 7. What We Deliberately Don't Test

- **Visual snapshots of Phaser scenes** — brittle, and the art changes in M7. Re-evaluate after S-16 if layout regressions start slipping through manual checks. (Source: interview Q5.)
- **Browser e2e in CI** — the local Playwright gate (§3 Phase 5) plus the manual tablet check after deploys give the signal; CI e2e would cost more than it catches for a one-device product. Re-evaluate if a second device class appears. (Source: interview Q5; kept in the 2026-10-12 refresh.)
- **Scene looks and task content in browser e2e** — e2e asserts flows, never pixels or task text; looks stay manual (see snapshots above), task content is covered by unit/property invariants and the teacher read. (Source: interview 2026-10-12 refresh.)
- **Code coverage as a metric** — no threshold; risk scenarios decide what gets tested. (Source: interview Q5.)
- **Narrator voice quality** — no Polish voice never blocks a flow (PRD NFR); voice presence is a device-checklist item (Phase 7).
- **Performance tests and WebKit automation** — a desktop timing does not represent the target tablet (offline start < 3 s, touch < 100 ms), and Playwright cannot automate service workers in WebKit; both are checked by hand on the iPad and an Android tablet (§3 Phase 7). Re-evaluate if a device lab or WebKit service-worker support appears. (Source: interview 2026-10-13.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-10-13
- Stack versions last verified: 2026-10-13
- AI-native tool references last verified: 2026-10-13

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
