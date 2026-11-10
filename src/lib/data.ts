import modelSWhite from "@/assets/model-s-pearl-white.jpg";
import modelSBlack from "@/assets/model-s-solid-black.jpg";
import modelSSilver from "@/assets/model-s-midnight-silver.jpg";
import modelSBlue from "@/assets/model-s-deep-blue.jpg";
import modelSRed from "@/assets/model-s-ultra-red.jpg";

import model3White from "@/assets/model-3-pearl-white.jpg";
import model3Black from "@/assets/model-3-solid-black.jpg";
import model3Grey from "@/assets/model-3-stealth-grey.jpg";
import model3Blue from "@/assets/model-3-deep-blue.jpg";
import model3Red from "@/assets/model-3-ultra-red.jpg";

import modelXWhite from "@/assets/model-x-pearl-white.jpg";
import modelXBlack from "@/assets/model-x-solid-black.jpg";
import modelXSilver from "@/assets/model-x-midnight-silver.jpg";
import modelXBlue from "@/assets/model-x-deep-blue.jpg";

import modelYWhite from "@/assets/model-y-pearl-white.jpg";
import modelYBlack from "@/assets/model-y-solid-black.jpg";
import modelYGrey from "@/assets/model-y-stealth-grey.jpg";
import modelYBlue from "@/assets/model-y-deep-blue.jpg";

import cybertruckStainless from "@/assets/cybertruck-stainless.jpg";
import cybertruckBlack from "@/assets/cybertruck-wrap-black.jpg";
import roadsterStandard from "@/assets/roadster-front-silver.avif.asset.json";
import roadsterThrust from "@/assets/roadster-thrust-vapor.jpg.asset.json";
import roadsterFlying from "@/assets/roadster-rear-detail.jpg.asset.json";
import { roadsterOffers, type RoadsterSlug } from "@/lib/roadster-catalog";

export type VehicleColor = { name: string; hex: string; price: number; image: string };

export type Vehicle = {
  slug: string;
  name: string;
  tagline: string;
  basePrice: number;
  range: string;
  acceleration: string;
  topSpeed: string;
  image: string;
  colors: VehicleColor[];
  wheels: { name: string; price: number }[];
  interiors: { name: string; price: number }[];
};

export const vehicles: Vehicle[] = [
  {
    slug: "model-s",
    name: "Model S",
    tagline: "Plaid performance, redefined.",
    basePrice: 79990,
    range: "405 mi",
    acceleration: "1.99 s 0–60",
    topSpeed: "200 mph",
    image: modelSWhite,
    colors: [
      { name: "Pearl White", hex: "#F4F4F4", price: 0, image: modelSWhite },
      { name: "Solid Black", hex: "#0A0A0A", price: 1500, image: modelSBlack },
      { name: "Midnight Silver", hex: "#5A5E62", price: 1500, image: modelSSilver },
      { name: "Deep Blue", hex: "#1A2C56", price: 1500, image: modelSBlue },
      { name: "Ultra Red", hex: "#9B1C1C", price: 2500, image: modelSRed },
    ],
    wheels: [
      { name: '19" Tempest', price: 0 },
      { name: '21" Arachnid', price: 4500 },
    ],
    interiors: [
      { name: "All Black", price: 0 },
      { name: "Black & White", price: 2000 },
      { name: "Cream Premium", price: 2000 },
    ],
  },
  {
    slug: "model-3",
    name: "Model 3",
    tagline: "Electric, simplified.",
    basePrice: 38990,
    range: "341 mi",
    acceleration: "2.9 s 0–60",
    topSpeed: "162 mph",
    image: model3White,
    colors: [
      { name: "Pearl White", hex: "#F4F4F4", price: 0, image: model3White },
      { name: "Solid Black", hex: "#0A0A0A", price: 1000, image: model3Black },
      { name: "Stealth Grey", hex: "#3A3D40", price: 1000, image: model3Grey },
      { name: "Deep Blue", hex: "#1A2C56", price: 1000, image: model3Blue },
      { name: "Ultra Red", hex: "#9B1C1C", price: 2000, image: model3Red },
    ],
    wheels: [
      { name: '18" Photon', price: 0 },
      { name: '19" Nova', price: 1500 },
    ],
    interiors: [
      { name: "All Black", price: 0 },
      { name: "Black & White", price: 1000 },
    ],
  },
  {
    slug: "model-x",
    name: "Model X",
    tagline: "Falcon wings. Apex utility.",
    basePrice: 84990,
    range: "348 mi",
    acceleration: "2.5 s 0–60",
    topSpeed: "163 mph",
    image: modelXWhite,
    colors: [
      { name: "Pearl White", hex: "#F4F4F4", price: 0, image: modelXWhite },
      { name: "Solid Black", hex: "#0A0A0A", price: 1500, image: modelXBlack },
      { name: "Midnight Silver", hex: "#5A5E62", price: 1500, image: modelXSilver },
      { name: "Deep Blue", hex: "#1A2C56", price: 1500, image: modelXBlue },
    ],
    wheels: [
      { name: '20" Cyberstream', price: 0 },
      { name: '22" Turbine', price: 5500 },
    ],
    interiors: [
      { name: "All Black", price: 0 },
      { name: "Black & White", price: 2000 },
      { name: "Cream Premium", price: 2000 },
    ],
  },
  {
    slug: "model-y",
    name: "Model Y",
    tagline: "Built for everywhere.",
    basePrice: 44990,
    range: "330 mi",
    acceleration: "3.5 s 0–60",
    topSpeed: "155 mph",
    image: modelYWhite,
    colors: [
      { name: "Pearl White", hex: "#F4F4F4", price: 0, image: modelYWhite },
      { name: "Solid Black", hex: "#0A0A0A", price: 1000, image: modelYBlack },
      { name: "Stealth Grey", hex: "#3A3D40", price: 1000, image: modelYGrey },
      { name: "Deep Blue", hex: "#1A2C56", price: 1000, image: modelYBlue },
    ],
    wheels: [
      { name: '19" Gemini', price: 0 },
      { name: '20" Induction', price: 2000 },
    ],
    interiors: [
      { name: "All Black", price: 0 },
      { name: "Black & White", price: 1000 },
    ],
  },
  {
    slug: "cybertruck",
    name: "Cybertruck",
    tagline: "Built for any planet.",
    basePrice: 79990,
    range: "340 mi",
    acceleration: "2.6 s 0–60",
    topSpeed: "130 mph",
    image: cybertruckStainless,
    colors: [
      { name: "Stainless", hex: "#C7CBD1", price: 0, image: cybertruckStainless },
      { name: "Wrap Black", hex: "#0A0A0A", price: 6500, image: cybertruckBlack },
    ],
    wheels: [
      { name: '20" All-Terrain', price: 0 },
      { name: '20" Cyber', price: 3500 },
    ],
    interiors: [
      { name: "All Black", price: 0 },
      { name: "Cream Premium", price: 1500 },
    ],
  },
];

const roadsterImages: Record<RoadsterSlug, string> = {
  "roadster-standard": roadsterStandard.url,
  "roadster-thrust": roadsterThrust.url,
  "roadster-flying": roadsterFlying.url,
};

export const roadsterVehicles: Vehicle[] = roadsterOffers.map((offer) => ({
  slug: offer.slug,
  name: offer.name,
  tagline: offer.description,
  basePrice: offer.price,
  range: "",
  acceleration: "",
  topSpeed: "",
  image: roadsterImages[offer.slug],
  colors: [{ name: "Silver", hex: "#AEB3B8", price: 0, image: roadsterImages[offer.slug] }],
  wheels: [{ name: "Roadster specification", price: 0 }],
  interiors: [{ name: "Roadster specification", price: 0 }],
}));

export const getVehicle = (slug: string) =>
  vehicles.find((v) => v.slug === slug) ?? roadsterVehicles.find((v) => v.slug === slug);

export type InvestmentPlan = {
  name: string;
  minimum: number;
  roi: string;
  term: string;
  features: string[];
};

export type Entity = {
  slug: string;
  name: string;
  initials: string;
  sector: string;
  mission: string;
  founded: number;
  accent: string;
  plans: InvestmentPlan[];
};

const defaultPlans = (mins: [number, number, number, number]): InvestmentPlan[] => [
  { name: "Starter", minimum: mins[0], roi: "12% annual", term: "12 months", features: ["Quarterly dividends", "Investor newsletter", "Liquidation after term"] },
  { name: "Growth", minimum: mins[1], roi: "21% annual", term: "24 months", features: ["Monthly dividends", "Direct investor portal", "Early product access"] },
  { name: "Premium", minimum: mins[2], roi: "34% annual", term: "36 months", features: ["Weekly dividends", "Founder roundtable invite", "Equity conversion option"] },
  { name: "Institutional", minimum: mins[3], roi: "Custom", term: "48+ months", features: ["Dedicated relationship lead", "Bespoke ROI terms", "Board observer rights"] },
];

export const entities: Entity[] = [
  { slug: "tesla", name: "Tesla", initials: "T", sector: "Sustainable Energy & Mobility", mission: "Accelerate the world's transition to sustainable energy through electric vehicles, solar and storage.", founded: 2003, accent: "#E31937", plans: defaultPlans([500, 5000, 25000, 250000]) },
  { slug: "spacex", name: "SpaceX", initials: "SX", sector: "Aerospace & Launch", mission: "Make humanity multi-planetary through fully and rapidly reusable rockets.", founded: 2002, accent: "#005288", plans: defaultPlans([1000, 10000, 50000, 500000]) },
  { slug: "paypal-mafia", name: "X.com / PayPal Legacy", initials: "PP", sector: "FinTech Legacy", mission: "Legacy stake from the founding of X.com, which became PayPal.", founded: 1999, accent: "#003087", plans: defaultPlans([500, 5000, 25000, 250000]) },
];

/**
 * Display-only ventures. Still privately held, so they carry no ticker, no
 * live feed and no investment flow — they render as locked pre-IPO cards.
 */
export type PrivateEntity = {
  slug: string;
  name: string;
  initials: string;
  sector: string;
  mission: string;
  founded: number;
  accent: string;
  note: string;
};

export const privateEntities: PrivateEntity[] = [
  { slug: "x", name: "X", initials: "X", sector: "Social & Payments", mission: "The everything app — real-time conversation, creator payouts and embedded finance.", founded: 2023, accent: "#111827", note: "Privately held · no public listing" },
  { slug: "neuralink", name: "Neuralink", initials: "NL", sector: "Neurotechnology", mission: "High-bandwidth brain-machine interfaces to restore autonomy and extend human capability.", founded: 2016, accent: "#7C3AED", note: "Venture-stage · no public listing" },
  { slug: "boring-company", name: "The Boring Company", initials: "BC", sector: "Infrastructure & Tunnelling", mission: "Solve soul-destroying traffic with fast, low-cost tunnels and Loop transit networks.", founded: 2016, accent: "#0F766E", note: "Privately held · no public listing" },
];

export const getEntity = (slug: string) => entities.find((e) => e.slug === slug);


export const wallets = {
  BTC: "bc1q0c7mj32qyr0hj0m5a7qw6g9ygjrqyaf0mg7jr0",
  ETH: "0x795A25F8F03b3DBD4B431Fa48c549086E4985773",
  SOL: "H8ekCCpCq5X7ajt9VdvfTGtZjVaVHihfYNcP3iavrHJ8",
  XRP: "raftFpN3C2xHgpLokUmVbjMZLZqzFoHVz2",
};

export const cryptoRails = [
  { key: "BTC", label: "Bitcoin", ticker: "BTC" },
  { key: "ETH", label: "Ethereum", ticker: "ETH" },
  { key: "SOL", label: "Solana", ticker: "SOL" },
  { key: "XRP", label: "XRP", ticker: "XRP" },
] as const;
