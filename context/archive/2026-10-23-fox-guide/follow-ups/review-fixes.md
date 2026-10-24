# Follow-ups — fox-guide

Deferred items. Each has a `Trigger:` line; a later slice greps for them.

## F1. Idle breathing
The fox stands still between pose changes. A gentle idle breathing was left out (scope: only if subtle).
Trigger: the maintainer asks for a livelier fox.

## F2. Fox on the unlock card
No fox on the unlock card (`guidePose` returns none there).
Trigger: maintainer request.

## F3. 512 x 512 art
The poses are 384 x 384 WebP, sharp at the 320 px display size on a scale-1 canvas.
Trigger: a game config `resolution`/zoom above 1, or a larger `GUIDE.displaySize`.

## F4. Boot budget headroom
The boot payload is 47.6 s of the 50 s `balance.loader.totalMs` at 50 KB/s; `tests/bootBudget.test.ts` keeps 2 s of headroom.
Trigger: `tests/bootBudget.test.ts` red (decide: raise `totalMs` within the 60 s bound of `tests/loaderBalance.test.ts`, or slim the art).

## F5. Fallback anchor x 1802
The fox stands at feet (1792, 400) with about 10 px of the body over the paper face. If rejected, move `GUIDE.anchor.x` to 1802 (clear of the paper; `tests/guideLayout.test.ts` re-proves the geometry).
Trigger: the maintainer rejects the 10 px over the paper face (plan item 4.6).

## F6. "Obrazki" sentence for a missing fox
`pl.settings.uiArtMissing` says "napis lub rysunek", which is untrue for a missing fox (no stand-in, the fox is simply absent).
Trigger: the maintainer reading "Obrazki" with a missing fox, or the next change to `pl.settings.uiArtMissing`.

## F7. `modeWidgets` link
The fox reads the round phase only, not the answer mode; `modeWidgets` was not extended.
Trigger: a new answer mode whose input widget could reach the fox rect (`tests/guideLayout.test.ts` goes red first).
