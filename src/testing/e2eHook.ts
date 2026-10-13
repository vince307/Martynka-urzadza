import type { Game } from 'phaser';
import type { Autosaver, AutosaveStatus, SaveStore } from '../core/autosave';
import type { SessionLearner } from '../core/placement';
import { playable } from '../core/round/pick';
import type { SkillDef, Settings, StageDef } from '../core/types';
import { REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
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
 * The skills of a forced round: the ids repeated to `length`. Null (an ordinary round) when no list is set or when
 * any id is not a playable skill of the stage, so an id of a mode that cannot be answered yet never reaches the scene.
 */
export const forcedSkills = (stage: StageDef, ids: readonly string[] | null | undefined, length: number): SkillDef[] | null => {
    if (!ids || ids.length === 0) {
        return null;
    }
    const all = stage.steps.flatMap((step) => step.skills);
    const found = ids.map((id) => all.find((skill) => skill.id === id));
    if (found.some((skill) => skill === undefined || !playable(skill))) {
        return null;
    }
    return Array.from({ length }, (_, i) => found[i % found.length] as SkillDef);
};

export type E2ESaveSeam = 'unreadable' | 'unavailable' | 'hang' | 'writefail';
const E2E_SAVE_SEAMS: readonly string[] = ['unreadable', 'unavailable', 'hang', 'writefail'];

/** The read limit under `?e2eSave=hang`, so the e2e run does not wait the real 5 s. */
export const E2E_LOAD_TIMEOUT_MS = 300;

/**
 * `?e2eSave=` makes the e2e build start with an in-memory store instead of IndexedDB: `unreadable` (a save from a
 * future version), `unavailable` (the read rejects), `hang` (the read never answers), `writefail` (a fresh start whose
 * writes reject). Anything else is null.
 */
export const e2eSave = (search: string): E2ESaveSeam | null => {
    const value = new URLSearchParams(search).get('e2eSave');
    return value !== null && E2E_SAVE_SEAMS.includes(value) ? (value as E2ESaveSeam) : null;
};

/** In-memory store for the e2e seam; remembers writes where they succeed. Never touches IndexedDB. */
export const e2eSaveStore = (seam: E2ESaveSeam): SaveStore => {
    let value: unknown = seam === 'unreadable' ? { version: 99, profileId: 'default', stars: 7 } : undefined;
    return {
        read: () =>
            seam === 'unavailable'
                ? Promise.reject(new DOMException('e2e', 'UnknownError'))
                : seam === 'hang'
                  ? new Promise<unknown>(() => undefined)
                  : Promise.resolve(value),
        write: (next) => {
            if (seam === 'writefail') return Promise.reject(new DOMException('e2e', 'QuotaExceededError'));
            value = next;
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
    const save = (): Readonly<AutosaveStatus> | null => {
        const saver = game.registry.get(REGISTRY_KEYS.saver) as Autosaver | undefined;
        return saver ? deepFreeze({ ...saver.status() }) : null;
    };
    const inputEnabled = (): boolean => game.input.enabled;
    const task = (): TaskScene => game.scene.getScene(SCENE_KEYS.task) as TaskScene;
    const ui = (): UIScene => game.scene.getScene(SCENE_KEYS.ui) as UIScene;
    const room = (): RoomScene => game.scene.getScene(SCENE_KEYS.room) as RoomScene;
    Object.defineProperty(window, '__martynkaE2E', {
        value: Object.freeze({
            get snapshot() {
                // On the welcome there is no round and no HUD yet: task() and ui() must not be called.
                if (onWelcome()) {
                    return Object.freeze({ screen: 'welcome' as const, learner: learner(), settings: settings(), inputEnabled: inputEnabled(), save: save() });
                }
                const round = task().snapshot();
                const screen = inRoom() ? 'room' : round.unlock ? 'unlock' : round.summary ? 'summary' : 'task';
                const speaker = ui().speakerTarget();
                return Object.freeze({ ...round, screen, room: inRoom() ? room().snapshot() : null, learner: learner(), settings: settings(), inputEnabled: inputEnabled(), save: save(), counterText: ui().counterText(), speakerVisible: speaker !== null });
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
