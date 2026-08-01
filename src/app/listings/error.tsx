"use client";

export default function ListingsError(): React.JSX.Element {
  return (
    <main className="shell">
      <section className="panel empty-state">
        <h1>Nie udało się załadować ofert</h1>
        <p>Spróbuj odświeżyć stronę lub wrócić do wyników za chwilę.</p>
      </section>
    </main>
  );
}
