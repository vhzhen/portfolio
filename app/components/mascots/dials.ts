/* Every tuning number for the mascot room, plus small pure helpers.
 * Values are Evergreen's originals (see "evergreen mascots/mascots.md" §15).
 * Speeds are px/s, accelerations px/s², times ms unless noted, and
 * `[a, b]` means "random between a and b". Nothing here touches the DOM
 * or Matter, so it can be tested without a browser.
 */

export type Range = readonly [number, number];

export const STEP_HZ = 60; // fixed physics steps per second
export const STEP_MS = 1000 / STEP_HZ;
export const MAX_FRAME_MS = 50; // cap on one frame's delta

/** Matter velocities are px per step; this guide thinks in px per second. */
export const toStep = (pxPerSec: number) => pxPerSec / STEP_HZ;
export const toSec = (pxPerStep: number) => pxPerStep * STEP_HZ;

export const DIALS = {
  size: 32, // px, drawn size the numbers were tuned for
  gravity: 2200,
  groundDrag: 0.72, // sideways speed kept per floor bounce
  restSpeed: 12, // below this it's standing still
  throwMax: 2600, // throw cap, per axis
  spinSpeed: 700, // tumble above this speed
};

export const BOUNCE = { floor: 0.4, wall: 0.5, ceiling: 0.35, mascot: 0.55 };
export type Surface = keyof typeof BOUNCE;
export const WALL_FRICTION = 0; // walls and ceiling only

export const HAND = {
  newWeight: 0.6, // newest move's share of the hand-speed average
  staleMs: 120, // hand still longer than this before release → put down
  thrownAbove: DIALS.restSpeed * 6, // 72 px/s
  tapMovePx: 6, // moved less than this…
  tapMs: 400, // …in less than this → a tap
  pauseAfterRelease: 500,
};
export const GRIP = { stiffness: 1, damping: 0, angularStiffness: 1 };

export const TUMBLE = { gain: 0.7, decay: 0.86, snapBelowDeg: 1 };

// No squash on landing (dropped from the guide's §8); only the timing is kept.
export const LANDING = {
  thrownClearsAfter: 250,
};

export const BURST = {
  count: 5,
  pool: 24,
  minSpeed: 520,
  speed: [150, 430] as Range,
  spread: 1.7,
  wallTip: -0.35,
  spin: [-340, 340] as Range,
  lifeMs: [520, 900] as Range,
  size: [7, 13] as Range,
  gravity: 620,
  drag: 2.1,
  fadeGain: 2.2,
};

export const TEMPER = { wander: 0.65, curiosity: 0.2, shyness: 0.25, speed: 0.8 };
export const PAUSE_MS: Range = [3800, 9500];

export const MOVE = {
  shuffleOdds: 0.8, // of "move" decisions, the share that are shuffles
  hopShare: 0.12, // hop chance = 0.12 × wander
  shuffleVx: [70, 130] as Range,
  shuffleMs: [1200, 2800] as Range,
  shuffleDist: [60, 220] as Range,
  shuffleBob: -150,
  hopVy: [-300, -390] as Range,
  hopVx: [30, 90] as Range,
  arriveWithinPx: 4,
};

export const UNSTICK = {
  blockedBelow: 0.35, // moving under 35% of walk speed → blocked
  hopVy: [-430, -380] as Range,
  sideBoost: 1.6,
  cooldownMs: 800,
  slideOffVx: 110, // nudge off another mascot's head
  perchedBelow: 30,
};

export const CURIOSITY = { minPx: 24, maxPx: 180, oddsGain: 0.7, standOffPx: 26 };

/* Not Evergreen numbers: the guide leaves sleep and startle feedback open,
 * so these are this site's own choices. */

/** Sleep: wakes only when time is up, it's grabbed, or a click startles it. */
export const SLEEP = {
  odds: 0.1, // per decision (checked after curiosity)
  durationMs: [9000, 20000] as Range,
  zPeriodS: 2.4, // one "z" drifting up every half period
};

/** Feedback when a floor click startles mascots. */
export const SHOCK = {
  alertMs: 750, // "!" over the head + wide eyes
  flinchMs: 260, // quick sideways shake for ones that stay put
  flinchPx: 1.2, // rig units
  wakeHopVy: -340, // a sleeper jolts awake
  rippleMs: 480,
};

export const SCATTER = {
  reachBase: 50,
  reachGain: 150, // reach = 50 + shyness × 150
  oddsBase: 0.3, // odds = shyness + 0.3
  vx: [220, 420] as Range,
  strength: 0.8,
  vy: [-380, -300] as Range,
  fleeMs: [900, 1500] as Range,
  restAfterMs: [500, 1200] as Range,
};
/** How far a floor click reaches: 50 + shyness × 150 = 87.5px. */
export const SCATTER_REACH = SCATTER.reachBase + TEMPER.shyness * SCATTER.reachGain;

export const ANIM = {
  // The guide's verb table gives idle leaves "6° on a ~3.4s cycle".
  idle: { swayDeg: 3, periodS: 4, leafDeg: 6, leafPeriodS: 3.4 },
  walk: { swayDeg: 3, periodS: 0.42, bob: 1.4, leafPeriodS: 0.84 },
  held: { swayDeg: 6, periodS: 1.3, leafDeg: 12, leafPeriodS: 1.1 },
  throw: { leafDeg: 12, leafPeriodS: 0.5, lookScale: 1.35 },
  rest: { swayDeg: 1, periodS: 9, leafDeg: 2, leafPeriodS: 7, eyesScaleY: 0.45 },
  blinkEveryS: 5.2,
  blinkMs: 150,
  blinkScaleY: 0.1,
  gazeMax: 1.5, // rig units the eyes can travel toward the cursor
};

/* ---------------------------- pure helpers ---------------------------- */

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const rand = ([a, b]: Range) => a + Math.random() * (b - a);

/** Blend the newest pointer speed with history (newest counts 60%). */
export function handSpeed(prev: number, deltaPx: number, seconds: number) {
  return (deltaPx / seconds) * HAND.newWeight + prev * (1 - HAND.newWeight);
}

/** Cap each axis separately so a diagonal flick isn't the slowest throw. */
export const capThrow = (vx: number, vy: number): [number, number] => [
  clamp(vx, -DIALS.throwMax, DIALS.throwMax),
  clamp(vy, -DIALS.throwMax, DIALS.throwMax),
];

/** A hand that stopped >120ms before release puts the mascot down. */
export const releaseSpeed = (
  vx: number,
  vy: number,
  msSinceMove: number,
): [number, number] => (msSinceMove > HAND.staleMs ? [0, 0] : capThrow(vx, vy));

/** Drawn spin in degrees: spins with a hard throw, then winds down upright. */
export function tumble(spin: number, vx: number, speed: number, dt: number) {
  if (speed > DIALS.spinSpeed) return spin + vx * dt * TUMBLE.gain;
  if (spin === 0) return 0;
  return Math.abs(spin) < TUMBLE.snapBelowDeg ? 0 : spin * TUMBLE.decay;
}

export type Leaf = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  life: number;
  age: number;
};

/** A leaf launched from (x, y), fanned around the outward normal (nx, ny). */
export function newLeaf(x: number, y: number, nx: number, ny: number): Leaf {
  const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * BURST.spread;
  const speed = rand(BURST.speed);
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rot: Math.random() * 360,
    spin: rand(BURST.spin),
    size: rand(BURST.size),
    life: rand(BURST.lifeMs),
    age: 0,
  };
}

/** Drag first, then the leaf's light gravity, so leaves flutter down. */
export function stepLeaf(l: Leaf, dt: number) {
  const keep = Math.max(0, 1 - BURST.drag * dt);
  l.vx *= keep;
  l.vy = l.vy * keep + BURST.gravity * dt;
  l.x += l.vx * dt;
  l.y += l.vy * dt;
  l.rot += l.spin * dt;
  l.age += dt * 1000;
}

/** Fully visible for about half its life, then fades out. */
export const leafOpacity = (age: number, life: number) =>
  clamp((1 - age / life) * BURST.fadeGain, 0, 1);

/** Rotate a wall's outward normal upward by `wallTip` so leaves spray into the room. */
export function tipWallNormal(nx: number): [number, number] {
  // Screen y points down, so "upward" means a negative y component.
  const a = nx > 0 ? BURST.wallTip : Math.PI - BURST.wallTip;
  return [Math.cos(a), Math.sin(a)];
}
