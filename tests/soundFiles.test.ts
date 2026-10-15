import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOUNDS } from '../src/data/sounds';

const PUBLIC = join(__dirname, '..', 'public');
const SOUND_DIR = join(PUBLIC, 'assets', 'sounds');

const filesUnder = (dir: string, base = ''): string[] =>
    readdirSync(dir).flatMap((name) => {
        const rel = base === '' ? name : `${base}/${name}`;
        return statSync(join(dir, name)).isDirectory() ? filesUnder(join(dir, name), rel) : [`assets/sounds/${rel}`];
    });

describe('sound files', () => {
    it('every URL of the SOUNDS table exists in public/ and is not empty', () => {
        for (const sound of SOUNDS) {
            for (const url of sound.urls) {
                expect(statSync(join(PUBLIC, url)).size, url).toBeGreaterThan(0);
            }
        }
    });

    it('every file under public/assets/sounds has a table entry', () => {
        const listed = new Set(SOUNDS.flatMap((sound) => sound.urls));
        const onDisk = filesUnder(SOUND_DIR);
        expect(onDisk.filter((file) => !listed.has(file))).toEqual([]);
        expect(onDisk).toHaveLength(listed.size);
    });

    it('has a m4a and an ogg per sound, 13 sounds, keys unique', () => {
        expect(SOUNDS).toHaveLength(13);
        expect(new Set(SOUNDS.map((s) => s.key)).size).toBe(13);
        for (const sound of SOUNDS) {
            expect(sound.urls[0].endsWith(`${sound.id}.m4a`)).toBe(true);
            expect(sound.urls[1].endsWith(`${sound.id}.ogg`)).toBe(true);
        }
    });
});
