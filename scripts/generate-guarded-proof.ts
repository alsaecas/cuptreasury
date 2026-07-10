import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ARTIFACT_PATH = resolve("artifacts/wdk-policy-proof.json");
const OUTPUT_PATH = resolve(
  "src/data/generated/guardedExecutionProof.generated.ts",
);

async function main() {
  const artifact = await readFile(ARTIFACT_PATH, "utf8");
  const proof = JSON.parse(artifact) as Record<string, unknown>;
  const artifactSha256 = createHash("sha256").update(artifact).digest("hex");
  const generated = {
    ...proof,
    proofArtifactSha256: artifactSha256,
  };
  const contents = `// Generated from artifacts/wdk-policy-proof.json.
// Do not edit manually.

export const guardedExecutionProof = ${JSON.stringify(generated, null, 2)} as const;
`;

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, contents);
  console.log(`Generated ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
