import type { NormalizedIngestionListing } from "@/modules/ingestion/types";

export function buildExactDuplicateKeys(listing: NormalizedIngestionListing): string[] {
  const keys = new Set<string>();

  if (listing.sourceListingId !== null) {
    keys.add(`source-id:${listing.source}:${listing.sourceListingId}`);
  }

  keys.add(`source-url:${listing.source}:${listing.sourceUrlCanonical}`);

  if (listing.sourceContentHash !== null) {
    keys.add(`content-hash:${listing.source}:${listing.sourceContentHash}`);
  }

  return [...keys];
}

export function areExactDuplicates(
  left: NormalizedIngestionListing,
  right: NormalizedIngestionListing,
): boolean {
  const leftKeys = new Set(buildExactDuplicateKeys(left));

  return buildExactDuplicateKeys(right).some((key) => leftKeys.has(key));
}
