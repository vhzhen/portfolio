"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { animate, createDrawable } from "animejs";

/* A solid white hat silhouette that traces itself over the cat's head,
 * showing where a hat can be dropped. createDrawable() animates the
 * stroke so the line draws, then retraces.
 */

// Traced from the cap art (td/github/pepper hats), all 1920x1000.
const OUTLINE =
  "M 28 818 C 150 730 260 665 375 603 C 400 520 430 450 475 385 " +
  "C 560 290 650 210 745 140 C 870 70 1000 42 1120 42 " +
  "C 1300 45 1450 100 1555 172 C 1680 280 1760 390 1815 478 " +
  "C 1855 600 1875 780 1880 962 L 1868 966 C 1800 880 1740 825 1675 775 " +
  "C 1560 830 1480 836 1410 832 C 1330 826 1260 800 1210 770 " +
  "C 1050 665 890 632 710 635 C 500 640 300 720 55 822 Z";
// Where the crown meets the brim.
const SEAM =
  "M 375 603 C 600 540 760 515 880 513 C 1150 515 1450 600 1675 775";

const ART_W = 1920;
const ART_H = 1000;
// Tray box the art is letterboxed into (OBJECTS w/h in page.tsx). A snapped
// hat is scaled from its box's bottom-center, so the empty strip under the
// art ends up under the hat too; the outline has to skip it as well.
const BOX_W = 104;
const BOX_H = 68;
const LETTERBOX_BOTTOM = (BOX_H - (BOX_W * ART_H) / ART_W) / 2 / BOX_W;

type Rect = { left: number; top: number; width: number };

export default function HatOutline({
  catRef,
  visible,
  headRatio,
  headXOffset,
  hatToCatRatio,
}: {
  catRef: RefObject<HTMLElement | null>;
  /** Fades out (e.g. while a hat is equipped). */
  visible: boolean;
  /** Same values the snap logic uses to find the head. */
  headRatio: number;
  headXOffset: number;
  /** Snapped hat width as a fraction of the cat's width. */
  hatToCatRatio: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  // Track where the head is. The page dispatches a synthetic "resize" after
  // a hat change shifts the layout; the observer covers the cat image loading.
  useEffect(() => {
    const cat = catRef.current;
    if (!cat) return;

    const measure = () => {
      const c = cat.getBoundingClientRect();
      const width = c.width * hatToCatRatio;
      const height = (width * ART_H) / ART_W;
      const headX = c.left + c.width / 2 + c.width * headXOffset;
      const headY = c.top + c.height * headRatio;
      setRect({
        left: headX - width / 2,
        top: headY - width * LETTERBOX_BOTTOM - height,
        width,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cat);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [catRef, headRatio, headXOffset, hatToCatRatio]);

  const ready = rect !== null;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const anim = animate(createDrawable(svg.querySelectorAll("path")), {
      draw: ["0 0", "0 1"],
      duration: 2400,
      ease: "inOutSine",
      loop: true,
      alternate: true,
      loopDelay: 1400,
    });
    return () => {
      anim.revert();
    };
  }, [ready]);

  if (!rect) return null;

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      className="pointer-events-none fixed z-30 hidden overflow-visible transition-opacity duration-500 md:block"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        opacity: visible ? 1 : 0,
      }}
    >
      <g
        fill="none"
        stroke="white"
        strokeOpacity={0.9}
        strokeWidth={34}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={OUTLINE} />
        <path d={SEAM} />
      </g>
    </svg>
  );
}
