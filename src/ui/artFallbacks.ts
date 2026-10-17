import type { Scene } from 'phaser';
import { noteFallback, type FallbackRecord, type FallbackWhere } from '../core/artPick';
import { REGISTRY_KEYS } from '../data/layout';

/** The one place a widget records that it shows a drawn fallback instead of a screen picture (runtime only, never saved). */
export function recordFallback(scene: Scene, where: FallbackWhere, mode: string): void {
    const current = (scene.registry.get(REGISTRY_KEYS.artFallbacks) as FallbackRecord | undefined) ?? {};
    const next = noteFallback(current, where, mode);
    if (next !== current) scene.registry.set(REGISTRY_KEYS.artFallbacks, next);
}
