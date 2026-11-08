"use client";

import { Button } from "@/components/ui/button";
import { Github, FileText, Code, Mail, Settings } from "lucide-react";
import { TransitionLink } from "./components/PageTransition";
import TdChart from "./components/TdChart";
import EtlPipeline from "./components/EtlPipeline";
import ScrapeDemo from "./components/ScrapeDemo";
import { GithubProjects, GithubPreview } from "./components/GithubPanels";
import {
  FishingGame,
  MinecraftSpeedrun,
  DbdSkillCheck,
} from "./components/HobbyWidgets";

import { useEffect, useRef, useState } from "react";
import { animate, createDraggable, spring } from "animejs";

/* ------------------------------------------------------------------ *
 * Content config. Edit these to add merch / projects.
 * ------------------------------------------------------------------ */

type ObjectTheme = {
  /** Browser tab title when this object is equipped. */
  title: string;
  /** Full-screen gradient that crossfades in. */
  gradient: string;
  /** Big heading shown above the cat. */
  heading: string;
  /** Replacement bio paragraph. */
  blurb: React.ReactNode;
  /** Side-rail content (hidden on mobile). Shown in both rails. */
  side: React.ReactNode;
  /** Optional per-rail overrides (used so the TD chart mounts once). */
  sideLeft?: React.ReactNode;
  sideRight?: React.ReactNode;
};

type DragObject = {
  id: string;
  label: string;
  src: string;
  /** Rendered thumbnail size in the tray, px. */
  w: number;
  h: number;
  theme?: ObjectTheme;
};

const highlight = (title: string, body: string) => (
  <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-left backdrop-blur-sm">
    <p className="font-mono text-xs uppercase tracking-widest text-white/70">
      {title}
    </p>
    <p className="mt-2 text-sm leading-relaxed text-white/85">{body}</p>
  </div>
);

const OBJECTS: DragObject[] = [
  {
    id: "github",
    label: "GitHub hat",
    src: "/github-hat.png",
    w: 104,
    h: 68,
    theme: {
      title: "💻",
      gradient:
        "linear-gradient(160deg, #0d1117 0%, #161b22 50%, #1f2937 100%)",
      heading: "Projects",
      blurb: (
        <>
          I have a wide variety of full-stack projects, check them out! Preview them on
          the side.
        </>
      ),
      side: <GithubProjects />,
      sideRight: <GithubPreview />,
    },
  },
  {
    id: "pepper",
    label: "Pepper cap",
    src: "/pepper-hat.png",
    w: 104,
    h: 68,
    theme: {
      title: "🌶️",
      gradient:
        "linear-gradient(160deg, #0f3d17 0%, #2d7a30 55%, #57c45b 100%)",
      heading: "Software Developer @ Pepper",
      blurb: (
        <>
          Built scalable foodservice data + AI systems with Python, Playwright,
          AWS, MongoDB, Snowflake, OpenAI Vision, and n8n.
        </>
      ),
      side: highlight(
        "// pepper",
        "ETL: APIs/SFTP → parse .csv/.txt to .jsonl → S3 → Lambda verify → MongoDB.",
      ),
      sideLeft: <EtlPipeline />,
      sideRight: <ScrapeDemo />,
    },
  },
  {
    id: "td",
    label: "TD cap",
    src: "/td-hat.png",
    w: 104,
    h: 68,
    theme: {
      title: "📈",
      gradient:
        "linear-gradient(160deg, #003314 0%, #006b00 55%, #2bd14f 100%)",
      heading: "ETF Trader @ TD Securities",
      blurb: (
        <>
          Building Python
          automation + analytics tools to streamline ETF creation/redemption
          workflows and uncover trading inefficiencies.
        </>
      ),
      side: highlight(
        "// td",
        "Finance-meets-software work on the ETF trading desk.",
      ),
      sideLeft: <TdChart />,
      sideRight: (
        <div className="flex flex-col gap-3">
          {highlight(
            "// cross-desk flow",
            "PyQt5 analytics over tens of thousands of orders to find spread inefficiencies and retune quoting.",
          )}
          {highlight(
            "// Financial Information Exchange (FIX) automation",
            "ETF Creation/Redemption GUI with custom BlackRock, Vanguard and State Street payloads. 3-4 minutes down to <2s.",
          )}
          {highlight(
            "// Visual Basic → Python",
            "Rewrote the ETF parser in Python. Enriched with Bloomberg API error checking and SQL logging.",
          )}
        </div>
      ),
    },
  },
  {
    id: "cap-1",
    label: "Propeller hat",
    src: "/testhat.png",
    w: 100,
    h: 65,
    theme: {
      title: "🎈",
      gradient:
        "linear-gradient(160deg, #1e1b4b 0%, #4f46e5 55%, #818cf8 100%)",
      heading: "Hobbies",
      blurb: (
        <>
          Off work, you might find me Minecraft speedrunning, surviving in Dead
          by Daylight, or out fishing.
        </>
      ),
      side: <FishingGame />,
      sideLeft: (
        <div className="flex flex-col gap-3">
          <MinecraftSpeedrun />
          <DbdSkillCheck />
        </div>
      ),
      sideRight: <FishingGame />,
    },
  },
];

const HEAD_RATIO = 0.19; // fraction down the cat image where the head sits
const HEAD_X_OFFSET = -0.02; // fraction of cat width to nudge the head anchor (negative = left)
const SNAP_RADIUS = 120; // px proximity to head that counts as a snap
const snapSpring = spring({ stiffness: 140, damping: 16 });

export default function Home() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const elMap = useRef(new Map<string, HTMLDivElement>());
  const dragMap = useRef(new Map<string, ReturnType<typeof createDraggable>>());
  const floatMap = useRef(new Map<string, ReturnType<typeof animate>>());
  const equippedRef = useRef<string | null>(null);
  const draggingRef = useRef(false);

  const [equipped, setEquipped] = useState<string | null>(null);
  // The draggable-hat experience needs vertical room. Under 600px tall it's
  // unusable (hat bar + cat + text collide), so the whole feature is disabled.
  const [hatsEnabled, setHatsEnabled] = useState(true);

  useEffect(() => {
    const check = () => setHatsEnabled(window.innerHeight >= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // When the feature turns off (window shrank past the threshold), drop any
  // equipped hat so the themed rails/gradient revert to the default view.
  useEffect(() => {
    if (!hatsEnabled) {
      equippedRef.current = null;
      setEquipped(null);
    }
  }, [hatsEnabled]);

  // Trackpad overscroll on macOS reveals the html element's background past
  // the document edges. Sync that background to the active theme so the
  // rubber-band area blends with the gradient instead of flashing the
  // default sunset/blue. Cleared on unmount → CSS default reapplies.
  useEffect(() => {
    const html = document.documentElement;
    const theme = OBJECTS.find((o) => o.id === equipped)?.theme;
    if (theme) {
      html.style.backgroundImage = theme.gradient;
    } else {
      // Default view is a flat colour: hide the CSS-default SVG pattern and
      // match the overscroll/safe-area edges to the scene colour.
      html.style.backgroundImage = "none";
      html.style.backgroundColor = "#96b9ff";
    }
    return () => {
      html.style.backgroundImage = "";
      html.style.backgroundColor = "";
    };
  }, [equipped]);

  // Warm the browser cache for the heavy fishing photo on page open so
  // equipping the hobbies hat is instant instead of waiting on a fetch.
  // Deferred to idle time so it never competes with the initial paint.
  useEffect(() => {
    const preload = () => {
      const img = new Image();
      img.src = "/fishing.png";
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preload);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(preload, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hatsEnabled) return;

    const drags = dragMap.current;
    const floats = floatMap.current;

    const updateTitle = () => {
      if (draggingRef.current) {
        document.title = "!!!";
        return;
      }
      const obj = OBJECTS.find((o) => o.id === equippedRef.current);
      document.title = obj?.theme?.title ?? "Vincent";
    };

    const setEquip = (id: string | null) => {
      equippedRef.current = id;
      setEquipped(id);
      updateTitle();
    };

    const homeOf = (id: string) => {
      const el = elMap.current.get(id);
      const drag = dragMap.current.get(id);
      const float = floatMap.current.get(id);
      if (!el || !drag) return;
      const imgEl = el.querySelector("img");
      if (imgEl) animate(imgEl, { scale: 1, ease: snapSpring });
      drag.disable();
      animate(el, {
        x: 0,
        y: 0,
        ease: snapSpring,
        onComplete: () => {
          drag.setX(0);
          drag.setY(0);
          drag.enable();
          float?.resume();
        },
      });
    };

    // Move an object so its anchor point lands on the cat's head.
    const snapToHead = (obj: DragObject) => {
      const el = elMap.current.get(obj.id);
      const drag = dragMap.current.get(obj.id);
      if (!el || !drag || !catRef.current) return false;

      const imgEl = el.querySelector("img");
      const cat = catRef.current.getBoundingClientRect();
      // Measure the image itself so the *visible* bottom-middle is the anchor.
      const o = (imgEl ?? el).getBoundingClientRect();

      const headX = cat.left + cat.width / 2 + cat.width * HEAD_X_OFFSET;
      const headY = cat.top + cat.height * HEAD_RATIO;

      // Standardized anchor: bottom-middle of the image sits on the head.
      const anchorX = o.left + o.width / 2;
      const anchorY = o.bottom;

      const dx = headX - anchorX;
      const dy = headY - anchorY;
      const dist = Math.hypot(dx, dy);

      if (dist > SNAP_RADIUS) return false;

      const targetX = drag.x + dx;
      const targetY = drag.y + dy;

      // Scale the hat to ~1/3 of the cat's width. transform-origin is
      // bottom-center (origin-bottom), so scaling keeps the bottom-middle
      // pinned to the head point.
      if (imgEl) {
        animate(imgEl, {
          scale: cat.width / 2.5 / obj.w,
          ease: snapSpring,
        });
      }

      floatMap.current.get(obj.id)?.pause();
      drag.disable();
      animate(el, {
        x: targetX,
        y: targetY,
        ease: snapSpring,
        onComplete: () => {
          drag.setX(targetX);
          drag.setY(targetY);
          drag.enable();
        },
      });
      return true;
    };

    OBJECTS.forEach((obj, i) => {
      const el = elMap.current.get(obj.id);
      if (!el) return;

      const img = el.querySelector("img");
      if (img) {
        floatMap.current.set(
          obj.id,
          animate(img, {
            y: [-6, 6],
            loop: true,
            alternate: true,
            duration: 1500,
            // Staggered left-to-right so the bob reads as a clean wave.
            delay: i * 150,
            ease: "inOutSine",
          }),
        );
      }

      const drag = createDraggable(el, {
        container: sceneRef.current ?? undefined,
        // Kill throw momentum — a flicked hat snaps back instead of sliding.
        velocityMultiplier: 0,
        onGrab: () => {
          draggingRef.current = true;
          el.style.zIndex = "60";
          floatMap.current.get(obj.id)?.pause();
          // Shrink back to tray size while held, so the release
          // measurement and drag feel use the unscaled image.
          if (img) animate(img, { scale: 1, duration: 200, ease: "out(2)" });
          // Lifting the equipped object instantly resets the theme;
          // it re-applies only if it snaps back onto the head.
          if (equippedRef.current === obj.id) setEquip(null);
          updateTitle();
        },
        onRelease: () => {
          draggingRef.current = false;
          el.style.zIndex = equippedRef.current === obj.id ? "50" : "";

          const snapped = snapToHead(obj);

          if (snapped) {
            const prev = equippedRef.current;
            if (prev && prev !== obj.id) homeOf(prev);
            el.style.zIndex = "50";
            setEquip(obj.id);
          } else {
            if (equippedRef.current === obj.id) setEquip(null);
            homeOf(obj.id);
          }
          updateTitle();
        },
      });

      dragMap.current.set(obj.id, drag);
    });

    // Keep the equipped object glued to the head on resize.
    const onResize = () => {
      const id = equippedRef.current;
      if (!id) return;
      const obj = OBJECTS.find((o) => o.id === id);
      if (obj) snapToHead(obj);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      drags.forEach((d) => d.revert?.());
      floats.forEach((f) => f.pause());
      drags.clear();
      floats.clear();
    };
  }, [hatsEnabled]);

  // The heading/bio reserve different heights per theme, so swapping a hat
  // shifts the cat vertically. Re-run the resize snap once the new themed
  // content has painted to keep the equipped hat glued to the head.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      window.dispatchEvent(new Event("resize")),
    );
    return () => cancelAnimationFrame(id);
  }, [equipped]);

  const activeTheme = OBJECTS.find((o) => o.id === equipped)?.theme;

  return (
    <div
      ref={sceneRef}
      className="relative flex min-h-screen w-full flex-row items-start justify-center overflow-y-auto md:h-screen md:items-center md:overflow-hidden"
      style={{ backgroundColor: "#96b9ff" }}
    >
      {/* One static layer per theme — only the active one is opaque, so
          swapping or removing a hat crossfades instead of hard-cutting. */}
      {OBJECTS.filter((o) => o.theme).map((o) => (
        <div
          key={o.id}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out"
          style={{
            background: o.theme!.gradient,
            opacity: equipped === o.id ? 1 : 0,
          }}
        />
      ))}

      {/* Extras — home page only (no hat equipped). Links to the TD page. */}
      <div
        className="fixed right-4 top-4 z-40 transition-opacity duration-300"
        style={{
          opacity: equipped ? 0 : 1,
          pointerEvents: equipped ? "none" : "auto",
        }}
      >
        <TransitionLink href="/td">
          <Button
            className="btn border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
            variant="outline"
          >
            <Settings />
            Extras
          </Button>
        </TransitionLink>
      </div>

      {/* Centered content wrapper — caps total width so rails stay grouped
          near the cat on wide/ultrawide screens (whitespace at the edges). */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1500px] flex-row items-start justify-center md:h-screen md:items-center">
        {/* Left rail */}
        <section className="hidden h-full w-[30%] flex-col items-end justify-center py-6 pl-4 pr-1 md:flex">
          <div
            key={equipped ?? "none"}
            className="w-full max-w-[460px] transition-opacity duration-500"
            style={{ opacity: activeTheme ? 1 : 0 }}
          >
            {activeTheme?.sideLeft ?? activeTheme?.side}
          </div>
        </section>

        {/* Middle */}
        <section className="flex w-full flex-col items-center justify-center px-4 pb-16 pt-10 font-mono md:w-[40%] md:pb-[clamp(6rem,14vh,8.5rem)] md:pt-6">
          <h1
            key={`head-${equipped ?? "default"}`}
            className="mb-1 flex items-end justify-center text-center text-base font-normal leading-relaxed transition-colors sm:text-lg md:h-[clamp(2.75rem,8vh,4.5rem)] md:overflow-hidden"
            style={{ color: activeTheme ? "#ffffff" : "inherit" }}
          >
            {activeTheme?.heading ?? " "}
          </h1>

          <section
            ref={catRef}
            className="m-2 w-[min(50vw,380px,40vh)] overflow-hidden rounded-lg"
          >
            <img
              src="/cat.jpeg"
              alt="cat"
              className="h-auto w-full"
              draggable={false}
            />
          </section>

          <div className="mt-2 flex flex-wrap justify-center gap-2 px-4 md:[@media(max-height:820px)]:hidden">
            <Button
              className="btn border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
              variant="outline"
              onClick={() => window.open("https://github.com/vhzhen", "_blank")}
            >
              <Github />
              GitHub
            </Button>
            <Button
              className="btn border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
              variant="outline"
              onClick={() =>
                (window.location.href =
                  "mailto:vhzhen@uwaterloo.ca?subject=Website Inquiry&body=Hi there!")
              }
            >
              <Mail />
              Mail
            </Button>
            <Button
              className="btn border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
              variant="outline"
              onClick={() =>
                window.open("https://devpost.com/vincentzhen2006", "_blank")
              }
            >
              <Code />
              Devpost
            </Button>
            <Button
              className="btn border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
              variant="outline"
              onClick={() => window.open("/resume.pdf", "_blank")}
            >
              <FileText />
              Resume
            </Button>
          </div>

          <p
            key={`bio-${equipped ?? "default"}`}
            className="glass-scrollbar m-4 max-w-[640px] px-4 text-center text-sm leading-relaxed text-white transition-colors sm:text-base md:h-[clamp(5rem,16vh,8rem)] md:overflow-auto"
          >
            {activeTheme?.blurb ?? (
              <>
                Hey! I&apos;m Vincent, a Computing and Financial Management
                student at the University of Waterloo with internship experience
                in software development and trading.
              </>
            )}
          </p>
        </section>

        {/* Right rail */}
        <section className="hidden h-full w-[30%] flex-col items-start justify-center py-6 pl-1 pr-4 md:flex">
          <div
            key={(equipped ?? "none") + "-r"}
            className="w-full max-w-[460px] transition-opacity duration-500"
            style={{ opacity: activeTheme ? 1 : 0 }}
          >
            {activeTheme?.sideRight ?? activeTheme?.side}
          </div>
        </section>
      </div>

      {/* Object tray — desktop only; mobile gets a plain scrollable page.
          Hidden entirely when the viewport is too short for the feature. */}
      {hatsEnabled && (
        <div className="fixed inset-x-0 bottom-0 z-40 hidden items-end justify-center gap-3 px-4 py-3 md:flex">
          <div className="flex items-end gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
            {OBJECTS.map((obj) => (
            <div
              key={obj.id}
              ref={(node) => {
                if (node) elMap.current.set(obj.id, node);
              }}
              className="cursor-grab touch-none select-none active:cursor-grabbing"
              style={{ width: obj.w, height: obj.h }}
              title={obj.label}
            >
              <img
                src={obj.src}
                alt={obj.label}
                draggable={false}
                className="h-full w-full origin-bottom object-contain drop-shadow-md"
              />
            </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
