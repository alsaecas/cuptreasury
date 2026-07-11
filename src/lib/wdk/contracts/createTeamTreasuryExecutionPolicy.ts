import type { Policy, PolicyContext } from "@tetherto/wdk";
import { getAddress } from "ethers";

import { isPaymentIntentExpired, type PaymentIntent } from "@/domain/treasury";
import type { PaymentIntentConsumptionStore } from "@/lib/wdk/guarded";
import type { EvmTransaction } from "@/lib/wdk/guarded";

import type { TeamTreasuryExecutionPlan } from "./types";

function same(left: unknown, right: unknown): boolean {
  try { return BigInt(left as string | number | bigint) === BigInt(right as string | number | bigint); } catch { return left === right; }
}

function address(left: unknown, right: string): boolean {
  try { return typeof left === "string" && getAddress(left) === getAddress(right); } catch { return false; }
}

function exact(transaction: EvmTransaction | null, plan: TeamTreasuryExecutionPlan): boolean {
  if (!transaction) return false;
  const expected = plan.transaction;
  return address(transaction.to, plan.treasuryContract) && same(transaction.value, 0n) && transaction.data === plan.calldata && same(transaction.chainId, plan.chainId) && same(transaction.nonce, expected.nonce) && same(transaction.gasLimit, expected.gasLimit) && same(transaction.gasPrice, expected.gasPrice) && same(transaction.maxFeePerGas, expected.maxFeePerGas) && same(transaction.maxPriorityFeePerGas, expected.maxPriorityFeePerGas) && same(transaction.type, expected.type);
}

export function createTeamTreasuryExecutionPolicy({
  intent,
  plan,
  walletId,
  accountIndex,
  consumptionStore,
}: {
  intent: PaymentIntent;
  plan: TeamTreasuryExecutionPlan;
  walletId: string;
  accountIndex: number;
  consumptionStore: PaymentIntentConsumptionStore;
}): Policy {
  const executable = () => intent.status === "authorized" && !isPaymentIntentExpired(intent);
  const accountMatches = async (context: PolicyContext) => address(await context.account.getAddress(), plan.executorAccount);
  return {
    id: "cup-treasury-team-treasury-execution-v1",
    name: "CupTreasury exact TeamTreasury execution",
    scope: "account", wallet: walletId, accounts: [accountIndex],
    rules: [
      { name: "deny-consumed-payment-intent", operation: "signTransaction", action: "DENY", reason: "PaymentIntent has already been consumed.", conditions: [async () => await consumptionStore.isConsumed(intent.id, intent.nonce)] },
      { name: "deny-unusable-intent-lifecycle", operation: "signTransaction", action: "DENY", reason: "PaymentIntent is not executable.", conditions: [() => !executable()] },
      { name: "allow-exact-team-treasury-execution", operation: "signTransaction", action: "ALLOW", reason: "Exact TeamTreasury executeRequest transaction matched.", conditions: [accountMatches, ({ params }) => exact(params as EvmTransaction | null, plan), executable, async () => !(await consumptionStore.isConsumed(intent.id, intent.nonce))] },
    ],
  };
}
