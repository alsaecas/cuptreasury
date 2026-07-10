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
- `src/app/api/wdk/smoke/route.ts` (serverless compatibility check)
- `src/components/wallet/WdkProofClient.tsx` (WDK verification methods page)
- `src/app/wdk-proof/page.tsx` (route)
- `.github/workflows/wdk-smoke.yml` (CI smoke verification workflow)
- `npm run wdk:smoke`
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

## WDK Verification in the Live App

The in-app WDK verification experience:

- **Route**: `/wdk-proof` (titled "WDK Verification Methods")
- **Three sections**: CLI/CI smoke test (real), browser flow (simulated), serverless compatibility check (unsupported by design)
- **API endpoint**: `/api/wdk/smoke` — returns `unsupported_runtime` status
- **CI workflow**: `.github/workflows/wdk-smoke.yml` — runs on push, PR, and manual dispatch
- **Landing page link**: "See WDK Verification" button
- **Treasury page link**: "View WDK Verification" button in the WDK wallet panel

The `/wdk-proof` page explains:

- Section A — The real WDK CLI/CI smoke test (what it does, how to run it, what it proves).
- Section B — The browser treasury flow (what is simulated, why it is simulated).
- Section C — The Vercel serverless compatibility check (why it is unsupported by design).
- Copy-to-clipboard for `npm run wdk:smoke`.
- Link to the GitHub Actions CI smoke workflow.

The `/api/wdk/smoke` endpoint returns `unsupported_runtime`:

```json
{
  "ok": false,
  "status": "unsupported_runtime",
  "runtime": "vercel_next_serverless",
  "sdk": "@tetherto/wdk",
  "walletModule": "@tetherto/wdk-wallet-evm",
  "message": "WDK smoke verification requires a compatible Node/Bare runtime because of native addons. Use npm run wdk:smoke or the GitHub Actions WDK smoke workflow.",
  "recommendedVerification": "npm run wdk:smoke",
  "broadcast": false,
  "secretsPersisted": false,
  "timestamp": "..."
}
```

## Why Vercel Serverless Is Unsupported

`@tetherto/wdk` depends on `sodium-native`, a native Node.js addon that must be compiled for the target platform. Next.js/Turbopack cannot bundle native addons for Vercel's serverless runtime in the way the WDK SDK expects.

The shared verification module (`src/lib/wdk/wdkSmokeVerification.ts`) works perfectly when run via `tsx` in a local Node.js environment or in GitHub Actions CI. It cannot be imported in a Next.js route handler that gets bundled by Turbopack.

The `/api/wdk/smoke` route serves as a serverless compatibility check — it does not import WDK at build time, so the app compiles and deploys cleanly. It returns `unsupported_runtime` instead of pretending to run.

The real WDK verification paths are:
- CLI: `npm run wdk:smoke`
- CI: GitHub Actions WDK Smoke Verification workflow (`.github/workflows/wdk-smoke.yml`)

## What Failed or Was Not Attempted

- **Vercel serverless WDK execution**: The `/api/wdk/smoke` route returns `unsupported_runtime` because WDK's `sodium-native` native addon cannot be bundled for Vercel serverless. This is documented as expected behavior, not a bug.
- Full browser WDK signing was not attempted because secure key custody is not designed yet.
- Real USDt transfer execution was not attempted because the MVP does not have testnet wallet material, test funds, token contract configuration, or signing policies.
- `@tetherto/wdk-core` could not be installed from npm.
- `@tetherto/wdk-indexer-http` could not be installed from npm.
- npm audit reports two moderate `postcss` advisories through `next@16.2.10`. `npm audit fix --force` was not run because npm says it would install `next@9.3.3`, a breaking downgrade.

## Browser Integration Assessment

Browser integration is possible only with a proper custody design. The current app is a client-only Next.js MVP using localStorage for demo state, so real wallet seed/private-key handling in React state or localStorage would be unsafe and would weaken the submission.

For this pass, the honest integration boundary is:

- Real WDK package installability and Node-side SDK behavior are verified.
- A shared verification module is extracted for reuse across CLI and CI.
- A WDK verification methods page explains the three verification paths (CLI, CI, serverless check).
- A GitHub Actions CI workflow runs lint, build, and smoke test on every push and PR.
- Browser payment execution remains simulated.
- The adapter continues to isolate payment preparation and execution so real WDK signing can replace the simulation later.

## What Is Real in the App

- WDK dependencies are part of the project.
- `npm run wdk:smoke` is a real SDK smoke test.
- The shared verification module (`src/lib/wdk/wdkSmokeVerification.ts`) is real, tested code.
- The adapter status reports that the WDK SDK is installed and smoke-test verified.
- The `/wdk-proof` page provides a judge-friendly explanation of WDK verification methods.
- The GitHub Actions CI workflow publicly verifies the smoke test on every push.
- The product flow uses a stable adapter boundary for wallet/payment behavior.

## What Is Still Simulated

- Browser treasury payment execution
- Dashboard balance
- Demo wallet address
- Transaction hashes shown after simulated payment
- Explorer URL resolution
- In-app `/api/wdk/smoke` execution (returns `unsupported_runtime` on Vercel; real verification is CLI/CI)

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

1. Open the landing page and click "See WDK Verification".
2. Review the three WDK verification methods (CLI/CI, browser flow, serverless check).
3. Return to treasury.
4. Create a match-day expense.
5. Check the Treasury Policy card for live rule application.
6. Approve as Captain or Treasurer.
7. Prepare a safe no-broadcast receipt.
8. Use "Generate Squad Reminder" or ask: "Who still owes money?"
9. Run `npm run wdk:smoke` and `npm run wdk:policy-demo` locally or check CI artifacts to verify the real WDK SDK path.

## Production WDK Next Steps

1. Choose the target USDt network and token contract.
2. Design secure wallet material handling outside React state and localStorage.
3. Add a testnet-funded treasury wallet for judging.
4. Add WDK transaction policies that reflect Captain/Treasurer approvals.
5. Replace `executePayment()` with real WDK token transfer signing.
6. Broadcast only in explicit testnet mode.
7. Return real transaction hashes and explorer URLs.
8. Add automated tests around policy approval and transaction preparation.
