import { z } from "zod";

import {
  currencyCodes,
  featureValueTypes,
  listingFeatureKeys,
  listingSortOptions,
  marketplaces,
  propertyTypes,
  publicationStatuses,
  transactionTypes,
} from "@/modules/listings/constants";
import { decimalStringSchema } from "@/shared/utils/decimal";

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

const optionalTrimmedStringSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).optional(),
);

const optionalPositiveIntSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional(),
);

const optionalPositiveNumberSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().positive().optional(),
);
const optionalBooleanSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true" || value === "1" || value === "on") {
      return true;
    }

    if (value === "false" || value === "0") {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

export const listingIdSchema = z.string().trim().min(1);

export const listingFeatureSchema = z.object({
  key: z.enum(listingFeatureKeys),
  valueType: z.enum(featureValueTypes),
  booleanValue: z.boolean().nullable(),
  numberValue: decimalStringSchema.nullable(),
  textValue: z.string().trim().min(1).nullable(),
  rawValue: z.string().trim().min(1).nullable(),
});

export const listingPhotoSchema = z.object({
  url: z.url(),
  position: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

export const normalizedListingSchema = z.object({
  id: z.string().trim().min(1),
  source: z.enum(marketplaces),
  sourceListingId: z.string().trim().min(1).nullable(),
  sourceUrl: z.url(),
  sourceUrlCanonical: z.url(),
  sourceContentHash: z.string().trim().min(1).nullable(),
  propertyType: z.enum(propertyTypes).nullable(),
  transactionType: z.enum(transactionTypes).nullable(),
  publicationStatus: z.enum(publicationStatuses),
  rejectionReason: z.string().trim().min(1).nullable(),
  title: z.string().trim().min(1).nullable(),
  descriptionRaw: z.string().trim().min(1).nullable(),
  descriptionClean: z.string().trim().min(1).nullable(),
  descriptionSummary: z.string().trim().min(1).nullable(),
  priceAmount: decimalStringSchema.nullable(),
  currency: z.enum(currencyCodes).nullable(),
  administrativeFee: decimalStringSchema.nullable(),
  depositAmount: decimalStringSchema.nullable(),
  utilitiesDescription: z.string().trim().min(1).nullable(),
  areaM2: decimalStringSchema.nullable(),
  rooms: z.number().int().positive().nullable(),
  city: z.string().trim().min(1).nullable(),
  district: z.string().trim().min(1).nullable(),
  street: z.string().trim().min(1).nullable(),
  floor: z.number().int().nullable(),
  floorCount: z.number().int().positive().nullable(),
  buildingYear: z.number().int().positive().nullable(),
  marketType: z.string().trim().min(1).nullable(),
  ownershipType: z.string().trim().min(1).nullable(),
  buildingType: z.string().trim().min(1).nullable(),
  heatingType: z.string().trim().min(1).nullable(),
  condition: z.string().trim().min(1).nullable(),
  sellerType: z.string().trim().min(1).nullable(),
  availableFrom: z.string().datetime().nullable(),
  sourcePublishedAt: z.string().datetime().nullable(),
  sourceUpdatedAt: z.string().datetime().nullable(),
  scrapedAt: z.string().datetime().nullable(),
  contactName: z.string().trim().min(1).nullable(),
  contactPhone: z.string().trim().min(1).nullable(),
  rawAttributes: z.record(z.string(), z.unknown()),
  rawPayload: z.unknown(),
  qualityScore: z.number().int().min(0).max(100).nullable(),
  completenessScore: z.number().int().min(0).max(100).nullable(),
  consistencyScore: z.number().int().min(0).max(100).nullable(),
  duplicateGroupId: z.string().trim().min(1).nullable(),
  isPrimary: z.boolean(),
  photos: z.array(listingPhotoSchema),
  features: z.array(listingFeatureSchema),
});

const listingSearchInputBaseSchema = z.object({
  q: optionalTrimmedStringSchema,
  transactionType: z.preprocess(
    emptyStringToUndefined,
    z.enum(transactionTypes).optional(),
  ),
  city: optionalTrimmedStringSchema,
  district: optionalTrimmedStringSchema,
  minPrice: optionalPositiveIntSchema,
  maxPrice: optionalPositiveIntSchema,
  minArea: optionalPositiveNumberSchema,
  maxArea: optionalPositiveNumberSchema,
  rooms: optionalPositiveIntSchema,
  active: optionalBooleanSchema.default(true),
  page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(1)),
  pageSize: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().max(50).default(20),
  ),
  sort: z.preprocess(emptyStringToUndefined, z.enum(listingSortOptions).default("newest")),
});

export const listingSearchInputSchema = listingSearchInputBaseSchema.superRefine(
  (value, context) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice cannot be greater than maxPrice.",
        path: ["minPrice"],
      });
    }

    if (
      value.minArea !== undefined &&
      value.maxArea !== undefined &&
      value.minArea > value.maxArea
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minArea cannot be greater than maxArea.",
        path: ["minArea"],
      });
    }
  },
);

export const publicListingListItemSchema = z.object({
  id: listingIdSchema,
  title: z.string().trim().min(1),
  transactionType: z.enum(transactionTypes),
  source: z.enum(marketplaces),
  sourceUrl: z.url(),
  priceAmount: decimalStringSchema,
  currency: z.enum(currencyCodes),
  administrativeFee: decimalStringSchema.nullable(),
  pricePerSquareMetre: decimalStringSchema.nullable(),
  areaM2: decimalStringSchema,
  rooms: z.number().int().positive().nullable(),
  city: z.string().trim().min(1),
  district: z.string().trim().min(1).nullable(),
  street: z.string().trim().min(1).nullable(),
  floor: z.number().int().nullable(),
  publishedAt: z.string().datetime().nullable(),
  photo: listingPhotoSchema.nullable(),
});

export const publicListingDetailSchema = publicListingListItemSchema.extend({
  description: z.string().trim().min(1).nullable(),
  depositAmount: decimalStringSchema.nullable(),
  utilitiesDescription: z.string().trim().min(1).nullable(),
  floorCount: z.number().int().nullable(),
  buildingYear: z.number().int().positive().nullable(),
  marketType: z.string().trim().min(1).nullable(),
  ownershipType: z.string().trim().min(1).nullable(),
  buildingType: z.string().trim().min(1).nullable(),
  condition: z.string().trim().min(1).nullable(),
  sellerType: z.string().trim().min(1).nullable(),
  contactName: z.string().trim().min(1).nullable(),
  contactPhone: z.string().trim().min(1).nullable(),
  availableFrom: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  photos: z.array(listingPhotoSchema),
  features: z.array(listingFeatureSchema),
});

export const paginatedListingResponseSchema = z.object({
  items: z.array(publicListingListItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive().max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  appliedFilters: listingSearchInputBaseSchema,
});

export type ListingFeature = z.infer<typeof listingFeatureSchema>;
export type ListingPhoto = z.infer<typeof listingPhotoSchema>;
export type NormalizedListing = z.infer<typeof normalizedListingSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchInputSchema>;
export type PublicListingListItem = z.infer<typeof publicListingListItemSchema>;
export type PublicListingDetail = z.infer<typeof publicListingDetailSchema>;
export type PaginatedListingResponse = z.infer<typeof paginatedListingResponseSchema>;
