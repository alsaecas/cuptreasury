import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { guardedExecutionProof } from "../src/data/generated/guardedExecutionProof.generated";

const ARTIFACT_PATH = resolve("artifacts/wdk-policy-proof.json");

async function main() {
  const artifact = JSON.parse(await readFile(ARTIFACT_PATH, "utf8"));
  const artifactComparable = comparableProof(artifact);
  const generatedComparable = comparableProof(guardedExecutionProof);

  if (
    JSON.stringify(artifactComparable) !== JSON.stringify(generatedComparable)
  ) {
    console.error(
      "Generated guarded execution fixture is stale. Run npm run guarded-proof:generate.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Generated guarded execution fixture is consistent.");
}

function comparableProof(proof: Record<string, unknown>) {
  const request = objectAt(proof, "request");
  const capability = objectAt(proof, "capability");
  const prepared = objectAt(proof, "prepared");
  const preparedTokenContract = objectAt(prepared, "tokenContract");
  const signed = objectAt(proof, "signed");
  const executionReceipt = objectAt(proof, "executionReceipt");

  return {
    schemaVersion: proof.schemaVersion,
    sdk: proof.sdk,
    walletModule: proof.walletModule,
    network: proof.network,
    chainId: proof.chainId,
    command: proof.command,
    broadcast: proof.broadcast,
    secretsPersisted: proof.secretsPersisted,
    request: {
      amountAtomic: request.amountAtomic,
      displayAmount: request.displayAmount,
      tokenSymbol: request.tokenSymbol,
      tokenDecimals: request.tokenDecimals,
      approvals: request.approvals,
    },
    capability: {
      version: capability.version,
      amountAtomic: capability.amountAtomic,
      tokenDecimals: capability.tokenDecimals,
      approvalReferences: capability.approvalReferences,
    },
    scenarios: arrayAt(proof, "scenarios").map((scenario) => {
      const scenarioObject = objectFrom(scenario);

      return {
        id: scenarioObject.id,
        title: scenarioObject.title,
        outcome: scenarioObject.outcome,
        policyDecision: scenarioObject.policyDecision,
        matchedRule: scenarioObject.matchedRule ?? null,
      };
    }),
    feeQuoteStatus: objectAt(proof, "feeQuote").status,
    prepared: {
      providerDerivedPresent: Boolean(prepared.providerDerived),
      tokenContractStatus: preparedTokenContract.status,
      tokenContractBytecodePresent: preparedTokenContract.bytecodePresent,
      broadcast: prepared.broadcast,
    },
    signed: {
      signed: signed.signed,
      broadcast: signed.broadcast,
    },
    executionReceipt: {
      prepared: executionReceipt.prepared,
      signed: executionReceipt.signed,
      consumed: executionReceipt.consumed,
      broadcast: executionReceipt.broadcast,
      tokenContractStatus: executionReceipt.tokenContractStatus,
    },
    auditJournal: proof.auditJournal,
    disclosures: proof.disclosures,
  };
}

function objectAt(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  return objectFrom(record[key]);
}

function objectFrom(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayAt(record: Record<string, unknown>, key: string): unknown[] {
  return Array.isArray(record[key]) ? record[key] : [];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
