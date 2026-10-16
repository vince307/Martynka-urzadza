// S-16b: sound decisions outside Phaser. The service and the scenes only carry these out.
import type { RoundState } from './round';
import type { PanelEvent, PanelState, PanelStep } from './variantPanel';
import type { RoundKind } from './variants';

export type SoundId =
    | 'answer-right' | 'answer-retry' | 'star' | 'round-bonus' | 'tap' | 'panel-open' | 'variant-pick'
    | 'purchase' | 'room-done' | 'skill-unlock' | 'coin' | 'minigame-done' | 'music-loop';

export interface SoundPrefs { effects: boolean; music: boolean }
/** Effects on, music off (author decision 2026-10-15); the parent changes both in the settings panel. */
export const DEFAULT_SOUND_PREFS: SoundPrefs = { effects: true, music: false };
export type SoundOutcome = 'played' | 'off' | 'locked' | 'missing';

/** Accepts a JSON string or an object; a field that is not a boolean takes its default, garbage gives the defaults. */
export function parseSoundPrefs(raw: unknown): SoundPrefs {
    let value: unknown = raw;
    if (typeof raw === 'string') {
        try { value = JSON.parse(raw); } catch { return { ...DEFAULT_SOUND_PREFS }; }
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ...DEFAULT_SOUND_PREFS };
    const o = value as Record<string, unknown>;
    return {
        effects: typeof o.effects === 'boolean' ? o.effects : DEFAULT_SOUND_PREFS.effects,
        music: typeof o.music === 'boolean' ? o.music : DEFAULT_SOUND_PREFS.music,
    };
}

/** Order: switched off, then not in the cache, then the audio context still locked, else played. */
export function soundOutcome(kind: 'effect' | 'music', prefs: SoundPrefs, state: { locked: boolean; exists: boolean }): SoundOutcome {
    if (!(kind === 'effect' ? prefs.effects : prefs.music)) return 'off';
    if (!state.exists) return 'missing';
    if (state.locked) return 'locked';
    return 'played';
}

export type MusicState = 'off' | 'loading' | 'waiting-unlock' | 'playing' | 'missing';
export type MusicLine = 'loading' | 'waitingUnlock' | 'missing';

/** The one muted line under the music group: only while music is switched on and not playing. */
export function musicLine(prefs: SoundPrefs, music: MusicState): MusicLine | null {
    if (!prefs.music) return null;
    if (music === 'loading') return 'loading';
    if (music === 'waiting-unlock') return 'waitingUnlock';
    if (music === 'missing') return 'missing';
    return null;
}

/** Frames to keep of a decoded buffer: the logical length at the context rate (encoder padding is cut), never more than exist. */
export function trimFrameCount(durationS: number, sampleRate: number, available: number): number {
    if (!Number.isFinite(durationS) || durationS <= 0) return available;
    return Math.min(Math.round(durationS * sampleRate), available);
}

/** How long spoken text waits for a cue that played; 0 when nothing played. */
export function cueDelayMs(outcome: SoundOutcome, durationS: number, gapMs: number): number {
    return outcome === 'played' ? Math.round(durationS * 1000) + gapMs : 0;
}

/** The part of a `TrayDragState` the cue rule reads. */
export interface DragShape { carrying: unknown; mat: Readonly<Record<string, number>> }

export interface Cue { id: SoundId; delayMs: number }

/** One round transition to the cues it earns; the scene only schedules them. */
export function roundCues(before: RoundState, after: RoundState, kind: RoundKind, starDelayMs: number): readonly Cue[] {
    const cues: Cue[] = [];
    if (before.phase !== 'done' && after.phase === 'done' && !after.finished) {
        cues.push({ id: 'answer-right', delayMs: 0 });
        // Only a star paid by this very answer; the bonus added by "Dalej" is not a star.
        if (after.starsEarned > before.starsEarned) cues.push({ id: 'star', delayMs: starDelayMs });
    } else if (before.phase === 'first' && after.phase === 'second') {
        cues.push({ id: 'answer-retry', delayMs: 0 });
    }
    if (!before.finished && after.finished) {
        if (kind !== 'round') cues.push({ id: 'minigame-done', delayMs: 0 });
        else if (after.bonusEarned > 0) cues.push({ id: 'round-bonus', delayMs: 0 });
    }
    return cues;
}

/** A panel step to its cue: opening, previewing a variant, and every "Wybieram" (a purchase or a free change). */
export function panelCue(before: PanelState, step: PanelStep, event: PanelEvent): SoundId | null {
    if (step.bought || step.changed) return 'purchase';
    if (before.kind === 'closed' && step.panel.kind === 'open') return 'panel-open';
    if (event.type === 'pick' && step.panel.kind === 'open' && step.panel.preview === event.variant) return 'variant-pick';
    return null;
}

const matTotal = (mat: Readonly<Record<string, number>>): number => Object.values(mat).reduce((sum, n) => sum + n, 0);

/** `coin` only when a carried item was put down and the mat grew (a cancel or a drop back to the tray keeps the mat). */
export function dragCue(before: DragShape, after: DragShape, mode: 'blocks' | 'coins' | 'clock'): SoundId | null {
    if (mode === 'clock') return null;
    return before.carrying !== null && after.carrying === null && matTotal(after.mat) > matTotal(before.mat) ? 'coin' : null;
}
