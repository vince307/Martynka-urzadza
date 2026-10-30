import { describe, expect, it } from 'vitest';
import { REGISTRY_KEYS, SAVE_KEYS } from '../src/data/layout';

describe('SAVE_KEYS', () => {
    it('lists exactly the seven registry keys of the save, each a real registry key', () => {
        expect([...SAVE_KEYS].sort()).toEqual(['currentRoom', 'house', 'learner', 'rooms', 'settings', 'stars', 'variants']);
        const known: readonly string[] = Object.values(REGISTRY_KEYS);
        SAVE_KEYS.forEach((key) => expect(known).toContain(key));
    });
});
