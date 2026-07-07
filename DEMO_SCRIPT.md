# CupTreasury Demo Script

Target length: 90-120 seconds. Maximum allowed video length: under 3 minutes.

## Script

Open on the landing page.

"This is CupTreasury, a football team treasury built in Valencia, Spain for the Tether Developers Cup. The problem is familiar for grassroots squads and fan groups: team money is usually managed in WhatsApp, with contribution reminders, receipt photos, and payment approvals scattered across chat."

Click Open Demo Treasury.

"Here is Valencia Hackers FC. The squad has a shared USDt treasury, pending contributions, and match-day expenses like away travel, tournament registration, equipment, and team dinner. Alejandro is Captain, Paulina is Treasurer, and Leo and Daniel still owe their squad contributions."

Point to the request list and role selector.

"CupTreasury is designed around football roles. Captains and Treasurers can approve or reject expenses. Anything above 100 USDt needs two approvals. Smaller match-day costs need one approval."

Create a request.

"I can create a new match-day expense, for example tickets, travel, kit, equipment, or watch-party costs. The app adds a local risk note from treasury data and keeps the request pending until the right role approves."

Approve and simulate payment.

"Once approved, the request can go through the WDK-ready payment adapter. This demo simulates USDt payment execution, so no real funds move and CupTreasury does not custody private keys. The adapter is the place where real WDK wallet-manager calls, policies, signing, and testnet USDt execution would be wired in."

Ask the local assistant: "Who still owes money?"

"The assistant answers from local treasury data only. There is no cloud AI API. It can summarize the treasury, explain approvals, flag unusual expenses, and draft reminders. The QVAC SDK integration is a next step, so this build should be submitted as WDK primary rather than claiming completed QVAC inference."

Close on the dashboard.

"CupTreasury brings self-custody and private local assistance to grassroots football money."
