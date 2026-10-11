// Temporary entry point for milestone M0 phase 1: keeps Phaser in the bundle
// and verifies the ESM import of the upgraded version. Phase 2 replaces it
// with the real game bootstrap.
import { VERSION } from 'phaser';

console.log('Phaser', VERSION);
