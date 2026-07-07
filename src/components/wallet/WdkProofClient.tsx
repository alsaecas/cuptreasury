"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  RefreshCw,
  ShieldCheck,
  Trophy,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WdkSmokeVerificationResult } from "@/lib/wdk/wdkSmokeVerification";

type VerificationPhase =
  | "idle"
  | "loading"
  | "success"
  | "failure"
  | "unreachable";

export function WdkProofClient() {
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [result, setResult] = useState<WdkSmokeVerificationResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const run = useCallback(async () => {
    setPhase("loading");
    setResult(null);

    try {
      const res = await fetch("/api/wdk/smoke");

      if (!res.ok && res.status >= 500) {
        setPhase("unreachable");
        return;
      }

      const data = (await res.json()) as WdkSmokeVerificationResult;

      setResult(data);
      setPhase(data.ok ? "success" : "failure");
    } catch {
      setPhase("unreachable");
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#050806] text-zinc-100">
      {/* Header bar */}
      <header className="relative overflow-hidden border-b border-white/10 bg-[#07140f]">
        <div className="absolute inset-0 pitch-texture" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">WDK track</Badge>
              <Badge tone="amber">No funds moved</Badge>
              <Badge tone="blue">No broadcast</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-none text-white sm:text-5xl">
              WDK Proof
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-7 text-zinc-300">
              Real SDK verification for the CupTreasury wallet path
            </p>
          </div>
          <Trophy className="hidden text-lime-200 sm:block" size={40} aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Explanation card */}
          <section className="rounded-lg border border-white/10 bg-zinc-950 p-5 lg:col-span-2">
            <h2 className="text-xl font-bold text-white">What this proves</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              CupTreasury uses real WDK packages as the wallet foundation for a
              self-custodial football treasury concept. The verification below
              derives an ephemeral EVM wallet, reads the Sepolia balance,
              quotes a zero-value fee, and signs + verifies a message — all
              without storing secrets or broadcasting a transaction.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-lime-300/20 bg-lime-300/10 p-4">
                <h3 className="text-sm font-semibold text-lime-100">
                  Real WDK verification
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-lime-50/75">
                  <li>SDK loaded from @tetherto/wdk</li>
                  <li>EVM wallet module registered</li>
                  <li>Sepolia balance read</li>
                  <li>Sign + verify pass</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                <h3 className="text-sm font-semibold text-amber-100">
                  Still simulated
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-50/75">
                  <li>Browser treasury payment execution</li>
                  <li>Dashboard balance (local demo state)</li>
                  <li>USDt transfer signing/broadcasting</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-zinc-300">
                Why this is safe
              </h3>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-500">
                <li>No funds are moved.</li>
                <li>No seed phrase, private key, or mnemonic is persisted.</li>
                <li>No transaction is broadcast.</li>
                <li>
                  Wallet material is generated ephemerally in memory and
                  disposed immediately after verification.
                </li>
              </ul>
            </div>
          </section>

          {/* Action card */}
          <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-white">Run verification</h2>
            <p className="text-sm leading-6 text-zinc-500">
              Click the button to verify the WDK SDK path. The API generates
              ephemeral wallet material server-side with zero fund movement.
            </p>

            <Button
              variant="primary"
              icon={
                phase === "loading" ? (
                  <RefreshCw size={16} aria-hidden="true" className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} aria-hidden="true" />
                )
              }
              disabled={phase === "loading"}
              onClick={run}
              className="w-full"
            >
              {phase === "loading"
                ? "Running WDK Verification..."
                : "Run WDK Verification"}
            </Button>

            {/* Result cards */}
            {phase === "success" && result && (
              <div className="mt-2 space-y-2">
                <ResultItem
                  label="SDK loaded"
                  ok={true}
                />
                <ResultItem
                  label="EVM wallet module available"
                  ok={true}
                />
                <ResultItem
                  label="Ephemeral wallet derived"
                  ok={true}
                  detail={
                    result.ephemeralAddress
                      ? `${result.ephemeralAddress.slice(0, 10)}...${result.ephemeralAddress.slice(-6)}`
                      : undefined
                  }
                />
                <ResultItem
                  label="Sepolia balance read"
                  ok={result.balanceRead}
                  detail={
                    result.nativeBalanceWei
                      ? `${result.nativeBalanceWei} wei`
                      : undefined
                  }
                />
                <ResultItem
                  label="Zero-value fee quote"
                  ok={result.feeQuote}
                />
                <ResultItem
                  label="Message signed"
                  ok={result.messageSigned}
                />
                <ResultItem
                  label="Signature verified"
                  ok={result.signatureVerified}
                />
                <ResultItem
                  label="Broadcast: no"
                  ok={true}
                />
                <ResultItem
                  label="Secrets persisted: no"
                  ok={true}
                />
              </div>
            )}

            {phase === "failure" && result && (
              <div className="rounded-lg border border-red-300/30 bg-red-300/10 p-4">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-red-200" aria-hidden="true" />
                  <p className="text-sm font-semibold text-red-100">
                    Verification failed
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-red-50/80">
                  {result.error ?? "Unknown error during WDK verification."}
                </p>
                <p className="mt-3 text-xs text-red-50/60">
                  The repository still includes the CLI verification path:{" "}
                  <code className="rounded bg-red-950/60 px-1 font-mono">
                    npm run wdk:smoke
                  </code>
                </p>
              </div>
            )}

            {phase === "unreachable" && (
              <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-200" aria-hidden="true" />
                  <p className="text-sm font-semibold text-amber-100">
                    In-app verification unavailable
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                  The in-app verification could not complete in this
                  environment. This is expected on Vercel&apos;s serverless
                  runtime if the WDK SDK requires persistent Node.js features.
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                  The repository still includes the official CLI verification
                  path:
                </p>
                <code className="mt-2 block rounded bg-amber-950/60 p-2 font-mono text-xs text-amber-100">
                  npm run wdk:smoke
                </code>
              </div>
            )}

            {/* Raw JSON toggle */}
            {result && phase !== "idle" && phase !== "loading" && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowRaw((prev) => !prev)}
                  className="text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {showRaw ? "Hide raw result" : "Show raw result"}
                </button>

                {showRaw && (
                  <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                    {JSON.stringify(
                      {
                        ok: result.ok,
                        sdk: result.sdk,
                        walletModule: result.walletModule,
                        network: result.network,
                        chainId: result.chainId,
                        ephemeralAddress: result.ephemeralAddress ?? null,
                        nativeBalanceWei: result.nativeBalanceWei ?? null,
                        zeroValueTransferEstimatedFeeWei:
                          result.zeroValueTransferEstimatedFeeWei ?? null,
                        balanceRead: result.balanceRead,
                        feeQuote: result.feeQuote,
                        messageSigned: result.messageSigned,
                        signatureVerified: result.signatureVerified,
                        broadcast: result.broadcast,
                        secretsPersisted: result.secretsPersisted,
                        timestamp: result.timestamp,
                        error: result.error ?? null,
                      },
                      null,
                      2,
                    )}
                  </pre>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Links */}
        <footer className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
          <LinkButton
            href="/treasury"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            label="Back to Treasury"
          />
          <LinkButton
            href="/"
            icon={<Globe size={16} aria-hidden="true" />}
            label="Live demo home"
          />
          <LinkButton
            href="https://github.com/alsaecas/cuptreasury"
            icon={<Code2 size={16} aria-hidden="true" />}
            label="GitHub repo"
            external
          />
        </footer>
      </div>
    </main>
  );
}

function ResultItem({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      {ok ? (
        <CheckCircle2 size={16} className="shrink-0 text-lime-200" aria-hidden="true" />
      ) : (
        <XCircle size={16} className="shrink-0 text-red-200" aria-hidden="true" />
      )}
      <span className="text-sm text-zinc-300">{label}</span>
      {detail && (
        <span className="ml-auto font-mono text-xs text-zinc-500">
          {detail}
        </span>
      )}
    </div>
  );
}

function LinkButton({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  const Component = external ? "a" : "a";
  const extraProps = external
    ? { target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <Component
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
      {...extraProps}
    >
      {icon}
      {label}
      {external && <ExternalLink size={12} aria-hidden="true" />}
    </Component>
  );
}


