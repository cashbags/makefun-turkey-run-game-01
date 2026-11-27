// GOBBLE RUN — the three zones: barnyard, cornfield, woods.
// One job: where the bird is, what it looks like, and how hard it is.
// Distance in metres picks the zone; each zone brings its own sky, ground,
// hazard table and speed. The escape line sits at the end of the woods.

import { ZONES, ESCAPE_DISTANCE } from './config.js';

// Which zone the run is in at this distance.
export function zoneAt(distanceM) {
  for (const z of ZONES) {
    if (distanceM >= z.from && distanceM < z.to) return z;
  }
  return ZONES[ZONES.length - 1];
}

// The zone's name for the HUD, e.g. "CORNFIELD".
export function zoneName(distanceM) {
  return zoneAt(distanceM).name;
}

// World speed in px per second at this distance: the zone's base, rising
// gently inside the zone so the late game always feels faster.
export function zoneSpeed(distanceM) {
  const z = zoneAt(distanceM);
  const span = z.to - z.from;
  const t = Math.min(1, Math.max(0, (distanceM - z.from) / span));
  return z.speed + t * 40;
}

// Metres left until the free woods end the run.
export function distanceLeft(distanceM) {
  return Math.max(0, ESCAPE_DISTANCE - distanceM);
}

// True once the bird has crossed the escape line.
export function hasEscaped(distanceM) {
  return distanceM >= ESCAPE_DISTANCE;
}

// The blurb the HUD shows when a new zone begins.
export function zoneBlurb(distanceM) {
  return zoneAt(distanceM).blurb;
}

// How far through the whole escape the bird is, 0 to 1, for progress bars.
export function escapeProgress(distanceM) {
  return Math.min(1, distanceM / ESCAPE_DISTANCE);
}
