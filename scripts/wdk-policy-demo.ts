import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  createPaymentIntent,
  executionReceiptEvents,
  fixedClock,
  hashPaymentIntent,
  paymentIntentCreatedEvent,
  policyDecisionEvent,
  replayPaymentIntentAudit,
  type ExecutionReceipt,
  type PaymentIntent,
  type PolicyDecisionReceipt,
  type TreasuryApproval,
  type TreasuryPaymentRequest,
} from "@/domain/treasury";
import {
  DEFAULT_SEPOLIA_CHAIN_ID,
  DEFAULT_SEPOLIA_RPC_URL,
  InMemoryPaymentIntentConsumptionStore,
  createTreasuryWdk,
  evaluatePaymentIntentWithWdk,
  preparePaymentIntent,
  preparePaymentIntentWithProvider,
  quotePaymentIntent,
  signPaymentIntent,
  type PreparedPaymentIntentTransaction,
  type TreasuryWdkContext,
} from "@/lib/wdk/guarded";

const WRITE_JSON = process.argv.includes("--json");
const ARTIFACT_PATH = resolve("artifacts/wdk-policy-proof.json");
const MOCK_USDT_SEPOLIA_PLACEHOLDER =
  "0x0000000000000000000000000000000000002000";
const VAN_VENDOR = "0x0000000000000000000000000000000000003000";
const OTHER_VENDOR = "0x0000000000000000000000000000000000004000";
const OTHER_TOKEN = "0x0000000000000000000000000000000000005000";
const WRONG_TREASURY = "0x0000000000000000000000000000000000006000";

type ScenarioId =
  | "insufficient-approvals"
  | "exact-authorized-intent"
  | "modified-amount"
  | "modified-recipient"
  | "modified-token"
  | "wrong-chain"
  | "wrong-treasury-account"
  | "expired-intent"
  | "first-valid-signing-attempt"
  | "second-use-denied";

interface ScenarioProof {
  id: ScenarioId;
  title: string;
  outcome: "ALLOW" | "DENY" | "SIGNED" | "UNSUPPORTED";
  policyDecision?: "ALLOW" | "DENY";
  policyId?: string;
  matchedRule?: string;
  reason: string;
  evaluatedAt: string;
}

function iso(date: Date): string {
  return date.toISOString();
}

function offset(base: Date, ms: number): string {
  return iso(new Date(base.getTime() + ms));
}

function approvalFixtures(now: Date) {
  const captainApproval: TreasuryApproval = {
    id: "approval-van-captain",
    memberId: "member-alejandro",
    memberAddress: "0x00000000000000000000000000000000000000ca",
    memberName: "Alejandro",
    role: "Captain",
    createdAt: offset(now, -60 * 60 * 1000),
  };

  const treasurerApproval: TreasuryApproval = {
    id: "approval-van-treasurer",
    memberId: "member-paulina",
    memberAddress: "0x00000000000000000000000000000000000000b0",
    memberName: "Paulina",
    role: "Treasurer",
    createdAt: offset(now, -57 * 60 * 1000),
  };

  return { captainApproval, treasurerApproval };
}

function createVanRentalRequest({
  now,
  approvals,
  expiresAt = offset(now, 60 * 60 * 1000),
}: {
  now: Date;
  approvals: TreasuryApproval[];
  expiresAt?: string;
}): TreasuryPaymentRequest {
  const { captainApproval } = approvalFixtures(now);

  return {
    id: "request-van-rental",
    title: "120-token van rental",
    amountAtomic: "120000000",
    displayAmount: "120",
    tokenSymbol: "MockUSDT",
    tokenDecimals: 6,
    requestedByMemberId: "member-alejandro",
    requestedByAddress: captainApproval.memberAddress,
    status: "pending",
    approvals,
    memo: "Seven-seat van for away match and equipment bags.",
    createdAt: offset(now, -90 * 60 * 1000),
    expiresAt,
  };
}

function makeIntent({
  request,
  treasuryAccount,
  now,
  nonce,
  intentId = "intent-van-rental",
  createdAt = iso(now),
  expiresAt = offset(now, 60 * 60 * 1000),
}: {
  request: TreasuryPaymentRequest;
  treasuryAccount: string;
  now: Date;
  nonce: string;
  intentId?: string;
  createdAt?: string;
  expiresAt?: string;
}): PaymentIntent {
  return createPaymentIntent(
    {
      request,
      treasuryAccount,
      chainId: DEFAULT_SEPOLIA_CHAIN_ID,
      tokenAddress: MOCK_USDT_SEPOLIA_PLACEHOLDER,
      recipient: VAN_VENDOR,
      expiresAt,
      nonce,
      intentId,
      createdAt,
    },
    fixedClock(now),
  );
}

async function withTreasuryWdkScenario<T>(
  run: (context: TreasuryWdkContext) => Promise<T>,
): Promise<T> {
  const context = await createTreasuryWdk();

  try {
    return await run(context);
  } finally {
    context.dispose();
  }
}

function scenarioFromReceipt(
  id: ScenarioId,
  title: string,
  receipt: PolicyDecisionReceipt,
): ScenarioProof {
  return {
    id,
    title,
    outcome: receipt.decision,
    policyDecision: receipt.decision,
    policyId: receipt.policyId,
    matchedRule: receipt.matchedRule,
    reason: receipt.reason,
    evaluatedAt: receipt.evaluatedAt,
  };
}

async function runPolicyScenario({
  id,
  title,
  now,
  buildIntent,
  mutateTransaction,
}: {
  id: ScenarioId;
  title: string;
  now: Date;
  buildIntent: (context: TreasuryWdkContext) => PaymentIntent;
  mutateTransaction?: (intent: PaymentIntent) => PreparedPaymentIntentTransaction;
}): Promise<ScenarioProof> {
  return withTreasuryWdkScenario(async (context) => {
    const intent = buildIntent(context);
    const expected = preparePaymentIntent(intent);
    const account = await context.registerPaymentIntentPolicy(intent, {
      policyId: `cup-treasury-${id}`,
      expectedTransaction: expected.transaction,
    });
    const transaction = mutateTransaction
      ? mutateTransaction(intent).transaction
      : expected.transaction;
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction,
      evaluatedAt: iso(now),
    });

    return scenarioFromReceipt(id, title, receipt);
  });
}

async function runReplayScenario(now: Date) {
  return withTreasuryWdkScenario(async (context) => {
    const { captainApproval, treasurerApproval } = approvalFixtures(now);
    const request = createVanRentalRequest({
      now,
      approvals: [captainApproval, treasurerApproval],
    });
    const intent = makeIntent({
      request,
      treasuryAccount: context.walletAddress,
      now,
      nonce: "semi-demo-replay",
    });
    const store = new InMemoryPaymentIntentConsumptionStore();
    const prepared = await preparePaymentIntentWithProvider(intent, {
      providerUrl: DEFAULT_SEPOLIA_RPC_URL,
      fromAddress: context.walletAddress,
    });
    const account = await context.registerPaymentIntentPolicy(intent, {
      policyId: "cup-treasury-one-time-replay",
      consumptionStore: store,
      expectedTransaction: prepared.transaction,
    });
    const firstDecision = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: prepared.transaction,
      evaluatedAt: offset(now, 1_000),
    });
    let feeQuote:
      | { status: "quoted"; estimatedFeeAtomic: string }
      | { status: "unsupported"; reason: string };

    try {
      const quote = await quotePaymentIntent(account, prepared);
      feeQuote = { status: "quoted", estimatedFeeAtomic: quote.estimatedFeeAtomic };
    } catch (error) {
      feeQuote = {
        status: "unsupported",
        reason: error instanceof Error ? error.message : String(error),
      };
    }

    const signing = await signPaymentIntent(account, intent, prepared);
    await store.consumeAtomically(intent.id, intent.nonce);

    const secondDecision = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: prepared.transaction,
      evaluatedAt: offset(now, 2_000),
    });
    const executionReceipt: ExecutionReceipt = {
      receiptId: `proof-receipt-${intent.id}-${prepared.unsignedTransactionHash.slice(2, 10)}`,
      intentId: intent.id,
      requestId: intent.requestId,
      network: "Sepolia",
      chainId: intent.chainId,
      walletAddress: context.walletAddress,
      recipient: intent.recipient,
      tokenAddress: intent.tokenAddress,
      tokenSymbol: intent.tokenSymbol,
      amountAtomic: intent.amountAtomic,
      estimatedFeeAtomic:
        feeQuote.status === "quoted" ? feeQuote.estimatedFeeAtomic : undefined,
      prepared: true,
      signed: signing.signed,
      consumed: true,
      broadcast: false,
      calldataHash: prepared.calldataHash,
      unsignedTransactionHash: prepared.unsignedTransactionHash,
      tokenContractStatus: prepared.tokenContract.status,
      timestamp: offset(now, 1_500),
    };
    const auditEvents = [
      paymentIntentCreatedEvent(intent),
      policyDecisionEvent(firstDecision),
      ...executionReceiptEvents(executionReceipt),
      policyDecisionEvent(secondDecision),
    ];

    return {
      request,
      intent,
      intentHash: hashPaymentIntent(intent),
      prepared,
      feeQuote,
      signing,
      executionReceipt,
      auditProjection: replayPaymentIntentAudit(auditEvents, intent.id),
      auditJournal: auditEvents.map((event) => event.type),
      scenarios: [
        {
          id: "first-valid-signing-attempt" as const,
          title: "First valid signing attempt",
          outcome: "SIGNED" as const,
          policyDecision: firstDecision.decision,
          policyId: firstDecision.policyId,
          matchedRule: firstDecision.matchedRule,
          reason:
            firstDecision.decision === "ALLOW"
              ? "WDK allowed and signed the exact provider-derived no-broadcast transaction."
              : firstDecision.reason,
          evaluatedAt: firstDecision.evaluatedAt,
        },
        scenarioFromReceipt(
          "second-use-denied",
          "Second use of same intent",
          secondDecision,
        ),
      ],
      walletAddress: context.walletAddress,
    };
  });
}

async function main() {
  const now = new Date();
  const { captainApproval, treasurerApproval } = approvalFixtures(now);
  const approvedRequest = createVanRentalRequest({
    now,
    approvals: [captainApproval, treasurerApproval],
  });
  const underApprovedRequest = createVanRentalRequest({
    now,
    approvals: [captainApproval],
  });
  const expiredRequest = createVanRentalRequest({
    now,
    approvals: [captainApproval, treasurerApproval],
  });
  const scenarios: ScenarioProof[] = [];

  scenarios.push(
    await runPolicyScenario({
      id: "insufficient-approvals",
      title: "Insufficient approvals",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: underApprovedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-under-approved",
        }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "exact-authorized-intent",
      title: "Exact authorized intent",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-exact",
        }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "modified-amount",
      title: "Changed amount",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-amount",
        }),
      mutateTransaction: (intent) =>
        preparePaymentIntent({ ...intent, amountAtomic: "121000000" }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "modified-recipient",
      title: "Changed recipient",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-recipient",
        }),
      mutateTransaction: (intent) =>
        preparePaymentIntent({ ...intent, recipient: OTHER_VENDOR }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "modified-token",
      title: "Changed token",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-token",
        }),
      mutateTransaction: (intent) =>
        preparePaymentIntent({ ...intent, tokenAddress: OTHER_TOKEN }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "wrong-chain",
      title: "Wrong chain",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-chain",
        }),
      mutateTransaction: (intent) => preparePaymentIntent({ ...intent, chainId: 1 }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "wrong-treasury-account",
      title: "Wrong treasury account",
      now,
      buildIntent: () =>
        makeIntent({
          request: approvedRequest,
          treasuryAccount: WRONG_TREASURY,
          now,
          nonce: "semi-demo-wrong-account",
        }),
    }),
  );

  scenarios.push(
    await runPolicyScenario({
      id: "expired-intent",
      title: "Expired intent",
      now,
      buildIntent: (context) =>
        makeIntent({
          request: expiredRequest,
          treasuryAccount: context.walletAddress,
          now,
          nonce: "semi-demo-expired",
          createdAt: offset(now, -2 * 60 * 60 * 1000),
          expiresAt: offset(now, -60 * 60 * 1000),
        }),
    }),
  );

  const replay = await runReplayScenario(now);
  scenarios.push(...replay.scenarios);

  const packageVersions = await readPackageVersions();
  const proofCore = {
    ok: scenarios.every((scenario) =>
      scenario.id === "exact-authorized-intent" ||
      scenario.id === "first-valid-signing-attempt"
        ? scenario.outcome === "ALLOW" || scenario.outcome === "SIGNED"
        : scenario.outcome === "DENY",
    ),
    schemaVersion: 1,
    generatedAt: iso(now),
    sdk: "@tetherto/wdk",
    walletModule: "@tetherto/wdk-wallet-evm",
    packageVersions,
    network: "Sepolia",
    chainId: DEFAULT_SEPOLIA_CHAIN_ID,
    sourceCommit: sourceCommit(),
    workflow: workflowProvenance(),
    command: "npm run wdk:policy-demo:json",
    broadcast: false,
    secretsPersisted: false,
    request: {
      id: replay.request.id,
      title: replay.request.title,
      amountAtomic: replay.request.amountAtomic,
      displayAmount: replay.request.displayAmount,
      tokenSymbol: replay.request.tokenSymbol,
      tokenDecimals: replay.request.tokenDecimals,
      approvals: replay.request.approvals.map((approval) => ({
        id: approval.id,
        memberId: approval.memberId,
        role: approval.role,
      })),
    },
    capability: {
      version: replay.intent.capabilityVersion,
      intentId: replay.intent.id,
      requestId: replay.intent.requestId,
      hash: replay.intentHash,
      status: replay.intent.status,
      nonce: replay.intent.nonce,
      expiresAt: replay.intent.expiresAt,
      treasuryAccount: replay.intent.treasuryAccount,
      tokenAddress: replay.intent.tokenAddress,
      recipient: replay.intent.recipient,
      amountAtomic: replay.intent.amountAtomic,
      tokenDecimals: replay.intent.tokenDecimals,
      approvalReferences: replay.intent.approvalReferences,
    },
    safeEphemeralAddress: replay.walletAddress,
    scenarios,
    feeQuote: replay.feeQuote,
    prepared: {
      intentId: replay.prepared.intentId,
      calldataHash: replay.prepared.calldataHash,
      intentHash: replay.prepared.intentHash,
      unsignedTransactionHash: replay.prepared.unsignedTransactionHash,
      providerDerived: replay.prepared.providerDerived,
      tokenContract: replay.prepared.tokenContract,
      broadcast: replay.prepared.broadcast,
    },
    signed: {
      intentId: replay.signing.intentId,
      signed: replay.signing.signed,
      signedPayloadHash: replay.signing.signedPayloadHash,
      unsignedTransactionHash: replay.signing.unsignedTransactionHash,
      broadcast: replay.signing.broadcast,
    },
    executionReceipt: replay.executionReceipt,
    auditProjection: replay.auditProjection,
    auditJournal: replay.auditJournal,
    disclosures: [
      "The browser visualizes generated Node/CI proof data.",
      "Real WDK native policy simulation and signing run in Node because WDK depends on native runtime capabilities.",
      "The placeholder MockUSDT address has no Sepolia bytecode and is not described as a functional token contract.",
      "No transaction was broadcast.",
      "No seed phrase, private key, mnemonic, or funded wallet is persisted.",
    ],
  };
  const proof = {
    ...proofCore,
    proofContentHash: sha256(stableStringify(proofCore)),
  };

  printProof(proof);

  if (WRITE_JSON) {
    await mkdir(dirname(ARTIFACT_PATH), { recursive: true });
    await writeFile(ARTIFACT_PATH, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(`Sanitized proof written to ${ARTIFACT_PATH}`);
  }
}

function printProof(proof: {
  scenarios: ScenarioProof[];
  network: string;
  broadcast: boolean;
  secretsPersisted: boolean;
}) {
  console.log("CupTreasury WDK guarded execution proof");
  console.log(`Network: ${proof.network}`);
  console.log(`Broadcast: ${String(proof.broadcast)}`);
  console.log(`Secrets persisted: ${String(proof.secretsPersisted)}`);
  console.log("");

  for (const scenario of proof.scenarios) {
    const outcome = scenario.outcome.padEnd(11, " ");
    console.log(`${outcome} ${scenario.title}`);
    console.log(`            id: ${scenario.id}`);
    console.log(`        policy: ${scenario.policyId ?? "n/a"}`);
    console.log(`          rule: ${scenario.matchedRule ?? "n/a"}`);
    console.log(`        reason: ${scenario.reason}`);
  }
}

async function readPackageVersions() {
  const packageJson = JSON.parse(
    await readFile(resolve("package.json"), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
  };

  return {
    "@tetherto/wdk": packageJson.dependencies?.["@tetherto/wdk"] ?? "unknown",
    "@tetherto/wdk-wallet-evm":
      packageJson.dependencies?.["@tetherto/wdk-wallet-evm"] ?? "unknown",
    ethers: packageJson.dependencies?.ethers ?? "unknown",
  };
}

function sourceCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function workflowProvenance() {
  const runId = process.env.GITHUB_RUN_ID;
  const repository = process.env.GITHUB_REPOSITORY;

  return {
    name: process.env.GITHUB_WORKFLOW ?? null,
    runId: runId ?? null,
    runUrl:
      runId && repository
        ? `https://github.com/${repository}/actions/runs/${runId}`
        : null,
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    );
  }

  return value;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
