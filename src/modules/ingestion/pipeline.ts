import { createCrawler } from "@/scraping/crawler";
import { selectedMarketplaceAdapter } from "@/scraping/selected-marketplace/adapter";
import type { IngestionRunInput, IngestionRunSummary } from "@/modules/ingestion/types";

export async function runIngestion(
  input: IngestionRunInput,
): Promise<IngestionRunSummary> {
  const crawler = createCrawler();

  await crawler.prepare();
  await selectedMarketplaceAdapter.describe();

  return {
    source: input.source,
    cities: input.cities,
    status: "NOT_IMPLEMENTED",
  };
}
