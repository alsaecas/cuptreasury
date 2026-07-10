import { describe, expect, it } from "vitest";

import {
  assertPaymentIntentHash,
  consumePaymentIntent,
  createAuditEvent,
  createPaymentIntent,
  evaluateTreasuryApprovalPolicy,
  executionReceiptEvents,
  hashPaymentIntent,
  paymentIntentCreatedEvent,
  policyDecisionEvent,
  replayPaymentIntentAudit,
  transitionPaymentIntent,
  TreasuryDomainError,
  type ExecutionReceipt,
  type PaymentIntent,
  type TreasuryApproval,
  type TreasuryPaymentRequest,
} from ".";

const NOW = new Date("2026-07-10T10:00:00.000Z");
const TREASURY = "0x0000000000000000000000000000000000001000";
const TOKEN = "0x0000000000000000000000000000000000002000";
const RECIPIENT = "0x0000000000000000000000000000000000003000";

const captainApproval: TreasuryApproval = {
  id: "approval-captain",
  memberId: "member-captain",
  memberAddress: "0x00000000000000000000000000000000000000ca",
  memberName: "Captain",
  role: "Captain",
  createdAt: "2026-07-10T09:00:00.000Z",
};

const treasurerApproval: TreasuryApproval = {
  id: "approval-treasurer",
  memberId: "member-treasurer",
  memberAddress: "0x00000000000000000000000000000000000000b0",
  memberName: "Treasurer",
  role: "Treasurer",
  createdAt: "2026-07-10T09:01:00.000Z",
};

function request(
  overrides: Partial<TreasuryPaymentRequest> = {},
): TreasuryPaymentRequest {
  return {
    id: "request-van-rental",
    title: "Van rental",
    amountUnits: 120,
    amountAtomic: "120000000",
    tokenSymbol: "MockUSDT",
    tokenDecimals: 6,
    requestedByMemberId: "member-captain",
    requestedByAddress: captainApproval.memberAddress,
    status: "pending",
    approvals: [captainApproval, treasurerApproval],
    memo: "Van rental for away match",
    createdAt: "2026-07-10T08:00:00.000Z",
    expiresAt: "2026-07-11T08:00:00.000Z",
    ...overrides,
  };
}

function intent(
  overrides: Partial<PaymentIntent> = {},
): PaymentIntent {
  const created = createPaymentIntent(
    {
      request: request(),
      treasuryAccount: TREASURY,
      chainId: 11155111,
      tokenAddress: TOKEN,
      recipient: RECIPIENT,
      expiresAt: "2026-07-11T08:00:00.000Z",
      nonce: "nonce-1",
      intentId: "intent-van-rental",
      createdAt: "2026-07-10T10:00:00.000Z",
    },
    NOW,
  );

  return {
    ...created,
    ...overrides,
  };
}

describe("evaluateTreasuryApprovalPolicy", () => {
  it("denies a 35-unit request with zero approvals", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        id: "request-35-zero",
        amountUnits: 35,
        amountAtomic: "35000000",
        approvals: [],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "approval-threshold",
        passed: false,
        detail: "0/1 valid approvals collected.",
      }),
    );
  });

  it("allows a 35-unit request with one valid approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        id: "request-35-one",
        amountUnits: 35,
        amountAtomic: "35000000",
        approvals: [captainApproval],
      }),
      NOW,
    );

    expect(decision.decision).toBe("ALLOW");
  });

  it("denies a 120-unit request with one approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        approvals: [captainApproval],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "approval-threshold",
        detail: "1/2 valid approvals collected.",
      }),
    );
  });

  it("allows a 120-unit request with two approvals", () => {
    const decision = evaluateTreasuryApprovalPolicy(request(), NOW);

    expect(decision.decision).toBe("ALLOW");
  });

  it("denies invalid Player approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountUnits: 35,
        amountAtomic: "35000000",
        approvals: [
          {
            ...captainApproval,
            id: "approval-player",
            role: "Player",
          },
        ],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "approver-roles", passed: false }),
    );
  });

  it("denies invalid Fan approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountUnits: 35,
        amountAtomic: "35000000",
        approvals: [
          {
            ...captainApproval,
            id: "approval-fan",
            role: "Fan",
          },
        ],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
  });

  it("denies duplicate Captain approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountUnits: 35,
        amountAtomic: "35000000",
        approvals: [
          captainApproval,
          {
            ...captainApproval,
            id: "approval-captain-duplicate",
          },
        ],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "unique-approver-members",
        passed: false,
      }),
    );
  });

  it("denies duplicate Treasurer address approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        approvals: [
          treasurerApproval,
          {
            ...treasurerApproval,
            id: "approval-treasurer-duplicate",
            memberId: "member-second-treasurer-record",
          },
        ],
      }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "unique-approver-addresses",
        passed: false,
      }),
    );
  });

  it("denies an expired request", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({ expiresAt: "2026-07-09T08:00:00.000Z" }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "request-not-expired", passed: false }),
    );
  });

  it("denies a rejected request", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({ status: "rejected" }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "request-open", passed: false }),
    );
  });

  it("denies a consumed request", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({ status: "consumed" }),
      NOW,
    );

    expect(decision.decision).toBe("DENY");
  });
});

describe("PaymentIntent capability hashing", () => {
  it("creates authorized intents for approved requests", () => {
    const created = intent();

    expect(created.status).toBe("authorized");
    expect(created.amountAtomic).toBe("120000000");
    expect(created.requiredApprovals).toBe(2);
    expect(created.approvalIds).toEqual([
      captainApproval.id,
      treasurerApproval.id,
    ]);
  });

  it("marks under-approved intents as awaiting approvals", () => {
    const created = createPaymentIntent(
      {
        request: request({ approvals: [captainApproval] }),
        treasuryAccount: TREASURY,
        chainId: 11155111,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        expiresAt: "2026-07-11T08:00:00.000Z",
        nonce: "nonce-under-approved",
      },
      NOW,
    );

    expect(created.status).toBe("awaiting-approvals");
  });

  it("rejects blocked request statuses during intent creation", () => {
    expect(() =>
      createPaymentIntent(
        {
          request: request({ status: "paid" }),
          treasuryAccount: TREASURY,
          chainId: 11155111,
          tokenAddress: TOKEN,
          recipient: RECIPIENT,
          expiresAt: "2026-07-11T08:00:00.000Z",
          nonce: "nonce-paid",
        },
        NOW,
      ),
    ).toThrow(/cannot create a usable PaymentIntent/);
  });

  it.each([
    ["amount", (base: PaymentIntent) => ({ ...base, amountAtomic: "1" })],
    ["recipient", (base: PaymentIntent) => ({ ...base, recipient: TREASURY })],
    ["token", (base: PaymentIntent) => ({ ...base, tokenAddress: RECIPIENT })],
    ["chain", (base: PaymentIntent) => ({ ...base, chainId: 1 })],
    [
      "treasury account",
      (base: PaymentIntent) => ({ ...base, treasuryAccount: RECIPIENT }),
    ],
    ["nonce", (base: PaymentIntent) => ({ ...base, nonce: "nonce-2" })],
    [
      "expiry",
      (base: PaymentIntent) => ({
        ...base,
        expiresAt: "2026-07-12T08:00:00.000Z",
      }),
    ],
    [
      "request identifier",
      (base: PaymentIntent) => ({ ...base, requestId: "request-other" }),
    ],
    [
      "memo hash",
      (base: PaymentIntent) => ({
        ...base,
        memoHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      }),
    ],
  ])("changes the hash when %s is modified", (_, mutate) => {
    const created = intent();
    const expectedHash = hashPaymentIntent(created);
    const tampered = mutate(created);

    expect(hashPaymentIntent(tampered)).not.toBe(expectedHash);
    expect(() => assertPaymentIntentHash(tampered, expectedHash)).toThrow(
      /PaymentIntent hash mismatch/,
    );
  });

  it("detects a modified request after intent creation", () => {
    const originalIntent = intent();
    const originalHash = hashPaymentIntent(originalIntent);
    const modifiedIntent = createPaymentIntent(
      {
        request: request({
          amountUnits: 121,
          amountAtomic: "121000000",
        }),
        treasuryAccount: TREASURY,
        chainId: 11155111,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        expiresAt: "2026-07-11T08:00:00.000Z",
        nonce: "nonce-1",
        intentId: "intent-van-rental",
        createdAt: "2026-07-10T10:00:00.000Z",
      },
      NOW,
    );

    expect(hashPaymentIntent(modifiedIntent)).not.toBe(originalHash);
  });
});

describe("PaymentIntent state machine", () => {
  it("allows the expected happy path", () => {
    const authorized = intent();
    const policyAllowed = transitionPaymentIntent(authorized, "policy-allowed");
    const quoted = transitionPaymentIntent(policyAllowed, "quoted");
    const prepared = transitionPaymentIntent(quoted, "prepared");
    const signed = transitionPaymentIntent(prepared, "signed");
    const submitted = transitionPaymentIntent(signed, "submitted");
    const confirmed = transitionPaymentIntent(submitted, "confirmed");
    const consumed = consumePaymentIntent(confirmed);

    expect(consumed.status).toBe("consumed");
  });

  it("throws typed domain errors for invalid transitions", () => {
    expect(() => transitionPaymentIntent(intent(), "signed")).toThrow(
      TreasuryDomainError,
    );
  });

  it("allows cancellation from a non-final state", () => {
    expect(transitionPaymentIntent(intent(), "cancelled").status).toBe(
      "cancelled",
    );
  });
});

describe("treasury audit replay", () => {
  it("rebuilds PaymentIntent execution state deterministically", () => {
    const created = intent();
    const allowedReceipt = {
      intentId: created.id,
      decision: "ALLOW" as const,
      policyId: "wdk-payment-intent-policy",
      reason: "Exact PaymentIntent capability matched.",
      matchedRule: "allow-exact-payment-intent-transfer",
      trace: [
        {
          rule: "allow-exact-payment-intent-transfer",
          passed: true,
          detail: "WDK native simulation allowed the exact transfer.",
        },
      ],
      evaluatedAt: "2026-07-10T10:01:00.000Z",
    };
    const executionReceipt: ExecutionReceipt = {
      intentId: created.id,
      requestId: created.requestId,
      network: "Sepolia",
      chainId: created.chainId,
      walletAddress: created.treasuryAccount,
      recipient: created.recipient,
      tokenAddress: created.tokenAddress,
      tokenSymbol: created.tokenSymbol,
      amountAtomic: created.amountAtomic,
      estimatedFeeAtomic: "46835902008000",
      prepared: true,
      signed: true,
      broadcast: false,
      calldataHash:
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      timestamp: "2026-07-10T10:02:00.000Z",
    };
    const events = [
      paymentIntentCreatedEvent(created),
      createAuditEvent({
        type: "PaymentIntentAuthorized",
        aggregateId: created.id,
        timestamp: "2026-07-10T10:00:30.000Z",
        metadata: { requestId: created.requestId },
      }),
      policyDecisionEvent(allowedReceipt),
      ...executionReceiptEvents(executionReceipt),
    ];

    const projection = replayPaymentIntentAudit(events, created.id);

    expect(projection).toMatchObject({
      intentId: created.id,
      status: "signed",
      requestId: created.requestId,
      policyDecision: "ALLOW",
      estimatedFeeAtomic: "46835902008000",
      prepared: true,
      signed: true,
      broadcast: false,
      updatedAt: "2026-07-10T10:02:00.000Z",
    });
  });
});
