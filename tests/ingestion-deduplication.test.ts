import { describe, expect, test } from "vitest";

import {
  areExactDuplicates,
  generateProbableDuplicateCandidates,
  scoreProbableDuplicate,
  selectPrimaryListing,
} from "@/modules/ingestion/deduplication";
import type { NormalizedIngestionListing } from "@/modules/ingestion/types";

function createListing(
  id: string,
  overrides: Partial<NormalizedIngestionListing> = {},
): NormalizedIngestionListing {
  return {
    source: "SELECTED_MARKETPLACE",
    sourceListingId: id,
    sourceUrl: `https://example.test/listings/${id}`,
    sourceUrlCanonical: `https://example.test/listings/${id}`,
    sourceContentHash: `hash-${id}`,
    propertyType: "APARTMENT",
    transactionType: "SALE",
    title: "Mieszkanie 3-pokojowe",
    descriptionRaw: "Raw",
    descriptionClean: "Clean",
    priceAmount: "699000.00",
    currency: "PLN",
    areaM2: "52.7",
    rooms: 3,
    city: "Kraków",
    district: "Krowodrza",
    street: "ul. Wrocławska",
    floor: 3,
    floorCount: 5,
    hasBalcony: false,
    buildingYear: 2018,
    availableFrom: null,
    sourcePublishedAt: "2026-07-15T00:00:00.000Z",
    sourceUpdatedAt: "2026-07-16T00:00:00.000Z",
    scrapedAt: "2026-08-01T10:00:00.000Z",
    contactName: "Biuro",
    contactPhone: "+48500600700",
    rawAttributes: {},
    rawPayload: {},
    photos: [
      { url: `https://example.test/photos/${id}-1.jpg`, position: 0, isPrimary: true },
      { url: `https://example.test/photos/${id}-2.jpg`, position: 1, isPrimary: false },
    ],
    warnings: [],
    conflicts: [],
    provenance: [],
    publicationStatus: "PUBLISHED",
    ...overrides,
  };
}

describe("deduplication logic", () => {
  test("detects exact duplicates from source identity", () => {
    const left = createListing("listing-1");
    const right = createListing("listing-2", {
      sourceListingId: "listing-1",
      sourceUrlCanonical: "https://different.test/listings/listing-2",
    });

    expect(areExactDuplicates(left, right)).toBe(true);
  });

  test("generates probable duplicate candidates for similar listings with the exact same area", () => {
    const left = createListing("listing-1");
    const right = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      priceAmount: "705000.00",
      areaM2: "52.7",
    });

    const candidates = generateProbableDuplicateCandidates([left, right]);

    expect(candidates).toHaveLength(1);
    const candidate = candidates[0];

    expect(candidate).toBeDefined();
    expect(scoreProbableDuplicate(candidate as NonNullable<typeof candidate>).isProbableDuplicate).toBe(true);
  });

  test("does not treat a near but non-identical area as a duplicate candidate", () => {
    const left = createListing("listing-1");
    const right = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      areaM2: "52.1",
    });

    expect(generateProbableDuplicateCandidates([left, right])).toHaveLength(0);
  });

  test("does not generate probable duplicate candidates for non-duplicates", () => {
    const left = createListing("listing-1");
    const right = createListing("listing-2", {
      city: "Warszawa",
      priceAmount: "1200000.00",
      areaM2: "90.0",
      rooms: 5,
    });

    expect(generateProbableDuplicateCandidates([left, right])).toHaveLength(0);
  });

  test("does not treat different districts as duplicates even when an agency shares one contact phone", () => {
    const left = createListing("listing-1", {
      district: "Bronowice",
      street: null,
      contactPhone: "+48500000000",
    });
    const right = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      district: "Czyżyny",
      street: null,
      contactPhone: "+48500000000",
      priceAmount: "705000.00",
      areaM2: "52.1",
    });

    expect(generateProbableDuplicateCandidates([left, right])).toHaveLength(0);
  });

  test("does not treat listings with unknown location as duplicates by default", () => {
    const left = createListing("listing-1", { district: null, street: null });
    const right = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      district: null,
      street: null,
      priceAmount: "705000.00",
      areaM2: "52.1",
    });

    expect(generateProbableDuplicateCandidates([left, right])).toHaveLength(0);
  });

  test("scores a shared balcony as supporting duplicate evidence", () => {
    const left = createListing("listing-1", { hasBalcony: true });
    const right = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      hasBalcony: true,
    });
    const withoutBalcony = createListing("listing-2", {
      sourceListingId: "listing-2",
      sourceUrlCanonical: "https://example.test/listings/listing-2",
      hasBalcony: false,
    });

    const withBalconyScore = scoreProbableDuplicate({
      leftId: left.sourceUrlCanonical,
      rightId: right.sourceUrlCanonical,
      left,
      right,
    });
    const withoutBalconyScore = scoreProbableDuplicate({
      leftId: left.sourceUrlCanonical,
      rightId: withoutBalcony.sourceUrlCanonical,
      left,
      right: withoutBalcony,
    });

    expect(withBalconyScore.components.map((component) => component.code)).toContain(
      "BALCONY_MATCH",
    );
    expect(withBalconyScore.score).toBeGreaterThan(withoutBalconyScore.score);
  });

  test("selects the best primary listing transparently", () => {
    const primary = createListing("listing-1", {
      sourceUpdatedAt: "2026-07-20T00:00:00.000Z",
      photos: [
        { url: "https://example.test/photos/1.jpg", position: 0, isPrimary: true },
        { url: "https://example.test/photos/2.jpg", position: 1, isPrimary: false },
        { url: "https://example.test/photos/3.jpg", position: 2, isPrimary: false },
      ],
    });
    const duplicate = createListing("listing-2", {
      publicationStatus: "NEEDS_REVIEW",
      sourceUpdatedAt: "2026-07-18T00:00:00.000Z",
      warnings: [{ code: "SUSPICIOUS_PRICE", message: "warn", severity: "WARNING" }],
      conflicts: [
        {
          field: "areaM2",
          chosenValue: "52.7",
          chosenSource: "ATTRIBUTE",
          candidates: [],
        },
      ],
    });

    expect(selectPrimaryListing([duplicate, primary]).sourceListingId).toBe("listing-1");
  });
});
