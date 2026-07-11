# Semifinal Finalization Plan

## Baseline (2026-07-11)

- Remote `main` was current at `1819ca4` and the worktree was clean before this branch.
- Node `v26.5.0`, npm `11.17.0`; `npm ci` completed with two moderate audit findings and no high-or-higher finding reported by the requested audit threshold.
- `npm run lint` and `npm run build` passed.
- The existing Vitest baseline had 59 tests, with 4 WDK guarded-execution failures: exact ALLOW and provider-derived paths were denied as non-executable, and broader-DENY precedence reported the account policy ID. This is a pre-existing regression that must be corrected before final verification.
- Foundry/Anvil are installed locally, but not committed or available as a CI dependency. The contract implementation will use pinned npm tooling so CI does not depend on globally installed binaries.

## Mandatory Work

1. Align the product language and runtime disclosures around WDK-native guarded execution.
2. Add a local-only six-decimal MockUSDT and role-governed TeamTreasury.
3. Run a deterministic local-chain proof in which WDK signs the exact final contract call and the provider broadcasts it only to the ephemeral chain.
4. Generate and verify a sanitized browser fixture, integrate it into Guarded Execution, and extend CI.
5. Finalize technical, DoraHacks, and video documentation, then add a separate pinned judge-guide commit.

## Contract Tooling Decision

Use a pinned local Hardhat toolchain and OpenZeppelin contracts through npm. This is reproducible in CI and avoids reliance on the locally installed Foundry binaries. The local chain is Hardhat Network with chain ID `31337`; it is ephemeral, uses development accounts only for deployment/setup, and never targets a public RPC.

## Risks

- WDK beta APIs and native dependencies must successfully sign transactions against the local JSON-RPC chain.
- Provider-derived fee fields can differ by local-chain implementation; policy matching must bind the final fields, not assumptions.
- Generated proof must ignore only ephemeral run identifiers while retaining security invariants.
- Existing WDK policy failures must be resolved without weakening lifecycle or broader-DENY safeguards.

## Verification Gates

- Lint, production build, existing domain/WDK regressions, contract compile/tests, local WDK contract proof, JSON proof invariants, generated-fixture consistency, secret scan, and diff check.
- Browser routes `/`, `/treasury`, `/guarded-execution`, and `/wdk-proof` remain buildable and disclose their runtime boundaries.

## Expected Files

- Landing and proof UI; guarded WDK modules/tests; contracts, Hardhat configuration and contract tests; local proof scripts and generated data; package/CI configuration; README, architecture/security/track/docs, submission text, demo runbook, and final judge guide.
