import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const artifactPath = resolve("artifacts/wdk-contract-proof.json");
const outputPath = resolve("src/data/generated/wdkContractProof.generated.ts");

async function main() {
  const artifact = await readFile(artifactPath, "utf8");
  const proof = JSON.parse(artifact) as Record<string, unknown>;
  const generated = { ...proof, proofArtifactSha256: createHash("sha256").update(artifact).digest("hex") };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `// Generated from artifacts/wdk-contract-proof.json.\n// Do not edit manually.\n\nexport const wdkContractProof = ${JSON.stringify(generated, null, 2)} as const;\n`);
  console.log(`Generated ${outputPath}`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
