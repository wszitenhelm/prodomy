export interface ScrapingCrawler {
  prepare: () => Promise<void>;
}
