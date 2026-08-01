export interface IngestionRunInput {
  readonly source: string;
  readonly cities: string[];
  readonly targetSale: number;
  readonly targetRent: number;
  readonly maxCandidates: number;
  readonly maxResultPages: number;
  readonly seed: string;
}

export interface IngestionRunSummary {
  readonly source: string;
  readonly cities: string[];
  readonly status: "NOT_IMPLEMENTED";
}

export type NormalizationSource =
  | "SOURCE_FIELD"
  | "ATTRIBUTE"
  | "STRUCTURED_DATA"
  | "JSON_LD"
  | "DESCRIPTION"
  | "TITLE"
  | "LOCATION_TEXT"
  | "CONTACT"
  | "DERIVED";

export type WarningSeverity = "INFO" | "WARNING" | "CRITICAL";

export type RejectionReason =
  | "INVALID_PRICE"
  | "INVALID_AREA"
  | "MISSING_CITY"
  | "UNKNOWN_TRANSACTION_TYPE"
  | "MISSING_TITLE"
  | "NO_USABLE_PHOTOS"
  | "NOT_APARTMENT";

export interface IngestionWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: WarningSeverity;
}

export interface FieldProvenance<T = unknown> {
  readonly field: string;
  readonly source: NormalizationSource;
  readonly sourcePath: string;
  readonly raw: unknown;
  readonly normalized: T;
}

export interface NormalizationCandidate<T> {
  readonly field: string;
  readonly source: NormalizationSource;
  readonly sourcePath: string;
  readonly raw: unknown;
  readonly normalized: T | null;
  readonly reliability: number;
}

export interface FieldConflict<T = unknown> {
  readonly field: string;
  readonly chosenValue: T;
  readonly chosenSource: NormalizationSource;
  readonly candidates: Array<{
    readonly source: NormalizationSource;
    readonly sourcePath: string;
    readonly raw: unknown;
    readonly normalized: T;
  }>;
}

export interface NormalizedIngestionListing {
  readonly source: string;
  readonly sourceListingId: string | null;
  readonly sourceUrl: string;
  readonly sourceUrlCanonical: string;
  readonly sourceContentHash: string | null;
  readonly propertyType: "APARTMENT" | null;
  readonly transactionType: "SALE" | "RENT" | null;
  readonly title: string | null;
  readonly descriptionRaw: string | null;
  readonly descriptionClean: string | null;
  readonly priceAmount: string | null;
  readonly currency: "PLN" | null;
  readonly areaM2: string | null;
  readonly rooms: number | null;
  readonly city: string | null;
  readonly district: string | null;
  readonly street: string | null;
  readonly floor: number | null;
  readonly floorCount: number | null;
  readonly buildingYear?: number | null;
  readonly availableFrom: string | null;
  readonly sourcePublishedAt: string | null;
  readonly sourceUpdatedAt: string | null;
  readonly scrapedAt: string;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly rawAttributes: Record<string, unknown>;
  readonly rawPayload: unknown;
  readonly photos: Array<{
    readonly url: string;
    readonly position: number;
    readonly isPrimary: boolean;
  }>;
  readonly warnings: IngestionWarning[];
  readonly conflicts: FieldConflict[];
  readonly provenance: FieldProvenance[];
  readonly publicationStatus?: "PUBLISHED" | "REJECTED" | "NEEDS_REVIEW" | "DUPLICATE";
}

export interface ValidationConfig {
  readonly salePriceRange: {
    readonly min: number;
    readonly max: number;
  };
  readonly rentPriceRange: {
    readonly min: number;
    readonly max: number;
  };
  readonly areaRange: {
    readonly min: number;
    readonly max: number;
  };
  readonly roomsRange: {
    readonly min: number;
    readonly max: number;
  };
}

export interface ValidatedIngestionDecision {
  readonly publicationStatus: "PUBLISHED" | "REJECTED" | "NEEDS_REVIEW";
  readonly rejectionReason: RejectionReason | null;
  readonly warnings: IngestionWarning[];
  readonly isSuspicious: boolean;
}

export interface PersistedIngestionResult {
  readonly sourceUrl: string;
  readonly publicationStatus: "PUBLISHED" | "REJECTED" | "NEEDS_REVIEW" | "DUPLICATE";
  readonly duplicateOf: string | null;
  readonly persisted: boolean;
}

export interface DuplicateScoreComponent {
  readonly code: string;
  readonly points: number;
  readonly reason: string;
}

export interface DuplicateScore {
  readonly score: number;
  readonly components: DuplicateScoreComponent[];
  readonly isProbableDuplicate: boolean;
}

export interface ProbableDuplicateCandidate {
  readonly leftId: string;
  readonly rightId: string;
  readonly left: NormalizedIngestionListing;
  readonly right: NormalizedIngestionListing;
}
