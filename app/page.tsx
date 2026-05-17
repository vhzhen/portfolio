"use client";

import { Button } from "@/components/ui/button";
import { Github, FileText, Code, Mail, TrendingUp } from "lucide-react";
import { TransitionLink } from "./components/PageTransition";
import TdChart from "./components/TdChart";
import EtlPipeline from "./components/EtlPipeline";
import ScrapeDemo from "./components/ScrapeDemo";

import { useEffect, useRef, useState } from "react";
import { animate, createDraggable, spring } from "animejs";

/* ------------------------------------------------------------------ *
 * Content config. Edit these to add merch / projects.
 * ------------------------------------------------------------------ */

// EDIT ME: your GitHub projects shown when the GitHub hat is on the cat.
const PROJECTS: { name: string; desc: string; href: string }[] = [
  {
    name: "portfolio",
    desc: "This site. Next.js + anime.js, draggable cat merch.",
    href: "https://github.com/vhzhen/portfolio",
  },
  {
    name: "etl-pipelines",
    desc: "Workflow automation & ETL work from my Pepper internship.",
    href: "https://github.com/vhzhen",
  },
  {
    name: "hackathon-projects",
    desc: "Devpost builds — weekend prototypes that shipped.",
    href: "https://devpost.com/vincentzhen2006",
  },
  {
    name: "more-on-github",
    desc: "Everything else lives here.",
    href: "https://github.com/vhzhen",
  },
];

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

const githubSide = (
  <div className="flex flex-col gap-3">
    <p className="font-mono text-xs uppercase tracking-widest text-white/70">
      {"// github projects"}
    </p>
    {PROJECTS.map((p) => (
      <a
        key={p.name}
        href={p.href}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg border border-white/15 bg-white/5 p-3 text-left backdrop-blur-sm transition-colors hover:bg-white/15"
      >
        <span className="font-mono text-sm font-semibold text-white">
          {p.name}
        </span>
        <span className="mt-1 block text-xs leading-snug text-white/70">
          {p.desc}
        </span>
      </a>
    ))}
  </div>
);

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
    id: "crown",
    label: "Crown",
    src: "/crown.webp",
    w: 96,
    h: 60,
    theme: {
      title: "👑",
      gradient:
        "linear-gradient(160deg, #f9d976 0%, #f39f86 55%, #b06ab3 100%)",
      heading: "certified royalty",
      blurb: (
        <>
          The cat has assumed the throne. All hail. Drag the crown back to the
          tray to return to commoner status.
        </>
      ),
      side: highlight(
        "// status",
        "Monarch of the household. Two cats, one crown — succession disputed.",
      ),
    },
  },
  {
    id: "github",
    label: "GitHub hat",
    src: "/github-hat.svg",
    w: 104,
    h: 68,
    theme: {
      title: "💻",
      gradient:
        "linear-gradient(160deg, #0d1117 0%, #161b22 50%, #1f2937 100%)",
      heading: "Projects",
      blurb: (
        <>
          When the GitHub hat is on, I&apos;m shipping. Check the projects on the
          sides — or pull the hat off to go back home.
        </>
      ),
      side: githubSide,
    },
  },
  {
    id: "pepper",
    label: "Pepper cap",
    src: "/pepper-cap.svg",
    w: 104,
    h: 68,
    theme: {
      title: "🌶️",
      gradient:
        "linear-gradient(160deg, #0f3d17 0%, #2d7a30 55%, #57c45b 100%)",
      heading: "Software Developer @ Pepper",
      blurb: (
        <>
          Last summer at{" "}
          <a href="https://www.usepepper.com/" target="_blank" rel="noreferrer">
            <span className="font-semibold underline">Pepper</span>
          </a>{" "}
          I built ETL pipelines pulling from APIs, SFTP, and web scraping —
          parsing unstructured pages and files into structured JSON, staging to
          AWS S3 where a Lambda verified each file before landing every JSON
          object as a MongoDB document. Take the cap off and the cat goes back
          to civilian life.
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
    src: "/td-cap.svg",
    w: 104,
    h: 68,
    theme: {
      title: "📈",
      gradient:
        "linear-gradient(160deg, #003314 0%, #006b00 55%, #2bd14f 100%)",
      heading: "ETF Trader @ TD Securities",
      blurb: (
        <>
          ETF Trading, Global Markets — Jan–Apr 2026. Built a PyQt5 tool to
          analyze cross-desk ETF flow (DMA/ATS/ETF) and surface spread
          inefficiencies, a FIX-protocol GUI automating ETF creation/redemption
          for BlackRock &amp; Vanguard (cutting execution from 3–4 min to
          &lt;2s), and refactored a VB ETF parser into Python with Bloomberg
          API checks and SQL logging. More on the{" "}
          <TransitionLink href="/td">
            <span className="font-semibold underline">TD page</span>
          </TransitionLink>
          .
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
            "Rewrote the ETF parser with Bloomberg API error checking and SQL logging.",
          )}
        </div>
      ),
    },
  },
  {
    id: "cap-1",
    label: "Company cap",
    src: "/cap-1.svg",
    w: 100,
    h: 65,
    theme: {
      title: "🧢",
      gradient:
        "linear-gradient(160deg, #1e1b4b 0%, #4f46e5 55%, #818cf8 100%)",
      heading: "@ company",
      blurb: <>Placeholder merch — rename this cap once the NDA lifts.</>,
      side: highlight("// company", "Swap this out for a real internship."),
    },
  },
  {
    id: "cap-2",
    label: "Company cap",
    src: "/cap-2.svg",
    w: 100,
    h: 65,
    theme: {
      title: "🧢",
      gradient:
        "linear-gradient(160deg, #4c0519 0%, #be123c 55%, #fb7185 100%)",
      heading: "@ company",
      blurb: <>Another placeholder cap. Same deal — make it yours.</>,
      side: highlight("// company", "Swap this out for a real internship."),
    },
  },
];

const HEAD_RATIO = 0.15; // fraction down the cat image where the head sits
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

  useEffect(() => {
    const drags = dragMap.current;
    const floats = floatMap.current;

    const updateTitle = () => {
      if (draggingRef.current) {
        document.title = "!!!";
        return;
      }
      const obj = OBJECTS.find((o) => o.id === equippedRef.current);
      document.title = obj?.theme?.title ?? "...";
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

      const headX = cat.left + cat.width / 2;
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
          scale: cat.width / 3 / obj.w,
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
  }, []);

  const activeTheme = OBJECTS.find((o) => o.id === equipped)?.theme;

  return (
    <div
      ref={sceneRef}
      className="relative flex min-h-screen w-full flex-row items-start justify-center overflow-y-auto md:h-screen md:items-center md:overflow-hidden"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
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

      {/* Left rail */}
      <section className="relative z-20 hidden h-full w-1/4 flex-col items-end justify-center py-6 pl-4 pr-1 md:flex">
        <div
          key={equipped ?? "none"}
          className="w-full max-w-[320px] transition-opacity duration-500"
          style={{ opacity: activeTheme ? 1 : 0 }}
        >
          {activeTheme?.sideLeft ?? activeTheme?.side}
        </div>
      </section>

      {/* Middle */}
      <section className="relative z-20 flex w-full flex-col items-center justify-center px-4 pb-16 pt-10 font-mono md:w-2/4 md:pb-28 md:pt-6">
        <h1
          key={`head-${equipped ?? "default"}`}
          className="mb-3 flex items-center text-center text-2xl font-bold tracking-tight transition-colors md:h-9"
          style={{ color: activeTheme ? "#ffffff" : "inherit" }}
        >
          {activeTheme?.heading ?? "hey, i'm vincent"}
        </h1>

        <section
          ref={catRef}
          className="m-2 w-[clamp(200px,50vw,380px)] overflow-hidden rounded-lg"
        >
          <img
            src="/cat.jpeg"
            alt="cat"
            className="h-auto w-full"
            draggable={false}
          />
        </section>

        <div className="mt-2 flex flex-wrap justify-center gap-2 px-4">
          <Button
            className="btn transition-transform duration-200 hover:scale-110"
            variant="outline"
            onClick={() => window.open("https://github.com/vhzhen", "_blank")}
          >
            <Github />
            GitHub
          </Button>
          <Button
            className="btn transition-transform duration-200 hover:scale-110"
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
            className="btn transition-transform duration-200 hover:scale-110"
            variant="outline"
            onClick={() =>
              window.open("https://devpost.com/vincentzhen2006", "_blank")
            }
          >
            <Code />
            Devpost
          </Button>
          <Button
            className="btn transition-transform duration-200 hover:scale-110"
            variant="outline"
            onClick={() => window.open("/resume.pdf", "_blank")}
          >
            <FileText />
            Resume
          </Button>
          <TransitionLink href="/td">
            <Button
              className="btn transition-transform duration-200 hover:scale-110"
              variant="outline"
            >
              <TrendingUp />
              TD
            </Button>
          </TransitionLink>
        </div>

        <p
          key={`bio-${equipped ?? "default"}`}
          className="m-4 max-w-[640px] px-4 text-center text-sm leading-relaxed transition-colors sm:text-base md:h-28 md:overflow-hidden"
          style={{ color: activeTheme ? "rgba(255,255,255,0.9)" : "inherit" }}
        >
          {activeTheme?.blurb ?? (
            <>
              Hey! I&apos;m Vincent, a Computing and Financial Management
              student at the University of Waterloo with internship experience in
              software development and trading.
            </>
          )}
        </p>
      </section>

      {/* Right rail */}
      <section className="relative z-20 hidden h-full w-1/4 flex-col items-start justify-center py-6 pl-1 pr-4 md:flex">
        <div
          key={(equipped ?? "none") + "-r"}
          className="w-full max-w-[320px] transition-opacity duration-500"
          style={{ opacity: activeTheme ? 1 : 0 }}
        >
          {equipped === "github"
            ? null
            : (activeTheme?.sideRight ?? activeTheme?.side)}
        </div>
      </section>

      {/* Object tray — desktop only; mobile gets a plain scrollable page */}
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
    </div>
  );
}
