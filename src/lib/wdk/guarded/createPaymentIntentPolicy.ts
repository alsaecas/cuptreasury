import type { Policy, PolicyContext } from "@tetherto/wdk";
import { getAddress } from "ethers";

import {
  hashPaymentIntent,
  isPaymentIntentExpired,
  normalizeEvmAddress,
  systemClock,
  type Clock,
  type PaymentIntent,
} from "@/domain/treasury";

import { preparePaymentIntent } from "./preparePaymentIntent";
import {
  DEFAULT_WDK_POLICY_ID,
  type EvmTransaction,
} from "./types";
import type { PaymentIntentConsumptionStore } from "./paymentIntentConsumptionStore";

export interface CreatePaymentIntentPolicyInput {
  intent: PaymentIntent;
  walletId: string;
  accountIndex: number;
  policyId?: string;
  clock?: Clock;
  consumptionStore?: PaymentIntentConsumptionStore;
  expectedTransaction?: EvmTransaction;
}

const executableStatuses = new Set([
  "authorized",
  "policy-allowed",
  "quoted",
  "prepared",
]);

function bigintEquals(left: unknown, right: unknown): boolean {
  try {
    if (left === undefined || right === undefined) {
      return left === right;
    }

    if (
      !["bigint", "number", "string"].includes(typeof left) ||
      !["bigint", "number", "string"].includes(typeof right)
    ) {
      return false;
    }

    return BigInt(left as string | number | bigint) ===
      BigInt(right as string | number | bigint);
  } catch {
    return false;
  }
}

function addressEquals(left: unknown, right: string): boolean {
  if (typeof left !== "string") return false;

  try {
    return getAddress(left) === getAddress(right);
  } catch {
    return false;
  }
}

async function accountMatchesIntent(context: PolicyContext, intent: PaymentIntent) {
  const accountAddress = await context.account.getAddress();
  return normalizeEvmAddress(accountAddress) === normalizeEvmAddress(intent.treasuryAccount);
}

function lifecycleAllowsExecution(intent: PaymentIntent, now: Date): boolean {
  return executableStatuses.has(intent.status) && !isPaymentIntentExpired(intent, now);
}

async function intentHasNotBeenConsumed(
  intent: PaymentIntent,
  consumptionStore: PaymentIntentConsumptionStore | undefined,
): Promise<boolean> {
  if (!consumptionStore) return true;

  return !(await consumptionStore.isConsumed(intent.id, intent.nonce));
}

function transactionMatchesIntent(
  transaction: EvmTransaction | null,
  intent: PaymentIntent,
  expectedTransaction?: EvmTransaction,
): boolean {
  if (!transaction) return false;

  const prepared = expectedTransaction ?? preparePaymentIntent(intent).transaction;

  return (
    addressEquals(transaction.to, intent.tokenAddress) &&
    bigintEquals(transaction.value, BigInt(0)) &&
    transaction.data === prepared.data &&
    bigintEquals(transaction.chainId, intent.chainId) &&
    addressEquals(prepared.to, intent.tokenAddress) &&
    bigintEquals(prepared.value, BigInt(0)) &&
    transaction.data === prepared.data &&
    exactTransactionFieldEquals(transaction, prepared, "chainId") &&
    exactTransactionFieldEquals(transaction, prepared, "nonce") &&
    exactTransactionFieldEquals(transaction, prepared, "gasLimit") &&
    exactTransactionFieldEquals(transaction, prepared, "gasPrice") &&
    exactTransactionFieldEquals(transaction, prepared, "maxFeePerGas") &&
    exactTransactionFieldEquals(transaction, prepared, "maxPriorityFeePerGas") &&
    exactTransactionFieldEquals(transaction, prepared, "type")
  );
}

function exactTransactionFieldEquals(
  transaction: EvmTransaction,
  expected: EvmTransaction,
  field: keyof EvmTransaction,
): boolean {
  if (field === "to" || field === "data") {
    return transaction[field] === expected[field];
  }

  return bigintEquals(transaction[field], expected[field]);
}

export function createPaymentIntentPolicy(
  input: CreatePaymentIntentPolicyInput,
): Policy {
  const clock = input.clock ?? systemClock;
  const intentHash = hashPaymentIntent(input.intent);

  return {
    id: input.policyId ?? DEFAULT_WDK_POLICY_ID,
    name: "CupTreasury exact PaymentIntent capability",
    scope: "account",
    wallet: input.walletId,
    accounts: [input.accountIndex],
    rules: [
      {
        name: "deny-consumed-payment-intent",
        operation: "signTransaction",
        action: "DENY",
        reason: "PaymentIntent has already been consumed.",
        conditions: [
          async () =>
            !(await intentHasNotBeenConsumed(input.intent, input.consumptionStore)),
        ],
      },
      {
        name: "deny-unusable-intent-lifecycle",
        operation: "signTransaction",
        action: "DENY",
        reason: "PaymentIntent is not in an executable lifecycle state.",
        conditions: [() => !lifecycleAllowsExecution(input.intent, clock.now())],
      },
      {
        name: "allow-exact-payment-intent-signature",
        operation: "signTransaction",
        action: "ALLOW",
        reason: "Exact PaymentIntent transaction matched.",
        conditions: [
          (context) => accountMatchesIntent(context, input.intent),
          ({ params }) =>
            transactionMatchesIntent(
              params as EvmTransaction | null,
              input.intent,
              input.expectedTransaction,
            ),
          () => hashPaymentIntent(input.intent) === intentHash,
          () => lifecycleAllowsExecution(input.intent, clock.now()),
          () => intentHasNotBeenConsumed(input.intent, input.consumptionStore),
        ],
      },
    ],
  };
}
