# Track Compliance

## Selected Tracks

Current recommended submission:

- Primary: WDK
- QVAC: not claimed as a completed track in this build
- Pears/Holepunch/Bare: not used

## What Is Actually Implemented

- Football-themed treasury web app for Valencia Hackers FC in Valencia, Spain.
- Local demo treasury with USDt balance, squad members, roles, contributions, requests, approvals, and activity.
- Role-based approval rules for Captain and Treasurer.
- WDK-ready adapter boundary for wallet status, wallet info, balance, payment preparation, simulated execution, and optional explorer URL.
- Local deterministic assistant that answers from local treasury state.
- No cloud AI API calls.
- No remote inference calls.
- localStorage demo persistence.

## What Is Simulated or Demo

- WDK payments are simulated.
- The wallet address is a placeholder.
- Balance is local demo state, not a chain read.
- Transaction hashes are simulated.
- The assistant is deterministic local logic, not QVAC model inference.

## What Is Not Claimed

- No real transaction execution is claimed.
- No real custody is claimed.
- No real QVAC SDK inference is claimed.
- No Pear/Holepunch/Bare networking is claimed.
- No cloud AI is claimed.

## WDK Integration Status

Status: WDK-ready demo adapter.

Implemented file:

- `src/lib/wdk/wdkTreasuryAdapter.ts`

The adapter exposes:

- `getAdapterStatus()`
- `getTreasuryWallet()`
- `getBalance()`
- `preparePayment()`
- `executePayment()`
- `getExplorerUrl()`

The UI calls this adapter for payment preparation and execution. Real WDK usage still requires installing `@tetherto/wdk`, a wallet module such as `@tetherto/wdk-wallet-evm`, secure key handling, provider configuration, testnet USDt, account derivation, policy registration, and signed transaction execution.

## QVAC Integration Status

Status: QVAC-ready local assistant adapter, not completed QVAC SDK integration.

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

External services:

- None used at runtime.

Cloud AI APIs:

- None.

Blockchain APIs:

- None used in the current demo.

Pre-built components:

- No UI kit is used. UI is custom React/Tailwind.

## No Cloud AI API Confirmation

Repository search was performed for OpenAI, Anthropic, Gemini, LangChain, AI SDK, embeddings API, remote inference, fetch calls to AI services, and API keys. No cloud AI provider integration is present in the app code.

## Limitations

- WDK SDK is not installed in the runtime app.
- Real wallet signing is not implemented.
- QVAC SDK is not installed in the runtime app.
- No local model files are bundled.
- Demo state is stored in localStorage.
- No authentication or multi-device sync.
- No production custody guarantees.

## Next Steps for Real Tether Stack Integration

WDK:

1. Install `@tetherto/wdk` and a wallet module.
2. Create a secure key custody flow.
3. Configure a testnet provider and USDt token contract.
4. Add WDK transaction policies for treasury approvals.
5. Replace simulated execution with signed WDK transactions.

QVAC:

1. Install `@qvac/sdk` in an environment that can run local models.
2. Add model lifecycle and local inference setup.
3. Keep prompts and treasury data on-device.
4. Replace deterministic answers with QVAC SDK inference.

Pear:

1. Only add if real peer-to-peer sync is needed.
2. Use Pear/Holepunch/Bare for team-to-team local-first treasury sync.
3. Do not claim Pears until actual networking exists.
