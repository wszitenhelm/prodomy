import { z } from "zod";

const cityNameMap: Readonly<Record<string, string>> = {
  krakow: "Kraków",
  kraków: "Kraków",
  warszawa: "Warszawa",
  wroclaw: "Wrocław",
  wrocław: "Wrocław",
  gdansk: "Gdańsk",
  gdańsk: "Gdańsk",
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  INGESTION_SOURCE: z
    .string()
    .min(1)
    .transform((value) => value.trim().toUpperCase().replace(/[\s-]+/g, "_")),
  INGESTION_CITIES: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    )
    .transform((cities) =>
      cities.map((city) => {
        const mappedCity = cityNameMap[city.toLowerCase()];

        return mappedCity ?? city;
      }),
    ),
  INGESTION_TARGET_SALE: z.coerce.number().int().positive(),
  INGESTION_TARGET_RENT: z.coerce.number().int().positive(),
  INGESTION_MAX_CANDIDATES: z.coerce.number().int().positive(),
  INGESTION_MAX_RESULT_PAGES: z.coerce.number().int().positive(),
  INGESTION_SEED: z.string().min(1),
  INGESTION_HTTP_CONCURRENCY: z.coerce.number().int().positive(),
  INGESTION_BROWSER_CONCURRENCY: z.coerce.number().int().positive(),
  INGESTION_HTTP_TIMEOUT_MS: z.coerce.number().int().positive(),
  INGESTION_BROWSER_TIMEOUT_MS: z.coerce.number().int().positive(),
  INGESTION_MAX_REQUEST_ATTEMPTS: z.coerce.number().int().positive(),
  INGESTION_USER_AGENT: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: process.env.APP_BASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  INGESTION_SOURCE: process.env.INGESTION_SOURCE,
  INGESTION_CITIES: process.env.INGESTION_CITIES,
  INGESTION_TARGET_SALE: process.env.INGESTION_TARGET_SALE,
  INGESTION_TARGET_RENT: process.env.INGESTION_TARGET_RENT,
  INGESTION_MAX_CANDIDATES: process.env.INGESTION_MAX_CANDIDATES,
  INGESTION_MAX_RESULT_PAGES: process.env.INGESTION_MAX_RESULT_PAGES,
  INGESTION_SEED: process.env.INGESTION_SEED,
  INGESTION_HTTP_CONCURRENCY: process.env.INGESTION_HTTP_CONCURRENCY,
  INGESTION_BROWSER_CONCURRENCY: process.env.INGESTION_BROWSER_CONCURRENCY,
  INGESTION_HTTP_TIMEOUT_MS: process.env.INGESTION_HTTP_TIMEOUT_MS,
  INGESTION_BROWSER_TIMEOUT_MS: process.env.INGESTION_BROWSER_TIMEOUT_MS,
  INGESTION_MAX_REQUEST_ATTEMPTS: process.env.INGESTION_MAX_REQUEST_ATTEMPTS,
  INGESTION_USER_AGENT: process.env.INGESTION_USER_AGENT,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
});

export type Env = typeof env;
