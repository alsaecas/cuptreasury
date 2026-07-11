import { Interface, JsonRpcProvider, keccak256 } from "ethers";

import type { PaymentIntent } from "@/domain/treasury";
import type { EvmTransaction } from "@/lib/wdk/guarded";
import type { TeamTreasuryExecutionPlan } from "./types";

const treasuryInterface = new Interface(["function executeRequest(uint256 requestId)"]);

export async function prepareTeamTreasuryTransaction(input: {
  providerUrl: string; from: string; treasuryContract: string; requestId: bigint; intent: PaymentIntent;
}): Promise<TeamTreasuryExecutionPlan> {
  const provider = new JsonRpcProvider(input.providerUrl, 31337, { staticNetwork: true });
  const data = treasuryInterface.encodeFunctionData("executeRequest", [input.requestId]);
  const [nonce, gasLimit, feeData] = await Promise.all([
    provider.getTransactionCount(input.from, "latest"),
    provider.estimateGas({ from: input.from, to: input.treasuryContract, data, value: 0n }),
    provider.getFeeData(),
  ]);
  const transaction: EvmTransaction = { to: input.treasuryContract, data, value: 0n, chainId: 31337, nonce, gasLimit };
  if (feeData.maxFeePerGas !== null && feeData.maxPriorityFeePerGas !== null) {
    transaction.type = 2; transaction.maxFeePerGas = feeData.maxFeePerGas; transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  } else if (feeData.gasPrice !== null) { transaction.gasPrice = feeData.gasPrice; } else { throw new Error("Local provider did not supply fees."); }
  return { paymentIntentId: input.intent.id, paymentIntentHash: (await import("@/domain/treasury")).hashPaymentIntent(input.intent), chainId: 31337, executorAccount: input.from, treasuryContract: input.treasuryContract, onChainRequestId: input.requestId.toString(), calldata: data, calldataHash: keccak256(data), nativeValue: "0", expiresAt: input.intent.expiresAt, transaction };
}

export const teamTreasuryInterface = treasuryInterface;
