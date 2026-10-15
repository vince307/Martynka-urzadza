# Follow-ups — e1-shapes-picture-mode (S-14d)

Each item names a file and a symbol; the trigger says when a later slice should pick it up.

- SPATIAL (position words on a picture: Po lewej, Nad, Pod) was left out: needs a scene drawing. Where: `docs/ZADANIA.md` E1 shapes step; no generator yet. Trigger: art for a SPATIAL scene or S-16
- SYMMETRY (complete the mirror image) was left out: needs a grid answer. Where: no generator yet, `Task.input` has no such mode. Trigger: a toggle-cells answer mode
- BONDS "połącz pary" (pair up numbers that make 10) uses the plain tiles BONDS only. Where: `src/core/tasks/generators/bonds.ts`. Trigger: a pairing answer mode
- ORDINAL "dotknij czwartego" (tap the n-th icon in the picture) is asked as a number tile today. Where: ORDINAL generator, `IconRow`. Trigger: a tap-in-picture answer mode
- ORDINAL is numbers only and up to 5; words ("czwarty", gender agreement) and up to 10 wait. Where: ORDINAL params in `src/data/curriculum/E1.ts`. Trigger: noun gender data in nouns.ts or an E1 step with ordinals to 10
- E1 hint number line: the hint drawing of S-14b has no place above the E1 tiles. Where: `TASK_LAYOUT` hint band, `src/core/round/pictureLayout.ts`. Trigger: a layout band above the tiles
- E1.10 `place_read_12`: tiny task space trips the variety invariant. Where: `tests/contentInvariants.test.ts` degenerate-share check, `src/data/curriculum/E1.ts` skill `place_read_12`. Trigger: a content-invariants exception for tiny task spaces or [human] teacher read of E1.10
- Wallet in the parent progress preview (a wrong payment is not recorded as a coin list). Where: `src/core/progress.ts` mistake examples, `recordRound`. Trigger: a v3 save or a parent asking for it
- Wallet art: coins and wallet are drawn in code around the kit's coin pictures (design-gaps row 104). Where: `src/ui/widgets/CoinWallet.ts`. Trigger: the author delivers wallet art
- 10 zł note in E1.11 (E1 pays with coins up to 5 zł only; the note starts in E2.2). Where: `E1.11.money_pay_10` in `src/data/curriculum/E1.ts`. Trigger: [human] 9.7 teacher read

## From the implementation review (2026-10-15)

- One `grosze(id)` lookup: `MONEY.find((m) => m.id === id)?.grosze` is repeated in `src/core/coins.ts`, `src/core/tasks/generators/moneyPay.ts`, `src/core/tasks/validate.ts`, `src/core/tasks/visual.ts`, `src/core/tasks/generators/money.ts`; export one helper from `src/core/coins.ts`. Trigger: next change to MONEY_PAY or MONEY_COUNT
- `PatternRow` keeps a private `dashedRect` beside the shared `src/ui/widgets/dashedRect.ts`; give the shared helper a scale. Trigger: next change to `src/ui/widgets/PatternRow.ts` or `dashedRect.ts`
- A coin dropped on a full wallet (`balance.coinDrag.maxTotal`) silently flies back (`stepTrayDrag` `put`); add a gentle cue (wallet shake) so the child knows it is full. Trigger: [human] 9.6 tablet test or the visual gate showing confusion
- `CoinWallet.paint` hides the LAST coin of the lifted kind (`lastIndexOf`), while `matAt` grabs the touched cell: the gap shows in the wrong cell (value unaffected). Trigger: [visual] 8.7 screenshots or next change to `src/ui/widgets/CoinWallet.ts`
- SHAPES `all` (`src/core/tasks/generators/shapes.ts`) falls through its `MAX_ATTEMPTS` loop silently; throw like `chooseOp` so a data change fails loudly. Trigger: next change to SHAPES params or `src/data/shapes.ts`
- CHOOSE_OP first hint "Przybyło, więc dodajemy." names the operation (all kinds, inherited); a method-only first line ("Popatrz na strzałkę: przybywa czy ubywa?") would teach without giving the tile. Trigger: next teacher read of CHOOSE_OP or [human] 9.7
- CHOOSE_OP picture starts at 2 things because `nouns.ts` has no gender ("był/była/było 1"); a story with 1 needs gender data. Trigger: noun gender data in nouns.ts
- `TaskScene.feedDrag` and `submit` are still if-chains over the drag kinds (render and `okTarget` are exhaustive `never` switches); a fourth drag branch should turn them into switches. Trigger: a fourth `DragMode`
