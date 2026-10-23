import type { RoomDef, RoomState } from './types';
import { stagesDone } from './rooms';

/** What shows behind the notebook: the child's own salon, or the plain page colour when the salon picture is not loaded. */
export type BackdropMode = 'salon' | 'plain';

/**
 * `plain` when the picture of the room's scene (before or after the stage, as `RoomView` and `miniaturePieces` pick it) is not a
 * loaded texture; any other missing piece is only left out of the picture.
 */
export function backdropMode(room: RoomDef, state: RoomState, hasTexture: (key: string) => boolean): BackdropMode {
    const key = stagesDone(room, state) > 0 ? room.scene.after : room.scene.before;
    return hasTexture(key) ? 'salon' : 'plain';
}
