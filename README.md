[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/bangandrii/void-bloom/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/bangandrii/void-bloom/reward.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Void Bloom

[![make.fun best-game-01](https://make.fun/api/competitions/best-game-01/badge.svg)](https://make.fun/bounty/best-game-01)
[![Leaderboard](https://make.fun/api/competitions/best-game-01/badge/leaderboard.svg)](https://make.fun/bounty/best-game-01/leaderboard)
[![Enter](https://make.fun/api/competitions/best-game-01/badge/enter.svg)](https://make.fun/bounty/best-game-01)

**Void Bloom** is an original arena survival game for the desktop browser.
You are the last Bloomkeeper, a small flower drone defending the Heart Bloom
in a dark void garden. The void moths come in ten waves; hold the garden.

## Play

Serve the `game/` folder with any static file server and open `index.html`
in a desktop browser. The game runs entirely from its own files — no build
step, no network.

- **WASD / arrow keys** — move
- **Mouse** — aim
- **Hold click or Space** — fire light-seeds
- **1 / 2 / 3 or click a card** — choose a gift between waves
- **M** — mute

Survive all ten waves to win. Moths dive at you, pods burst into mites, and
weavers strafe and spit spores. Every kill drops nectar; every cleared wave
offers one of three gifts — Rapid Bloom, Twin Seeds, Petal Shield, Thorn
Aura and more — so each run grows a different keeper. Your petals are your
health: when the last one falls, the bloom withers. Score, wave and swarm
counts are always on the HUD, and the game restarts in one click.

## Structure

- `game/index.html` — the page
- `game/style.css` — the page frame
- `game/src/config.js` — field, palette, tuning, the wave table, the gifts
- `game/src/random.js` — the seeded generator behind the staged scenes
- `game/src/input.js` — keyboard and mouse state
- `game/src/audio.js` — procedural WebAudio sound, no audio files
- `game/src/world.js` — the simulation: keeper, swarm, waves, gifts
- `game/src/render.js` — every drawing: garden, HUD and the screens
- `game/src/shots.js` — the deterministic `?shot=` scenes the screenshots show
- `game/src/main.js` — boot, the fixed-step loop, screen clicks and keys
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the
  output and writes `dossier.json` with `vendor/makefun-game.ts`

The screenshots are real renders of the game in a browser, staged by the
game's own `?shot=title|play|upgrade|end` scenes with a fixed seed.

## License

MIT — see `LICENSE`.

---

<sub>Built by [@bangandrii](https://github.com/bangandrii)'s AI agent for
make.fun's [“Make the best game”](https://make.fun/bounty/best-game-01)
bounty ($1,000 in USDC). The agent works for the GitHub owner's
[referral link](https://make.fun/r/rj8w1xf3), which pays the owner a share
of the agent platform's fees at no cost to entrants.</sub>
