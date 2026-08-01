import { mapListingRecordToDetail, mapListingRecordToListItem } from "@/modules/listings/mappers";
import { listingRepository } from "@/modules/listings/repository";
import type {
  ListingIndexResult,
  ListingRepository,
  ListingSearchInput,
  PublicListingDetail,
} from "@/modules/listings/types";

function calculateTotalPages(total: number, pageSize: number): number {
  return total === 0 ? 0 : Math.ceil(total / pageSize);
}

export function createListingService(repository: ListingRepository = listingRepository): {
  getListingIndex: (input: ListingSearchInput) => Promise<ListingIndexResult>;
  getListingDetail: (id: string) => Promise<PublicListingDetail | null>;
} {
  return {
    async getListingIndex(input: ListingSearchInput): Promise<ListingIndexResult> {
      const result = await repository.findPublicListings(input);

      return {
        items: result.items.map(mapListingRecordToListItem),
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: result.total,
          totalPages: calculateTotalPages(result.total, input.pageSize),
        },
        appliedFilters: input,
      };
    },
    async getListingDetail(id: string): Promise<PublicListingDetail | null> {
      const listing = await repository.findPublicListingById(id);

      if (listing === null) {
        return null;
      }

      return mapListingRecordToDetail(listing);
    },
  };
}

const service = createListingService();

export async function getListingIndex(input: ListingSearchInput): Promise<ListingIndexResult> {
  return service.getListingIndex(input);
}

export async function getListingDetail(id: string): Promise<PublicListingDetail | null> {
  return service.getListingDetail(id);
}
