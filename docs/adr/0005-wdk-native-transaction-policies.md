# ADR 0005: WDK Native Transaction Policies

Status: Accepted

## Context

The installed WDK beta exposes `registerPolicy`, account-scoped policies, default-deny governed accounts, ALLOW/DENY decisions, and runtime `simulate` traces.

## Decision

Use an account-scoped WDK policy over `signTransaction` for the prepared ERC-20 transaction. The browser never claims native WDK execution. The Node/CI proof registers the policy, simulates ALLOW/DENY decisions, quotes the transaction, and signs without broadcasting.

## Consequences

The exact transaction is enforced at the WDK wallet boundary. Quote methods are read-only and not policy-wrapped, so CupTreasury evaluates policy before quoting.
