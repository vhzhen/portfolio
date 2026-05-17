"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// EDIT ME: your GitHub projects shown when the GitHub hat is on the cat.
export const PROJECTS: { name: string; desc: string; href: string }[] = [
  {
    name: "Portfolio",
    desc: "This site. Next.js + anime.js, draggable cat merch.",
    href: "https://github.com/vhzhen/portfolio",
  },
  {
    name: "Patient Intake Form",
    desc: "A modern, full-stack patient intake application built with Next.js, GraphQL, and Supabase.",
    href: "https://github.com/vhzhen/Patient-Intake-Form",
  },
  {
    name: "Audiage",
    desc: "Award winning IgnitionHacks project. Software targeted to prevent hearing loss. ",
    href: "https://devpost.com/software/audiage",
  },
  {
    name: "More On Github",
    desc: "Everything else lives here.",
    href: "https://github.com/vhzhen",
  },
];

const DEFAULT = PROJECTS[0].name;

// Tools per project. `slug` is a Simple Icons slug (rendered as a logo via
// their CDN); omit it to show a plain text chip instead.
type Tool = { label: string; slug?: string };
const TOOLS: Record<string, Tool[]> = {
  Portfolio: [
    { label: "Next.js", slug: "nextdotjs" },
    { label: "TypeScript", slug: "typescript" },
    { label: "anime.js" },
  ],
  "Patient Intake Form": [
    { label: "Next.js", slug: "nextdotjs" },
    { label: "TypeScript", slug: "typescript" },
    { label: "GraphQL", slug: "graphql" },
    { label: "Supabase", slug: "supabase" },
    { label: "Tailwind CSS", slug: "tailwindcss" },
    { label: "shadcn/ui", slug: "shadcnui" },
  ],
  Audiage: [
    { label: "Next.js", slug: "nextdotjs" },
    { label: "TypeScript", slug: "typescript" },
    { label: "Chakra UI", slug: "chakraui" },
    { label: "Python", slug: "python" },
    { label: "NumPy", slug: "numpy" },
    { label: "SciPy", slug: "scipy" },
    { label: "Tkinter" },
    { label: "Matplotlib" },
    { label: "librosa" },
  ],
};

/* Tiny shared store so the left-rail list and the right-rail preview
 * (separate DOM subtrees) can sync the hovered project. */
let current = DEFAULT;
const listeners = new Set<() => void>();
function setHovered(name: string) {
  if (name === current) return;
  current = name;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function useHovered() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT,
  );
}

/** Parse `owner/repo` out of a github.com URL, or null if it isn't a repo. */
function repoOf(href: string): string | null {
  const m = href.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function GithubProjects() {
  const active = useHovered();

  // Reset to the default selection each time the hat is equipped.
  useEffect(() => {
    setHovered(DEFAULT);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-white/70">
        {"// github projects"}
      </p>
      {PROJECTS.map((p) => (
        <a
          key={p.name}
          href={p.href}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={() => setHovered(p.name)}
          onFocus={() => setHovered(p.name)}
          className={`block rounded-lg border p-3 text-left backdrop-blur-sm transition-colors ${
            active === p.name
              ? "border-white/40 bg-white/15"
              : "border-white/15 bg-white/5 hover:bg-white/10"
          }`}
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
}

/** GitHub repo social image, with a graceful fallback if it fails. */
function RepoImage({ repo, name }: { repo: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (repo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://opengraph.githubassets.com/1/${repo}`}
        alt={`${name} preview`}
        className="aspect-[2/1] w-full bg-black/40 object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/0">
      <span className="font-mono text-2xl font-bold text-white/70">{name}</span>
    </div>
  );
}

/** A tool badge: brand logo (Simple Icons CDN) with a text-only fallback. */
function ToolChip({ tool }: { tool: Tool }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/75">
      {tool.slug && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://cdn.simpleicons.org/${tool.slug}/e5e7eb`}
          alt=""
          className="h-3 w-3"
          onError={() => setFailed(true)}
        />
      )}
      {tool.label}
    </span>
  );
}

export function GithubPreview() {
  const active = useHovered();
  const project = PROJECTS.find((p) => p.name === active) ?? PROJECTS[0];
  const repo = repoOf(project.href);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-white/70">
        {"// preview"}
      </p>

      <div className="overflow-hidden rounded-md border border-white/15 bg-black/30">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="ml-2 truncate font-mono text-[10px] text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
          >
            {project.href.replace(/^https?:\/\//, "")}
          </a>
        </div>

        <RepoImage key={project.name} repo={repo} name={project.name} />
      </div>

      <div>
        <p className="font-mono text-sm font-semibold text-white">
          {project.name}
        </p>
        <p className="mt-1 text-xs leading-snug text-white/70">
          {project.desc}
        </p>
        {(TOOLS[project.name] ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOOLS[project.name].map((t) => (
              <ToolChip key={t.label} tool={t} />
            ))}
          </div>
        )}
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-mono text-[11px] text-emerald-300/80 underline-offset-2 hover:underline"
        >
          open ↗
        </a>
      </div>
    </div>
  );
}
