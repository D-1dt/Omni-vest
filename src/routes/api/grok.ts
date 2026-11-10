import { createFileRoute } from "@tanstack/react-router";

export type GrokHolding = { name: string; symbol?: string; invested: number; currentValue: number; pnl: number; returnPct: number; pending: boolean };
export type GrokContext = { firstName?: string; totalPortfolioValue: number; totalInvested: number; totalReturns: number; returnPercentage: number; holdings: GrokHolding[] };

// AI portfolio chat is intentionally disabled in the localStorage-only public demo.
export const Route = createFileRoute("/api/grok")({
  server: { handlers: { POST: async () => new Response("The AI assistant is disabled in this demo build.", { status: 501 }) } },
});
