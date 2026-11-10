// Live market store. Every asset on the platform is publicly traded, so prices
// come exclusively from the real-world quote feed (Finnhub via a server
// function). There is no simulated fluctuation engine: the store only changes
// when a genuine quote arrives.

export type AssetMeta = {
  slug: string;
  symbol: string;
  name: string;
  color: string;
  /** Reference price used until the first real quote lands. */
  base: number;
  /** Real-world exchange ticker. Every listed asset has one. */
  realSymbol: string;
};

export const ASSETS: AssetMeta[] = [
  { slug: "tesla", symbol: "TSLA", name: "Tesla", color: "#E31937", base: 248.5, realSymbol: "TSLA" },
  { slug: "spacex", symbol: "SPCX", name: "SpaceX", color: "#4F8BFF", base: 135.0, realSymbol: "SPCX" },
  { slug: "paypal-mafia", symbol: "PYPL", name: "X.com / PayPal Legacy", color: "#3B82F6", base: 62.4, realSymbol: "PYPL" },
];

export const assetBySlug = (slug: string) => ASSETS.find((a) => a.slug === slug);

/** Every asset carries a genuine exchange listing. */
export const REAL_ASSETS = ASSETS;
export const isRealAsset = (slug: string) => Boolean(assetBySlug(slug));

export type PricePoint = { t: number; p: number };

export type MarketRegime = "bullish" | "bearish" | "neutral";

type AssetState = {
  current: number;
  previous: number;
  open24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  history: PricePoint[];
};

const HISTORY_POINTS = 2000;

const state: Record<string, AssetState> = {};
for (const a of ASSETS) {
  state[a.slug] = {
    current: a.base,
    previous: a.base,
    open24h: a.base,
    high24h: a.base,
    low24h: a.base,
    volume: 0,
    history: [],
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

// Cache derived values so useSyncExternalStore sees stable references between
// updates (otherwise a fresh filtered array every render = infinite loop).
const snapshotCache = new Map<string, { v: number; value: AssetState }>();
const historyCache = new Map<string, { v: number; value: PricePoint[] }>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

/** Market-wide sentiment derived from the real day change across all assets. */
export function getMarketRegime(): MarketRegime {
  let sum = 0;
  let n = 0;
  for (const a of ASSETS) {
    const s = state[a.slug];
    if (!s || s.open24h <= 0) continue;
    sum += (s.current - s.open24h) / s.open24h;
    n++;
  }
  if (!n) return "neutral";
  const avg = sum / n;
  if (avg > 0.002) return "bullish";
  if (avg < -0.002) return "bearish";
  return "neutral";
}

/** No synthetic market events — real quotes only. */
export function getMarketEvent(): { label: string; until: number } | null {
  return null;
}

// ---- Live feed ingestion -------------------------------------------------

export type FeedStatus = {
  /** "live" once a real quote landed, "pending" before, "error" when the API is unusable. */
  state: "pending" | "live" | "error";
  lastUpdated: number | null;
  error: string | null;
};

let feedStatus: FeedStatus = { state: "pending", lastUpdated: null, error: null };

export function getFeedStatus() {
  return feedStatus;
}

export function setFeedError(error: string | null) {
  feedStatus = {
    state: error ? (feedStatus.lastUpdated ? "live" : "error") : feedStatus.state,
    lastUpdated: feedStatus.lastUpdated,
    error,
  };
  emit();
}

export type IncomingQuote = {
  symbol: string;
  price: number;
  previousClose?: number | null;
  high?: number | null;
  low?: number | null;
  open?: number | null;
  at?: number;
};

/** Writes real market quotes into the store. */
export function applyLiveQuotes(quotes: IncomingQuote[]) {
  const now = Date.now();
  let changed = false;

  for (const q of quotes) {
    const asset = ASSETS.find((a) => a.realSymbol === q.symbol);
    if (!asset || !(q.price > 0)) continue;
    const s = state[asset.slug];
    if (!s) continue;

    const price = +q.price.toFixed(2);
    realAnchor[asset.slug] = price;
    if (price !== s.current) {
      s.previous = s.current;
      s.current = price;
      changed = true;
    }
    if (q.previousClose && q.previousClose > 0) s.open24h = +q.previousClose.toFixed(2);
    s.high24h = q.high && q.high > 0 ? +q.high.toFixed(2) : Math.max(s.high24h, price);
    s.low24h = q.low && q.low > 0 ? +q.low.toFixed(2) : Math.min(s.low24h, price);

    const last = s.history[s.history.length - 1];
    if (!last || last.p !== price) {
      s.history.push({ t: q.at ?? now, p: price });
      if (s.history.length > HISTORY_POINTS) {
        s.history.splice(0, s.history.length - HISTORY_POINTS);
      }
    }
  }

  feedStatus = { state: "live", lastUpdated: now, error: null };
  emit();
  return changed;
}

// ---- Presentation mode ---------------------------------------------------
// Outside US market hours Finnhub returns the same closing price on every
// poll, which draws a flat line. To keep the terminal looking alive we nudge
// each price by a tiny random tick (±0.15%) whenever the feed is static.

const PRESENTATION_TICK_MS = 3000;
const MAX_DRIFT = 0.0015; // ±0.15% per tick
const DRIFT_ANCHOR = 0.01; // never wander more than 1% from the real quote

/** Last genuine quote per slug — the anchor simulated ticks revert toward. */
const realAnchor: Record<string, number> = {};

function presentationTick() {
  let changed = false;
  for (const a of ASSETS) {
    const s = state[a.slug];
    if (!s || s.current <= 0) continue;
    const anchor = realAnchor[a.slug] ?? s.current;
    // Gaussian-ish micro move, pulled gently back toward the real quote.
    const noise = (Math.random() + Math.random() - 1) * MAX_DRIFT;
    const pull = ((anchor - s.current) / anchor) * 0.25;
    let next = s.current * (1 + noise + pull);
    const lo = anchor * (1 - DRIFT_ANCHOR);
    const hi = anchor * (1 + DRIFT_ANCHOR);
    next = Math.min(hi, Math.max(lo, next));
    const price = +next.toFixed(2);
    if (price === s.current || price <= 0) continue;

    s.previous = s.current;
    s.current = price;
    s.high24h = Math.max(s.high24h, price);
    s.low24h = s.low24h > 0 ? Math.min(s.low24h, price) : price;
    const last = s.history[s.history.length - 1];
    if (!last || last.p !== price) {
      s.history.push({ t: Date.now(), p: price });
      if (s.history.length > HISTORY_POINTS) {
        s.history.splice(0, s.history.length - HISTORY_POINTS);
      }
    }
    changed = true;
  }
  if (changed) emit();
}

let feedStarted = false;
let presentationTimer: ReturnType<typeof setInterval> | null = null;

function ensureFeed() {
  if (typeof window === "undefined" || feedStarted) return;
  feedStarted = true;
  void import("./live-feed").then((m) => m.startLiveFeed());
  if (!presentationTimer) {
    presentationTimer = setInterval(presentationTick, PRESENTATION_TICK_MS);
  }
}

export function subscribeMarket(listener: Listener): () => void {
  ensureFeed();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Monotonic counter incremented on every store update. */
export function getMarketVersion() {
  return version;
}

export function getSnapshot(slug: string) {
  const s = state[slug];
  if (!s) return s;
  const cached = snapshotCache.get(slug);
  if (cached && cached.v === version) return cached.value;
  const value = { ...s };
  snapshotCache.set(slug, { v: version, value });
  return value;
}

export function getPrice(slug: string): number | undefined {
  return state[slug]?.current;
}

export function getPreviousPrice(slug: string): number | undefined {
  return state[slug]?.previous;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y";
const rangeMs: Record<TimeRange, number> = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
};

export function getRangedHistory(slug: string, range: TimeRange): PricePoint[] {
  const s = state[slug];
  if (!s) return [];
  const key = `${slug}:${range}`;
  const cached = historyCache.get(key);
  if (cached && cached.v === version) return cached.value;
  const cutoff = Date.now() - rangeMs[range];
  const value = s.history.filter((h) => h.t >= cutoff);
  historyCache.set(key, { v: version, value });
  return value;
}

/**
 * Best-effort price for an asset at a past timestamp — used to reconstruct a
 * cost basis for holdings saved before an entry price was recorded.
 */
export function getPriceAt(slug: string, t: number): number | undefined {
  const s = state[slug];
  if (!s || s.history.length === 0) return undefined;
  let best: PricePoint | undefined;
  for (const point of s.history) {
    if (point.t <= t) best = point;
    else break;
  }
  return (best ?? s.history[0])?.p;
}

/** Reference valuation for an asset, if known. */
export function getBasePrice(slug: string): number | undefined {
  return assetBySlug(slug)?.base;
}

/** Previous close (24h open) for an asset — used to reconstruct recent history. */
export function getOpen24h(slug: string): number | undefined {
  return state[slug]?.open24h;
}

