import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVehicle } from "@/lib/data";
import { roadsterCheckoutSearch, roadsterOffers } from "@/lib/roadster-catalog";

export const Route = createFileRoute("/roadster")({
  head: () => ({
    meta: [
      { title: "Tesla Roadster — Omni-Musk" },
      {
        name: "description",
        content: "Explore three Tesla Roadster configurations and continue through Omni-Musk's secure vehicle checkout.",
      },
      { property: "og:title", content: "Tesla Roadster — Omni-Musk" },
      {
        property: "og:description",
        content: "Explore the Standard Roadster, Thrust Package, and Flying Version.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadsterPage,
});

function currency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function RoadsterPage() {

  return (
    <div className="-mt-16 bg-foreground text-background">
      <section className="mx-auto max-w-[1600px] px-6 pb-12 pt-28 lg:px-12 lg:pb-16 lg:pt-32">
        <div className="flex flex-col justify-between gap-6 border-b border-background/20 pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-background/60">
              The all-electric supercar
            </div>
            <h1 className="mt-3 text-5xl font-medium md:text-7xl">Tesla Roadster</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-background/65">
            Three distinct configurations. One uncompromising silhouette.
          </p>
        </div>

        <div className="mt-8 grid gap-px bg-background/20 md:grid-cols-2 xl:grid-cols-3">
          {roadsterOffers.map((offer) => {
            const vehicle = getVehicle(offer.slug);
            if (!vehicle) return null;
            const checkout = roadsterCheckoutSearch(offer.slug);

            return (
              <article key={offer.slug} className="flex min-w-0 flex-col bg-foreground">
                <div className="relative aspect-[3/2] overflow-hidden bg-background/5">
                  <img
                    src={vehicle.image}
                    alt={`${offer.name} in silver`}
                    width={1536}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-5 top-5 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-background/70">
                      {offer.option}
                    </span>
                    {offer.inviteOnly && (
                      <span className="border border-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-background">
                        Invite-only
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-6 pt-6 sm:px-7 sm:pb-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-2xl font-medium leading-tight sm:text-3xl">{offer.name}</h2>
                    <span className="shrink-0 text-xl font-medium tabular-nums">{currency(offer.price)}</span>
                  </div>
                  <p className="mt-4 min-h-12 max-w-md text-sm leading-6 text-background/65">
                    {offer.description}
                  </p>
                  {offer.slug === "roadster-thrust" && (
                    <div className="mt-5 flex items-center gap-3 border-y border-background/15 py-3 text-xs uppercase tracking-widest text-background/65">
                      <span className="h-px w-8 bg-background/60" aria-hidden="true" />
                      Compressed-air propulsion
                    </div>
                  )}
                  <Button
                    asChild
                    size="lg"
                    className="mt-auto h-12 w-full rounded-none border border-background bg-background text-xs font-semibold uppercase tracking-[0.2em] text-foreground hover:bg-background/85"
                  >
                    <Link to="/checkout" search={checkout}>
                      BUY NOW <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-7 flex justify-end">
          <Link to="/vehicles" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-background/60 transition-colors hover:text-background">
            Explore the full vehicle lineup <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}