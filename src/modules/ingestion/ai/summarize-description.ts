import { z } from "zod";

import { listingAiSummarySchema } from "@/modules/listings/ai-summary";
import type { TransactionType } from "@/modules/listings/constants";
import { env } from "@/shared/env";

const GEMINI_API_HOST = "generativelanguage.googleapis.com";
const REQUEST_TIMEOUT_MS = 20_000;

export interface ListingSummaryInput {
  readonly title: string | null;
  readonly transactionType: TransactionType | null;
  readonly priceAmount: string | null;
  readonly currency: "PLN" | null;
  readonly areaM2: string | null;
  readonly rooms: number | null;
  readonly city: string | null;
  readonly district: string | null;
  readonly descriptionClean: string | null;
}

export interface ListingSummaryBatchInput extends ListingSummaryInput {
  readonly id: string;
}

const listingSummaryBatchResponseSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    summary: listingAiSummarySchema,
  }),
);

export function isAiSummarizationEnabled(): boolean {
  return env.GEMINI_API_KEY !== undefined;
}

function buildPrompt(input: ListingSummaryInput): string {
  const location = [input.city, input.district].filter((value) => value !== null).join(", ");

  return `Jesteś asystentem upraszczającym ogłoszenia nieruchomości dla portalu w Polsce.
Na podstawie poniższych danych zwróć WYŁĄCZNIE obiekt JSON (bez dodatkowego tekstu, bez markdown) o polach:
- "mainCost": string - główna cena znana z danych (sprzedaż lub czynsz najmu), np. "3500 zł/mies.". Przepisz podaną cenę, nie zmieniaj jej.
- "additionalCosts": string lub null - dodatkowe opłaty wymienione W OPISIE (czynsz administracyjny, media, kaucja, opłaty dodatkowe), wyraźnie oddzielone od głównej ceny. Ustaw null, jeśli opis ich nie wspomina.
- "highlights": tablica 3-6 krótkich, konkretnych punktów na podstawie opisu i danych (np. udogodnienia, stan, lokalizacja, piętro).
- "summary": 2-3 zdania w prostym, przystępnym języku podsumowujące ofertę.

Zasady:
- Nie wymyślaj informacji, których nie ma w podanych danych lub opisie.
- Nie zmieniaj podanej głównej ceny, powierzchni ani liczby pokoi.
- Pisz po polsku, prostym językiem.

Dane oferty:
Tytuł: ${input.title ?? "brak"}
Typ transakcji: ${input.transactionType ?? "brak"}
Cena główna (nie zmieniaj): ${input.priceAmount ?? "brak"} ${input.currency ?? ""}
Powierzchnia: ${input.areaM2 ?? "brak"} m²
Pokoje: ${input.rooms ?? "brak"}
Lokalizacja: ${location.length > 0 ? location : "brak"}

Opis:
${input.descriptionClean ?? ""}`;
}

function buildBatchPrompt(inputs: readonly ListingSummaryBatchInput[]): string {
  return `Jesteś asystentem upraszczającym ogłoszenia nieruchomości dla portalu w Polsce.
Zwróć WYŁĄCZNIE tablicę JSON, bez markdown i dodatkowego tekstu. Dla każdej oferty zwróć dokładnie jeden element:
{"id":"identyfikator wejściowy","summary":{"mainCost":"główna cena","additionalCosts":null,"highlights":["3-6 krótkich faktów"],"summary":"2-3 proste zdania"}}

Zasady:
- Zachowaj identyfikator wejściowy bez zmian.
- Nie wymyślaj informacji spoza danych i opisu.
- Nie zmieniaj ceny głównej, powierzchni ani liczby pokoi.
- additionalCosts zawiera tylko opłaty wymienione w opisie; w przeciwnym razie null.
- Pisz po polsku, prostym językiem.

Oferty:
${JSON.stringify(inputs)}`;
}

function extractJsonBlock(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);

  return match?.[0] ?? null;
}

interface GeminiGenerateContentResponse {
  readonly candidates?: Array<{
    readonly content?: {
      readonly parts?: Array<{
        readonly text?: string;
      }>;
    };
  }>;
}

function buildGeminiUrl(): URL {
  return new URL(
    `https://${GEMINI_API_HOST}/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
  );
}

function extractGeminiText(payload: GeminiGenerateContentResponse): string | null {
  const parts = payload.candidates?.[0]?.content?.parts;

  if (parts === undefined) {
    return null;
  }

  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export async function summarizeListingDescription(
  input: ListingSummaryInput,
): Promise<string | null> {
  if (!isAiSummarizationEnabled()) {
    return null;
  }

  if (input.descriptionClean === null || input.descriptionClean.trim().length === 0) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildGeminiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(input) }],
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("AI listing summary request failed", {
        status: response.status,
        sourceTitle: input.title,
      });

      return null;
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const text = extractGeminiText(payload);

    if (text === null) {
      return null;
    }

    const jsonBlock = extractJsonBlock(text);

    if (jsonBlock === null) {
      return null;
    }

    const candidate: unknown = JSON.parse(jsonBlock);
    const parsed = listingAiSummarySchema.safeParse(candidate);

    if (!parsed.success) {
      console.error("AI listing summary response failed validation", parsed.error.issues);

      return null;
    }

    return JSON.stringify(parsed.data);
  } catch (error) {
    console.error(
      "AI listing summary generation failed",
      error instanceof Error ? error.message : error,
    );

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeListingDescriptions(
  inputs: readonly ListingSummaryBatchInput[],
): Promise<ReadonlyMap<string, string>> {
  const usableInputs = inputs.filter(
    (input) => input.descriptionClean !== null && input.descriptionClean.trim().length > 0,
  );

  if (!isAiSummarizationEnabled() || usableInputs.length === 0) {
    return new Map();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(buildGeminiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildBatchPrompt(usableInputs) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
          maxOutputTokens: 8192,
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                summary: {
                  type: "OBJECT",
                  properties: {
                    mainCost: { type: "STRING" },
                    additionalCosts: { type: "STRING", nullable: true },
                    highlights: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                      minItems: 1,
                      maxItems: 6,
                    },
                    summary: { type: "STRING" },
                  },
                  required: ["mainCost", "additionalCosts", "highlights", "summary"],
                },
              },
              required: ["id", "summary"],
            },
          },
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("AI listing summary batch request failed", {
        status: response.status,
        batchSize: usableInputs.length,
      });
      return new Map();
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const text = extractGeminiText(payload);
    const parsed = listingSummaryBatchResponseSchema.safeParse(
      text === null ? null : JSON.parse(text),
    );

    if (!parsed.success) {
      console.error("AI listing summary batch response failed validation", parsed.error.issues);
      return new Map();
    }

    const expectedIds = new Set(usableInputs.map((input) => input.id));
    const returnedIds = new Set(parsed.data.map((item) => item.id));

    if (
      returnedIds.size !== expectedIds.size ||
      [...returnedIds].some((id) => !expectedIds.has(id))
    ) {
      console.error("AI listing summary batch returned mismatched listing identifiers");
      return new Map();
    }

    return new Map(parsed.data.map((item) => [item.id, JSON.stringify(item.summary)]));
  } catch (error) {
    console.error(
      "AI listing summary batch generation failed",
      error instanceof Error ? error.message : error,
    );
    return new Map();
  } finally {
    clearTimeout(timeout);
  }
}
