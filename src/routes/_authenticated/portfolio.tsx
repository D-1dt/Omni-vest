import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  listInvestments,
  listVehicleOrders,
  isActive,
  deriveVehicleOrderStatus,
  type PendingTransaction,
  type VehicleOrder,
} from "@/lib/db";
import { useSession } from "@/lib/auth";
import {
  useFeedStatus,
  useMarketSnapshot,
  useMarketSentiment,
  usePortfolioSeries,
  usePortfolioValuation,
  useTickDirection,
} from "@/hooks/useMarketData";
import { assetBySlug } from "@/lib/market";
import { buildPosition, type PortfolioValuation } from "@/lib/portfolio";
import { LiveNumber } from "@/components/LiveNumber";
import { getEntity } from "@/lib/data";
import { MarketChartModal } from "@/components/MarketChartModal";
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Car, CheckCircle2, ChevronRight, Clock, Eye, Info, LineChart, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "My Portfolio · Omni-Musk" },
      { name: "description", content: "Track your Omni-Musk allocations, live market valuation, and active vehicle orders." },
      { property: "og:title", content: "My Portfolio · Omni-Musk" },
      { property: "og:description", content: "Live portfolio value, holdings, and vehicle orders on Omni-Musk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioPage,
});

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function currency2(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function signedPct(n: number) {
  return `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(2)}%`;
}
/** Signed currency with an explicit ASCII minus for losses: -$83.68 */
function signedCurrency(n: number) {
  return `${n >= 0 ? "+" : "-"}${currency2(Math.abs(n))}`;
}

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(target - now, 0);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { ms, label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
}

function PortfolioPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [txs, setTxs] = useState<PendingTransaction[]>([]);
  const [orders, setOrders] = useState<VehicleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"investments" | "vehicles">("investments");
  const [openChart, setOpenChart] = useState<PendingTransaction | null>(null);

  const userId = session?.userId;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [t, o] = await Promise.all([listInvestments(userId), listVehicleOrders(userId)]);
        if (cancelled) return;
        setTxs(t);
        setOrders(o);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("storage", refresh);
    window.addEventListener("omni-musk-demo-storage", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("omni-musk-demo-storage", refresh);
    };
  }, [userId]);



  if (!session || loading) {
    return <div className="mx-auto max-w-xl px-6 py-32 text-center text-muted-foreground">Loading…</div>;
  }



  const chartEntity = openChart ? getEntity(openChart.entitySlug) : null;
  const firstName = session.fullName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-surface pt-16 text-foreground">
      <div className="mx-auto flex max-w-[1500px]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between border-r border-border bg-background px-4 py-8 lg:flex">
          <nav className="space-y-1">
            <SideItem icon={<BarChart3 className="h-4 w-4" />} active>Portfolio</SideItem>
            <SideItem icon={<LineChart className="h-4 w-4" />} onClick={() => setTab("investments")} active={false}>
              Investments
            </SideItem>
            <SideItem icon={<Car className="h-4 w-4" />} onClick={() => setTab("vehicles")} active={false}>
              Vehicle Orders
            </SideItem>
          </nav>
          <div className="space-y-6 px-3">
            <div>
              <div className="h-0.5 w-5 bg-brand" />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Build wealth.
                <br />
                Create your future.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {greeting},
              </div>
              <h1 className="mt-1 text-4xl font-semibold">{firstName}</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Here's a live overview of your investments and vehicle orders.
              </p>
              <div className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span><strong className="font-semibold text-foreground">Demo mode.</strong> This is a simulation. No real investments, vehicle purchases, or payments are processed. Your demo data is saved only in this browser.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>

          <LiveDashboard userId={session.userId} txs={txs} orders={orders} />

          <section className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {tab === "investments" ? "Your Holdings" : "Vehicle Orders"}
              </h2>
              <div className="inline-flex rounded-full bg-muted p-1">
                <TabBtn active={tab === "investments"} onClick={() => setTab("investments")}>Holdings</TabBtn>
                <TabBtn active={tab === "vehicles"} onClick={() => setTab("vehicles")}>Vehicles</TabBtn>
              </div>
            </div>

            {tab === "investments" && (
              <div className="mt-5">
                {txs.length === 0 ? (
                  <EmptyCard
                    title="No positions yet."
                    subtitle="Select an investment tier and click Verify Payment to open your first allocation."
                  />
                ) : (
                  <>
                    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                      <div>Asset</div>
                      <div>Live price</div>
                      <div>Current value</div>
                      <div>Total return</div>
                      <div className="w-5" />
                    </div>
                    <div className="divide-y divide-border">
                      {txs.map((t) => (
                        <InvestmentRow key={t.id} tx={t} onOpenChart={() => setOpenChart(t)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "vehicles" && (
              <div className="mt-5 grid gap-3">
                {orders.length === 0 ? (
                  <EmptyCard
                    title="No vehicle orders yet."
                    subtitle="Configure a vehicle and submit a payment receipt to start tracking here."
                  />
                ) : (
                  orders.map((o) => <VehicleOrderCard key={o.id} order={o} />)
                )}
              </div>
            )}

            {tab === "investments" && orders.length > 0 && (
              <button
                onClick={() => setTab("vehicles")}
                className="mt-5 flex w-full items-center justify-between gap-4 rounded-xl bg-brand-soft px-5 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-brand">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Car Purchase</div>
                    <div className="text-xs text-muted-foreground">
                      {orders.length} vehicle order{orders.length > 1 ? "s" : ""} are part of your portfolio.
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-background px-4 py-2 text-xs font-medium text-brand">
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
          </section>
        </main>
      </div>

      {openChart && chartEntity && (
        <MarketChartModal
          entity={chartEntity}
          entryPrice={openChart.entryPrice}
          onClose={() => setOpenChart(null)}
        />
      )}

    </div>
  );
}

const GAIN = "#2f7a5e";
const LOSS = "#c2413a";
const pnlColor = (up: boolean) => (up ? GAIN : LOSS);

function SideItem({
  icon,
  children,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active ? "bg-brand-soft font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className={active ? "text-brand" : ""}>{icon}</span>
      {children}
    </button>
  );
}

/** Live metrics + performance chart, recomputed on every market tick. */
function LiveDashboard({
  userId,
  txs,
  orders,
}: {
  userId: string;
  txs: PendingTransaction[];
  orders: VehicleOrder[];
}) {
  const valuation = usePortfolioValuation(txs);
  const { regime } = useMarketSentiment();
  const feed = useFeedStatus();
  const series = usePortfolioSeries(valuation.totalBalance, txs);
  const pending = txs.filter((t) => !isActive(t));
  const up = valuation.totalReturns >= 0;


  const updated = feed.lastUpdated ? new Date(feed.lastUpdated) : null;

  return (
    <>
      <div className="mt-8 grid overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-[1.4fr_1fr_1fr_0.7fr]">
        <div className="border-b border-border p-6 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Total Portfolio Value <Eye className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight">
            <LiveNumber value={valuation.totalBalance} format={currency2} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: pnlColor(up) }}>
            {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {signedCurrency(valuation.totalReturns)} ({signedPct(valuation.returnPercentage)})
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Total return (all time)</div>
        </div>
        <Stat label="Total Invested" value={currency2(valuation.totalInvested)} />
        <Stat
          label="Unrealized Returns"
          value={
            <span style={{ color: pnlColor(up) }}>
              <LiveNumber value={valuation.totalReturns} format={signedCurrency} />
            </span>
          }
        />
        <Stat
          label="Positions"
          value={String(valuation.positions.length)}
          hint={`${pending.length} pending · ${orders.length} vehicles`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="animate-pulse-dot h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: regime === "bearish" ? LOSS : GAIN }}
          />
          Live market · {regime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" />
          {feed.state === "live"
            ? `Last updated ${updated ? updated.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}${feed.error ? " · retrying" : ""}`
            : feed.state === "error"
              ? feed.error === "rate-limited"
                ? "Market feed rate-limited · retrying shortly"
                : "Market feed unavailable · showing last known prices"
              : "Connecting to live market feed…"}
        </span>
      </div>

      <PortfolioPerformanceChart series={series} up={up} />
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col justify-center border-b border-border p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/**
 * Persists the live balance to the `portfolios` table. Throttled to one write
 * every 20s and upserted on user_id so ticks refresh a single row.
 */
function PortfolioPerformanceChart({ series, up }: { series: { t: number; v: number }[]; up: boolean }) {
  const color = pnlColor(up);
  const data = useMemo(
    () =>
      series.map((p) => ({
        t: p.t,
        v: +p.v.toFixed(2),
        label: new Date(p.t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      })),
    [series],
  );

  if (data.length < 2) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-background px-6 py-12 text-center text-xs text-muted-foreground">
        Tracking your portfolio value — the performance curve appears as prices tick.
      </div>
    );
  }

  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, max * 0.01, 0.01);
  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Portfolio Performance</h2>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">Live · 24h</span>
      </div>
      <div className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef0f2" vertical />
            <XAxis dataKey="label" tick={{ fill: "#8a9099", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={50} />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fill: "#8a9099", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={78}
              tickFormatter={(v: number) => currency(v)}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "0 8px 24px -12px rgba(0,0,0,0.2)",
              }}
              labelStyle={{ color: "#8a9099" }}
              formatter={(v: number) => [currency2(v), "Value"]}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill="url(#portfolioFill)"
              isAnimationActive={true}
              animationDuration={400}
              animationEasing="linear"
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        Your portfolio is {change >= 0 ? "up" : "down"}{" "}
        <span className="font-medium" style={{ color: pnlColor(change >= 0) }}>
          {signedCurrency(change)} ({signedPct(changePct)})
        </span>{" "}
        over this period.
      </p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function InvestmentRow({ tx, onOpenChart }: { tx: PendingTransaction; onOpenChart: () => void }) {
  const active = isActive(tx);
  const { label } = useCountdown(tx.activationTime);
  const snap = useMarketSnapshot(tx.entitySlug);
  useTickDirection(tx.entitySlug);
  const asset = assetBySlug(tx.entitySlug);
  const accent = asset?.color ?? "#3b82f6";

  const pos = buildPosition(tx);
  const up = pos.unrealizedGainLoss >= 0;
  const dayChange = snap ? snap.current - snap.open24h : 0;
  const dayPct = snap && snap.open24h ? (dayChange / snap.open24h) * 100 : 0;

  return (
    <button
      onClick={active ? onOpenChart : undefined}
      disabled={!active}
      className={`group grid w-full grid-cols-2 items-center gap-4 py-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed md:grid-cols-[2fr_1fr_1fr_1fr_auto] ${
        active ? "" : "opacity-60"
      }`}
    >
      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          {tx.entityName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {tx.entityName}
            {!active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> Pending · {label}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {asset?.symbol ?? "—"} · {pos.sharesOwned > 0 ? `${pos.sharesOwned.toFixed(4)} shares` : tx.tier} · Cost {currency(tx.amount)}
          </div>
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Live price</div>
        <div className="text-sm font-medium">
          <LiveNumber value={pos.currentPrice} format={(n) => `$${n.toFixed(2)}`} />
        </div>
        {snap && (
          <div className="text-xs" style={{ color: pnlColor(dayChange >= 0) }}>
            {signedPct(dayPct)} 24h
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Current value</div>
        <div className="text-sm font-medium">
          {active ? (
            <LiveNumber value={pos.currentValue} format={currency2} />
          ) : (
            <span className="tabular-nums">{currency2(pos.currentValue)}</span>
          )}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Total return</div>
        {active ? (
          <div style={{ color: pnlColor(up) }}>
            <div className="flex items-center gap-1 text-sm font-medium">
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {signedPct(pos.returnPercentage)}
            </div>
            <div className="text-xs">{signedCurrency(pos.unrealizedGainLoss)}</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">0.00% · $0.00</div>
        )}
      </div>
      <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
    </button>
  );
}

function VehicleOrderCard({ order }: { order: VehicleOrder }) {
  const navigate = useNavigate();
  const status = deriveVehicleOrderStatus(order);
  const { label } = useCountdown(order.verificationTime);
  const submitted = new Date(order.createdAt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const goToCheckout = () =>
    navigate({
      to: "/checkout",
      search: {
        slug: order.slug,
        color: order.colorIndex,
        wheel: order.wheelIndex,
        interior: order.interiorIndex,
        down: order.down,
        term: order.term,
        apr: order.apr,
        orderId: order.id,
      },
    });

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vehicle order · {submitted}</div>
            <h3 className="text-base font-semibold">{order.vehicleName}</h3>
            <p className="text-xs text-muted-foreground">
              {order.colorName} · Down {currency(order.down)} · Total {currency(order.total)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          {status === "verifying" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Verifying payment · {label}
            </span>
          )}
          {status === "action_required" && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-loss/10 px-3 py-1 text-xs font-medium text-loss">
                <AlertCircle className="h-3.5 w-3.5" /> Action required
              </span>
              <button
                onClick={goToCheckout}
                className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                Enter Delivery Details
              </button>
            </>
          )}
          {status === "processing_delivery" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              <CheckCircle2 className="h-3.5 w-3.5" /> Processing for delivery
            </span>
          )}
        </div>
      </div>

      {order.delivery && (
        <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
          <div className="text-xs text-muted-foreground">Delivery to</div>
          <div className="mt-1 font-medium">{order.delivery.fullName}</div>
          <div className="text-muted-foreground">
            {order.delivery.street}, {order.delivery.city}, {order.delivery.state} {order.delivery.zip} · {order.delivery.phone}
          </div>
        </div>
      )}
    </div>
  );
}
