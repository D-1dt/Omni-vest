import { describe, expect, test } from "bun:test";
import { isRoadsterPaymentAmount, isRoadsterSlug, roadsterCheckoutSearch, roadsterOffers } from "../src/lib/roadster-catalog";

describe("Roadster purchase catalog", () => {
  test("uses the three requested server-authoritative prices", () => {
    expect(roadsterOffers.map((offer) => offer.price)).toEqual([250_000, 500_000, 1_000_000]);
  });

  test("each purchase option has a distinct valid catalog slug", () => {
    const slugs = roadsterOffers.map((offer) => offer.slug);
    expect(new Set(slugs).size).toBe(3);
    for (const slug of slugs) expect(isRoadsterSlug(slug)).toBe(true);
    expect(isRoadsterSlug("roadster-unlisted-price")).toBe(false);
  });

  test("only the flying version is marked invite-only", () => {
    expect(roadsterOffers.map((offer) => offer.inviteOnly)).toEqual([false, false, true]);
  });

  test("defaults each Roadster checkout to a 50% deposit", () => {
    expect(roadsterOffers.map((offer) => offer.price / 2)).toEqual([125_000, 250_000, 500_000]);
    expect(roadsterOffers.map((offer) => roadsterCheckoutSearch(offer.slug).down)).toEqual([125_000, 250_000, 500_000]);
  });

  test("accepts only the catalog-based 50% deposit or full amount", () => {
    for (const offer of roadsterOffers) {
      expect(isRoadsterPaymentAmount(offer.slug, offer.price / 2)).toBe(true);
      expect(isRoadsterPaymentAmount(offer.slug, offer.price)).toBe(true);
      expect(isRoadsterPaymentAmount(offer.slug, 10_000)).toBe(false);
      expect(isRoadsterPaymentAmount(offer.slug, offer.price / 2 + 1)).toBe(false);
    }
  });
});