# Follow-ups — final-art-p2 (S-16c)

Each item has a `Trigger:` line; later slices grep for them. Nothing from earlier slices is dropped.

## Carried (symbols not edited in S-16c)

- A-3 / A-4 / S14-08 from the earlier art and shapes slices.
  Trigger: the next change to the symbols they name
- `FontFace` load limit: the task font load has no per-file timeout of its own.
  Trigger: a field report of a stuck start on the font, or the next change to `BootScene` font loading
- Per-file timeout test (a stalled single file, not the total cut).
  Trigger: the next change to `balance.loader` or the boot queue
- Art-health set: UI art (`UI_ART`) is not counted in "Obrazki" (decision 8).
  Trigger: a parent need to see UI art health (then L-6 / L-8 / F4 join)
- Texture atlas instead of separate WebP files.
  Trigger: precache over budget (about 2.2 MB, S-16d adds salon art) or a second room
- `salon-before` thumbnail is not converted (decision 2); no screen lists a not-done room.
  Trigger: the author asks for the fixed pack picture, or a room list with not-done rooms
- Plate as a MULT_GROUPS frame (the `plate` icon is shipped, not used as a frame).
  Trigger: a teacher read asking for it
- Slashed zero in the task font (V3): a font decision for the maintainer, the pack has no font.
  Trigger: the maintainer asks for a plain 0 or delivers a font

## Fired by this slice, deferred (plan review F4)

- The three `Rect` types (`dragLayout`, `pictureLayout`, `geometry`), fired by phase 1 editing `dragLayout`; unifying them touches every widget.
  Trigger: the next change to `dragLayout.ts` or `pictureLayout.ts` geometry types
- Shared `ArtPool` / `fitRect` and S14-10, fired by the `ArtImage` edit (only its `SIZES` lookup changed).
  Trigger: the next change to `ArtImage` pooling or fitting
- ASL-02..09 and the coin stand-in label size, fired by the `ArtImage` `SIZES` edit.
  Trigger: the next change to `ArtImage` stand-in text
- Gap 115 (full-wallet dim) is ours; the author may deliver art for a full wallet.
  Trigger: author art for a full wallet or the S-17 playtest
- 7-10 coin payments are gone from E1.11 / E2.2 (`maxTotal` 6, decision 1).
  Trigger: the teacher read or the author delivering a 10-place wallet

## Closed in S-16c

- S14-09 (a key outside `TASK_ART` drawn 1:1): closed for `UI_ART` keys by the `SIZES` lookup.
- Impl-review F3 (slow timer elapsed), `progress` listener, A-10 (log once), F2 (miniature, by the thumbnail fallback), `CoinWallet.paint` lifted cell, wallet art (gap 104 narrowed), loading art (gap 105), notebook (gap 22), room-list miniature fallback (gap 108).
