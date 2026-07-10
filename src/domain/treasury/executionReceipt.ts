export interface ExecutionReceipt {
  receiptId: string;
  intentId: string;
  requestId: string;
  network: string;
  chainId: number;
  walletAddress: string;
  recipient: string;
  tokenAddress: string;
  tokenSymbol: string;
  amountAtomic: string;
  estimatedFeeAtomic?: string;
  prepared: boolean;
  signed: boolean;
  consumed: boolean;
  broadcast: boolean;
  transactionHash?: string;
  calldataHash?: string;
  unsignedTransactionHash?: string;
  tokenContractStatus?: "bytecode-present" | "missing-contract";
  timestamp: string;
}
