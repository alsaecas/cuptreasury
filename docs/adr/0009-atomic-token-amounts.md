# ADR 0009: Atomic Token Amounts

## Status

Accepted.

## Decision

Treasury approval thresholds use `amountAtomic` and `tokenDecimals` only. Display amounts are derived and cannot weaken policy requirements.

## Consequences

The 100-token threshold is compared as `BigInt(amountAtomic) > parseUnits("100", tokenDecimals)`. Invalid, zero, negative, or unsupported-decimal amounts are rejected before intent creation.
