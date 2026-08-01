import { z } from "zod";

import { prisma } from "@/db/prisma";
import {
  isAiSummarizationEnabled,
  summarizeListingDescriptions,
} from "@/modules/ingestion/ai/summarize-description";

const limitSchema = z.coerce.number().int().positive().max(500);
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 10_500;

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function parseLimit(args: readonly string[]): number | undefined {
  const rawLimit = args.find((argument) => argument.startsWith("--limit="))?.slice(8);

  return rawLimit === undefined ? undefined : limitSchema.parse(rawLimit);
}

async function main(): Promise<void> {
  if (!isAiSummarizationEnabled()) {
    throw new Error("GEMINI_API_KEY is required to backfill listing summaries.");
  }

  const limit = parseLimit(process.argv.slice(2));
  const listings = await prisma.listing.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      isPrimary: true,
      descriptionClean: { not: null },
      descriptionSummary: null,
    },
    orderBy: { id: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      transactionType: true,
      priceAmount: true,
      currency: true,
      areaM2: true,
      rooms: true,
      city: true,
      district: true,
      descriptionClean: true,
    },
  });

  let updated = 0;
  let failed = 0;

  for (let offset = 0; offset < listings.length; offset += BATCH_SIZE) {
    const batch = listings.slice(offset, offset + BATCH_SIZE);
    const summaries = await summarizeListingDescriptions(
      batch.map((listing) => ({
        id: listing.id,
        title: listing.title,
        transactionType: listing.transactionType,
        priceAmount: listing.priceAmount?.toFixed(2) ?? null,
        currency: listing.currency,
        areaM2: listing.areaM2?.toFixed(2) ?? null,
        rooms: listing.rooms,
        city: listing.city,
        district: listing.district,
        descriptionClean: listing.descriptionClean,
      })),
    );

    for (const listing of batch) {
      const descriptionSummary = summaries.get(listing.id);

      if (descriptionSummary === undefined) {
        failed += 1;
      } else {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { descriptionSummary },
        });
        updated += 1;
      }
    }

    console.info(
      JSON.stringify({
        type: "ai-summary-progress",
        processed: Math.min(offset + batch.length, listings.length),
        total: listings.length,
        updated,
        failed,
      }),
    );

    if (offset + batch.length < listings.length) {
      await wait(BATCH_DELAY_MS);
    }
  }

  console.info(
    JSON.stringify(
      {
        type: "ai-summary-backfill",
        selected: listings.length,
        updated,
        failed,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error("AI summary backfill failed.", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
