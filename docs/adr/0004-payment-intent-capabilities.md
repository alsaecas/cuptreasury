# ADR 0004: PaymentIntent Capabilities

Status: Accepted

## Context

CupTreasury previously approved expenses in the UI. The semifinal submission needs approved expenses to become exact payment capabilities.

## Decision

Introduce an immutable `PaymentIntent` domain object with chain, account, token, recipient, amount, request id, intent id, nonce, expiry, memo hash, required approvals, and approval ids. Hash the intent with deterministic ABI encoding and Keccak-256.

## Consequences

Judges can verify that changing recipient, token, amount, chain, account, nonce, expiry, memo, or request id changes the capability hash. Domain logic is independent of React.
