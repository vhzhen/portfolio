import Matter from "matter-js";
import {
  ANIM,
  CURIOSITY,
  DIALS,
  MOVE,
  PAUSE_MS,
  SCATTER,
  SCATTER_REACH,
  SHOCK,
  SLEEP,
  LANDING,
  TEMPER,
  UNSTICK,
  clamp,
  rand,
  toSec,
  toStep,
  tumble,
} from "./dials";

/* Sprout's rig from sapling.svg. Parts are tagged with data-part instead of
 * id so several mascots can share a page. Hinges are in the 24x24 box. */
const RIG = `
<g data-part="root" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <g data-part="whole">
    <g data-part="stalk">
      <path d="M12 12 V7"/>
      <g data-part="leaf-left"><path d="M12 7 C9.2 7 7.5 5.3 7.5 2.5 C10.3 2.5 12 4.2 12 7 Z"/></g>
      <g data-part="leaf-right"><path d="M12 9 C14.3 9 15.8 7.6 15.8 5.3 C13.5 5.3 12 6.7 12 9 Z"/></g>
    </g>
    <rect data-part="head" x="4" y="12" width="16" height="10" rx="3"/>
    <g data-part="eyes">
      <g data-part="look" fill="currentColor" stroke="none">
        <circle cx="9.5" cy="17" r="1.1"/>
        <circle cx="14.5" cy="17" r="1.1"/>
      </g>
    </g>
  </g>
</g>
<g data-part="fx" fill="currentColor" stroke="none" font-family="ui-monospace, Menlo, monospace" font-weight="700">
  <text data-part="z1" x="17" y="10.5" font-size="6.5" opacity="0">z</text>
  <text data-part="z2" x="17" y="10.5" font-size="5" opacity="0">z</text>
  <text data-part="alert" x="20" y="10" font-size="11" text-anchor="middle" opacity="0">!</text>
</g>`;

/** Head outline's outer edge in rig units: 16x10 rect + 0.75 stroke each side. */
const HEAD = { w: 17.5, h: 11.5, corner: 3.75 };
/** Rig units from the head's top outer edge (y 11.25) up to the top leaf's
 * outer tip (y 1.75). The room keeps this much room under its ceiling so
 * the stalk is never clipped. */
export const STALK_CLEARANCE = 9.5;

const HINGES: Record<string, string> = {
  root: "12px 12px",
  whole: "12px 22px",
  stalk: "12px 12px",
  "leaf-left": "12px 7px",
  "leaf-right": "12px 9px",
  eyes: "12px 17px",
  look: "12px 17px",
};

type PartName =
  | "root" | "whole" | "stalk" | "leaf-left" | "leaf-right" | "eyes" | "look"
  | "fx" | "z1" | "z2" | "alert";
type Mode = "pause" | "walk" | "flee" | "sleep";
type Verb = "idle" | "walk" | "held" | "throw" | "rest";

/** What the room tells each mascot every frame. */
export type RoomView = {
  width: number;
  floorY: number;
  /** Pointer in room coordinates, or null when it isn't over the room. */
  pointer: { x: number; y: number } | null;
  mascots: Mascot[];
  reducedMotion: boolean;
};

const sin01 = (t: number, period: number) => Math.sin((t / period) * Math.PI * 2);

export class Mascot {
  readonly body: Matter.Body;
  readonly halfW: number;
  readonly halfH: number;
  readonly el: SVGSVGElement;
  private parts = {} as Record<PartName, SVGGraphicsElement>;

  held = false;
  thrown = false;
  spin = 0;
  private facing = 1;
  private thrownClearsAt = 0;

  mode: Mode = "pause";
  pauseUntil = 0;
  private modeUntil = 0;
  private modeStartedAt = 0;
  private targetX = 0;
  private dir = 1;
  private walkSpeed = 0;
  private unstickAfter = 0;

  private gazeX = 0;
  private gazeY = 0;
  private readonly blinkOffset: number;

  // Startle feedback.
  private alertUntil = 0;
  private flinchUntil = 0;
  private shock: { x: number; y: number } | null = null;

  constructor(
    readonly id: number,
    x: number,
    y: number,
    readonly size: number,
    readonly color: string,
    layer: HTMLElement,
  ) {
    const k = size / 24;
    // The body is the head as drawn: the 16x10 rect (corner radius 3) plus
    // half its 1.5 stroke on each side, so bodies collide when the visible
    // outlines touch. Centred at (12, 17) in the rig, like the guide's circle.
    this.halfW = (HEAD.w / 2) * k;
    this.halfH = (HEAD.h / 2) * k;
    // Matter uses the lower friction of a pair, so zero-friction walls stay
    // slippery while the floor (default 0.1) still slows a skid.
    this.body = Matter.Bodies.rectangle(x, y, this.halfW * 2, this.halfH * 2, {
      label: "mascot",
      chamfer: { radius: HEAD.corner * k },
      frictionAir: 0,
      restitution: 0,
    });
    // Lock rotation so it stays upright and slides instead of rolling.
    // The drawn tumble comes from `spin`.
    Matter.Body.setInertia(this.body, Infinity);

    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", "0 0 24 24");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;overflow:visible;color:${color};pointer-events:none;will-change:transform`;
    el.innerHTML = RIG;
    el.querySelectorAll<SVGGraphicsElement>("[data-part]").forEach((g) => {
      const name = g.dataset.part as PartName;
      this.parts[name] = g;
      if (HINGES[name]) {
        g.style.transformBox = "view-box";
        g.style.transformOrigin = HINGES[name];
      }
    });
    // "!" pops from its own base.
    this.parts.alert.style.transformBox = "fill-box";
    this.parts.alert.style.transformOrigin = "50% 100%";
    layer.appendChild(el);
    this.el = el;

    this.blinkOffset = id * 1.37;
    this.pauseUntil = performance.now() + rand([600, 2400]);
  }

  /* ------------------------------ helpers ------------------------------ */

  private get vx() {
    return toSec(this.body.velocity.x);
  }
  private get vy() {
    return toSec(this.body.velocity.y);
  }
  private setVelocity(vx: number, vy: number) {
    Matter.Body.setVelocity(this.body, { x: toStep(vx), y: toStep(vy) });
  }
  grounded(floorY: number) {
    return this.body.position.y >= floorY - this.halfH - 1;
  }
  get moving() {
    return this.mode === "walk" || this.mode === "flee";
  }

  get asleep() {
    return this.mode === "sleep";
  }

  /* ----------------------------- reactions ----------------------------- */

  onGrab() {
    // Grabbing a sleeper wakes it with a start.
    if (this.asleep) this.alertUntil = performance.now() + SHOCK.alertMs;
    this.held = true;
    this.thrown = false;
    this.spin = 0;
    this.mode = "pause";
    this.setVelocity(0, 0);
  }

  onRelease(vx: number, vy: number, now: number) {
    this.held = false;
    this.pauseUntil = now + 500;
    this.mode = "pause";
    this.setVelocity(vx, vy);
    this.thrown = Math.hypot(vx, vy) > DIALS.restSpeed * 6;
  }

  /** A click on the mascot itself: a small happy hop. */
  onTap(reducedMotion: boolean) {
    if (reducedMotion) return;
    this.setVelocity(0, MOVE.hopVy[0]);
  }

  /**
   * Clicked floor nearby. Every mascot in reach reacts visibly: a "!" pops
   * up and its eyes go wide toward the click. Sleepers always jolt awake
   * and hop away; awake shy ones (55%) leap away and flee, the rest flinch.
   * Returns whether this mascot reacted.
   */
  scatterFrom(x: number, y: number, now: number) {
    if (this.held) return false;
    const dx = this.body.position.x - x;
    if (Math.abs(dx) > SCATTER_REACH) return false;

    this.alertUntil = now + SHOCK.alertMs;
    this.shock = { x, y };
    const away = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);

    if (this.asleep) {
      this.flee(away, rand(SCATTER.vx) * SCATTER.strength * 0.6, SHOCK.wakeHopVy, now);
      return true;
    }
    if (Math.random() > TEMPER.shyness + SCATTER.oddsBase) {
      this.flinchUntil = now + SHOCK.flinchMs;
      return true;
    }
    this.flee(away, rand(SCATTER.vx) * SCATTER.strength, rand(SCATTER.vy), now);
    return true;
  }

  private flee(dir: number, vx: number, vy: number, now: number) {
    this.dir = dir;
    this.setVelocity(dir * vx, vy);
    this.walkSpeed = rand(MOVE.shuffleVx) * TEMPER.speed;
    this.startMode("flee", now, rand(SCATTER.fleeMs));
  }

  /* ------------------------------ behavior ----------------------------- */

  private startMode(mode: Mode, now: number, durationMs: number) {
    this.mode = mode;
    this.modeStartedAt = now;
    this.modeUntil = now + durationMs;
  }

  private pause(now: number, ms = rand(PAUSE_MS)) {
    this.mode = "pause";
    this.pauseUntil = now + ms;
  }

  private walkTo(x: number, view: RoomView, now: number) {
    this.targetX = clamp(x, this.halfW, view.width - this.halfW);
    this.dir = this.targetX >= this.body.position.x ? 1 : -1;
    this.walkSpeed = rand(MOVE.shuffleVx) * TEMPER.speed;
    this.startMode("walk", now, rand(MOVE.shuffleMs));
  }

  private decide(view: RoomView, now: number) {
    if (view.reducedMotion) {
      this.pauseUntil = Infinity;
      return;
    }
    const x = this.body.position.x;
    const p = view.pointer;
    if (p) {
      const dx = p.x - x;
      const near = Math.abs(dx) >= CURIOSITY.minPx && Math.abs(dx) <= CURIOSITY.maxPx;
      if (near && Math.random() < TEMPER.curiosity * CURIOSITY.oddsGain) {
        this.walkTo(p.x - Math.sign(dx) * CURIOSITY.standOffPx, view, now);
        return;
      }
    }
    if (Math.random() < SLEEP.odds) {
      this.setVelocity(0, this.vy);
      this.startMode("sleep", now, rand(SLEEP.durationMs));
      return;
    }
    const roll = Math.random();
    const shuffle = TEMPER.wander * MOVE.shuffleOdds;
    const hop = TEMPER.wander * MOVE.hopShare;
    if (roll < shuffle) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.walkTo(x + side * rand(MOVE.shuffleDist), view, now);
    } else if (roll < shuffle + hop) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.setVelocity(side * rand(MOVE.hopVx), rand(MOVE.hopVy));
      this.pause(now);
    } else {
      this.pause(now);
    }
  }

  /** Runs every frame: AI, landing effects, then drawing. */
  update(now: number, dt: number, view: RoomView) {
    const grounded = this.grounded(view.floorY);
    const speed = Math.hypot(this.vx, this.vy);

    // `thrown` clears a beat after it's back on the floor.
    if (!grounded) {
      this.thrownClearsAt = 0; // bounced back up: wait for the next landing
    } else if (this.thrown) {
      if (!this.thrownClearsAt) this.thrownClearsAt = now + LANDING.thrownClearsAfter;
      else if (now >= this.thrownClearsAt) {
        this.thrown = false;
        this.thrownClearsAt = 0;
      }
    }

    if (!this.held) this.think(now, grounded, view);

    this.spin = this.held ? 0 : tumble(this.spin, this.vx, this.thrown ? speed : 0, dt);
    if (this.vx < -DIALS.restSpeed) this.facing = -1;
    else if (this.vx > DIALS.restSpeed) this.facing = 1;

    this.draw(now, grounded, view);
  }

  private think(now: number, grounded: boolean, view: RoomView) {
    const x = this.body.position.x;

    // Perched on another mascot's head: slide off toward the freer side.
    if (!grounded && Math.hypot(this.vx, this.vy) < UNSTICK.perchedBelow) {
      const below = view.mascots.find(
        (o) =>
          o !== this &&
          o.body.position.y > this.body.position.y &&
          Math.abs(o.body.position.x - x) < this.halfW * 2,
      );
      if (below) {
        const away = x === below.body.position.x
          ? (x < view.width / 2 ? 1 : -1)
          : Math.sign(x - below.body.position.x);
        this.setVelocity(away * UNSTICK.slideOffVx, this.vy);
      }
    }

    if (this.mode === "pause") {
      if (now >= this.pauseUntil && grounded) this.decide(view, now);
      return;
    }

    // Asleep: no hopping or wandering. Wakes when time's up (or on a grab
    // or startle, handled in onGrab / scatterFrom).
    if (this.mode === "sleep") {
      if (now >= this.modeUntil) this.pause(now, rand([800, 1600]));
      return;
    }

    // walk / flee
    const arrived =
      this.mode === "walk" && Math.abs(this.targetX - x) <= MOVE.arriveWithinPx;
    if (arrived || now >= this.modeUntil) {
      this.setVelocity(0, this.vy);
      this.pause(now, this.mode === "flee" ? rand(SCATTER.restAfterMs) : undefined);
      return;
    }
    if (!grounded) return;

    // Blocked (usually by another mascot): big hop over it.
    const blocked = Math.abs(this.vx) < this.walkSpeed * UNSTICK.blockedBelow;
    if (blocked && now - this.modeStartedAt > 200 && now >= this.unstickAfter) {
      this.setVelocity(this.dir * this.walkSpeed * UNSTICK.sideBoost, rand(UNSTICK.hopVy));
      this.unstickAfter = now + UNSTICK.cooldownMs;
      return;
    }
    // A walk is a string of micro-hops: a sideways push and a tiny bob.
    this.setVelocity(this.dir * this.walkSpeed, Math.min(this.vy, MOVE.shuffleBob));
  }

  /* ------------------------------- drawing ------------------------------ */

  private verb(grounded: boolean): Verb {
    if (this.held) return "held";
    if (this.asleep) return "rest";
    if (!grounded && (this.thrown || this.mode === "flee")) return "throw";
    if (this.moving) return "walk";
    return "idle";
  }

  private draw(now: number, grounded: boolean, view: RoomView) {
    const T = now / 1000;
    const verb = this.verb(grounded);
    const still = view.reducedMotion && !this.held;
    const alertLeft = this.alertUntil - now; // ms of "!" remaining
    const alert = alertLeft > 0;

    let sway = 0;
    let bob = 0;
    let leafDeg = 0;
    let leafPeriod = 1;
    let lookScale = 1;
    if (!still) {
      if (verb === "idle") {
        sway = sin01(T, ANIM.idle.periodS) * ANIM.idle.swayDeg;
        leafDeg = ANIM.idle.leafDeg;
        leafPeriod = ANIM.idle.leafPeriodS;
      } else if (verb === "walk") {
        sway = sin01(T, ANIM.walk.periodS) * ANIM.walk.swayDeg;
        bob = -Math.abs(Math.sin((T / ANIM.walk.periodS) * Math.PI)) * ANIM.walk.bob;
        leafDeg = ANIM.idle.leafDeg;
        leafPeriod = ANIM.walk.leafPeriodS;
      } else if (verb === "held") {
        sway = sin01(T, ANIM.held.periodS) * ANIM.held.swayDeg;
        leafDeg = ANIM.held.leafDeg;
        leafPeriod = ANIM.held.leafPeriodS;
      } else if (verb === "rest") {
        sway = sin01(T, ANIM.rest.periodS) * ANIM.rest.swayDeg;
        leafDeg = ANIM.rest.leafDeg;
        leafPeriod = ANIM.rest.leafPeriodS;
      } else {
        leafDeg = ANIM.throw.leafDeg;
        leafPeriod = ANIM.throw.leafPeriodS;
        lookScale = ANIM.throw.lookScale;
      }
    }
    if (alert) lookScale = ANIM.throw.lookScale; // wide-eyed while startled

    // Flinch: a quick sideways shake that dies out.
    const flinchLeft = this.flinchUntil - now;
    const shake =
      flinchLeft > 0 ? Math.sin(T * Math.PI * 2 * 22) * SHOCK.flinchPx * (flinchLeft / SHOCK.flinchMs) : 0;

    const leaf = sin01(T, leafPeriod);
    const p = this.parts;

    p.root.style.transform = `rotate(${this.spin}deg)`;
    p.whole.style.transform = `translate(${shake}px, ${bob}px) rotate(${sway}deg) scaleX(${this.facing})`;
    p.stalk.style.transform = `rotate(${leaf * leafDeg * 0.4}deg)`;
    p["leaf-left"].style.transform = `rotate(${-leaf * leafDeg}deg)`;
    p["leaf-right"].style.transform = `rotate(${sin01(T + 0.3, leafPeriod) * leafDeg}deg)`;

    // Eyes: half shut asleep, slightly tall when startled, otherwise blink
    // about every 5s (offset per mascot).
    const blinking =
      !still && verb !== "rest" && !alert &&
      ((T + this.blinkOffset) % ANIM.blinkEveryS) < ANIM.blinkMs / 1000;
    const eyesY =
      verb === "rest" ? ANIM.rest.eyesScaleY : blinking ? ANIM.blinkScaleY : alert ? 1.15 : 1;
    p.eyes.style.transform = `scaleY(${eyesY})`;

    // Gaze: toward the click while startled, else the cursor when idle.
    const target = alert && this.shock ? this.shock : verb === "idle" && !still ? view.pointer : null;
    let gx = 0;
    let gy = 0;
    if (target && verb !== "rest") {
      const dx = target.x - this.body.position.x;
      const dy = target.y - this.body.position.y;
      const d = Math.hypot(dx, dy) || 1;
      gx = (dx / d) * ANIM.gazeMax * this.facing; // undo the facing flip
      gy = (dy / d) * ANIM.gazeMax * 0.6;
    }
    const ease = alert ? 0.4 : 0.15; // snap toward a startle
    this.gazeX += (gx - this.gazeX) * ease;
    this.gazeY += (gy - this.gazeY) * ease;
    p.look.style.transform = `translate(${this.gazeX}px, ${this.gazeY}px) scale(${lookScale})`;

    // "!" pops up with a small overshoot, rises, and fades at the end.
    if (alert) {
      const age = SHOCK.alertMs - alertLeft;
      const pop = age < 90 ? 0.4 + (age / 90) * 0.9 : age < 180 ? 1.3 - ((age - 90) / 90) * 0.3 : 1;
      p.alert.style.opacity = `${Math.min(1, alertLeft / 200)}`;
      p.alert.style.transform = `translateY(${-(age / SHOCK.alertMs) * 1.5}px) scale(${pop})`;
    } else {
      p.alert.style.opacity = "0";
    }

    // Two "z"s drift up and out from the stalk while asleep.
    const zs = [p.z1, p.z2];
    zs.forEach((z, i) => {
      if (verb !== "rest" || still) {
        z.style.opacity = "0";
        return;
      }
      const ph = ((T / SLEEP.zPeriodS + this.blinkOffset + i * 0.5) % 1 + 1) % 1;
      z.style.opacity = `${Math.sin(ph * Math.PI) * 0.9}`;
      z.style.transform = `translate(${ph * 4}px, ${-ph * 8}px)`;
    });

    // The physics body is centred at (12, 17) in the 24-unit box.
    const k = this.size / 24;
    const left = this.body.position.x - 12 * k;
    const top = this.body.position.y - 17 * k;
    this.el.style.transform = `translate(${left}px, ${top}px)`;
  }

  remove() {
    this.el.remove();
  }
}
