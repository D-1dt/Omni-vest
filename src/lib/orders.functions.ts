/** Client-side demo transaction handlers. All records stay in this browser. */
import { getEntity, getVehicle } from "@/lib/data";
import { listInvestments, listVehicleOrders, saveInvestment, saveVehicleOrder } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isRoadsterPaymentAmount, isRoadsterSlug } from "@/lib/roadster-catalog";

type Receipt = { base64: string; name: string } | undefined;
function validateReceipt(receipt: Receipt) {
  if (!receipt) return;
  if (receipt.name.length > 255) throw new Error("Receipt filename is too long.");
  if (receipt.base64.length > 2_000_000) throw new Error("Receipt is too large for browser demo storage. Please use an image or PDF under 1.5 MB.");
  if (!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/i.test(receipt.base64)) throw new Error("Please upload a JPG, PNG, WebP, or PDF receipt.");
  const payload = receipt.base64.split(",")[1] ?? "";
  if (!payload || !/^[A-Za-z0-9+/]+=*$/.test(payload)) throw new Error("The selected receipt file could not be read correctly.");
}
function validateTxHash(value?: string) {
  const hash = value?.trim() ?? "";
  if (hash && !/^[A-Za-z0-9:_\-]{16,128}$/.test(hash)) throw new Error("Transaction reference must be 16–128 letters, digits, : _ or -");
}
const SYMBOLS: Record<string, string> = { tesla: "TSLA", spacex: "SPCX", "paypal-mafia": "PYPL" };

export async function createInvestment({ data }: { data: { entitySlug: string; planName: string; txHash?: string; receipt?: Receipt; idempotencyKey: string } }) {
  const entity = getEntity(data.entitySlug);
  const plan = entity?.plans.find((item) => item.name === data.planName);
  if (!entity || !plan) throw new Error("Unknown investment option");
  validateReceipt(data.receipt);
  validateTxHash(data.txHash);
  const existing = await listInvestments(getSession().userId);
  const duplicate = existing.find((item) => item.idempotencyKey === data.idempotencyKey);
  if (duplicate) return { id: duplicate.id, duplicate: true };
  const now = Date.now();
  const id = crypto.randomUUID();
  saveInvestment({
    id, userId: getSession().userId, kind: "investment", label: `${entity.name} · ${plan.name}`,
    entitySlug: entity.slug, entityName: entity.name, tier: plan.name, amount: plan.minimum,
    assetSymbol: SYMBOLS[entity.slug], createdAt: now, activationTime: now + 2 * 60 * 60 * 1000,
    receiptName: data.receipt?.name, receiptDataUrl: data.receipt?.base64, txHash: data.txHash?.trim() || undefined,
    idempotencyKey: data.idempotencyKey,
  });
  return { id, duplicate: false };
}

export async function createVehicleOrder({ data }: { data: { slug: string; color: number; wheel: number; interior: number; down: number; term: 36|48|60|72|84; apr: number; txHash?: string; receipt?: Receipt; idempotencyKey: string } }) {
  if (data.slug.startsWith("roadster-") && !isRoadsterSlug(data.slug)) throw new Error("Unknown vehicle configuration");
  const vehicle = getVehicle(data.slug);
  const color = vehicle?.colors[data.color];
  const wheel = vehicle?.wheels[data.wheel];
  const interior = vehicle?.interiors[data.interior];
  if (!vehicle || !color || !wheel || !interior) throw new Error("Unknown vehicle configuration");
  const total = vehicle.basePrice + color.price + wheel.price + interior.price;
  if (!Number.isFinite(data.down) || data.down < 0 || data.down > total) throw new Error("Invalid down payment");
  if (isRoadsterSlug(data.slug) && !isRoadsterPaymentAmount(data.slug, data.down)) throw new Error("Roadster payment must be a 50% deposit or full payment");
  validateReceipt(data.receipt);
  validateTxHash(data.txHash);
  if (![36, 48, 60, 72, 84].includes(data.term)) throw new Error("Invalid payment term");
  if (!Number.isFinite(data.apr) || data.apr < 2 || data.apr > 12) throw new Error("Invalid APR");
  const existingOrders = await listVehicleOrders(getSession().userId);
  const duplicate = existingOrders.find((item) => item.idempotencyKey === data.idempotencyKey);
  if (duplicate) return { id: duplicate.id, duplicate: true };
  const now = Date.now();
  const id = crypto.randomUUID();
  saveVehicleOrder({
    id, userId: getSession().userId, slug: vehicle.slug, vehicleName: vehicle.name, colorName: color.name,
    colorIndex: data.color, wheelIndex: data.wheel, interiorIndex: data.interior,
    down: Math.round(data.down), total, term: data.term, apr: Math.round(data.apr * 4) / 4,
    createdAt: now, verificationTime: now + 2 * 60 * 60 * 1000, status: "verifying",
    receiptName: data.receipt?.name, receiptDataUrl: data.receipt?.base64, txHash: data.txHash?.trim() || undefined,
    idempotencyKey: data.idempotencyKey,
  });
  return { id, duplicate: false };
}
