// The v4 -> v5 step (rooms-as-data): a save gains the house the child's salon lives in. FROZEN: never edited. A later change of
// the house list adds a save version of its own; the load path (not this step) merges the house with the data.
import type { HouseState } from '../types';

/** The house every v4 save moves into: the salon in the ground-floor cell 0. */
export const HOUSE_V5: Readonly<HouseState> = { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 }] };

const copyOfHouseV5 = (): HouseState => ({ id: HOUSE_V5.id, rooms: HOUSE_V5.rooms.map((p) => ({ ...p })) });

/** Reads and never mutates its input; rooms, currentRoom, stars, learner, variants, generation and writer pass through. */
export const LIFT_V4_HOUSE = (raw: unknown): unknown => ({ ...(raw as Record<string, unknown>), version: 5, house: copyOfHouseV5() });
