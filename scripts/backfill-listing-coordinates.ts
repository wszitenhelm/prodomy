import { z } from "zod";

import { prisma } from "@/db/prisma";
import { extractSelectedMarketplaceCoordinatesFromHtml } from "@/scraping/selected-marketplace/coordinates";
import { env } from "@/shared/env";

const limitSchema = z.coerce.number().int().positive().max(1_000);
const BACKFILL_CONCURRENCY = 3;

function parseLimit(args: readonly string[]): number | undefined {
  const rawLimit = args.find((argument) => argument.startsWith("--limit="))?.slice(8);

  return rawLimit === undefined ? undefined : limitSchema.parse(rawLimit);
}

async function fetchListingHtml(sourceUrl: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= env.INGESTION_MAX_REQUEST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.INGESTION_HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": env.INGESTION_USER_AGENT,
        },
        redirect: "follow",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Listing request failed.");
}

async function main(): Promise<void> {
  const limit = parseLimit(process.argv.slice(2));
  const listings = await prisma.listing.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      isPrimary: true,
      OR: [{ latitude: null }, { longitude: null }],
    },
    orderBy: { id: "asc" },
    take: limit,
    select: {
      id: true,
      sourceUrl: true,
    },
  });

  let updated = 0;
  let missing = 0;
  let failed = 0;

  for (let offset = 0; offset < listings.length; offset += BACKFILL_CONCURRENCY) {
    const batch = listings.slice(offset, offset + BACKFILL_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (listing) => {
        try {
          const html = await fetchListingHtml(listing.sourceUrl);
          const coordinates = extractSelectedMarketplaceCoordinatesFromHtml(html);

          if (coordinates === null) {
            return "missing" as const;
          }

          // Deliberately update only source-derived coordinates. Existing
          // descriptions and Gemini summaries remain untouched.
          await prisma.listing.update({
            where: { id: listing.id },
            data: coordinates,
          });

          return "updated" as const;
        } catch (error) {
          console.error("Coordinate backfill failed for listing", {
            listingId: listing.id,
            message: error instanceof Error ? error.message : String(error),
          });
          return "failed" as const;
        }
      }),
    );

    updated += results.filter((result) => result === "updated").length;
    missing += results.filter((result) => result === "missing").length;
    failed += results.filter((result) => result === "failed").length;

    console.info(
      JSON.stringify({
        type: "coordinate-backfill-progress",
        processed: Math.min(offset + batch.length, listings.length),
        total: listings.length,
        updated,
        missing,
        failed,
      }),
    );
  }

  console.info(
    JSON.stringify(
      {
        type: "coordinate-backfill",
        selected: listings.length,
        updated,
        missing,
        failed,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Coordinate backfill failed.",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
