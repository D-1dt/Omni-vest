import { useEffect, useMemo, useState } from "react";
import { X, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMarketHistory, useMarketSnapshot } from "@/hooks/useMarketData";
import { assetBySlug, type TimeRange } from "@/lib/market";
import { fetchCandles, type Candle } from "@/lib/candles.functions";
import type { Entity } from "@/lib/data";

const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y"];

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Axis label formatting tuned to the active range. */
function axisLabel(t: number, range: TimeRange) {
  const d = new Date(t);
  if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "1Y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function tooltipLabel(t: number, range: TimeRange) {
  const d = new Date(t);
  return range === "1D" ? d.toLocaleString() : d.toLocaleDateString();
}

/** Real historical candles for the selected range, with a local-history fallback. */
function useCandles(symbol: string, range: TimeRange) {
  const [state, setState] = useState<{ candles: Candle[]; loading: boolean }>({
    candles: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetchCandles({ data: { symbol, range } })
      .then((res) => {
        if (!cancelled) setState({ candles: res.candles, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ candles: [], loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  return state;
}

export function MarketChartModal({
  entity,
  entryPrice,
  onClose,
  onConfirm,
  confirmLabel = "Confirm & Proceed",
}: {
  entity: Entity;
  entryPrice?: number;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  const [range, setRange] = useState<TimeRange>("1M");
  const asset = assetBySlug(entity.slug);
  const snap = useMarketSnapshot(entity.slug);
  const localHistory = useMarketHistory(entity.slug, range);
  const { candles, loading } = useCandles(asset?.realSymbol ?? asset?.symbol ?? "", range);
  const accent = asset?.color ?? entity.accent;

  const data = useMemo(
    () => (candles.length > 1 ? candles : localHistory).map((h) => ({ t: h.t, p: h.p })),
    [candles, localHistory],
  );

  // Dynamic Y domain: tight padding so real swings fill the chart height.
  const yDomain = useMemo<[number, number] | ["auto", "auto"]>(() => {
    if (data.length === 0) return ["auto", "auto"];
    const prices = data.map((d) => d.p);
    if (entryPrice && entryPrice > 0) prices.push(entryPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = Math.max((max - min) * 0.08, max * 0.002);
    return [Math.max(0, min - pad), max + pad];
  }, [data, entryPrice]);

  if (!snap || !asset) {
    return null;
  }

  const change = snap.current - snap.open24h;
  const changePct = (change / snap.open24h) * 100;
  const up = change >= 0;
  const seriesColor = up ? "#22c55e" : "#EF4444";


  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a10] text-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]"
        style={{
          backgroundImage: `radial-gradient(circle at 0% 0%, ${accent}22, transparent 40%), radial-gradient(circle at 100% 100%, ${accent}18, transparent 45%)`,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {entity.initials}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                {asset.symbol} · {entity.sector}
              </div>
              <h3 className="mt-1 text-2xl font-medium">{entity.name}</h3>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-3xl font-medium tracking-tight">${fmt(snap.current)}</div>
            <div
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold`}
              style={{
                backgroundColor: up ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: up ? "#4ade80" : "#f87171",
              }}
            >
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {up ? "+" : ""}{fmt(change)} ({up ? "+" : ""}{fmt(changePct)}%) Today
            </div>
          </div>
        </div>

        {/* Chart + metrics */}
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_220px] md:p-8">
          <div>
            <div className="relative h-[280px] w-full">
              {loading && data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-white/40">
                  Loading {range} history…
                </div>
              )}
              {!loading && data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-white/40">
                  No history available for {range}
                </div>
              )}
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${entity.slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesColor} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={seriesColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t) => axisLabel(Number(t), range)}
                    stroke="rgba(255,255,255,0.35)"
                    tick={{ fontSize: 11 }}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={yDomain}
                    allowDataOverflow={false}
                    stroke="rgba(255,255,255,0.35)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${fmt(Number(v), 0)}`}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0a10",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelFormatter={(t) => tooltipLabel(Number(t), range)}
                    formatter={(v: number) => [`$${fmt(v)}`, "Price"]}
                  />

                  {entryPrice ? (
                    <ReferenceLine
                      y={entryPrice}
                      stroke="#facc15"
                      strokeDasharray="4 4"
                      label={{ value: `Entry $${fmt(entryPrice)}`, position: "insideTopRight", fill: "#facc15", fontSize: 11 }}
                    />
                  ) : null}
                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke={seriesColor}
                    strokeWidth={2}
                    fill={`url(#grad-${entity.slug})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-widest transition-colors ${
                    r === range ? "bg-white text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <Metric label="24h High" value={`$${fmt(snap.high24h)}`} />
            <Metric label="24h Low" value={`$${fmt(snap.low24h)}`} />
            <Metric label="Volume" value={snap.volume.toLocaleString()} />
            <Metric label="Symbol" value={asset.symbol} />
          </div>
        </div>

        {/* Tiers */}
        <div className="border-t border-white/10 p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Investment tiers
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {entity.plans.map((p) => (
              <div key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/50">{p.name}</div>
                <div className="mt-1 text-lg font-medium">
                  {p.minimum >= 1000 ? `$${(p.minimum / 1000).toFixed(0)}k+` : `$${p.minimum}+`}
                </div>
                <div className="mt-1 text-xs text-white/60">{p.roi} · {p.term}</div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-[#0a0a10]/95 p-6 sm:flex-row sm:justify-end md:p-8">
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white/80 hover:bg-white/5"
          >
            Close
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-black hover:bg-white/90"
              style={{ boxShadow: `0 12px 40px -12px ${accent}` }}
            >
              {confirmLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">{label}</div>
      <div className="mt-1 text-base font-medium">{value}</div>
    </div>
  );
}
