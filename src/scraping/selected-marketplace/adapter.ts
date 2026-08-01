import type { IngestionRunInput } from "@/modules/ingestion/types";
import type { MarketplaceAdapter } from "@/scraping/types";
import { discoverSelectedMarketplaceListingUrls } from "@/scraping/selected-marketplace/discover";
import { parseSelectedMarketplaceListing } from "@/scraping/selected-marketplace/parse-listing";

const citySlugMap: Readonly<Record<string, string>> = {
  Krakow: "krakow",
  Kraków: "krakow",
  Warszawa: "warszawa",
  Wroclaw: "wroclaw",
  Wrocław: "wroclaw",
  Gdansk: "gdansk",
  Gdańsk: "gdansk",
};

function getCitySlug(city: string): string {
  const slug = citySlugMap[city];

  if (slug === undefined) {
    throw new Error(`Unsupported marketplace city: ${city}`);
  }

  return slug;
}

function buildSearchUrl(
  city: string,
  transactionType: "SALE" | "RENT",
  page: number,
): string {
  const citySlug = getCitySlug(city);
  const basePath =
    transactionType === "SALE"
      ? `/mieszkania/${citySlug}/`
      : `/do-wynajecia/mieszkania/${citySlug}/`;
  const url = new URL(basePath, "https://www.morizon.pl");

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  return url.toString();
}

export const selectedMarketplaceAdapter: MarketplaceAdapter = {
  source: "SELECTED_MARKETPLACE",
  sourceName: "Morizon.pl",
  crawlerType: "CHEERIO",
  selectedCities: ["Kraków", "Warszawa", "Wrocław", "Gdańsk"],
  describeSelection() {
    return {
      source: "Morizon.pl",
      why:
        "Public apartment sale and rent pages are available across the target cities with SSR HTML and predictable listing URLs.",
      usefulDataLocation:
        "Useful data is present in visible HTML sections such as the title, price block, highlighted parameters, information tables, location row, advertiser block, and a server-rendered Nuxt payload.",
      crawlerRequirement:
        "CheerioCrawler is sufficient for search results and listing pages; Playwright is not required for the current extraction scope.",
      knownLimitations:
        "Visible HTML can mask phone numbers, so the parser prefers the server-rendered Nuxt payload for public contact data; some source-specific values are still better preserved as raw attributes than as canonical typed fields.",
    };
  },
  buildSearchRoutes(input: Pick<IngestionRunInput, "cities" | "maxResultPages">) {
    return input.cities.flatMap((city) =>
      (["SALE", "RENT"] as const).flatMap((transactionType) =>
        Array.from({ length: input.maxResultPages }, (_, index) => ({
          city,
          transactionType,
          page: index + 1,
          url: buildSearchUrl(city, transactionType, index + 1),
        })),
      ),
    );
  },
  discoverListingCandidates(context) {
    return discoverSelectedMarketplaceListingUrls(context);
  },
  extractSourceListingId(input: string): string | null {
    return input.match(/(mzn\d+)/i)?.[1] ?? null;
  },
  parseListing(context) {
    return parseSelectedMarketplaceListing(context);
  },
};
