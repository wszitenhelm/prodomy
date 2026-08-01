import type {
  ListingListItem,
  ListingSearchInput,
  NormalizedListing,
  PaginatedListingResponse,
} from "@/modules/listings/schemas";
import type { RawSourceListing } from "@/modules/ingestion/schemas";

export interface ListingSummary {
  readonly id: string;
}

export interface ListingDetail {
  readonly id: string;
}

export interface ListingIndexResult {
  readonly total: number;
  readonly items: ListingSummary[];
  readonly message: string;
}

export type { ListingListItem, ListingSearchInput, NormalizedListing, PaginatedListingResponse, RawSourceListing };
