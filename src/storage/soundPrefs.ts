import { DEFAULT_SOUND_PREFS, parseSoundPrefsWithProblem, type SoundPrefs } from '../core/sound';

/** A device preference outside the save (S-16b): the save format stays as it is. The only file that touches `localStorage` for sound. */
export const SOUND_PREFS_KEY = 'martynka:sound';

/** Written and removed at start to learn whether the device keeps a choice; not a save or registry key. */
export const SOUND_PREFS_PROBE_KEY = 'martynka:sound:probe';

export interface SoundPrefStore {
    read(): SoundPrefs;
    /** False when the value could not be kept (private window, quota, no storage). */
    write(prefs: SoundPrefs): boolean;
    /** True when the device keeps a value (a probe key is written and removed). */
    probe(): boolean;
}

export const createSoundPrefStore = (storage: Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'removeItem'>> | undefined): SoundPrefStore => ({
    read: () => {
        try {
            const raw = storage?.getItem(SOUND_PREFS_KEY) ?? null;
            const { prefs, problem } = parseSoundPrefsWithProblem(raw);
            if (raw !== null && problem !== null) {
                console.warn(`Sound preference not used; using the defaults (${problem})`);
            }
            return prefs;
        } catch (error) {
            console.warn('Sound preference not readable; using the defaults', error);
            return { ...DEFAULT_SOUND_PREFS };
        }
    },
    probe: () => {
        try {
            if (!storage?.removeItem) return false;
            storage.setItem(SOUND_PREFS_PROBE_KEY, '1');
            storage.removeItem(SOUND_PREFS_PROBE_KEY);
            return true;
        } catch (error) {
            console.warn('Sound preference storage refused a test write', error);
            return false;
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
