// Textures of the salon (S-16a): the art pack's scene pictures, decoration and furniture variants converted to WebP by
// `npm run art` (public/assets/rooms/salon/). Entries are derived from SALON, so a texture key in the room data and in this
// table cannot drift apart; tests/roomArt.test.ts checks the table against the files and their headers. Loaded at start by
// BootScene so the service worker precaches them.
import { roomText } from './pl';
import { SALON } from './rooms';

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

/** File name (without folder and extension) of each scene picture, by its role in RoomDef.scene. */
export const SCENE_FILES = {
    before: 'architecture-before',
    after: 'architecture-after',
    furnishingsBefore: 'furnishings-before',
    shadows: 'shadows',
} as const;

const urlOf = (key: string): string => `assets/rooms/${key}.webp`;

export const SALON_ART: readonly RoomArtEntry[] = [
    ...(Object.keys(SCENE_FILES) as (keyof typeof SCENE_FILES)[]).map((role) => ({
        key: SALON.scene[role],
        url: `assets/rooms/salon/${SCENE_FILES[role]}.webp`,
        ...SCENE_SIZE,
        label: '',
    })),
    ...SALON.decor.map((layer) => ({ key: layer.key, url: urlOf(layer.key), width: layer.width, height: layer.height, label: roomText.decor(layer.id) ?? '' })),
    ...SALON.slots.flatMap((slot) =>
        slot.variants.map((key, index) => ({
            key,
            url: urlOf(key),
            width: slot.width,
            height: slot.height,
            label: `${roomText.slot(slot.id) ?? ''} ${roomText.variant(slot.id, index) ?? ''}`.trim(),
        })),
    ),
];

export const ROOM_ART: readonly RoomArtEntry[] = SALON_ART;
