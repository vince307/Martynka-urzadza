# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by the visual-gate step: every [visual] row captured and verified (`VISUAL: PASS`), no production code changed, full local gate green including e2e (33 passed, run in this session). Next is archive then ship; the three [human] rows stay open and go to the PR / human checklist, they do not block shipping.

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | phases `fb2e7bb`..`a44f3b4`, review fix `d455c40`, review `8af55af`, this visual-gate commit `docs(save-observability-c1-c2): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): 4.5, 5.9, 5.10 — all [human] |
| Working tree | clean after the commit (throwaway spec moved to the session scratchpad, `dist-e2e/` is gitignored) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-observability-c1-c2/screenshots/*.png` | 18 frames: 9 states × desktop 1440×900 / tablet 1024×768 |
| `context/changes/save-observability-c1-c2/screenshots/README.md` | capture method, state table, how each state was reached |
| `context/changes/save-observability-c1-c2/reviews/visual-review.md` | verdicts, hand-checked "Ostatni zapis" time, text read, observations O1–O3, VISUAL line |
| `context/changes/save-observability-c1-c2/plan.md` | [visual] rows 4.6 and 5.8 ticked |
| `context/changes/save-observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| throwaway Playwright spec (`tests/e2e/visual.local/`, hook build on 4399) | 10 passed (5 flows × 2 sizes), frames written; folder moved out before the lint gate |
| `npm run lint`, `npm run typecheck` | clean / clean |
| unit (`npm test` + deploy + ops tests + `sample` E1–E6) | 1176 passed (baseline 1142 on main, +34 slice, +0 this step); deploy OK, ops OK; samples `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | 33 passed (baseline 29, +4), on `8af55af`, Chromium launched in this session |
| Hand check | "Ostatni zapis: 17:34" vs hook `lastWriteAt 1791905692543`: 1791905692 − 1791849600 (2026-10-13 00:00 UTC) = 56092 s = 15:34:52 UTC, +2 h CEST = 17:34 ✓ (tablet 17:35 likewise) |
| Deliberate break | none in this step (no code changed; nothing new to protect) |
| Servers | 4399 preview stopped; 4397/4398 not listening after the e2e run |

## 4. Next command

`/10x-archive save-observability-c1-c2 then ship`

## 5. Open

- [human] 4.5 device check (iPad Safari private / blocked site data, Android without site storage): `mountSaveFailedCard` with `pl.saveUnavailable` only when storage is really unavailable; `balance.save.loadTimeoutMs` (5000) on a cold iPad.
- [human] 5.9 signal form (DESIGN-GAP 43 revision): "Zapis gry" in the settings panel (`createSaveHealthView`) + card before the game; panel ordering (visual-review O2).
- [human] 5.10 copy acceptance: `pl.saveUnavailable`, `pl.settings.save*` (visual-review O1: plural "Ostatnie próby" after one failure).
- Not captured: `pl.settings.saveOff.fatal` (no seam); unit-tested in `tests/saveHealth.test.ts`.
- Follow-ups with `Trigger:` in `follow-ups/review-fixes.md`; DESIGN-GAP 42, 43, 45 in `docs/design-gaps.md`.

## 6. Autonomous decisions

- Playwright fallback instead of Claude in Chrome: seams need fresh browser contexts and the gear needs a 2 s Phaser long press (profile § 8). Would change if: Claude in Chrome could drive canvas long presses.
- Panel frames scrolled with `scrollIntoView({ block: 'center' })` after the first run showed the section under the sticky actions at 1024×768; recorded as observation O2, not fixed (existing panel behaviour since S-08, ordering is [human] 5.9). Would change if: the maintainer wants the save line above the fold.
- O1 (plural after one failure) left to [human] 5.10 rather than changing copy: grammatical, accurate once retries run, and copy is under human acceptance. Would change if: 5.10 rejects the wording.
- Capture context pinned to `Europe/Warsaw` / `pl-PL` so the hand check is deterministic. Would change if: the product formatted times in a fixed zone instead of the device's.
- Re-ran the full local gate although no code changed, so the e2e on the final code commit is observed, not inherited.
