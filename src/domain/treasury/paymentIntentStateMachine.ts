import type { PaymentIntent, PaymentIntentStatus } from "./paymentIntent";

export class TreasuryDomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "TreasuryDomainError";
  }
}

const nonFinalStatuses: PaymentIntentStatus[] = [
  "draft",
  "awaiting-approvals",
  "authorized",
  "policy-denied",
  "policy-allowed",
  "quoted",
  "prepared",
  "signed",
  "submitted",
];

export const allowedPaymentIntentTransitions = new Map<
  PaymentIntentStatus,
  PaymentIntentStatus[]
>([
  ["draft", ["awaiting-approvals", "cancelled"]],
  ["awaiting-approvals", ["authorized", "policy-denied", "expired", "cancelled"]],
  ["authorized", ["policy-allowed", "policy-denied", "expired", "cancelled"]],
  ["policy-denied", ["cancelled"]],
  ["policy-allowed", ["quoted", "expired", "cancelled"]],
  ["quoted", ["prepared", "expired", "cancelled"]],
  ["prepared", ["signed", "expired", "cancelled"]],
  ["signed", ["consumed", "submitted", "expired", "cancelled"]],
  ["submitted", ["confirmed", "expired", "cancelled"]],
  ["confirmed", []],
  ["expired", []],
  ["cancelled", []],
  ["consumed", []],
]);

for (const status of nonFinalStatuses) {
  const transitions = allowedPaymentIntentTransitions.get(status) ?? [];
  if (!transitions.includes("cancelled")) {
    transitions.push("cancelled");
  }
}

export function canTransitionPaymentIntent(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus,
): boolean {
  return allowedPaymentIntentTransitions.get(from)?.includes(to) ?? false;
}

export function transitionPaymentIntent(
  intent: PaymentIntent,
  nextStatus: PaymentIntentStatus,
): PaymentIntent {
  if (!canTransitionPaymentIntent(intent.status, nextStatus)) {
    throw new TreasuryDomainError(
      `Invalid PaymentIntent transition from ${intent.status} to ${nextStatus}`,
      "invalid_payment_intent_transition",
      {
        intentId: intent.id,
        from: intent.status,
        to: nextStatus,
      },
    );
  }

  return {
    ...intent,
    status: nextStatus,
  };
}
