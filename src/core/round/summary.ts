// What the round-summary screen shows: stars earned (with the bonus), the
// bonus itself, one star per task, and whether "Do pokoju" is highlighted.
import type { RoundState } from '../round';

export interface SummaryView {
    earned: number;      // stars of the round including the clean-round bonus
    bonus: number;
    stars: boolean[];    // per task: a star was paid (first or second try)
    roomHighlighted: boolean;
}

export interface SummaryContext {
    starsTotal: number;                 // the child's stars before this round is added by the caller, or after: the caller decides which total it passes
    nextRoomTaskCost: number | null;    // null: no renovation task to afford (yet)
}

export const summaryView = (state: RoundState, ctx: SummaryContext): SummaryView | null => {
    if (!state.finished) {
        return null;
    }
    return {
        earned: state.starsEarned,
        bonus: state.bonusEarned,
        stars: state.outcomes.map((o) => o === 'first' || o === 'second'),
        roomHighlighted: ctx.nextRoomTaskCost !== null && ctx.starsTotal >= ctx.nextRoomTaskCost,
    };
};
