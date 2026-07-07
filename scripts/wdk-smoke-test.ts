import { runWdkSmokeVerification } from "@/lib/wdk/wdkSmokeVerification";

async function main() {
  const result = await runWdkSmokeVerification();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
