import { describe, expect, test } from "vitest";

import { orderCandidatesDeterministically } from "@/modules/ingestion/deduplication";

describe("deterministic candidate ordering", () => {
  test("uses fixed-seed deterministic ordering within a city and transaction group", () => {
    const candidates = [
      {
        city: "Kraków",
        transactionType: "SALE" as const,
        sourceUrl: "https://example.test/3",
        sourceListingId: "3",
      },
      {
        city: "Kraków",
        transactionType: "SALE" as const,
        sourceUrl: "https://example.test/1",
        sourceListingId: "1",
      },
      {
        city: "Kraków",
        transactionType: "SALE" as const,
        sourceUrl: "https://example.test/2",
        sourceListingId: "2",
      },
    ];

    const first = orderCandidatesDeterministically(candidates, "real-estate-mvp-v1");
    const second = orderCandidatesDeterministically(candidates, "real-estate-mvp-v1");
    const differentSeed = orderCandidatesDeterministically(candidates, "other-seed");

    expect(first.map((candidate) => candidate.sourceListingId)).toEqual(
      second.map((candidate) => candidate.sourceListingId),
    );
    expect(first.map((candidate) => candidate.sourceListingId)).not.toEqual(
      differentSeed.map((candidate) => candidate.sourceListingId),
    );
  });
});
