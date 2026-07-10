import type { SimulationResult } from "@tetherto/wdk";

import type { Clock, ExecutionReceipt, PaymentIntent } from "@/domain/treasury";

import type { PaymentIntentConsumptionStore } from "./paymentIntentConsumptionStore";

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
  registerPaymentIntentPolicy(
    intent: PaymentIntent,
    options?: RegisterPaymentIntentPolicyOptions,
  ): Promise<WdkEvmAccount>;
  registerPolicy(policy: import("@tetherto/wdk").Policy): Promise<WdkEvmAccount>;
  dispose(): void;
}

export interface RegisterPaymentIntentPolicyOptions {
  policyId?: string;
  clock?: Clock;
  consumptionStore?: PaymentIntentConsumptionStore;
  expectedTransaction?: EvmTransaction;
}

export type TokenContractStatus = "bytecode-present" | "missing-contract";

export interface ProviderDerivedTransactionFields {
  nonce: number;
  gasLimit: string;
  chainId: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface TokenContractCheck {
  tokenAddress: string;
  status: TokenContractStatus;
  bytecodePresent: boolean;
  codeHash?: string;
}

export interface PreparedPaymentIntentTransaction {
  intentId: string;
  requestId: string;
  transaction: EvmTransaction;
  calldataHash: string;
  intentHash: string;
  unsignedTransactionHash: string;
  providerDerived?: ProviderDerivedTransactionFields;
  tokenContract: TokenContractCheck;
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
  unsignedTransactionHash: string;
  broadcast: false;
}

export interface ExecutePaymentIntentInput {
  account: WdkEvmAccount;
  intent: PaymentIntent;
  network: string;
  provider?: string;
  clock?: Clock;
  consumptionStore?: PaymentIntentConsumptionStore;
  sign?: boolean;
  timestamp?: string;
  prepared?: PreparedPaymentIntentTransaction;
}

export interface ExecutePaymentIntentResult {
  policyReceipt: import("@/domain/treasury").PolicyDecisionReceipt;
  prepared: PreparedPaymentIntentTransaction;
  quote?: QuotePaymentIntentResult;
  signing?: SignPaymentIntentResult;
  executionReceipt: ExecutionReceipt;
}
