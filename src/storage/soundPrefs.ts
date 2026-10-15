import { DEFAULT_SOUND_PREFS, parseSoundPrefs, type SoundPrefs } from '../core/sound';

/** A device preference outside the save (S-16b): the save format stays as it is. The only file that touches `localStorage` for sound. */
export const SOUND_PREFS_KEY = 'martynka:sound';

export interface SoundPrefStore {
    read(): SoundPrefs;
    /** False when the value could not be kept (private window, quota, no storage). */
    write(prefs: SoundPrefs): boolean;
}

export const createSoundPrefStore = (storage: Pick<Storage, 'getItem' | 'setItem'> | undefined): SoundPrefStore => ({
    read: () => {
        try {
            return parseSoundPrefs(storage?.getItem(SOUND_PREFS_KEY) ?? null);
        } catch (error) {
            console.warn('Sound preference not readable; using the defaults', error);
            return { ...DEFAULT_SOUND_PREFS };
        }
    },
    write: (prefs) => {
        try {
            if (!storage) return false;
            storage.setItem(SOUND_PREFS_KEY, JSON.stringify(prefs));
            return true;
        } catch (error) {
            console.warn('Sound preference not saved', error);
            return false;
        }
    },
});

/** `window.localStorage`, or undefined when even touching it throws (blocked site data). */
export const deviceStorage = (): Storage | undefined => {
    try {
        return window.localStorage;
    } catch {
        return undefined;
    }
};
