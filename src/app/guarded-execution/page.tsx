import {
  Ban,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LinkIcon,
  ReceiptText,
  ShieldCheck,
  Terminal,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { guardedExecutionProof } from "@/data/generated/guardedExecutionProof.generated";
import { wdkContractProof } from "@/data/generated/wdkContractProof.generated";

const flowSteps = [
  "PaymentRequest",
  "Domain approval policy",
  "Immutable PaymentIntent",
  "WDK policy evaluation",
  "Quote and prepare",
  "Direct guarded receipt",
];

const contractLayers = [
  ["Domain governance", "Trusted roster, atomic amount, approval threshold, canonical PaymentIntent."],
  ["WDK signer enforcement", "Exact contract call ALLOW/DENY, no modified calldata, one-time application consumption."],
  ["TeamTreasury on-chain enforcement", "Captain/Treasurer approvals, expiry, exact MockUSDT transfer, and contract replay prevention."],
];

export default function GuardedExecutionPage() {
  return (
    <main className="min-h-screen bg-[#050806] text-zinc-100">
      <header className="border-b border-white/10 bg-[#07140f]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">WDK only</Badge>
            <Badge tone="blue">Node/CI proof</Badge>
            <Badge tone="amber">No public-chain broadcast</Badge>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-none text-white sm:text-5xl">
                Guarded Execution
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
                Approved football expenses become exact, one-time WDK payment
                capabilities. The wallet policy must reject changed recipients,
                tokens, amounts, accounts, chains, expiries, and consumed
                lifecycle states.
              </p>
            </div>
            <Link
              href="/treasury"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-50 transition-colors hover:bg-white/10"
            >
              <WalletCards size={17} aria-hidden="true" />
              Treasury
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 bg-zinc-950/70">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:px-8 md:grid-cols-3 lg:grid-cols-6 lg:px-10">
          {flowSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <p className="font-mono text-xs text-lime-200">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-lime-200" aria-hidden="true" />
            <h2 className="text-2xl font-black text-white">
              Exact PaymentIntent capability
            </h2>
          </div>
          <div className="mt-4 grid gap-4">
            <ProofRow
              icon={<ReceiptText size={18} aria-hidden="true" />}
              label="Payment request"
              value={`${guardedExecutionProof.request.displayAmount} ${guardedExecutionProof.request.tokenSymbol} · atomic ${guardedExecutionProof.request.amountAtomic}`}
            />
            <ProofRow
              icon={<Fingerprint size={18} aria-hidden="true" />}
              label="Intent hash"
              value={guardedExecutionProof.capability.hash}
              mono
            />
            <ProofRow
              icon={<KeyRound size={18} aria-hidden="true" />}
              label="Ephemeral WDK account"
              value={guardedExecutionProof.safeEphemeralAddress}
              mono
            />
          </div>

          <div className="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-cyan-200" aria-hidden="true" />
              <h3 className="text-lg font-bold text-white">Real WDK proof</h3>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <ProofStat label="SDK" value={guardedExecutionProof.sdk} />
              <ProofStat
                label="Wallet module"
                value={guardedExecutionProof.walletModule}
              />
              <ProofStat label="Network" value={guardedExecutionProof.network} />
              <ProofStat
                label="Capability schema"
                value={`v${guardedExecutionProof.capability.version}`}
              />
              <ProofStat
                label="Fee quote"
                value={formatFeeQuote(guardedExecutionProof.feeQuote)}
              />
              <ProofStat
                label="Prepared"
                value={String(guardedExecutionProof.executionReceipt.prepared)}
              />
              <ProofStat
                label="Broadcast"
                value={String(guardedExecutionProof.executionReceipt.broadcast)}
              />
              <ProofStat
                label="Secrets persisted"
                value={String(guardedExecutionProof.secretsPersisted)}
              />
            </dl>
            <code className="mt-4 block rounded-md border border-cyan-300/20 bg-black/50 px-3 py-2 font-mono text-xs text-cyan-100">
              {guardedExecutionProof.command}
            </code>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <FileCheck2 size={20} className="text-amber-200" aria-hidden="true" />
            <h2 className="text-2xl font-black text-white">Policy decisions</h2>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {guardedExecutionProof.scenarios.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.outcome === "ALLOW" || item.outcome === "SIGNED"
                            ? "inline-flex items-center gap-1 rounded-md border border-lime-300/30 bg-lime-300/10 px-2 py-1 text-xs font-bold text-lime-100"
                            : "inline-flex items-center gap-1 rounded-md border border-red-300/30 bg-red-300/10 px-2 py-1 text-xs font-bold text-red-100"
                        }
                      >
                        {item.outcome === "ALLOW" || item.outcome === "SIGNED" ? (
                          <CheckCircle2 size={13} aria-hidden="true" />
                        ) : (
                          <Ban size={13} aria-hidden="true" />
                        )}
                        {item.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-5">
          <h2 className="text-xl font-bold text-white">Audit journal</h2>
          <div className="mt-4 space-y-3">
            {guardedExecutionProof.auditJournal.map((event) => (
              <div key={event} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
                <span className="text-sm font-semibold text-zinc-200">
                  {event}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-zinc-950 p-5">
          <h2 className="text-xl font-bold text-white">Proof provenance</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProofStat label="Generated" value={guardedExecutionProof.generatedAt} />
            <ProofStat
              label="Source commit"
              value={guardedExecutionProof.sourceCommit}
            />
            <ProofStat
              label="Artifact SHA-256"
              value={guardedExecutionProof.proofArtifactSha256}
            />
            <ProofStat
              label="Content hash"
              value={guardedExecutionProof.proofContentHash}
            />
            <ProofStat
              label="Token bytecode"
              value={guardedExecutionProof.prepared.tokenContract.status}
            />
            <ProofStat
              label="Gas limit"
              value={
                guardedExecutionProof.prepared.providerDerived?.gasLimit ?? "n/a"
              }
            />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <ProofLink href="https://github.com/alsaecas/cuptreasury/pull/9">
              PR #9
            </ProofLink>
            <ProofLink href="https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml">
              WDK workflow
            </ProofLink>
            <ProofLink
              href={`https://github.com/alsaecas/cuptreasury/blob/${guardedExecutionProof.sourceCommit}/docs/SEMIFINAL_REVIEW.md`}
            >
              Judge guide
            </ProofLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="rounded-lg border border-lime-300/25 bg-lime-300/[0.05] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">WDK signed</Badge>
            <Badge tone="blue">Local chain only</Badge>
            <Badge tone="amber">MockUSDT test token</Badge>
            <Badge tone="green">Replay protected</Badge>
            <Badge tone="green">No real funds</Badge>
          </div>
          <h2 className="mt-4 text-2xl font-black text-white">Deterministic TeamTreasury execution proof</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-300">
            This is a separate deterministic local proof: PaymentRequest → PaymentIntent → WDK policy → WDK signature → TeamTreasury → MockUSDT transfer → execution receipt.
            MockUSDT is a local test token and is not official USDt. No real funds or public-chain broadcast are used.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {contractLayers.map(([title, copy]) => <div key={title} className="rounded-md border border-white/10 bg-black/20 p-4"><p className="font-semibold text-lime-100">{title}</p><p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p></div>)}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProofRow icon={<Fingerprint size={18} aria-hidden="true" />} label="PaymentIntent hash" value={wdkContractProof.teamTreasury.paymentIntentHash} mono />
            <ProofRow icon={<ReceiptText size={18} aria-hidden="true" />} label="TeamTreasury / request" value={`${wdkContractProof.teamTreasury.contractAddress} · #${wdkContractProof.teamTreasury.requestId}`} mono />
            <ProofRow icon={<KeyRound size={18} aria-hidden="true" />} label="WDK executor" value={wdkContractProof.wdk.executorAddress} mono />
            <ProofRow icon={<ShieldCheck size={18} aria-hidden="true" />} label="WDK policy / signing" value={`${wdkContractProof.wdk.policyDecision} · signed ${String(wdkContractProof.wdk.signedByWdk)} · approvals signed ${String(wdkContractProof.wdk.approvalsSignedByWdk)}`} />
            <ProofRow icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Atomic transfer" value={`${wdkContractProof.execution.transferredAmount} MockUSDT atomic units`} mono />
            <ProofRow icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Recipient balance" value={`${wdkContractProof.execution.recipientBalanceBefore} → ${wdkContractProof.execution.recipientBalanceAfter}`} mono />
            <ProofRow icon={<ShieldCheck size={18} aria-hidden="true" />} label="Broadcast boundary" value="Local true · public testnet false · mainnet false" />
            <ProofRow icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Receipt verification" value={`status ${wdkContractProof.execution.transactionStatus} · execution event ${String(wdkContractProof.execution.executionEventMatched)} · transfer event ${String(wdkContractProof.execution.transferEventMatched)}`} />
          </div>
          <div className="mt-5 overflow-hidden rounded-md border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.04] text-xs uppercase text-zinc-500"><tr><th className="px-4 py-3">Tamper / replay check</th><th className="px-4 py-3">Result</th></tr></thead><tbody>{wdkContractProof.tamperScenarios.map((scenario) => <tr key={scenario.id} className="border-t border-white/10"><td className="px-4 py-3 font-semibold text-zinc-200">{scenario.id}</td><td className="px-4 py-3 font-mono text-red-200">{scenario.result}</td></tr>)}</tbody></table></div>
          <p className="mt-4 text-xs text-zinc-500">Artifact SHA-256: {wdkContractProof.proofArtifactSha256} · source commit: {wdkContractProof.sourceCommit}</p>
          <p className="mt-1 text-xs text-zinc-500">WDK replay: {wdkContractProof.defenseInDepth.wdkReplayReason} Contract replay: {wdkContractProof.defenseInDepth.contractReplayError}.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-5">
          <h2 className="text-xl font-bold text-white">Runtime boundary</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-amber-50/85 sm:grid-cols-2">
            {guardedExecutionProof.disclosures.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function ProofRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <p className="text-xs font-semibold uppercase">{label}</p>
      </div>
      <p
        className={`mt-2 break-words text-sm font-semibold text-zinc-100 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProofStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-cyan-100/60">{label}</dt>
      <dd className="mt-1 break-words font-mono text-sm text-cyan-50">
        {value}
      </dd>
    </div>
  );
}

function formatFeeQuote(feeQuote: {
  status: string;
  estimatedFeeAtomic?: string;
}): string {
  return feeQuote.status === "quoted" && feeQuote.estimatedFeeAtomic
    ? `${feeQuote.estimatedFeeAtomic} wei`
    : "Unsupported for placeholder token";
}

function ProofLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:bg-white/10"
    >
      <LinkIcon size={14} aria-hidden="true" />
      {children}
    </Link>
  );
}
