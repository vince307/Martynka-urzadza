// Houses as data (FR-038): each house lists its rooms in opening order, with the cell of each in the floor x place grid.
// The layout is from docs/designer-brief-m03.md ("Układ domów"); house 1 is complete with the bathroom (S-31), a closed cell is drawn only for a room not yet reached.
import type { BuildingChoice, HouseGeometry, HouseState } from '../core/types';

export const HOUSES: readonly HouseState[] = [
    {
        id: 'house-1',
        rooms: [
            { room: 'salon', floor: 0, place: 0 },
            { room: 'kitchen', floor: 0, place: 1 },
            { room: 'children', floor: 1, place: 0 },
            { room: 'bathroom', floor: 1, place: 1 },
        ],
    },
    // The space base (S-28): the Mostek, then the Hangar in the ground-right cell (S-30); its cross-section is HOUSE_GEOMETRY['base-1'] (S-29).
    { id: 'base-1', rooms: [{ room: 'bridge', floor: 0, place: 0 }, { room: 'hangar', floor: 0, place: 1 }] },
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
    // The space base (S-29): cells and lift shaft from the pack bystrow-space-base-v1 manifest (houses.base-1, liftShaft), the sky and the
    // teaser style from its preview (the "Wkrótce" glyphs centre on the cell, fillText baseline at y+182 of 32 px text).
    // DESIGN-GAP: the pack has no base cell frame; the house `cell-frame` is shared (docs/design-gaps.md).
    'base-1': {
        shell: 'house/base-1-shell',
        cellClosed: 'house/base-1-cell-closed',
        cellFrame: 'house/cell-frame',
        cellFill: 0xfff5df,
        frameInset: 16,
        background: 0xe8efeb,
        teaser: { color: '#245C59', shadow: null, weight: 600 },
        standInRoof: false,
        cells: [
            { id: 'ground-left', floor: 0, place: 0, x: 252, y: 636, width: 608, height: 342 },
            { id: 'ground-right', floor: 0, place: 1, x: 1060, y: 636, width: 608, height: 342 },
            { id: 'upper-left', floor: 1, place: 0, x: 252, y: 236, width: 608, height: 342 },
            { id: 'upper-right', floor: 1, place: 1, x: 1060, y: 236, width: 608, height: 342 },
        ],
        stairwell: { x: 860, y: 236, width: 200, height: 742 },
    },
};
