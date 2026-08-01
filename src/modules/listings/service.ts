import { findListingById, listListings } from "@/modules/listings/repository";
import type { ListingDetail, ListingIndexResult } from "@/modules/listings/types";

export async function getListingIndex(): Promise<ListingIndexResult> {
  const items = await listListings();

  return {
    total: items.length,
    items,
    message:
      "Listings page is wired through the service and repository layers. Search and publication logic will be added later.",
  };
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  return findListingById(id);
}
