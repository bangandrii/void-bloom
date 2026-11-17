// The screenshot scenes behind ?shot=title|play|upgrade|end. Each scene
// plays the real rules forward from a fresh world at a fixed step, steered
// by a simple autopilot (aim at the nearest enemy, back away when it crowds,
// strafe otherwise), so a frame is what a short game really looks like and
// the same seed always stages the same scene.

import { FIELD } from './config.js';
import { SCREEN } from './world.js';

const STEP = 1 / 60;

function autopilot(state) {
  const player = state.player;
  let target = null;
  let nearest = Infinity;
  for (const enemy of state.enemies) {
    const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (d < nearest) { nearest = d; target = enemy; }
  }
  const aim = target === null ? { x: player.x + 120, y: player.y } : { x: target.x, y: target.y };
  let ax = 0;
  let ay = 0;
  if (target !== null) {
    const dx = player.x - target.x;
    const dy = player.y - target.y;
    const d = Math.hypot(dx, dy) || 1;
    if (nearest < 180) { ax = dx / d; ay = dy / d; }
    else { ax = (-dy / d) * 0.45; ay = (dx / d) * 0.45; }
  }
  if (target === null || nearest > 240) {
    let orb = null;
    let orbDistance = Infinity;
    for (const item of state.orbs) {
      const d = Math.hypot(item.x - player.x, item.y - player.y);
      if (d < orbDistance) { orbDistance = d; orb = item; }
    }
    if (orb !== null) { ax = (orb.x - player.x) / (orbDistance || 1); ay = (orb.y - player.y) / (orbDistance || 1); }
  }
  if (player.x < 150) ax += 0.8;
  if (player.x > FIELD.width - 150) ax -= 0.8;
  if (player.y < 150) ay += 0.8;
  if (player.y > FIELD.height - 150) ay -= 0.8;
  const length = Math.hypot(ax, ay);
  if (length > 1) { ax /= length; ay /= length; }
  return { axis: { x: ax, y: ay }, aim, firing: target !== null };
}

const IDLE = { axis: { x: 0, y: 0 }, aim: { x: 640, y: 200 }, firing: false };

/**
 * Stage the named scene in `world` and leave it on the screen the scene is
 * about: title (the garden at rest), play (wave 3, mid-fight), upgrade (the
 * first gift offered) or end (a keeper who never fought, overrun).
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.startGame();
    for (let i = 0; i < 200 * 60; i += 1) {
      if (state.screen === SCREEN.UPGRADE) world.applyUpgrade(state.offers[1] ? state.offers[1].id : state.offers[0].id);
      if (state.wave >= 2 && state.enemies.length >= 9) break;
      if (state.screen === SCREEN.OVER) break;
      world.step(STEP, autopilot(state));
    }
    return;
  }
  if (name === 'upgrade') {
    world.startGame();
    for (let i = 0; i < 240 * 60; i += 1) {
      if (state.screen === SCREEN.UPGRADE || state.screen === SCREEN.OVER) break;
      world.step(STEP, autopilot(state));
    }
    return;
  }
  if (name === 'end') {
    world.startGame();
    for (let i = 0; i < 420 * 60; i += 1) {
      if (state.screen === SCREEN.OVER) break;
      if (state.screen === SCREEN.UPGRADE) world.applyUpgrade(state.offers[0].id);
      world.step(STEP, IDLE);
    }
    return;
  }
  // title: a fresh world, a few seconds of fireflies.
  for (let i = 0; i < 4 * 60; i += 1) world.step(STEP, IDLE);
}
