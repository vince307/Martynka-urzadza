import type { SoundId } from '../core/sound';

export interface SoundDef {
    id: SoundId;
    /** Phaser cache key. */
    key: string;
    /** [m4a, ogg]: Phaser picks the first format the browser can play. */
    urls: readonly [string, string];
    /** Logical length in seconds (from the pack manifest, without encoder padding). */
    durationS: number;
    /** Loaded with the boot queue; the music loads later and only when the parent turns it on. */
    boot: boolean;
}

const DURATIONS: readonly (readonly [SoundId, number])[] = [
    ['answer-right', 0.48], ['answer-retry', 0.32], ['star', 0.23], ['round-bonus', 1.2], ['tap', 0.07],
    ['panel-open', 0.32], ['variant-pick', 0.16], ['purchase', 0.76], ['room-done', 2.3], ['skill-unlock', 1.4],
    ['coin', 0.16], ['minigame-done', 1.5], ['music-loop', 48],
];

export const SOUNDS: readonly SoundDef[] = DURATIONS.map(([id, durationS]) => ({
    id,
    key: `sounds/${id}`,
    urls: [`assets/sounds/m4a/${id}.m4a`, `assets/sounds/ogg/${id}.ogg`] as const,
    durationS,
    boot: id !== 'music-loop',
}));
