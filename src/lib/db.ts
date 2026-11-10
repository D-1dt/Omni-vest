/** Browser-only persistence for the public demonstration build. */
const STORAGE_KEY = "omni-musk-demo-v1";

type DemoStore = { investments: PendingTransaction[]; vehicleOrders: VehicleOrder[] };
function emptyStore(): DemoStore { return { investments: [], vehicleOrders: [] }; }
function readStore(): DemoStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    return {
      investments: Array.isArray(parsed.investments) ? parsed.investments : [],
      vehicleOrders: Array.isArray(parsed.vehicleOrders) ? parsed.vehicleOrders : [],
    };
  } catch (error) {
    console.warn("Could not read Omni-Musk demo data; starting with an empty demo store.", error);
    return emptyStore();
  }
}
function writeStore(store: DemoStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("omni-musk-demo-storage"));
  } catch {
    throw new Error("Browser storage is full. Remove some uploaded receipts or clear demo data and try again.");
  }
}
export function resetDemoData() { if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY); }

export type PendingTransaction = {
  id: string; userId: string; kind: "investment" | "vehicle"; label: string; entitySlug: string; entityName: string;
  tier?: string; amount: number; assetSymbol?: string; entryPrice?: number; createdAt: number; activationTime: number;
  receiptName?: string; receiptDataUrl?: string; txHash?: string; idempotencyKey?: string;
};
export async function listInvestments(userId: string): Promise<PendingTransaction[]> {
  return readStore().investments.filter((item) => item.userId === userId).sort((a,b) => b.createdAt-a.createdAt);
}
export function isActive(tx: PendingTransaction) { return Date.now() >= tx.activationTime; }

export type DeliveryDetails = { fullName: string; street: string; city: string; state: string; zip: string; phone: string };
export type VehicleOrderStatus = "verifying" | "action_required" | "processing_delivery";
export type VehicleOrder = {
  id: string; userId: string; slug: string; vehicleName: string; colorName: string; colorIndex: number; wheelIndex: number;
  interiorIndex: number; down: number; total: number; term: number; apr: number; createdAt: number; verificationTime: number;
  status: VehicleOrderStatus; delivery?: DeliveryDetails; receiptName?: string; receiptDataUrl?: string; txHash?: string; idempotencyKey?: string;
};
export async function listVehicleOrders(userId: string): Promise<VehicleOrder[]> {
  return readStore().vehicleOrders.filter((item) => item.userId === userId).sort((a,b) => b.createdAt-a.createdAt);
}
export async function getVehicleOrder(id: string): Promise<VehicleOrder | null> {
  return readStore().vehicleOrders.find((item) => item.id === id) ?? null;
}
export async function submitVehicleDelivery(id: string, delivery: DeliveryDetails): Promise<VehicleOrder> {
  const store = readStore();
  const index = store.vehicleOrders.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Demo order could not be found");
  const order = store.vehicleOrders[index];
  if (Date.now() < order.verificationTime) throw new Error("The simulated verification period has not finished yet");
  const updated: VehicleOrder = { ...order, delivery, status: "processing_delivery" };
  store.vehicleOrders[index] = updated;
  writeStore(store);
  return updated;
}
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected receipt"));
    reader.readAsDataURL(file);
  });
}
export function deriveVehicleOrderStatus(order: VehicleOrder): VehicleOrderStatus {
  if (order.status === "processing_delivery") return "processing_delivery";
  return Date.now() >= order.verificationTime ? "action_required" : "verifying";
}
export type PortfolioRow = { userId: string; totalBalance: number; totalInvested: number; totalReturns: number; returnPercentage: number; updatedAt: number };
export async function getPortfolio(userId: string): Promise<PortfolioRow | null> { void userId; return null; }

export function saveInvestment(item: PendingTransaction) {
  const store = readStore();
  if (!store.investments.some((existing) => existing.id === item.id)) store.investments.unshift(item);
  writeStore(store);
}
export function saveVehicleOrder(item: VehicleOrder) {
  const store = readStore();
  if (!store.vehicleOrders.some((existing) => existing.id === item.id)) store.vehicleOrders.unshift(item);
  writeStore(store);
}
