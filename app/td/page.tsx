"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "../components/PageTransition";
import { animate } from "animejs";

export default function TD() {
  const squareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = squareRef.current;
    if (!el) return;
    const anim = animate(el, {
      rotate: 90,
      loop: true,
      ease: "inOutExpo",
    });
    return () => { anim.pause(); };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-10 font-mono px-6"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <div
        ref={squareRef}
        className="h-14 w-14 rounded-md border border-sky-400/40 bg-sky-400/20 backdrop-blur-sm"
      />

      <p className="text-xs uppercase tracking-[0.3em] text-white/55">
        coming soon
      </p>

      <TransitionLink href="/">
        <Button
          className="border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:bg-white/15 hover:text-white"
          variant="outline"
        >
          <ArrowLeft />
          Back
        </Button>
      </TransitionLink>
    </div>
  );
}
