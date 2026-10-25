import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// M-1: scripts/recolour-board.py must refuse a wrong image instead of writing it with exit 0.
// Runs the real script on synthetic PNGs, only where python3 has exactly the pinned Pillow / numpy.

const SCRIPT = 'scripts/recolour-board.py';
const source = readFileSync(SCRIPT, 'utf8');
const pinned = (name: 'PILLOW' | 'NUMPY'): string => new RegExp(`^PINNED_${name} = '([^']+)'`, 'm').exec(source)?.[1] ?? '';
const PILLOW = pinned('PILLOW');
const NUMPY = pinned('NUMPY');
const py = process.env.RECOLOUR_BOARD_PYTHON ?? 'python3';

function probe(): string | null {
    const run = spawnSync(py, ['-I', '-B', '-c', 'import PIL, numpy; print(PIL.__version__, numpy.__version__)'], { encoding: 'utf8' });
    if (run.error || run.status !== 0) return 'python3 cannot import PIL and numpy';
    const found = run.stdout.trim();
    if (found !== `${PILLOW} ${NUMPY}`) {
        const [p = '?', n = '?'] = found.split(' ');
        return `found Pillow ${p} / numpy ${n}`;
    }
    return null;
}

const reason = probe();
const ready = reason === null;
const needs = `needs Pillow ${PILLOW} / numpy ${NUMPY}`;
// Written straight to stderr: vitest 5's default reporter hides console output of a file whose tests all skip, so a
// console.warn would never reach the CI log (impl-review F1).
if (!ready) process.stderr.write(`recolourBoard: skipped: ${reason}; ${needs}\n`);

const dir = mkdtempSync(join(tmpdir(), 'recolour-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function makePng(name: string, body: string): string {
    const file = join(dir, name);
    const code = `from PIL import Image\nimport numpy as np\na = np.zeros((40, 60, 3), np.uint8)\n${body}\nImage.fromarray(a).save(${JSON.stringify(file)})`;
    const run = spawnSync(py, ['-I', '-B', '-c', code], { encoding: 'utf8' });
    if (run.status !== 0) throw new Error(run.stderr);
    return file;
}

function recolour(input: string, out: string) {
    return spawnSync(py, ['-I', '-B', SCRIPT, input, out, '#BCD799'], { encoding: 'utf8' });
}

describe.skipIf(!ready)(ready ? 'recolour-board guard' : `recolour-board guard (skipped: ${reason}; ${needs})`, () => {
    it('refuses an image with no green at the edge and names the non-finite result', () => {
        const input = makePng('grey.png', 'a[:] = 128');
        const out = join(dir, 'grey-out.png');
        const run = recolour(input, out);
        expect(run.status).not.toBe(0);
        expect(run.stderr).toContain('grey.png');
        expect(run.stderr).toContain('non-finite');
        expect(existsSync(out)).toBe(false);
    });

    it('refuses an all-green image and states the share', () => {
        const input = makePng('green.png', 'a[:] = (40, 200, 40)');
        const out = join(dir, 'green-out.png');
        const run = recolour(input, out);
        expect(run.status).not.toBe(0);
        expect(run.stderr).toContain('green.png');
        expect(run.stderr).toContain('100.0%');
        expect(existsSync(out)).toBe(false);
    });

    it('accepts a 15 % green band, prints the share and writes the image', () => {
        const input = makePng('band.png', 'a[:] = 128\na[:3] = (40, 200, 40)\na[-3:] = (40, 200, 40)');
        const out = join(dir, 'band-out.png');
        const run = recolour(input, out);
        expect(run.status).toBe(0);
        expect(run.stdout).toContain('board mask 15.00%');
        expect(existsSync(out)).toBe(true);
    });
});
