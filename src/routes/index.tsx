import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import modelS from "@/assets/home-model-s.jpg";
import cybertruck from "@/assets/cybertruck-stainless.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Omni-Musk — The Future of Transportation and Capital" },
      { name: "description", content: "Acquire next-generation Tesla vehicles and invest across Elon Musk's portfolio of companies." },
      { property: "og:title", content: "Omni-Musk — The Future of Transportation and Capital" },
      { property: "og:description", content: "Acquire next-generation Tesla vehicles and invest across Elon Musk's portfolio of companies." },
    ],
  }),
  component: Home,
});

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0.15 }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Home() {
  const ref = useReveal();
  return (
    <div ref={ref} className="-mt-16">
      {/* HERO */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        <img
          src={heroCar}
          alt="Flagship electric vehicle"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/80" />
        <div className="relative z-10 flex h-full flex-col items-center justify-between pt-32 pb-16 text-center">
          <div className="animate-fade-up px-6">
            <h1 className="text-5xl font-medium md:text-7xl">
              The Future of Transportation
              <span className="block text-foreground/70">and Capital.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-foreground/70 md:text-lg">
              One platform to drive what's next and own what comes after.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              to="/vehicles"
              className="min-w-[260px] rounded-full bg-foreground px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-background transition-transform hover:scale-[1.02]"
            >
              Shop Vehicles
            </Link>
            <Link
              to="/invest"
              className="min-w-[260px] rounded-full border border-foreground/20 bg-background/80 px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-transform hover:scale-[1.02]"
            >
              Invest Now
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2 - sticky-feel split */}
      <section className="relative">
        <div className="grid md:grid-cols-2">
          <div className="reveal flex flex-col justify-center px-8 py-24 md:px-16 md:py-40">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Flagship
            </div>
            <h2 className="mt-4 text-4xl md:text-6xl">Model S Plaid.</h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              1,020 horsepower. 1.99 second 0–60. The quickest production car ever made,
              available now through Omni-Musk at factory-direct pricing.
            </p>
            <div className="mt-10">
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest hover:gap-3 transition-all"
              >
                Configure <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="reveal relative min-h-[420px]">
            <img src={modelS} alt="Model S" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="grid md:grid-cols-2">
          <div className="reveal relative order-2 min-h-[420px] md:order-1">
            <img src={cybertruck} alt="Cybertruck" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="reveal order-1 flex flex-col justify-center px-8 py-24 md:order-2 md:px-16 md:py-40">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Now Available
            </div>
            <h2 className="mt-4 text-4xl md:text-6xl">Cybertruck.</h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Engineered for any planet. Ultra-hard 30X cold-rolled stainless exoskeleton.
              Reserve and customize yours in minutes.
            </p>
            <div className="mt-10">
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest hover:gap-3 transition-all"
              >
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INVESTMENT TEASER */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] px-6 py-32 lg:px-12">
          <div className="reveal grid gap-12 md:grid-cols-2 md:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-background/60">
                The Muskonomy
              </div>
              <h2 className="mt-4 text-4xl md:text-6xl">
                Invest in what's next.
              </h2>
            </div>
            <p className="text-lg text-background/70">
              Tesla. SpaceX. X.com / PayPal Legacy. One portal,
              every venture — with tiered plans starting at $250 and institutional
              access at scale.
            </p>
          </div>
          <div className="reveal mt-12 grid gap-6 md:grid-cols-4">
            {[
              { k: "12+", v: "Ventures" },
              { k: "$250", v: "Min. Entry" },
              { k: "34%", v: "Premium ROI" },
              { k: "BTC · ETH · SOL", v: "Funding Rails" },
            ].map((s) => (
              <div key={s.v} className="border-t border-background/15 pt-6">
                <div className="text-3xl font-medium">{s.k}</div>
                <div className="mt-2 text-sm uppercase tracking-widest text-background/60">{s.v}</div>
              </div>
            ))}
          </div>
          <div className="reveal mt-16">
            <Link
              to="/invest"
              className="inline-flex items-center gap-2 rounded-full bg-background px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-foreground transition-transform hover:scale-[1.02]"
            >
              View Portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
