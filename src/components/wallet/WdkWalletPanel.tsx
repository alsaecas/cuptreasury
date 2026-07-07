import {
  CircleDollarSign,
  ClipboardCheck,
  Copy,
  ExternalLink,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getApprovedUnpaidRequests } from "@/lib/treasury/treasuryRules";
import { formatUsdT } from "@/lib/utils";
import {
  type ExecutedPayment,
  wdkTreasuryAdapter,
} from "@/lib/wdk/wdkTreasuryAdapter";
import type { TreasuryState } from "@/types/treasury";

interface WdkWalletPanelProps {
  state: TreasuryState;
  transactionResult: ExecutedPayment | null;
  busyRequestId: string | null;
  onSimulatePayment: (requestId: string) => void;
}

export function WdkWalletPanel({
  state,
  transactionResult,
  busyRequestId,
  onSimulatePayment,
}: WdkWalletPanelProps) {
  const adapterStatus = wdkTreasuryAdapter.getAdapterStatus();
  const treasuryWallet = wdkTreasuryAdapter.getTreasuryWallet(state.wallet);
  const balance = wdkTreasuryAdapter.getBalance(state.wallet);
  const approvedRequests = getApprovedUnpaidRequests(state);
  const nextPayment = approvedRequests[0];

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="green">
            <ShieldCheck size={13} aria-hidden="true" />
            {adapterStatus.label}
          </Badge>
          <h2 className="mt-4 text-xl font-bold text-white">
            WDK-ready wallet flow
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Self-custodial treasury boundary for squad payments
          </p>
        </div>
        <Wallet className="text-lime-200" size={28} aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-lg border border-lime-300/20 bg-lime-300/10 p-4">
          <p className="text-sm font-semibold text-lime-100">
            {adapterStatus.summary}
          </p>
          <p className="mt-2 text-sm leading-6 text-lime-50/75">
            CupTreasury does not custody team funds in this MVP. The adapter
            models the wallet/payment flow while real treasury signing remains
            a documented integration step.
          </p>
        </div>

        {adapterStatus.nodeSmokeTestAvailable ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-zinc-500">
              Real WDK verification
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Before production treasury payments are enabled, CupTreasury
              verifies the WDK wallet path with a no-funds smoke test. The
              browser MVP still simulates USDt execution.
            </p>
            <Link
              href="/wdk-proof"
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-lime-300/30 bg-lime-300/10 px-3 py-2 text-xs font-semibold text-lime-100 transition-colors hover:bg-lime-300/20"
            >
              <ClipboardCheck size={14} aria-hidden="true" />
              Run WDK Proof
            </Link>
          </div>
        ) : null}

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-zinc-500">Wallet address</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-mono text-sm text-zinc-100">
              {treasuryWallet.address}
            </p>
            <Copy size={16} className="text-zinc-500" aria-hidden="true" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-zinc-500">Network/token</p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">
              {treasuryWallet.network}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-zinc-500">Balance</p>
            <p className="mt-2 font-mono text-xl font-black text-lime-100">
              {formatUsdT(balance.amount)}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{balance.source}</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<CircleDollarSign size={16} aria-hidden="true" />}
          disabled={!nextPayment || busyRequestId === nextPayment?.id}
          onClick={() => nextPayment && onSimulatePayment(nextPayment.id)}
          className="w-full"
        >
          {busyRequestId === nextPayment?.id
            ? "Simulating WDK Payment"
            : "Simulate WDK Payment"}
        </Button>

        {nextPayment ? (
          <p className="text-sm text-zinc-500">
            Next payable request: {nextPayment.title}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            No approved unpaid request is ready for payment.
          </p>
        )}

        {transactionResult ? (
          <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-4">
            <p className="text-sm font-semibold text-cyan-100">
              Simulated transaction result
            </p>
            <p className="mt-2 font-mono text-xs text-cyan-100">
              {transactionResult.txHash}
            </p>
            <p className="mt-2 text-sm leading-6 text-cyan-50/80">
              {transactionResult.message}
            </p>
            {transactionResult.explorerUrl ? (
              <a
                href={transactionResult.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Open explorer
              </a>
            ) : (
              <p className="mt-3 text-xs text-cyan-50/60">
                No explorer URL is available for demo transactions.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
