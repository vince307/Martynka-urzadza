# Stale-tab save guard, UI art health, music status and service-worker install signal — Plan Brief

> Full plan: `context/changes/stale-tab-and-health/plan.md`
> Research: `context/changes/stale-tab-and-health/research.md`

## What & Why

The observability audit 2026-10-16_0915 found four HIGH gaps: a stale tab or an older build of the same save format
silently overwrites newer progress (B-1), the UI pictures have no health record (G-1), music that failed or waits for a
tap shows as "Włączone" (S-1), and a failed service-worker registration or install is swallowed (P-1). Each breaks
"Postęp nigdy nie ginie" or lets the parent's panel claim health the game does not have.

## Starting Point

`guardedPut` (`src/storage/idb.ts`) refuses only a stored record of a strictly higher `version`; equal versions pass.
Runtime health records exist for task art, room art and sound effects, read once by `UIScene.openSettings`.
`registerServiceWorker` has no listener and `.catch(() => undefined)`.

## Desired End State

A window that saved later always wins: a stale window stops saving and the child sees a calm "restart" card; every
running build from #69 on meets the new save as "newer" and stops. The parent's panel says whether the game starts
offline and whether a newer version took over, names missing screen pictures, and tells why music is silent.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| B-1 approach | Save format v4: `generation` + `writer` compare-and-set in the one IDB transaction, plus `controllerchange` record and child card | Only a version bump reaches already-running v3 builds; the CAS covers same-build tabs without browser APIs | Research |
| Ship v4 | Ship to production; `[human]` row to accept or reverse | Maintainer chose full ship at Step 0 | Orchestrator |
| `deploy/README.md` | Docs-only rollback note naming v4 | Precedent 27406ab | Orchestrator |
| Who stamps | Store stamps and tracks `base`; pure `writeVerdict` in core | Only the transaction knows the stored generation atomically | Plan |
| Block reason | New `'otherTab'`; `replaceGate` blocks it | Parent tells "other window" from "newer version"; no import from a stale window | Plan |
| Child card | For `newer` and `otherTab`, once per load, one restart button | Refusals become more frequent; FR-020 | Research |
| Backup policy | Unchanged (`backup-v3` overwritten by a later migration) | The latest raw v3 is more recent progress; P-8 re-triggered | Plan |
| Worker build id | Not added; `controllerchange` is a record, no prompt | FR-003 forbids an update prompt | Research |
| UI art record | New `REGISTRY_KEYS.uiArtHealth`, never `artHealth` | `artHealth` feeds `artFilter` (wallet must not skip MONEY_PAY) | Research |
| S-8, S-6 | In, light; S-6 first to drop | Same "Dźwięki" section | Research |
| E2E seams | None new: two real pages, real worker install, `page.route` abort | Less seam surface | Plan |

## Scope

**In scope:** v4 format + migration + fixture; CAS in `guardedPut` (+ B-7); `otherTab` block, health line, child card
(B-2); service-worker status reducer, offline section (P-1, B-8), install-hint listener (F4); UI-art line (G-1, L-6,
L-8); music status (S-1, S-3, S-11); S-8, S-6; docs, follow-ups, seam sweep; two e2e specs.

**Out of scope:** Web Locks / `BroadcastChannel`; worker build id; update prompt; P-8; two-build e2e; card order;
heading alignment; other sound, art and smoke findings (follow-ups).

## Architecture / Approach

Core owns the rule (`writeVerdict`, `stepSw`, view functions), the store owns atomicity, the autosaver owns the block
state; every health record follows the runtime-record pattern (registry key outside `SAVE_KEYS` → `openSettings` →
pure view → DOM view, copy in `pl.ts`, DESIGN-GAP rows 116-121).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Format v4 + rule (tdd) | `SAVE_VERSION` 4, `MIGRATIONS[3]`, `save-v4.json`, `writeVerdict` | Fixture literals in four e2e specs |
| 2. CAS in `guardedPut` (tdd) | Atomic refusal, stamping, writer id | Self-refusal after an abandoned write |
| 3. `otherTab` block (tdd) | Block state, `onBlocked`, parent line | `replaceGate` callers |
| 4. Child card (impl) | `saveRefusedCard` once per load | Existing `newer` e2e meets the card |
| 5. SW reducer (tdd) | `swStatus`, registration events, F4 | First install fires `controllerchange` |
| 6. Offline section (impl) | `offlineView` in the panel | Panel length |
| 7. UI art health (tdd) | `uiArtHealth`, third line, section state | Feeding `artFilter` by mistake |
| 8. Music status (tdd) | `waiting-unlock`, `musicLine` | Sound specs asserting `loading` |
| 9. S-8, S-6 (impl) | Honest effects count, prefs-not-kept line | — |
| 10. Docs + sweep (impl) | CLAUDE.md, README note, follow-ups, `[human]` v4 | Stale "v3" text |
| 11. Stale tab e2e (#2) | Two pages, one context | Request-file protocol |
| 12. Health lines e2e (#8, #14) | Real worker install, aborted picture | Install time in Chromium |

**Prerequisites:** branch `feat/stale-tab-and-health` from `main` 9a64fd6; e2e run by the orchestrator.
**Estimated effort:** 12 phase sessions (10 code, 2 e2e) plus review and ship.

## Open Risks & Assumptions

- v4 is a one-way door: a rollback below this build plays without saving; reversing needs v5.
- First writer wins: the window that saves second loses its session since load (card explains).
- Running v3 tabs stop without a card; pre-#69 builds are unreachable.
- iPadOS home-screen storage separation unverified (does not change the rule).

## Success Criteria (Summary)

- Two windows: the stale one never overwrites the newer stars, and the child sees the restart card.
- The parent's panel names offline readiness, a missing screen picture and silent music truthfully.
- v1-v3 saves load as v4 with every star, purchase and learner field intact.
