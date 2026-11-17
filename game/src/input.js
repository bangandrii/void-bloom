// Keyboard and mouse state for the keeper: which keys are held, where the
// pointer rests on the field, whether the fire button is down, and the
// one-shot clicks and key presses the menus and the pause key consume.

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const clicks = [];
  const pointer = { x: 640, y: 300 };
  let firing = false;

  const toField = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.code] || event.code === 'Space') event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => { held.clear(); firing = false; });
  canvas.addEventListener('mousemove', (event) => Object.assign(pointer, toField(event)));
  canvas.addEventListener('mousedown', (event) => {
    Object.assign(pointer, toField(event));
    firing = true;
    clicks.push({ ...pointer });
  });
  window.addEventListener('mouseup', () => { firing = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    pointer,
    /** The movement direction the held keys ask for, normalised. */
    axis() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const dir = MOVE_KEYS[code];
        if (dir === 'left') x -= 1;
        if (dir === 'right') x += 1;
        if (dir === 'up') y -= 1;
        if (dir === 'down') y += 1;
      }
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    get firing() { return firing || held.has('Space'); },
    /** The next queued menu click, or null; each click is handed out once. */
    takeClick() { return clicks.length > 0 ? clicks.shift() : null; },
    /** True once per physical press of the given key code. */
    wasPressed(code) {
      if (!pressed.has(code)) return false;
      pressed.delete(code);
      return true;
    },
    /** Forget one-shot presses (called at the end of a frame). */
    endFrame() { pressed.clear(); },
  };
}
