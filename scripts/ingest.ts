import { runIngestion } from "@/modules/ingestion/pipeline";
import { env } from "@/shared/env";

async function main(): Promise<void> {
  const summary = await runIngestion({
    source: env.INGESTION_SOURCE,
    cities: env.INGESTION_CITIES,
    targetSale: env.INGESTION_TARGET_SALE,
    targetRent: env.INGESTION_TARGET_RENT,
    maxCandidates: env.INGESTION_MAX_CANDIDATES,
    maxResultPages: env.INGESTION_MAX_RESULT_PAGES,
    seed: env.INGESTION_SEED,
  });

  console.info(
    JSON.stringify(
      {
        type: "ingestion-summary",
        summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error("Ingestion failed.", error);
  process.exitCode = 1;
});
