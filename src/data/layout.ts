import type { CoinId } from './measures';
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
    letterHidden: 0xfffdf4,     // kit .letter
    letterHiddenBorder: 0xd2be87,
    letterRevealed: 0xe8f3d7,   // kit .letter.revealed
    letterRevealedBorder: 0x90b672,
    result: 0xf0f8e6,           // kit .result gradient (#fbfff5 to #e4f0d5), flattened to its middle
    resultBorder: 0xbdd5ae,     // kit .result border
    resultShadow: 0xdde8d1,     // kit .result box-shadow, flattened
    resultCovered: 0xd2eabb,    // kit .result.covered
    resultCoveredBorder: 0x547e3d,
    dieFace: 0xfffdf4,          // DESIGN-GAP 86: the kit shows the dice as pictures; ours are drawn in code
    dieBorder: 0xb4cba7,
    diePip: 0x245c59,
    unlockBorder: 0xd8bc6f,     // kit .unlock-card border
    ageButtonShadow: 0xc6d8b9,  // kit .age-button box-shadow (#a4bd964d over the ivory page), flattened
} as const;

/** DESIGN-GAP row 53: column colours of a bar chart, in order. */
export const CHART_COLORS: readonly number[] = [0x54beb4, 0xf1ce6b, 0xc98460, 0xa6cf7f, 0xc99b66];

/** DESIGN-GAP row 100: fills of the four face colours (SHAPES, PATTERN); the outline is deep teal so a figure reads without its colour. */
export const FACE_COLORS = { red: 0xe0707a, blue: 0x6fa8dc, green: 0x7dbb5a, yellow: 0xf1ce6b } as const;

/** Look of a face: the big figure fills `bigFill` of the short side of its box, the small one `smallRatio` of that; a rectangle is wider than tall. */
export const FACE_LOOK = { bigFill: 0.8, smallRatio: 0.6, outline: 4, rectangleWidth: 1.15, rectangleHeight: 0.7 } as const;

/** A row of figures with an empty place (PATTERN): cell size and gap, the dashed frame of the place. DESIGN-GAP row 101. */
export const PATTERN_LOOK = { cell: 132, gap: 20, maxScale: 1, dash: 14, dashGap: 10, dashWidth: 5, radius: 20 } as const;

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
    thermoLabel: 50,        // kit reference/thermometer-face.js labels, in housing units (scaled; never below TASK_LAYOUT.thermometer.minLabelPx)
    cellValue: 44,          // DESIGN-GAP row 73: a number in a magic-square or pyramid cell
    lineLabel: 28,          // kit reference/number-line.svg: numbers under the ticks
    lineJump: 30,           // kit number-line.svg has no arc label; DESIGN-GAP 88: the "+k" over an arc
    arrowRule: 40,          // DESIGN-GAP 89: the rule "+5" on an arrow of a graph or table
    columnDigit: 72,        // kit reference/written-addition.svg: digits of the written column
    columnSign: 64,         // kit reference/written-addition.svg: the + or − sign
    columnMark: 34,         // DESIGN-GAP 91: the small carry or borrow digit
    gridLabel: 30,          // DESIGN-GAP row 74: column letters and row numbers of the coordinate grid
    sideLabel: 30,          // DESIGN-GAP row 75: the length written at a side of a figure
    artLabel: 24,           // stand-in label of a drawing whose texture failed to load (never shown when the art loads)
    letter: 88,             // kit .letter (S-15 word minigame)
    result: 80,             // kit .result (S-15 dice minigame)
    diceSign: 96,           // kit .dice-expression
    doneWord: 92,           // kit .success-card .final-word
    settingsHint: 32,       // DESIGN-GAP row 151: the hint bubble next to the gear (visual gate F-02: 32 px fits the right margin in five short lines)
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
    thermoLabel: 700,       // kit reference/thermometer-face.js
    cellValue: 750,
    lineLabel: 700,         // kit reference/number-line.svg
    lineJump: 750,
    arrowRule: 750,
    columnDigit: 700,       // kit reference/written-addition.svg
    columnSign: 700,
    columnMark: 750,
    gridLabel: 700,
    sideLabel: 700,
    artLabel: 650,
    letter: 750,            // kit .letter
    result: 750,            // kit .result
    diceSign: 750,          // kit .dice-expression
    doneWord: 750,          // kit .final-word
    settingsHint: 650,
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
    starLanded: 'star-landed',   // the flying star reached the counter; the HUD pops the counter
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
    artHealth: 'artHealth',             // ArtHealth of the task drawings (core/artHealth), set by BootScene after loading; runtime only, not in SAVE_KEYS
    roomArtHealth: 'roomArtHealth',     // ArtHealth of the salon pictures (core/artHealth), set by BootScene; runtime only, not in SAVE_KEYS
    uiArtHealth: 'uiArtHealth',         // ArtHealth of the screen pictures UI_ART (core/artHealth), set by BootScene; runtime only, not in SAVE_KEYS, never read by artFilter
    bootLoad: 'bootLoad',               // { cut: string[]; cutByTable; creates: number; elapsedMs: number; hiddenMs: number }: files the total boot limit ended (also by table), how often BootScene.create ran, the wall-clock load time and the part of it the tab was hidden (the limits count visible time), set by BootScene; runtime only, not in SAVE_KEYS
    fontHealth: 'fontHealth',           // 'loaded' | 'fallback' (core/artHealth fontHealth): whether the task font arrived, set by BootScene.create; runtime only, not in SAVE_KEYS
    forcedArt: 'forcedArt',             // e2e build only: 'missing' | 'corrupt' (main.ts, from the page address); the name is not an e2e marker on purpose
    variants: 'variants',               // VariantState (core/types): the round-variant schedule, saved with the game (S-15)
    today: 'today',                     // () => 'YYYY-MM-DD', the local calendar day (main.ts; scenes never call Date for the day)
    forcedVariant: 'forcedVariant',     // e2e build only: 'off' | 'word' | 'dice' | 'puzzle' (main.ts, from the page address); the name is not an e2e marker on purpose
    hudTitle: 'hudTitle',               // HudTitleView | null: the variant title in the HUD, set by the task scene; runtime only, not in SAVE_KEYS
    sound: 'sound',                     // the game's SoundService (src/ui/sound.ts), set in main.ts; runtime only, not in SAVE_KEYS
    soundPrefs: 'soundPrefs',           // SoundPrefs (core/sound), the device preference read from localStorage in main.ts; runtime only, not in SAVE_KEYS
    soundPrefsKept: 'soundPrefsKept',   // boolean: false when the device refused to keep the sound choice (UIScene.applySettings); runtime only, not in SAVE_KEYS
    artFallbacks: 'artFallbacks',       // FallbackRecord (core/artPick): which drawn fallback the child saw instead of a screen picture, written by the widgets and BootScene; runtime only, not in SAVE_KEYS
    soundHealth: 'soundHealth',         // ArtHealth of the sound effects (core/artHealth), set by BootScene; runtime only, not in SAVE_KEYS
    roomProblems: 'roomProblems',       // RoomProblem[] (core/rooms): where the saved rooms disagreed with the salon at load, set in main.ts; runtime only, not in SAVE_KEYS, nothing is repaired
    salonCarried: 'salonCarried',       // SalonCarried | null (core/save): this load moved the old salon to the new look, set in main.ts; runtime only, not in SAVE_KEYS
    swStatus: 'swStatus',               // SwStatus (core/swStatus), the service worker's runtime record, set in main.ts; runtime only, not in SAVE_KEYS
    settingsHintShown: 'settingsHintShown', // boolean: the hint after the first tap on the settings gear was shown in this page load; runtime only, not in SAVE_KEYS
    forcedFailure: 'forcedFailure',     // e2e build only; never set in production: the site that throws on purpose (main.ts, from the page address)
} as const;

/** The registry keys that make up the save (S-11): the autosave listens to these and the snapshot reads exactly these. */
export const SAVE_KEYS = [
    REGISTRY_KEYS.stars,
    REGISTRY_KEYS.rooms,
    REGISTRY_KEYS.currentRoom,
    REGISTRY_KEYS.learner,
    REGISTRY_KEYS.settings,
    REGISTRY_KEYS.variants,
] as const;

/**
 * Task screen geometry in scene pixels, from the art pack kit (task-tiles.png,
 * task-keypad.png). Touch targets are listed in TASK_TOUCH_TARGETS.
 */
// The drag mode's mat and solution lines are also the drawing area of a clock to set (picture.drag below).
const DRAG_MAT = { x: 236, y: 380, width: 944, height: 460 } as const;
const DRAG_SOLUTION_LINES = { x: 1240, y: 380, width: 440, height: 440 } as const;

export const TASK_LAYOUT = {
    notebook: { left: 180, top: 204, width: 1560, height: 788, border: 16, radius: 44 },
    // "Wróć" to the age choice (DESIGN-GAP row 152): inside the left margin (x 0-180, the notebook starts at 180), above the build id caption, both sides >= MIN_TOUCH_TARGET.
    ageBack: { left: 16, top: 880, width: 148, height: 96, radius: 28, border: 4 },
    dots: { centerX: 960, y: 96, radius: 20, gap: 62, ringWidth: 4 },
    prompt: { x: 960, y: 290, maxWidth: 1300 },
    promptBeside: { x: 620, y: 290, maxWidth: 800 },   // sentence prompts left of the keypad
    expression: { x: 620, y: 456, maxWidth: 760 },   // beside the keypad: kit .equation box (left 318, width 610, top 378, 112 px x 1.4), x aligned with promptBeside; a wider one shrinks to 760 (40 px clear of the keypad, visual gate S-14c)
    blank: { width: 64, height: 84, lineWidth: 8, radius: 12, gap: 24 },   // drawn "□" in an expression (DESIGN-GAP 8): about one digit of the expression font; gap = a word space
    blankInline: { width: 52, height: 68, lineWidth: 6, radius: 10, lineHeight: 92 },   // drawn "□" inside a sentence prompt (DESIGN-GAP 8): about one digit of the prompt font
    expressionWide: { x: 960, y: 500, maxWidth: 1300 },      // above the tiles
    // tiles.top and bar.bottom sit 12 px higher than the kit so the bar keeps 16 px from the tiles and the notebook border.
    tiles: { left: 416, top: 712, width: 254, height: 136, gap: 24, radius: 28, border: 4 },
    keypad: { left: 1040, top: 342, width: 516, keyWidth: 156, keyHeight: 104, gap: 24, rowGap: 16, fieldHeight: 112, radius: 24, keyBorder: 3, fieldBorder: 4, fieldPadding: 24 },
    bar: { height: 96, minWidth: 220, bottom: 960, radius: 24, padding: 24, border: 4, hintBorder: 3 },
    // Multi-select mode (S-13, DESIGN-GAP row 7/54): six narrower tiles in one row, "OK" centred under them above the bar.
    select: { tileWidth: 200, top: 600, okCenterY: 800, markSize: 18, markWidth: 5 },
    // The clock to set (S-13b): the dial in the unit of the drawn clock face (ClockFace DIAL), scaled to fit the mat. DESIGN-GAP (docs/design-gaps.md row 77).
    // The one source of the dial's geometry: ClockFace draws it, clockSetLayout and the e2e hook aim from it. `handle*`: the ring on a hand tip of a clock to set (radius = balance.clockSet.grabRadius, larger while held).
    clockSet: {
        dial: {
            outer: 150, inner: 138, border: 4,
            hourTick: { from: 118, to: 134, width: 4 }, minuteTick: { from: 128, to: 134, width: 2 },
            digitRadius: 91, hourLength: 78, hourWidth: 10, minuteLength: 106, minuteWidth: 7,
            hub: { radius: 10, border: 3 },
        },
        handleBorder: 5, heldGrow: 1.2,
    },
    barSpan: { tiles: { x: 355, width: 1270 }, keypad: { x: 310, width: 710 } },   // under tiles / left of the keypad
    solution: { lineGap: 8, topGap: 16, minScale: 0.6, bottomGap: 12 },
    // Drawing area of a task with a picture (S-13). DESIGN-GAP (docs/design-gaps.md rows 52 and 57): the kit has pictures only above the tiles
    // and no solution beside a picture. A pictured task moves its prompt up to promptY so two lines (tiles) or three (keypad) end above the picture.
    // `tiles`/`keypad` are the picture rectangles without the solution; `*Solution` are the picture and the solution lines side by side (tiles)
    // or one above the other (keypad). All rectangles are x, y, width, height in scene pixels.
    picture: {
        promptY: 232,
        // Visual gate S-13: a long prompt (a chart question beside the keypad wraps to five lines) steps its font down to
        // `promptMinSize` until it ends `promptGap` above the drawing; if it still does not, the drawing moves down under it.
        promptGap: 16, promptMinSize: 44, promptSizeStep: 4,
        tiles: { x: 661, y: 396, width: 600, height: 294 },
        tilesSolution: { picture: { x: 236, y: 396, width: 624, height: 294 }, lines: { x: 900, y: 396, width: 784, height: 294 } },
        keypad: { x: 236, y: 470, width: 768, height: 378 },
        keypadSolution: { picture: { x: 236, y: 470, width: 768, height: 190 }, lines: { x: 236, y: 668, width: 768, height: 180 } },
        // A tall drawing (thermometer, S-14, visualShape 'tall'): one column on the left of the notebook in every phase, down to the bar's bottom.
        // Visual gate S-14 (F3): in the wide rectangles a degree was about 2 CSS px on a 1024 px tablet, a child could not read it.
        // `answers` is the row the tiles centre in, `bar` the bar span; both start right of the column. The lines of the solution sit
        // above the tiles (tiles) or beside the column (keypad). DESIGN-GAP 65 (docs/design-gaps.md).
        // S-13b: a pictured `select` task keeps its drawing above the tiles (`select.top` 600); a clock to set (`drag`) takes the mat and its solution
        // lines the tray's place. `minHeight`: a long prompt may push the drawing down, never to nothing (audit S13-08).
        select: {
            picture: { x: 661, y: 396, width: 600, height: 190 },
            solution: { picture: { x: 236, y: 396, width: 624, height: 190 }, lines: { x: 900, y: 396, width: 784, height: 190 } },
        },
        // S-14b visual gate: a number line in a tiles task (E3.9 jumps, 0..30) drew its labels about 9 CSS px tall on a 1024 px tablet in the
        // 600 px `tiles` rectangle; a long drawing takes the notebook's full width, the solution lines under it, both above the tiles (top 712).
        long: {
            tiles: { x: 236, y: 380, width: 1448, height: 300 },
            tilesSolution: { picture: { x: 236, y: 330, width: 1448, height: 200 }, lines: { x: 236, y: 540, width: 1448, height: 160 } },
        },
        // S-14b: a written column (`digits`) stays put in every phase, the solution lines beside it. Provisional numbers, DESIGN-GAP 93 (docs/design-gaps.md): the kit has no layout for the column beside its solution lines; screenshots at the visual gate.
        drag: { picture: DRAG_MAT, lines: DRAG_SOLUTION_LINES },
        // Visual gate S-14b: a 320 px strip broke the lines inside equations ("9 + / 3 = 12"); the column is 40 px narrower (three columns at 1.22, two still at 1.3) and the strip 392 px.
        digits: { picture: { x: 216, y: 340, width: 400, height: 508 }, lines: { x: 632, y: 340, width: 392, height: 508 } },
        // S-14b: the hint number line sits under the expression, the solution lines under it (keypad only). Provisional, DESIGN-GAP 92 (docs/design-gaps.md): screenshots at the visual gate.
        // Visual gate S-14b: 768 wide, a 0..30 line drew its labels at 11.7 CSS px on a 1024 px tablet; 798 (x 226..1024) keeps them at 12.2.
        hint: { keypad: { picture: { x: 226, y: 530, width: 798, height: 190 }, lines: { x: 226, y: 730, width: 798, height: 118 } } },
        minHeight: 120,
        tall: {
            tiles: { picture: { x: 216, y: 330, width: 264, height: 630 }, lines: { x: 520, y: 330, width: 1180, height: 360 }, answers: { x: 500, width: 1224 }, bar: { x: 520, width: 1180 } },
            keypad: { picture: { x: 236, y: 420, width: 240, height: 540 }, lines: { x: 500, y: 420, width: 504, height: 428 }, bar: { x: 500, width: 520 } },
        },
    },
    // Drag mode (S-13 phase 8, DESIGN-GAP row 7/54): the tray takes the keypad's place on the right of the notebook, the mat the left part;
    // "OK" sits under the tray, above the bar. Mat blocks lie in a 3 x 3 grid per kind (9 = balance.blockDrag.maxPerKind).
    drag: {
        tray: { x: 1240, y: 380, width: 440, height: 300, gap: 16 },
        mat: DRAG_MAT,
        ok: { x: 1240, y: 724, width: 440, height: 96 },
        cellInset: 8, columns: 3, maxPerKind: 9,
        labelHeight: 56, dash: 18, dashGap: 12, dashWidth: 5, shadow: 4, trayScale: 1.2, radius: 28,   // trayScale 1.3 put the 10 rod on the tray tile border (visual gate S-13)
        solutionLines: DRAG_SOLUTION_LINES,   // the solution steps take the tray's place
    },
    // Paying with coins (S-14d phase 6): the tray holds up to 4 kinds, one row up to 3 (3 x 136 px) and a 2 x 2 grid for 4 (212 x 142 px, above MIN_TOUCH_TARGET);
    // the wallet is the pack wallet art (640 x 420, six drop centres from the pack manifest = balance.coinDrag.maxTotal) scaled 1.25 into the notebook;
    // a placed coin's box is the drop-centre pitch scaled minus coinGap (144 x 104 px). DESIGN-GAP 104, screenshots at the visual gate.
    coinDrag: {
        tray: { x: 1240, y: 380, width: 440, height: 300, gap: 16 },
        wallet: { x: 308, y: 380, width: 800, height: 525 },
        ok: { x: 1240, y: 724, width: 440, height: 96 },
        art: { width: 640, height: 420, dropCenters: [[200, 160], [320, 160], [440, 160], [200, 248], [320, 248], [440, 248]] },
        coinGap: 6, rowKinds: 3, maxKinds: 4,
    },
    // Coin pictures inside tray tiles and wallet cells (S-14d phase 8): inset from the tile, size under the finger. Provisional, DESIGN-GAP 104, screenshots at the visual gate.
    coinPay: { trayInset: 14, coinInset: 10, carriedSize: 120, fullTrayAlpha: 0.45 },   // fullTrayAlpha: DESIGN-GAP 115, the full-wallet signal is ours
    // Base-ten blocks (kit reference/base-ten.svg, own units): a 100 flat is 180 square, a 10 rod 22 x 180, a 1 cube 22 square; blocks of one kind
    // are `gap` apart, kinds `groupGap`, wrapped rows `rowGap`. `maxScale` stops a few blocks from growing huge.
    blocks: {
        hundred: { width: 180, height: 180, radius: 6 }, ten: { width: 22, height: 180, radius: 4 }, one: { width: 22, height: 22, radius: 4 },
        gap: 12, groupGap: 40, rowGap: 24, border: 4, line: 2, cells: 10, maxScale: 1.5,
    },
    // Bar chart (DESIGN-GAP row 53), own units: columns `barWidth` wide `barGap` apart, `plotHeight` tall, axis labels left, bar labels under the columns.
    // Number cells (DESIGN-GAP row 73), own units: a magic square (3 x 3) or a pyramid (1, 2, 3 cells, each row shifted half a cell), `cell` wide and tall; the empty cell is dashed.
    cells: { cell: 96, border: 4, dash: 14, maxScale: 1.5 },
    // Number line (kit reference/number-line.svg, own units: axis 4, ticks 2 x 24 high, arcs 5, dots r 9). Ticks are `gap` apart (`denseGap` from `denseFrom` ticks, so
    // 0..30 stays readable beside the keypad); arcs rise at most `arcMax`, an arc narrower than `minLabelSpan` has no label. DESIGN-GAP 88: 0..100 with a box,
    // jumps longer than 1 and the dashed box on a tick are not in the kit.
    numberLine: {
        gap: 58, denseGap: 30, denseFrom: 12, pad: 40, axis: 4, tick: 24, arc: 5, head: 12, dot: 9, border: 4,
        arcZone: 120, arcMax: 84, arcLift: 14, minLabelSpan: 36, labelDrop: 42, maxScale: 1.4,
        labelStagger: 30,   // visual gate S-14b: the second of two labels on neighbouring ticks of a dense line drops this far ("10" "11" ran into "1011")
        // `denseWidth`: the box on a dense line (visual gate S-14b: 52 wide it covered the "0" of a landing "10" on the next tick).
        box: { width: 52, denseWidth: 30, height: 46, dash: 9 },
    },
    // Arrow graph and table (DESIGN-GAP 89): circles of `disc` (graph) or square tiles of `tile` (table) with the rule on an arrow.
    arrows: {
        disc: 120, arrow: 270, rule: 56, border: 4, head: 16, line: 5, dash: 14,
        tile: 96, tileGap: 16, ruleColumn: 170, rowGap: 96, maxScale: 1.5,
    },
    // Written column (DESIGN-GAP 90, 91), own units: digits in columns `colW` apart (kit written-addition.svg: 72 px digits, 82 px columns, 4 px rule),
    // a `markRow` for carries and borrows above the first operand, the result boxes under the rule. The active box has a thicker border and the butter fill.
    written: {
        colW: 82, markRow: 60, row: 92, ruleGap: 12, rule: 4, maxScale: 1.3,
        box: { width: 70, height: 92, radius: 14, border: 4, activeBorder: 8 },
        carry: { radius: 22, border: 3 }, strike: 5, lendDrop: 6,
        // The small "1" of a column that borrows sits before its digit, raised (centre `dx` left of and `dy` above the digit's centre). Visual gate S-14b:
        // in the mark row it read as part of a number with the lenders' digits ("7 9 1" over 805).
        borrowOne: { dx: 34, dy: 22 },
    },
    // Coordinate grid (DESIGN-GAP row 74), own units: `cell` squares, column letters above, row numbers on the left, shapes filling `itemFill` of a cell.
    coord: { cell: 76, labelInset: 46, labelDrop: 40, line: 2, border: 4, itemFill: 0.62, maxScale: 1.5 },
    // Figure with labelled sides (DESIGN-GAP rows 75, 76): outline `line` px, lattice `grid` px, labels `labelPad` px off the edge, a point per corner `dot`;
    // `maxCell` stops a small figure from growing huge; `fontSize` must match FONT_SIZES.sideLabel (a test pins it).
    figure: { line: 4, grid: 2, labelPad: 10, fontSize: 30, maxCell: 64, minCell: 36, textWidth: 0.62, dot: 6 },
    chart: { barWidth: 90, barGap: 36, plotHeight: 300, axisInset: 56, labelDrop: 14, labelHeight: 44, axisLabelGap: 12, gridWidth: 2, border: 4, radius: 8, maxScale: 1.2 },
    // Money on a table (S-14), own units: notes in the upper row, coins in the lower one, largest first. Not a physical scale: a note is wider
    // than a coin and the coins differ a little (diameter in mm x `coinPerMm`, from the real coins). DESIGN-GAP (row added in S-14 phase 9): the kit has no table layout.
    money: {
        noteWidth: 192, noteHeight: 128, gap: 24, rowGap: 20, coinPerMm: 4.8, maxScale: 1.4,
        coinMm: { 'coin-01gr': 15.5, 'coin-02gr': 17.5, 'coin-05gr': 19.5, 'coin-10gr': 16.5, 'coin-20gr': 18.5, 'coin-50gr': 20.5, 'coin-1zl': 23, 'coin-2zl': 21.5, 'coin-5zl': 24 } satisfies Record<CoinId, number>,
    },
    // Balance scale in balance (S-14), in the 512 x 384 units of the converted drawing: the item stands in the left pan, the weights in the
    // right one (up to `perRow` side by side, further rows `rowLift` higher). DESIGN-GAP (row added in S-14 phase 9): the kit shows the scale without things on it.
    scale: {
        imageWidth: 512, imageHeight: 384,
        panLeft: { x: 90, y: 240 }, panRight: { x: 421, y: 240 },   // centre of a pan rim, the bottom of the things rests on y
        itemSize: 104, weightSize: 84, weightGap: 2, perRow: 2, rowLift: 60,   // visual gate S-14: 52 px weights in rows of 3 left the "10 dag" label about 4 CSS px tall on a tablet
    },
    // Jugs in a row (S-14), in the units of the 512 x 512 drawing: only the shared visible rectangle (measures.ts) takes room, so the padding of the
    // image overlaps. Up to `maxPerRow` in a row, more in two. DESIGN-GAP (row added in S-14 phase 9): the kit shows single jugs only.
    jugs: { gap: 40, rowGap: 24, maxPerRow: 5, maxScale: 0.8 },
    // Counting icons and groups of icons (S-14), in icon sizes except `maxIcon`: rows of up to `maxPerRow`, a ten in one row, groups in a rounded
    // frame each (`radius`, `border` in scene pixels). DESIGN-GAP (row added in S-14 phase 9): the kit has no plates, so a frame is drawn in code.
    icons: { gap: 0.12, maxPerRow: 6, framePad: 0.2, frameGap: 0.35, maxIcon: 150, radius: 20, border: 4 },
    // Motion arrow of a picture story (S-14d, DESIGN-GAP row 102): a strip on the left of two stacked groups. "come" is a solid arrow up
    // towards the first group, "go" a dashed arrow down away from it, so the two differ by shape and not only by colour. Scene pixels.
    iconMotion: { strip: 120, shaft: 20, head: 56, dash: 22, dashGap: 14 },
    // A row of different icons with a start flag on its left (S-14d ORDINAL, DESIGN-GAP row 102), in icon sizes except `maxIcon`.
    iconRow: { gap: 0.2, markWidth: 0.45, maxIcon: 140, pole: 8, flag: 0.5 },
    // Thermometer face painted over the housing (kit reference/thermometer-face.js), in the 512 x 1536 units of the housing; tick lengths are the
    // x of the tick end. `minGapPx` is the smallest distance of two single-degree ticks on screen, `minLabelPx` the smallest label size, so a
    // small thermometer (a tall drawing in a 378 px column) stays readable. DESIGN-GAP (row added in S-14 phase 9): the kit has no small version.
    thermometer: {
        tube: { x: 178, y: 286, width: 34, height: 1040, radius: 17, border: 4, fillAlpha: 0.125 },
        liquid: { x: 184, width: 22, bottom: 1322, radius: 11 },
        bulb: { x: 195, y: 1334, radius: 34 },
        unit: { x: 274, y: 222 },
        tick: { start: 220, major: 246, five: 239, minor: 231, majorWidth: 4, width: 2, minWidthPx: 1.5 },
        label: { x: 301, drop: 17, size: 50, gap: 13 },   // gap: kit '+30' at 50 px centred on 301 starts 13 units after the major tick end (246)
        minGapPx: 7, minLabelPx: 22,
    },
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
    // Title of a round variant (S-15), centred in the HUD like the kit's minigame title; the progress dots give way to it
    // (the letters or the board show the progress). Name, then a star drawn in code and the badge. DESIGN-GAP 79/80 (docs/design-gaps.md).
    title: { centerX: 960, maxWidth: 960, y: 96, starRadius: 18, gap: 12 },
    // Parent's settings gear (S-08), bottom right, outside the notebook (x 180-1740) and the room panel; full colour in the family of the
    // speaker button (playtest F-02: a muted gear looked disabled), no feedback while held.
    // DESIGN-GAP (docs/design-gaps.md rows 25, 28 and 151): the kit has no settings icon; the gear is drawn in code, with no feedback while held.
    settings: { left: 1782, top: 952, width: 96, height: 96, radius: 30, border: 5, fill: 0xfffdf2, borderColor: 0xd3b77d, iconColor: 0x397f73, alpha: 1, gearRadius: 26, gearTooth: 8, gearTeeth: 8, gearHole: 9, gearStroke: 5 },
    // Bubble with the hint after a short tap on the gear (F-02 a): above the gear, in the right margin and over the notebook's right border only
    // (left edge 1700 = the right end of the widest bar, a tall drawing's; every answer tile, key, "Dalej", tray and room control ends left of it),
    // five short lines at FONT_SIZES.settingsHint. Visual gate F-02: the first 380 px bubble covered "Dalej", a tile and "Wybieram".
    // DESIGN-GAP (docs/design-gaps.md row 151): the kit has no hint for a tap on the settings icon.
    settingsHint: { right: 1912, bottom: 936, width: 212, padding: 12, radius: 24, border: 4, fill: 0xfff0b9, borderColor: 0xd9bd73 },
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
 * The art is the pack notebook (`UI_ART` `notebook`, S-16c; design gap 22 closed), the book icon and its stand-in box as fallbacks.
 */
export const UNLOCK_LAYOUT = {
    card: { left: 388, top: 284, width: 1144, height: 660, border: 7, radius: 46 },
    title: { x: 960, y: 347 },
    art: { centerX: 960, top: 461, size: 200 },
    name: { x: 960, y: 675, maxWidth: 1100 },
    button: { left: 735, top: 793, width: 450, height: 108, radius: 32, border: 5 },
} as const;

/** Loading screen of BootScene (S-16a): the title and the progress bar, centred. S-16c: the pack background and emblem are drawn over it when they arrive (design gap 105 closed). */
export const LOADING_LAYOUT = {
    background: { width: 1920, height: 1080 },   // the pack's loading background fills the canvas
    emblem: { x: 960, y: 270, size: 300 },       // the pack's emblem, 300 square, above the title
    title: { x: 960, y: 450 },
    bar: { left: 560, top: 580, width: 800, height: 36, radius: 18, border: 5 },
    slow: { x: 960, y: 680, maxWidth: 800 },   // DESIGN-GAP 112: the "still loading" line under the bar, centred like the title, wrapped within the bar width
    textStroke: { title: 12, slow: 8 },   // visual gate S-16c: over the pack background the title and the slow line get an ivory outline (pack screenshots/loading-screen.png outlines its title), the deep teal ran into the turquoise sofa
} as const;

/**
 * Minigame screens (S-15; kit expansion pack word-*.png, success-card): the word's letter boxes above the task, and the done card
 * shared by both minigames. DESIGN-GAP 85 (docs/design-gaps.md): the kit shows no letter row together with a task prompt
 * longer than one equation, so a sentence prompt starts at `promptY` and an expression is centred on `expressionY`, under the letters.
 */
export const MINIGAME_LAYOUT = {
    letters: { top: 232, width: 132, height: 138, gap: 24, radius: 28, border: 5, centerX: 960 },
    expressionY: 540,   // kit .word-equation sits under the letters; no "Oblicz:" line in a word round
    promptY: 420,       // a sentence prompt of a word round starts here
    card: { left: 440, top: 330, width: 1040, height: 540, border: 8, radius: 46 },
    // Zakrywanka (kit .dice-expression, .result-grid, .result): two dice and the sign centred on x 960, then 13 fields in two rows.
    // DESIGN-GAP 86 (docs/design-gaps.md): the dice faces, the "?" for the missing result and the lines of the
    // solution above the dice (the kit has none) are ours.
    dice: { top: 346, size: 150, gap: 38, centerX: 960, pip: 15, radius: 30, border: 5, solutionTop: 232, solutionLimit: 336 },
    board: { left: 361, top: 552, columns: 7, width: 160, height: 136, gap: 20, radius: 28, border: 5, shadow: 7, checkSize: 32 },
    title: { x: 960, y: 356 },
    line: { x: 960, y: 462 },
    earned: { centerX: 960, centerY: 650, starSize: 84, gap: 24, scale: 0.7 },   // the summary's "+N" text at 0.7 of its size
    buttons: { left: 548, top: 728, width: 400, height: 108, gap: 24, radius: 30, border: 5 },   // the pair centred on the card (x 960)
} as const;

/**
 * Welcome screen (kit welcome.png, screen.css .welcome-brand, .page-title, .age-buttons, .age-button): the brand,
 * the question and one square button per age on the notebook. The brand and question centre on x 960 (kit: left/right insets).
 * DESIGN-GAP (docs/design-gaps.md row 20): the kit's cushion (welcome-cushion) has no art and overlaps the parent entry; the sunflower is the `flower` icon.
 */
export const WELCOME_LAYOUT = {
    brand: { x: 960, y: 64 },
    question: { x: 960, y: 290 },
    ages: { left: 363, top: 526, width: 218, height: 190, gap: 28, radius: 38, border: 5, shadow: 10 },
    // DESIGN-GAP (docs/design-gaps.md row 15): the kit has no parent entry; secondary page button in the notebook's
    // bottom-right corner (where the kit draws the cushion), 44 px from the inner border on the right, 32 px at the bottom.
    parent: { left: 1420, top: 834, width: 260, height: 110, radius: 32, border: 5 },
    // The kit's .welcome-flower: the `flower` task icon, bottom left of the notebook, clear of the age buttons (the cushion stays out, it overlaps `parent`).
    flower: { left: 360, top: 790, size: 152, angle: -14, key: 'tasks/icons/flower' },
} as const;

/** Room scene (S-09, S-16a): the salon pictures over the full `scene`, the way back to the notebook and the current renovation task button. */
export const ROOM_LAYOUT = {
    resume: { left: 240, top: 892, width: 480, height: 116, radius: 32, border: 5 },   // kit .return-note button, DESIGN-GAP (docs/design-gaps.md rows 12 and 31)
    // The room fills the whole scene (S-16a): the art pack's pictures are 1920x1080. Depth bands: the room's own layers use the manifest `z` (0-99);
    // the scene pictures sit at the bottom (`scene`, `furnishingsBefore`) and the shadows below the lowest slot or decoration z (the curtains, z 3), as in the pack's draw order; everything the child touches or reads sits above that band (the sofa at z 30 must never cover the panel, the outline or the card).
    scene: { left: 0, top: 0, width: 1920, height: 1080 },
    depth: { scene: 0, furnishingsBefore: 1, shadows: 2, outline: 100, controls: 110, panel: 120, celebrate: 130, card: 140 },
    // Stand-in for a room picture whose texture is missing (and for the art before it is loaded): coloured boxes with the Polish caption, like ART_STAND_IN.
    // variantFills[i] is the colour of variant i, so the three still differ without the art. wallBottom is where the stand-in wall meets the floor.
    standIn: {
        wallBottom: 520,
        wallBefore: PLACEHOLDER_COLORS.starEmpty, floorBefore: PLACEHOLDER_COLORS.pageButtonSecondaryBorder,
        wallAfter: PLACEHOLDER_COLORS.ivory, floorAfter: PLACEHOLDER_COLORS.tile,
        variantFills: [PLACEHOLDER_COLORS.turquoise, PLACEHOLDER_COLORS.terracotta, PLACEHOLDER_COLORS.butter],
        decorFill: PLACEHOLDER_COLORS.paleLeaf, decorAlpha: 0.9,
        border: PLACEHOLDER_COLORS.deepTeal, borderWidth: 3, radius: 24,
    },
    tray: { left: 300, top: 780, width: 1320, height: 260 },   // variant panel; furniture ends above tray.top so the preview stays visible
    // Variant panel contents (S-09 phase 6): three thumbnails, "Wybieram" and "Zamknij" inside `tray`. The chosen thumbnail
    // lifts by `lift` and gets the thick border, so the choice never rests on colour alone. DESIGN-GAP (docs/design-gaps.md): the kit has no panel.
    // A thumbnail holds the variant's picture scaled to fit (S-16a); labelY: the variant name's centre, measured from the thumbnail's top.
    thumbs: { left: 340, top: 828, size: 200, gap: 30, radius: 28, border: 4, selectedBorder: 10, lift: 16, inset: 20, nameHeight: 36, labelY: 172 },   // nameHeight: the strip under the picture that holds the variant name
    // "Wybieram" ends where the task button begins: after a purchase the next task's button appears at once, so the second tap
    // of a double tap must not land on it (impl-review F1). "Zamknij" may share its place (it would re-open the same panel).
    choose: { left: 1100, top: 792, width: 480, height: 100, radius: 32, border: 5 },
    close: { left: 1100, top: 908, width: 480, height: 96, radius: 32, border: 5 },
    // Current renovation task button. DESIGN-GAP (docs/design-gaps.md): the kit has no task button; page-button look, ours.
    // Top aligned with `resume`, below "Wybieram".
    taskButton: { left: 900, top: 892, width: 720, height: 128, radius: 32, border: 5, textInset: 36, costWidth: 150, starRadius: 30, labelGap: 24 },   // labelGap: the least space between the label and the star
    // Mode button "Zmień wygląd"/"Gotowe" (S-10): the place of the task button once the room is done, but starting right of the third thumbnail (x 1000)
    // so the panel's controls and the button never overlap. DESIGN-GAP (docs/design-gaps.md row 38): the kit has no change mode.
    modeButton: { left: 1010, top: 892, width: 570, height: 128, radius: 32, border: 5 },
    // Corner radius of the stand-in boxes and the thick outline of the slot under a holding finger (DESIGN-GAP, docs/design-gaps.md row 37: the kit has no hold view).
    slot: { radius: 24, holdOutline: 10 },
} as const;

/**
 * "Pokój gotowy!" card (S-10): a butter-framed card over the room with the list of rooms (a tile per room, the last one a teaser) and "Dalej".
 * It ends above `ROOM_LAYOUT.tray`, and "Dalej" sits above "Wybieram", so the second tap of a double tap on the last "Wybieram" cannot close the card.
 * DESIGN-GAP (docs/design-gaps.md rows 39 and 40): the kit has no such card nor room list; the look follows the unlock card.
 */
export const ROOM_DONE_LAYOUT = {
    card: { left: 388, top: 220, width: 1144, height: 560, border: 7, radius: 46 },
    title: { x: 960, y: 262 },
    tiles: { left: 490, top: 372, width: 440, height: 200, gap: 60, radius: 28, border: 5, dash: 18, dashGap: 12, thumbTop: 16, thumbScale: 0.13, captionY: 172, markRadius: 26, markInset: 34,
        // Check mark (points as fractions of the circle's radius from its centre) and padlock (offsets from the tile's top and centre).
        mark: { stroke: 7, startX: -0.5, bendX: -0.1, bendY: 0.4, endX: 0.5, endY: -0.35 },
        lock: { centerY: 70, bodyHalfWidth: 28, bodyTop: 4, bodyWidth: 56, bodyHeight: 44, bodyRadius: 8, shackleRadius: 18, stroke: 8, alpha: 0.9 } },
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
    ageBack: { width: TASK_LAYOUT.ageBack.width, height: TASK_LAYOUT.ageBack.height },
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

/** The kit notebook (maths-A pack screen.css): frame, paper, bottom edge, shadow, stitch marks, margin line and bookmark ribbon. */
export const NOTEBOOK = {
    frame: '#54b5a9',
    faceTop: '#fffbef',
    faceBottom: '#fff5df',
    edge: { height: 12, color: '#328476' },
    shadow: { offsetY: 22, blur: 36, color: '#564730', alpha: 0.19 },
    stitches: { inset: 40, width: 26, overhang: 20, phase: 44, height: 10, every: 100, color: '#bfa577' },
    margin: { fromInnerLeft: 92, inset: 38, width: 2, color: '#e4ceb2' },
    ribbon: { width: 48, height: 74, fromRight: 92, top: -16, notch: 0.78, color: '#f1ce6b' },
} as const;

/** The blurred, dimmed salon behind the notebook. */
export const BACKDROP = {
    scale: 0.25,
    washAlpha: 0.6,
    blur: { quality: 1, x: 2, y: 2, strength: 1, steps: 4 },
    depth: -10,
} as const;

/** Chunky-control lips: how far the darker lip shows below the face, and its colour. */
export const LIPS = {
    answer: { offset: 8, color: '#a4bd96', alpha: 0.44 },
    key: { offset: 5, color: '#a4bd96', alpha: 0.31 },
    age: { offset: 10, color: '#a4bd96', alpha: 0.3 },
    page: { offset: 8, color: '#397f73', alpha: 0.19 },
    hud: { offset: 7, color: '#8f6d3d', alpha: 0.15 },
    action: { offset: 8, color: '#397f73', alpha: 0.19 },   // DESIGN-GAP 156: the kit has no style for these
} as const;

export const HUD_PILL = { top: '#fffdf2', bottom: '#fff0cc', border: 5, borderColor: '#d3b77d', radius: 32, height: 104 } as const;

/** Progress beads of a round. */
export const BEADS = {
    radius: 28,
    gap: 74,
    ring: 4,
    currentRing: 7,
    future: { fill: '#fff8e5', ring: '#9cb8a0' },
    current: { fill: '#54b5a9', ring: '#245c59' },
    done: { fill: '#a6cf7f', ring: '#547e3d' },
} as const;

/** Animation durations in milliseconds. */
export const ANIMATION = {
    shakeMs: 360,
    shakeSegments: 6,      // shakeMs / shakeSegments is one sideways swing (yoyo, 2 repeats)
    shakeDistance: 14,
    starFlightMs: 850,
    starPopMs: 150,        // the flying star grows first, then travels
    starPopScale: 1.6,
    stageFadeMs: 600,      // the neglected background fades out over the renovated one (S-16a)
    purchasePopMs: 260,    // the new furniture grows to purchasePopScale and back (yoyo), S-09
    purchasePopScale: 1.08,
    purchaseParticles: 14,
    purchaseParticleMs: 700,
    pressDownMs: 80,
    pressUpMs: 150,
    pressEase: 'Quad.easeOut',
    releaseEase: 'Back.easeOut',
    bounceScale: 1.12,
    bounceMs: 280,
    wobbleAngle: 3,
    wobbleOffset: 4,
    wobbleMs: 520,
    wobbleSwings: 2,
    counterPopScale: 1.18,
    counterPopMs: 220,
    beadPopScale: 1.3,
    beadPopMs: 260,
    entranceSpanMs: 400,
    entranceItemMs: 250,
    entranceRise: 24,
    summaryStarStepMs: 180,
    summaryStarPopMs: 220,
    summaryBurstParticles: 22,
    starStartLift: 116,    // the star starts above the tapped tile (half a tile + popped star) so the answer stays readable
} as const;

/** Stand-in for a drawing whose texture is missing (S-14): a plain rounded box with the Polish value (`TASK_ART` label), so the task stays playable. */
export const ART_STAND_IN = {
    fill: PLACEHOLDER_COLORS.tile,
    border: PLACEHOLDER_COLORS.deepTeal,
    borderWidth: 3,
    radius: 16,
    /** Space kept free between the stand-in text and the box edge, scene pixels... */
    padding: 8,
    /** ...but at most this share of the box's shorter side (visual gate, impl-review F1: a "10 dag" weight on a 1024 px tablet came to
     *  about 10 CSS px with the full padding; the labels are wrapped at their space and kept at 12 CSS px or more in the keypad picture). */
    paddingShare: 0.03,
} as const;

/** Inset of the build id in the screen corner, in scene pixels. */
export const PLACEHOLDER_FRAME = {
    margin: 24,
} as const;
