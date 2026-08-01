-- CreateTable
CREATE TABLE `Listing` (
    `id` VARCHAR(191) NOT NULL,
    `source` ENUM('SELECTED_MARKETPLACE') NOT NULL,
    `sourceListingId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(512) NOT NULL,
    `sourceUrlCanonical` VARCHAR(512) NOT NULL,
    `sourceContentHash` VARCHAR(191) NULL,
    `propertyType` ENUM('APARTMENT') NULL,
    `transactionType` ENUM('SALE', 'RENT') NULL,
    `publicationStatus` ENUM('PUBLISHED', 'REJECTED', 'NEEDS_REVIEW', 'DUPLICATE') NOT NULL,
    `rejectionReason` VARCHAR(255) NULL,
    `title` VARCHAR(512) NULL,
    `descriptionRaw` LONGTEXT NULL,
    `descriptionClean` LONGTEXT NULL,
    `descriptionSummary` LONGTEXT NULL,
    `priceAmount` DECIMAL(12, 2) NULL,
    `currency` ENUM('PLN') NULL,
    `administrativeFee` DECIMAL(12, 2) NULL,
    `depositAmount` DECIMAL(12, 2) NULL,
    `utilitiesDescription` VARCHAR(512) NULL,
    `areaM2` DECIMAL(8, 2) NULL,
    `rooms` INTEGER NULL,
    `city` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `street` VARCHAR(191) NULL,
    `floor` INTEGER NULL,
    `floorCount` INTEGER NULL,
    `buildingYear` INTEGER NULL,
    `marketType` VARCHAR(191) NULL,
    `ownershipType` VARCHAR(191) NULL,
    `buildingType` VARCHAR(191) NULL,
    `heatingType` VARCHAR(191) NULL,
    `condition` VARCHAR(191) NULL,
    `sellerType` VARCHAR(191) NULL,
    `availableFrom` DATETIME(3) NULL,
    `sourcePublishedAt` DATETIME(3) NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `scrapedAt` DATETIME(3) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(64) NULL,
    `rawAttributes` JSON NOT NULL,
    `rawPayload` JSON NOT NULL,
    `qualityScore` INTEGER NULL,
    `completenessScore` INTEGER NULL,
    `consistencyScore` INTEGER NULL,
    `duplicateGroupId` VARCHAR(191) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `listings_publication_isPrimary_idx`(`publicationStatus`, `isPrimary`),
    INDEX `listings_search_core_idx`(`transactionType`, `city`, `publicationStatus`, `isPrimary`),
    INDEX `listings_priceAmount_idx`(`priceAmount`),
    INDEX `listings_areaM2_idx`(`areaM2`),
    INDEX `listings_rooms_idx`(`rooms`),
    INDEX `listings_createdAt_idx`(`createdAt`),
    INDEX `listings_duplicateGroupId_idx`(`duplicateGroupId`),
    INDEX `listings_source_identity_idx`(`source`, `sourceListingId`),
    UNIQUE INDEX `listings_source_sourceUrlCanonical_key`(`source`, `sourceUrlCanonical`),
    UNIQUE INDEX `listings_source_sourceListingId_key`(`source`, `sourceListingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `position` INTEGER NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_photos_listingId_position_idx`(`listingId`, `position`),
    UNIQUE INDEX `listing_photos_listingId_url_key`(`listingId`, `url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingFeature` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `key` ENUM('BALCONY', 'ELEVATOR', 'PARKING', 'GARAGE', 'TERRACE', 'GARDEN', 'FURNISHED', 'PET_FRIENDLY', 'AIR_CONDITIONING', 'STORAGE_ROOM', 'SECURITY', 'GATED_PROPERTY') NOT NULL,
    `valueType` ENUM('BOOLEAN', 'NUMBER', 'TEXT') NOT NULL,
    `booleanValue` BOOLEAN NULL,
    `numberValue` DECIMAL(12, 2) NULL,
    `textValue` VARCHAR(191) NULL,
    `rawValue` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `listing_features_key_idx`(`key`),
    UNIQUE INDEX `listing_features_listingId_key_key`(`listingId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportRun` (
    `id` VARCHAR(191) NOT NULL,
    `source` ENUM('SELECTED_MARKETPLACE') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `status` ENUM('RUNNING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED') NOT NULL,
    `configuration` JSON NOT NULL,
    `candidatesDiscovered` INTEGER NOT NULL DEFAULT 0,
    `pagesFetched` INTEGER NOT NULL DEFAULT 0,
    `parsedCount` INTEGER NOT NULL DEFAULT 0,
    `normalizedCount` INTEGER NOT NULL DEFAULT 0,
    `publishedCount` INTEGER NOT NULL DEFAULT 0,
    `rejectedCount` INTEGER NOT NULL DEFAULT 0,
    `needsReviewCount` INTEGER NOT NULL DEFAULT 0,
    `duplicateCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `import_runs_source_startedAt_idx`(`source`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IngestionIssue` (
    `id` VARCHAR(191) NOT NULL,
    `importRunId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(512) NOT NULL,
    `stage` ENUM('DISCOVERY', 'FETCH', 'PARSE', 'NORMALIZE', 'VALIDATE', 'DEDUPLICATE', 'PERSIST') NOT NULL,
    `result` ENUM('SUCCESS', 'FAILED', 'REJECTED', 'DUPLICATE') NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `message` VARCHAR(512) NOT NULL,
    `context` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ingestion_issues_importRunId_stage_idx`(`importRunId`, `stage`),
    INDEX `ingestion_issues_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ListingPhoto` ADD CONSTRAINT `ListingPhoto_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingFeature` ADD CONSTRAINT `ListingFeature_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngestionIssue` ADD CONSTRAINT `IngestionIssue_importRunId_fkey` FOREIGN KEY (`importRunId`) REFERENCES `ImportRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngestionIssue` ADD CONSTRAINT `IngestionIssue_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

