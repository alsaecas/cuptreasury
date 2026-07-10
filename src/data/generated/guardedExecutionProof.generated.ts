// Generated from artifacts/wdk-policy-proof.json.
// Do not edit manually.

export const guardedExecutionProof = {
  "ok": true,
  "schemaVersion": 1,
  "generatedAt": "2026-07-10T07:55:16.048Z",
  "sdk": "@tetherto/wdk",
  "walletModule": "@tetherto/wdk-wallet-evm",
  "packageVersions": {
    "@tetherto/wdk": "^1.0.0-beta.13",
    "@tetherto/wdk-wallet-evm": "^1.0.0-beta.15",
    "ethers": "^6.17.0"
  },
  "network": "Sepolia",
  "chainId": 11155111,
  "sourceCommit": "2ff29786fd6b0c90ac32bf2e92ab46b8902dee78",
  "workflow": {
    "name": null,
    "runId": null,
    "runUrl": null
  },
  "command": "npm run wdk:policy-demo:json",
  "broadcast": false,
  "secretsPersisted": false,
  "request": {
    "id": "request-van-rental",
    "title": "120-token van rental",
    "amountAtomic": "120000000",
    "displayAmount": "120",
    "tokenSymbol": "MockUSDT",
    "tokenDecimals": 6,
    "approvals": [
      {
        "id": "approval-van-captain",
        "memberId": "member-alejandro",
        "role": "Captain"
      },
      {
        "id": "approval-van-treasurer",
        "memberId": "member-paulina",
        "role": "Treasurer"
      }
    ]
  },
  "capability": {
    "version": 1,
    "intentId": "intent-van-rental",
    "requestId": "request-van-rental",
    "hash": "0xcc740f28733b0afc3f9e093afd471be607d72c08248018690660096b59747a39",
    "status": "authorized",
    "nonce": "semi-demo-replay",
    "expiresAt": "2026-07-10T08:55:16.048Z",
    "treasuryAccount": "0x9091f6e7e6041F80774E50Ea8E70Ffa9f2E97247",
    "tokenAddress": "0x0000000000000000000000000000000000002000",
    "recipient": "0x0000000000000000000000000000000000003000",
    "amountAtomic": "120000000",
    "tokenDecimals": 6,
    "approvalReferences": [
      {
        "approvalId": "approval-van-captain",
        "memberId": "member-alejandro",
        "address": "0x00000000000000000000000000000000000000ca",
        "role": "Captain"
      },
      {
        "approvalId": "approval-van-treasurer",
        "memberId": "member-paulina",
        "address": "0x00000000000000000000000000000000000000B0",
        "role": "Treasurer"
      }
    ]
  },
  "safeEphemeralAddress": "0x9091f6e7e6041F80774E50Ea8E70Ffa9f2E97247",
  "scenarios": [
    {
      "id": "insufficient-approvals",
      "title": "Insufficient approvals",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-insufficient-approvals",
      "matchedRule": "deny-unusable-intent-lifecycle",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent is not in an executable lifecycle state.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "exact-authorized-intent",
      "title": "Exact authorized intent",
      "outcome": "ALLOW",
      "policyDecision": "ALLOW",
      "policyId": "cup-treasury-exact-authorized-intent",
      "matchedRule": "allow-exact-payment-intent-signature",
      "reason": "WDK native transaction policy allowed the exact PaymentIntent transaction.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "modified-amount",
      "title": "Changed amount",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "modified-recipient",
      "title": "Changed recipient",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "modified-token",
      "title": "Changed token",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "wrong-chain",
      "title": "Wrong chain",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "wrong-treasury-account",
      "title": "Wrong treasury account",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "expired-intent",
      "title": "Expired intent",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-expired-intent",
      "matchedRule": "deny-unusable-intent-lifecycle",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent is not in an executable lifecycle state.",
      "evaluatedAt": "2026-07-10T07:55:16.048Z"
    },
    {
      "id": "first-valid-signing-attempt",
      "title": "First valid signing attempt",
      "outcome": "SIGNED",
      "policyDecision": "ALLOW",
      "policyId": "cup-treasury-one-time-replay",
      "matchedRule": "allow-exact-payment-intent-signature",
      "reason": "WDK allowed and signed the exact provider-derived no-broadcast transaction.",
      "evaluatedAt": "2026-07-10T07:55:17.048Z"
    },
    {
      "id": "second-use-denied",
      "title": "Second use of same intent",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-one-time-replay",
      "matchedRule": "deny-consumed-payment-intent",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent has already been consumed.",
      "evaluatedAt": "2026-07-10T07:55:18.048Z"
    }
  ],
  "feeQuote": {
    "status": "unsupported",
    "reason": "missing revert data (action=\"estimateGas\", data=null, reason=null, transaction={ \"data\": \"0xa9059cbb00000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000007270e00\", \"from\": \"0x9091f6e7e6041F80774E50Ea8E70Ffa9f2E97247\", \"to\": \"0x0000000000000000000000000000000000002000\" }, invocation=null, revert=null, code=CALL_EXCEPTION, version=6.17.0)"
  },
  "prepared": {
    "intentId": "intent-van-rental",
    "calldataHash": "0xb109ce3afb69c3c2f053e450e89dfa383f6c85d32ee66d9368c0426e4a9905c3",
    "intentHash": "0xcc740f28733b0afc3f9e093afd471be607d72c08248018690660096b59747a39",
    "unsignedTransactionHash": "0xee752c5c418bf8d4cf8d3eee09ee594d48891ad164e6029eb962f2b3943e736d",
    "providerDerived": {
      "nonce": 0,
      "gasLimit": "22086",
      "chainId": 11155111,
      "gasPrice": "2216164967",
      "maxFeePerGas": "4431329934",
      "maxPriorityFeePerGas": "1000000"
    },
    "tokenContract": {
      "tokenAddress": "0x0000000000000000000000000000000000002000",
      "status": "missing-contract",
      "bytecodePresent": false
    },
    "broadcast": false
  },
  "signed": {
    "intentId": "intent-van-rental",
    "signed": true,
    "signedPayloadHash": "0x824179f53c9740879e7f147e58249cc236036421280327c26d99fd1e470651aa",
    "unsignedTransactionHash": "0xee752c5c418bf8d4cf8d3eee09ee594d48891ad164e6029eb962f2b3943e736d",
    "broadcast": false
  },
  "executionReceipt": {
    "receiptId": "proof-receipt-intent-van-rental-ee752c5c",
    "intentId": "intent-van-rental",
    "requestId": "request-van-rental",
    "network": "Sepolia",
    "chainId": 11155111,
    "walletAddress": "0x9091f6e7e6041F80774E50Ea8E70Ffa9f2E97247",
    "recipient": "0x0000000000000000000000000000000000003000",
    "tokenAddress": "0x0000000000000000000000000000000000002000",
    "tokenSymbol": "MockUSDT",
    "amountAtomic": "120000000",
    "prepared": true,
    "signed": true,
    "consumed": true,
    "broadcast": false,
    "calldataHash": "0xb109ce3afb69c3c2f053e450e89dfa383f6c85d32ee66d9368c0426e4a9905c3",
    "unsignedTransactionHash": "0xee752c5c418bf8d4cf8d3eee09ee594d48891ad164e6029eb962f2b3943e736d",
    "tokenContractStatus": "missing-contract",
    "timestamp": "2026-07-10T07:55:17.548Z"
  },
  "auditProjection": {
    "intentId": "intent-van-rental",
    "status": "consumed",
    "prepared": true,
    "signed": true,
    "broadcast": false,
    "updatedAt": "2026-07-10T07:55:17.548Z",
    "requestId": "request-van-rental",
    "policyDecision": "ALLOW"
  },
  "auditJournal": [
    "PaymentIntentCreated",
    "WdkPolicyAllowed",
    "TransactionPrepared",
    "TransactionSigned",
    "IntentConsumed",
    "WdkPolicyDenied"
  ],
  "disclosures": [
    "The browser visualizes generated Node/CI proof data.",
    "Real WDK native policy simulation and signing run in Node because WDK depends on native runtime capabilities.",
    "The placeholder MockUSDT address has no Sepolia bytecode and is not described as a functional token contract.",
    "No transaction was broadcast.",
    "No seed phrase, private key, mnemonic, or funded wallet is persisted."
  ],
  "proofContentHash": "1ffeafc3cdd4d173543af2f66330332e545c2b7e36a1d52d72ccf3f2f77754b2",
  "proofArtifactSha256": "532dea2737cf3112220f201f55dbd607592c5ea8d367bfd27b2e65c506b202da"
} as const;
