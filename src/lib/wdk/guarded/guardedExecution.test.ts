import { afterEach, describe, expect, it } from "vitest";

import {
  createPaymentIntent,
  type PaymentIntent,
  type TreasuryApproval,
  type TreasuryPaymentRequest,
} from "@/domain/treasury";

import {
  createTreasuryWdk,
  evaluatePaymentIntentWithWdk,
  preparePaymentIntent,
  signPaymentIntent,
  type TreasuryWdkContext,
} from ".";

const NOW = new Date("2026-07-10T10:00:00.000Z");
const TOKEN = "0x0000000000000000000000000000000000002000";
const RECIPIENT = "0x0000000000000000000000000000000000003000";
const OTHER = "0x0000000000000000000000000000000000004000";

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
  approvals: TreasuryApproval[] = [captainApproval, treasurerApproval],
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
    NOW,
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

    return context.registerPaymentIntentPolicy(intent);
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
      NOW,
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
  });
});
