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
import { animate } from "animejs";

const GREEN = "#018A00";
const WHITE = "#ffffff";
const DUR = 520; // ms per swipe
const LAG = DUR / 2; // follower starts when leader hits the middle

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });

export const useTransition = () => useContext(TransitionContext);

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // "idle" = no overlay, "covering" = panels swiping in, "covered" = screen
  // hidden + navigating, "revealing" = panels swiping away.
  const phaseRef = useRef<"idle" | "covering" | "covered" | "revealing">(
    "idle"
  );
  const pendingHref = useRef<string | null>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const greenRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      if (phaseRef.current !== "idle" || href === pathname) return;
      pendingHref.current = href;
      phaseRef.current = "covering";
      setActive(true);

      // Wait a frame so the panels mount (parked off-screen left) first.
      requestAnimationFrame(() => {
        if (!whiteRef.current || !greenRef.current) return;

        // Bottom (white) leads: swipes left -> right across the screen.
        animate(whiteRef.current, {
          x: ["-100%", "0%"],
          duration: DUR,
          ease: "inOutQuad",
        });

        // Top (green) follows once white has reached the middle, and ends
        // by fully covering the screen for a split moment.
        animate(greenRef.current, {
          x: ["-100%", "0%"],
          duration: DUR,
          delay: LAG,
          ease: "inOutQuad",
          onComplete: () => {
            phaseRef.current = "covered";
            router.push(pendingHref.current as string);
          },
        });
      });
    },
    [pathname, router]
  );

  // Once the route actually changes, peel the panels off to the right in
  // the same staggered order to reveal the new page.
  useEffect(() => {
    if (phaseRef.current !== "covered") return;
    phaseRef.current = "revealing";
    pendingHref.current = null;

    requestAnimationFrame(() => {
      if (!whiteRef.current || !greenRef.current) return;

      // Top (green) exits first, sliding off to the right.
      animate(greenRef.current, {
        x: ["0%", "100%"],
        duration: DUR,
        ease: "inOutQuad",
      });

      // Bottom (white) follows once green has cleared the middle; when it
      // leaves view the new page is fully shown.
      animate(whiteRef.current, {
        x: ["0%", "100%"],
        duration: DUR,
        delay: LAG,
        ease: "inOutQuad",
        onComplete: () => {
          phaseRef.current = "idle";
          setActive(false);
        },
      });
    });
  }, [pathname]);

  const panel = (color: string, z: number): React.CSSProperties => ({
    position: "fixed",
    inset: 0,
    zIndex: z,
    background: color,
    transform: "translateX(-100%)",
    willChange: "transform",
  });

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      {active && (
        <>
          <div ref={whiteRef} aria-hidden style={panel(WHITE, 9999)} />
          <div ref={greenRef} aria-hidden style={panel(GREEN, 10000)} />
        </>
      )}
    </TransitionContext.Provider>
  );
}

/** Drop-in <a>-like component that triggers the layered swipe transition. */
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
