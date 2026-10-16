// Makes the app icons (home screen, maskable, iPad apple-touch, favicon) from the art
// pack in designs/ (local only, read-only): cwebp resizes losslessly, dwebp writes the
// PNG. Deterministic, so re-running leaves the committed files unchanged.
// Needs cwebp and dwebp (libwebp). Usage: node scripts/make-icons.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = join(ROOT, 'designs/martynka-salon-v2/assets/app');

/** @type {Array<{ file: string, size: number, source: string }>} */
const ICONS = [
    { file: 'public/icons/icon-192.png', size: 192, source: 'app-icon.png' },
    { file: 'public/icons/icon-512.png', size: 512, source: 'app-icon.png' },
    { file: 'public/icons/icon-maskable-512.png', size: 512, source: 'app-icon-maskable.png' },
    { file: 'public/icons/apple-touch-icon-180.png', size: 180, source: 'app-icon.png' },
    { file: 'public/favicon.png', size: 48, source: 'app-icon.png' },
];

function fail(message) {
    console.error(`make-icons: ${message}`);
    process.exit(1);
}

function run(binary, args) {
    try {
        execFileSync(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (error) {
        fail(`${binary} failed (${error.code ?? error.message})`);
    }
}

for (const icon of ICONS) {
    if (!existsSync(join(PACK, icon.source))) fail(`missing ${join(PACK, icon.source)}`);
}

const work = mkdtempSync(join(tmpdir(), 'martynka-icons-'));
try {
    for (const icon of ICONS) {
        const webp = join(work, `${icon.size}-${icon.source}.webp`);
        const out = join(ROOT, icon.file);
        mkdirSync(dirname(out), { recursive: true });
        run('cwebp', ['-quiet', '-lossless', '-exact', '-resize', String(icon.size), String(icon.size), join(PACK, icon.source), '-o', webp]);
        run('dwebp', ['-quiet', webp, '-o', out]);
        console.log(`wrote ${icon.file}`);
    }
} finally {
    rmSync(work, { recursive: true, force: true });
}
