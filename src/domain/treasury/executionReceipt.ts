export interface ExecutionReceipt {
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
  broadcast: boolean;
  transactionHash?: string;
  calldataHash?: string;
  timestamp: string;
}
