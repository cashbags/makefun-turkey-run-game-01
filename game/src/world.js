// GOBBLE RUN — the world: the whole game in one state machine.
// One job: run the escape. Title, play, caught, escaped — and everything
// between: distance, score, hearts, corn, combos, spawning, collisions,
// the farmer's moods, and the two endings. No drawing here; render.js does
// that. No input here; input.js calls the verbs below.

import {
  GROUND_Y,
  CANVAS_W,
  ESCAPE_DISTANCE,
  SCORE_PER_METRE,
  SCORE_PER_KERNEL,
  SCORE_PER_CLEAN_DODGE,
} from './config.js';
import { mulberry32 } from './random.js';
import { createTurkey, turkeyJump, turkeySlide, turkeyStep, turkeyTakeHit, turkeyPowerUp, turkeySpeedFactor, turkeySlowmoFactor, turkeyHitbox } from './turkey.js';
import { createFarmer, farmerStep, farmerCaught, farmerShoveBack } from './farmer.js';
import { nextHazard, hazardsStep, hazardHits } from './hazards.js';
import { nextPowerUp, powerupsStep, powerupHits } from './powerups.js';
import { zoneAt, zoneSpeed, hasEscaped } from './zones.js';

// Screens the game can be on.
export const SCREENS = { TITLE: 'title', PLAY: 'play', CAUGHT: 'caught', ESCAPED: 'escaped' };

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: SCREENS.TITLE,
    turkey: createTurkey(),
    farmer: createFarmer(),
    hazards: [],
    powerups: [],
    kernels: [], // loose corn kernels to collect: +25 each
    distanceM: 0,
    score: 0,
    combo: 0, // consecutive clean dodges; a hit resets it
    bestCombo: 0,
    kernelsCollected: 0,
    dodges: 0,
    powerupsTaken: 0,
    time: 0, // seconds of play in this run
    cleanSeconds: 0, // seconds since the last hit
    spawnTimer: 1.2, // seconds until the next hazard spawns
    powerTimer: 4.5, // seconds until the next power-up spawns
    kernelTimer: 2.0, // seconds until the next kernel line spawns
    zoneAnnounce: '', // the zone blurb shown when a zone begins
    zoneAnnounceTimer: 0,
    lastZoneId: 'barnyard',
    ending: null, // 'caught' | 'escaped' once the run ends
    finalScore: 0,
    cause: '', // one line for the end screen: what caught the bird
    paused: false,
    muted: false,
    events: [], // sound cues this step produced: 'jump' | 'hit' | 'power' | 'caught' | 'escaped' | 'gobble'
  };
}

// Start a fresh run from the title screen.
export function startRun(w) {
  const seed = w.seed;
  const fresh = createWorld(seed);
  fresh.screen = SCREENS.PLAY;
  fresh.muted = w.muted;
  return fresh;
}

// Back to the title screen after an ending.
export function backToTitle(w) {
  const fresh = createWorld(w.seed);
  fresh.muted = w.muted;
  return fresh;
}

// Player verbs, called from input.js. They only act while playing.
export function worldJump(w) {
  if (w.screen !== SCREENS.PLAY || w.paused) return;
  if (turkeyJump(w.turkey)) w.events.push('jump');
}

export function worldSlide(w) {
  if (w.screen !== SCREENS.PLAY || w.paused) return;
  if (turkeySlide(w.turkey)) w.events.push('slide');
}

export function worldTogglePause(w) {
  if (w.screen !== SCREENS.PLAY) return;
  w.paused = !w.paused;
}

export function worldToggleMute(w) {
  w.muted = !w.muted;
}

// One fixed step (dt = 1/60). Everything deterministic: the rng stream is
// the only source of chance, and it is seeded at the run's start.
export function worldStep(w, dt) {
  if (w.screen !== SCREENS.PLAY || w.paused) return;
  const t = w.turkey;
  const f = w.farmer;
  w.time += dt;
  w.cleanSeconds += dt;

  const speed = zoneSpeed(w.distanceM) * turkeySpeedFactor(t);
  const slowmo = turkeySlowmoFactor(t);
  const worldSpeed = speed * slowmo;

  turkeyStep(t, dt, worldSpeed);

  // The farmer hunts: a stumble flips him to chase, clean running calms him.
  const wantSnare = w.distanceM > 120;
  const farmerEvent = farmerStep(f, dt, t.stumbleTimer > 0, w.cleanSeconds, wantSnare, zoneSpeed(w.distanceM), turkeySpeedFactor(t));
  if (farmerEvent === 'snare') {
    w.hazards.push({ kind: 'snare', x: CANVAS_W + 120, y: GROUND_Y - 26, w: 44, h: 26, passed: false, fallSpeed: 0, falling: false, hoverTimer: 0, stuck: false, rollPhase: 0, warned: false });
    f.snarePlanted = true;
  }

  // Spawning: hazards, power-ups, kernel lines, each on its own timer.
  w.spawnTimer -= dt;
  if (w.spawnTimer <= 0) {
    const zone = zoneAt(w.distanceM);
    const h = nextHazard(w.rng, zone, w.distanceM);
    // Keep hazards jumpable: never spawn one closer than ~1.15 seconds of
    // running behind the rightmost live hazard, whatever the jitter rolled.
    const rightmost = w.hazards.reduce((m, x) => Math.max(m, x.x + x.w), 0);
    h.x = Math.max(h.x, rightmost + worldSpeed * 1.15);
    w.hazards.push(h);
    w.spawnTimer = 1.15 + w.rng() * 0.75;
  }
  w.powerTimer -= dt;
  if (w.powerTimer <= 0) {
    const zone = zoneAt(w.distanceM);
    w.powerups.push(nextPowerUp(w.rng, zone));
    w.powerTimer = 5 + w.rng() * 4;
  }
  w.kernelTimer -= dt;
  if (w.kernelTimer <= 0) {
    const n = 3 + Math.floor(w.rng() * 3);
    const high = w.rng() < 0.5;
    for (let i = 0; i < n; i++) {
      w.kernels.push({ x: CANVAS_W + 80 + i * 46, y: high ? GROUND_Y - 150 : GROUND_Y - 42, taken: false });
    }
    w.kernelTimer = 3.5 + w.rng() * 3;
  }

  // Move the world: hazards, power-ups, kernels all scroll left.
  w.hazards = hazardsStep(w.hazards, dt, worldSpeed, t.x, slowmo);
  w.powerups = powerupsStep(w.powerups, dt, worldSpeed, w.time);
  w.kernels = w.kernels.filter((k) => {
    k.x -= worldSpeed * dt;
    return k.x > -40 && !k.taken;
  });

  // Distance and score tick up with the ground covered.
  const metres = (worldSpeed * dt) / 28; // 28 px on screen is about a metre of farm
  w.distanceM += metres;
  w.score += metres * SCORE_PER_METRE;

  // A new zone begins: announce it.
  const zone = zoneAt(w.distanceM);
  if (zone.id !== w.lastZoneId) {
    w.lastZoneId = zone.id;
    w.zoneAnnounce = zone.name + ' — ' + zone.blurb;
    w.zoneAnnounceTimer = 2.4;
  }
  if (w.zoneAnnounceTimer > 0) w.zoneAnnounceTimer -= dt;

  // Collisions: hazards first, then power-ups, then kernels.
  const box = turkeyHitbox(t);
  for (const h of w.hazards) {
    if (!h.passed && h.x + h.w < t.x - 40) {
      h.passed = true;
      w.dodges += 1;
      w.combo += 1;
      if (w.combo > w.bestCombo) w.bestCombo = w.combo;
      w.score += SCORE_PER_CLEAN_DODGE;
    }
    if (hazardHits(h, box)) {
      const result = turkeyTakeHit(t);
      if (result === 'hit') {
        w.events.push('hit');
        w.combo = 0;
        w.cleanSeconds = 0;
        farmerShoveBack(f, 90);
        w.hazards = w.hazards.filter((x) => x !== h);
        if (t.hearts <= 0) {
          endRun(w, 'caught', 'Three hard knocks — and the farmer caught up while you were seeing stars.');
          return;
        }
      } else if (result === 'shield') {
        w.events.push('shield');
        w.hazards = w.hazards.filter((x) => x !== h);
      }
      break; // one hit per step is enough
    }
  }
  for (const p of w.powerups) {
    if (!p.taken && powerupHits(p, box)) {
      p.taken = true;
      const result = turkeyPowerUp(t, p.kind);
      w.powerupsTaken += 1;
      w.events.push('power');
      if (result === 'heart') w.events.push('heart');
    }
  }
  for (const k of w.kernels) {
    if (!k.taken && k.x > box.x - 10 && k.x < box.x + box.w + 10 && k.y > box.y - 10 && k.y < box.y + box.h + 10) {
      k.taken = true;
      w.kernelsCollected += 1;
      w.score += SCORE_PER_KERNEL;
      w.events.push('kernel');
    }
  }

  // The farmer catches the bird when the gap closes to nothing.
  if (farmerCaught(f)) {
    endRun(w, 'caught', 'The farmer ran you down in the open field.');
    return;
  }

  // The escape line: the free woods, and dinner is cancelled.
  if (hasEscaped(w.distanceM)) {
    endRun(w, 'escaped', 'You made the treeline. Dinner is cancelled.');
  }
}

// Close the run with one of the two endings and freeze the final score.
export function endRun(w, ending, cause) {
  w.ending = ending;
  w.cause = cause;
  w.finalScore = Math.floor(w.score);
  w.screen = ending === 'escaped' ? SCREENS.ESCAPED : SCREENS.CAUGHT;
  w.events.push(ending);
}

// What the HUD shows, in one place, so the renderer never recomputes it.
export function hudState(w) {
  return {
    score: Math.floor(w.score),
    distanceM: Math.floor(w.distanceM),
    distanceLeft: Math.max(0, Math.floor(ESCAPE_DISTANCE - w.distanceM)),
    hearts: Math.max(0, w.turkey.hearts),
    zone: zoneAt(w.distanceM).name,
    farmerGap: Math.round(w.farmer.gap),
    farmerMood: w.farmer.mood,
    combo: w.combo,
    shield: w.turkey.shield,
    dash: w.turkey.dashTimer > 0,
    slowmo: w.turkey.slowmoTimer > 0,
    announce: w.zoneAnnounceTimer > 0 ? w.zoneAnnounce : '',
    progress: Math.min(1, w.distanceM / ESCAPE_DISTANCE),
    paused: w.paused,
  };
}

// A snapshot of the run for the end screen and the tests.
export function runSummary(w) {
  return {
    screen: w.screen,
    ending: w.ending,
    score: Math.floor(w.score),
    distanceM: Math.floor(w.distanceM),
    kernels: w.kernelsCollected,
    dodges: w.dodges,
    bestCombo: w.bestCombo,
    powerups: w.powerupsTaken,
    time: Math.round(w.time * 10) / 10,
    cause: w.cause,
  };
}
