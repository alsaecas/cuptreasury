import type { SimulationResult } from "@tetherto/wdk";

import type { PaymentIntent, PolicyDecisionReceipt } from "@/domain/treasury";

import { preparePaymentIntent } from "./preparePaymentIntent";
import type { EvmTransaction, WdkEvmAccount } from "./types";

function toReceiptTrace(result: SimulationResult) {
  return result.trace.map((entry) => ({
    rule: `wdk:${entry.policy_id}/${entry.rule_name}`,
    passed: entry.matched,
    detail: entry.error
      ? `WDK ${entry.scope} rule error: ${entry.error}`
      : `WDK ${entry.scope} rule ${entry.matched ? "matched" : "did not match"}.`,
  }));
}

function sentence(value: string | null): string {
  if (!value) return "default deny";
  return value.endsWith(".") ? value.slice(0, -1) : value;
}

export interface EvaluatePaymentIntentWithWdkInput {
  account: WdkEvmAccount;
  intent: PaymentIntent;
  transaction?: EvmTransaction;
  evaluatedAt?: string;
}

export async function evaluatePaymentIntentWithWdk({
  account,
  intent,
  transaction,
  evaluatedAt = new Date().toISOString(),
}: EvaluatePaymentIntentWithWdkInput): Promise<PolicyDecisionReceipt> {
  const prepared = transaction ?? preparePaymentIntent(intent).transaction;
  const result = await account.simulate.signTransaction(prepared);

  return {
    intentId: intent.id,
    decision: result.decision,
    policyId: result.policy_id ?? "wdk-default-deny",
    reason:
      result.decision === "ALLOW"
        ? "WDK native transaction policy allowed the exact PaymentIntent transaction."
        : `WDK native transaction policy denied the transaction: ${sentence(result.reason)}.`,
    matchedRule: result.matched_rule ?? undefined,
    trace: toReceiptTrace(result),
    evaluatedAt,
  };
}
