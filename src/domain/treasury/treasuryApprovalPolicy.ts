import { parseUnits } from "ethers";

import { systemClock, type Clock } from "./clock";
import {
  PAYMENT_INTENT_CAPABILITY_VERSION,
  assertDisplayAmountMatchesAtomic,
  assertValidIntentExpiry,
  hashMemo,
  isPaymentIntentExpired,
  normalizeEvmAddress,
  parseAtomicAmount,
  validateTokenDecimals,
  type CanonicalApprovalReference,
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
import {
  valenciaHackersMembership,
  type TreasuryMembershipProvider,
} from "./treasuryMembership";

export const TREASURY_APPROVAL_POLICY_ID = "cup-treasury-domain-approval-v1";

export interface TreasuryApprovalPolicyOptions {
  clock?: Clock;
  membershipProvider?: TreasuryMembershipProvider;
}

const finalOrBlockedRequestStatuses: TreasuryPaymentRequestStatus[] = [
  "rejected",
  "cancelled",
  "paid",
  "expired",
  "consumed",
];

export function requiredApprovalsForAmountAtomic(
  amountAtomic: string,
  tokenDecimals: number,
): number {
  validateTokenDecimals(tokenDecimals);
  const amount = parseAtomicAmount(amountAtomic);
  const thresholdAtomic = parseUnits("100", tokenDecimals);

  return amount > thresholdAtomic ? 2 : 1;
}

export function roleCanApprove(
  role: TreasuryMemberRole,
): role is Extract<TreasuryMemberRole, "Captain" | "Treasurer"> {
  return role === "Captain" || role === "Treasurer";
}

function coerceOptions(
  optionsOrDate?: TreasuryApprovalPolicyOptions | Date | Clock,
): Required<TreasuryApprovalPolicyOptions> {
  if (optionsOrDate instanceof Date) {
    return {
      clock: { now: () => new Date(optionsOrDate.getTime()) },
      membershipProvider: valenciaHackersMembership,
    };
  }

  if (optionsOrDate && "now" in optionsOrDate) {
    return {
      clock: optionsOrDate,
      membershipProvider: valenciaHackersMembership,
    };
  }

  return {
    clock: optionsOrDate?.clock ?? systemClock,
    membershipProvider:
      optionsOrDate?.membershipProvider ?? valenciaHackersMembership,
  };
}

function requestHasNotExpired(
  request: TreasuryPaymentRequest,
  now: Date,
): boolean {
  if (request.expiresAt === undefined) return true;

  const expiresAt = Date.parse(request.expiresAt);

  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

function getUniqueTrustedApprovals(
  approvals: TreasuryApproval[],
  membershipProvider: TreasuryMembershipProvider,
) {
  const validApprovals: CanonicalApprovalReference[] = [];
  const seenApprovalIds = new Set<string>();
  const seenMembers = new Set<string>();
  const seenAddresses = new Set<string>();
  const duplicateApprovalIds: string[] = [];
  const duplicateMembers: string[] = [];
  const duplicateAddresses: string[] = [];
  const unknownMembers: string[] = [];
  const inactiveMembers: string[] = [];
  const addressMismatches: string[] = [];
  const invalidRoles: string[] = [];
  const claimedRoleMismatches: string[] = [];

  for (const approval of approvals) {
    if (seenApprovalIds.has(approval.id)) {
      duplicateApprovalIds.push(approval.id);
      continue;
    }

    seenApprovalIds.add(approval.id);

    const member = membershipProvider.getMemberById(approval.memberId);

    if (!member) {
      unknownMembers.push(approval.memberId);
      continue;
    }

    let approvalAddress: string;

    try {
      approvalAddress = normalizeEvmAddress(approval.memberAddress);
    } catch {
      addressMismatches.push(`${approval.memberId}:invalid-address`);
      continue;
    }

    const registeredAddress = normalizeEvmAddress(member.address);
    const memberByAddress = membershipProvider.getMemberByAddress(approvalAddress);

    if (
      approvalAddress !== registeredAddress ||
      memberByAddress?.memberId !== member.memberId
    ) {
      addressMismatches.push(approval.memberId);
      continue;
    }

    if (!member.active) {
      inactiveMembers.push(member.memberId);
      continue;
    }

    if (!roleCanApprove(member.role)) {
      invalidRoles.push(`${member.name}:${member.role}`);
      continue;
    }

    if (approval.role !== member.role) {
      claimedRoleMismatches.push(
        `${member.memberId}:claimed-${approval.role}-registered-${member.role}`,
      );
      continue;
    }

    const addressKey = registeredAddress.toLowerCase();

    if (seenMembers.has(member.memberId)) {
      duplicateMembers.push(member.memberId);
      continue;
    }

    if (seenAddresses.has(addressKey)) {
      duplicateAddresses.push(addressKey);
      continue;
    }

    seenMembers.add(member.memberId);
    seenAddresses.add(addressKey);
    validApprovals.push({
      approvalId: approval.id,
      memberId: member.memberId,
      address: registeredAddress,
      role: member.role,
    });
  }

  return {
    validApprovals,
    duplicateApprovalIds,
    duplicateMembers,
    duplicateAddresses,
    unknownMembers,
    inactiveMembers,
    addressMismatches,
    invalidRoles,
    claimedRoleMismatches,
  };
}

export function evaluateTreasuryApprovalPolicy(
  request: TreasuryPaymentRequest,
  optionsOrDate?: TreasuryApprovalPolicyOptions | Date | Clock,
): RequestPolicyDecisionReceipt {
  const { clock, membershipProvider } = coerceOptions(optionsOrDate);
  const now = clock.now();
  const required = requiredApprovalsForAmountAtomic(
    request.amountAtomic,
    request.tokenDecimals,
  );
  assertDisplayAmountMatchesAtomic(
    request.displayAmount,
    request.amountAtomic,
    request.tokenDecimals,
  );

  const trace: PolicyDecisionTraceEntry[] = [];

  const requestOpen = !finalOrBlockedRequestStatuses.includes(request.status);
  trace.push({
    rule: "request-open",
    passed: requestOpen,
    detail: requestOpen
      ? `Request status ${request.status} can be evaluated.`
      : `Request status ${request.status} cannot create a usable PaymentIntent.`,
  });

  const notExpired = requestHasNotExpired(request, now);
  trace.push({
    rule: "request-not-expired",
    passed: notExpired,
    detail: notExpired
      ? "Request has not expired."
      : `Request expired at ${request.expiresAt}.`,
  });

  const {
    validApprovals,
    duplicateApprovalIds,
    duplicateMembers,
    duplicateAddresses,
    unknownMembers,
    inactiveMembers,
    addressMismatches,
    invalidRoles,
    claimedRoleMismatches,
  } = getUniqueTrustedApprovals(request.approvals, membershipProvider);

  const allMembersKnown = unknownMembers.length === 0;
  trace.push({
    rule: "known-approver-members",
    passed: allMembersKnown,
    detail: allMembersKnown
      ? "All approvals map to trusted treasury members."
      : `Unknown approver members: ${unknownMembers.join(", ")}.`,
  });

  const allMembersActive = inactiveMembers.length === 0;
  trace.push({
    rule: "active-approver-members",
    passed: allMembersActive,
    detail: allMembersActive
      ? "All trusted approvers are active."
      : `Inactive approver members: ${inactiveMembers.join(", ")}.`,
  });

  const addressesMatch = addressMismatches.length === 0;
  trace.push({
    rule: "registered-approver-addresses",
    passed: addressesMatch,
    detail: addressesMatch
      ? "Approval addresses match the trusted roster."
      : `Address mismatches: ${addressMismatches.join(", ")}.`,
  });

  const rolesValid = invalidRoles.length === 0;
  trace.push({
    rule: "approver-roster-roles",
    passed: rolesValid,
    detail: rolesValid
      ? "Trusted approvers have Captain or Treasurer roles."
      : `Invalid trusted approver roles: ${invalidRoles.join(", ")}.`,
  });

  const claimedRolesMatch = claimedRoleMismatches.length === 0;
  trace.push({
    rule: "claimed-role-matches-roster",
    passed: claimedRolesMatch,
    detail: claimedRolesMatch
      ? "Approval role claims match the trusted roster."
      : `Role claim mismatches: ${claimedRoleMismatches.join(", ")}.`,
  });

  const noDuplicateApprovalIds = duplicateApprovalIds.length === 0;
  trace.push({
    rule: "unique-approval-ids",
    passed: noDuplicateApprovalIds,
    detail: noDuplicateApprovalIds
      ? "No approval id was reused."
      : `Duplicate approval ids: ${duplicateApprovalIds.join(", ")}.`,
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
      "CupTreasury preserves the MVP product rule: a requester may approve if the trusted roster marks them Captain or Treasurer.",
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
  optionsOrDate?: TreasuryApprovalPolicyOptions | Date | Clock,
): PaymentIntent {
  const { clock, membershipProvider } = coerceOptions(optionsOrDate);
  const now = clock.now();
  const createdAt = input.createdAt ?? now.toISOString();
  const decision = evaluateTreasuryApprovalPolicy(input.request, {
    clock,
    membershipProvider,
  });
  const blockedStatus = finalOrBlockedRequestStatuses.includes(
    input.request.status,
  );

  if (blockedStatus) {
    throw new Error(
      `Request ${input.request.id} with status ${input.request.status} cannot create a usable PaymentIntent.`,
    );
  }

  assertValidIntentExpiry({
    createdAt,
    expiresAt: input.expiresAt,
    requestExpiresAt: input.request.expiresAt,
  });

  const validApprovals = getUniqueTrustedApprovals(
    input.request.approvals,
    membershipProvider,
  ).validApprovals;
  const requiredApprovals = requiredApprovalsForAmountAtomic(
    input.request.amountAtomic,
    input.request.tokenDecimals,
  );

  return {
    capabilityVersion: PAYMENT_INTENT_CAPABILITY_VERSION,
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
    requiredApprovals,
    approvalReferences: validApprovals,
    approvalIds: validApprovals.map((approval) => approval.approvalId),
    approverAddresses: validApprovals.map((approval) => approval.address),
    createdAt,
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
  optionsOrDate?: { clock?: Clock } | Date | Clock,
): PaymentIntent {
  const clock =
    optionsOrDate instanceof Date
      ? { now: () => new Date(optionsOrDate.getTime()) }
      : optionsOrDate && "now" in optionsOrDate
        ? optionsOrDate
      : (optionsOrDate?.clock ?? systemClock);

  if (!isPaymentIntentExpired(intent, clock.now())) {
    return intent;
  }

  if (["expired", "cancelled", "consumed", "confirmed"].includes(intent.status)) {
    return intent;
  }

  return transitionPaymentIntent(intent, "expired");
}

export function consumePaymentIntent(intent: PaymentIntent): PaymentIntent {
  return transitionPaymentIntent(intent, "consumed");
}
