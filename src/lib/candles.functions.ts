import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Historical price candles. Finnhub's /stock/candle endpoint is used first;
// when it is unavailable (free-tier restriction, quota, unsupported symbol)
// we fall back to Stooq's free daily CSV so the chart still shows real
// historical closes instead of a flat line.

export type Candle = { t: number; p: number };

export type CandlesResult = {
  symbol: string;
  range: string;
  candles: Candle[];
  source: "finnhub" | "yahoo" | "none";
  error: string | null;
};

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];

const Input = z.object({
  symbol: z.string().refine((s) => ["TSLA", "SPCX", "PYPL"].includes(s), "Unsupported symbol"),
  range: z.enum(RANGES),
});

const DAY = 24 * 60 * 60;
const spanSeconds: Record<Range, number> = {
  "1D": DAY,
  "1W": 7 * DAY,
  "1M": 30 * DAY,
  "3M": 90 * DAY,
  "1Y": 365 * DAY,
};
const resolutionFor = (range: Range) => (range === "1D" ? "5" : "D");

async function fromFinnhub(symbol: string, range: Range, token: string): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  // Pad the window so weekends/holidays still yield a full series.
  const from = to - Math.round(spanSeconds[range] * (range === "1D" ? 4 : 1.4));
  const url =
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${resolutionFor(range)}&from=${from}&to=${to}&token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const json = (await res.json()) as { s?: string; t?: number[]; c?: number[] };
  if (json.s !== "ok" || !json.t || !json.c) return [];
  const cutoff = (to - spanSeconds[range]) * 1000;
  return json.t
    .map((t, i) => ({ t: t * 1000, p: json.c![i] ?? 0 }))
    .filter((c) => c.p > 0 && c.t >= cutoff);
}

const yahooParams: Record<Range, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

/** Free historical closes from Yahoo Finance — no API key required. */
async function fromYahoo(symbol: string, range: Range): Promise<Candle[]> {
  const { range: r, interval } = yahooParams[range];
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`,
    { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
  };
  const result = json.chart?.result?.[0];
  const stamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!stamps || !closes) return [];
  const out: Candle[] = [];
  for (let i = 0; i < stamps.length; i++) {
    const p = closes[i];
    const t = stamps[i];
    if (typeof p !== "number" || !(p > 0) || typeof t !== "number") continue;
    out.push({ t: t * 1000, p: +p.toFixed(2) });
  }
  return out;
}

export const fetchCandles = createServerFn({ method: "POST" })
  .inputValidator(Input)
  .handler(async ({ data }): Promise<CandlesResult> => {
    const { symbol, range } = data;
    const token = process.env["FINNHUB_API_KEY"];

    if (token) {
      try {
        const candles = await fromFinnhub(symbol, range, token);
        if (candles.length > 1) {
          return { symbol, range, candles, source: "finnhub", error: null };
        }
      } catch {
        /* fall through to the free provider */
      }
    }

    try {
      const candles = await fromYahoo(symbol, range);
      if (candles.length > 1) {
        return { symbol, range, candles, source: "yahoo", error: null };
      }
    } catch {
      /* ignore */
    }

    return { symbol, range, candles: [], source: "none", error: "unavailable" };
  });
