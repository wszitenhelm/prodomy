import { createCrawler } from "@/scraping/crawler";
import { selectedMarketplaceAdapter } from "@/scraping/selected-marketplace/adapter";
import {
  areExactDuplicates,
  generateProbableDuplicateCandidates,
  orderCandidatesDeterministically,
  scoreProbableDuplicate,
  selectPrimaryListing,
} from "@/modules/ingestion/deduplication";
import { normalizeRawListing } from "@/modules/ingestion/normalize";
import type { RawSourceListing } from "@/modules/ingestion/schemas";
import type { IngestionRunInput, IngestionRunSummary } from "@/modules/ingestion/types";
import type {
  NormalizedIngestionListing,
  PersistedIngestionResult,
  ValidatedIngestionDecision,
} from "@/modules/ingestion/types";
import { evaluatePublicationQuality } from "@/modules/ingestion/validation";

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

export function normalizeRawListings(
  rawListings: readonly RawSourceListing[],
): NormalizedIngestionListing[] {
  return rawListings.map(normalizeRawListing);
}

export function validateNormalizedListings(
  listings: readonly NormalizedIngestionListing[],
): Array<{
  readonly listing: NormalizedIngestionListing;
  readonly decision: ValidatedIngestionDecision;
}> {
  return listings.map((listing) => ({
    listing,
    decision: evaluatePublicationQuality(listing),
  }));
}

export function derivePersistedIngestionResults(
  listings: readonly NormalizedIngestionListing[],
): PersistedIngestionResult[] {
  const exactHandled = new Set<string>();
  const results: PersistedIngestionResult[] = [];

  for (const listing of listings) {
    if (exactHandled.has(listing.sourceUrlCanonical)) {
      continue;
    }

    const exactMatches = listings.filter((candidate) => areExactDuplicates(candidate, listing));
    const probableGroup = generateProbableDuplicateCandidates(exactMatches).flatMap((candidate) => {
      const score = scoreProbableDuplicate(candidate);
      return score.isProbableDuplicate ? [candidate.left, candidate.right] : [];
    });
    const groupedListings = probableGroup.length === 0 ? exactMatches : Array.from(new Set([...exactMatches, ...probableGroup]));
    const primaryListing = selectPrimaryListing(groupedListings);

    for (const groupedListing of groupedListings) {
      exactHandled.add(groupedListing.sourceUrlCanonical);
      results.push({
        sourceUrl: groupedListing.sourceUrl,
        publicationStatus:
          groupedListing.sourceUrlCanonical === primaryListing.sourceUrlCanonical
            ? groupedListing.publicationStatus ?? "PUBLISHED"
            : "DUPLICATE",
        duplicateOf:
          groupedListing.sourceUrlCanonical === primaryListing.sourceUrlCanonical
            ? null
            : primaryListing.sourceUrlCanonical,
        persisted: true,
      });
    }
  }

  return results;
}

export function orderCandidatesForGroup(
  listings: readonly NormalizedIngestionListing[],
  city: string,
  transactionType: "SALE" | "RENT",
  seed: string,
): NormalizedIngestionListing[] {
  return orderCandidatesDeterministically(
    listings
      .filter(
        (listing) => listing.city === city && listing.transactionType === transactionType,
      )
      .map((listing) => ({
        ...listing,
        city,
        transactionType,
        sourceUrl: listing.sourceUrl,
        sourceListingId: listing.sourceListingId,
      })),
    seed,
  );
}
