import type { TransactionType } from "@/modules/listings/constants";
import { publicationStatuses, transactionTypes } from "@/modules/listings/constants";
import type {
  IngestionWarning,
  RejectionReason,
  ValidatedIngestionDecision,
  ValidationConfig,
} from "@/modules/ingestion/types";
import type { NormalizedIngestionListing } from "@/modules/ingestion/types";

const defaultValidationConfig: ValidationConfig = {
  salePriceRange: {
    min: 100000,
    max: 5000000,
  },
  rentPriceRange: {
    min: 800,
    max: 30000,
  },
  areaRange: {
    min: 15,
    max: 400,
  },
  roomsRange: {
    min: 1,
    max: 12,
  },
};

function toNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createWarning(
  code: string,
  message: string,
  severity: "INFO" | "WARNING" | "CRITICAL" = "WARNING",
): IngestionWarning {
  return {
    code,
    message,
    severity,
  };
}

function reject(reason: RejectionReason, warnings: IngestionWarning[]): ValidatedIngestionDecision {
  return {
    publicationStatus: publicationStatuses[1],
    rejectionReason: reason,
    warnings,
    isSuspicious: false,
  };
}

function suspicious(
  warnings: IngestionWarning[],
  rejectionReason: RejectionReason | null = null,
): ValidatedIngestionDecision {
  return {
    publicationStatus: publicationStatuses[2],
    rejectionReason,
    warnings,
    isSuspicious: true,
  };
}

function published(warnings: IngestionWarning[]): ValidatedIngestionDecision {
  return {
    publicationStatus: publicationStatuses[0],
    rejectionReason: null,
    warnings,
    isSuspicious: false,
  };
}

function getPriceRange(
  transactionType: TransactionType | null,
  config: ValidationConfig,
): { min: number; max: number } | null {
  if (transactionType === transactionTypes[0]) {
    return config.salePriceRange;
  }

  if (transactionType === transactionTypes[1]) {
    return config.rentPriceRange;
  }

  return null;
}

export function evaluatePublicationQuality(
  listing: NormalizedIngestionListing,
  config: ValidationConfig = defaultValidationConfig,
): ValidatedIngestionDecision {
  const warnings = [...listing.warnings];
  const priceAmount = toNumber(listing.priceAmount);
  const areaM2 = toNumber(listing.areaM2);

  if (listing.propertyType !== "APARTMENT") {
    return reject("NOT_APARTMENT", [
      ...warnings,
      createWarning("NOT_APARTMENT", "Only apartment listings are publishable.", "CRITICAL"),
    ]);
  }

  if (listing.transactionType === null) {
    return reject("UNKNOWN_TRANSACTION_TYPE", [
      ...warnings,
      createWarning(
        "UNKNOWN_TRANSACTION_TYPE",
        "Transaction type is required for publication.",
        "CRITICAL",
      ),
    ]);
  }

  if (listing.title === null) {
    return reject("MISSING_TITLE", [
      ...warnings,
      createWarning("MISSING_TITLE", "Listing title is required for publication.", "CRITICAL"),
    ]);
  }

  if (listing.city === null) {
    return reject("MISSING_CITY", [
      ...warnings,
      createWarning("MISSING_CITY", "Listing city is required for publication.", "CRITICAL"),
    ]);
  }

  if (listing.photos.length === 0) {
    return reject("NO_USABLE_PHOTOS", [
      ...warnings,
      createWarning("NO_USABLE_PHOTOS", "At least one usable photo is required.", "CRITICAL"),
    ]);
  }

  if (priceAmount === null || priceAmount <= 0) {
    return reject("INVALID_PRICE", [
      ...warnings,
      createWarning("INVALID_PRICE", "Price is required and must be positive.", "CRITICAL"),
    ]);
  }

  if (areaM2 === null || areaM2 <= 0) {
    return reject("INVALID_AREA", [
      ...warnings,
      createWarning("INVALID_AREA", "Area is required and must be positive.", "CRITICAL"),
    ]);
  }

  const suspicionWarnings: IngestionWarning[] = [];
  const priceRange = getPriceRange(listing.transactionType, config);

  if (priceRange !== null && (priceAmount < priceRange.min || priceAmount > priceRange.max)) {
    suspicionWarnings.push(
      createWarning("SUSPICIOUS_PRICE", "Price is outside the expected broad sanity range."),
    );
  }

  if (areaM2 < config.areaRange.min || areaM2 > config.areaRange.max) {
    suspicionWarnings.push(
      createWarning("SUSPICIOUS_AREA", "Area is outside the expected broad sanity range."),
    );
  }

  if (
    listing.rooms !== null &&
    (listing.rooms < config.roomsRange.min || listing.rooms > config.roomsRange.max)
  ) {
    suspicionWarnings.push(
      createWarning("SUSPICIOUS_ROOMS", "Room count is outside the expected broad sanity range."),
    );
  }

  if (listing.conflicts.length > 0) {
    suspicionWarnings.push(
      createWarning(
        "CRITICAL_CONFLICT",
        "Conflicting normalized source values require manual review.",
      ),
    );
  }

  if (suspicionWarnings.length > 0) {
    return suspicious([...warnings, ...suspicionWarnings]);
  }

  return published(warnings);
}
