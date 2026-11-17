// Cloud Shepherd — the world: clouds, fields, the sun and the wind.
// Clouds drift, merge when they touch, rain when they sit over a field,
// and dry out near the sun. A gust is a drag the player draws on the
// sky: clouds near the drag line get pushed along it. updateWorld
// returns the events the run scored on this frame.
import { VIEW, FIELDS, TUNING } from './config.js';
import { pick, range } from './random.js';

function cloudRadius(water) {
  return TUNING.cloudRadiusMin + (water / 100) * (TUNING.cloudRadiusMax - TUNING.cloudRadiusMin);
}

export function createWorld(rng) {
  const birds = [];
  for (let i = 0; i < 5; i++) {
    birds.push({ x: rng() * VIEW.w, y: range(rng, 60, 200), vx: range(rng, 18, 34), p: rng() * 6.28 });
  }
  return {
    birds,
    clouds: [],
    fields: FIELDS.map(() => ({ thirst: TUNING.thirstStart, dry: false, dryTimer: 0 })),
    sun: { x: 120, y: 150 },
    spawnIn: 1.2,
    gusts: [], // {x1,y1,x2,y2,life,max}
    rain: [], // falling drops {x,y,vy}
    floats: [],
    particles: [],
  };
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.1, max: 1.1 });
}

function spawnCloud(world, state, rng) {
  const fromLeft = rng() < 0.5;
  const water = range(rng, TUNING.cloudWaterMin, TUNING.cloudWaterMax);
  world.clouds.push({
    x: fromLeft ? -70 : VIEW.w + 70,
    y: range(rng, 90, 320),
    vx: fromLeft ? range(rng, 10, 22) : -range(rng, 10, 22),
    vy: 0,
    drift: fromLeft ? range(rng, 10, 22) : -range(rng, 10, 22),
    water,
    r: cloudRadius(water),
  });
}

// Which field (if any) sits under this x?
export function fieldForX(x) {
  for (let i = 0; i < FIELDS.length; i++) {
    if (x >= FIELDS[i].x0 && x <= FIELDS[i].x1) return i;
  }
  return -1;
}

// A drag from (x1,y1) to (x2,y2) pushes every cloud near the drag line.
export function applyGust(world, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 12) return false;
  const ux = dx / len;
  const uy = dy / len;
  const force = Math.min(1, len / 220) * TUNING.gustForce;
  let pushed = false;
  for (const c of world.clouds) {
    // Distance from the cloud centre to the drag segment.
    const t = Math.max(0, Math.min(1, ((c.x - x1) * dx + (c.y - y1) * dy) / (len * len)));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const d = Math.hypot(c.x - px, c.y - py);
    if (d < TUNING.gustRange) {
      const fall = 1 - d / TUNING.gustRange;
      c.vx += ux * force * fall;
      c.vy += uy * force * fall * 0.6;
      pushed = true;
    }
  }
  world.gusts.push({ x1, y1, x2, y2, life: 0.45, max: 0.45 });
  return pushed;
}

export function updateWorld(world, state, dt, rng) {
  const events = [];
  const progress = Math.min(1, state.elapsed / TUNING.dayLength);
  world.sun.x = 120 + progress * 1040;
  world.sun.y = 150 - Math.sin(progress * Math.PI) * 50;

  // New clouds drift in.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnCloud(world, state, rng);
    const interval = Math.max(TUNING.cloudSpawnMin, TUNING.cloudSpawn * Math.pow(TUNING.cloudSpawnPerDay, state.day - 1));
    world.spawnIn = interval * range(rng, 0.85, 1.2);
  }

  // Fields dry out; a dry field revives after a while.
  const drain = TUNING.thirstDrain + (state.day - 1) * TUNING.thirstDrainPerDay;
  for (let i = 0; i < FIELDS.length; i++) {
    const f = world.fields[i];
    if (f.dry) {
      f.dryTimer -= dt;
      if (f.dryTimer <= 0) {
        f.dry = false;
        f.thirst = TUNING.thirstRevive;
        events.push({ type: 'revive', field: i, x: (FIELDS[i].x0 + FIELDS[i].x1) / 2, y: FIELDS[i].y - 40 });
      }
      continue;
    }
    f.thirst -= drain * dt;
    if (f.thirst <= 0) {
      f.thirst = 0;
      f.dry = true;
      f.dryTimer = TUNING.dryReviveTime;
      events.push({ type: 'dry', field: i, x: (FIELDS[i].x0 + FIELDS[i].x1) / 2, y: FIELDS[i].y - 40 });
    }
  }

  // Clouds: drift, rain on fields, dry near the sun, merge, evaporate.
  for (const c of world.clouds) {
    c.vx += (c.drift - c.vx) * 0.4 * dt;
    c.vy *= 1 - 0.8 * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    if (c.x < -80) { c.x = -80; c.vx = Math.abs(c.vx) * 0.5; }
    if (c.x > VIEW.w + 80) { c.x = VIEW.w + 80; c.vx = -Math.abs(c.vx) * 0.5; }
    if (c.y < 70) { c.y = 70; c.vy = 0; }
    if (c.y > 480) { c.y = 480; c.vy = 0; }

    const field = fieldForX(c.x);
    if (field >= 0 && !world.fields[field].dry && c.y < 520) {
      // Raining on a field: water flows, the cloud empties.
      const amount = TUNING.rainRate * dt;
      const give = Math.min(amount, c.water);
      world.fields[field].thirst = Math.min(100, world.fields[field].thirst + amount);
      c.water -= give;
      if (give > 0) events.push({ type: 'rain', field, amount: give, x: c.x, y: c.y + c.r });
      if (rng() < dt * 14) {
        world.rain.push({ x: c.x + range(rng, -c.r * 0.7, c.r * 0.7), y: c.y + c.r * 0.5, vy: range(rng, 380, 460) });
      }
    }
    // The sun dries clouds that drift too close.
    const sd = Math.hypot(c.x - world.sun.x, c.y - world.sun.y);
    if (sd < TUNING.sunDryRange) {
      c.water -= TUNING.sunDry * (1 - sd / TUNING.sunDryRange) * dt;
    }
    c.r = cloudRadius(Math.max(0, c.water));
  }
  // Merge touching clouds into one bigger cloud.
  for (let i = 0; i < world.clouds.length; i++) {
    for (let j = i + 1; j < world.clouds.length; j++) {
      const a = world.clouds[i];
      const b = world.clouds[j];
      if (!a || !b) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < TUNING.mergeDist * (a.r + b.r)) {
        a.water = Math.min(100, a.water + b.water);
        a.x = (a.x + b.x) / 2;
        a.y = (a.y + b.y) / 2;
        a.r = cloudRadius(a.water);
        world.clouds.splice(j, 1);
        j--;
      }
    }
  }
  // Evaporated clouds puff away.
  world.clouds = world.clouds.filter((c) => {
    if (c.water <= 0) {
      for (let k = 0; k < 8; k++) {
        world.particles.push({
          x: c.x + range(Math.random, -c.r, c.r), y: c.y + range(Math.random, -14, 14),
          vx: range(Math.random, -30, 30), vy: range(Math.random, -50, -10),
          life: range(Math.random, 0.4, 0.8), max: 0.8, color: 'rgba(230,230,255,0.8)', size: range(Math.random, 3, 6),
        });
      }
      return false;
    }
    return true;
  });

  // Rain drops fall to the field.
  for (const drop of world.rain) drop.y += drop.vy * dt;
  world.rain = world.rain.filter((drop) => drop.y < FIELDS[0].y + 30);

  // Birds drift across.
  for (const b of world.birds) {
    b.x += b.vx * dt;
    if (b.x > VIEW.w + 20) { b.x = -20; b.y = range(rng, 60, 200); }
  }

  // Gusts fade; particles and floats age.
  for (const g of world.gusts) g.life -= dt;
  world.gusts = world.gusts.filter((g) => g.life > 0);
  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  for (const f of world.floats) {
    f.y -= 42 * dt;
    f.life -= dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);

  return events;
}

export function floatText(world, x, y, text, color) {
  addFloat(world, x, y, text, color);
}
