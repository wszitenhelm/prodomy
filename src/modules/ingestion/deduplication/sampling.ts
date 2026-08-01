import type { RawSourceListing } from "@/modules/ingestion/schemas";
import type { TransactionType } from "@/modules/listings/constants";

function createHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export interface CandidateOrderingInput {
  readonly city: string;
  readonly transactionType: TransactionType;
  readonly sourceUrl: string;
  readonly sourceListingId: string | null;
}

export function orderCandidatesDeterministically<T extends CandidateOrderingInput>(
  candidates: readonly T[],
  seed: string,
): T[] {
  return [...candidates].sort((left, right) => {
    const leftHash = createHash(
      `${seed}:${left.city}:${left.transactionType}:${left.sourceListingId ?? left.sourceUrl}`,
    );
    const rightHash = createHash(
      `${seed}:${right.city}:${right.transactionType}:${right.sourceListingId ?? right.sourceUrl}`,
    );

    if (leftHash !== rightHash) {
      return leftHash - rightHash;
    }

    return left.sourceUrl.localeCompare(right.sourceUrl);
  });
}

export function sampleRawCandidates(
  candidates: readonly RawSourceListing[],
  city: string,
  transactionType: TransactionType,
  seed: string,
): RawSourceListing[] {
  const matchingCandidates = candidates.filter(
    (candidate) =>
      candidate.transactionTypeHint === transactionType &&
      (candidate.locationText?.includes(city) ?? false),
  );

  return orderCandidatesDeterministically(
    matchingCandidates.map((candidate) => ({
      ...candidate,
      city,
      transactionType,
    })),
    seed,
  ).map((candidate) => ({
    source: candidate.source,
    sourceUrl: candidate.sourceUrl,
    sourceListingId: candidate.sourceListingId,
    title: candidate.title,
    description: candidate.description,
    transactionTypeHint: candidate.transactionTypeHint,
    locationText: candidate.locationText,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    priceText: candidate.priceText,
    attributes: candidate.attributes,
    photos: candidate.photos,
    contactName: candidate.contactName,
    contactPhone: candidate.contactPhone,
    structuredData: candidate.structuredData,
    rawPayload: candidate.rawPayload,
    contentHash: candidate.contentHash,
    fetchedAt: candidate.fetchedAt,
    extractionWarnings: candidate.extractionWarnings,
  }));
}
