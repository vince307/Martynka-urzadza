// Which task pictures failed to load, as a record the scenes keep for the session and a view the parent panel reads.
// Pure: the expected entries and the "texture exists" predicate come in as arguments (no Phaser, no data import).
import { FALLBACK_ORDER, type DrawnFallbackWhere, type FallbackRecord } from './artPick';

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
/** Tables that log load errors: the house art (S-23) has a log name but no "Obrazki" table. */
export type LoadTable = ArtTable | 'house';
/** `fetch` = HTTP status >= 400; `network` = status 0 (timeout or no connection), never told as "not on the server". */
export type ArtCause = 'fetch' | 'network' | 'decode' | 'cut' | 'never';
export interface LoadSeen {
    readonly loaded: ReadonlySet<string>;
    readonly failed: ReadonlyMap<string, number>;
    readonly cut: ReadonlySet<string>;
}

const TABLE_NAMES: Readonly<Record<LoadTable, string>> = { task: 'Task', room: 'Room', ui: 'Ui', sound: 'Sound', house: 'House' };

/** Which table a loader key belongs to; null for a key in none (the font). */
export const tableOf = (key: string, tables: Readonly<Record<ArtTable, ReadonlySet<string>>>): ArtTable | null => {
    for (const table of ['task', 'room', 'ui', 'sound'] as const) {
        if (tables[table].has(key)) return table;
    }
    return null;
};

/** The one console line of a failed file: the table, the key, the URL asked for and the HTTP status (0 = timeout or network). */
export const loadErrorLine = (table: LoadTable, key: string, src: string, status: number): string =>
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

/** The health record of a room's art entries; boot and the runtime room loader build identical records through it. */
export const roomHealthOf = (entries: readonly { key: string }[], exists: (key: string) => boolean): ArtHealth =>
    artHealth(entries.map((art) => ({ key: art.key, id: art.key })), exists);

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

/** How many pictures (task, room, ui files) a `cutByTable` record holds; sounds and the font have their own lines. */
export const pictureCutCount = (byTable: Partial<Record<ArtTable | 'font', readonly string[]>> | undefined): number =>
    (byTable?.task?.length ?? 0) + (byTable?.room?.length ?? 0) + (byTable?.ui?.length ?? 0);

export type ArtLineTable = 'task' | 'room' | 'ui';
/** One line of the parent's "Obrazki" section; the renderer maps each kind to Polish text (no text in core). */
export type ArtHealthLine =
    | { kind: 'ok' | 'missing'; table: ArtLineTable; count: number; total: number; standIn?: boolean }
    | { kind: 'cut'; count: number }
    | { kind: 'folder'; folder: string; count: number }
    | { kind: 'skipped' }
    | { kind: 'labels'; labels: readonly string[] }
    | { kind: 'font' }
    | { kind: 'guide' }
    | { kind: 'worn' }
    | { kind: 'fallback'; where: readonly DrawnFallbackWhere[] }
    | { kind: 'advice'; restart: boolean }
    | { kind: 'cause'; cause: ArtCause }
    | { kind: 'code'; code: ArtCause; build: string };

export interface ArtHealthLinesInput {
    readonly task: ArtHealth | undefined;
    readonly room: ArtHealth | undefined;
    readonly ui: ArtHealth | undefined;
    /** How many pictures the boot limit cut. */
    readonly cut: number;
    readonly build: string;
    /** The task font: `fallback` adds a line (the text is drawn in a system font). */
    readonly font?: 'loaded' | 'fallback';
    /** Polish labels of the missing room pieces (the caller reads them from the data); at most `labelCap` are listed. */
    readonly labels?: readonly string[];
    readonly labelCap?: number;
    /** The screens that showed a drawn fallback instead of their picture (core/artPick record); one muted line names them. */
    readonly fallbacks?: FallbackRecord;
    /** UI texture keys whose screen draws nothing in their place (the fox poses); absent means every key has a stand-in. */
    readonly noStandIn?: readonly string[];
}

const CAUSE_ORDER: readonly ArtCause[] = ['fetch', 'network', 'decode', 'cut', 'never'];

/** The cause most keys share (a tie goes to the earlier in `CAUSE_ORDER`); undefined when no cause is recorded. */
const mainCause = (healths: readonly ArtHealth[]): ArtCause | undefined => {
    const counts = new Map<ArtCause, number>();
    for (const health of healths) {
        for (const key of health.missing) {
            const cause = health.causes?.[key];
            if (cause) counts.set(cause, (counts.get(cause) ?? 0) + 1);
        }
    }
    let best: ArtCause | undefined;
    for (const cause of CAUSE_ORDER) {
        if ((counts.get(cause) ?? 0) > (best ? (counts.get(best) ?? 0) : 0)) best = cause;
    }
    return best;
};

/** A restart can change the outcome only for a file the boot limit cut or a connection that failed; a 404 or a broken file stays so. */
export const restartHelps = (cause: ArtCause): boolean => cause === 'cut' || cause === 'network';

/** The missing task pictures per folder (`tasks/<folder>/<id>` keys), in the order the folders first appear. */
export const folderCounts = (missing: readonly string[]): { folder: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const key of missing) {
        const folder = key.split('/')[1];
        if (folder) counts.set(folder, (counts.get(folder) ?? 0) + 1);
    }
    return [...counts].map(([folder, count]) => ({ folder, count }));
};

/**
 * Lines of "Obrazki": each known table (an unknown one says nothing, the others still show), the missing task pictures per
 * folder with the sentence that their tasks are skipped, the cut line, the labels of missing room pieces (capped), and for
 * missing pictures the main cause, whether a restart helps, and the code. When the cut is the cause, the cut line already
 * says it (and the restart advice with it). A fallback font adds its own line, then a recorded fox (no stand-in) its own, then an
 * ungraded worn look (the furniture shows, no stand-in), then the drawn fallbacks. The `ui` missing line carries `standIn`: true when some missing key has a stand-in (keys in `noStandIn` have none).
 */
export const artHealthLines = ({ task, room, ui, cut, build, font, labels, labelCap, fallbacks, noStandIn }: ArtHealthLinesInput): ArtHealthLine[] => {
    const lines: ArtHealthLine[] = [];
    const known: ArtHealth[] = [];
    for (const [table, health] of [['task', task], ['room', room], ['ui', ui]] as const) {
        const view = artHealthView(health);
        if (view.kind === 'unknown' || !health) continue;
        known.push(health);
        const line: ArtHealthLine = { kind: view.kind, table, count: view.kind === 'missing' ? view.count : 0, total: health.total };
        if (table === 'ui' && line.kind === 'missing') line.standIn = health.missing.some((key) => !(noStandIn ?? []).includes(key));
        lines.push(line);
    }
    if (task && task.missing.length > 0) {
        for (const { folder, count } of folderCounts(task.missing)) lines.push({ kind: 'folder', folder, count });
        lines.push({ kind: 'skipped' });
    }
    if (cut > 0) lines.push({ kind: 'cut', count: cut });
    const listed = (labels ?? []).slice(0, Math.max(0, labelCap ?? 0));
    if (listed.length > 0) lines.push({ kind: 'labels', labels: listed });
    const cause = mainCause(known);
    if (cause) {
        const cutSaysIt = cause === 'cut' && cut > 0;
        if (!cutSaysIt) lines.push({ kind: 'cause', cause });
        if (!cutSaysIt) lines.push({ kind: 'advice', restart: restartHelps(cause) });
    }
    if (font === 'fallback') lines.push({ kind: 'font' });
    if (fallbacks?.guide !== undefined) lines.push({ kind: 'guide' });
    if (fallbacks?.worn !== undefined) lines.push({ kind: 'worn' });
    const shown = FALLBACK_ORDER.filter((where): where is DrawnFallbackWhere => where !== 'guide' && where !== 'worn' && where !== 'house' && fallbacks?.[where] !== undefined);
    if (shown.length > 0) lines.push({ kind: 'fallback', where: shown });
    if (cause) lines.push({ kind: 'code', code: cause, build });
    return lines;
};
