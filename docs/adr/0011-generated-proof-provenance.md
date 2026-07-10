# ADR 0011: Generated Proof Provenance

## Status

Accepted.

## Decision

The `/guarded-execution` page imports a generated TypeScript fixture created from `artifacts/wdk-policy-proof.json`. The source artifact is produced by the real WDK policy demo, and the generated fixture carries commit, timestamp, content hash, and artifact hash provenance.

## Consequences

Browser proof scenarios are no longer manually duplicated. CI runs a consistency check that ignores intentionally variable live values while still verifying scenario outcomes, capability schema, token status, broadcast status, and secret-persistence claims.
