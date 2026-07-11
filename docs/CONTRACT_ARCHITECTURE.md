# Local Contract Architecture

CupTreasury keeps WDK as the primary signing enforcement layer. TeamTreasury is a second, independent enforcement layer on an ephemeral Hardhat chain (`31337`), never a replacement for WDK.

`PaymentRequest → PaymentIntent hash → exact WDK policy → WDK signature → TeamTreasury.executeRequest → MockUSDT transfer`

MockUSDT is a six-decimal, local test-only ERC-20 and is not official USDt. TeamTreasury uses OpenZeppelin AccessControl, SafeERC20, and ReentrancyGuard. Captain and Treasurer approve a stored request; execution sets state before transferring the exact amount and a second execution reverts.

Execution is permissionless after the approval threshold. This is an intentional liveness trade-off: any relayer may submit the already-approved call, but cannot alter its stored token, recipient, amount, expiry, or PaymentIntent hash.

Reproduce with `npm ci`, `npm run contract:test`, and `npm run wdk:contract-demo:json`. The demo generates fresh WDK contexts, uses local-only development funds for setup, broadcasts only to the ephemeral local JSON-RPC chain, then disposes its WDK contexts.
