import { mapListingToSummary } from "@/modules/listings/mappers";
import type { ListingDetail, ListingSummary } from "@/modules/listings/types";

export async function listListings(): Promise<ListingSummary[]> {
  const listings: Array<{ id: string }> = [];

  return listings.map(mapListingToSummary);
}

export async function findListingById(id: string): Promise<ListingDetail | null> {
  const listing: { id: string } | null = null;

  if (!listing) {
    return null;
  }

  return {
    id,
  };
}
