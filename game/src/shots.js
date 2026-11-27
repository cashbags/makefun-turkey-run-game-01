// GOBBLE RUN — shots: the four deterministic scenes for screenshots.
// One job: stage a scene. ?shot=title | play | escaped | caught.
// Each scene is built from the same seeded world the player gets, then run
// forward a fixed number of fixed steps — no input, no clock, no luck.
// The same seed and step count always stage the same frame, so the
// screenshots are stable across runs and machines.

import { SHOT_SEED } from './config.js';
import { createWorld, startRun, endRun, worldStep } from './world.js';
import { zoneAt } from './zones.js';

export function stageShot(shot) {
  const w = createWorld(SHOT_SEED);
  if (shot === 'title') {
    // The title screen, turkey mid-stride, farmer on his heels.
    w.turkey.runPhase = 2.1;
    return { world: w, time: 3.4 };
  }

  // Every other shot starts a real run and plays it forward.
  let run = startRun(w);
  const dt = 1 / 60;

  if (shot === 'play') {
    // A cornfield run at ~640m: mid-jump over a fence, a knife dropping,
    // the farmer in CHASE, corn in hand, HUD full. 640m at ~380px/s takes
    // about 47 seconds of play — too long to simulate step by step here,
    // so the distance is set directly and the scene is staged around it.
    run.distanceM = 640;
    run.score = 640 * 10 + 12 * 25 + 8 * 15;
    run.kernelsCollected = 12;
    run.dodges = 8;
    run.combo = 4;
    run.bestCombo = 6;
    run.time = 47.2;
    run.cleanSeconds = 6.1;
    run.lastZoneId = 'cornfield';
    run.turkey.y = 600 - 120; // mid-jump
    run.turkey.vy = -220;
    run.turkey.grounded = false;
    run.turkey.shield = true;
    run.farmer.gap = 88;
    run.farmer.mood = 'chase';
    run.farmer.moodTimer = 1.8;
    run.hazards = [
      { kind: 'fence', x: 420, y: 516, w: 26, h: 84, passed: false, fallSpeed: 0, falling: false, rollPhase: 0, warned: false },
      { kind: 'pumpkin', x: 640, y: 548, w: 52, h: 52, passed: false, fallSpeed: 0, falling: false, rollPhase: 1.2, warned: false },
      { kind: 'knife', x: 340, y: 280, w: 34, h: 96, passed: false, fallSpeed: 300, falling: true, hoverTimer: 0, stuck: false, rollPhase: 0, warned: true },
      { kind: 'haybale', x: 980, y: 538, w: 64, h: 62, passed: false, fallSpeed: 0, falling: false, rollPhase: 0, warned: false },
    ];
    run.powerups = [
      { kind: 'corn', x: 760, y: 560, w: 34, h: 34, bobPhase: 0.8, taken: false },
      { kind: 'feather', x: 1080, y: 450, w: 36, h: 30, bobPhase: 2.1, taken: false },
    ];
    run.kernels = [
      { x: 520, y: 450, taken: false },
      { x: 566, y: 450, taken: false },
      { x: 612, y: 450, taken: false },
      { x: 860, y: 558, taken: false },
      { x: 906, y: 558, taken: false },
    ];
    run.zoneAnnounce = 'CORNFIELD — The corn hides the farmer — and the knives.';
    run.zoneAnnounceTimer = 1.4;
    // One honest step so the renderer's timers and phases agree.
    worldStep(run, dt);
    return { world: run, time: 47.2 };
  }

  if (shot === 'escaped') {
    run.distanceM = 1400;
    run.score = 1400 * 10 + 34 * 25 + 41 * 15;
    run.kernelsCollected = 34;
    run.dodges = 41;
    run.bestCombo = 9;
    run.powerupsTaken = 7;
    run.time = 118.4;
    endRun(run, 'escaped', 'You made the treeline. Dinner is cancelled.');
    return { world: run, time: 118.4 };
  }

  if (shot === 'caught') {
    run.distanceM = 512;
    run.score = 512 * 10 + 9 * 25 + 11 * 15;
    run.kernelsCollected = 9;
    run.dodges = 11;
    run.bestCombo = 5;
    run.powerupsTaken = 2;
    run.time = 38.9;
    run.turkey.hearts = 0;
    run.farmer.gap = 26;
    endRun(run, 'caught', 'The farmer grabbed you by the tail feathers.');
    return { world: run, time: 38.9 };
  }

  return { world: w, time: 0 };
}

// The shot names the capture script may ask for.
export const SHOT_NAMES = ['title', 'play', 'escaped', 'caught'];

// The zone a shot's world is in, for the capture script's log line.
export function shotZone(shot) {
  const { world } = stageShot(shot);
  return zoneAt(world.distanceM).name;
}
