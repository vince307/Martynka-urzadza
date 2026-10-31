import type { Scene, Textures } from 'phaser';
import type { RoomDef, RoomState } from '../../core/types';
import { GAME_WIDTH } from '../../data/layout';
import { drawRoomMiniature } from './RoomView';

/**
 * Draws a room at `width` into the dynamic texture `key` (created when missing, cleared and redrawn on every capture). The pieces and
 * the stand-in boxes go into one off-list holder, so nothing flashes on screen; no blur, no tint. `HouseView` removes its cell textures
 * before every render (which also covers a restored WebGL context). Returns whether a texture holds the picture.
 */
export function captureRoomMiniature(scene: Scene, key: string, room: RoomDef, state: RoomState, width: number, height: number): boolean {
    const dt = scene.textures.exists(key) ? (scene.textures.get(key) as Textures.DynamicTexture) : scene.textures.addDynamicTexture(key, width, height);
    if (!dt) return false;
    // Never on the display list; the stand-in Graphics is the first child, so the wall, the floor and the boxes sit under the pictures.
    const holder = scene.make.container({ x: 0, y: 0 }, false);
    const g = scene.make.graphics({}, false);
    holder.add(g);
    const images = drawRoomMiniature(scene, g, room, state, 0, 0, width / GAME_WIDTH, 0);
    holder.add(images);
    dt.clear();
    // No x/y: only (0, 0) is the same on both renderers (as SalonBackdrop does).
    dt.draw(holder);
    dt.render();
    holder.destroy(true);
    return true;
}
