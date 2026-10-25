# Handoff — `salon-style` (slice fix:salon-style)

Written by the visual-gate step (row 5.10): `VISUAL: PASS`, no fix needed, 34 frames + a comparison sheet committed. The next agent archives and ships. It must not tick rows 5.6–5.9 (they are [human]) or 5.11 (CI at ship).

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | p1 7d2e520, p2 90785fc, p3 6ff84fa (+ 93c4b0a), fix 19e5a40, p4 05be316, p5 65f05e0, p6 d912810, impl-review fix c8660de, docs commits, and this step's `docs(salon-style): visual gate` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` stamps it) |
| Progress rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 5.6–5.9 [human], 5.11 [reviewer] (CI at ship) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/salon-style/reviews/visual-review.md` | new: the visual gate, with states, hand-checked numbers, the designer's read and the final `VISUAL: PASS` line |
| `context/changes/salon-style/screenshots/*.jpg` | new: 17 frames per width (desktop 1440, tablet 1024) + `compare-art-review-vs-now.jpg` |
| `context/changes/salon-style/screenshots/README.md` | new: every frame, how it was reached, and the capture route |
| `context/changes/salon-style/plan.md` | row 5.10 ticked |
| `context/changes/salon-style/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | `e2e hook: present (2 chunks checked)` (hook build for the gate only) |
| Claude in Chrome, new tab `localhost:4399/?e2eMonth=9` | slow-save card (`Kod: timeout`, another tab on the origin), so the gate fell back |
| Playwright capture (scratchpad spec, 6 tests × 2 projects, fresh context each) | 12/12 passed after one spec fix (the stand-in test polled a backdrop that is `plain` under `?e2eArt=room`) |
| Hook reads | before: 10 worn keys, `graded true`, `contactShadows []`; after stage: `worn []`, contact shadows lamp-table, plant-left, pouf, plant-right; done: `contactShadows []`; backdrop `graded` 10 (welcome, task before), 0 (task after); stand-in: `worn []`, no page error |
| Worn grade hand-check | cabinet pixel after (209,129,64) → expected (167.7,129.0,95.2), measured (168,129,95); 3 more points within 0.7 |
| Board hand-check | (196,224,160) / `#BCD799` = 1.043/1.042/1.046 (one factor, lighting kept) |
| Contact shadow hand-check | solved alpha beside the lamp stool 0.158 / 0.116 / 0.075 at 0.3 / 0.5 / 0.7 of the half-width (model 0.173 / 0.147 / 0.091) |
| `cmp` xfade-700ms and rm-stage-after vs room-after-stage | identical (both widths) |
| Local gate (lint, typecheck, unit, build, e2e) | not re-run: this step changed only docs and screenshots, and no source file |
| Leftovers | the 4399 server was stopped (`lsof -ti tcp:4399 -sTCP:LISTEN` empty); `ps -U $(id -u)` shows no vite, playwright, until or tail process |

## 4. Next command

`/10x-archive salon-style` then ship (no hosted db push — none exists)

## 5. Open

- [human] 5.6 accept the worn before state (judge `screenshots/desktop-room-before.jpg`, `desktop-xfade-300ms.jpg`, `compare-art-review-vs-now.jpg`); 5.7 the grade stronger than scope, no dust overlay; 5.8 turquoises not nudged; 5.9 board `#BCD799` + the Python step in `npm run art`.
- [reviewer] (CI at ship) 5.11: job `check` of workflow `CI`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Observed, not this slice: the pouf's contact shadow and the pouf's base sit behind the "Wróć do notesu" button (room layout, `ROOM_LAYOUT` resume button); no follow-up filed, since the look is unaffected.
- The weakest worn cue is the left plant and the lamp in the before state: muted but still lively green. This is input for 5.6.
- Follow-ups: `follow-ups/review-fixes.md` (21 `Trigger:` lines, incl. impl-review F2 and F4), unchanged.

## 6. Autonomous decisions

- **Playwright fallback.** Chosen: Playwright. Rejected: Claude in Chrome. Why: one probe showed the slow-save card on 4399 (another tab holds the origin's save) and the gate needs fresh devices. Would change: a Chrome profile with nothing stored on the origin.
- **Fake clock for the mid cross-fade.** Chosen: `page.clock`. Rejected: a real-time burst (its first shot came 2.2 s after the tap and was deleted). Would change: nothing; the reduced-motion ends were captured as well.
- **No kit frame copied.** Chosen: compare against `designs/martynka-maths-A-v1/screenshots/welcome.png` by eye only. Why: the kit has no room frame, and `designs/` is local. Would change: a kit room frame.
- **No local gate re-run.** Why: no source changed. Would change: any fix commit (none was made).
