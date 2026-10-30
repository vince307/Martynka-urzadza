// Room-load rules: which rooms a screen needs and which of them must be fetched (no Phaser, no data).
import type { RoomListItem } from './rooms';

export function cardRooms(items: readonly RoomListItem[]): string[] {
    const ids: string[] = [];
    for (const item of items) if (item.kind === 'room' && item.id !== null) ids.push(item.id);
    return ids;
}

export function roomsToLoad(
    wanted: readonly string[],
    keysOf: (room: string) => readonly string[],
    exists: (key: string) => boolean,
    pending: ReadonlySet<string>,
): { rooms: string[]; keys: string[] } {
    const rooms: string[] = [];
    const keys: string[] = [];
    for (const room of wanted) {
        if (pending.has(room)) continue;
        const missing = keysOf(room).filter((key) => !exists(key));
        if (missing.length === 0) continue;
        rooms.push(room);
        for (const key of missing) if (!keys.includes(key)) keys.push(key);
    }
    return { rooms, keys };
}

export function tileLoading(room: string, pending: ReadonlySet<string>): boolean {
    return pending.has(room);
}
