// Converts the art kits' PNGs to the WebP files the game loads: money, measuring and counting icons of the task screen
// (public/assets/tasks/), the rooms (public/assets/rooms/<room>/, full resolution of the pack; the ROOM_PACKS table is where a new room is added) and the pictures of the
// loading screen, wallet, notebook and salon thumbnail plus three more counting icons from the salon-v2 pack, and the three poses of the fox guide from the fox pack (public/assets/ui/). The kit stays in designs/ (never committed); only the results are. Output is
// deterministic, so re-running it leaves committed files unchanged. Needs the `cwebp` binary (libwebp) and, for the two salon backgrounds,
// `python3` with `pip install pillow==12.1.0 numpy==2.4.3` (scripts/recolour-board.py recolours the green board first; like `npm run font`).
// Usage: npm run art
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOARD_COLOUR = '#BCD799';
/** The two background files of a room that carry the green board. */
const BOARD_FILES = ['architecture-before', 'architecture-after'];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'designs/martynka-maths-A-v1');
const OUT = join(ROOT, 'public/assets/tasks');
const ROOM_OUT = join(ROOT, 'public/assets/rooms');
const SALON_V2 = join(ROOT, 'designs/martynka-salon-v2');
const LOCATIONS_V2 = join(ROOT, 'designs/martynka-locations-v2');
const SPACE_BASE = join(ROOT, 'designs/bystrow-space-base-v1');
const FOX = join(ROOT, 'designs/martynka-fox-guide-v1');
const UI_OUT = join(ROOT, 'public/assets/ui');
const HOUSE = join(ROOT, 'designs/martynka-house-street-v1');
const HOUSE_OUT = join(ROOT, 'public/assets/house');
const SPACE = join(ROOT, 'designs/bystrow-space-base-v1');
const CHOICE_OUT = join(ROOT, 'public/assets/choice');

// Output sizes are at most twice the displayed size (half of the kit's resolution), see the plan, "Ladowanie".
const SQUARE = [256, 256];
const NOTE = [384, 256];
const SCALE = [512, 384];
const FRAME = [256, 768];

const coins = ['coin-01gr', 'coin-02gr', 'coin-05gr', 'coin-10gr', 'coin-20gr', 'coin-50gr', 'coin-1zl', 'coin-2zl', 'coin-5zl'];
const notes = ['note-10zl', 'note-20zl', 'note-50zl', 'note-100zl', 'note-200zl', 'note-500zl'];
const weights = ['weight-1kg', 'weight-2kg', 'weight-5kg', 'weight-10dag', 'weight-20dag', 'weight-50dag'];
const jugs = ['container-1l', 'container-half-l', 'container-quarter-l'];
const icons = ['apple', 'book', 'croissant', 'cup', 'cushion', 'flower', 'key', 'lamp', 'pear', 'pencil', 'teapot', 'yarn'];

/**
 * One row per room (the salon from salon-v2, the kitchen from locations-v2). `pack` is the kit folder, `scene` lists the scene files of the pack's
 * assets/room/, `decor` and `furniture` the PNGs of assets/furniture/; every output goes to public/assets/rooms/<room>/<id>.webp.
 * `recolourBoard` recolours the green board of the two background files (before/after) before the conversion.
 */
const ROOM_PACKS = [
    {
        room: 'salon',
        pack: SALON_V2,
        scene: ['architecture-before', 'architecture-after', 'shadows'],
        decor: ['plant-right'],
        furniture: [
            'sofa-morska', 'sofa-sloneczna', 'sofa-listkowa', 'rug', 'rug-arcs', 'rug-flowers',
            'coffee-table', 'coffee-table-cream', 'coffee-table-turquoise', 'cabinet', 'cabinet-mint', 'cabinet-cream',
            'armchair', 'armchair-mint', 'armchair-sunny', 'wall-frames', 'wall-frames-meadow', 'wall-frames-sky',
            'lamp-table', 'plant-left', 'pouf',
            'curtains-leaf', 'curtains-cream', 'curtains-botanical', 'shelf-oak', 'shelf-mint', 'shelf-arch',
            'lamp-wicker', 'lamp-flower', 'plant-fern', 'plant-ficus', 'pouf-knit', 'pouf-oak',
        ],
        recolourBoard: true,
    },
    {
        room: 'kitchen',
        pack: LOCATIONS_V2,
        scene: ['kitchen-before', 'kitchen-after', 'kitchen-shadows'],
        decor: [],
        furniture: [
            'kitchen-counter-natural', 'kitchen-counter-sunny', 'kitchen-counter-mint',
            'kitchen-fridge-natural', 'kitchen-fridge-sunny', 'kitchen-fridge-mint',
            'kitchen-table-natural', 'kitchen-table-sunny', 'kitchen-table-mint',
            'kitchen-coffee-natural', 'kitchen-coffee-sunny', 'kitchen-coffee-mint',
            'kitchen-bench-natural', 'kitchen-bench-sunny', 'kitchen-bench-mint',
            'kitchen-rack-natural', 'kitchen-rack-sunny', 'kitchen-rack-mint',
        ],
        recolourBoard: false,
    },
    {
        room: 'bridge',
        pack: SPACE_BASE,
        scene: ['bridge-before', 'bridge-after', 'bridge-shadows'],
        decor: [],
        furniture: ['console', 'chair', 'telescope', 'shelf', 'rug', 'plants'].flatMap((slot) => ['natural', 'sunny', 'mint'].map((v) => `bridge-${slot}-${v}`)),
        recolourBoard: false,
    },
];

/** Room files keep the size of the source (the manifest's pixel geometry); no -resize. */
/** @type {Array<{ pack: string, from: string, to: string, recolour: boolean }>} */
const ROOM_JOBS = ROOM_PACKS.flatMap((row) => [
    ...row.scene.map((id) => ({ pack: row.pack, from: `assets/room/${id}.png`, to: `${row.room}/${id}.webp`, recolour: row.recolourBoard && BOARD_FILES.includes(id) })),
    ...[...row.decor, ...row.furniture].map((id) => ({ pack: row.pack, from: `assets/furniture/${id}.png`, to: `${row.room}/${id}.webp`, recolour: false })),
]);

/** @type {Array<{ from: string, to: string, size: number[] }>} */
const JOBS = [
    ...coins.map((id) => ({ from: `assets/money/${id}.png`, to: `money/${id}.webp`, size: SQUARE })),
    ...notes.map((id) => ({ from: `assets/money/${id}.png`, to: `money/${id}.webp`, size: NOTE })),
    { from: 'assets/measuring/balance-scale.png', to: 'measuring/balance-scale.webp', size: SCALE },
    ...weights.map((id) => ({ from: `assets/measuring/${id}.png`, to: `measuring/${id}.webp`, size: SQUARE })),
    ...jugs.map((id) => ({ from: `assets/measuring/${id}.png`, to: `measuring/${id}.webp`, size: SQUARE })),
    { from: 'assets/measuring/thermometer-frame.png', to: 'measuring/thermometer-frame.webp', size: FRAME },
    ...icons.map((id) => ({ from: `assets/icons/${id}.png`, to: `icons/${id}.webp`, size: SQUARE })),
];

/** Pictures of the screens around the tasks (S-16c); `size` is the output size, [] keeps the source size. */
/** @type {Array<{ from: string, to: string, size: number[] }>} */
const UI_JOBS = [
    { from: 'assets/loading/background.png', to: 'loading-background.webp', size: [960, 540] },
    { from: 'assets/loading/title-emblem.png', to: 'loading-emblem.webp', size: [300, 300] },
    { from: 'assets/learning/wallet-open.png', to: 'wallet-open.webp', size: [] },
    { from: 'assets/learning/skill-notebook.png', to: 'skill-notebook.webp', size: [400, 400] },
    { from: 'assets/thumbnails/salon-after.png', to: 'salon-after.webp', size: [480, 270] },
];
const V2_ICONS = ['plate', 'box', 'sticker'];

/** The fox guide poses: the whole 1024 canvas is only resized, never trimmed, so the anchor (0.5, 0.87890625) holds. */
const FOX_POSES = ['idle', 'cheer', 'think'];
const FOX_SIZE = [384, 384];

/** The house pack (S-23): the shell and the two cell pictures at native size; the shell is not a room, so no board recolour. */
const HOUSE_FILES = [
    { from: 'assets/house/house-1-shell.png', to: 'house-1-shell.webp' },
    { from: 'assets/house/cell-closed.png', to: 'cell-closed.webp' },
    { from: 'assets/house/cell-frame.png', to: 'cell-frame.webp' },
];

/** The base pack (S-29): the base shell and the airlock (its closed cell), native size, from SPACE into the house folder; not rooms, no recolour. */
const BASE_FILES = [
    { from: 'assets/base/base-1-shell.png', to: 'base-1-shell.webp' },
    { from: 'assets/base/cell-closed.png', to: 'base-1-cell-closed.webp' },
];

/** The first-building choice cards (S-28): native 720x480, no recolour. */
const CHOICE_FILES = [
    { from: 'assets/choice/choice-house.png', to: 'choice-house.webp' },
    { from: 'assets/choice/choice-space.png', to: 'choice-space.webp' },
];

for (const dir of [KIT, SALON_V2, FOX, HOUSE, SPACE, ...ROOM_PACKS.map((row) => row.pack)]) {
    if (!existsSync(dir)) {
        console.error(`Art kit not found: ${dir} (designs/ is local only)`);
        process.exit(1);
    }
}

/** @param {string} source @param {string} target @param {string[]} resize */
const convert = (source, target, resize) => {
    if (!existsSync(source)) {
        console.error(`Missing kit file: ${source}`);
        process.exit(1);
    }
    mkdirSync(dirname(target), { recursive: true });
    try {
        execFileSync('cwebp', ['-quiet', ...resize, '-q', '85', '-alpha_q', '100', '-m', '6', source, '-o', target]);
    } catch (error) {
        console.error(`cwebp failed for ${source} (is cwebp installed?): ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
    return statSync(target).size;
};

let total = 0;
for (const job of JOBS) {
    const bytes = convert(join(KIT, job.from), join(OUT, job.to), ['-resize', String(job.size[0]), String(job.size[1])]);
    total += bytes;
    console.log(`${job.to}  ${job.size[0]}x${job.size[1]}  ${bytes} B`);
}
for (const job of ROOM_JOBS) {
    let source = join(job.pack, job.from);
    const id = job.to.replace(/^[^/]+\//, '').replace(/\.webp$/, '');
    if (job.recolour) {
        const tmpPng = join(tmpdir(), `${id}-board.png`);
        try {
            execFileSync('python3', ['-I', join(ROOT, 'scripts/recolour-board.py'), source, tmpPng, BOARD_COLOUR], { stdio: ['ignore', 'inherit', 'inherit'] });
        } catch (error) {
            console.error(`recolour-board failed for ${source}: ${error instanceof Error ? error.message : error}`);
            process.exit(1);
        }
        source = tmpPng;
    }
    const bytes = convert(source, join(ROOM_OUT, job.to), []);
    total += bytes;
    console.log(`rooms/${job.to}  ${bytes} B`);
}
for (const job of UI_JOBS) {
    const bytes = convert(join(SALON_V2, job.from), join(UI_OUT, job.to), job.size.length ? ['-resize', String(job.size[0]), String(job.size[1])] : []);
    total += bytes;
    console.log(`ui/${job.to}  ${bytes} B`);
}
for (const id of V2_ICONS) {
    const bytes = convert(join(SALON_V2, `assets/icons/${id}.png`), join(OUT, `icons/${id}.webp`), ['-resize', String(SQUARE[0]), String(SQUARE[1])]);
    total += bytes;
    console.log(`icons/${id}.webp  ${SQUARE[0]}x${SQUARE[1]}  ${bytes} B`);
}
for (const pose of FOX_POSES) {
    const bytes = convert(join(FOX, `assets/fox-${pose}.png`), join(UI_OUT, `fox-${pose}.webp`), ['-resize', String(FOX_SIZE[0]), String(FOX_SIZE[1])]);
    total += bytes;
    console.log(`ui/fox-${pose}.webp  ${FOX_SIZE[0]}x${FOX_SIZE[1]}  ${bytes} B`);
}
for (const file of HOUSE_FILES) {
    const bytes = convert(join(HOUSE, file.from), join(HOUSE_OUT, file.to), []);
    total += bytes;
    console.log(`house/${file.to}  ${bytes} B`);
}
for (const file of BASE_FILES) {
    const bytes = convert(join(SPACE, file.from), join(HOUSE_OUT, file.to), []);
    total += bytes;
    console.log(`house/${file.to}  ${bytes} B`);
}
for (const file of CHOICE_FILES) {
    const bytes = convert(join(SPACE, file.from), join(CHOICE_OUT, file.to), []);
    total += bytes;
    console.log(`choice/${file.to}  ${bytes} B`);
}
console.log(`${CHOICE_FILES.length + HOUSE_FILES.length + BASE_FILES.length + JOBS.length + ROOM_JOBS.length + UI_JOBS.length + V2_ICONS.length + FOX_POSES.length} files, ${total} B`);
