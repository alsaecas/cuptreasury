"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Server,
  Terminal,
  Trophy,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UnsupportedRuntimeResult {
  ok: false;
  status: "unsupported_runtime";
  runtime: string;
  sdk: string;
  walletModule: string;
  message: string;
  recommendedVerification: string;
  broadcast: false;
  secretsPersisted: false;
  timestamp: string;
}

interface SmokeverificationResult {
  ok: true;
  sdk: string;
  walletModule: string;
  network: string;
  chainId: number;
  ephemeralAddress?: string;
  nativeBalanceWei?: string;
  zeroValueTransferEstimatedFeeWei?: string;
  balanceRead: boolean;
  feeQuote: boolean;
  messageSigned: boolean;
  signatureVerified: boolean;
  broadcast: false;
  secretsPersisted: false;
  timestamp: string;
}

type ApiResult = UnsupportedRuntimeResult | SmokeverificationResult;

type CheckPhase =
  | "idle"
  | "loading"
  | "unsupported"
  | "success"
  | "unavailable";

const SMOKE_COMMAND = "npm run wdk:smoke";

export function WdkProofClient() {
  const [checkPhase, setCheckPhase] = useState<CheckPhase>("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCommand = useCallback(async () => {
    await navigator.clipboard.writeText(SMOKE_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const checkCompatibility = useCallback(async () => {
    setCheckPhase("loading");
    setApiResult(null);

    try {
      const res = await fetch("/api/wdk/smoke");

      if (!res.ok && res.status >= 500) {
        setCheckPhase("unavailable");
        return;
      }

      const data = (await res.json()) as ApiResult;

      setApiResult(data);

      if ("status" in data && data.status === "unsupported_runtime") {
        setCheckPhase("unsupported");
      } else if (data.ok) {
        setCheckPhase("success");
      } else {
        setCheckPhase("unavailable");
      }
    } catch {
      setCheckPhase("unavailable");
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#050806] text-zinc-100">
      {/* Header */}
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
              WDK Verification Methods
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-7 text-zinc-300">
              Real WDK SDK verification for the CupTreasury wallet path
            </p>
          </div>
          <Trophy className="hidden text-lime-200 sm:block" size={40} aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* ─── Section A: Real WDK CLI/CI smoke test ─── */}
        <section className="rounded-lg border border-lime-300/20 bg-lime-300/[0.06] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Terminal size={20} className="text-lime-200" aria-hidden="true" />
                <Badge tone="green">Passing in compatible Node runtime</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-black text-white">
                Real WDK CLI/CI smoke test
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                The official CupTreasury WDK verification runs outside the
                browser, using real @tetherto/wdk and @tetherto/wdk-wallet-evm
                packages. It derives an ephemeral EVM wallet, reads the Sepolia
                balance, quotes a zero-value transfer fee, signs and verifies a
                message — all without broadcasting a transaction or persisting
                secrets.
              </p>
            </div>
          </div>

          {/* Command copy */}
          <div className="mt-5 rounded-lg border border-lime-300/30 bg-black/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-sm text-lime-100">
                {SMOKE_COMMAND}
              </code>
              <button
                type="button"
                onClick={copyCommand}
                className="inline-flex items-center gap-1 rounded-md border border-lime-300/30 bg-lime-300/10 px-3 py-1.5 text-xs font-semibold text-lime-100 transition-colors hover:bg-lime-300/20"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={12} aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} aria-hidden="true" />
                    Copy command
                  </>
                )}
              </button>
            </div>
          </div>

          {/* What the smoke test does */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Packages", value: "@tetherto/wdk + wdk-wallet-evm" },
              { label: "Wallet", value: "Ephemeral EVM (Sepolia)" },
              { label: "Balance", value: "Read via public RPC" },
              { label: "Fee quote", value: "Zero-value transfer" },
              { label: "Sign + verify", value: "Message signed & checked" },
              { label: "Broadcast", value: "No transaction broadcast" },
              { label: "Funds", value: "No funds moved" },
              { label: "Secrets", value: "Nothing persisted" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-lime-300/20 bg-black/40 p-3"
              >
                <p className="text-xs font-semibold text-lime-200">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-lime-100/75">{item.value}</p>
              </div>
            ))}
          </div>

          {/* CI badge link */}
          <a
            href="https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-200 transition-colors hover:text-lime-100"
          >
            <ExternalLink size={14} aria-hidden="true" />
            View CI smoke verification on GitHub Actions
          </a>
        </section>

        {/* ─── Section B: Browser MVP payment flow ─── */}
        <section className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="shrink-0 text-amber-200" aria-hidden="true" />
            <div>
              <Badge tone="amber">Simulated execution</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">
                Browser treasury flow
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                CupTreasury&apos;s browser demo shows the intended football
                treasury payment flow: request, approval, payment preparation,
                and simulated execution. The browser payment execution is
                simulated in the MVP. The real WDK proof currently lives in the
                CLI/CI smoke test path.
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-6 text-amber-100/85">
                <li>The browser MVP simulates USDt payment execution.</li>
                <li>No real transaction is signed or broadcast in the browser.</li>
                <li>The dashboard balance is local demo state.</li>
                <li>
                  The adapter models the wallet/payment flow so real WDK signing
                  can replace simulation later.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Section C: Vercel serverless compatibility check ─── */}
        <section className="mt-6 rounded-lg border border-blue-300/20 bg-blue-300/[0.06] p-6">
          <div className="flex items-start gap-3">
            <Server size={20} className="shrink-0 text-blue-200" aria-hidden="true" />
            <div>
              <Badge tone="blue">Unsupported by design</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">
                Vercel serverless compatibility check
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                The WDK smoke test requires native Node.js addons such as
                sodium-native. Vercel/Next.js serverless bundling is not the
                target runtime for this proof. The compatibility check below
                reports unsupported instead of pretending to run.
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The official verification paths are the CLI smoke test and the
                GitHub Actions CI workflow.
              </p>
            </div>
          </div>

          {/* Advanced compatibility check */}
          <div className="mt-5 rounded-lg border border-white/10 bg-black/40 p-5">
            <h3 className="text-sm font-semibold text-zinc-300">
              Advanced: serverless compatibility check
            </h3>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              This calls the /api/wdk/smoke endpoint to confirm the expected
              unsupported status.
            </p>

            <Button
              variant="secondary"
              icon={<Server size={16} aria-hidden="true" />}
              disabled={checkPhase === "loading"}
              onClick={checkCompatibility}
              className="mt-4"
            >
              {checkPhase === "loading"
                ? "Checking compatibility..."
                : "Check serverless compatibility"}
            </Button>

            {/* Result: unsupported (expected) */}
            {checkPhase === "unsupported" && apiResult && (
              <div className="mt-4 rounded-lg border border-blue-300/30 bg-blue-300/10 p-4">
                <div className="flex items-center gap-2">
                  <Info size={18} className="text-blue-200" aria-hidden="true" />
                  <p className="text-sm font-semibold text-blue-100">
                    Serverless runtime unsupported
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-blue-50/80">
                  {"message" in apiResult
                    ? apiResult.message
                    : "Native addons are incompatible with this runtime."}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-blue-50/60">
                    Use the CLI smoke test instead:
                  </span>
                  <code className="rounded bg-blue-950/60 px-2 py-1 font-mono text-xs text-blue-100">
                    {SMOKE_COMMAND}
                  </code>
                  <button
                    type="button"
                    onClick={copyCommand}
                    className="inline-flex items-center gap-1 rounded bg-blue-950/60 px-2 py-1 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-950"
                  >
                    <Copy size={11} aria-hidden="true" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Result: success (unexpected but honest) */}
            {checkPhase === "success" && apiResult && (
              <div className="mt-4 rounded-lg border border-lime-300/30 bg-lime-300/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-lime-200" aria-hidden="true" />
                  <p className="text-sm font-semibold text-lime-100">
                    WDK smoke test ran in this runtime
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-lime-50/80">
                  The smoke test completed successfully. No funds were moved and
                  no secrets were persisted.
                </p>
                <div className="mt-3 space-y-1">
                  {"ephemeralAddress" in apiResult && apiResult.ephemeralAddress && (
                    <p className="font-mono text-xs text-lime-100/75">
                      Address: {apiResult.ephemeralAddress.slice(0, 10)}...
                      {apiResult.ephemeralAddress.slice(-6)}
                    </p>
                  )}
                  <p className="font-mono text-xs text-lime-100/75">
                    Broadcast: {String(false)}
                  </p>
                  <p className="font-mono text-xs text-lime-100/75">
                    Secrets persisted: {String(false)}
                  </p>
                </div>
              </div>
            )}

            {/* Result: unavailable */}
            {checkPhase === "unavailable" && (
              <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-200" aria-hidden="true" />
                  <p className="text-sm font-semibold text-amber-100">
                    Compatibility check unavailable
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                  The endpoint could not be reached or returned an unexpected
                  response. Use the CLI smoke test for verification.
                </p>
                <code className="mt-3 block rounded bg-amber-950/60 p-2 font-mono text-xs text-amber-100">
                  {SMOKE_COMMAND}
                </code>
              </div>
            )}

            {/* Raw JSON toggle */}
            {apiResult && checkPhase !== "idle" && checkPhase !== "loading" && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowRaw((prev) => !prev)}
                  className="text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {showRaw ? "Hide raw response" : "Show raw response"}
                </button>
                {showRaw && (
                  <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                    {JSON.stringify(apiResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Footer links */}
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
          <LinkButton
            href="https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml"
            icon={<ExternalLink size={16} aria-hidden="true" />}
            label="CI smoke workflow"
            external
          />
        </footer>
      </div>
    </main>
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
  const extraProps = external
    ? { target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
      {...extraProps}
    >
      {icon}
      {label}
      {external && <ExternalLink size={12} aria-hidden="true" />}
    </a>
  );
}
