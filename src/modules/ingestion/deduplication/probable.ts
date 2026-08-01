import type { PublicationStatus } from "@/modules/listings/constants";
import type {
  DuplicateScore,
  DuplicateScoreComponent,
  NormalizedIngestionListing,
  ProbableDuplicateCandidate,
} from "@/modules/ingestion/types";

function toNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(left, right);
}

function addComponent(
  components: DuplicateScoreComponent[],
  code: string,
  points: number,
  reason: string,
): void {
  components.push({ code, points, reason });
}

export function generateProbableDuplicateCandidates(
  listings: readonly NormalizedIngestionListing[],
): ProbableDuplicateCandidate[] {
  const candidates: ProbableDuplicateCandidate[] = [];

  for (let leftIndex = 0; leftIndex < listings.length; leftIndex += 1) {
    const left = listings[leftIndex];

    if (left === undefined) {
      continue;
    }

    for (let rightIndex = leftIndex + 1; rightIndex < listings.length; rightIndex += 1) {
      const right = listings[rightIndex];

      if (right === undefined) {
        continue;
      }

      if (left.transactionType === null || right.transactionType === null) {
        continue;
      }

      if (left.transactionType !== right.transactionType) {
        continue;
      }

      if (left.city === null || right.city === null || left.city !== right.city) {
        continue;
      }

      if (
        left.rooms !== null &&
        right.rooms !== null &&
        left.rooms !== right.rooms
      ) {
        continue;
      }

      const leftArea = toNumber(left.areaM2);
      const rightArea = toNumber(right.areaM2);

      if (
        leftArea !== null &&
        rightArea !== null &&
        relativeDifference(leftArea, rightArea) > 0.03
      ) {
        continue;
      }

      const leftPrice = toNumber(left.priceAmount);
      const rightPrice = toNumber(right.priceAmount);
      const priceTolerance = left.transactionType === "SALE" ? 0.12 : 0.18;

      if (
        leftPrice !== null &&
        rightPrice !== null &&
        relativeDifference(leftPrice, rightPrice) > priceTolerance
      ) {
        continue;
      }

      // Location compatibility must be confirmed, not merely "not disproven".
      // Treating an unknown district as compatible lets union-find chain
      // together listings that were never themselves scored as a match,
      // through an unrelated intermediary whose district happens to be
      // unknown. Since merging hides a listing from public search, it must
      // require positive evidence rather than the absence of a conflict.
      const districtsCompatible =
        left.district !== null && right.district !== null && left.district === right.district;
      const streetsCompatible =
        left.street !== null && right.street !== null && left.street === right.street;

      if (!districtsCompatible && !streetsCompatible) {
        continue;
      }

      if (left.street !== null && right.street !== null && left.street !== right.street) {
        continue;
      }

      candidates.push({
        leftId: left.sourceUrlCanonical,
        rightId: right.sourceUrlCanonical,
        left,
        right,
      });
    }
  }

  return candidates;
}

export function scoreProbableDuplicate(
  candidate: ProbableDuplicateCandidate,
): DuplicateScore {
  const components: DuplicateScoreComponent[] = [];
  const { left, right } = candidate;

  if (left.street !== null && left.street === right.street) {
    addComponent(components, "SAME_STREET", 25, "Street matches exactly.");
  } else if (left.district !== null && left.district === right.district) {
    addComponent(components, "SAME_DISTRICT", 15, "District matches.");
  }

  const leftArea = toNumber(left.areaM2);
  const rightArea = toNumber(right.areaM2);

  if (leftArea !== null && rightArea !== null) {
    const diff = relativeDifference(leftArea, rightArea);

    if (diff <= 0.01) {
      addComponent(components, "AREA_MATCH_HIGH", 20, "Area difference is within 1%.");
    } else if (diff <= 0.03) {
      addComponent(components, "AREA_MATCH_MEDIUM", 12, "Area difference is within 3%.");
    }
  }

  if (left.rooms !== null && right.rooms !== null && left.rooms === right.rooms) {
    addComponent(components, "ROOMS_MATCH", 10, "Room count matches.");
  }

  const leftPrice = toNumber(left.priceAmount);
  const rightPrice = toNumber(right.priceAmount);

  if (leftPrice !== null && rightPrice !== null) {
    const diff = relativeDifference(leftPrice, rightPrice);

    if (diff <= 0.03) {
      addComponent(components, "PRICE_MATCH_HIGH", 20, "Price difference is within 3%.");
    } else if (diff <= 0.12) {
      addComponent(components, "PRICE_MATCH_MEDIUM", 10, "Price difference is within tolerance.");
    }
  }

  if (left.contactPhone !== null && left.contactPhone === right.contactPhone) {
    addComponent(components, "PHONE_MATCH", 15, "Contact phone matches.");
  }

  const overlappingPhotos = left.photos.filter((photo) =>
    right.photos.some((otherPhoto) => otherPhoto.url === photo.url),
  ).length;

  if (overlappingPhotos > 0) {
    addComponent(
      components,
      "PHOTO_OVERLAP",
      Math.min(15, overlappingPhotos * 5),
      "Photo URLs overlap.",
    );
  }

  if (left.floor !== null && right.floor !== null && left.floor === right.floor) {
    addComponent(components, "FLOOR_MATCH", 5, "Floor matches.");
  }

  if (
    left.sourcePublishedAt !== null &&
    right.sourcePublishedAt !== null &&
    left.sourcePublishedAt === right.sourcePublishedAt
  ) {
    addComponent(components, "FRESHNESS_MATCH", 4, "Publication time matches.");
  }

  const score = components.reduce((sum, component) => sum + component.points, 0);

  return {
    score,
    components,
    isProbableDuplicate: score >= 45,
  };
}

function publicationRank(
  status: PublicationStatus | null | undefined,
): number {
  switch (status) {
    case "PUBLISHED":
      return 4;
    case "NEEDS_REVIEW":
      return 3;
    case "DUPLICATE":
      return 2;
    case "REJECTED":
      return 1;
    default:
      return 0;
  }
}

function completenessScore(listing: NormalizedIngestionListing): number {
  const optionalCompleteness = [
    listing.rooms,
    listing.floor,
    listing.floorCount,
    listing.buildingYear ?? null,
    listing.district,
    listing.street,
    listing.contactPhone,
  ].filter((value) => value !== null).length;

  return optionalCompleteness;
}

function freshnessTimestamp(listing: NormalizedIngestionListing): number {
  return listing.sourceUpdatedAt === null
    ? Date.parse(listing.scrapedAt)
    : Date.parse(listing.sourceUpdatedAt);
}

export function selectPrimaryListing(
  listings: readonly NormalizedIngestionListing[],
): NormalizedIngestionListing {
  const rankedListings = [...listings].sort((left, right) => {
    const publicationDifference = publicationRank(right.publicationStatus) - publicationRank(left.publicationStatus);

    if (publicationDifference !== 0) {
      return publicationDifference;
    }

    const freshnessDifference = freshnessTimestamp(right) - freshnessTimestamp(left);

    if (freshnessDifference !== 0) {
      return freshnessDifference;
    }

    const completenessDifference = completenessScore(right) - completenessScore(left);

    if (completenessDifference !== 0) {
      return completenessDifference;
    }

    const photoDifference = right.photos.length - left.photos.length;

    if (photoDifference !== 0) {
      return photoDifference;
    }

    const consistencyLeft = 100 - left.conflicts.length * 10 - left.warnings.length * 3;
    const consistencyRight = 100 - right.conflicts.length * 10 - right.warnings.length * 3;

    if (consistencyRight !== consistencyLeft) {
      return consistencyRight - consistencyLeft;
    }

    return left.sourceUrlCanonical.localeCompare(right.sourceUrlCanonical);
  });

  const primary = rankedListings[0];

  if (primary === undefined) {
    throw new Error("Cannot select a primary listing from an empty group.");
  }

  return primary;
}
