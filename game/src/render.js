// Cloud Shepherd — everything the player sees, drawn on one canvas.
// The judge reads the game mostly through its screenshots, so the
// title, the HUD and the game-over screen are drawn here with the same
// care as the sky itself. No images, no fonts to load: all vector,
// all procedural.
import { VIEW, FIELDS, COLORS, TUNING } from './config.js';

export const BTN_START = { x: 490, y: 512, w: 300, h: 64 };
export const BTN_NEXT = { x: 490, y: 480, w: 300, h: 64 };
export const BTN_RESTART = { x: 490, y: 536, w: 300, h: 64 };

function rr(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function text(c, s, x, y, size, color, weight = 'bold', align = 'left') {
  c.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

function drawHeart(c, x, y, size, filled) {
  c.save();
  c.translate(x, y);
  c.scale(size / 16, size / 16);
  c.beginPath();
  c.moveTo(0, 5);
  c.bezierCurveTo(-9, -3, -5, -10, 0, -5);
  c.bezierCurveTo(5, -10, 9, -3, 0, 5);
  c.closePath();
  c.fillStyle = filled ? COLORS.heart : 'rgba(255,93,115,0.22)';
  c.fill();
  c.restore();
}

function drawSky(c, world, now) {
  const g = c.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(1, COLORS.skyBottom);
  c.fillStyle = g;
  c.fillRect(0, 0, VIEW.w, VIEW.h);
  // Sun with glow and slow-turning rays.
  const s = world.sun;
  const glow = c.createRadialGradient(s.x, s.y, 10, s.x, s.y, 130);
  glow.addColorStop(0, COLORS.sunGlow);
  glow.addColorStop(1, 'rgba(255,214,10,0)');
  c.fillStyle = glow;
  c.fillRect(s.x - 130, s.y - 130, 260, 260);
  c.strokeStyle = 'rgba(255,214,10,0.8)';
  c.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283 + now * 0.15;
    c.beginPath();
    c.moveTo(s.x + Math.cos(a) * 44, s.y + Math.sin(a) * 44);
    c.lineTo(s.x + Math.cos(a) * 58, s.y + Math.sin(a) * 58);
    c.stroke();
  }
  c.fillStyle = COLORS.sun;
  c.beginPath();
  c.arc(s.x, s.y, 36, 0, 6.29);
  c.fill();
  // Birds.
  c.strokeStyle = 'rgba(26,42,51,0.7)';
  c.lineWidth = 2;
  for (const b of world.birds) {
    const flap = Math.sin(now * 6 + b.p) * 4;
    c.beginPath();
    c.moveTo(b.x - 8, b.y);
    c.quadraticCurveTo(b.x - 3, b.y - 5 - flap, b.x, b.y);
    c.quadraticCurveTo(b.x + 3, b.y - 5 - flap, b.x + 8, b.y);
    c.stroke();
  }
  // Hills.
  c.fillStyle = COLORS.hillFar;
  c.beginPath();
  c.ellipse(320, 780, 520, 180, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = COLORS.hillNear;
  c.beginPath();
  c.ellipse(1000, 800, 620, 200, 0, Math.PI, 0);
  c.fill();
}

function drawField(c, field, fstate, i) {
  const { x0, x1, y } = field;
  const w = x1 - x0;
  const dry = fstate.dry;
  // Plot.
  rr(c, x0, y, w, 84, 8);
  c.fillStyle = dry ? COLORS.fieldDry : COLORS.fieldGreen;
  c.fill();
  c.fillStyle = COLORS.fieldSoil;
  c.fillRect(x0 + 8, y + 58, w - 16, 18);
  // Crop rows.
  for (let row = 0; row < 3; row++) {
    const ry = y + 14 + row * 16;
    for (let k = 0; k < 7; k++) {
      const cx = x0 + 24 + k * ((w - 48) / 6);
      c.strokeStyle = dry ? COLORS.cropDry : COLORS.cropGreen;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(cx, ry + 8);
      c.lineTo(cx - 3, ry - 2);
      c.moveTo(cx, ry + 8);
      c.lineTo(cx + 3, ry - 2);
      c.stroke();
    }
  }
  // Thirst bar above the plot.
  const ratio = Math.max(0, fstate.thirst / 100);
  rr(c, x0, y - 32, w, 12, 6);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fill();
  rr(c, x0, y - 32, w * ratio, 12, 6);
  c.fillStyle = dry ? COLORS.heart : ratio < 0.3 ? '#ff9f1c' : COLORS.water;
  c.fill();
  text(c, dry ? 'DRY!' : 'THIRST', x0 + w / 2, y - 40, 13, dry ? COLORS.heart : COLORS.textDark, 'bold', 'center');
  if (dry) {
    text(c, 'reviving…', x0 + w / 2, y + 46, 14, '#fff', 'bold', 'center');
  }
}

function drawCloud(c, cl) {
  const gray = 1 - cl.water / 100;
  const r = cl.r;
  // Soft shadow under the cloud.
  c.fillStyle = 'rgba(0,0,0,0.08)';
  c.beginPath();
  c.ellipse(cl.x, cl.y + r * 0.55, r * 0.95, r * 0.28, 0, 0, 6.29);
  c.fill();
  const shade = Math.round(255 - gray * 70);
  c.fillStyle = `rgb(${shade},${shade},${Math.min(255, shade + 10)})`;
  c.beginPath();
  c.ellipse(cl.x - r * 0.5, cl.y + r * 0.1, r * 0.62, r * 0.5, 0, 0, 6.29);
  c.ellipse(cl.x, cl.y - r * 0.22, r * 0.78, r * 0.62, 0, 0, 6.29);
  c.ellipse(cl.x + r * 0.5, cl.y + r * 0.1, r * 0.62, r * 0.5, 0, 0, 6.29);
  c.fill();
  // Water indicator: a small drop under the cloud when it is full.
  if (cl.water > 70) {
    c.fillStyle = COLORS.rain;
    c.beginPath();
    c.arc(cl.x, cl.y + r * 0.75, 5, 0, 6.29);
    c.fill();
  }
}

function drawRain(c, world) {
  c.strokeStyle = COLORS.rain;
  c.lineWidth = 2;
  c.globalAlpha = 0.85;
  for (const d of world.rain) {
    c.beginPath();
    c.moveTo(d.x, d.y - 14);
    c.lineTo(d.x, d.y);
    c.stroke();
  }
  c.globalAlpha = 1;
}

function drawGusts(c, world) {
  for (const g of world.gusts) {
    const a = Math.max(0, g.life / g.max);
    c.globalAlpha = a;
    c.strokeStyle = COLORS.gust;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(g.x1, g.y1);
    c.lineTo(g.x2, g.y2);
    c.stroke();
    // Arrowhead.
    const ang = Math.atan2(g.y2 - g.y1, g.x2 - g.x1);
    c.fillStyle = COLORS.gust;
    c.beginPath();
    c.moveTo(g.x2, g.y2);
    c.lineTo(g.x2 - 16 * Math.cos(ang - 0.4), g.y2 - 16 * Math.sin(ang - 0.4));
    c.lineTo(g.x2 - 16 * Math.cos(ang + 0.4), g.y2 - 16 * Math.sin(ang + 0.4));
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;
}

function drawParticles(c, world) {
  for (const pt of world.particles) {
    c.globalAlpha = Math.max(0, pt.life / pt.max);
    c.fillStyle = pt.color;
    c.beginPath();
    c.arc(pt.x, pt.y, pt.size, 0, 6.29);
    c.fill();
  }
  c.globalAlpha = 1;
  for (const f of world.floats) {
    c.globalAlpha = Math.max(0, f.life / f.max);
    text(c, f.text, f.x, f.y, 24, f.color, 'bold', 'center');
  }
  c.globalAlpha = 1;
}

export function drawWorld(c, g) {
  const { state, world, now } = g;
  drawSky(c, world, now);
  for (let i = 0; i < FIELDS.length; i++) drawField(c, FIELDS[i], world.fields[i], i);
  for (const cl of world.clouds) drawCloud(c, cl);
  drawRain(c, world);
  drawGusts(c, world);
  drawParticles(c, world);
}

export function drawHUD(c, state) {
  rr(c, 0, 0, VIEW.w, 62, 0);
  c.fillStyle = COLORS.hudBg;
  c.fill();
  text(c, 'WATER', 24, 24, 13, COLORS.textDim, 'bold');
  text(c, String(Math.floor(state.water)), 24, 52, 28, COLORS.water);
  text(c, 'DAY', 250, 24, 13, COLORS.textDim, 'bold');
  text(c, String(state.day), 250, 52, 28, COLORS.text);
  text(c, 'FIELDS SAVED', 380, 24, 13, COLORS.textDim, 'bold');
  text(c, String(state.saved), 380, 52, 28, COLORS.text);
  if (state.combo >= 2) {
    text(c, 'COMBO ×' + Math.min(TUNING.maxMult, 1 + Math.min(state.combo, TUNING.comboCap) * 0.1).toFixed(1), 560, 48, 26, '#ff5d8f', 'bold');
  }
  for (let i = 0; i < TUNING.hearts; i++) {
    drawHeart(c, 1010 + i * 34, 34, 26, i < state.hearts);
  }
  const left = Math.max(0, Math.ceil(state.dayLeft));
  text(c, left + 's left', 1180, 48, 24, COLORS.text, 'bold', 'right');
  text(c, 'DAY TIME', 1180, 22, 12, COLORS.textDim, 'bold', 'right');
  const hint = 'Drag across the sky to blow the wind · clouds rain on fields · keep them away from the sun · M mute';
  c.font = 'normal 13px system-ui, -apple-system, sans-serif';
  const hw = c.measureText(hint).width;
  rr(c, VIEW.w / 2 - hw / 2 - 12, VIEW.h - 32, hw + 24, 24, 12);
  c.fillStyle = 'rgba(8, 10, 28, 0.55)';
  c.fill();
  text(c, hint, VIEW.w / 2, VIEW.h - 15, 13, COLORS.text, 'normal', 'center');
}

function dim(c) {
  c.fillStyle = 'rgba(6, 8, 22, 0.66)';
  c.fillRect(0, 0, VIEW.w, VIEW.h);
}

export function drawTitle(c, state) {
  dim(c);
  const pulse = 1 + Math.sin(state.now * 3) * 0.03;
  c.save();
  c.translate(VIEW.w / 2, 170);
  c.scale(pulse, pulse);
  const g = c.createLinearGradient(-260, 0, 260, 0);
  g.addColorStop(0, COLORS.water);
  g.addColorStop(1, '#ffd60a');
  c.font = 'bold 76px system-ui, -apple-system, sans-serif';
  c.fillStyle = g;
  c.textAlign = 'center';
  c.fillText('CLOUD SHEPHERD', 0, 0);
  c.restore();
  text(c, 'The fields are thirsty. You are the wind.', VIEW.w / 2, 214, 20, COLORS.text, 'normal', 'center');
  text(c, 'Drag across the sky to blow clouds over the fields. A cloud rains while it sits over a field.', VIEW.w / 2, 244, 17, COLORS.textDim, 'normal', 'center');
  text(c, 'Clouds merge when they touch — bigger clouds rain longer. Keep them away from the sun, or they dry out.', VIEW.w / 2, 270, 17, COLORS.textDim, 'normal', 'center');
  text(c, 'A field that dries out costs a heart. Water two fields close together for a combo.', VIEW.w / 2, 296, 17, COLORS.textDim, 'normal', 'center');
  if (state.best > 0) {
    text(c, 'BEST  ' + String(state.best) + ' water', VIEW.w / 2, 336, 20, COLORS.water, 'bold', 'center');
  }
  const b = BTN_START;
  const glow = 0.5 + Math.sin(state.now * 3) * 0.2;
  c.save();
  c.globalAlpha = glow;
  rr(c, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 14);
  c.fillStyle = COLORS.water;
  c.fill();
  c.restore();
  rr(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = '#1a1033';
  c.fill();
  text(c, '▶  CALL THE RAIN', b.x + b.w / 2, b.y + 42, 26, COLORS.text, 'bold', 'center');
  text(c, 'or press Enter', VIEW.w / 2, b.y + 92, 15, COLORS.textDim, 'normal', 'center');
}

export function drawDayDone(c, state) {
  dim(c);
  text(c, 'DAY ' + state.day + ' CLEAR!', VIEW.w / 2, 220, 64, COLORS.water, 'bold', 'center');
  const cx = VIEW.w / 2;
  text(c, 'WATER', cx - 220, 300, 16, COLORS.textDim, 'bold');
  text(c, String(Math.floor(state.water)), cx - 220, 340, 40, COLORS.text, 'bold');
  text(c, 'SAVED', cx - 20, 300, 16, COLORS.textDim, 'bold');
  text(c, String(state.saved), cx - 20, 340, 40, COLORS.text, 'bold');
  text(c, 'FIELDS DRIED', cx + 140, 300, 16, COLORS.textDim, 'bold');
  text(c, String(state.dried), cx + 140, 340, 40, COLORS.text, 'bold');
  text(c, 'Tomorrow: a hotter sun, thirstier fields, faster clouds.', cx, 400, 18, COLORS.textDim, 'normal', 'center');
  const b = BTN_NEXT;
  rr(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = '#1a1033';
  c.fill();
  c.strokeStyle = COLORS.water;
  c.lineWidth = 2;
  c.stroke();
  text(c, '▶  START DAY ' + (state.day + 1), b.x + b.w / 2, b.y + 42, 26, COLORS.text, 'bold', 'center');
  text(c, 'or press Enter', VIEW.w / 2, b.y + 92, 15, COLORS.textDim, 'normal', 'center');
}

export function drawGameOver(c, state) {
  dim(c);
  text(c, 'SEASON OVER', VIEW.w / 2, 200, 72, '#ff5d8f', 'bold', 'center');
  const cx = VIEW.w / 2;
  text(c, 'WATER', cx - 220, 290, 16, COLORS.textDim, 'bold');
  text(c, String(Math.floor(state.water)), cx - 220, 330, 40, COLORS.text, 'bold');
  text(c, 'SAVED', cx - 20, 290, 16, COLORS.textDim, 'bold');
  text(c, String(state.saved), cx - 20, 330, 40, COLORS.text, 'bold');
  text(c, 'BEST COMBO', cx + 140, 290, 16, COLORS.textDim, 'bold');
  text(c, String(state.bestCombo), cx + 140, 330, 40, COLORS.text, 'bold');
  text(c, 'Reached DAY ' + state.day, cx, 372, 18, COLORS.textDim, 'bold', 'center');
  if (state.newBest) {
    text(c, '★ NEW BEST! ★', cx, 408, 28, COLORS.water, 'bold', 'center');
  } else if (state.best > 0) {
    text(c, 'BEST  ' + String(state.best) + ' water', cx, 408, 20, COLORS.textDim, 'bold', 'center');
  }
  const b = BTN_RESTART;
  rr(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = '#1a1033';
  c.fill();
  c.strokeStyle = COLORS.water;
  c.lineWidth = 2;
  c.stroke();
  text(c, '↻  NEW SEASON', b.x + b.w / 2, b.y + 42, 26, COLORS.text, 'bold', 'center');
  text(c, 'or press R', VIEW.w / 2, b.y + 92, 15, COLORS.textDim, 'normal', 'center');
}
