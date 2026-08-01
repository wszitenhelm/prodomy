import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { paginatedListingResponseSchema } from "@/modules/listings/schemas";
import { parseListingSearchParams } from "@/modules/listings/queries";
import { getListingIndex } from "@/modules/listings/service";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = parseListingSearchParams(url.searchParams);
    const result = await getListingIndex(query);
    const response = paginatedListingResponseSchema.parse(result);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Invalid listing query.",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to load listings.",
      },
      {
        status: 500,
      },
    );
  }
}
