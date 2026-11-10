import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Live quote fetcher. Runs server-side so the Finnhub API key never reaches
// the browser. Failures (network, quota, missing key) always resolve to a
// typed payload instead of throwing, so the UI degrades gracefully.

export type LiveQuote = {
  symbol: string;
  price: number;
  previousClose: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  at: number;
};

export type QuotesResult = {
  quotes: LiveQuote[];
  /** Set when the whole batch failed: "no-key" | "rate-limited" | "error". */
  error: string | null;
  fetchedAt: number;
};

const ALLOWED = ["TSLA", "SPCX", "PYPL"] as const;
const Input = z.object({ symbols: z.array(z.string().refine((s) => (ALLOWED as readonly string[]).includes(s), "Unsupported symbol")).min(1).max(ALLOWED.length) });

export const fetchLiveQuotes = createServerFn({ method: "POST" })
  .inputValidator(Input)
  .handler(async ({ data }): Promise<QuotesResult> => {
    const token = process.env["FINNHUB_API_KEY"];
    const now = Date.now();
    if (!token) return { quotes: [], error: "no-key", fetchedAt: now };

    const results: LiveQuote[] = [];
    let rateLimited = false;
    let failed = 0;

    await Promise.all(
      data.symbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (res.status === 429) {
            rateLimited = true;
            return;
          }
          if (!res.ok) {
            failed++;
            return;
          }
          const json = (await res.json()) as {
            c?: number; h?: number; l?: number; o?: number; pc?: number; t?: number;
          };
          const price = typeof json.c === "number" ? json.c : 0;
          if (!price || price <= 0) return; // unknown/unsupported symbol
          results.push({
            symbol,
            price,
            previousClose: json.pc && json.pc > 0 ? json.pc : null,
            high: json.h && json.h > 0 ? json.h : null,
            low: json.l && json.l > 0 ? json.l : null,
            open: json.o && json.o > 0 ? json.o : null,
            at: json.t ? json.t * 1000 : now,
          });
        } catch {
          failed++;
        }
      }),
    );

    const error =
      results.length === 0
        ? rateLimited
          ? "rate-limited"
          : failed > 0
            ? "error"
            : null
        : null;

    return { quotes: results, error, fetchedAt: now };
  });
