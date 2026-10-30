import saveV1Fixture from '../../tests/fixtures/save-v1.json';
import saveV2LegacySalonFixture from '../../tests/fixtures/save-v2-legacy-salon.json';
import type { Game } from 'phaser';
import type { Autosaver, AutosaveStatus, BackupRecord, SaveStore } from '../core/autosave';
import type { ArtHealth } from '../core/artHealth';
import type { SwStatus } from '../core/swStatus';
import type { SoundService, SoundStatus } from '../ui/sound';
import type { SessionLearner } from '../core/placement';
import { encodeSave, freshSession, NEWER_SAVE, SAVE_VERSION, storedVersionNewer } from '../core/save';
import { playable } from '../core/round/pick';
import type { SkillDef, Settings, StageDef } from '../core/types';
import { stages } from '../data/curriculum';
import { REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { FIRST_HOUSE } from '../data/houses';
import type { BootScene } from '../scenes/BootScene';
import type { RoomScene } from '../scenes/RoomScene';
import type { TaskScene } from '../scenes/TaskScene';
import type { UIScene } from '../scenes/UIScene';
import type { WelcomeScene } from '../scenes/WelcomeScene';

/**
 * Read-only window onto the running game for the e2e build (E2E_HOOK=1). Only
 * main.ts imports this module and uses it only behind `__E2E_HOOK__`, so the
 * production build drops it; the build fails when its marker shows up in a
 * bundle (vite/e2eHookGuard.mjs).
 * No module-level code beyond declarations: importing it changes nothing.
 * Getters only; every value is a frozen copy. The scenes never import this file.
 */

/** `?e2eMonth=0..11` pins the session month in the e2e build; anything else is null (pure parsing, no state). */
export const e2eMonth = (search: string): number | null => {
    const raw = new URLSearchParams(search).get('e2eMonth');
    if (raw === null || !/^\d{1,2}$/.test(raw)) {
        return null;
    }
    const month = Number(raw);
    return month <= 11 ? month : null;
};

export const E2E_MAX_STARS = 500;

/** `?e2eStars=0..500` sets the starting star balance in the e2e build (a seam, not a save); anything else is null. */
export const e2eStars = (search: string): number | null => {
    const raw = new URLSearchParams(search).get('e2eStars');
    if (raw === null || !/^\d{1,3}$/.test(raw)) {
        return null;
    }
    const stars = Number(raw);
    return stars <= E2E_MAX_STARS ? stars : null;
};

/** `?e2eSkills=id,id` lists the skill ids that fill every round in the e2e build (a seam, not a save); absent or empty is null. */
export const e2eSkills = (search: string): string[] | null => {
    const raw = new URLSearchParams(search).get('e2eSkills');
    const ids = (raw ?? '').split(',').map((id) => id.trim()).filter((id) => /^E\d\.\d+\.\w+$/.test(id));
    return ids.length > 0 ? ids : null;
};

/**
 * The skills of a forced round: the ids repeated to `length`. Null (an ordinary round) when no list is set or when an id
 * belongs to another stage (a spec may pin a skill and then change the stage). An id that no stage has, or that is not
 * playable, throws and names it, so a typo in a spec fails loudly instead of silently giving an ordinary round.
 */
export const forcedSkills = (stage: StageDef, ids: readonly string[] | null | undefined, length: number): SkillDef[] | null => {
    if (!ids || ids.length === 0) {
        return null;
    }
    const all = stage.steps.flatMap((step) => step.skills);
    const found = ids.map((id) => all.find((skill) => skill.id === id));
    const elsewhere = (id: string): boolean => Object.values(stages).some((other) => other !== stage && other.steps.some((step) => step.skills.some((skill) => skill.id === id)));
    const bad = ids.filter((id, i) => !elsewhere(id) && (found[i] === undefined || !playable(found[i])));
    if (bad.length > 0) {
        throw new Error(`e2eSkills: unknown or unplayable skill id for stage ${stage.id}: ${bad.join(', ')}`);
    }
    if (found.some((skill) => skill === undefined)) {
        return null;
    }
    return Array.from({ length }, (_, i) => found[i % found.length] as SkillDef);
};

/** `?e2eDay=YYYY-MM-DD` pins the calendar day of the session in the e2e build (a seam, not a clock); a date that does not exist is null. */
export const e2eDay = (search: string): string | null => {
    const raw = new URLSearchParams(search).get('e2eDay');
    const match = raw === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) {
        return null;
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? raw : null;
};

export type E2EVariantSeam = 'off' | 'word' | 'dice' | 'puzzle';
const E2E_VARIANT_SEAMS: readonly string[] = ['off', 'word', 'dice', 'puzzle'];

/**
 * `?e2eVariant=off|word|dice|puzzle` in the e2e build: `off` never schedules a variant, the others make every ordinary
 * round a variant of that kind (the day rule and availability still apply). Anything else is null (the real schedule).
 */
export const e2eVariant = (search: string): E2EVariantSeam | null => {
    const value = new URLSearchParams(search).get('e2eVariant');
    return value !== null && E2E_VARIANT_SEAMS.includes(value) ? (value as E2EVariantSeam) : null;
};

export type E2EArtSeam = 'missing' | 'corrupt' | 'room' | 'stall' | 'stallall' | 'ui';

/**
 * `?e2eArt=missing` queues no task drawing at all; `?e2eArt=room` queues no salon picture; `?e2eArt=ui` points the wallet, notebook and salon thumbnail at a file that is not on the server (the two loading pictures load); `?e2eArt=corrupt` points the coins at a file that is no image
 * (200 and a decode failure, no load error); `?e2eArt=stall` only shortens the loader limit (the spec itself makes a file hang); `?e2eArt=stallall` switches the per-file limit off and shortens the total boot limit (E2E_BOOT_LIMITS). Anything else is null.
 */
export const e2eArt = (search: string): E2EArtSeam | null => {
    const value = new URLSearchParams(search).get('e2eArt');
    return value === 'missing' || value === 'corrupt' || value === 'room' || value === 'stall' || value === 'stallall' || value === 'ui' ? value : null;
};

/** The address `?e2eArt=ui` gives the screen pictures: no such file is served, so each fails with a 404. */
export const UI_MISSING_URL = 'assets/ui/missing-on-purpose.webp';

/** The loader limit under `?e2eArt=stall`, so a run does not wait the real 12 s (no retry). */
export const E2E_LOADER_TIMEOUT_MS = 2000;

/** The boot limits under `?e2eArt=stallall`: the slow line after 0.5 s, the total cut after 3 s. */
export const E2E_BOOT_LIMITS = { slowAfterMs: 500, totalMs: 3000 } as const;

export type E2ESaveSeam = 'unreadable' | 'corrupt' | 'unavailable' | 'hang' | 'writefail' | 'writehang' | 'v1' | 'backupfail' | 'backuphang' | 'slow' | 'slowfail' | 'legacy-salon' | 'newer';
const E2E_SAVE_SEAMS: readonly string[] = ['unreadable', 'corrupt', 'unavailable', 'hang', 'writefail', 'writehang', 'v1', 'backupfail', 'backuphang', 'slow', 'slowfail', 'legacy-salon', 'newer'];

/** The read limit under `?e2eSave=hang`, so the e2e run does not wait the real 5 s. */
export const E2E_LOAD_TIMEOUT_MS = 300;

/** Under `?e2eSave=slow` the read answers (a current-version save with 7 stars) after this long: past the first limit (`E2E_LOAD_TIMEOUT_MS`) and inside the second. */
export const E2E_SLOW_READ_MS = 2500;

/** The second (longer) read limit under `?e2eSave=hang|slow|slowfail`, so a run does not wait the real 20 s; `hang` never answers, so it reaches `stillSlow`. */
export const E2E_SLOWER_LOAD_TIMEOUT_MS = 5000;

/** The write limit under `?e2eSave=writehang`, so the e2e run does not wait the real 5 s. */
export const E2E_WRITE_TIMEOUT_MS = 300;

/**
 * `?e2eSave=` makes the e2e build start with an in-memory store instead of IndexedDB: `unreadable` (a save from a
 * future version), `corrupt` (a save of the current version whose stars field is bad; the migrated-corrupt path is covered by unit tests), `unavailable` (the read rejects), `hang` (the read never answers), `writefail` (a fresh start whose
 * writes reject), `writehang` (a fresh start whose writes never answer), `v1` (the frozen v1 fixture, so the current build meets a real v1 save and migrates it), `backupfail` and `backuphang` (the same v1 fixture, but the copy of it rejects with QuotaExceededError or never answers; writes work), `newer` (a fresh start whose first write succeeds and then leaves a newer version stored, as another tab would: every later write rejects with NewerSave), `slowfail` (the read rejects with UnknownError after `E2E_SLOW_READ_MS`, past the first limit: the late read error behind the slow card), `legacy-salon` (a v2 save from before S-16a: the old salon list with 4 tasks done). Anything else is null.
 */
export const e2eSave = (search: string): E2ESaveSeam | null => {
    const value = new URLSearchParams(search).get('e2eSave');
    return value !== null && E2E_SAVE_SEAMS.includes(value) ? (value as E2ESaveSeam) : null;
};

/** What the seam store holds, for the hook: the order of its operations and the version of the last written value. */
export interface E2ESaveStoreLog {
    ops: ('backup' | 'write')[];
    writtenVersion: number | null;
}

let seamStoreLog: E2ESaveStoreLog | null = null;

/** In-memory store for the e2e seam; remembers writes where they succeed and logs its operations. Never touches IndexedDB. */
export const e2eSaveStore = (seam: E2ESaveSeam): SaveStore => {
    let value: unknown =
        seam === 'unreadable'
            ? { version: 99, profileId: 'default', stars: 7 }
            : seam === 'corrupt'
              ? { version: SAVE_VERSION, profileId: 'default', stars: 'many' } // corrupt in its OWN version (a bad stars field), so the card reads corrupt/stars
              : seam === 'v1' || seam === 'backupfail' || seam === 'backuphang'
                ? structuredClone(saveV1Fixture)
                : seam === 'legacy-salon'
                  ? structuredClone(saveV2LegacySalonFixture) // frozen v2 bytes from before S-16a: 4 of the old 10 salon tasks done
                  : undefined;
    const log: E2ESaveStoreLog = { ops: [], writtenVersion: null };
    const copies = new Map<number, unknown>();
    let record: BackupRecord | null = null;
    seamStoreLog = log;
    return {
        read: () =>
            seam === 'unavailable'
                ? Promise.reject(new DOMException('e2e', 'UnknownError'))
                : seam === 'hang'
                  ? new Promise<unknown>(() => undefined)
                  : seam === 'slowfail'
                    ? new Promise<unknown>((_resolve, reject) => setTimeout(() => reject(new DOMException('e2e', 'UnknownError')), E2E_SLOW_READ_MS))
                    : seam === 'slow'
                    ? new Promise<unknown>((resolve) => setTimeout(() => resolve(encodeSave(freshSession(FIRST_HOUSE, 7))), E2E_SLOW_READ_MS))
                    : Promise.resolve(value),
        backup: (raw, from) => {
            log.ops.push('backup');
            if (seam === 'backupfail') return Promise.reject(new DOMException('e2e', 'QuotaExceededError'));
            if (seam === 'backuphang') return new Promise<'written'>(() => undefined);
            const kept = copies.has(from);
            if (!kept) copies.set(from, raw);
            record = { from, result: 'kept', error: null, at: Date.now() };
            return Promise.resolve(kept ? ('kept' as const) : ('written' as const));
        },
        readBackups: () => Promise.resolve([...copies].sort(([a], [b]) => a - b).map(([from, raw]) => ({ from, raw }))),
        backupRecord: () => Promise.resolve(record),
        noteBackup: (next) => {
            record = next;
            return Promise.resolve();
        },
        write: (next) => {
            if (seam === 'writefail') return Promise.reject(new DOMException('e2e', 'QuotaExceededError'));
            if (seam === 'writehang') {
                log.ops.push('write');
                return new Promise<void>(() => undefined);
            }
            log.ops.push('write');
            if (seam === 'newer' && storedVersionNewer(value, next.version)) {
                return Promise.reject(Object.assign(new Error('e2e'), { name: NEWER_SAVE }));
            }
            value = seam === 'newer' ? { ...next, version: SAVE_VERSION + 1 } : next;
            log.writtenVersion = (value as { version: number }).version;
            return Promise.resolve();
        },
    };
};

export type E2EFailSite = 'step' | 'boot' | 'settings';

/** Message of the error thrown at a forced failure site; also a build guard marker. */
export const E2E_FORCED_FAILURE = 'e2e-forced-failure';

const FAIL_SITES: readonly string[] = ['step', 'boot', 'settings'];

/** `?e2eFail=step|boot|settings` names the site that throws on purpose in the e2e build; anything else is null. */
export const e2eFail = (search: string): E2EFailSite | null => {
    const raw = new URLSearchParams(search).get('e2eFail');
    return raw !== null && FAIL_SITES.includes(raw) ? (raw as E2EFailSite) : null;
};

/** Recursively frozen value: the nested mastery, streak and history of the learner stay read-only. */
const deepFreeze = <T>(value: T): T => {
    if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
};

export const installE2EHook = (game: Game): void => {
    const welcome = (): WelcomeScene => game.scene.getScene(SCENE_KEYS.welcome) as WelcomeScene;
    const onWelcome = (): boolean => game.scene.isActive(SCENE_KEYS.welcome);
    const inRoom = (): boolean => game.scene.isActive(SCENE_KEYS.room);
    const learner = (): Readonly<SessionLearner> | null => {
        const value = game.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined;
        return value ? deepFreeze(structuredClone(value)) : null;
    };
    const settings = (): Readonly<Settings> => {
        const value = game.registry.get(REGISTRY_KEYS.settings) as Settings | undefined;
        return deepFreeze(structuredClone(value ?? { autoRead: null }));
    };
    const storeSnapshot = (): E2ESaveStoreLog | null => (seamStoreLog ? { ops: [...seamStoreLog.ops], writtenVersion: seamStoreLog.writtenVersion } : null);
    const save = (): Readonly<AutosaveStatus & { store: E2ESaveStoreLog | null }> | null => {
        const saver = game.registry.get(REGISTRY_KEYS.saver) as Autosaver | undefined;
        return saver ? deepFreeze({ ...saver.status(), store: storeSnapshot() }) : null;
    };
    const swSnapshot = (): { phase: string; error: string | null; takenOver: boolean } | null => {
        const value = game.registry.get(REGISTRY_KEYS.swStatus) as SwStatus | undefined;
        return value ? { phase: value.phase, error: value.error, takenOver: value.takenOver } : null;
    };
    const artFallbacksSnapshot = (): Record<string, string> => ({ ...((game.registry.get(REGISTRY_KEYS.artFallbacks) as Record<string, string> | undefined) ?? {}) });
    const artHealthSnapshot = (): { total: number; missing: number } | null => {
        const value = game.registry.get(REGISTRY_KEYS.artHealth) as ArtHealth | undefined;
        return value ? { total: value.total, missing: value.missing.length } : null;
    };
    const roomArtHealthSnapshot = (): { total: number; missing: number } | null => {
        const value = game.registry.get(REGISTRY_KEYS.roomArtHealth) as ArtHealth | undefined;
        return value ? { total: value.total, missing: value.missing.length } : null;
    };
    const bootLoadSnapshot = (): { cut: string[]; cutByTable: Record<string, string[]>; creates: number; elapsedMs: number; hiddenMs: number } | null => {
        const value = game.registry.get(REGISTRY_KEYS.bootLoad) as
            | { cut: readonly string[]; cutByTable: Record<string, readonly string[]>; creates: number; elapsedMs: number; hiddenMs: number }
            | undefined;
        return value
            ? {
                  cut: [...value.cut],
                  cutByTable: Object.fromEntries(Object.entries(value.cutByTable).map(([table, keys]) => [table, [...keys]])),
                  creates: value.creates,
                  elapsedMs: value.elapsedMs,
                  hiddenMs: value.hiddenMs,
              }
            : null;
    };
    const fontHealthSnapshot = (): 'loaded' | 'fallback' | null => (game.registry.get(REGISTRY_KEYS.fontHealth) as 'loaded' | 'fallback' | undefined) ?? null;
    const soundSnapshot = (): SoundStatus | null => {
        const value = game.registry.get(REGISTRY_KEYS.sound) as SoundService | undefined;
        return value ? deepFreeze(value.status()) : null;
    };
    const boot = (): BootScene | null => game.scene.getScene(SCENE_KEYS.boot) as BootScene | null;
    const inputEnabled = (): boolean => game.input.enabled;
    const task = (): TaskScene => game.scene.getScene(SCENE_KEYS.task) as TaskScene;
    const ui = (): UIScene => game.scene.getScene(SCENE_KEYS.ui) as UIScene;
    const room = (): RoomScene => game.scene.getScene(SCENE_KEYS.room) as RoomScene;
    Object.defineProperty(window, '__martynkaE2E', {
        value: Object.freeze({
            get snapshot() {
                // While BootScene shows the loading screen there is no other scene to read (audit A-1: the load can hang for seconds).
                const loadingScene = boot();
                if (loadingScene?.isLoading()) {
                    return Object.freeze({ screen: 'loading' as const, loading: Object.freeze({ phase: loadingScene.loadPhase(), art: Object.freeze(loadingScene.loadingArt()) }), save: save(), bootLoad: bootLoadSnapshot(), fontHealth: fontHealthSnapshot(), sound: soundSnapshot(), artFallbacks: artFallbacksSnapshot() });
                }
                // On the welcome there is no round and no HUD yet: task() and ui() must not be called.
                if (onWelcome()) {
                    return Object.freeze({ screen: 'welcome' as const, backdrop: Object.freeze(welcome().backdropState()), learner: learner(), settings: settings(), inputEnabled: inputEnabled(), artFallbacks: artFallbacksSnapshot(), save: save(), artHealth: artHealthSnapshot(), sw: swSnapshot(), bootLoad: bootLoadSnapshot(), fontHealth: fontHealthSnapshot(), sound: soundSnapshot() });
                }
                const round = task().snapshot();
                const screen = inRoom() ? 'room' : round.unlock ? 'unlock' : round.summary ? 'summary' : 'task';
                const speaker = ui().speakerTarget();
                return Object.freeze({ ...round, screen, room: inRoom() ? room().snapshot() : null, learner: learner(), settings: settings(), inputEnabled: inputEnabled(), save: save(), artHealth: artHealthSnapshot(), sw: swSnapshot(), roomArtHealth: roomArtHealthSnapshot(), bootLoad: bootLoadSnapshot(), fontHealth: fontHealthSnapshot(), sound: soundSnapshot(), artFallbacks: artFallbacksSnapshot(), counterText: ui().counterText(), hudTitle: ui().titleText(), settingsHint: ui().settingsHintVisible(), speakerVisible: speaker !== null });
            },
            get backdropPixel() {
                if (boot()?.isLoading()) return null;
                return onWelcome() ? welcome().backdropPixel() : task().backdropPixel();
            },
            get targets() {
                if (onWelcome()) {
                    const { ages, parent } = welcome().targets();
                    return Object.freeze({ ages, parent });
                }
                const round = task().targets();
                return Object.freeze({
                    ...round,
                    // The sleeping task scene keeps its summary buttons: not tappable while the room is open.
                    nextRound: inRoom() ? null : round.nextRound,
                    toRoom: inRoom() ? null : round.toRoom,
                    unlockNext: inRoom() ? null : round.unlockNext,
                    ageBack: inRoom() ? null : round.ageBack,
                    resume: inRoom() ? room().resumeTarget() : null,
                    taskButton: inRoom() ? room().taskButtonTarget() : null,
                    thumbs: inRoom() ? room().thumbTargets() : [],
                    choose: inRoom() ? room().chooseTarget() : null,
                    close: inRoom() ? room().closeTarget() : null,
                    modeButton: inRoom() ? room().modeButtonTarget() : null,
                    cardNext: inRoom() ? room().cardNextTarget() : null,
                    slots: inRoom() ? room().slotTargets() : {},
                    speaker: ui().speakerTarget(),
                    roomSwitch: ui().roomSwitchTarget(),
                    settingsIcon: ui().settingsTarget(),
                });
            },
        }),
        enumerable: false,
    });
};
