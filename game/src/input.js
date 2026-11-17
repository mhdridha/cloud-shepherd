// Cloud Shepherd — keyboard and pointer input. Keys fire edge-triggered
// actions through a small queue the game loop drains; held keys are
// readable as a live set. Clicks land in logical canvas coordinates, so
// menu buttons work at any window size. Drags are recorded as segments
// the game turns into wind gusts.
import { VIEW } from './config.js';

const pressed = new Set();
const queue = [];
let mouse = { x: 0, y: 0, clicked: false };
let dragging = false;
let lastPos = null;
const dragSegments = [];
let canvas = null;

function toLogical(canvasEl, e) {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * VIEW.w,
    y: ((e.clientY - rect.top) / rect.height) * VIEW.h,
  };
}

export function bindInput(canvasEl) {
  canvas = canvasEl;
  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      pressed.add(e.key);
      queue.push(e.key);
    }
  });
  window.addEventListener('keyup', (e) => pressed.delete(e.key));
  window.addEventListener('blur', () => pressed.clear());
  canvasEl.addEventListener('pointerdown', (e) => {
    const p = toLogical(canvasEl, e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.clicked = true;
    dragging = true;
    lastPos = p;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || !canvas) return;
    const p = toLogical(canvas, e);
    if (lastPos) dragSegments.push({ x1: lastPos.x, y1: lastPos.y, x2: p.x, y2: p.y });
    lastPos = p;
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    lastPos = null;
  });
  window.addEventListener('pointercancel', () => {
    dragging = false;
    lastPos = null;
  });
}

export function drainKeys() {
  const out = queue.splice(0, queue.length);
  return out;
}

export function keyHeld(key) {
  return pressed.has(key);
}

export function takeClick() {
  if (!mouse.clicked) return null;
  mouse.clicked = false;
  return { x: mouse.x, y: mouse.y };
}

// Drag segments drawn since the last call (empty when not dragging).
export function takeDragSegments() {
  return dragSegments.splice(0, dragSegments.length);
}

export function isDragging() {
  return dragging;
}

export function inRect(p, r) {
  return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}
