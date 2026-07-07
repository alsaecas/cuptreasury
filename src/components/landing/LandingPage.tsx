import {
  Bot,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Flag,
  MapPin,
  ShieldCheck,
  Trophy,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { JudgeDemoFlowCard } from "@/components/treasury/JudgeDemoFlowCard";
import { Badge } from "@/components/ui/Badge";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#06120d] text-zinc-50">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pitch-texture" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:px-10 lg:py-12">
          <div className="flex flex-col justify-center">
            <Badge tone="green" className="w-fit">
              Spain · Valencia · Tether Developers Cup
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
              CupTreasury
            </h1>
            <p className="mt-5 max-w-2xl text-2xl font-semibold text-lime-100 sm:text-3xl">
              Stop managing team money in WhatsApp.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              A self-custodial football team treasury for squads, fan groups,
              and tournament teams. It tracks contributions, captain/treasurer
              approvals, and match-day expenses through a WDK-ready wallet flow.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
              <div className="flex gap-2">
                <Flag size={18} className="text-lime-200" aria-hidden="true" />
                <span>Primary track: WDK with real SDK smoke test</span>
              </div>
              <div className="flex gap-2">
                <MapPin size={18} className="text-amber-200" aria-hidden="true" />
                <span>Local deterministic assistant; no QVAC track claim</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/treasury"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-lime-300 bg-lime-300 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200"
              >
                <Trophy size={18} aria-hidden="true" />
                Open Demo Treasury
              </Link>
              <Link
                href="/treasury?create=request"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-50 transition-colors hover:bg-white/10"
              >
                <ClipboardCheck size={18} aria-hidden="true" />
                Create Payment Request
              </Link>
            </div>
          </div>

          <div className="football-preview rounded-lg border border-white/15 bg-zinc-950/80 p-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-zinc-400">
                  Valencia Hackers FC
                </p>
                <p className="mt-1 text-2xl font-black">450 USDt</p>
              </div>
              <Badge tone="green">WDK smoke verified</Badge>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[
                ["Pending dues", "100 USDt"],
                ["Requests", "2 pending"],
                ["Approvals", "2-role flow"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="mt-2 text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                ["Van rental for away match", "120 USDt", "Needs 1 approval"],
                ["Tournament registration", "250 USDt", "Approved"],
                ["Team dinner after match", "80 USDt", "Local review"],
              ].map(([title, amount, status]) => (
                <div
                  key={title}
                  className="flex items-center justify-between gap-4 border-t border-white/10 py-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-100">{title}</p>
                    <p className="text-sm text-zinc-500">{status}</p>
                  </div>
                  <p className="font-mono text-sm text-lime-100">{amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:px-8 md:grid-cols-3 lg:px-10">
        {[
          {
            icon: Wallet,
            title: "Self-custodial team treasury",
            copy: "CupTreasury does not custody team funds. The WDK packages are installed and verified by a no-funds Node smoke test.",
          },
          {
            icon: ShieldCheck,
            title: "Role-based approvals",
            copy: "Captain and Treasurer approvals are enforced in the treasury rules before any payment can be simulated.",
          },
          {
            icon: Bot,
            title: "Local deterministic assistant",
            copy: "The current assistant answers from local treasury data, uses no cloud AI API, and is not submitted as a completed QVAC track.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
          >
            <item.icon className="text-lime-200" size={24} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8 lg:px-10">
        <JudgeDemoFlowCard />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-10 sm:px-8 md:grid-cols-3 lg:px-10">
        {[
          [CircleDollarSign, "Balances", "Contribution status and treasury balance are visible at a glance."],
          [CheckCircle2, "Approvals", "High-value requests need two approvers before payment."],
          [Trophy, "Football context", "Built around squads, trips, kits, tickets, registrations, and match day costs."],
        ].map(([Icon, title, copy]) => (
          <div key={title as string} className="flex gap-3 text-zinc-300">
            <Icon className="mt-1 text-amber-200" size={20} aria-hidden="true" />
            <div>
              <p className="font-semibold text-zinc-50">{title as string}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {copy as string}
              </p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
