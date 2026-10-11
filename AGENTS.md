# Repository Guidelines

"Martynka urządza" is a Polish maths-practice and room-decorating game for grades 1–3: Phaser 4 + TypeScript + Vite, an offline-installable PWA for a landscape tablet, no backend. Plan: @Martynka-urzadza.md (authoritative, Polish). Task catalogue: @docs/ZADANIA.md. PRD: @context/foundation/prd.md. Working rules: @CLAUDE.md.

## Hard rules

- Implement milestones M0–M8 from @Martynka-urzadza.md section 11 in order, one milestone per commit or PR. Never reorder them.
- `src/core/` must not import Phaser. Write its logic with vitest tests first, then the scene.
- Scenes contain no balance numbers and no player-facing text; both live in `src/data/` (`balance.ts`, `pl.ts`, `rooms.ts`, `curriculum/`).
- Never copy textbook tasks; generate original ones per @docs/ZADANIA.md. Never reference `docs/zrodla/` from committed files (gitignored, local only).
- No energy, timers, ads, purchases, accounts, or fail states. Wrong answers never remove stars.
- Polish numerals must agree (1 jabłko, 2 jabłka, 5 jabłek). Code identifiers and comments are English.
- Phaser 4 differs from v3 in renderer and filters; check the v4 docs before non-obvious APIs.
- `designs/` is read-only art. `.claude/` is gitignored.

## Project structure

Current state is the untouched Phaser Vite template (`src/game/scenes/*.ts`, 1024×768). Target layout (plan section 4): `src/core/` (pure logic), `src/data/`, `src/scenes/`, `src/ui/widgets/`, `src/storage/idb.ts`, `tests/`. Base resolution 1920×1080 with `Phaser.Scale.FIT`. Files in `public/` are served at the root, so loader paths look like `assets/...`. `context/` holds 10x workflow documents; never hand-write files there.

## Commands

- `npm install`
- `npm run dev-nolog` — Vite on http://localhost:8080 (`npm run dev` also pings gryzor.co via `log.js`; M0 removes it).
- `npm run build-nolog` — production build to `dist/`.
- `npx tsc --noEmit` — type-check; Vite does not.
- `npx vitest run tests/<name>.test.ts` — once vitest lands in M1. No lint or test script exists yet.

## Coding style

TypeScript strict with `noUnusedLocals` and `noUnusedParameters` (@tsconfig.json). Four-space indentation. Scene files are PascalCase (`TaskScene.ts`); one generator file per task type in `src/core/tasks/generators/` (`addSub.ts`), each a pure function `(params, rng) => Task` using the seeded rng.

## Testing

Vitest in `tests/`, planned from M1. Each skill gets a 1000-draw property test: results in range, no negatives, bridging matches params, distractors differ from the answer, correct Polish inflection. After every milestone verify the production build and offline behaviour.

## Commits and PRs

Commit messages are Polish with a conventional prefix (`chore:`, `docs:`, `feat:`). Branch, then PR to `main` at github.com/vince307/Martynka-urzadza. Deploy is a static `dist/` build pushed by GitHub Actions to a VPS behind Caddy (@CLAUDE.md).
