import {
  hashMemo,
  isPaymentIntentExpired,
  normalizeEvmAddress,
  type CreatePaymentIntentInput,
  type PaymentIntent,
  type TreasuryApproval,
  type TreasuryMemberRole,
  type TreasuryPaymentRequest,
  type TreasuryPaymentRequestStatus,
} from "./paymentIntent";
import type {
  RequestPolicyDecisionReceipt,
  PolicyDecisionTraceEntry,
} from "./policyDecisionReceipt";
import { transitionPaymentIntent } from "./paymentIntentStateMachine";

export const TREASURY_APPROVAL_POLICY_ID = "cup-treasury-domain-approval-v1";

const finalOrBlockedRequestStatuses: TreasuryPaymentRequestStatus[] = [
  "rejected",
  "cancelled",
  "paid",
  "expired",
  "consumed",
];

export function requiredApprovalsForAmount(amountUnits: number): number {
  return amountUnits > 100 ? 2 : 1;
}

export function roleCanApprove(role: TreasuryMemberRole): boolean {
  return role === "Captain" || role === "Treasurer";
}

function getUniqueValidApprovals(approvals: TreasuryApproval[]) {
  const validApprovals: TreasuryApproval[] = [];
  const seenMembers = new Set<string>();
  const seenAddresses = new Set<string>();
  const duplicateMembers: string[] = [];
  const duplicateAddresses: string[] = [];
  const invalidRoles: string[] = [];

  for (const approval of approvals) {
    if (!roleCanApprove(approval.role)) {
      invalidRoles.push(`${approval.memberName}:${approval.role}`);
      continue;
    }

    const address = normalizeEvmAddress(approval.memberAddress).toLowerCase();

    if (seenMembers.has(approval.memberId)) {
      duplicateMembers.push(approval.memberId);
      continue;
    }

    if (seenAddresses.has(address)) {
      duplicateAddresses.push(address);
      continue;
    }

    seenMembers.add(approval.memberId);
    seenAddresses.add(address);
    validApprovals.push(approval);
  }

  return {
    validApprovals,
    duplicateMembers,
    duplicateAddresses,
    invalidRoles,
  };
}

export function evaluateTreasuryApprovalPolicy(
  request: TreasuryPaymentRequest,
  now = new Date(),
): RequestPolicyDecisionReceipt {
  const required = requiredApprovalsForAmount(request.amountUnits);
  const trace: PolicyDecisionTraceEntry[] = [];

  const requestOpen = !finalOrBlockedRequestStatuses.includes(request.status);
  trace.push({
    rule: "request-open",
    passed: requestOpen,
    detail: requestOpen
      ? `Request status ${request.status} can be evaluated.`
      : `Request status ${request.status} cannot create a usable PaymentIntent.`,
  });

  const notExpired =
    request.expiresAt === undefined || Date.parse(request.expiresAt) > now.getTime();
  trace.push({
    rule: "request-not-expired",
    passed: notExpired,
    detail: notExpired
      ? "Request has not expired."
      : `Request expired at ${request.expiresAt}.`,
  });

  const {
    validApprovals,
    duplicateMembers,
    duplicateAddresses,
    invalidRoles,
  } = getUniqueValidApprovals(request.approvals);

  const rolesValid = invalidRoles.length === 0;
  trace.push({
    rule: "approver-roles",
    passed: rolesValid,
    detail: rolesValid
      ? "All approvers have Captain or Treasurer roles."
      : `Invalid approver roles: ${invalidRoles.join(", ")}.`,
  });

  const noDuplicateMembers = duplicateMembers.length === 0;
  trace.push({
    rule: "unique-approver-members",
    passed: noDuplicateMembers,
    detail: noDuplicateMembers
      ? "No member approved twice."
      : `Duplicate member approvals: ${duplicateMembers.join(", ")}.`,
  });

  const noDuplicateAddresses = duplicateAddresses.length === 0;
  trace.push({
    rule: "unique-approver-addresses",
    passed: noDuplicateAddresses,
    detail: noDuplicateAddresses
      ? "No address approved twice."
      : `Duplicate approver addresses: ${duplicateAddresses.join(", ")}.`,
  });

  trace.push({
    rule: "requester-conflict-policy",
    passed: true,
    detail:
      "CupTreasury preserves the MVP product rule: a requester may approve if they are Captain or Treasurer.",
  });

  const enoughApprovals = validApprovals.length >= required;
  trace.push({
    rule: "approval-threshold",
    passed: enoughApprovals,
    detail: `${validApprovals.length}/${required} valid approvals collected.`,
  });

  const passed = trace.every((entry) => entry.passed);

  return {
    requestId: request.id,
    decision: passed ? "ALLOW" : "DENY",
    policyId: TREASURY_APPROVAL_POLICY_ID,
    reason: passed
      ? "Approval policy satisfied."
      : "Approval policy denied the request.",
    matchedRule: passed ? "approval-threshold" : trace.find((entry) => !entry.passed)?.rule,
    trace,
    evaluatedAt: now.toISOString(),
  };
}

export function createPaymentIntent(
  input: CreatePaymentIntentInput,
  now = new Date(),
): PaymentIntent {
  const decision = evaluateTreasuryApprovalPolicy(input.request, now);
  const blockedStatus = finalOrBlockedRequestStatuses.includes(input.request.status);

  if (blockedStatus) {
    throw new Error(
      `Request ${input.request.id} with status ${input.request.status} cannot create a usable PaymentIntent.`,
    );
  }

  const validApprovals = getUniqueValidApprovals(input.request.approvals)
    .validApprovals;

  return {
    id: input.intentId ?? `intent-${input.request.id}-${input.nonce}`,
    requestId: input.request.id,
    treasuryAccount: normalizeEvmAddress(input.treasuryAccount),
    chainId: input.chainId,
    tokenAddress: normalizeEvmAddress(input.tokenAddress),
    tokenSymbol: input.request.tokenSymbol,
    tokenDecimals: input.request.tokenDecimals,
    recipient: normalizeEvmAddress(input.recipient),
    amountAtomic: input.request.amountAtomic,
    memoHash: hashMemo(input.request.memo),
    requiredApprovals: requiredApprovalsForAmount(input.request.amountUnits),
    approvalIds: validApprovals.map((approval) => approval.id),
    approverAddresses: validApprovals.map((approval) =>
      normalizeEvmAddress(approval.memberAddress),
    ),
    createdAt: input.createdAt ?? now.toISOString(),
    expiresAt: input.expiresAt,
    nonce: input.nonce,
    status: decision.decision === "ALLOW" ? "authorized" : "awaiting-approvals",
  };
}

export function authorizePaymentIntent(
  intent: PaymentIntent,
  decision: RequestPolicyDecisionReceipt,
): PaymentIntent {
  if (decision.decision === "DENY") {
    return transitionPaymentIntent(intent, "policy-denied");
  }

  if (intent.status === "authorized") {
    return intent;
  }

  return transitionPaymentIntent(intent, "authorized");
}

export function expirePaymentIntent(
  intent: PaymentIntent,
  now = new Date(),
): PaymentIntent {
  if (!isPaymentIntentExpired(intent, now)) {
    return intent;
  }

  if (intent.status === "authorized") {
    return transitionPaymentIntent(intent, "expired");
  }

  if (intent.status === "awaiting-approvals") {
    return transitionPaymentIntent(intent, "expired");
  }

  return {
    ...intent,
    status: "expired",
  };
}

export function consumePaymentIntent(intent: PaymentIntent): PaymentIntent {
  return transitionPaymentIntent(intent, "consumed");
}
