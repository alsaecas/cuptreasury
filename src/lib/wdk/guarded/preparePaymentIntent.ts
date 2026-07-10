import { Interface, keccak256 } from "ethers";

import { hashPaymentIntent, type PaymentIntent } from "@/domain/treasury";

import type { PreparedPaymentIntentTransaction } from "./types";

const erc20Interface = new Interface([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export interface PreparePaymentIntentOptions {
  transactionNonce?: number;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export function encodePaymentIntentTransferCalldata(
  intent: PaymentIntent,
): string {
  return erc20Interface.encodeFunctionData("transfer", [
    intent.recipient,
    BigInt(intent.amountAtomic),
  ]);
}

export function preparePaymentIntent(
  intent: PaymentIntent,
  options: PreparePaymentIntentOptions = {},
): PreparedPaymentIntentTransaction {
  const data = encodePaymentIntentTransferCalldata(intent);
  const transaction = {
    to: intent.tokenAddress,
    value: BigInt(0),
    data,
    chainId: intent.chainId,
    nonce: options.transactionNonce ?? 0,
    gasLimit: options.gasLimit ?? BigInt(65_000),
    type: 2,
    maxFeePerGas: options.maxFeePerGas ?? BigInt(1_000_000_000),
    maxPriorityFeePerGas: options.maxPriorityFeePerGas ?? BigInt(1_000_000),
  };

  return {
    intentId: intent.id,
    requestId: intent.requestId,
    transaction,
    calldataHash: keccak256(data),
    intentHash: hashPaymentIntent(intent),
    broadcast: false,
  };
}
