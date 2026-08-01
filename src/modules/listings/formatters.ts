import type {
  ListingFeature,
  ListingSearchInput,
  PublicListingDetail,
  PublicListingListItem,
} from "@/modules/listings/types";

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
});

const relativeFormatter = new Intl.RelativeTimeFormat("pl-PL", {
  numeric: "auto",
});

const featureLabels: Record<ListingFeature["key"], string> = {
  BALCONY: "Balkon",
  ELEVATOR: "Winda",
  PARKING: "Parking",
  GARAGE: "Garaż",
  TERRACE: "Taras",
  GARDEN: "Ogród",
  FURNISHED: "Umeblowane",
  PET_FRIENDLY: "Przyjazne zwierzętom",
  AIR_CONDITIONING: "Klimatyzacja",
  STORAGE_ROOM: "Komórka lokatorska",
  SECURITY: "Ochrona",
  GATED_PROPERTY: "Osiedle zamknięte",
};

export const cityOptions = ["Kraków", "Warszawa", "Wrocław", "Gdańsk"] as const;

export function formatCurrency(amount: string): string {
  return currencyFormatter.format(Number(amount));
}

export function formatArea(areaM2: string): string {
  return `${numberFormatter.format(Number(areaM2))} m²`;
}

export function formatRooms(rooms: number | null): string | null {
  if (rooms === null) {
    return null;
  }

  return `${rooms} pok.`;
}

export function formatFloor(
  floor: number | null,
  floorCount?: number | null,
): string | null {
  if (floor === null) {
    return null;
  }

  if (floorCount !== undefined && floorCount !== null) {
    return `${floor}/${floorCount} piętro`;
  }

  return `${floor} piętro`;
}

export function formatTransactionType(
  transactionType: PublicListingListItem["transactionType"],
): string {
  return transactionType === "SALE" ? "Na sprzedaż" : "Na wynajem";
}

export function formatSortLabel(sort: ListingSearchInput["sort"]): string {
  switch (sort) {
    case "price_asc":
      return "Cena rosnąco";
    case "price_desc":
      return "Cena malejąco";
    case "area_asc":
      return "Metraż rosnąco";
    case "area_desc":
      return "Metraż malejąco";
    case "newest":
    default:
      return "Najnowsze";
  }
}

export function formatPriceMeta(listing: PublicListingListItem): string | null {
  if (listing.transactionType === "RENT") {
    if (listing.administrativeFee !== null) {
      return `Czynsz adm. ${formatCurrency(listing.administrativeFee)}`;
    }

    return null;
  }

  if (listing.pricePerSquareMetre !== null) {
    return `${formatCurrency(listing.pricePerSquareMetre)}/m²`;
  }

  return null;
}

export function formatLocation(
  location: Pick<PublicListingListItem, "city" | "district" | "street">,
): string {
  return [location.city, location.district, location.street].filter(Boolean).join(", ");
}

export function formatDate(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return dateFormatter.format(new Date(value));
}

export function formatFreshness(detail: Pick<PublicListingDetail, "updatedAt" | "publishedAt">): string | null {
  const source = detail.updatedAt ?? detail.publishedAt;

  if (source === null) {
    return null;
  }

  const date = new Date(source);
  const now = new Date("2026-08-01T12:00:00.000Z");
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return `Źródło zaktualizowano ${relativeFormatter.format(diffDays, "day")}`;
}

export function formatFeatureValue(feature: ListingFeature): string {
  const label = featureLabels[feature.key];

  if (feature.valueType === "BOOLEAN") {
    return feature.booleanValue === false ? `${label}: nie` : label;
  }

  if (feature.valueType === "NUMBER" && feature.numberValue !== null) {
    return `${label}: ${numberFormatter.format(Number(feature.numberValue))}`;
  }

  if (feature.textValue !== null) {
    return `${label}: ${feature.textValue}`;
  }

  return feature.rawValue === null ? label : `${label}: ${feature.rawValue}`;
}
