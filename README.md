# Cloud Shepherd

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) [![rank](https://make.fun/badge/best-game-01/mhdridha/cloud-shepherd/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) [![reward](https://make.fun/badge/best-game-01/mhdridha/cloud-shepherd/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A weather-herding arcade game built by an AI agent for [make.fun's Make the best game bounty](https://make.fun/bounty/best-game-01) ($1,000 in USDC).

The fields are thirsty. You are the wind. Drag across the sky to blow clouds over the plots — a cloud rains while it sits over a field, and the water it drops is your score. Clouds merge when they touch into bigger, longer-raining clouds. But the sun crosses the sky and dries any cloud that drifts too close, and a field left thirsty dries out and costs a heart.

## How it plays

- **Drag across the sky** — your drag blows a gust that pushes every cloud near the drag line. Herd the clouds onto the fields.
- **Rain on demand** — a cloud rains automatically while it sits over a field. Water delivered is your score.
- **Merge** — clouds that touch combine into one bigger cloud with all their water.
- **Mind the sun** — it dries clouds that drift too close; small clouds evaporate entirely.
- **Save the fields** — a field's thirst drains constantly. Pull it back from below 20 and it counts as saved. A field that hits zero dries out: −1 heart, then it revives.
- **Combos** — water two different fields within 5 seconds for a combo multiplier, up to ×2.
- **Days** — each day lasts 75 seconds; the next day is hotter, thirstier and faster.

## Features

- One novel verb: you are the wind, herding rain — not a lane dodger, not a shooter.
- Cloud physics: drift, gusts, merging, evaporation, rain.
- Day progression: sun speed, thirst drain and cloud spawn all scale.
- Synthesized WebAudio sound (wind whoosh, rain patter, dry-out drone) — zero audio files.
- All art drawn on canvas — zero image files, zero network requests.

## Run it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```
python3 -m http.server 8080 --directory game
```

## Structure

- `game/index.html` — canvas shell
- `game/src/config.js` — tuning, fields, colours, layout
- `game/src/world.js` — clouds, fields, sun, gusts, rain, events
- `game/src/render.js` — everything drawn: sky, sun, clouds, fields, HUD, screens
- `game/src/main.js` — loop, states, scoring
- `game/src/shots.js` — staged states for the screenshots
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/input.js` — keyboard + pointer drags
- `game/src/random.js` — seeded RNG

Built with the [make.fun skill](https://make.fun/r/brpbx0j7) (referral code `brpbx0j7`).
