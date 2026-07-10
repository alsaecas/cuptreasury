import type { ExecutionReceipt } from "./executionReceipt";
import type { PaymentIntent, PaymentIntentStatus } from "./paymentIntent";
import type { PolicyDecisionReceipt } from "./policyDecisionReceipt";

export type TreasuryAuditEventType =
  | "RequestCreated"
  | "ApprovalGranted"
  | "ApprovalRejected"
  | "PaymentIntentCreated"
  | "PaymentIntentAuthorized"
  | "WdkPolicyDenied"
  | "WdkPolicyAllowed"
  | "TransactionQuoted"
  | "TransactionPrepared"
  | "TransactionSigned"
  | "TransactionSubmitted"
  | "TransactionConfirmed"
  | "IntentConsumed"
  | "IntentExpired"
  | "IntentCancelled";

export interface TreasuryAuditEvent {
  id: string;
  type: TreasuryAuditEventType;
  aggregateId: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
}

export interface PaymentIntentExecutionProjection {
  intentId: string;
  status: PaymentIntentStatus;
  requestId?: string;
  policyDecision?: "ALLOW" | "DENY";
  estimatedFeeAtomic?: string;
  prepared: boolean;
  signed: boolean;
  broadcast: boolean;
  transactionHash?: string;
  updatedAt: string;
}

export function createAuditEvent(
  event: Omit<TreasuryAuditEvent, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
  },
): TreasuryAuditEvent {
  const timestamp = event.timestamp ?? new Date().toISOString();

  return {
    id:
      event.id ??
      `audit-${event.type}-${event.aggregateId}-${Date.parse(timestamp).toString(36)}`,
    type: event.type,
    aggregateId: event.aggregateId,
    timestamp,
    metadata: event.metadata,
  };
}

export function paymentIntentCreatedEvent(
  intent: PaymentIntent,
): TreasuryAuditEvent {
  return createAuditEvent({
    type: "PaymentIntentCreated",
    aggregateId: intent.id,
    timestamp: intent.createdAt,
    metadata: {
      requestId: intent.requestId,
      status: intent.status,
      chainId: intent.chainId,
      tokenSymbol: intent.tokenSymbol,
      amountAtomic: intent.amountAtomic,
    },
  });
}

export function policyDecisionEvent(
  receipt: PolicyDecisionReceipt,
): TreasuryAuditEvent {
  return createAuditEvent({
    type: receipt.decision === "ALLOW" ? "WdkPolicyAllowed" : "WdkPolicyDenied",
    aggregateId: receipt.intentId,
    timestamp: receipt.evaluatedAt,
    metadata: {
      decision: receipt.decision,
      policyId: receipt.policyId,
      reason: receipt.reason,
      matchedRule: receipt.matchedRule,
    },
  });
}

export function executionReceiptEvents(
  receipt: ExecutionReceipt,
): TreasuryAuditEvent[] {
  const events: TreasuryAuditEvent[] = [];

  if (receipt.estimatedFeeAtomic !== undefined) {
    events.push(
      createAuditEvent({
        type: "TransactionQuoted",
        aggregateId: receipt.intentId,
        timestamp: receipt.timestamp,
        metadata: {
          requestId: receipt.requestId,
          estimatedFeeAtomic: receipt.estimatedFeeAtomic,
        },
      }),
    );
  }

  if (receipt.prepared) {
    events.push(
      createAuditEvent({
        type: "TransactionPrepared",
        aggregateId: receipt.intentId,
        timestamp: receipt.timestamp,
        metadata: {
          calldataHash: receipt.calldataHash,
        },
      }),
    );
  }

  if (receipt.signed) {
    events.push(
      createAuditEvent({
        type: "TransactionSigned",
        aggregateId: receipt.intentId,
        timestamp: receipt.timestamp,
        metadata: {
          broadcast: receipt.broadcast,
        },
      }),
    );
  }

  return events;
}

export function replayPaymentIntentAudit(
  events: TreasuryAuditEvent[],
  intentId: string,
): PaymentIntentExecutionProjection {
  const orderedEvents = [...events]
    .filter((event) => event.aggregateId === intentId)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));

  return orderedEvents.reduce<PaymentIntentExecutionProjection>(
    (projection, event) => {
      switch (event.type) {
        case "PaymentIntentCreated":
          return {
            ...projection,
            status: String(event.metadata.status) as PaymentIntentStatus,
            requestId: String(event.metadata.requestId),
            updatedAt: event.timestamp,
          };
        case "PaymentIntentAuthorized":
          return {
            ...projection,
            status: "authorized",
            updatedAt: event.timestamp,
          };
        case "WdkPolicyAllowed":
          return {
            ...projection,
            status: "policy-allowed",
            policyDecision: "ALLOW",
            updatedAt: event.timestamp,
          };
        case "WdkPolicyDenied":
          return {
            ...projection,
            status: "policy-denied",
            policyDecision: "DENY",
            updatedAt: event.timestamp,
          };
        case "TransactionQuoted":
          return {
            ...projection,
            status: "quoted",
            estimatedFeeAtomic: String(event.metadata.estimatedFeeAtomic),
            updatedAt: event.timestamp,
          };
        case "TransactionPrepared":
          return {
            ...projection,
            status: "prepared",
            prepared: true,
            updatedAt: event.timestamp,
          };
        case "TransactionSigned":
          return {
            ...projection,
            status: "signed",
            signed: true,
            broadcast: Boolean(event.metadata.broadcast),
            updatedAt: event.timestamp,
          };
        case "TransactionSubmitted":
          return {
            ...projection,
            status: "submitted",
            broadcast: true,
            transactionHash: String(event.metadata.transactionHash),
            updatedAt: event.timestamp,
          };
        case "TransactionConfirmed":
          return {
            ...projection,
            status: "confirmed",
            transactionHash: String(event.metadata.transactionHash),
            updatedAt: event.timestamp,
          };
        case "IntentConsumed":
          return {
            ...projection,
            status: "consumed",
            updatedAt: event.timestamp,
          };
        case "IntentExpired":
          return {
            ...projection,
            status: "expired",
            updatedAt: event.timestamp,
          };
        case "IntentCancelled":
          return {
            ...projection,
            status: "cancelled",
            updatedAt: event.timestamp,
          };
        default:
          return projection;
      }
    },
    {
      intentId,
      status: "draft",
      prepared: false,
      signed: false,
      broadcast: false,
      updatedAt: "",
    },
  );
}
