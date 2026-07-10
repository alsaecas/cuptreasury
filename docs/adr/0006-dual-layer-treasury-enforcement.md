# ADR 0006: Dual-Layer Treasury Enforcement

Status: Deferred

## Context

A smart contract can add on-chain threshold and execution enforcement, but the semifinal differentiator must remain WDK-centric.

## Decision

Implement the mandatory WDK guarded execution pipeline first. Defer `TeamTreasury` and `MockUSDT` contracts until all mandatory WDK gates are stable.

## Consequences

This branch does not claim smart-contract enforcement. The architecture and security docs show the intended optional layer, but judges should review the WDK policy path as the implemented enforcement layer.
