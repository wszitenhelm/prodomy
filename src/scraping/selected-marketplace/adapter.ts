export const selectedMarketplaceAdapter = {
  source: "selected-marketplace",
  async describe(): Promise<{
    readonly source: string;
    readonly status: "NOT_IMPLEMENTED";
  }> {
    return {
      source: "selected-marketplace",
      status: "NOT_IMPLEMENTED",
    };
  },
};
