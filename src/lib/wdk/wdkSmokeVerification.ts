/**
 * WDK Smoke Verification — shared server-side logic.
 *
 * SERVER-ONLY. Do NOT import this module from client components.
 * Both the CLI smoke test and the Next.js API route depend on it.
 *
 * Security:
 * - Generates ephemeral wallet material in memory only.
 * - Never persists seed phrase, private key, or mnemonic.
 * - Never broadcasts a transaction.
 * - Never returns signing material.
 */

import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

const DEFAULT_SEPOLIA_RPC_URL = "https://sepolia.drpc.org";
const DEFAULT_SEPOLIA_CHAIN_ID = 11155111;
const SMOKE_TEST_MESSAGE = "CupTreasury WDK smoke test";

export interface WdkSmokeVerificationResult {
  ok: boolean;
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
  broadcast: boolean;
  secretsPersisted: boolean;
  timestamp: string;
  error?: string;
}

interface EvmSmokeAccount {
  getAddress(): Promise<string>;
  sign(message: string): Promise<string>;
  verify(message: string, signature: string): Promise<boolean>;
  getBalance(): Promise<bigint>;
  quoteSendTransaction(transaction: {
    to: string;
    value: bigint;
    chainId: number;
  }): Promise<{ fee: bigint }>;
}

export async function runWdkSmokeVerification(
  signal?: AbortSignal,
): Promise<WdkSmokeVerificationResult> {
  const provider =
    process.env.WDK_SMOKE_EVM_RPC_URL ?? DEFAULT_SEPOLIA_RPC_URL;
  const chainId = Number(
    process.env.WDK_SMOKE_EVM_CHAIN_ID ?? DEFAULT_SEPOLIA_CHAIN_ID,
  );

  const timestamp = new Date().toISOString();

  const seedPhrase = WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase).registerWallet("ethereum", WalletManagerEvm, {
    chainId,
    provider,
  });

  try {
    signal?.throwIfAborted();

    const account = (await wdk.getAccount(
      "ethereum",
      0,
    )) as unknown as EvmSmokeAccount;

    const address = await account.getAddress();
    signal?.throwIfAborted();

    const [
      signature,
      nativeBalanceWei,
    ] = await Promise.all([
      account.sign(SMOKE_TEST_MESSAGE),
      account.getBalance(),
    ]);
    signal?.throwIfAborted();

    const [signatureVerified, quote] = await Promise.all([
      account.verify(SMOKE_TEST_MESSAGE, signature),
      account.quoteSendTransaction({
        to: address,
        value: BigInt(0),
        chainId,
      }),
    ]);

    return {
      ok: true,
      sdk: "@tetherto/wdk",
      walletModule: "@tetherto/wdk-wallet-evm",
      network: "Sepolia",
      chainId,
      ephemeralAddress: address,
      nativeBalanceWei: nativeBalanceWei.toString(),
      zeroValueTransferEstimatedFeeWei: quote.fee.toString(),
      balanceRead: true,
      feeQuote: true,
      messageSigned: true,
      signatureVerified,
      broadcast: false,
      secretsPersisted: false,
      timestamp,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown WDK smoke test failure";

    return {
      ok: false,
      sdk: "@tetherto/wdk",
      walletModule: "@tetherto/wdk-wallet-evm",
      network: "Sepolia",
      chainId,
      balanceRead: false,
      feeQuote: false,
      messageSigned: false,
      signatureVerified: false,
      broadcast: false,
      secretsPersisted: false,
      timestamp,
      error: message,
    };
  } finally {
    wdk.dispose();
  }
}
