import { spawn, type ChildProcess } from "node:child_process";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { Policy } from "@tetherto/wdk";
import { Contract, ContractFactory, Interface, JsonRpcProvider, type InterfaceAbi } from "ethers";

import { createPaymentIntent, fixedClock, hashPaymentIntent, InMemoryTreasuryMembershipProvider, type TreasuryApproval, type TreasuryPaymentRequest } from "@/domain/treasury";
import { InMemoryPaymentIntentConsumptionStore, createTreasuryWdk, type EvmTransaction, type TreasuryWdkContext } from "@/lib/wdk/guarded";
import { createTeamTreasuryExecutionPolicy, prepareTeamTreasuryTransaction, teamTreasuryInterface } from "@/lib/wdk/contracts";

const PORT = 18546;
/* eslint-disable @typescript-eslint/no-explicit-any */
const RPC_URL = `http://127.0.0.1:${PORT}`;
const WRITE_JSON = process.argv.includes("--json");
const ARTIFACT_PATH = resolve("artifacts/wdk-contract-proof.json");
const AMOUNT = 120_000_000n;
const FUNDING = 500_000_000n;
type Artifact = { abi: InterfaceAbi; bytecode: string };

async function main() {
  const node = startNode();
  let captainContext: TreasuryWdkContext | undefined;
  let treasurerContext: TreasuryWdkContext | undefined;
  try {
    await waitForRpc();
    captainContext = await createTreasuryWdk({ chainId: 31337, provider: RPC_URL });
    treasurerContext = await createTreasuryWdk({ chainId: 31337, provider: RPC_URL });
    const proof = await runProof(captainContext, treasurerContext);
    validateProof(proof);
    console.log("WDK local contract proof: ALLOW exact call; DENY tampering/replay; transferred 120000000 MockUSDT.");
    if (WRITE_JSON) {
      await mkdir(dirname(ARTIFACT_PATH), { recursive: true });
      await writeFile(ARTIFACT_PATH, `${JSON.stringify(proof, null, 2)}\n`);
      console.log(`Sanitized proof written to ${ARTIFACT_PATH}`);
    }
  } finally {
    captainContext?.dispose();
    treasurerContext?.dispose();
    node.kill("SIGTERM");
    await once(node, "exit");
  }
}

async function runProof(captain: TreasuryWdkContext, treasurer: TreasuryWdkContext) {
  const provider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true });
  const deployer = await provider.getSigner(0);
  const recipient = await (await provider.getSigner(4)).getAddress();
  const [captainAddress, treasurerAddress] = [captain.walletAddress, treasurer.walletAddress];
  await (await deployer.sendTransaction({ to: captainAddress, value: 10n ** 18n })).wait();
  await (await deployer.sendTransaction({ to: treasurerAddress, value: 10n ** 18n })).wait();
  const deployerAddress = await deployer.getAddress();
  const Mock = new ContractFactory((await artifact("MockUSDT")).abi, (await artifact("MockUSDT")).bytecode, deployer);
  const token = (await Mock.deploy(deployerAddress)) as unknown as Contract; await token.waitForDeployment();
  const TreasuryArtifact = await artifact("TeamTreasury");
  const Treasury = new ContractFactory(TreasuryArtifact.abi, TreasuryArtifact.bytecode, deployer);
  const treasury = (await Treasury.deploy(captainAddress, treasurerAddress)) as unknown as Contract; await treasury.waitForDeployment();
  const [tokenAddress, treasuryAddress] = [await token.getAddress(), await treasury.getAddress()];
  await (await token.mint(treasuryAddress, FUNDING)).wait();
  const now = new Date(); const expiresAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
  const membership = new InMemoryTreasuryMembershipProvider([
    { memberId: "captain", address: captainAddress, name: "Ephemeral Captain", role: "Captain", active: true },
    { memberId: "treasurer", address: treasurerAddress, name: "Ephemeral Treasurer", role: "Treasurer", active: true },
  ]);
  const approvals: TreasuryApproval[] = [
    { id: "captain-domain-approval", memberId: "captain", memberAddress: captainAddress, memberName: "Ephemeral Captain", role: "Captain", createdAt: now.toISOString() },
    { id: "treasurer-domain-approval", memberId: "treasurer", memberAddress: treasurerAddress, memberName: "Ephemeral Treasurer", role: "Treasurer", createdAt: now.toISOString() },
  ];
  const request: TreasuryPaymentRequest = { id: "request-van-rental", title: "Van rental", amountAtomic: AMOUNT.toString(), displayAmount: "120", tokenSymbol: "MockUSDT", tokenDecimals: 6, requestedByMemberId: "captain", requestedByAddress: captainAddress, status: "pending", approvals, memo: "Football transport: seven-seat away-match van.", createdAt: now.toISOString(), expiresAt };
  const intent = createPaymentIntent({ request, treasuryAccount: captainAddress, chainId: 31337, tokenAddress, recipient, expiresAt, nonce: "local-contract-proof", intentId: "intent-local-van-rental", createdAt: now.toISOString() }, { clock: fixedClock(now), membershipProvider: membership });
  const paymentIntentHash = hashPaymentIntent(intent);

  const createData = new Interface(["function createRequest(address,address,uint256,bytes32,uint64,uint8)"]).encodeFunctionData("createRequest", [tokenAddress, recipient, AMOUNT, paymentIntentHash, BigInt(Math.floor(Date.parse(expiresAt) / 1000)), 2]);
  await signedBroadcast(captain, await providerTransaction(provider, captainAddress, treasuryAddress, createData), "create-request");
  const approvalData = new Interface(["function approveRequest(uint256)"]).encodeFunctionData("approveRequest", [0n]);
  await signedBroadcast(captain, await providerTransaction(provider, captainAddress, treasuryAddress, approvalData), "captain-approval");
  await signedBroadcast(treasurer, await providerTransaction(provider, treasurerAddress, treasuryAddress, approvalData), "treasurer-approval");
  const onChain = await treasury.getRequest(0n);
  const plan = await prepareTeamTreasuryTransaction({ providerUrl: RPC_URL, from: captainAddress, treasuryContract: treasuryAddress, requestId: 0n, intent });
  const store = new InMemoryPaymentIntentConsumptionStore();
  const executionAccount = await captain.registerPolicy(createTeamTreasuryExecutionPolicy({ intent, plan, walletId: captain.walletId, accountIndex: captain.accountIndex, consumptionStore: store }));
  const changedRequestId = { ...plan.transaction, data: teamTreasuryInterface.encodeFunctionData("executeRequest", [1n]) };
  const changedCalldata = { ...plan.transaction, data: `${plan.calldata.slice(0, -2)}01` };
  const allow = await executionAccount.simulate.signTransaction(plan.transaction);
  const denyRequest = await executionAccount.simulate.signTransaction(changedRequestId);
  const denyCalldata = await executionAccount.simulate.signTransaction(changedCalldata);
  if (allow.decision !== "ALLOW") throw new Error(`WDK did not allow exact execution: ${allow.reason}`);
  const raw = await executionAccount.signTransaction(plan.transaction);
  await store.consumeAtomically(intent.id, intent.nonce);
  const receipt = await (await provider.broadcastTransaction(raw)).wait();
  const before = 0n;
  const after = await token.balanceOf(recipient);
  const replay = await executionAccount.simulate.signTransaction(plan.transaction);
  let contractReplayReverted = false;
  try { await (await provider.getSigner(0)).sendTransaction({ to: treasuryAddress, data: plan.calldata }); } catch { contractReplayReverted = true; }
  if (!receipt) throw new Error("Local transaction did not produce a receipt.");
  return {
    ok: true, schemaVersion: 1, generatedAt: new Date().toISOString(), sourceCommit: sourceCommit(),
    network: { name: "hardhat", chainId: 31337, ephemeral: true, realFundsUsed: false },
    token: { symbol: "MockUSDT", decimals: 6, contractAddress: tokenAddress, officialUsdt: false, localTestOnly: true },
    teamTreasury: { contractAddress: treasuryAddress, requestId: "0", paymentIntentHash, requiredApprovals: Number(onChain.requiredApprovals), approvalCount: Number(onChain.approvalCount) },
    wdk: { coreVersion: "@tetherto/wdk", evmModuleVersion: "@tetherto/wdk-wallet-evm", executorAddress: captainAddress, policyDecision: allow.decision, signedByWdk: true, broadcastLocally: true, approvalsSignedByWdk: true },
    tamperScenarios: [{ id: "changed-request-id", result: denyRequest.decision }, { id: "changed-calldata", result: denyCalldata.decision }, { id: "second-app-use", result: replay.decision }],
    execution: { transactionHash: receipt.hash, blockNumber: receipt.blockNumber.toString(), recipientBalanceBefore: before.toString(), recipientBalanceAfter: after.toString(), transferredAmount: (after - before).toString(), requestExecuted: (await treasury.getRequest(0n)).executed },
    defenseInDepth: { wdkReplayDenied: replay.decision === "DENY", contractReplayReverted }, broadcast: { localOnly: true, publicTestnet: false, mainnet: false }, secretsPersisted: false,
  };
}

async function signedBroadcast(context: TreasuryWdkContext, transaction: EvmTransaction, id: string) {
  const account = await context.registerPolicy(exactPolicy(context, transaction, id));
  const decision = await account.simulate.signTransaction(transaction);
  if (decision.decision !== "ALLOW") throw new Error(`WDK denied ${id}: ${decision.reason}`);
  const raw = await account.signTransaction(transaction);
  const receipt = await (await new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true }).broadcastTransaction(raw)).wait();
  if (!receipt?.status) throw new Error(`Local ${id} transaction failed.`);
}

function exactPolicy(context: TreasuryWdkContext, expected: EvmTransaction, id: string): Policy {
  return { id: `cup-treasury-${id}`, name: `CupTreasury ${id}`, scope: "account", wallet: context.walletId, accounts: [context.accountIndex], rules: [{ name: "allow-exact-local-wdk-call", operation: "signTransaction", action: "ALLOW", reason: "Exact local contract transaction matched.", conditions: [({ params }) => exact(params as EvmTransaction, expected)] }] };
}

function exact(actual: EvmTransaction, expected: EvmTransaction) {
  const same = (a: unknown, b: unknown) => { try { return BigInt(a as string | number | bigint) === BigInt(b as string | number | bigint); } catch { return a === b; } };
  return actual.to?.toLowerCase() === expected.to?.toLowerCase() && actual.data === expected.data && same(actual.value, expected.value) && same(actual.chainId, expected.chainId) && same(actual.nonce, expected.nonce) && same(actual.gasLimit, expected.gasLimit) && same(actual.gasPrice, expected.gasPrice) && same(actual.maxFeePerGas, expected.maxFeePerGas) && same(actual.maxPriorityFeePerGas, expected.maxPriorityFeePerGas) && same(actual.type, expected.type);
}

async function providerTransaction(provider: JsonRpcProvider, from: string, to: string, data: string): Promise<EvmTransaction> {
  const freshProvider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true, cacheTimeout: 0 });
  const [nonce, gasLimit, fee] = await Promise.all([freshProvider.getTransactionCount(from, "pending"), freshProvider.estimateGas({ from, to, data, value: 0n }), freshProvider.getFeeData()]);
  if (fee.maxFeePerGas !== null && fee.maxPriorityFeePerGas !== null) return { to, data, value: 0n, chainId: 31337, nonce, gasLimit, type: 2, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas };
  return { to, data, value: 0n, chainId: 31337, nonce, gasLimit, gasPrice: fee.gasPrice ?? 1n };
}

async function artifact(name: "MockUSDT" | "TeamTreasury"): Promise<Artifact> { return JSON.parse(await readFile(resolve(`contracts/artifacts/contracts/src/${name}.sol/${name}.json`), "utf8")) as Artifact; }
function startNode(): ChildProcess { return spawn(process.execPath, [resolve("node_modules/hardhat/dist/src/cli.js"), "node", "--port", String(PORT)], { cwd: resolve("."), stdio: "ignore" }); }
async function waitForRpc() { const provider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true }); for (let i = 0; i < 80; i += 1) { try { await provider.getBlockNumber(); return; } catch { await new Promise((done) => setTimeout(done, 100)); } } throw new Error("Timed out starting local Hardhat chain."); }
function sourceCommit() { try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return process.env.GITHUB_SHA ?? "unknown"; } }
function validateProof(proof: any) { if (!proof.ok || proof.wdk.policyDecision !== "ALLOW" || !proof.wdk.signedByWdk || proof.execution.transferredAmount !== "120000000" || !proof.defenseInDepth.wdkReplayDenied || !proof.defenseInDepth.contractReplayReverted || proof.tamperScenarios.some((item: any) => item.result !== "DENY")) throw new Error("Mandatory local contract proof condition failed."); }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
