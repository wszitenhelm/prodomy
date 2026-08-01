import { NextResponse } from "next/server";

import { getListingIndex } from "@/modules/listings/service";

export async function GET(): Promise<Response> {
  const result = await getListingIndex();

  return NextResponse.json({
    items: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: result.total,
      totalPages: 0,
    },
    appliedFilters: {},
    message: result.message,
  });
}
