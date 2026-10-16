// Which task pictures failed to load, as a record the scenes keep for the session and a view the parent panel reads.
// Pure: the expected entries and the "texture exists" predicate come in as arguments (no Phaser, no data import).

export interface ArtHealth {
    readonly total: number;
    /** Texture keys that did not load. */
    readonly missing: readonly string[];
    /** Art ids (not keys) of the missing pictures: what a skill's params name. */
    readonly missingIds: ReadonlySet<string>;
}

export type ArtHealthView = { kind: 'ok'; total: number } | { kind: 'missing'; count: number; total: number } | { kind: 'unknown' };

export const artHealth = (entries: readonly { key: string; id: string }[], exists: (key: string) => boolean): ArtHealth => {
    const gone = entries.filter((entry) => !exists(entry.key));
    return { total: entries.length, missing: gone.map((entry) => entry.key), missingIds: new Set(gone.map((entry) => entry.id)) };
};

/** `unknown` when no record exists (a scene started without the boot scene). */
export const artHealthView = (health: ArtHealth | undefined): ArtHealthView => {
    if (!health) return { kind: 'unknown' };
    return health.missing.length === 0 ? { kind: 'ok', total: health.total } : { kind: 'missing', count: health.missing.length, total: health.total };
};

/** State of the whole "Obrazki" section: `missing` when any line is missing, `ok` otherwise (an `unknown` line says nothing). */
export const sectionState = (views: readonly (ArtHealthView | undefined)[]): 'ok' | 'missing' => {
    return views.some((view) => view?.kind === 'missing') ? 'missing' : 'ok';
};
