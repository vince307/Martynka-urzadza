import type { GameObjects, Scene } from 'phaser';
import { type ClockSetState, clockValue } from '../../core/clockSet';
import { clockHandAngles, clockSetLayout, type ClockSetLayout } from '../../core/round/pictureLayout';
import { balance } from '../../data/balance';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';
import { ClockFace } from './ClockFace';

type Point = { x: number; y: number };

export interface ClockSetTargets {
    centre: Point;
    /** Null while the hand cannot be held (the minute hand of a full-hour clock). */
    hourTip: Point;
    minuteTip: Point | null;
    ok: Point | null;
    radius: number;
}

/**
 * The dial of a clock to set (S-13b): the drawn clock face plus a ring on each hand tip the child can hold, and "OK".
 * The gesture is core/clockSet.ts; this widget only draws the state the scene gives it and publishes the interior
 * points the e2e hook aims at. A held hand is shown by a larger, brighter ring. DESIGN-GAP (docs/design-gaps.md row 77):
 * the kit has no handles on the hands; they are drawn in code.
 */
export class ClockSet {
    private readonly face: ClockFace;
    private readonly handles: GameObjects.Graphics;
    private readonly ok: ActionButton;
    private readonly layout: ClockSetLayout = clockSetLayout(TASK_LAYOUT.drag, TASK_LAYOUT.clockSet.dial);
    private state: ClockSetState | null = null;
    private snap: 60 | 5 = 60;
    private active = false;
    private visible = false;

    constructor(
        scene: Scene,
        private readonly onSubmit: (value: string) => void,
    ) {
        this.face = new ClockFace(scene);
        this.handles = scene.add.graphics().setVisible(false);
        this.ok = new ActionButton(scene, () => {
            if (this.active && this.state) {
                this.onSubmit(clockValue(this.state));
            }
        });
    }

    /** Draws the dial with the hands of `state`; `okShown` false while the solution steps stand in the tray's place. */
    render(state: ClockSetState, snap: 60 | 5, active: boolean, okShown: boolean): void {
        this.state = state;
        this.snap = snap;
        this.active = active;
        this.visible = true;
        const { mat, ok } = TASK_LAYOUT.drag;
        this.face.render(state.hour, state.minute, mat);
        const g = this.handles;
        g.clear().setVisible(true);
        if (active) {
            this.tips().forEach(({ hand, at }) => {
                const held = state.carrying === hand;
                const radius = balance.clockSet.grabRadius * (held ? TASK_LAYOUT.clockSet.heldGrow : 1);
                g.fillStyle(held ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.ivory, held ? 0.95 : 0.8);
                g.fillCircle(at.x, at.y, radius);
                g.lineStyle(TASK_LAYOUT.clockSet.handleBorder, held ? PLACEHOLDER_COLORS.deepTeal : PLACEHOLDER_COLORS.turquoise, 1);
                g.strokeCircle(at.x, at.y, radius);
            });
        }
        if (okShown) {
            this.ok.showCentered(pl.round.okKey, ok.x + ok.width / 2, ok.y + ok.height / 2, PLACEHOLDER_COLORS.next, PLACEHOLDER_COLORS.nextBorder);
        } else {
            this.ok.hide();
        }
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        if (!visible) {
            this.face.setVisible(false);
            this.handles.clear().setVisible(false);
            this.ok.hide();
        }
    }

    /** Interior points (scene space) of the hand tips, "OK" and the centre, for the e2e hook; null while hidden. */
    targets(): ClockSetTargets | null {
        if (!this.visible || !this.state) return null;
        const tips = this.tips();
        const find = (hand: 'hour' | 'minute'): Point | null => tips.find((t) => t.hand === hand)?.at ?? null;
        const state = this.state;
        const hour = this.tipOf('hour', state);
        return { centre: this.layout.centre, hourTip: find('hour') ?? hour, minuteTip: find('minute'), ok: this.ok.target(), radius: balance.clockSet.grabRadius };
    }

    private tipOf(hand: 'hour' | 'minute', state: ClockSetState): Point {
        const angles = clockHandAngles(state.hour, state.minute);
        const a = (angles[hand] * Math.PI) / 180;
        const length = hand === 'hour' ? this.layout.hourLength : this.layout.minuteLength;
        return { x: this.layout.centre.x + Math.sin(a) * length, y: this.layout.centre.y - Math.cos(a) * length };
    }

    /** The holdable tips: the minute hand of a full-hour clock stays at 12 and has no handle. */
    private tips(): { hand: 'hour' | 'minute'; at: Point }[] {
        const state = this.state;
        if (!state) return [];
        const hands: ('hour' | 'minute')[] = this.snap === 60 ? ['hour'] : ['hour', 'minute'];
        return hands.map((hand) => ({ hand, at: this.tipOf(hand, state) }));
    }
}
