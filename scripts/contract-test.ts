import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { Contract, ContractFactory, JsonRpcProvider, ZeroAddress, keccak256, toUtf8Bytes, type InterfaceAbi } from "ethers";

import { startLocalHardhatNode } from "./lib/localHardhatNode";

type Artifact = { abi: InterfaceAbi; bytecode: string };
let assertions = 0;
let passed = 0;

async function main() {
  const startedAt = performance.now();
  const node = await startLocalHardhatNode({ logPath: resolve("artifacts/contract-node.log") });
  try {
    await testTeamTreasury(node.rpcUrl);
    console.log(`Contract harness passed ${passed}/${assertions} assertions in ${(performance.now() - startedAt).toFixed(0)}ms.`);
  } catch (error) {
    console.error(`Contract harness failed after ${passed}/${assertions} assertions.\n${node.getLogs()}`);
    throw error;
  } finally {
    await node.stop();
  }
}

async function testTeamTreasury(rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl, 31337, { staticNetwork: true, cacheTimeout: 0 });
  try {
    const [deployer, captain, treasurer, player, recipient, relayer] = await Promise.all([0, 1, 2, 3, 4, 5].map((index) => provider.getSigner(index)));
    const [deployerAddress, captainAddress, treasurerAddress, playerAddress, recipientAddress] = await Promise.all([deployer, captain, treasurer, player, recipient].map((signer) => signer.getAddress()));
    const Mock = new ContractFactory((await artifact("MockUSDT")).abi, (await artifact("MockUSDT")).bytecode, deployer);
    const token = (await Mock.deploy(deployerAddress)) as unknown as Contract; await token.waitForDeployment();
    check("MockUSDT uses six decimals", await token.decimals(), 6n);
    await rejects("unauthorized MockUSDT mint", () => token.connect(player).mint(playerAddress, 1n));
    const Treasury = new ContractFactory((await artifact("TeamTreasury")).abi, (await artifact("TeamTreasury")).bytecode, deployer);
    await rejects("duplicate officers rejected", () => Treasury.deploy(captainAddress, captainAddress));
    const treasury = (await Treasury.deploy(captainAddress, treasurerAddress)) as unknown as Contract; await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    check("captain role initialized", await treasury.hasRole(await treasury.CAPTAIN_ROLE(), captainAddress), true);
    check("treasurer role initialized", await treasury.hasRole(await treasury.TREASURER_ROLE(), treasurerAddress), true);
    await (await token.mint(treasuryAddress, 500_000_000n)).wait();
    check("local test mint accounted", await token.balanceOf(treasuryAddress), 500_000_000n);
    const block = await provider.getBlock("latest");
    const expiresAt = BigInt(block!.timestamp + 3600);
    const hash = keccak256(toUtf8Bytes("contract-harness-intent"));
    const tokenAddress = await token.getAddress();
    await rejects("nonexistent request cannot approve", () => treasury.connect(captain).approveRequest(99n));
    await rejects("nonexistent request cannot execute", () => treasury.connect(relayer).executeRequest(99n));
    await rejects("nonexistent request cannot cancel", () => treasury.connect(captain).cancelRequest(99n));
    await rejects("nonexistent request cannot read", () => treasury.getRequest(99n));
    await rejects("player cannot create", () => treasury.connect(player).createRequest(tokenAddress, recipientAddress, 120_000_000n, hash, expiresAt, 2));
    await rejects("zero token rejected", () => treasury.connect(captain).createRequest(ZeroAddress, recipientAddress, 1n, hash, expiresAt, 1));
    await rejects("zero recipient rejected", () => treasury.connect(captain).createRequest(tokenAddress, ZeroAddress, 1n, hash, expiresAt, 1));
    await rejects("zero amount rejected", () => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 0n, hash, expiresAt, 1));
    await rejects("zero PaymentIntent hash rejected", () => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, "0x" + "00".repeat(32), expiresAt, 1));
    await rejects("expired creation rejected", () => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, hash, BigInt(block!.timestamp), 1));
    await rejects("invalid threshold rejected", () => treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, hash, expiresAt, 3));
    const created = await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 120_000_000n, hash, expiresAt, 2); await created.wait();
    const request = await treasury.getRequest(0n);
    check("request zero exists", request.exists, true); check("stored hash matches", request.paymentIntentHash, hash); check("stored threshold matches", request.requiredApprovals, 2n);
    await rejects("player cannot approve", () => treasury.connect(player).approveRequest(0n));
    await (await treasury.connect(captain).approveRequest(0n)).wait();
    check("captain approval recorded", (await treasury.getRequest(0n)).approvalCount, 1n);
    await rejects("duplicate approval rejected", () => treasury.connect(captain).approveRequest(0n));
    await rejects("one approval cannot execute", () => treasury.connect(relayer).executeRequest(0n));
    await (await treasury.connect(treasurer).approveRequest(0n)).wait();
    check("treasurer approval recorded", (await treasury.getRequest(0n)).approvalCount, 2n);
    const beforeRecipient = await token.balanceOf(recipientAddress);
    await (await treasury.connect(relayer).executeRequest(0n)).wait();
    check("permissionless relayer receives no redirected value", await token.balanceOf(recipientAddress), beforeRecipient + 120_000_000n);
    check("exact treasury debit", await token.balanceOf(treasuryAddress), 380_000_000n);
    check("request is executed", (await treasury.getRequest(0n)).executed, true);
    await rejects("executed request cannot replay", () => treasury.connect(relayer).executeRequest(0n));
    await (await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, keccak256(toUtf8Bytes("cancelled")), expiresAt, 1)).wait();
    await (await treasury.connect(treasurer).cancelRequest(1n)).wait();
    await rejects("cancelled request cannot execute", () => treasury.connect(relayer).executeRequest(1n));
    const current = await provider.getBlock("latest"); const shortExpiry = BigInt(current!.timestamp + 3600);
    await (await treasury.connect(captain).createRequest(tokenAddress, recipientAddress, 1n, keccak256(toUtf8Bytes("expired")), shortExpiry, 1)).wait();
    await provider.send("evm_increaseTime", [3601]); await provider.send("evm_mine", []);
    await rejects("expired request cannot approve", () => treasury.connect(captain).approveRequest(2n));
  } finally { provider.destroy(); }
}

async function artifact(name: "MockUSDT" | "TeamTreasury"): Promise<Artifact> { return JSON.parse(await readFile(resolve(`contracts/artifacts/contracts/src/${name}.sol/${name}.json`), "utf8")) as Artifact; }
function check(name: string, actual: unknown, expected: unknown) { assertions += 1; if (actual !== expected) throw new Error(`${name}: expected ${String(expected)}, received ${String(actual)}`); passed += 1; console.log(`PASS ${name}`); }
async function rejects(name: string, action: () => Promise<unknown>) { assertions += 1; try { await action(); } catch { passed += 1; console.log(`PASS ${name}`); return; } throw new Error(`${name}: expected revert`); }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
