import { getListingIndex } from "@/modules/listings/service";

export const dynamic = "force-dynamic";

export default async function ListingsPage(): Promise<React.JSX.Element> {
  const result = await getListingIndex();

  return (
    <main className="shell">
      <section className="stack">
        <header className="panel">
          <p>Listings</p>
          <h1>Listings placeholder</h1>
          <p>
            Search, filtering and details pages will be implemented in later stages.
          </p>
        </header>
        <section className="panel">
          <h2>Repository boundary check</h2>
          <p>{result.message}</p>
          <p>Current listing count: {result.total}</p>
        </section>
      </section>
    </main>
  );
}
