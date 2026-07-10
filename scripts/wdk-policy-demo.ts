import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  createPaymentIntent,
  hashPaymentIntent,
  policyDecisionEvent,
  paymentIntentCreatedEvent,
  executionReceiptEvents,
  replayPaymentIntentAudit,
  type PaymentIntent,
  type PolicyDecisionReceipt,
  type TreasuryApproval,
  type TreasuryPaymentRequest,
} from "@/domain/treasury";
import {
  createTreasuryWdk,
  evaluatePaymentIntentWithWdk,
  preparePaymentIntent,
  quotePaymentIntent,
  signPaymentIntent,
} from "@/lib/wdk/guarded";

const WRITE_JSON = process.argv.includes("--json");
const ARTIFACT_PATH = resolve("artifacts/wdk-policy-proof.json");
const NOW = new Date("2026-07-10T10:00:00.000Z");
const MOCK_USDT_SEPOLIA_PLACEHOLDER =
  "0x0000000000000000000000000000000000002000";
const VAN_VENDOR = "0x0000000000000000000000000000000000003000";
const OTHER_VENDOR = "0x0000000000000000000000000000000000004000";

const captainApproval: TreasuryApproval = {
  id: "approval-van-captain",
  memberId: "member-alejandro",
  memberAddress: "0x00000000000000000000000000000000000000ca",
  memberName: "Alejandro",
  role: "Captain",
  createdAt: "2026-07-10T09:00:00.000Z",
};

const treasurerApproval: TreasuryApproval = {
  id: "approval-van-treasurer",
  memberId: "member-paulina",
  memberAddress: "0x00000000000000000000000000000000000000b0",
  memberName: "Paulina",
  role: "Treasurer",
  createdAt: "2026-07-10T09:03:00.000Z",
};

function createVanRentalRequest(
  approvals: TreasuryApproval[],
): TreasuryPaymentRequest {
  return {
    id: "request-van-rental",
    title: "120-unit van rental",
    amountUnits: 120,
    amountAtomic: "120000000",
    tokenSymbol: "MockUSDT",
    tokenDecimals: 6,
    requestedByMemberId: "member-alejandro",
    requestedByAddress: captainApproval.memberAddress,
    status: "pending",
    approvals,
    memo: "Seven-seat van for away match and equipment bags.",
    createdAt: "2026-07-10T08:30:00.000Z",
    expiresAt: "2026-07-11T08:30:00.000Z",
  };
}

function makeIntent({
  request,
  treasuryAccount,
  nonce,
  intentId = "intent-van-rental",
}: {
  request: TreasuryPaymentRequest;
  treasuryAccount: string;
  nonce: string;
  intentId?: string;
}): PaymentIntent {
  return createPaymentIntent(
    {
      request,
      treasuryAccount,
      chainId: 11155111,
      tokenAddress: MOCK_USDT_SEPOLIA_PLACEHOLDER,
      recipient: VAN_VENDOR,
      expiresAt: "2026-07-11T08:30:00.000Z",
      nonce,
      intentId,
      createdAt: NOW.toISOString(),
    },
    NOW,
  );
}

function printDecision(label: string, receipt: PolicyDecisionReceipt) {
  const icon = receipt.decision === "ALLOW" ? "ALLOW" : "DENY ";
  console.log(`${icon} ${label}`);
  console.log(`      policy: ${receipt.policyId}`);
  console.log(`      rule: ${receipt.matchedRule ?? "default-deny"}`);
  console.log(`      reason: ${receipt.reason}`);
}

async function main() {
  console.log("CupTreasury WDK guarded execution proof");
  console.log("Network: Sepolia");
  console.log("Broadcast: false");
  console.log("");

  const context = await createTreasuryWdk();
  const decisions: Array<{ scenario: string; receipt: PolicyDecisionReceipt }> =
    [];

  try {
    console.log("1. Create a 120-unit van-rental request.");
    const oneApprovalRequest = createVanRentalRequest([captainApproval]);
    console.log("2. Add only the Captain approval.");

    const underApprovedIntent = makeIntent({
      request: oneApprovalRequest,
      treasuryAccount: context.walletAddress,
      nonce: "semi-demo-1",
    });
    const underApprovedAccount =
      await context.registerPaymentIntentPolicy(underApprovedIntent);
    const underApprovedDecision = await evaluatePaymentIntentWithWdk({
      account: underApprovedAccount,
      intent: underApprovedIntent,
      evaluatedAt: "2026-07-10T10:01:00.000Z",
    });
    decisions.push({
      scenario: "insufficient-approvals",
      receipt: underApprovedDecision,
    });
    printDecision("one approval on a 120-unit request", underApprovedDecision);
    console.log("");

    console.log("3. Add the Treasurer approval and create the immutable intent.");
    const approvedRequest = createVanRentalRequest([
      captainApproval,
      treasurerApproval,
    ]);
    const authorizedIntent = makeIntent({
      request: approvedRequest,
      treasuryAccount: context.walletAddress,
      nonce: "semi-demo-1",
    });
    const intentHash = hashPaymentIntent(authorizedIntent);
    const account = await context.registerPaymentIntentPolicy(authorizedIntent);

    console.log(`   intent: ${authorizedIntent.id}`);
    console.log(`   hash:   ${intentHash}`);
    console.log("");

    const exactDecision = await evaluatePaymentIntentWithWdk({
      account,
      intent: authorizedIntent,
      evaluatedAt: "2026-07-10T10:02:00.000Z",
    });
    decisions.push({ scenario: "exact-authorized-intent", receipt: exactDecision });
    printDecision("exact authorized PaymentIntent", exactDecision);

    const amountTamperDecision = await evaluatePaymentIntentWithWdk({
      account,
      intent: authorizedIntent,
      transaction: preparePaymentIntent({
        ...authorizedIntent,
        amountAtomic: "121000000",
      }).transaction,
      evaluatedAt: "2026-07-10T10:03:00.000Z",
    });
    decisions.push({
      scenario: "modified-amount",
      receipt: amountTamperDecision,
    });
    printDecision("tampered amount", amountTamperDecision);

    const recipientTamperDecision = await evaluatePaymentIntentWithWdk({
      account,
      intent: authorizedIntent,
      transaction: preparePaymentIntent({
        ...authorizedIntent,
        recipient: OTHER_VENDOR,
      }).transaction,
      evaluatedAt: "2026-07-10T10:04:00.000Z",
    });
    decisions.push({
      scenario: "modified-recipient",
      receipt: recipientTamperDecision,
    });
    printDecision("tampered recipient", recipientTamperDecision);
    console.log("");

    console.log("4. Quote, prepare, and sign the exact transaction.");
    const prepared = preparePaymentIntent(authorizedIntent);
    const quote = await quotePaymentIntent(account, prepared);
    const signing = await signPaymentIntent(account, authorizedIntent, prepared);
    const executionReceipt = {
      intentId: authorizedIntent.id,
      requestId: authorizedIntent.requestId,
      network: "Sepolia",
      chainId: authorizedIntent.chainId,
      walletAddress: context.walletAddress,
      recipient: authorizedIntent.recipient,
      tokenAddress: authorizedIntent.tokenAddress,
      tokenSymbol: authorizedIntent.tokenSymbol,
      amountAtomic: authorizedIntent.amountAtomic,
      estimatedFeeAtomic: quote.estimatedFeeAtomic,
      prepared: true,
      signed: signing.signed,
      broadcast: false,
      calldataHash: prepared.calldataHash,
      timestamp: "2026-07-10T10:05:00.000Z",
    };

    console.log(`   estimated fee wei: ${quote.estimatedFeeAtomic}`);
    console.log(`   prepared: ${executionReceipt.prepared}`);
    console.log(`   signed:   ${executionReceipt.signed}`);
    console.log(`   broadcast:${executionReceipt.broadcast}`);
    console.log("");

    const auditEvents = [
      paymentIntentCreatedEvent(authorizedIntent),
      policyDecisionEvent(exactDecision),
      ...executionReceiptEvents(executionReceipt),
    ];
    const auditProjection = replayPaymentIntentAudit(
      auditEvents,
      authorizedIntent.id,
    );

    const proof = {
      ok: true,
      sdk: "@tetherto/wdk",
      walletModule: "@tetherto/wdk-wallet-evm",
      network: "Sepolia",
      chainId: authorizedIntent.chainId,
      request: {
        id: approvedRequest.id,
        title: approvedRequest.title,
        amountUnits: approvedRequest.amountUnits,
        tokenSymbol: approvedRequest.tokenSymbol,
        approvals: approvedRequest.approvals.map((approval) => ({
          id: approval.id,
          role: approval.role,
        })),
      },
      intent: {
        id: authorizedIntent.id,
        hash: intentHash,
        status: authorizedIntent.status,
        expiresAt: authorizedIntent.expiresAt,
        nonce: authorizedIntent.nonce,
      },
      safeEphemeralAddress: context.walletAddress,
      policyDecisions: decisions.map(({ scenario, receipt }) => ({
        scenario,
        decision: receipt.decision,
        policyId: receipt.policyId,
        matchedRule: receipt.matchedRule,
        reason: receipt.reason,
        evaluatedAt: receipt.evaluatedAt,
      })),
      feeQuote: quote,
      prepared: {
        intentId: prepared.intentId,
        calldataHash: prepared.calldataHash,
        broadcast: prepared.broadcast,
      },
      signed: {
        intentId: signing.intentId,
        signed: signing.signed,
        signedPayloadHash: signing.signedPayloadHash,
        broadcast: signing.broadcast,
      },
      executionReceipt,
      auditProjection,
      broadcast: false,
      secretsPersisted: false,
      timestamp: new Date().toISOString(),
    };

    if (WRITE_JSON) {
      await mkdir(dirname(ARTIFACT_PATH), { recursive: true });
      await writeFile(ARTIFACT_PATH, `${JSON.stringify(proof, null, 2)}\n`);
      console.log(`Sanitized proof written to ${ARTIFACT_PATH}`);
    }

    console.log("WDK disposed; no seed phrase, private key, or mnemonic persisted.");
  } finally {
    context.dispose();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
