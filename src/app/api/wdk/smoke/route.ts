/**
 * WDK Smoke API — serverless compatibility check.
 *
 * WARNING: @tetherto/wdk depends on sodium-native, a native Node.js addon
 * that cannot be bundled by Next.js/Turbopack for Vercel's serverless runtime.
 *
 * This endpoint returns an honest unsupported_runtime status.
 * The real WDK SDK verification runs via the CLI smoke test or
 * the GitHub Actions WDK smoke workflow:
 *   npm run wdk:smoke
 *
 * See: https://github.com/alsaecas/cuptreasury/actions/workflows/wdk-smoke.yml
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UnsupportedRuntimeResponse {
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

export async function GET(): Promise<Response> {
  const body: UnsupportedRuntimeResponse = {
    ok: false,
    status: "unsupported_runtime",
    runtime: "vercel_next_serverless",
    sdk: "@tetherto/wdk",
    walletModule: "@tetherto/wdk-wallet-evm",
    message:
      "WDK smoke verification requires a compatible Node/Bare runtime because of native addons (sodium-native). Use npm run wdk:smoke or the GitHub Actions WDK smoke workflow.",
    recommendedVerification: "npm run wdk:smoke",
    broadcast: false,
    secretsPersisted: false,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, { status: 200 });
}
