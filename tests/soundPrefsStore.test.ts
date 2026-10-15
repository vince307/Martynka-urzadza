import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SOUND_PREFS } from '../src/core/sound';
import { createSoundPrefStore, SOUND_PREFS_KEY } from '../src/storage/soundPrefs';

const memory = (): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('sound preference store', () => {
    it('no key gives the defaults', () => {
        expect(createSoundPrefStore(memory()).read()).toEqual(DEFAULT_SOUND_PREFS);
    });
    it('no storage gives the defaults and a write reports false', () => {
        const store = createSoundPrefStore(undefined);
        expect(store.read()).toEqual(DEFAULT_SOUND_PREFS);
        expect(store.write({ effects: false, music: true })).toBe(false);
    });
    it('getItem throws gives the defaults', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const store = createSoundPrefStore({ getItem: () => { throw new Error('denied'); }, setItem: () => undefined });
        expect(store.read()).toEqual(DEFAULT_SOUND_PREFS);
    });
    it('setItem throws gives false', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const store = createSoundPrefStore({ getItem: () => null, setItem: () => { throw new Error('quota'); } });
        expect(store.write({ effects: true, music: true })).toBe(false);
    });
    it('a write is read back unchanged, under the one key', () => {
        const storage = memory();
        const store = createSoundPrefStore(storage);
        expect(store.write({ effects: false, music: true })).toBe(true);
        expect(storage.data.has(SOUND_PREFS_KEY)).toBe(true);
        expect(createSoundPrefStore(storage).read()).toEqual({ effects: false, music: true });
    });
    it('garbage in the key gives the defaults', () => {
        const storage = memory();
        storage.data.set(SOUND_PREFS_KEY, '{nope');
        expect(createSoundPrefStore(storage).read()).toEqual(DEFAULT_SOUND_PREFS);
    });
});
