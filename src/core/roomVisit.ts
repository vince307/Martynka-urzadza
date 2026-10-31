// Visit rule (FR-019, plan review F2): which done room the room view's visit button opens. No Phaser, no data.
import type { RoomListItem } from './rooms';

/**
 * While a visit is on the button leads back to the room in renovation; otherwise it opens the first done room of the list
 * other than the current one. Null when there is nothing to visit (a teaser is never a target).
 */
export function visitTarget(items: readonly RoomListItem[], current: string, visiting: string | null): string | null {
    if (visiting !== null) {
        return current;
    }
    for (const item of items) {
        if (item.kind === 'room' && item.id !== null && item.done && item.id !== current) {
            return item.id;
        }
    }
    return null;
}
