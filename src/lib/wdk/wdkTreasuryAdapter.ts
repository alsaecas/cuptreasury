import type { PaymentRequest, WalletInfo } from "@/types/treasury";

export type WdkAdapterMode = "demo" | "real";

export interface WdkAdapterStatus {
  mode: WdkAdapterMode;
  label: "Demo WDK adapter" | "Real WDK integration";
  packageName: "@tetherto/wdk";
  sdkInstalled: boolean;
  realTransactionsEnabled: boolean;
  summary: string;
  notes: string[];
}

export interface TreasuryWallet {
  id: string;
  address: string;
  network: string;
  token: WalletInfo["token"];
  custodyModel: WalletInfo["custodyModel"];
  adapterMode: WalletInfo["adapterMode"];
  ownerLabel: string;
}

export interface TreasuryBalance {
  walletId: string;
  amount: number;
  token: WalletInfo["token"];
  source: "local-demo-state" | "wdk-sdk";
  updatedAt: string;
}

export interface PreparedPayment {
  id: string;
  requestId: string;
  fromWallet: TreasuryWallet;
  toAddress: string;
  amount: number;
  token: WalletInfo["token"];
  network: string;
  memo: string;
  mode: WdkAdapterMode;
  status: "prepared";
  createdAt: string;
}

export interface ExecutedPayment {
  requestId: string;
  txHash: string;
  status: "simulated" | "submitted" | "confirmed";
  mode: WdkAdapterMode;
  message: string;
  executedAt: string;
  explorerUrl: string | null;
}

export interface WdkTreasuryAdapter {
  getAdapterStatus(): WdkAdapterStatus;
  getTreasuryWallet(wallet: WalletInfo): TreasuryWallet;
  getBalance(wallet: WalletInfo | TreasuryWallet): TreasuryBalance;
  preparePayment(
    request: PaymentRequest,
    wallet: WalletInfo,
  ): PreparedPayment;
  executePayment(payment: PreparedPayment): Promise<ExecutedPayment>;
  getExplorerUrl(txHash: string): string | null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

export const wdkTreasuryAdapter: WdkTreasuryAdapter = {
  getAdapterStatus() {
    return {
      mode: "demo",
      label: "Demo WDK adapter",
      packageName: "@tetherto/wdk",
      sdkInstalled: false,
      realTransactionsEnabled: false,
      summary:
        "CupTreasury currently exposes a WDK-ready payment boundary and simulates USDt execution for the judge demo.",
      notes: [
        "No seed phrase or private key is stored in React state or localStorage.",
        "Real WDK execution requires @tetherto/wdk plus a chain wallet module, provider, signing flow, and test funds.",
        "The dashboard calls this adapter for payment preparation and execution, so the mock can be replaced without changing UI flow.",
      ],
    };
  },

  getTreasuryWallet(wallet) {
    return {
      id: wallet.id,
      address: wallet.address,
      network: wallet.network,
      token: wallet.token,
      custodyModel: wallet.custodyModel,
      adapterMode: wallet.adapterMode,
      ownerLabel: "Valencia Hackers FC fan-group treasury",
    };
  },

  getBalance(wallet) {
    return {
      walletId: wallet.id,
      amount: "balance" in wallet ? wallet.balance : 0,
      token: wallet.token,
      source: wallet.adapterMode === "real" ? "wdk-sdk" : "local-demo-state",
      updatedAt: new Date().toISOString(),
    };
  },

  preparePayment(request, wallet) {
    if (request.amount > wallet.balance) {
      throw new Error("Treasury wallet has insufficient demo balance.");
    }

    const fromWallet = this.getTreasuryWallet(wallet);

    return {
      id: `prepared-${request.id}`,
      requestId: request.id,
      fromWallet,
      toAddress: "team-vendor-demo-address",
      amount: request.amount,
      token: wallet.token,
      network: wallet.network,
      memo: request.title,
      mode: fromWallet.adapterMode,
      status: "prepared",
      createdAt: new Date().toISOString(),
    };
  },

  async executePayment(payment) {
    await wait(500);

    const txHash = `sim-usdt-${Date.now().toString(16)}`;

    return {
      requestId: payment.requestId,
      txHash,
      status: "simulated",
      mode: payment.mode,
      message:
        "Simulated WDK payment. Replace this adapter with @tetherto/wdk wallet-manager calls for real signed execution.",
      executedAt: new Date().toISOString(),
      explorerUrl: this.getExplorerUrl(txHash),
    };
  },

  getExplorerUrl() {
    return null;
  },
};

// Real WDK integration path:
// 1. Install @tetherto/wdk plus a wallet module such as @tetherto/wdk-wallet-evm.
// 2. Keep seed material outside React component state and browser localStorage.
// 3. Register the wallet manager, derive the treasury account, quote the payment,
//    register local transaction policies, then execute a signed USDt transaction.
