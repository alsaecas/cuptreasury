import { afterEach, describe, expect, it } from "vitest";

import {
  createPaymentIntent,
  fixedClock,
  mutableClock,
  type PaymentIntent,
  type TreasuryApproval,
  type TreasuryPaymentRequest,
} from "@/domain/treasury";

import {
  DEFAULT_SEPOLIA_RPC_URL,
  InMemoryPaymentIntentConsumptionStore,
  createTreasuryWdk,
  evaluatePaymentIntentWithWdk,
  executePaymentIntent,
  preparePaymentIntent,
  preparePaymentIntentWithProvider,
  signPaymentIntent,
  type TreasuryWdkContext,
  type WdkEvmAccount,
} from ".";

const NOW = new Date("2026-07-10T10:00:00.000Z");
const TREASURY = "0x0000000000000000000000000000000000001000";
const TOKEN = "0x0000000000000000000000000000000000002000";
const RECIPIENT = "0x0000000000000000000000000000000000003000";
const OTHER = "0x0000000000000000000000000000000000004000";

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

function request(
  approvals: TreasuryApproval[] = [captainApproval, treasurerApproval],
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
    approvals,
    memo: "Van rental for away match",
    createdAt: "2026-07-10T08:00:00.000Z",
    expiresAt: "2026-07-11T08:00:00.000Z",
  };
}

function createIntent(
  treasuryAccount: string,
  overrides: Partial<PaymentIntent> = {},
): PaymentIntent {
  const intent = createPaymentIntent(
    {
      request: request(),
      treasuryAccount,
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
    ...intent,
    ...overrides,
  };
}

describe("WDK guarded PaymentIntent execution", () => {
  let context: TreasuryWdkContext | undefined;

  afterEach(() => {
    context?.dispose();
    context = undefined;
  });

  async function registerIntent(intent: PaymentIntent) {
    if (!context) {
      context = await createTreasuryWdk();
    }

    return context.registerPaymentIntentPolicy(intent, { clock: fixedClock(NOW) });
  }

  it("allows an exact authorized intent through WDK native policy simulation", async () => {
    context = await createTreasuryWdk();
    const intent = createIntent(context.walletAddress);
    const account = await registerIntent(intent);
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      evaluatedAt: "2026-07-10T10:01:00.000Z",
    });

    expect(receipt.decision).toBe("ALLOW");
    expect(receipt.matchedRule).toBe("allow-exact-payment-intent-signature");
    expect(receipt.trace).toContainEqual(
      expect.objectContaining({
        rule: "wdk:cup-treasury-payment-intent-policy-v1/allow-exact-payment-intent-signature",
        passed: true,
      }),
    );
  });

  it("denies insufficient approvals", async () => {
    context = await createTreasuryWdk();
    const underApproved = createPaymentIntent(
      {
        request: request([captainApproval]),
        treasuryAccount: context.walletAddress,
        chainId: 11155111,
        tokenAddress: TOKEN,
        recipient: RECIPIENT,
        expiresAt: "2026-07-11T08:00:00.000Z",
        nonce: "nonce-under-approved",
      },
      fixedClock(NOW),
    );
    const account = await registerIntent(underApproved);
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent: underApproved,
    });

    expect(receipt.decision).toBe("DENY");
    expect(receipt.matchedRule).toBe("deny-unusable-intent-lifecycle");
  });

  it.each([
    [
      "modified amount",
      (intent: PaymentIntent) =>
        preparePaymentIntent({ ...intent, amountAtomic: "121000000" }).transaction,
    ],
    [
      "modified recipient",
      (intent: PaymentIntent) =>
        preparePaymentIntent({ ...intent, recipient: OTHER }).transaction,
    ],
    [
      "modified token",
      (intent: PaymentIntent) =>
        preparePaymentIntent({ ...intent, tokenAddress: OTHER }).transaction,
    ],
    [
      "wrong chain",
      (intent: PaymentIntent) =>
        preparePaymentIntent({ ...intent, chainId: 1 }).transaction,
    ],
  ])("denies %s", async (_, mutate) => {
    context = await createTreasuryWdk();
    const intent = createIntent(context.walletAddress);
    const account = await registerIntent(intent);
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: mutate(intent),
    });

    expect(receipt.decision).toBe("DENY");
  });

  it("denies the wrong treasury account", async () => {
    context = await createTreasuryWdk();
    const intent = createIntent(OTHER);
    const account = await registerIntent(intent);
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
    });

    expect(receipt.decision).toBe("DENY");
  });

  it.each(["expired", "cancelled", "consumed"] as const)(
    "denies %s intents",
    async (status) => {
      context = await createTreasuryWdk();
      const intent = createIntent(context.walletAddress, {
        status,
        expiresAt:
          status === "expired"
            ? "2026-07-09T08:00:00.000Z"
            : "2026-07-11T08:00:00.000Z",
      });
      const account = await registerIntent(intent);
      const receipt = await evaluatePaymentIntentWithWdk({
        account,
        intent,
      });

      expect(receipt.decision).toBe("DENY");
    },
  );

  it("signs an exact prepared transaction without broadcasting", async () => {
    context = await createTreasuryWdk();
    const intent = createIntent(context.walletAddress);
    const account = await registerIntent(intent);
    const prepared = preparePaymentIntent(intent);
    const signing = await signPaymentIntent(account, intent, prepared);

    expect(signing).toMatchObject({
      intentId: intent.id,
      signed: true,
      broadcast: false,
    });
    expect(signing.signedPayloadHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(signing.unsignedTransactionHash).toBe(prepared.unsignedTransactionHash);
  });

  it("evaluates expiry with the current injected clock on every decision", async () => {
    context = await createTreasuryWdk();
    const clock = mutableClock(new Date("2026-07-11T07:59:59.000Z"));
    const intent = createIntent(context.walletAddress);
    const account = await context.registerPaymentIntentPolicy(intent, { clock });

    const beforeExpiry = await evaluatePaymentIntentWithWdk({ account, intent });
    expect(beforeExpiry.decision).toBe("ALLOW");

    clock.set(new Date("2026-07-11T08:00:00.000Z"));

    const afterExpiry = await evaluatePaymentIntentWithWdk({ account, intent });
    expect(afterExpiry.decision).toBe("DENY");
    expect(afterExpiry.matchedRule).toBe("deny-unusable-intent-lifecycle");
  });

  it("consumes a signed intent once and denies a replay", async () => {
    const store = new InMemoryPaymentIntentConsumptionStore();
    const intent = createIntent(TREASURY);
    const prepared = preparePaymentIntent(intent);
    const account = policyAwareFakeAccount(store, intent);

    const first = await executePaymentIntent({
      account,
      intent,
      network: "Sepolia",
      consumptionStore: store,
      prepared,
    });
    const second = await executePaymentIntent({
      account,
      intent,
      network: "Sepolia",
      consumptionStore: store,
      prepared,
    });

    expect(first.policyReceipt.decision).toBe("ALLOW");
    expect(first.executionReceipt).toMatchObject({
      signed: true,
      consumed: true,
      broadcast: false,
    });
    expect(second.policyReceipt.decision).toBe("DENY");
    expect(second.policyReceipt.matchedRule).toBe("deny-consumed-payment-intent");
    expect(second.executionReceipt).toMatchObject({
      signed: false,
      consumed: true,
      broadcast: false,
    });
  });

  it("denies a consumed intent through the real WDK policy path", async () => {
    context = await createTreasuryWdk();
    const store = new InMemoryPaymentIntentConsumptionStore();
    const intent = createIntent(context.walletAddress);
    const prepared = preparePaymentIntent(intent);
    await store.consumeAtomically(intent.id, intent.nonce);
    const account = await context.registerPaymentIntentPolicy(intent, {
      consumptionStore: store,
      expectedTransaction: prepared.transaction,
    });
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: prepared.transaction,
    });

    expect(receipt.decision).toBe("DENY");
    expect(receipt.matchedRule).toBe("deny-consumed-payment-intent");
  });

  it("allows only one concurrent execution attempt to consume the intent", async () => {
    const store = new InMemoryPaymentIntentConsumptionStore();
    const intent = createIntent(TREASURY);
    const prepared = preparePaymentIntent(intent);
    const account = policyAwareFakeAccount(store, intent);

    const results = await Promise.all([
      executePaymentIntent({
        account,
        intent,
        network: "Sepolia",
        consumptionStore: store,
        prepared,
      }),
      executePaymentIntent({
        account,
        intent,
        network: "Sepolia",
        consumptionStore: store,
        prepared,
      }),
    ]);

    expect(results.filter((result) => result.executionReceipt.consumed)).toHaveLength(
      2,
    );
    expect(results.filter((result) => result.executionReceipt.signed)).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.policyReceipt.decision === "ALLOW")).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.policyReceipt.decision === "DENY")).toHaveLength(
      1,
    );
  });

  it("does not consume when signing fails", async () => {
    const store = new InMemoryPaymentIntentConsumptionStore();
    const intent = createIntent(TREASURY);
    const prepared = preparePaymentIntent(intent);
    const account = failingSignerAccount();

    await expect(
      executePaymentIntent({
        account,
        intent,
        network: "Unit",
        consumptionStore: store,
        prepared,
      }),
    ).rejects.toThrow(/sign failed/);

    await expect(store.isConsumed(intent.id, intent.nonce)).resolves.toBe(false);
  });

  it("does not let an account-level exact ALLOW bypass a broader DENY", async () => {
    context = await createTreasuryWdk();
    const intent = createIntent(context.walletAddress);
    await context.registerPaymentIntentPolicy(intent, { clock: fixedClock(NOW) });
    const account = await context.registerPolicy({
      id: "project-emergency-freeze",
      name: "Project emergency freeze",
      scope: "project",
      wallet: context.walletId,
      rules: [
        {
          name: "deny-all-signing-during-freeze",
          operation: "signTransaction",
          action: "DENY",
          reason: "Project-level emergency freeze.",
          conditions: [() => true],
        },
      ],
    });
    const receipt = await evaluatePaymentIntentWithWdk({ account, intent });

    expect(receipt.decision).toBe("DENY");
    expect(receipt.policyId).toBe("project-emergency-freeze");
    expect(receipt.matchedRule).toBe("deny-all-signing-during-freeze");
  });

  it("prepares provider-derived transaction fields and policy-checks the same transaction", async () => {
    context = await createTreasuryWdk();
    const intent = createIntent(context.walletAddress);
    const prepared = await preparePaymentIntentWithProvider(intent, {
      providerUrl: DEFAULT_SEPOLIA_RPC_URL,
      fromAddress: context.walletAddress,
    });
    const account = await context.registerPaymentIntentPolicy(intent, {
      expectedTransaction: prepared.transaction,
      clock: fixedClock(NOW),
    });
    const receipt = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: prepared.transaction,
    });
    const tamperedGas = await evaluatePaymentIntentWithWdk({
      account,
      intent,
      transaction: {
        ...prepared.transaction,
        gasLimit: BigInt(prepared.providerDerived?.gasLimit ?? "0") + BigInt(1),
      },
    });

    expect(prepared.providerDerived).toMatchObject({
      chainId: 11155111,
    });
    expect(prepared.providerDerived?.nonce).toEqual(expect.any(Number));
    expect(BigInt(prepared.providerDerived?.gasLimit ?? "0")).toBeGreaterThan(
      BigInt(0),
    );
    expect(prepared.tokenContract.status).toBe("missing-contract");
    expect(prepared.unsignedTransactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(receipt.decision).toBe("ALLOW");
    expect(tamperedGas.decision).toBe("DENY");
  });
});

function failingSignerAccount(): WdkEvmAccount {
  return {
    getAddress: async () => TREASURY,
    quoteSendTransaction: async () => ({ fee: BigInt(1) }),
    signTransaction: async () => {
      throw new Error("sign failed");
    },
    simulate: {
      signTransaction: async () => ({
        decision: "ALLOW",
        policy_id: "unit-policy",
        matched_rule: "allow",
        reason: "matched",
        trace: [
          {
            scope: "account",
            policy_id: "unit-policy",
            rule_name: "allow",
            matched: true,
          },
        ],
      }),
    },
  };
}

function policyAwareFakeAccount(
  store: InMemoryPaymentIntentConsumptionStore,
  intent: PaymentIntent,
): WdkEvmAccount {
  return {
    getAddress: async () => intent.treasuryAccount,
    quoteSendTransaction: async () => ({ fee: BigInt(1) }),
    signTransaction: async () => "0x02",
    simulate: {
      signTransaction: async () => {
        const consumed = await store.isConsumed(intent.id, intent.nonce);

        return consumed
          ? {
              decision: "DENY",
              policy_id: "unit-policy",
              matched_rule: "deny-consumed-payment-intent",
              reason: "PaymentIntent has already been consumed.",
              trace: [
                {
                  scope: "account",
                  policy_id: "unit-policy",
                  rule_name: "deny-consumed-payment-intent",
                  matched: true,
                },
              ],
            }
          : {
              decision: "ALLOW",
              policy_id: "unit-policy",
              matched_rule: "allow-exact-payment-intent-signature",
              reason: "matched",
              trace: [
                {
                  scope: "account",
                  policy_id: "unit-policy",
                  rule_name: "allow-exact-payment-intent-signature",
                  matched: true,
                },
              ],
            };
      },
    },
  };
}
