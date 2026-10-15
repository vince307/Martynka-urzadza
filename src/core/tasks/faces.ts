// Tile faces (S-14d): a choice a child tells apart by looking, not by reading, is a face code
// "shape:<figure>:<colour>:<size>". Core keeps the code; the scene draws it; texts say it with `faceLabel`.
import { COLOURS, COLOUR_IDS, FIGURES, FIGURE_IDS, SIZES, SIZE_IDS, type ColourId, type FigureId, type SizeId } from '../../data/shapes';

export interface Face {
    figure: FigureId;
    colour: ColourId;
    size: SizeId;
}

const PREFIX = 'shape';

export const faceKey = (face: Face): string => `${PREFIX}:${face.figure}:${face.colour}:${face.size}`;

const has = <T extends string>(ids: readonly T[], value: string): value is T => (ids as readonly string[]).includes(value);

/** The face a code names, or null when the value is not a well-formed face code. */
export const parseFace = (value: unknown): Face | null => {
    if (typeof value !== 'string') {
        return null;
    }
    const [prefix, figure, colour, size, ...rest] = value.split(':');
    if (prefix !== PREFIX || rest.length > 0 || figure === undefined || colour === undefined || size === undefined) {
        return null;
    }
    return has(FIGURE_IDS, figure) && has(COLOUR_IDS, colour) && has(SIZE_IDS, size) ? { figure, colour, size } : null;
};

export const isFace = (value: unknown): boolean => parseFace(value) !== null;

/** "duży czerwony trójkąt": size, colour and figure agree with the gender of the figure; `size: false` leaves the size out. */
export const faceLabel = (value: string, opts: { size?: boolean } = {}): string => {
    const face = parseFace(value);
    if (!face) {
        throw new TypeError(`not a face code: ${JSON.stringify(value)}`);
    }
    const figure = FIGURES.find((f) => f.id === face.figure);
    if (!figure) {
        throw new TypeError(`unknown figure ${face.figure}`);
    }
    const words = [COLOURS[face.colour][figure.gender], figure.nominative];
    return (opts.size === false ? words : [SIZES[face.size][figure.gender], ...words]).join(' ');
};

/** A value as the parent or the narrator reads it: a face code becomes its words, anything else stays. */
export const faceText = (value: number | string): number | string => (typeof value === 'string' && isFace(value) ? faceLabel(value) : value);
