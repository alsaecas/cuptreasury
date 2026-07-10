import { Interface, JsonRpcProvider, Transaction, keccak256 } from "ethers";

import { hashPaymentIntent, type PaymentIntent } from "@/domain/treasury";

import type {
  EvmTransaction,
  PreparedPaymentIntentTransaction,
  ProviderDerivedTransactionFields,
  TokenContractCheck,
} from "./types";

const erc20Interface = new Interface([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export interface PreparePaymentIntentOptions {
  transactionNonce?: number;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface PreparePaymentIntentWithProviderOptions {
  providerUrl: string;
  fromAddress: string;
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
  const transaction: EvmTransaction = {
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

  return buildPreparedPaymentIntent(intent, transaction, {
    tokenAddress: intent.tokenAddress,
    status: "missing-contract",
    bytecodePresent: false,
  });
}

export async function preparePaymentIntentWithProvider(
  intent: PaymentIntent,
  options: PreparePaymentIntentWithProviderOptions,
): Promise<PreparedPaymentIntentTransaction> {
  const provider = new JsonRpcProvider(options.providerUrl, intent.chainId);
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== intent.chainId) {
    throw new Error(
      `Configured provider chain ${network.chainId.toString()} does not match intent chain ${intent.chainId}.`,
    );
  }

  const data = encodePaymentIntentTransferCalldata(intent);
  const code = await provider.getCode(intent.tokenAddress);
  const nonce = await provider.getTransactionCount(options.fromAddress, "latest");
  const gasLimit = await provider.estimateGas({
    from: options.fromAddress,
    to: intent.tokenAddress,
    value: BigInt(0),
    data,
  });
  const feeData = await provider.getFeeData();

  const tokenContract = tokenContractCheck(intent.tokenAddress, code);
  const transaction: EvmTransaction = {
    to: intent.tokenAddress,
    value: BigInt(0),
    data,
    chainId: intent.chainId,
    nonce,
    gasLimit,
  };

  if (feeData.maxFeePerGas !== null && feeData.maxPriorityFeePerGas !== null) {
    transaction.type = 2;
    transaction.maxFeePerGas = feeData.maxFeePerGas;
    transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  } else if (feeData.gasPrice !== null) {
    transaction.gasPrice = feeData.gasPrice;
  } else {
    throw new Error("Provider did not return usable EVM fee data.");
  }

  return buildPreparedPaymentIntent(intent, transaction, tokenContract, {
    nonce,
    gasLimit: gasLimit.toString(),
    chainId: intent.chainId,
    gasPrice: feeData.gasPrice?.toString(),
    maxFeePerGas: feeData.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
  });
}

function buildPreparedPaymentIntent(
  intent: PaymentIntent,
  transaction: EvmTransaction,
  tokenContract: TokenContractCheck,
  providerDerived?: ProviderDerivedTransactionFields,
): PreparedPaymentIntentTransaction {
  const data = transaction.data ?? "0x";

  return {
    intentId: intent.id,
    requestId: intent.requestId,
    transaction,
    calldataHash: keccak256(data),
    intentHash: hashPaymentIntent(intent),
    unsignedTransactionHash: Transaction.from(transaction).unsignedHash,
    providerDerived,
    tokenContract,
    broadcast: false,
  };
}

function tokenContractCheck(
  tokenAddress: string,
  bytecode: string,
): TokenContractCheck {
  const bytecodePresent = bytecode !== "0x";

  return {
    tokenAddress,
    status: bytecodePresent ? "bytecode-present" : "missing-contract",
    bytecodePresent,
    codeHash: bytecodePresent ? keccak256(bytecode) : undefined,
  };
}
