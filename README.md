# GOBBLE RUN — a turkey's dash from the farmyard to the free woods

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/cashbags/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/cashbags/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**GOBBLE RUN** is an original turkey-escape game: outrun the farmer from the barnyard to the free woods — **3 zones, 8 hazards, 4 power-ups, 3 farmer moods, 2 endings**. Built for the [make.fun turkey escape game bounty](https://make.fun/c/turkey-run-game-01?ref=qrg7fvky).

Thanksgiving is coming. The oven is hot, the carving knife is sharp, and the farmer is already running. Reach the woods — 1,400 metres — and dinner is cancelled.

## How it plays

Run, jump and slide through three zones — Barnyard, Cornfield, Woods — dodging fences, hay bales, mud puddles, rolling pumpkins, pitchforks, falling carving knives and the oven itself, while the farmer patrols, chases and sets snares behind you. Grab corn for a shield, feathers for a dash, golden eggs for a heart, pumpkin pie to slow the world. Three hearts; lose them all, or let the farmer close the gap, and you are caught. Reach 1,400m and you are free.

- **Keys:** Space / ↑ jump · ↓ slide under the pitchfork · P pause · M mute · R restart · Enter starts
- **Mouse:** click the buttons, or click anywhere while playing to jump
- **Deterministic:** a seeded RNG deals every hazard, so the same seed replays the same run. Screenshots are real renders of the game's own code, staged by `game/src/shots.js` (`?shot=play|title|escaped|caught`).
- **Offline:** no network, no libraries, no audio files — sounds are WebAudio oscillators, art is canvas shapes drawn in `render.js`.

## Layout

| File | Job |
|---|---|
| `game/src/config.js` | every tunable number: physics, zones, palette, buttons |
| `game/src/random.js` | the seeded generator behind every roll |
| `game/src/turkey.js` | the bird: jump, slide, dash, stumble, shield, hearts |
| `game/src/farmer.js` | the hunter: patrol / chase / trap moods, the gap race |
| `game/src/hazards.js` | the 8 hazards: spawn, motion, hitboxes |
| `game/src/powerups.js` | the 4 power-ups: spawn, collection, bob |
| `game/src/zones.js` | the 3 zones: sky, speed, hazard mix, escape line |
| `game/src/world.js` | the whole game: state machine, score, collisions, endings |
| `game/src/input.js` | keyboard + mouse → world verbs |
| `game/src/render.js` | every pixel: dusk farm, turkey, farmer, HUD, screens |
| `game/src/audio.js` | WebAudio oscillator sounds |
| `game/src/shots.js` | deterministic screenshot scenes, no input, no clock |
| `game/src/main.js` | boot + fixed-step game loop |
| `main.ts` | hand-in program: copies `game/` + `screenshots/`, writes `dossier.json` |

## Run it

```sh
# play it locally (any static server)
python3 -m http.server 8080 --directory game
# hand it in (writes out/game, out/screenshots, out/dossier.json)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

`1-play` — cornfield mid-run, mid-jump over a fence, knife falling, farmer in CHASE, shield up · `2-title` — the title screen over the barnyard at dusk · `3-escaped` — the ESCAPED end screen in the woods · `4-caught` — the CAUGHT end screen.

## License

MIT — see [LICENSE](LICENSE).
