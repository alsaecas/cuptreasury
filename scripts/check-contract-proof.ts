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
    teamTreasury: proof.teamTreasury && { requestId: proof.teamTreasury.requestId, requiredApprovals: proof.teamTreasury.requiredApprovals, approvalCount: proof.teamTreasury.approvalCount },
    wdk: proof.wdk && { policyDecision: proof.wdk.policyDecision, signedByWdk: proof.wdk.signedByWdk, broadcastLocally: proof.wdk.broadcastLocally, approvalsSignedByWdk: proof.wdk.approvalsSignedByWdk },
    tamperScenarios: proof.tamperScenarios,
    execution: proof.execution && { recipientBalanceBefore: proof.execution.recipientBalanceBefore, recipientBalanceAfter: proof.execution.recipientBalanceAfter, transferredAmount: proof.execution.transferredAmount, requestExecuted: proof.execution.requestExecuted },
    defenseInDepth: proof.defenseInDepth, broadcast: proof.broadcast, secretsPersisted: proof.secretsPersisted,
  });
  if (JSON.stringify(comparable(artifact)) !== JSON.stringify(comparable(generated))) throw new Error("Generated contract proof fixture is stale. Run npm run contract-proof:generate.");
  if (artifact.execution.transferredAmount !== "120000000" || artifact.wdk.signedByWdk !== true || artifact.token.officialUsdt !== false || artifact.broadcast.localOnly !== true) throw new Error("Contract proof mandatory invariant failed.");
  console.log("Generated contract proof fixture is consistent.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
