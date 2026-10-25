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

/**
 * The screens whose picture can be replaced by a drawn fallback; the fox (`guide`) records `'none'`: nothing is drawn in its place.
 * The worn look (`worn`) records `'ungraded'`: the furniture shows, only without the worn grade (a renderer without filters).
 */
export type FallbackWhere = 'wallet' | 'notebook' | 'miniature' | 'loading' | 'guide' | 'worn';
/** The places that have a drawn fallback (everything but the fox). */
export type DrawnFallbackWhere = Exclude<FallbackWhere, 'guide' | 'worn'>;
export const FALLBACK_ORDER: readonly FallbackWhere[] = ['wallet', 'notebook', 'miniature', 'loading', 'guide', 'worn'];
/** Which fallback the child sees per screen (the mode is the picker's own word: 'drawn', 'icon', 'box', 'thumbnail'). Runtime only. */
export type FallbackRecord = Readonly<Partial<Record<FallbackWhere, string>>>;

/** Records that a screen shows a fallback. Pure and idempotent: the first mode noted for a screen stays. */
export function noteFallback(record: FallbackRecord, where: FallbackWhere, mode: string): FallbackRecord {
    if (record[where] !== undefined) return record;
    return { ...record, [where]: mode };
}
