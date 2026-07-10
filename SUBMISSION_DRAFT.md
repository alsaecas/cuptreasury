# Submission Draft

## Product Name

CupTreasury

## Short Description

CupTreasury is a self-custodial football team treasury for squads and fan groups. It helps teams collect contributions, approve match-day expenses, and turn approved football expenses into exact WDK-governed PaymentIntent capabilities with application-owned one-time consumption and safe no-broadcast receipts.

## Nation

Spain

## Location

Valencia, Spain

## Tracks

WDK only.

Do not select QVAC for this submission. The app includes a local deterministic assistant and QVAC-ready adapter shape, but it does not run QVAC SDK inference.

Do not select Pears/Holepunch/Bare. Those technologies are not used in the current build.

## GitHub Repo

https://github.com/alsaecas/cuptreasury

## Live Demo

https://cuptreasury.vercel.app/

## Demo Video Link

Add after recording the final demo video.

## How It Uses WDK

CupTreasury implements a WDK-guarded treasury payment boundary. The browser adapter visualizes wallet status, treasury wallet info, local balance, PaymentIntent preparation, and safe no-broadcast receipts, while the Node/CI guarded adapter performs real WDK policy evaluation, fee quoting, and no-broadcast signing.

Real WDK work completed:

- Installed `@tetherto/wdk`.
- Installed `@tetherto/wdk-wallet-evm`.
- Extracted a shared WDK smoke verification module (`src/lib/wdk/wdkSmokeVerification.ts`) used by both the CLI smoke test and the GitHub Actions CI workflow.
- Added `scripts/wdk-smoke-test.ts` and `npm run wdk:smoke`.
- Added a React-independent treasury domain model for approval policy, immutable PaymentIntent capabilities, exact hashing, state transitions, receipts, and audit replay.
- Added `src/lib/wdk/guarded/**` for native WDK account-scoped policy registration and ALLOW/DENY evaluation.
- Added `scripts/wdk-policy-demo.ts`, `npm run wdk:policy-demo`, and `npm run wdk:policy-demo:json`.
- The policy demo denies a one-approval 120-token request, allows the exact two-approval PaymentIntent, denies changed amount, recipient, token, chain, account, expiry, and replay attempts, signs without broadcasting, and writes sanitized proof JSON.
- Added `/guarded-execution` to show the generated guarded execution proof, exact intent hash, ALLOW/DENY/SIGNED table, provider-derived transaction fields, placeholder-token status, audit journal, artifact provenance, and browser/Node runtime boundary.
- Added a WDK Verification Methods page at `/wdk-proof` with three sections: CLI/CI smoke test, browser flow, and serverless compatibility check.
- Updated GitHub Actions to run lint, build, tests, WDK smoke proof, WDK policy proof, and upload sanitized artifacts.
- Added a `/api/wdk/smoke` endpoint as a serverless compatibility check that returns `unsupported_runtime` status (WDK native addons cannot bundle for Vercel serverless).
- The smoke test generates an ephemeral seed phrase, registers the EVM wallet manager, derives an account, reads Sepolia native balance through a public RPC, quotes a zero-value transaction fee, signs a message, verifies the signature, and disposes the WDK instance.

What remains browser-only:

- The browser app visualizes the guarded execution result.
- Native WDK wallet operations run in Node/CI, not in the Vercel browser UI.
- The app does not broadcast real treasury payments by default.
- The visible treasury balance is local demo state, not a live on-chain balance.
- No seed phrase or private key is committed, displayed, or stored in browser localStorage.

Production WDK integration would add durable transactional intent consumption, secure wallet material handling, real token configuration, explicit broadcast controls, and explorer tracking.

## How It Uses QVAC

The app does not claim completed QVAC track integration.

The assistant is deterministic local TypeScript logic. It answers from local treasury state and uses no cloud AI APIs, remote inference APIs, model hosting, embeddings APIs, or API keys.

## Football / Global Tournament Fit

CupTreasury is built around football team money workflows:

- Squad contributions
- Away match travel
- Tournament registration
- Tickets
- Equipment and kit
- Team dinners
- Watch-party costs
- Captain and Treasurer approvals
- Fan-group treasury spending

The demo team is Valencia Hackers FC, a Spain-based squad for the Tether Developers Cup.

## Third-Party Services / APIs

Runtime packages:

- Next.js
- React
- Tailwind CSS
- lucide-react icons
- `@tetherto/wdk`
- `@tetherto/wdk-wallet-evm`

Development packages:

- TypeScript
- ESLint
- `tsx`

External services:

- Vercel hosts the live demo.
- `npm run wdk:smoke` uses a public Sepolia RPC endpoint by default.
- The browser MVP itself does not call blockchain APIs.

Cloud AI APIs:

- None

Pre-built UI kits:

- None

## Prior Work Disclosure

No prior CupTreasury code was reused. The idea is inspired by previous experience with payment authorization and Web3 hackathon MVPs, but the CupTreasury implementation was built during this hackathon.

## Teammate / Background

Alejandro Saez Castells is a full-stack engineer with experience building Web3 MVPs, payment authorization flows, identity/access systems, and hackathon products.
