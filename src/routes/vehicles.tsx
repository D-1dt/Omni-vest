import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { vehicles, type Vehicle } from "@/lib/data";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicles — Omni-Musk" },
      { name: "description", content: "Configure and order the full Tesla lineup: Model S, 3, X, Y and Cybertruck." },
      { property: "og:title", content: "Vehicles — Omni-Musk" },
      { property: "og:description", content: "Configure and order the full Tesla lineup with dynamic pricing and financing." },
    ],
  }),
  component: VehiclesPage,
});

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function Configurator({ vehicle }: { vehicle: Vehicle }) {
  const [color, setColor] = useState(0);
  const [wheel, setWheel] = useState(0);
  const [interior, setInterior] = useState(0);
  const [down, setDown] = useState(10000);
  const [term, setTerm] = useState(60);
  const [apr, setApr] = useState(5.99);

  const total = useMemo(
    () => vehicle.basePrice + vehicle.colors[color].price + vehicle.wheels[wheel].price + vehicle.interiors[interior].price,
    [vehicle, color, wheel, interior]
  );

  const monthly = useMemo(() => {
    const principal = Math.max(total - down, 0);
    const r = apr / 100 / 12;
    if (r === 0) return principal / term;
    return (principal * r) / (1 - Math.pow(1 + r, -term));
  }, [total, down, term, apr]);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative rounded-2xl bg-secondary p-6 md:p-10">
        <img
          key={vehicle.colors[color].image}
          src={vehicle.colors[color].image}
          alt={`${vehicle.name} in ${vehicle.colors[color].name}`}
          loading="lazy"
          className="mx-auto w-full max-w-2xl object-contain animate-fade-up transition-transform duration-700 hover:scale-[1.02]"
        />
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center text-sm">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Range</div>
            <div className="mt-1 font-medium">{vehicle.range}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Acceleration</div>
            <div className="mt-1 font-medium">{vehicle.acceleration}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Top Speed</div>
            <div className="mt-1 font-medium">{vehicle.topSpeed}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {vehicle.tagline}
        </div>
        <h3 className="mt-2 text-4xl">{vehicle.name}</h3>
        <div className="mt-4 flex items-baseline gap-3">
          <div className="text-3xl font-medium">{currency(total)}</div>
          <div className="text-sm text-muted-foreground">
            est. {currency(monthly)} /mo
          </div>
        </div>

        {/* Color */}
        <div className="mt-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Paint — {vehicle.colors[color].name}
          </div>
          <div className="mt-3 flex gap-3">
            {vehicle.colors.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setColor(i)}
                aria-label={c.name}
                style={{ backgroundColor: c.hex }}
                className={`h-10 w-10 rounded-full border transition-all ${
                  i === color ? "ring-2 ring-foreground ring-offset-2" : "border-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wheels */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Wheels
          </div>
          <div className="mt-3 grid gap-2">
            {vehicle.wheels.map((w, i) => (
              <button
                key={w.name}
                onClick={() => setWheel(i)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                  i === wheel ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
                }`}
              >
                <span>{w.name}</span>
                <span className="text-muted-foreground">
                  {w.price === 0 ? "Included" : `+ ${currency(w.price)}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Interior */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Interior
          </div>
          <div className="mt-3 grid gap-2">
            {vehicle.interiors.map((it, i) => (
              <button
                key={it.name}
                onClick={() => setInterior(i)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                  i === interior ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
                }`}
              >
                <span>{it.name}</span>
                <span className="text-muted-foreground">
                  {it.price === 0 ? "Included" : `+ ${currency(it.price)}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Financing */}
        <div className="mt-8 rounded-xl border border-border bg-background p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Financing Calculator
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Down Payment</span>
              <input
                type="number"
                value={down}
                onChange={(e) => setDown(Math.max(0, +e.target.value || 0))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Term (months)</span>
              <select
                value={term}
                onChange={(e) => setTerm(+e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                {[36, 48, 60, 72, 84].map((t) => (
                  <option key={t} value={t}>{t} mo</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 block">
              <span className="text-muted-foreground">APR — {apr.toFixed(2)}%</span>
              <input
                type="range"
                min={2}
                max={12}
                step={0.25}
                value={apr}
                onChange={(e) => setApr(+e.target.value)}
                className="mt-2 w-full accent-foreground"
              />
            </label>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Estimated monthly</span>
            <span className="text-2xl font-medium">{currency(monthly)}</span>
          </div>
        </div>

        <Link
          to="/checkout"
          search={{
            slug: vehicle.slug,
            color,
            wheel,
            interior,
            down,
            term,
            apr,
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-sm font-semibold uppercase tracking-widest text-background transition-opacity hover:opacity-90"
        >
          Order Now
        </Link>
      </div>
    </div>
  );
}

function VehiclesPage() {
  const [active, setActive] = useState(vehicles[0].slug);
  const vehicle = vehicles.find((v) => v.slug === active)!;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Digital Showroom
        </div>
        <h1 className="mt-3 text-5xl md:text-6xl">Design Yours.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Configure paint, wheels and interior. Adjust your financing in real time.
          Order direct through Omni-Musk.
        </p>
      </div>

      {/* Selector */}
      <div className="-mx-6 mb-12 flex gap-2 overflow-x-auto px-6 lg:-mx-12 lg:px-12">
        {vehicles.map((v) => (
          <button
            key={v.slug}
            onClick={() => setActive(v.slug)}
            className={`group shrink-0 rounded-xl border px-4 py-3 transition-all ${
              active === v.slug ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <img src={v.image} alt={v.name} loading="lazy" className="h-12 w-20 rounded object-cover" />
              <div className="text-left">
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground">From {currency(v.basePrice)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Configurator vehicle={vehicle} key={vehicle.slug} />
    </div>
  );
}
