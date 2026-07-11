import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { Contract, ContractFactory, JsonRpcProvider, ZeroAddress, keccak256, toUtf8Bytes, type ContractTransactionResponse, type InterfaceAbi } from "ethers";

const PORT = 18545;
const RPC_URL = `http://127.0.0.1:${PORT}`;
const AMOUNT = 120_000_000n;
const FUNDING = 500_000_000n;
type Artifact = { abi: InterfaceAbi; bytecode: string };

async function main() {
  const node = startNode();
  try {
    await waitForRpc();
    await runContractTests();
    console.log("Contract tests passed: 18 assertions across MockUSDT and TeamTreasury.");
  } finally {
    node.kill("SIGTERM");
    await once(node, "exit");
  }
}

async function runContractTests() {
  const provider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true });
  const deployer = await provider.getSigner(0);
  const captain = await provider.getSigner(1);
  const treasurer = await provider.getSigner(2);
  const player = await provider.getSigner(3);
  const recipient = await provider.getSigner(4);
  const [captainAddress, treasurerAddress, playerAddress, recipientAddress, deployerAddress] = await Promise.all([captain.getAddress(), treasurer.getAddress(), player.getAddress(), recipient.getAddress(), deployer.getAddress()]);
  const Mock = new ContractFactory((await artifact("MockUSDT")).abi, (await artifact("MockUSDT")).bytecode, deployer);
  const mock = (await Mock.deploy(deployerAddress)) as unknown as Contract;
  await mock.waitForDeployment();
  assertEqual(await mock.name(), "Mock USD Tether", "MockUSDT name");
  assertEqual(await mock.symbol(), "MockUSDT", "MockUSDT symbol");
  assertEqual(await mock.decimals(), 6n, "six-decimal token");
  await expectRevert(() => mock.connect(player).mint(playerAddress, 1n), "unauthorized mint rejected");

  const TreasuryArtifact = await artifact("TeamTreasury");
  const Treasury = new ContractFactory(TreasuryArtifact.abi, TreasuryArtifact.bytecode, deployer);
  const treasury = (await Treasury.deploy(captainAddress, treasurerAddress)) as unknown as Contract;
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  assertEqual(await treasury.hasRole(await treasury.CAPTAIN_ROLE(), captainAddress), true, "captain role");
  assertEqual(await treasury.hasRole(await treasury.TREASURER_ROLE(), treasurerAddress), true, "treasurer role");
  await (await mock.mint(treasuryAddress, FUNDING)).wait();
  assertEqual(await mock.balanceOf(treasuryAddress), FUNDING, "test mint balance accounting");

  const intentHash = keccak256(toUtf8Bytes("cup-treasury-contract-test-intent"));
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const tokenAddress = await mock.getAddress();
  await expectRevert(() => treasury.connect(player).createRequest(tokenAddress, recipientAddress, AMOUNT, intentHash, expiresAt, 2), "player create denied");
  await expectRevert(() => treasury.connect(captain).createRequest(ZeroAddress, recipientAddress, AMOUNT, intentHash, expiresAt, 2), "zero token rejected");
  await expectRevert(() => treasury.connect(captain).createRequest(tokenAddress, ZeroAddress, AMOUNT, intentHash, expiresAt, 2), "zero recipient rejected");
  await expectRevert(() => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 0n, intentHash, expiresAt, 2), "zero amount rejected");
  await expectRevert(() => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, AMOUNT, intentHash, expiresAt - 7200n, 2), "expired creation rejected");
  await expectRevert(() => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, AMOUNT, intentHash, expiresAt, 3), "unsupported threshold rejected");

  const created = await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, AMOUNT, intentHash, expiresAt, 2);
  assertEvent(treasury, await created.wait(), "RequestCreated", "request created event");
  const request = await treasury.getRequest(0n);
  assertEqual(request.paymentIntentHash, intentHash, "stored PaymentIntent hash");
  assertEqual(request.requiredApprovals, 2n, "stored threshold");
  await expectRevert(() => treasury.connect(player).approveRequest(0n), "player approval denied");
  await (await treasury.connect(captain).approveRequest(0n)).wait();
  assertEqual((await treasury.getRequest(0n)).approvalCount, 1n, "captain approval");
  await expectRevert(() => treasury.connect(captain).approveRequest(0n), "duplicate approval denied");
  await expectRevert(() => treasury.connect(captain).executeRequest(0n), "one approval insufficient");
  const approved = await treasury.connect(treasurer).approveRequest(0n);
  assertEvent(treasury, await approved.wait(), "RequestApproved", "treasurer approval event");
  assertEqual((await treasury.getRequest(0n)).approvalCount, 2n, "two approvals");
  const readyRequest = await treasury.getRequest(0n);
  assertEqual(readyRequest.requiredApprovals, 2n, "ready request threshold");
  const beforeRecipient = await mock.balanceOf(recipientAddress);
  const executed = await treasury.connect(captain).executeRequest(0n);
  assertEvent(treasury, await executed.wait(), "RequestExecuted", "request executed event");
  assertEqual(await mock.balanceOf(recipientAddress), beforeRecipient + AMOUNT, "exact recipient transfer");
  assertEqual(await mock.balanceOf(treasuryAddress), FUNDING - AMOUNT, "treasury balance delta");
  assertEqual((await treasury.getRequest(0n)).executed, true, "executed state set");
  await expectRevert(() => treasury.connect(captain).executeRequest(0n), "executed request cannot replay");
  await expectRevert(() => treasury.connect(captain).approveRequest(0n), "executed request cannot approve");

  await (await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, keccak256(toUtf8Bytes("cancelled")), expiresAt, 1)).wait();
  const cancelled = await treasury.connect(treasurer).cancelRequest(1n);
  assertEvent(treasury, await cancelled.wait(), "RequestCancelled", "request cancelled event");
  await expectRevert(() => treasury.connect(captain).approveRequest(1n), "cancelled request cannot approve");
  await expectRevert(() => treasury.connect(captain).executeRequest(1n), "cancelled request cannot execute");

  const block = await provider.getBlock("latest");
  await (await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, keccak256(toUtf8Bytes("expired")), BigInt(block!.timestamp + 1), 1)).wait();
  await provider.send("evm_increaseTime", [2]);
  await provider.send("evm_mine", []);
  await expectRevert(() => treasury.connect(captain).approveRequest(2n), "expired request cannot approve");
  await expectRevert(() => treasury.connect(captain).executeRequest(2n), "expired request cannot execute");
}

async function artifact(name: "MockUSDT" | "TeamTreasury"): Promise<Artifact> {
  return JSON.parse(await readFile(resolve(`contracts/artifacts/contracts/src/${name}.sol/${name}.json`), "utf8")) as Artifact;
}

function startNode(): ChildProcess {
  return spawn(process.execPath, [resolve("node_modules/hardhat/dist/src/cli.js"), "node", "--port", String(PORT)], {
    cwd: resolve("."),
    stdio: "ignore",
  });
}

async function waitForRpc() {
  const provider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await provider.getNetwork()).chainId === 31337n) {
        await provider.getBlockNumber();
        return;
      }
    } catch { /* starting */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error("Timed out while starting the local Hardhat chain.");
}

async function expectRevert(action: () => Promise<unknown>, label: string) {
  try { await action(); } catch { return; }
  throw new Error(`Expected revert: ${label}`);
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function assertEvent(contract: Contract, receipt: Awaited<ReturnType<ContractTransactionResponse["wait"]>>, event: string, label: string) {
  const found = receipt?.logs.some((log) => {
    try { return contract.interface.parseLog(log)?.name === event; } catch { return false; }
  });
  if (!found) throw new Error(`Missing ${event}: ${label}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
