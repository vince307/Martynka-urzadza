// Figures, colours and sizes of the tile faces (SHAPES, PATTERN; roadmap S-14d). Ids only here and in the face codes:
// the scene maps colour ids to layout tokens, core never sees a pixel. Polish forms are kept per figure and gender.
export const FIGURE_IDS = ['circle', 'square', 'rectangle', 'triangle', 'star', 'heart'] as const;
export type FigureId = (typeof FIGURE_IDS)[number];

/** The four figures a child names in SHAPES; star and heart only make patterns (they are already drawn in code for GRID). */
export const NAMED_FIGURE_IDS = ['circle', 'square', 'rectangle', 'triangle'] as const;

export type Gender = 'm' | 'f' | 'n';

export interface FigureDef {
    id: FigureId;
    gender: Gender;
    nominative: string;
    genitive: string;          // "Dotknij trójkąta."
    genitivePlural: string;    // "Dotknij wszystkich kół."
    /** What a child can count on the figure; the first hint of a "touch the …" task. Empty for figures SHAPES never names. */
    fact: string;
    /** What to look for, after "Szukaj figury …" / "Szukaj wszystkich figur …". Empty for figures SHAPES never names. */
    look: string;
}

export const FIGURES: readonly FigureDef[] = [
    { id: 'circle', gender: 'n', nominative: 'koło', genitive: 'koła', genitivePlural: 'kół', fact: 'Koło jest okrągłe i nie ma rogów.', look: 'bez rogów' },
    { id: 'square', gender: 'm', nominative: 'kwadrat', genitive: 'kwadratu', genitivePlural: 'kwadratów', fact: 'Kwadrat ma 4 równe boki i 4 rogi.', look: 'z 4 równymi bokami' },
    { id: 'rectangle', gender: 'm', nominative: 'prostokąt', genitive: 'prostokąta', genitivePlural: 'prostokątów', fact: 'Prostokąt ma 4 boki i 4 rogi, dwa boki są dłuższe.', look: 'z 4 rogami i dwoma dłuższymi bokami' },
    { id: 'triangle', gender: 'm', nominative: 'trójkąt', genitive: 'trójkąta', genitivePlural: 'trójkątów', fact: 'Trójkąt ma 3 boki i 3 rogi.', look: 'z 3 rogami' },
    { id: 'star', gender: 'f', nominative: 'gwiazdka', genitive: 'gwiazdki', genitivePlural: 'gwiazdek', fact: '', look: '' },
    { id: 'heart', gender: 'n', nominative: 'serce', genitive: 'serca', genitivePlural: 'serc', fact: '', look: '' },
];

export const COLOUR_IDS = ['red', 'blue', 'green', 'yellow'] as const;
export type ColourId = (typeof COLOUR_IDS)[number];

export const SIZE_IDS = ['big', 'small'] as const;
export type SizeId = (typeof SIZE_IDS)[number];

/** Adjective forms by the gender of the noun they stand with ("czerwony trójkąt", "czerwona gwiazdka", "czerwone koło"). */
export type GenderForms = Readonly<Record<Gender, string>>;

export const COLOURS: Readonly<Record<ColourId, GenderForms>> = {
    red: { m: 'czerwony', f: 'czerwona', n: 'czerwone' },
    blue: { m: 'niebieski', f: 'niebieska', n: 'niebieskie' },
    green: { m: 'zielony', f: 'zielona', n: 'zielone' },
    yellow: { m: 'żółty', f: 'żółta', n: 'żółte' },
};

export const SIZES: Readonly<Record<SizeId, GenderForms>> = {
    big: { m: 'duży', f: 'duża', n: 'duże' },
    small: { m: 'mały', f: 'mała', n: 'małe' },
};

/** Shown shapes of a PATTERN row before the gap, and how many tiles answer it. */
export const PATTERN_LIMITS = { minShown: 6, maxShown: 8, tiles: 3 } as const;

/** Tiles of a SHAPES task: "name" and "odd" tasks show these many tiles; an "all" task (multi-select) the second pair. */
export const SHAPES_LIMITS = { nameTiles: [3, 4], oddTiles: 4, allTiles: [5, 6], allTargets: [2, 3] } as const;
