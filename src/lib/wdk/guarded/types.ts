import type { SimulationResult } from "@tetherto/wdk";

import type { ExecutionReceipt, PaymentIntent } from "@/domain/treasury";

export const WDK_EVM_WALLET_ID = "ethereum";
export const DEFAULT_SEPOLIA_RPC_URL = "https://sepolia.drpc.org";
export const DEFAULT_SEPOLIA_CHAIN_ID = 11155111;
export const DEFAULT_WDK_POLICY_ID = "cup-treasury-payment-intent-policy-v1";

export interface EvmTransaction {
  to?: string | null;
  value: number | bigint;
  data?: string;
  gasLimit?: number | bigint;
  gasPrice?: number | bigint;
  maxFeePerGas?: number | bigint;
  maxPriorityFeePerGas?: number | bigint;
  type?: number;
  nonce?: number;
  chainId?: number | bigint;
}

export interface WdkEvmAccount {
  getAddress(): Promise<string>;
  quoteSendTransaction(transaction: EvmTransaction): Promise<{ fee: bigint }>;
  signTransaction(transaction: EvmTransaction): Promise<string>;
  simulate: {
    signTransaction(transaction: EvmTransaction): Promise<SimulationResult>;
  };
}

export interface TreasuryWdkConfig {
  provider?: string;
  chainId?: number;
  walletId?: string;
  accountIndex?: number;
}

export interface TreasuryWdkContext {
  walletId: string;
  accountIndex: number;
  chainId: number;
  provider?: string;
  walletAddress: string;
  account: WdkEvmAccount;
  registerPaymentIntentPolicy(intent: PaymentIntent): Promise<WdkEvmAccount>;
  dispose(): void;
}

export interface PreparedPaymentIntentTransaction {
  intentId: string;
  requestId: string;
  transaction: EvmTransaction;
  calldataHash: string;
  intentHash: string;
  broadcast: false;
}

export interface QuotePaymentIntentResult {
  intentId: string;
  estimatedFeeAtomic: string;
}

export interface SignPaymentIntentResult {
  intentId: string;
  signed: true;
  signedPayloadHash: string;
  broadcast: false;
}

export interface ExecutePaymentIntentInput {
  account: WdkEvmAccount;
  intent: PaymentIntent;
  network: string;
  sign?: boolean;
  timestamp?: string;
}

export interface ExecutePaymentIntentResult {
  policyReceipt: import("@/domain/treasury").PolicyDecisionReceipt;
  prepared: PreparedPaymentIntentTransaction;
  quote?: QuotePaymentIntentResult;
  signing?: SignPaymentIntentResult;
  executionReceipt: ExecutionReceipt;
}
