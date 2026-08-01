import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createListingService } from "@/modules/listings/service";
import type { ListingRecord, ListingRepository } from "@/modules/listings/types";

function createListingRecord(
  overrides: Partial<ListingRecord> = {},
): ListingRecord {
  return {
    id: "listing-1",
    source: "SELECTED_MARKETPLACE",
    sourceUrl: "https://example.com/listing-1",
    transactionType: "SALE",
    title: "Nowe mieszkanie w centrum",
    descriptionClean: "Jasne mieszkanie w Krakowie.",
    priceAmount: new Prisma.Decimal("750000.00"),
    currency: "PLN",
    administrativeFee: new Prisma.Decimal("850.00"),
    depositAmount: null,
    utilitiesDescription: "ogrzewanie miejskie",
    areaM2: new Prisma.Decimal("50.00"),
    rooms: 2,
    city: "Kraków",
    district: "Stare Miasto",
    street: "Dietla",
    floor: 3,
    floorCount: 5,
    buildingYear: 2018,
    marketType: "wtórny",
    ownershipType: "pełna własność",
    buildingType: "blok",
    condition: "dobry",
    sellerType: "AGENCY",
    availableFrom: new Date("2026-08-15T00:00:00.000Z"),
    sourcePublishedAt: new Date("2026-08-01T09:00:00.000Z"),
    sourceUpdatedAt: new Date("2026-08-01T10:00:00.000Z"),
    contactName: "Biuro Centrum",
    contactPhone: "+48500600700",
    createdAt: new Date("2026-08-01T08:00:00.000Z"),
    photos: [
      {
        url: "https://example.com/photo-1.jpg",
        position: 0,
        isPrimary: true,
      },
    ],
    features: [
      {
        key: "BALCONY",
        valueType: "BOOLEAN",
        booleanValue: true,
        numberValue: null,
        textValue: null,
        rawValue: "tak",
      },
    ],
    ...overrides,
  };
}

function createRepositoryMock(
  overrides: Partial<ListingRepository> = {},
): ListingRepository {
  return {
    findPublicListings: vi.fn().mockResolvedValue({ total: 0, items: [] }),
    findPublicListingById: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("listing service", () => {
  it("maps paginated listing results", async () => {
    const repository = createRepositoryMock({
      findPublicListings: vi.fn().mockResolvedValue({
        total: 1,
        items: [createListingRecord()],
      }),
    });
    const service = createListingService(repository);

    const result = await service.getListingIndex({
      city: ["Kraków"],
      active: true,
      page: 2,
      pageSize: 1,
      sort: "newest",
    });

    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 1,
      total: 1,
      totalPages: 1,
    });
    expect(result.items[0]).toMatchObject({
      id: "listing-1",
      city: "Kraków",
      priceAmount: "750000.00",
      administrativeFee: "850.00",
      pricePerSquareMetre: "15000.00",
    });
  });

  it("returns null for hidden or missing details", async () => {
    const service = createListingService(createRepositoryMock());

    await expect(service.getListingDetail("missing")).resolves.toBeNull();
  });

  it("returns a valid public detail response", async () => {
    const repository = createRepositoryMock({
      findPublicListingById: vi.fn().mockResolvedValue(
        createListingRecord({
          transactionType: "RENT",
          priceAmount: new Prisma.Decimal("4200.00"),
          areaM2: new Prisma.Decimal("60.00"),
        }),
      ),
    });
    const service = createListingService(repository);

    const result = await service.getListingDetail("listing-1");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: "listing-1",
      transactionType: "RENT",
      priceAmount: "4200.00",
      administrativeFee: "850.00",
      pricePerSquareMetre: null,
      depositAmount: null,
      utilitiesDescription: "ogrzewanie miejskie",
      description: "Jasne mieszkanie w Krakowie.",
      contactName: "Biuro Centrum",
      contactPhone: "+48500600700",
      photos: [
        {
          url: "https://example.com/photo-1.jpg",
          position: 0,
          isPrimary: true,
        },
      ],
    });
    expect(result).not.toHaveProperty("rawPayload");
    expect(result).not.toHaveProperty("rawAttributes");
  });
});
