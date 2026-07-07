import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import {
  getPendingRequests,
  getPaymentPolicyStatus,
} from "@/lib/treasury/treasuryRules";
import type { TreasuryState } from "@/types/treasury";

interface TreasuryPolicyCardProps {
  state: TreasuryState;
}

export function TreasuryPolicyCard({ state }: TreasuryPolicyCardProps) {
  const pendingRequests = getPendingRequests(state);
  const approvedUnpaid = state.requests.filter(
    (req) => getPaymentPolicyStatus(req) === "ready-for-payment",
  );
  const paidCount = state.requests.filter((req) => req.status === "Paid").length;

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="green">
            <ShieldCheck size={13} aria-hidden="true" />
            Treasury Policy
          </Badge>
          <h2 className="mt-4 text-xl font-bold text-white">
            Payment rules
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Squad governance enforced in the treasury layer
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm leading-6 text-zinc-300">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-lime-200">•</span>
          <span>
            Requests ≤ 100 USDt require <strong>1 approval</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-lime-200">•</span>
          <span>
            Requests &gt; 100 USDt require <strong>2 approvals</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-lime-200">•</span>
          <span>
            Only <strong>Captain</strong> and <strong>Treasurer</strong> can
            approve.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-lime-200">•</span>
          <span>
            Payments can only be prepared after the threshold is met.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-amber-200">•</span>
          <span className="text-zinc-400">
            Browser execution is simulated in the MVP.
          </span>
        </li>
      </ul>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-zinc-400">Pending approvals</span>
          <span className="font-mono font-semibold text-amber-100">
            {pendingRequests.length}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-zinc-400">Ready for payment</span>
          <span className="font-mono font-semibold text-lime-100">
            {approvedUnpaid.length}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-zinc-400">Already paid</span>
          <span className="font-mono font-semibold text-cyan-100">
            {paidCount}
          </span>
        </div>
      </div>
    </section>
  );
}
