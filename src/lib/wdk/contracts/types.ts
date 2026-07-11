import type { EvmTransaction } from "@/lib/wdk/guarded";

export interface TeamTreasuryExecutionPlan {
  paymentIntentId: string;
  paymentIntentHash: string;
  chainId: number;
  executorAccount: string;
  treasuryContract: string;
  onChainRequestId: string;
  calldata: string;
  calldataHash: string;
  nativeValue: "0";
  expiresAt: string;
  transaction: EvmTransaction;
}
