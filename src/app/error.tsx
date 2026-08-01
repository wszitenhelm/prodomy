"use client";

export default function GlobalError(): React.JSX.Element {
  return (
    <html lang="pl">
      <body className="shell">
        <section className="panel empty-state">
          <h1>Wystąpił błąd</h1>
          <p>Nie udało się poprawnie wyświetlić tej części aplikacji. Odśwież stronę i spróbuj ponownie.</p>
        </section>
      </body>
    </html>
  );
}
