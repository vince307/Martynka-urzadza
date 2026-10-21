# Follow-ups — post-run-polish

Source: observability audit `context/audits/observability/2026-10-20_2151-start-runda-zebatka-ukryta-karta.md`. This change fixed N-1 (background line removed), N-4 (drawing limits fail at generation with the skill id), H-2 (picture-only cut count), the "Oblicz" heading and the variety cap in draw order. The rest stays open.

## F3 (cap applied in draw order) - closed
Closed by this change: `pickVariedSkills` repairs the draw rng-free (phase 4); the finer type key below is the remainder.
Trigger: none (closed); reopen if a seed shows three tasks of one type in a round.

## N-2 "Wróć" leaves no trace of the stage change
Trigger: next change to `TaskScene.backToAge` or `src/core/placement.ts` (`ageBackOffered`).

## N-3 variety rule relaxes silently (relax flag)
Trigger: next change to `src/core/round/variety.ts` or a playtest note of three tasks of one type in a row.

## N-5 settings hint disappears after 3 s
Trigger: a playtest note that the parent missed the "Przytrzymaj..." hint (`UIScene.showHintOnce`).

## N-6 error event without an error object gives `Kod: Error`
Trigger: next change to `installErrorBoundary` / `errorCode`, or an iPadOS measurement of such an event.

## PA-6 and the other open rows of the 2026-10-20_2151 report
Not touched beyond what the phases needed.
Trigger: next change to the symbol a row names.

## M-1, M-2, M-13, H-3, H-4 (round lifecycle, narrator, art cause lines)
Open as recorded in the audit.
Trigger: next change to `TaskScene` round lifecycle, `src/ui/narrator.ts` or `artHealthLines` causes.

## `modeWidgets` is not yet the only mode switch in `TaskScene.render`
Trigger: next change to an answer mode, or a new mode added to `ANSWER_MODES`.

## G-2, G-3, B-4, B-5
Open as recorded in the audit.
Trigger: next change to the file a row names.

## "Obrazki" `Kod:` line not muted
Trigger: next change to `src/ui/dom/artHealthView.ts` or the visual gate of the settings panel.

## L-8 DOM test of `createArtHealthView`
The section is covered at the `artHealthLines` and text level only.
Trigger: next change to `src/ui/dom/artHealthView.ts`.

## E2e for a sounds-only cut
A cut that leaves pictures whole must show no "Obrazki" cut line; covered by unit tests of `pictureCutCount`, no browser spec.
Trigger: next change to `loadAndTabGuard` specs or `?e2eArt` seams.

## The `speak` questions may be redundant after the heading
"Wstaw znak. Jaki znak pasuje w okienku?" may be too long for a 6-year-old.
Trigger: teacher read (2.5) or a playtest note that the narration is too long; then drop the speak questions, rng-free.

## "Uzupełnij" wording (gap 154)
Trigger: the author rephrases gap 154 in `docs/design-gaps.md`.

## Finer type key for the variety rule
The cap uses the task type; a finer key (type plus answer shape) would allow more mixing in one-type steps.
Trigger: a playtest note of a round that feels repetitive despite the cap.

## A number left at the end of a wrapped word prompt (visual gate)
At 1440 the word prompt "Kuba miał 2 klocki i oddał Tomkowi 1 klocek. …" breaks as "Tomkowi 1 / klocek" (`TaskScene.drawPrompt`, Phaser word wrap); Polish typography keeps a number with its noun (a non-breaking space after a short number). Not this slice; seen in `screenshots/desktop-heading-word.png`.
Trigger: next change to the prompt wrap (`wrapBlankLines` in `src/core/round/promptBlank.ts`) or a playtest note about a split number.
