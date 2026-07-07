import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

const DEFAULT_SEPOLIA_RPC_URL = "https://sepolia.drpc.org";
const DEFAULT_SEPOLIA_CHAIN_ID = 11155111;
const SMOKE_TEST_MESSAGE = "CupTreasury WDK smoke test";

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

async function main() {
  const provider =
    process.env.WDK_SMOKE_EVM_RPC_URL ?? DEFAULT_SEPOLIA_RPC_URL;
  const chainId = Number(
    process.env.WDK_SMOKE_EVM_CHAIN_ID ?? DEFAULT_SEPOLIA_CHAIN_ID,
  );

  const seedPhrase = WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase).registerWallet("ethereum", WalletManagerEvm, {
    chainId,
    provider,
  });

  try {
    const account = (await wdk.getAccount(
      "ethereum",
      0,
    )) as unknown as EvmSmokeAccount;
    const address = await account.getAddress();
    const signature = await account.sign(SMOKE_TEST_MESSAGE);
    const signatureVerified = await account.verify(
      SMOKE_TEST_MESSAGE,
      signature,
    );
    const nativeBalanceWei = await account.getBalance();
    const quote = await account.quoteSendTransaction({
      to: address,
      value: BigInt(0),
      chainId,
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          packageNames: ["@tetherto/wdk", "@tetherto/wdk-wallet-evm"],
          network: "Sepolia",
          chainId,
          address,
          nativeBalanceWei: nativeBalanceWei.toString(),
          zeroValueTransferEstimatedFeeWei: quote.fee.toString(),
          signatureVerified,
          broadcastedTransaction: false,
          seedPhrasePersisted: false,
        },
        null,
        2,
      ),
    );
  } finally {
    wdk.dispose();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
