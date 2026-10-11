import { AUTO, Game, Scale } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PAGE_BACKGROUND } from './data/layout';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { BootScene } from './scenes/BootScene';

// Single place for the Phaser game config. Scene size and colours come from
// src/data; scenes are listed in boot order.
const createGame = (parent: string): Game =>
    new Game({
        type: AUTO,
        parent,
        backgroundColor: PAGE_BACKGROUND,
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
        },
        scene: [BootScene],
    });

// Module scripts run after the document is parsed, so the container exists.
createGame('game-container');
registerServiceWorker();
