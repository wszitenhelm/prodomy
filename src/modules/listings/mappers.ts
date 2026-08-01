import type { ListingSummary } from "@/modules/listings/types";

export function mapListingToSummary(listing: { id: string }): ListingSummary {
  return {
    id: listing.id,
  };
}
