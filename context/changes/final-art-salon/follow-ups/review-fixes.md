# Follow-ups — final-art-salon (S-16a)

Each item has a `Trigger:` line; later slices grep for them. Everything that carried `Trigger: S-16` and was not done in S-16a is re-triggered here, nothing is dropped.

## Re-triggered from earlier slices (`Trigger: S-16` before)

- Texture atlas instead of separate WebP files (S-14). Out of S-16a: it needs a packer (native or a new dependency) and changes to `ArtImage`; the room added 26 files, about 1.2 MB.
  Trigger: precache over budget or a second room
- Thermometer without marks below zero in E3-E5, frame cut at 0...+30 (design-gaps 64). The pack has no cut frame; a texture crop in code is possible but belongs to the task screen.
  Trigger: the author delivers a 0...+30 frame or a teacher read of the E3-E5 thermometer
- Drawing highlight during a hint (scale pans, coins).
  Trigger: a teacher read asking for it
- Hint lines with units read raw by the narrator (`spokenText` does not expand "°C", "zł", "gr"; `spokenCelsius` has "minus" typed in instead of `pl.speech.minus`).
  Trigger: a narrator check on the tablet or the next change to `src/core/narration/`
- O3: answer tiles beside the thermometer sit low with empty space above. Cosmetic.
  Trigger: S-17 polish
- ` = ?` after the expression in a prompt (the kit writes `38 + 27 = ?`); changes the prompt of every generator.
  Trigger: S-17 or a teacher read asking for it
- SPATIAL (position words on a picture): needs a scene with shelves, the salon has none.
  Trigger: art for a SPATIAL scene
- Wallet art for MONEY_PAY (design-gaps 104; designer brief P2.4).
  Trigger: the author delivers wallet art
- Slashed zero in the task font (S-04 V3): the font has only that glyph.
  Trigger: the maintainer asks for a plain 0
- `audio.noAudio` and audio rejections are outside the error boundary.
  Trigger: S-16b (the first sound)
- Purchase sound and variant-change sound: `RoomScene.playPurchaseSound` is still an empty hook (design-gaps 35); no sound files exist.
  Trigger: S-16b

## Done in S-16a (closed, for the record)

- Furniture art instead of frames, wide-slot thumbnails, V1 colliding captions, V2 rug pop over the sofa, V3 vanishing captions, F4 two `Box` types, F6 `RoomDoneCard` inline numbers, DESIGN-GAP 22 book on the unlock card (icon `book`), loading screen.

## New in S-16a

- Rollback risk: after a salon is moved to the new task list (`remapLegacySalon`, save format stays v2) an older build reads `tasksDone` positionally in the old 10-task list and meets `chosen` keys it does not know: the room looks different, nothing is lost. A rollback of the deploy after a device has loaded the new build is manual (`ssh martynka-ops rollback`) and the child's salon would look partly empty until the new build is back.
  Trigger: any deploy rollback of the build that shipped S-16a
- The remap rounds the new prefix up to cover what the old one cost (rule B); some children get one piece for free, none lose one. Maintainer's decision to confirm.
  Trigger: human checklist row 2.5
- Textures are resident at full resolution (about 59 MB of GPU memory with all room pictures). If a tablet stutters: crop `shadows` to its bounding box (about -4.4 MB) or halve the resolution.
  Trigger: a tablet check (human checklist 10.4) finding memory trouble or a slow start
- Loading screen is drawn in code and its title uses the fallback font until the task font loads; the brand art is designer brief P2.2.
  Trigger: the author delivers loading art, or a visual check finds the fallback title ugly
- The book on the unlock card is the counting icon; the kit's own book is brief P2.6.
  Trigger: the author delivers the book art
- Renovation stage has one plain cross-fade; in-between backgrounds are brief P3.6 (design-gaps 109).
  Trigger: the author delivers in-between backgrounds
- Costs 5, 7, 9, 10, 12, 13, 15 (sum 71) are authored content.
  Trigger: S-17
- Future slots are appended at the end of the task list so a saved `tasksDone` stays valid.
  Trigger: a new slot from the designer brief P3
