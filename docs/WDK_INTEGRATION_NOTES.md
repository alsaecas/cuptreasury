# WDK Integration Notes

## Goal

Achieve the smallest real WDK integration that improves CupTreasury's WDK submission credibility without destabilizing the deployed MVP or overclaiming real payment execution.

## Official Sources Checked

- WDK docs: https://docs.wdk.tether.io/
- Node.js and Bare quickstart: https://docs.wdk.tether.io/start-building/nodejs-bare-quickstart/
- WDK core API reference: https://docs.wdk.tether.io/sdk/core-module/api-reference/
- Core getting started guide: https://docs.wdk.tether.io/sdk/core-module/guides/getting-started/
- Wallet registration guide: https://docs.wdk.tether.io/sdk/core-module/guides/wallet-registration/
- EVM wallet API reference: https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm/api-reference/
- GitHub: https://github.com/tetherto/wdk
- GitHub: https://github.com/tetherto/wdk-wallet-evm
- npm package metadata for `@tetherto/wdk`
- npm package metadata for `@tetherto/wdk-wallet-evm`
- npm package metadata for `@tetherto/wdk-wallet-btc`
- npm package metadata for `@tetherto/wdk-wallet-solana`
- npm package metadata for `@tetherto/wdk-wallet-tron`

## Package Findings

- Correct core package: `@tetherto/wdk`
- Installed version: `1.0.0-beta.13`
- EVM wallet package: `@tetherto/wdk-wallet-evm`
- Installed version: `1.0.0-beta.15`
- The docs mention WDK working in Node.js, Bare, and React Native.
- The official quickstart demonstrates Node.js/Bare first.
- A browser treasury signing path would require careful secret handling and should not be bolted into the current client-only MVP.
- `@tetherto/wdk-core` was mentioned by one package README as a recommendation, but `npm view @tetherto/wdk-core` returned 404. The working package is `@tetherto/wdk`.
- `@tetherto/wdk-indexer-http` appeared in GitHub/docs search results, but `npm view @tetherto/wdk-indexer-http` returned 404.

## Commands Run

```bash
npm view @tetherto/wdk version description dist-tags exports --json
npm view @tetherto/wdk-wallet-evm version description dist-tags dependencies peerDependencies exports --json
npm view @tetherto/wdk-wallet-btc version description dist-tags dependencies peerDependencies exports --json
npm view @tetherto/wdk-wallet-solana version description dist-tags dependencies peerDependencies exports --json
npm view @tetherto/wdk-wallet-tron version description dist-tags dependencies peerDependencies exports --json
npm view @tetherto/wdk-core version description dist-tags exports --json
npm view @tetherto/wdk-indexer-http version description dist-tags dependencies peerDependencies exports --json
npm install @tetherto/wdk @tetherto/wdk-wallet-evm
npm install -D tsx
npm run wdk:smoke
```

## What Worked

Added:

- `@tetherto/wdk`
- `@tetherto/wdk-wallet-evm`
- `tsx`
- `scripts/wdk-smoke-test.ts`
- `src/lib/wdk/wdkSmokeVerification.ts` (shared module)
- `src/app/api/wdk/smoke/route.ts` (API endpoint)
- `src/components/wallet/WdkProofClient.tsx` (in-app proof page)
- `src/app/wdk-proof/page.tsx` (route)
- `npm run wdk:smoke`

The smoke test performs these real WDK actions:

1. Generates an ephemeral WDK seed phrase in memory.
2. Creates a WDK instance.
3. Registers the EVM wallet manager for Sepolia.
4. Derives account index 0.
5. Reads the account's native Sepolia balance.
6. Quotes a zero-value transaction fee.
7. Signs a local CupTreasury smoke-test message.
8. Verifies the signature.
9. Disposes the WDK instance.

The smoke test does not:

- Persist seed material
- Log the seed phrase
- Use real funds
- Broadcast transactions
- Require API keys
- Change browser demo state

## WDK Proof in the Live App

The in-app WDK proof experience:

- **Route**: `/wdk-proof`
- **API endpoint**: `/api/wdk/smoke`
- **Landing page link**: "Run WDK Proof" button
- **Treasury page link**: "Run WDK Proof" button in the WDK wallet panel

The `/wdk-proof` page explains:

- What the WDK verification proves (real SDK packages, wallet derivation, balance read, fee quote, sign/verify).
- What remains simulated (browser payment execution, dashboard balance, USDt signing/broadcasting).
- Why the verification is safe (no funds moved, no secrets persisted, no transaction broadcast).
- The CLI verification command: `npm run wdk:smoke`.

The `/api/wdk/smoke` endpoint returns an honest status:

```json
{
  "ok": false,
  "sdk": "@tetherto/wdk",
  "walletModule": "@tetherto/wdk-wallet-evm",
  "error": "WDK SDK requires native Node.js addons (sodium-native) that are incompatible with Next.js serverless bundling. The real WDK verification is available locally via the CLI smoke test: npm run wdk:smoke",
  "broadcast": false,
  "secretsPersisted": false,
  "timestamp": "..."
}
```

## Why the API Cannot Run WDK on Vercel

`@tetherto/wdk` depends on `sodium-native`, a native Node.js addon that must be compiled for the target platform. Next.js/Turbopack cannot bundle native addons for Vercel's serverless runtime in the way the WDK SDK expects.

The shared verification module (`src/lib/wdk/wdkSmokeVerification.ts`) works perfectly when run via `tsx` in a local Node.js environment (the CLI smoke test). It cannot be imported in a Next.js route handler that gets bundled by Turbopack.

The API route exists to demonstrate the intent and to provide an honest entry point that documents the limitation.

## What Failed or Was Not Attempted

- **Vercel serverless WDK execution**: The `/api/wdk/smoke` route cannot import `@tetherto/wdk` at build time due to `sodium-native` native addon bundling failure.
- Full browser WDK signing was not attempted because secure key custody is not designed yet.
- Real USDt transfer execution was not attempted because the MVP does not have testnet wallet material, test funds, token contract configuration, or signing policies.
- `@tetherto/wdk-core` could not be installed from npm.
- `@tetherto/wdk-indexer-http` could not be installed from npm.
- npm audit reports two moderate `postcss` advisories through `next@16.2.10`. `npm audit fix --force` was not run because npm says it would install `next@9.3.3`, a breaking downgrade.

## Browser Integration Assessment

Browser integration is possible only with a proper custody design. The current app is a client-only Next.js MVP using localStorage for demo state, so real wallet seed/private-key handling in React state or localStorage would be unsafe and would weaken the submission.

For this pass, the honest integration boundary is:

- Real WDK package installability and Node-side SDK behavior are verified.
- A shared verification module is extracted for reuse across CLI and API.
- An in-app proof page explains the WDK verification path to judges.
- Browser payment execution remains simulated.
- The adapter continues to isolate payment preparation and execution so real WDK signing can replace the simulation later.

## What Is Real in the App

- WDK dependencies are part of the project.
- `npm run wdk:smoke` is a real SDK smoke test.
- The shared verification module (`src/lib/wdk/wdkSmokeVerification.ts`) is real, tested code.
- The adapter status reports that the WDK SDK is installed and smoke-test verified.
- The `/wdk-proof` page provides a judge-friendly explanation of the WDK path.
- The product flow uses a stable adapter boundary for wallet/payment behavior.

## What Is Still Simulated

- Browser treasury payment execution
- Dashboard balance
- Demo wallet address
- Transaction hashes shown after simulated payment
- Explorer URL resolution
- In-app `/api/wdk/smoke` execution (returns honest failure on Vercel)

## How Judges Can Verify

```bash
npm install
npm run lint
npm run build
npm run wdk:smoke
```

Then open:

- https://cuptreasury.vercel.app/
- https://cuptreasury.vercel.app/treasury
- https://cuptreasury.vercel.app/wdk-proof

Judge flow:

1. Open the landing page and click "Run WDK Proof".
2. Review the WDK verification explanation.
3. Return to treasury.
4. Create a match-day expense.
5. Check the Treasury Policy card for live rule application.
6. Approve as Captain or Treasurer.
7. Simulate payment execution.
8. Use "Generate Squad Reminder" or ask: "Who still owes money?"
9. Run `npm run wdk:smoke` locally to verify the real WDK SDK path.

## Production WDK Next Steps

1. Choose the target USDt network and token contract.
2. Design secure wallet material handling outside React state and localStorage.
3. Add a testnet-funded treasury wallet for judging.
4. Add WDK transaction policies that reflect Captain/Treasurer approvals.
5. Replace `executePayment()` with real WDK token transfer signing.
6. Broadcast only in explicit testnet mode.
7. Return real transaction hashes and explorer URLs.
8. Add automated tests around policy approval and transaction preparation.
