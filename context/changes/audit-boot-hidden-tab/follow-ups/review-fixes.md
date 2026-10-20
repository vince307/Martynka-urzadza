# Follow-ups — audit-boot-hidden-tab

Source: observability audit `context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md`. This change fixed H-1 (hidden tab and the boot limits), I-1 (error code on the "Ups!" card) and Z-8 (refused `replace`); the rest below stays open.

## H-6 and the other MEDIUM/LOW rows of the 2026-10-17 report
H-6 (a cut file still logs "failed to load ... (timeout or network)") and the remaining MEDIUM/LOW rows were not touched beyond what the phases needed.
Trigger: next change to the `BootScene.preload` log lines (`loadErrorLine`) or to the file a row names.

## A-6 and B-6 (Android measurement, cut boot)
A real boot cut on a tablet is now diagnosable through `bootLoad.hiddenMs` next to `elapsedMs`.
Trigger: a report of a cut boot, or an Android measurement of a hidden-tab start.

## A-10
Not touched.
Trigger: next change to the boot limits (`src/core/bootLimits.ts`, `balance.loader`).

## L-8 DOM test of `createArtHealthView`
The "Obrazki" background line is covered at the `artHealthLines` and text level, not in a DOM test of `createArtHealthView`.
Trigger: next change to `src/ui/dom/artHealthView.ts`.

## ASL-05, ASL-08, ASL-09
Art-stand-in findings left as recorded in the audit.
Trigger: next change to `src/core/round/artFilter.ts` or `TaskScene.freshRound`.

## G-3
Fallback record per room miniature (FU-HLS #3).
Trigger: next change to `src/ui/artFallbacks.ts` or the room miniature.

## S12-03, S12-11, S12-13
S12-11: a failed `replace` still counts as an autosave failure in the health view.
Trigger: next change to `Autosaver.replace` or `saveHealthView`.

## FontFace load limit
The task font promise has no own limit beyond the total boot limit.
Trigger: a report of a boot stuck on the font, or the next change to the font load in `BootScene`.

## Refusal-card focus after a dialog closes
When the refusal card opens over an import or reset dialog, focus is not placed on its button explicitly.
Trigger: the phase 10 visual gate shows focus lost.

## Real-device hidden-tab measurement
Row 2.6 [human] checks the hidden-tab start on a device.
Trigger: the phase-2 [human] row fails.

## TXT-06
Closed by this change (phase 5/6: the card shows `Kod:`, the refusal text no longer advises deleting site data).
Trigger: none (closed); reopen only if a card shows a wrong text again.

## Isolation-only red of `load-and-tab-guard` (stale-tab-and-health follow-up)
Closed by phase 8: the whole spec file (6 tests, with the new #15 H-1) ran green alone, twice, with the default workers (6 passed in 34.5 s and 32.4 s). Reopen only if the red reappears.
Trigger: none (closed).

## `pl.errorCard.build`
No longer used in `src`; still used by `tests/e2e/error-boundary.spec.ts` (phase 9 may drop it with the tightened assertion).
Trigger: phase 9 of this change, or the next change to `error-boundary.spec.ts`.
