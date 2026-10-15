// Converts the art kits' PNGs to the WebP files the game loads: money, measuring and counting icons of the task screen
// (public/assets/tasks/) and the salon of the room (public/assets/rooms/salon/, full resolution of the pack). The kit stays in designs/ (never committed); only the results are. Output is
// deterministic, so re-running it leaves committed files unchanged. Needs the `cwebp` binary (libwebp).
// Usage: npm run art
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'designs/martynka-maths-A-v1');
const OUT = join(ROOT, 'public/assets/tasks');
const EXPANSION = join(ROOT, 'designs/martynka-expansion-v1');
const ROOM_OUT = join(ROOT, 'public/assets/rooms');

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

const sceneFiles = ['architecture-before', 'architecture-after', 'furnishings-before', 'shadows'];
const decor = ['lamp-table', 'plant-left', 'plant-right', 'pouf'];
const furniture = [
    'sofa-morska', 'sofa-sloneczna', 'sofa-listkowa', 'rug', 'rug-arcs', 'rug-flowers',
    'coffee-table', 'coffee-table-cream', 'coffee-table-turquoise', 'cabinet', 'cabinet-mint', 'cabinet-cream',
    'armchair', 'armchair-mint', 'armchair-sunny', 'wall-frames', 'wall-frames-meadow', 'wall-frames-sky',
];

/** Salon files keep the size of the source (the manifest's pixel geometry); no -resize. */
/** @type {Array<{ from: string, to: string }>} */
const ROOM_JOBS = [
    ...sceneFiles.map((id) => ({ from: `assets/room/${id}.png`, to: `salon/${id}.webp` })),
    ...[...decor, ...furniture].map((id) => ({ from: `assets/furniture/${id}.png`, to: `salon/${id}.webp` })),
];

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

for (const dir of [KIT, EXPANSION]) {
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
    const bytes = convert(join(EXPANSION, job.from), join(ROOM_OUT, job.to), []);
    total += bytes;
    console.log(`rooms/${job.to}  ${bytes} B`);
}
console.log(`${JOBS.length + ROOM_JOBS.length} files, ${total} B`);
