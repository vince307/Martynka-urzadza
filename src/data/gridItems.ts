// Items drawn on the square grid of GRID tasks (S-13b). The id is drawn in code; the noun is a key of `nouns.ts`
// (its accusative is what the prompt says: "Gdzie jest serce?").
export const GRID_ITEM_IDS = ['circle', 'square', 'triangle', 'star', 'heart'] as const;
export type GridItemId = (typeof GRID_ITEM_IDS)[number];

export const GRID_ITEMS: readonly { id: GridItemId; noun: string }[] = [
    { id: 'circle', noun: 'koło' },
    { id: 'square', noun: 'kwadrat' },
    { id: 'triangle', noun: 'trójkąt' },
    { id: 'star', noun: 'gwiazdka' },
    { id: 'heart', noun: 'serce' },
];

export const GRID_LIMITS = { columns: 6, rows: 5, minItems: 2, maxItems: 5 } as const;
