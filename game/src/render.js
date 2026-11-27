// GOBBLE RUN — render: every pixel on the screen.
// One job: draw the world. Sky, parallax farm, dirt, turkey, farmer,
// hazards, power-ups, HUD, title and end screens. No rules, no input.
// One art direction throughout: chunky shapes, warm dusk, autumn farmstead.

import { CANVAS_W, CANVAS_H, GROUND_Y, PALETTE, HAZARDS, POWERUPS, TITLE_BUTTON, AGAIN_BUTTON, TITLE2_BUTTON } from './config.js';
import { SCREENS, hudState, runSummary } from './world.js';
import { zoneAt } from './zones.js';
import { farmerX, farmerMoodLabel } from './farmer.js';
import { knifeWarning } from './hazards.js';

// A deterministic hash of an integer, for scenery that must not wobble
// between runs: the same index always draws the same stone or tuft.
function hash(n) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function outlineText(ctx, s, x, y, size, color, align = 'left') {
  ctx.font = `bold ${size}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = size / 7;
  ctx.strokeStyle = 'rgba(30, 12, 8, 0.9)';
  ctx.lineJoin = 'round';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ---------------------------------------------------------------- sky + land

function drawSky(ctx, zone, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, zone.skyTop);
  g.addColorStop(0.55, zone.skyMid);
  g.addColorStop(1, zone.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);
  // Low dusk sun, hanging over the farm.
  ctx.fillStyle = zone.sun;
  ctx.beginPath();
  ctx.arc(1050, 150, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 160, 0.25)';
  ctx.beginPath();
  ctx.arc(1050, 150, 74, 0, Math.PI * 2);
  ctx.fill();
  // Slow clouds.
  ctx.fillStyle = 'rgba(255, 220, 180, 0.35)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 + time * 12) % (CANVAS_W + 240)) - 120;
    const cy = 70 + i * 42;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 44, cy + 6, 52, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A few birds heading home.
  ctx.strokeStyle = 'rgba(40, 20, 30, 0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 420 + time * 30) % (CANVAS_W + 200)) - 100;
    const by = 120 + i * 36 + Math.sin(time * 2 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.quadraticCurveTo(bx, by - 8, bx + 10, by);
    ctx.stroke();
  }
}

function drawMidground(ctx, zone, distanceM, time) {
  const off = (distanceM * 10 * 0.35) % 320; // parallax: the middle moves slower
  ctx.save();
  if (zone.id === 'barnyard') {
    // The barn and the windmill, standing against the dusk.
    const bx = 180 - off;
    ctx.fillStyle = '#5e2a1e';
    ctx.fillRect(bx, 300, 220, 180);
    ctx.beginPath();
    ctx.moveTo(bx - 14, 300);
    ctx.lineTo(bx + 110, 220);
    ctx.lineTo(bx + 234, 300);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.fillRect(bx + 88, 400, 44, 80);
    ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
    ctx.fillRect(bx + 30, 340, 34, 34);
    ctx.fillRect(bx + 156, 340, 34, 34);
    // Windmill, further back.
    const wx = 620 - ((distanceM * 10 * 0.2) % 900);
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(wx, 330, 26, 150);
    ctx.strokeStyle = '#4a3220';
    ctx.lineWidth = 10;
    for (let k = 0; k < 4; k++) {
      const a = (time * 0.6) + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(wx + 13, 330);
      ctx.lineTo(wx + 13 + Math.cos(a) * 64, 330 + Math.sin(a) * 64);
      ctx.stroke();
    }
  } else if (zone.id === 'cornfield') {
    // Corn stalks in rows, gold against the sky.
    for (let i = 0; i < 14; i++) {
      const sx = i * 100 - off + 40;
      const sway = Math.sin(time * 1.2 + i) * 4;
      ctx.fillStyle = i % 2 ? '#8a6b1e' : '#a8842a';
      ctx.fillRect(sx + sway, 330, 8, 150);
      ctx.beginPath();
      ctx.ellipse(sx + sway + 4, 330, 14, 42, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx + sway + 4, 400, 10, 30, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Pine woods, dark against the last light.
    for (let i = 0; i < 12; i++) {
      const tx = i * 116 - off;
      const th = 150 + hash(i * 7 + 3) * 90;
      ctx.fillStyle = i % 2 ? '#1e3320' : '#243d24';
      ctx.beginPath();
      ctx.moveTo(tx, GROUND_Y - th);
      ctx.lineTo(tx - 34, GROUND_Y);
      ctx.lineTo(tx + 34, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(tx - 5, GROUND_Y - 26, 10, 26);
    }
  }
  ctx.restore();
}

function drawGround(ctx, zone, distanceM) {
  // Dirt band.
  ctx.fillStyle = zone.ground;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
  ctx.fillStyle = zone.groundDark;
  ctx.fillRect(0, GROUND_Y + 84, CANVAS_W, CANVAS_H - GROUND_Y - 84);
  // Grass strip on top.
  ctx.fillStyle = zone.grass;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, 14);
  // Stones and tufts scrolling with the ground, hashed so they never jump.
  const off = (distanceM * 28) % 90;
  for (let i = -1; i < 16; i++) {
    const x = i * 90 - off + hash(i + 11) * 40;
    const r = hash(i + 5);
    if (r < 0.4) {
      ctx.fillStyle = zone.groundDark;
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 44 + hash(i + 21) * 60, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (r < 0.7) {
      ctx.strokeStyle = zone.grass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 4);
      ctx.lineTo(x - 4, GROUND_Y - 8);
      ctx.moveTo(x + 5, GROUND_Y + 4);
      ctx.lineTo(x + 8, GROUND_Y - 9);
      ctx.stroke();
    }
  }
  // Fence posts flashing past at the back of the dirt.
  ctx.fillStyle = '#4e2e1a';
  const foff = (distanceM * 28) % 160;
  for (let x = -foff; x < CANVAS_W + 160; x += 160) {
    ctx.fillRect(x, GROUND_Y - 44, 12, 44);
    ctx.fillRect(x - 20, GROUND_Y - 38, 52, 8);
    ctx.fillRect(x - 20, GROUND_Y - 22, 52, 8);
  }
}

// ---------------------------------------------------------------- the turkey

function drawTurkey(ctx, t, time) {
  const x = t.x;
  const feet = t.y;
  // Mercy blink: the bird flickers while invulnerable.
  if (t.invulnTimer > 0 && Math.floor(time * 12) % 2 === 0) return;
  const bob = t.grounded ? Math.abs(Math.sin(t.runPhase)) * 4 : 0;
  const bodyY = feet - 34 - bob;
  ctx.save();
  ctx.translate(x, bodyY);

  if (t.sliding) {
    // Flat out, low and long, sliding under the pitchfork.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, 8, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(40, -2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(50, -6);
    ctx.lineTo(64, -1);
    ctx.lineTo(50, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.tailC;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-38 - i * 6, 2 - i * 4, 16, 7, -0.4 - i * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Tail fan: five feathers, fanned behind.
    const tailColors = [PALETTE.tailA, PALETTE.tailB, PALETTE.tailC, PALETTE.tailB, PALETTE.tailA];
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      ctx.fillStyle = tailColors[i];
      ctx.save();
      ctx.translate(-26, -6);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(-16, 0, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyLight;
    ctx.beginPath();
    ctx.ellipse(6, 8, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping a little with the run.
    const flap = t.grounded ? Math.sin(t.runPhase * 2) * 4 : -10;
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(-4, -2 + flap, 18, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Head, beak, wattle, eye.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(28, -26, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(38, -30);
    ctx.lineTo(54, -25);
    ctx.lineTo(38, -21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ctx.beginPath();
    ctx.ellipse(34, -14, 5, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1210';
    ctx.beginPath();
    ctx.arc(32, -29, 3, 0, Math.PI * 2);
    ctx.fill();
    // Legs, scissoring with the run phase.
    const legSwing = t.grounded ? Math.sin(t.runPhase) * 12 : 6;
    ctx.strokeStyle = PALETTE.beak;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-8, 22);
    ctx.lineTo(-8 + legSwing, feet - bodyY);
    ctx.moveTo(10, 22);
    ctx.lineTo(10 - legSwing, feet - bodyY);
    ctx.stroke();
  }
  ctx.restore();

  // Corn shield: a golden ring around the bird.
  if (t.shield) {
    ctx.strokeStyle = 'rgba(255, 215, 90, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, feet - 40, 52, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- the farmer

function drawFarmer(ctx, f, turkeyX, time) {
  const x = farmerX(f, turkeyX);
  if (x < -90) return; // off the left edge: he is catching his breath
  const swing = Math.sin(f.walkPhase) * 10;
  const chasing = f.mood === 'chase';
  ctx.save();
  ctx.translate(x, GROUND_Y);
  // Legs.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-6, -62);
  ctx.lineTo(-6 + swing, 0);
  ctx.moveTo(8, -62);
  ctx.lineTo(8 - swing, 0);
  ctx.stroke();
  // Overalls + shirt.
  ctx.fillStyle = PALETTE.farmerOveralls;
  rr(ctx, -20, -108, 42, 50, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerShirt;
  rr(ctx, -22, -118, 46, 26, 6);
  ctx.fill();
  // Arm reaching forward, pitchfork in hand.
  ctx.strokeStyle = PALETTE.farmerSkin;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(16, -108);
  ctx.lineTo(34, -84);
  ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(34, -84);
  ctx.lineTo(52, -128);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(46, -132);
  ctx.lineTo(40, -146);
  ctx.moveTo(52, -134);
  ctx.lineTo(52, -150);
  ctx.moveTo(58, -132);
  ctx.lineTo(64, -146);
  ctx.stroke();
  // Head, beard, straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(2, -128, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerBeard;
  ctx.beginPath();
  ctx.moveTo(-12, -122);
  ctx.lineTo(16, -122);
  ctx.lineTo(2, -104);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.fillRect(-18, -142, 40, 6);
  ctx.beginPath();
  ctx.ellipse(2, -143, 14, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1c1210';
  ctx.beginPath();
  ctx.arc(8, -130, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A red "!" over his head while he chases, and a trap icon while he sets one.
  if (chasing) {
    outlineText(ctx, '!', x + 6, GROUND_Y - 168, 34, PALETTE.danger, 'center');
  } else if (f.mood === 'trap') {
    outlineText(ctx, '…', x + 6, GROUND_Y - 168, 30, PALETTE.hudAccent, 'center');
  }
}

// ---------------------------------------------------------------- hazards

function drawHazard(ctx, h) {
  const def = HAZARDS[h.kind];
  if (!def) return;
  ctx.save();
  if (h.kind === 'fence') {
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(h.x, h.y + 8, 8, h.h - 8);
    ctx.fillRect(h.x + h.w - 8, h.y + 8, 8, h.h - 8);
    ctx.fillStyle = '#9a6232';
    ctx.fillRect(h.x - 4, h.y + 14, h.w + 8, 10);
    ctx.fillRect(h.x - 4, h.y + 40, h.w + 8, 10);
    ctx.fillRect(h.x - 4, h.y + 64, h.w + 8, 10);
  } else if (h.kind === 'haybale') {
    ctx.fillStyle = '#d9a83d';
    rr(ctx, h.x, h.y, h.w, h.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#a8842a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(h.x + 8, h.y + 12);
    ctx.lineTo(h.x + h.w - 8, h.y + 12);
    ctx.moveTo(h.x + 8, h.y + h.h / 2);
    ctx.lineTo(h.x + h.w - 8, h.y + h.h / 2);
    ctx.moveTo(h.x + 8, h.y + h.h - 12);
    ctx.lineTo(h.x + h.w - 8, h.y + h.h - 12);
    ctx.stroke();
  } else if (h.kind === 'puddle') {
    ctx.fillStyle = '#5e3a1a';
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, GROUND_Y - 4, h.w / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160, 110, 60, 0.7)';
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2 - 14, GROUND_Y - 6, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (h.kind === 'pumpkin') {
    ctx.save();
    ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
    ctx.rotate(h.rollPhase);
    ctx.fillStyle = '#e07b22';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b85a10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4a6b2f';
    ctx.fillRect(-3, -30, 6, 10);
    ctx.restore();
  } else if (h.kind === 'pitchfork') {
    ctx.strokeStyle = '#8a8a8a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(h.x + h.w / 2, GROUND_Y);
    ctx.lineTo(h.x + h.w / 2, h.y + 30);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const tx = h.x + 4 + k * 11;
      ctx.moveTo(tx, h.y + 30);
      ctx.lineTo(tx, h.y);
    }
    ctx.stroke();
    ctx.fillStyle = '#c22f2f';
    ctx.fillRect(h.x - 6, h.y - 8, h.w + 12, 8);
  } else if (h.kind === 'knife') {
    // Warning marker on the ground while it hovers.
    const warn = knifeWarning(h);
    if (warn) {
      ctx.fillStyle = 'rgba(255, 60, 60, 0.55)';
      ctx.fillRect(warn.x, warn.y, warn.w, warn.h);
      outlineText(ctx, '!', h.x + h.w / 2, GROUND_Y - 18, 26, PALETTE.danger, 'center');
    }
    ctx.save();
    ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
    // Falling knives tumble; stuck ones stand straight up in the dirt.
    ctx.rotate(h.stuck ? 0 : 0.5);
    ctx.fillStyle = '#d8d8e0';
    ctx.beginPath();
    ctx.moveTo(-6, -48);
    ctx.lineTo(10, -20);
    ctx.lineTo(6, 30);
    ctx.lineTo(-12, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-12, 30, 22, 14);
    ctx.restore();
  } else if (h.kind === 'oven') {
    ctx.fillStyle = '#2a2a30';
    rr(ctx, h.x, h.y, h.w, h.h, 8);
    ctx.fill();
    ctx.fillStyle = '#ff7b2f';
    rr(ctx, h.x + 18, h.y + 46, h.w - 36, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, h.y + 68, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(h.x + h.w - 30, h.y - 34, 18, 34);
    ctx.fillStyle = '#ff9a4d';
    ctx.beginPath();
    ctx.ellipse(h.x + h.w - 21, h.y - 36, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(h.x + 22, GROUND_Y - 2, 12, 0, Math.PI * 2);
    ctx.arc(h.x + h.w - 22, GROUND_Y - 2, 12, 0, Math.PI * 2);
    ctx.fill();
    outlineText(ctx, 'HOT', h.x + h.w / 2, h.y + 30, 22, '#ffb36b', 'center');
  } else if (h.kind === 'snare') {
    ctx.strokeStyle = '#d9c25b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, h.y + 12, 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(h.x + 4, h.y + 22);
    ctx.lineTo(h.x + 4, GROUND_Y);
    ctx.moveTo(h.x + h.w - 4, h.y + 22);
    ctx.lineTo(h.x + h.w - 4, GROUND_Y);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- power-ups + kernels

function drawPowerUp(ctx, p, time) {
  const bob = Math.sin(p.bobPhase) * 5;
  const y = p.y + bob;
  ctx.save();
  if (p.kind === 'corn') {
    ctx.fillStyle = '#e8c33d';
    ctx.beginPath();
    ctx.ellipse(p.x + 17, y + 17, 12, 17, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a8842a';
    ctx.lineWidth = 2;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(p.x + 17 + k * 7, y + 4);
      ctx.lineTo(p.x + 17 + k * 7, y + 30);
      ctx.stroke();
    }
    ctx.fillStyle = '#4a6b2f';
    ctx.fillRect(p.x + 12, y + 30, 10, 6);
  } else if (p.kind === 'feather') {
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.ellipse(p.x + 18, y + 15, 8, 16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 18, y + 2);
    ctx.lineTo(p.x + 10, y + 30);
    ctx.stroke();
  } else if (p.kind === 'egg') {
    ctx.fillStyle = 'rgba(255, 215, 90, 0.3)';
    ctx.beginPath();
    ctx.arc(p.x + 15, y + 19, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath();
    ctx.ellipse(p.x + 15, y + 19, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c0';
    ctx.beginPath();
    ctx.ellipse(p.x + 11, y + 12, 5, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'pie') {
    ctx.fillStyle = '#c96a1e';
    ctx.beginPath();
    ctx.moveTo(p.x, y + 28);
    ctx.lineTo(p.x + 40, y + 28);
    ctx.lineTo(p.x + 20, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.moveTo(p.x + 4, y + 24);
    ctx.lineTo(p.x + 36, y + 24);
    ctx.lineTo(p.x + 20, y + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawKernel(ctx, k) {
  ctx.fillStyle = '#ffd75a';
  ctx.beginPath();
  ctx.arc(k.x, k.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8842a';
  ctx.beginPath();
  ctx.arc(k.x - 2, k.y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- HUD

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#ff4d6d' : 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.arc(x + 16, y, 9, 0, Math.PI * 2);
  ctx.moveTo(x - 7, y + 5);
  ctx.lineTo(x + 8, y + 20);
  ctx.lineTo(x + 23, y + 5);
  ctx.closePath();
  ctx.fill();
}

function drawHud(ctx, w) {
  const hud = hudState(w);
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 64);
  ctx.fillStyle = 'rgba(255, 179, 107, 0.5)';
  ctx.fillRect(0, 64, CANVAS_W, 2);

  text(ctx, `SCORE ${hud.score.toLocaleString('en-US')}`, 20, 28, 26, PALETTE.hudText);
  text(ctx, `COMBO x${hud.combo}`, 20, 52, 15, hud.combo >= 5 ? PALETTE.hudAccent : 'rgba(255, 233, 176, 0.7)');

  // Centre: zone, distance, progress bar to the woods.
  text(ctx, hud.zone, CANVAS_W / 2, 26, 22, PALETTE.hudAccent, 'center');
  text(ctx, `${hud.distanceM}m  ·  ${hud.distanceLeft}m to the woods`, CANVAS_W / 2, 50, 14, PALETTE.hudText, 'center');
  const bw = 260;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(CANVAS_W / 2 - bw / 2, 56, bw, 5);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillRect(CANVAS_W / 2 - bw / 2, 56, bw * hud.progress, 5);

  // Right: hearts, then the farmer gap meter.
  for (let i = 0; i < 3; i++) drawHeart(ctx, CANVAS_W - 300 + i * 28, 16, i < hud.hearts);
  const gapColor = hud.farmerGap < 70 ? PALETTE.danger : hud.farmerGap < 130 ? PALETTE.hudAccent : PALETTE.ok;
  text(ctx, `FARMER ${hud.farmerGap}m`, CANVAS_W - 210, 28, 20, gapColor, 'left');
  text(ctx, farmerMoodLabel(w.farmer), CANVAS_W - 210, 52, 14, gapColor, 'left');

  // Power-up status, bottom-left (plain text: headless fonts have no emoji).
  let py = CANVAS_H - 24;
  if (hud.shield) text(ctx, 'SHIELD UP', 20, py, 16, '#ffd75a');
  if (hud.dash) text(ctx, 'DASH!', 20, py - (hud.shield ? 24 : 0), 16, '#fff3c0');
  if (hud.slowmo) text(ctx, 'SLOW-MO', 20, py - (hud.shield || hud.dash ? 24 : 0), 16, '#ffb36b');

  // Zone announcement, big in the middle, fading with its timer.
  if (hud.announce) {
    outlineText(ctx, hud.announce, CANVAS_W / 2, 180, 34, '#ffe9b0', 'center');
  }
  if (hud.paused) {
    ctx.fillStyle = 'rgba(10, 6, 20, 0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    outlineText(ctx, 'PAUSED', CANVAS_W / 2, CANVAS_H / 2, 64, '#ffe9b0', 'center');
    text(ctx, 'Press P to keep running', CANVAS_W / 2, CANVAS_H / 2 + 44, 20, PALETTE.hudText, 'center');
  }
}

// ---------------------------------------------------------------- screens

function drawButton(ctx, r, label, sub) {
  ctx.fillStyle = '#c22f2f';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.fillStyle = '#8a1f1f';
  rr(ctx, r.x, r.y + r.h - 10, r.w, 10, 6);
  ctx.fill();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 9, 26, '#ffe9b0', 'center');
  if (sub) text(ctx, sub, r.x + r.w / 2, r.y + r.h + 24, 14, 'rgba(255, 233, 176, 0.8)', 'center');
}

function drawTitle(ctx, w, time) {
  const zone = zoneAt(0);
  drawSky(ctx, zone, time);
  drawMidground(ctx, zone, 0, time);
  drawGround(ctx, zone, 0);
  // The bird, mid-stride, with the farmer closing in behind.
  const demo = { ...w.turkey, runPhase: time * 9, y: GROUND_Y };
  drawTurkey(ctx, demo, time);
  drawFarmer(ctx, { ...w.farmer, gap: 150, walkPhase: time * 7, mood: 'chase' }, w.turkey.x, time);

  ctx.fillStyle = 'rgba(20, 8, 24, 0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  outlineText(ctx, 'GOBBLE RUN', CANVAS_W / 2, 150, 92, '#ffd75a', 'center');
  outlineText(ctx, 'a turkey’s dash from the farmyard to the free woods', CANVAS_W / 2, 200, 26, '#ffe9b0', 'center');
  text(ctx, '3 zones  ·  8 hazards  ·  4 power-ups  ·  3 farmer moods  ·  2 endings', CANVAS_W / 2, 248, 22, PALETTE.hudAccent, 'center');
  text(ctx, 'Thanksgiving is coming. The oven is hot, the knife is sharp,', CANVAS_W / 2, 306, 20, '#ffe9b0', 'center');
  text(ctx, 'and the farmer is already running. Reach the woods — 1,400 metres — and dinner is cancelled.', CANVAS_W / 2, 334, 20, '#ffe9b0', 'center');
  text(ctx, 'SPACE / CLICK jump   ·   ↓ slide under the pitchfork   ·   grab corn for a shield', CANVAS_W / 2, 392, 18, 'rgba(255, 233, 176, 0.85)', 'center');
  text(ctx, 'P pause   ·   M mute   ·   R restart', CANVAS_W / 2, 420, 18, 'rgba(255, 233, 176, 0.85)', 'center');
  text(ctx, 'Dodge the oven. Dodge the carving knife. Do not let the farmer catch you.', CANVAS_W / 2, 464, 18, 'rgba(255, 233, 176, 0.85)', 'center');
  drawButton(ctx, TITLE_BUTTON, 'START THE RUN', 'or press SPACE');
  text(ctx, 'An original game for make.fun turkey-run-game-01 — plays offline, no network', CANVAS_W / 2, 640, 14, 'rgba(255, 233, 176, 0.6)', 'center');
}

function drawEnd(ctx, w, time) {
  const zone = zoneAt(Math.min(w.distanceM, 1399));
  drawSky(ctx, zone, time);
  drawMidground(ctx, zone, w.distanceM, time);
  drawGround(ctx, zone, w.distanceM);
  const s = runSummary(w);
  const escaped = w.screen === SCREENS.ESCAPED;
  ctx.fillStyle = escaped ? 'rgba(20, 40, 16, 0.55)' : 'rgba(40, 8, 10, 0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (escaped) {
    outlineText(ctx, 'ESCAPED!', CANVAS_W / 2, 150, 88, '#7ddc7d', 'center');
    drawTurkey(ctx, { ...w.turkey, runPhase: time * 6, y: GROUND_Y, invulnTimer: 0 }, time);
  } else {
    outlineText(ctx, 'CAUGHT!', CANVAS_W / 2, 150, 88, '#ff6b6b', 'center');
    drawFarmer(ctx, { ...w.farmer, gap: 60, walkPhase: time * 2, mood: 'patrol' }, w.turkey.x + 60, time);
  }
  text(ctx, w.cause, CANVAS_W / 2, 200, 22, '#ffe9b0', 'center');

  // The run's numbers, in a neat row.
  const stats = [
    ['SCORE', s.score.toLocaleString('en-US')],
    ['DISTANCE', `${s.distanceM}m`],
    ['CORN', `${s.kernels}`],
    ['DODGES', `${s.dodges}`],
    ['BEST COMBO', `x${s.bestCombo}`],
    ['TIME', `${s.time}s`],
  ];
  const cw = CANVAS_W / stats.length;
  stats.forEach(([label, value], i) => {
    const cx = cw * i + cw / 2;
    text(ctx, label, cx, 290, 15, 'rgba(255, 233, 176, 0.75)', 'center');
    text(ctx, value, cx, 326, 30, '#ffe9b0', 'center');
  });

  text(ctx, escaped ? 'The woods are yours. The farmer goes home hungry.' : 'The oven was already hot. Run again — the woods are still out there.', CANVAS_W / 2, 392, 20, '#ffe9b0', 'center');
  drawButton(ctx, AGAIN_BUTTON, 'RUN AGAIN', 'or press SPACE');
  ctx.fillStyle = '#3a2a4a';
  rr(ctx, TITLE2_BUTTON.x, TITLE2_BUTTON.y, TITLE2_BUTTON.w, TITLE2_BUTTON.h, 10);
  ctx.fill();
  text(ctx, 'BACK TO TITLE', TITLE2_BUTTON.x + TITLE2_BUTTON.w / 2, TITLE2_BUTTON.y + 34, 18, '#ffe9b0', 'center');
}

// ---------------------------------------------------------------- entry point

export function render(ctx, w, time) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (w.screen === SCREENS.TITLE) {
    drawTitle(ctx, w, time);
    return;
  }
  if (w.screen === SCREENS.CAUGHT || w.screen === SCREENS.ESCAPED) {
    drawEnd(ctx, w, time);
    return;
  }
  const zone = zoneAt(w.distanceM);
  drawSky(ctx, zone, time);
  drawMidground(ctx, zone, w.distanceM, time);
  drawGround(ctx, zone, w.distanceM);
  for (const p of w.powerups) drawPowerUp(ctx, p, time);
  for (const k of w.kernels) drawKernel(ctx, k);
  for (const h of w.hazards) drawHazard(ctx, h);
  drawTurkey(ctx, w.turkey, time);
  drawFarmer(ctx, w.farmer, w.turkey.x, time);
  drawHud(ctx, w);
}
