import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";

import { JsonRpcProvider } from "ethers";

export interface LocalNodeHandle {
  process: ChildProcess;
  rpcUrl: string;
  port: number;
  stop(): Promise<void>;
  getLogs(): string;
}

export async function startLocalHardhatNode({
  logPath,
  timeoutMs = process.env.CI ? 30_000 : 15_000,
}: {
  logPath: string;
  timeoutMs?: number;
}): Promise<LocalNodeHandle> {
  const port = await availablePort();
  const rpcUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [resolve("node_modules/hardhat/dist/src/cli.js"), "node", "--port", String(port)], {
    cwd: resolve("."), stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0" },
  });
  let logs = "";
  child.stdout?.on("data", (chunk: Buffer) => { logs += chunk.toString(); });
  child.stderr?.on("data", (chunk: Buffer) => { logs += chunk.toString(); });
  const persistLogs = async () => {
    await mkdir(dirname(logPath), { recursive: true });
    await writeFile(logPath, sanitize(logs));
  };
  const exit = new Promise<never>((_, reject) => {
    child.once("error", async (error) => { await persistLogs(); reject(new Error(`Hardhat node process error on port ${port}: ${error.message}\n${sanitize(logs)}`)); });
    child.once("exit", async (code, signal) => { await persistLogs(); reject(new Error(`Hardhat node exited before readiness on port ${port} (code ${code}, signal ${signal}).\n${sanitize(logs)}`)); });
  });
  try {
    await Promise.race([waitForReady(rpcUrl, timeoutMs), exit]);
  } catch (error) {
    await stopChild(child);
    throw error;
  }
  return {
    process: child, rpcUrl, port,
    getLogs: () => sanitize(logs),
    async stop() { await stopChild(child); await persistLogs(); },
  };
}

async function waitForReady(rpcUrl: string, timeoutMs: number) {
  const provider = new JsonRpcProvider(rpcUrl, 31337, { staticNetwork: true, cacheTimeout: 0 });
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      try {
        const [chainId, block, accounts] = await Promise.all([
          provider.send("eth_chainId", []), provider.getBlock("latest"), provider.send("eth_accounts", []),
        ]);
        if (chainId === "0x7a69" && block && Array.isArray(accounts) && accounts.length >= 5) return;
      } catch { /* node is still starting */ }
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error(`Hardhat node readiness timed out after ${timeoutMs}ms at ${rpcUrl}.`);
  } finally {
    provider.destroy();
  }
}

async function availablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolvePort(typeof address === "object" && address ? address.port : 0));
    });
  });
}

async function stopChild(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

function sanitize(logs: string): string {
  return logs.replace(/(Private Key:\s*)0x[0-9a-f]+/gi, "$1[redacted]");
}
