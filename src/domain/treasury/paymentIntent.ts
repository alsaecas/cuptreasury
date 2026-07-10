import { AbiCoder, getAddress, keccak256, toUtf8Bytes } from "ethers";

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
  amountUnits: number;
  amountAtomic: string;
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

export interface PaymentIntent {
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

export function normalizeEvmAddress(address: string): string {
  return getAddress(address);
}

export function hashMemo(memo: string): string {
  return keccak256(toUtf8Bytes(memo));
}

export function canonicalPaymentIntentFields(intent: PaymentIntent) {
  return {
    id: intent.id,
    requestId: intent.requestId,
    treasuryAccount: normalizeEvmAddress(intent.treasuryAccount),
    chainId: intent.chainId,
    tokenAddress: normalizeEvmAddress(intent.tokenAddress),
    tokenSymbol: intent.tokenSymbol,
    tokenDecimals: intent.tokenDecimals,
    recipient: normalizeEvmAddress(intent.recipient),
    amountAtomic: intent.amountAtomic,
    memoHash: intent.memoHash,
    requiredApprovals: intent.requiredApprovals,
    approvalIds: [...intent.approvalIds],
    approverAddresses: intent.approverAddresses.map(normalizeEvmAddress),
    createdAt: intent.createdAt,
    expiresAt: intent.expiresAt,
    nonce: intent.nonce,
  } as const;
}

export function hashPaymentIntent(intent: PaymentIntent): string {
  const fields = canonicalPaymentIntentFields(intent);
  const encoded = abiCoder.encode(
    [
      "string",
      "string",
      "address",
      "uint256",
      "address",
      "string",
      "uint8",
      "address",
      "uint256",
      "bytes32",
      "uint8",
      "string[]",
      "address[]",
      "string",
      "string",
      "string",
    ],
    [
      fields.id,
      fields.requestId,
      fields.treasuryAccount,
      fields.chainId,
      fields.tokenAddress,
      fields.tokenSymbol,
      fields.tokenDecimals,
      fields.recipient,
      BigInt(fields.amountAtomic),
      fields.memoHash,
      fields.requiredApprovals,
      fields.approvalIds,
      fields.approverAddresses,
      fields.createdAt,
      fields.expiresAt,
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
  return Date.parse(intent.expiresAt) <= now.getTime();
}

export function isPaymentIntentFinal(status: PaymentIntentStatus): boolean {
  return ["confirmed", "expired", "cancelled", "consumed"].includes(status);
}
