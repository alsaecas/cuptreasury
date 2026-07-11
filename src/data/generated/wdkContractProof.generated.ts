// Generated from artifacts/wdk-contract-proof.json.
// Do not edit manually.

export const wdkContractProof = {
  "ok": true,
  "schemaVersion": 1,
  "generatedAt": "2026-07-11T15:25:59.451Z",
  "sourceCommit": "e95872adf1863f1480bc7aca363dfddebc8cd57a",
  "network": {
    "name": "hardhat",
    "chainId": 31337,
    "ephemeral": true,
    "realFundsUsed": false
  },
  "token": {
    "symbol": "MockUSDT",
    "decimals": 6,
    "contractAddress": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "officialUsdt": false,
    "localTestOnly": true
  },
  "teamTreasury": {
    "contractAddress": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    "requestId": "0",
    "paymentIntentHash": "0x751588ed0ed222aa0847a2662539e132c731988b46d1c3692abad2158ac7f7af",
    "requiredApprovals": 2,
    "approvalCount": 2
  },
  "wdk": {
    "coreVersion": "@tetherto/wdk",
    "evmModuleVersion": "@tetherto/wdk-wallet-evm",
    "executorAddress": "0x153cB58A328aB35fD51ADCdAd105060d14af24ed",
    "policyDecision": "ALLOW",
    "signedByWdk": true,
    "broadcastLocally": true,
    "approvalsSignedByWdk": true
  },
  "tamperScenarios": [
    {
      "id": "changed-request-id",
      "result": "DENY"
    },
    {
      "id": "changed-calldata",
      "result": "DENY"
    },
    {
      "id": "second-app-use",
      "result": "DENY"
    }
  ],
  "execution": {
    "transactionHash": "0xf02669a355919db39717b0d6d4422bbc3afcf27e5b379225e65b094a147adb22",
    "blockNumber": "9",
    "recipientBalanceBefore": "0",
    "recipientBalanceAfter": "120000000",
    "transferredAmount": "120000000",
    "requestExecuted": true
  },
  "defenseInDepth": {
    "wdkReplayDenied": true,
    "contractReplayReverted": true
  },
  "broadcast": {
    "localOnly": true,
    "publicTestnet": false,
    "mainnet": false
  },
  "secretsPersisted": false,
  "proofArtifactSha256": "2e25ff7788364ddaf031459fe27fe390277a6c86ab863d7973cf66778bc9f26e"
} as const;
