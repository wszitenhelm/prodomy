import { NextResponse } from "next/server";

import { listingIdSchema } from "@/modules/listings/schemas";
import { getListingDetail } from "@/modules/listings/service";

interface ListingRouteProps {
  readonly params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ListingRouteProps,
): Promise<Response> {
  const parsedParams = listingIdSchema.safeParse((await params).id);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        message: "Invalid listing identifier.",
      },
      {
        status: 400,
      },
    );
  }

  const listing = await getListingDetail(parsedParams.data);

  if (!listing) {
    return NextResponse.json(
      {
        message: "Listing not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      id: listing.id,
      message: "Listing details are not implemented in the repository-foundation stage.",
    },
    {
      status: 200,
    },
  );
}
