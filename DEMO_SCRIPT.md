# CupTreasury Demo Script

Target length: 90-120 seconds. Maximum allowed video length: under 3 minutes.

Live demo: https://cuptreasury.vercel.app/

Repository: https://github.com/alsaecas/cuptreasury

## Script

Open on the landing page.

"This is CupTreasury, a football team treasury built in Valencia, Spain for the Tether Developers Cup. The problem is familiar for grassroots squads and fan groups: team money is usually managed in WhatsApp, with contribution reminders, receipt photos, and payment approvals scattered across chat."

Click Open Demo Treasury.

"Here is Valencia Hackers FC. The squad has a shared USDt treasury, pending contributions, and match-day expenses like away travel, tournament registration, equipment, and team dinner. Alejandro is Captain, Paulina is Treasurer, and Leo and Daniel still owe their squad contributions."

Point to the request list, role selector, and Treasury Policy card.

"CupTreasury is designed around football roles. Captains and Treasurers can approve or reject expenses. The Treasury Policy card shows the current rules: anything above 100 USDt needs two approvals, and only Captain and Treasurer can approve."

Create a request.

"I can create a new match-day expense — for example tickets, travel, kit, equipment, or watch-party costs. The app adds a local risk note from treasury data and keeps the request pending until the right role approves."

Approve and simulate payment.

"Once approved, the request can go through the treasury payment adapter. The browser demo still simulates USDt payment execution, so no real funds move and CupTreasury does not custody private keys."

Open /wdk-proof.

"This page shows the verification methods. The real WDK proof is the CLI/CI smoke test — it uses real @tetherto/wdk and @tetherto/wdk-wallet-evm packages, derives an ephemeral EVM wallet, reads the Sepolia balance, quotes a zero-value fee, signs and verifies a message, and broadcasts nothing."

Scroll to the Vercel serverless section.

"The Vercel serverless compatibility check is unsupported by design because WDK uses native addons like sodium-native. That is why the real proof runs in CLI and CI. The GitHub Actions workflow runs the smoke test automatically."

Return to treasury.

Ask the local assistant: "Who still owes money?" or click "Generate Squad Reminder".

"The assistant answers from local treasury data only. There is no cloud AI API. It can summarize the treasury, explain approvals, flag unusual expenses, and draft reminders. This submission is WDK only."

Close on the dashboard.

"CupTreasury brings self-custody and local assistance to grassroots football money. WDK only track, real CLI/CI smoke test verified, no cloud AI, no overclaims."
