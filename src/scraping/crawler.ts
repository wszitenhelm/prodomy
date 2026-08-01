import type { ScrapingCrawler } from "@/scraping/types";

export function createCrawler(): ScrapingCrawler {
  return {
    async prepare(): Promise<void> {
      return Promise.resolve();
    },
  };
}
