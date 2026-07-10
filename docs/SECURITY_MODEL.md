# Security Model

## Threat Model

CupTreasury protects against accidental or malicious drift between an approved football expense and the transaction a wallet is asked to sign. The main threats are:

- Recipient substitution after approval.
- Amount inflation after approval.
- Token contract substitution.
- Wrong treasury account or chain.
- Reuse of an already consumed intent.
- Expired or cancelled intent execution.
- UI-only approval checks that can be bypassed by calling a wallet method directly.
- Secret leakage through logs, JSON artifacts, screenshots, CI, React state, or localStorage.

## Trust Boundaries

- Browser: product visualization, local demo state, and sanitized proof display only.
- Domain layer: deterministic approval, state, hashing, and audit logic.
- Node/CI: real WDK wallet derivation, policy simulation, provider-derived transaction preparation, WDK fee-quote attempts, and no-broadcast signing.
- RPC provider: Sepolia fee and balance data.
- Blockchain: not used for mandatory execution; optional TeamTreasury contract is deferred P1.

## Secret Lifecycle

The WDK proof scripts generate an ephemeral seed phrase in memory with `WDK.getRandomSeedPhrase()`. The seed phrase is never logged, returned, stored in JSON, committed, placed in React state, placed in localStorage, or uploaded as an artifact. The WDK instance is disposed after proof generation.

Generated artifacts may include safe ephemeral addresses, hashes, ALLOW/DENY receipts, fee-quote status, provider-derived unsigned transaction fields, and `broadcast:false`. They must not include private keys, seed phrases, mnemonics, raw signing keys, RPC credentials, API keys, or funded wallets.

## Exact Capability Binding

`PaymentIntent` binds:

- `chainId`
- `treasuryAccount`
- `tokenAddress`
- `recipient`
- `amountAtomic`
- `requestId`
- `intent id`
- `nonce`
- `expiresAt`
- `memoHash`
- `capabilityVersion`
- canonical trusted approval references

`hashPaymentIntent()` normalizes EVM addresses, timestamp values, and approval ordering before deterministic ABI encoding and Keccak-256. Changing any security-bound field changes the hash and fails validation; presentation-only member names are not security-bound.

## Policy Layers

Domain policy checks football treasury rules:

- Requests `<= 100` tokens, calculated from `amountAtomic` and `tokenDecimals`, require one valid Captain/Treasurer approval.
- Requests `> 100` tokens, calculated from `amountAtomic` and `tokenDecimals`, require two valid Captain/Treasurer approvals.
- Approval roles and addresses are validated against the trusted Valencia Hackers FC in-memory roster.
- Unknown, inactive, duplicate member, duplicate address, mismatched address, or mismatched role approvals are denied.
- Rejected, cancelled, paid, expired, or consumed requests cannot create a usable PaymentIntent.
- The existing product rule allows a requester to approve if they are Captain or Treasurer; this is explicitly recorded in the policy trace.

WDK policy checks wallet signing:

- The WDK account policy is account-scoped.
- The governed account is default-deny.
- Only the exact prepared transaction for the current PaymentIntent is allowed.
- Under-approved, expired, cancelled, consumed, changed-recipient, changed-amount, changed-token, wrong-chain, and wrong-account scenarios are denied.
- The account-scoped ALLOW rule does not use `override_broader_scope`; broader project DENY policies still win.

Contract policy:

- Deferred P1. No contract enforcement is claimed in this branch.

## Replay Protection

PaymentIntent includes a unique nonce and lifecycle status. The hackathon proof uses an application-owned in-memory consumption store with per-intent locking inside one Node process. Consumed intents are denied by the WDK policy path, and audit replay preserves `consumed` as a final state. Production requires durable transactional storage.

## Expiry

PaymentIntent expiry is explicit. The WDK policy calls an injected clock on every evaluation and denies expired intents even when the prepared transaction otherwise matches. Intent expiry cannot exceed request expiry.

## No-Broadcast Default

The proof path uses WDK `simulate.signTransaction(...)`, attempts `quoteSendTransaction(...)` when supported by the placeholder transaction, and uses `signTransaction(...)` without broadcasting. It does not call `sendTransaction(...)` or `transfer(...)`. Any future testnet broadcast must be disabled by default and gated by `ENABLE_TESTNET_BROADCAST=true`. Mainnet broadcast is not implemented.

## Mock Token Disclaimer

`MockUSDT` is a test-token label used in local/Sepolia proof material. It is not official USDt. The current Sepolia placeholder address has no bytecode, is marked `missing-contract`, and is not described as a functional token transfer.

## Why Vercel Does Not Execute Native WDK

The WDK proof uses native dependencies and wallet runtime behavior that belong in a compatible Node/CI runtime. The Vercel browser app visualizes sanitized results and does not claim native WDK wallet execution.

## Remaining Production Risks

- Durable server-side intent storage and concurrency controls are needed before real funds.
- RPC provider trust and availability need production handling.
- Signing policy state must be stored and consumed atomically.
- Hardware or custody integration is needed for real treasury operations.
- Formal contract enforcement is deferred.
- No mainnet configuration is present or claimed.
