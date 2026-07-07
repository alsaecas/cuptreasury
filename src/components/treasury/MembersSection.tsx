import { getContributionStatus, getRoleDescription } from "@/lib/treasury/treasuryRules";
import { cn, formatUsdT } from "@/lib/utils";
import type { Member } from "@/types/treasury";

import { Badge } from "../ui/Badge";

interface MembersSectionProps {
  members: Member[];
}

const statusTone = {
  Paid: "green",
  Pending: "amber",
  Partial: "blue",
} as const;

export function MembersSection({ members }: MembersSectionProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Members</h2>
          <p className="mt-1 text-sm text-zinc-500">Roles and contribution status</p>
        </div>
        <Badge tone="neutral">{members.length} people</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {members.map((member) => {
          const status = getContributionStatus(
            member.contributionExpected,
            member.contributionPaid,
          );
          const paidRatio =
            member.contributionExpected === 0
              ? 1
              : member.contributionPaid / member.contributionExpected;

          return (
            <article
              key={member.id}
              className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr_auto]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-lime-300/30 bg-lime-300/10 text-sm font-black text-lime-100">
                {member.avatarInitials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{member.name}</h3>
                  <Badge tone="blue">{member.role}</Badge>
                  <Badge tone={statusTone[status]}>{status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {getRoleDescription(member.role)}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      status === "Paid" ? "bg-lime-300" : "bg-amber-300",
                    )}
                    style={{ width: `${Math.min(paidRatio * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-mono text-sm text-zinc-400">
                  {formatUsdT(member.contributionPaid)}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  of {formatUsdT(member.contributionExpected)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
