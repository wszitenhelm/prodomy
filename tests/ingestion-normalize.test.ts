import { describe, expect, test } from "vitest";

import { cleanDescription, extractDescriptionRaw, normalizeRawListing } from "@/modules/ingestion/normalize";
import {
  normalizeApartmentArea,
  normalizeCityName,
  normalizeDate,
  normalizeFloorInfo,
  normalizePhoneNumber,
  normalizePlnPrice,
  normalizePolishDecimalValue,
  normalizeRoomCount,
  normalizeTransactionType,
} from "@/modules/ingestion/normalize";
import type { RawSourceListing } from "@/modules/ingestion/schemas";

function createRawListing(overrides: Partial<RawSourceListing> = {}): RawSourceListing {
  return {
    source: "SELECTED_MARKETPLACE",
    sourceUrl: "https://example.test/listing/1?utm_source=test",
    sourceListingId: "listing-1",
    title: "Mieszkanie 3-pokojowe na sprzedaż",
    description: "<p>Opis oferty</p><p>Opis oferty</p>",
    transactionTypeHint: "SALE",
    locationText: "Krakow, Krowodrza",
    priceText: "699 000 zł",
    attributes: {
      Powierzchnia: "52,7 m²",
      "Liczba pokoi": "3",
      Piętro: "4/7",
      Dzielnica: "Krowodrza",
    },
    photos: ["https://example.test/photo-1.jpg", "https://example.test/photo-2.jpg"],
    contactName: "Biuro",
    contactPhone: "500 600 700",
    structuredData: {},
    rawPayload: {
      publishedAt: "2026-07-15",
      updatedAt: "16 lipca 2026",
    },
    contentHash: "hash-1",
    fetchedAt: "2026-08-01T10:00:00.000Z",
    extractionWarnings: [],
    ...overrides,
  };
}

describe("ingestion normalizers", () => {
  test.each([
    ["699 000 zł", "699000.00"],
    ["749 tys. zł", "749000.00"],
    ["2 900 zł/mies.", "2900.00"],
  ])("normalizes PLN price %s", (input, expected) => {
    expect(normalizePlnPrice(input).value).toBe(expected);
  });

  test.each([
    ["52,7", "52.7"],
    ["52,7 m²", "52.7"],
    ["52,7 m kw.", "52.7"],
  ])("normalizes Polish decimal %s", (input, expected) => {
    expect(normalizePolishDecimalValue(input).value).toBe(expected);
  });

  test.each([
    ["3 pokoje", 3],
    ["dwa pokoje", 2],
    ["1", 1],
  ])("normalizes room count %s", (input, expected) => {
    expect(normalizeRoomCount(input).value).toBe(expected);
  });

  test.each([
    ["parter", { floor: 0, floorCount: null }],
    ["4/7", { floor: 4, floorCount: 7 }],
    ["4 piętro z 7", { floor: 4, floorCount: 7 }],
  ])("normalizes floor info %s", (input, expected) => {
    expect(normalizeFloorInfo(input)).toMatchObject(expected);
  });

  test.each([
    ["sprzedaż", "SALE"],
    ["na sprzedaż", "SALE"],
    ["wynajem", "RENT"],
    ["do wynajęcia", "RENT"],
  ])("normalizes transaction type %s", (input, expected) => {
    expect(normalizeTransactionType(input).value).toBe(expected);
  });

  test.each([
    ["Krakow", "Kraków"],
    ["Wroclaw", "Wrocław"],
    ["Gdansk", "Gdańsk"],
  ])("normalizes city %s", (input, expected) => {
    expect(normalizeCityName(input).value).toBe(expected);
  });

  test.each([
    ["2026-07-15", "2026-07-15T00:00:00.000Z"],
    ["15.07.2026", "2026-07-15T00:00:00.000Z"],
    ["15 lipca 2026", "2026-07-15T00:00:00.000Z"],
  ])("normalizes date %s", (input, expected) => {
    expect(normalizeDate(input).value).toBe(expected);
  });

  test.each([
    ["500 600 700", "+48500600700"],
    ["+48 500 600 700", "+48500600700"],
  ])("normalizes phone number %s", (input, expected) => {
    expect(normalizePhoneNumber(input).value).toBe(expected);
  });

  test("keeps missing values as null instead of zero", () => {
    expect(normalizeApartmentArea(null).value).toBeNull();
    expect(normalizeRoomCount(null).value).toBeNull();
  });

  test("rejects malformed formats without inventing values", () => {
    expect(normalizePlnPrice("za darmo").value).toBeNull();
    expect(normalizeApartmentArea("mieszkanie duze").value).toBeNull();
    expect(normalizePhoneNumber("12345").value).toBeNull();
  });

  test("extracts raw description and deterministically cleans it", () => {
    const raw = extractDescriptionRaw("  <p>Opis&nbsp;oferty</p>\n<p>Opis oferty</p>  ");
    const clean = cleanDescription("  <p>Opis&nbsp;oferty</p>\n<p>Opis oferty</p>  ");

    expect(raw).toContain("Opis");
    expect(clean).toBe("Opis oferty");
  });

  test("preserves provenance and records conflicting area values", () => {
    const normalized = normalizeRawListing(
      createRawListing({
        structuredData: {
          floorSize: "49,1 m²",
        },
      }),
    );

    expect(normalized.areaM2).toBe("52.7");
    expect(normalized.conflicts.some((conflict) => conflict.field === "areaM2")).toBe(true);
    expect(normalized.provenance.some((entry) => entry.field === "areaM2")).toBe(true);
    expect(normalized.sourceUrlCanonical).toBe("https://example.test/listing/1");
  });
});
