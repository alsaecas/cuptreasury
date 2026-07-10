import type { PaymentIntent } from "@/domain/treasury";

import { preparePaymentIntent } from "./preparePaymentIntent";
import type {
  PreparedPaymentIntentTransaction,
  QuotePaymentIntentResult,
  WdkEvmAccount,
} from "./types";

export async function quotePaymentIntent(
  account: WdkEvmAccount,
  prepared: PreparedPaymentIntentTransaction,
): Promise<QuotePaymentIntentResult> {
  const quote = await account.quoteSendTransaction(prepared.transaction);

  return {
    intentId: prepared.intentId,
    estimatedFeeAtomic: quote.fee.toString(),
  };
}

export async function quotePaymentIntentDirect(
  account: WdkEvmAccount,
  intent: PaymentIntent,
): Promise<QuotePaymentIntentResult> {
  return quotePaymentIntent(account, preparePaymentIntent(intent));
}
