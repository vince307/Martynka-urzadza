// Converts the art kit's money, measuring and counting-icon PNGs to the WebP files the task screen loads
// (public/assets/tasks/). The kit stays in designs/ (never committed); only the results are. Output is
// deterministic, so re-running it leaves committed files unchanged. Needs the `cwebp` binary (libwebp).
// Usage: npm run art
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'designs/martynka-maths-A-v1');
const OUT = join(ROOT, 'public/assets/tasks');

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

if (!existsSync(KIT)) {
    console.error(`Art kit not found: ${KIT} (designs/ is local only)`);
    process.exit(1);
}

let total = 0;
for (const job of JOBS) {
    const source = join(KIT, job.from);
    const target = join(OUT, job.to);
    if (!existsSync(source)) {
        console.error(`Missing kit file: ${source}`);
        process.exit(1);
    }
    mkdirSync(dirname(target), { recursive: true });
    try {
        execFileSync('cwebp', ['-quiet', '-resize', String(job.size[0]), String(job.size[1]), '-q', '85', '-alpha_q', '100', '-m', '6', source, '-o', target]);
    } catch (error) {
        console.error(`cwebp failed for ${job.from} (is cwebp installed?): ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
    const bytes = statSync(target).size;
    total += bytes;
    console.log(`${job.to}  ${job.size[0]}x${job.size[1]}  ${bytes} B`);
}
console.log(`${JOBS.length} files, ${total} B`);
