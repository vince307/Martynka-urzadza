// Generic tray-to-mat gesture over a kind K as a pure reducer (S-13 phase 8, generalised in S-14d phase 6), modelled on
// longPress.ts. The scene feeds raw pointer events; geometry arrives as injected pure functions. Blocks and coins are instances.
export type Counts<K extends string> = Readonly<Record<K, number>>;
export interface Carrying<K extends string> {
    pointerId: number; kind: K; from: 'tray' | 'mat'; x: number; y: number; startX: number; startY: number; moved: boolean;
}
export interface TrayDragState<K extends string> { mat: Counts<K>; carrying: Carrying<K> | null }
export type TrayDragEvent =
    | { type: 'down'; pointerId: number; x: number; y: number }
    | { type: 'move'; pointerId: number; x: number; y: number }
    | { type: 'up'; pointerId: number; x: number; y: number }
    | { type: 'cancel'; pointerId?: number }
    | { type: 'reset' };
export interface TrayDragGeo<K extends string> {
    trayAt: (x: number, y: number) => K | null;
    matAt: (x: number, y: number, mat: Counts<K>) => K | null;
    onMat: (x: number, y: number) => boolean;
}
export interface TrayDragRules { startDistance: number; maxPerKind?: number; maxTotal?: number }

const total = <K extends string>(mat: Counts<K>): number =>
    Object.values<number>(mat).reduce((sum, n) => sum + n, 0);

const put = <K extends string>(mat: Counts<K>, kind: K, rules: TrayDragRules): Counts<K> => {
    if (rules.maxTotal !== undefined && total(mat) >= rules.maxTotal) return mat;
    return { ...mat, [kind]: Math.min(mat[kind] + 1, rules.maxPerKind ?? Infinity) };
};
const take = <K extends string>(mat: Counts<K>, kind: K): Counts<K> => ({ ...mat, [kind]: Math.max(mat[kind] - 1, 0) });
const idle = <K extends string>(state: TrayDragState<K>): TrayDragState<K> => ({ mat: state.mat, carrying: null });

const grab = <K extends string>(
    state: TrayDragState<K>, event: { pointerId: number; x: number; y: number }, geo: TrayDragGeo<K>,
): TrayDragState<K> => {
    const fromTray = geo.trayAt(event.x, event.y);
    const kind = fromTray ?? geo.matAt(event.x, event.y, state.mat);
    if (!kind) return idle(state);
    return {
        mat: state.mat,
        carrying: {
            pointerId: event.pointerId, kind, from: fromTray ? 'tray' : 'mat',
            x: event.x, y: event.y, startX: event.x, startY: event.y, moved: false,
        },
    };
};

/**
 * Rules: a touch on a tray or mat item starts a carry; a second finger or `cancel`/`reset` ends it with the mat
 * unchanged. S13-09: a `down` of the SAME finger while it still carries means the `up` was lost (the browser swallowed
 * it), so the item is dropped with the mat unchanged and a new carry starts at the new point (like `stepClockSet`);
 * leaving the item in the air made the next touch dead. Moving past `startDistance` makes it a drag for good. Lifting a
 * drag over the mat puts a tray item down (within `maxPerKind` and `maxTotal`) and leaves a mat item; lifting it
 * elsewhere sends a tray item back and removes a mat item. Lifting without a drag is a tap: tray +1, mat item -1.
 */
export const stepTrayDrag = <K extends string>(
    state: TrayDragState<K>, event: TrayDragEvent, geo: TrayDragGeo<K>, rules: TrayDragRules,
): TrayDragState<K> => {
    const carrying = state.carrying;
    // GRD-03: a cancel that names another finger is not this carry's; one without an id (scene-internal) cancels any.
    if (event.type === 'cancel') {
        return event.pointerId !== undefined && carrying && event.pointerId !== carrying.pointerId ? state : idle(state);
    }
    if (event.type === 'reset') return idle(state);
    if (event.type === 'down') {
        if (carrying && event.pointerId !== carrying.pointerId) return idle(state);
        return grab(state, event, geo);
    }
    if (!carrying || event.pointerId !== carrying.pointerId) return state;
    const dragged = carrying.moved || Math.hypot(event.x - carrying.startX, event.y - carrying.startY) > rules.startDistance;
    if (event.type === 'move') {
        return { mat: state.mat, carrying: { ...carrying, x: event.x, y: event.y, moved: dragged } };
    }
    const { kind, from } = carrying;
    if (!dragged) return { mat: from === 'tray' ? put(state.mat, kind, rules) : take(state.mat, kind), carrying: null };
    const over = geo.onMat(event.x, event.y);
    if (from === 'tray') return { mat: over ? put(state.mat, kind, rules) : state.mat, carrying: null };
    return { mat: over ? state.mat : take(state.mat, kind), carrying: null };
};

/** PIC-02: "OK" does nothing while a coin, block or clock hand is still held (the pose is not settled). */
export const canSubmit = (state: { carrying: unknown }): boolean => state.carrying === null;
