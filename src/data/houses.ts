// Houses as data (FR-038): each house lists its rooms in opening order, with the cell of each in the floor x place grid.
// The layout is from docs/designer-brief-m03.md ("Układ domów"); the children's room and the closed cell come with later slices.
import type { HouseState } from '../core/types';

export const HOUSES: readonly HouseState[] = [
    {
        id: 'house-1',
        rooms: [
            { room: 'salon', floor: 0, place: 0 },
            { room: 'kitchen', floor: 0, place: 1 },
        ],
    },
];

export const FIRST_HOUSE: HouseState = HOUSES[0];
