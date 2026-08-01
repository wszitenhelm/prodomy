import { z } from "zod";

import { marketplaces, transactionTypes } from "@/modules/listings/constants";
import { publicationStatuses } from "@/modules/listings/constants";
import { decimalStringSchema } from "@/shared/utils/decimal";

const attributeValueSchema = z.union([z.string(), z.array(z.string()), z.null()]);
const extractionWarningSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export const rawSourceListingSchema = z.object({
  source: z.enum(marketplaces),
  sourceUrl: z.url(),
  sourceListingId: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  transactionTypeHint: z.enum(transactionTypes).nullable(),
  locationText: z.string().trim().min(1).nullable(),
  priceText: z.string().trim().min(1).nullable(),
  attributes: z.record(z.string(), attributeValueSchema),
  photos: z.array(z.url()),
  contactName: z.string().trim().min(1).nullable(),
  contactPhone: z.string().trim().min(1).nullable(),
  structuredData: z.unknown(),
  rawPayload: z.unknown(),
  contentHash: z.string().trim().min(1).nullable(),
  fetchedAt: z.string().datetime(),
  extractionWarnings: z.array(extractionWarningSchema),
});

export type ExtractionWarning = z.infer<typeof extractionWarningSchema>;
export type RawSourceListing = z.infer<typeof rawSourceListingSchema>;

export const ingestionWarningSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
});

export const fieldProvenanceSchema = z.object({
  field: z.string().trim().min(1),
  source: z.enum([
    "SOURCE_FIELD",
    "ATTRIBUTE",
    "STRUCTURED_DATA",
    "JSON_LD",
    "DESCRIPTION",
    "TITLE",
    "LOCATION_TEXT",
    "CONTACT",
    "DERIVED",
  ]),
  sourcePath: z.string().trim().min(1),
  raw: z.unknown(),
  normalized: z.unknown(),
});

export const fieldConflictSchema = z.object({
  field: z.string().trim().min(1),
  chosenValue: z.unknown(),
  chosenSource: fieldProvenanceSchema.shape.source,
  candidates: z.array(
    z.object({
      source: fieldProvenanceSchema.shape.source,
      sourcePath: z.string().trim().min(1),
      raw: z.unknown(),
      normalized: z.unknown(),
    }),
  ),
});

export const normalizedIngestionListingSchema = z.object({
  source: z.enum(marketplaces),
  sourceListingId: z.string().trim().min(1).nullable(),
  sourceUrl: z.url(),
  sourceUrlCanonical: z.url(),
  sourceContentHash: z.string().trim().min(1).nullable(),
  propertyType: z.enum(["APARTMENT"]).nullable(),
  transactionType: z.enum(transactionTypes).nullable(),
  title: z.string().trim().min(1).nullable(),
  descriptionRaw: z.string().trim().min(1).nullable(),
  descriptionClean: z.string().trim().min(1).nullable(),
  priceAmount: decimalStringSchema.nullable(),
  currency: z.enum(["PLN"]).nullable(),
  areaM2: decimalStringSchema.nullable(),
  rooms: z.number().int().positive().nullable(),
  city: z.string().trim().min(1).nullable(),
  district: z.string().trim().min(1).nullable(),
  street: z.string().trim().min(1).nullable(),
  floor: z.number().int().nullable(),
  floorCount: z.number().int().nullable(),
  hasBalcony: z.boolean(),
  availableFrom: z.string().datetime().nullable(),
  sourcePublishedAt: z.string().datetime().nullable(),
  sourceUpdatedAt: z.string().datetime().nullable(),
  scrapedAt: z.string().datetime(),
  contactName: z.string().trim().min(1).nullable(),
  contactPhone: z.string().trim().min(1).nullable(),
  rawAttributes: z.record(z.string(), z.unknown()),
  rawPayload: z.unknown(),
  photos: z.array(
    z.object({
      url: z.url(),
      position: z.number().int().nonnegative(),
      isPrimary: z.boolean(),
    }),
  ),
  warnings: z.array(ingestionWarningSchema),
  conflicts: z.array(fieldConflictSchema),
  provenance: z.array(fieldProvenanceSchema),
  publicationStatus: z.enum(publicationStatuses).optional(),
});

export const validatedIngestionDecisionSchema = z.object({
  publicationStatus: z.enum(["PUBLISHED", "REJECTED", "NEEDS_REVIEW"]),
  rejectionReason: z
    .enum([
      "INVALID_PRICE",
      "INVALID_AREA",
      "MISSING_CITY",
      "UNKNOWN_TRANSACTION_TYPE",
      "MISSING_TITLE",
      "NO_USABLE_PHOTOS",
      "NOT_APARTMENT",
    ])
    .nullable(),
  warnings: z.array(ingestionWarningSchema),
  isSuspicious: z.boolean(),
});

export const persistedIngestionResultSchema = z.object({
  sourceUrl: z.url(),
  publicationStatus: z.enum(publicationStatuses),
  duplicateOf: z.string().trim().min(1).nullable(),
  persisted: z.boolean(),
});
