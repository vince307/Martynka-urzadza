# Handoff — `first-furniture-purchase` (slice S-09)

Written by the `research` step (`/10x-research first-furniture-purchase`, autonomous run 2026-10-13-s09-s11).
`research.md` answers the unknowns from change.md; status `preparing`. The one thing the next agent must not get wrong:
the balance moves to the registry as the one source (initialised in `main.ts` `preBoot`), `TaskScene` adds the DELTA
`state.starsEarned - before` in `syncStars` (the only two growth points are the paid answer and the round bonus in
`src/core/round.ts`), and `TaskScene.sessionStars` disappears — never two counters.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | 2: `77c94d4` change identity, then this `docs(first-furniture-purchase): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-furniture-purchase/research.md` | findings: balance ownership, purchase/panel reducer shape (risk #16), HUD input over the room, e2e hook extension, room geometry proposal, Phaser 4 particles + reduced motion, kit binding and copy, follow-ups |
| `context/changes/first-furniture-purchase/change.md` | frontmatter only: status `new` → `preparing` |
| `context/changes/first-furniture-purchase/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/first-furniture-purchase` |
| `grep REGISTRY_KEYS.stars / starsTotal` in `src`, `tests` | readers: `UIScene.create` (counter), `summaryView`, e2e `task-round.spec.ts`, `parent-settings.spec.ts` (`starsTotal`) |
| `grep scene.start/restart` in `src` | `TaskScene` started only by `BootScene.create` and `WelcomeScene`; never restarted |
| `node_modules/phaser` 4.2.1 types | `particles(x,y,texture,config)`, `ParticleEmitter.explode`, `Graphics.generateTexture` present; no reduced-motion API |
| gates | not run — docs-only step, no product code changed |

## 4. Next command

`/10x-plan first-furniture-purchase`

## 5. Open

- Product choices research recommends (plan decides, research.md `## Open Questions`): HUD speaker reads the current task label in the room (yes); `TaskScene.flyStar` honours reduced motion via one `src/ui/` helper with injected `matchMedia` (yes, plan §9 + kit); "Wróć do notesu" hidden while the variant panel is open (yes); slot list + cost curve 5–15 (`[human]`, change.md decision 2).
- Pre-existing gap found: `TaskScene.flyStar` ignores `prefers-reduced-motion` (plan §9, kit `.flying-star`).
- Follow-ups in scope (archive `2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`): `nextRoomTaskCost` in `TaskScene.currentSummary`; star in flight on `toRoom` (kill/finish before `scene.switch`). Shared HUD button: out of scope unless a HUD button changes.
- DESIGN-GAP rows to add from 31 in `docs/design-gaps.md` (a–e per change.md); rows 10 and 12 to update; `pl.room.caption`, `ROOM_LAYOUT.caption` to remove.
- Palette: oak `#C99B66` and terracotta `#C98460` (style guide) are not in `PLACEHOLDER_COLORS` yet; variants must differ beyond colour.
- `[human]` rows the plan carries: slots/costs, no sound in S-09 (FR-017 literal), room state session-only until S-11.
- Teacher read of every new Polish string.

## 6. Autonomous decisions

- Question/scope derived from change.md + handoff §5 (no AskUserQuestion, contract rule 1). Rejected: a broader re-survey. Would change: a new unknown surfacing in plan.
- No sub-agents: the scope (5 scenes, layout, hook, 2 core files) fit the main context; the skill defaults to 2–4 workers for multi-area scope. Rejected: parallel Explore workers (duplicate reading of the same small files). Would change: a larger codebase area.
- Recommended registry as the single balance (not a new core singleton): the registry already carries session state that S-11 will persist, and `UIScene` already listens to it. Would change: S-11 choosing a central store object instead.
