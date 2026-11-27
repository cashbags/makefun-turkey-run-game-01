// GOBBLE RUN — the turkey: the bird you are.
// One job: the player's body. Jump, slide, dash, stumble, shield, hearts.
// The turkey never moves on screen; the world scrolls under it. All physics
// here is vertical (jump / fall / slide) plus timers for its power-ups.

import {
  GROUND_Y,
  GRAVITY,
  JUMP_VELOCITY,
  SLIDE_TIME,
  DASH_TIME,
  SLOWMO_TIME,
  INVULN_TIME,
  TURKEY_X,
} from './config.js';

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: GROUND_Y, // feet on the dirt; y is the feet line
    vy: 0, // vertical speed, px per second
    grounded: true,
    sliding: false,
    slideTimer: 0,
    dashTimer: 0,
    slowmoTimer: 0,
    shield: false, // a corn cob waits to eat one hit
    invulnTimer: 0, // mercy window after a hit
    stumbleTimer: 0, // the wobble after a hit: the farmer gains ground
    hearts: 3,
    runPhase: 0, // leg-cycle clock, drives the running bob
    gobbleTimer: 0, // idle gobble on the title screen
  };
}

// A jump only works from the ground, and not mid-slide.
export function turkeyJump(t) {
  if (!t.grounded || t.sliding) return false;
  t.vy = JUMP_VELOCITY;
  t.grounded = false;
  return true;
}

// A slide only works on the ground. It ducks the bird under pitchforks.
export function turkeySlide(t) {
  if (!t.grounded || t.sliding) return false;
  t.sliding = true;
  t.slideTimer = SLIDE_TIME;
  return true;
}

// The body box the hazards test against. Sliding halves the height;
// jumping lifts the whole box off the ground. The box is narrower than
// the drawn bird: a wingtip brushing a fence is not a hit.
export function turkeyHitbox(t) {
  const h = t.sliding ? 44 : 78;
  const w = 52;
  return { x: t.x - w / 2, y: t.y - h, w, h };
}

// One fixed step of the bird. dt is real seconds; speedScale lets a pie
// slice slow the world without slowing the bird's own clock.
export function turkeyStep(t, dt, worldSpeed) {
  t.runPhase += dt * (worldSpeed / 28);
  if (t.invulnTimer > 0) t.invulnTimer -= dt;
  if (t.stumbleTimer > 0) t.stumbleTimer -= dt;
  if (t.dashTimer > 0) t.dashTimer -= dt;
  if (t.slowmoTimer > 0) t.slowmoTimer -= dt;
  if (t.slideTimer > 0) {
    t.slideTimer -= dt;
    if (t.slideTimer <= 0) t.sliding = false;
  }
  if (!t.grounded) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.grounded = true;
    }
  }
}

// A hit lands. A shield eats it; otherwise a heart goes and the bird
// stumbles, which is what lets the farmer close in. Returns 'shield',
// 'hit', or 'none' while the mercy window is up.
export function turkeyTakeHit(t) {
  if (t.invulnTimer > 0) return 'none';
  if (t.shield) {
    t.shield = false;
    t.invulnTimer = INVULN_TIME;
    return 'shield';
  }
  t.hearts -= 1;
  t.invulnTimer = INVULN_TIME;
  t.stumbleTimer = 0.6;
  return 'hit';
}

// A power-up lands. Corn arms the shield, a feather fires a dash, a golden
// egg mends a heart, a pie slice slows the world. Returns what happened.
export function turkeyPowerUp(t, kind) {
  if (kind === 'corn') {
    t.shield = true;
    return 'shield-up';
  }
  if (kind === 'feather') {
    t.dashTimer = DASH_TIME;
    return 'dash';
  }
  if (kind === 'egg') {
    if (t.hearts < 3) t.hearts += 1;
    return 'heart';
  }
  if (kind === 'pie') {
    t.slowmoTimer = SLOWMO_TIME;
    return 'slowmo';
  }
  return 'none';
}

// How fast the bird is really running, for the world scroll: a dash nearly
// doubles the ground speed, a stumble costs a quarter of it, and the pie
// slice does not touch it.
export function turkeySpeedFactor(t) {
  if (t.dashTimer > 0) return 1.9;
  if (t.stumbleTimer > 0) return 0.75;
  return 1;
}

// The world itself runs slower while a pie slice lasts — hazards included.
export function turkeySlowmoFactor(t) {
  return t.slowmoTimer > 0 ? 0.45 : 1;
}
