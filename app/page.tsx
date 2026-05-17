"use client";

import { Button } from "@/components/ui/button";
import { Github, FileText, Code, Mail, TrendingUp } from "lucide-react";
import { TransitionLink } from "./components/PageTransition";

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
    href: "https://github.com/vhzhen",
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
  /** Side-rail content (hidden on mobile). */
  side: React.ReactNode;
};

type DragObject = {
  id: string;
  label: string;
  src: string;
  /** Rendered thumbnail size in the tray, px. */
  w: number;
  h: number;
  /** Where on the object (0=top,1=bottom) sits on the cat's head. */
  anchorY: number;
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
    anchorY: 0.92,
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
    anchorY: 0.78,
    theme: {
      title: "🐙",
      gradient:
        "linear-gradient(160deg, #0d1117 0%, #161b22 50%, #1f2937 100%)",
      heading: "open source",
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
    anchorY: 0.78,
    theme: {
      title: "🌶️",
      gradient:
        "linear-gradient(160deg, #0f3d17 0%, #2d7a30 55%, #57c45b 100%)",
      heading: "@ pepper",
      blurb: (
        <>
          Last summer I built ETL pipelines and automated workflows at{" "}
          <a href="https://www.usepepper.com/" target="_blank" rel="noreferrer">
            <span className="font-semibold underline">Pepper</span>
          </a>
          . Take the cap off and the cat goes back to civilian life.
        </>
      ),
      side: highlight(
        "// pepper",
        "ETL pipelines, workflow automation, and data plumbing for a fast-moving team.",
      ),
    },
  },
  {
    id: "td",
    label: "TD cap",
    src: "/td-cap.svg",
    w: 104,
    h: 68,
    anchorY: 0.78,
    theme: {
      title: "📈",
      gradient:
        "linear-gradient(160deg, #003314 0%, #006b00 55%, #2bd14f 100%)",
      heading: "@ td",
      blurb: (
        <>
          More on my TD work lives on the{" "}
          <TransitionLink href="/td">
            <span className="font-semibold underline">TD page</span>
          </TransitionLink>
          . Remove the cap to reset.
        </>
      ),
      side: highlight(
        "// td",
        "Finance-meets-software work. Open the TD page for the full breakdown.",
      ),
    },
  },
  {
    id: "cap-1",
    label: "Company cap",
    src: "/cap-1.svg",
    w: 100,
    h: 65,
    anchorY: 0.78,
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
    anchorY: 0.78,
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

const HEAD_RATIO = 0.17; // fraction down the cat image where the head sits
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

      const cat = catRef.current.getBoundingClientRect();
      const o = el.getBoundingClientRect();

      const headX = cat.left + cat.width / 2;
      const headY = cat.top + cat.height * HEAD_RATIO;

      const anchorX = o.left + o.width / 2;
      const anchorY = o.top + o.height * obj.anchorY;

      const dx = headX - anchorX;
      const dy = headY - anchorY;
      const dist = Math.hypot(dx, dy);

      if (dist > SNAP_RADIUS) return false;

      const targetX = drag.x + dx;
      const targetY = drag.y + dy;

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

    OBJECTS.forEach((obj) => {
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
            ease: "inOutSine",
          }),
        );
      }

      const drag = createDraggable(el, {
        container: sceneRef.current ?? undefined,
        onGrab: () => {
          draggingRef.current = true;
          el.style.zIndex = "60";
          floatMap.current.get(obj.id)?.pause();
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
      className="relative flex h-screen w-full flex-row items-center justify-center overflow-hidden"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      {/* Theme gradient — crossfades over the default background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out"
        style={{
          background: activeTheme?.gradient,
          opacity: activeTheme ? 1 : 0,
        }}
      />

      {/* Left rail */}
      <section className="relative z-20 hidden h-full w-1/4 flex-col justify-center px-6 md:flex">
        <div
          key={equipped ?? "none"}
          className="transition-opacity duration-500"
          style={{ opacity: activeTheme ? 1 : 0 }}
        >
          {activeTheme?.side}
        </div>
      </section>

      {/* Middle */}
      <section className="relative z-20 flex w-full flex-col items-center justify-center px-4 pb-28 pt-6 font-mono md:w-2/4">
        <h1
          key={`head-${equipped ?? "default"}`}
          className="mb-3 flex h-9 items-center text-center text-2xl font-bold tracking-tight transition-colors"
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
          className="m-4 h-28 max-w-[640px] overflow-hidden px-4 text-center text-sm leading-relaxed transition-colors sm:text-base"
          style={{ color: activeTheme ? "rgba(255,255,255,0.9)" : "inherit" }}
        >
          {activeTheme?.blurb ?? (
            <>
              Hey! I&apos;m Vincent, a Computing and Financial Management
              student at the University of Waterloo with hands-on experience in
              software development and data projects. Last summer, I worked on
              ETL Pipelines and automating workflows at{" "}
              <a
                href="https://www.usepepper.com/"
                target="_blank"
                rel="noreferrer"
              >
                <span style={{ color: "rgba(56, 151, 59, 1)" }}>Pepper</span>
              </a>
              . When I&apos;m not coding, you can find me chilling with my two
              cats. Grab a hat from the tray and drop it on the cat.
            </>
          )}
        </p>
      </section>

      {/* Right rail */}
      <section className="relative z-20 hidden h-full w-1/4 flex-col justify-center px-6 md:flex">
        <div
          key={(equipped ?? "none") + "-r"}
          className="transition-opacity duration-500"
          style={{ opacity: activeTheme ? 1 : 0 }}
        >
          {equipped === "github" ? null : activeTheme?.side}
        </div>
      </section>

      {/* Object tray — always mounted so draggables stay bound */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-3 px-4 py-3">
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
                className="h-full w-full object-contain drop-shadow-md"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
