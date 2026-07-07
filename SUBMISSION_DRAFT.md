# Submission Draft

## Product Name

CupTreasury

## Short Description

CupTreasury is a self-custodial football team treasury for squads and fan groups. It helps teams collect contributions, approve match-day expenses, and coordinate payments through a WDK-ready wallet flow, with a local assistant that explains who owes what and which expenses need approval.

## Nation

Spain

## Location

Valencia, Spain

## Tracks

WDK

Do not select QVAC for this submission. The app includes a local deterministic assistant and QVAC-ready adapter shape, but it does not run QVAC SDK inference.

Do not select Pears/Holepunch/Bare. Those technologies are not used in the current build.

## GitHub Repo

https://github.com/alsaecas/cuptreasury

## Live Demo

https://cuptreasury.vercel.app/

## Demo Video Link

Add after recording the final demo video.

## How It Uses WDK

CupTreasury implements a WDK-ready treasury payment boundary in `src/lib/wdk/wdkTreasuryAdapter.ts`. The app routes approved football expenses through adapter methods for wallet status, treasury wallet info, balance, payment preparation, simulated execution, and explorer URL resolution.

Real WDK work completed:

- Installed `@tetherto/wdk`.
- Installed `@tetherto/wdk-wallet-evm`.
- Added `scripts/wdk-smoke-test.ts`.
- Added `npm run wdk:smoke`.
- The smoke test generates an ephemeral seed phrase, registers the EVM wallet manager, derives an account, reads Sepolia native balance through a public RPC, quotes a zero-value transaction fee, signs a message, verifies the signature, and disposes the WDK instance.

What remains simulated:

- The browser MVP simulates USDt payment execution.
- The app does not sign or broadcast real treasury payments.
- The visible treasury balance is local demo state, not a live on-chain balance.
- No seed phrase or private key is committed, displayed, or stored in browser localStorage.

Production WDK integration would replace the adapter internals with secure wallet material handling, USDt token configuration, treasury transaction policies, signing, broadcasting, and explorer tracking.

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
