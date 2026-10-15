// Copies the sound effects and the music loop from the art pack (designs/, local only)
// to public/assets/sounds/{m4a,ogg}, byte for byte. WAV and QA files stay out.
// Deterministic: a second run leaves the committed files unchanged.
// Usage: node scripts/copy-sounds.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = join(ROOT, 'designs', 'martynka-salon-v2');
const OUT = join(ROOT, 'public', 'assets', 'sounds');
const FORMATS = ['m4a', 'ogg'];

const manifestPath = join(PACK, 'audio-manifest.json');
if (!existsSync(manifestPath)) {
    console.error(`Pack manifest not found: ${manifestPath}`);
    process.exit(1);
}
const ids = JSON.parse(readFileSync(manifestPath, 'utf8')).tracks.map((t) => t.id);

let failed = false;
for (const format of FORMATS) {
    mkdirSync(join(OUT, format), { recursive: true });
    for (const id of ids) {
        const from = join(PACK, 'audio', format, `${id}.${format}`);
        if (!existsSync(from)) {
            console.error(`Missing in the pack: ${from}`);
            failed = true;
            continue;
        }
        copyFileSync(from, join(OUT, format, `${id}.${format}`));
    }
}
if (failed) {
    process.exit(1);
}
console.log(`Copied ${ids.length * FORMATS.length} sound files to public/assets/sounds`);
