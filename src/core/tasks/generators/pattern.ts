// PATTERN (E1.1): a periodic row of figures with the last place empty; the child picks what comes next.
import { pl } from '../../../data/pl';
import { COLOUR_IDS, FIGURE_IDS, PATTERN_LIMITS, type ColourId, type FigureId } from '../../../data/shapes';
import type { Rng } from '../../rng';
import { faceKey, faceLabel, type Face } from '../faces';
import type { Generator, Task } from '../types';

export type PatternPeriod = 'AB' | 'ABB' | 'AAB' | 'ABC';

export interface PatternParams {
    periods: PatternPeriod[];
    figures: FigureId[];
}

/** The places of one period as indices of its distinct figures. */
const TEMPLATES: Readonly<Record<PatternPeriod, readonly number[]>> = {
    AB: [0, 1],
    ABB: [0, 1, 1],
    AAB: [0, 0, 1],
    ABC: [0, 1, 2],
};
const MIN_FIGURES = 3;

export const parsePatternParams = (params: Record<string, unknown>): PatternParams => {
    const { periods, figures } = params;
    if (!Array.isArray(periods) || periods.length === 0 || !periods.every((p): p is PatternPeriod => typeof p === 'string' && Object.prototype.hasOwnProperty.call(TEMPLATES, p))) {
        throw new TypeError(`PATTERN params.periods must be a non-empty list of ${Object.keys(TEMPLATES).join(', ')}, got ${JSON.stringify(periods)}`);
    }
    const known: readonly string[] = FIGURE_IDS;
    if (!Array.isArray(figures) || !figures.every((f): f is FigureId => typeof f === 'string' && known.includes(f))) {
        throw new TypeError(`PATTERN params.figures must list figures from ${known.join(', ')}, got ${JSON.stringify(figures)}`);
    }
    if (new Set(figures).size !== figures.length || figures.length < MIN_FIGURES) {
        throw new TypeError(`PATTERN params.figures needs ${MIN_FIGURES} or more different figures, got ${JSON.stringify(figures)}`);
    }
    return { periods, figures };
};

type Mode = 'figure' | 'colour' | 'both';

export const generatePattern: Generator = (skill, rng: Rng): Task => {
    const p = parsePatternParams(skill.params);
    const template = TEMPLATES[rng.pick(p.periods)];
    const distinct = Math.max(...template) + 1;
    const mode = rng.pick<Mode>(['figure', 'colour', 'both']);
    const figures = rng.shuffle(p.figures);
    const colours = rng.shuffle(COLOUR_IDS);
    const baseFigure = figures[0];
    const baseColour = colours[0];
    const face = (figure: FigureId, colour: ColourId): Face => ({ figure, colour, size: 'big' });
    // Every face the row may use, in the order they are handed out: the first `distinct` make the period.
    const faceFor = (i: number): Face =>
        face(mode === 'colour' ? baseFigure : (figures[i]), mode === 'figure' ? baseColour : (colours[i]));
    const available = mode === 'figure' ? figures.length : mode === 'colour' ? colours.length : Math.min(figures.length, colours.length);
    const places = Array.from({ length: available }, (_, i) => faceFor(i));
    const period = places.slice(0, distinct);
    const shownCount = rng.int(PATTERN_LIMITS.minShown, PATTERN_LIMITS.maxShown);
    const shown = Array.from({ length: shownCount }, (_, i) => faceKey(period[template[i % template.length]]));
    const answer = faceKey(period[template[shownCount % template.length]]);
    // Tiles: the answer, the other places of the period, and a face from outside the period to make three.
    const others = period.map(faceKey).filter((k) => k !== answer);
    const outside = places.slice(distinct).map(faceKey);
    const choices = rng.shuffle([answer, ...others, ...rng.shuffle(outside)].slice(0, PATTERN_LIMITS.tiles));
    const oneRound = template.map((index) => faceLabel(faceKey(period[index]), { size: false })).join(', ');
    return {
        skillId: skill.id,
        prompt: pl.tasks.pattern,
        visual: { kind: 'pattern', items: [...shown, null] },
        answer,
        choices,
        hint: [pl.tasks.patternRepeats, pl.tasks.patternPeriod(oneRound)],
    };
};
