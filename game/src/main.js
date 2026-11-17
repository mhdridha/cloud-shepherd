// Cloud Shepherd — game loop, states and scoring. The loop owns one
// state object; the world moves it, the renderer draws it, the audio
// module hears it. Title -> playing -> day done -> playing -> over.
import { VIEW, FIELDS, TUNING } from './config.js';
import { mulberry32 } from './random.js';
import * as audio from './audio.js';
import { bindInput, drainKeys, takeClick, takeDragSegments, inRect } from './input.js';
import { createWorld, updateWorld, applyGust, floatText } from './world.js';
import { drawWorld, drawHUD, drawTitle, drawDayDone, drawGameOver, BTN_START, BTN_NEXT, BTN_RESTART } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  canvas.style.width = Math.floor(VIEW.w * scale) + 'px';
  canvas.style.height = Math.floor(VIEW.h * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
bindInput(canvas);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10) || 1;

function loadBest() {
  try {
    return parseInt(localStorage.getItem('shepherd-best') || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function freshState() {
  return {
    mode: 'title',
    now: 0,
    elapsed: 0, // time inside the current day
    day: 1,
    dayLeft: TUNING.dayLength,
    water: 0,
    saved: 0,
    dried: 0,
    combo: 0,
    bestCombo: 0,
    hearts: TUNING.hearts,
    lastRainField: -1,
    lastRainAt: -99,
    best: loadBest(),
    newBest: false,
  };
}

const state = freshState();
let world = createWorld(mulberry32(seed));
const g = { state, world, now: 0 };
let lastWhoosh = -99;

function saveBest() {
  try {
    localStorage.setItem('shepherd-best', String(state.best));
  } catch (e) {
    /* best score is a nicety, never fatal */
  }
}

function startDay() {
  world = createWorld(mulberry32((Math.random() * 1e9) | 0));
  g.world = world;
  state.elapsed = 0;
  state.dayLeft = TUNING.dayLength;
  state.combo = 0;
  state.lastRainField = -1;
  state.lastRainAt = -99;
  state.mode = 'playing';
  audio.unlockAudio();
}

function startRun() {
  const best = state.best;
  const fresh = freshState();
  fresh.best = best;
  Object.assign(state, fresh);
  startDay();
}

function endRun() {
  state.mode = 'over';
  audio.sfxGameOver();
  if (state.water > state.best) {
    state.best = Math.floor(state.water);
    state.newBest = true;
    saveBest();
  }
}

function applyEvents(events) {
  let rained = false;
  for (const ev of events) {
    if (ev.type === 'rain') {
      rained = true;
      // Combo: watering a different field within the window.
      if (ev.field !== state.lastRainField && state.now - state.lastRainAt <= TUNING.comboWindow) {
        state.combo += 1;
        if (state.combo > state.bestCombo) state.bestCombo = state.combo;
        if (state.combo === 2) audio.sfxCombo();
      } else if (ev.field !== state.lastRainField) {
        state.combo = 1;
      }
      state.lastRainField = ev.field;
      state.lastRainAt = state.now;
      const mult = Math.min(TUNING.maxMult, 1 + Math.min(state.combo, TUNING.comboCap) * 0.1);
      state.water += ev.amount * mult;
    } else if (ev.type === 'dry') {
      state.hearts -= 1;
      state.dried += 1;
      state.combo = 0;
      audio.sfxDry();
      floatText(world, ev.x, ev.y - 10, 'DRIED OUT!', '#ff5d73');
      if (state.hearts <= 0) endRun();
    } else if (ev.type === 'revive') {
      audio.sfxSave();
      floatText(world, ev.x, ev.y - 10, 'BACK!', '#2ec4b6');
    }
  }
  if (rained && Math.random() < 0.25) audio.sfxRainTick();
}

function update(dt) {
  state.now += dt;
  if (state.mode !== 'playing') return;

  state.elapsed += dt;
  state.dayLeft -= dt;
  if (state.dayLeft <= 0) {
    state.mode = 'daydone';
    audio.sfxDayClear();
    return;
  }

  // Combo fades when the rain stops.
  if (state.now - state.lastRainAt > TUNING.comboWindow) state.combo = 0;

  // A field pulled back from the brink counts as saved.
  for (let i = 0; i < FIELDS.length; i++) {
    const f = world.fields[i];
    if (f.thirst < 20) f.low = true;
    if (f.low && f.thirst > 50) {
      f.low = false;
      state.saved += 1;
      audio.sfxSave();
      floatText(world, (FIELDS[i].x0 + FIELDS[i].x1) / 2, FIELDS[i].y - 60, 'SAVED!', '#2ec4b6');
    }
  }

  const events = updateWorld(world, state, dt, Math.random);
  applyEvents(events);
}

function handleInput() {
  const keys = drainKeys();
  for (const k of keys) {
    if (k === 'm' || k === 'M') {
      audio.toggleMute();
      continue;
    }
    if (state.mode === 'title') {
      if (k === 'Enter' || k === ' ') {
        audio.unlockAudio();
        audio.sfxClick();
        startRun();
      }
      continue;
    }
    if (state.mode === 'daydone') {
      if (k === 'Enter' || k === ' ') {
        audio.sfxClick();
        state.day += 1;
        startDay();
      }
      continue;
    }
    if (state.mode === 'over') {
      if (k === 'r' || k === 'R' || k === 'Enter' || k === ' ') {
        audio.sfxClick();
        startRun();
      }
    }
  }

  const click = takeClick();
  if (click) {
    audio.unlockAudio();
    if (state.mode === 'title') {
      if (inRect(click, BTN_START)) {
        audio.sfxClick();
        startRun();
      }
    } else if (state.mode === 'daydone') {
      if (inRect(click, BTN_NEXT)) {
        audio.sfxClick();
        state.day += 1;
        startDay();
      }
    } else if (state.mode === 'over') {
      if (inRect(click, BTN_RESTART)) {
        audio.sfxClick();
        startRun();
      }
    }
  }

  // Drags blow the wind, only while playing.
  if (state.mode === 'playing') {
    const segs = takeDragSegments();
    let pushed = false;
    for (const s of segs) {
      if (applyGust(world, s.x1, s.y1, s.x2, s.y2)) pushed = true;
    }
    if (pushed && state.now - lastWhoosh > 0.25) {
      lastWhoosh = state.now;
      audio.sfxWhoosh();
    }
  } else {
    takeDragSegments();
  }
}

function render() {
  g.now = state.now;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawWorld(ctx, g);
  if (state.mode === 'playing' || state.mode === 'daydone') drawHUD(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'daydone') drawDayDone(ctx, state);
  if (state.mode === 'over') drawGameOver(ctx, state);
}

if (shot) {
  stageShot(g, shot, seed);
}

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
  last = t;
  handleInput();
  if (!shot) update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Keep the canvas honest about where the season stands for screen readers.
const statusEl = document.getElementById('status');
if (statusEl) {
  setInterval(() => {
    if (state.mode === 'playing') {
      statusEl.textContent =
        'Day ' + state.day + ', water ' + Math.floor(state.water) + ', fields saved ' + state.saved +
        ', hearts ' + state.hearts + ' of ' + TUNING.hearts + '.';
    }
  }, 1000);
}
