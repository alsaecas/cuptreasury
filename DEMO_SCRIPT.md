# CupTreasury Demo Script

Target length: 2-3 minutes.

Live demo: https://cuptreasury.vercel.app/

Repository: https://github.com/alsaecas/cuptreasury

## Script

Open on the landing page.

"This is CupTreasury, a football team treasury built in Valencia, Spain for the Tether Developers Cup. The problem is simple: grassroots teams manage money in chat. Contributions, receipts, away-match travel, kit, tickets, and approvals get scattered across WhatsApp."

Open `/treasury`.

"Here is Valencia Hackers FC. Alejandro is Captain, Paulina is Treasurer, and the team has match-day expenses and pending contributions. CupTreasury keeps the football workflow visible: who owes money, which requests are pending, and which roles can approve."

Point to the van-rental request.

"The key expense for this semifinal demo is a 120-unit van rental. Because it is over 100 units, one approval is not enough. CupTreasury now treats approval as the start of a payment capability, not as a UI-only flag."

Open `/guarded-execution`.

"This page visualizes the guarded execution proof. The browser is not claiming native WDK execution. Real WDK operations run in Node and CI, and this page shows the sanitized proof."

Point to the flow.

"The flow is: PaymentRequest, domain approval policy using atomic token amounts and a trusted roster, immutable PaymentIntent, WDK policy evaluation, provider-derived preparation, no-broadcast signing, application-owned consumption, then a safe receipt."

Point to the PaymentIntent hash.

"The PaymentIntent binds the chain, treasury account, token contract, recipient, amount, request id, intent id, nonce, expiry, and memo hash. Any change produces a different hash."

Point to the policy table.

"The real WDK policy demo runs these scenarios. One Captain approval on a 120-unit request is DENY. After the Treasurer approves, the exact intent is ALLOW. If the amount changes, DENY. If the recipient changes, DENY. Expired and reused intents are also denied."

Point to the WDK proof panel.

"Under the hood, the Node proof uses real `@tetherto/wdk` and `@tetherto/wdk-wallet-evm`. It registers account-scoped WDK transaction policies, calls WDK's native `account.simulate.signTransaction(...)`, derives nonce/gas/fee fields from the configured provider, signs without broadcasting, and records when the placeholder token cannot support a functional ERC-20 quote."

Open or mention terminal commands.

"Judges can reproduce it with `npm run wdk:policy-demo`, `npm run wdk:policy-demo:json`, or the full `npm run semifinal:verify`. CI uploads sanitized `wdk-smoke-proof.json` and `wdk-policy-proof.json` artifacts."

Return to treasury and prepare a receipt.

"Back in the browser, the approved request can prepare a safe demo receipt. That does not move funds, does not decrement the live treasury, and does not claim browser-native WDK signing. It is a visualization of the policy-governed flow."

Show `/wdk-proof`.

"The WDK proof page still shows the smoke test: ephemeral EVM derivation, Sepolia balance read, zero-value fee quote, message signing, verification, no broadcast, and no persisted secrets."

Close on `/guarded-execution`.

"CupTreasury is submitted for the WDK-only track. It does not claim QVAC or Pear. The semifinal upgrade is exact guarded execution: approved football expenses become application-consumed one-time WDK payment capabilities, and changed or replayed transactions are rejected before signing."
# Final semifinal demo (2:35)

Start with the grassroots-football money problem, then show the 120-unit van rental: one approval is blocked and Captain plus Treasurer approval authorizes it. Open Guarded Execution to show the PaymentIntent hash and that WDK denies changed amount, recipient, or calldata. Show the deterministic local TeamTreasury proof: two roles approved, WDK signed the exact execute call, the local recipient received exactly 120 MockUSDT, and both WDK and the contract reject replay. Close with CI and the judge guide. Do not read hashes aloud; state that MockUSDT is local/test-only, no real funds moved, and browser pages visualize generated proof rather than run native WDK.
