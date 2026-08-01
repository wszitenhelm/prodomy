import { describe, expect, it } from "vitest";

import {
  buildListingSearchHref,
  parseListingSearchParams,
} from "@/modules/listings/queries";

describe("listing query parsing", () => {
  it("applies default pagination and sorting", () => {
    const parsed = parseListingSearchParams(new URLSearchParams());

    expect(parsed).toEqual({
      active: true,
      page: 1,
      pageSize: 20,
      sort: "newest",
    });
  });

  it("parses supported filters", () => {
    const parsed = parseListingSearchParams(
      new URLSearchParams({
        q: "kazimierz",
        transactionType: "RENT",
        city: "Kraków",
        district: "Stare Miasto",
        minPrice: "2500",
        maxPrice: "4500",
        minArea: "35.5",
        maxArea: "70",
        rooms: "2",
        page: "3",
        pageSize: "10",
        sort: "price_asc",
      }),
    );

    expect(parsed).toEqual({
      q: "kazimierz",
      transactionType: "RENT",
      city: "Kraków",
      district: "Stare Miasto",
      minPrice: 2500,
      maxPrice: 4500,
      minArea: 35.5,
      maxArea: 70,
      rooms: 2,
      active: true,
      page: 3,
      pageSize: 10,
      sort: "price_asc",
    });
  });

  it("preserves filters in pagination hrefs and omits reset defaults", () => {
    expect(
      buildListingSearchHref({
        transactionType: "RENT",
        city: "Kraków",
        q: "balkon",
        active: true,
        page: 3,
        pageSize: 20,
        sort: "newest",
      }),
    ).toBe("/listings?q=balkon&transactionType=RENT&city=Krak%C3%B3w&active=true&page=3");

    expect(
      buildListingSearchHref({
        active: true,
        page: 1,
        pageSize: 20,
        sort: "newest",
      }),
    ).toBe("/listings?active=true");
  });

  it("rejects an oversized page size", () => {
    expect(() =>
      parseListingSearchParams(new URLSearchParams({ pageSize: "51" })),
    ).toThrow(/Too big/i);
  });

  it("rejects inverted price and area ranges", () => {
    expect(() =>
      parseListingSearchParams(
        new URLSearchParams({
          minPrice: "5000",
          maxPrice: "2000",
          minArea: "80",
          maxArea: "40",
        }),
      ),
    ).toThrow(/minPrice cannot be greater than maxPrice/i);
  });
});
