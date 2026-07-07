# CupTreasury

CupTreasury is a self-custodial football team treasury for squads, fan groups, and tournament teams. It helps a team collect contributions, approve match-day expenses, simulate treasury payment execution, and explain status with a local deterministic assistant.

Live demo:
https://cuptreasury.vercel.app/

Repository:
https://github.com/alsaecas/cuptreasury

- Nation: Spain
- Location: Valencia, Spain
- Hackathon: Tether Developers Cup
- Primary track: WDK only
- Secondary track: none
- License: Apache 2.0

WDK verification:

- UI explanation: https://cuptreasury.vercel.app/wdk-proof
- CLI: `npm run wdk:smoke`
- CI: [![WDK Smoke Verification](https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml/badge.svg)](https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml)

## What It Does

Grassroots football teams often manage shared money in WhatsApp: contribution reminders, receipt screenshots, away match travel, team dinners, ticket pools, kit, equipment, and tournament registration. That gets messy fast.

CupTreasury gives the squad one browser-based treasury view:

- Who paid and who still owes squad contributions
- Which match-day expenses are pending
- Captain and Treasurer approval flow
- WDK-ready self-custodial payment boundary
- Local assistant answers from local treasury data
- In-app WDK verification proof page

The demo squad is Valencia Hackers FC at the Tether Developers Cup.

## Current Implementation

- Polished landing page and `/treasury` judge flow
- In-app WDK proof verification at `/wdk-proof`
- API endpoint at `/api/wdk/smoke` (returns honest status; WDK native addons prevent Vercel execution)
- Valencia Hackers FC treasury dashboard
- Member roles: Captain, Treasurer, Player, Fan
- Contribution status: Paid, Pending, Partial
- Payment requests for football/tournament expenses
- Local deterministic risk note for new requests
- Approval rules:
  - Above 100 USDt requires two approvals
  - 100 USDt or below requires one approval
  - Only Captain and Treasurer can approve/reject
- Payment policy card displaying live rule application
- Demo payment execution after approvals
- WDK wallet/payment panel with honest adapter status
- Local deterministic assistant for treasury questions
- Squad Reminder generator with copy-to-clipboard
- localStorage persistence and reset demo data

## WDK Status

WDK integration files:

- `src/lib/wdk/wdkTreasuryAdapter.ts` — browser adapter boundary
- `src/lib/wdk/wdkSmokeVerification.ts` — shared server-side smoke logic
- `scripts/wdk-smoke-test.ts` — CLI smoke test entry point
- `src/app/api/wdk/smoke/route.ts` — in-app API endpoint
- `src/components/wallet/WdkWalletPanel.tsx` — treasury WDK panel
- `src/components/wallet/WdkProofClient.tsx` — WDK proof page UI
- `src/app/wdk-proof/page.tsx` — WDK proof route

The adapter exposes:

- `getAdapterStatus()`
- `getTreasuryWallet()`
- `getBalance()`
- `preparePayment()`
- `executePayment()`
- `getExplorerUrl()`

What is real:

- `@tetherto/wdk` is installed.
- `@tetherto/wdk-wallet-evm` is installed.
- `scripts/wdk-smoke-test.ts` performs a no-funds Node smoke test.
- The shared module `src/lib/wdk/wdkSmokeVerification.ts` is used by both the CLI smoke test and the API route.
- The smoke test generates an ephemeral seed phrase, registers an EVM wallet module, derives an account, reads Sepolia native balance through a public RPC, quotes a zero-value transaction fee, signs a message, verifies the signature, and disposes the WDK instance.
- The live app includes a `/wdk-proof` page that explains WDK verification methods and links to the CLI smoke test.
- The `/api/wdk/smoke` endpoint is a serverless compatibility check that reports `unsupported_runtime` because WDK's sodium-native addon cannot be bundled for Vercel's serverless runtime.
- A GitHub Actions WDK Smoke Verification workflow runs the smoke test on push, PR, and manual dispatch. See the CI badge above.

Run:

```bash
npm run wdk:smoke
```

Open in-app:

```
https://cuptreasury.vercel.app/wdk-proof
```

What is still simulated:

- Browser treasury payment execution is simulated.
- No real USDt transaction is signed or broadcast by the app.
- The dashboard balance is local demo state, not a live treasury balance.
- The demo wallet address is a placeholder.
- No seed phrase, private key, or real wallet material is stored in React state or localStorage.

Why this matters:

The app now demonstrates real WDK package installability and a minimal real SDK path without risking secret handling in the deployed MVP. Production payment execution still needs secure key custody, token contract configuration, testnet funds, treasury transaction policies, signing, broadcasting, and explorer tracking.

See:

- `docs/WDK_INTEGRATION_NOTES.md`
- `docs/TRACK_COMPLIANCE.md`

## QVAC Status

QVAC is not claimed as a completed track in this build.

The local assistant boundary lives in:

- `src/lib/qvac/qvacTreasuryAssistant.ts`

Current status: local deterministic assistant and QVAC-ready adapter shape.

It supports:

- Summarize treasury
- Who still owes money
- Detect unusual expenses
- Generate Squad Reminder (WhatsApp-style message with copy button)
- Explain pending approvals

The current app does not run `@qvac/sdk`, local model inference, embeddings, RAG, speech, multimodal inference, remote inference, or any cloud AI API.

## Football Use Case

CupTreasury is intentionally not a generic crypto wallet. It is shaped around:

- Away match travel
- Tournament registration
- Team dinner after match
- Kit and equipment
- Match tickets
- Prize pool
- Fan group wallet
- Watch-party expenses
- Squad contribution reminders
- Captain and Treasurer approvals

No real club logos, FIFA/UEFA marks, player images, or copyrighted football assets are used.

## Local Setup

Package manager: npm.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Checks:

```bash
npm run lint
npm run build
npm run wdk:smoke
```

The browser demo requires no environment variables.

Optional smoke-test overrides:

```bash
WDK_SMOKE_EVM_RPC_URL=https://sepolia.drpc.org
WDK_SMOKE_EVM_CHAIN_ID=11155111
```

## Judge Demo Flow

1. Open https://cuptreasury.vercel.app/
2. Open the Valencia Hackers FC treasury.
3. Review balance, members, pending contributions, and payment requests.
4. Create a match-day expense.
5. Approve it as Captain or Treasurer.
6. Check the Treasury Policy card for live rule application.
7. Simulate payment execution.
8. Open /wdk-proof and review the WDK verification path.
9. Ask the local assistant: "Who still owes money?" or use "Generate Squad Reminder".

## Architecture

```text
src/
  app/
    page.tsx
    treasury/page.tsx
    wdk-proof/page.tsx
    api/wdk/smoke/route.ts
  components/
    ai/
    landing/
    treasury/
    ui/
    wallet/
  data/
    demoTreasury.ts
  lib/
    qvac/qvacTreasuryAssistant.ts
    treasury/treasuryRules.ts
    treasury/treasuryStorage.ts
    wdk/wdkSmokeVerification.ts
    wdk/wdkTreasuryAdapter.ts
  types/
    treasury.ts
scripts/
  wdk-smoke-test.ts
docs/
  TRACK_COMPLIANCE.md
  WDK_INTEGRATION_NOTES.md
```

## Third-Party Services, APIs, and Components

Runtime dependencies:

- Next.js
- React
- Tailwind CSS
- lucide-react icons
- `@tetherto/wdk`
- `@tetherto/wdk-wallet-evm`

Development dependencies:

- TypeScript
- ESLint
- Next.js ESLint config
- `tsx`

External services:

- Vercel hosts the live demo.
- `npm run wdk:smoke` uses a public Sepolia RPC endpoint by default.
- The browser app itself does not call blockchain APIs in the current MVP.

Cloud AI APIs:

- None

Pre-built UI kits:

- None. UI components are custom Tailwind/React components.

## Known Limitations

- Browser payment execution is simulated.
- No real USDt transaction is signed or broadcast.
- The `/api/wdk/smoke` endpoint returns `unsupported_runtime` status (WDK native addons cannot bundle for Vercel serverless).
- QVAC SDK inference is not implemented.
- No authentication.
- No backend database.
- Browser localStorage is used for demo persistence.
- The wallet address shown in the browser is a demo placeholder.
- The app is not production custody software.

## Prior Work Disclosure

No prior CupTreasury code was reused. The idea is inspired by practical experience with payment authorization flows, Web3 MVPs, and hackathon product design, but this implementation was built for this hackathon workspace.

## License

Apache License 2.0. See `LICENSE`.
