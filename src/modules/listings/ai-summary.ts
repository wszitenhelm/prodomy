import { z } from "zod";

// Shared between the ingestion-time AI call (which produces this shape) and
// the public detail page (which reads it back out of the stored JSON string
// in Listing.descriptionSummary). Kept intentionally small: the model may
// only rewrite/highlight the description text, never basic numeric fields
// like price or area, which stay deterministically extracted elsewhere.
export const listingAiSummarySchema = z.object({
  mainCost: z.string().trim().min(1),
  additionalCosts: z.string().trim().min(1).nullable(),
  highlights: z.array(z.string().trim().min(1)).min(1).max(6),
  summary: z.string().trim().min(1),
});

export type ListingAiSummary = z.infer<typeof listingAiSummarySchema>;

export function parseListingAiSummary(raw: string | null): ListingAiSummary | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed = listingAiSummarySchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
