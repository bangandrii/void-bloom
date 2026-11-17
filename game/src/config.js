// Void Bloom configuration: the field, the palette, the tuning numbers and
// the wave table. Every other module reads its numbers from here so the
// whole game can be rebalanced in one place.

export const FIELD = { width: 1280, height: 800 };

export const COLORS = {
  void: '#0b0620',
  deepViolet: '#1c0f3d',
  bloomPink: '#ff5d8f',
  petalSoft: '#ffb3c9',
  nectarGold: '#ffd166',
  seedCyan: '#6ef3ff',
  leafGreen: '#7bf1a8',
  voidViolet: '#9b5de5',
  mothGrey: '#b8b3d9',
  sporeRed: '#ef476f',
  inkWhite: '#f4f1ff',
};

export const PLAYER = {
  radius: 16,
  speed: 265,
  maxPetals: 5,
  fireCooldown: 0.22,
  seedSpeed: 640,
  seedDamage: 1,
  invulnerableSeconds: 1.1,
};

export const ENEMY_KINDS = {
  moth: { radius: 15, speed: 88, hp: 2, score: 40, nectar: 1 },
  mite: { radius: 9, speed: 148, hp: 1, score: 20, nectar: 0 },
  pod: { radius: 22, speed: 42, hp: 6, score: 90, nectar: 2 },
  weaver: { radius: 16, speed: 105, hp: 4, score: 120, nectar: 2 },
};

// The ten waves of the void garden: how many of each kind each wave sends.
export const WAVES = [
  { moth: 6, pod: 0, weaver: 0 },
  { moth: 9, pod: 1, weaver: 0 },
  { moth: 12, pod: 2, weaver: 0 },
  { moth: 12, pod: 3, weaver: 2 },
  { moth: 16, pod: 4, weaver: 3 },
  { moth: 18, pod: 5, weaver: 4 },
  { moth: 22, pod: 6, weaver: 5 },
  { moth: 26, pod: 7, weaver: 6 },
  { moth: 30, pod: 8, weaver: 8 },
  { moth: 34, pod: 10, weaver: 10 },
];

export const FINAL_WAVE = WAVES.length;

// The between-wave gifts of the garden: three are offered, the keeper picks one.
export const UPGRADES = [
  { id: 'rapid', name: 'Rapid Bloom', blurb: 'Fire seeds 30% faster.' },
  { id: 'twin', name: 'Twin Seeds', blurb: 'Fire one more seed with every shot.' },
  { id: 'heavy', name: 'Heavy Seeds', blurb: 'Seeds deal +1 damage.' },
  { id: 'shield', name: 'Petal Shield', blurb: '+1 max petal, and mend 2 petals now.' },
  { id: 'swift', name: 'Swift Pollen', blurb: 'Move 15% faster.' },
  { id: 'magnet', name: 'Nectar Magnet', blurb: 'Nectar orbs drift to you from twice as far.' },
  { id: 'thorns', name: 'Thorn Aura', blurb: 'A ring of thorns wounds enemies that come close.' },
  { id: 'mend', name: 'Moonwater', blurb: 'Mend 3 petals now.' },
];
