# Follow-ups — final-sound (S-16b)

- VO3: the hold outline of a furnished slot is still its `visibleRect` (design-gaps row 37); not touched by sound.
  Trigger: designer brief delivers a hold view, or S-17 polish
- Music loop has no overlap or crossfade; a click may be heard at the loop point.
  Trigger: a click heard at the loop point on the tablet
- Music is not ducked under the narrator's speech.
  Trigger: a parent report that music covers the reading
- Both formats (m4a and ogg) are precached although a device uses one; the music could be re-encoded smaller.
  Trigger: precache weight becomes a problem on the tablet, or S-17
- No `tap` sound on answer tiles.
  Trigger: S-17 playtest
- The iPad silent switch: nobody has decided whether sound should follow or ignore it.
  Trigger: the maintainer wants sound to follow or ignore the silent switch
- Sound is not tested in WebKit (Chromium only in Playwright).
  Trigger: a WebKit project in playwright.config.ts
- Music status stays `loading` while the audio context is locked, until the first gesture.
  Trigger: a parent report that the settings panel shows music as loading
- Visual gate: the parent panel mixes heading alignment ("Dźwięki" centred like the reading caption, "Zapis gry"/"Obrazki" left-aligned in their section views, `src/ui/dom/settingsPanel.ts` `openSettingsPanel`). Not a defect of this slice; one alignment rule for panel h2s would read calmer.
  Trigger: the next change to the settings panel layout, or S-17 polish
