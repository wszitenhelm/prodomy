import * as React from "react";

interface ListingMapProps {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly title: string;
}

function formatCoordinate(value: number): string {
  return value.toFixed(7);
}

export function ListingMap({
  latitude,
  longitude,
  title,
}: ListingMapProps): React.JSX.Element | null {
  if (latitude === null || longitude === null) {
    return null;
  }

  const latitudeDelta = 0.012;
  const longitudeDelta = 0.02;
  const bbox = [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ]
    .map(formatCoordinate)
    .join(",");
  const embedUrl = new URL("https://www.openstreetmap.org/export/embed.html");
  embedUrl.searchParams.set("bbox", bbox);
  embedUrl.searchParams.set("layer", "mapnik");
  embedUrl.searchParams.set(
    "marker",
    `${formatCoordinate(latitude)},${formatCoordinate(longitude)}`,
  );

  const fullMapUrl = new URL("https://www.openstreetmap.org/");
  fullMapUrl.searchParams.set("mlat", formatCoordinate(latitude));
  fullMapUrl.searchParams.set("mlon", formatCoordinate(longitude));
  fullMapUrl.hash = `map=15/${formatCoordinate(latitude)}/${formatCoordinate(longitude)}`;

  return (
    <section className="panel listing-map">
      <div className="listing-map__header">
        <div>
          <p className="eyebrow">Lokalizacja</p>
          <h2>Oferta na mapie</h2>
        </div>
        <a
          className="button-link button-link--secondary"
          href={fullMapUrl.toString()}
          rel="noreferrer"
          target="_blank"
        >
          Otwórz większą mapę
        </a>
      </div>
      <iframe
        className="listing-map__frame"
        loading="lazy"
        referrerPolicy="no-referrer"
        src={embedUrl.toString()}
        title={`Mapa lokalizacji: ${title}`}
      />
      <p className="listing-map__notice">
        Lokalizacja pochodzi z ogłoszenia źródłowego i może być podana orientacyjnie.
      </p>
    </section>
  );
}
