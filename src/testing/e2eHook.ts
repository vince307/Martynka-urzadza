import type { Game } from 'phaser';
import type { SessionLearner } from '../core/placement';
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
    const task = (): TaskScene => game.scene.getScene(SCENE_KEYS.task) as TaskScene;
    const ui = (): UIScene => game.scene.getScene(SCENE_KEYS.ui) as UIScene;
    const room = (): RoomScene => game.scene.getScene(SCENE_KEYS.room) as RoomScene;
    Object.defineProperty(window, '__martynkaE2E', {
        value: Object.freeze({
            get snapshot() {
                // On the welcome there is no round and no HUD yet: task() and ui() must not be called.
                if (onWelcome()) {
                    return Object.freeze({ screen: 'welcome' as const, learner: learner() });
                }
                const round = task().snapshot();
                const screen = inRoom() ? 'room' : round.summary ? 'summary' : 'task';
                const speaker = ui().speakerTarget();
                return Object.freeze({ ...round, screen, learner: learner(), counterText: ui().counterText(), speakerVisible: speaker !== null });
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
                    resume: inRoom() ? room().resumeTarget() : null,
                    speaker: ui().speakerTarget(),
                    roomSwitch: ui().roomSwitchTarget(),
                });
            },
        }),
        enumerable: false,
    });
};
