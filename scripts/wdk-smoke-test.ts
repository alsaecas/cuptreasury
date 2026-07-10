import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runWdkSmokeVerification } from "@/lib/wdk/wdkSmokeVerification";

const ARTIFACT_PATH = resolve("artifacts/wdk-smoke-proof.json");

async function main() {
  const result = await runWdkSmokeVerification();
  console.log(JSON.stringify(result, null, 2));

  await mkdir(dirname(ARTIFACT_PATH), { recursive: true });
  await writeFile(ARTIFACT_PATH, `${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
