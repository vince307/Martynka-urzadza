import { Scene, type GameObjects } from 'phaser';
import { balance } from '../data/balance';
import type { InputSuspender } from '../core/inputSuspend';
import type { LongPressEvent } from '../core/longPress';
import { ROOM_GESTURE_IDLE, roomGesture, type RoomGestureState } from '../core/roomGesture';
import { holdPoint, slotAt } from '../core/roomHit';
import { currentTask, emptyRoomState, taskButtonView } from '../core/rooms';
import type { RoomDef, RoomState } from '../core/types';
import { stepPanel, type PanelEvent, type PanelState } from '../core/variantPanel';
import { ANIMATION, PLACEHOLDER_COLORS, ROOM_LAYOUT, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { pl, roomText } from '../data/pl';
import { FIRST_ROOM, ROOMS, SALON_PLACEHOLDERS } from '../data/rooms';
import { prefersReducedMotion } from '../ui/motion';
import { PageButton } from '../ui/widgets/PageButton';
import { RoomTaskButton } from '../ui/widgets/RoomTaskButton';
import { drawLook, RoomView } from '../ui/widgets/RoomView';
import { drawStar } from '../ui/widgets/StarCounter';
import { VariantPanel } from '../ui/widgets/VariantPanel';

const PURCHASE_STAR_TEXTURE = 'purchase-star';

export interface RoomSnapshot {
    roomId: string;
    tasksDone: number;
    chosen: Readonly<Record<string, number>>;
    currentTask: { id: string; label: string; cost: number } | null;
    affordable: boolean;
    buttonText: string;
    panel: PanelState;
    hold: 'idle' | 'holding';
    heldSlot: string | null;
}

/**
 * The room (S-09): the salon drawn in code, "Wróć do notesu" and the button of the current renovation task.
 * It owns only the variant panel's state: the star balance and the room progress live in the game registry, the scene only draws them
 * and redraws on wake. The task scene sleeps underneath and wakes exactly as it was left.
 * A task the child cannot afford yet sends them back to the notebook; an affordable one opens the variant panel, and only "Wybieram" there spends stars (core/variantPanel).
 * DESIGN-GAP (docs/design-gaps.md row 12): the kit has the return button only.
 */
export class RoomScene extends Scene {
    private resume: PageButton | undefined;
    private view!: RoomView;
    private taskButton!: RoomTaskButton;
    private variantPanel!: VariantPanel;
    private panel: PanelState = { kind: 'closed' };
    private gesture: RoomGestureState = ROOM_GESTURE_IDLE;
    private holdZone!: GameObjects.Zone;

    constructor() {
        super(SCENE_KEYS.room);
    }

    create(): void {
        this.view = new RoomView(this);
        this.gesture = ROOM_GESTURE_IDLE;
        // Under every button (created later, so drawn and hit first): a hold on a furnished slot opens its change panel (S-10).
        const { area } = ROOM_LAYOUT;
        this.holdZone = this.add.zone(area.left + area.width / 2, area.top + area.height / 2, area.width, area.height).setInteractive();
        this.holdZone.on('pointerdown', (p: { id: number; x: number; y: number }) => this.feed({ type: 'down', id: p.id, x: p.x, y: p.y, now: this.time.now }));
        this.holdZone.on('pointerup', (p: { id: number; wasCanceled?: boolean }) => this.feed(p.wasCanceled ? { type: 'cancel' } : { type: 'up', id: p.id }));
        this.holdZone.on('pointerout', () => this.feed({ type: 'cancel' }));
        this.input.on('pointermove', (p: { id: number; x: number; y: number }) => this.feed({ type: 'move', id: p.id, x: p.x, y: p.y }));
        this.taskButton = new RoomTaskButton(this, (affordable) => {
            if (!affordable) {
                this.scene.switch(SCENE_KEYS.task);
                return;
            }
            this.dispatch({ type: 'open' });
        });
        this.variantPanel = new VariantPanel(
            this,
            (variant) => this.dispatch({ type: 'pick', variant }),
            () => this.dispatch({ type: 'confirm' }),
            () => this.dispatch({ type: 'close' }),
        );
        const button = new PageButton(this, () => this.scene.switch(SCENE_KEYS.task));
        this.resume = button;
        const refresh = (): void => {
            this.panel = { kind: 'closed' };
            this.resetGesture();
            this.redraw();
        };
        const onStars = (): void => {
            // The balance can change while the task scene is awake; only the open room reacts.
            if (this.scene.isActive()) {
                this.redraw();
            }
        };
        refresh();
        const onSleep = (): void => {
            // The panel never outlives the visit: the way out is hidden while it is open, but a settings dialog could cover it.
            this.panel = { kind: 'closed' };
            this.resetGesture();
        };
        this.events.on('wake', refresh);
        this.events.on('sleep', onSleep);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        this.events.once('shutdown', () => {
            this.events.off('wake', refresh);
            this.events.off('sleep', onSleep);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        });
    }

    update(): void {
        if (this.gesture.press.kind === 'idle') {
            return;
        }
        const suspender = this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
        // A dialog over the canvas swallows the lift of the finger: the hold must not survive it.
        this.feed(suspender?.suspended() ? { type: 'cancel' } : { type: 'tick', now: this.time.now });
    }

    /** The gesture reducer decides when a hold opens the panel; the scene only supplies the slot under the finger and runs the result. */
    private feed(event: LongPressEvent): void {
        if (this.panel.kind === 'open') {
            return;
        }
        const room = this.room();
        const slot = event.type === 'down' ? slotAt(room, SALON_PLACEHOLDERS, this.roomState().chosen, { x: event.x, y: event.y }) : null;
        const result = roomGesture(this.gesture, event, { mode: 'normal', slot, rules: balance.roomHold });
        this.gesture = result.state;
        this.view.highlight(result.held);
        if (result.open !== null) {
            this.resetGesture();
            this.dispatch({ type: 'change', slot: result.open });
        }
    }

    private resetGesture(): void {
        this.gesture = ROOM_GESTURE_IDLE;
        this.view.highlight(null);
    }

    private roomId(): string {
        return (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
    }

    private roomState(): RoomState {
        const rooms = this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined;
        return rooms?.[this.roomId()] ?? emptyRoomState();
    }

    private stars(): number {
        return (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
    }

    private room(): RoomDef {
        return ROOMS[this.roomId()] ?? ROOMS[FIRST_ROOM];
    }

    /** One tap = one reducer step. The registry is written only when the reducer says something was bought. */
    private dispatch(event: PanelEvent): void {
        const room = this.room();
        const step = stepPanel(this.panel, event, { room, state: this.roomState(), stars: this.stars() });
        this.panel = step.panel;
        if (this.panel.kind === 'open') {
            this.resetGesture();
        }
        if (step.changed) {
            // A change is free: only the room is written, never the balance (core/variantPanel returns the same stars).
            const rooms = (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
            this.registry.set(REGISTRY_KEYS.rooms, { ...rooms, [room.id]: step.state });
        }
        if (step.bought) {
            const rooms = (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
            this.registry.set(REGISTRY_KEYS.rooms, { ...rooms, [room.id]: step.state });
            this.registry.set(REGISTRY_KEYS.stars, step.stars);
        }
        this.redraw();
        const celebrated = step.bought ?? step.changed;
        if (celebrated) {
            this.celebrate(celebrated);
        }
    }

    private redraw(): void {
        const room = this.room();
        const state = this.roomState();
        const task = currentTask(room, state);
        const open = this.panel.kind === 'open';
        const panelSlot = this.panel.kind === 'open' ? (this.panel.mode === 'change' ? this.panel.slot : task?.slot) : undefined;
        const preview = this.panel.kind === 'open' && this.panel.preview !== null && panelSlot ? { slot: panelSlot, variant: this.panel.preview } : null;
        if (this.holdZone.input) {
            this.holdZone.input.enabled = !open;
        }
        this.view.render(room, state, preview);
        const taskView = taskButtonView(room, state, this.stars());
        this.taskButton.show(open ? null : taskView);
        const { resume } = ROOM_LAYOUT;
        if (open) {
            this.resumeButton().hide();
            const placeholder = panelSlot ? SALON_PLACEHOLDERS[panelSlot] : undefined;
            if (placeholder) {
                this.variantPanel.show(placeholder.variants, placeholder, this.panel.kind === 'open' ? this.panel.preview : null);
            }
        } else {
            this.variantPanel.hide();
            // A press that began before the switch must not count, so the button is re-armed on every redraw.
            this.resumeButton().show(pl.room.resume, resume.left, resume.top, 'primary', false, resume);
        }
        // The speaker reads what the button asks for; the task scene overwrites it on its wake.
        const label = taskView ? roomText.task(taskView.label) : undefined;
        this.registry.set(REGISTRY_KEYS.narration, label ?? null);
    }

    private resumeButton(): PageButton {
        return this.resume as PageButton;
    }

    /** Pop of the new furniture and a burst of stars; nothing at all when the child asked for less motion. */
    private celebrate(bought: { slot: string; variant: 0 | 1 | 2 }): void {
        // DESIGN-GAP (docs/design-gaps.md): the purchase has no sound yet; the hook for it is here.
        this.playPurchaseSound();
        if (prefersReducedMotion()) {
            return;
        }
        const room = this.room();
        const at = this.view.slotCenter(room, bought.slot);
        const size = SALON_PLACEHOLDERS[bought.slot];
        if (!at || !size) {
            return;
        }
        const pop = this.add.graphics({ x: at.x, y: at.y });
        drawLook(pop, { left: -size.width / 2, top: -size.height / 2, width: size.width, height: size.height }, size.variants[bought.variant]);
        this.tweens.add({
            targets: pop,
            scale: ANIMATION.purchasePopScale,
            duration: ANIMATION.purchasePopMs,
            yoyo: true,
            ease: 'Sine.easeOut',
            onComplete: () => pop.destroy(),
        });
        if (!this.textures.exists(PURCHASE_STAR_TEXTURE)) {
            const g = this.make.graphics({}, false);
            drawStar(g, 24, 24, 22, PLACEHOLDER_COLORS.butter, { color: PLACEHOLDER_COLORS.nextBorder, width: 3 });
            g.generateTexture(PURCHASE_STAR_TEXTURE, 48, 48);
            g.destroy();
        }
        const emitter = this.add.particles(at.x, at.y, PURCHASE_STAR_TEXTURE, {
            speed: { min: 180, max: 420 },
            angle: { min: 0, max: 360 },
            lifespan: ANIMATION.purchaseParticleMs,
            scale: { start: 0.9, end: 0 },
            emitting: false,
        });
        emitter.explode(ANIMATION.purchaseParticles);
        this.time.delayedCall(ANIMATION.purchaseParticleMs + 100, () => emitter.destroy());
    }

    private playPurchaseSound(): void {
        // No sound file exists yet (S-16 brings it); intentionally empty.
    }

    /** Centre of "Wróć do notesu" in scene space, for the e2e hook. */
    resumeTarget(): { x: number; y: number } | null {
        return this.resume ? this.resume.target() : null;
    }

    /** Centre of the current task button, for the e2e hook; null while hidden. */
    taskButtonTarget(): { x: number; y: number } | null {
        return this.taskButton.target();
    }

    /** Centres of the three variant thumbnails, or none while the panel is closed; for the e2e hook. */
    thumbTargets(): { x: number; y: number }[] {
        return this.variantPanel.thumbTargets();
    }

    chooseTarget(): { x: number; y: number } | null {
        return this.variantPanel.chooseTarget();
    }

    closeTarget(): { x: number; y: number } | null {
        return this.variantPanel.closeTarget();
    }

    /** A point where a hold lands on each furnished slot, for the e2e hook. */
    slotTargets(): Record<string, { x: number; y: number }> {
        const out: Record<string, { x: number; y: number }> = {};
        const room = this.room();
        const { chosen } = this.roomState();
        for (const slot of room.slots) {
            const at = holdPoint(room, SALON_PLACEHOLDERS, chosen, slot.id);
            if (at) {
                out[slot.id] = at;
            }
        }
        return out;
    }

    /** Read-only copy of what the room shows, for the e2e hook. */
    snapshot(): RoomSnapshot {
        const room = this.room();
        const state = this.roomState();
        const task = currentTask(room, state);
        const view = taskButtonView(room, state, this.stars());
        return {
            roomId: room.id,
            tasksDone: state.tasksDone,
            chosen: { ...state.chosen },
            currentTask: task ? { id: task.id, label: task.label, cost: task.cost } : null,
            affordable: view?.affordable ?? false,
            buttonText: this.taskButton.text(),
            panel: { ...this.panel },
            hold: this.gesture.press.kind === 'idle' ? 'idle' : 'holding',
            heldSlot: this.gesture.slot,
        };
    }
}
