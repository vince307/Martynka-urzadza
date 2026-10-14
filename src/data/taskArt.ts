// Textures of the task drawings (S-14): the art kit's money, measuring objects and counting icons converted to WebP by
// `npm run art`. The key is the path without extension (plan section 10); the size is the converted file's, which
// tests/taskArt.test.ts checks against the file header. Loaded at start by BootScene so the service worker precaches them.
import { formatMoney } from '../core/text/measure';
import { ICONS, JUGS, MONEY, WEIGHTS } from './measures';

export interface TaskArtEntry {
    /** Art id from measures.ts (or `balance-scale` / `thermometer-frame`): what artHealth and the skill filter compare. */
    id: string;
    key: string;
    url: string;
    width: number;
    height: number;
    /** Polish text of the stand-in box when the texture is missing (a value or a noun from data, never the id); '' for none. */
    label: string;
}

const entry = (folder: string, id: string, width: number, height: number, label: string): TaskArtEntry => ({
    id,
    key: `tasks/${folder}/${id}`,
    url: `assets/tasks/${folder}/${id}.webp`,
    width,
    height,
    label,
});

export const TASK_ART: readonly TaskArtEntry[] = [
    ...MONEY.map(({ id, grosze }) => entry('money', id, id.startsWith('note') ? 384 : 256, 256, formatMoney(grosze))),
    entry('measuring', 'balance-scale', 512, 384, ''),
    ...WEIGHTS.map(({ id, label }) => entry('measuring', id, 256, 256, label)),
    ...JUGS.map(({ id, label }) => entry('measuring', id, 256, 256, label)),
    entry('measuring', 'thermometer-frame', 256, 768, ''),
    ...ICONS.map(({ id, noun }) => entry('icons', id, 256, 256, noun)),
];

/** Texture key of a money, weight, jug or icon id (the scale and the thermometer frame have their own constants). */
export const ART_KEYS = {
    money: (id: string): string => `tasks/money/${id}`,
    measuring: (id: string): string => `tasks/measuring/${id}`,
    icon: (id: string): string => `tasks/icons/${id}`,
    scale: 'tasks/measuring/balance-scale',
    thermometerFrame: 'tasks/measuring/thermometer-frame',
} as const;
