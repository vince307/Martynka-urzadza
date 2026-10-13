// Scene geometry and placeholder colours. Scenes import these instead of
// hard-coding numbers (plan section 14: no balance numbers in scenes).

/** Base scene resolution; Phaser.Scale.FIT scales it to the viewport. */
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

/** Minimum touch target size in scene pixels (style guide: 96 px at 1920×1080). */
export const MIN_TOUCH_TARGET = 96;

/** Palette for code-drawn placeholders, taken from the approved art pack style guide. */
export const PLACEHOLDER_COLORS = {
    ivory: 0xfff5df,
    oak: 0xc99b66,         // style guide: frames and furniture
    terracotta: 0xc98460,  // style guide: small painted accents
    paleLeaf: 0xe3f0d9,    // style guide: pale leaf (same value as tile; named for room furniture)
    turquoise: 0x54beb4,
    deepTeal: 0x245c59,
    butter: 0xf1ce6b,
    blockHundred: 0xd9edd3, // kit reference/base-ten.svg flat
    blockTen: 0xa6ddd2,     // kit reference/base-ten.svg rod
    tile: 0xe3f0d9,        // answer tile and keypad key
    selected: 0xd7ebc1,    // kit .answer.selected: a marked tile of the multi-select mode
    selectedBorder: 0x547e3d, // kit .answer.selected outline and check mark
    correct: 0xe5f2d4,     // correct answer feedback
    hint: 0xfff0b9,        // hint and solution bar
    dotDone: 0xa6cf7f,     // finished progress dot
    pressed: 0xc9e3b8,     // pressed tile or key, a step darker than the tile
    tileBorder: 0xb9d9c9,  // idle tile outline and keypad entry field
    field: 0xffffff,       // empty keypad entry field
    fieldPlaceholder: 0x8fb0a8, // "?" in the empty entry field
    button: 0xfff2c0,      // step and hint buttons (kit .step-next, .hint-button)
    buttonBorder: 0xd8bd73,
    hintBorder: 0xd9bd73,  // outline of the yellow hint bar (kit .feedback.hint)
    next: 0xa6ddd2,        // "Dalej" and the keypad OK (kit .next-button, .key.ok)
    nextBorder: 0x397f73,
    pageButton: 0x8dd3c5,       // kit .page-button gradient (#a6ddd2 to #70c7b7), flattened to its middle
    pageButtonSecondary: 0xfff6dc, // kit .page-button.secondary gradient (#fffbee to #fff0ca), flattened
    pageButtonSecondaryBorder: 0xc0a363,
    pageButtonHighlight: 0xf1ce6b, // DESIGN-GAP (docs/design-gaps.md row 10): "Do pokoju" highlighted when a renovation task is affordable
    starEmpty: 0xeadfbe,        // a task of the summary row that paid no star
    starOutline: 0xae802c,      // kit .star-icon stroke
    ageButton: 0xeaf6df,        // kit .age-button gradient (#f8fff0 to #dceecf), flattened to its middle
    ageButtonBorder: 0xabc49b,  // kit .age-button border
    unlockCard: 0xfff7de,       // kit .unlock-card gradient (#fffef4 to #fff0c8), flattened to its middle
    unlockBorder: 0xd8bc6f,     // kit .unlock-card border
    ageButtonShadow: 0xc6d8b9,  // kit .age-button box-shadow (#a4bd964d over the ivory page), flattened
} as const;

/** DESIGN-GAP row 53: column colours of a bar chart, in order. */
export const CHART_COLORS: readonly number[] = [0x54beb4, 0xf1ce6b, 0xc98460, 0xa6cf7f, 0xc99b66];

/** Deep teal as a CSS colour: every text of the task screen. */
export const TEXT_COLOR = '#245C59';

/** Same ivory as a CSS colour, for the page background and game config. */
export const PAGE_BACKGROUND = '#FFF5DF';

/** Font sizes in scene pixels (style guide: prompts 64, calculations 112). */
export const FONT_SIZES = {
    caption: 32,
    prompt: 64,
    answer: 90,
    key: 58,
    keyLabel: 36,
    expression: 112,
    bar: 36,
    barButton: 40,
    solutionLine: 44,       // kit .solution-line 42-44
    counter: 56,
    summaryTitle: 86,       // kit .page-title
    earned: 124,            // kit .earned
    pageButton: 46,         // kit .page-button
    bonusLine: 44,          // DESIGN-GAP (docs/design-gaps.md row 9): the kit has no bonus line
    brand: 62,              // kit .welcome-brand
    ageDigit: 112,          // kit .age-button
    unlockTitle: 66,        // kit .unlock-card h2
    unlockName: 48,         // kit .unlock-name
    clockDigit: 28,         // kit reference/clock.svg digits
    rulerDigit: 30,         // kit reference/ruler.svg digits
    rulerUnit: 26,          // kit reference/ruler.svg "cm"
    chartLabel: 30,         // DESIGN-GAP row 53: bar labels under the columns
    chartAxis: 26,          // DESIGN-GAP row 53: numbers on the vertical axis
} as const;

/**
 * Font weight per text role (style guide: 650-750 for short labels, 700-750 for numerals; kit screen.css).
 * The bundled font is variable (wght 200-800), so these are real weights, not faux bold.
 */
export const FONT_WEIGHTS = {
    caption: 400,           // technical build id, not part of the kit
    prompt: 750,            // kit .prompt
    answer: 700,            // kit .answer, .entry
    key: 750,               // kit .key
    keyLabel: 750,
    expression: 750,        // kit .equation
    bar: 650,               // kit .feedback
    barButton: 750,         // kit .next-button, .step-next, .hint-button
    solutionLine: 650,      // kit .equation small
    counter: 750,           // kit .stars
    summaryTitle: 750,      // kit .page-title
    earned: 750,            // kit .earned
    pageButton: 750,        // kit .page-button
    bonusLine: 650,
    brand: 800,             // kit .welcome-brand
    ageDigit: 750,          // kit .age-button
    unlockTitle: 800,       // kit .unlock-card h2
    unlockName: 750,        // kit .unlock-name
    clockDigit: 700,        // kit reference/clock.svg
    rulerDigit: 700,        // kit reference/ruler.svg
    rulerUnit: 700,
    chartLabel: 700,
    chartAxis: 650,
} as const satisfies Record<keyof typeof FONT_SIZES, number>;

/** Weight range of the variable font, declared on its FontFace so canvas text uses the real weights. */
export const FONT_WEIGHT_RANGE = '200 800';

/** Task screen font: Atkinson Hyperlegible Next, loaded from public/fonts and precached. */
export const FONT_FAMILY = 'AtkinsonHyperlegibleNext, sans-serif';
export const FONT_KEY = 'AtkinsonHyperlegibleNext';
export const FONT_URL = 'fonts/AtkinsonHyperlegibleNext.ttf';

/** Scene keys. */
export const SCENE_KEYS = { boot: 'Boot', welcome: 'Welcome', task: 'Task', room: 'Room', ui: 'UI' } as const;

/** Game-level events the scenes send each other (this.game.events). */
export const GAME_EVENTS = {
    toRoom: 'to-room',   // "Do pokoju" was tapped (summary or HUD switch); the task scene switches to the room scene
    parentStage: 'parent-stage',   // the parent confirmed another stage (core changed the learner in the registry); the task scene opens a fresh round of it
} as const;

/** Keys of the game registry shared by scenes (the UI overlay listens to `changedata-<key>`). */
export const REGISTRY_KEYS = {
    stars: 'stars',           // the child's star balance, the one source: the task scene adds, a room purchase subtracts
    rooms: 'rooms',           // Record<string, RoomState> (shape of SaveState.rooms): the renovation progress per room
    currentRoom: 'currentRoom', // id of the room the child decorates
    narration: 'narration',   // text the speaker reads in the current phase, or null
    narrator: 'narrator',     // the game's Narrator (src/ui/narrator.ts), set before the scenes start
    roomSwitch: 'roomSwitch', // whether the HUD "Do pokoju" shows (roundView.switchVisible), false while the room is open
    learner: 'learner',       // the session's SessionLearner (core/placement: placement + adaptation state, S-07), absent until the child has said the age
    month: 'month',           // calendar month of the session, 0-11, set once before the scenes start (main.ts)
    settings: 'settings',     // the session's Settings (core/types: parent's auto-reading choice), set before the scenes start (main.ts)
    inputSuspender: 'inputSuspender',   // the game's one InputSuspender (core/inputSuspend): every overlay over the canvas holds it while open
    saver: 'saver',           // the game's autosave (the Autosaver of core/autosave: flush, status, current, replace), set in main.ts before the scenes run
    forcedSkills: 'forcedSkills',       // e2e build only: skill ids that fill every round (main.ts, from the page address); the name is not an e2e marker on purpose
    forcedFailure: 'forcedFailure',     // e2e build only; never set in production: the site that throws on purpose (main.ts, from the page address)
} as const;

/** The registry keys that make up the save (S-11): the autosave listens to these and the snapshot reads exactly these. */
export const SAVE_KEYS = [
    REGISTRY_KEYS.stars,
    REGISTRY_KEYS.rooms,
    REGISTRY_KEYS.currentRoom,
    REGISTRY_KEYS.learner,
    REGISTRY_KEYS.settings,
] as const;

/**
 * Task screen geometry in scene pixels, from the art pack kit (task-tiles.png,
 * task-keypad.png). Touch targets are listed in TASK_TOUCH_TARGETS.
 */
export const TASK_LAYOUT = {
    notebook: { left: 180, top: 204, width: 1560, height: 788, border: 16, radius: 40 },
    dots: { centerX: 960, y: 96, radius: 20, gap: 62, ringWidth: 4 },
    prompt: { x: 960, y: 290, maxWidth: 1300 },
    promptBeside: { x: 620, y: 290, maxWidth: 800 },   // sentence prompts left of the keypad
    expression: { x: 620, y: 456 },          // beside the keypad: kit .equation box (left 318, width 610, top 378, 112 px x 1.4), x aligned with promptBeside
    blank: { width: 64, height: 84, lineWidth: 8, radius: 12, gap: 24 },   // drawn "□" in an expression (DESIGN-GAP 8): about one digit of the expression font; gap = a word space
    blankInline: { width: 52, height: 68, lineWidth: 6, radius: 10, lineHeight: 92 },   // drawn "□" inside a sentence prompt (DESIGN-GAP 8): about one digit of the prompt font
    expressionWide: { x: 960, y: 500 },      // above the tiles
    // tiles.top and bar.bottom sit 12 px higher than the kit so the bar keeps 16 px from the tiles and the notebook border.
    tiles: { left: 416, top: 712, width: 254, height: 136, gap: 24, radius: 28, border: 4 },
    keypad: { left: 1040, top: 342, width: 516, keyWidth: 156, keyHeight: 104, gap: 24, rowGap: 16, fieldHeight: 112, radius: 24, keyBorder: 3, fieldBorder: 4 },
    bar: { height: 96, minWidth: 220, bottom: 960, radius: 24, padding: 24, border: 4, hintBorder: 3 },
    // Multi-select mode (S-13, DESIGN-GAP row 7/54): six narrower tiles in one row, "OK" centred under them above the bar.
    select: { tileWidth: 200, top: 600, okCenterY: 800, markSize: 18, markWidth: 5 },
    barSpan: { tiles: { x: 355, width: 1270 }, keypad: { x: 310, width: 710 } },   // under tiles / left of the keypad
    solution: { lineGap: 8, topGap: 16, minScale: 0.6, bottomGap: 12 },
    // Drawing area of a task with a picture (S-13). DESIGN-GAP (docs/design-gaps.md rows 52 and 57): the kit has pictures only above the tiles
    // and no solution beside a picture. A pictured task moves its prompt up to promptY so two lines (tiles) or three (keypad) end above the picture.
    // `tiles`/`keypad` are the picture rectangles without the solution; `*Solution` are the picture and the solution lines side by side (tiles)
    // or one above the other (keypad). All rectangles are x, y, width, height in scene pixels.
    picture: {
        promptY: 232,
        tiles: { x: 661, y: 396, width: 600, height: 294 },
        tilesSolution: { picture: { x: 236, y: 396, width: 624, height: 294 }, lines: { x: 900, y: 396, width: 784, height: 294 } },
        keypad: { x: 236, y: 470, width: 768, height: 378 },
        keypadSolution: { picture: { x: 236, y: 470, width: 768, height: 190 }, lines: { x: 236, y: 668, width: 768, height: 180 } },
    },
    // Drag mode (S-13 phase 8, DESIGN-GAP row 7/54): the tray takes the keypad's place on the right of the notebook, the mat the left part;
    // "OK" sits under the tray, above the bar. Mat blocks lie in a 3 x 3 grid per kind (9 = balance.blockDrag.maxPerKind).
    drag: {
        tray: { x: 1240, y: 380, width: 440, height: 300, gap: 16 },
        mat: { x: 236, y: 380, width: 944, height: 460 },
        ok: { x: 1240, y: 724, width: 440, height: 96 },
        cellInset: 8, columns: 3, maxPerKind: 9,
        labelHeight: 56, dash: 18, dashGap: 12, dashWidth: 5, shadow: 4, trayScale: 1.3, radius: 28,
        solutionLines: { x: 1240, y: 380, width: 440, height: 440 },   // the solution steps take the tray's place
    },
    // Base-ten blocks (kit reference/base-ten.svg, own units): a 100 flat is 180 square, a 10 rod 22 x 180, a 1 cube 22 square; blocks of one kind
    // are `gap` apart, kinds `groupGap`, wrapped rows `rowGap`. `maxScale` stops a few blocks from growing huge.
    blocks: {
        hundred: { width: 180, height: 180, radius: 6 }, ten: { width: 22, height: 180, radius: 4 }, one: { width: 22, height: 22, radius: 4 },
        gap: 12, groupGap: 40, rowGap: 24, border: 4, line: 2, cells: 10, maxScale: 1.5,
    },
    // Bar chart (DESIGN-GAP row 53), own units: columns `barWidth` wide `barGap` apart, `plotHeight` tall, axis labels left, bar labels under the columns.
    chart: { barWidth: 90, barGap: 36, plotHeight: 300, axisInset: 56, labelDrop: 14, labelHeight: 44, axisLabelGap: 12, gridWidth: 2, border: 4, radius: 8, maxScale: 1.2 },
    // Star counter top right (kit correct.png): ivory pill with a butter border, star and number.
    starCounter: { left: 1622, top: 46, width: 196, height: 100, radius: 28, border: 4, starRadius: 30, starGap: 20 },
} as const;

/**
 * HUD speaker button (kit screen.css .speaker / .hud button): 104 px square left of the star counter,
 * same ivory-to-butter fill, 5 px border and 32 px radius as the kit HUD buttons.
 * left = starCounter.left - 24 (kit HUD gap) - width.
 */
export const HUD_LAYOUT = {
    speaker: { left: 1494, top: 44, width: 104, height: 104, radius: 32, border: 5, fill: 0xfffdf2, pressed: 0xfff0cc, borderColor: 0xd3b77d, iconSize: 56 },
    // "Do pokoju" between tasks (FR-011), top left; same look as the speaker, a house icon and the label.
    roomSwitch: { left: 104, top: 44, width: 316, height: 104, radius: 32, border: 5, iconSize: 56, iconGap: 14, iconStroke: 4 },
    // Parent's settings gear (S-08), bottom right, outside the notebook (x 180-1740) and the room panel; muted on purpose, no feedback while held.
    // DESIGN-GAP (docs/design-gaps.md rows 25 and 28): the kit has no settings icon; the gear is drawn in code, with no feedback while held.
    settings: { left: 1782, top: 952, width: 96, height: 96, radius: 30, border: 4, fill: 0xfff5df, borderColor: 0xd8bd73, iconColor: 0x8fb0a8, alpha: 0.7, gearRadius: 26, gearTooth: 8, gearTeeth: 8, gearHole: 9, gearStroke: 5 },
} as const;

/**
 * Round summary (kit summary.png, screen.css .page-title, .summary-star-row, .earned, .page-buttons, .page-button):
 * title, a row of one star per task, "star +N" and two page buttons, on the notebook.
 */
export const SUMMARY_LAYOUT = {
    title: { x: 960, y: 290 },                                  // kit .page-title: top 290, centred between left 310 and right 280 (about 975)
    stars: { left: 656, top: 420, gap: 26, size: 98, outline: 3, kitCount: 5 },
    earned: { centerX: 960, top: 578, starSize: 114, gap: 28 }, // kit .earned: 600 wide box at left 660, 124 px line
    bonus: { x: 960, y: 722 },                                  // DESIGN-GAP (docs/design-gaps.md row 9): below "+N", only with the clean-round bonus
    buttons: { left: 454, top: 816, gap: 36, width: 450, height: 128, radius: 32, border: 5, highlightBorder: 9 },
} as const;

/**
 * "Nowa umiejętność!" card (kit unlock.png, screen.css .unlock-card, .unlock-art, .unlock-name, .page-button inside it), on the notebook.
 * Absolute scene coordinates: card left 388 / top 284 (kit), title top = card top + border + 56, art 200 x 200 centred 34 px under the title line,
 * name 10 px under the art, button 450 x 108 centred, 36 px above the card's inner bottom.
 * DESIGN-GAP (docs/design-gaps.md row 22): the kit's book art (assets/icons/book.png) waits for S-16; a book is drawn in code.
 */
export const UNLOCK_LAYOUT = {
    card: { left: 388, top: 284, width: 1144, height: 660, border: 7, radius: 46 },
    title: { x: 960, y: 347 },
    art: { centerX: 960, top: 461, size: 200 },
    name: { x: 960, y: 675, maxWidth: 1100 },
    button: { left: 735, top: 793, width: 450, height: 108, radius: 32, border: 5 },
} as const;

/**
 * Welcome screen (kit welcome.png, screen.css .welcome-brand, .page-title, .age-buttons, .age-button): the brand,
 * the question and one square button per age on the notebook. The brand and question centre on x 960 (kit: left/right insets).
 * DESIGN-GAP (docs/design-gaps.md row 20): the kit's sunflower and cushion (welcome-flower, welcome-cushion) wait for the art of S-16.
 */
export const WELCOME_LAYOUT = {
    brand: { x: 960, y: 64 },
    question: { x: 960, y: 290 },
    ages: { left: 363, top: 526, width: 218, height: 190, gap: 28, radius: 38, border: 5, shadow: 10 },
    // DESIGN-GAP (docs/design-gaps.md row 15): the kit has no parent entry; secondary page button in the notebook's
    // bottom-right corner (where the kit draws the cushion), 44 px from the inner border on the right, 32 px at the bottom.
    parent: { left: 1420, top: 834, width: 260, height: 110, radius: 32, border: 5 },
} as const;

/** Room scene (S-09): the salon drawn in code over `area`, the way back to the notebook and the current renovation task button. */
export const ROOM_LAYOUT = {
    resume: { left: 240, top: 892, width: 480, height: 116, radius: 32, border: 5 },   // kit .return-note button, DESIGN-GAP (docs/design-gaps.md rows 12 and 31)
    area: { left: 180, top: 204, width: 1560, height: 656 },   // background and slots (S-09 proposal)
    wallBottom: 520,                                            // wall and floor meet here
    tray: { left: 300, top: 780, width: 1320, height: 260 },   // variant panel; furniture ends above tray.top so the preview stays visible
    // Variant panel contents (S-09 phase 6): three thumbnails, "Wybieram" and "Zamknij" inside `tray`. The chosen thumbnail
    // lifts by `lift` and gets the thick border, so the choice never rests on colour alone. DESIGN-GAP (docs/design-gaps.md): the kit has no panel.
    // minAspect: a thumbnail is at least this high relative to its width, so the wide floor and walls read as a swatch, not a thin strip.
    thumbs: { left: 340, top: 828, size: 200, gap: 30, radius: 28, border: 4, selectedBorder: 10, lift: 16, inset: 20, minAspect: 0.5 },
    // "Wybieram" ends where the task button begins: after a purchase the next task's button appears at once, so the second tap
    // of a double tap must not land on it (impl-review F1). "Zamknij" may share its place (it would re-open the same panel).
    choose: { left: 1100, top: 792, width: 480, height: 100, radius: 32, border: 5 },
    close: { left: 1100, top: 908, width: 480, height: 96, radius: 32, border: 5 },
    // Current renovation task button. DESIGN-GAP (docs/design-gaps.md): the kit has no task button; page-button look, ours.
    // Top aligned with `resume`, below "Wybieram".
    taskButton: { left: 900, top: 892, width: 720, height: 128, radius: 32, border: 5, textInset: 36, costWidth: 150, starRadius: 30 },
    // Mode button "Zmień wygląd"/"Gotowe" (S-10): the place of the task button once the room is done, but starting right of the third thumbnail (x 1000)
    // so the panel's controls and the button never overlap. DESIGN-GAP (docs/design-gaps.md row 38): the kit has no change mode.
    modeButton: { left: 1010, top: 892, width: 570, height: 128, radius: 32, border: 5 },
    // Slot captions and the dashed outline of an empty slot; holdOutline is the thick outline of the slot under a holding finger.
    // DESIGN-GAP (docs/design-gaps.md rows 32 and 37): the kit has no slots and no hold view.
    slot: { radius: 24, dash: 22, gap: 14, outline: 4, patternInset: 12, stripeWidth: 16, stripeStep: 44, dotRadius: 9, dotStep: 52, patternAlpha: 0.22, captionCharWidth: 20, holdOutline: 10 },
} as const;

/**
 * "Pokój gotowy!" card (S-10): a butter-framed card over the room with the list of rooms (a tile per room, the last one a teaser) and "Dalej".
 * It ends above `ROOM_LAYOUT.tray`, and "Dalej" sits above "Wybieram", so the second tap of a double tap on the last "Wybieram" cannot close the card.
 * DESIGN-GAP (docs/design-gaps.md rows 39 and 40): the kit has no such card nor room list; the look follows the unlock card.
 */
export const ROOM_DONE_LAYOUT = {
    card: { left: 388, top: 220, width: 1144, height: 560, border: 7, radius: 46 },
    title: { x: 960, y: 262 },
    tiles: { left: 490, top: 372, width: 440, height: 200, gap: 60, radius: 28, border: 5, dash: 18, dashGap: 12, thumbTop: 16, thumbScale: 0.2, captionY: 172, markRadius: 26, markInset: 34 },
    button: { left: 735, top: 624, width: 450, height: 108, radius: 32, border: 5 },
} as const;

/** Interactive rectangles of the HUD overlay, checked against MIN_TOUCH_TARGET. */
export const HUD_TOUCH_TARGETS = {
    speaker: { width: HUD_LAYOUT.speaker.width, height: HUD_LAYOUT.speaker.height },
    roomSwitch: { width: HUD_LAYOUT.roomSwitch.width, height: HUD_LAYOUT.roomSwitch.height },
    settings: { width: HUD_LAYOUT.settings.width, height: HUD_LAYOUT.settings.height },
} as const;

/** Interactive rectangle of the welcome screen, checked against MIN_TOUCH_TARGET. */
export const WELCOME_TOUCH_TARGETS = {
    age: { width: WELCOME_LAYOUT.ages.width, height: WELCOME_LAYOUT.ages.height },
    parent: { width: WELCOME_LAYOUT.parent.width, height: WELCOME_LAYOUT.parent.height },
} as const;

/** Every interactive rectangle of the task screen, checked against MIN_TOUCH_TARGET. */
export const TASK_TOUCH_TARGETS = {
    tile: { width: TASK_LAYOUT.tiles.width, height: TASK_LAYOUT.tiles.height },
    key: { width: TASK_LAYOUT.keypad.keyWidth, height: TASK_LAYOUT.keypad.keyHeight },
    barButton: { width: TASK_LAYOUT.bar.minWidth, height: TASK_LAYOUT.bar.height },
    pageButton: { width: SUMMARY_LAYOUT.buttons.width, height: SUMMARY_LAYOUT.buttons.height },
    unlockNext: { width: UNLOCK_LAYOUT.button.width, height: UNLOCK_LAYOUT.button.height },
} as const;

/** Interactive rectangles of the room scene, checked against MIN_TOUCH_TARGET. */
export const ROOM_TOUCH_TARGETS = {
    resume: { width: ROOM_LAYOUT.resume.width, height: ROOM_LAYOUT.resume.height },
    taskButton: { width: ROOM_LAYOUT.taskButton.width, height: ROOM_LAYOUT.taskButton.height },
    thumb: { width: ROOM_LAYOUT.thumbs.size, height: ROOM_LAYOUT.thumbs.size },
    choose: { width: ROOM_LAYOUT.choose.width, height: ROOM_LAYOUT.choose.height },
    close: { width: ROOM_LAYOUT.close.width, height: ROOM_LAYOUT.close.height },
    modeButton: { width: ROOM_LAYOUT.modeButton.width, height: ROOM_LAYOUT.modeButton.height },
    cardNext: { width: ROOM_DONE_LAYOUT.button.width, height: ROOM_DONE_LAYOUT.button.height },
} as const;

/** Animation durations in milliseconds. */
export const ANIMATION = {
    shakeMs: 360,
    shakeSegments: 6,      // shakeMs / shakeSegments is one sideways swing (yoyo, 2 repeats)
    shakeDistance: 14,
    starFlightMs: 850,
    starPopMs: 150,        // the flying star grows first, then travels
    starPopScale: 1.6,
    purchasePopMs: 260,    // the new furniture grows to purchasePopScale and back (yoyo), S-09
    purchasePopScale: 1.08,
    purchaseParticles: 14,
    purchaseParticleMs: 700,
    starStartLift: 116,    // the star starts above the tapped tile (half a tile + popped star) so the answer stays readable
} as const;

/** Inset of the build id in the screen corner, in scene pixels. */
export const PLACEHOLDER_FRAME = {
    margin: 24,
} as const;
