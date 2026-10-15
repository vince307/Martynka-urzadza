// S-16b: sound decisions outside Phaser. The service and the scenes only carry these out.
export type SoundId =
    | 'answer-right' | 'answer-retry' | 'star' | 'round-bonus' | 'tap' | 'panel-open' | 'variant-pick'
    | 'purchase' | 'room-done' | 'skill-unlock' | 'coin' | 'minigame-done' | 'music-loop';

export interface SoundPrefs { effects: boolean; music: boolean }
/** Effects on, music off (author decision 2026-10-15); the parent changes both in the settings panel. */
export const DEFAULT_SOUND_PREFS: SoundPrefs = { effects: true, music: false };
export type SoundOutcome = 'played' | 'off' | 'locked' | 'missing';

/** Accepts a JSON string or an object; a field that is not a boolean takes its default, garbage gives the defaults. */
export function parseSoundPrefs(raw: unknown): SoundPrefs {
    let value: unknown = raw;
    if (typeof raw === 'string') {
        try { value = JSON.parse(raw); } catch { return { ...DEFAULT_SOUND_PREFS }; }
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ...DEFAULT_SOUND_PREFS };
    const o = value as Record<string, unknown>;
    return {
        effects: typeof o.effects === 'boolean' ? o.effects : DEFAULT_SOUND_PREFS.effects,
        music: typeof o.music === 'boolean' ? o.music : DEFAULT_SOUND_PREFS.music,
    };
}

/** Order: switched off, then not in the cache, then the audio context still locked, else played. */
export function soundOutcome(kind: 'effect' | 'music', prefs: SoundPrefs, state: { locked: boolean; exists: boolean }): SoundOutcome {
    if (!(kind === 'effect' ? prefs.effects : prefs.music)) return 'off';
    if (!state.exists) return 'missing';
    if (state.locked) return 'locked';
    return 'played';
}

/** Frames to keep of a decoded buffer: the logical length at the context rate (encoder padding is cut), never more than exist. */
export function trimFrameCount(durationS: number, sampleRate: number, available: number): number {
    if (!Number.isFinite(durationS) || durationS <= 0) return available;
    return Math.min(Math.round(durationS * sampleRate), available);
}

/** How long spoken text waits for a cue that played; 0 when nothing played. */
export function cueDelayMs(outcome: SoundOutcome, durationS: number, gapMs: number): number {
    return outcome === 'played' ? Math.round(durationS * 1000) + gapMs : 0;
}
