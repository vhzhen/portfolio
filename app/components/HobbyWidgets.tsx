"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";

const CARD =
  "rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm";
const HEAD = "font-mono text-xs uppercase tracking-widest text-white/70";

/* ------------------------------------------------------------------ *
 * Fishing — static photo.
 * ------------------------------------------------------------------ */

export function FishingGame() {
  return (
    <div className={CARD}>
      <p className={`${HEAD} mb-2`}>{"// fishing"}</p>
      <div className="overflow-hidden rounded-md border border-white/10">
        <img
          src="/fishing.png"
          alt="Out fishing"
          className="h-auto w-full object-cover"
          draggable={false}
        />
      </div>
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

const X0 = 26;
const XEND = 300;
const ICON_SIZE = 18;
const CONNECTOR = 8; // stub between a lane and its icon
const LINE_A_Y = 56; // top player's line
const LINE_B_Y = 156; // bottom player's line (wide gap — markers alternate
//                        above/below each line, so each needs clearance)
const RACE_MS = 6000; // wall-clock the slower full run maps to

const ri = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));
const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// x-position is proportional to elapsed game-time, same scale for both
// players — so dots move at a constant rate and each player's splits
// land wherever their own clock put them.
const xAt = (cum: number, maxTotal: number) =>
  X0 + (cum / maxTotal) * (XEND - X0);

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

// When the dot reaches a split, the connector "draws" out from the lane
// and the checkpoint icon pops in.
function SplitMarker({
  x,
  lineY,
  up,
  img,
  name,
  time,
  revealed,
}: {
  x: number;
  lineY: number;
  up: boolean; // icon sits above (true) or below (false) its own lane
  img: string;
  name: string;
  time: string;
  revealed: boolean;
}) {
  // Icon hangs off the lane by CONNECTOR; labels sit on the far side.
  const iconTop = up
    ? lineY - CONNECTOR - ICON_SIZE
    : lineY + CONNECTOR;
  const connectorEnd = up ? iconTop + ICON_SIZE : iconTop;
  const len = Math.abs(lineY - connectorEnd);
  const nameY = up ? iconTop - 12 : iconTop + ICON_SIZE + 9;
  const timeY = up ? iconTop - 4 : iconTop + ICON_SIZE + 17;
  return (
    <g>
      <line
        x1={x}
        y1={lineY}
        x2={x}
        y2={connectorEnd}
        stroke="rgba(255,255,255,0.2)"
        strokeDasharray={len}
        strokeDashoffset={revealed ? 0 : len}
        style={{ transition: "stroke-dashoffset 280ms ease" }}
      />
      <g
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed
            ? "translateY(0)"
            : `translateY(${up ? 4 : -4}px)`,
          transition: "opacity 220ms ease 120ms, transform 220ms ease 120ms",
        }}
      >
        <image
          href={img}
          x={x - ICON_SIZE / 2}
          y={iconTop}
          width={ICON_SIZE}
          height={ICON_SIZE}
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x={x}
          y={nameY}
          textAnchor="middle"
          fontSize="6"
          fontFamily="monospace"
          fill="rgba(255,255,255,0.7)"
        >
          {name}
        </text>
        <text
          x={x}
          y={timeY}
          textAnchor="middle"
          fontSize="6"
          fontFamily="monospace"
          fill="rgba(255,255,255,0.5)"
        >
          {time}
        </text>
      </g>
    </g>
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
  const maxTotal = Math.max(you.total, opp.total);

  // How many splits each player has reached (drives icon reveal + times).
  const [revA, setRevA] = useState(0);
  const [revB, setRevB] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const a = runs.a;
    const b = runs.b;

    const dotA = root.querySelector<SVGCircleElement>(".dot-you");
    const dotB = root.querySelector<SVGCircleElement>(".dot-opp");
    const lineA = root.querySelector<SVGLineElement>(".progress-you");
    const lineB = root.querySelector<SVGLineElement>(".progress-opp");
    if (!dotA || !dotB || !lineA || !lineB) return;
    dotA.setAttribute("cx", String(X0));
    dotB.setAttribute("cx", String(X0));
    lineA.setAttribute("x2", String(X0));
    lineB.setAttribute("x2", String(X0));

    // Both dots move at the same pixel rate; the slower run fills the
    // whole width over RACE_MS, the faster run finishes short of the end.
    const tMax = Math.max(a.total, b.total);
    const winnerTotal = Math.min(a.total, b.total);
    const winnerFinishTime = (winnerTotal / tMax) * RACE_MS;

    const xFinalA = xAt(a.total, tMax);
    const xFinalB = xAt(b.total, tMax);
    const durA = (a.total / tMax) * RACE_MS;
    const durB = (b.total / tMax) * RACE_MS;

    const tl = createTimeline();
    tl.add(
      dotA,
      {
        cx: xFinalA,
        duration: durA,
        ease: "linear",
      },
      0,
    );
    tl.add(
      dotB,
      {
        cx: xFinalB,
        duration: durB,
        ease: "linear",
      },
      0,
    );

    // Sync progress lines to dots each frame so they fill in as dots move.
    let rafId: number | null = null;
    const syncLines = () => {
      const cxA = parseFloat(dotA.getAttribute("cx") || String(X0));
      lineA.setAttribute("x2", String(cxA));

      const cxB = parseFloat(dotB.getAttribute("cx") || String(X0));
      lineB.setAttribute("x2", String(cxB));

      rafId = requestAnimationFrame(syncLines);
    };
    rafId = requestAnimationFrame(syncLines);

    // Reveal each split (icon + recorded time) as that dot reaches it.
    // The loser only reveals splits before the winner finishes.
    const timers: number[] = [];
    const schedule = (run: Run, set: (n: number) => void, isWinner: boolean) =>
      run.cum.forEach((c, i) => {
        const splitTime = (c / tMax) * RACE_MS;
        // Only reveal if this player won, or if the split happened before winner finished.
        if (isWinner || splitTime < winnerFinishTime) {
          timers.push(
            window.setTimeout(
              () => set(i + 1),
              splitTime,
            ),
          );
        }
      });
    schedule(a, setRevA, a.total === winnerTotal);
    schedule(b, setRevB, b.total === winnerTotal);

    // Freeze the loser when the winner finishes.
    timers.push(
      window.setTimeout(() => {
        tl.pause();
      }, winnerFinishTime),
    );

    return () => {
      tl.pause();
      if (rafId) cancelAnimationFrame(rafId);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [runs]);
  
  return (
    <div ref={ref} className={CARD}>
      <div className="mb-2 flex items-center justify-between">
        <p className={HEAD}>{"// MCSR Ranked"}</p>
        <span className="flex items-center gap-2 font-mono text-[10px] text-white/60">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Choco
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Shu
          </span>
        </span>
      </div>

      <svg viewBox="0 0 320 212" className="w-full">
        {SEGMENTS.map((s, i) => (
          <SplitMarker
            key={`a-${s.name}`}
            x={xAt(you.cum[i], maxTotal)}
            lineY={LINE_A_Y}
            up={i % 2 === 0}
            img={s.img}
            name={s.ab}
            time={fmt(you.cum[i])}
            revealed={i < revA}
          />
        ))}
        {SEGMENTS.map((s, i) => (
          <SplitMarker
            key={`b-${s.name}`}
            x={xAt(opp.cum[i], maxTotal)}
            lineY={LINE_B_Y}
            up={i % 2 === 0}
            img={s.img}
            name={s.ab}
            time={fmt(opp.cum[i])}
            revealed={i < revB}
          />
        ))}

        {/* Progress lines: fill in with player color as they move */}
        <line
          className="progress-you"
          x1={X0}
          y1={LINE_A_Y}
          x2={X0}
          y2={LINE_A_Y}
          stroke="#34d399"
          strokeWidth="2"
        />
        <line
          className="progress-opp"
          x1={X0}
          y1={LINE_B_Y}
          x2={X0}
          y2={LINE_B_Y}
          stroke="#fbbf24"
          strokeWidth="2"
        />

        <Lane y={LINE_A_Y} cls="dot-you" color="#34d399" />
        <Lane y={LINE_B_Y} cls="dot-opp" color="#fbbf24" />
      </svg>

      <div className="mt-1 grid grid-cols-[1fr_3rem_3rem] gap-x-3 text-[10px]">
        <span className="font-mono text-white/40">split</span>
        <span className="text-right font-mono text-emerald-300/80">
          Choco
        </span>
        <span className="text-right font-mono text-amber-300/80">Shu</span>
        {SEGMENTS.map((s, i) => {
          const aShown = i < revA;
          const bShown = i < revB;
          return (
            <div
              key={s.name}
              className="col-span-3 grid grid-cols-[1fr_3rem_3rem] gap-x-3"
            >
              <span className="truncate text-white/65">{s.ab}</span>
              <span
                className={`text-right font-mono ${
                  aShown && you.cum[i] <= opp.cum[i]
                    ? "text-emerald-300"
                    : "text-white/50"
                }`}
              >
                {aShown ? fmt(you.cum[i]) : "—"}
              </span>
              <span
                className={`text-right font-mono ${
                  bShown && opp.cum[i] < you.cum[i]
                    ? "text-amber-300"
                    : "text-white/50"
                }`}
              >
                {bShown ? fmt(opp.cum[i]) : "—"}
              </span>
            </div>
          );
        })}
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
  const [good, setGood] = useState(0);
  const [paused, setPaused] = useState(
    () => sessionStorage.getItem("dbd-paused") === "true",
  );

  const ZONE_W = 55; // success arc width
  const GREAT_W = 12; // perfect sub-zone at the start of the zone

  useEffect(() => {
    sessionStorage.setItem("dbd-paused", String(paused));
  }, [paused]);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      if (!paused) {
        const dt = now - last;
        angleRef.current = (angleRef.current + dt * 0.36) % 360; // ~1s/rev
        if (needleRef.current) {
          needleRef.current.setAttribute(
            "transform",
            `rotate(${angleRef.current} 50 50)`,
          );
        }
      }
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused]);

  const attempt = useCallback(() => {
    if (paused) return;
    const a = angleRef.current;
    const rel = (a - zone + 360) % 360;
    let r: "great" | "good" | "miss";
    if (rel <= GREAT_W) r = "great";
    else if (rel <= ZONE_W) r = "good";
    else r = "miss";
    setResult(r);
    if (r === "great") setGreat((g) => g + 1);
    if (r === "good") setGood((g) => g + 1);
    if (r !== "miss") setZone(Math.floor(Math.random() * 360));
  }, [zone, paused]);

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
    <div className={`${CARD} relative`}>
      <div className="mb-2 flex items-center justify-between">
        <p className={HEAD}>{"// dead by daylight"}</p>
        <div className="flex flex-col items-end font-mono text-[11px] text-white/60">
          <span>great: {great}</span>
          <span>good: {good}</span>
        </div>
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
        {paused && result !== null
          ? ""
          : result === "great"
            ? "Great!"
            : result === "good"
              ? "Good."
              : result === "miss"
                ? "Miss."
                : "[Space]"}
      </p>

      <button
        onClick={() => { if (!paused) setResult(null); setPaused(!paused); }}
        className="absolute bottom-3 right-3 whitespace-nowrap rounded-md border border-white/20 bg-white/5 px-2 py-1 font-mono text-xs text-white transition-colors hover:bg-white/15"
      >
        {paused ? "▶" : "⏸"}
      </button>
    </div>
  );
}
