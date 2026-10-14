// The save file a parent exports and imports (S-12, test-plan risk #7). Pure: no Phaser, no browser globals, no data imports;
// the build id and the rooms come in as parameters. A file is never trusted because it parses: every import goes through
// decodeSave (migrations + strict validation), so the file can only ever become a save the game itself could have written.
import type { BlockReason } from './autosave';
import { decodeSave, saveProblem, type SessionSave } from './save';
import type { RoomDef, SaveState, StageId } from './types';

export const SAVE_FILE_APP = 'martynka-urzadza';

export type ExportInput =
    | { kind: 'save'; build: string; exportedAt: string; save: SaveState }
    | { kind: 'raw'; build: string; exportedAt: string; reason: string; raw: unknown };

export type ImportRejection = 'too-big' | 'not-json' | 'not-ours' | 'corrupt' | 'future' | 'unknown-version';

export type ImportResult =
    | { kind: 'ok'; session: SessionSave; file: { build: string | null; exportedAt: string | null } }
    | { kind: 'rejected'; reason: ImportRejection; problem: string | null };

export interface SaveSummary {
    stars: number;
    stage: StageId | null;
    rooms: { id: string; done: number; total: number }[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Pretty JSON of the envelope; a raw value that cannot be serialised falls back to String(). Throws only for a save that is not serialisable (encodeSave never builds one). */
export function exportFileText(input: ExportInput): string {
    try {
        return JSON.stringify({ app: SAVE_FILE_APP, ...input }, null, 2);
    } catch {
        if (input.kind === 'raw') return JSON.stringify({ app: SAVE_FILE_APP, ...input, raw: String(input.raw) }, null, 2);
        throw new Error('save is not serialisable');
    }
}

export function parseImport(fileText: string, maxBytes: number): ImportResult {
    if (fileText.length > maxBytes) return { kind: 'rejected', reason: 'too-big', problem: null };
    let parsed: unknown;
    try {
        parsed = JSON.parse(fileText);
    } catch {
        return { kind: 'rejected', reason: 'not-json', problem: null };
    }
    if (!isRecord(parsed)) return { kind: 'rejected', reason: 'not-ours', problem: null };
    let value: unknown;
    let file = { build: null as string | null, exportedAt: null as string | null };
    if (parsed.app === SAVE_FILE_APP) {
        value = parsed.kind === 'raw' ? parsed.raw : parsed.save;
        file = { build: text(parsed.build), exportedAt: text(parsed.exportedAt) };
    } else if (parsed.app === undefined && typeof parsed.version === 'number') {
        value = parsed;
    } else {
        return { kind: 'rejected', reason: 'not-ours', problem: null };
    }
    const decoded = decodeSave(value);
    if (decoded.kind === 'ok') return { kind: 'ok', session: decoded.session, file };
    return { kind: 'rejected', reason: decoded.reason, problem: decoded.reason === 'corrupt' ? saveProblem(value) : null };
}

/** What a parent compares before overwriting: stars, stage and the progress of every known room, in the order of `rooms`. */
export function saveSummary(session: SessionSave, rooms: Readonly<Record<string, RoomDef>>): SaveSummary {
    const list: SaveSummary['rooms'] = [];
    for (const [id, def] of Object.entries(rooms)) {
        const state = Object.prototype.hasOwnProperty.call(session.rooms, id) ? session.rooms[id] : undefined;
        if (!state) continue;
        list.push({ id, done: Math.min(state.tasksDone, def.tasks.length), total: def.tasks.length });
    }
    return { stars: session.stars, stage: session.learner ? session.learner.stage : null, rooms: list };
}

/** What an import or reset dialog shows in the place of "Teraz" (S12-01); `blocked` and `unreadable` never carry the in-memory fresh session. */
export type DeviceSaveView =
    | { kind: 'summary'; summary: SaveSummary }
    | { kind: 'unreadable' }
    | { kind: 'blocked'; cause: 'unavailable' | 'fatal' }
    | { kind: 'broken' };

export function deviceSaveView(
    blockedBy: BlockReason | null,
    current: SaveState,
    rooms: Readonly<Record<string, RoomDef>>,
): DeviceSaveView {
    if (blockedBy === 'unreadable') return { kind: 'unreadable' };
    if (blockedBy !== null) return { kind: 'blocked', cause: blockedBy };
    const decoded = decodeSave(current);
    return decoded.kind === 'ok' ? { kind: 'summary', summary: saveSummary(decoded.session, rooms) } : { kind: 'broken' };
}
