import Link from "next/link";
import type { ReactElement } from "react";

import {
  formatArea,
  formatCurrency,
  formatFloor,
  formatLocation,
  formatPriceMeta,
  formatRooms,
  formatTransactionType,
} from "@/modules/listings/formatters";
import type { PublicListingListItem } from "@/modules/listings/types";

interface ListingCardProps {
  readonly listing: PublicListingListItem;
}

export function ListingCard({ listing }: ListingCardProps): ReactElement {
  const rooms = formatRooms(listing.rooms);
  const floor = formatFloor(listing.floor);
  const meta = formatPriceMeta(listing);

  return (
    <article className="listing-card">
      <div className="listing-card__media">
        {listing.photo === null ? (
          <div className="listing-card__placeholder">Brak zdjęcia</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={listing.title} className="listing-card__image" src={listing.photo.url} />
        )}
        <span className={`listing-badge listing-badge--${listing.transactionType.toLowerCase()}`}>
          {formatTransactionType(listing.transactionType)}
        </span>
      </div>
      <div className="listing-card__content">
        <div className="listing-card__headline">
          <h3>
            <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
          </h3>
          <p className="listing-card__price">{formatCurrency(listing.priceAmount)}</p>
        </div>
        <p className="listing-card__meta">{formatLocation(listing)}</p>
        <ul className="listing-card__facts" aria-label="Najważniejsze informacje o ofercie">
          <li>{formatArea(listing.areaM2)}</li>
          {rooms !== null ? <li>{rooms}</li> : null}
          {floor !== null ? <li>{floor}</li> : null}
        </ul>
        {meta !== null ? <p className="listing-card__submeta">{meta}</p> : null}
        <div className="listing-card__footer">
          <Link className="button-link button-link--secondary" href={`/listings/${listing.id}`}>
            Zobacz szczegóły
          </Link>
        </div>
      </div>
    </article>
  );
}
