import { describe, expect, test } from "vitest";

import { env } from "@/shared/env";

describe("env", () => {
  test("parses comma-separated ingestion cities", () => {
    expect(env.INGESTION_CITIES.length).toBeGreaterThan(0);
  });
});
