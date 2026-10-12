---
title: Autonomous run profile — Martynka urządza
status: confirmed        # draft → confirmed (only `references/setup.md` § Prove flips it)
skill_version: 6
created: 2026-10-12
updated: 2026-10-12
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
| unit / integration | `npm test && bash deploy/test-martynka-deploy.sh && bash deploy/ops/test-martynka-ops.sh && npm run sample -- E3 && npm run sample -- E4` | 5 s | `Tests +[0-9]+ passed` |
| build | `npm run build` | 5 s | pass/fail |
| database tests | none | | none |
| smoke (against the gate server) | none (the content smoke `sample` E3/E4 needs no server and runs in the unit gate) | | none |
| e2e (only when § 11 says E2E=on) | none | | none |

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
| Ports the run must NEVER use or kill (the maintainer's) | `8080` (`npm run dev`), `4173` (`npm run preview`), `4321`, `5000`, `5433`, `7000`, `54321`–`54324`, `54327` (other projects, Docker, macOS) |
| Kill a run server | `lsof -ti :<port> \| xargs kill` (macOS `lsof` rejects `:A :B`; one `-ti` per port) |

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
- Claude in Chrome ignores window resize: portrait checks go through a same-origin iframe of the given size.
- Hooks: a per-edit ESLint + related-tests hook and an end-of-turn gate (lint, tsc, vitest) send the agent back once.

## 9. Screenshots (visual gate)

| | |
|---|---|
| Desktop / mobile widths | 1440 / 1024 (landscape tablet, 1024×768; the game does not support phones or portrait) |
| Mobile trick if the browser cannot go that narrow | same-origin iframe: `document.body.append(iframe)` with `src="/"`, fixed width/height (e.g. 1024×768, and 420×760 for the "Obróć tablet" overlay) |
| Playwright fallback auth flow | none — public routes |
| Reaching UI states | through the product, never by writing to IndexedDB |

The game renders into one Phaser canvas: assert visuals by screenshot, text checks only for DOM overlays (`src/ui/dom/`).

## 10. Rule-file validation and clean tree

| | |
|---|---|
| Files `scripts/validate-rule-files.sh` checks | § 1 rule files + every `context/runs/*/agent-contract.md` |
| Path roots it recognises | `\.claude|\.github|src|docs|context|tests|scripts|deploy|public|vite|designs` |
| Paths asserted on purpose although absent | `public/assets` (art lands in M7, roadmap S-16), `src/storage/idb.ts` (IndexedDB save, roadmap S-11) — both named in CLAUDE.md's target architecture |
| Clean-tree allow-list (the maintainer's uncommitted entries) | none |
| Human-checklist file (run close appends point 4 of the report; optional) | `docs/human-checklist.md` |

## 11. Module 3 status

| | |
|---|---|
| E2E | `off` — no `test-stack.md`; `context/foundation/test-plan.md` § 7 excludes browser e2e in CI |
| Hooks | `.claude/hooks/lint-edited-file.sh` (PostToolUse Write/Edit, ESLint `--max-warnings 0`), `.claude/hooks/related-tests.sh` (`vitest related`), `.claude/hooks/end-of-turn.sh` (Stop: ESLint on changed files, `tsc`, `vitest run`) |
| Test plan | `context/foundation/test-plan.md` present (rollout phases 1–3 complete, phase 4 after S-11) |
| Closing audit default (`RUN_AUDIT`) | `static` |
| On failure (`RUN_ON_FAILURE`) | `park` — park: WIP pushed, PR left open, independent slices continue |

## 12. Proven on

`2026-10-12` — on branch `docs/autonomous-run-profile` at `104e6a9` (the profile's own PR): `validate-rule-files.sh` PASS
(77 paths, 2 planned paths allow-listed), `tree-clean.sh` CLEAN, `baseline.sh` line:
`lint OK; typecheck OK; unit OK Tests  236 passed; build OK`; `preflight.sh`: every line PASS/SKIP/NOTE except
the three that only main can satisfy (profile confirmed, on main, main = origin) — re-run on `main` after the merge.
Deliberate breaks: a missing rule file → `validate-rule-files.sh` FAIL; `GATE_UNIT="false"` → `baseline.sh` `unit FAIL`;
an uncommitted edit → `tree-clean.sh` DIRTY. Production slots: none (rollback is human, see § 5).
