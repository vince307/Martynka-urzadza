// Where a furniture picture's visible part sits inside a variant thumbnail (S-16a): scaled to fit the square above the name strip, centred.

export interface ThumbFit {
    scale: number;
    /** Offset of the fitted visible part from the thumbnail's top-left corner. */
    left: number;
    top: number;
    width: number;
    height: number;
}

/** `visibleRect` is [left, top, width, height] of the object in its picture; the thumbnail is `size` square with `inset` around and `nameHeight` reserved at the bottom. */
export function thumbFit(visibleRect: readonly [number, number, number, number], size: number, inset: number, nameHeight: number): ThumbFit {
    const [, , visibleWidth, visibleHeight] = visibleRect;
    const room = size - 2 * inset;
    const scale = Math.min(room / visibleWidth, (room - nameHeight) / visibleHeight);
    const width = visibleWidth * scale;
    const height = visibleHeight * scale;
    return { scale, left: (size - width) / 2, top: inset + (room - nameHeight - height) / 2, width, height };
}
