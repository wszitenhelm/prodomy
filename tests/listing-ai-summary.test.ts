import { describe, expect, test } from "vitest";

import { parseListingAiSummary } from "@/modules/listings/ai-summary";

describe("parseListingAiSummary", () => {
  test("returns null for a null input", () => {
    expect(parseListingAiSummary(null)).toBeNull();
  });

  test("returns null for malformed JSON instead of throwing", () => {
    expect(parseListingAiSummary("not json")).toBeNull();
  });

  test("returns null when the parsed JSON does not match the schema", () => {
    expect(parseListingAiSummary(JSON.stringify({ mainCost: "" }))).toBeNull();
  });

  test("parses a valid stored summary", () => {
    const stored = JSON.stringify({
      mainCost: "3500 zł/mies.",
      additionalCosts: "Czynsz administracyjny: 1100 zł/mies.",
      highlights: ["2 pokoje", "Balkon", "Piętro 2 z 5"],
      summary: "Przestronne mieszkanie blisko centrum.",
    });

    expect(parseListingAiSummary(stored)).toEqual({
      mainCost: "3500 zł/mies.",
      additionalCosts: "Czynsz administracyjny: 1100 zł/mies.",
      highlights: ["2 pokoje", "Balkon", "Piętro 2 z 5"],
      summary: "Przestronne mieszkanie blisko centrum.",
    });
  });

  test("accepts a null additionalCosts value", () => {
    const stored = JSON.stringify({
      mainCost: "699000 zł",
      additionalCosts: null,
      highlights: ["3 pokoje"],
      summary: "Mieszkanie na sprzedaż.",
    });

    expect(parseListingAiSummary(stored)?.additionalCosts).toBeNull();
  });
});
