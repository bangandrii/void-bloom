// The world of Void Bloom: the keeper, the void swarm, seeds, spores and
// nectar, the ten waves that send them, and the gifts between waves. This is
// the pure simulation: step(dt, control) advances everything one frame and
// render.js only draws what the state holds. Sounds are fired from here
// through audio.js, whose calls are no-ops until the first user gesture.

import { ENEMY_KINDS, FIELD, PLAYER, UPGRADES, WAVES, FINAL_WAVE } from './config.js';
import { sfx } from './audio.js';

export const SCREEN = { TITLE: 'title', PLAY: 'play', UPGRADE: 'upgrade', OVER: 'over', WIN: 'win' };

const TAU = Math.PI * 2;
const ARENA_MARGIN = 26;
const MAX_ALIVE = 42;

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function createWorld(rng) {
  const state = {
    screen: SCREEN.TITLE,
    time: 0,
    wave: 0,
    score: 0,
    best: 0,
    nectar: 0,
    kills: 0,
    player: null,
    enemies: [],
    seeds: [],
    spores: [],
    orbs: [],
    particles: [],
    texts: [],
    spawnQueue: [],
    spawnTimer: 0,
    offers: [],
    banner: '',
    bannerTimer: 0,
    shake: 0,
    hurtFlash: 0,
  };

  function freshPlayer() {
    return {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      angle: -Math.PI / 2,
      petals: PLAYER.maxPetals,
      maxPetals: PLAYER.maxPetals,
      cooldown: 0,
      invulnerable: 0,
      speedMul: 1,
      fireMul: 1,
      seedsPerShot: 1,
      seedDamage: PLAYER.seedDamage,
      magnetMul: 1,
      thorns: 0,
    };
  }

  function burst(x, y, color, count, speed = 160) {
    for (let i = 0; i < count; i += 1) {
      const angle = rng.range(0, TAU);
      const velocity = rng.range(speed * 0.25, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: rng.range(0.25, 0.6),
        maxLife: 0.6,
        color,
        size: rng.range(1.5, 3.5),
      });
    }
  }

  function popup(x, y, text, color) {
    state.texts.push({ x, y, text, color, life: 1.05 });
  }

  function startGame() {
    state.player = freshPlayer();
    state.enemies = [];
    state.seeds = [];
    state.spores = [];
    state.orbs = [];
    state.particles = [];
    state.texts = [];
    state.score = 0;
    state.nectar = 0;
    state.kills = 0;
    state.time = 0;
    startWave(1);
  }

  function startWave(wave) {
    state.wave = wave;
    const plan = WAVES[wave - 1];
    const queue = [];
    for (const kind of Object.keys(plan)) {
      for (let i = 0; i < plan[kind]; i += 1) queue.push(kind);
    }
    // Shuffle the plan so kinds arrive mixed, then send them in a stream.
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng.next() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    state.spawnQueue = queue;
    state.spawnTimer = 0.8;
    state.banner = `WAVE ${wave}`;
    state.bannerTimer = 2.2;
    state.screen = SCREEN.PLAY;
    sfx.wave();
  }

  function spawnEnemy(kind) {
    const spec = ENEMY_KINDS[kind];
    // Enter from a random edge, never right on top of the keeper.
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries += 1) {
      const edge = rng.int(0, 3);
      x = edge === 0 ? 30 : edge === 1 ? FIELD.width - 30 : rng.range(40, FIELD.width - 40);
      y = edge === 2 ? 30 : edge === 3 ? FIELD.height - 30 : rng.range(40, FIELD.height - 40);
      if (state.player === null || distance({ x, y }, state.player) > 260) break;
    }
    state.enemies.push({
      kind, x, y,
      hp: spec.hp,
      radius: spec.radius,
      speed: spec.speed * rng.range(0.9, 1.1),
      score: spec.score,
      nectar: spec.nectar,
      wobble: rng.range(0, TAU),
      fireTimer: rng.range(1.6, 3.2),
      thornTick: 0,
    });
  }

  function hurtPlayer() {
    const player = state.player;
    if (player.invulnerable > 0 || state.screen !== SCREEN.PLAY) return;
    player.petals -= 1;
    player.invulnerable = PLAYER.invulnerableSeconds;
    state.shake = 9;
    state.hurtFlash = 0.35;
    burst(player.x, player.y, '#ff5d8f', 16, 220);
    sfx.hurt();
    // The shock knocks the swarm back, so one touch costs one petal only.
    for (const enemy of state.enemies) {
      const d = distance(enemy, player);
      if (d > 0 && d < 90) {
        enemy.x += ((enemy.x - player.x) / d) * (90 - d);
        enemy.y += ((enemy.y - player.y) / d) * (90 - d);
      }
    }
    if (player.petals <= 0) {
      state.screen = SCREEN.OVER;
      state.best = Math.max(state.best, state.score);
      burst(player.x, player.y, '#ffb3c9', 42, 300);
      sfx.over();
    }
  }

  function killEnemy(enemy) {
    state.kills += 1;
    state.score += enemy.score;
    popup(enemy.x, enemy.y - 10, `+${enemy.score}`, '#ffd166');
    burst(enemy.x, enemy.y, enemy.kind === 'pod' ? '#ef476f' : '#9b5de5', enemy.kind === 'pod' ? 20 : 11, 190);
    for (let i = 0; i < enemy.nectar; i += 1) {
      state.orbs.push({
        x: enemy.x + rng.range(-12, 12),
        y: enemy.y + rng.range(-12, 12),
        vx: rng.range(-30, 30),
        vy: rng.range(-30, 30),
        life: 24,
      });
    }
    if (enemy.kind === 'pod') {
      // A bursting pod scorches the swarm crowding around it.
      for (const other of state.enemies) {
        if (other !== enemy && other.hp > 0 && distance(other, enemy) < 74) {
          other.hp -= 2;
          burst(other.x, other.y, '#ef476f', 3, 130);
        }
      }
      for (let i = 0; i < 2; i += 1) {
        const spec = ENEMY_KINDS.mite;
        state.enemies.push({
          kind: 'mite', x: enemy.x + rng.range(-16, 16), y: enemy.y + rng.range(-16, 16),
          hp: spec.hp, radius: spec.radius, speed: spec.speed, score: spec.score,
          nectar: spec.nectar, wobble: rng.range(0, TAU), fireTimer: 0, thornTick: 0,
        });
      }
    }
    sfx.kill();
  }

  function offerUpgrades() {
    const pool = [...UPGRADES];
    const offers = [];
    while (offers.length < 3 && pool.length > 0) {
      const index = Math.floor(rng.next() * pool.length);
      offers.push(pool.splice(index, 1)[0]);
    }
    state.offers = offers;
    state.screen = SCREEN.UPGRADE;
  }

  function applyUpgrade(id) {
    const player = state.player;
    if (id === 'rapid') player.fireMul *= 0.7;
    if (id === 'twin') player.seedsPerShot = Math.min(5, player.seedsPerShot + 1);
    if (id === 'heavy') player.seedDamage += 1;
    if (id === 'shield') { player.maxPetals += 1; player.petals = Math.min(player.maxPetals, player.petals + 2); }
    if (id === 'swift') player.speedMul *= 1.15;
    if (id === 'magnet') player.magnetMul *= 2;
    if (id === 'thorns') player.thorns += 1;
    if (id === 'mend') player.petals = Math.min(player.maxPetals, player.petals + 3);
    state.offers = [];
    sfx.upgrade();
    startWave(state.wave + 1);
  }

  function fireSeeds(player) {
    const count = player.seedsPerShot;
    for (let i = 0; i < count; i += 1) {
      const spread = (i - (count - 1) / 2) * 0.09;
      const angle = player.angle + spread;
      state.seeds.push({
        x: player.x + Math.cos(player.angle) * (PLAYER.radius + 6),
        y: player.y + Math.sin(player.angle) * (PLAYER.radius + 6),
        vx: Math.cos(angle) * PLAYER.seedSpeed,
        vy: Math.sin(angle) * PLAYER.seedSpeed,
        damage: player.seedDamage,
        life: 1.1,
      });
    }
    player.cooldown = PLAYER.fireCooldown * player.fireMul;
    burst(player.x + Math.cos(player.angle) * (PLAYER.radius + 8), player.y + Math.sin(player.angle) * (PLAYER.radius + 8), '#6ef3ff', 2, 70);
    sfx.shoot();
  }

  function stepPlay(dt, control) {
    const player = state.player;
    state.time += dt;

    // The keeper moves and aims.
    const axis = control.axis;
    player.x = Math.min(FIELD.width - ARENA_MARGIN, Math.max(ARENA_MARGIN, player.x + axis.x * PLAYER.speed * player.speedMul * dt));
    player.y = Math.min(FIELD.height - ARENA_MARGIN, Math.max(ARENA_MARGIN, player.y + axis.y * PLAYER.speed * player.speedMul * dt));
    player.angle = Math.atan2(control.aim.y - player.y, control.aim.x - player.x);
    player.cooldown -= dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (control.firing && player.cooldown <= 0) fireSeeds(player);

    // The wave streams in.
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0 && state.enemies.length < MAX_ALIVE) {
        spawnEnemy(state.spawnQueue.shift());
        state.spawnTimer = Math.max(0.32, 1.05 - state.wave * 0.06);
      }
    }

    // Seeds fly and strike.
    for (const seed of state.seeds) {
      seed.x += seed.vx * dt;
      seed.y += seed.vy * dt;
      seed.life -= dt;
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && distance(seed, enemy) < enemy.radius + 4) {
          enemy.hp -= seed.damage;
          seed.life = 0;
          burst(seed.x, seed.y, '#6ef3ff', 3, 120);
          sfx.hit();
          break;
        }
      }
    }
    state.seeds = state.seeds.filter((seed) => seed.life > 0 && seed.x > -20 && seed.x < FIELD.width + 20 && seed.y > -20 && seed.y < FIELD.height + 20);

    // The swarm hunts.
    for (const enemy of state.enemies) {
      enemy.wobble += dt * 3;
      let vx = player.x - enemy.x;
      let vy = player.y - enemy.y;
      const d = Math.hypot(vx, vy) || 1;
      vx /= d;
      vy /= d;
      if (enemy.kind === 'weaver') {
        const side = Math.sin(enemy.wobble) * 0.8;
        const px = -vy * side;
        const py = vx * side;
        vx += px;
        vy += py;
        const norm = Math.hypot(vx, vy) || 1;
        vx /= norm;
        vy /= norm;
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && d < 520) {
          enemy.fireTimer = 2.6;
          state.spores.push({ x: enemy.x, y: enemy.y, vx: ((player.x - enemy.x) / d) * 195, vy: ((player.y - enemy.y) / d) * 195, life: 4 });
        }
      }
      enemy.x += vx * enemy.speed * dt;
      enemy.y += vy * enemy.speed * dt;
      // The thorn aura bites anything that crowds the keeper.
      if (player.thorns > 0 && d < 52) {
        enemy.thornTick += dt;
        if (enemy.thornTick > 0.5) {
          enemy.thornTick = 0;
          enemy.hp -= player.thorns;
          burst(enemy.x, enemy.y, '#7bf1a8', 2, 90);
        }
      }
    }
    // A gentle separation keeps the swarm from stacking into one blob.
    for (let i = 0; i < state.enemies.length; i += 1) {
      for (let j = i + 1; j < state.enemies.length; j += 1) {
        const a = state.enemies[i];
        const b = state.enemies[j];
        const d = distance(a, b);
        const min = a.radius + b.radius;
        if (d > 0 && d < min) {
          const push = ((min - d) / d) * 0.5;
          a.x -= (b.x - a.x) * push;
          a.y -= (b.y - a.y) * push;
          b.x += (b.x - a.x) * push;
          b.y += (b.y - a.y) * push;
        }
      }
    }

    // Deaths are paid out, then the fallen are swept away.
    for (const enemy of state.enemies) if (enemy.hp <= 0) killEnemy(enemy);
    state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

    // Spores drift at the keeper.
    for (const spore of state.spores) {
      spore.x += spore.vx * dt;
      spore.y += spore.vy * dt;
      spore.life -= dt;
      if (distance(spore, player) < PLAYER.radius + 7) {
        spore.life = 0;
        hurtPlayer();
      }
    }
    state.spores = state.spores.filter((spore) => spore.life > 0);

    // Bodies that reach the keeper bite.
    for (const enemy of [...state.enemies]) {
      if (distance(enemy, player) < enemy.radius + PLAYER.radius - 4) {
        enemy.hp = 0;
        killEnemy(enemy);
        state.enemies = state.enemies.filter((item) => item !== enemy);
        hurtPlayer();
      }
    }

    // Nectar drifts home and is gathered.
    const magnetRadius = 95 * (state.player ? state.player.magnetMul : 1);
    for (const orb of state.orbs) {
      const d = distance(orb, player);
      if (d < magnetRadius) {
        orb.vx += ((player.x - orb.x) / (d || 1)) * 620 * dt;
        orb.vy += ((player.y - orb.y) / (d || 1)) * 620 * dt;
      }
      orb.life -= dt;
      orb.vx *= 0.92;
      orb.vy *= 0.92;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (d < PLAYER.radius + 10) {
        orb.gathered = true;
        state.nectar += 1;
        state.score += 5;
        sfx.pickup();
      }
    }
    state.orbs = state.orbs.filter((orb) => !orb.gathered && orb.life > 0);

    // A cleared wave opens the gifts, or wins the garden.
    if (state.screen === SCREEN.PLAY && state.spawnQueue.length === 0 && state.enemies.length === 0) {
      if (state.wave >= FINAL_WAVE) {
        state.screen = SCREEN.WIN;
        state.best = Math.max(state.best, state.score);
        sfx.win();
      } else {
        offerUpgrades();
      }
    }
    if (state.screen !== SCREEN.PLAY) state.best = Math.max(state.best, state.score);
  }

  function stepAmbient(dt) {
    // Fireflies for the quiet screens, so the garden never sits still.
    if (rng.chance(0.06)) {
      state.particles.push({
        x: rng.range(0, FIELD.width),
        y: rng.range(0, FIELD.height),
        vx: rng.range(-12, 12),
        vy: rng.range(-16, -4),
        life: rng.range(1.2, 2.6),
        maxLife: 2.6,
        color: '#7bf1a8',
        size: rng.range(1, 2.4),
      });
    }
  }

  function stepFx(dt) {
    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
    for (const text of state.texts) {
      text.y -= 34 * dt;
      text.life -= dt;
    }
    state.texts = state.texts.filter((text) => text.life > 0);
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    state.shake = Math.max(0, state.shake - dt * 26);
    state.hurtFlash = Math.max(0, state.hurtFlash - dt);
  }

  /** Advance the world one frame. control: {axis:{x,y}, aim:{x,y}, firing}. */
  function step(dt, control) {
    if (state.screen === SCREEN.PLAY && state.player !== null) stepPlay(dt, control);
    else stepAmbient(dt);
    stepFx(dt);
  }

  return { state, startGame, applyUpgrade, step };
}
