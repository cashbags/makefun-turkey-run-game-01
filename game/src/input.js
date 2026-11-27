// GOBBLE RUN — input: keyboard and mouse become verbs.
// One job: listen, translate, call the world. No game rules here.
// Keys: Space / ArrowUp / W jump · ArrowDown / S slide · P pause · R restart
// · M mute · Enter starts. Mouse: click the on-screen buttons, or click
// anywhere while playing to jump. Coordinates are canvas pixels (1280x720).

import { SCREENS, startRun, backToTitle, worldJump, worldSlide, worldTogglePause, worldToggleMute } from './world.js';
import { TITLE_BUTTON, AGAIN_BUTTON, TITLE2_BUTTON } from './config.js';

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function attachInput(canvas, getWorld, setWorld) {
  const onKey = (e) => {
    const w = getWorld();
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (w.screen === SCREENS.TITLE) setWorld(startRun(w));
      else if (w.screen === SCREENS.CAUGHT || w.screen === SCREENS.ESCAPED) setWorld(startRun(w));
      else worldJump(w);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      worldSlide(w);
    } else if (e.code === 'KeyP') {
      worldTogglePause(w);
    } else if (e.code === 'KeyM') {
      worldToggleMute(w);
    } else if (e.code === 'KeyR') {
      if (w.screen === SCREENS.PLAY) setWorld(startRun(w));
      else if (w.screen === SCREENS.CAUGHT || w.screen === SCREENS.ESCAPED) setWorld(startRun(w));
    } else if (e.code === 'Enter') {
      if (w.screen === SCREENS.TITLE) setWorld(startRun(w));
      else if (w.screen === SCREENS.CAUGHT || w.screen === SCREENS.ESCAPED) setWorld(startRun(w));
    }
  };

  const onClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const w = getWorld();
    if (w.screen === SCREENS.TITLE) {
      if (inside(px, py, TITLE_BUTTON)) setWorld(startRun(w));
      return;
    }
    if (w.screen === SCREENS.CAUGHT || w.screen === SCREENS.ESCAPED) {
      if (inside(px, py, AGAIN_BUTTON)) setWorld(startRun(w));
      else if (inside(px, py, TITLE2_BUTTON)) setWorld(backToTitle(w));
      return;
    }
    if (w.screen === SCREENS.PLAY && !w.paused) worldJump(w);
  };

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('click', onClick);
  return () => {
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('click', onClick);
  };
}
