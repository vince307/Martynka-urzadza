import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { FONT_URL } from '../src/data/layout';
import { ROOM_ART } from '../src/data/roomArt';
import { SOUNDS } from '../src/data/sounds';
import { TASK_ART } from '../src/data/taskArt';
import { UI_ART } from '../src/data/uiArt';

const PUBLIC = join(__dirname, '..', 'public');
/** The cold-start speed behind the `balance.loader` comment (decimal 50 KB/s). */
const COLD_START_BYTES_PER_S = 50_000;
/** What `balance.loader.totalMs` must keep free above the cold-start time of the boot payload. */
const HEADROOM_MS = 2000;

const size = (url: string): number => statSync(join(PUBLIC, url)).size;

/** Bytes of everything the boot queue loads: pictures, the font and the boot sound effects (the larger format). */
const bootPayloadBytes = (): number => {
    const pictures = [...TASK_ART, ...ROOM_ART, ...UI_ART].reduce((sum, art) => sum + size(art.url), 0);
    const sounds = SOUNDS.filter((sound) => sound.boot).reduce((sum, sound) => sum + Math.max(size(sound.urls[0]), size(sound.urls[1])), 0);
    return pictures + size(FONT_URL) + sounds;
};

describe('boot payload budget', () => {
    it('loads in the cold-start time that leaves the headroom under balance.loader.totalMs', () => {
        const bytes = bootPayloadBytes();
        const seconds = bytes / COLD_START_BYTES_PER_S;
        const limit = (balance.loader.totalMs - HEADROOM_MS) / 1000;
        expect(seconds, `boot payload ${bytes} B = ${seconds.toFixed(1)} s at 50 KB/s, limit ${limit} s (totalMs - headroom)`).toBeLessThanOrEqual(limit);
    });
});
