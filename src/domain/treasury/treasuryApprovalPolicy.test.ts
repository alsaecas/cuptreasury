import { describe, expect, it } from "vitest";

import {
  InMemoryTreasuryMembershipProvider,
  TreasuryDomainError,
  assertPaymentIntentHash,
  consumePaymentIntent,
  createAuditEvent,
  createPaymentIntent,
  evaluateTreasuryApprovalPolicy,
  executionReceiptEvents,
  expirePaymentIntent,
  fixedClock,
  hashPaymentIntent,
  mutableClock,
  paymentIntentCreatedEvent,
  policyDecisionEvent,
  replayPaymentIntentAudit,
  requiredApprovalsForAmountAtomic,
  transitionPaymentIntent,
  type ExecutionReceipt,
  type PaymentIntent,
  type TreasuryApproval,
  type TreasuryMemberRecord,
  type TreasuryPaymentRequest,
} from ".";

const NOW = new Date("2026-07-10T10:00:00.000Z");
const TREASURY = "0x0000000000000000000000000000000000001000";
const TOKEN = "0x0000000000000000000000000000000000002000";
const RECIPIENT = "0x0000000000000000000000000000000000003000";

const captainApproval: TreasuryApproval = {
  id: "approval-captain",
  memberId: "member-alejandro",
  memberAddress: "0x00000000000000000000000000000000000000ca",
  memberName: "Alejandro",
  role: "Captain",
  createdAt: "2026-07-10T09:00:00.000Z",
};

const treasurerApproval: TreasuryApproval = {
  id: "approval-treasurer",
  memberId: "member-paulina",
  memberAddress: "0x00000000000000000000000000000000000000b0",
  memberName: "Paulina",
  role: "Treasurer",
  createdAt: "2026-07-10T09:01:00.000Z",
};

const playerApproval: TreasuryApproval = {
  id: "approval-player",
  memberId: "member-mateo",
  memberAddress: "0x00000000000000000000000000000000000000f1",
  memberName: "Mateo",
  role: "Player",
  createdAt: "2026-07-10T09:02:00.000Z",
};

function request(
  overrides: Partial<TreasuryPaymentRequest> = {},
): TreasuryPaymentRequest {
  return {
    id: "request-van-rental",
    title: "Van rental",
    amountAtomic: "120000000",
    displayAmount: "120",
    tokenSymbol: "MockUSDT",
    tokenDecimals: 6,
    requestedByMemberId: "member-alejandro",
    requestedByAddress: captainApproval.memberAddress,
    status: "pending",
    approvals: [captainApproval, treasurerApproval],
    memo: "Van rental for away match",
    createdAt: "2026-07-10T08:00:00.000Z",
    expiresAt: "2026-07-11T08:00:00.000Z",
    ...overrides,
  };
}

function intent(overrides: Partial<PaymentIntent> = {}): PaymentIntent {
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
    fixedClock(NOW),
  );

  return {
    ...created,
    ...overrides,
  };
}

describe("atomic treasury approval thresholds", () => {
  it("requires one approval for exactly 100 tokens", () => {
    expect(requiredApprovalsForAmountAtomic("100000000", 6)).toBe(1);
  });

  it("requires two approvals for 100.000001 tokens with six decimals", () => {
    expect(requiredApprovalsForAmountAtomic("100000001", 6)).toBe(2);
  });

  it("requires one approval for 99.999999 tokens", () => {
    expect(requiredApprovalsForAmountAtomic("99999999", 6)).toBe(1);
  });

  it("rejects inconsistent display amounts", () => {
    expect(() =>
      evaluateTreasuryApprovalPolicy(
        request({
          amountAtomic: "120000000",
          displayAmount: "99",
        }),
        fixedClock(NOW),
      ),
    ).toThrow(TreasuryDomainError);
  });

  it.each([
    ["invalid", "12.5", 6],
    ["negative", "-1", 6],
    ["zero", "0", 6],
    ["unsupported decimals", "100", 19],
  ])("rejects %s atomic amount input", (_, amountAtomic, tokenDecimals) => {
    expect(() =>
      requiredApprovalsForAmountAtomic(amountAtomic, tokenDecimals),
    ).toThrow(TreasuryDomainError);
  });
});

describe("evaluateTreasuryApprovalPolicy", () => {
  it("denies a 35-token request with zero approvals", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        id: "request-35-zero",
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [],
      }),
      fixedClock(NOW),
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

  it("allows a 35-token request with one valid Captain approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        id: "request-35-one",
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [captainApproval],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("ALLOW");
  });

  it("denies a 120-token request with one approval", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({ approvals: [captainApproval] }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "approval-threshold",
        detail: "1/2 valid approvals collected.",
      }),
    );
  });

  it("allows a 120-token request with a valid Captain and Treasurer", () => {
    const decision = evaluateTreasuryApprovalPolicy(request(), fixedClock(NOW));

    expect(decision.decision).toBe("ALLOW");
  });

  it("denies a Player claiming Captain", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [{ ...playerApproval, role: "Captain" }],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "approver-roster-roles",
        passed: false,
      }),
    );
  });

  it("denies an unknown member", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [
          {
            ...captainApproval,
            memberId: "member-unknown",
          },
        ],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "known-approver-members", passed: false }),
    );
  });

  it("denies an address mismatch", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [
          {
            ...captainApproval,
            memberAddress: treasurerApproval.memberAddress,
          },
        ],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "registered-approver-addresses",
        passed: false,
      }),
    );
  });

  it("denies an inactive Captain", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [
          {
            id: "approval-retired",
            memberId: "member-retired-captain",
            memberAddress: "0x00000000000000000000000000000000000000d0",
            memberName: "Retired Captain",
            role: "Captain",
            createdAt: "2026-07-10T09:03:00.000Z",
          },
        ],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "active-approver-members", passed: false }),
    );
  });

  it("denies duplicate member approvals", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({
        amountAtomic: "35000000",
        displayAmount: "35",
        approvals: [
          captainApproval,
          {
            ...captainApproval,
            id: "approval-captain-duplicate",
          },
        ],
      }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({
        rule: "unique-approver-members",
        passed: false,
      }),
    );
  });

  it("rejects duplicate roster member ids and addresses", () => {
    const duplicateId = () =>
      new InMemoryTreasuryMembershipProvider([
        rosterMember("member-a", captainApproval.memberAddress),
        rosterMember("member-a", treasurerApproval.memberAddress),
      ]);
    const duplicateAddress = () =>
      new InMemoryTreasuryMembershipProvider([
        rosterMember("member-a", captainApproval.memberAddress),
        rosterMember("member-b", captainApproval.memberAddress),
      ]);

    expect(duplicateId).toThrow(TreasuryDomainError);
    expect(duplicateAddress).toThrow(TreasuryDomainError);
  });

  it("denies an expired request exactly at the boundary", () => {
    const clock = fixedClock(new Date("2026-07-11T08:00:00.000Z"));
    const decision = evaluateTreasuryApprovalPolicy(request(), clock);

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "request-not-expired", passed: false }),
    );
  });

  it("denies a rejected request", () => {
    const decision = evaluateTreasuryApprovalPolicy(
      request({ status: "rejected" }),
      fixedClock(NOW),
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.trace).toContainEqual(
      expect.objectContaining({ rule: "request-open", passed: false }),
    );
  });
});

describe("PaymentIntent capability hashing", () => {
  it("creates authorized versioned intents for approved requests", () => {
    const created = intent();

    expect(created.status).toBe("authorized");
    expect(created.capabilityVersion).toBe(1);
    expect(created.amountAtomic).toBe("120000000");
    expect(created.requiredApprovals).toBe(2);
    expect(created.approvalReferences).toEqual([
      {
        approvalId: captainApproval.id,
        memberId: captainApproval.memberId,
        address: "0x00000000000000000000000000000000000000ca",
        role: "Captain",
      },
      {
        approvalId: treasurerApproval.id,
        memberId: treasurerApproval.memberId,
        address: "0x00000000000000000000000000000000000000B0",
        role: "Treasurer",
      },
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
      fixedClock(NOW),
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
        fixedClock(NOW),
      ),
    ).toThrow(/cannot create a usable PaymentIntent/);
  });

  it("creates the same hash for equivalent approval order, address case, and timestamp formatting", () => {
    const first = intent();
    const second = createPaymentIntent(
      {
        request: request({
          approvals: [
            {
              ...treasurerApproval,
              memberAddress: toUpperAddress(treasurerApproval.memberAddress),
            },
            {
              ...captainApproval,
              memberAddress: toUpperAddress(captainApproval.memberAddress),
            },
          ],
        }),
        treasuryAccount: toUpperAddress(TREASURY),
        chainId: 11155111,
        tokenAddress: toUpperAddress(TOKEN),
        recipient: toUpperAddress(RECIPIENT),
        expiresAt: "2026-07-11T08:00:00Z",
        nonce: "nonce-1",
        intentId: "intent-van-rental",
        createdAt: "2026-07-10T10:00:00Z",
      },
      fixedClock(NOW),
    );

    expect(hashPaymentIntent(second)).toBe(hashPaymentIntent(first));
  });

  it("does not change the hash for presentation-only member names", () => {
    const first = intent();
    const renamed = createPaymentIntent(
      {
        request: request({
          approvals: [
            { ...captainApproval, memberName: "Captain Display" },
            { ...treasurerApproval, memberName: "Treasurer Display" },
          ],
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
      fixedClock(NOW),
    );

    expect(hashPaymentIntent(renamed)).toBe(hashPaymentIntent(first));
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
        expiresAt: "2026-07-11T09:00:00.000Z",
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

  it("rejects duplicate approval ids in canonical hashing", () => {
    expect(() =>
      hashPaymentIntent(
        intent({
          approvalReferences: [
            {
              approvalId: "duplicate",
              memberId: "member-alejandro",
              address: captainApproval.memberAddress,
              role: "Captain",
            },
            {
              approvalId: "duplicate",
              memberId: "member-paulina",
              address: treasurerApproval.memberAddress,
              role: "Treasurer",
            },
          ],
        }),
      ),
    ).toThrow(TreasuryDomainError);
  });
});

describe("PaymentIntent expiry and state machine", () => {
  it("allows before expiry and denies request evaluation at expiry", () => {
    const clock = mutableClock(new Date("2026-07-11T07:59:59.999Z"));

    expect(evaluateTreasuryApprovalPolicy(request(), clock).decision).toBe(
      "ALLOW",
    );

    clock.set(new Date("2026-07-11T08:00:00.000Z"));

    expect(evaluateTreasuryApprovalPolicy(request(), clock).decision).toBe(
      "DENY",
    );
  });

  it("rejects intent expiry before creation and later than request expiry", () => {
    expect(() =>
      createPaymentIntent(
        {
          request: request(),
          treasuryAccount: TREASURY,
          chainId: 11155111,
          tokenAddress: TOKEN,
          recipient: RECIPIENT,
          expiresAt: "2026-07-10T09:59:59.000Z",
          nonce: "bad-before",
          createdAt: "2026-07-10T10:00:00.000Z",
        },
        fixedClock(NOW),
      ),
    ).toThrow(TreasuryDomainError);

    expect(() =>
      createPaymentIntent(
        {
          request: request(),
          treasuryAccount: TREASURY,
          chainId: 11155111,
          tokenAddress: TOKEN,
          recipient: RECIPIENT,
          expiresAt: "2026-07-11T08:00:00.001Z",
          nonce: "bad-request-expiry",
        },
        fixedClock(NOW),
      ),
    ).toThrow(TreasuryDomainError);
  });

  it("does not rewrite final states during expiry", () => {
    for (const status of ["expired", "cancelled", "consumed", "confirmed"] as const) {
      expect(
        expirePaymentIntent(
          intent({
            status,
            expiresAt: "2026-07-09T08:00:00.000Z",
          }),
          fixedClock(NOW),
        ).status,
      ).toBe(status);
    }
  });

  it("allows the expected no-broadcast happy path", () => {
    const authorized = intent();
    const policyAllowed = transitionPaymentIntent(authorized, "policy-allowed");
    const quoted = transitionPaymentIntent(policyAllowed, "quoted");
    const prepared = transitionPaymentIntent(quoted, "prepared");
    const signed = transitionPaymentIntent(prepared, "signed");
    const consumed = consumePaymentIntent(signed);

    expect(consumed.status).toBe("consumed");
  });

  it("throws typed domain errors for invalid transitions", () => {
    expect(() => transitionPaymentIntent(intent(), "signed")).toThrow(
      TreasuryDomainError,
    );
  });
});

describe("treasury audit replay", () => {
  it("rebuilds PaymentIntent execution state through IntentConsumed", () => {
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
      receiptId: "proof-receipt-intent-van-rental-12345678",
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
      consumed: true,
      broadcast: false,
      calldataHash:
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      unsignedTransactionHash:
        "0x3333333333333333333333333333333333333333333333333333333333333333",
      tokenContractStatus: "missing-contract",
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

    expect(events.map((event) => event.type)).toContain("IntentConsumed");
    expect(projection).toMatchObject({
      intentId: created.id,
      status: "consumed",
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

function rosterMember(
  memberId: string,
  address: string,
): TreasuryMemberRecord {
  return {
    memberId,
    address,
    name: memberId,
    role: "Captain",
    active: true,
  };
}

function toUpperAddress(address: string): string {
  return `0x${address.slice(2).toUpperCase()}`;
}
