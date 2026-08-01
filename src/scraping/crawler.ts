import { CheerioCrawler, RequestQueue } from "crawlee";

import { orderCandidatesDeterministically } from "@/modules/ingestion/deduplication";
import type { IngestionRunInput } from "@/modules/ingestion/types";
import { selectedMarketplaceAdapter } from "@/scraping/selected-marketplace/adapter";
import type {
  DiscoveredListingCandidate,
  ParsedMarketplaceListing,
  ScrapingCrawler,
  ScrapingCrawlerRunResult,
} from "@/scraping/types";
import { env } from "@/shared/env";

interface ListingRequestUserData {
  readonly city: string;
  readonly transactionType: "SALE" | "RENT";
}

function createDiscoveryCrawler(
  requestQueue: RequestQueue,
  discoveredCandidates: DiscoveredListingCandidate[],
  failedRequests: ScrapingCrawlerRunResult["failedRequests"],
): CheerioCrawler {
  return new CheerioCrawler({
    requestQueue,
    maxConcurrency: env.INGESTION_HTTP_CONCURRENCY,
    maxRequestRetries: Math.max(0, env.INGESTION_MAX_REQUEST_ATTEMPTS - 1),
    requestHandlerTimeoutSecs: Math.ceil(env.INGESTION_HTTP_TIMEOUT_MS / 1000),
    additionalMimeTypes: ["text/html"],
    preNavigationHooks: [
      async ({ request }) => {
        request.headers = {
          ...request.headers,
          "user-agent": env.INGESTION_USER_AGENT,
        };
      },
    ],
    requestHandler: async ({ $, request }) => {
      const city = String(request.userData.city);
      const transactionType = request.userData.transactionType as "SALE" | "RENT";
      const discovered = selectedMarketplaceAdapter.discoverListingCandidates({
        url: request.loadedUrl ?? request.url,
        $,
        city,
        transactionType,
      });

      discoveredCandidates.push(...discovered);
    },
    failedRequestHandler: async ({ request, error }) => {
      failedRequests.push({
        stage: "DISCOVERY",
        url: request.url,
        city: typeof request.userData.city === "string" ? request.userData.city : null,
        transactionType:
          request.userData.transactionType === "SALE" || request.userData.transactionType === "RENT"
            ? request.userData.transactionType
            : null,
        errorMessage:
          error instanceof Error ? error.message : "Discovery request failed.",
      });
    },
  });
}

function createListingCrawler(
  requestQueue: RequestQueue,
  rawListings: ParsedMarketplaceListing[],
  failedRequests: ScrapingCrawlerRunResult["failedRequests"],
): CheerioCrawler {
  return new CheerioCrawler({
    requestQueue,
    maxConcurrency: env.INGESTION_HTTP_CONCURRENCY,
    maxRequestRetries: Math.max(0, env.INGESTION_MAX_REQUEST_ATTEMPTS - 1),
    requestHandlerTimeoutSecs: Math.ceil(env.INGESTION_HTTP_TIMEOUT_MS / 1000),
    additionalMimeTypes: ["text/html"],
    preNavigationHooks: [
      async ({ request }) => {
        request.headers = {
          ...request.headers,
          "user-agent": env.INGESTION_USER_AGENT,
        };
      },
    ],
    requestHandler: async ({ $, body, request }) => {
      try {
        const parsedListing = selectedMarketplaceAdapter.parseListing({
          url: request.loadedUrl ?? request.url,
          html: typeof body === "string" ? body : body.toString("utf8"),
          $,
          fetchedAt: new Date().toISOString(),
        });

        rawListings.push(parsedListing);
      } catch (error) {
        failedRequests.push({
          stage: "PARSE",
          url: request.url,
          city: typeof request.userData.city === "string" ? request.userData.city : null,
          transactionType:
            request.userData.transactionType === "SALE" || request.userData.transactionType === "RENT"
              ? request.userData.transactionType
              : null,
          errorMessage: error instanceof Error ? error.message : "Listing parse failed.",
        });
      }
    },
    failedRequestHandler: async ({ request, error }) => {
      failedRequests.push({
        stage: "FETCH",
        url: request.url,
        city: typeof request.userData.city === "string" ? request.userData.city : null,
        transactionType:
          request.userData.transactionType === "SALE" || request.userData.transactionType === "RENT"
            ? request.userData.transactionType
            : null,
        errorMessage: error instanceof Error ? error.message : "Listing request failed.",
      });
    },
  });
}

export function createCrawler(): ScrapingCrawler {
  return {
    async run(input: IngestionRunInput): Promise<ScrapingCrawlerRunResult> {
      const discoveryQueue = await RequestQueue.open(`discovery-${Date.now()}`);
      const searchRoutes = selectedMarketplaceAdapter.buildSearchRoutes(input);

      for (const route of searchRoutes) {
        await discoveryQueue.addRequest({
          url: route.url,
          uniqueKey: route.url,
          userData: {
            city: route.city,
            transactionType: route.transactionType,
          } satisfies ListingRequestUserData,
        });
      }

      const discoveredCandidates: DiscoveredListingCandidate[] = [];
      const failedRequests: ScrapingCrawlerRunResult["failedRequests"] = [];
      const rawListings: ParsedMarketplaceListing[] = [];

      const discoveryCrawler = createDiscoveryCrawler(
        discoveryQueue,
        discoveredCandidates,
        failedRequests,
      );
      await discoveryCrawler.run();

      const deduplicatedCandidates = Array.from(
        new Map(
          discoveredCandidates.map((candidate) => [
            candidate.url,
            {
              ...candidate,
              sourceListingId:
                candidate.sourceListingId ??
                selectedMarketplaceAdapter.extractSourceListingId(candidate.url),
            },
          ]),
        ).values(),
      );

      const orderedCandidates = input.cities.flatMap((city) =>
        (["SALE", "RENT"] as const).flatMap((transactionType) =>
          orderCandidatesDeterministically(
            deduplicatedCandidates.filter(
              (candidate) =>
                candidate.city === city && candidate.transactionType === transactionType,
            ).map((candidate) => ({
              city: candidate.city,
              transactionType: candidate.transactionType,
              sourceUrl: candidate.url,
              sourceListingId: candidate.sourceListingId,
              url: candidate.url,
            })),
            input.seed,
          ),
        ),
      );

      const limitedCandidates = orderedCandidates.slice(0, input.maxCandidates);
      const listingQueue = await RequestQueue.open(`listing-${Date.now()}`);

      for (const candidate of limitedCandidates) {
        await listingQueue.addRequest({
          url: candidate.url,
          uniqueKey: candidate.url,
          userData: {
            city: candidate.city,
            transactionType: candidate.transactionType,
          } satisfies ListingRequestUserData,
        });
      }

      const listingCrawler = createListingCrawler(
        listingQueue,
        rawListings,
        failedRequests,
      );
      await listingCrawler.run();

      return {
        source: selectedMarketplaceAdapter.source,
        rawListings,
        discoveredCandidates: limitedCandidates,
        failedRequests,
        searchRoutesVisited: searchRoutes.length,
        listingPagesFetched: rawListings.length,
      };
    },
  };
}
