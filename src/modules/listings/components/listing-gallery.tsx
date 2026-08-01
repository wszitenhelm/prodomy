import type { ReactElement } from "react";

import type { ListingPhoto } from "@/modules/listings/types";

interface ListingGalleryProps {
  readonly photos: ListingPhoto[];
  readonly title: string;
}

export function ListingGallery({ photos, title }: ListingGalleryProps): ReactElement {
  if (photos.length === 0) {
    return (
      <section className="panel">
        <h2>Galeria</h2>
        <div className="gallery gallery--empty">Brak zdjęć dla tej oferty.</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Galeria</h2>
      <div className="gallery">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${title} - zdjęcie ${photo.position + 1}`}
            className="gallery__image"
            key={`${photo.url}-${photo.position}`}
            src={photo.url}
          />
        ))}
      </div>
    </section>
  );
}
