import type { PlacementData } from '../core/placement';

// Placement table of docs/ZADANIA.md section 1: child age x month band -> proposed stage.
// Months are Date#getMonth() values (0 = January).
export const placementData = {
    ages: [6, 7, 8, 9, 10], // 10 stands for "10+"
    monthBands: {
        autumn: [8, 9, 10, 11, 0], // September-January
        spring: [1, 2, 3, 4, 5], //   February-June
        summer: [6, 7], //            July-August
    },
    table: {
        autumn: { 6: 'E1', 7: 'E1', 8: 'E3', 9: 'E5', 10: 'E6' },
        spring: { 6: 'E1', 7: 'E2', 8: 'E4', 9: 'E6', 10: 'E6' },
        summer: { 6: 'E1', 7: 'E2', 8: 'E4', 9: 'E6', 10: 'E6' }, // same as spring today, kept as in the document
    },
} satisfies PlacementData;
