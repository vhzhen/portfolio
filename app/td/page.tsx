"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { TransitionLink } from "../components/PageTransition";

export default function TD() {
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-mono px-6"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section className="w-full max-w-[760px] text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <TrendingUp style={{ color: "#018A00" }} />
          <h1 className="text-2xl md:text-3xl font-bold">
            <span style={{ color: "#018A00" }}>TD Securities</span>
          </h1>
        </div>
        <h2 className="text-lg md:text-xl mb-1">ETF Trader</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Exchange-Traded Funds Desk &middot; Capital Markets
        </p>

        <div className="text-left text-sm sm:text-base leading-relaxed space-y-4 mb-10">
          <p>
            On the ETF desk at TD Securities, I traded exchange-traded funds and
            supported the team in pricing, executing, and managing risk across a
            broad book of equity and fixed-income ETFs.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Quoted and executed ETF trades, monitoring intraday NAV against
              market pricing to keep spreads tight and competitive.
            </li>
            <li>
              Managed inventory and hedged exposure across underlying baskets to
              keep the book risk-neutral through volatile sessions.
            </li>
            <li>
              Built tooling to automate parts of the pricing and reconciliation
              workflow, cutting manual work and reducing error.
            </li>
            <li>
              Worked alongside sales and the creation/redemption desk to source
              liquidity and fill institutional client orders.
            </li>
          </ul>
        </div>

        <TransitionLink href="/">
          <Button className="btn px-6" variant="outline">
            <ArrowLeft />
            Back
          </Button>
        </TransitionLink>
      </section>
    </div>
  );
}
