import { describe, expect, it } from "vitest";

import {
  deriveListingHighlights,
  formatFloor,
  formatListingDisplayTitle,
  formatPriceMeta,
  formatRooms,
  formatRoomsLong,
} from "@/modules/listings/formatters";

describe("listing frontend formatters", () => {
  it("formats sale and rent meta differently", () => {
    expect(
      formatPriceMeta({
        id: "sale-1",
        title: "Sale",
        displayTitle: "2 pokoje · 50 m² · Kraków · Krowodrza",
        highlights: [],
        transactionType: "SALE",
        source: "SELECTED_MARKETPLACE",
        sourceUrl: "https://example.com/sale-1",
        priceAmount: "800000.00",
        currency: "PLN",
        administrativeFee: null,
        pricePerSquareMetre: "16000.00",
        areaM2: "50.00",
        rooms: 2,
        city: "Kraków",
        district: "Krowodrza",
        street: null,
        floor: 2,
        publishedAt: "2026-08-01T10:00:00.000Z",
        photo: null,
      }),
    ).toContain("/m²");

    expect(
      formatPriceMeta({
        id: "rent-1",
        title: "Rent",
        displayTitle: "2 pokoje · 60 m² · Kraków · Krowodrza",
        highlights: [],
        transactionType: "RENT",
        source: "SELECTED_MARKETPLACE",
        sourceUrl: "https://example.com/rent-1",
        priceAmount: "4200.00",
        currency: "PLN",
        administrativeFee: "850.00",
        pricePerSquareMetre: null,
        areaM2: "60.00",
        rooms: 2,
        city: "Kraków",
        district: "Krowodrza",
        street: null,
        floor: 1,
        publishedAt: "2026-08-01T10:00:00.000Z",
        photo: null,
      }),
    ).toContain("Czynsz adm.");
  });

  it("handles missing optional fields gracefully", () => {
    expect(formatRooms(null)).toBeNull();
    expect(formatFloor(null)).toBeNull();
  });

  it("builds consistent display titles with city and district", () => {
    expect(
      formatListingDisplayTitle({
        areaM2: "67.00",
        rooms: 3,
        city: "Kraków",
        district: "Czyżyny",
      }),
    ).toBe("3 pokoje · 67 m² · Kraków · Czyżyny");
    expect(formatRoomsLong(1)).toBe("1 pokój");
    expect(formatRoomsLong(5)).toBe("5 pokoi");
    expect(formatRoomsLong(12)).toBe("12 pokoi");
  });

  it("derives only concise factual highlights", () => {
    expect(
      deriveListingHighlights({
        sourceTitle: "komfortowe z klimatyzacją, MP, bez prowizji",
        buildingType: null,
        features: [],
      }),
    ).toEqual(["Klimatyzacja", "Bez prowizji"]);
    expect(
      deriveListingHighlights({
        sourceTitle: "Jasny LOFT w najładniejszej kamienicy",
        buildingType: "kamienica",
        features: [],
      }),
    ).toEqual(["Loft", "Kamienica"]);
  });

  it("describes the floor and the building height in Polish", () => {
    expect(formatFloor(5, 6)).toBe("5. piętro w sześciopiętrowym bloku");
    expect(formatFloor(0, 3)).toBe("Parter w trzypiętrowym bloku");
    expect(formatFloor(2, null)).toBe("2. piętro");
    expect(formatFloor(21, 25)).toBe("21. piętro w 25-piętrowym bloku");
  });
});
