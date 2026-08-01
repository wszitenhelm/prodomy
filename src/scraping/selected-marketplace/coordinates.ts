import { load } from "cheerio";

export interface ListingCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveReference(payload: readonly unknown[], value: unknown): unknown {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return value;
  }

  return payload[value] ?? value;
}

function readCoordinatePair(
  payload: readonly unknown[],
  value: unknown,
): ListingCoordinates | null {
  const resolved = resolveReference(payload, value);

  if (!isRecord(resolved)) {
    return null;
  }

  const latitude = resolveReference(payload, resolved.latitude);
  const longitude = resolveReference(payload, resolved.longitude);

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function extractSelectedMarketplaceCoordinatesFromPayload(
  payloadText: string,
): ListingCoordinates | null {
  if (payloadText.trim().length === 0) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(payloadText);

    if (!Array.isArray(payload)) {
      return null;
    }

    for (const value of payload) {
      if (!isRecord(value) || !("center" in value) || !("zoom" in value)) {
        continue;
      }

      const coordinates = readCoordinatePair(payload, value.center);

      if (coordinates !== null) {
        return coordinates;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function extractSelectedMarketplaceCoordinatesFromHtml(
  html: string,
): ListingCoordinates | null {
  const payloadText = load(html)("#__NUXT_DATA__").text();

  return extractSelectedMarketplaceCoordinatesFromPayload(payloadText);
}
