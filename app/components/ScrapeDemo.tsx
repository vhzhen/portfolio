import udon from "./udon.json";

const PRETTY = JSON.stringify(udon, null, 2);

export default function ScrapeDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-white/70">
          {"// web scraping"}
        </p>

        {/* the source product page */}
        <div className="overflow-hidden rounded-md border border-white/15 bg-black/30">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            <a
              href="https://shop.sysco.com/app/product-details/opco/056/product/7278464?seller_id=USBL"
              target="_blank"
              rel="noreferrer"
              className="ml-2 truncate font-mono text-[10px] text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              shop.sysco.com/app/product-details/…/7278464
            </a>
          </div>
          <div className="flex gap-2 p-2">
            <img
              src="/udon.jpeg"
              alt="Noodle Udon Sanukki Frozen"
              className="h-16 w-16 flex-shrink-0 rounded bg-white object-contain"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight text-white">
                Noodle Udon Sanukki Frozen
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-white/55">
                8/1.15KG · 7278464
              </p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-white/60">
                Made of high quality wheat flour with the natural sweetness of
                wheat. This delicate balance between firmness and softness can
                be used in Udon soup and stir fried noodles.
              </p>
            </div>
          </div>
        </div>

        <div className="my-2 text-center font-mono text-[10px] text-white/50">
          ↓ scraped into a structured JSON
        </div>

        {/* scraped result */}
        <div className="overflow-hidden rounded-md border border-white/15 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
            <span className="font-mono text-[10px] text-emerald-300/80">
              udon.json
            </span>
            <span className="font-mono text-[9px] text-white/40">
              1 product
            </span>
          </div>
          <pre className="max-h-[220px] overflow-auto p-2 text-[9px] leading-[1.45] text-emerald-200/85">
            <code>{PRETTY}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
