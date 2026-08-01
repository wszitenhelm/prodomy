import { NextResponse } from "next/server";
import { z } from "zod";

import { parseNaturalListingSearch } from "@/modules/listings/ai/parse-natural-search";
import {
  buildListingSearchHref,
  parseListingSearchParams,
} from "@/modules/listings/queries";
import type { ListingSearchInput } from "@/modules/listings/types";

const naturalSearchQuerySchema = z.string().trim().min(1).max(500);

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const parsedQuery = naturalSearchQuerySchema.safeParse(requestUrl.searchParams.get("query"));
  const previousNaturalQuery = requestUrl.searchParams.get("previousNaturalQuery")?.trim();
  const explicitFilters = parseListingSearchParams(requestUrl.searchParams);
  const definedExplicitFilters = Object.fromEntries(
    Object.entries(explicitFilters).filter(([, value]) => value !== undefined),
  ) as Partial<ListingSearchInput>;

  const naturalFilters = parsedQuery.success
    ? await parseNaturalListingSearch(parsedQuery.data)
    : {};
  const queryChanged =
    parsedQuery.success && parsedQuery.data !== (previousNaturalQuery ?? "");
  const filters = queryChanged
    ? { ...naturalFilters, page: 1 }
    : { ...naturalFilters, ...definedExplicitFilters, page: 1 };
  const destination = new URL(buildListingSearchHref(filters), requestUrl);

  if (parsedQuery.success) {
    destination.searchParams.set("naturalQuery", parsedQuery.data);
  }

  return NextResponse.redirect(destination);
}
