// ============================================================
//  sprites.js
//  Loads Anna's PNGs from assets/anna/
//  Each sprite is optional — falls back to canvas drawing
//  if the file isn't there yet.
// ============================================================

const SPRITE_PATH = 'assets/anna/';
const SPRITE_KEYS = ['idle', 'walk_1', 'walk_2', 'walk_3', 'carry', 'coffee', 'writing', 'thinking'];

const SPRITES = {};
let bgImage = null;
let spritesReady = false;

function loadSprites() {
  // Total assets to attempt: sprites + 1 background
  let pending = SPRITE_KEYS.length + 1;

  const onDone = () => {
    pending--;
    if (pending <= 0) spritesReady = true;
  };

  // Background image (optional)
  const bg = new Image();
  bg.onload  = () => { bgImage = bg; onDone(); };
  bg.onerror = () => { bgImage = null; onDone(); };
  bg.src = 'assets/background.png';

  // Anna sprites (all optional)
  for (const key of SPRITE_KEYS) {
    const img = new Image();
    img.onload  = () => { SPRITES[key] = img; onDone(); };
    img.onerror = () => { SPRITES[key] = null; onDone(); };
    img.src = SPRITE_PATH + 'anna_' + key + '.png';
  }
}

// Returns the correct sprite Image for Anna's current state,
// or null if that sprite hasn't been added yet (triggers fallback).
function currentSprite() {
  if (G.player.carrying)     return SPRITES['carry']   || null;
  if (G.player.makingCoffee) return SPRITES['coffee']  || null;
  if (!G.player.moving)      return SPRITES['idle']    || null;

  // Alternate walk frames at ~7fps
  const frame = Math.floor(Date.now() / 140) % 2;
  return (frame === 0 ? SPRITES['walk_1'] : SPRITES['walk_2']) || null;
}
