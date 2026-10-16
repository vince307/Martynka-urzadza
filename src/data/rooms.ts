// The first room, authored as data (S-09, S-16a). Geometry comes from the art pack's manifest: x/y is the top-left corner
// of a picture in the 1920x1080 scene, `visibleRect` the object without its margin, `z` the draw order (0-99).
// Texture keys are `salon/<file id>`. RoomTaskDef.label is a key into pl.room.tasks.
import type { LayerDef, RoomDef, RoomListEntry, SlotDef } from '../core/types';

/** The right plant: part of the renovated room, no task and no variants. Lamp, left plant and pouf are slots that show their old look until bought (S-16d). */
const decor: LayerDef[] = [
    { id: 'plant-right', x: 1648, y: 222, width: 244, height: 539, z: 35, anchor: [122, 523], visibleRect: [16, 16, 212, 507], key: 'salon/plant-right' },
];

const slots: SlotDef[] = [
    { id: 'sofa', x: 838, y: 257, width: 835, height: 566, z: 30, anchor: [418, 550], visibleRect: [16, 16, 803, 534], variants: ['salon/sofa-morska', 'salon/sofa-sloneczna', 'salon/sofa-listkowa'] },
    { id: 'rug', x: 432, y: 441, width: 1111, height: 640, z: 10, anchor: [556, 624], visibleRect: [16, 16, 1079, 608], variants: ['salon/rug', 'salon/rug-arcs', 'salon/rug-flowers'] },
    { id: 'coffee-table', x: 763, y: 535, width: 537, height: 397, z: 50, anchor: [269, 381], visibleRect: [16, 16, 505, 365], variants: ['salon/coffee-table', 'salon/coffee-table-cream', 'salon/coffee-table-turquoise'] },
    { id: 'cabinet', x: 293, y: 226, width: 512, height: 363, z: 20, anchor: [256, 347], visibleRect: [16, 16, 480, 331], variants: ['salon/cabinet', 'salon/cabinet-mint', 'salon/cabinet-cream'] },
    { id: 'armchair', x: 248, y: 554, width: 399, height: 361, z: 40, anchor: [200, 345], visibleRect: [16, 16, 367, 329], variants: ['salon/armchair', 'salon/armchair-mint', 'salon/armchair-sunny'] },
    { id: 'wall-frames', x: 1055, y: 15, width: 634, height: 425, z: 5, anchor: [317, 409], visibleRect: [16, 16, 602, 393], variants: ['salon/wall-frames', 'salon/wall-frames-meadow', 'salon/wall-frames-sky'] },
    { id: 'curtains', x: 232, y: -70, width: 590, height: 695, z: 3, anchor: [295, 679], visibleRect: [16, 16, 558, 663], variants: ['salon/curtains-leaf', 'salon/curtains-cream', 'salon/curtains-botanical'] },
    { id: 'wall-shelf', x: 355, y: 177, width: 440, height: 242, z: 18, anchor: [220, 226], visibleRect: [16, 16, 408, 210], variants: ['salon/shelf-oak', 'salon/shelf-mint', 'salon/shelf-arch'] },
    { id: 'lamp-table', x: 769, y: 94, width: 239, height: 415, z: 25, anchor: [120, 399], visibleRect: [16, 16, 207, 383], variants: ['salon/lamp-table', 'salon/lamp-wicker', 'salon/lamp-flower'], shownBeforePurchase: 0 },
    { id: 'plant-left', x: 70, y: 230, width: 290, height: 445, z: 26, anchor: [145, 429], visibleRect: [16, 16, 258, 413], variants: ['salon/plant-left', 'salon/plant-fern', 'salon/plant-ficus'], shownBeforePurchase: 0 },
    { id: 'pouf', x: 458, y: 736, width: 278, height: 218, z: 60, anchor: [139, 202], visibleRect: [16, 16, 246, 186], variants: ['salon/pouf', 'salon/pouf-knit', 'salon/pouf-oak'], shownBeforePurchase: 0 },
];

export const SALON: RoomDef = {
    id: 'salon',
    name: 'salon',
    scene: { before: 'salon/before', after: 'salon/after', furnishingsBefore: 'salon/furnishings-before', shadows: 'salon/shadows' },
    decor,
    slots,
    // New tasks go at the END of this list only (later slots of the art pack): `RoomState.tasksDone` counts positions in it,
    // so inserting or reordering would move every saved room.
    tasks: [
        { kind: 'stage', id: 'renovate', label: 'renovate', cost: 5 },
        { kind: 'slot', id: 'add-sofa', slot: 'sofa', label: 'addSofa', cost: 7 },
        { kind: 'slot', id: 'lay-rug', slot: 'rug', label: 'layRug', cost: 9 },
        { kind: 'slot', id: 'place-coffee-table', slot: 'coffee-table', label: 'placeCoffeeTable', cost: 10 },
        { kind: 'slot', id: 'place-cabinet', slot: 'cabinet', label: 'placeCabinet', cost: 12 },
        { kind: 'slot', id: 'place-armchair', slot: 'armchair', label: 'placeArmchair', cost: 13 },
        { kind: 'slot', id: 'hang-frames', slot: 'wall-frames', label: 'hangFrames', cost: 15 },
        { kind: 'slot', id: 'hang-curtains', slot: 'curtains', label: 'hangCurtains', cost: 8 },
        { kind: 'slot', id: 'hang-shelf', slot: 'wall-shelf', label: 'hangShelf', cost: 10 },
        { kind: 'slot', id: 'swap-lamp', slot: 'lamp-table', label: 'swapLamp', cost: 12 },
        { kind: 'slot', id: 'swap-plant', slot: 'plant-left', label: 'swapPlant', cost: 13 },
        { kind: 'slot', id: 'swap-pouf', slot: 'pouf', label: 'swapPouf', cost: 15 },
    ],
};

export const ROOMS: Record<string, RoomDef> = { [SALON.id]: SALON };
export const FIRST_ROOM = 'salon';

export const ROOM_ORDER: readonly RoomListEntry[] = [
    { room: 'salon' },
    { teaser: true, unlockAfter: 'salon' },   // unlocks when the salon is done (FR-019); a real second room replaces it in v1.1
];
