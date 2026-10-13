# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by the `research` step (`/10x-research observability-c1-c2`, autonomous run 2026-10-13-fix-observability).
`research.md` answers the five questions and leaves no blocking unknowns. Next agent: this is a NON-ROADMAP change, so never
edit roadmap statuses. The boundary needs **both** `error` and `unhandledrejection`, because boot runs inside Phaser's FontFace
promise. The C-2 input release cannot be seen in e2e once the card holds input, so prove it in vitest.

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2`, cut from `main` at `a34aeee` |
| Commits | 2 on the branch: `docs(observability-c1-c2): change identity (autonomous run)`, `docs(observability-c1-c2): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/observability-c1-c2/research.md` | Research: Phaser 4 error carriers (RAF step, DOM input, font promise) and benign events, plus a pure classifier shape; every suspender holder with its close → callback → release order and throw points; testing split (vitest pure, e2e via `?e2eFail=` with a generalised build guard); H-7 encodings and unlock-speed numbers; H-6 narrator API; card design and DESIGN-GAP rows 29–30 |
| `context/changes/observability-c1-c2/change.md` | frontmatter `status: new → preparing`, `updated` (helper script only) |
| `context/changes/observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| read `node_modules/phaser/src/dom/RequestAnimationFrame.js` `step`/`stepTimeout` | `callback(time)` before `requestAnimationFrame(step)`; timeout mode schedules first (verified) |
| read `node_modules/phaser/src/loader/filetypes/FontFile.js` `onProcess` | `.then(onProcessComplete)` / `.catch(console.warn + onProcessComplete)` (verified); boot-time throw path leads to `unhandledrejection` (inferred, not runtime-traced) |
| grep `try {`/`catch (`/`.then(` in `node_modules/phaser/src` (worker) | no catch around the loop, scenes, events, timers, input dispatch |
| grep `loss`, `mastery` in `src/`, `tests/`, docs | 5 encodings; `tests/curriculumEnd.test.ts` warm-up test (4 → 3) and the `balance.mastery` pin were missed by change.md |
| `node $TMPDIR/sim.mjs`, `node $TMPDIR/mc.mjs` (scratch, not committed) | attempts/rounds-to-unlock tables in research.md §4 |
| `metadata-guard.mjs inspect` / `mark-researched` | changed: true |
| gate suites | not run, because this is a docs-only step with no product code |

## 4. Next command

/10x-plan observability-c1-c2

## 5. Open

- Plan decides (research.md "Open Questions"): helper `holdSession` vs `finally` per holder; `game.loop.sleep()` on the card; `audio: { noAudio: true }`; `AbortError`/`NotAllowedError` rejections benign or not; the H-6 option shape (`watchVoice` subscription recommended).
- Build guard: `vite/e2eHookGuard.mjs` `checkE2EHook` knows only `__martynkaE2E`. The `e2eFail` trigger needs its own marker and a guard extended to a marker list, plus `tests/e2eHookGuard.test.ts` cases.
- A new e2e spec must be added to `playwright.config.ts` `ROUND_SPEC`, otherwise it runs without the hook.
- `tests/e2e/parent-settings.spec.ts` uses `silenceSpeech`, so the new no-voice line appears there. Check its assertions over the reading block.
- H-7 test edits: `tests/mastery.test.ts` (header, two "lowers" tests, the `['second','retype']` → 0 case gives `undefined` if the miss branch stops writing mastery, the `balance.mastery` pin) and `tests/curriculumEnd.test.ts` (`MASTERY`, the warm-up "mastery did change" assertion).
- Docs: PRD FR-013, `docs/ZADANIA.md` § 1, `src/data/balance.ts` comment; DESIGN-GAP rows 29 (error card) and 30 (no-voice line).
- New Polish strings need a `[reviewer]` teacher read. The card copy must not promise kept progress (PRD "Postęp nigdy nie ginie" holds only from S-11).
- Follow-ups to write: S-17 calibration (H-7 unlocks at 60–70 % accuracy in about 14–35 rounds); closed: S-06 "`mountInstallHint` lets a tap through", S-05 e2e-hook room targets (already `null` in `installE2EHook` `targets`).

## 6. Autonomous decisions

1. Scope derived from change.md (decisions 1–7 and handoff §5) without asking. Rejected: re-scoping to M-1/M-2. Why: the research found no evidence that M-1 is reachable without a card once the boundary exists. Would change: the plan finds a non-throwing path to M-1.
2. Delegated Q1 (Phaser) and Q2/Q3 (suspender, e2e infra) to two read-only workers and re-checked the decisive anchors myself (`RequestAnimationFrame.step`, `FontFile.onProcess`, `openSettingsPanel` confirm order, `installE2EHook` `targets`). Rejected: trusting worker reports unverified. Would change: nothing; the method only.
3. H-7 was quantified with a simple independent-trials model (value iteration plus Monte Carlo, easing ignored), as the step prompt asked. Rejected: a full-round simulation with easing and earlier-step draws. Why: it is enough to show the order of magnitude, and S-17 owns calibration. Would change: S-17 needs exact numbers.
4. The two archived follow-ups were marked closed from repo evidence instead of carrying them into the plan. Would change: a reviewer finds a path the code inspection missed.
5. Next step is `/10x-plan`, as the step prompt fixes it.
