import type { RoundRules } from './round';
import type { Rng } from './rng';
import type { VariantState } from './types';

export type Minigame = 'word' | 'dice';
export type VariantKind = Minigame | 'puzzle';
export type RoundKind = 'round' | VariantKind;

export interface ScheduleContext {
    stageId: string;
    today: string;
    hasPool: (stageId: string) => boolean;
    minigames: readonly Minigame[];
    wordAvailable: boolean;
    rules: { everyRounds: number };
    forced?: VariantKind | 'off';
}

const chooseMinigame = (state: VariantState, ctx: ScheduleContext, only?: Minigame): Minigame | null => {
    const open = ctx.minigames.filter((m) => (m !== 'word' || ctx.wordAvailable) && (only === undefined || m === only));
    return open.find((m) => m !== state.lastMinigame) ?? open[0] ?? null;
};

/** Which kind the next round is. Pure: the counter changes only in `afterRound`, at the end of a finished round or variant. */
export const nextRoundKind = (state: VariantState, ctx: ScheduleContext): RoundKind => {
    if (ctx.forced === 'off') return 'round';
    if (ctx.forced === undefined && state.roundsSince < ctx.rules.everyRounds) return 'round';
    const wantsPuzzle = ctx.forced === undefined || ctx.forced === 'puzzle';
    if (wantsPuzzle && ctx.hasPool(ctx.stageId) && state.puzzleDay !== ctx.today) return 'puzzle';
    const forcedGame = ctx.forced === 'word' || ctx.forced === 'dice' ? ctx.forced : undefined;
    return chooseMinigame(state, ctx, forcedGame) ?? chooseMinigame(state, ctx) ?? 'round';
};

/** The state after a round or variant of `kind` finished. Returns a new object. */
export const afterRound = (
    state: VariantState,
    kind: RoundKind,
    today: string,
    puzzle?: { id: string; poolIds: readonly string[] },
): VariantState => {
    if (kind === 'round') return { ...state, puzzlesDone: [...state.puzzlesDone], roundsSince: state.roundsSince + 1 };
    const next: VariantState = { ...state, puzzlesDone: [...state.puzzlesDone], roundsSince: 0 };
    if (kind === 'puzzle') {
        next.puzzleDay = today;
        if (puzzle) {
            const done = [...state.puzzlesDone, puzzle.id];
            next.puzzlesDone = puzzle.poolIds.every((id) => done.includes(id)) ? [puzzle.id] : done;
        }
    } else {
        next.lastMinigame = kind;
    }
    return next;
};

/** First unsolved puzzle of the cycle, drawn by the seed; a finished cycle starts over. Unknown done ids are ignored. */
export const pickPuzzle = <T extends { id: string }>(pool: readonly T[], done: readonly string[], rng: Rng): T => {
    const fresh = pool.filter((p) => !done.includes(p.id));
    return rng.pick(fresh.length > 0 ? fresh : pool);
};

/** Stars rules of a variant; the one place of this arithmetic. */
export const variantRules = (
    kind: RoundKind,
    n: number,
    base: { round: RoundRules; variants: { puzzleMultiplier: number } },
): RoundRules => ({
    length: n,
    starPerTask: kind === 'puzzle' ? base.round.starPerTask * base.variants.puzzleMultiplier : base.round.starPerTask,
    cleanRoundBonus: 0,
});

/** What the HUD title shows for a round of `kind`: the name and, for the daily puzzle, the doubled-stars badge. An ordinary round has none. */
export interface HudTitleView {
    text: string;
    badge: string | null;
}

export const variantTitle = (
    kind: RoundKind,
    words: { diceTitle: string; wordTitle: string; puzzleTitle: string; puzzleBadge: string },
): HudTitleView | null => {
    if (kind === 'puzzle') return { text: words.puzzleTitle, badge: words.puzzleBadge };
    if (kind === 'dice') return { text: words.diceTitle, badge: null };
    if (kind === 'word') return { text: words.wordTitle, badge: null };
    return null;
};
