# Semifinal Review Guide

Pinned implementation SHA: `171873b0c0a39e193884ad89ed2695d6cf14311e`

This guide points judges to permanent GitHub line ranges for the WDK-only guarded execution submission. The final guide commit may sit after this SHA, but the links below intentionally target the implementation tree.

Base URL: `https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e`

## What Is Implemented

| Area | What to inspect | Pinned link |
| --- | --- | --- |
| PaymentIntent model | Exact capability fields binding request, treasury account, chain, token, recipient, amount, memo hash, approval ids, expiry, and nonce. | [paymentIntent.ts#L54-L72](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/paymentIntent.ts#L54-L72) |
| Intent hash | Deterministic ABI encoding plus Keccak-256, with hash mismatch assertion. | [paymentIntent.ts#L101-L176](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/paymentIntent.ts#L101-L176) |
| Approval policy | `<= 100` requires one valid Captain/Treasurer approval, `> 100` requires two, duplicate approvers are denied, lifecycle blocks unusable requests. | [treasuryApprovalPolicy.ts#L75-L162](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/treasuryApprovalPolicy.ts#L75-L162) |
| Intent creation | Approved requests become immutable PaymentIntent records; under-approved requests stay `awaiting-approvals`; blocked statuses throw. | [treasuryApprovalPolicy.ts#L164-L200](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/treasuryApprovalPolicy.ts#L164-L200) |
| State machine | PaymentIntent lifecycle transitions are explicit and typed. | [paymentIntentStateMachine.ts#L1-L76](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/paymentIntentStateMachine.ts#L1-L76) |
| WDK setup | Native WDK and EVM wallet module are created in Node, policy is registered account-scoped, and the WDK instance is disposed. | [createTreasuryWdk.ts#L16-L64](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/createTreasuryWdk.ts#L16-L64) |
| WDK policy | Account-scoped policy explicitly denies unusable lifecycle states and allows only the exact prepared ERC-20 `signTransaction` candidate. | [createPaymentIntentPolicy.ts#L81-L117](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/createPaymentIntentPolicy.ts#L81-L117) |
| WDK ALLOW/DENY receipt | Native `account.simulate.signTransaction(...)` output is converted into a safe decision receipt with trace. | [evaluatePaymentIntentWithWdk.ts#L30-L51](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/evaluatePaymentIntentWithWdk.ts#L30-L51) |
| Prepared transaction | App-level preparation encodes ERC-20 transfer calldata and pins `broadcast:false`. WDK beta does not expose a public `prepareTransaction`. | [preparePaymentIntent.ts#L18-L51](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/preparePaymentIntent.ts#L18-L51) |
| Quote and sign | Fee quote uses WDK `quoteSendTransaction`; signing re-simulates policy and stores only a signed payload hash, not a raw key. | [quotePaymentIntent.ts#L10-L32](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/quotePaymentIntent.ts#L10-L32), [signPaymentIntent.ts#L11-L34](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/signPaymentIntent.ts#L11-L34) |
| Execution receipt | Orchestrated proof path simulates policy, quotes, optionally signs, and always returns `broadcast:false`. | [executePaymentIntent.ts#L12-L105](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/executePaymentIntent.ts#L12-L105) |
| Audit journal | Quote, prepare, sign, WDK ALLOW/DENY, and replay projection are represented as deterministic audit events. | [treasuryAuditEvent.ts#L95-L175](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/treasuryAuditEvent.ts#L95-L175) |
| Domain tests | Thresholds, invalid roles, duplicate approvals, blocked statuses, hash tampering, state transitions, and audit replay. | [treasuryApprovalPolicy.test.ts#L90-L470](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/domain/treasury/treasuryApprovalPolicy.test.ts#L90-L470) |
| Native WDK tests | Real WDK policy simulation allows exact intent and denies insufficient approvals, tampered calldata, wrong account, expired/cancelled/consumed intents; signing stays no-broadcast. | [guardedExecution.test.ts#L86-L227](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/lib/wdk/guarded/guardedExecution.test.ts#L86-L227) |
| CI proof | Pull requests run lint, build, tests, WDK smoke proof, WDK policy JSON proof, and upload sanitized artifacts. | [ci.yml#L12-L52](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/.github/workflows/ci.yml#L12-L52) |
| Browser review route | `/guarded-execution` shows the guarded flow, ALLOW/DENY table, proof command, no-broadcast status, audit journal, and runtime boundary. | [page.tsx#L26-L209](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/src/app/guarded-execution/page.tsx#L26-L209) |
| Security model | Threat model, secret lifecycle, exact capability binding, no-broadcast default, MockUSDT disclaimer, and browser/Node boundary. | [SECURITY_MODEL.md#L3-L95](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/docs/SECURITY_MODEL.md#L3-L95) |
| Architecture | Browser, domain, Node/CI, WDK core, EVM wallet module, RPC, and optional contract boundary. | [ARCHITECTURE.md#L1-L119](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/docs/ARCHITECTURE.md#L1-L119) |

## Explicitly Deferred

| Area | Decision | Pinned link |
| --- | --- | --- |
| Smart contract enforcement | Deferred P1. This branch does not claim smart-contract enforcement. | [ADR 0006#L1-L15](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/docs/adr/0006-dual-layer-treasury-enforcement.md#L1-L15) |
| Contract tests | Deferred with the contract layer. The implemented mandatory tests are domain and native WDK policy tests. | [ARCHITECTURE.md#L63-L79](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/docs/ARCHITECTURE.md#L63-L79) |
| WDK-to-contract integration | Deferred with the optional contract flow. Current WDK policy guards direct ERC-20 calldata for the semifinal proof. | [ARCHITECTURE.md#L63-L79](https://github.com/alsaecas/cuptreasury/blob/171873b0c0a39e193884ad89ed2695d6cf14311e/docs/ARCHITECTURE.md#L63-L79) |

## Local Verification

Run:

```bash
npm run semifinal:verify
```

The local run on July 10, 2026 passed lint, production build, 39 Vitest tests, coverage thresholds, WDK smoke proof, human-readable WDK policy proof, and JSON WDK policy proof. Browser workflow verification also passed for `/treasury`, including create request, approve, prepare no-broadcast receipt, generate reminder, and zero browser console errors.
