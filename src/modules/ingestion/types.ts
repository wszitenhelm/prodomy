export interface IngestionRunInput {
  readonly source: string;
  readonly cities: string[];
  readonly targetSale: number;
  readonly targetRent: number;
  readonly maxCandidates: number;
  readonly maxResultPages: number;
  readonly seed: string;
}

export interface IngestionRunSummary {
  readonly source: string;
  readonly cities: string[];
  readonly status: "NOT_IMPLEMENTED";
}
