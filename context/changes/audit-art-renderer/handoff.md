# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the `/10x-tdd` phase 1 step of run 2026-10-25-audit-art-renderer: phase 2 done test-first and committed (`93e3452`); phase 1 is `a25aec2`.
Phase 3 must keep the `worn` record in ONE place (`applyWornGrade`, no caller edits); phase 1 is closed, do not touch
`scripts/recolour-board.py` again. A skipped `tests/recolourBoard.test.ts` locally is NOT green (compare passed counts).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | p1 `a25aec2`, p2 `93e3452`, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 19 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artPick.ts` | `FallbackWhere` + `'worn'`, `FALLBACK_ORDER` ends `'worn'`, `DrawnFallbackWhere` excludes `guide`/`worn` |
| `src/core/artHealth.ts` | `ArtHealthLine` `{kind:'worn'}`, pushed after `guide`; drawn list excludes `worn` |
| `src/data/pl.ts` | `pl.settings.wornPlain` (DESIGN-GAP 173 comment; the gap row in docs is phase 3) |
| `src/ui/dom/artHealthView.ts` | `case 'worn'` |
| `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` | 5 + 1 new cases (literal oracles) |

## 3. Verification

| command | result |
|---|---|
| RED (before impl) | 5 failed on assertions, e.g. `AssertionError: expected [] to deeply equal [ { kind: 'worn' } ]`, `expected [ 'font', 'guide', 'fallback' ] to deeply equal [ 'font', 'guide', 'worn', 'fallback' ]`, `expected 'undefined' to be 'string'` |
| GREEN | 46 passed in the two files |
| break: drop `'worn'` from the drawn-list filter | 2 red (`expected true to be false`; fallback line `where` mismatch); restored |
| break: worn line before guide | order case red (`[ 'font', 'worn', 'guide', 'fallback' ]` vs expected); restored. Meta: oracles are literal lists/records |
| lint / typecheck | OK / OK |
| unit | 3945 passed (phase 1 3939 + 6); deploy scripts OK; `sample` E1-E6 OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| diffs vs main | `pl.ts` only the comment + `wornPlain` lines; save/fixtures/balance/curriculum/rooms empty |
| e2e | pending: this phase touched `src/`; orchestrator batches after phase 3 |

## 4. Next command

`/10x-implement audit-art-renderer phase 3`

## 5. Open

- Phase 3 wiring (`applyWornGrade` records `worn`/`ungraded` once, `console.info` of the renderer), phases 4 and 5 per plan. Manual rows 4.6-4.10 are not mine. Row 2.5 is the orchestrator's e2e.
- DESIGN-GAPs 173, 174 rows in docs (phase 3). Follow-ups (phase 4).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- D-1 No mixed-phase question; no driver redirect (implementation was absent, RED observed). Would change: n/a.
- D-2 Committed only the planned set; the unrelated `artHealth.ts` doc comment was extended to name the worn line.
- D-3 Row 2.5 left open (e2e is the orchestrator's).
