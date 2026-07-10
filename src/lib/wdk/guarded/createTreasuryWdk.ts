import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

import type { PaymentIntent } from "@/domain/treasury";

import { createPaymentIntentPolicy } from "./createPaymentIntentPolicy";
import {
  DEFAULT_SEPOLIA_CHAIN_ID,
  DEFAULT_SEPOLIA_RPC_URL,
  WDK_EVM_WALLET_ID,
  type TreasuryWdkConfig,
  type TreasuryWdkContext,
  type WdkEvmAccount,
} from "./types";

export async function createTreasuryWdk(
  config: TreasuryWdkConfig = {},
): Promise<TreasuryWdkContext> {
  const walletId = config.walletId ?? WDK_EVM_WALLET_ID;
  const accountIndex = config.accountIndex ?? 0;
  const chainId = config.chainId ?? DEFAULT_SEPOLIA_CHAIN_ID;
  const provider = config.provider ?? DEFAULT_SEPOLIA_RPC_URL;
  const seedPhrase = WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase).registerWallet(walletId, WalletManagerEvm, {
    chainId,
    provider,
  });

  let account = (await wdk.getAccount(
    walletId,
    accountIndex,
  )) as unknown as WdkEvmAccount;
  const walletAddress = await account.getAddress();

  const context: TreasuryWdkContext = {
    walletId,
    accountIndex,
    chainId,
    provider,
    walletAddress,
    account,
    async registerPaymentIntentPolicy(intent: PaymentIntent) {
      wdk.registerPolicy(
        createPaymentIntentPolicy({
          intent,
          walletId,
          accountIndex,
        }),
        { conditionTimeoutMs: 5_000 },
      );
      account = (await wdk.getAccount(
        walletId,
        accountIndex,
      )) as unknown as WdkEvmAccount;
      context.account = account;

      return account;
    },
    dispose() {
      wdk.dispose();
    },
  };

  return context;
}
