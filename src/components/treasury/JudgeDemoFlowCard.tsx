import { CircleDollarSign, ClipboardPlus, MessageSquareText, Trophy } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";

interface JudgeDemoFlowCardProps {
  compact?: boolean;
}

const steps = [
  {
    icon: Trophy,
    title: "Open Valencia Hackers FC treasury",
    detail: "See the Spain demo squad, fan-group wallet, and match-day balance.",
  },
  {
    icon: ClipboardPlus,
    title: "Create a match-day expense",
    detail: "Add travel, kit, food, tickets, or watch-party costs.",
  },
  {
    icon: CircleDollarSign,
    title: "Approve as Captain/Treasurer",
    detail: "Use role-based approvals before payment is allowed.",
  },
  {
    icon: MessageSquareText,
    title: "Simulate WDK payment and ask who owes money",
    detail: "Run the WDK-ready demo payment and query the local assistant.",
  },
];

export function JudgeDemoFlowCard({ compact = false }: JudgeDemoFlowCardProps) {
  return (
    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
      <Badge tone="amber">Judge Demo Flow</Badge>
      <h2 className="mt-4 text-xl font-black text-white">
        Four clicks to evaluate CupTreasury
      </h2>
      <div className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <div key={step.title} className="grid grid-cols-[auto_1fr] gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-200/30 bg-zinc-950/60 text-amber-100">
              <step.icon size={17} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-50">
                {index + 1}. {step.title}
              </p>
              {!compact ? (
                <p className="mt-1 text-sm leading-6 text-amber-50/70">
                  {step.detail}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/treasury"
        className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-amber-200/40 bg-amber-200 px-4 py-2 text-sm font-black text-zinc-950 transition-colors hover:bg-amber-100"
      >
        Start Demo
      </Link>
    </section>
  );
}
