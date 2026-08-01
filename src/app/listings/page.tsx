import Link from "next/link";
import { ZodError } from "zod";

import { ListingCard } from "@/modules/listings/components/listing-card";
import { ListingFilters } from "@/modules/listings/components/listing-filters";
import { ListingPagination } from "@/modules/listings/components/listing-pagination";
import { searchParamsToInput } from "@/modules/listings/queries";
import { getListingIndex } from "@/modules/listings/service";

interface ListingsPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: ListingsPageProps): Promise<React.JSX.Element> {
  try {
    const filters = searchParamsToInput(await searchParams);
    const result = await getListingIndex(filters);

    return (
      <main className="shell shell--wide">
        <section className="listings-layout">
          <aside>
            <ListingFilters filters={filters} />
          </aside>
          <section className="stack">
            <header className="panel results-header">
              <div>
                <p className="eyebrow">Oferty mieszkań</p>
                <h1>Przeglądaj aktywne ogłoszenia</h1>
                <p className="muted">
                  {result.pagination.total} wyników, strona {result.pagination.page} z{" "}
                  {Math.max(result.pagination.totalPages, 1)}
                </p>
              </div>
            </header>

            {result.items.length === 0 ? (
              <section className="panel empty-state">
                <h2>Brak wyników</h2>
                <p>Spróbuj zmienić filtry albo wyczyścić wyszukiwanie, aby zobaczyć więcej ofert.</p>
                <Link className="button-link button-link--secondary" href="/listings">
                  Wyczyść filtry
                </Link>
              </section>
            ) : (
              <section className="listings-grid" aria-label="Wyniki wyszukiwania">
                {result.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </section>
            )}

            <ListingPagination filters={filters} pagination={result.pagination} />
          </section>
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return (
        <main className="shell">
          <section className="panel empty-state">
            <h1>Nieprawidłowe filtry</h1>
            <p>Adres zawiera niepoprawne parametry wyszukiwania. Wyczyść filtry i spróbuj ponownie.</p>
            <Link className="button-link button-link--secondary" href="/listings">
              Wróć do ofert
            </Link>
          </section>
        </main>
      );
    }

    throw error;
  }
}
