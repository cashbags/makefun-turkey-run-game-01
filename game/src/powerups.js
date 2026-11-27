// GOBBLE RUN — the four power-ups: why the bird risks the low road.
// One job: power-up definitions, spawning, collection.
// Corn arms a shield, a feather fires a dash, a golden egg mends a heart,
// a pumpkin pie slows the whole world. Each floats at jump height or on
// the ground, so grabbing one is a small choice about where to be.

import { POWERUPS, GROUND_Y, CANVAS_W } from './config.js';
import { range } from './random.js';

export function spawnPowerUp(rng, kind, x) {
  const def = POWERUPS[kind];
  const low = kind === 'corn' || kind === 'pie';
  return {
    kind,
    x,
    y: low ? GROUND_Y - 40 : GROUND_Y - 150, // low ones sit on the dirt, high ones need a hop
    w: def.w,
    h: def.h,
    bobPhase: rng() * Math.PI * 2,
    taken: false,
  };
}

// The next power-up for this zone, spawned off the right edge.
export function nextPowerUp(rng, zone) {
  const kinds = zone.powerups;
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const x = CANVAS_W + 80 + range(rng, 0, 320);
  return spawnPowerUp(rng, kind, x);
}

// One fixed step: scroll left, bob gently, drop the taken ones.
export function powerupsStep(list, dt, worldSpeed, time) {
  for (const p of list) {
    p.x -= worldSpeed * dt;
    p.bobPhase += dt * 3;
  }
  return list.filter((p) => p.x + p.w > -60 && !p.taken);
}

// True when the turkey's box touches the power-up's box.
export function powerupHits(p, box) {
  return p.x < box.x + box.w && p.x + p.w > box.x && p.y < box.y + box.h && p.y + p.h > box.y;
}

// The bob offset for the draw, so the pickups float instead of sitting dead.
export function powerupBob(p) {
  return Math.sin(p.bobPhase) * 5;
}
