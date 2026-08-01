export interface ListingSummary {
  readonly id: string;
}

export interface ListingDetail {
  readonly id: string;
}

export interface ListingIndexResult {
  readonly total: number;
  readonly items: ListingSummary[];
  readonly message: string;
}
