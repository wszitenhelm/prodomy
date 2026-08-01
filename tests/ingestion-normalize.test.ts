import { describe, expect, test } from "vitest";

import { cleanDescription, extractDescriptionRaw, normalizeRawListing } from "@/modules/ingestion/normalize";
import {
  extractDistrictFromLocationText,
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
    latitude: 50.0646501,
    longitude: 19.9449799,
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
    ["parter z 3", { floor: 0, floorCount: 3 }],
    ["parter/5", { floor: 0, floorCount: 5 }],
    ["Parter z 10", { floor: 0, floorCount: 10 }],
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

  test("preserves source-derived coordinates", () => {
    const normalized = normalizeRawListing(createRawListing());

    expect(normalized.latitude).toBe(50.0646501);
    expect(normalized.longitude).toBe(19.9449799);
  });

  test.each([
    ["małopolskie, Kraków, Bieżanów-Prokocim, Prokocim Zobacz na mapie", "Kraków", "Bieżanów-Prokocim"],
    ["Portowamałopolskie, Kraków, Podgórze, Zabłocie Zobacz na mapie", "Kraków", "Podgórze"],
    ["Galicyjskamałopolskie, Kraków, Czyżyny Zobacz na mapie", "Kraków", "Czyżyny"],
    ["małopolskie, Kraków, Swoszowice Zobacz na mapie", "Kraków", "Swoszowice"],
  ])("extracts district from real marketplace location text %s", (locationText, city, expected) => {
    expect(extractDistrictFromLocationText(locationText, city)).toBe(expected);
  });

  test("returns null district when the city cannot be located in the text", () => {
    expect(extractDistrictFromLocationText("nieznany format", "Kraków")).toBeNull();
    expect(extractDistrictFromLocationText(null, "Kraków")).toBeNull();
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

  test("decodes numeric HTML entities used for Polish diacritics and symbols", () => {
    const clean = cleanDescription(
      "Opis nieruchomo&#x15b;ci &#x2705; Pi&#x119;tro 2 z 18 &#x25e6; 50 m&#xb2; &#x2014; koniec",
    );

    expect(clean).toBe("Opis nieruchomości ✅ Piętro 2 z 18 ◦ 50 m² — koniec");
  });

  test("decodes double-encoded entities such as &amp;#39;", () => {
    expect(cleanDescription("It&amp;#39;s an interior")).toBe("It's an interior");
  });

  test("removes the trailing 'Pokaż cały opis' marketplace boilerplate", () => {
    expect(cleanDescription("Jasne mieszkanie w centrum. Pokaż cały opis")).toBe(
      "Jasne mieszkanie w centrum.",
    );
    expect(cleanDescription("Opis bez przycisku.")).toBe("Opis bez przycisku.");
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

  test.each([
    ["Tak", true],
    ["tak", true],
    ["Nie", false],
    [undefined, false],
  ])("detects hasBalcony from the Balkon attribute (%s)", (balkon, expected) => {
    const normalized = normalizeRawListing(
      createRawListing({
        attributes: {
          ...(balkon === undefined ? {} : { Balkon: balkon }),
        },
      }),
    );

    expect(normalized.hasBalcony).toBe(expected);
  });
});
