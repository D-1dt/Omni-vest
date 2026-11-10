export const roadsterOffers = [
  {
    slug: "roadster-standard",
    option: "OPTION 01",
    name: "Standard Roadster",
    price: 250_000,
    description: "The standard all-electric Tesla Roadster configuration.",
    image: "standard",
    inviteOnly: false,
  },
  {
    slug: "roadster-thrust",
    option: "OPTION 02",
    name: "Roadster Thrust Package",
    price: 500_000,
    description:
      "Enhanced Roadster configuration featuring an advanced compressed-air propulsion system for extreme acceleration.",
    image: "thrust",
    inviteOnly: false,
  },
  {
    slug: "roadster-flying",
    option: "OPTION 03",
    name: "Roadster Flying Version",
    price: 1_000_000,
    description:
      "An experimental flying Roadster configuration featuring advanced propulsion technology.",
    image: "flying",
    inviteOnly: true,
  },
] as const;

export type RoadsterSlug = (typeof roadsterOffers)[number]["slug"];

export function isRoadsterSlug(value: unknown): value is RoadsterSlug {
  return typeof value === "string" && roadsterOffers.some((offer) => offer.slug === value);
}

export function isRoadsterPaymentAmount(slug: RoadsterSlug, amount: number) {
  const offer = roadsterOffers.find((item) => item.slug === slug);
  return offer !== undefined && (amount === offer.price / 2 || amount === offer.price);
}

export function roadsterCheckoutSearch(slug: RoadsterSlug) {
  const offer = roadsterOffers.find((item) => item.slug === slug);
  return {
    slug,
    color: 0,
    wheel: 0,
    interior: 0,
    down: offer ? offer.price / 2 : 0,
    term: 60,
    apr: 5.99,
  };
}