import { summarizeListingDescription } from "@/modules/ingestion/ai/summarize-description";
import {
  areExactDuplicates,
  generateProbableDuplicateCandidates,
  orderCandidatesDeterministically,
  scoreProbableDuplicate,
  selectPrimaryListing,
} from "@/modules/ingestion/deduplication";
import { normalizeRawListing } from "@/modules/ingestion/normalize";
import { createIngestionRepository } from "@/modules/ingestion/repositories";
import type { RawSourceListing } from "@/modules/ingestion/schemas";
import type {
  DuplicateScore,
  IngestionRunInput,
  IngestionRunSummary,
  NormalizedIngestionListing,
  PersistedIngestionResult,
  ValidatedIngestionDecision,
} from "@/modules/ingestion/types";
import { evaluatePublicationQuality } from "@/modules/ingestion/validation";
import { createCrawler } from "@/scraping/crawler";

interface GroupAssignment {
  readonly duplicateGroupId: string | null;
  readonly isPrimary: boolean;
  readonly publicationStatus: "PUBLISHED" | "REJECTED" | "NEEDS_REVIEW" | "DUPLICATE";
  readonly duplicateScore: DuplicateScore | null;
}

function createUnionFind(
  listings: readonly NormalizedIngestionListing[],
): {
  union: (left: string, right: string) => void;
  groups: () => Map<string, NormalizedIngestionListing[]>;
} {
  const parents = new Map<string, string>(
    listings.map((listing) => [listing.sourceUrlCanonical, listing.sourceUrlCanonical]),
  );

  function find(id: string): string {
    const parent = parents.get(id);

    if (parent === undefined || parent === id) {
      return id;
    }

    const root = find(parent);
    parents.set(id, root);
    return root;
  }

  return {
    union(left, right) {
      const leftRoot = find(left);
      const rightRoot = find(right);

      if (leftRoot !== rightRoot) {
        parents.set(rightRoot, leftRoot);
      }
    },
    groups() {
      const output = new Map<string, NormalizedIngestionListing[]>();

      for (const listing of listings) {
        const root = find(listing.sourceUrlCanonical);
        const bucket = output.get(root) ?? [];

        bucket.push(listing);
        output.set(root, bucket);
      }

      return output;
    },
  };
}

function assignDuplicateGroups(
  listings: readonly NormalizedIngestionListing[],
  decisions: ReadonlyMap<string, ValidatedIngestionDecision>,
): Map<string, GroupAssignment> {
  const unionFind = createUnionFind(listings);
  const duplicateScores = new Map<string, DuplicateScore>();

  for (let index = 0; index < listings.length; index += 1) {
    const left = listings[index];

    if (left === undefined) {
      continue;
    }

    for (let rightIndex = index + 1; rightIndex < listings.length; rightIndex += 1) {
      const right = listings[rightIndex];

      if (right === undefined) {
        continue;
      }

      if (areExactDuplicates(left, right)) {
        unionFind.union(left.sourceUrlCanonical, right.sourceUrlCanonical);
      }
    }
  }

  for (const candidate of generateProbableDuplicateCandidates(listings)) {
    const score = scoreProbableDuplicate(candidate);

    if (!score.isProbableDuplicate) {
      continue;
    }

    const key = [candidate.leftId, candidate.rightId].sort().join("::");

    duplicateScores.set(key, score);
    unionFind.union(candidate.leftId, candidate.rightId);
  }

  const assignments = new Map<string, GroupAssignment>();

  for (const groupedListings of unionFind.groups().values()) {
    const rankedListings = groupedListings.map((listing) => ({
      ...listing,
      publicationStatus: decisions.get(listing.sourceUrlCanonical)?.publicationStatus,
    }));
    const primaryListing = selectPrimaryListing(rankedListings);
    const duplicateGroupId =
      groupedListings.length > 1 ? primaryListing.sourceUrlCanonical : null;

    for (const listing of groupedListings) {
      const pairKey = [listing.sourceUrlCanonical, primaryListing.sourceUrlCanonical]
        .sort()
        .join("::");
      const decision = decisions.get(listing.sourceUrlCanonical);

      if (decision === undefined) {
        continue;
      }

      assignments.set(listing.sourceUrlCanonical, {
        duplicateGroupId,
        isPrimary: listing.sourceUrlCanonical === primaryListing.sourceUrlCanonical,
        publicationStatus:
          duplicateGroupId !== null && listing.sourceUrlCanonical !== primaryListing.sourceUrlCanonical
            ? "DUPLICATE"
            : decision.publicationStatus,
        duplicateScore: duplicateScores.get(pairKey) ?? null,
      });
    }
  }

  return assignments;
}

export async function runIngestion(
  input: IngestionRunInput,
): Promise<IngestionRunSummary> {
  const startedAt = new Date().toISOString();
  const crawler = createCrawler();
  const repository = createIngestionRepository();
  const importRun = await repository.startImportRun(input);

  try {
    const crawlResult = await crawler.run(input);
    const normalizedListings = normalizeRawListings(crawlResult.rawListings);
    const validatedListings = validateNormalizedListings(normalizedListings);
    const decisionMap = new Map(
      validatedListings.map(({ listing, decision }) => [listing.sourceUrlCanonical, decision]),
    );
    const duplicateAssignments = assignDuplicateGroups(
      normalizedListings,
      decisionMap,
    );

    const persistedResults: PersistedIngestionResult[] = [];

    for (const { listing, decision } of validatedListings) {
      const assignment = duplicateAssignments.get(listing.sourceUrlCanonical);

      if (assignment === undefined) {
        continue;
      }

      // Only worth the API call for listings that will actually be public;
      // rejected/needs-review/non-primary-duplicate records are never shown.
      const descriptionSummary =
        assignment.publicationStatus === "PUBLISHED"
          ? await summarizeListingDescription({
              title: listing.title,
              transactionType: listing.transactionType,
              priceAmount: listing.priceAmount,
              currency: listing.currency,
              areaM2: listing.areaM2,
              rooms: listing.rooms,
              city: listing.city,
              district: listing.district,
              descriptionClean: listing.descriptionClean,
            })
          : null;

      const persistedResult = await repository.persistListing({
        importRunId: importRun.id,
        listing,
        decision,
        publicationStatus: assignment.publicationStatus,
        duplicateGroupId: assignment.duplicateGroupId,
        isPrimary: assignment.isPrimary,
        duplicateScore: assignment.duplicateScore,
        descriptionSummary,
      });

      persistedResults.push(persistedResult);

      for (const warning of [...listing.warnings, ...decision.warnings]) {
        await repository.recordImportIssue({
          importRunId: importRun.id,
          sourceUrl: listing.sourceUrl,
          stage: "VALIDATE",
          result:
            assignment.publicationStatus === "DUPLICATE"
              ? "DUPLICATE"
              : assignment.publicationStatus === "REJECTED"
                ? "REJECTED"
                : "FAILED",
          code: warning.code,
          message: warning.message,
          context: {
            severity: warning.severity,
          },
        });
      }

      for (const conflict of listing.conflicts) {
        await repository.recordImportIssue({
          importRunId: importRun.id,
          sourceUrl: listing.sourceUrl,
          stage: "NORMALIZE",
          result: "FAILED",
          code: `${conflict.field.toUpperCase()}_CONFLICT`,
          message: `Conflicting ${conflict.field} values were preserved for review.`,
          context: {
            conflict,
          },
        });
      }
    }

    for (const failedRequest of crawlResult.failedRequests) {
      await repository.recordImportIssue({
        importRunId: importRun.id,
        sourceUrl: failedRequest.url,
        stage: failedRequest.stage,
        result: "FAILED",
        code: `${failedRequest.stage}_REQUEST_FAILED`,
        message: failedRequest.errorMessage,
        context: {
          city: failedRequest.city,
          transactionType: failedRequest.transactionType,
        },
      });
    }

    const summary: IngestionRunSummary = {
      source: input.source,
      cities: input.cities,
      status: crawlResult.failedRequests.length > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      startedAt,
      finishedAt: new Date().toISOString(),
      candidatesDiscovered: crawlResult.discoveredCandidates.length,
      pagesFetched: crawlResult.searchRoutesVisited + crawlResult.listingPagesFetched,
      parsedCount: crawlResult.rawListings.length,
      normalizedCount: normalizedListings.length,
      publishedCount: persistedResults.filter((result) => result.publicationStatus === "PUBLISHED")
        .length,
      rejectedCount: persistedResults.filter((result) => result.publicationStatus === "REJECTED")
        .length,
      needsReviewCount: persistedResults.filter(
        (result) => result.publicationStatus === "NEEDS_REVIEW",
      ).length,
      duplicateCount: persistedResults.filter((result) => result.publicationStatus === "DUPLICATE")
        .length,
      failedCount: crawlResult.failedRequests.length,
      persistedCount: persistedResults.filter((result) => result.persisted).length,
    };

    await repository.completeImportRun({
      importRunId: importRun.id,
      summary,
    });

    return summary;
  } catch (error) {
    const summary: IngestionRunSummary = {
      source: input.source,
      cities: input.cities,
      status: "FAILED",
      startedAt,
      finishedAt: new Date().toISOString(),
      candidatesDiscovered: 0,
      pagesFetched: 0,
      parsedCount: 0,
      normalizedCount: 0,
      publishedCount: 0,
      rejectedCount: 0,
      needsReviewCount: 0,
      duplicateCount: 0,
      failedCount: 1,
      persistedCount: 0,
    };

    await repository.recordImportIssue({
      importRunId: importRun.id,
      sourceUrl: input.source,
      stage: "PERSIST",
      result: "FAILED",
      code: "INGESTION_RUN_FAILED",
      message: error instanceof Error ? error.message : "Ingestion run failed.",
      context: {},
    });
    await repository.completeImportRun({
      importRunId: importRun.id,
      summary,
    });

    throw error;
  }
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
  const decisions = new Map(
    listings.map((listing) => [
      listing.sourceUrlCanonical,
      evaluatePublicationQuality(listing),
    ]),
  );
  const assignments = assignDuplicateGroups(listings, decisions);

  return listings.map((listing) => {
    const assignment = assignments.get(listing.sourceUrlCanonical);

    if (assignment === undefined) {
      throw new Error(`Missing duplicate assignment for ${listing.sourceUrlCanonical}.`);
    }

    return {
      sourceUrl: listing.sourceUrl,
      publicationStatus: assignment.publicationStatus,
      duplicateOf: assignment.isPrimary ? null : assignment.duplicateGroupId,
      persisted: true,
    };
  });
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
