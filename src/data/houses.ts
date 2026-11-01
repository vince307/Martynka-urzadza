// Houses as data (FR-038): each house lists its rooms in opening order, with the cell of each in the floor x place grid.
// The layout is from docs/designer-brief-m03.md ("Układ domów"); the children's room and the closed cell come with later slices.
import type { BuildingChoice, HouseGeometry, HouseState } from '../core/types';

export const HOUSES: readonly HouseState[] = [
    {
        id: 'house-1',
        rooms: [
            { room: 'salon', floor: 0, place: 0 },
            { room: 'kitchen', floor: 0, place: 1 },
        ],
    },
    // The space base (S-28). No HOUSE_GEOMETRY entry yet: S-29 adds the cross-section. Nobody can choose it until the choice view (phase 6).
    { id: 'base-1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] },
];

export const FIRST_HOUSE: HouseState = HOUSES[0];

/** The two cards of the first-building choice, in display order; `art` keys name the pictures of phase 5. */
export const BUILDING_CHOICES: readonly BuildingChoice[] = [
    { id: 'house', house: 'house-1', art: 'choice/house' },
    { id: 'space', house: 'base-1', art: 'choice/space' },
];

/** Cell rectangles of each house view (scene space 1920x1080), from the art pack manifest (houses.house-1). Art keys name the pictures of phase 2. */
export const HOUSE_GEOMETRY: Readonly<Record<string, HouseGeometry>> = {
    'house-1': {
        shell: 'house/house-1-shell',
        cellClosed: 'house/cell-closed',
        cellFrame: 'house/cell-frame',
        cellFill: 0xfff5df,
        frameInset: 16,
        background: 0xe7f4f4,
        teaser: { color: '#FFF5DF', shadow: '#245C59', weight: 650 },
        standInRoof: true,
        cells: [
            { id: 'ground-left', floor: 0, place: 0, x: 252, y: 636, width: 608, height: 342 },
            { id: 'ground-right', floor: 0, place: 1, x: 1060, y: 636, width: 608, height: 342 },
            { id: 'upper-left', floor: 1, place: 0, x: 252, y: 236, width: 608, height: 342 },
            { id: 'upper-right', floor: 1, place: 1, x: 1060, y: 236, width: 608, height: 342 },
        ],
        stairwell: { x: 860, y: 236, width: 200, height: 742 },
    },
};
