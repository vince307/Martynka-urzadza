// One parameterised celebration (FR-040): the scene asks for an intensity and draws what the view says.
export type CelebrationIntensity = 'room' | 'house' | 'street';

export interface CelebrationSpec {
    holdMs: number;
    burstCount: number;
    keepsake: boolean;
}

export interface CelebrationView {
    intensity: CelebrationIntensity;
    revealMs: number;
    burstCount: number;
    keepsake: boolean;
}

export function celebrationView(
    intensity: CelebrationIntensity,
    reducedMotion: boolean,
    table: Readonly<Record<CelebrationIntensity, CelebrationSpec>>,
): CelebrationView {
    const spec = table[intensity];
    return {
        intensity,
        revealMs: reducedMotion ? 0 : spec.holdMs,
        burstCount: reducedMotion ? 0 : spec.burstCount,
        keepsake: spec.keepsake,
    };
}
