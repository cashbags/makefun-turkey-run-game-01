// GOBBLE RUN — the seeded generator behind every roll.
// One job: deterministic randomness. Same seed, same run, every time.
// mulberry32: small, fast, and good enough for spawn tables and scatter.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one entry from a list, weighted by each entry's `weight` (default 1).
export function weightedPick(rng, entries) {
  let total = 0;
  for (const e of entries) total += e.weight ?? 1;
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return entries[entries.length - 1];
}

// A number between min and max, from the same stream as everything else.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Shuffle a copy in place order, driven by the seeded stream.
export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
