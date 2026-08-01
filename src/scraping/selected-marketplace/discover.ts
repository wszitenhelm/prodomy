import type { MarketplaceDiscoverContext } from "@/scraping/types";

export function discoverSelectedMarketplaceListingUrls(
  context: MarketplaceDiscoverContext,
): Array<{
  readonly city: string;
  readonly transactionType: "SALE" | "RENT";
  readonly url: string;
  readonly sourceListingId: string | null;
}> {
  const $ = context.$ as ReturnType<typeof import("cheerio").load>;
  const { city, transactionType } = context;
  const seen = new Set<string>();
  const listingUrls: Array<{
    readonly city: string;
    readonly transactionType: "SALE" | "RENT";
    readonly url: string;
    readonly sourceListingId: string | null;
  }> = [];

  $("a[href*='/oferta/']").each((_, element) => {
    const href = $(element).attr("href");

    if (typeof href !== "string" || !href.startsWith("/oferta/")) {
      return;
    }

    const absoluteUrl = new URL(href, "https://www.morizon.pl").toString();
    const sourceListingId = href.match(/(mzn\d+)/i)?.[1] ?? null;

    if (seen.has(absoluteUrl)) {
      return;
    }

    seen.add(absoluteUrl);
    listingUrls.push({
      city,
      transactionType,
      url: absoluteUrl,
      sourceListingId,
    });
  });

  return listingUrls;
}
