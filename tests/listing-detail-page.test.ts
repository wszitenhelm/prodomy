import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ListingDetailPage from "@/app/listings/[id]/page";
import { getListingDetail } from "@/modules/listings/service";
import type { PublicListingDetail } from "@/modules/listings/types";

vi.mock("@/modules/listings/service", () => ({
  getListingDetail: vi.fn(),
}));

vi.mock("@/modules/listings/components/listing-gallery", () => ({
  ListingGallery: () => null,
}));

const listing: PublicListingDetail = {
  id: "listing-1",
  title: "Mieszkanie w centrum",
  transactionType: "RENT",
  source: "SELECTED_MARKETPLACE",
  sourceUrl: "https://example.com/listing-1",
  priceAmount: "4200.00",
  currency: "PLN",
  administrativeFee: "800.00",
  pricePerSquareMetre: null,
  areaM2: "60.00",
  rooms: 2,
  city: "Kraków",
  district: "Krowodrza",
  street: null,
  floor: 1,
  publishedAt: null,
  photo: null,
  description: "Przestronne mieszkanie.",
  aiSummary: {
    mainCost: "4200 zł/mies.",
    additionalCosts: "Czynsz administracyjny 800 zł oraz media",
    highlights: ["2 pokoje"],
    summary: "Przestronne mieszkanie w centrum.",
  },
  depositAmount: null,
  utilitiesDescription: null,
  floorCount: 4,
  buildingYear: null,
  marketType: null,
  ownershipType: null,
  buildingType: null,
  condition: null,
  sellerType: null,
  contactName: null,
  contactPhone: null,
  availableFrom: null,
  updatedAt: null,
  photos: [],
  features: [],
};

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.mocked(getListingDetail).mockResolvedValue(listing);
  });

  test("shows AI additional costs at the top and in the summary without an AI badge", async () => {
    const page = await ListingDetailPage({ params: Promise.resolve({ id: listing.id }) });
    const html = renderToStaticMarkup(page);
    const topFacts = html.match(/<dl class="detail-facts"[^>]*>(.*?)<\/dl>/)?.[1] ?? "";

    expect(topFacts).toContain("Dodatkowe opłaty");
    expect(topFacts).toContain("Czynsz administracyjny 800 zł oraz media");
    expect(html.match(/Dodatkowe opłaty/g)).toHaveLength(2);
    expect(html).not.toContain("Wygenerowano przez AI");
    expect(topFacts).toContain("1. piętro w czteropiętrowym bloku");
    expect(html).not.toContain("Wyposażenie i cechy");
    expect(html).not.toContain("Brak dodatkowych cech w znormalizowanych danych.");
  });
});
