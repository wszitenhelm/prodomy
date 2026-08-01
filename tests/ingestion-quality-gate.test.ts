import { describe, expect, test } from "vitest";

import { evaluatePublicationQuality } from "@/modules/ingestion/validation";
import type { NormalizedIngestionListing } from "@/modules/ingestion/types";

function createListing(
  overrides: Partial<NormalizedIngestionListing> = {},
): NormalizedIngestionListing {
  return {
    source: "SELECTED_MARKETPLACE",
    sourceListingId: "listing-1",
    sourceUrl: "https://example.test/listing/1",
    sourceUrlCanonical: "https://example.test/listing/1",
    sourceContentHash: "hash-1",
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
    availableFrom: null,
    sourcePublishedAt: "2026-07-15T00:00:00.000Z",
    sourceUpdatedAt: "2026-07-16T00:00:00.000Z",
    scrapedAt: "2026-08-01T10:00:00.000Z",
    contactName: "Biuro",
    contactPhone: "+48500600700",
    rawAttributes: {},
    rawPayload: {},
    photos: [{ url: "https://example.test/photo-1.jpg", position: 0, isPrimary: true }],
    warnings: [],
    conflicts: [],
    provenance: [],
    publicationStatus: "PUBLISHED",
    ...overrides,
  };
}

describe("publication quality gate", () => {
  test.each([
    [{ priceAmount: null }, "INVALID_PRICE"],
    [{ areaM2: null }, "INVALID_AREA"],
    [{ city: null }, "MISSING_CITY"],
    [{ transactionType: null }, "UNKNOWN_TRANSACTION_TYPE"],
    [{ title: null }, "MISSING_TITLE"],
    [{ photos: [] }, "NO_USABLE_PHOTOS"],
    [{ propertyType: null }, "NOT_APARTMENT"],
  ])("rejects invalid publish requirement %#", (overrides, expectedReason) => {
    const decision = evaluatePublicationQuality(createListing(overrides));

    expect(decision.publicationStatus).toBe("REJECTED");
    expect(decision.rejectionReason).toBe(expectedReason);
  });

  test("classifies suspicious price as needs review", () => {
    const decision = evaluatePublicationQuality(createListing({ priceAmount: "90000.00" }));

    expect(decision.publicationStatus).toBe("NEEDS_REVIEW");
    expect(decision.isSuspicious).toBe(true);
  });

  test("does not reject missing optional room count", () => {
    const decision = evaluatePublicationQuality(createListing({ rooms: null }));

    expect(decision.publicationStatus).toBe("PUBLISHED");
  });

  test("flags conflicting values for review", () => {
    const decision = evaluatePublicationQuality(
      createListing({
        conflicts: [
          {
            field: "areaM2",
            chosenValue: "52.7",
            chosenSource: "ATTRIBUTE",
            candidates: [
              {
                source: "ATTRIBUTE",
                sourcePath: "attributes.Powierzchnia",
                raw: "52,7 m²",
                normalized: "52.7",
              },
              {
                source: "STRUCTURED_DATA",
                sourcePath: "structuredData.floorSize",
                raw: "49,1 m²",
                normalized: "49.1",
              },
            ],
          },
        ],
      }),
    );

    expect(decision.publicationStatus).toBe("NEEDS_REVIEW");
  });
});
