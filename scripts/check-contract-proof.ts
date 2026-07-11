import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { wdkContractProof } from "@/data/generated/wdkContractProof.generated";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function main() {
  const artifact = JSON.parse(await readFile(resolve("artifacts/wdk-contract-proof.json"), "utf8")) as Record<string, any>;
  const generated = wdkContractProof as unknown as Record<string, any>;
  const comparable = (proof: Record<string, any>) => ({
    ok: proof.ok, schemaVersion: proof.schemaVersion,
    network: proof.network && { name: proof.network.name, chainId: proof.network.chainId, ephemeral: proof.network.ephemeral, realFundsUsed: proof.network.realFundsUsed },
    token: proof.token && { symbol: proof.token.symbol, decimals: proof.token.decimals, officialUsdt: proof.token.officialUsdt, localTestOnly: proof.token.localTestOnly },
    teamTreasury: proof.teamTreasury && { requestId: proof.teamTreasury.requestId, requiredApprovals: proof.teamTreasury.requiredApprovals, approvalCount: proof.teamTreasury.approvalCount, paymentIntentHashMatched: proof.teamTreasury.paymentIntentHashMatched, tokenMatched: proof.teamTreasury.tokenMatched, recipientMatched: proof.teamTreasury.recipientMatched, amountMatched: proof.teamTreasury.amountMatched, approvalsMatched: proof.teamTreasury.approvalsMatched },
    wdk: proof.wdk && { coreVersion: proof.wdk.coreVersion, evmModuleVersion: proof.wdk.evmModuleVersion, policyDecision: proof.wdk.policyDecision, signedByWdk: proof.wdk.signedByWdk, broadcastLocally: proof.wdk.broadcastLocally, approvalsSignedByWdk: proof.wdk.approvalsSignedByWdk },
    tamperScenarios: proof.tamperScenarios,
    execution: proof.execution && { recipientBalanceBefore: proof.execution.recipientBalanceBefore, recipientBalanceAfter: proof.execution.recipientBalanceAfter, treasuryBalanceBefore: proof.execution.treasuryBalanceBefore, treasuryBalanceAfter: proof.execution.treasuryBalanceAfter, transferredAmount: proof.execution.transferredAmount, requestExecuted: proof.execution.requestExecuted, transferEventMatched: proof.execution.transferEventMatched, executionEventMatched: proof.execution.executionEventMatched, transactionStatus: proof.execution.transactionStatus },
    defenseInDepth: proof.defenseInDepth, broadcast: proof.broadcast, secretsPersisted: proof.secretsPersisted,
  });
  if (JSON.stringify(comparable(artifact)) !== JSON.stringify(comparable(generated))) throw new Error("Generated contract proof fixture is stale. Run npm run contract-proof:generate.");
  if (artifact.execution.transferredAmount !== "120000000" || artifact.execution.treasuryBalanceBefore !== "500000000" || artifact.execution.treasuryBalanceAfter !== "380000000" || artifact.execution.transferEventMatched !== true || artifact.execution.executionEventMatched !== true || artifact.execution.transactionStatus !== 1 || artifact.teamTreasury.paymentIntentHashMatched !== true || artifact.teamTreasury.tokenMatched !== true || artifact.teamTreasury.recipientMatched !== true || artifact.teamTreasury.amountMatched !== true || artifact.teamTreasury.approvalsMatched !== true || !/^\d+\.\d+\.\d+/.test(artifact.wdk.coreVersion) || !/^\d+\.\d+\.\d+/.test(artifact.wdk.evmModuleVersion) || !artifact.defenseInDepth.wdkReplayReason || !artifact.defenseInDepth.contractReplayError || artifact.wdk.signedByWdk !== true || artifact.token.officialUsdt !== false || artifact.broadcast.localOnly !== true || artifact.broadcast.publicTestnet !== false || artifact.broadcast.mainnet !== false || artifact.secretsPersisted !== false) throw new Error("Contract proof mandatory invariant failed.");
  console.log("Generated contract proof fixture is consistent.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
