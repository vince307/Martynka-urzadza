// A prompt such as "2 + 9 = □" is drawn as text pieces with a box between them: the font has no "□"
// (docs/design-gaps.md row 8). The task data keeps the character; only the rendering changes.

export type PromptPiece = { kind: 'text'; text: string } | { kind: 'blank' };
export type PlacedPiece = { piece: PromptPiece; left: number; width: number };

export const BLANK = '□';

/** Splits a prompt on every "□"; text pieces are trimmed and empty ones dropped. */
export const splitBlanks = (prompt: string): PromptPiece[] => {
    const pieces: PromptPiece[] = [];
    prompt.split(BLANK).forEach((part, i, all) => {
        const text = part.trim();
        if (text !== '') {
            pieces.push({ kind: 'text', text });
        }
        if (i < all.length - 1) {
            pieces.push({ kind: 'blank' });
        }
    });
    return pieces;
};

/** Lays the pieces out in one row centred on x = 0, `gap` apart; returns each piece's left edge and the total width. */
export const layoutPieces = (
    pieces: readonly PromptPiece[],
    textWidth: (text: string, index: number) => number,
    blankWidth: number,
    gap: number,
): { placed: PlacedPiece[]; width: number } => {
    const widths = pieces.map((p, i) => (p.kind === 'blank' ? blankWidth : textWidth(p.text, i)));
    const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, pieces.length - 1);
    let left = -total / 2;
    const placed = pieces.map((piece, i) => {
        const item = { piece, left, width: widths[i] };
        left += widths[i] + gap;
        return item;
    });
    return { placed, width: total };
};
