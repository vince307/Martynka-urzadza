import type { GameObjects, Scene } from 'phaser';
import { gradeMatrix } from '../core/colorGrade';
import type { GradeParams } from '../core/types';
import { ROOM_LAYOUT } from '../data/layout';

const addGrade = (image: GameObjects.Image, params: GradeParams): boolean => {
    const filter = image.enableFilters().filters?.internal.addColorMatrix();
    if (!filter) {
        return false;
    }
    filter.colorMatrix.set(gradeMatrix(params));
    return true;
};

/**
 * Grades one image of the worn (neglected) salon: the soft matrix first for upholstery, then the worn matrix (internal filters
 * run from the first added, which equals "soft, then worn"). Returns true when the worn filter was added; under the Canvas
 * renderer there are no filters, nothing is touched and the room draws a wash instead (change salon-style).
 * DESIGN-GAP (docs/design-gaps.md rows 169 and 170): the kit has no worn look.
 */
export function applyWornGrade(_scene: Scene, image: GameObjects.Image, soft: boolean): boolean {
    const { worn } = ROOM_LAYOUT;
    if (soft && !addGrade(image, worn.soft)) {
        return false;
    }
    return addGrade(image, worn.grade);
}
