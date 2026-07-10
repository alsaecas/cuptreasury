import type { Policy, PolicyContext } from "@tetherto/wdk";
import { getAddress } from "ethers";

import {
  hashPaymentIntent,
  isPaymentIntentExpired,
  normalizeEvmAddress,
  type PaymentIntent,
} from "@/domain/treasury";

import { preparePaymentIntent } from "./preparePaymentIntent";
import { DEFAULT_WDK_POLICY_ID, type EvmTransaction } from "./types";

export interface CreatePaymentIntentPolicyInput {
  intent: PaymentIntent;
  walletId: string;
  accountIndex: number;
  policyId?: string;
  now?: Date;
}

const executableStatuses = new Set([
  "authorized",
  "policy-allowed",
  "quoted",
  "prepared",
  "signed",
]);

function bigintEquals(left: unknown, right: bigint): boolean {
  try {
    if (
      typeof left !== "bigint" &&
      typeof left !== "number" &&
      typeof left !== "string"
    ) {
      return false;
    }

    return BigInt(left) === right;
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

function transactionMatchesIntent(
  transaction: EvmTransaction | null,
  intent: PaymentIntent,
): boolean {
  if (!transaction) return false;

  const prepared = preparePaymentIntent(intent).transaction;

  return (
    addressEquals(transaction.to, intent.tokenAddress) &&
    bigintEquals(transaction.value, BigInt(0)) &&
    transaction.data === prepared.data &&
    String(transaction.chainId) === String(intent.chainId)
  );
}

export function createPaymentIntentPolicy(
  input: CreatePaymentIntentPolicyInput,
): Policy {
  const now = input.now ?? new Date();
  const intentHash = hashPaymentIntent(input.intent);

  return {
    id: input.policyId ?? DEFAULT_WDK_POLICY_ID,
    name: "CupTreasury exact PaymentIntent capability",
    scope: "account",
    wallet: input.walletId,
    accounts: [input.accountIndex],
    rules: [
      {
        name: "deny-unusable-intent-lifecycle",
        operation: "signTransaction",
        action: "DENY",
        reason: "PaymentIntent is not in an executable lifecycle state.",
        conditions: [() => !lifecycleAllowsExecution(input.intent, now)],
      },
      {
        name: "allow-exact-payment-intent-signature",
        operation: "signTransaction",
        action: "ALLOW",
        override_broader_scope: true,
        reason: "Exact PaymentIntent transaction matched.",
        conditions: [
          (context) => accountMatchesIntent(context, input.intent),
          ({ params }) =>
            transactionMatchesIntent(params as EvmTransaction | null, input.intent),
          () => hashPaymentIntent(input.intent) === intentHash,
          () => lifecycleAllowsExecution(input.intent, now),
        ],
      },
    ],
  };
}
