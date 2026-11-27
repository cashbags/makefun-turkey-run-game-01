// GOBBLE RUN — every tunable number: canvas, physics, zones, palette, scoring.
// One job: constants. No logic lives here, so tuning never touches the rules.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GROUND_Y = 600; // top of the dirt the turkey runs on
export const TURKEY_X = 230; // the turkey's fixed screen x; the world scrolls past it
export const GRAVITY = 2600; // px per second squared
export const JUMP_VELOCITY = -1200; // px per second, one clean hop clears the oven
export const SLIDE_TIME = 0.55; // seconds a slide lasts
export const DASH_TIME = 0.9; // seconds a feather burst lasts
export const SLOWMO_TIME = 3.0; // seconds a pie slice slows the world
export const INVULN_TIME = 1.6; // seconds of mercy after a hit
export const ESCAPE_DISTANCE = 1400; // metres to the free woods: reach it and you are out
export const START_HEARTS = 3;
export const BASE_SPEED = 300; // world px per second at the starting line
export const MAX_SPEED = 560; // world px per second deep in the woods
export const FARMER_CATCH_GAP = 26; // px: closer than this and the farmer grabs the turkey
export const FARMER_START_GAP = 190; // px behind the turkey when the run begins
export const SCORE_PER_METRE = 10;
export const SCORE_PER_KERNEL = 25;
export const SCORE_PER_CLEAN_DODGE = 15;

// The three legs of the escape. Each zone re-skins the sky and the ground,
// swaps which hazards show up, and turns the speed screw a little further.
export const ZONES = [
  {
    id: 'barnyard',
    name: 'BARNYARD',
    from: 0,
    to: 400,
    skyTop: '#2b1a4e',
    skyMid: '#b34a2e',
    skyLow: '#f2a541',
    sun: '#ffd97a',
    ground: '#6b4226',
    groundDark: '#4e2e1a',
    grass: '#7a9a3a',
    speed: 300,
    hazards: ['fence', 'haybale', 'puddle', 'oven'],
    powerups: ['corn', 'feather'],
    blurb: 'Past the coop, past the oven — run!',
  },
  {
    id: 'cornfield',
    name: 'CORNFIELD',
    from: 400,
    to: 900,
    skyTop: '#3a1c4e',
    skyMid: '#c65a28',
    skyLow: '#f7c04a',
    sun: '#ffe9a0',
    ground: '#7a4a22',
    groundDark: '#54331a',
    grass: '#c9a227',
    speed: 380,
    hazards: ['fence', 'haybale', 'pumpkin', 'pitchfork', 'knife'],
    powerups: ['corn', 'feather', 'egg'],
    blurb: 'The corn hides the farmer — and the knives.',
  },
  {
    id: 'woods',
    name: 'WOODS',
    from: 900,
    to: 1400,
    skyTop: '#12233d',
    skyMid: '#5a3a5e',
    skyLow: '#e07b39',
    sun: '#ffb36b',
    ground: '#3d2f1e',
    groundDark: '#2a2013',
    grass: '#4a6b2f',
    speed: 460,
    hazards: ['pumpkin', 'pitchfork', 'knife', 'oven', 'puddle'],
    powerups: ['corn', 'feather', 'egg', 'pie'],
    blurb: 'The free woods are just past the last fence.',
  },
];

// The seven hazards. w/h are the hitbox in px; clear tells the player how:
// 'jump' clears it in the air, 'slide' passes under it, 'dodge' means do not
// be standing where it lands. weight tunes how often the spawner picks it.
export const HAZARDS = {
  fence: { w: 26, h: 84, clear: 'jump', weight: 3, label: 'Fence' },
  haybale: { w: 64, h: 62, clear: 'jump', weight: 3, label: 'Hay bale' },
  puddle: { w: 72, h: 18, clear: 'jump', weight: 2, label: 'Mud puddle' },
  pumpkin: { w: 52, h: 52, clear: 'jump', weight: 2, label: 'Rolling pumpkin' },
  pitchfork: { w: 30, h: 110, clear: 'slide', weight: 2, label: 'Pitchfork' },
  knife: { w: 34, h: 96, clear: 'dodge', weight: 2, label: 'Carving knife' },
  oven: { w: 96, h: 100, clear: 'jump', weight: 1, label: 'The oven' },
  // The snare is never on the spawn table (weight 0): only the farmer plants
  // it, when he stops to set a trap. It counts as the eighth hazard.
  snare: { w: 44, h: 26, clear: 'jump', weight: 0, label: 'Farmer snare' },
};

// The four power-ups. dur is seconds the effect lasts (0 = instant).
export const POWERUPS = {
  corn: { w: 34, h: 34, dur: 0, label: 'Corn cob', effect: 'shield' },
  feather: { w: 36, h: 30, dur: DASH_TIME, label: 'Tail feather', effect: 'dash' },
  egg: { w: 30, h: 38, dur: 0, label: 'Golden egg', effect: 'heart' },
  pie: { w: 40, h: 30, dur: SLOWMO_TIME, label: 'Pumpkin pie', effect: 'slowmo' },
};

// The farmer's three moods. PATROL walks the back fence, CHASE sprints when
// the turkey stumbles, TRAP stops to plant a snare ahead of the run.
export const FARMER_MOODS = {
  patrol: { speed: 60, label: 'PATROL' },
  chase: { speed: 240, label: 'CHASE' },
  trap: { speed: 0, label: 'SETTING A TRAP' },
};

// Fixed seeds: the same seed replays the same run, so screenshots are stable.
export const SHOT_SEED = 20261127;
export const PLAY_SEED = 777;

// Clickable buttons, shared by the renderer (draws them) and input (hits them).
export const TITLE_BUTTON = { x: 460, y: 516, w: 360, h: 64 };
export const AGAIN_BUTTON = { x: 400, y: 500, w: 480, h: 64 };
export const TITLE2_BUTTON = { x: 490, y: 612, w: 300, h: 52 };

// Palette for the turkey, the farmer and the HUD — warm dusk, chunky shapes.
export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyDark: '#5e3a1a',
  turkeyLight: '#c98d4b',
  turkeyHead: '#d97b4f',
  wattle: '#c22f2f',
  beak: '#e8a33d',
  tailA: '#7a4a1e',
  tailB: '#a86a2c',
  tailC: '#d9a05b',
  farmerShirt: '#4a6b8a',
  farmerOveralls: '#3a4a6b',
  farmerSkin: '#e8b98a',
  farmerHat: '#d9c25b',
  farmerBeard: '#e8e0d0',
  hudBg: 'rgba(20, 10, 30, 0.72)',
  hudText: '#ffe9b0',
  hudAccent: '#ffb36b',
  danger: '#ff4d4d',
  ok: '#7ddc7d',
};
