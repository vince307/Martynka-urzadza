// The first room, authored as data (S-09, S-16a). Geometry comes from the art pack's manifest: x/y is the top-left corner
// of a picture in the 1920x1080 scene, `visibleRect` the object without its margin, `z` the draw order (0-99).
// Texture keys are `salon/<file id>`. RoomTaskDef.label is a key into pl.room.tasks.
import { FIRST_HOUSE } from './houses';
import { UI_ART_KEYS } from './uiArt';
import type { LayerDef, RoomDef, SlotDef } from '../core/types';

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
    thumbnail: UI_ART_KEYS.salonAfter,
    scene: { before: 'salon/before', after: 'salon/after', shadows: 'salon/shadows' },
    decor,
    slots,
    // New tasks go at the END of this list only (later slots of the art pack): `RoomState.tasksDone` counts positions in it,
    // so inserting or reordering would move every saved room.
    formerTaskCounts: [7],   // S-16a left a 7-task salon; S-16d appended five tasks (R-2)
    // The neglected salon (change salon-style): the real furniture, variant 0, graded in code, in draw order (z). `variant` is the
    // maintainer's lever for which look stands for the old piece (DESIGN-GAP docs/design-gaps.md row 169). `soft` = upholstery.
    worn: [
        { piece: 'wall-frames' },
        { piece: 'rug', soft: true },
        { piece: 'cabinet' },
        { piece: 'lamp-table' },
        { piece: 'plant-left' },
        { piece: 'sofa', soft: true },
        { piece: 'plant-right' },
        { piece: 'armchair', soft: true },
        { piece: 'coffee-table' },
        { piece: 'pouf', soft: true },
    ],
    // Soft ellipses under the pieces that stand on the floor right after the stage (DESIGN-GAP row 171); the widths are measured
    // against the pack's own `shadows` layer.
    contactShadows: [
        { piece: 'lamp-table', widthFactor: 0.75, offset: [8, -6] },
        { piece: 'plant-left', widthFactor: 0.55, offset: [8, -6] },
        { piece: 'pouf', widthFactor: 0.95, offset: [8, -6] },
        { piece: 'plant-right', widthFactor: 0.60, offset: [8, -8] },
    ],
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

// The second room (S-22): the kitchen of the art pack martynka-locations-v2 (manifest room `kitchen`), geometry copied slot by slot.
// Texture keys are `kitchen/<file id>`. No fixed decoration, no worn look and no contact shadows: the pack has none.
const kitchenSlots: SlotDef[] = [
    { id: 'kitchen-counter', x: 630, y: 221, width: 653, height: 434, z: 20, anchor: [327, 418], visibleRect: [16, 62, 621, 356], variants: ['kitchen/kitchen-counter-natural', 'kitchen/kitchen-counter-sunny', 'kitchen/kitchen-counter-mint'] },
    { id: 'kitchen-fridge', x: 1236, y: 296, width: 166, height: 347, z: 25, anchor: [83, 331], visibleRect: [16, 27, 134, 304], variants: ['kitchen/kitchen-fridge-natural', 'kitchen/kitchen-fridge-sunny', 'kitchen/kitchen-fridge-mint'] },
    { id: 'kitchen-table', x: 658, y: 539, width: 446, height: 377, z: 40, anchor: [223, 361], visibleRect: [16, 25, 414, 336], variants: ['kitchen/kitchen-table-natural', 'kitchen/kitchen-table-sunny', 'kitchen/kitchen-table-mint'] },
    { id: 'kitchen-coffee', x: 1221, y: 575, width: 375, height: 344, z: 45, anchor: [188, 328], visibleRect: [17, 16, 342, 312], variants: ['kitchen/kitchen-coffee-natural', 'kitchen/kitchen-coffee-sunny', 'kitchen/kitchen-coffee-mint'] },
    { id: 'kitchen-bench', x: 440, y: 446, width: 300, height: 223, z: 18, anchor: [150, 207], visibleRect: [16, 35, 268, 172], variants: ['kitchen/kitchen-bench-natural', 'kitchen/kitchen-bench-sunny', 'kitchen/kitchen-bench-mint'] },
    { id: 'kitchen-rack', x: 347, y: 301, width: 200, height: 354, z: 10, anchor: [100, 338], visibleRect: [16, 92, 168, 246], variants: ['kitchen/kitchen-rack-natural', 'kitchen/kitchen-rack-sunny', 'kitchen/kitchen-rack-mint'] },
];

export const KITCHEN: RoomDef = {
    id: 'kitchen',
    scene: { before: 'kitchen/before', after: 'kitchen/after', shadows: 'kitchen/shadows' },
    decor: [],
    slots: kitchenSlots,
    worn: [],
    contactShadows: [],
    // New tasks go at the END of this list only (RoomState.tasksDone counts positions in it), except through a save-format step: S-32 inserted
    // the three stages at the front with v7 (MIGRATIONS[6]). Costs follow the children's stages (S-17 tunes them).
    tasks: [
        { kind: 'stage', id: 'clean-kitchen', label: 'cleanKitchen', cost: 5, scene: 'kitchen/kitchen-stage-1' },
        { kind: 'stage', id: 'renew-walls', label: 'renewWalls', cost: 6, scene: 'kitchen/kitchen-stage-2' },
        { kind: 'stage', id: 'renew-floor', label: 'renewFloor', cost: 7 },
        { kind: 'slot', id: 'place-counter', slot: 'kitchen-counter', label: 'placeCounter', cost: 7 },
        { kind: 'slot', id: 'place-fridge', slot: 'kitchen-fridge', label: 'placeFridge', cost: 9 },
        { kind: 'slot', id: 'place-kitchen-table', slot: 'kitchen-table', label: 'placeKitchenTable', cost: 10 },
        { kind: 'slot', id: 'set-up-coffee', slot: 'kitchen-coffee', label: 'setUpCoffee', cost: 12 },
        { kind: 'slot', id: 'place-bench', slot: 'kitchen-bench', label: 'placeBench', cost: 13 },
        { kind: 'slot', id: 'set-out-dishes', slot: 'kitchen-rack', label: 'setOutDishes', cost: 15 },
    ],
};

// The children's room (S-25, FR-033): the room `children` of the art pack martynka-evolution-v1, geometry copied slot by slot.
// Texture keys are `children/<file id>`. Renovated in three stages (D1): each stage task names the pack background it reveals (`scene`), the last one
// shows `after`. No fixed decoration, no worn look and no contact shadows: the pack has none. Costs 5/6/7 + 7..15 = 84 stars (S-17 tunes them).
const childrenSlots: SlotDef[] = [
    { id: 'children-bed', x: 405, y: 239, width: 410, height: 407, z: 20, anchor: [205, 391], visibleRect: [25, 16, 360, 375], variants: ['children/children-bed-natural', 'children/children-bed-house', 'children/children-bed-drawers'] },
    { id: 'children-desk', x: 1258, y: 397, width: 290, height: 262, z: 25, anchor: [145, 246], visibleRect: [16, 37, 258, 209], variants: ['children/children-desk-natural', 'children/children-desk-sunny', 'children/children-desk-mint'] },
    { id: 'children-books', x: 810, y: 286, width: 220, height: 324, z: 15, anchor: [110, 308], visibleRect: [16, 27, 188, 281], variants: ['children/children-books-natural', 'children/children-books-sunny', 'children/children-books-mint'] },
    { id: 'children-toys', x: 411, y: 578, width: 371, height: 251, z: 40, anchor: [186, 235], visibleRect: [16, 19, 339, 216], variants: ['children/children-toys-natural', 'children/children-toys-sunny', 'children/children-toys-mint'] },
    { id: 'children-reading', x: 1211, y: 558, width: 367, height: 301, z: 45, anchor: [184, 285], visibleRect: [21, 16, 325, 269], variants: ['children/children-reading-natural', 'children/children-reading-sunny', 'children/children-reading-mint'] },
    { id: 'children-wardrobe', x: 1028, y: 308, width: 216, height: 346, z: 18, anchor: [108, 330], visibleRect: [16, 38, 184, 292], variants: ['children/children-wardrobe-natural', 'children/children-wardrobe-sunny', 'children/children-wardrobe-mint'] },
];

export const CHILDREN: RoomDef = {
    id: 'children',
    scene: { before: 'children/before', after: 'children/after', shadows: 'children/shadows' },
    decor: [],
    slots: childrenSlots,
    worn: [],
    contactShadows: [],
    tasks: [
        { kind: 'stage', id: 'clean-room', label: 'cleanRoom', cost: 5, scene: 'children/children-stage-1' },
        { kind: 'stage', id: 'paint-walls', label: 'paintWalls', cost: 6, scene: 'children/children-stage-2' },
        { kind: 'stage', id: 'renew-floor', label: 'renewFloor', cost: 7 },
        { kind: 'slot', id: 'place-bed', slot: 'children-bed', label: 'placeBed', cost: 7 },
        { kind: 'slot', id: 'place-desk', slot: 'children-desk', label: 'placeDesk', cost: 9 },
        { kind: 'slot', id: 'place-bookcase', slot: 'children-books', label: 'placeBookcase', cost: 10 },
        { kind: 'slot', id: 'place-toy-chest', slot: 'children-toys', label: 'placeToyChest', cost: 12 },
        { kind: 'slot', id: 'set-up-reading-nook', slot: 'children-reading', label: 'setUpReadingNook', cost: 13 },
        { kind: 'slot', id: 'place-wardrobe', slot: 'children-wardrobe', label: 'placeWardrobe', cost: 15 },
    ],
};

// The Mostek (S-28): the bridge of the space base from the art pack bystrow-space-base-v1 (manifest room `bridge`), geometry copied slot by slot.
// Texture keys are `bridge/<file id>`. No fixed decoration, no worn look and no contact shadows: the pack has none.
const bridgeSlots: SlotDef[] = [
    { id: 'bridge-console', x: 764, y: 294, width: 588, height: 382, z: 20, anchor: [294, 366], visibleRect: [16, 16, 556, 350], variants: ['bridge/bridge-console-natural', 'bridge/bridge-console-sunny', 'bridge/bridge-console-mint'] },
    { id: 'bridge-chair', x: 889, y: 434, width: 212, height: 232, z: 30, anchor: [106, 216], visibleRect: [16, 16, 180, 200], variants: ['bridge/bridge-chair-natural', 'bridge/bridge-chair-sunny', 'bridge/bridge-chair-mint'] },
    { id: 'bridge-telescope', x: 369, y: 359, width: 232, height: 319, z: 18, anchor: [116, 303], visibleRect: [16, 16, 200, 287], variants: ['bridge/bridge-telescope-natural', 'bridge/bridge-telescope-sunny', 'bridge/bridge-telescope-mint'] },
    { id: 'bridge-shelf', x: 1359, y: 234, width: 253, height: 482, z: 15, anchor: [126, 466], visibleRect: [16, 16, 221, 450], variants: ['bridge/bridge-shelf-natural', 'bridge/bridge-shelf-sunny', 'bridge/bridge-shelf-mint'] },
    { id: 'bridge-rug', x: 569, y: 609, width: 562, height: 312, z: 5, anchor: [281, 296], visibleRect: [16, 16, 530, 280], variants: ['bridge/bridge-rug-natural', 'bridge/bridge-rug-sunny', 'bridge/bridge-rug-mint'] },
    { id: 'bridge-plants', x: 1234, y: 644, width: 290, height: 322, z: 40, anchor: [145, 306], visibleRect: [16, 16, 258, 290], variants: ['bridge/bridge-plants-natural', 'bridge/bridge-plants-sunny', 'bridge/bridge-plants-mint'] },
];

export const BRIDGE: RoomDef = {
    id: 'bridge',
    scene: { before: 'bridge/before', after: 'bridge/after', shadows: 'bridge/shadows' },
    decor: [],
    slots: bridgeSlots,
    worn: [],
    contactShadows: [],
    // Costs 6-21 = 100 stars (FR-044): each above the salon's task at the same index, the first within one clean round.
    tasks: [
        { kind: 'stage', id: 'renovate', label: 'renovate', cost: 6 },
        { kind: 'slot', id: 'place-console', slot: 'bridge-console', label: 'placeConsole', cost: 10 },
        { kind: 'slot', id: 'place-pilot-chair', slot: 'bridge-chair', label: 'placePilotChair', cost: 13 },
        { kind: 'slot', id: 'set-up-telescope', slot: 'bridge-telescope', label: 'setUpTelescope', cost: 14 },
        { kind: 'slot', id: 'place-planet-shelf', slot: 'bridge-shelf', label: 'placePlanetShelf', cost: 17 },
        { kind: 'slot', id: 'lay-orbit-mat', slot: 'bridge-rug', label: 'layOrbitMat', cost: 19 },
        { kind: 'slot', id: 'set-up-plant-pod', slot: 'bridge-plants', label: 'setUpPlantPod', cost: 21 },
    ],
};

// The Hangar (S-30): the second module of the space base from the art pack bystrow-space-base-v2 (manifest room `hangar`), geometry copied slot by slot.
// Texture keys are `hangar/<file id>`. No fixed decoration, no worn look and no contact shadows: the pack has none (README).
const hangarSlots: SlotDef[] = [
    { id: 'hangar-rocket', x: 754, y: 254, width: 321, height: 532, z: 25, anchor: [160, 516], visibleRect: [16, 16, 289, 500], variants: ['hangar/hangar-rocket-natural', 'hangar/hangar-rocket-sunny', 'hangar/hangar-rocket-mint'] },
    { id: 'hangar-rover', x: 1114, y: 624, width: 418, height: 292, z: 40, anchor: [209, 276], visibleRect: [16, 16, 386, 260], variants: ['hangar/hangar-rover-natural', 'hangar/hangar-rover-sunny', 'hangar/hangar-rover-mint'] },
    { id: 'hangar-workbench', x: 404, y: 434, width: 384, height: 292, z: 20, anchor: [192, 276], visibleRect: [16, 16, 352, 260], variants: ['hangar/hangar-workbench-natural', 'hangar/hangar-workbench-sunny', 'hangar/hangar-workbench-mint'] },
    { id: 'hangar-crates', x: 264, y: 544, width: 183, height: 242, z: 35, anchor: [92, 226], visibleRect: [16, 16, 151, 210], variants: ['hangar/hangar-crates-natural', 'hangar/hangar-crates-sunny', 'hangar/hangar-crates-mint'] },
    { id: 'hangar-lamp', x: 1384, y: 404, width: 212, height: 276, z: 18, anchor: [106, 260], visibleRect: [16, 16, 180, 244], variants: ['hangar/hangar-lamp-natural', 'hangar/hangar-lamp-sunny', 'hangar/hangar-lamp-mint'] },
    { id: 'hangar-mat', x: 664, y: 644, width: 552, height: 270, z: 5, anchor: [276, 254], visibleRect: [16, 16, 520, 238], variants: ['hangar/hangar-mat-natural', 'hangar/hangar-mat-sunny', 'hangar/hangar-mat-mint'] },
];

export const HANGAR: RoomDef = {
    id: 'hangar',
    scene: { before: 'hangar/before', after: 'hangar/after', shadows: 'hangar/shadows' },
    decor: [],
    slots: hangarSlots,
    worn: [],
    contactShadows: [],
    // Costs 6-21 = 100 stars (FR-047), the same ladder as the Mostek.
    tasks: [
        { kind: 'stage', id: 'renovate', label: 'renovate', cost: 6 },
        { kind: 'slot', id: 'place-rocket', slot: 'hangar-rocket', label: 'placeRocket', cost: 10 },
        { kind: 'slot', id: 'place-rover', slot: 'hangar-rover', label: 'placeRover', cost: 13 },
        { kind: 'slot', id: 'place-workbench', slot: 'hangar-workbench', label: 'placeWorkbench', cost: 14 },
        { kind: 'slot', id: 'stack-crates', slot: 'hangar-crates', label: 'stackCrates', cost: 17 },
        { kind: 'slot', id: 'place-work-lamp', slot: 'hangar-lamp', label: 'placeWorkLamp', cost: 19 },
        { kind: 'slot', id: 'lay-launch-mat', slot: 'hangar-mat', label: 'layLaunchMat', cost: 21 },
    ],
};

// The Laboratorium (S-33, FR-046): the third module of the space base from the art pack bystrow-space-base-v3 (manifest room `lab`), geometry copied slot by slot.
// Texture keys are `lab/<file id>`. No fixed decoration, no worn look and no contact shadows: the pack has none (README).
const labSlots: SlotDef[] = [
    { id: 'lab-microscope', x: 684, y: 444, width: 488, height: 472, z: 30, anchor: [244, 456], visibleRect: [16, 16, 456, 440], variants: ['lab/lab-microscope-natural', 'lab/lab-microscope-sunny', 'lab/lab-microscope-mint'] },
    { id: 'lab-rocks', x: 634, y: 194, width: 203, height: 412, z: 15, anchor: [102, 396], visibleRect: [16, 16, 171, 380], variants: ['lab/lab-rocks-natural', 'lab/lab-rocks-sunny', 'lab/lab-rocks-mint'] },
    { id: 'lab-flasks', x: 1094, y: 464, width: 340, height: 322, z: 25, anchor: [170, 306], visibleRect: [16, 16, 308, 290], variants: ['lab/lab-flasks-natural', 'lab/lab-flasks-sunny', 'lab/lab-flasks-mint'] },
    { id: 'lab-globe', x: 1414, y: 434, width: 242, height: 329, z: 28, anchor: [121, 313], visibleRect: [16, 16, 210, 297], variants: ['lab/lab-globe-natural', 'lab/lab-globe-sunny', 'lab/lab-globe-mint'] },
    { id: 'lab-stool', x: 724, y: 704, width: 204, height: 242, z: 40, anchor: [102, 226], visibleRect: [16, 16, 172, 210], variants: ['lab/lab-stool-natural', 'lab/lab-stool-sunny', 'lab/lab-stool-mint'] },
    { id: 'lab-board', x: 344, y: 264, width: 292, height: 247, z: 10, anchor: [146, 231], visibleRect: [16, 16, 260, 215], variants: ['lab/lab-board-natural', 'lab/lab-board-sunny', 'lab/lab-board-mint'] },
];

export const LAB: RoomDef = {
    id: 'lab',
    scene: { before: 'lab/before', after: 'lab/after', shadows: 'lab/shadows' },
    decor: [],
    slots: labSlots,
    worn: [],
    contactShadows: [],
    // Costs 6-21 = 100 stars (FR-046), the same ladder as the Mostek and the Hangar (S-17 tunes them).
    tasks: [
        { kind: 'stage', id: 'renovate', label: 'renovate', cost: 6 },
        { kind: 'slot', id: 'place-microscope', slot: 'lab-microscope', label: 'placeMicroscope', cost: 10 },
        { kind: 'slot', id: 'place-rock-case', slot: 'lab-rocks', label: 'placeRockCase', cost: 13 },
        { kind: 'slot', id: 'place-flask-table', slot: 'lab-flasks', label: 'placeFlaskTable', cost: 14 },
        { kind: 'slot', id: 'place-moon-model', slot: 'lab-globe', label: 'placeMoonModel', cost: 17 },
        { kind: 'slot', id: 'place-stool', slot: 'lab-stool', label: 'placeStool', cost: 19 },
        { kind: 'slot', id: 'hang-board', slot: 'lab-board', label: 'hangBoard', cost: 21 },
    ],
};

// The bathroom (S-31, FR-033, D1): the room `bathroom` of the art pack martynka-bathroom-v1, geometry copied slot by slot from its manifest.
// Texture keys are `bathroom/<file id>`. One stage task (before -> after, no stage backgrounds), six slots with three variants each, no fixed decoration,
// no worn look and no contact shadows: the pack has none. Costs 5 + 7/9/10/12/13/15 = 71 stars, the kitchen curve (S-17 tunes them).
const bathroomSlots: SlotDef[] = [
    { id: 'bathroom-tub', x: 468, y: 284, width: 441, height: 492, z: 20, anchor: [220, 476], visibleRect: [16, 16, 409, 460], variants: ['bathroom/bathroom-tub-natural', 'bathroom/bathroom-tub-sunny', 'bathroom/bathroom-tub-mint'] },
    { id: 'bathroom-sink', x: 943, y: 291, width: 313, height: 478, z: 25, anchor: [156, 462], visibleRect: [16, 16, 281, 446], variants: ['bathroom/bathroom-sink-natural', 'bathroom/bathroom-sink-sunny', 'bathroom/bathroom-sink-mint'] },
    { id: 'bathroom-cabinet', x: 1310, y: 408, width: 210, height: 398, z: 30, anchor: [105, 382], visibleRect: [16, 16, 178, 366], variants: ['bathroom/bathroom-cabinet-natural', 'bathroom/bathroom-cabinet-sunny', 'bathroom/bathroom-cabinet-mint'] },
    { id: 'bathroom-rug', x: 800, y: 712, width: 346, height: 188, z: 10, anchor: [173, 172], visibleRect: [16, 16, 314, 156], variants: ['bathroom/bathroom-rug-natural', 'bathroom/bathroom-rug-sunny', 'bathroom/bathroom-rug-mint'] },
    { id: 'bathroom-plant', x: 363, y: 583, width: 205, height: 225, z: 40, anchor: [102, 209], visibleRect: [16, 16, 173, 193], variants: ['bathroom/bathroom-plant-natural', 'bathroom/bathroom-plant-sunny', 'bathroom/bathroom-plant-mint'] },
    { id: 'bathroom-ducks', x: 1300, y: 316, width: 193, height: 129, z: 15, anchor: [96, 113], visibleRect: [16, 16, 161, 97], variants: ['bathroom/bathroom-ducks-natural', 'bathroom/bathroom-ducks-sunny', 'bathroom/bathroom-ducks-mint'] },
];

export const BATHROOM: RoomDef = {
    id: 'bathroom',
    scene: { before: 'bathroom/before', after: 'bathroom/after', shadows: 'bathroom/shadows' },
    decor: [],
    slots: bathroomSlots,
    worn: [],
    contactShadows: [],
    tasks: [
        { kind: 'stage', id: 'renovate', label: 'renovate', cost: 5 },
        { kind: 'slot', id: 'place-tub', slot: 'bathroom-tub', label: 'placeTub', cost: 7 },
        { kind: 'slot', id: 'set-up-sink', slot: 'bathroom-sink', label: 'setUpSink', cost: 9 },
        { kind: 'slot', id: 'place-towel-shelf', slot: 'bathroom-cabinet', label: 'placeTowelShelf', cost: 10 },
        { kind: 'slot', id: 'lay-bath-rug', slot: 'bathroom-rug', label: 'layBathRug', cost: 12 },
        { kind: 'slot', id: 'place-bath-plant', slot: 'bathroom-plant', label: 'placeBathPlant', cost: 13 },
        { kind: 'slot', id: 'hang-toy-shelf', slot: 'bathroom-ducks', label: 'hangToyShelf', cost: 15 },
    ],
};

export const ROOMS: Record<string, RoomDef> = { [SALON.id]: SALON, [KITCHEN.id]: KITCHEN, [CHILDREN.id]: CHILDREN, [BATHROOM.id]: BATHROOM, [BRIDGE.id]: BRIDGE, [HANGAR.id]: HANGAR, [LAB.id]: LAB };
export const FIRST_ROOM = FIRST_HOUSE.rooms[0].room;
