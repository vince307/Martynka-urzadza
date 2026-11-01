import type { RoomDef, RoomState } from './types';
import { sceneKey } from './rooms';

/** What shows behind the notebook: the child's own salon, or the plain page colour when the salon picture is not loaded. */
export type BackdropMode = 'salon' | 'plain';

/**
 * `plain` when the picture of the room's scene (`sceneKey`: before the first stage, then the picture of the last done stage) is not a
 * loaded texture; any other missing piece is only left out of the picture.
 */
export function backdropMode(room: RoomDef, state: RoomState, hasTexture: (key: string) => boolean): BackdropMode {
    const key = sceneKey(room, state);
    return hasTexture(key) ? 'salon' : 'plain';
}
