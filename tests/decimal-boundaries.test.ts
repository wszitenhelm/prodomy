import { describe, expect, test } from "vitest";

import { normalizedListingSchema } from "@/modules/listings/schemas";

const baseListing = {
  id: "listing-1",
  source: "SELECTED_MARKETPLACE",
  sourceListingId: "listing-1",
  sourceUrl: "https://example.test/listing/1",
  sourceUrlCanonical: "https://example.test/listing/1",
  sourceContentHash: "hash-1",
  propertyType: "APARTMENT",
  transactionType: "SALE",
  publicationStatus: "PUBLISHED",
  rejectionReason: null,
  title: "Mieszkanie testowe",
  descriptionRaw: "Raw",
  descriptionClean: "Clean",
  descriptionSummary: null,
  currency: "PLN",
  administrativeFee: null,
  depositAmount: null,
  utilitiesDescription: null,
  rooms: 2,
  city: "Warszawa",
  district: "Wola",
  street: null,
  floor: 2,
  floorCount: 6,
  buildingYear: 2019,
  marketType: "wtórny",
  ownershipType: "pełna własność",
  buildingType: "blok",
  heatingType: "miejskie",
  condition: "bardzo dobry",
  sellerType: "biuro nieruchomości",
  availableFrom: null,
  sourcePublishedAt: "2026-07-10T10:00:00.000Z",
  sourceUpdatedAt: "2026-07-11T10:00:00.000Z",
  scrapedAt: "2026-07-12T10:00:00.000Z",
  contactName: "Biuro",
  contactPhone: null,
  rawAttributes: {},
  rawPayload: {},
  qualityScore: 90,
  completenessScore: 90,
  consistencyScore: 90,
  duplicateGroupId: null,
  isPrimary: true,
  photos: [],
  features: [],
};

describe("decimal serialization boundaries", () => {
  test("accepts persisted decimal strings", () => {
    const parsed = normalizedListingSchema.parse({
      ...baseListing,
      priceAmount: "420000.00",
      areaM2: "41.5",
    });

    expect(parsed.priceAmount).toBe("420000.00");
    expect(parsed.areaM2).toBe("41.5");
  });

  test("rejects non-decimal-string persisted values", () => {
    const result = normalizedListingSchema.safeParse({
      ...baseListing,
      priceAmount: 420000,
      areaM2: "41,5",
    });

    expect(result.success).toBe(false);
  });
});
