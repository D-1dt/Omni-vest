// Portfolio valuation math. Holdings are stored as a fiat `amount` plus the
// `entry_price` captured at purchase, so shares are derived rather than
// duplicated in the database — one source of truth, no drift.

import { getPrice, getPriceAt, getBasePrice, getOpen24h } from "@/lib/market";
import { isActive, type PendingTransaction } from "@/lib/db";

export type Position = {
  tx: PendingTransaction;
  /** True while the mandatory 2h settlement window has not elapsed. */
  pending: boolean;
  /** amount / average_buy_price */
  sharesOwned: number;
  averageBuyPrice: number;
  currentPrice: number;
  /** shares_owned * current_price */
  currentValue: number;
  /** (current_price - average_buy_price) * shares_owned */
  unrealizedGainLoss: number;
  /** ((current_price - average_buy_price) / average_buy_price) * 100 */
  returnPercentage: number;
};

/**
 * Cost basis for a holding. Legacy rows saved before `entry_price` existed get
 * a reconstructed basis (price at purchase time, else the asset's seed price)
 * so their value still tracks the live tape instead of freezing at `amount`.
 */
function resolveEntryPrice(tx: PendingTransaction): number {
  if (tx.entryPrice && tx.entryPrice > 0) return tx.entryPrice;
  const historical = getPriceAt(tx.entitySlug, tx.createdAt);
  if (historical && historical > 0) return historical;
  const base = getBasePrice(tx.entitySlug);
  if (base && base > 0) return base;
  return getPrice(tx.entitySlug) ?? 0;
}

export function buildPosition(tx: PendingTransaction): Position {
  const averageBuyPrice = resolveEntryPrice(tx);
  const currentPrice = getPrice(tx.entitySlug) ?? averageBuyPrice;
  const pending = !isActive(tx);

  if (pending) {
    // Mandatory 2h settlement window — math is frozen at the deposited amount
    // and P/L is locked flat until the position clears.
    return {
      tx,
      pending: true,
      sharesOwned: averageBuyPrice > 0 ? tx.amount / averageBuyPrice : 0,
      averageBuyPrice: averageBuyPrice > 0 ? averageBuyPrice : 0,
      currentPrice,
      currentValue: tx.amount,
      unrealizedGainLoss: 0,
      returnPercentage: 0,
    };
  }

  if (averageBuyPrice <= 0 || currentPrice <= 0) {
    // No market data for this slug at all — value equals cost, no P/L invented.
    return {
      tx,
      pending: false,
      sharesOwned: 0,
      averageBuyPrice: 0,
      currentPrice,
      currentValue: tx.amount,
      unrealizedGainLoss: 0,
      returnPercentage: 0,
    };
  }

  const sharesOwned = tx.amount / averageBuyPrice;
  const currentValue = sharesOwned * currentPrice;

  return {
    tx,
    pending: false,
    sharesOwned,
    averageBuyPrice,
    currentPrice,
    currentValue,
    unrealizedGainLoss: (currentPrice - averageBuyPrice) * sharesOwned,
    returnPercentage: ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100,
  };
}

export type PortfolioValuation = {
  positions: Position[];
  /** Sum of current_value across every active holding. */
  totalBalance: number;
  /** Sum of the original cost basis. */
  totalInvested: number;
  /** total_balance - total_initial_invested_cost */
  totalReturns: number;
  returnPercentage: number;
};

export function valuePortfolio(txs: PendingTransaction[]): PortfolioValuation {
  // Pending holdings are included at cost so the totals never jump when a
  // position settles — they simply start tracking the market.
  const positions = txs.map(buildPosition);

  let totalBalance = 0;
  let totalInvested = 0;
  for (const p of positions) {
    totalBalance += p.currentValue;
    totalInvested += p.tx.amount;
  }

  const totalReturns = totalBalance - totalInvested;
  return {
    positions,
    totalBalance,
    totalInvested,
    totalReturns,
    returnPercentage: totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0,
  };
}

/**
 * Total portfolio value with each asset's price interpolated between its 24h
 * open and its live price (`f` = 0 → yesterday's close, 1 → now). Used to seed
 * a realistic starting curve so the chart is never a flat two-point line.
 */
export function totalValueAtFactor(txs: PendingTransaction[], f: number): number {
  let total = 0;
  for (const p of txs.map(buildPosition)) {
    if (p.pending) {
      total += p.currentValue; // frozen at cost during settlement
      continue;
    }
    const open = getOpen24h(p.tx.entitySlug);
    const live = p.currentPrice;
    const price = open && open > 0 ? open + (live - open) * f : live;
    total += p.sharesOwned > 0 ? p.sharesOwned * price : p.currentValue;
  }
  return total;
}
