# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 3 (`/10x-tdd`) is committed as 9013f59: the "Obrazki" cut line has a background variant. Phases 1 (e6a0b43) and 2 (2e67a1d) are done; the orchestrator's e2e gate for them (141+0) is recorded on rows 1.4 and 2.4.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phase 1 e6a0b43, phase 2 2e67a1d, phase 3 9013f59, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 31 (3.3 e2e row left to the orchestrator; 3.4 [reviewer], 3.5 [visual] not mine) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts` | `ArtHealthLine` cut variant gains optional `background?: true`; `ArtHealthLinesInput.background?: boolean`; a cut with `background` pushes the flagged line (no flag otherwise, so old `toEqual` cases are unchanged) |
| `src/data/pl.ts` | `settings.artCutBackground` + `DESIGN-GAP 153` comment |
| `src/ui/dom/artHealthView.ts` | cut line maps to `artCutBackground` when `line.background` |
| `src/scenes/UIScene.ts` | `openSettings` passes `background: (bootLoad.hiddenMs ?? 0) > 0` |
| `docs/design-gaps.md` | row 153 |
| `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` | 3 new cases in `artHealthLines` (background cut, never hidden, hidden with cut 0); 1 in `pl.settings.artCutBackground` |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `AssertionError: expected [ { kind: 'missing', …(3) }, …(3) ] to deep equally contain { kind: 'cut', count: 3, …(1) }` and, for the string stubbed as `'STUB'`, `AssertionError: expected 'STUB' to match /ponownie/` |
| GREEN | both files pass; suite 3692 passed (phase-2 3688 + 4) |
| Deliberate break | `artHealthLines` ignoring `background` (`false ?`) -> the background case red (1 failed / 20); "przez internet" put into the string -> the text test red (1 failed / 16); each restored (`git diff` shows only intended changes) |
| Meta-check | the view mapping and the `UIScene` caller have no unit test; their proof is the [visual] row 3.5 and phase 8's e2e |
| lint, typecheck | OK |
| unit | 3692 passed, 190 files (baseline 3688 + 4) |
| deploy scripts, sample E1–E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | left to the orchestrator (`<branch e2e baseline> + 0`) |
| Teacher read | `artCutBackground`: "Część obrazków nie zdążyła się wczytać, bo gra była w tle podczas uruchamiania. Uruchom grę ponownie." Spelling correct, comma before "bo", "wczytać się" agrees with "Część" (singular, as in `artCut`), calm, no "internet", says a restart helps. Formal [reviewer] row 3.4 stays open |

## 4. Next command

`/10x-tdd audit-boot-hidden-tab phase 4`

## 5. Open

- Row 3.3 open until the orchestrator's e2e run; 3.4 [reviewer], 3.5 [visual] not mine.
- Other manual rows unchanged: 2.5 [reviewer], 2.6 [human]; 5.4, 6.5 [visual]; 7.5 [reviewer].
- Phase 8 e2e needs the visibility fake and the `hiddenMs` break; its second break (`background: false` in `UIScene`) targets this phase's caller.

## 6. Autonomous decisions

- D-1 **Cut variant shape**: optional `background?: true` field (rejected: required boolean, which would change existing `toEqual` cases). Would change: nothing.
- D-2 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-3 **Commit message / next-phase / manual-gate prompts** decided in place: proposed message accepted, planned set only, stop after phase 3.
- D-4 **Copy**: wording from the plan's example kept after the teacher read; DESIGN-GAP 153 row added.
