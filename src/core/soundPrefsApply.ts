import type { SoundPrefs } from './sound';

export interface SoundPrefsApplyDeps {
    service: { setPrefs(prefs: SoundPrefs): void } | undefined;
    store: { write(prefs: SoundPrefs): boolean };
    setPrefs(prefs: SoundPrefs): void;
    setKept(kept: boolean): void;
}

/**
 * Applies a sound choice from the settings panel: it holds for this session either way; the return value (and
 * `setKept`) tells whether the device kept it for the next launch (audit FU-16).
 */
export function applySoundPrefs(prefs: SoundPrefs, deps: SoundPrefsApplyDeps): boolean {
    deps.setPrefs(prefs);
    deps.service?.setPrefs(prefs);
    const kept = deps.store.write(prefs);
    deps.setKept(kept);
    return kept;
}
