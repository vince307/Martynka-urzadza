// The first room, authored as data (S-09). Slot coordinates are in the 1920x1080
// scene. Looks are placeholders drawn in code until the art arrives (S-16),
// which removes SALON_PLACEHOLDERS; RoomTaskDef.label is a key into pl.room.tasks.
import type { RoomDef, SlotDef } from '../core/types';
import type { PLACEHOLDER_COLORS } from './layout';

export interface Look {
    fill: keyof typeof PLACEHOLDER_COLORS;
    pattern: 'plain' | 'stripes' | 'dots';   // variants differ by pattern as well as colour (plan section 9)
}

export interface SlotPlaceholder {
    width: number;
    height: number;
    variants: [Look, Look, Look];
}

const slot = (id: string, x: number, y: number, depth: number): SlotDef => ({
    id, x, y, depth, variants: [`${id}-a`, `${id}-b`, `${id}-c`],
});

export const SALON: RoomDef = {
    id: 'salon',
    name: 'salon',
    background: 'salon-neglected',
    slots: [
        slot('floor', 960, 690, 0),
        slot('walls', 960, 362, 1),
        slot('rug', 960, 700, 2),
        slot('curtains', 600, 360, 3),
        slot('picture', 1080, 330, 3),
        slot('shelf', 1400, 330, 3),
        slot('lamp', 340, 560, 4),
        slot('table', 1450, 650, 4),
        slot('plant', 1640, 620, 4),
        slot('sofa', 1000, 600, 5),
    ],
    tasks: [
        { id: 'fix-floor', slot: 'floor', label: 'fixFloor', cost: 5 },
        { id: 'paint-walls', slot: 'walls', label: 'paintWalls', cost: 6 },
        { id: 'hang-curtains', slot: 'curtains', label: 'hangCurtains', cost: 7 },
        { id: 'add-sofa', slot: 'sofa', label: 'addSofa', cost: 8 },
        { id: 'lay-rug', slot: 'rug', label: 'layRug', cost: 9 },
        { id: 'place-table', slot: 'table', label: 'placeTable', cost: 10 },
        { id: 'place-lamp', slot: 'lamp', label: 'placeLamp', cost: 11 },
        { id: 'hang-shelf', slot: 'shelf', label: 'hangShelf', cost: 12 },
        { id: 'place-plant', slot: 'plant', label: 'placePlant', cost: 13 },
        { id: 'hang-picture', slot: 'picture', label: 'hangPicture', cost: 15 },
    ],
};

const looks = (a: Look['fill'], b: Look['fill'], c: Look['fill']): [Look, Look, Look] => [
    { fill: a, pattern: 'plain' },
    { fill: b, pattern: 'stripes' },
    { fill: c, pattern: 'dots' },
];

export const SALON_PLACEHOLDERS: Record<string, SlotPlaceholder> = {
    floor: { width: 1560, height: 340, variants: looks('oak', 'butter', 'terracotta') },
    walls: { width: 1560, height: 316, variants: looks('paleLeaf', 'turquoise', 'butter') },
    rug: { width: 700, height: 120, variants: looks('terracotta', 'turquoise', 'butter') },
    curtains: { width: 200, height: 300, variants: looks('turquoise', 'terracotta', 'butter') },
    picture: { width: 240, height: 180, variants: looks('butter', 'turquoise', 'terracotta') },
    shelf: { width: 300, height: 100, variants: looks('oak', 'terracotta', 'deepTeal') },
    lamp: { width: 100, height: 360, variants: looks('butter', 'terracotta', 'turquoise') },
    table: { width: 240, height: 140, variants: looks('oak', 'terracotta', 'deepTeal') },
    plant: { width: 140, height: 280, variants: looks('paleLeaf', 'turquoise', 'butter') },
    sofa: { width: 560, height: 240, variants: looks('turquoise', 'terracotta', 'butter') },
};

export const ROOMS: Record<string, RoomDef> = { [SALON.id]: SALON };
export const FIRST_ROOM = 'salon';
