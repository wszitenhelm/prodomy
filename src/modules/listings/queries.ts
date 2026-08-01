import { listingSearchInputSchema } from "@/modules/listings/schemas";
import type { ListingSearchInput } from "@/modules/listings/types";

export function parseListingSearchParams(searchParams: URLSearchParams): ListingSearchInput {
  return listingSearchInputSchema.parse({
    q: searchParams.get("q") ?? undefined,
    transactionType: searchParams.get("transactionType") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    minArea: searchParams.get("minArea") ?? undefined,
    maxArea: searchParams.get("maxArea") ?? undefined,
    rooms: searchParams.get("rooms") ?? undefined,
    active: searchParams.get("active") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });
}

export function createSearchParamsFromObject(
  input: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      const first = value[0];

      if (first !== undefined) {
        searchParams.set(key, first);
      }

      continue;
    }

    if (value !== undefined) {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

export function searchParamsToInput(
  input: Record<string, string | string[] | undefined>,
): ListingSearchInput {
  return parseListingSearchParams(createSearchParamsFromObject(input));
}

export function buildListingSearchHref(input: Partial<ListingSearchInput>): string {
  const searchParams = new URLSearchParams();

  if (input.q !== undefined) {
    searchParams.set("q", input.q);
  }

  if (input.transactionType !== undefined) {
    searchParams.set("transactionType", input.transactionType);
  }

  if (input.city !== undefined) {
    searchParams.set("city", input.city);
  }

  if (input.district !== undefined) {
    searchParams.set("district", input.district);
  }

  if (input.minPrice !== undefined) {
    searchParams.set("minPrice", String(input.minPrice));
  }

  if (input.maxPrice !== undefined) {
    searchParams.set("maxPrice", String(input.maxPrice));
  }

  if (input.minArea !== undefined) {
    searchParams.set("minArea", String(input.minArea));
  }

  if (input.maxArea !== undefined) {
    searchParams.set("maxArea", String(input.maxArea));
  }

  if (input.rooms !== undefined) {
    searchParams.set("rooms", String(input.rooms));
  }

  if (input.active !== undefined) {
    searchParams.set("active", String(input.active));
  }

  if (input.page !== undefined && input.page !== 1) {
    searchParams.set("page", String(input.page));
  }

  if (input.pageSize !== undefined && input.pageSize !== 20) {
    searchParams.set("pageSize", String(input.pageSize));
  }

  if (input.sort !== undefined && input.sort !== "newest") {
    searchParams.set("sort", input.sort);
  }

  const query = searchParams.toString();

  return query.length === 0 ? "/listings" : `/listings?${query}`;
}
