import { describe, expect, it } from "vitest";

import { parseNaturalSearchLocally } from "@/modules/listings/ai/parse-natural-search";

describe("natural listing search", () => {
  it("understands the example English request", () => {
    expect(parseNaturalSearchLocally("I want a flat to rent in Krakow 30m with balcony")).toMatchObject({
      transactionType: "RENT",
      cities: ["Kraków"],
      minArea: 25,
      maxArea: 35,
      features: ["BALCONY"],
    });
  });

  it("understands a Polish request with a one-sided area and rooms", () => {
    expect(
      parseNaturalSearchLocally(
        "Szukam mieszkania na sprzedaż we Wrocławiu, co najmniej 45 m2, 2 pokoje i winda",
      ),
    ).toMatchObject({
      transactionType: "SALE",
      cities: ["Wrocław"],
      minArea: 45,
      maxArea: null,
      rooms: 2,
      features: ["ELEVATOR"],
    });
  });

  it("understands a Polish maximum monthly price", () => {
    expect(
      parseNaturalSearchLocally("Chcę wynająć mieszkanie w Krakowie z balkonem do 4000 zł"),
    ).toMatchObject({
      transactionType: "RENT",
      cities: ["Kraków"],
      maxPrice: 4000,
      features: ["BALCONY"],
    });
  });
});
