// Which task pictures failed to load, as a record the scenes keep for the session and a view the parent panel reads.
// Pure: the expected entries and the "texture exists" predicate come in as arguments (no Phaser, no data import).

export interface ArtHealth {
    readonly total: number;
    /** Texture keys that did not load. */
    readonly missing: readonly string[];
    /** Art ids (not keys) of the missing pictures: what a skill's params name. */
    readonly missingIds: ReadonlySet<string>;
    /** Why each missing key is missing (runtime only, set by the boot scene; absent in older records). */
    readonly causes?: Readonly<Record<string, ArtCause>>;
    /** Keys whose texture loaded with a size other than its table's: reported, never dropped. */
    readonly wrongSize?: readonly string[];
}

export type ArtTable = 'task' | 'room' | 'ui' | 'sound';
/** `fetch` = HTTP status >= 400; `network` = status 0 (timeout or no connection), never told as "not on the server". */
export type ArtCause = 'fetch' | 'network' | 'decode' | 'cut' | 'never';
export interface LoadSeen {
    readonly loaded: ReadonlySet<string>;
    readonly failed: ReadonlyMap<string, number>;
    readonly cut: ReadonlySet<string>;
}

const TABLE_NAMES: Readonly<Record<ArtTable, string>> = { task: 'Task', room: 'Room', ui: 'Ui', sound: 'Sound' };

/** Which table a loader key belongs to; null for a key in none (the font). */
export const tableOf = (key: string, tables: Readonly<Record<ArtTable, ReadonlySet<string>>>): ArtTable | null => {
    for (const table of ['task', 'room', 'ui', 'sound'] as const) {
        if (tables[table].has(key)) return table;
    }
    return null;
};

/** The one console line of a failed file: the table, the key, the URL asked for and the HTTP status (0 = timeout or network). */
export const loadErrorLine = (table: ArtTable, key: string, src: string, status: number): string =>
    `${TABLE_NAMES[table]} file failed to load: ${key} ${src} (${status === 0 ? 'timeout or network' : `HTTP ${status}`})`;

/** Why each missing key is missing, from the recorded loader events. A cut wins: the file never finished, whatever it did before. */
export const artCauses = (missing: readonly string[], seen: LoadSeen): Record<string, ArtCause> => {
    const causes: Record<string, ArtCause> = {};
    for (const key of missing) {
        const status = seen.failed.get(key);
        if (seen.cut.has(key)) causes[key] = 'cut';
        else if (status !== undefined) causes[key] = status === 0 ? 'network' : 'fetch';
        else if (seen.loaded.has(key)) causes[key] = 'decode';
        else causes[key] = 'never';
    }
    return causes;
};

/** Keys whose loaded texture differs in size from its table; a key without a texture is not listed. */
export const wrongSizes = (
    entries: readonly { key: string; width: number; height: number }[],
    sizeOf: (key: string) => { width: number; height: number } | undefined,
): string[] =>
    entries
        .filter((entry) => {
            const size = sizeOf(entry.key);
            return size !== undefined && (size.width !== entry.width || size.height !== entry.height);
        })
        .map((entry) => entry.key);

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

/** The boot queue groups, in the order the scene queues them (audit B-6): sounds last, so a slow link cuts the quiet effects first. */
export type BootGroup = 'loadingArt' | 'font' | 'task' | 'room' | 'ui' | 'sound';

const QUEUE_ORDER: readonly BootGroup[] = ['loadingArt', 'font', 'task', 'room', 'ui', 'sound'];

export const bootQueue = (groups: readonly BootGroup[]): BootGroup[] => QUEUE_ORDER.filter((group) => groups.includes(group));

const unquote = (family: string): string => family.replace(/^["']|["']$/g, '');

/** `loaded` when a face of the family finished loading; `fallback` otherwise (the text is drawn in a system font). */
export const fontHealth = (faces: readonly { family: string; status: string }[], family: string): 'loaded' | 'fallback' =>
    faces.some((face) => unquote(face.family) === family && face.status === 'loaded') ? 'loaded' : 'fallback';

/** The cut keys grouped by table; a key in no table (the font) is listed under `font`. */
export const cutByTable = (
    cut: readonly string[],
    tables: Readonly<Record<ArtTable, ReadonlySet<string>>>,
): Record<ArtTable | 'font', string[]> => {
    const grouped: Record<ArtTable | 'font', string[]> = { task: [], room: [], ui: [], sound: [], font: [] };
    for (const key of cut) grouped[tableOf(key, tables) ?? 'font'].push(key);
    return grouped;
};
