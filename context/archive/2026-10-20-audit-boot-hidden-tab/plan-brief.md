# Boot limit counts only visible time, "Ups!" card with a code, no site-data advice after NewerSave — Plan Brief

> Full plan: `context/changes/audit-boot-hidden-tab/plan.md`
> Research: `context/changes/audit-boot-hidden-tab/research.md`

## What & Why

Three findings of the 2026-10-17 observability audit, scoped by the maintainer (run scope § 2). H-1: the boot load limit
runs on the wall clock, while Phaser's loader queue stops in a hidden tab, so switching apps during the first start cuts
the pictures and the parent panel blames the internet. I-1: the "Ups!" card shows only the build, so a parent cannot
report what broke. Z-8: a forced import/reset refused because a newer save exists advises deleting site data — which
would delete that newer save.

## Starting Point

`src/core/bootLimits.ts` + `BootScene.preload` arm two window timers on `performance.now()`; `bootLoad` records
`elapsedMs` only. `mountErrorCard` draws `Wersja <id>`; `generateTask` rethrows as a plain `Error` and checks tiles and
picture limits outside its `try`. `Autosaver.replace` sets `blockedBy 'newer'` silently and `failureText` maps any forced
failure to `siteDataAdvice`.

## Desired End State

Hiding the game during loading pauses both limits; `bootLoad.hiddenMs` records it; a cut of a load that was ever hidden
shows a calm "w tle" line (gap 153), never "internet". The "Ups!" card reads `Kod: RangeError/E3.9.x · Wersja abc1234`.
A refused replace shows "Nowsza wersja gry zapisała już postępy…" and the refusal card; no advice to delete data.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| What H-1 changes | Slow line and total cut count visible time only; per-file XHR limit unchanged | Hidden in-flight downloads still progress; only the queue stalls | Research (R-2) / change D-1 |
| Hidden signal | `BootScene`'s own `visibilitychange` listener; timers cleared on hide, re-armed on show | Pure rule in core, `main.ts` handler untouched | Plan (A-2) |
| Panel wording | Background cut line whenever `hiddenMs > 0` (DESIGN-GAP 153) | Scope: never blame the internet in that case; no new number | Plan (A-3) |
| Card code | `name` or `name/skillId` on the existing muted line via `pl.saveFailed.detail` | Reuses gap 51's line; one place for codes | change D-3 |
| Skill id | `generateTask` keeps cause name + `skillId`; tiles and `assertDrawable` inside the `try` | Cheap, no rng change | change D-4, research R-3 |
| Z-8 scope | Only `NewerSave` (the only refusal that reaches `replace`); `deviceNewer` forced or not | Other writers are refused only in normal mode | Research (R-4) / Plan (A-5) |
| Refused replace | `refuseWrites('newer')` → existing refusal card once | Same path as an ordinary refused write | change D-5 |
| Save format | Stays v4; all new state runtime-only | Run hard limit | Scope PA-5 |

## Scope

**In scope:** H-1 (rule, scene, `hiddenMs`, panel line), I-1 with C-1/C-2/C-3/I-3, Z-8; docs, gap 153, follow-ups; three e2e specs.

**Out of scope:** every other audit finding (H-6 log label, MEDIUM/LOW rows), per-file limit, hidden-time cap, `main.ts`
visibility handler, error card copy, `replaceGate`/`writeVerdict`, save-format changes.

## Architecture / Approach

Pure rules first, test-led (`bootLimits.ts` hidden span, `artHealthLines` background flag, `errorCode` + skill-carrying
`generateTask`, `replace` refusal + `failureText`), then thin wiring (`BootScene`, `UIScene`, `errorCard`, `main.ts`,
`TaskScene.drawPrompt`), then docs/seam sweep, then one e2e per risk in the hook build.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Visible-time rule (tdd) | Hidden span + hidden-aware due/wait | Rewrites a pinned test on purpose |
| 2. BootScene wiring (impl) | Listener, re-arm, `hiddenMs` in `bootLoad` and hook | No unit proof; e2e phase 8 |
| 3. "Obrazki" background line (tdd) | `artCutBackground`, gap 153 | Wording (teacher read) |
| 4. Error code + skill id (tdd) | `errorCode`, `generateTask` errors, `assertDrawable` | Seeds must not move |
| 5. Card shows `Kod:` (impl) | `mountErrorCard` code, C-1 | DOM only; e2e phase 9 |
| 6. Refused replace (tdd) | `refuseWrites`, `deviceNewer` | Card under the dialog until close |
| 7. Docs + seam sweep (impl) | CLAUDE.md, gaps 29/51/71, follow-ups | — |
| 8. e2e #15 hidden tab | Faked visibility + stallall | Proves rule, not the real stall |
| 9. e2e #15 card | Exact `Kod:` line | — |
| 10. e2e #2 Z-8 | Dialog text + refusal card | May need a `newer-replace` seam |

**Prerequisites:** branch `feat/audit-boot-hidden-tab`; baseline unit 3683, e2e 141 (measured per phase).
**Estimated effort:** ~10 short agent sessions (one per phase).

## Open Risks & Assumptions

- Real-device hidden-tab behaviour is inferred from Phaser source; the [human] row 2.6 checks it on a tablet.
- A cut after a hidden span may really be a slow link; the panel says "w tle" then (A-3).
- The refusal card shows only after the dialog closes; focus checked in the visual gate.

## Success Criteria (Summary)

- A child who switches apps during the first start comes back to a load that continues, not to stand-in pictures.
- A parent sees a short code on the "Ups!" card to report.
- No dialog ever advises deleting site data when a newer save exists.
