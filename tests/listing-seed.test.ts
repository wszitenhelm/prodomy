import { describe, expect, test } from "vitest";

import { createSeedDataset } from "@/modules/listings/seed";

describe("listing seed dataset", () => {
  test("is deterministic", () => {
    const first = createSeedDataset();
    const second = createSeedDataset();

    expect(second).toEqual(first);
  });

  test("produces about 100 public primary listings with balanced transaction counts", () => {
    const dataset = createSeedDataset();

    expect(dataset.summary.publicPrimaryCount).toBe(100);
    expect(dataset.summary.salePrimaryCount).toBe(50);
    expect(dataset.summary.rentPrimaryCount).toBe(50);
    expect(dataset.summary.statusCounts.PUBLISHED).toBe(100);
    expect(dataset.summary.statusCounts.REJECTED).toBeGreaterThan(0);
    expect(dataset.summary.statusCounts.NEEDS_REVIEW).toBeGreaterThan(0);
    expect(dataset.summary.statusCounts.DUPLICATE).toBeGreaterThan(0);
  });

  test("keeps publication assumptions intact for public listings", () => {
    const dataset = createSeedDataset();
    const publicListings = dataset.listings.filter(
      (listing) => listing.publicationStatus === "PUBLISHED" && listing.isPrimary,
    );

    expect(publicListings).toHaveLength(100);
    expect(publicListings.every((listing) => listing.propertyType === "APARTMENT")).toBe(true);
    expect(publicListings.every((listing) => listing.currency === "PLN")).toBe(true);
    expect(publicListings.every((listing) => listing.priceAmount !== null)).toBe(true);
    expect(publicListings.every((listing) => listing.areaM2 !== null)).toBe(true);
    expect(publicListings.every((listing) => listing.photos.length > 0)).toBe(true);
  });
});
