import type { ExecutionReceipt, PaymentIntent } from "@/domain/treasury";

import { evaluatePaymentIntentWithWdk } from "./evaluatePaymentIntentWithWdk";
import { preparePaymentIntent } from "./preparePaymentIntent";
import { quotePaymentIntent } from "./quotePaymentIntent";
import { signPaymentIntent } from "./signPaymentIntent";
import type {
  ExecutePaymentIntentInput,
  ExecutePaymentIntentResult,
} from "./types";

export async function executePaymentIntent({
  account,
  intent,
  network,
  sign = true,
  timestamp = new Date().toISOString(),
}: ExecutePaymentIntentInput): Promise<ExecutePaymentIntentResult> {
  const prepared = preparePaymentIntent(intent);
  const policyReceipt = await evaluatePaymentIntentWithWdk({
    account,
    intent,
    transaction: prepared.transaction,
    evaluatedAt: timestamp,
  });

  if (policyReceipt.decision === "DENY") {
    const executionReceipt = buildExecutionReceipt({
      intent,
      network,
      walletAddress: await account.getAddress(),
      prepared: false,
      signed: false,
      timestamp,
    });

    return {
      policyReceipt,
      prepared,
      executionReceipt,
    };
  }

  const quote = await quotePaymentIntent(account, prepared);
  const signing = sign
    ? await signPaymentIntent(account, intent, prepared)
    : undefined;

  const executionReceipt = buildExecutionReceipt({
    intent,
    network,
    walletAddress: await account.getAddress(),
    estimatedFeeAtomic: quote.estimatedFeeAtomic,
    calldataHash: prepared.calldataHash,
    prepared: true,
    signed: Boolean(signing?.signed),
    timestamp,
  });

  return {
    policyReceipt,
    prepared,
    quote,
    signing,
    executionReceipt,
  };
}

function buildExecutionReceipt({
  intent,
  network,
  walletAddress,
  estimatedFeeAtomic,
  calldataHash,
  prepared,
  signed,
  timestamp,
}: {
  intent: PaymentIntent;
  network: string;
  walletAddress: string;
  estimatedFeeAtomic?: string;
  calldataHash?: string;
  prepared: boolean;
  signed: boolean;
  timestamp: string;
}): ExecutionReceipt {
  return {
    intentId: intent.id,
    requestId: intent.requestId,
    network,
    chainId: intent.chainId,
    walletAddress,
    recipient: intent.recipient,
    tokenAddress: intent.tokenAddress,
    tokenSymbol: intent.tokenSymbol,
    amountAtomic: intent.amountAtomic,
    estimatedFeeAtomic,
    prepared,
    signed,
    broadcast: false,
    calldataHash,
    timestamp,
  };
}
