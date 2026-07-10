import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ARTIFACTS = [
  "artifacts/wdk-smoke-proof.json",
  "artifacts/wdk-policy-proof.json",
];
const OUTPUT_PATH = resolve("artifacts/proof-manifest.json");

async function main() {
  const hashes: Record<string, string> = {};

  for (const artifact of ARTIFACTS) {
    const contents = await readFile(resolve(artifact));
    hashes[artifact] = createHash("sha256").update(contents).digest("hex");
  }

  const manifest = {
    commitSha: sourceCommit(),
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    workflowRunUrl:
      process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
        ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    generatedAt: new Date().toISOString(),
    broadcast: false,
    secretsPersisted: false,
    artifactHashes: hashes,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${OUTPUT_PATH}`);
}

function sourceCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
