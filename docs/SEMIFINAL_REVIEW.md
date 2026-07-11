# PR #10 Final Semifinal Review Guide

Final implementation SHA: `b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0`.

Each link below is pinned to that single implementation commit. The separate guide commit contains no implementation changes.

| Item | What it proves and why it matters | Trade-off | Pinned evidence |
| --- | --- | --- | --- |
| 1. MockUSDT | Six-decimal local test token, not official USDt. | Test-only mint role. | [token](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/MockUSDT.sol#L7-L26) |
| 2. Request existence | Phantom request IDs revert. | Append-only request IDs. | [model](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L17-L34) |
| 3. Zero hash | PaymentIntent hash cannot be zero. | Domain supplies the hash. | [validation](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L80-L105) |
| 4. Distinct officers | Captain and Treasurer must differ. | Fixed two-role proof. | [constructor](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L61-L70) |
| 5. Roles/duplicates | Only officers approve; double approval reverts. | Contract roles are authority. | [approval](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L107-L122) |
| 6. Permissionless execution | Any relayer may submit only the fixed approved call for liveness. | Executor is not officer-only. | [execute](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L124-L137), [rationale](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/docs/CONTRACT_ARCHITECTURE.md#L9-L11) |
| 7. Transfer/replay | State updates before SafeERC20 transfer; replay reverts. | No arbitrary-call path. | [protection](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/contracts/src/TeamTreasury.sol#L124-L148) |
| 8. Node harness | Dynamic port, RPC readiness, redacted logs, bounded cleanup. | Local Hardhat only. | [helper](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/lib/localHardhatNode.ts#L13-L92) |
| 9. WDK creation | Captain signs request creation with WDK. | Dev account deploys/funds locally. | [flow](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L37-L45) |
| 10. WDK approvals | Both role approvals are WDK-signed. | Ephemeral accounts. | [calls](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L42-L45) |
| 11. Exact policy | WDK binds account, call, value, nonce, gas, fees, lifecycle and consumption. | App owns consumption store. | [policy](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/src/lib/wdk/contracts/createTeamTreasuryExecutionPolicy.ts#L18-L48) |
| 12. Provider fields | Pending nonce, gas and fees are provider-derived. | Local fee market. | [prepare](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/src/lib/wdk/contracts/prepareTeamTreasuryTransaction.ts#L10-L31) |
| 13. Stored request | Hash/token/recipient/amount/approvals/lifecycle asserted before signing. | Addresses vary per run. | [assertions](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L45-L48) |
| 14. Raw signing | Final raw transaction is `account.signTransaction`. | No browser signer. | [sign](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L49-L51) |
| 15. Local broadcast | Raw transaction broadcasts only to chain 31337. | No public explorer receipt. | [broadcast](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L49-L51) |
| 16. Transfer event | MockUSDT sender/recipient/value parsed. | Local test token. | [event](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L50-L51) |
| 17. Execution event | Request ID and WDK executor parsed. | Ephemeral address. | [event](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L50-L51) |
| 18. Balance deltas | Recipient gets and treasury loses exactly 120000000 atomic units. | Deterministic funding. | [balances](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L47-L51) |
| 19. WDK replay reason | Second simulation is consumed-intent DENY. | Durable production store still needed. | [replay](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L51-L52) |
| 20. Contract replay error | Direct repeat decodes `RequestAlreadyExecuted`. | Permissionless caller used. | [decode](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/wdk-contract-demo.ts#L51-L52) |
| 21. Generated validation | Security outcomes, versions, events and deltas cannot drift. | Run identifiers ignored only. | [check](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/check-contract-proof.ts#L8-L20) |
| 22. Browser proof | Direct no-public-chain proof and local broadcast proof are distinct. | Visualization only. | [UI](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/src/app/guarded-execution/page.tsx#L19-L32), [local proof](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/src/app/guarded-execution/page.tsx#L256-L287) |
| 23. Contract tests | 31 counted invariant assertions. | Custom Node harness. | [harness](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/scripts/contract-test.ts#L14-L75) |
| 24. CI diagnostics | Bounded CI with failure-only redacted node logs. | No retries hide errors. | [CI](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/.github/workflows/ci.yml#L11-L55) |
| 25. Security model | Boundaries and permissionless-liveness trade-off disclosed. | Production custody/state absent. | [security](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/docs/SECURITY_MODEL.md#L3-L12) |
| 26. Reproduction | Full local verification command. | WDK smoke stays read-only separate. | [commands](https://github.com/alsaecas/cuptreasury/blob/b4bf9c03e703bf0f05bdc0d559bf61b6a4908cb0/package.json#L8-L29) |

Run `npm ci && npm run semifinal:verify`. MockUSDT is local/test-only and not official USDt; the proof uses no real funds and no public-chain broadcast.
