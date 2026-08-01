import { Prisma, PrismaClient } from "@prisma/client";

import { createSeedDataset } from "@/modules/listings/seed";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dataset = createSeedDataset();

  await prisma.$transaction([
    prisma.ingestionIssue.deleteMany(),
    prisma.listingFeature.deleteMany(),
    prisma.listingPhoto.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.importRun.deleteMany(),
  ]);

  const importRun = await prisma.importRun.create({
    data: {
      source: dataset.importRun.source,
      startedAt: new Date(dataset.importRun.startedAt),
      finishedAt: new Date(dataset.importRun.finishedAt),
      status: dataset.importRun.status,
      configuration: dataset.importRun.configuration as Prisma.InputJsonObject,
      candidatesDiscovered: dataset.importRun.candidatesDiscovered,
      pagesFetched: dataset.importRun.pagesFetched,
      parsedCount: dataset.importRun.parsedCount,
      normalizedCount: dataset.importRun.normalizedCount,
      publishedCount: dataset.importRun.publishedCount,
      rejectedCount: dataset.importRun.rejectedCount,
      needsReviewCount: dataset.importRun.needsReviewCount,
      duplicateCount: dataset.importRun.duplicateCount,
      failedCount: dataset.importRun.failedCount,
    },
  });

  const listingIdBySourceListingId = new Map<string, string>();

  for (const listing of dataset.listings) {
    const createdListing = await prisma.listing.create({
      data: {
        source: listing.source,
        sourceListingId: listing.sourceListingId,
        sourceUrl: listing.sourceUrl,
        sourceUrlCanonical: listing.sourceUrlCanonical,
        sourceContentHash: listing.sourceContentHash,
        propertyType: listing.propertyType,
        transactionType: listing.transactionType,
        publicationStatus: listing.publicationStatus,
        rejectionReason: listing.rejectionReason,
        title: listing.title,
        descriptionRaw: listing.descriptionRaw,
        descriptionClean: listing.descriptionClean,
        descriptionSummary: listing.descriptionSummary,
        priceAmount: listing.priceAmount,
        currency: listing.currency,
        administrativeFee: listing.administrativeFee,
        depositAmount: listing.depositAmount,
        utilitiesDescription: listing.utilitiesDescription,
        areaM2: listing.areaM2,
        rooms: listing.rooms,
        city: listing.city,
        district: listing.district,
        street: listing.street,
        floor: listing.floor,
        floorCount: listing.floorCount,
        buildingYear: listing.buildingYear,
        marketType: listing.marketType,
        ownershipType: listing.ownershipType,
        buildingType: listing.buildingType,
        heatingType: listing.heatingType,
        condition: listing.condition,
        sellerType: listing.sellerType,
        availableFrom: listing.availableFrom === null ? null : new Date(listing.availableFrom),
        sourcePublishedAt: new Date(listing.sourcePublishedAt),
        sourceUpdatedAt: new Date(listing.sourceUpdatedAt),
        scrapedAt: new Date(listing.scrapedAt),
        contactName: listing.contactName,
        contactPhone: listing.contactPhone,
        rawAttributes: listing.rawAttributes as Prisma.InputJsonObject,
        rawPayload: listing.rawPayload as Prisma.InputJsonValue,
        qualityScore: listing.qualityScore,
        completenessScore: listing.completenessScore,
        consistencyScore: listing.consistencyScore,
        duplicateGroupId: listing.duplicateGroupId,
        isPrimary: listing.isPrimary,
        photos: {
          create: listing.photos,
        },
        features: {
          create: listing.features,
        },
      },
    });

    listingIdBySourceListingId.set(listing.sourceListingId, createdListing.id);
  }

  if (dataset.issues.length > 0) {
    await prisma.ingestionIssue.createMany({
      data: dataset.issues.map((issue) => ({
        importRunId: importRun.id,
        listingId:
          issue.listingSourceListingId === null
            ? null
            : (listingIdBySourceListingId.get(issue.listingSourceListingId) ?? null),
        sourceUrl: issue.sourceUrl,
        stage: issue.stage,
        result: issue.result,
        code: issue.code,
        message: issue.message,
        context: issue.context as Prisma.InputJsonObject,
      })),
    });
  }

  console.info("Seed completed.", dataset.summary);
}

main()
  .catch((error: unknown) => {
    console.error("Seeding failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
