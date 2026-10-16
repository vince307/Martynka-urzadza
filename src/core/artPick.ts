// Which picture to show when some art may be missing. Pure: `exists` is injected.

export type MiniatureMode = 'live' | 'thumbnail' | 'drawn';

/** The first key whose texture exists, or null when none does. */
export function firstLoaded(keys: readonly string[], exists: (key: string) => boolean): string | null {
    return keys.find(exists) ?? null;
}

/** Live pieces when all of them exist, else the pack thumbnail, else the drawn stand-ins. */
export function miniatureMode(needed: readonly string[], exists: (key: string) => boolean, thumbnailKey: string): MiniatureMode {
    if (needed.every(exists)) return 'live';
    return exists(thumbnailKey) ? 'thumbnail' : 'drawn';
}

/** The keys a miniature draws: every piece except an `alpha === 0` one (it is skipped when missing). */
export function neededMiniatureKeys(pieces: readonly { key: string; alpha: number }[]): string[] {
    return pieces.filter((p) => p.alpha !== 0).map((p) => p.key);
}
