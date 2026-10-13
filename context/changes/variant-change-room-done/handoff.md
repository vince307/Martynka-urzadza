# Handoff — `variant-change-room-done` (slice S-10)

Written by the `research` step (`/10x-research variant-change-room-done`): `research.md` resolves the eight unknowns of
change.md with code evidence and gives plan recommendations. The next agent must not let the variant-change branch of
`stepPanel` return `bought` (the only branch in `RoomScene.dispatch` that writes `stars`), and must pick a route to a
finished room for e2e/visual gate (96 stars; recommended `?e2eStars` seam in the hook build).

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | 2 on the branch after this step (`docs(variant-change-room-done): change identity (autonomous run)`, `docs(variant-change-room-done): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/variant-change-room-done/research.md` | Research: child hold numbers and wiring (mirror `UIScene.feed`), slot boxes and `slotAt` hit-test, `stepPanel` change branch, change-mode button in `ROOM_LAYOUT.taskButton`, card + `ROOM_ORDER`/`roomsListView` data shape, narration, e2e hook fields and `e2eStars` seam, V1 caption fix |
| `context/changes/variant-change-room-done/change.md` | Status `new` → `preparing`, `updated` stamped (metadata guard only) |
| `context/changes/variant-change-room-done/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/variant-change-room-done` |
| `node .claude/skills/10x-research/scripts/metadata-guard.mjs mark-researched …` | `{"changed":true}` |
| Gate suites | not run: docs-only step, no code changed (baseline on main 36ead3c per contract: unit 1035 passed, e2e 24 passed — inherited, unverified) |

## 4. Next command

`/10x-plan variant-change-room-done`

## 5. Open

- Product choices for the plan (each a `[human]` row): child hold `balance.roomHold` (recommended `holdMs 600`, `moveTolerance 40`); `?e2eStars=N` seam (`src/testing/e2eHook.ts` parser like `e2eMonth`, marker in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`); card button target; card auto-read; copy ("Wygląd"/"Gotowe" precedent from the non-bound `designs/martynka-evolution-v1/preview.js`, teaser line).
- DESIGN-GAP rows to add from 37 in `docs/design-gaps.md`: hold feedback (static outline of the held slot), change-mode button/state, "Pokój gotowy!" card, rooms list with teaser, card narration.
- Follow-ups in scope (`context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md`): hold + card, F4 `pl.room.name` on the list, F5 `RoomScene.snapshot` via `this.room()`, V1 caption anchors in `SALON_PLACEHOLDERS` + layout test, V2 rug pop at the visual gate (needs 35 stars).
- Input resets the plan must cover in `RoomScene`: sleep, panel open, card open, suspended input (`InputSuspender.suspended`, pointers are reset on release so no `up` arrives).
- Test-plan risk #16: add the property "no event sequence in change mode changes `stars` or `tasksDone`".
- E2E phases: subagents use the request-file protocol for `npx playwright` (profile §8); add the new spec to `ROUND_SPEC` in `playwright.config.ts`.

## 6. Autonomous decisions

1. Question derived from change.md (no AskUserQuestion): the eight unknowns + hold e2e testability. Rejected: re-scoping. Would change: a maintainer note on disk narrowing S-10.
2. Recommended hold numbers 600 ms / 40 px from platform defaults (Android 400–500 ms, iOS 0.5 s) and the adult rule's comment; rejected 2000 ms (adult deterrent) and ≤ 400 ms (child taps become holds). Would change: the device check.
3. Recommended `?e2eStars` seam over 14 played rounds (96 stars at 7 per clean round, `room-purchase.spec.ts` budgets 4 rounds in 120 s). Rejected: writing IndexedDB (profile §9) and long specs. Would change: the maintainer forbidding new e2e query params.
4. Treated `designs/martynka-evolution-v1` as a non-binding precedent (profile §6 binds `martynka-maths-A-v1` only). Would change: profile §6 adding that pack.
5. Ran two read-only Explore subagents (e2e hold/hook; spec text) in parallel; findings merged into research.md.
