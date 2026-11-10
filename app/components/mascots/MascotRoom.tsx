"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import {
  BOUNCE,
  BURST,
  DIALS,
  GRIP,
  HAND,
  SCATTER_REACH,
  SHOCK,
  MAX_FRAME_MS,
  STEP_MS,
  WALL_FRICTION,
  capThrow,
  handSpeed,
  releaseSpeed,
  tipWallNormal,
  toSec,
  toStep,
  type Surface,
} from "./dials";
import { LeafPool } from "./leaves";
import { Mascot, STALK_CLEARANCE, type RoomView } from "./mascot";

const MASCOT_SIZE = 40; // px. Dials were tuned at 32; 40 reads better in a panel.
// Greens from the guide (dark-background variant) plus its rare gold one.
const COLORS = ["#9fd8b4", "#9fd8b4", "#c9a227"];
const WALL = 200; // thick, mostly off-screen walls help against tunnelling
// The ceiling sits this far down so a head pressed against it still shows
// its stalk and leaves (the body is only the head).
const TOP = (STALK_CLEARANCE * MASCOT_SIZE) / 24;

/** Matter's mouse handlers exist at runtime but aren't in its TS types. */
type MouseWithHandlers = Matter.Mouse & {
  mousemove: (e: Event) => void;
  mousedown: (e: Event) => void;
  mouseup: (e: Event) => void;
  mousewheel: (e: Event) => void;
};

/**
 * A box where Sprout mascots live: drag, throw, and watch them wander.
 * Matter decides where each mascot is; each frame we copy the position onto
 * that mascot's inline SVG.
 */
export default function MascotRoom({ count = 3 }: { count?: number }) {
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = room.clientWidth;
    let height = room.clientHeight;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: DIALS.gravity / 1000, scale: 0.001 },
    });
    const world = engine.world;

    /* ------------------------- floor, walls, ceiling ------------------------ */
    // Rebuilt on resize. Friction is set after creation because isStatic
    // resets it to 1.
    let floor: Matter.Body, left: Matter.Body, right: Matter.Body, ceiling: Matter.Body;
    let statics: Matter.Body[] = [];
    const wall = (label: Surface, x: number, y: number, w: number, h: number, friction: number) => {
      const b = Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, label });
      b.friction = friction;
      return b;
    };
    const layout = () => {
      width = room.clientWidth;
      height = room.clientHeight;
      const span = width + WALL * 2;
      Matter.Composite.remove(world, statics);
      floor = wall("floor", width / 2, height + WALL / 2, span, WALL, 0.1);
      ceiling = wall("ceiling", width / 2, TOP - WALL / 2, span, WALL, WALL_FRICTION);
      left = wall("wall", -WALL / 2, height / 2, WALL, height + WALL * 2, WALL_FRICTION);
      right = wall("wall", width + WALL / 2, height / 2, WALL, height + WALL * 2, WALL_FRICTION);
      statics = [floor, left, right, ceiling];
      Matter.Composite.add(world, statics);
    };
    layout();

    /* -------------------------------- mascots ------------------------------- */
    const mascots: Mascot[] = [];
    const byBody = new Map<number, Mascot>();
    const mascotFor = (b: Matter.Body | null | undefined) => (b ? byBody.get(b.id) : undefined);
    const leaves = new LeafPool(room);

    // Spawn once the room has a real size (it's display:none on mobile).
    const spawn = () => {
      if (mascots.length || width === 0 || height === 0) return;
      for (let i = 0; i < count; i++) {
        const x = ((i + 1) / (count + 1)) * width;
        const y = reduced.matches ? height - 1 : height * 0.3; // drop in, unless reduced motion
        const m = new Mascot(i, x, y, MASCOT_SIZE, COLORS[i % COLORS.length], room);
        mascots.push(m);
        byBody.set(m.body.id, m);
        Matter.Composite.add(world, m.body);
      }
    };
    spawn();

    /* ---------------------------- grab and throw ---------------------------- */
    const mouse = Matter.Mouse.create(room) as MouseWithHandlers;
    // Matter cancels wheel events on its element; let the page scroll normally.
    room.removeEventListener("wheel", mouse.mousewheel);
    const grab = Matter.MouseConstraint.create(engine, { mouse, constraint: { ...GRIP } });
    Matter.Composite.add(world, grab);

    const grip = { startX: 0, startY: 0, startT: 0, lastX: 0, lastY: 0, lastT: 0, vx: 0, vy: 0 };
    let pointerInside = false;

    Matter.Events.on(grab, "startdrag", (e) => {
      const m = mascotFor((e as unknown as { body: Matter.Body }).body);
      if (!m) return;
      m.onGrab();
      grip.startX = grip.lastX = mouse.position.x;
      grip.startY = grip.lastY = mouse.position.y;
      grip.startT = performance.now();
      grip.lastT = 0;
      grip.vx = grip.vy = 0;
    });

    Matter.Events.on(grab, "enddrag", (e) => {
      const m = mascotFor((e as unknown as { body: Matter.Body }).body);
      if (!m) return;
      const now = performance.now();
      const since = grip.lastT ? now - grip.lastT : Infinity;
      const [vx, vy] = releaseSpeed(grip.vx, grip.vy, since);
      m.onRelease(vx, vy, now);
      const moved = Math.hypot(mouse.position.x - grip.startX, mouse.position.y - grip.startY);
      if (moved < HAND.tapMovePx && now - grip.startT < HAND.tapMs) m.onTap(reduced.matches);
      grip.vx = grip.vy = 0;
      grip.lastT = 0;
    });

    // Measure the hand (not the body), and only on steps where it moved.
    Matter.Events.on(engine, "beforeUpdate", () => {
      if (!grab.body) return;
      const p = mouse.position;
      if (p.x === grip.lastX && p.y === grip.lastY) return;
      const now = performance.now();
      if (grip.lastT) {
        const s = Math.max(1, now - grip.lastT) / 1000;
        grip.vx = handSpeed(grip.vx, p.x - grip.lastX, s);
        grip.vy = handSpeed(grip.vy, p.y - grip.lastY, s);
      }
      grip.lastX = p.x;
      grip.lastY = p.y;
      grip.lastT = now;
    });

    // The cursor may leave the room, but the held mascot hugs the edge:
    // aim the grab constraint at the cursor clamped to where the body fits.
    // Runs after MouseConstraint's own beforeUpdate, which just pointed
    // pointA at mouse.position (a shared object, so replace it, don't mutate).
    Matter.Events.on(engine, "beforeUpdate", () => {
      const m = mascotFor(grab.body);
      const c = grab.constraint;
      if (!m || !c.pointB) return;
      const bx = Math.min(Math.max(mouse.position.x - c.pointB.x, m.halfW), width - m.halfW);
      const by = Math.min(Math.max(mouse.position.y - c.pointB.y, TOP + m.halfH), height - m.halfH);
      c.pointA = { x: bx + c.pointB.x, y: by + c.pointB.y };
    });

    // Clicking empty floor startles mascots nearby. Matter's own mousedown
    // listener ran first, so mouse.position is already current. A ripple
    // the size of the startle reach shows where the shock landed.
    const ripple = (x: number, y: number, hit: boolean) => {
      const d = SCATTER_REACH * 2;
      const el = document.createElement("div");
      el.dataset.ripple = "";
      el.style.cssText = `position:absolute;left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;border-radius:9999px;pointer-events:none;border:${hit ? 2 : 1.5}px solid rgba(255,255,255,${hit ? 0.55 : 0.3});`;
      room.appendChild(el);
      const anim = el.animate(
        [
          { transform: "scale(0.15)", opacity: 1 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: SHOCK.rippleMs, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
      );
      anim.onfinish = () => el.remove();
    };
    const onDown = () => {
      if (reduced.matches) return; // no startling with reduced motion
      const bodies = mascots.map((m) => m.body);
      if (Matter.Query.point(bodies, mouse.position).length > 0) return; // a grab
      const now = performance.now();
      const { x, y } = mouse.position;
      let hit = false;
      for (const m of mascots) hit = m.scatterFrom(x, y, now) || hit;
      ripple(x, y, hit);
    };
    room.addEventListener("mousedown", onDown);

    // Let go even if the button is released outside the room or the window.
    const onWindowMove = (e: Event) => {
      if (grab.body) mouse.mousemove(e);
    };
    const onWindowUp = (e: Event) => mouse.mouseup(e);
    const letGo = () => {
      mouse.button = -1;
    };
    const onWindowOut = (e: MouseEvent) => {
      if (!e.relatedTarget) letGo();
    };
    const onEnter = () => (pointerInside = true);
    const onLeave = () => (pointerInside = false);
    window.addEventListener("mousemove", onWindowMove);
    window.addEventListener("mouseup", onWindowUp);
    window.addEventListener("blur", letGo);
    window.addEventListener("mouseout", onWindowOut);
    room.addEventListener("mouseenter", onEnter);
    room.addEventListener("mouseleave", onLeave);

    /* ----------------------- bounce by what was hit ------------------------ */
    // Matter gives a pair the larger restitution of its two bodies and
    // recomputes it every step, so override it on start and while active.
    const setBounce = (e: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of e.pairs) {
        const { bodyA, bodyB } = pair;
        const other = bodyA.label === "mascot" ? bodyB : bodyA;
        if (other.label in BOUNCE) pair.restitution = BOUNCE[other.label as Surface];
      }
    };
    Matter.Events.on(engine, "collisionActive", setBounce);
    Matter.Events.on(engine, "collisionStart", (e) => {
      setBounce(e);
      for (const pair of e.pairs) {
        const { bodyA, bodyB } = pair;
        const a = mascotFor(bodyA);
        const b = mascotFor(bodyB);
        const m = a ?? b;
        if (!m) continue;
        const other = a ? bodyB : bodyA;

        // Floor hits keep only part of the sideways speed.
        if (other.label === "floor") {
          Matter.Body.setVelocity(m.body, {
            x: m.body.velocity.x * DIALS.groundDrag,
            y: m.body.velocity.y,
          });
          continue; // never shed leaves on a floor landing
        }

        // Hard, thrown hits on a wall, the ceiling, or another mascot shed leaves.
        const hitter = [a, b].find(
          (x) => x?.thrown && Math.hypot(x.body.velocity.x, x.body.velocity.y) * 60 > BURST.minSpeed,
        );
        if (!hitter) continue;
        const { x, y } = hitter.body.position;
        const c = hitter.color;
        if (other === left) leaves.burst(x - hitter.halfW, y, ...tipWallNormal(1), c);
        else if (other === right) leaves.burst(x + hitter.halfW, y, ...tipWallNormal(-1), c);
        else if (other === ceiling) leaves.burst(x, y - hitter.halfH, 0, 1, c);
        else if (a && b) {
          const n = pair.collision.normal;
          const sign = hitter === a ? -1 : 1;
          leaves.burst(x, y, n.x * sign, n.y * sign, c);
        }
      }
    });

    /* ------------------------ nothing escapes guard ------------------------ */
    // A held mascot hugs the edge exactly. A free one only gets corrected if
    // it got more than halfway into a wall (a fast throw tunnelling through).
    const keepInside = () => {
      for (const m of mascots) {
        const { halfW: hw, halfH: hh } = m;
        let { x, y } = m.body.position;
        let vx = toSec(m.body.velocity.x);
        let vy = toSec(m.body.velocity.y);
        let fixed = false;
        if (m.held) {
          // The stiff grab can force a held mascot into one that's pinned
          // (e.g. against a wall). Push the held one back out so outlines
          // never overlap; the other mascot keeps its own physics.
          for (const o of mascots) {
            if (o === m) continue;
            const dx = x - o.body.position.x;
            const dy = y - o.body.position.y;
            const px = hw + o.halfW - Math.abs(dx);
            const py = hh + o.halfH - Math.abs(dy);
            if (px <= 0 || py <= 0) continue;
            if (px < py) [x, vx] = [x + (dx >= 0 ? px : -px), 0];
            else [y, vy] = [y + (dy >= 0 ? py : -py), 0];
            fixed = true;
          }
          const cx = Math.min(Math.max(x, hw), width - hw);
          const cy = Math.min(Math.max(y, TOP + hh), height - hh);
          if (cx !== x) [x, vx, fixed] = [cx, 0, true];
          if (cy !== y) [y, vy, fixed] = [cy, 0, true];
        } else {
          if (x < hw / 2) [x, vx, fixed] = [hw, Math.abs(vx) * BOUNCE.wall, true];
          if (x > width - hw / 2) [x, vx, fixed] = [width - hw, -Math.abs(vx) * BOUNCE.wall, true];
          if (y < TOP + hh / 2) [y, vy, fixed] = [TOP + hh, Math.abs(vy) * BOUNCE.ceiling, true];
          if (y > height - hh / 2) [y, vy, fixed] = [height - hh, -Math.abs(vy) * BOUNCE.floor, true];
        }
        const [cx, cy] = capThrow(vx, vy);
        if (fixed) Matter.Body.setPosition(m.body, { x, y });
        if (fixed || cx !== vx || cy !== vy) {
          Matter.Body.setVelocity(m.body, { x: toStep(cx), y: toStep(cy) });
        }
      }
    };

    /* --------------------------------- loop -------------------------------- */
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const view: RoomView = {
      width,
      floorY: height,
      pointer: null,
      mascots,
      reducedMotion: reduced.matches,
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dtMs = Math.min(MAX_FRAME_MS, now - last);
      last = now;
      if (width === 0) return; // hidden: nothing to simulate
      acc += dtMs;
      while (acc >= STEP_MS) {
        Matter.Engine.update(engine, STEP_MS);
        keepInside();
        acc -= STEP_MS;
      }

      view.width = width;
      view.floorY = height;
      view.pointer = pointerInside || grab.body ? mouse.position : null;
      view.reducedMotion = reduced.matches;
      const dt = dtMs / 1000;
      for (const m of mascots) m.update(now, dt, view);
      leaves.update(dt);

      const over =
        pointerInside &&
        Matter.Query.point(mascots.map((m) => m.body), mouse.position).length > 0;
      room.style.cursor = grab.body ? "grabbing" : over && !reduced.matches ? "grab" : "";
    };
    raf = requestAnimationFrame(frame);

    // Stop while the tab is hidden; reset the clock so the first step isn't huge.
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      layout();
      spawn();
    });
    ro.observe(room);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
      window.removeEventListener("blur", letGo);
      window.removeEventListener("mouseout", onWindowOut);
      room.removeEventListener("mouseenter", onEnter);
      room.removeEventListener("mouseleave", onLeave);
      room.removeEventListener("mousedown", onDown);
      // Undo Matter.Mouse.setElement's listeners (no API for this).
      room.removeEventListener("mousemove", mouse.mousemove);
      room.removeEventListener("mousedown", mouse.mousedown);
      room.removeEventListener("mouseup", mouse.mouseup);
      room.removeEventListener("touchmove", mouse.mousemove);
      room.removeEventListener("touchstart", mouse.mousedown);
      room.removeEventListener("touchend", mouse.mouseup);
      Matter.Events.off(engine, "");
      Matter.Events.off(grab, "");
      Matter.Composite.clear(world, false);
      Matter.Engine.clear(engine);
      leaves.clear();
      for (const m of mascots) m.remove();
      room.querySelectorAll("svg, [data-ripple]").forEach((el) => el.remove());
      room.style.cursor = "";
    };
  }, [count]);

  return (
    <div
      ref={roomRef}
      className="relative h-48 w-full touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/20"
      aria-label="Sprout mascots: drag and throw them"
      role="img"
    />
  );
}
