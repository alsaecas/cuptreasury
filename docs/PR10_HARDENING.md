# PR #10 Hardening

## Exact CI failure

GitHub Actions run `29157915693`, job `86558013765`, failed in **Test local contracts**. `executeRequest(0)` reverted during gas estimation with custom error selector `0x92e50b0c` (`ApprovalThresholdNotMet`). Compilation succeeded; the failure was not a Solidity artifact, Linux/Node 24, or Hardhat startup failure.

## Root cause

The custom harness mixed wall-clock timestamps with local-chain time and reused a cached JSON-RPC provider for sequential nonce/state-sensitive requests. Its success-path assertion could observe a stale local-chain state while the final execution was estimated against the actual node state.

## Chosen fix

The harnesses now share a readiness-checked local Hardhat-node helper with dynamically allocated ports, captured/redacted logs, child-exit detection, explicit chain/account checks, bounded startup/stop behavior, and reliable provider closure. Tests derive expiry from the latest local block and refresh provider state for every provider-derived transaction.

## Tests and remaining risk

New checks cover nonexistent requests, zero PaymentIntent hashes, distinct officers, permissionless execution after approvals, real on-chain request fields, balances, execution/transfer events, and identifiable replay denials. The remaining risk is normal beta-WDK and local-toolchain evolution; the proof is deliberately local-only and production still requires durable intent storage and custody design.
