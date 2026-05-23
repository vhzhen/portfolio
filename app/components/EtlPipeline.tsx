"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

const MONO = "var(--font-geist-mono), monospace";
const STROKE = "rgba(255,255,255,0.35)";
const FILL = "rgba(255,255,255,0.06)";

// Each source emits a differently-shaped, differently-coloured packet;
// they all converge to the same green square at the Transform stage.
const PACKETS = [
  { w: 16, rx: 8, color: "#38bdf8" }, // circle  (API)
  { w: 24, rx: 3, color: "#f59e0b" }, // wide bar (database)
  { w: 14, rx: 1, color: "#a78bfa" }, // square  (flat file)
];
const TARGET = { w: 16, rx: 2, color: "#22c55e" };

function Box({
  x,
  w,
  label,
  sub,
}: {
  x: number;
  w: number;
  label: string;
  sub?: string;
}) {
  const cx = x + w / 2;
  return (
    <g>
      <rect
        x={x}
        y={50}
        width={w}
        height={44}
        rx={4}
        fill={FILL}
        stroke={STROKE}
      />
      <text
        x={cx}
        y={sub ? 70 : 76}
        textAnchor="middle"
        fontSize="9"
        fontFamily={MONO}
        fill="rgba(255,255,255,0.85)"
      >
        {label}
      </text>
      {sub && (
        <text
          x={cx}
          y={84}
          textAnchor="middle"
          fontSize="7"
          fontFamily={MONO}
          fill="rgba(255,255,255,0.55)"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/**
 * A looping Extract–Transform–Load pipeline built from simple shapes:
 * multiple grouped sources are extracted over API/SFTP, transformed in
 * Python, then loaded by the application server (S3 upload triggers an
 * AWS Lambda that verifies the data) into MongoDB.
 */
export default function EtlPipeline() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Offset travels exactly one dash period (dasharray 6 6 → 12) so the
    // loop is seamless instead of jumping back at the end of a cycle.
    const pipes = animate(root.querySelectorAll(".etl-pipe"), {
      strokeDashoffset: [0, -12],
      loop: true,
      duration: 500,
      ease: "linear",
    });

    const packets = root.querySelectorAll<SVGRectElement>(".etl-packet");
    const anims = Array.from(packets).map((node, i) => {
      const src = PACKETS[i % PACKETS.length];
      return animate(node, {
        // Only dwells at Transform and at the Backend Service; moves
        // continuously everywhere else.
        x: [
          { to: 140, duration: 600 }, // extracted → into Transform
          { to: 140, duration: 520 }, // STOP at Transform
          { to: 240, duration: 680 }, // → into Backend Service
          { to: 240, duration: 520 }, // STOP at Backend Service
          { to: 322, duration: 580 }, // → centre of MongoDB
        ],
        // each source's colour holds, then unifies during the Transform dwell
        fill: [
          { to: src.color, duration: 600 },
          { to: TARGET.color, duration: 520 },
          { to: TARGET.color, duration: 1780 },
        ],
        // each source's shape holds, then unifies during the Transform dwell
        rx: [
          { to: src.rx, duration: 600 },
          { to: TARGET.rx, duration: 520 },
          { to: TARGET.rx, duration: 1780 },
        ],
        width: [
          { to: src.w, duration: 600 },
          { to: TARGET.w, duration: 520 },
          { to: TARGET.w, duration: 1780 },
        ],
        // settle into the centre of MongoDB, then reset for the loop
        y: [
          { to: 67, duration: 2900 },
          { to: 74, duration: 260, ease: "in(2)" },
        ],
        opacity: [
          { to: 0.2, duration: 200 }, // fade in only once its run starts
          { to: 0.2, duration: 2700 },
          { to: 0, duration: 260 },
        ],
        loop: true,
        // Reverse the stagger so the *last-painted* (top) packet leads and
        // earlier ones trail underneath — reads as followers catching up,
        // not the rear block pushing the front ones.
        delay: (PACKETS.length - 1 - i) * 950,
        ease: "inOut(2)",
      });
    });

    return () => {
      pipes.pause();
      anims.forEach((a) => a.pause());
    };
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-white/70">
        {"// etl pipeline"}
      </p>
      <svg viewBox="0 0 352 134" className="w-full">
        <defs>
          <marker
            id="etl-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="rgba(255,255,255,0.5)" />
          </marker>
        </defs>

        {/* dashed packet pipes (seamless flow) */}
        {[
          "M 52 75 H 118",
          "M 184 75 H 192",
          "M 304 75 H 312",
        ].map((d, i) => (
          <path
            key={i}
            className="etl-pipe"
            d={d}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
            strokeDasharray="6 6"
            fill="none"
          />
        ))}

        {/* grouped multiple sources */}
        <g>
          <rect
            x={4}
            y={34}
            width={46}
            height={82}
            rx={6}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />
          {/* a flat file */}
          <rect
            x={13}
            y={42}
            width={20}
            height={15}
            rx={2}
            fill={FILL}
            stroke={STROKE}
          />
          {/* a database */}
          <g>
            <ellipse
              cx={23}
              cy={66}
              rx={10}
              ry={3}
              fill="rgba(255,255,255,0.12)"
              stroke={STROKE}
            />
            <path
              d="M 13 66 V 78 A 10 3 0 0 0 33 78 V 66"
              fill={FILL}
              stroke={STROKE}
            />
          </g>
          {/* an API endpoint */}
          <polygon
            points="23,90 31,95 31,104 23,109 15,104 15,95"
            fill={FILL}
            stroke={STROKE}
          />
          <text
            x={27}
            y={128}
            textAnchor="middle"
            fontSize="7"
            fontFamily={MONO}
            fill="rgba(255,255,255,0.7)"
          >
            sources
          </text>
        </g>

        {/* extract: API / SFTP arrows */}
        <path
          d="M 52 65 H 113"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#etl-arrow)"
        />
        <path
          d="M 52 85 H 113"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#etl-arrow)"
        />
        <text
          x={84}
          y={59}
          textAnchor="middle"
          fontSize="7"
          fontFamily={MONO}
          fill="rgba(255,255,255,0.75)"
        >
          API
        </text>
        <text
          x={84}
          y={99}
          textAnchor="middle"
          fontSize="7"
          fontFamily={MONO}
          fill="rgba(255,255,255,0.75)"
        >
          SFTP
        </text>

        <Box x={120} w={64} label="Transform" sub="Python" />
        <Box
          x={192}
          w={112}
          label="Validate & Load"
          sub="AWS S3 → AWS Lambda"
        />

        {/* MongoDB target */}
        <g>
          <ellipse
            cx={330}
            cy={52}
            rx={18}
            ry={6}
            fill="rgba(255,255,255,0.12)"
            stroke={STROKE}
          />
          <path
            d="M 312 52 V 98 A 18 6 0 0 0 348 98 V 52"
            fill={FILL}
            stroke={STROKE}
          />
          <text
            x={330}
            y={116}
            textAnchor="middle"
            fontSize="8"
            fontFamily={MONO}
            fill="rgba(255,255,255,0.7)"
          >
            MongoDB
          </text>
        </g>

        {/* data packets — one per source, distinct shape & colour */}
        {PACKETS.map((p, i) => (
          <rect
            key={i}
            className="etl-packet"
            x={40}
            y={67}
            width={p.w}
            height={16}
            rx={p.rx}
            fill={p.color}
            opacity={0}
          />
        ))}
      </svg>
      <p className="mt-2 text-[11px] leading-snug text-white/55">
        Designed and deployed ETL pipelines for Syndigo, Frosty Acres, and Essendant via API/SFTP integrations, ingesting new items weekly.
      </p>
    </div>
  );
}
