// Cloud Shepherd — staged states for screenshots (?shot=start|play|end).
// A shot freezes the game in one deterministic frame, so the three
// screenshots show the title, a mid-run moment and the game-over screen
// exactly as a player sees them, with no interaction needed.
import { FIELDS } from './config.js';

function radius(water) {
  return 38 + (water / 100) * 24;
}

function cloud(x, y, water, vx = 0, vy = 0, drift = 0) {
  return { x, y, vx, vy, drift, water, r: radius(water) };
}

export function stageShot(g, which, seed) {
  const { state, world } = g;
  void seed;
  world.clouds = [];
  world.rain = [];
  world.gusts = [];
  world.particles = [];
  world.floats = [];
  state.now = 1.2;

  if (which === 'start') {
    state.mode = 'title';
    state.best = 480;
    world.sun = { x: 200, y: 150 };
    world.clouds = [
      cloud(300, 180, 80, 12, 0, 12),
      cloud(640, 140, 60, -10, 0, -10),
      cloud(980, 200, 75, 14, 0, 14),
    ];
    world.fields = [
      { thirst: 70, dry: false, dryTimer: 0 },
      { thirst: 55, dry: false, dryTimer: 0 },
      { thirst: 80, dry: false, dryTimer: 0 },
    ];
    return;
  }

  if (which === 'play') {
    state.mode = 'playing';
    state.elapsed = 43;
    state.day = 2;
    state.dayLeft = 32;
    state.water = 640;
    state.saved = 5;
    state.dried = 0;
    state.combo = 3;
    state.bestCombo = 4;
    state.hearts = 3;
    state.best = 860;
    state.lastRainField = 1;
    state.lastRainAt = state.now - 1;
    world.sun = { x: 640, y: 100 };
    world.clouds = [
      cloud(650, 200, 70, 0, 0, 0),
      cloud(950, 160, 45, -12, 0, -12),
      cloud(320, 260, 30, 16, 0, 16),
    ];
    world.rain = [
      { x: 620, y: 300, vy: 420 },
      { x: 650, y: 340, vy: 430 },
      { x: 680, y: 280, vy: 410 },
      { x: 640, y: 380, vy: 440 },
      { x: 665, y: 320, vy: 425 },
    ];
    world.gusts = [{ x1: 420, y1: 220, x2: 600, y2: 190, life: 0.35, max: 0.45 }];
    world.floats = [{ x: 650, y: 300, text: '+12', color: '#2ec4b6', life: 0.9, max: 1.1 }];
    world.fields = [
      { thirst: 32, dry: false, dryTimer: 0 },
      { thirst: 82, dry: false, dryTimer: 0 },
      { thirst: 50, dry: false, dryTimer: 0 },
    ];
    return;
  }

  // 'end' (and anything else): the game-over screen.
  state.mode = 'over';
  state.day = 3;
  state.water = 860;
  state.saved = 9;
  state.dried = 2;
  state.bestCombo = 5;
  state.hearts = 0;
  state.best = 860;
  state.newBest = true;
  world.sun = { x: 1080, y: 140 };
  world.clouds = [
    cloud(420, 200, 55, 10, 0, 10),
    cloud(900, 160, 40, -12, 0, -12),
  ];
  world.fields = [
    { thirst: 25, dry: false, dryTimer: 0 },
    { thirst: 0, dry: true, dryTimer: 2 },
    { thirst: 45, dry: false, dryTimer: 0 },
  ];
  void FIELDS;
}
