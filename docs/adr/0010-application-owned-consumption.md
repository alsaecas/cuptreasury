# ADR 0010: Application-Owned PaymentIntent Consumption

## Status

Accepted for the hackathon proof.

## Decision

CupTreasury owns one-time PaymentIntent consumption. The semifinal proof uses an in-memory store with per-intent locking inside one Node process, and WDK policy conditions consult that store on every signing simulation.

## Consequences

The first exact no-broadcast signing can consume an intent after signing succeeds. A second use of the same intent is denied by WDK policy. Production must replace the in-memory store with durable transactional storage.
