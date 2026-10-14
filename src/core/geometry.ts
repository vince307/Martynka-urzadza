// The one rectangle type of the 1920x1080 scene space, shared by pictureLayout, dragLayout and the widgets.
export interface Rect {
    x: number;       // left
    y: number;       // top
    width: number;
    height: number;
}

export const insideRect = (r: Rect, x: number, y: number): boolean =>
    x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;

/** Centre of a rectangle: a touch there lands inside by half the rectangle on every side (hold-point idea of roomHit). */
export const interiorPoint = (r: Rect): { x: number; y: number } => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
