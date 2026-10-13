// Voice rules for the narrator: which system voice reads Polish, and whether
// automatic reading starts on. Pure functions; the speech API stays in src/ui.
import type { Settings } from '../types';

/** True when a BCP 47 tag (also the Android `pl_PL` form) names Polish. */
export const isPolishLang = (lang: string): boolean => /^pl(?:$|[-_])/iu.test(lang.trim());

/** Picks the Polish voice, local ones first; null when the device has none. */
export const pickPolishVoice = <V extends { lang: string; localService: boolean }>(voices: readonly V[]): V | null => {
    const polish = voices.filter((voice) => isPolishLang(voice.lang));
    return polish.find((voice) => voice.localService) ?? polish[0] ?? null;
};

/** Session default of automatic reading for a stage (FR-009). */
export const defaultAutoRead = (stageId: string, stages: readonly string[]): boolean => stages.includes(stageId);

/** Automatic reading in effect: the parent's choice when there is one, else the stage default (FR-009). */
export const effectiveAutoRead = (settings: Settings, stageId: string, autoReadStages: readonly string[]): boolean =>
    settings.autoRead ?? defaultAutoRead(stageId, autoReadStages);
