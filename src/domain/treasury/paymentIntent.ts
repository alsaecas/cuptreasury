import {
  AbiCoder,
  formatUnits,
  getAddress,
  keccak256,
  parseUnits,
  toUtf8Bytes,
} from "ethers";

import { TreasuryDomainError } from "./paymentIntentStateMachine";

export type TreasuryMemberRole = "Captain" | "Treasurer" | "Player" | "Fan";

export type TreasuryPaymentRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | "expired"
  | "consumed";

export interface TreasuryApproval {
  id: string;
  memberId: string;
  memberAddress: string;
  memberName: string;
  role: TreasuryMemberRole;
  createdAt: string;
}

export interface TreasuryPaymentRequest {
  id: string;
  title: string;
  amountAtomic: string;
  displayAmount?: string;
  tokenSymbol: string;
  tokenDecimals: number;
  requestedByMemberId: string;
  requestedByAddress?: string;
  status: TreasuryPaymentRequestStatus;
  approvals: TreasuryApproval[];
  memo: string;
  createdAt: string;
  expiresAt?: string;
}

export type PaymentIntentStatus =
  | "draft"
  | "awaiting-approvals"
  | "authorized"
  | "policy-denied"
  | "policy-allowed"
  | "quoted"
  | "prepared"
  | "signed"
  | "submitted"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "consumed";

export interface CanonicalApprovalReference {
  approvalId: string;
  memberId: string;
  address: string;
  role: Extract<TreasuryMemberRole, "Captain" | "Treasurer">;
}

export interface PaymentIntent {
  capabilityVersion: 1;
  id: string;
  requestId: string;
  treasuryAccount: string;
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  recipient: string;
  amountAtomic: string;
  memoHash: string;
  requiredApprovals: number;
  approvalReferences: CanonicalApprovalReference[];
  approvalIds: string[];
  approverAddresses: string[];
  createdAt: string;
  expiresAt: string;
  nonce: string;
  status: PaymentIntentStatus;
}

export interface PaymentIntentCapability {
  intent: PaymentIntent;
  hash: string;
}

export interface CreatePaymentIntentInput {
  request: TreasuryPaymentRequest;
  treasuryAccount: string;
  chainId: number;
  tokenAddress: string;
  recipient: string;
  expiresAt: string;
  nonce: string;
  createdAt?: string;
  intentId?: string;
}

const abiCoder = AbiCoder.defaultAbiCoder();
export const PAYMENT_INTENT_CAPABILITY_VERSION = 1;
export const MAX_SUPPORTED_TOKEN_DECIMALS = 18;

export function normalizeEvmAddress(address: string): string {
  return getAddress(address);
}

export function hashMemo(memo: string): string {
  return keccak256(toUtf8Bytes(memo));
}

export function validateTokenDecimals(tokenDecimals: number): void {
  if (
    !Number.isInteger(tokenDecimals) ||
    tokenDecimals < 0 ||
    tokenDecimals > MAX_SUPPORTED_TOKEN_DECIMALS
  ) {
    throw new TreasuryDomainError(
      `Unsupported token decimals: ${tokenDecimals}`,
      "unsupported_token_decimals",
      { tokenDecimals },
    );
  }
}

export function parseAtomicAmount(amountAtomic: string): bigint {
  if (!/^[0-9]+$/.test(amountAtomic)) {
    throw new TreasuryDomainError(
      `Invalid atomic token amount: ${amountAtomic}`,
      "invalid_atomic_amount",
      { amountAtomic },
    );
  }

  const amount = BigInt(amountAtomic);

  if (amount <= BigInt(0)) {
    throw new TreasuryDomainError(
      "Payment amount must be greater than zero.",
      "non_positive_atomic_amount",
      { amountAtomic },
    );
  }

  return amount;
}

export function assertDisplayAmountMatchesAtomic(
  displayAmount: string | undefined,
  amountAtomic: string,
  tokenDecimals: number,
): void {
  if (displayAmount === undefined) return;

  try {
    const parsedDisplayAmount = parseUnits(displayAmount, tokenDecimals);
    const parsedAtomicAmount = parseAtomicAmount(amountAtomic);

    if (parsedDisplayAmount === parsedAtomicAmount) return;
  } catch (error) {
    if (error instanceof TreasuryDomainError) throw error;
  }

  throw new TreasuryDomainError(
    "Display amount must be derived from the authoritative atomic amount.",
    "display_amount_mismatch",
    { displayAmount, amountAtomic, tokenDecimals },
  );
}

export function formatAtomicAmount(
  amountAtomic: string,
  tokenDecimals: number,
): string {
  validateTokenDecimals(tokenDecimals);
  parseAtomicAmount(amountAtomic);

  return formatUnits(amountAtomic, tokenDecimals);
}

function unixSeconds(timestamp: string): bigint {
  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    throw new TreasuryDomainError(
      `Invalid timestamp: ${timestamp}`,
      "invalid_timestamp",
      { timestamp },
    );
  }

  return BigInt(Math.floor(parsed / 1000));
}

export function assertValidIntentExpiry({
  createdAt,
  expiresAt,
  requestExpiresAt,
}: {
  createdAt: string;
  expiresAt: string;
  requestExpiresAt?: string;
}): void {
  const createdAtMs = Date.parse(createdAt);
  const expiresAtMs = Date.parse(expiresAt);

  if (!Number.isFinite(createdAtMs)) {
    throw new TreasuryDomainError(
      `Invalid intent creation timestamp: ${createdAt}`,
      "invalid_intent_created_at",
      { createdAt },
    );
  }

  if (!Number.isFinite(expiresAtMs)) {
    throw new TreasuryDomainError(
      `Invalid intent expiry timestamp: ${expiresAt}`,
      "invalid_intent_expires_at",
      { expiresAt },
    );
  }

  if (expiresAtMs <= createdAtMs) {
    throw new TreasuryDomainError(
      "PaymentIntent expiry must be after creation.",
      "intent_expiry_before_creation",
      { createdAt, expiresAt },
    );
  }

  if (requestExpiresAt === undefined) return;

  const requestExpiresAtMs = Date.parse(requestExpiresAt);

  if (!Number.isFinite(requestExpiresAtMs)) {
    throw new TreasuryDomainError(
      `Invalid request expiry timestamp: ${requestExpiresAt}`,
      "invalid_request_expires_at",
      { requestExpiresAt },
    );
  }

  if (expiresAtMs > requestExpiresAtMs) {
    throw new TreasuryDomainError(
      "PaymentIntent expiry cannot exceed the request expiry.",
      "intent_expiry_after_request_expiry",
      { expiresAt, requestExpiresAt },
    );
  }
}

function canonicalApprovalReferences(
  approvalReferences: CanonicalApprovalReference[],
): CanonicalApprovalReference[] {
  const seenApprovalIds = new Set<string>();
  const seenAddresses = new Set<string>();

  const canonical = approvalReferences.map((approval) => {
    const address = normalizeEvmAddress(approval.address);

    if (seenApprovalIds.has(approval.approvalId)) {
      throw new TreasuryDomainError(
        `Duplicate approval id: ${approval.approvalId}`,
        "duplicate_approval_id",
        { approvalId: approval.approvalId },
      );
    }

    if (seenAddresses.has(address.toLowerCase())) {
      throw new TreasuryDomainError(
        `Duplicate approval address: ${address}`,
        "duplicate_approval_address",
        { address },
      );
    }

    seenApprovalIds.add(approval.approvalId);
    seenAddresses.add(address.toLowerCase());

    return {
      approvalId: approval.approvalId,
      memberId: approval.memberId,
      address,
      role: approval.role,
    };
  });

  return canonical.sort((left, right) => {
    const leftKey = `${left.address.toLowerCase()}:${left.approvalId}:${left.memberId}`;
    const rightKey = `${right.address.toLowerCase()}:${right.approvalId}:${right.memberId}`;
    return leftKey.localeCompare(rightKey);
  });
}

export function canonicalPaymentIntentFields(intent: PaymentIntent) {
  validateTokenDecimals(intent.tokenDecimals);
  parseAtomicAmount(intent.amountAtomic);

  return {
    capabilityVersion: intent.capabilityVersion,
    id: intent.id,
    requestId: intent.requestId,
    treasuryAccount: normalizeEvmAddress(intent.treasuryAccount),
    chainId: intent.chainId,
    tokenAddress: normalizeEvmAddress(intent.tokenAddress),
    tokenDecimals: intent.tokenDecimals,
    recipient: normalizeEvmAddress(intent.recipient),
    amountAtomic: intent.amountAtomic,
    memoHash: intent.memoHash,
    requiredApprovals: intent.requiredApprovals,
    approvalReferences: canonicalApprovalReferences(intent.approvalReferences),
    createdAtUnix: unixSeconds(intent.createdAt),
    expiresAtUnix: unixSeconds(intent.expiresAt),
    nonce: intent.nonce,
  } as const;
}

export function hashPaymentIntent(intent: PaymentIntent): string {
  const fields = canonicalPaymentIntentFields(intent);
  const encoded = abiCoder.encode(
    [
      "uint8",
      "string",
      "string",
      "address",
      "uint256",
      "address",
      "uint8",
      "address",
      "uint256",
      "bytes32",
      "uint8",
      "tuple(string,string,address,string)[]",
      "uint64",
      "uint64",
      "string",
    ],
    [
      fields.capabilityVersion,
      fields.id,
      fields.requestId,
      fields.treasuryAccount,
      fields.chainId,
      fields.tokenAddress,
      fields.tokenDecimals,
      fields.recipient,
      BigInt(fields.amountAtomic),
      fields.memoHash,
      fields.requiredApprovals,
      fields.approvalReferences.map((approval) => [
        approval.approvalId,
        approval.memberId,
        approval.address,
        approval.role,
      ]),
      fields.createdAtUnix,
      fields.expiresAtUnix,
      fields.nonce,
    ],
  );

  return keccak256(encoded);
}

export function assertPaymentIntentHash(
  intent: PaymentIntent,
  expectedHash: string,
): void {
  const actualHash = hashPaymentIntent(intent);

  if (actualHash !== expectedHash) {
    throw new Error(
      `PaymentIntent hash mismatch: expected ${expectedHash}, received ${actualHash}`,
    );
  }
}

export function isPaymentIntentExpired(
  intent: Pick<PaymentIntent, "expiresAt">,
  now = new Date(),
): boolean {
  const expiresAt = Date.parse(intent.expiresAt);

  if (!Number.isFinite(expiresAt)) {
    throw new TreasuryDomainError(
      `Invalid intent expiry timestamp: ${intent.expiresAt}`,
      "invalid_intent_expires_at",
      { expiresAt: intent.expiresAt },
    );
  }

  return expiresAt <= now.getTime();
}

export function isPaymentIntentFinal(status: PaymentIntentStatus): boolean {
  return ["confirmed", "expired", "cancelled", "consumed"].includes(status);
}
