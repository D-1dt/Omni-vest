// Real-world price feed. Polls the server-side Finnhub proxy on an interval
// and pushes genuine quotes into the market store. Rate limits and outages
// back off instead of crashing — the app keeps rendering the last known price.

import { REAL_ASSETS, applyLiveQuotes, setFeedError } from "./market";
import { fetchLiveQuotes } from "./quotes.functions";

const BASE_INTERVAL = 60_000;
const MAX_INTERVAL = 10 * 60_000;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let interval = BASE_INTERVAL;
let inFlight = false;

const symbols = REAL_ASSETS.map((a) => a.realSymbol!);

async function poll() {
  if (inFlight || symbols.length === 0) return;
  inFlight = true;
  try {
    const res = await fetchLiveQuotes({ data: { symbols } });
    if (res.quotes.length > 0) {
      applyLiveQuotes(res.quotes);
      interval = BASE_INTERVAL; // healthy again
    } else if (res.error) {
      setFeedError(res.error);
      // Back off hard on quota exhaustion, gently on transient errors.
      interval = Math.min(
        MAX_INTERVAL,
        res.error === "rate-limited" ? interval * 3 : interval * 2,
      );
    }
  } catch {
    setFeedError("error");
    interval = Math.min(MAX_INTERVAL, interval * 2);
  } finally {
    inFlight = false;
    schedule();
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void poll(), interval);
}

export function startLiveFeed() {
  if (started || typeof window === "undefined") return;
  started = true;
  void poll();

  // Refresh immediately when the user returns to the tab so the first thing
  // they see is a current price, not a stale one.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void poll();
  });
}
