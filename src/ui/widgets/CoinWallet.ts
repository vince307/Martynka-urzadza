import type { GameObjects, Scene } from 'phaser';
import { walletCoins, walletList } from '../../core/coins';
import { canSubmit, type TrayDragState } from '../../core/trayDrag';
import { interiorPoint, liftedSlot, walletFull, type CoinLayout, type Rect } from '../../core/round/dragLayout';
import { balance } from '../../data/balance';
import { ART_LIMITS, type MoneyId } from '../../data/measures';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ART_KEYS } from '../../data/taskArt';
import { UI_ART_KEYS } from '../../data/uiArt';
import { ActionButton } from './ActionButton';
import { ArtImage } from './ArtImage';
import { dashedRect } from './dashedRect';

type Point = { x: number; y: number };

export interface CoinWalletTargets {
    tray: Partial<Record<MoneyId, Point>>;
    wallet: Point | null;
    ok: Point | null;
    /** The coins lying in the wallet, in the order the wallet lists them (largest first). */
    coins: (Point & { id: MoneyId })[];
    /** Which wallet look is on screen: the pack picture or the drawn field (texture missing). */
    walletArt: 'art' | 'drawn';
    /** True while the wallet holds the most coins it takes (the tray is dimmed). */
    full: boolean;
}

/**
 * Tray of coins and the wallet of the `coins` branch of the `drag` answer mode: the child drags a coin from the tray into the
 * dashed wallet (or taps it), taps a placed coin to take it out, and "OK" hands in the grosze of every placed coin. The gesture
 * is core/trayDrag.ts; this widget draws the state the scene gives it and publishes interior points for the e2e hook.
 * The sum of the wallet is never drawn while the child pays: it would give the answer away (the solution lines state it).
 * The wallet is the pack picture (UI_ART_KEYS.wallet), the drawn dashed field when that texture is missing.
 * DESIGN-GAP (docs/design-gaps.md rows 104, 115): the kit has no tray, drop or full-wallet look; they are drawn in code around the kit's coins (a full wallet dims the tray).
 */
export class CoinWallet {
    private readonly frame: GameObjects.Graphics;
    private readonly walletImage: GameObjects.Image;
    private readonly placed: ArtImage[];
    private readonly trayImages: ArtImage[];
    private readonly carriedImage: ArtImage;
    private readonly ok: ActionButton;
    private layout: CoinLayout | null = null;
    private kinds: readonly MoneyId[] = [];
    private state: TrayDragState<MoneyId> | null = null;
    private visible = false;
    private active = false;
    private trayShown = true;

    constructor(
        scene: Scene,
        private readonly onSubmit: (grosze: number[]) => void,
    ) {
        this.frame = scene.add.graphics().setVisible(false);
        // Created before the coins so they draw above it; no setDepth, so the feedback bar (created later by the scene) draws above its lower edge.
        this.walletImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
        this.placed = Array.from({ length: balance.coinDrag.maxTotal }, () => new ArtImage(scene));
        this.trayImages = Array.from({ length: ART_LIMITS.trayKinds }, () => new ArtImage(scene));
        this.carriedImage = new ArtImage(scene);
        this.ok = new ActionButton(scene, () => {
            if (this.active && this.state && canSubmit(this.state)) {
                const grosze = walletCoins(this.state.mat);
                if (grosze.length > 0) this.onSubmit(grosze);
            }
        });
    }

    /** The rectangles for the kinds of the open task. */
    setLayout(layout: CoinLayout, kinds: readonly MoneyId[]): void {
        this.layout = layout;
        this.kinds = kinds;
    }

    /** `trayShown` false while the solution lines stand where the tray is. */
    render(state: TrayDragState<MoneyId>, active: boolean, trayShown: boolean): void {
        this.state = state;
        this.active = active;
        this.trayShown = trayShown;
        this.paint(state);
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        if (!visible) {
            this.frame.clear().setVisible(false);
            this.walletImage.setVisible(false);
            this.placed.forEach((image) => image.hide());
            this.trayImages.forEach((image) => image.hide());
            this.carriedImage.hide();
            this.ok.hide();
        }
    }

    /** Interior points (scene space) of the tray tiles, the wallet, "OK" and the placed coins, for the e2e hook. */
    targets(): CoinWalletTargets {
        const layout = this.layout;
        if (!this.visible || !layout || !this.state) {
            return { tray: {}, wallet: null, ok: null, coins: [], walletArt: 'drawn', full: false };
        }
        const tray: Partial<Record<MoneyId, Point>> = {};
        if (this.trayShown) {
            for (const kind of this.kinds) {
                const r = layout.tray[kind];
                if (r) tray[kind] = interiorPoint(r);
            }
        }
        const list = walletList(this.state.mat);
        const lifted = liftedSlot(layout, list, this.state.carrying);
        const coins = list.flatMap((id, i) => (i === lifted ? [] : [{ id, ...interiorPoint(layout.coin(i)) }]));
        return {
            tray, wallet: interiorPoint(layout.wallet), ok: this.ok.target(), coins,
            walletArt: this.walletArtLoaded() ? 'art' : 'drawn', full: walletFull(this.state.mat, balance.coinDrag.maxTotal),
        };
    }

    okTarget(): Point | null {
        return this.ok.target();
    }

    private walletArtLoaded(): boolean {
        return this.walletImage.scene.textures.exists(UI_ART_KEYS.wallet);
    }

    private paint(state: TrayDragState<MoneyId>): void {
        const layout = this.layout;
        const g = this.frame;
        g.clear();
        this.placed.forEach((image) => image.hide());
        this.trayImages.forEach((image) => image.hide());
        this.carriedImage.hide();
        if (!this.visible || !layout) {
            return;
        }
        g.setVisible(true);
        const { drag, coinPay } = TASK_LAYOUT;
        if (this.walletArtLoaded()) {
            const w = layout.wallet;
            this.walletImage.setTexture(UI_ART_KEYS.wallet).setPosition(w.x + w.width / 2, w.y + w.height / 2).setDisplaySize(w.width, w.height).setVisible(true);
        } else {
            this.walletImage.setVisible(false);
            g.fillStyle(PLACEHOLDER_COLORS.field, 1);
            g.fillRoundedRect(layout.wallet.x, layout.wallet.y, layout.wallet.width, layout.wallet.height, drag.radius);
            dashedRect(g, layout.wallet, PLACEHOLDER_COLORS.deepTeal);
        }
        const trayAlpha = walletFull(state.mat, balance.coinDrag.maxTotal) ? coinPay.fullTrayAlpha : 1;

        // Placed coins, one cell each; a coin lifted from the wallet is drawn under the finger instead.
        const list = walletList(state.mat);
        const lifted = liftedSlot(layout, list, state.carrying);
        let slot = 0;
        list.forEach((id, i) => {
            if (i === lifted) return;
            this.placed[slot++]?.show(ART_KEYS.money(id), inset(layout.coin(i), coinPay.coinInset));
        });

        if (this.trayShown) {
            this.kinds.forEach((kind, k) => {
                const r = layout.tray[kind];
                if (!r) return;
                g.fillStyle(PLACEHOLDER_COLORS.tile, trayAlpha);
                g.fillRoundedRect(r.x, r.y, r.width, r.height, drag.radius);
                g.lineStyle(TASK_LAYOUT.blocks.border, PLACEHOLDER_COLORS.tileBorder, trayAlpha);
                g.strokeRoundedRect(r.x, r.y, r.width, r.height, drag.radius);
                this.trayImages[k]?.show(ART_KEYS.money(kind), inset(r, coinPay.trayInset));
                this.trayImages[k]?.setAlpha(trayAlpha);
            });
        }

        // The coin under the finger, above everything.
        const c = state.carrying;
        if (c?.moved) {
            const half = coinPay.carriedSize / 2;
            this.carriedImage.show(ART_KEYS.money(c.kind), { x: c.x - half, y: c.y - half, width: coinPay.carriedSize, height: coinPay.carriedSize });
        }

        if (this.trayShown && this.visible) {
            this.ok.showCentered(pl.round.okKey, layout.ok.x + layout.ok.width / 2, layout.ok.y + layout.ok.height / 2, PLACEHOLDER_COLORS.next, PLACEHOLDER_COLORS.nextBorder);
        } else {
            this.ok.hide();
        }
    }
}

const inset = (r: Rect, by: number): Rect => ({ x: r.x + by, y: r.y + by, width: r.width - 2 * by, height: r.height - 2 * by });
