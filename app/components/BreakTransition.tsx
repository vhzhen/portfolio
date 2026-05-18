"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { animate, stagger } from "animejs";

const COLOR = "#52D273"; // solid wrap colour
const CELL = 110; // px, approx shard edge length
const WRAP_DUR = 340; // ms, iris-in that wraps the screen
const BREAK_DUR = 900; // ms, shards flying apart
const HOLD = 300; // ms, fully-wrapped pause before the break

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });

export const useTransition = () => useContext(TransitionContext);

type Shard = { tx: number; ty: number; rot: number };

export default function BreakTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [grid, setGrid] = useState({ cols: 0, rows: 0, cw: 0, ch: 0 });
  // "idle" = no overlay, "wrapping" = colour irising in, "covered" = screen
  // hidden + navigating, "breaking" = shards scattering away.
  const phaseRef = useRef<"idle" | "wrapping" | "covered" | "breaking">("idle");
  const pendingHref = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<Shard[]>([]);
  const [active, setActive] = useState(false);

  // Size the shard grid to the viewport, +1 col/row so the tiled shards
  // always overflow the screen — no fractional-pixel seams.
  useEffect(() => {
    const measure = () => {
      const cols = Math.ceil(window.innerWidth / CELL) + 1;
      const rows = Math.ceil(window.innerHeight / CELL) + 1;
      setGrid({
        cols,
        rows,
        cw: Math.ceil(window.innerWidth / cols) + 1,
        ch: Math.ceil(window.innerHeight / rows) + 1,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const shards = () =>
    overlayRef.current
      ? Array.from(overlayRef.current.querySelectorAll<HTMLElement>(".shard"))
      : [];

  // Pre-compute where each shard flies: outward from the screen centre
  // (so the break radiates), with random spin and a downward gravity bias.
  const buildScatter = useCallback(() => {
    const { cols, rows, cw, ch } = grid;
    const cx = (cols * cw) / 2;
    const cy = (rows * ch) / 2;
    const out: Shard[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c * cw + cw / 2 - cx;
        const dy = r * ch + ch / 2 - cy;
        out.push({
          tx: dx * 1.4 + (Math.random() - 0.5) * 280,
          ty: dy * 1.4 + Math.random() * 480, // gravity pulls shards down
          rot: (Math.random() - 0.5) * 460,
        });
      }
    }
    scatterRef.current = out;
  }, [grid]);

  const navigate = useCallback(
    (href: string) => {
      if (phaseRef.current !== "idle" || href === pathname) return;
      pendingHref.current = href;
      phaseRef.current = "wrapping";
      setActive(true);

      requestAnimationFrame(() => {
        if (!overlayRef.current) return;
        // Iris-in: a small rounded blob grows to wrap the whole screen.
        animate(overlayRef.current, {
          scale: [0, 1],
          borderRadius: ["50%", "0%"],
          duration: WRAP_DUR,
          ease: "out(3)",
          onComplete: () => {
            phaseRef.current = "covered";
            router.push(pendingHref.current as string);
          },
        });
      });
    },
    [pathname, router]
  );

  // Once the route changes, hold briefly, then shatter the solid colour
  // into shards that scatter away to reveal the new page.
  useEffect(() => {
    if (phaseRef.current !== "covered") return;
    phaseRef.current = "breaking";
    pendingHref.current = null;
    buildScatter();

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const els = shards();
        if (!els.length) return;
        animate(els, {
          x: (_: unknown, i: number) => scatterRef.current[i]?.tx ?? 0,
          y: (_: unknown, i: number) => scatterRef.current[i]?.ty ?? 0,
          rotate: (_: unknown, i: number) =>
            scatterRef.current[i]?.rot ?? 0,
          scale: [1, 0.35],
          opacity: [1, 0],
          duration: BREAK_DUR,
          ease: "in(2.4)", // accelerate, like fragments under gravity
          delay: stagger(11, {
            grid: [grid.cols, grid.rows],
            from: "center",
          }),
          onComplete: () => {
            phaseRef.current = "idle";
            setActive(false);
          },
        });
      });
    }, HOLD);

    return () => clearTimeout(timer);
  }, [pathname, buildScatter, grid.cols, grid.rows]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "hidden",
          display: active ? "block" : "none",
          pointerEvents: active ? "auto" : "none",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {active &&
          Array.from({ length: grid.cols * grid.rows }).map((_, i) => {
            const r = Math.floor(i / grid.cols);
            const c = i % grid.cols;
            return (
              <div
                key={i}
                className="shard"
                style={{
                  position: "absolute",
                  left: c * grid.cw,
                  top: r * grid.ch,
                  width: grid.cw,
                  height: grid.ch,
                  background: COLOR,
                  willChange: "transform, opacity",
                }}
              />
            );
          })}
      </div>
    </TransitionContext.Provider>
  );
}

/** Drop-in <a>-like component that triggers the wrap-and-break transition. */
export function TransitionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { navigate } = useTransition();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
