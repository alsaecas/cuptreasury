import { demoTreasuryState } from "@/data/demoTreasury";
import type { TreasuryState } from "@/types/treasury";

const STORAGE_KEY = "cup-treasury-demo-state-v1";

export function getFreshDemoTreasuryState(): TreasuryState {
  return JSON.parse(JSON.stringify(demoTreasuryState)) as TreasuryState;
}

export function loadTreasuryState(): TreasuryState {
  if (typeof window === "undefined") {
    return getFreshDemoTreasuryState();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return getFreshDemoTreasuryState();
    }

    const parsed = JSON.parse(stored) as TreasuryState;

    if (!parsed.team?.members || !parsed.requests || !parsed.wallet) {
      return getFreshDemoTreasuryState();
    }

    return parsed;
  } catch {
    return getFreshDemoTreasuryState();
  }
}

export function saveTreasuryState(state: TreasuryState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearTreasuryState(): TreasuryState {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return getFreshDemoTreasuryState();
}
