"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { animate } from "animejs";

const WHITE = "#ffffff";
const BLUE = "#3b82f6";
const GREEN = "#52D273";
const BLACK = "#000000";
const REVEAL_DUR = 650; // ms, circular hole opening from screen center
const HOLD = 200; // ms, fully-covered pause before the reveal

// Layered cover: each diamond gets its own start delay + duration. The list
// is ordered back-to-front (white drawn first/at the back, black drawn last
// and on top), giving a visible outside-in ring stack of white → blue →
// green → black. Fastest (shortest duration) leads as the outermost ring;
// slowest finishes last and triggers the route change.
const COVER_LAYERS = [
  { color: WHITE, delay: 0, duration: 280 },
  { color: BLUE, delay: 70, duration: 320 },
  { color: GREEN, delay: 140, duration: 360 },
  { color: BLACK, delay: 210, duration: 400 },
] as const;

type Ctx = { navigate: (href: string) => void };
const RollTransitionContext = createContext<Ctx>({ navigate: () => {} });

export const useRollTransition = () => useContext(RollTransitionContext);

// Smallest diamond "radius" (Manhattan distance) that fully covers the
// viewport from a given point — the diamond reaches a point (px, py) once
// |px - x| + |py - y| <= r, so the worst-case corner sets the target.
function maxDiamondRadius(x: number, y: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.max(x + y, w - x + y, x + h - y, w - x + h - y);
}

export default function RollTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // "idle" = no overlay, "covering" = diamonds expanding from screen center,
  // "covered" = screen black + navigating, "revealing" = hole opening from
  // the center of the screen.
  const phaseRef = useRef<"idle" | "covering" | "covered" | "revealing">(
    "idle"
  );
  const pendingHref = useRef<string | null>(null);
  const coverPolyRefs = useRef<(SVGPolygonElement | null)[]>([]);
  const revealHoleRef = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState(false);
  const [stage, setStage] = useState<"cover" | "reveal">("cover");

  const navigate = useCallback(
    (href: string) => {
      if (phaseRef.current !== "idle" || href === pathname) return;
      pendingHref.current = href;
      phaseRef.current = "covering";
      setStage("cover");
      setActive(true);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const maxR = maxDiamondRadius(cx, cy);
      requestAnimationFrame(() => {
        COVER_LAYERS.forEach((layer, i) => {
          const el = coverPolyRefs.current[i];
          if (!el) return;
          const state = { r: 0 };
          const isLast = i === COVER_LAYERS.length - 1;
          animate(state, {
            r: maxR,
            duration: layer.duration,
            delay: layer.delay,
            ease: "inQuad",
            onUpdate: () => {
              el.setAttribute(
                "transform",
                `translate(${cx} ${cy}) scale(${state.r})`
              );
            },
            onComplete: () => {
              if (isLast) {
                phaseRef.current = "covered";
                router.push(pendingHref.current as string);
              }
            },
          });
        });
      });
    },
    [pathname, router]
  );

  // Once the route changes, hold briefly, then open a circular hole from the
  // screen center that grows out to reveal the new page.
  useEffect(() => {
    if (phaseRef.current !== "covered") return;
    phaseRef.current = "revealing";
    pendingHref.current = null;
    setStage("reveal");

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        if (!revealHoleRef.current) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        // Farthest viewport corner from center — Euclidean radius needed
        // for the circle to fully clear the screen.
        const maxR = Math.hypot(cx, cy);
        const state = { r: 0 };
        animate(state, {
          r: maxR,
          duration: REVEAL_DUR,
          ease: "outQuad",
          onUpdate: () => {
            revealHoleRef.current?.setAttribute("r", String(state.r));
          },
          onComplete: () => {
            phaseRef.current = "idle";
            setActive(false);
          },
        });
      });
    }, HOLD);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <RollTransitionContext.Provider value={{ navigate }}>
      {children}
      {active && (
        <svg
          aria-hidden
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            pointerEvents: "auto",
          }}
        >
          {stage === "cover" ? (
            // Stacked unit diamonds, each scaled outward from the screen
            // center. Render order = z-order, so black sits on top; the
            // staggered timing makes the leading edge race out as white,
            // with blue/green/black rings catching up behind it.
            <>
              {COVER_LAYERS.map((layer, i) => (
                <polygon
                  key={layer.color}
                  ref={(el) => {
                    coverPolyRefs.current[i] = el;
                  }}
                  points="0,-1 1,0 0,1 -1,0"
                  fill={layer.color}
                  transform="translate(0 0) scale(0)"
                />
              ))}
            </>
          ) : (
            // Reveal: a black overlay with a circular hole carved out by an
            // SVG mask. The mask's circle starts at r=0 (fully black screen)
            // and grows until the page underneath is fully visible.
            <>
              <defs>
                <mask id="roll-reveal-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <circle
                    ref={revealHoleRef}
                    cx="50%"
                    cy="50%"
                    r="0"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={BLACK}
                mask="url(#roll-reveal-mask)"
              />
            </>
          )}
        </svg>
      )}
    </RollTransitionContext.Provider>
  );
}

/** Drop-in <a>-like component that triggers the diamond roll transition. */
export function RollTransitionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { navigate } = useRollTransition();
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
