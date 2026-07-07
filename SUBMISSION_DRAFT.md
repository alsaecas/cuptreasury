# Submission Draft

## Product Name

CupTreasury

## Brief Description

CupTreasury is a self-custodial football team treasury for squads and fan groups. It helps teams collect contributions, approve match-day expenses, and coordinate payments through a WDK-style wallet flow, with a local assistant that explains who owes what and which expenses need approval.

## Nation

Spain

## Location

Valencia, Spain

## Tracks

Primary: WDK

QVAC is not claimed as a completed track in the current build. The app includes a local deterministic assistant and QVAC-ready adapter, but it does not run QVAC SDK inference yet.

Pears/Holepunch/Bare is not used.

## How It Uses WDK

CupTreasury implements a WDK-ready treasury payment boundary in `src/lib/wdk/wdkTreasuryAdapter.ts`. The app routes approved football expenses through adapter methods for wallet status, treasury wallet info, balance, payment preparation, simulated execution, and explorer URL resolution. The current build simulates USDt payment execution and does not move real funds. Real WDK integration would replace the adapter internals with `@tetherto/wdk`, a chain wallet module, secure key handling, provider configuration, transaction policies, and signed payment execution.

## How It Uses QVAC

The app includes a local deterministic assistant and QVAC-ready adapter, but the current submission does not claim completed QVAC track integration.

## Teammate / Background

Alejandro Saez Castells is a full-stack engineer with experience building Web3 MVPs, payment authorization flows, identity/access systems, and hackathon products.

## Third-Party Services / APIs

Runtime packages:

- Next.js
- React
- Tailwind CSS
- lucide-react icons

External runtime services:

- None

Cloud AI APIs:

- None

Blockchain APIs:

- None in the current demo

## Prior Work Disclosure

No prior CupTreasury code was reused. The idea is inspired by previous experience with payment authorization and Web3 hackathon MVPs, but the CupTreasury implementation was built during this hackathon.

## Demo Video Link

TODO

## GitHub Repo

TODO

## Live Demo

TODO
