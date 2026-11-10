/** Local-only demo identity. No accounts, passwords, cookies, or remote auth. */
import { useSyncExternalStore } from "react";
import type { RoadsterSlug } from "@/lib/roadster-catalog";

export type Session = {
  userId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
};

const DEMO_SESSION: Session = {
  userId: "omni-musk-local-demo",
  email: "demo@omni-musk.local",
  fullName: "Demo Investor",
  emailVerified: true,
};

const subscribe = (_onStoreChange: () => void) => () => {};
export function getSession(): Session { return DEMO_SESSION; }
export function useSession(): { session: Session; loading: false } {
  return { session: useSyncExternalStore(subscribe, getSession, getSession), loading: false };
}
export async function signOut() { return; }
export async function signUp(_fullName: string, _email: string, _password: string, _roadster?: RoadsterSlug) {
  return { ok: true as const };
}
export async function signIn(_email: string, _password: string) { return { ok: true as const }; }
export async function requestPasswordReset(_email: string) { return { ok: true as const }; }
export async function resendVerificationEmail(_email: string) { return { ok: true as const }; }
