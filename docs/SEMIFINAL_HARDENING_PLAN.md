# Semifinal Hardening Plan

Working branch: `semifinal-guarded-execution`

Existing PR: <https://github.com/alsaecas/cuptreasury/pull/9>

This checklist tracks the strict review hardening pass. P1 contract work stays
deferred unless every P0 item is green.

## P0 Checklist

- [x] Replace frozen and hardcoded clocks with an injected clock.
- [x] Enforce application-owned one-time PaymentIntent consumption.
- [x] Use `amountAtomic` and `tokenDecimals` as the only financial authority.
- [x] Validate approvers against a trusted treasury membership roster.
- [x] Generate the browser proof fixture from the real WDK proof artifact.
- [x] Isolate WDK contexts per proof scenario.
- [x] Remove unnecessary account-policy broader-scope override.
- [x] Harden expiry and state-machine final-state behavior.
- [x] Canonicalize PaymentIntent hashing with `capabilityVersion: 1`.
- [x] Use provider-derived transaction fields or mark unsupported safely.
- [x] Stop describing placeholder token calldata as a functional ERC-20 proof.
- [x] Add tests for each security and correctness fix.
- [x] Restructure CI commands so generated proof freshness is checked.
- [x] Update `/guarded-execution` provenance and scenario display.
- [x] Correct documentation wording and unsupported claims.
- [ ] Regenerate pinned judge-review links after implementation commits.

## Deferred P1

- [ ] Local MockUSDT contract proof.
- [ ] Minimal TeamTreasury contract proof.
- [ ] Optional local-only broadcast test.

## Current Baseline

- `npm ci` passes.
- `npm run semifinal:verify` passes before hardening.
- Baseline tests: 39 passing.
- Known baseline gaps: hardcoded proof dates, no real consumption store,
  trusted roles from request payloads, non-authoritative display amount policy,
  hand-maintained browser proof fixture, shared WDK policy context, synthetic
  transaction fields, and placeholder token ambiguity.
