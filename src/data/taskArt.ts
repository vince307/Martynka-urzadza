// Textures of the task drawings (S-14): the art kit's money, measuring objects and counting icons converted to WebP by
// `npm run art`. The key is the path without extension (plan section 10); the size is the converted file's, which
// tests/taskArt.test.ts checks against the file header. Loaded at start by BootScene so the service worker precaches them.
import { COIN_IDS, ICONS, JUGS, NOTE_IDS, WEIGHTS } from './measures';

export interface TaskArtEntry {
    /** Art id from measures.ts (or `balance-scale` / `thermometer-frame`): what artHealth and the skill filter compare. */
    id: string;
    key: string;
    url: string;
    width: number;
    height: number;
}

const entry = (folder: string, id: string, width: number, height: number): TaskArtEntry => ({
    id,
    key: `tasks/${folder}/${id}`,
    url: `assets/tasks/${folder}/${id}.webp`,
    width,
    height,
});

export const TASK_ART: readonly TaskArtEntry[] = [
    ...COIN_IDS.map((id) => entry('money', id, 256, 256)),
    ...NOTE_IDS.map((id) => entry('money', id, 384, 256)),
    entry('measuring', 'balance-scale', 512, 384),
    ...WEIGHTS.map(({ id }) => entry('measuring', id, 256, 256)),
    ...JUGS.map(({ id }) => entry('measuring', id, 256, 256)),
    entry('measuring', 'thermometer-frame', 256, 768),
    ...ICONS.map(({ id }) => entry('icons', id, 256, 256)),
];

/** Texture key of a money, weight, jug or icon id (the scale and the thermometer frame have their own constants). */
export const ART_KEYS = {
    money: (id: string): string => `tasks/money/${id}`,
    measuring: (id: string): string => `tasks/measuring/${id}`,
    icon: (id: string): string => `tasks/icons/${id}`,
    scale: 'tasks/measuring/balance-scale',
    thermometerFrame: 'tasks/measuring/thermometer-frame',
} as const;
