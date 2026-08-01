import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { listingIdSchema, publicListingDetailSchema } from "@/modules/listings/schemas";
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
  try {
    const parsedParams = listingIdSchema.parse((await params).id);
    const listing = await getListingDetail(parsedParams);

    if (listing === null) {
      return NextResponse.json(
        {
          message: "Listing not found.",
        },
        {
          status: 404,
        },
      );
    }

    const response = publicListingDetailSchema.parse(listing);

    return NextResponse.json(
      response,
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Invalid listing identifier.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to load listing details.",
      },
      {
        status: 500,
      },
    );
  }
}
