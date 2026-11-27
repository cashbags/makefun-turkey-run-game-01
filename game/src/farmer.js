// GOBBLE RUN — the farmer: the man with the carving knife.
// One job: the hunter's brain. Three moods, one gap.
// The farmer trails behind the turkey at a gap in px. The gap is a race:
// it grows by (turkey speed − farmer speed) each second. PATROL strolls at
// little over half the turkey's pace, so clean running pulls the gap back
// open; CHASE sprints at 1.1× the turkey's pace, so it closes slowly —
// fast while the bird stumbles at three-quarters speed. TRAP stops the
// farmer to plant a snare ahead, then the chase resumes.
// A stumble flips him to CHASE. Clean running for a while calms him back
// to PATROL. If the gap closes to the catch line, he grabs the bird.

import { FARMER_MOODS, FARMER_CATCH_GAP, FARMER_START_GAP, GROUND_Y } from './config.js';

export function createFarmer() {
  return {
    gap: FARMER_START_GAP, // px behind the turkey
    mood: 'patrol',
    moodTimer: 0,
    trapCooldown: 6, // seconds until he may plant another snare
    walkPhase: 0,
    snarePlanted: false, // a snare is waiting ahead right now
  };
}

// The farmer's screen x, from the turkey's x and the gap.
export function farmerX(f, turkeyX) {
  return turkeyX - f.gap;
}

// What the farmer is doing, in words the HUD can show.
export function farmerMoodLabel(f) {
  return FARMER_MOODS[f.mood].label;
}

// One fixed step. turkeyStumbling is true while the bird wobbles after a
// hit; cleanSeconds counts seconds since the last hit; wantSnare is true
// when the world asks for a trap. baseSpeed is the run's pace this zone
// (px/s before stumble/dash); turkeyFactor is the bird's current factor
// (1, 0.75 stumbling, 1.9 dashing). Returns 'snare' on the step he plants one.
export function farmerStep(f, dt, turkeyStumbling, cleanSeconds, wantSnare, baseSpeed, turkeyFactor) {
  f.walkPhase += dt * (f.mood === 'chase' ? 14 : 7);
  if (f.trapCooldown > 0) f.trapCooldown -= dt;

  if (turkeyStumbling && f.mood !== 'chase') {
    f.mood = 'chase';
    f.moodTimer = 1.4;
  }
  if (f.mood === 'chase') {
    f.moodTimer -= dt;
    if (f.moodTimer <= 0 && !turkeyStumbling) {
      f.mood = 'patrol';
    }
  } else if (cleanSeconds > 9 && f.mood === 'patrol' && wantSnare && f.trapCooldown <= 0 && !f.snarePlanted) {
    f.mood = 'trap';
    f.moodTimer = 1.1;
  }
  if (f.mood === 'trap') {
    f.moodTimer -= dt;
    if (f.moodTimer <= 0) {
      f.mood = 'chase';
      f.moodTimer = 2.0;
      f.trapCooldown = 9;
      f.snarePlanted = true;
      return 'snare';
    }
    return 'none';
  }

  // The race: the turkey's real pace against the farmer's. Patrol strolls
  // at 0.55×, so the gap re-opens; chase sprints at 1.1×, so it closes.
  const turkeySpeed = baseSpeed * turkeyFactor;
  const farmerSpeed = baseSpeed * (f.mood === 'chase' ? 1.1 : 0.55);
  f.gap += (turkeySpeed - farmerSpeed) * dt;
  if (f.gap > 260) f.gap = 260;
  if (f.gap < FARMER_CATCH_GAP) f.gap = FARMER_CATCH_GAP;
  return 'none';
}

// True when the farmer's hands are on the bird.
export function farmerCaught(f) {
  return f.gap <= FARMER_CATCH_GAP;
}

// After a hit the farmer is shoved back — the bird gets a second chance.
export function farmerShoveBack(f, px) {
  f.gap += px;
  if (f.gap > 260) f.gap = 260;
}

// The farmer's body box, for the renderer's feet and the catch check.
export function farmerHitbox(f, turkeyX) {
  const x = farmerX(f, turkeyX);
  return { x: x - 34, y: GROUND_Y - 132, w: 68, h: 132 };
}
