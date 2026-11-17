// Every pixel of Void Bloom: the void garden, the keeper, the swarm, the
// HUD and the screens (title, the gifts between waves, game over, victory),
// all drawn on one canvas from the world's state. Nothing here simulates.

import { COLORS, ENEMY_KINDS, FIELD, PLAYER } from './config.js';
import { makeRng } from './random.js';
import { SCREEN } from './world.js';

const TAU = Math.PI * 2;

/** The three gift cards of the upgrade screen, shared with the click code. */
export function upgradeCardRects() {
  const width = 300;
  const height = 190;
  const gap = 36;
  const total = width * 3 + gap * 2;
  const x0 = (FIELD.width - total) / 2;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (width + gap), y: 330, w: width, h: height }));
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  // The garden floor is painted once onto its own canvas: a deep gradient,
  // soft glows, and a fixed scatter of tiny sleeping flowers and motes.
  const floor = document.createElement('canvas');
  floor.width = FIELD.width;
  floor.height = FIELD.height;
  {
    const f = floor.getContext('2d');
    const gradient = f.createRadialGradient(640, 400, 120, 640, 400, 760);
    gradient.addColorStop(0, '#1c0f3d');
    gradient.addColorStop(1, '#0b0620');
    f.fillStyle = gradient;
    f.fillRect(0, 0, FIELD.width, FIELD.height);
    const rng = makeRng(7);
    for (let i = 0; i < 26; i += 1) {
      const x = rng.range(30, FIELD.width - 30);
      const y = rng.range(30, FIELD.height - 30);
      const glow = f.createRadialGradient(x, y, 2, x, y, rng.range(40, 90));
      glow.addColorStop(0, 'rgba(155, 93, 229, 0.10)');
      glow.addColorStop(1, 'rgba(155, 93, 229, 0)');
      f.fillStyle = glow;
      f.fillRect(x - 100, y - 100, 200, 200);
    }
    for (let i = 0; i < 90; i += 1) {
      f.fillStyle = rng.chance(0.5) ? 'rgba(123, 241, 168, 0.5)' : 'rgba(244, 241, 255, 0.35)';
      f.beginPath();
      f.arc(rng.range(8, FIELD.width - 8), rng.range(8, FIELD.height - 8), rng.range(0.8, 1.9), 0, TAU);
      f.fill();
    }
    f.strokeStyle = 'rgba(255, 93, 143, 0.35)';
    f.lineWidth = 3;
    f.strokeRect(14, 14, FIELD.width - 28, FIELD.height - 28);
  }

  function text(str, x, y, size, color, align = 'center', alpha = 1, weight = 'bold') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function circle(x, y, radius, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHeartBloom(x, y, scale, sway) {
    // The Heart Bloom the keeper defends: layered petals around a gold heart.
    ctx.save();
    ctx.translate(x, y);
    for (let layer = 0; layer < 3; layer += 1) {
      const petals = 8 - layer * 2;
      const radius = (64 - layer * 17) * scale;
      const reach = (30 - layer * 6) * scale;
      ctx.fillStyle = [COLORS.voidViolet, COLORS.bloomPink, COLORS.petalSoft][layer];
      for (let i = 0; i < petals; i += 1) {
        const angle = (i / petals) * TAU + sway + layer * 0.4;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(reach + radius * 0.4, 0, radius * 0.62, radius * 0.3, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    circle(0, 0, 15 * scale, COLORS.nectarGold);
    circle(0, 0, 8 * scale, '#fff3c4');
    ctx.restore();
  }

  function drawKeeper(player, now) {
    const blink = player.invulnerable > 0 && Math.floor(now * 14) % 2 === 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.thorns > 0) {
      ctx.strokeStyle = 'rgba(123, 241, 168, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 50, now * 1.5, now * 1.5 + TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = blink ? 0.35 : 1;
    // The aim stem points at the pointer.
    ctx.rotate(player.angle);
    ctx.fillStyle = COLORS.leafGreen;
    ctx.fillRect(8, -3, 20, 6);
    ctx.rotate(-player.angle);
    // Five petals turning slowly around a bright core.
    ctx.fillStyle = COLORS.bloomPink;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * TAU + now * 0.9;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(11, 0, 10, 5.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    circle(0, 0, 8, COLORS.seedCyan);
    circle(0, 0, 4, '#ffffff');
    ctx.restore();
  }

  function drawEnemy(enemy, now) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.kind === 'moth') {
      const flap = Math.sin(now * 16 + enemy.wobble) * 0.55;
      ctx.fillStyle = COLORS.mothGrey;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * (0.7 + flap));
        ctx.beginPath();
        ctx.ellipse(side * 13, -4, 12, 6, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      circle(0, 0, 10, '#8f89b8');
      circle(-4, -2, 2.2, COLORS.sporeRed);
      circle(4, -2, 2.2, COLORS.sporeRed);
    } else if (enemy.kind === 'mite') {
      ctx.strokeStyle = COLORS.voidViolet;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * TAU + now * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
        ctx.lineTo(Math.cos(angle) * 11, Math.sin(angle) * 11);
        ctx.stroke();
      }
      circle(0, 0, 7, COLORS.voidViolet);
      circle(0, 0, 3, COLORS.petalSoft);
    } else if (enemy.kind === 'pod') {
      const pulse = 1 + Math.sin(now * 3 + enemy.wobble) * 0.06;
      circle(0, 0, enemy.radius * pulse, COLORS.sporeRed);
      circle(0, 0, enemy.radius * 0.62 * pulse, '#ff7d9c');
      circle(-6, -5, 4, '#ffd9e2');
      // A health arc shows how much of the pod is left.
      ctx.strokeStyle = COLORS.nectarGold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 6, -Math.PI / 2, -Math.PI / 2 + TAU * (enemy.hp / ENEMY_KINDS.pod.hp));
      ctx.stroke();
    } else if (enemy.kind === 'weaver') {
      ctx.rotate(now * 1.8 + enemy.wobble);
      ctx.fillStyle = COLORS.voidViolet;
      ctx.beginPath();
      for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * TAU;
        ctx.lineTo(Math.cos(angle) * 17, Math.sin(angle) * 17);
        const mid = angle + TAU / 8;
        ctx.lineTo(Math.cos(mid) * 8, Math.sin(mid) * 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.rotate(-(now * 1.8 + enemy.wobble));
      circle(0, 0, 6, COLORS.sporeRed);
      circle(0, 0, 2.6, '#ffffff');
    }
    ctx.restore();
  }

  function drawHud(state) {
    const player = state.player;
    // Petals (lives) at the top left, as little pink petals.
    for (let i = 0; i < player.maxPetals; i += 1) {
      const x = 44 + i * 30;
      ctx.save();
      ctx.translate(x, 38);
      ctx.rotate(-0.5);
      ctx.fillStyle = i < player.petals ? COLORS.bloomPink : 'rgba(255, 179, 201, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 6.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    text(`WAVE ${state.wave}`, FIELD.width / 2, 30, 24, COLORS.inkWhite);
    const left = state.spawnQueue.length + state.enemies.length;
    text(state.screen === SCREEN.PLAY ? `${left} in the swarm` : '', FIELD.width / 2, 58, 15, COLORS.mothGrey, 'center', 0.9, 'normal');
    text(`SCORE ${state.score}`, FIELD.width - 36, 30, 22, COLORS.inkWhite, 'right');
    // Nectar, with its orb.
    circle(FIELD.width - 128, 58, 6, COLORS.nectarGold);
    text(`${state.nectar}`, FIELD.width - 112, 58, 18, COLORS.nectarGold, 'left');
    if (state.wave === 1 && state.screen === SCREEN.PLAY) {
      text('WASD or arrows to move · mouse to aim · hold click or Space to fire', FIELD.width / 2, FIELD.height - 24, 16, COLORS.mothGrey, 'center', 0.85, 'normal');
    }
  }

  function drawTitle(state, now) {
    drawHeartBloom(FIELD.width / 2, 300, 1.5, Math.sin(now * 0.6) * 0.05);
    ctx.save();
    ctx.shadowColor = COLORS.bloomPink;
    ctx.shadowBlur = 34;
    text('VOID BLOOM', FIELD.width / 2, 120, 84, COLORS.inkWhite);
    ctx.restore();
    text('The void moths are coming for the last Heart Bloom.', FIELD.width / 2, 486, 22, COLORS.petalSoft, 'center', 1, 'normal');
    text('You are its keeper. Hold the garden for ten waves.', FIELD.width / 2, 518, 22, COLORS.petalSoft, 'center', 1, 'normal');
    text('WASD or arrows to move · mouse to aim · hold click or Space to fire', FIELD.width / 2, 586, 18, COLORS.mothGrey, 'center', 1, 'normal');
    text('Gather nectar, choose a gift after every wave, and do not let the swarm touch you.', FIELD.width / 2, 616, 18, COLORS.mothGrey, 'center', 1, 'normal');
    const pulse = 0.65 + Math.sin(now * 3.2) * 0.35;
    text('CLICK TO BEGIN', FIELD.width / 2, 686, 30, COLORS.nectarGold, 'center', pulse);
    if (state.best > 0) text(`Best score ${state.best}`, FIELD.width / 2, 736, 18, COLORS.seedCyan);
  }

  function drawUpgrade(state, pointer) {
    ctx.fillStyle = 'rgba(5, 3, 16, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(`WAVE ${state.wave} HELD`, FIELD.width / 2, 168, 44, COLORS.leafGreen);
    text('The garden offers a gift. Choose one — click a card or press 1, 2 or 3.', FIELD.width / 2, 222, 20, COLORS.inkWhite, 'center', 1, 'normal');
    const rects = upgradeCardRects();
    state.offers.forEach((offer, i) => {
      const rect = rects[i];
      const hover = pointer.x >= rect.x && pointer.x <= rect.x + rect.w && pointer.y >= rect.y && pointer.y <= rect.y + rect.h;
      ctx.save();
      ctx.fillStyle = hover ? 'rgba(60, 32, 110, 0.95)' : 'rgba(28, 15, 61, 0.95)';
      ctx.strokeStyle = hover ? COLORS.nectarGold : COLORS.voidViolet;
      ctx.lineWidth = hover ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      text(`${i + 1}`, rect.x + rect.w / 2, rect.y + 36, 20, COLORS.mothGrey);
      text(offer.name, rect.x + rect.w / 2, rect.y + 82, 27, COLORS.nectarGold);
      // Wrap the blurb by words onto two centred lines.
      const words = offer.blurb.split(' ');
      const lines = [''];
      for (const word of words) {
        const trial = lines[lines.length - 1] === '' ? word : `${lines[lines.length - 1]} ${word}`;
        if (trial.length > 26 && lines[lines.length - 1] !== '') lines.push(word);
        else lines[lines.length - 1] = trial;
      }
      lines.forEach((line, j) => text(line, rect.x + rect.w / 2, rect.y + 122 + j * 24, 17, COLORS.inkWhite, 'center', 1, 'normal'));
    });
  }

  function drawEnd(state, won) {
    ctx.fillStyle = 'rgba(5, 3, 16, 0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawHeartBloom(FIELD.width / 2, 268, 1.1, 0);
    ctx.save();
    ctx.shadowColor = won ? COLORS.leafGreen : COLORS.sporeRed;
    ctx.shadowBlur = 28;
    text(won ? 'THE GARDEN BLOOMS AGAIN' : 'THE BLOOM WITHERS', FIELD.width / 2, 448, 52, COLORS.inkWhite);
    ctx.restore();
    text(`Score ${state.score} · Best ${state.best}`, FIELD.width / 2, 516, 26, COLORS.nectarGold);
    text(`Wave ${state.wave} of 10 · ${state.kills} of the swarm turned away · ${state.nectar} nectar gathered`, FIELD.width / 2, 556, 19, COLORS.petalSoft, 'center', 1, 'normal');
    text(won ? 'CLICK TO PLAY AGAIN' : 'CLICK TO TRY AGAIN', FIELD.width / 2, 636, 26, COLORS.seedCyan);
  }

  /** Draw the whole frame for the world's state. */
  function draw(state, pointer, now) {
    ctx.save();
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    ctx.drawImage(floor, 0, 0);

    for (const orb of state.orbs) {
      circle(orb.x, orb.y, 6 + Math.sin(now * 5 + orb.x) * 1.2, COLORS.nectarGold);
      circle(orb.x, orb.y, 2.6, '#fff3c4');
    }
    for (const spore of state.spores) {
      circle(spore.x, spore.y, 7, COLORS.sporeRed);
      circle(spore.x, spore.y, 3, '#ffd9e2');
    }
    for (const seed of state.seeds) {
      ctx.save();
      ctx.strokeStyle = COLORS.seedCyan;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(seed.x - seed.vx * 0.02, seed.y - seed.vy * 0.02);
      ctx.lineTo(seed.x, seed.y);
      ctx.stroke();
      ctx.restore();
    }
    for (const enemy of state.enemies) drawEnemy(enemy, now);
    if (state.player !== null && state.screen !== SCREEN.OVER) drawKeeper(state.player, now);
    for (const particle of state.particles) {
      circle(particle.x, particle.y, particle.size, particle.color, Math.max(0, particle.life / particle.maxLife));
    }
    for (const item of state.texts) {
      text(item.text, item.x, item.y, 16, item.color, 'center', Math.min(1, item.life));
    }
    ctx.restore();

    if (state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(239, 71, 111, ${state.hurtFlash * 0.55})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }

    if (state.screen === SCREEN.TITLE) drawTitle(state, now);
    else {
      if (state.player !== null) drawHud(state);
      if (state.screen === SCREEN.PLAY) {
        // The aim reticle rides the pointer.
        ctx.save();
        ctx.strokeStyle = 'rgba(110, 243, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 10, 0, TAU);
        ctx.stroke();
        ctx.restore();
        if (state.bannerTimer > 0) {
          text(state.banner, FIELD.width / 2, 150, 54, COLORS.inkWhite, 'center', Math.min(1, state.bannerTimer));
        }
      }
      if (state.screen === SCREEN.UPGRADE) drawUpgrade(state, pointer);
      if (state.screen === SCREEN.OVER) drawEnd(state, false);
      if (state.screen === SCREEN.WIN) drawEnd(state, true);
    }
  }

  return { draw };
}
