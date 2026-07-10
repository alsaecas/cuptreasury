# WDK API Research

Research date: 2026-07-10

Installed package versions:

- `@tetherto/wdk@1.0.0-beta.13`
- `@tetherto/wdk-wallet-evm@1.0.0-beta.15`

Primary sources checked:

- Installed type definitions in `node_modules/@tetherto/wdk/types/**`
- Installed runtime source in `node_modules/@tetherto/wdk/src/**`
- Installed type definitions in `node_modules/@tetherto/wdk-wallet-evm/types/**`
- Installed runtime source in `node_modules/@tetherto/wdk-wallet-evm/src/**`
- Official WDK transaction policy guide: https://docs.wdk.tether.io/sdk/core-module/guides/transaction-policies/
- Official WDK transaction guide: https://docs.wdk.tether.io/sdk/core-module/guides/transactions/
- Official EVM wallet API reference: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm/api-reference/

## Findings

| Intended capability | Package | Exact API or type | Exists in installed version | CupTreasury use | Limitation or trade-off |
| --- | --- | --- | --- | --- | --- |
| Wallet manager creation | `@tetherto/wdk` | `new WDK(seed)` | Yes | Create an ephemeral Node-only WDK instance for proofs. | Seed phrase is generated in memory and never logged or persisted. |
| EVM wallet registration | `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` | `wdk.registerWallet("ethereum", WalletManagerEvm, { provider, chainId })` | Yes | Register Sepolia EVM wallet module for guarded execution demos. | Browser execution is not claimed. |
| Account derivation | `@tetherto/wdk` | `wdk.getAccount("ethereum", 0)` | Yes | Derive ephemeral treasury account. | Account material is disposed after the script. |
| Transaction-policy registration | `@tetherto/wdk` | `wdk.registerPolicy(policy, options?)` | Yes | Register a PaymentIntent policy before deriving the governed account. | Policy must be registered after the wallet identifier exists. |
| Account-scoped policies | `@tetherto/wdk` | `Policy.scope: "account"`, `wallet`, `accounts: [0]` | Yes | Bind the allowed capability to account index `0`. | Index matching applies to `getAccount(wallet, index)`; path matching is needed for `getAccountByPath`. |
| ALLOW / DENY decisions | `@tetherto/wdk` | `PolicyRule.action: "ALLOW" | "DENY"` | Yes | Exact approved intent gets `ALLOW`; tampered or invalid intents get `DENY`. | WDK condition functions are app-owned JavaScript predicates. |
| Default-deny semantics | `@tetherto/wdk` | Governed account proxy default-denies wrapped writes without matching `ALLOW` | Yes | Only exact approved PaymentIntent signing operations are permitted. | Read and quote methods are not wrapped, so policy evaluation must run before quote. |
| Policy decision trace | `@tetherto/wdk` | `SimulationResult.trace` and `SimulationTraceEntry` | Yes | Convert WDK simulation traces into safe reviewable receipts. | Trace includes rule ids and match state, not custom per-field diagnostics. CupTreasury adds a domain trace around exact field checks. |
| Simulated or dry-run policy operation | `@tetherto/wdk` | Runtime `account.simulate.<method>(...)` | Yes | Use `account.simulate.signTransaction(...)` to dry-run the prepared ERC-20 transaction without invoking wallet writes. | `simulate` is runtime-added and not typed on the returned account type in this beta. A local narrow interface is required. |
| Fee quote for native EVM transaction | `@tetherto/wdk-wallet-evm` | `account.quoteSendTransaction(tx)` | Yes | Existing smoke test uses zero-value native quote. | Requires a provider and live RPC. |
| Fee quote for ERC-20 transfer | `@tetherto/wdk-wallet-evm` | `account.quoteTransfer({ token, recipient, amount })`; `account.quoteSendTransaction(tx)` for prepared ERC-20 calldata | Yes | Quote the exact prepared ERC-20 transfer transaction before optional signing. | Quote is read-only and not WDK policy-wrapped; CupTreasury runs policy simulation first. |
| Transaction preparation | `@tetherto/wdk-wallet-evm` | No public `prepareTransaction` API; internal `_getTransferTransaction` exists but is protected/private API | No public API | CupTreasury prepares a deterministic ERC-20 `transfer(address,uint256)` transaction object in its adapter and labels it as app-level preparation. | Do not claim a native WDK prepare API. |
| Transaction signing without broadcast | `@tetherto/wdk-wallet-evm` | `account.signTransaction(tx)` | Yes | Optional safe signing path for no-broadcast proof receipts. | Signing a partially populated tx can fail unless fee/nonce/gas fields are provided by the caller. Use a zero-value self-transaction with explicit fields for a reliable safe proof, or record a safe failure honestly. |
| Broadcasting | `@tetherto/wdk-wallet-evm` | `account.sendTransaction(tx)`, `account.transfer(options)` | Yes | Not used by default. | Any testnet broadcast must require `ENABLE_TESTNET_BROADCAST=true`; mainnet broadcast is not implemented. |
| Arbitrary EVM calldata | `@tetherto/wdk-wallet-evm` | `EvmTransaction.data`, `sendTransaction`, `signTransaction`, `quoteSendTransaction` | Yes | Prepare ERC-20 calldata and optionally contract calldata in future P1 work. | WDK does not decode calldata in policies; CupTreasury policy conditions inspect structured transfer options and prepared tx hashes. |
| ERC-20 transfer execution | `@tetherto/wdk-wallet-evm` | `transfer({ token, recipient, amount })` | Yes | Not used for execution because it would broadcast. CupTreasury prepares ERC-20 calldata and policy-checks/signs `signTransaction` instead. | Calling `transfer` would broadcast; the demo does not call it. |
| Account disposal | `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` | `wdk.dispose()`, `account.dispose()` | Yes | Dispose the WDK instance after each proof script. | Account disposal is available, but centralizing disposal through `wdk.dispose()` is simpler for the script. |
| Secret-manager integration | Installed packages | No separate secret manager API exported by installed packages | No | Use ephemeral in-memory seed only. | Do not claim secret-manager integration. |
| Address validation utilities | Installed packages | No WDK-exported address validator found; EVM module returns checksummed addresses | No direct WDK utility | Use local EVM address normalization via `ethers` only where needed because it is already a dependency of the EVM wallet package. | Do not claim WDK address validation utilities. |
| Asset registry integration | Installed packages | `@tetherto/wdk-asset-registry` not installed | No | Not used in this submission. | Do not claim asset-registry integration. |

## WDK Policy Model To Use

CupTreasury will create a default-deny account-scoped policy with a single exact ALLOW rule for the current immutable `PaymentIntent`. The rule will match only when:

- operation is `signTransaction` for the prepared ERC-20 transaction
- chain id is the PaymentIntent chain
- account address is the PaymentIntent treasury account
- token contract is the PaymentIntent token address
- recipient is the PaymentIntent recipient
- amount is the PaymentIntent atomic amount
- intent status is not expired, cancelled, consumed, or otherwise unusable
- intent hash matches the canonical immutable capability hash

The implementation will use WDK native `simulate` results for ALLOW/DENY and trace. CupTreasury will add its own safe domain-policy trace for approval and exact-capability checks. It will not label app-generated trace rows as SDK-native trace rows.

## No Upgrade Decision

No package upgrade is needed for the mandatory WDK path. The installed versions already expose native policy registration, account-scoped policies, simulation, ALLOW/DENY decisions, traces, fee quotes, account disposal, and transaction signing.
