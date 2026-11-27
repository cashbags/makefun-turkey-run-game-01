// GOBBLE RUN — main: boot the game and run the loop.
// One job: wire the pieces together. Fixed-step loop at 60 Hz, render every
// animation frame, drain the world's sound events into the audio, and expose
// a debug handle (?debug=1) so the entry can be play-tested from a console.
// Shot mode (?shot=title|play|escaped|caught) renders one staged scene and
// stops: that is how the screenshots are taken, with no input at all.

import { CANVAS_W, CANVAS_H, PLAY_SEED } from './config.js';
import { createWorld, worldStep, SCREENS } from './world.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { createAudio, armAudio, playEvents } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const debug = params.get('debug') === '1';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const audio = createAudio();
let world = createWorld(PLAY_SEED);

if (shot) {
  // Shot mode: one staged scene, rendered once, then still. The capture
  // script screenshots this frame; nothing here depends on the clock.
  const staged = stageShot(shot);
  world = staged.world;
  render(ctx, world, staged.time);
  document.title = `GOBBLE RUN — shot: ${shot}`;
  window.__gobble = { world, shot, time: staged.time };
} else {
  // Play mode: the real game.
  document.title = 'GOBBLE RUN — a turkey’s dash to the free woods';
  attachInput(canvas, () => world, (next) => { world = next; });
  window.addEventListener('pointerdown', () => armAudio(audio), { once: true });
  window.addEventListener('keydown', () => armAudio(audio), { once: true });
  if (debug) window.__gobble = { get world() { return world; } };

  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;
  let clock = 0;

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += elapsed;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      worldStep(world, STEP);
      acc -= STEP;
      steps += 1;
      clock += STEP;
    }
    if (steps === 5) acc = 0; // a long hitch drops time rather than spiralling
    // Sound: drain this frame's events, then clear them.
    if (world.events.length > 0) {
      playEvents(audio, world.events, world.muted);
      world.events.length = 0;
    }
    render(ctx, world, clock);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
