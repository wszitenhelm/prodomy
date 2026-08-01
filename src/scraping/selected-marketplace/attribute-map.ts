import type { ListingFeatureKey } from "@/modules/listings/constants";

const featureMap = new Map<string, ListingFeatureKey>([
  ["balkon", "BALCONY"],
  ["winda", "ELEVATOR"],
  ["parking", "PARKING"],
  ["miejsce parkingowe", "PARKING"],
  ["garaz", "GARAGE"],
  ["garaż", "GARAGE"],
  ["taras", "TERRACE"],
  ["ogrodek", "GARDEN"],
  ["ogródek", "GARDEN"],
  ["meble", "FURNISHED"],
  ["umeblowana kuchnia", "FURNISHED"],
  ["klimatyzacja", "AIR_CONDITIONING"],
  ["piwnica", "STORAGE_ROOM"],
  ["domofon", "SECURITY"],
]);

function normalizeFeatureValue(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function mapSelectedMarketplaceFeature(
  value: string,
): ListingFeatureKey | null {
  return featureMap.get(normalizeFeatureValue(value)) ?? null;
}
