---
title: Autonomous run profile — Martynka urządza
status: confirmed        # draft → confirmed (only `references/setup.md` § Prove flips it)
skill_version: 6
created: 2026-10-12
updated: 2026-10-15
env: context/foundation/autonomous-run.env
---

# Autonomous run profile — Martynka urządza

Everything `/10x-autonomous-run` needs to know about THIS project. The skill itself is stack-agnostic; every
agent of every run reads this file (via the run's `agent-contract.md`). Written by the setup interview
(`.claude/skills/10x-autonomous-run/references/setup.md`), edited in place afterwards (foundation convention).
The sibling `autonomous-run.env` holds the same commands as shell variables for the skill's scripts — the
interview writes both; when you edit one by hand, edit the other.

## 1. Repo

| | |
|---|---|
| Absolute path | `/Users/kamilp/Dev/Martynka-urzadza` |
| Main branch | `main` (protected: PR required, status `check` required, no force push) |
| Branch naming | `feat/<change-id>` (fixed by the skill) |
| Commit convention | Conventional Commits; messages in Polish; PR bodies in Polish; code identifiers and comments in English |
| Package manager / runner | `npm` (Node 22; TypeScript scripts run with `node --import tsx`) |
| Rule files every agent reads | `CLAUDE.md`, `AGENTS.md` (they point to `Martynka-urzadza.md`, `docs/ZADANIA.md`, `context/foundation/prd.md`, `context/foundation/test-plan.md`) |

## 2. Local gate — in this order, every implement/tdd/e2e phase, before the phase commit

The same steps as `.github/workflows/ci.yml` (the required PR check).

| Gate | Command | ~time | Counts parsed for the baseline |
|---|---|---|---|
| lint | `npm run lint` | 3 s | pass/fail |
| typecheck | `npm run typecheck` | 3 s | none |
| unit / integration | `npm test && bash deploy/test-martynka-deploy.sh && bash deploy/ops/test-martynka-ops.sh && npm run sample -- E1 && npm run sample -- E2 && npm run sample -- E3 && npm run sample -- E4 && npm run sample -- E5 && npm run sample -- E6` | 5 s | `Tests +[0-9]+ passed` |
| build | `npm run build` (also checks that the production bundle has no e2e hook: prints `e2e hook: absent (N chunks checked)`, fails the build otherwise) | 5 s | pass/fail |
| database tests | none | | none |
| smoke (against the gate server) | none (the content smoke `sample` E1–E6 needs no server and runs in the unit gate) | | none |
| e2e (only when § 11 says E2E=on) | `npx playwright test` (two servers, both started by Playwright through `webServer` in `playwright.config.ts`: the production build on the gate port 4398 for the seed (risk #8) and the e2e-hook build on 4397 for the round spec (risk #11); never start a server for it, never 4173) | 15 s | `[0-9]+ passed` |

After a migration: none. Migration on data (`POST_MIGRATION_ON_DATA_CMD`): none (no database; the save format and its
migrations arrive with roadmap S-11 and are tested as unit tests, test-plan.md rollout phase 4).
Baseline = `.claude/skills/10x-autonomous-run/scripts/baseline.sh` output; agents always report `baseline + delta`, never absolute counts.

Content rule on top of the gate: any change to `src/data/` or `src/core/tasks/generators/` needs the teacher read
from `CLAUDE.md` (Working rules) — `npm run sample -- <stage> --count 6`, every task of the changed steps read as
a Polish primary-school teacher would. The validator only knows dictionary nouns; two critical content bugs in
S-02 were caught only by this read. In an unattended run a review agent does it and records it in impl-review.

## 3. Dev servers and ports

| | |
|---|---|
| Start a dev/preview server on a given port | `npx vite --config vite/config.dev.mjs --port {port} --strictPort` |
| Extra env/flags needed for a SECOND instance | none (`--strictPort` per instance) |
| Gate/smoke port | `4398` |
| Visual-gate port | `4399` |
| E2E hook server port | `4397` (`E2E_HOOK_PORT`): the e2e build with the test hook (`dist-e2e/`), started by Playwright, not protected, killed after the run (`lsof -ti tcp:4397 -sTCP:LISTEN \| xargs kill` if it lingers) |
| Ports the run must NEVER use or kill (the maintainer's) | `8080` (`npm run dev`), `4173` (`npm run preview`), `4321`, `5000`, `5433`, `7000`, `54321`–`54324`, `54327` (other projects, Docker, macOS) |
| Kill a run server | `lsof -ti tcp:<port> -sTCP:LISTEN \| xargs kill` — LISTEN sockets only: a bare `lsof -ti :<port>` also returns the browser's client connections and kills Chrome (found 2026-10-13, run s04-s08); one port per call |

Note: the service worker is registered only in production builds; checks of `sw.js` need `npm run build` +
`npm run preview -- --port <port>` on a run port, never on 4173.

## 4. Database

| | |
|---|---|
| Provider | none (no backend; progress is saved in IndexedDB on the device) |
| Local instance — probe that it is up | none |
| Local reset | none |
| Migrations directory + naming rule | none (save-format migrations are code in `src/core/save.ts`, roadmap S-11) |
| Hosted instance — auth check | none |
| Hosted push (dry-run form first) | none |
| Local = remote check | none |
| Hosted identifier (so nothing else is ever touched) | none |
| Rules a migration must obey | none yet; from S-11: a save written by version N loads in N+1, a failed migration keeps the old save (PRD FR-021) |
| Live-DB experiments | none |

## 5. CI, deploy and the standing ship authorisation

| | |
|---|---|
| CI | GitHub Actions: workflow `CI` (job `check`) on every pull request — required status on `main`; workflow `Deploy` (jobs `build`, `deploy`) on every push to `main` |
| CI workflow that decides "red main" (`CI_WORKFLOW`) | `Deploy` — the only workflow that runs on `main` (lint, typecheck, test, build, deploy, post-switch smoke); `CI` runs on PRs only |
| CI reported through commit statuses (`CI_STATUS_CONTEXT`) | none — the forge's runs/checks decide |
| Run CI on a sha (`CI_RUN_CMD`, `{sha}`) | none — the forge runs CI on every PR push |
| CI logs (`CI_LOG_CMD`, `{sha}`, `{job}`) | none (`gh run view <id> --log-failed`) |
| Deploy provider | GitHub Actions → Tailscale → rsync to the VPS shared with CoiledSpring, Caddy at https://martynka-urzadza.pl (`deploy/README.md`) |
| Deploy a merged sha (`DEPLOY_CMD`, `{sha}`) | none — the merge to `main` deploys |
| How the run watches a production deploy | `gh run watch {run} --repo vince307/Martynka-urzadza --exit-status` ({run} = the Deploy run of the merge sha); its `Smoke check (deploy)` step proves the build id, cache headers, manifest and precache |
| Production sha before the merge (`PROD_CURRENT_SHA_CMD`) | none |
| Verify production after the deploy (`PROD_VERIFY_CMD`, `{sha}`) | none — the Deploy job's smoke step already verifies; a manual re-check is `npm run check:deploy -- https://martynka-urzadza.pl <sha7>` (`NODE_USE_ENV_PROXY=1` in the agent sandbox) |
| Rollback (`PROD_ROLLBACK_CMD`, `{prev_sha}`) | none — human only: Actions → Deploy → Run workflow → `rollback` (or `ssh martynka-ops rollback`) |
| Standing authorisation | granted 2026-10-12 by the maintainer (vince307): push `feat/*` and `docs/*` branches, open PRs, merge to `main` (= deploy) and watch the Deploy run — no hosted DB (none exists). Each run's Step 0 still asks "full ship or stop at open PR"; the first run stops at the PR |
| Limits that always hold | no force-push, no direct push to main, no `--no-verify`, no merge on red/pending, no production-only commands (`gh workflow run deploy.yml`, `ssh martynka-ops rollback`, `ssh martynka-ops switch`, `ssh martynka-ops bootstrap`, `ssh martynka-ops sync`, `ssh cs-ops *` — every production command), no hosted reset, no rollback; changes under `deploy/` are never shipped by a run (they need `sync` + `bootstrap` with the CoiledSpring checklist, a human step) |

## 6. Design source of truth

| | |
|---|---|
| Kit / spec (read-only) | `Martynka-urzadza.md` (authoritative plan), `docs/ZADANIA.md` (task catalogue), `designs/martynka-maths-A-v1/style-guide.md` (art pack, read-only) |
| Prototype / views to screenshot against | `designs/martynka-maths-A-v1/screenshots/` and `designs/martynka-maths-A-v1/preview.html` |
| Copy source | `src/data/pl.ts` (UI strings), `src/data/wordTemplates.ts` (word problems), `src/data/calendar.ts` |
| Tokens / colours rule | colours only from `src/data/layout.ts` (`PLACEHOLDER_COLORS`, `PAGE_BACKGROUND`), art-pack palette; no player text or balance numbers in scenes (lint and AGENTS.md) |
| Shared components dir(s) | `src/ui/widgets/`, `src/ui/dom/` |
| Missing UI/copy in the kit | `DESIGN-GAP` comment + gap row in `docs/design-gaps.md` (created on the first gap); never invented |

## 7. Data, fixtures, accounts

| | |
|---|---|
| Data that must never enter the repo | `docs/zrodla/` (textbook notes; never read or referenced from committed files), textbook tasks of any kind, `.env*` |
| Fixtures agents use | none (generators use the seeded rng; `npm run sample` prints tasks) |
| Local test account | none (no accounts in the product) |
| Secrets | none in the repo; GitHub Actions secrets and the variable `DEPLOY_SITE_URL` stay the maintainer's |

## 8. Environment traps (sandbox, OS, tooling)

- Commands that need the Bash sandbox DISABLED here: `gh *`, `git push/fetch/pull *`, `ssh martynka-ops *`, `ssh cs-ops *`, the skill scripts — already in `excludedCommands`; they work only as plain single commands (no pipes, no `&&`, no `$(…)`).
- `gh pr create`: use `--body-file` with a path in the session scratchpad (not `$TMPDIR`); backticks in `--body` break the command.
- `git checkout -b` / `git branch -D` print `could not lock config file .git/config`: harmless (upstream config); use `--no-track`.
- `tsx` CLI fails on its IPC socket in the sandbox: always `node --import tsx …` (the npm scripts already do).
- Node `fetch` ignores proxy variables: in the sandbox prefix network scripts with `NODE_USE_ENV_PROXY=1` and allow the domain.
- npm cache: `npm_config_cache="$TMPDIR/npm-cache"` (the sandbox cannot write `~/.npm/_cacache`).
- `.claude/hooks/*` is not writable from sandboxed Bash (Edit tool works); never edit hooks during a run.
- The sandbox `grep` (ugrep) rejects backreferences.
- Headless Chromium (Playwright) cannot start inside the sandbox on macOS (`MachPortRendezvousServer … Permission denied`): `npx playwright *` must run with the sandbox DISABLED. `npx playwright *` is in `excludedCommands` (2026-10-12) and works in the orchestrator session as ONE plain command (no `cd &&`, pipes or env prefix). In subagent sessions it works only sometimes (run 2026-10-12-s04-s08: denied, sandboxed, then fine in S-08): e2e-driver phases keep the request-file protocol (the agent writes the spec + break patches, the orchestrator runs them), and a subagent never disables the sandbox for it on its own.
- Claude in Chrome cannot drive the Phaser long press (synthetic pointer/touch events are ignored): the visual gate screenshots gestures with a throwaway Playwright spec reusing `tests/e2e/support/*` against the hook build on 4399, kept in a gitignored `*.local` folder and moved out before the lint gate.
- `npx playwright install chromium` writes `~/Library/Caches/ms-playwright` (outside the sandbox); already done once on this machine.
- Claude in Chrome ignores window resize: portrait checks go through a same-origin iframe of the given size.
- Run 2026-10-13-s12-s14: from a subagent the plain `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts …` (absolute config path, cwd outside the repo) launched Chromium in 4 of ~20 sessions (S-12 p7, S-13 p6, two reviews); otherwise MachPort. Every phase gate therefore re-ran e2e in the orchestrator session. The full suite now takes ~3.3 min (46 tests); `adaptive.spec` with drag rounds runs close to its 180 s limit. Phaser's image loader fetches through `blob:` object URLs — a test that classifies responses must check the URL scheme first.
- Run 2026-10-14-fix-art-stand-in: phase agents (sonnet) could not launch Chromium in 9 of 9 sessions; the two review agents (impl-review, visual) could. The orchestrator ran e2e at every gate and committed both e2e phases from their request files. An e2e spec in `test.describe.configure({ mode: 'serial' })` stops at the first failure, so a break expected to turn several tests red must be checked by running each expected-red test alone (`-g "<title>"`). The full suite takes ~3.7 min (52 tests).
- Run 2026-10-13-s09-s11: subagent sessions could not launch Chromium in 16 of 18 tries (MachPort); the request-file protocol (agent writes spec + `git apply` break patches, the orchestrator runs them, a finishing agent commits) carried every e2e phase. A sandboxed `npm install` with `allowed_domains: ["registry.npmjs.org"]` worked in a subagent.
- Run 2026-10-14-save-s13b-s15-s14b: the full e2e suite (63–77 tests) under 6 workers failed in 4 of ~10 orchestrator runs on load-sensitive tests (adaptive #13 180 s limit, parent-settings #14 random drag/hold timing — now pinned via `?e2eSkills`, `openWelcome` timeouts), each green alone or on re-run. From S-15 p4 every gate ran `npx playwright test --config=<abs> --workers=4` (~5 min, 0 flakes in ~20 runs). Phase agents (sonnet) launched Chromium in ~6 of ~35 sessions; the request-file protocol carried every e2e phase, and the orchestrator fixed 3 spec defects at the green run (wrong dialog button, retype paying a star, a proposed stage's "(propozycja)" label). An archive move can leave a CLAUDE.md path into `context/changes/` — run `validate-rule-files.sh` after the archive.
- Hooks: a per-edit ESLint + related-tests hook and an end-of-turn gate (lint, tsc, vitest) send the agent back once.

## 9. Screenshots (visual gate)

| | |
|---|---|
| Desktop / mobile widths | 1440 / 1024 (landscape tablet, 1024×768; the game does not support phones or portrait) |
| Mobile trick if the browser cannot go that narrow | same-origin iframe: `document.body.append(iframe)` with `src="/"`, fixed width/height (e.g. 1024×768, and 420×760 for the "Obróć tablet" overlay) |
| Playwright fallback auth flow | none — public routes |
| Reaching UI states | through the product, never by writing to IndexedDB; e2e-only shortcuts exist in the hook build only: `?e2eMonth`, `?e2eFail`, `?e2eStars=N` (fresh start only, S-10), `?e2eSave=unreadable` (S-11) |
| Fresh device in e2e | since S-11 saves persist: a reload or a second page in the same browser context resumes the saved game; a fresh device is a NEW browser context (`browser.newContext()`); never open or clear IndexedDB from a test, read it back through the hook's read-only `save` status |
| Reaching the room in e2e | the HUD room switch exists only BETWEEN tasks: answer (or retype) the open task first, then tap `roomSwitch` (two specs in run 2026-10-13-s09-s11 failed on this) |
| Hook target points | interior points of a shape, never an edge: page↔game scaling at 1280×720 is fractional, an edge point can land outside (S-10 `holdPoint` fix) |

The game renders into one Phaser canvas: assert visuals by screenshot, text checks only for DOM overlays (`src/ui/dom/`).

## 10. Rule-file validation and clean tree

| | |
|---|---|
| Files `scripts/validate-rule-files.sh` checks | § 1 rule files + every `context/runs/*/agent-contract.md` |
| Path roots it recognises | `\.claude|\.github|src|docs|context|tests|scripts|deploy|public|vite|designs` |
| Paths asserted on purpose although absent | none (`public/assets` exists since S-14 phase 2, 2026-10-14; `src/storage/idb.ts` since S-11) |
| Clean-tree allow-list (the maintainer's uncommitted entries) | none |
| Human-checklist file (run close appends point 4 of the report; optional) | `docs/human-checklist.md` |

## 11. Module 3 status

| | |
|---|---|
| E2E | `on` — local gate only (`context/foundation/test-stack.md` § E2E, seed `tests/e2e/seed.spec.ts`); `context/foundation/test-plan.md` § 7 still excludes browser e2e in CI (refresh 2026-10-12) |
| Hooks | `.claude/hooks/lint-edited-file.sh` (PostToolUse Write/Edit, ESLint `--max-warnings 0`), `.claude/hooks/related-tests.sh` (`vitest related`), `.claude/hooks/end-of-turn.sh` (Stop: ESLint on changed files, `tsc`, `vitest run`) |
| Test plan | `context/foundation/test-plan.md` present (rollout phases 1–3 complete, phase 4 after S-11) |
| Closing audit default (`RUN_AUDIT`) | `static` |
| On failure (`RUN_ON_FAILURE`) | `park` — park: WIP pushed, PR left open, independent slices continue |

## 12. Proven on

`2026-10-12` (E2E on) — on branch `feat/e2e-local-gate` at `d03a2ae` + the e2e setup: `validate-rule-files.sh` PASS
(89 paths), `baseline.sh` line: `lint OK; typecheck OK; unit OK Tests  441 passed; build OK; e2e OK 1 passed`. Deliberate
break: JS bundles removed from the precache globs → the seed fails (`data-build` empty after the offline reload); restored.

`2026-10-12` — on branch `docs/autonomous-run-profile` at `104e6a9` (the profile's own PR): `validate-rule-files.sh` PASS
(77 paths, 2 planned paths allow-listed), `tree-clean.sh` CLEAN, `baseline.sh` line:
`lint OK; typecheck OK; unit OK Tests  236 passed; build OK`; `preflight.sh`: every line PASS/SKIP/NOTE except
the three that only main can satisfy (profile confirmed, on main, main = origin) — re-run on `main` after the merge.
Deliberate breaks: a missing rule file → `validate-rule-files.sh` FAIL; `GATE_UNIT="false"` → `baseline.sh` `unit FAIL`;
an uncommitted edit → `tree-clean.sh` DIRTY. Production slots: none (rollback is human, see § 5).
