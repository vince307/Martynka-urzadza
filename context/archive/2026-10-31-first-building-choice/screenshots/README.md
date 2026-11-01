# Screenshots for the first-building-choice visual gate (plan row 8.6)

Captured on 2026-11-01 from the hook build of `1fef8ed` (the sunflower fix found by this gate; the build id in the corner reads `1fef8ed`), served by `vite preview` from a freshly rebuilt `dist-e2e/` (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) on the visual port 4399. PNG, desktop 1440×900 and tablet 1024×768: 34 game frames over 17 shots (9 plan items), plus 5 pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway spec reusing `tests/e2e/support/{hook,salon,welcome}.ts`, removed from the repository after the run. Two projects (desktop 1440×900, tablet 1024×768, Chromium, `hasTouch`), one worker. Every test is a new browser context, so a fresh device (fresh IndexedDB). `fakePolishVoice` gives the device a Polish voice, so the speaker shows. Taps are Playwright touch taps at the hook's read-only targets; nothing was written to IndexedDB. Month pinned by `?e2eMonth=9`, variants off (`?e2eVariant=off`).

- **A (01, 08a):** child path: age 8 → choice view (01) → "Baza kosmiczna" → warm-up task screen with "Wróć" (08a).
- **F (01b):** as A, then "Wróć" on the task screen → the choice view again, with its own "Wróć".
- **B (02, 08b):** parent path: "Rodzic", adult gate, "10+", "Klasa 2, I półrocze", "Zatwierdź" → choice view without "Wróć" (02) → "Baza kosmiczna" → task screen with "Wróć" (08b).
- **C (03):** as A with `?e2eArt=choice` → both card pictures as stand-ins.
- **D (04-07, 08c):** parent path, `?e2eStars=100` (the Mostek total), "Baza kosmiczna", one task solved by the retype (no star), "Do pokoju" → Mostek before the stage (04); buy the stage (05); "Wróć do notesu" → task screen without "Wróć" (08c); back to the room; console panel with preview 0 natural (06a, bought), pilot chair panel with preview 1 sunny (06b, bought), telescope panel with preview 2 mint (06c, bought) → room with the three families (06d); the last three slots with look 0 → "Pokój gotowy!" (07a); "Dalej" → still Mostek (07b).
- **E (09a, 09b):** `?e2eSave=v5-salon` (frozen v5 fixture, in-memory store) → task screen without the choice (09a); one task by the retype, "Do pokoju" → the salon with its 4 tasks done (09b).

Each shot waits 1.8 s after the state is reached in the hook, so tweens and reveals have settled.

## Frames

| # | State (plan row 8.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Choice view, child path, "Wróć" and speaker (1) | `desktop-01-choice-child-path.png` | `tablet-01-choice-child-path.png` | `welcomeView choice`, `choiceSpeaker true`, `choiceBack` (440, 908) |
| 01b | Choice view after the task screen's "Wróć" (child path) | `desktop-01b-choice-after-task-wroc.png` | `tablet-01b-choice-after-task-wroc.png` | `choiceBack` (440, 908), speaker true |
| 02 | Choice view, parent path, no "Wróć", speaker (2) | `desktop-02-choice-parent-path.png` | `tablet-02-choice-parent-path.png` | `choiceBack` null, speaker true |
| 03 | Choice view under `?e2eArt=choice` (3) | `desktop-03-choice-stand-ins.png` | `tablet-03-choice-stand-ins.png` | `artFallbacks.choice 'drawn'` |
| 04 | Mostek before the stage (4) | `desktop-04-mostek-before-stage.png` | `tablet-04-mostek-before-stage.png` | stars 100, task `renovate` cost 6, `houseButton` null |
| 05 | Mostek after the stage (5) | `desktop-05-mostek-after-stage.png` | `tablet-05-mostek-after-stage.png` | stars 94, `stageDone`, next task `place-console` 10 |
| 06a | Variant panel, console, "Naturalny" (6) | `desktop-06a-mostek-panel-natural.png` | `tablet-06a-mostek-panel-natural.png` | preview 0, stars 94 |
| 06b | Variant panel, pilot chair, "Słoneczny" (6) | `desktop-06b-mostek-panel-sunny.png` | `tablet-06b-mostek-panel-sunny.png` | preview 1, stars 84 |
| 06c | Variant panel, telescope, "Miętowy" (6) | `desktop-06c-mostek-panel-mint.png` | `tablet-06c-mostek-panel-mint.png` | preview 2, stars 71 |
| 06d | Mostek with one slot in each family (6) | `desktop-06d-mostek-three-families.png` | `tablet-06d-mostek-three-families.png` | chosen console 0, chair 1, telescope 2; stars 57 |
| 07a | "Pokój gotowy!" for Mostek (7) | `desktop-07a-mostek-room-done-card.png` | `tablet-07a-mostek-room-done-card.png` | one item `bridge`, no teaser, stars 0, `houseButton` null |
| 07b | After "Dalej": still Mostek (7) | `desktop-07b-mostek-after-dalej.png` | `tablet-07b-mostek-after-dalej.png` | `currentRoom bridge`, `modeText` "Zmień wygląd", `houseButton` null |
| 08a | Task screen, first round, child path, "Wróć" (8) | `desktop-08a-task-first-round-child-wroc.png` | `tablet-08a-task-first-round-child-wroc.png` | `themeBack` (90, 928), `warmupPending` true |
| 08b | Task screen, first round, parent path, "Wróć" (8) | `desktop-08b-task-first-round-parent-wroc.png` | `tablet-08b-task-first-round-parent-wroc.png` | `themeBack` (90, 928) |
| 08c | Task screen after the stage purchase, no "Wróć" (8) | `desktop-08c-task-after-purchase-no-wroc.png` | `tablet-08c-task-after-purchase-no-wroc.png` | `themeBack` null, stars 94 |
| 09a | v5 save resumes on the task screen in the house (9) | `desktop-09a-v5-save-resumes-task.png` | `tablet-09a-v5-save-resumes-task.png` | `load loaded`, `migratedFrom 5`, `house-1`, `salon`, stars 17, `themeBack` null |
| 09b | The resumed salon with its 4 tasks (9) | `desktop-09b-v5-save-salon-four-tasks.png` | `tablet-09b-v5-save-salon-four-tasks.png` | `tasksDone 4`, next task `place-cabinet` 12 |
| kit | Pack frames, read only | `kit-choice-cards.png`, `kit-bridge-before.png`, `kit-bridge-after-natural.png`, `kit-bridge-after-sunny.png`, `kit-bridge-after-mint.png` | — | copies of `designs/bystrow-space-base-v1/screenshots/choice-cards.png` and `previews/bridge-*.png` |
