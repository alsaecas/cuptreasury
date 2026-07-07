"use client";

import { useEffect, useMemo, useState } from "react";

import { QvacAssistantPanel } from "@/components/ai/QvacAssistantPanel";
import { WdkWalletPanel } from "@/components/wallet/WdkWalletPanel";
import { qvacTreasuryAssistant } from "@/lib/qvac/qvacTreasuryAssistant";
import {
  canApprove,
  canSimulatePayment,
  requiredApprovals,
} from "@/lib/treasury/treasuryRules";
import {
  clearTreasuryState,
  getFreshDemoTreasuryState,
  loadTreasuryState,
  saveTreasuryState,
} from "@/lib/treasury/treasuryStorage";
import { createId, formatUsdT } from "@/lib/utils";
import {
  type ExecutedPayment,
  wdkTreasuryAdapter,
} from "@/lib/wdk/wdkTreasuryAdapter";
import type {
  Approval,
  Member,
  PaymentRequest,
  PaymentRequestDraft,
  TreasuryActivity,
  TreasuryState,
} from "@/types/treasury";

import { ActivityFeed } from "./ActivityFeed";
import { CreateRequestModal } from "./CreateRequestModal";
import { JudgeDemoFlowCard } from "./JudgeDemoFlowCard";
import { MembersSection } from "./MembersSection";
import { PaymentRequestsSection } from "./PaymentRequestsSection";
import { TreasuryOverview } from "./TreasuryOverview";

function createActivity(
  title: string,
  detail: string,
  tone: TreasuryActivity["tone"] = "neutral",
): TreasuryActivity {
  return {
    id: createId("activity"),
    title,
    detail,
    tone,
    createdAt: new Date().toISOString(),
  };
}

function findMember(state: TreasuryState, memberId: string): Member {
  return state.team.members.find((member) => member.id === memberId) ?? state.team.members[0];
}

export function TreasuryApp() {
  const [treasury, setTreasury] = useState<TreasuryState>(() =>
    getFreshDemoTreasuryState(),
  );
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState("member-alejandro");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<ExecutedPayment | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadedState = loadTreasuryState();
      setTreasury(loadedState);
      setHasLoadedStorage(true);

      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "request") {
        setIsCreateOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasLoadedStorage) {
      saveTreasuryState(treasury);
    }
  }, [hasLoadedStorage, treasury]);

  const activeMember = useMemo(
    () => findMember(treasury, activeMemberId),
    [activeMemberId, treasury],
  );

  const summary = useMemo(
    () => qvacTreasuryAssistant.summarizeTreasury(treasury),
    [treasury],
  );

  function handleCreateRequest(draft: PaymentRequestDraft) {
    const requestedBy = findMember(treasury, draft.requestedByMemberId);
    const risk = qvacTreasuryAssistant.detectExpenseRisk(draft, treasury);
    const request: PaymentRequest = {
      id: createId("request"),
      title: draft.title,
      amount: draft.amount,
      category: draft.category,
      description: draft.description,
      requestedByMemberId: requestedBy.id,
      requestedByName: requestedBy.name,
      status: "Pending",
      approvals: [],
      aiRiskLevel: risk.level,
      aiNote: risk.note,
      createdAt: new Date().toISOString(),
    };

    setTreasury((current) => ({
      ...current,
      requests: [request, ...current.requests],
      activity: [
        createActivity(
          "Payment request created",
          `${requestedBy.name} requested ${formatUsdT(request.amount)} for ${request.title}.`,
          risk.level === "Normal" ? "green" : "amber",
        ),
        ...current.activity,
      ],
    }));
    setIsCreateOpen(false);
  }

  function handleApproveRequest(requestId: string) {
    const approverRole =
      activeMember.role === "Captain" || activeMember.role === "Treasurer"
        ? activeMember.role
        : null;

    if (!approverRole || !canApprove(activeMember.role)) {
      return;
    }

    setTreasury((current) => {
      const request = current.requests.find((item) => item.id === requestId);

      if (
        !request ||
        request.status !== "Pending" ||
        request.approvals.some((approval) => approval.memberId === activeMember.id)
      ) {
        return current;
      }

      const approval: Approval = {
        id: createId("approval"),
        memberId: activeMember.id,
        memberName: activeMember.name,
        role: approverRole,
        createdAt: new Date().toISOString(),
      };
      const approvals = [...request.approvals, approval];
      const nextStatus =
        approvals.length >= requiredApprovals(request.amount)
          ? "Approved"
          : "Pending";
      const updatedRequest: PaymentRequest = {
        ...request,
        approvals,
        status: nextStatus,
      };

      return {
        ...current,
        requests: current.requests.map((item) =>
          item.id === requestId ? updatedRequest : item,
        ),
        activity: [
          createActivity(
            nextStatus === "Approved" ? "Request approved" : "Approval added",
            `${activeMember.name} approved ${request.title}.`,
            nextStatus === "Approved" ? "green" : "amber",
          ),
          ...current.activity,
        ],
      };
    });
  }

  function handleRejectRequest(requestId: string) {
    if (!canApprove(activeMember.role)) {
      return;
    }

    setTreasury((current) => {
      const request = current.requests.find((item) => item.id === requestId);

      if (!request || request.status !== "Pending") {
        return current;
      }

      return {
        ...current,
        requests: current.requests.map((item) =>
          item.id === requestId ? { ...item, status: "Rejected" } : item,
        ),
        activity: [
          createActivity(
            "Request rejected",
            `${activeMember.name} rejected ${request.title}.`,
            "red",
          ),
          ...current.activity,
        ],
      };
    });
  }

  async function handleSimulatePayment(requestId: string) {
    const request = treasury.requests.find((item) => item.id === requestId);

    if (!request || !canSimulatePayment(request)) {
      return;
    }

    setBusyRequestId(requestId);

    try {
      const payment = await wdkTreasuryAdapter.preparePayment(
        request,
        treasury.wallet,
      );
      const result = await wdkTreasuryAdapter.executePayment(payment);

      setTransactionResult(result);
      setTreasury((current) => {
        const currentRequest = current.requests.find(
          (item) => item.id === requestId,
        );

        if (!currentRequest || !canSimulatePayment(currentRequest)) {
          return current;
        }

        return {
          ...current,
          wallet: {
            ...current.wallet,
            balance: Math.max(current.wallet.balance - currentRequest.amount, 0),
          },
          requests: current.requests.map((item) =>
            item.id === requestId
              ? {
                  ...item,
                  status: "Paid",
                  paidAt: result.executedAt,
                  txHash: result.txHash,
                }
              : item,
          ),
          activity: [
            createActivity(
              "Simulated WDK payment",
              `${formatUsdT(currentRequest.amount)} paid for ${currentRequest.title}.`,
              "green",
            ),
            ...current.activity,
          ],
        };
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The WDK adapter could not simulate this payment.";

      setTreasury((current) => ({
        ...current,
        activity: [
          createActivity("Payment simulation failed", message, "red"),
          ...current.activity,
        ],
      }));
    } finally {
      setBusyRequestId(null);
    }
  }

  function handleResetDemo() {
    setTreasury(clearTreasuryState());
    setActiveMemberId("member-alejandro");
    setTransactionResult(null);
  }

  return (
    <main className="min-h-screen bg-[#050806] text-zinc-100">
      <TreasuryOverview
        state={treasury}
        summary={summary}
        activeMember={activeMember}
        onActiveMemberChange={setActiveMemberId}
        onCreateRequest={() => setIsCreateOpen(true)}
        onResetDemo={handleResetDemo}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_390px] lg:px-10">
        <div className="space-y-6">
          <PaymentRequestsSection
            requests={treasury.requests}
            activeMember={activeMember}
            busyRequestId={busyRequestId}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onSimulatePayment={handleSimulatePayment}
          />
        </div>

        <aside className="space-y-5">
          <JudgeDemoFlowCard compact />
          <MembersSection members={treasury.team.members} />
          <WdkWalletPanel
            state={treasury}
            transactionResult={transactionResult}
            busyRequestId={busyRequestId}
            onSimulatePayment={handleSimulatePayment}
          />
          <QvacAssistantPanel state={treasury} />
          <ActivityFeed activity={treasury.activity} />
        </aside>
      </div>

      <CreateRequestModal
        key={`${activeMember.id}-${isCreateOpen ? "open" : "closed"}`}
        isOpen={isCreateOpen}
        members={treasury.team.members}
        defaultMemberId={activeMember.id}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRequest}
      />
    </main>
  );
}
