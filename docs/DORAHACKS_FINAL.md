# DoraHacks Final Copy

## One sentence

CupTreasury is a WDK-native football treasury where Captain and Treasurer approvals become exact one-time payment capabilities, protected by WDK signer policies and independently enforced by a TeamTreasury smart contract.

## Short description

Grassroots teams manage van rentals, kit, and tournament money in WhatsApp. CupTreasury converts a jointly approved expense into a canonical PaymentIntent, lets WDK guard the exact signing request, and uses TeamTreasury as a second local-chain enforcement layer.

## Technical and security disclosure

WDK is the primary Tether technology: real Node/CI WDK accounts evaluate ALLOW/DENY policies and sign the exact local contract call. TeamTreasury requires Captain/Treasurer approvals and transfers exactly 120 MockUSDT only after its threshold is met. The deterministic proof is local-only on Hardhat chain 31337. MockUSDT is local, test-only, and not official USDt; no real funds, mainnet, or public-testnet broadcast is used. Browser pages visualize generated proof only and contain no wallet secrets. QVAC, Pear, and Holepunch/Bare are not claimed.

## Reproduce

`npm ci && npm run semifinal:verify`

Live demo: https://cuptreasury.vercel.app/

GitHub: https://github.com/alsaecas/cuptreasury

Final judge guide: _add the commit-pinned URL after the final guide commit._

Unlisted YouTube: _add after recording and upload._
