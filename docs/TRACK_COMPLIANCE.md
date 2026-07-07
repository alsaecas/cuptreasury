# Track Compliance

## Selected Tracks

Recommended submission:

- Primary: WDK
- QVAC: not claimed as a completed track
- Pears/Holepunch/Bare: not used

## Public Links

- Repository: https://github.com/alsaecas/cuptreasury
- Live demo: https://cuptreasury.vercel.app/

## What Is Actually Implemented

- Football-themed treasury web app for Valencia Hackers FC in Valencia, Spain.
- Local demo treasury with USDt balance, squad members, roles, contributions, requests, approvals, and activity.
- Role-based approval rules for Captain and Treasurer.
- WDK-ready adapter boundary for wallet status, wallet info, balance, payment preparation, simulated execution, and optional explorer URL.
- Real WDK packages installed: `@tetherto/wdk` and `@tetherto/wdk-wallet-evm`.
- Node-side WDK smoke test in `scripts/wdk-smoke-test.ts`.
- Smoke test performs ephemeral EVM account derivation, Sepolia native balance read, zero-value transaction fee quote, message signing, and signature verification.
- Local deterministic assistant that answers from local treasury state.
- No cloud AI API calls.
- No remote inference calls.
- localStorage demo persistence.

## What Is Simulated or Demo

- Browser treasury payments are simulated.
- The browser wallet address is a placeholder.
- The dashboard balance is local demo state, not a live chain read.
- Transaction hashes in the browser are simulated.
- The assistant is deterministic local logic, not QVAC model inference.

## What Is Not Claimed

- No real browser transaction execution is claimed.
- No real production custody is claimed.
- No live treasury balance is claimed.
- No real QVAC SDK inference is claimed.
- No Pear/Holepunch/Bare networking is claimed.
- No cloud AI is claimed.

## WDK Integration Status

Status: real WDK package integration with Node smoke test; browser payment execution remains simulated.

Implemented files:

- `src/lib/wdk/wdkTreasuryAdapter.ts`
- `scripts/wdk-smoke-test.ts`

The adapter exposes:

- `getAdapterStatus()`
- `getTreasuryWallet()`
- `getBalance()`
- `preparePayment()`
- `executePayment()`
- `getExplorerUrl()`

The UI calls this adapter for payment preparation and execution. The adapter reports that the WDK SDK is installed and that a Node smoke test is available, but it also reports that real transactions are not enabled.

Run:

```bash
npm run wdk:smoke
```

Expected behavior:

- Generates an ephemeral seed phrase in memory.
- Registers `@tetherto/wdk-wallet-evm` with `@tetherto/wdk`.
- Derives account index 0.
- Reads Sepolia native balance from a public RPC.
- Quotes a zero-value transfer fee.
- Signs and verifies a local message.
- Disposes the WDK instance.
- Does not persist seed material.
- Does not broadcast a transaction.

Real signed USDt execution still requires secure key custody, provider/testnet configuration, token contract configuration, test funds, transaction policies, signing, broadcasting, and explorer tracking.

## QVAC Integration Status

Status: QVAC-ready local assistant adapter shape, not completed QVAC SDK integration.

Implemented file:

- `src/lib/qvac/qvacTreasuryAssistant.ts`

The current assistant uses deterministic local functions. It does not use `@qvac/sdk`, model loading, embeddings, RAG, speech, multimodal inference, remote inference, or cloud AI.

Because the QVAC rule requires AI work to run through QVAC SDK on the user's device, this build should not be submitted as a completed QVAC track project.

## Pear Status

Pears/Holepunch/Bare is not used. The project should not be submitted to the Pears track in its current form.

## Third-Party Services and APIs Disclosure

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
- Next.js ESLint config
- `tsx`

External services:

- Vercel hosts the live demo.
- `npm run wdk:smoke` uses a public Sepolia RPC endpoint by default.
- The browser MVP itself does not call blockchain APIs.

Cloud AI APIs:

- None

Pre-built components:

- No UI kit is used. UI is custom React/Tailwind.

## No Cloud AI API Confirmation

Repository search was performed for OpenAI, Anthropic, Gemini, LangChain, AI SDK, embeddings API, remote inference, fetch calls to AI services, and API keys. No cloud AI provider integration is present in the app code.

## Limitations

- Browser payment execution is simulated.
- Real wallet signing is not implemented in the browser MVP.
- QVAC SDK is not installed in the runtime app.
- No local model files are bundled.
- Demo state is stored in localStorage.
- No authentication or multi-device sync.
- No production custody guarantees.

## Next Steps for Production WDK Integration

1. Choose the target USDt network and token contract.
2. Add secure wallet material handling outside React state and localStorage.
3. Add testnet funding and provider configuration.
4. Register WDK transaction policies aligned with Captain/Treasurer approvals.
5. Replace simulated `executePayment()` with signed WDK transfer logic.
6. Add explorer URL tracking for submitted transactions.
7. Add a testnet-only mode for hackathon judging.

## Next Steps for QVAC

1. Install `@qvac/sdk` in an environment that can run local models.
2. Add model lifecycle and local inference setup.
3. Keep prompts and treasury data in the local runtime.
4. Replace deterministic answers with QVAC SDK inference.
