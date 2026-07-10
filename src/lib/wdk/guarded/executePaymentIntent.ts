import { systemClock, type ExecutionReceipt, type PaymentIntent } from "@/domain/treasury";

import { evaluatePaymentIntentWithWdk } from "./evaluatePaymentIntentWithWdk";
import {
  preparePaymentIntent,
  preparePaymentIntentWithProvider,
} from "./preparePaymentIntent";
import { quotePaymentIntent } from "./quotePaymentIntent";
import { signPaymentIntent } from "./signPaymentIntent";
import {
  PaymentIntentAlreadyConsumedError,
  runWithConsumptionLock,
} from "./paymentIntentConsumptionStore";
import type {
  ExecutePaymentIntentInput,
  ExecutePaymentIntentResult,
  PreparedPaymentIntentTransaction,
} from "./types";

export async function executePaymentIntent(
  input: ExecutePaymentIntentInput,
): Promise<ExecutePaymentIntentResult> {
  return runWithConsumptionLock(
    input.consumptionStore,
    input.intent.id,
    input.intent.nonce,
    () => executePaymentIntentLocked(input),
  );
}

async function executePaymentIntentLocked({
  account,
  intent,
  network,
  provider,
  clock = systemClock,
  consumptionStore,
  sign = true,
  timestamp,
  prepared: providedPrepared,
}: ExecutePaymentIntentInput): Promise<ExecutePaymentIntentResult> {
  const evaluatedAt = timestamp ?? clock.now().toISOString();
  const prepared =
    providedPrepared ??
    (provider
      ? await preparePaymentIntentWithProvider(intent, {
          providerUrl: provider,
          fromAddress: await account.getAddress(),
        })
      : preparePaymentIntent(intent));
  const alreadyConsumed =
    consumptionStore !== undefined
      ? await consumptionStore.isConsumed(intent.id, intent.nonce)
      : false;
  const policyReceipt = await evaluatePaymentIntentWithWdk({
    account,
    intent,
    transaction: prepared.transaction,
    evaluatedAt,
  });

  if (policyReceipt.decision === "DENY") {
    const executionReceipt = await buildExecutionReceipt({
      account,
      intent,
      network,
      prepared,
      preparedStatus: false,
      signed: false,
      consumed: alreadyConsumed,
      timestamp: evaluatedAt,
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
  let consumed = false;

  if (signing && consumptionStore) {
    try {
      await consumptionStore.consumeAtomically(intent.id, intent.nonce);
      consumed = true;
    } catch (error) {
      if (error instanceof PaymentIntentAlreadyConsumedError) {
        const replayReceipt = await evaluatePaymentIntentWithWdk({
          account,
          intent,
          transaction: prepared.transaction,
          evaluatedAt: clock.now().toISOString(),
        });

        const executionReceipt = await buildExecutionReceipt({
          account,
          intent,
          network,
          prepared,
          preparedStatus: true,
          signed: false,
          consumed: true,
          timestamp: evaluatedAt,
          estimatedFeeAtomic: quote.estimatedFeeAtomic,
        });

        return {
          policyReceipt: replayReceipt,
          prepared,
          quote,
          executionReceipt,
        };
      }

      throw error;
    }
  }

  const executionReceipt = await buildExecutionReceipt({
    account,
    intent,
    network,
    estimatedFeeAtomic: quote.estimatedFeeAtomic,
    prepared,
    preparedStatus: true,
    signed: Boolean(signing?.signed),
    consumed,
    timestamp: evaluatedAt,
  });

  return {
    policyReceipt,
    prepared,
    quote,
    signing,
    executionReceipt,
  };
}

async function buildExecutionReceipt({
  account,
  intent,
  network,
  estimatedFeeAtomic,
  prepared,
  preparedStatus,
  signed,
  consumed,
  timestamp,
}: {
  account: ExecutePaymentIntentInput["account"];
  intent: PaymentIntent;
  network: string;
  estimatedFeeAtomic?: string;
  prepared: PreparedPaymentIntentTransaction;
  preparedStatus: boolean;
  signed: boolean;
  consumed: boolean;
  timestamp: string;
}): Promise<ExecutionReceipt> {
  return {
    receiptId: `proof-receipt-${intent.id}-${prepared.unsignedTransactionHash.slice(2, 10)}`,
    intentId: intent.id,
    requestId: intent.requestId,
    network,
    chainId: intent.chainId,
    walletAddress: await account.getAddress(),
    recipient: intent.recipient,
    tokenAddress: intent.tokenAddress,
    tokenSymbol: intent.tokenSymbol,
    amountAtomic: intent.amountAtomic,
    estimatedFeeAtomic,
    prepared: preparedStatus,
    signed,
    consumed,
    broadcast: false,
    calldataHash: prepared.calldataHash,
    unsignedTransactionHash: prepared.unsignedTransactionHash,
    tokenContractStatus: prepared.tokenContract.status,
    timestamp,
  };
}
