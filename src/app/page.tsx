import Link from "next/link";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="shell">
      <section className="hero">
        <p>Repository foundation stage</p>
        <h1>Smart Real Estate Listings Platform</h1>
        <p>
          This initial stage sets up the Next.js application, validated runtime
          configuration, Prisma foundation and module boundaries for listings and
          ingestion.
        </p>
        <div className="hero__actions">
          <Link className="button-link button-link--primary" href="/listings">
            Open listings placeholder
          </Link>
          <Link className="button-link button-link--secondary" href="/api/health">
            Health check
          </Link>
        </div>
      </section>
    </main>
  );
}
