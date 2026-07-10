# Semifinal Implementation Plan

Branch: `semifinal-guarded-execution`

Baseline completed before edits:

- `pwd`
- `git status`
- `git branch`
- `git remote -v`
- `git log -5 --oneline`
- `node --version`
- `npm --version`
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm run wdk:smoke`

## Mandatory P0 Work

1. Add a React-independent treasury domain layer for approval policy, immutable PaymentIntent creation, exact capability hashing, state transitions, receipts, and audit events.
2. Add Vitest-based test infrastructure with `npm test`, `npm run test:watch`, and `npm run test:coverage`.
3. Implement WDK guarded execution in Node-compatible modules using installed `@tetherto/wdk` and `@tetherto/wdk-wallet-evm` APIs:
   - Register an EVM wallet module.
   - Register an account-scoped transaction policy.
   - Simulate ALLOW/DENY decisions with WDK's runtime `account.simulate` mirror.
   - Quote ERC-20 transfer fees through WDK.
   - Prepare a deterministic ERC-20 transaction object.
   - Sign only when explicitly requested by the safe no-broadcast demo.
   - Never broadcast by default.
4. Add `scripts/wdk-policy-demo.ts` with readable console output and sanitized JSON proof generation.
5. Add an append-only audit journal plus deterministic replay tests.
6. Add `/guarded-execution` to visualize the real Node/CI proof without claiming browser-native WDK execution.
7. Update CI to run lint, build, tests, WDK smoke, and WDK policy proof generation.
8. Add `npm run semifinal:verify` as the mandatory aggregate verification command.
9. Update README, semifinal docs, security docs, ADRs, submission draft, and demo script.
10. Commit the implementation, create commit-pinned review links, then commit the judge guide separately.

## Optional P1 Smart-Contract Work

Only start after all mandatory gates pass:

- `npm run lint`
- `npm run build`
- `npm test`
- `npm run wdk:smoke`
- `npm run wdk:policy-demo`
- `npm run wdk:policy-demo:json`
- `npm run semifinal:verify`

If time and stability allow, add a minimal non-upgradeable `TeamTreasury` contract and clearly named `MockUSDT` test token. If the mandatory WDK path is not stable, do not add contracts.

## Test Gates

- Domain approval policy tests for threshold, roles, duplicates, invalid request statuses, consumed intents, and request tampering.
- PaymentIntent hash tests for every bound field.
- State machine tests for valid and invalid transitions.
- Audit replay tests for deterministic reconstruction.
- WDK adapter tests where the SDK can be exercised safely without funds or broadcast.
- End-to-end policy-to-receipt integration test:
  PaymentRequest -> two trusted approvals -> PaymentIntent -> exact ALLOW -> tamper/replay DENY -> provider-derived prepare -> quote attempt -> no-broadcast sign -> consume -> receipt.
- Coverage thresholds for critical pure domain modules.

## Risks

- WDK beta APIs may differ from docs; implementation must use installed type definitions as the source of truth.
- WDK policy enforcement wraps write methods (`transfer`, `sendTransaction`, `signTransaction`, etc.), but fee quote methods are read-only and not policy-wrapped. CupTreasury must evaluate policy before quoting.
- `account.simulate` exists at runtime but is not typed on the account return type in this beta, so a local narrow interface is required.
- There is no separate WDK "prepare transaction" API in the installed EVM wallet. CupTreasury prepares the unsigned transaction with provider-derived nonce, gas, fee, and chain fields, then uses WDK simulation/signing around that exact object.
- Browser WDK execution remains unsupported because native dependencies belong in Node/CI for this submission.
- Sepolia RPC availability can affect live fee quotes. Tests should isolate pure logic; scripts should report safe failures honestly.

## Files Expected To Change

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `.gitignore`
- `.github/workflows/ci.yml`
- `.github/workflows/wdk-smoke.yml`
- `src/domain/treasury/**`
- `src/lib/wdk/guarded/**`
- `src/app/guarded-execution/page.tsx`
- `src/components/**`
- `scripts/wdk-policy-demo.ts`
- `scripts/wdk-smoke-test.ts`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_MODEL.md`
- `docs/WDK_API_RESEARCH.md`
- `docs/SEMIFINAL_IMPLEMENTATION_PLAN.md`
- `docs/SEMIFINAL_REVIEW.md`
- `docs/adr/0004-payment-intent-capabilities.md`
- `docs/adr/0005-wdk-native-transaction-policies.md`
- `docs/adr/0006-dual-layer-treasury-enforcement.md`
- `docs/adr/0007-no-broadcast-default.md`
- `docs/adr/0008-mockusdt-test-token.md`
- `README.md`
- `SUBMISSION_DRAFT.md`
- `DEMO_SCRIPT.md`
