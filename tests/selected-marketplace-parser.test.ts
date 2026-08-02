import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { selectedMarketplaceAdapter } from "@/scraping/selected-marketplace/adapter";

function readFixture(name: string): string {
  return readFileSync(
    resolve(
      process.cwd(),
      "src/scraping/selected-marketplace/fixtures",
      name,
    ),
    "utf8",
  );
}

describe("selectedMarketplaceAdapter", () => {
  it("builds sale and rent search routes for configured cities", () => {
    const routes = selectedMarketplaceAdapter.buildSearchRoutes({
      cities: ["Kraków", "Wrocław"],
      maxResultPages: 2,
    });

    expect(routes).toHaveLength(8);
    expect(routes[0]?.url).toBe("https://www.morizon.pl/mieszkania/krakow/");
    expect(routes[1]?.url).toBe("https://www.morizon.pl/mieszkania/krakow/?page=2");
    expect(routes[2]?.url).toBe("https://www.morizon.pl/do-wynajecia/mieszkania/krakow/");
  });

  it("discovers listing links from a search fixture without duplicates", () => {
    const html = readFixture("morizon-sale-search.html");
    const candidates = selectedMarketplaceAdapter.discoverListingCandidates({
      url: "https://www.morizon.pl/mieszkania/krakow/",
      $: load(html),
      city: "Kraków",
      transactionType: "SALE",
    });

    expect(candidates.length).toBeGreaterThan(20);
    expect(new Set(candidates.map((candidate) => candidate.url)).size).toBe(
      candidates.length,
    );
    expect(candidates[0]?.url).toContain("/oferta/");
    expect(candidates[0]?.sourceListingId).toMatch(/^mzn\d+$/);
  });

  it("parses a sale listing fixture", () => {
    const html = readFixture("morizon-sale-listing.html");
    const listing = selectedMarketplaceAdapter.parseListing({
      url: "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-krakow-krowodrza-krowoderskich-zuchow-30m2-mzn2047857210",
      html,
      $: load(html),
      fetchedAt: "2026-08-01T12:00:00.000Z",
    });

    expect(listing.transactionTypeHint).toBe("SALE");
    expect(listing.title).toContain("Sprzedam");
    expect(listing.priceText).toContain("zł");
    expect(listing.locationText).toContain("Kraków");
    expect(listing.latitude).toBeCloseTo(50.0844);
    expect(listing.longitude).toBeCloseTo(19.9307);
    expect(listing.attributes["Pow. całkowita"]).toBe("30 m²");
    expect(listing.attributes["Rok budowy"]).toBe("1974");
    expect(listing.attributes["Udogodnienia"]).toEqual(
      expect.arrayContaining(["Winda", "Domofon", "Piwnica"]),
    );
    expect(listing.photos.length).toBeGreaterThan(0);
    expect(listing.extractionWarnings).toEqual([]);
  });

  it("parses a rent listing fixture with deposit and available date", () => {
    const html = readFixture("morizon-rent-listing.html");
    const listing = selectedMarketplaceAdapter.parseListing({
      url: "https://www.morizon.pl/oferta/wynajem-mieszkanie-krakow-krowodrza-zbozowa-68m2-mzn2047857207",
      html,
      $: load(html),
      fetchedAt: "2026-08-01T12:00:00.000Z",
    });

    expect(listing.transactionTypeHint).toBe("RENT");
    expect(listing.latitude).toBeCloseTo(50.0792122);
    expect(listing.longitude).toBeCloseTo(19.9368133);
    expect(listing.attributes["Depozyt za wynajem"]).toBe("9000");
    expect(listing.attributes["Dostępne od"]).toBe("01.08.2026");
    expect(listing.attributes["Media i instalacje"]).toEqual(
      expect.arrayContaining(["Internet", "Linia telefoniczna (3)"]),
    );
    expect(listing.contactName).toBe("Wolfies House");
    expect(listing.contactPhone).toBe("579 647 665");
  });

  it("keeps optional fields nullable when they are missing", () => {
    const html = readFixture("morizon-missing-optional.html");
    const listing = selectedMarketplaceAdapter.parseListing({
      url: "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-srodmiescie-przykladowa-42m2-mzn2047000000",
      html,
      $: load(html),
      fetchedAt: "2026-08-01T12:00:00.000Z",
    });

    expect(listing.contactName).toBeNull();
    expect(listing.contactPhone).toBeNull();
    expect(listing.latitude).toBeNull();
    expect(listing.longitude).toBeNull();
    expect(listing.attributes["Pokoje"]).toBeUndefined();
    expect(listing.photos).toHaveLength(0);
    expect(listing.extractionWarnings.map((warning) => warning.code)).toEqual(["PHOTOS_MISSING"]);
  });

  it("surfaces extraction warnings for malformed listing markup", () => {
    const html = readFixture("morizon-malformed-listing.html");
    const listing = selectedMarketplaceAdapter.parseListing({
      url: "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-krakow-test-10m2-mzn2047999999",
      html,
      $: load(html),
      fetchedAt: "2026-08-01T12:00:00.000Z",
    });

    expect(listing.title).toBeNull();
    expect(listing.priceText).toBeNull();
    expect(listing.photos).toEqual([]);
    expect(listing.extractionWarnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["TITLE_MISSING", "PRICE_MISSING", "PHOTOS_MISSING"]),
    );
  });

  it("only extracts photos from this listing's own gallery, not unrelated page content", () => {
    const html = `
      <html>
        <body>
          <h1>Mieszkanie na sprzedaż</h1>
          <div class="details-price__item">500 000 zł</div>
          <div class="page-details__location-row">Kraków</div>
          <div class="details-gallery">
            <img class="details-gallery__img" src="https://img1.staticmorizon.com.pl/thumb/aHR0cHM6Ly9kLWdyLmNkbmdyLnBsL2thZHJ5LzQ4NDUwMDAwXzEtcmVhbC1saXN0aW5nLXBob3RvLmpwZw==/3x2_m/photo-1.jpg" />
          </div>
          <script>
            window.gallery = [
              "https://img1.staticmorizon.com.pl/thumb/aHR0cHM6Ly9kLWdyLmNkbmdyLnBsL2thZHJ5LzQ4NDUwMDAwXzItcmVhbC1saXN0aW5nLXBob3RvLmpwZw==/3x2_m/photo-2.jpg"
            ];
          </script>
          <script id="__NUXT_DATA__" type="application/json">
            ["aHR0cHM6Ly9kLWdyLmNkbmdyLnBsL2thZHJ5LzQ4NDUwMDAwXzMtcmVhbC1saXN0aW5nLXBob3RvLmpwZw=="]
          </script>
          <div class="podobne-oferty">
            <img src="https://img1.staticmorizon.com.pl/thumb/aHR0cHM6Ly9kLWdyLmNkbmdyLnBsL2thZHJ5L3VucmVsYXRlZC1zaW1pbGFyLWxpc3RpbmcuanBn/3x2_m/other.jpg" />
          </div>
        </body>
      </html>
    `;
    const listing = selectedMarketplaceAdapter.parseListing({
      url: "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-krakow-test-mzn2047000123",
      html,
      $: load(html),
      fetchedAt: "2026-08-01T12:00:00.000Z",
    });

    expect(listing.photos).toEqual([
      "https://d-gr.cdngr.pl/kadry/48450000_1-real-listing-photo.jpg",
      "https://d-gr.cdngr.pl/kadry/48450000_2-real-listing-photo.jpg",
      "https://d-gr.cdngr.pl/kadry/48450000_3-real-listing-photo.jpg",
    ]);
  });
});
