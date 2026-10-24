// The fox guide's pose as a pure function of the screen and the round phase (PRD FR-037, DESIGN-GAP 165-168). No state: the scene calls it on every render.
import type { UiArtId } from '../data/uiArt';
import type { RoundPhase } from './round';

export type GuidePose = 'idle' | 'cheer' | 'think';
export type GuideScreen = 'task' | 'summary' | 'unlock';

/** The UI picture of each pose (`UI_ART`); the pack's common anchor makes a swap keep the feet in place. */
export const GUIDE_ART: Record<GuidePose, UiArtId> = { idle: 'guideIdle', cheer: 'guideCheer', think: 'guideThink' };

/** `null` means no fox (the unlock card). A miss thinks (never disappointed) until the next correct answer or task. */
export const guidePose = (screen: GuideScreen, phase: RoundPhase): GuidePose | null => {
    switch (screen) {
        case 'unlock': return null;
        case 'summary': return 'cheer';
        case 'task':
            switch (phase) {
                case 'first': return 'idle';
                case 'second': case 'solution': case 'retype': return 'think';
                case 'done': return 'cheer';
                default: { const _exhaustive: never = phase; return _exhaustive; }
            }
        default: { const _exhaustive: never = screen; return _exhaustive; }
    }
};
