# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Martynka urządza" is a math-practice + room-decorating game for children in grades 1–3 (inspired by Gossip Harbor's loop): the child solves age-appropriate maths tasks in rounds of 5 to earn stars, then spends stars on renovation tasks and picks one of 3 visual variants per furniture slot. On first launch the game asks the child's age and maps it to a curriculum stage (E1–E6 = grade × semester); difficulty then adapts per skill. There is no merge board anymore. Target is a landscape tablet, touch only, installable offline PWA. No backend; progress is saved locally.

**`Martynka-urzadza.md` is the authoritative design and plan (in Polish).** Read it before starting any milestone. It defines the data model, task screen, room flow, save format, PWA requirements, asset naming and the M0–M8 milestones.

**`docs/ZADANIA.md` is the maths task catalogue** (stages E1–E6, ordered steps, task types with number ranges, generator data model). Task generators and `src/data/curriculum/` must follow it. `docs/zrodla/` holds reference notes from the analysed textbooks: never copy textbook tasks into the game, only generate original tasks of the same types. That folder is gitignored (local only, the repository is public); do not reference its contents from committed files.

## Current state

Milestone M0 shell (roadmap F-01): Phaser 4.2.1, Vite 6.4, TypeScript 5.7. `src/main.ts` builds the game config (1920×1080, `Scale.FIT` + `CENTER_BOTH`, scene list); `src/scenes/BootScene.ts` is an empty scene drawing a code placeholder; `src/data/layout.ts` and `src/data/pl.ts` hold scene constants and Polish strings; `src/core/types.ts` holds the domain types from plan section 5. `src/ui/widgets/`, `src/storage/` and `tests/` exist but are empty. The template's demo scenes, assets and telemetry script are gone. Deploy pipeline exists (`deploy/`, `.github/workflows/deploy.yml`; see Deployment below). Not yet present: PWA (manifest, service worker), vitest, eslint, persistence. Progress is tracked in `context/foundation/roadmap.md`.

## Commands

```bash
npm install
npm run dev          # Vite dev server on http://localhost:8080 (add `-- --host` to open it on a tablet)
npm run build        # production build to dist/ (vite/config.prod.mjs, terser)
npm run preview      # serve the production build
npm run typecheck    # tsc --noEmit; Vite does not type-check during dev or build
```

There is no test or lint script yet. Once vitest is added (roadmap F-03), run a single test with `npx vitest run tests/addSub.test.ts` or `npx vitest run -t "<test name>"`.

Vite configs live in `vite/config.dev.mjs` and `vite/config.prod.mjs`. Both use `base: './'` and split Phaser into its own chunk. Files in `public/` are served at the root, so Phaser loader paths look like `assets/...`.

## Target architecture (from the plan)

- `src/core/`: pure TypeScript game logic (task generators, curriculum/mastery/round/placement, rooms, save/migrations, seeded rng) with **no Phaser imports**, so it can be tested with vitest.
- `src/data/`: all content and tuning as data (curriculum stages E1–E6, word-problem templates, logic puzzles, rooms/slots/renovation tasks, `balance.ts` numbers, `pl.ts` strings). Adding a room, curriculum step or task template should only touch `data/` plus assets.
- `src/scenes/`: Boot, Welcome (age + warm-up), Task (round of 5 tasks), Room and UI (an overlay with the star counter and the tasks/room switch). Scenes only render state and forward player actions to `core/`. Reusable widgets (keypad, answer tiles, clock, ruler, coins, number line) live in `src/ui/widgets/`.
- `src/storage/idb.ts`: IndexedDB persistence, plus JSON export and import.
- Base resolution is 1920×1080 with `Phaser.Scale.FIT` + `CENTER_BOTH`. Slot coordinates in room data are in this space.
- The save state is versioned (`SaveState.version`) and needs a migration function in `core/save.ts`. Autosave runs on state changes (debounced about 500 ms) and on `visibilitychange`.

## Working rules (from the plan, section 14)

- Implement milestones in order, one milestone per commit or PR. After each one, verify the production build and offline behaviour.
- Write logic in `core/` with tests first, then the scene.
- Scenes must not contain balance numbers or player-facing text. Those come from `data/`.
- Code identifiers and comments are in English. All in-game text is in Polish, kept short, with large readable UI.
- No energy, timers, ads, purchases, accounts, or fail states.
- Use placeholders drawn in code (coloured shapes with a label) until art arrives. Real art follows the naming in plan section 10. Clock, ruler, number line, base-ten blocks and written-column layouts are drawn in code.
- Player-facing Polish text must use correct numeral agreement (1 jabłko, 2 jabłka, 5 jabłek). Wrong answers never remove stars and never show harsh "wrong" feedback.
- The Phaser 4 API is close to v3, but the renderer and filters are new. For anything non-obvious, check the v4 docs (e.g. via context7) rather than relying on v3 knowledge.

## Agent tooling and workflow (10xDevs, imported from CoiledSpring)

`.claude/` (skills, hooks, settings, course prompts) is gitignored: it lives only on the maintainer's machine, like in CoiledSpring. `.10x-cli.json` and `.claude/.10x-cli-manifest.json` belong to `@przeprogramowani/10x-cli`, which updates the `10x-*` skills.

- **Hooks** (`.claude/settings.json` → `.claude/hooks/`): after every Write/Edit, ESLint on that file and `vitest related`; at the end of a turn, ESLint on changed files, `npx tsc --noEmit` and the whole Vitest suite. ESLint and Vitest steps are no-ops until those tools are installed (M1 adds vitest); `tsc` runs as soon as `node_modules` exists. A failing hook sends the agent back once.
- **10x chain** (`/10x-*` skills; project documents go to `context/foundation/`, in-flight changes to `context/changes/<id>/`, archived ones to `context/archive/`; never hand-write files in `context/`):

  ```
  /10x-shape → /10x-prd → /10x-tech-stack-selector → /10x-bootstrapper → /10x-agents-md → /10x-roadmap
  → (per milestone) /10x-new → /10x-research → /10x-plan → /10x-plan-review → /10x-implement | /10x-tdd → /10x-impl-review → /10x-archive
  ```

  Module 3: `/10x-test-plan` → `/10x-tdd`, `/10x-configure-hook`, `/10x-e2e-setup` + `/10x-e2e`, `/10x-observability-audit`. `/10x-autonomous-run` needs a project profile in `context/foundation/autonomous-run.md` + `.env`, written by `/10x-autonomous-run --setup` after the local gate (tsc, vitest, build) and CI exist; the first run is a dry run of one milestone.
- **Inputs for the chain**: `Martynka-urzadza.md` (design and plan), `docs/ZADANIA.md` (task catalogue) and `designs/` (visual pack, read-only) are the sources for `/10x-shape` and `/10x-prd`. The plan's milestones M0–M8 are the roadmap; a `/10x-roadmap` output must not contradict them. The stack is fixed by the plan (Phaser 4 + Vite + TypeScript, vitest, vite-plugin-pwa, idb-keyval): `/10x-tech-stack-selector` only records it.
- **Deployment** (roadmap F-02, runbook `deploy/README.md`): every push to `main` runs `.github/workflows/deploy.yml`: build + typecheck, then an ephemeral Tailscale node (`tag:ci`) rsyncs `dist/` over SSH to the `martynka` user on the Hostinger VPS shared with CoiledSpring (`/srv/martynka/releases/<id>`, `switch` flips the `current` symlink, 5 releases kept, `workflow_dispatch` → `rollback`). The user's only command is `deploy/martynka-deploy` (sshd `ForceCommand`); `deploy/bootstrap.sh` (root, idempotent) installs Caddy, rrsync, the user, UFW 80/443 and `/etc/caddy/Caddyfile`. Caddy serves `current` on 80/443 at https://martynka-urzadza.pl (`www.` redirects to the apex; before DNS existed it used a Let's Encrypt IP certificate, `profile shortlived`, which `bootstrap.sh --site <IPv4>` still supports). CoiledSpring stays tailnet-only and untouched. Process (decided 2026-10-11): every change goes branch → push → PR → merge on GitHub; nobody merges or pushes `main` locally; the merge is what deploys. Secrets: `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`; variable `DEPLOY_SITE_URL`. The agent's own VPS account is `martynka-ops` (runbook section 10): `ssh martynka-ops <cmd>` as a single plain command (no `cd &&`, pipes or `$(…)`, otherwise it stays in the sandbox) with `help`, `status`, `diag`, `caddy-logs`, `caddy-validate`, `caddy-reload`, `rollback`, `switch <id>`, `sync`, `bootstrap`; after merging changes to `deploy/` run `sync` then `bootstrap`. GitHub: plain `gh …` commands likewise run outside the sandbox. Secrets and the GitHub Actions variables stay the maintainer's.
