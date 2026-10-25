import type { GameObjects, Scene } from 'phaser';
import { recordFallback } from './artFallbacks';
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
 * When the result is false the ungraded look is recorded once per call as `artFallbacks.worn = 'ungraded'` (shown by the "Obrazki"
 * line in `pl.settings`, DESIGN-GAP 173); this is the one place that records it, so every caller is covered.
 */
export function applyWornGrade(scene: Scene, image: GameObjects.Image, soft: boolean): boolean {
    const { worn } = ROOM_LAYOUT;
    if (soft && !addGrade(image, worn.soft)) {
        recordFallback(scene, 'worn', 'ungraded');
        return false;
    }
    if (!addGrade(image, worn.grade)) {
        recordFallback(scene, 'worn', 'ungraded');
        return false;
    }
    return true;
}
