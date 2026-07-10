// Generated from artifacts/wdk-policy-proof.json.
// Do not edit manually.

export const guardedExecutionProof = {
  "ok": true,
  "schemaVersion": 1,
  "generatedAt": "2026-07-10T07:42:07.268Z",
  "sdk": "@tetherto/wdk",
  "walletModule": "@tetherto/wdk-wallet-evm",
  "packageVersions": {
    "@tetherto/wdk": "^1.0.0-beta.13",
    "@tetherto/wdk-wallet-evm": "^1.0.0-beta.15",
    "ethers": "^6.17.0"
  },
  "network": "Sepolia",
  "chainId": 11155111,
  "sourceCommit": "68d09fd335918e2f75dbd1f0cb3381b2fbce6d82",
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
    "hash": "0xc7fe5377ee5f8e6d9d9b290654b1fa3b4230709934e71fbcd2807d8246dc04eb",
    "status": "authorized",
    "nonce": "semi-demo-replay",
    "expiresAt": "2026-07-10T08:42:07.268Z",
    "treasuryAccount": "0x8a904Ef1CeAC3878053F8E5E1e23Da078C61DFd4",
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
  "safeEphemeralAddress": "0x8a904Ef1CeAC3878053F8E5E1e23Da078C61DFd4",
  "scenarios": [
    {
      "id": "insufficient-approvals",
      "title": "Insufficient approvals",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-insufficient-approvals",
      "matchedRule": "deny-unusable-intent-lifecycle",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent is not in an executable lifecycle state.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "exact-authorized-intent",
      "title": "Exact authorized intent",
      "outcome": "ALLOW",
      "policyDecision": "ALLOW",
      "policyId": "cup-treasury-exact-authorized-intent",
      "matchedRule": "allow-exact-payment-intent-signature",
      "reason": "WDK native transaction policy allowed the exact PaymentIntent transaction.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "modified-amount",
      "title": "Changed amount",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "modified-recipient",
      "title": "Changed recipient",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "modified-token",
      "title": "Changed token",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "wrong-chain",
      "title": "Wrong chain",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "wrong-treasury-account",
      "title": "Wrong treasury account",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "wdk-default-deny",
      "reason": "WDK native transaction policy denied the transaction: governed-but-unmatched.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "expired-intent",
      "title": "Expired intent",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-expired-intent",
      "matchedRule": "deny-unusable-intent-lifecycle",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent is not in an executable lifecycle state.",
      "evaluatedAt": "2026-07-10T07:42:07.268Z"
    },
    {
      "id": "first-valid-signing-attempt",
      "title": "First valid signing attempt",
      "outcome": "SIGNED",
      "policyDecision": "ALLOW",
      "policyId": "cup-treasury-one-time-replay",
      "matchedRule": "allow-exact-payment-intent-signature",
      "reason": "WDK allowed and signed the exact provider-derived no-broadcast transaction.",
      "evaluatedAt": "2026-07-10T07:42:08.268Z"
    },
    {
      "id": "second-use-denied",
      "title": "Second use of same intent",
      "outcome": "DENY",
      "policyDecision": "DENY",
      "policyId": "cup-treasury-one-time-replay",
      "matchedRule": "deny-consumed-payment-intent",
      "reason": "WDK native transaction policy denied the transaction: PaymentIntent has already been consumed.",
      "evaluatedAt": "2026-07-10T07:42:09.268Z"
    }
  ],
  "feeQuote": {
    "status": "unsupported",
    "reason": "insufficient funds (transaction={ \"chainId\": \"0xaa36a7\", \"data\": \"0xa9059cbb00000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000007270e00\", \"from\": \"0x8a904ef1ceac3878053f8e5e1e23da078c61dfd4\", \"gas\": \"0x5646\", \"maxFeePerGas\": \"0xd8c5d4a8\", \"maxPriorityFeePerGas\": \"0xf4240\", \"nonce\": \"0x0\", \"to\": \"0x0000000000000000000000000000000000002000\", \"type\": \"0x2\", \"value\": \"0x0\" }, info={ \"error\": { \"code\": -32000, \"message\": \"insufficient funds for transfer\" }, \"payload\": { \"id\": 1, \"jsonrpc\": \"2.0\", \"method\": \"eth_estimateGas\", \"params\": [ { \"chainId\": \"0xaa36a7\", \"data\": \"0xa9059cbb00000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000007270e00\", \"from\": \"0x8a904ef1ceac3878053f8e5e1e23da078c61dfd4\", \"gas\": \"0x5646\", \"maxFeePerGas\": \"0xd8c5d4a8\", \"maxPriorityFeePerGas\": \"0xf4240\", \"nonce\": \"0x0\", \"to\": \"0x0000000000000000000000000000000000002000\", \"type\": \"0x2\", \"value\": \"0x0\" } ] } }, code=INSUFFICIENT_FUNDS, version=6.17.0)"
  },
  "prepared": {
    "intentId": "intent-van-rental",
    "calldataHash": "0xb109ce3afb69c3c2f053e450e89dfa383f6c85d32ee66d9368c0426e4a9905c3",
    "intentHash": "0xc7fe5377ee5f8e6d9d9b290654b1fa3b4230709934e71fbcd2807d8246dc04eb",
    "unsignedTransactionHash": "0xc804698955bea13c85e252f4b20f57aab21048b33405a8f3a3768b29c0c32708",
    "providerDerived": {
      "nonce": 0,
      "gasLimit": "22086",
      "chainId": 11155111,
      "gasPrice": "1818921844",
      "maxFeePerGas": "3636843688",
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
    "signedPayloadHash": "0xb52614b9d9b16b05ff69695bce108b97c655b1fa883f26e9c8852afef64d9ac3",
    "unsignedTransactionHash": "0xc804698955bea13c85e252f4b20f57aab21048b33405a8f3a3768b29c0c32708",
    "broadcast": false
  },
  "executionReceipt": {
    "receiptId": "proof-receipt-intent-van-rental-c8046989",
    "intentId": "intent-van-rental",
    "requestId": "request-van-rental",
    "network": "Sepolia",
    "chainId": 11155111,
    "walletAddress": "0x8a904Ef1CeAC3878053F8E5E1e23Da078C61DFd4",
    "recipient": "0x0000000000000000000000000000000000003000",
    "tokenAddress": "0x0000000000000000000000000000000000002000",
    "tokenSymbol": "MockUSDT",
    "amountAtomic": "120000000",
    "prepared": true,
    "signed": true,
    "consumed": true,
    "broadcast": false,
    "calldataHash": "0xb109ce3afb69c3c2f053e450e89dfa383f6c85d32ee66d9368c0426e4a9905c3",
    "unsignedTransactionHash": "0xc804698955bea13c85e252f4b20f57aab21048b33405a8f3a3768b29c0c32708",
    "tokenContractStatus": "missing-contract",
    "timestamp": "2026-07-10T07:42:08.768Z"
  },
  "auditProjection": {
    "intentId": "intent-van-rental",
    "status": "consumed",
    "prepared": true,
    "signed": true,
    "broadcast": false,
    "updatedAt": "2026-07-10T07:42:08.768Z",
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
  "proofContentHash": "f1311358d45b0db23451d61113ccb43bc5279299b2c3fd269f230dd345dc9d02",
  "proofArtifactSha256": "cf5c94bf9001d422253bb7ea8333cb81725390a23fd22b4b7395ce54c27c2d83"
} as const;
