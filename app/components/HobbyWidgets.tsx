"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";

const CARD =
  "rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm";
const HEAD = "font-mono text-xs uppercase tracking-widest text-white/70";

/* ------------------------------------------------------------------ *
 * Fishing minigame — cast, wait for the bite, reel in time.
 * ------------------------------------------------------------------ */

type Phase = "idle" | "waiting" | "bite" | "done";
const CATCH = ["🐟", "🐠", "🐡", "🦐", "🦀", "🐙", "🥾", "🪣"];

export function FishingGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("Cast your line to start.");
  const [score, setScore] = useState(0);
  const biteRef = useRef<number | null>(null);
  const missRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (biteRef.current) window.clearTimeout(biteRef.current);
    if (missRef.current) window.clearTimeout(missRef.current);
    biteRef.current = null;
    missRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const cast = () => {
    clearTimers();
    setPhase("waiting");
    setMsg("Waiting for a bite…");
    biteRef.current = window.setTimeout(
      () => {
        setPhase("bite");
        setMsg("❗ REEL IT IN!");
        missRef.current = window.setTimeout(() => {
          setPhase("done");
          setMsg("It got away… try again.");
        }, 1100);
      },
      1400 + Math.random() * 3000,
    );
  };

  const reel = () => {
    if (phase === "waiting") {
      clearTimers();
      setPhase("done");
      setMsg("Too early — you spooked it.");
      return;
    }
    if (phase === "bite") {
      clearTimers();
      const fish = CATCH[Math.floor(Math.random() * CATCH.length)];
      setScore((s) => s + 1);
      setPhase("done");
      setMsg(`Nice catch! ${fish}`);
    }
  };

  const active = phase === "waiting" || phase === "bite";

  return (
    <div className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <p className={HEAD}>{"// fishing"}</p>
        <span className="font-mono text-[11px] text-white/60">
          caught: {score}
        </span>
      </div>

      <div
        className={`relative flex h-28 items-end justify-center overflow-hidden rounded-md border border-white/10 transition-colors ${
          phase === "bite" ? "bg-sky-500/30" : "bg-sky-900/30"
        }`}
      >
        <span
          className="absolute text-2xl transition-all duration-300"
          style={{
            top: phase === "bite" ? "54%" : "30%",
            transform: "translateX(-50%)",
            left: "50%",
          }}
        >
          🎣
        </span>
        {phase === "bite" && (
          <span className="absolute left-1/2 top-[60%] -translate-x-1/2 animate-ping text-lg">
            ❗
          </span>
        )}
        <div className="h-3 w-full bg-sky-400/20" />
      </div>

      <p className="mt-2 h-4 text-center text-xs text-white/75">{msg}</p>

      <button
        onClick={active ? reel : cast}
        className="mt-2 w-full rounded-md border border-white/20 bg-white/5 py-1.5 font-mono text-xs text-white transition-colors hover:bg-white/15"
      >
        {active ? "Reel! 🪝" : "Cast 🎣"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Minecraft speedrun — MCSR Ranked 1v1. Each player gets randomized
 * segment times; their dot moves along its own line at its own pace;
 * lower total wins. Loops with a fresh race each round.
 * ------------------------------------------------------------------ */

// Per-segment time ranges (seconds). `img` is the checkpoint icon —
// TODO: drop the real images into /public/speedrun/ (these paths) later.
const SEGMENTS = [
  {
    name: "Entered Nether",
    ab: "Nether",
    img: "/speedrun/netherrack.png",
    min: 60,
    max: 120,
  },
  {
    name: "Entered Bastion",
    ab: "Bastion",
    img: "/speedrun/blackstone.png",
    min: 4,
    max: 60,
  },
  {
    name: "Entered Fortress",
    ab: "Fortress",
    img: "/speedrun/nether-brick.png",
    min: 180,
    max: 300,
  },
  {
    name: "Finding Stronghold",
    ab: "Finding Stronghold",
    img: "/speedrun/ender-eye.png",
    min: 75,
    max: 105,
  },
  {
    name: "Found Stronghold",
    ab: "Found Stronghold",
    img: "/speedrun/smooth-stone-bricks.png",
    min: 60,
    max: 90,
  },
  {
    name: "Entered The End",
    ab: "The End",
    img: "/speedrun/end-portal-frame.png",
    min: 30,
    max: 60,
  },
  { name: "Match Win", ab: "Win", img: "/speedrun/dragon-egg.png", min: 50, max: 70 },
];

const X0 = 20;
const XEND = 300;
const STEP = (XEND - X0) / SEGMENTS.length;
const NODE_X = SEGMENTS.map((_, i) => X0 + (i + 1) * STEP);
const ICON_Y = 6; // top icon row
const ICON_SIZE = 22;
const TOP_Y = 58; // the two lanes, nearly overlapping
const BOT_Y = 64;
const RACE_MS = 6000; // wall-clock the winner's full run maps to

const ri = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));
const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Lane({ y, cls, color }: { y: number; cls: string; color: string }) {
  return (
    <>
      <line
        x1={X0}
        y1={y}
        x2={XEND}
        y2={y}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
      />
      <circle className={cls} cx={X0} cy={y} r="3.5" fill={color} />
    </>
  );
}

type Run = { segs: number[]; cum: number[]; total: number };
function makeRun(): Run {
  const segs = SEGMENTS.map((s) => ri(s.min, s.max));
  const cum: number[] = [];
  segs.reduce((a, s) => {
    const v = a + s;
    cum.push(v);
    return v;
  }, 0);
  return { segs, cum, total: cum[cum.length - 1] };
}

export function MinecraftSpeedrun() {
  const ref = useRef<HTMLDivElement>(null);
  // One race per mount (re-equipping the hat remounts → new random race).
  const [runs] = useState(() => ({ a: makeRun(), b: makeRun() }));
  const you = runs.a;
  const opp = runs.b;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const a = runs.a;
    const b = runs.b;

    const dotA = root.querySelector<SVGCircleElement>(".dot-you");
    const dotB = root.querySelector<SVGCircleElement>(".dot-opp");
    if (!dotA || !dotB) return;
    dotA.setAttribute("cx", String(X0));
    dotB.setAttribute("cx", String(X0));

    // Winner reaches the flag at RACE_MS; the slower player is frozen
    // wherever they are at that moment.
    const winnerTotal = Math.min(a.total, b.total);
    const scale = RACE_MS / winnerTotal;
    const frames = (r: Run) =>
      r.segs.map((s, i) => ({
        to: NODE_X[i],
        duration: Math.max(40, s * scale),
        ease: "linear" as const,
      }));

    const tl = createTimeline();
    tl.add(dotA, { cx: frames(a) }, 0);
    tl.add(dotB, { cx: frames(b) }, 0);

    // Stop the race the instant the winner finishes (loser freezes).
    const stop = window.setTimeout(() => {
      tl.pause();
    }, RACE_MS);

    return () => {
      tl.pause();
      window.clearTimeout(stop);
    };
  }, [runs]);

  return (
    <div ref={ref} className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <p className={HEAD}>{"// minecraft speedrun"}</p>
        <span className="flex items-center gap-2 font-mono text-[10px] text-white/60">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Choco
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            WCarson
          </span>
        </span>
      </div>

      <svg viewBox="0 0 320 92" className="w-full">
        {SEGMENTS.map((s, i) => (
          <g key={s.name}>
            {/* vertical line piercing both lanes, up to the icon */}
            <line
              x1={NODE_X[i]}
              y1={ICON_Y + ICON_SIZE}
              x2={NODE_X[i]}
              y2={BOT_Y}
              stroke="rgba(255,255,255,0.12)"
            />
            {/* checkpoint icon — placeholder until /speedrun/*.png exist */}
            <rect
              x={NODE_X[i] - ICON_SIZE / 2}
              y={ICON_Y}
              width={ICON_SIZE}
              height={ICON_SIZE}
              rx="3"
              fill="none"
            />
            <image
              href={s.img}
              x={NODE_X[i] - ICON_SIZE / 2}
              y={ICON_Y}
              width={ICON_SIZE}
              height={ICON_SIZE}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        ))}

        <Lane y={TOP_Y} cls="dot-you" color="#34d399" />
        <Lane y={BOT_Y} cls="dot-opp" color="#fbbf24" />

      </svg>

      <div className="mt-1 grid grid-cols-[1fr_auto_auto] gap-x-3 text-[10px]">
        <span className="font-mono text-white/40">split</span>
        <span className="text-right font-mono text-emerald-300/80">
          Chocoloco
        </span>
        <span className="text-right font-mono text-amber-300/80">Carson</span>
        {SEGMENTS.map((s, i) => (
          <div
            key={s.name}
            className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-3"
          >
            <span className="truncate text-white/65">{s.ab}</span>
            <span
              className={`text-right font-mono ${
                you.cum[i] <= opp.cum[i] ? "text-emerald-300" : "text-white/50"
              }`}
            >
              {fmt(you.cum[i])}
            </span>
            <span
              className={`text-right font-mono ${
                opp.cum[i] < you.cum[i] ? "text-amber-300" : "text-white/50"
              }`}
            >
              {fmt(opp.cum[i])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dead by Daylight — hit the skill check when the needle is in the zone.
 * ------------------------------------------------------------------ */

export function DbdSkillCheck() {
  const needleRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [zone, setZone] = useState(220); // zone start angle (deg)
  const [result, setResult] = useState<"great" | "good" | "miss" | null>(null);
  const [great, setGreat] = useState(0);

  const ZONE_W = 55; // success arc width
  const GREAT_W = 12; // perfect sub-zone at the start of the zone

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      angleRef.current = (angleRef.current + dt * 0.36) % 360; // ~1s/rev
      if (needleRef.current) {
        needleRef.current.setAttribute(
          "transform",
          `rotate(${angleRef.current} 50 50)`,
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const attempt = useCallback(() => {
    const a = angleRef.current;
    const rel = (a - zone + 360) % 360;
    let r: "great" | "good" | "miss";
    if (rel <= GREAT_W) r = "great";
    else if (rel <= ZONE_W) r = "good";
    else r = "miss";
    setResult(r);
    if (r === "great") setGreat((g) => g + 1);
    if (r !== "miss") setZone(Math.floor(Math.random() * 360)); // move it
  }, [zone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        attempt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attempt]);

  // arc path for the success zone (and the inner "great" slice)
  const arc = (startDeg: number, widthDeg: number, r: number) => {
    const p = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)];
    };
    const [x1, y1] = p(startDeg);
    const [x2, y2] = p(startDeg + widthDeg);
    const large = widthDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const tone =
    result === "great"
      ? "text-emerald-300"
      : result === "good"
        ? "text-sky-300"
        : result === "miss"
          ? "text-rose-300"
          : "text-white/50";

  return (
    <div className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <p className={HEAD}>{"// dead by daylight"}</p>
        <span className="font-mono text-[11px] text-white/60">
          great: {great}
        </span>
      </div>

      <button
        onClick={attempt}
        title="Hit the skill check (or press Space)"
        className="mx-auto block"
      >
        <svg viewBox="0 0 100 100" className="h-28 w-28">
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
          />
          <path
            d={arc(zone, ZONE_W, 38)}
            fill="none"
            stroke="rgba(56,189,248,0.7)"
            strokeWidth="6"
          />
          <path
            d={arc(zone, GREAT_W, 38)}
            fill="none"
            stroke="rgba(52,211,153,0.95)"
            strokeWidth="6"
          />
          <g ref={needleRef}>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="14"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          <circle cx="50" cy="50" r="3" fill="#ffffff" />
        </svg>
      </button>

      <p className={`mt-1 text-center font-mono text-xs ${tone}`}>
        {result === "great"
          ? "Great!"
          : result === "good"
            ? "Good."
            : result === "miss"
              ? "Miss."
              : "[Space]"}
      </p>
    </div>
  );
}
