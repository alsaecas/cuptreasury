import { keccak256 } from "ethers";

import { evaluatePaymentIntentWithWdk } from "./evaluatePaymentIntentWithWdk";
import type {
  PreparedPaymentIntentTransaction,
  SignPaymentIntentResult,
  WdkEvmAccount,
} from "./types";
import type { PaymentIntent } from "@/domain/treasury";

export async function signPaymentIntent(
  account: WdkEvmAccount,
  intent: PaymentIntent,
  prepared: PreparedPaymentIntentTransaction,
): Promise<SignPaymentIntentResult> {
  const decision = await evaluatePaymentIntentWithWdk({
    account,
    intent,
    transaction: prepared.transaction,
  });

  if (decision.decision !== "ALLOW") {
    throw new Error(decision.reason);
  }

  const signedPayload = await account.signTransaction(prepared.transaction);

  return {
    intentId: prepared.intentId,
    signed: true,
    signedPayloadHash: keccak256(signedPayload),
    unsignedTransactionHash: prepared.unsignedTransactionHash,
    broadcast: false,
  };
}
