"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
  type Time,
} from "lightweight-charts";

type Point = { time: string; value: number };

// My TD Securities internship window.
const START = "2026-01-06";
const END = "2026-04-24";

// Draw-on animation should only play the first time the chart is seen
// this session, not on every re-equip of the TD cap.
let hasAnimated = false;

// Snap a target date to the closest trading day present in the series,
// so timeToCoordinate() always resolves to a real x position.
function closest(data: Point[], target: string): string | null {
  if (!data.length) return null;
  let best = data[0].time;
  let bestDiff = Infinity;
  const t = new Date(target).getTime();
  for (const p of data) {
    const d = Math.abs(new Date(p.time).getTime() - t);
    if (d < bestDiff) {
      bestDiff = d;
      best = p.time;
    }
  }
  return best;
}

function ChartSkeleton() {
  return (
    <div className="absolute inset-0 animate-pulse">
      {/* faux gridlines */}
      <div className="absolute inset-0 flex flex-col justify-between py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-px w-full bg-white/10" />
        ))}
      </div>
      {/* faux axis ticks */}
      <div className="absolute inset-x-2 bottom-1 flex justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-2 w-8 rounded bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export default function TdChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let chart: IChartApi | null = null;
    let disposed = false;
    let rafId = 0;

    (async () => {
      let data: Point[] = [];
      try {
        const res = await fetch("/api/td");
        if (!res.ok) throw new Error();
        const json = await res.json();
        data = json.data ?? [];
        if (!data.length) throw new Error();
      } catch {
        if (!disposed) setStatus("error");
        return;
      }
      if (disposed) return;
      setStatus("ready");

      chart = createChart(wrap, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(255,255,255,0.75)",
          fontFamily: "var(--font-geist-mono), monospace",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.06)" },
          horzLines: { color: "rgba(255,255,255,0.06)" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.15)" },
        timeScale: {
          borderColor: "rgba(255,255,255,0.15)",
          rightOffset: 4,
        },
        crosshair: { mode: 0 },
        handleScroll: true,
        handleScale: true,
      });

      const series = chart.addSeries(AreaSeries, {
        lineColor: "#2bd14f",
        topColor: "rgba(43,209,79,0.4)",
        bottomColor: "rgba(43,209,79,0)",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });
      const full = data as { time: Time; value: number }[];

      if (hasAnimated) {
        series.setData(full);
        chart.timeScale().fitContent();
      } else {
        hasAnimated = true;
        // Pin the time axis to the full range up front so the line
        // "draws" left-to-right instead of the axis stretching.
        const from = full[0].time;
        const to = full[full.length - 1].time;
        const DURATION = 1100;
        const t0 = performance.now();
        const tick = (now: number) => {
          if (disposed || !chart) return;
          const p = Math.min(1, (now - t0) / DURATION);
          // ease-out so it decelerates as it completes
          const eased = 1 - Math.pow(1 - p, 3);
          const n = Math.max(2, Math.floor(eased * full.length));
          series.setData(full.slice(0, n));
          chart.timeScale().setVisibleRange({ from, to });
          if (p < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            series.setData(full);
            chart.timeScale().setVisibleRange({ from, to });
          }
        };
        rafId = requestAnimationFrame(tick);
      }

      const startTime = closest(data, START);
      const endTime = closest(data, END);

      // Overlay the two internship markers as absolutely-positioned bars,
      // repositioned whenever the visible range or size changes.
      const place = () => {
        if (!chart) return;
        const ts = chart.timeScale();
        const pairs: [HTMLDivElement | null, string | null][] = [
          [startRef.current, startTime],
          [endRef.current, endTime],
        ];
        const width = wrap.clientWidth;
        for (const [node, time] of pairs) {
          if (!node) continue;
          const x = time ? ts.timeToCoordinate(time as Time) : null;
          // Hide the marker when its date is panned/zoomed out of view —
          // timeToCoordinate still returns a value for off-screen dates.
          if (x == null || x < 0 || x > width) {
            node.style.opacity = "0";
          } else {
            node.style.opacity = "1";
            node.style.transform = `translateX(${x}px)`;
          }
        }
      };

      chart.timeScale().subscribeVisibleLogicalRangeChange(place);
      requestAnimationFrame(place);

      const ro = new ResizeObserver(() => requestAnimationFrame(place));
      ro.observe(wrap);

      // Stash cleanup on the chart instance's removal.
      const origRemove = chart.remove.bind(chart);
      chart.remove = () => {
        ro.disconnect();
        origRemove();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      chart?.remove();
      chart = null;
    };
  }, []);

  return (
    <div className="rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-white/70">
        {"// TD.TO — internship window"}
      </p>
      <div className="relative h-[240px] w-full overflow-hidden">
        {status === "loading" && <ChartSkeleton />}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/60">
            couldn&apos;t load price data
          </div>
        )}
        <div ref={wrapRef} className="h-full w-full" />

        {/* Internship start / end vertical markers */}
        <div
          ref={startRef}
          className="pointer-events-none absolute inset-y-0 left-0 z-10 opacity-0"
          style={{ transition: "opacity 200ms" }}
        >
          <div className="h-full w-px bg-sky-400/80" />
          <span className="absolute top-1 left-1 whitespace-nowrap rounded bg-sky-400/20 px-1 text-[10px] text-sky-200">
            joined · Jan 6
          </span>
        </div>
        <div
          ref={endRef}
          className="pointer-events-none absolute inset-y-0 left-0 z-10 opacity-0"
          style={{ transition: "opacity 200ms" }}
        >
          <div className="h-full w-px bg-rose-400/80" />
          <span className="absolute bottom-6 left-1 whitespace-nowrap rounded bg-rose-400/20 px-1 text-[10px] text-rose-200">
            last day · Apr 24
          </span>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-white/55">
        Drag to pan, scroll to zoom.
      </p>
    </div>
  );
}
