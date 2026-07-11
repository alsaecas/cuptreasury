# Final Demo Runbook (2:35)

- 0:00–0:20 — Explain the WhatsApp problem: shared football money lacks a clear approval boundary.
- 0:20–0:45 — Open Treasury, show the 120-unit van rental, show one approval blocked then the second approval authorizing it.
- 0:45–1:25 — Open Guarded Execution. Show PaymentIntent hash and WDK ALLOW/DENY: changed amount, recipient, and contract calldata are denied.
- 1:25–2:05 — Show the local TeamTreasury proof: two roles, WDK-signed exact execute call, successful local receipt, recipient receives exactly 120 MockUSDT, then WDK and contract replay denial.
- 2:05–2:25 — Show CI commands and the commit-pinned judge guide.
- 2:25–2:35 — Position CupTreasury as WDK-native guarded execution plus independent on-chain treasury enforcement.

Do not read hashes aloud. State every time that MockUSDT is local/test-only, no real funds moved, and the browser is a visualization rather than a wallet runtime.
