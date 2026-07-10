import {
  ClipboardList,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getPendingContributions,
  getPendingRequests,
} from "@/lib/treasury/treasuryRules";
import { formatUsdT } from "@/lib/utils";
import type { Member, TreasuryState } from "@/types/treasury";

interface TreasuryOverviewProps {
  state: TreasuryState;
  summary: string;
  activeMember: Member;
  onActiveMemberChange: (memberId: string) => void;
  onCreateRequest: () => void;
  onResetDemo: () => void;
}

export function TreasuryOverview({
  state,
  summary,
  activeMember,
  onActiveMemberChange,
  onCreateRequest,
  onResetDemo,
}: TreasuryOverviewProps) {
  const pendingContributionTotal = getPendingContributions(state);
  const pendingRequests = getPendingRequests(state);

  const metrics = [
    {
      label: "Treasury balance",
      value: formatUsdT(state.wallet.balance),
      icon: Wallet,
      tone: "green",
    },
    {
      label: "Pending contributions",
      value: formatUsdT(pendingContributionTotal),
      icon: Users,
      tone: "amber",
    },
    {
      label: "Pending requests",
      value: `${pendingRequests.length}`,
      icon: ClipboardList,
      tone: "blue",
    },
  ] as const;

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#07140f]">
      <div className="absolute inset-0 pitch-texture" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="green" className="w-fit">
              <Trophy size={14} aria-hidden="true" />
              {state.team.eventName}
            </Badge>
            <h1 className="mt-4 text-4xl font-black leading-none text-white sm:text-5xl">
              {state.team.name}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
              {summary}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-4 sm:min-w-80">
            <label
              htmlFor="demo-signer"
              className="text-xs font-semibold text-zinc-500"
            >
              Demo signer
            </label>
            <select
              id="demo-signer"
              value={activeMember.id}
              onChange={(event) => onActiveMemberChange(event.target.value)}
              className="min-h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm font-semibold text-zinc-100 outline-none focus:border-lime-300"
            >
              {state.team.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={onCreateRequest}
                className="flex-1"
              >
                New Request
              </Button>
              <Button
                variant="secondary"
                icon={<RefreshCcw size={16} aria-hidden="true" />}
                onClick={onResetDemo}
                className="flex-1"
              >
                Reset Demo
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-lg border border-white/10 bg-zinc-950/70 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <metric.icon
                  className="text-lime-200"
                  size={22}
                  aria-hidden="true"
                />
                <Badge tone={metric.tone}>{metric.label}</Badge>
              </div>
              <p className="mt-5 font-mono text-3xl font-black text-white">
                {metric.value}
              </p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
          <Badge tone="blue">Local assistant treasury summary</Badge>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-cyan-50/85">
            {summary}
          </p>
        </article>

        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <ShieldCheck size={16} className="text-lime-200" aria-hidden="true" />
          <span>
            Active role: {activeMember.role}. Payments require approval before
            PaymentIntent preparation.
          </span>
        </div>
      </div>
    </section>
  );
}
