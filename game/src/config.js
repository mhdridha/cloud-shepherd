// Cloud Shepherd — tuning, colours and layout. One file owns every
// number the game runs on, so a balance change is one edit.
export const VIEW = { w: 1280, h: 720 };

export const COLORS = {
  skyTop: '#7ec8e3',
  skyMid: '#a8d8ea',
  skyBottom: '#ffe8b3',
  hillFar: '#8fae7a',
  hillNear: '#6b9a5a',
  fieldGreen: '#4c9a3f',
  fieldDry: '#b08954',
  fieldSoil: '#5a3d24',
  cropGreen: '#7ed957',
  cropDry: '#c9a227',
  cloudWhite: '#ffffff',
  cloudGray: '#c9d1d9',
  sun: '#ffd60a',
  sunGlow: 'rgba(255,214,10,0.35)',
  rain: '#5aa9e6',
  hudBg: 'rgba(8, 10, 28, 0.88)',
  text: '#f4f1de',
  textDim: '#9a97b5',
  textDark: '#1a2a33',
  heart: '#ff5d73',
  water: '#2ec4b6',
  gust: 'rgba(255,255,255,0.75)',
};

// Three fields the rain must reach. x0..x1 is the plot, y is the ground.
export const FIELDS = [
  { x0: 170, x1: 470, y: 580 },
  { x0: 500, x1: 800, y: 580 },
  { x0: 830, x1: 1130, y: 580 },
];

export const TUNING = {
  hearts: 3, // dried-out fields before the season ends
  dayLength: 75, // seconds per day
  thirstStart: 70, // a field's thirst when the day begins
  thirstDrain: 1.2, // thirst lost per second on day 1
  thirstDrainPerDay: 0.25, // extra drain each later day
  thirstRevive: 45, // thirst a dried field comes back with
  dryReviveTime: 3, // seconds a dried field stays brown before reviving
  rainRate: 9, // thirst refilled per second while a cloud rains on a field
  waterScore: 1, // score per unit of water delivered
  cloudSpawn: 5, // seconds between cloud spawns on day 1
  cloudSpawnPerDay: 0.92, // spawns get 8% closer each day
  cloudSpawnMin: 2.8,
  cloudWaterMin: 45, // a new cloud's water
  cloudWaterMax: 85,
  cloudRadiusMin: 38,
  cloudRadiusMax: 62,
  sunDry: 6, // water a cloud loses per second near the sun
  sunDryRange: 190, // px from the sun where drying applies
  gustRange: 130, // px from a gust line where clouds get pushed
  gustForce: 420, // px/s push a full drag applies
  mergeDist: 0.8, // merge when centres are closer than this x (r1+r2)
  comboWindow: 5, // seconds to water a second field for a combo
  comboCap: 10,
  maxMult: 2,
};
