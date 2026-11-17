// Void Bloom's boot and wiring: the canvas, the input, the fixed-step loop,
// and the clicks and keys that move between screens. The world simulates,
// the renderer draws, this file only connects them.

import { createInput } from './input.js';
import { initAudio, isMuted, setMuted, sfx } from './audio.js';
import { makeRng, seedFromText } from './random.js';
import { createWorld, SCREEN } from './world.js';
import { createRenderer, upgradeCardRects } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const world = createWorld(makeRng(seedFromText(params.get('seed'), 20261117)));
const input = createInput(canvas);
const renderer = createRenderer(canvas);

const shot = params.get('shot');
if (shot !== null) stageShot(shot, world);

function handleClick(click) {
  initAudio();
  const state = world.state;
  if (state.screen === SCREEN.TITLE || state.screen === SCREEN.OVER || state.screen === SCREEN.WIN) {
    sfx.click();
    world.startGame();
    return;
  }
  if (state.screen === SCREEN.UPGRADE) {
    const rects = upgradeCardRects();
    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      if (state.offers[i] && click.x >= rect.x && click.x <= rect.x + rect.w && click.y >= rect.y && click.y <= rect.y + rect.h) {
        world.applyUpgrade(state.offers[i].id);
        return;
      }
    }
  }
}

const STEP_MS = 1000 / 60;
let last = performance.now();
let accumulated = 0;

function tick(dt) {
  const state = world.state;
  let click = input.takeClick();
  while (click !== null) {
    handleClick(click);
    click = input.takeClick();
  }
  if (input.wasPressed('KeyM')) setMuted(!isMuted());
  if (state.screen === SCREEN.UPGRADE) {
    const codes = ['Digit1', 'Digit2', 'Digit3'];
    for (let i = 0; i < codes.length; i += 1) {
      if (input.wasPressed(codes[i]) && state.offers[i]) world.applyUpgrade(state.offers[i].id);
    }
  }
  world.step(dt, { axis: input.axis(), aim: input.pointer, firing: input.firing });
  input.endFrame();
}

function frame(now) {
  requestAnimationFrame(frame);
  let elapsed = now - last;
  last = now;
  if (elapsed > 250) elapsed = 250;
  accumulated += elapsed;
  while (accumulated >= STEP_MS) {
    tick(STEP_MS / 1000);
    accumulated -= STEP_MS;
  }
  renderer.draw(world.state, input.pointer, now / 1000);
}

requestAnimationFrame(frame);
