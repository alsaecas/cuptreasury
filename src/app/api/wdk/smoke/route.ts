/**
 * WDK Smoke API — server-side route handler.
 *
 * WARNING: @tetherto/wdk depends on sodium-native, a native Node.js addon
 * that cannot be bundled by Next.js/Turbopack for Vercel's serverless runtime.
 *
 * The real WDK SDK verification must run via the CLI smoke test:
 *   npm run wdk:smoke
 *
 * This API returns an honest status rather than faking success.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HONEST_STATUS = {
  ok: false,
  sdk: "@tetherto/wdk",
  walletModule: "@tetherto/wdk-wallet-evm",
  network: "Sepolia",
  chainId: 11155111,
  balanceRead: false,
  feeQuote: false,
  messageSigned: false,
  signatureVerified: false,
  broadcast: false,
  secretsPersisted: false,
  error:
    "WDK SDK requires native Node.js addons (sodium-native) that are incompatible with Next.js serverless bundling. The real WDK verification is available locally via the CLI smoke test: npm run wdk:smoke",
};

export async function GET(): Promise<Response> {
  return Response.json(
    {
      ...HONEST_STATUS,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
