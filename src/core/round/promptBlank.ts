// A prompt such as "2 + 9 = □" is drawn as text pieces with a box between them: the font has no "□"
// (docs/design-gaps.md row 8). The task data keeps the character; only the rendering changes.

export type PromptPiece = { kind: 'text'; text: string } | { kind: 'blank' };
export type PlacedPiece = { piece: PromptPiece; left: number; width: number };

export const BLANK = '□';

/** How a blank reads inside plain text (a hint or solution line): the font has no "□" and a text line cannot hold the drawn box. */
const BLANK_TEXT = '?';

// DESIGN-GAP (docs/design-gaps.md row 99): the kit has no blank inside a hint or solution line; we write it as "?".
/** The line with every "□" written as "?" (visual gate S-14c: the INEQUALITY hint "2 = 7 − □" showed a tiny system glyph). */
export const blankAsText = (line: string): string => line.split(BLANK).join(BLANK_TEXT);

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

/**
 * `layoutPieces` for an expression that must stay within `maxWidth`: when the row at full size is wider, every piece (text and
 * box, gaps included) shrinks by the same `scale` (visual gate S-14c: "6618 = 6000 + 600 + □ + 8" ran under the keypad).
 */
export const fitPieces = (
    pieces: readonly PromptPiece[],
    textWidth: (text: string, index: number) => number,
    blankWidth: number,
    gap: number,
    maxWidth: number,
): { placed: PlacedPiece[]; width: number; scale: number } => {
    const full = layoutPieces(pieces, textWidth, blankWidth, gap);
    const scale = Math.min(1, maxWidth / full.width);
    if (scale === 1) {
        return { ...full, scale };
    }
    const shrunk = layoutPieces(pieces, (text, i) => textWidth(text, i) * scale, blankWidth * scale, gap * scale);
    return { ...shrunk, scale };
};

export type PromptLine = { placed: PlacedPiece[]; width: number };

/**
 * Word-wraps a sentence prompt that contains "□" into lines of text phrases and boxes, each line centred on
 * x = 0. Text between boxes stays one phrase (measured whole); a box glued to punctuation ("□?") has no gap.
 * `maxWidth` is measured with the same callbacks, so the scene never needs the font's own wrapping here.
 */
export const wrapBlankLines = (
    prompt: string,
    textWidth: (text: string) => number,
    blankWidth: number,
    spaceWidth: number,
    maxWidth: number,
): PromptLine[] => {
    const words = prompt.split(/\s+/u).filter((w) => w !== '');
    const widthOf = (word: string): number =>
        word.split(BLANK).reduce((sum, part, i, all) => sum + (part === '' ? 0 : textWidth(part)) + (i < all.length - 1 ? blankWidth : 0), 0);
    const rows: string[][] = [];
    let row: string[] = [];
    let rowWidth = 0;
    for (const word of words) {
        const w = widthOf(word);
        if (row.length > 0 && rowWidth + spaceWidth + w > maxWidth) {
            rows.push(row);
            row = [];
        }
        rowWidth = row.length === 0 ? w : rowWidth + spaceWidth + w;
        row.push(word);
    }
    if (row.length > 0) {
        rows.push(row);
    }
    return rows.map((rowWords) => {
        const items: { piece: PromptPiece; gap: number }[] = [];
        rowWords.forEach((word, wi) => {
            let gap = wi === 0 ? 0 : spaceWidth;
            word.split(BLANK).forEach((part, i, all) => {
                if (part !== '') {
                    const last = items[items.length - 1];
                    if (i === 0 && wi > 0 && last && last.piece.kind === 'text') {
                        last.piece = { kind: 'text', text: `${last.piece.text} ${part}` };   // plain words share one phrase
                    } else {
                        items.push({ piece: { kind: 'text', text: part }, gap: i === 0 ? gap : 0 });
                    }
                    gap = 0;
                }
                if (i < all.length - 1) {
                    items.push({ piece: { kind: 'blank' }, gap: i === 0 ? gap : 0 });
                    gap = 0;
                }
            });
        });
        const widths = items.map(({ piece }) => (piece.kind === 'blank' ? blankWidth : textWidth(piece.text)));
        const total = widths.reduce((a, b) => a + b, 0) + items.reduce((a, it, i) => a + (i === 0 ? 0 : it.gap), 0);
        let left = -total / 2;
        const placed = items.map((it, i) => {
            left += i === 0 ? 0 : it.gap;
            const p = { piece: it.piece, left, width: widths[i] };
            left += widths[i];
            return p;
        });
        return { placed, width: total };
    });
};
