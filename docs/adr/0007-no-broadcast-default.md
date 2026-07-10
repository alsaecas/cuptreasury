# ADR 0007: No-Broadcast Default

Status: Accepted

## Context

The submission must not move real funds or broadcast by default.

## Decision

Use WDK simulation, fee quote, and no-broadcast signing only. Do not call `sendTransaction` or `transfer` in the proof path. Generated receipts must include `broadcast:false`.

## Consequences

Judges can verify policy and signing capability without funded keys or mainnet risk. Any future testnet broadcast must be explicitly gated by environment configuration.
