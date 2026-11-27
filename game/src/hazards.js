// GOBBLE RUN — the seven hazards: what the turkey must not touch.
// One job: hazard definitions, spawning, motion, hitboxes.
// Hazards spawn off the right edge on the zone's table, scroll left at the
// world speed, and leave the left edge. Knives fall from the sky with a
// warning marker; pumpkins roll; the oven trundles in on little wheels.

import { HAZARDS, GROUND_Y, CANVAS_W } from './config.js';
import { weightedPick, range } from './random.js';

// A hazard is a plain record: kind, x, y (top), w, h, and motion extras.
export function spawnHazard(rng, kind, x) {
  const def = HAZARDS[kind];
  const h = {
    kind,
    x,
    y: GROUND_Y - def.h,
    w: def.w,
    h: def.h,
    passed: false, // counted as a clean dodge once it slides past the bird
    fallSpeed: 0, // knives only: px per second once they drop
    falling: false, // knives only: the drop has started
    hoverTimer: 0, // knives only: seconds of warning before the drop
    stuck: false, // knives only: buried in the dirt, jump it like a fence
    rollPhase: rng() * Math.PI * 2, // pumpkins only: rolling spin
    warned: false, // knives only: the warning marker has shown
  };
  if (kind === 'knife') {
    h.y = -140; // starts above the sky, hangs, drops, sticks in the dirt
    h.hoverTimer = 0.9;
    h.fallSpeed = 0;
  }
  if (kind === 'puddle') {
    h.y = GROUND_Y - def.h;
  }
  return h;
}

// The next hazard for this zone, picked by weight, spawned just off screen.
// distanceM is the run so far in metres: gaps tighten as the run goes on.
export function nextHazard(rng, zone, distanceM) {
  const table = zone.hazards.map((k) => ({ kind: k, weight: HAZARDS[k].weight }));
  const pick = weightedPick(rng, table);
  const gapTighten = Math.min(120, distanceM * 0.06);
  const x = CANVAS_W + 60 + range(rng, 0, 260 - gapTighten);
  return spawnHazard(rng, pick.kind, x);
}

// One fixed step for every live hazard. worldSpeed is px per second; the
// knife hangs over its ground spot with a warning, then drops and sticks
// in the dirt, where the bird jumps it like a fence.
export function hazardsStep(list, dt, worldSpeed, turkeyX, slowmo) {
  for (const h of list) {
    h.x -= worldSpeed * dt;
    if (h.kind === 'pumpkin') h.rollPhase += dt * 7;
    if (h.kind === 'knife' && !h.stuck) {
      if (!h.falling) {
        // Hang above the run with a warning marker, then drop.
        h.warned = true;
        h.hoverTimer -= dt;
        if (h.hoverTimer <= 0) h.falling = true;
      } else {
        h.y += h.fallSpeed * dt * (slowmo ? 0.45 : 1);
        h.fallSpeed += 2400 * dt;
        if (h.y >= GROUND_Y - h.h) {
          h.y = GROUND_Y - h.h;
          h.stuck = true;
          h.falling = false;
        }
      }
    }
  }
  // Drop hazards far off the left edge, and knives buried in the dirt.
  return list.filter((h) => h.x + h.w > -80 && h.y < GROUND_Y + 40);
}

// The collision box of a hazard. Most use their full rect, but the
// pitchfork only threatens the tines at the top: a sliding turkey ducks
// under them, a standing one does not.
export function hazardHitbox(h) {
  if (h.kind === 'pitchfork') {
    return { x: h.x, y: h.y, w: h.w, h: 40 };
  }
  return { x: h.x, y: h.y, w: h.w, h: h.h };
}

// AABB overlap between a hazard and a box {x, y, w, h}.
export function hazardHits(h, box) {
  const hb = hazardHitbox(h);
  return hb.x < box.x + box.w && hb.x + hb.w > box.x && hb.y < box.y + box.h && hb.y + hb.h > box.y;
}

// The knife's warning marker: where it will land, drawn on the ground
// while it hangs overhead. Once it drops or sticks, the blade is the warning.
export function knifeWarning(h) {
  if (h.kind !== 'knife' || h.falling || h.stuck) return null;
  return { x: h.x - 8, y: GROUND_Y - 6, w: 50, h: 6 };
}
