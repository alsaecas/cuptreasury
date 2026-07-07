# CupTreasury

CupTreasury is a self-custodial football team treasury for squads, fan groups, and tournament teams. It helps a team collect contributions, approve match-day expenses, simulate wallet payments through a WDK-ready adapter, and explain treasury status with a local deterministic assistant.

- Nation: Spain
- Location: Valencia, Spain
- Hackathon: Tether Developers Cup

## Hackathon Context

CupTreasury is built for the football and global tournament theme. The demo squad is Valencia Hackers FC at the Tether Developers Cup.

Selected track for the current submission:

- Primary: WDK
- QVAC: not claimed as a completed track in this build
- Pears/Holepunch/Bare: not used

The app includes a QVAC-ready local assistant adapter, but it does not currently run `@qvac/sdk` or local model inference. No cloud AI APIs are used.

## Pitch

Grassroots football teams often manage shared money in WhatsApp: contribution reminders, screenshots, receipts, away match travel, team dinners, ticket pools, watch-party costs, kit, equipment, and tournament registration. That gets messy fast.

CupTreasury gives the squad one browser-based treasury view:

- Who paid and who still owes squad contributions
- Which match-day expenses are pending
- Captain and Treasurer approval flow
- WDK-ready self-custodial payment adapter
- Local assistant answers from local treasury data

## What Is Implemented

- Polished landing page with judge demo flow
- Valencia Hackers FC treasury dashboard
- Member roles: Captain, Treasurer, Player, Fan
- Contribution status: Paid, Pending, Partial
- Payment requests for football/tournament expenses
- Create request modal with local risk note
- Approval rules:
  - Above 100 USDt requires two approvals
  - 100 USDt or below requires one approval
  - Only Captain and Treasurer can approve/reject
- Simulated WDK payment execution after approvals
- WDK wallet/payment panel with adapter status
- Local deterministic assistant for treasury questions
- localStorage persistence and reset demo data

## WDK Explanation

The WDK boundary lives in:

- `src/lib/wdk/wdkTreasuryAdapter.ts`

It defines:

- `WdkAdapterStatus`
- `TreasuryWallet`
- `TreasuryBalance`
- `PreparedPayment`
- `ExecutedPayment`
- `getAdapterStatus()`
- `getTreasuryWallet()`
- `getBalance()`
- `preparePayment()`
- `executePayment()`
- `getExplorerUrl()`

Current status: demo adapter. The UI calls the adapter to prepare and execute payments, but real `@tetherto/wdk` wallet-manager calls are not enabled yet.

Why this is honest:

- No seed phrase or private key is stored in React state or localStorage.
- No real funds move.
- CupTreasury does not custody team funds.
- The adapter is typed and replaceable with real WDK account derivation, policy, quoting, signing, and transaction execution.

To make this real WDK:

1. Install `@tetherto/wdk` and a chain wallet module such as `@tetherto/wdk-wallet-evm`.
2. Add secure seed/key handling outside browser localStorage.
3. Configure a provider and testnet USDt.
4. Register wallet managers and transaction policies.
5. Replace `executePayment()` with a signed WDK transaction flow.

## QVAC Explanation

The local assistant boundary lives in:

- `src/lib/qvac/qvacTreasuryAssistant.ts`

Current status: QVAC-ready local deterministic adapter.

It supports:

- Summarize treasury
- Who still owes money
- Detect unusual expenses
- Generate WhatsApp reminder
- Explain pending approvals

The current app does not claim completed QVAC track integration because it does not run `@qvac/sdk` or local model inference. It uses no cloud AI API, no remote inference, no embeddings API, and no API keys.

To make this real QVAC:

1. Install `@qvac/sdk` in a runtime that can load local models on the user's device.
2. Load a small local model through QVAC SDK.
3. Keep treasury prompts and data on-device.
4. Replace deterministic assistant responses with QVAC local inference while preserving the same adapter methods.

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

## Architecture

```text
src/
  app/
    page.tsx
    treasury/page.tsx
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
    wdk/wdkTreasuryAdapter.ts
  types/
    treasury.ts
docs/
  TRACK_COMPLIANCE.md
```

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
```

## Deployment

The app is a Next.js App Router project and can be deployed to Vercel.

Manual deployment checklist:

1. Push to a public GitHub repository.
2. Import the repository into Vercel.
3. Deploy with the default Next.js settings.
4. Add the live URL to the DoraHacks submission.

No environment variables are required for the current demo.

## Judge Demo Flow

1. Open the landing page.
2. Click Open Demo Treasury.
3. Review balance, members, pending contributions, and payment requests.
4. Create a match-day expense.
5. Approve it as Captain or Treasurer.
6. Simulate WDK payment.
7. Ask the local assistant: "Who still owes money?"

## Screenshots

Add screenshots before submission:

- Landing page
- Treasury dashboard
- Create request modal
- WDK payment result
- Local assistant answer

## Third-Party Services, APIs, and Components

Runtime dependencies:

- Next.js
- React
- Tailwind CSS
- lucide-react icons

Development dependencies:

- TypeScript
- ESLint
- Next.js ESLint config

External runtime APIs:

- None

Cloud AI APIs:

- None

Pre-built UI kits:

- None. UI components are custom Tailwind/React components.

## Prior Work Disclosure

No prior CupTreasury code was reused. The idea is inspired by practical experience with payment authorization flows, Web3 MVPs, and hackathon product design, but this implementation was built for this hackathon workspace.

## Known Limitations

- WDK execution is simulated.
- QVAC SDK inference is not implemented.
- No authentication.
- No backend database.
- Browser localStorage is used for demo persistence.
- The wallet address is a demo placeholder.
- The app is not production custody software.

## License

Apache License 2.0. See `LICENSE`.
