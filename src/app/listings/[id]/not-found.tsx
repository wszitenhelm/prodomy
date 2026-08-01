import Link from "next/link";

export default function ListingNotFound(): React.JSX.Element {
  return (
    <main className="shell">
      <section className="panel empty-state">
        <h1>Listing not found</h1>
        <p>Ta oferta nie jest publicznie dostępna albo została usunięta z aktywnych wyników.</p>
        <Link className="button-link button-link--secondary" href="/listings">
          Wróć do listy ofert
        </Link>
      </section>
    </main>
  );
}
