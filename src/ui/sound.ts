import type { Game } from 'phaser';
import { soundOutcome, trimFrameCount, type SoundId, type SoundOutcome, type SoundPrefs } from '../core/sound';
import { balance } from '../data/balance';
import { SOUNDS } from '../data/sounds';

export interface SoundStatus {
    prefs: SoundPrefs;
    locked: boolean;
    log: readonly { id: SoundId; outcome: SoundOutcome }[];
    /** Cache keys of effects that did not load or decode. */
    missing: readonly string[];
    music: 'off' | 'loading' | 'playing' | 'missing';
}

export interface SoundService {
    play(id: SoundId): SoundOutcome;
    setPrefs(prefs: SoundPrefs): void;
    prefs(): SoundPrefs;
    status(): SoundStatus;
    /** Called once by BootScene with the effects that are not in the cache. */
    setMissing(keys: readonly string[]): void;
}

/**
 * The one place that plays sound. A missing, locked or throwing sound is an outcome and a warning, never an exception:
 * the game plays on without it. Effects never touch the narrator.
 */
export const createSoundService = (game: Game, initial: SoundPrefs): SoundService => {
    let current: SoundPrefs = { ...initial };
    let missing: readonly string[] = [];
    const log: { id: SoundId; outcome: SoundOutcome }[] = [];
    const record = (id: SoundId, outcome: SoundOutcome): SoundOutcome => {
        log.push({ id, outcome });
        if (log.length > balance.sound.logSize) log.shift();
        return outcome;
    };
    const locked = (): boolean => ('locked' in game.sound ? Boolean((game.sound as { locked?: boolean }).locked) : false);
    return {
        play: (id) => {
            const def = SOUNDS.find((s) => s.id === id);
            if (!def) return record(id, 'missing');
            try {
                const outcome = soundOutcome('effect', current, { locked: locked(), exists: game.cache.audio.exists(def.key) });
                if (outcome === 'played') game.sound.play(def.key, { volume: balance.sound.masterVolume * balance.sound.effectVolume });
                return record(id, outcome);
            } catch (error) {
                console.warn(`Sound failed to play: ${id}`, error);
                return record(id, 'missing');
            }
        },
        setPrefs: (prefs) => { current = { ...prefs }; },
        prefs: () => ({ ...current }),
        status: () => ({ prefs: { ...current }, locked: locked(), log: [...log], missing, music: 'off' }),
        setMissing: (keys) => { missing = [...keys]; },
    };
};

/**
 * Cuts the encoder padding off every loaded effect: a decoded buffer is copied to its logical length (trimFrameCount)
 * and put back in the cache under the same key. Returns the keys that could not be trimmed (counted as missing).
 */
export const trimEffects = (game: Game): string[] => {
    const failed: string[] = [];
    const context = (game.sound as { context?: AudioContext }).context;
    for (const def of SOUNDS) {
        if (!def.boot || !game.cache.audio.exists(def.key)) continue;
        try {
            const buffer = game.cache.audio.get(def.key) as AudioBuffer | undefined;
            if (!context || !buffer || typeof buffer.getChannelData !== 'function') continue;   // no Web Audio: nothing to trim
            const frames = trimFrameCount(def.durationS, buffer.sampleRate, buffer.length);
            if (frames >= buffer.length) continue;
            const cut = context.createBuffer(buffer.numberOfChannels, frames, buffer.sampleRate);
            for (let c = 0; c < buffer.numberOfChannels; c += 1) {
                cut.copyToChannel(buffer.getChannelData(c).subarray(0, frames), c);
            }
            game.cache.audio.add(def.key, cut);
        } catch (error) {
            console.warn(`Sound trim failed: ${def.key}`, error);
            game.cache.audio.remove(def.key);   // an untrimmed effect would click; better none
            failed.push(def.key);
        }
    }
    return failed;
};
