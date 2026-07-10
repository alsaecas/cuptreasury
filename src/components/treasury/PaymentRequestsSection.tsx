import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  canApprove,
  canSimulatePayment,
  getPaymentPolicyLabel,
  getPaymentPolicyStatus,
  remainingApprovals,
  requiredApprovals,
} from "@/lib/treasury/treasuryRules";
import { formatShortDate, formatUsdT } from "@/lib/utils";
import type { Member, PaymentRequest } from "@/types/treasury";

interface PaymentRequestsSectionProps {
  requests: PaymentRequest[];
  activeMember: Member;
  busyRequestId: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onSimulatePayment: (requestId: string) => void;
}

const statusTone = {
  Pending: "amber",
  Approved: "green",
  Prepared: "blue",
  Rejected: "red",
  Paid: "blue",
} as const;

const riskTone = {
  Normal: "green",
  Review: "amber",
  Unusual: "red",
} as const;

export function PaymentRequestsSection({
  requests,
  activeMember,
  busyRequestId,
  onApprove,
  onReject,
  onSimulatePayment,
}: PaymentRequestsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Payment requests</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Match-day expenses, approval thresholds, local risk notes, and
            payment state
          </p>
        </div>
        <Badge tone="neutral">{requests.length} total</Badge>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => {
          const approvalsRequired = requiredApprovals(request.amount);
          const approvalsRemaining = remainingApprovals(request);
          const alreadyApprovedBySigner = request.approvals.some(
            (approval) => approval.memberId === activeMember.id,
          );
          const approveAllowed =
            request.status === "Pending" &&
            canApprove(activeMember.role) &&
            !alreadyApprovedBySigner;
          const rejectAllowed =
            request.status === "Pending" && canApprove(activeMember.role);
          const paymentAllowed = canSimulatePayment(request);
          const isBusy = busyRequestId === request.id;

          return (
            <article
              key={request.id}
              className="rounded-lg border border-white/10 bg-zinc-950 p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[request.status]}>
                      {request.status}
                    </Badge>
                    <Badge tone={riskTone[request.aiRiskLevel]}>
                      <ShieldAlert size={13} aria-hidden="true" />
                      {request.aiRiskLevel}
                    </Badge>
                    <Badge tone="neutral">{request.category}</Badge>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">
                    {request.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {request.description}
                  </p>
                  <p className="mt-3 text-sm text-zinc-500">
                    Requested by {request.requestedByName} on{" "}
                    {formatShortDate(request.createdAt)}
                  </p>
                </div>

                <div className="min-w-44 lg:text-right">
                  <p className="font-mono text-3xl font-black text-lime-100">
                    {formatUsdT(request.amount)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {request.approvals.length}/{approvalsRequired} approvals
                  </p>
                  {request.receiptId ? (
                    <p className="mt-2 font-mono text-xs text-cyan-200">
                      Receipt ID: {request.receiptId}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-zinc-300">
                  Local assistant note
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {request.aiNote}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-xs font-semibold text-zinc-500">
                  {getPaymentPolicyLabel(getPaymentPolicyStatus(request))}
                </span>
                {approvalsRemaining === 0 && request.status !== "Paid" && request.status !== "Rejected" ? (
                  <span className="ml-auto text-xs text-lime-200">
                    {request.approvals.length}/{approvalsRequired} collected
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  {approvalsRemaining === 0 ? (
                    <CheckCircle2
                      size={16}
                      className="text-lime-200"
                      aria-hidden="true"
                    />
                  ) : (
                    <Clock3
                      size={16}
                      className="text-amber-200"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {approvalsRemaining === 0
                      ? "Enough approvals collected"
                      : `${approvalsRemaining} approval${approvalsRemaining === 1 ? "" : "s"} remaining`}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    icon={<CheckCircle2 size={16} aria-hidden="true" />}
                    disabled={!approveAllowed}
                    onClick={() => onApprove(request.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    icon={<XCircle size={16} aria-hidden="true" />}
                    disabled={!rejectAllowed}
                    onClick={() => onReject(request.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    icon={<CircleDollarSign size={16} aria-hidden="true" />}
                    disabled={!paymentAllowed || isBusy}
                    onClick={() => onSimulatePayment(request.id)}
                  >
                    {isBusy ? "Preparing" : "Prepare Receipt"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
