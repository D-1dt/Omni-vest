import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  subscribeMarket,
  getSnapshot,
  getPrice,
  getPreviousPrice,
  getRangedHistory,
  getMarketVersion,
  getMarketRegime,
  getMarketEvent,
  getFeedStatus,
  isRealAsset,
  type TimeRange,
} from "@/lib/market";
import { valuePortfolio, totalValueAtFactor, type PortfolioValuation } from "@/lib/portfolio";
import type { PendingTransaction } from "@/lib/db";

/** Status of the real-world price feed (live / pending / error). */
export function useFeedStatus() {
  useMarketTick();
  return getFeedStatus();
}

/** True when this asset's price comes from a real exchange quote. */
export function useIsRealAsset(slug: string) {
  return isRealAsset(slug);
}


export function useMarketPrice(slug: string) {
  return useSyncExternalStore(
    subscribeMarket,
    () => getPrice(slug),
    () => getPrice(slug),
  );
}

export function useMarketSnapshot(slug: string) {
  return useSyncExternalStore(
    subscribeMarket,
    () => getSnapshot(slug),
    () => getSnapshot(slug),
  );
}

export function useMarketHistory(slug: string, range: TimeRange) {
  return useSyncExternalStore(
    subscribeMarket,
    () => getRangedHistory(slug, range),
    () => getRangedHistory(slug, range),
  );
}

/** Re-renders the caller on every market tick; returns the tick counter. */
export function useMarketTick() {
  return useSyncExternalStore(subscribeMarket, getMarketVersion, getMarketVersion);
}

/** Direction of the most recent tick for one asset: 1 up, -1 down, 0 flat. */
export function useTickDirection(slug: string): 1 | -1 | 0 {
  useMarketTick();
  const current = getPrice(slug);
  const previous = getPreviousPrice(slug);
  if (current == null || previous == null || current === previous) return 0;
  return current > previous ? 1 : -1;
}

export function useMarketSentiment() {
  useMarketTick();
  return { regime: getMarketRegime(), event: getMarketEvent() };
}

/** Live valuation of the user's holdings, recomputed on every price tick. */
export function usePortfolioValuation(txs: PendingTransaction[]): PortfolioValuation {
  useMarketTick();
  return valuePortfolio(txs);
}

export type BalancePoint = { t: number; v: number };

const MAX_POINTS = 40;
const SEED_POINTS = 24;

/**
 * Rolling series of the portfolio's total value. Seeded from the last 24h of
 * real price movement so the curve is already alive on first paint, then
 * extended with a fresh snapshot on every market tick.
 */
export function usePortfolioSeries(
  totalBalance: number,
  txs: PendingTransaction[] = [],
  maxPoints = MAX_POINTS,
): BalancePoint[] {
  const tick = useMarketTick();
  const [series, setSeries] = useState<BalancePoint[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    if (totalBalance <= 0) return;

    setSeries((prev) => {
      let next = prev;

      // Seed a realistic 24h curve once we have both holdings and live prices.
      if (!seeded.current && prev.length < 5) {
        seeded.current = true;
        const now = Date.now();
        const step = (24 * 60 * 60 * 1000) / SEED_POINTS;
        const seedPoints: BalancePoint[] = [];
        for (let i = 0; i < SEED_POINTS; i++) {
          const f = i / SEED_POINTS;
          const v = totalValueAtFactor(txs, f);
          if (v > 0) seedPoints.push({ t: now - (SEED_POINTS - i) * step, v });
        }
        next = seedPoints;
      }

      next = [...next, { t: Date.now(), v: totalBalance }];
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
    // Recompute on every market tick, even when the total lands on the same value.
  }, [tick, totalBalance, txs, maxPoints]);

  return series;
}

