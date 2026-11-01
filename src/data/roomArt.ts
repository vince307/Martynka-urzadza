// Textures of every room (S-16a for the salon; ROOM_SCENE_FILES has a row per room): the art pack's scene pictures, decoration and furniture variants converted to WebP by
// `npm run art` (public/assets/rooms/<room>/). Entries are derived from the room data, so a texture key in the room data and in this
// table cannot drift apart; tests/roomArt.test.ts checks the table against the files and their headers. Loaded at start by
// BootScene so the service worker precaches them (the boot loads only the current room, see bootRoomArt; other rooms load at runtime).
import { roomText } from './pl';
import { FIRST_ROOM, ROOMS } from './rooms';
import type { RoomDef } from '../core/types';

export interface RoomArtEntry {
    key: string;
    url: string;
    width: number;
    height: number;
    /** Polish text of the stand-in box when the texture is missing; '' for a full-scene picture. */
    label: string;
}

/** Size of the full-scene pictures (the manifest's `scene`). */
export const SCENE_SIZE = { width: 1920, height: 1080 } as const;

type SceneRole = 'before' | 'after' | 'shadows';

/** File name (without folder and extension) of each scene picture, by room id and role in RoomDef.scene. A room in ROOMS needs a row (tests/roomArt.test.ts). */
export const ROOM_SCENE_FILES: Readonly<Record<string, Readonly<Record<SceneRole, string>>>> = {
    salon: { before: 'architecture-before', after: 'architecture-after', shadows: 'shadows' },
    kitchen: { before: 'kitchen-before', after: 'kitchen-after', shadows: 'kitchen-shadows' },
    children: { before: 'children-stage-0', after: 'children-after', shadows: 'children-shadows' },
    bridge: { before: 'bridge-before', after: 'bridge-after', shadows: 'bridge-shadows' },
    hangar: { before: 'hangar-before', after: 'hangar-after', shadows: 'hangar-shadows' },
};

const urlOf = (key: string): string => `assets/rooms/${key}.webp`;

/** The art entries of one room: its three scene pictures, decoration and every furniture variant. */
export const roomArt = (room: RoomDef): RoomArtEntry[] => {
    const files = ROOM_SCENE_FILES[room.id];
    if (!files) {
        throw new Error(`No scene files for room ${room.id}`);
    }
    return [
        ...(Object.keys(files) as SceneRole[]).map((role) => ({
            key: room.scene[role],
            url: `assets/rooms/${room.id}/${files[role]}.webp`,
            ...SCENE_SIZE,
            label: '',
        })),
        // Stage backgrounds named on the stage tasks (rooms renovated in several steps), once each and never a key the three roles already hold.
        ...[...new Set(room.tasks.flatMap((t) => (t.kind === 'stage' && t.scene !== undefined ? [t.scene] : [])))]
            .filter((key) => !Object.values(room.scene).includes(key))
            .map((key) => ({ key, url: urlOf(key), ...SCENE_SIZE, label: '' })),
        ...room.decor.map((layer) => ({ key: layer.key, url: urlOf(layer.key), width: layer.width, height: layer.height, label: roomText.decor(layer.id) ?? '' })),
        ...room.slots.flatMap((slot) =>
            slot.variants.map((key, index) => ({
                key,
                url: urlOf(key),
                width: slot.width,
                height: slot.height,
                label: `${roomText.slot(slot.id) ?? ''} ${roomText.variant(slot.id, index) ?? ''}`.trim(),
            })),
        ),
    ];
};

export const ROOM_ART: readonly RoomArtEntry[] = Object.values(ROOMS).flatMap(roomArt);

/** The art the boot queue loads: the current room's entries (the first room when the id is unknown or missing). ROOM_ART stays the full table for the precache, deploy coverage and the table keys. */
export const bootRoomArt = (currentRoom: string | undefined): RoomArtEntry[] => roomArt((currentRoom !== undefined ? ROOMS[currentRoom] : undefined) ?? ROOMS[FIRST_ROOM]);
