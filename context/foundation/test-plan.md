# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-10-12 (phases 1–3 complete)

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

Hot-spot scope used for likelihood weighting: `src`, `tests`, `scripts`, `deploy`, `vite`, `.github` (29 commits in the last 30 days; `src/core` 44 file changes, `tests` 37, `src/data` 28, `deploy` 21).

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

High-impact × low-likelihood scenarios such as the VPS provider going down belong to observability, not tests; the deploy workflow's health check and `ssh martynka-ops status` already cover them.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|------|-----------------------------|----------------|--------------------------------------|-----------------------|-----------------------|
| #1 | Every task shipped to a stage has an answer that recomputes from its own prompt, hints whose arithmetic is right at every step, and nouns that agree with the number in every case | "The validator returned no violations, so the content is right" (it only knows dictionary nouns and nominative forms) | Which text positions are objects vs subjects, which noun forms exist in the dictionary, how `sample` is read and by whom | unit/property per generator + a written teacher-read checklist | asserting the answer the generator produced (oracle from the implementation) |
| #2 | A save written by version N loads identically in version N+1, and a failed migration leaves the old save untouched with an export offered | "The schema has not changed, so no migration test is needed" | Save format, version field, migration entry point, where autosave triggers, IndexedDB wrapper | unit round-trip + fixture saves per version | mocking the storage adapter so deeply that serialization is never exercised |
| #3 | After `switch`, the live site serves the new build id, the manifest and `sw.js` with no-cache, hashed bundles with immutable, and the precache lists exactly the current bundles | "Health check returned the title, so the deploy is fine" | Workflow steps after `switch`, Caddy header matchers, which files the service worker precaches | integration smoke in the deploy job (curl) + manual tablet check after PWA changes | e2e browser run in CI (excluded by §7) |
| #4 | Bootstrap and deploy touch only `/srv/martynka`, `martynka*` users, Caddy and UFW 80/443; CoiledSpring answers before and after | "`[ok]` lines mean nothing else changed" | What bootstrap writes, what `martynka-ops` can run, how CoiledSpring health is observed | integration smoke (status checks before/after) + local dispatcher tests already present | asserting on log lines instead of observable server state |
| #5 | Every skill in every stage produces 200 tasks without violations, parameters that cannot be satisfied are rejected at parse time, and no step with a group-1 type is empty | "The generator worked for E3, so new parameters are fine" | Rejection-sampling limits, shape/bridge/max feasibility, step → type lists | unit/property over curriculum data | a test that only checks the parser accepts the data |
| #6 | Lint fails when `src/core` imports Phaser or touches `window`/`document`, or when `src/data` imports anything from `core` except `core/text/*` and types | "Convention in AGENTS.md is enough" | Current import graph, which globals scenes legitimately use | lint rule (gate) | a custom script that re-implements what ESLint already does |
| #7 | Importing a malformed, oversized, or wrong-version file is rejected with a clear message and the current save is unchanged | "JSON.parse succeeding means the file is valid" | Import entry point, schema validation, summary shown before overwrite | unit (validation) + integration (import flow) | fuzzing without asserting the state stayed intact |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the values below; the
orchestrator updates Status as artifacts appear on disk.

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|---|---|---|---|---|---|
| 1 | Quality gates and module boundaries | Lint (ESLint, boundary rules), typecheck and tests gate every edit, every turn and every PR; `sample` E3/E4 runs in CI as a content smoke | #6, #5 | lint, gates, content smoke | complete | `context/archive/2026-10-12-testing-quality-gates/` |
| 2 | Deploy and PWA smoke | The deploy job proves the new build is live with the right headers and precache, and that CoiledSpring still answers; rollback is exercised on a schedule | #3, #4 | integration (post-deploy smoke), manual tablet | complete | `context/archive/2026-10-12-testing-deploy-smoke/` |
| 3 | Content invariants | Property tests over all curriculum data (feasibility, no degenerate tasks, distribution sanity) and a teacher-read checklist for every new template | #1, #5 | unit/property, checklist | complete | `context/archive/2026-10-12-testing-content-invariants/` |
| 4 | Save, migrations, import | Round-trip and migration tests with fixture saves per version; import validation never loses the current save (starts with roadmap S-11) | #2, #7 | unit + integration | not started | — |

## 4. Stack

| Layer | Tool | Version | Notes |
|---|---|---|---|
| unit + property | Vitest | 5.0.4 | standalone `vitest.config.mts`, tests in `tests/`, seeded rng helpers in `tests/helpers.ts` |
| lint | ESLint + typescript-eslint | none yet — see Phase 1 | flat config; boundary rules via `no-restricted-imports` / `no-restricted-globals` |
| typecheck | tsc | 5.7 | `npm run typecheck` covers `src`, `tests`, `scripts` |
| content smoke | `scripts/sample.ts` | repo | `npm run sample -- E3` exits 1 on violations |
| deploy smoke | curl in GitHub Actions | none yet — see Phase 2 | after `switch`, before `status` |
| e2e | none | — | excluded (§7); manual tablet checks after PWA/scene changes |
| browser checks by the agent | Claude in Chrome | session tool | `npm run preview` + manual assertions; not a CI gate |

**Stack grounding tools (current session):**
- Docs: Context7 — used for vitest 5 and vite-plugin-pwa facts in archived research; checked: 2026-10-12
- Search: Exa.ai / web fetch — used for Chrome/WebKit PWA behaviour; checked: 2026-10-12
- Runtime/browser: Claude in Chrome — used for preview checks of PWA and overlays; not a gate; checked: 2026-10-12
- Provider/platform: `gh` (GitHub API, workflow runs) and `ssh martynka-ops` / `ssh cs-ops` (VPS status) — quality-gate relevant for Phase 2; checked: 2026-10-12

## 5. Quality Gates

| Gate | Where | Required? | Catches |
|---|---|---|---|
| lint + typecheck | local (agent loop) + CI | required | boundary violations, type drift, unused code |
| unit + property | local (agent loop) + CI | required | generator and logic regressions |
| content smoke (`sample` E3/E4) | CI on PR | required | data changes that break generation or violate the validator |
| post-edit hook | local (agent loop) | required | lint and related-test failures at edit time |
| deploy smoke | GitHub Actions after `switch` | required | stale build, wrong headers, broken precache, CoiledSpring regression |
| manual tablet check | after PWA or scene changes | required (manual) | install, offline start, orientation, touch |
| pre-commit lint | local git hook | optional (not configured) | edits made outside the agent |

## 6. Cookbook Patterns

### 6.1 Adding a unit / property test for a generator

- **Location**: `tests/<generator>.test.ts`.
- **Reference test**: `tests/addSub.test.ts` with `tests/helpers.ts` (`forEachDraw`: 20 seeds × 50 draws, `validateTask` on every task, failures replay by seed).
- **Run locally**: `npx vitest run tests/<generator>.test.ts`.

### 6.2 Adding a content template or curriculum data

- **Invariants run automatically**: `tests/contentInvariants.test.ts` draws 1000 tasks per skill of every stage and checks the parser, the validator, the arithmetic of every hint line, that the answer appears in the last hint, number bounds (except CALENDAR, ROMAN, NUMBER_WORDS), no zero operands, degenerate shares (n − n, n : n ≤ 10 %), ·0/·1 only when allowed, variety (≥ 12 distinct tasks, most frequent ≤ 15 %). Thresholds are constants at the top of the file; lower them with a comment when a stage's task space is genuinely small (E1).
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

### 6.6 Per-rollout-phase notes

- Phase 3 (2026-10-12): "last hint ends with the answer" was wrong for inverse-check hints (6 · 7 = 42 for 42 : 6), so the invariant is "the answer appears among the numbers of the last hint". Rejection sampling skews distributions: DIV drew quotient 1 uniformly and then rejected large products, inflating n : n to 17 %; drawing inside the feasible range fixed it. Measured baselines are in the archived research of this phase.
- Phase 2 (2026-10-12): Node's `fetch` ignores proxy environment variables; inside the agent sandbox the smoke needs `NODE_USE_ENV_PROXY=1` (CI has direct egress). `index.html` also preloads the Phaser chunk, so three bundles are checked. CoiledSpring cannot be observed from CI (tailnet ACL and the restricted key); the bootstrap checklist in `deploy/README.md` section 10 covers it.
- Phase 1 (2026-10-12): ESLint 10 needs `eslint.config.mjs` because `package.json` has no `"type": "module"`; the core `no-restricted-imports` rule already understands type-only imports (`allowTypeImports`), so the typescript-eslint variant is not needed. Programmatic linting in tests must spread `tseslint.configs.disableTypeChecked` into `overrideConfig` (flat objects, no `extends`). The baseline needed type predicates instead of `as` casts after `Array.isArray` checks.

## 7. What We Deliberately Don't Test

- **Visual snapshots of Phaser scenes** — brittle, and the art changes in M7. Re-evaluate after S-16 if layout regressions start slipping through manual checks. (Source: interview Q5.)
- **Browser e2e in CI** — the manual tablet check after deploys plus the agent's Chrome preview checks give the signal; CI e2e would cost more than it catches for a one-device product. Re-evaluate if a second device class appears. (Source: interview Q5.)
- **Code coverage as a metric** — no threshold; risk scenarios decide what gets tested. (Source: interview Q5.)
- **Narrator voice quality** — no Polish voice never blocks a flow (PRD NFR); checked on devices in M2.

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-10-12
- Stack versions last verified: 2026-10-12
- AI-native tool references last verified: 2026-10-12

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
