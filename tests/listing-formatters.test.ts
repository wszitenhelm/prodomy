import { describe, expect, it } from "vitest";

import {
  formatFloor,
  formatPriceMeta,
  formatRooms,
} from "@/modules/listings/formatters";

describe("listing frontend formatters", () => {
  it("formats sale and rent meta differently", () => {
    expect(
      formatPriceMeta({
        id: "sale-1",
        title: "Sale",
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
});
