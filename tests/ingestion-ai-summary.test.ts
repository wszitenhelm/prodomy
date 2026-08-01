import { afterEach, describe, expect, test, vi } from "vitest";

// These tests must never hit the real Gemini API, even though the local
// .env used by the test setup may contain a real key: @/shared/env is
// mocked per-test so behavior is independent of whatever is actually in the
// developer's local .env, and global.fetch is mocked/spied so no network
// call can occur even if that mock were wrong.

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
});

const baseInput = {
  title: "Mieszkanie 2-pokojowe",
  transactionType: "RENT" as const,
  priceAmount: "3500.00",
  currency: "PLN" as const,
  areaM2: "45.00",
  rooms: 2,
  city: "Kraków",
  district: "Krowodrza",
  descriptionClean: "Przestronne mieszkanie. Czynsz administracyjny: 1100 zł/mies.",
};

describe("summarizeListingDescription", () => {
  test("returns null and never calls fetch when no API key is configured", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: undefined, GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { summarizeListingDescription, isAiSummarizationEnabled } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    expect(isAiSummarizationEnabled()).toBe(false);
    await expect(summarizeListingDescription(baseInput)).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("returns null and never calls fetch when the description is empty", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { summarizeListingDescription } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    await expect(
      summarizeListingDescription({ ...baseInput, descriptionClean: null }),
    ).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("returns validated JSON when the model responds with a well-formed summary", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    const modelJson = {
      mainCost: "3500 zł/mies.",
      additionalCosts: "Czynsz administracyjny: 1100 zł/mies.",
      highlights: ["2 pokoje", "Krowodrza"],
      summary: "Przestronne mieszkanie w dobrej lokalizacji.",
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(modelJson) }],
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { summarizeListingDescription } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    const result = await summarizeListingDescription(baseInput);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0].toString()).toContain(
      "models/gemini-2.5-flash:generateContent",
    );
    expect(JSON.parse(result ?? "null")).toEqual(modelJson);
  });

  test("returns validated summaries for a batch of listings", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    const summary = {
      mainCost: "3500 zł/mies.",
      additionalCosts: null,
      highlights: ["2 pokoje", "Krowodrza", "45 m²"],
      summary: "Przestronne mieszkanie w Krowodrzy.",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        { id: "listing-1", summary },
                        { id: "listing-2", summary },
                      ]),
                    },
                  ],
                },
              },
            ],
          }),
      }),
    );

    const { summarizeListingDescriptions } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );
    const result = await summarizeListingDescriptions([
      { ...baseInput, id: "listing-1" },
      { ...baseInput, id: "listing-2" },
    ]);

    expect(result.size).toBe(2);
    expect(JSON.parse(result.get("listing-1") ?? "null")).toEqual(summary);
    expect(JSON.parse(result.get("listing-2") ?? "null")).toEqual(summary);
  });

  test("returns null without throwing when the model response fails schema validation", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ mainCost: "" }) }],
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { summarizeListingDescription } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    await expect(summarizeListingDescription(baseInput)).resolves.toBeNull();
  });

  test("returns null without throwing when the HTTP response is not ok", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { summarizeListingDescription } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    await expect(summarizeListingDescription(baseInput)).resolves.toBeNull();
  });

  test("returns null without throwing when fetch rejects", async () => {
    vi.doMock("@/shared/env", () => ({
      env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "gemini-2.5-flash" },
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable")),
    );

    const { summarizeListingDescription } = await import(
      "@/modules/ingestion/ai/summarize-description"
    );

    await expect(summarizeListingDescription(baseInput)).resolves.toBeNull();
  });
});
