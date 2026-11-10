import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { entities, privateEntities, type Entity } from "@/lib/data";
import { MarketChartModal } from "@/components/MarketChartModal";

export const Route = createFileRoute("/invest/")({
  head: () => ({
    meta: [
      { title: "Invest — The Musk Portfolio | Omni-Musk" },
      { name: "description", content: "Invest in publicly traded Musk ventures — Tesla (TSLA), SpaceX (SPCX) and X.com / PayPal Legacy (PYPL) — with live market pricing." },
      { property: "og:title", content: "Invest — The Musk Portfolio | Omni-Musk" },
      { property: "og:description", content: "Three public listings, one portal. Tiered investment plans from $250 to institutional scale, priced from the live market." },
    ],
  }),
  component: InvestPage,
});

function InvestPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Entity | null>(null);
  const stats = [
    { k: `${entities.length}`, v: "Public Listings" },
    { k: "$250", v: "Min. Entry" },
    { k: "34%", v: "Premium ROI" },
    { k: "BTC · ETH · SOL", v: "Funding Rails" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mb-12 max-w-3xl animate-fade-up">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          The Musk Portfolio
        </div>
        <h1 className="mt-3 text-5xl md:text-7xl">Own the next century.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Every publicly traded Musk venture, accessible through a single portal
          and priced from the live market. Choose a listing, pick a plan, fund in
          crypto, and watch your stake move with the tape.
        </p>
      </div>

      {/* Trust strip */}
      <div className="mb-16 grid gap-6 border-y border-border py-8 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.v}>
            <div className="text-2xl font-medium md:text-3xl">{s.k}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entities.map((e, i) => (
          <div
            key={e.slug}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
              style={{ backgroundColor: e.accent }}
            />
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl text-base font-semibold tracking-tight text-white transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundColor: e.accent }}
            >
              {e.initials}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {e.sector}
            </div>
            <h3 className="mt-1 text-2xl">{e.name}</h3>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{e.mission}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs">
              {e.plans.slice(0, 4).map((p) => (
                <div key={p.name}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground">
                    {p.minimum >= 1000 ? `$${(p.minimum / 1000).toFixed(0)}k+` : `$${p.minimum}+`}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActive(e)}
              className="mt-6 inline-flex items-center justify-between rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-background transition-opacity hover:opacity-90"
            >
              Invest Now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        ))}

        {privateEntities.map((e, i) => (
          <div
            key={e.slug}
            style={{ animationDelay: `${(entities.length + i) * 40}ms` }}
            className="relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-card/60 p-6"
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl text-base font-semibold tracking-tight text-white opacity-70"
              style={{ backgroundColor: e.accent }}
            >
              {e.initials}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {e.sector}
            </div>
            <h3 className="mt-1 text-2xl text-muted-foreground">{e.name}</h3>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{e.mission}</p>

            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {e.note}
            </div>

            <button
              disabled
              aria-disabled="true"
              className="mt-auto inline-flex cursor-not-allowed items-center justify-between rounded-full bg-muted px-5 py-2.5 pt-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground opacity-70"
            >
              Private — Pre-IPO
              <Lock className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>


      {active && (
        <MarketChartModal
          entity={active}
          onClose={() => setActive(null)}
          onConfirm={() => {
            const slug = active.slug;
            setActive(null);
            navigate({ to: "/invest/$slug", params: { slug } });
          }}
        />
      )}
    </div>
  );
}
