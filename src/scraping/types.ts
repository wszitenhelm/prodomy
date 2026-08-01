import type {
  ExtractionWarning,
  RawSourceListing,
} from "@/modules/ingestion/schemas";
import type { IngestionRunInput } from "@/modules/ingestion/types";
import type { TransactionType } from "@/modules/listings/constants";

export interface MarketplaceSearchRoute {
  readonly city: string;
  readonly transactionType: TransactionType;
  readonly page: number;
  readonly url: string;
}

export interface DiscoveredListingCandidate {
  readonly city: string;
  readonly transactionType: TransactionType;
  readonly url: string;
  readonly sourceListingId: string | null;
}

export interface ParsedMarketplaceListing extends RawSourceListing {
  readonly rawAttributes: Record<string, unknown>;
}

export interface MarketplaceParseContext {
  readonly url: string;
  readonly html: string;
  readonly $: unknown;
  readonly fetchedAt: string;
}

export interface MarketplaceDiscoverContext {
  readonly url: string;
  readonly $: unknown;
  readonly city: string;
  readonly transactionType: TransactionType;
}

export interface MarketplaceAdapter {
  readonly source: RawSourceListing["source"];
  readonly sourceName: string;
  readonly crawlerType: "CHEERIO";
  readonly selectedCities: readonly string[];
  describeSelection(): {
    readonly source: string;
    readonly why: string;
    readonly usefulDataLocation: string;
    readonly crawlerRequirement: string;
    readonly knownLimitations: string;
  };
  buildSearchRoutes(input: Pick<IngestionRunInput, "cities" | "maxResultPages">): MarketplaceSearchRoute[];
  discoverListingCandidates(context: MarketplaceDiscoverContext): DiscoveredListingCandidate[];
  extractSourceListingId(input: string): string | null;
  parseListing(context: MarketplaceParseContext): ParsedMarketplaceListing;
}

export interface ScrapingCrawlerRunResult {
  readonly source: RawSourceListing["source"];
  readonly rawListings: ParsedMarketplaceListing[];
  readonly discoveredCandidates: DiscoveredListingCandidate[];
  readonly failedRequests: Array<{
    readonly stage: "DISCOVERY" | "FETCH" | "PARSE";
    readonly url: string;
    readonly city: string | null;
    readonly transactionType: TransactionType | null;
    readonly errorMessage: string;
  }>;
  readonly searchRoutesVisited: number;
  readonly listingPagesFetched: number;
}

export interface ScrapingCrawler {
  run: (input: IngestionRunInput) => Promise<ScrapingCrawlerRunResult>;
}

export function createExtractionWarning(
  code: string,
  message: string,
): ExtractionWarning {
  return {
    code,
    message,
  };
}
